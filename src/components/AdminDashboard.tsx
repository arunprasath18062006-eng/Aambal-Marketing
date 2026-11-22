import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Building2,
  Download,
  Loader2,
  Lock,
  LogOut,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import type { Lead, LeadStatus, Property, PropertyType } from '../types.ts';

interface AdminDashboardProps {
  properties: Property[];
  onPropertiesUpdated: () => void;
}

const LEAD_STATUSES: LeadStatus[] = [
  'New Lead',
  'Contacted',
  'Site Visit',
  'Negotiation',
  'Closed',
];

function sanitizeCsvCell(val: string | number | null | undefined): string {
  const str = String(val ?? '');
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function AdminDashboard({
  properties,
  onPropertiesUpdated,
}: AdminDashboardProps) {
  const [authStatus, setAuthStatus] = useState<{
    loading: boolean;
    configured: boolean;
    mode: 'env' | 'claimed' | 'unclaimed';
  }>({ loading: true, configured: false, mode: 'unclaimed' });

  // Held strictly in React memory (never persisted to localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<'leads' | 'properties'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | LeadStatus>('All');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Add property modal/drawer state
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<PropertyType>('Plot');
  const [newLocation, setNewLocation] = useState('');
  const [newSurvey, setNewSurvey] = useState('');
  const [newPriceSqft, setNewPriceSqft] = useState('700');
  const [newTotalUnits, setNewTotalUnits] = useState('30');
  const [newDescription, setNewDescription] = useState('');
  const [propSaving, setPropSaving] = useState(false);
  const [propMessage, setPropMessage] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth-status')
      .then((r) => r.json())
      .then((data: { configured: boolean; mode: 'env' | 'claimed' | 'unclaimed' }) => {
        setAuthStatus({
          loading: false,
          configured: Boolean(data.configured),
          mode: data.mode || 'unclaimed',
        });
      })
      .catch(() => {
        setAuthStatus({ loading: false, configured: true, mode: 'env' });
      });
  }, []);

  const fetchLeads = useCallback(async () => {
    if (!adminToken) return;
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const res = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status === 401) {
        setAdminToken(null);
        setAuthError('Session expired. Please sign in again.');
        return;
      }
      const data = (await res.json()) as { leads?: Lead[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to load leads.');
      setLeads(data.leads ?? []);
    } catch (err) {
      setLeadsError(err instanceof Error ? err.message : 'Unable to fetch leads.');
    } finally {
      setLeadsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      fetchLeads();
    }
  }, [adminToken, fetchLeads]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const endpoint = authStatus.configured ? '/api/admin/login' : '/api/admin/bootstrap';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput }),
      });
      const data = (await res.json()) as { token?: string; mode?: 'env' | 'claimed'; error?: string };
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Authentication failed.');
      }
      setAdminToken(data.token);
      setPasscodeInput('');
      setAuthStatus((prev) => ({ ...prev, configured: true, mode: data.mode ?? prev.mode }));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleStatusChange = async (leadId: number, nextStatus: LeadStatus) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { lead: Lead };
      setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
    } catch {
      // ignore transient error
    }
  };

  const handleSaveNote = async (leadId: number) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ adminNotes: noteDraft }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { lead: Lead };
      setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
      setEditingNoteId(null);
    } catch {
      // ignore
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) return;
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setConfirmDeleteId(null);
    } catch {
      // ignore
    }
  };

  const handleAddProperty = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setPropSaving(true);
    setPropMessage(null);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          location: newLocation,
          surveyNo: newSurvey || 'DTCP Approved',
          pricePerSqft: Number(newPriceSqft) || 700,
          totalUnits: Number(newTotalUnits) || 30,
          availableUnits: Number(newTotalUnits) || 30,
          description: newDescription,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not add property.');
      setNewTitle('');
      setNewLocation('');
      setNewSurvey('');
      setNewDescription('');
      setShowAddProperty(false);
      setPropMessage('New property added to catalog.');
      onPropertiesUpdated();
    } catch (err) {
      setPropMessage(err instanceof Error ? err.message : 'Failed to create property.');
    } finally {
      setPropSaving(false);
    }
  };

  const handleUpdateUnits = async (prop: Property, delta: number) => {
    if (!adminToken) return;
    const nextUnits = Math.max(0, Math.min(prop.totalUnits, prop.availableUnits + delta));
    const res = await fetch(`/api/properties/${prop.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ availableUnits: nextUnits }),
    });
    if (res.ok) {
      onPropertiesUpdated();
    }
  };

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((l) => {
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      const matchesQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.mobile.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        (l.propertyTitle?.toLowerCase().includes(q) ?? false);
      return matchesStatus && matchesQuery;
    });
  }, [leads, searchQuery, statusFilter]);

  const exportLeadsCsv = () => {
    const headers = [
      'Lead ID',
      'Name',
      'Mobile',
      'Interested In',
      'Property',
      'Plot No',
      'Location',
      'Status',
      'Message',
      'Admin Notes',
      'Received At',
    ];
    const rows = filteredLeads.map((l) =>
      [
        l.id,
        l.name,
        l.mobile,
        l.interestedIn,
        l.propertyTitle || '',
        l.plotNumber || '',
        l.location,
        l.status,
        l.message,
        l.adminNotes,
        l.createdAt,
      ]
        .map(sanitizeCsvCell)
        .join(',')
    );
    const csv = [headers.map(sanitizeCsvCell).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aambal-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (!adminToken || downloadingZip) return;
    setDownloadingZip(true);
    setLeadsError(null);
    try {
      const res = await fetch('/api/admin/download-zip', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        throw new Error('Could not generate website ZIP file.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'aambal-marketing-website.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setLeadsError(err instanceof Error ? err.message : 'ZIP download failed.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const metrics = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === 'New Lead').length;
    const siteVisits = leads.filter((l) => l.status === 'Site Visit').length;
    const closed = leads.filter((l) => l.status === 'Closed').length;
    return { total, newLeads, siteVisits, closed };
  }, [leads]);

  if (authStatus.loading) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-900" />
        <p className="text-sm">Checking Admin Dashboard status...</p>
      </div>
    );
  }

  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-900">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                {authStatus.configured
                  ? 'Aambal Admin Dashboard'
                  : 'Set Up Admin Passcode'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {authStatus.configured
                  ? 'Sign in to view customer leads and manage properties.'
                  : 'First-run setup: choose an admin passcode (6+ characters) to protect customer leads.'}
              </p>
            </div>
          </div>

          {authError && (
            <div
              role="alert"
              className="p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-passcode"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {authStatus.configured ? 'Admin Passcode' : 'Create Admin Passcode'}
              </label>
              <input
                id="admin-passcode"
                type="password"
                required
                minLength={6}
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter passcode (min 6 characters)"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 px-4 min-h-[44px] text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
            >
              {authSubmitting
                ? 'Verifying...'
                : authStatus.configured
                  ? 'Sign In to Admin Dashboard'
                  : 'Save Passcode & Open Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Admin Console / Customer Leads &amp; Inventory
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Aambal Marketing — Lead Management
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'leads'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Leads ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('properties')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'properties'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Properties ({properties.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {downloadingZip ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloadingZip ? 'Packaging ZIP...' : 'Download Full ZIP'}</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminToken(null)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Total Customer Leads</p>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {metrics.total}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">New Leads</p>
          <p className="font-mono text-2xl font-bold text-blue-900 tabular-nums mt-1">
            {metrics.newLeads}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Site Visits Scheduled</p>
          <p className="font-mono text-2xl font-bold text-amber-700 tabular-nums mt-1">
            {metrics.siteVisits}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Booked / Closed</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {metrics.closed}
          </p>
        </div>
      </div>

      {activeTab === 'leads' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, mobile, location..."
                  className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                />
              </div>

              <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg overflow-x-auto">
                {(['All', ...LEAD_STATUSES] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      statusFilter === status
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchLeads}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={exportLeadsCsv}
                disabled={filteredLeads.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {leadsError && (
            <div className="p-4 text-sm text-rose-800 bg-rose-50 border-b border-rose-200">
              {leadsError}
            </div>
          )}

          {leadsLoading ? (
            <div className="p-12 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-900" />
              <p className="text-sm">Loading customer leads from database...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="font-display font-semibold text-slate-900">
                No customer enquiries yet
              </p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                When visitors select a property and submit the enquiry form, their Name, Mobile, Interested In, Location, and Status appear here immediately.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Interested In</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes &amp; Message</th>
                    <th className="py-3 px-4 text-right">Received</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 align-top">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{lead.name}</p>
                        <p className="text-xs font-mono text-slate-400">#{lead.id}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <a
                          href={`tel:${lead.mobile}`}
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-blue-900 hover:underline tabular-nums"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{lead.mobile}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{lead.interestedIn}</p>
                        {(lead.propertyTitle || lead.plotNumber) && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {lead.propertyTitle}
                            {lead.plotNumber ? ` · ${lead.plotNumber}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{lead.location}</td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Status for ${lead.name}`}
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value as LeadStatus)
                          }
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-800 ${
                            lead.status === 'New Lead'
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : lead.status === 'Site Visit'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : lead.status === 'Closed'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  : 'bg-slate-50 text-slate-800 border-slate-200'
                          }`}
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {lead.message && (
                          <p className="text-xs text-slate-600 mb-1">{lead.message}</p>
                        )}
                        {editingNoteId === lead.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Follow-up note..."
                              className="px-2 py-1 text-xs border border-slate-300 rounded w-full"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveNote(lead.id)}
                              className="px-2 py-1 text-xs font-semibold text-white bg-blue-900 rounded"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(lead.id);
                              setNoteDraft(lead.adminNotes || '');
                            }}
                            className="text-xs text-blue-800 hover:underline text-left"
                          >
                            {lead.adminNotes ? `Note: ${lead.adminNotes}` : '+ Add follow-up note'}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {lead.createdAt.slice(0, 16)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {confirmDeleteId === lead.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="px-2 py-1 text-xs font-semibold text-white bg-rose-700 rounded"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Delete lead ${lead.name}`}
                            onClick={() => setConfirmDeleteId(lead.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 rounded-md hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Listed Properties &amp; Plot Availability
            </h2>
            <button
              type="button"
              onClick={() => setShowAddProperty((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddProperty ? 'Close Form' : 'Add New Property'}</span>
            </button>
          </div>

          {propMessage && (
            <div className="p-3 text-sm bg-blue-50 border border-blue-200 text-blue-900 rounded-lg">
              {propMessage}
            </div>
          )}

          {showAddProperty && (
            <form
              onSubmit={handleAddProperty}
              className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Meenakshi Avenue"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property Type *
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PropertyType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  <option value="Plot">Plot</option>
                  <option value="Villa">Villa</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Thirumangalam, Madurai"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Survey / Approval No.
                </label>
                <input
                  type="text"
                  value={newSurvey}
                  onChange={(e) => setNewSurvey(e.target.value)}
                  placeholder="e.g. DTCP 2025 / S.No. 45/2"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price / Sq.Ft (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={newPriceSqft}
                  onChange={(e) => setNewPriceSqft(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Plots / Units *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newTotalUnits}
                  onChange={(e) => setNewTotalUnits(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Road width, facilities, and nearby highlights..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={propSaving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800"
                >
                  {propSaving ? 'Saving...' : 'Save Property Listing'}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Rate / Sq.Ft</th>
                  <th className="py-3 px-4 text-right">Available Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {properties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
                      <span>{prop.title}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{prop.type}</td>
                    <td className="py-3 px-4 text-slate-600">{prop.location}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ₹{prop.pricePerSqft.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateUnits(prop, -1)}
                          className="w-7 h-7 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-mono"
                          aria-label={`Decrease available units for ${prop.title}`}
                        >
                          -
                        </button>
                        <span className="font-mono tabular-nums text-xs font-semibold min-w-[52px] text-center">
                          {prop.availableUnits} / {prop.totalUnits}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateUnits(prop, 1)}
                          className="w-7 h-7 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-mono"
                          aria-label={`Increase available units for ${prop.title}`}
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
