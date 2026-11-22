import { useState } from 'react';
import { ArrowRight, Building2, MapPin } from 'lucide-react';
import type { Property } from '../types.ts';

interface PropertyCardProps {
  property: Property;
  onSelectProperty: (property: Property) => void;
  onEnquireProperty: (property: Property) => void;
}

export function PropertyCard({
  property,
  onSelectProperty,
  onEnquireProperty,
}: PropertyCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const coverImage = property.images[0];

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-shadow duration-150 hover:shadow-md">
      {/* Media Container (4:3) */}
      <button
        type="button"
        onClick={() => onSelectProperty(property)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
      >
        {coverImage && !imgFailed ? (
          <img
            src={coverImage}
            alt={`${property.title} — ${property.location}`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 flex flex-col items-center justify-center p-6 text-center">
            <Building2 className="w-10 h-10 text-blue-900/60 mb-2" />
            <span className="font-display font-semibold text-slate-800 text-sm">
              {property.title}
            </span>
          </div>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"
        />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
          <span className="text-xs font-medium tracking-wide text-slate-100">
            {property.approvalLabel}
          </span>
          <span className="text-xs font-mono tabular-nums text-emerald-200">
            {property.availableUnits}/{property.totalUnits} Open
          </span>
        </div>
      </button>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2.5">
          {/* Unboxed typographic metadata */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-blue-900">{property.type}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {property.location}
            </span>
          </div>

          <h3 className="font-display text-xl font-bold text-slate-900 tracking-tight leading-snug">
            <button
              type="button"
              onClick={() => onSelectProperty(property)}
              className="text-left hover:text-blue-900 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {property.title}
            </button>
          </h3>

          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {property.description}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div>
            <p className="text-sm font-bold text-emerald-800 leading-snug">
              {property.priceTamil}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 tabular-nums">
              <span>{property.priceDisplay}</span>
              <span>
                {property.minAreaSqft.toLocaleString()}–{property.maxAreaSqft.toLocaleString()} sq.ft
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSelectProperty(property)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
            >
              <span>View Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEnquireProperty(property)}
              className="px-4 py-2.5 min-h-[42px] text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
            >
              Enquire
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
