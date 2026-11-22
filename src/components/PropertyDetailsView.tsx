import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Compass,
  Expand,
  ExternalLink,
  FileCheck2,
  MapPin,
  Route,
  X,
} from 'lucide-react';
import { YOGA_GANAPATHI_PLOTS } from '../data/yogaGanapathiPlots.ts';
import type { Property } from '../types.ts';
import { EnquiryForm } from './EnquiryForm.tsx';
import { PropertyMapSection } from './PropertyMapSection.tsx';

interface PropertyDetailsViewProps {
  property: Property;
  allProperties: Property[];
  mapsReady: boolean;
  onBack: () => void;
}

export function PropertyDetailsView({
  property,
  allProperties,
  mapsReady,
  onBack,
}: PropertyDetailsViewProps) {
  const galleryItems = useMemo(() => {
    const items: { url: string; label: string }[] = property.images.map((url, idx) => ({
      url,
      label: idx === 0 ? `${property.title} — Site View` : `${property.title} — Aerial & Road Access`,
    }));
    if (property.layoutPlanImage) {
      items.push({
        url: property.layoutPlanImage,
        label: 'DTCP Approved Layout Plan (10/2024)',
      });
    }
    return items;
  }, [property]);

  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [plotFilter, setPlotFilter] = useState<'all' | 'available' | 'corner'>('all');
  const [selectedPlotNo, setSelectedPlotNo] = useState<string>('');
  const [calcSqft, setCalcSqft] = useState<number>(property.minAreaSqft || 1000);

  const enquiryRef = useRef<HTMLDivElement>(null);

  const isYogaGanapathi = property.slug.includes('yoga-ganapathi');

  const filteredPlots = useMemo(() => {
    return YOGA_GANAPATHI_PLOTS.filter((plot) => {
      if (plotFilter === 'available') return plot.status === 'Available';
      if (plotFilter === 'corner') return plot.facingRoad.includes('Corner');
      return true;
    });
  }, [plotFilter]);

  const activeMedia = galleryItems[activeMediaIdx] ?? galleryItems[0];

  const handleEnquirePlot = (plotNo: number, totalSqft: number) => {
    setSelectedPlotNo(`Plot ${plotNo} (${totalSqft} sq.ft)`);
    setCalcSqft(totalSqft);
    enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToEnquiry = () => {
    enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const estimatedTotal = Math.max(0, calcSqft) * property.pricePerSqft;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-12">
      {/* Breadcrumb & Back */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Properties</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{property.approvalLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{property.surveyNo}</span>
        </div>
      </div>

      {/* Top Split: Full Images Gallery + Summary & Price Card */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-[16/10] w-full bg-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {activeMedia && (
              <img
                src={activeMedia.url}
                alt={activeMedia.label}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-slate-900/5"
              />
            )}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-slate-950/80 text-white text-xs font-medium backdrop-blur-sm">
                {activeMedia?.label}
              </span>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-semibold shadow-sm hover:bg-white"
              >
                <Expand className="w-3.5 h-3.5" />
                <span>Full View</span>
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {galleryItems.map((item, index) => (
              <button
                key={item.url + index}
                type="button"
                onClick={() => setActiveMediaIdx(index)}
                className={`relative aspect-[4/3] rounded-lg overflow-hidden border text-left transition-all ${
                  index === activeMediaIdx
                    ? 'border-blue-900 ring-2 ring-blue-900/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 text-white text-[11px] px-2 py-1 truncate">
                  {index === galleryItems.length - 1 && property.layoutPlanImage
                    ? 'DTCP Layout Plan'
                    : `Photo ${index + 1}`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Price Details + Quick Stats + Primary Enquiry CTA */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-blue-900">{property.type}</span>
              <span aria-hidden="true">·</span>
              <span>{property.district}</span>
              <span aria-hidden="true">·</span>
              <span>{property.approvalLabel}</span>
            </div>

            <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight text-balance">
              {property.title}
            </h1>

            <p className="inline-flex items-start gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
              <span>{property.location} ({property.surveyNo})</span>
            </p>

            {/* Price Details Block */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                Price Details
              </p>
              <p className="font-display text-xl sm:text-2xl font-bold text-emerald-950">
                {property.priceTamil}
              </p>
              <p className="text-sm font-medium text-emerald-800 tabular-nums">
                {property.priceDisplay} · Clear Patta &amp; DTCP Approved
              </p>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {property.description}
            </p>

            {/* 4-metric tabular summary */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Total Units / Plots</p>
                <p className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {property.totalUnits}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Available Now</p>
                <p className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {property.availableUnits} Open
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Area Range</p>
                <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {property.minAreaSqft.toLocaleString()} – {property.maxAreaSqft.toLocaleString()} sq.ft
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Road Width</p>
                <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {isYogaGanapathi ? '29\'6" & 23\'9"' : '30\' – 40\' Wide'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={scrollToEnquiry}
              className="w-full py-3 px-5 min-h-[46px] text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Enquire Now &amp; Book Site Visit
            </button>
            <a
              href={property.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 min-h-[42px] text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <span>View Site Location in Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Road Access & Property Facilities */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Route className="w-5 h-5 text-blue-900" />
            <h2 className="font-display text-xl font-bold text-slate-900">
              Road Access &amp; Connectivity
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {property.roadAccess.map((item) => (
              <li key={item} className="py-3 flex items-start gap-3 text-sm text-slate-700">
                <Compass className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            <h2 className="font-display text-xl font-bold text-slate-900">
              Property Facilities &amp; Approvals
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {property.facilities.map((facility) => (
              <li key={facility} className="py-3 flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{facility}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Interactive Price Calculator & Yoga Ganapathi Nagar 49-Plot DTCP Table */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              {isYogaGanapathi
                ? 'Yoga Ganapathi Nagar — 49 DTCP Plot Area & Price Schedule'
                : 'Plot & Built-Up Area Price Estimator'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {property.priceTamil} ({property.priceDisplay}). Select any plot below to calculate total value and pre-fill your enquiry.
            </p>
          </div>

          {/* Instant Sq.Ft Calculator */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <label htmlFor="calc-sqft" className="text-xs font-semibold text-slate-600">
              Area (Sq.Ft):
            </label>
            <input
              id="calc-sqft"
              type="number"
              min={400}
              max={10000}
              value={calcSqft}
              onChange={(e) => setCalcSqft(Number(e.target.value) || 0)}
              className="w-24 px-2.5 py-1 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
            <span className="text-xs text-slate-500">× ₹{property.pricePerSqft} =</span>
            <span className="font-mono text-base font-bold text-blue-900 tabular-nums">
              ₹{estimatedTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {isYogaGanapathi && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'all', label: 'All 49 Plots' },
                    { id: 'available', label: 'Available Only' },
                    { id: 'corner', label: 'Corner / Junction Plots' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPlotFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      plotFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500 tabular-nums">
                Showing {filteredPlots.length} plots from DTCP 10/2024 Layout Plan
              </span>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Plot No.</th>
                    <th className="py-2.5 px-3 text-right">Plot Area (sq.ft)</th>
                    <th className="py-2.5 px-3 text-right">Road Area (sq.ft)</th>
                    <th className="py-2.5 px-3 text-right">Total Area (sq.ft)</th>
                    <th className="py-2.5 px-3">Cent / Sq.Ft</th>
                    <th className="py-2.5 px-3">Road Facing</th>
                    <th className="py-2.5 px-3 text-right">Est. Base Value</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredPlots.map((plot) => {
                    const estValue = plot.totalAreaSqft * property.pricePerSqft;
                    return (
                      <tr key={plot.plotNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                          #{plot.plotNo}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          {plot.plotAreaSqft.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                          {plot.roadAreaSqft.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {plot.totalAreaSqft.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs tabular-nums text-slate-700">
                          {plot.cent} Cent {String(plot.sqftRemainder).padStart(3, '0')} sq.ft
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-600">
                          {plot.facingRoad}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-blue-900">
                          ₹{estValue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-xs font-semibold">
                          <span
                            className={
                              plot.status === 'Available'
                                ? 'text-emerald-700'
                                : plot.status === 'Reserved'
                                  ? 'text-amber-700'
                                  : 'text-slate-400'
                            }
                          >
                            {plot.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            disabled={plot.status === 'Sold'}
                            onClick={() => handleEnquirePlot(plot.plotNo, plot.totalAreaSqft)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {plot.status === 'Sold' ? 'Sold' : 'Enquire'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Google Maps Location + Live Nearby Schools & Hospitals */}
      <section>
        {mapsReady ? (
          <PropertyMapSection property={property} />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Google Maps Site Location
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {property.location} ({property.lat.toFixed(5)}, {property.lng.toFixed(5)})
              </p>
            </div>
            <a
              href={property.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              <span>Open Location in Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </section>

      {/* Embedded Customer Enquiry Section */}
      <section
        ref={enquiryRef}
        id="property-enquiry-form"
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
              Direct Property Enquiry
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Interested in {property.title}?
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Submit your contact details to receive the DTCP approval copy, legal opinion documents, exact plot availability, and arrange a complimentary site visit from Madurai.
            </p>
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Aambal Marketing Properties</p>
              <p>Athalai &amp; Madurai West Regional Desk</p>
              <p className="font-mono text-xs text-slate-500">
                {property.priceTamil} · {property.priceDisplay}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <EnquiryForm
              properties={allProperties}
              initialPropertyId={property.id}
              initialPlotNumber={selectedPlotNo}
            />
          </div>
        </div>
      </section>

      {/* Fullscreen Lightbox for Layout Plan & Photos */}
      {lightboxOpen && activeMedia && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeMedia.label}
          className="fixed inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-4"
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white mb-3">
            <span className="text-sm font-semibold">{activeMedia.label}</span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full max-w-5xl max-h-[82vh] overflow-auto bg-white rounded-xl p-2">
            <img
              src={activeMedia.url}
              alt={activeMedia.label}
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
