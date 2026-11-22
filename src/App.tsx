import { useCallback, useEffect, useMemo, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileCheck2,
  MapPin,
  PhoneCall,
  Route,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { EnquiryForm } from './components/EnquiryForm.tsx';
import { Navbar, type ActivePage } from './components/Navbar.tsx';
import { PropertyCard } from './components/PropertyCard.tsx';
import { PropertyDetailsView } from './components/PropertyDetailsView.tsx';
import type { Property } from './types.ts';

const MAPS_SHARE_URL = 'https://maps.app.goo.gl/JdTFEcW1iPCc7QFp8?g_st=aw';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [enquiryPropertyId, setEnquiryPropertyId] = useState<number | null>(null);

  // Search & Filter state
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Plot' | 'Villa'>('All');

  // Google Maps Key & Quota Banner state
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || ''
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const loadProperties = useCallback(async () => {
    setLoadingProps(true);
    try {
      const res = await fetch('/api/properties');
      if (res.ok) {
        const data = (await res.json()) as { properties: Property[] };
        setProperties(data.properties ?? []);
        if (data.properties?.length && selectedPropertyId === null) {
          setSelectedPropertyId(data.properties[0].id);
        }
      }
    } finally {
      setLoadingProps(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    loadProperties();
    if (!mapsApiKey) {
      fetch('/api/config')
        .then((r) => r.json())
        .then((data: { mapsApiKey?: string }) => {
          if (data.mapsApiKey) setMapsApiKey(data.mapsApiKey);
        })
        .catch(() => {
          // fallback handled cleanly
        });
    }
  }, [loadProperties, mapsApiKey]);

  const filteredProperties = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return properties.filter((p) => {
      const matchesType = typeFilter === 'All' || p.type === typeFilter;
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.surveyNo.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [properties, searchText, typeFilter]);

  const activeProperty = useMemo(
    () =>
      properties.find((p) => p.id === selectedPropertyId) ?? properties[0] ?? null,
    [properties, selectedPropertyId]
  );

  const handleOpenProperty = (property: Property) => {
    setSelectedPropertyId(property.id);
    setActivePage('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnquireProperty = (property: Property) => {
    setEnquiryPropertyId(property.id);
    setActivePage('enquiry');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePage('properties');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigate = (page: ActivePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const content = (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Tier 1/2 Google Maps Quota Notice (only fires on quota exceeded) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Navbar activePage={activePage} onNavigate={navigate} />

      <main className="flex-1">
        {activePage === 'home' && (
          <div className="space-y-16 pb-16">
            {/* Premium Property Banner (Hero) */}
            <section className="bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                  <div className="lg:col-span-6 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-emerald-800 tracking-wide">
                        Aambal Marketing Properties · Madurai West &amp; Athalai
                      </p>

                      <h1
                        className="font-display font-extrabold text-slate-900 tracking-tight leading-[1.1] text-balance"
                        style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
                      >
                        DTCP Approved House Plots &amp; Villas in Madurai
                      </h1>

                      <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                        Invest, build, and live better with clear-title residential layouts featuring 29&apos;6&quot; &amp; 23&apos;9&quot; wide blacktop roads, immediate EB provision, and direct highway access.
                      </p>

                      {/* Tamil + English Pricing Callout */}
                      <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-display text-lg sm:text-xl font-bold text-blue-950">
                            1 சதுரடி விலை ரூ. 700/- முதல்
                          </p>
                          <p className="text-xs font-medium text-blue-900 mt-0.5">
                            Yoga Ganapathi Nagar · DTCP Approved 10/2024 Layout · 49 House Sites
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeProperty && handleOpenProperty(activeProperty)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 whitespace-nowrap shrink-0"
                        >
                          <span>View Layout Plan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Primary & Contact Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('properties')}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Explore All Properties</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('enquiry')}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] text-sm font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                      >
                        <PhoneCall className="w-4 h-4 text-blue-900" />
                        <span>Contact &amp; Book Visit</span>
                      </button>
                    </div>
                  </div>

                  {/* Hero Visual */}
                  <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-200 min-h-[320px] lg:min-h-[420px]">
                    <img
                      src="/src/assets/images/hero_aambal_banner_1795315019818.jpg"
                      alt="Aambal Marketing DTCP approved residential layout in Madurai with paved blacktop roads"
                      referrerPolicy="no-referrer"
                      className="w-full h-full lg:h-full object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent"
                    />
                    <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                      <div>
                        <p className="text-xs font-medium text-emerald-300">
                          Featured Launch · Athalai Village, Madurai West
                        </p>
                        <p className="font-display text-xl font-bold mt-0.5">
                          Yoga Ganapathi Nagar
                        </p>
                      </div>
                      <a
                        href={MAPS_SHARE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/95 text-slate-900 rounded-lg hover:bg-white whitespace-nowrap shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-900" />
                        <span>Google Maps Pin</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Search Properties Bar (full-width strip below hero split) */}
                <form
                  onSubmit={handleHeroSearch}
                  className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-6 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search project, village, survey no. (e.g. Athalai, Yoga Ganapathi, Nagamalai)..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>

                  <div className="md:col-span-4 flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                    {(['All', 'Plot', 'Villa'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeFilter(t)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                          typeFilter === t
                            ? 'bg-blue-900 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t === 'All' ? 'All Types' : t === 'Plot' ? 'DTCP Plots' : 'Villas'}
                      </button>
                    ))}
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 min-h-[42px] text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap"
                    >
                      Search Plots
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* Featured Properties Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Verified Madurai Inventory
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                    Featured Properties
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('properties')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900 hover:underline self-start sm:self-auto"
                >
                  <span>View all properties</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {loadingProps ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-96 bg-white border border-slate-200 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onSelectProperty={handleOpenProperty}
                      onEnquireProperty={handleEnquireProperty}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Yoga Ganapathi Nagar DTCP Blueprint & Facilities Spotlight */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <img
                      src="/assets/aistudio/image_e7c687cf.png"
                      alt="Yoga Ganapathi Nagar DTCP Approved 10/2024 Layout Plan"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      DTCP Approved 10/2024 Layout · S.No. 88/2B1A, 79/9, 10A2, 11A, 11B, 80/5A1
                    </p>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Yoga Ganapathi Nagar — Athalai Village, Madurai West
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Explore exact plot measurements across all 49 house sites (1.86 cents to 7.09 cents) with wide 29&apos;6&quot; and 23&apos;9&quot; roads, EB facility, and live nearby schools &amp; hospitals mapping.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <Route className="w-4 h-4 text-blue-900 shrink-0 mt-1" />
                      <span>29&apos;6&quot; Main Road &amp; 23&apos;9&quot; Internal Blacktop Roads</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                      <span>DTCP Approved (10/2024) with Clear Patta</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Compass className="w-4 h-4 text-blue-900 shrink-0 mt-1" />
                      <span>Dedicated EB Line Provision &amp; Corner Plots</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                      <span>1 சதுரடி விலை ரூ. 700/- முதல்</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => activeProperty && handleOpenProperty(activeProperty)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      <span>Inspect 49 Plots &amp; Live Map</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href={MAPS_SHARE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <span>Open Google Maps</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Home Enquiry Band */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-3">
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Book A Free Site Visit
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Speak Directly With Our Madurai Property Team
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Share your preferred plot size or villa budget. Every enquiry is logged directly into our Aambal Marketing Leads Console so an advisor responds promptly.
                  </p>
                  <div className="pt-2 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>100% Verified Legal Title &amp; EC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-900" />
                      <span>Complimentary Site Visit Transport from Madurai</span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-7">
                  <EnquiryForm properties={properties} />
                </div>
              </div>
            </section>
          </div>
        )}

        {activePage === 'properties' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Property Catalog
                </p>
                <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  All Madurai Plots &amp; Villas
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Filter by location or name..."
                    className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
                  {(['All', 'Plot', 'Villa'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        typeFilter === t
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredProperties.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                <p className="font-display font-semibold text-slate-900">
                  No properties match &ldquo;{searchText}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchText('');
                    setTypeFilter('All');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onSelectProperty={handleOpenProperty}
                    onEnquireProperty={handleEnquireProperty}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activePage === 'details' && activeProperty && (
          <PropertyDetailsView
            property={activeProperty}
            allProperties={properties}
            mapsReady={Boolean(mapsApiKey)}
            onBack={() => navigate('properties')}
          />
        )}

        {activePage === 'about' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-slate-100">
                <img
                  src="/assets/aistudio/Aambal_Properties_Real_Estate_Logo_0b89692a.png"
                  alt="Aambal Marketing Properties logo"
                  referrerPolicy="no-referrer"
                  className="h-24 w-auto object-contain self-start"
                />
                <div>
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Invest · Build · Live Better
                  </p>
                  <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mt-1">
                    About Aambal Marketing Properties
                  </h1>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Dedicated to transparent, DTCP-approved residential land and villa developments across Madurai West, Athalai, Nagamalai Pudukkottai, and Samayanallur.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    01. Verified DTCP Layouts
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Every layout—including Yoga Ganapathi Nagar (DTCP Approved 10/2024)—carries clear survey numbers, patta verification, and open-space compliance.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    02. Infrastructure First
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Wide 29&apos;6&quot; and 23&apos;9&quot; paved blacktop roads, boundary demarcation stones, EB provision, and tree-lined avenues built before handover.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    03. Transparent Pricing
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Direct developer pricing starting from 1 சதுரடி விலை ரூ. 700/- முதல் with bank loan support and zero hidden brokerage charges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePage === 'enquiry' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-4">
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Customer Enquiry &amp; Site Visit
                </p>
                <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
                  Contact Aambal Marketing
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Select the property you are interested in and submit your details. Your enquiry is stored immediately for our sales desk to follow up with layout blueprints and legal documents.
                </p>
                <div className="pt-4 border-t border-slate-100 space-y-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">Featured Site Location</p>
                    <p>Yoga Ganapathi Nagar, Athalai Village, Madurai West Taluk</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Starting Rate</p>
                    <p className="text-emerald-800 font-semibold">
                      1 சதுரடி விலை ரூ. 700/- முதல்
                    </p>
                  </div>
                  <a
                    href={MAPS_SHARE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900 hover:underline"
                  >
                    <span>Open Location in Google Maps</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7">
                <EnquiryForm
                  properties={properties}
                  initialPropertyId={enquiryPropertyId ?? activeProperty?.id ?? null}
                />
              </div>
            </div>
          </div>
        )}

        {activePage === 'admin' && (
          <AdminDashboard
            properties={properties}
            onPropertiesUpdated={loadProperties}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Aambal_Properties_Real_Estate_Logo_0b89692a.png"
              alt="Aambal Marketing Properties"
              referrerPolicy="no-referrer"
              className="h-10 w-auto object-contain"
            />
            <div>
              <p className="font-display font-bold text-slate-900 text-sm">
                Aambal Marketing Properties
              </p>
              <p className="text-xs text-slate-500">
                Invest · Build · Live Better · Madurai West, Tamil Nadu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600">
            <button type="button" onClick={() => navigate('home')} className="hover:text-slate-900">
              Home
            </button>
            <button type="button" onClick={() => navigate('properties')} className="hover:text-slate-900">
              Properties
            </button>
            <button type="button" onClick={() => navigate('details')} className="hover:text-slate-900">
              Yoga Ganapathi Nagar
            </button>
            <button type="button" onClick={() => navigate('enquiry')} className="hover:text-slate-900">
              Enquiry
            </button>
            <button type="button" onClick={() => navigate('admin')} className="hover:text-slate-900">
              Admin Leads
            </button>
            <a
              href={MAPS_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-900 hover:underline inline-flex items-center gap-1"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );

  if (mapsApiKey) {
    return (
      <APIProvider
        apiKey={mapsApiKey}
        libraries={['places', 'marker', 'geometry', 'core']}
        language="en"
        region="IN"
      >
        {content}
      </APIProvider>
    );
  }

  return content;
}
