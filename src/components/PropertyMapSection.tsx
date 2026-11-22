/// <reference types="google.maps" />
import { useCallback, useEffect, useState } from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, GraduationCap, Hospital, Loader2, MapPin, Navigation } from 'lucide-react';
import type { Property } from '../types.ts';

interface NearbyPlaceItem {
  id: string;
  name: string;
  address: string;
  category: 'school' | 'hospital';
  lat: number;
  lng: number;
  distanceKm: number;
  rating?: number | null;
}

interface PropertyMapSectionProps {
  property: Property;
}

function NearbyMarker({
  place,
  isSelected,
  onSelect,
  onClose,
}: {
  place: NearbyPlaceItem;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isSchool = place.category === 'school';

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: place.lat, lng: place.lng }}
        onClick={onSelect}
        title={place.name}
      >
        <Pin
          background={isSchool ? '#1d4ed8' : '#b91c1c'}
          borderColor={isSchool ? '#1e3a8a' : '#7f1d1d'}
          glyphColor="#ffffff"
          glyphText={isSchool ? 'S' : 'H'}
          scale={isSelected ? 1.2 : 0.95}
        />
      </AdvancedMarker>
      {isSelected && marker && (
        <InfoWindow anchor={marker} onCloseClick={onClose} maxWidth={240}>
          <div className="p-1 text-slate-900">
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
              {isSchool ? 'Nearby School' : 'Nearby Hospital'}
            </p>
            <p className="font-display font-bold text-sm mt-0.5">{place.name}</p>
            <p className="text-xs text-slate-600 mt-1">{place.address}</p>
            <div className="mt-1.5 flex items-center gap-2 text-xs font-mono tabular-nums text-slate-700">
              <span>{place.distanceKm.toFixed(1)} km away</span>
              {typeof place.rating === 'number' && (
                <>
                  <span>·</span>
                  <span>Rating {place.rating.toFixed(1)}</span>
                </>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function PropertyMapSection({ property }: PropertyMapSectionProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const geometryLib = useMapsLibrary('geometry');
  const coreLib = useMapsLibrary('core');

  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('hybrid');
  const [filterType, setFilterType] = useState<'all' | 'school' | 'hospital'>('all');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceItem[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const [propertyMarkerRef, propertyMarker] = useAdvancedMarkerRef();
  const [showPropertyInfo, setShowPropertyInfo] = useState(true);

  const fetchNearbyAmenities = useCallback(async () => {
    if (!placesLib || !geometryLib || !coreLib) return;

    setIsLoadingNearby(true);
    setNearbyError(null);

    try {
      const origin = new coreLib.LatLng(property.lat, property.lng);

      const [schoolsRes, hospitalsRes] = await Promise.all([
        placesLib.Place.searchNearby({
          fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating'],
          locationRestriction: {
            center: { lat: property.lat, lng: property.lng },
            radius: 7500,
          },
          includedPrimaryTypes: ['school'],
          maxResultCount: 5,
          rankPreference: placesLib.SearchNearbyRankPreference.DISTANCE,
        }),
        placesLib.Place.searchNearby({
          fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating'],
          locationRestriction: {
            center: { lat: property.lat, lng: property.lng },
            radius: 8500,
          },
          includedPrimaryTypes: ['hospital'],
          maxResultCount: 5,
          rankPreference: placesLib.SearchNearbyRankPreference.DISTANCE,
        }),
      ]);

      const toItem = (
        p: google.maps.places.Place,
        category: 'school' | 'hospital'
      ): NearbyPlaceItem | null => {
        if (!p.location) return null;
        const distMeters = geometryLib.spherical.computeDistanceBetween(origin, p.location);
        return {
          id: p.id || `${category}-${p.displayName || Math.random()}`,
          name: p.displayName || (category === 'school' ? 'School' : 'Hospital'),
          address: p.formattedAddress || property.location,
          category,
          lat: p.location.lat(),
          lng: p.location.lng(),
          distanceKm: distMeters / 1000,
          rating: p.rating ?? null,
        };
      };

      const combined: NearbyPlaceItem[] = [
        ...(schoolsRes?.places ?? []).map((p) => toItem(p, 'school')).filter((x): x is NearbyPlaceItem => x !== null),
        ...(hospitalsRes?.places ?? []).map((p) => toItem(p, 'hospital')).filter((x): x is NearbyPlaceItem => x !== null),
      ].sort((a, b) => a.distanceKm - b.distanceKm);

      setNearbyPlaces(combined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('OVER_QUERY_LIMIT') ||
        msg.includes('Quota')
      ) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setNearbyError('Unable to load live nearby schools and hospitals right now. Use Google Maps link below to explore surroundings.');
    } finally {
      setIsLoadingNearby(false);
    }
  }, [placesLib, geometryLib, coreLib, property.lat, property.lng, property.location]);

  useEffect(() => {
    fetchNearbyAmenities();
  }, [fetchNearbyAmenities]);

  useEffect(() => {
    if (map) {
      map.panTo({ lat: property.lat, lng: property.lng });
    }
  }, [map, property.lat, property.lng]);

  const visiblePlaces = nearbyPlaces.filter(
    (p) => filterType === 'all' || p.category === filterType
  );

  const handleFocusPlace = (place: NearbyPlaceItem) => {
    setSelectedPlaceId(place.id);
    if (map) {
      map.panTo({ lat: place.lat, lng: place.lng });
      map.setZoom(15);
    }
  };

  const handleResetCenter = () => {
    setSelectedPlaceId(null);
    setShowPropertyInfo(true);
    if (map) {
      map.panTo({ lat: property.lat, lng: property.lng });
      map.setZoom(15);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Google Maps Location &amp; Nearby Schools / Hospitals
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Exact site pin at {property.lat.toFixed(5)}, {property.lng.toFixed(5)} · {property.location}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMapTypeId('roadmap')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mapTypeId === 'roadmap'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Road Map
            </button>
            <button
              type="button"
              onClick={() => setMapTypeId('hybrid')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mapTypeId === 'hybrid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetCenter}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Center on Site</span>
          </button>

          <a
            href={property.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Map + Nearby Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden min-h-[420px] h-[440px]">
          <GoogleMap
            defaultCenter={{ lat: property.lat, lng: property.lng }}
            defaultZoom={15}
            mapId="DEMO_MAP_ID"
            mapTypeId={mapTypeId}
            gestureHandling="greedy"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker
              ref={propertyMarkerRef}
              position={{ lat: property.lat, lng: property.lng }}
              onClick={() => setShowPropertyInfo(true)}
              title={property.title}
            >
              <Pin
                background="#0f766e"
                borderColor="#064e3b"
                glyphColor="#ffffff"
                scale={1.25}
              />
            </AdvancedMarker>

            {showPropertyInfo && propertyMarker && (
              <InfoWindow
                anchor={propertyMarker}
                onCloseClick={() => setShowPropertyInfo(false)}
                maxWidth={250}
              >
                <div className="p-1 text-slate-900">
                  <p className="text-xs font-semibold text-emerald-800">
                    {property.approvalLabel}
                  </p>
                  <p className="font-display font-bold text-sm mt-0.5">{property.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{property.location}</p>
                  <p className="text-xs font-bold text-blue-900 mt-1">{property.priceTamil}</p>
                </div>
              </InfoWindow>
            )}

            {visiblePlaces.map((place) => (
              <NearbyMarker
                key={place.id}
                place={place}
                isSelected={selectedPlaceId === place.id}
                onSelect={() => setSelectedPlaceId(place.id)}
                onClose={() => setSelectedPlaceId(null)}
              />
            ))}
          </GoogleMap>
        </div>

        {/* Nearby Schools & Hospitals List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between h-[440px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h3 className="font-display text-base font-bold text-slate-900">
                Nearby Essentials
              </h3>
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'school', label: 'Schools' },
                    { id: 'hospital', label: 'Hospitals' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      filterType === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2 pr-1">
              {isLoadingNearby ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
                  <span className="text-sm">Searching nearby schools &amp; hospitals...</span>
                </div>
              ) : nearbyError ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <MapPin className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">{nearbyError}</p>
                </div>
              ) : visiblePlaces.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                  <p className="text-sm">No matching nearby places found within 8 km.</p>
                </div>
              ) : (
                visiblePlaces.map((place) => {
                  const isSchool = place.category === 'school';
                  const selected = selectedPlaceId === place.id;
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleFocusPlace(place)}
                      className={`w-full text-left py-3 px-2.5 rounded-lg transition-colors flex items-start justify-between gap-3 ${
                        selected ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
                            isSchool
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isSchool ? (
                            <GraduationCap className="w-4 h-4" />
                          ) : (
                            <Hospital className="w-4 h-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {place.name}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {place.address}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 whitespace-nowrap shrink-0 mt-0.5">
                        {place.distanceKm.toFixed(1)} km
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Live data via Google Places</span>
              <span className="font-mono tabular-nums">
                {visiblePlaces.length} locations
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
