import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, PhoneCall, Send } from 'lucide-react';
import type { Property } from '../types.ts';

interface EnquiryFormProps {
  properties: Property[];
  initialPropertyId?: number | null;
  initialPlotNumber?: string;
  compact?: boolean;
  onSuccess?: () => void;
}

export function EnquiryForm({
  properties,
  initialPropertyId = null,
  initialPlotNumber = '',
  compact = false,
  onSuccess,
}: EnquiryFormProps) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [interestedIn, setInterestedIn] = useState('Plot');
  const [propertyId, setPropertyId] = useState<string>(
    initialPropertyId ? String(initialPropertyId) : properties[0] ? String(properties[0].id) : ''
  );
  const [plotNumber, setPlotNumber] = useState(initialPlotNumber);
  const [location, setLocation] = useState('Madurai');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedLeadId, setSubmittedLeadId] = useState<number | null>(null);

  useEffect(() => {
    if (initialPropertyId) {
      setPropertyId(String(initialPropertyId));
      const matched = properties.find((p) => p.id === initialPropertyId);
      if (matched) {
        setInterestedIn(matched.type);
      }
    }
  }, [initialPropertyId, properties]);

  useEffect(() => {
    if (initialPlotNumber) {
      setPlotNumber(initialPlotNumber);
    }
  }, [initialPlotNumber]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const digitsOnly = mobile.replace(/[\s\-()+]/g, '');

    if (trimmedName.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^\d{10,15}$/.test(digitsOnly)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          mobile: mobile.trim(),
          interestedIn,
          propertyId: propertyId ? Number(propertyId) : null,
          plotNumber: plotNumber.trim() || null,
          location: location.trim() || 'Madurai',
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string; lead?: { id: number } };
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit enquiry.');
      }
      setSubmittedLeadId(data.lead?.id ?? 1);
      setName('');
      setMobile('');
      setPlotNumber('');
      setMessage('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedLeadId !== null) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-slate-900">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Enquiry Received
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Thank you for contacting Aambal Marketing Properties. Your site visit &amp; pricing request has been recorded (Reference <span className="font-mono font-semibold">#{submittedLeadId}</span>). Our property advisor will call you shortly.
            </p>
            <button
              type="button"
              onClick={() => setSubmittedLeadId(null)}
              className="mt-2 inline-flex items-center px-4 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Submit Another Enquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg"
        >
          {error}
        </div>
      )}

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div>
          <label htmlFor="lead-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Customer Name *
          </label>
          <input
            id="lead-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Karthikeyan S"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          />
        </div>

        <div>
          <label htmlFor="lead-mobile" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Mobile Number *
          </label>
          <input
            id="lead-mobile"
            type="tel"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="e.g. 98421 00000"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          />
        </div>
      </div>

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div>
          <label htmlFor="lead-interest" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Interested In *
          </label>
          <select
            id="lead-interest"
            value={interestedIn}
            onChange={(e) => setInterestedIn(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          >
            <option value="Plot">Residential Plot (DTCP)</option>
            <option value="Villa">Independent Villa</option>
            <option value="Plot / Villa">Both Plot &amp; Villa</option>
            <option value="Commercial">Commercial / Investment Site</option>
          </select>
        </div>

        <div>
          <label htmlFor="lead-location" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Preferred Location *
          </label>
          <input
            id="lead-location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Madurai"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          />
        </div>
      </div>

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div>
          <label htmlFor="lead-property" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Project / Property
          </label>
          <select
            id="lead-property"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          >
            <option value="">Any Madurai Project</option>
            {properties.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.title} ({p.location})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="lead-plot" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Plot No. (Optional)
          </label>
          <input
            id="lead-plot"
            type="text"
            value={plotNumber}
            onChange={(e) => setPlotNumber(e.target.value)}
            placeholder="e.g. Plot 15 or Corner Plot"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          />
        </div>
      </div>

      <div>
        <label htmlFor="lead-message" className="block text-xs font-semibold text-slate-700 mb-1.5">
          Site Visit / Requirement Notes
        </label>
        <textarea
          id="lead-message"
          rows={compact ? 2 : 3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Preferred visit date, budget, or plot facing preference..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Enquiry...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Book Site Visit / Enquire</span>
            </>
          )}
        </button>

        <a
          href="tel:+919842100000"
          className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call Advisor</span>
        </a>
      </div>
    </form>
  );
}
