import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Info, Shield, CheckCircle } from 'lucide-react';
import { LocationPoint, CAMPUS_POINT, FAMAS_COORDINATES } from '../types';

interface MapComponentProps {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  selectedTripRoute?: { origin: LocationPoint; destination: LocationPoint } | null;
  onPositionSelected?: (point: LocationPoint) => void;
  interactiveLabel?: string | null;
  passengerStops?: LocationPoint[];
  zoom?: number;
}

const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('CUSTOM_GOOGLE_MAPS_API_KEY');
    if (saved && saved.trim().length > 10) return saved.trim();
  }
  return (
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    ''
  );
};

const API_KEY = getApiKey();
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

// Sub-component to pan map to center coordinate dynamically and apply exact street-level zoom
function MapReCenterer({ center, zoom }: { center: { lat: number; lng: number } | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, center, zoom]);
  return null;
}

export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1.30; // 1.30 driving multiplier
  return Math.max(0.4, Number(distance.toFixed(1)));
}

export function calculateDurationMin(distanceKm: number): number {
  const baseMinutes = distanceKm * 1.8;
  return Math.max(2, Math.round(baseMinutes));
}

// Function to dynamically load Leaflet assets from CDN if needed for real map fallback
const injectLeafletAssets = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    if ((window as any).L) {
      resolve();
      return;
    }

    // CSS
    if (!document.getElementById('leaflet-css-fallback')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-fallback';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
};

// Sub-component to compute and display route polylines with accurate live measurements
function RouteDisplay({
  origin,
  destination,
  passengerStops = [],
  onComputed
}: {
  origin: LocationPoint;
  destination: LocationPoint;
  passengerStops?: LocationPoint[];
  onComputed: (metrics: { distanceKm: number; durationMin: number }) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const originLatLng = { lat: origin.lat, lng: origin.lng };
    const destLatLng = { lat: destination.lat, lng: destination.lng };

    const intermediates = passengerStops.map(stop => ({
      location: {
        latLng: { lat: stop.lat, lng: stop.lng }
      }
    }));

    routesLib.Route.computeRoutes({
      origin: originLatLng,
      destination: destLatLng,
      intermediates: intermediates.length > 0 ? (intermediates as any) : undefined,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
      .then(({ routes }) => {
        if (routes?.[0]) {
          const newPolylines = routes[0].createPolylines();
          newPolylines.forEach(polyline => {
            polyline.setOptions({
              strokeColor: '#10b981',
              strokeWeight: 5,
              strokeOpacity: 0.85
            });
            polyline.setMap(map);
          });
          polylinesRef.current = newPolylines;

          if (routes[0].viewport) {
            map.fitBounds(routes[0].viewport);
          }

          const distMeters = routes[0].distanceMeters || 0;
          const rawDuration = routes[0].durationMillis as any;
          const durationSeconds = typeof rawDuration === 'string'
            ? parseFloat(rawDuration.replace('s', ''))
            : (rawDuration ? Number(rawDuration) / 1000 : 0);

          let sequentialDistanceKm = Number((distMeters / 1000).toFixed(1));
          if (sequentialDistanceKm <= 0) {
            let tempDist = 0;
            let cursor = origin;
            for (const pStop of passengerStops) {
              tempDist += calculateDistanceKm(cursor.lat, cursor.lng, pStop.lat, pStop.lng);
              cursor = pStop;
            }
            tempDist += calculateDistanceKm(cursor.lat, cursor.lng, destination.lat, destination.lng);
            sequentialDistanceKm = Number(tempDist.toFixed(1));
          }

          const durationMin = durationSeconds > 0 ? Math.round(durationSeconds / 60) : calculateDurationMin(sequentialDistanceKm);
          onComputed({ distanceKm: sequentialDistanceKm, durationMin });
        }
      })
      .catch((err) => {
        console.error('Error computing routes:', err);
        let tempDist = 0;
        let cursor = origin;
        for (const pStop of passengerStops) {
          tempDist += calculateDistanceKm(cursor.lat, cursor.lng, pStop.lat, pStop.lng);
          cursor = pStop;
        }
        tempDist += calculateDistanceKm(cursor.lat, cursor.lng, destination.lat, destination.lng);
        const seqDist = Number(tempDist.toFixed(1));
        const dMin = calculateDurationMin(seqDist);
        onComputed({ distanceKm: seqDist, durationMin: dMin });
      });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin, destination, passengerStops]);

  return null;
}

export default function MapComponent({ 
  origin, 
  destination, 
  selectedTripRoute,
  onPositionSelected,
  interactiveLabel,
  passengerStops = [],
  zoom
}: MapComponentProps) {
  const [bypassWithSimulation, setBypassWithSimulation] = useState(() => {
    return !hasValidKey;
  });

  const singlePointActive = (origin && !destination) || (destination && !origin);
  const computedZoom = zoom || (singlePointActive ? 16 : 13);

  const [googleMetrics, setGoogleMetrics] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  const mapsLib = useMapsLibrary('places');
  const geocoderRef = useRef<any>(null);

  // Leaflet fallback refs for real interactive maps
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const leafletPolylineRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps && !geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [mapsLib]);

  const activeOrigin = selectedTripRoute ? selectedTripRoute.origin : origin;
  const activeDestination = selectedTripRoute ? selectedTripRoute.destination : destination;

  useEffect(() => {
    setGoogleMetrics(null);
  }, [activeOrigin, activeDestination]);

  // Secondary interactive fallback: initialize Leaflet Map when no Google key is available
  useEffect(() => {
    if (!bypassWithSimulation) return;

    let isMounted = true;
    let fallbackMap: any = null;

    injectLeafletAssets().then(() => {
      if (!isMounted || !leafletContainerRef.current) return;

      const L = (window as any).L;
      if (!L) return;

      // Reset previous map
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const centerCoord = activeDestination || activeOrigin || FAMAS_COORDINATES;

      const map = L.map(leafletContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([centerCoord.lat, centerCoord.lng], computedZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      leafletMapRef.current = map;
      fallbackMap = map;

      // Handle map clicks in Leaflet to do reverse-geocoding via Nominatim
      if (onPositionSelected) {
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`)
            .then(res => res.json())
            .then(data => {
              const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
              const routeName = data.address?.road || data.address?.suburb || "Localização Customizada";
              onPositionSelected({
                name: routeName,
                address,
                lat: Number(lat.toFixed(6)),
                lng: Number(lng.toFixed(6))
              });
            })
            .catch(() => {
              onPositionSelected({
                name: "Ponto Selecionado",
                address: `Macaé - RJ (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
                lat: Number(lat.toFixed(6)),
                lng: Number(lng.toFixed(6))
              });
            });
        });
      }

      // Draw custom beautiful divIcons in Leaflet space
      const renderPointers = () => {
        leafletMarkersRef.current.forEach(m => m.remove());
        leafletMarkersRef.current = [];

        if (leafletPolylineRef.current) {
          leafletPolylineRef.current.remove();
          leafletPolylineRef.current = null;
        }

        const fitPoints: any[] = [];

        // 1. Mark FeMASS
        const femassIcon = L.divIcon({
          className: 'custom-leaflet-marker-div',
          html: `<div style="background-color: black; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.25);"><svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        const mFemass = L.marker([FAMAS_COORDINATES.lat, FAMAS_COORDINATES.lng], { icon: femassIcon })
          .addTo(map)
          .bindPopup("<b>Cidade Universitária - FeMASS</b>");
        leafletMarkersRef.current.push(mFemass);
        fitPoints.push([FAMAS_COORDINATES.lat, FAMAS_COORDINATES.lng]);

        // 2. Mark Origin (A)
        if (activeOrigin) {
          const originIcon = L.divIcon({
            className: 'custom-leaflet-marker-div',
            html: `<div style="background-color: #475569; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; box-shadow: 0 3px 6px rgba(0,0,0,0.25);">A</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          const mOrigin = L.marker([activeOrigin.lat, activeOrigin.lng], { icon: originIcon })
            .addTo(map)
            .bindPopup(`<b>Ponto de Partida (Origem)</b><br/>${activeOrigin.name}<br/><span style="font-size:10px;color:#555;">${activeOrigin.address}</span>`);
          leafletMarkersRef.current.push(mOrigin);
          fitPoints.push([activeOrigin.lat, activeOrigin.lng]);
        }

        // 3. Mark Destination (B)
        if (activeDestination) {
          const destIcon = L.divIcon({
            className: 'custom-leaflet-marker-div',
            html: `<div style="background-color: #10b981; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; box-shadow: 0 3px 6px rgba(0,0,0,0.25);">B</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          const mDest = L.marker([activeDestination.lat, activeDestination.lng], { icon: destIcon })
            .addTo(map)
            .bindPopup(`<b>Ponto de Chegada (Destino)</b><br/>${activeDestination.name}<br/><span style="font-size:10px;color:#555;">${activeDestination.address}</span>`);
          leafletMarkersRef.current.push(mDest);
          fitPoints.push([activeDestination.lat, activeDestination.lng]);
        }

        // 4. Passenger stops
        passengerStops.forEach((stop, idx) => {
          const stopIcon = L.divIcon({
            className: 'custom-leaflet-marker-div',
            html: `<div style="background-color: #4f46e5; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${idx + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          const mStop = L.marker([stop.lat, stop.lng], { icon: stopIcon })
            .addTo(map)
            .bindPopup(`<b>Parada ${idx + 1}</b><br/>${stop.name}`);
          leafletMarkersRef.current.push(mStop);
          fitPoints.push([stop.lat, stop.lng]);
        });

        // 5. Render Polyline Rota
        if (activeOrigin && activeDestination) {
          const polyCoords = [[activeOrigin.lat, activeOrigin.lng]];
          passengerStops.forEach(st => polyCoords.push([st.lat, st.lng]));
          polyCoords.push([activeDestination.lat, activeDestination.lng]);

          const polyline = L.polyline(polyCoords, {
            color: '#10b981',
            weight: 5,
            opacity: 0.85,
            dashArray: '6, 6'
          }).addTo(map);
          leafletPolylineRef.current = polyline;
        }

        // Auto fitting coordinates
        if (fitPoints.length >= 2) {
          map.fitBounds(fitPoints, { padding: [40, 40] });
        } else if (fitPoints.length === 1) {
          map.setView(fitPoints[0], computedZoom);
        }
      };

      renderPointers();
    });

    return () => {
      isMounted = false;
      if (fallbackMap) {
        fallbackMap.remove();
        if (leafletMapRef.current === fallbackMap) {
          leafletMapRef.current = null;
        }
      }
    };
  }, [bypassWithSimulation, activeOrigin, activeDestination, passengerStops]);

  // Handles native Google Maps click reverse-geocoding
  const handleRealMapClick = (e: any) => {
    if (!onPositionSelected) return;
    const latLng = e.detail?.latLng;
    if (!latLng) return;

    const coords = { lat: latLng.lat, lng: latLng.lng };

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: coords }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          const formatted = results[0].formatted_address;
          const route = results[0].address_components.find((c: any) => c.types.includes('route'));
          const number = results[0].address_components.find((c: any) => c.types.includes('street_number'));
          const sublocality = results[0].address_components.find((c: any) => c.types.includes('sublocality_level_1'));

          let title = "Ponto no Mapa";
          if (route) {
            title = `${route.long_name}${number ? `, ${number.long_name}` : ''}`;
          } else if (sublocality) {
            title = sublocality.long_name;
          }

          onPositionSelected({
            name: title,
            address: formatted,
            lat: Number(coords.lat.toFixed(6)),
            lng: Number(coords.lng.toFixed(6))
          });
        } else {
          onPositionSelected({
            name: "Ponto Customizado",
            address: `Macaé - RJ (Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)})`,
            lat: Number(coords.lat.toFixed(6)),
            lng: Number(coords.lng.toFixed(6))
          });
        }
      });
    } else {
      onPositionSelected({
        name: "Ponto Selecionado",
        address: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
        lat: Number(coords.lat.toFixed(6)),
        lng: Number(coords.lng.toFixed(6))
      });
    }
  };

  // Rendering 100% REAL OpenStreetMap Map Fallback (Leaflet)
  if (bypassWithSimulation) {
    return (
      <div className="relative w-full h-[220px] sm:h-[320px] md:h-[400px] border border-slate-200 rounded-md overflow-hidden shadow-inner flex flex-col justify-between">
        {/* Real Dynamic Interactive Map Div Container */}
        <div ref={leafletContainerRef} className="absolute inset-0 z-0 bg-slate-100" />



        {/* Selected Route Info Box */}
        {activeOrigin && activeDestination && (() => {
          let sequentialDistanceKm = 0;
          let cursorPoint = activeOrigin;
          for (const stop of passengerStops) {
            sequentialDistanceKm += calculateDistanceKm(cursorPoint.lat, cursorPoint.lng, stop.lat, stop.lng);
            cursorPoint = stop;
          }
          sequentialDistanceKm += calculateDistanceKm(cursorPoint.lat, cursorPoint.lng, activeDestination.lat, activeDestination.lng);
          const simDistance = Math.max(0.4, Number(sequentialDistanceKm.toFixed(1)));
          const simDuration = calculateDurationMin(simDistance);
          return (
            <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white text-slate-900 p-3 rounded-md shadow-md border border-slate-200 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                  <Navigation className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="max-w-[200px] sm:max-w-[240px]">
                  <span className="block text-[8px] text-emerald-600 uppercase font-black tracking-wider">Trajeto Calculado (Real)</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-900 truncate block">
                    {activeOrigin.name} ➔ {activeDestination.name}
                  </span>
                  <span className="text-[8px] text-slate-500 block truncate">{activeOrigin.address}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 bg-slate-50 p-1.5 rounded border border-slate-100">
                <span className="block text-xs font-black text-black uppercase tracking-wider">≈ {simDuration} min</span>
                <span className="block text-[9px] text-slate-705 font-bold">{simDistance} km</span>
              </div>
            </div>
          );
        })()}

        {/* Quick activate Google mode if saved key detected */}
        {hasValidKey && (
          <button
            onClick={() => setBypassWithSimulation(false)}
            className="absolute top-3 right-3 z-[1000] bg-black text-white hover:bg-slate-800 px-2 rounded-md py-1 text-[8.5px] uppercase font-black tracking-wider shadow"
          >
            Mudar p/ Google Maps
          </button>
        )}
      </div>
    );
  }

  // Real Google Maps View
  return (
    <div className="relative w-full h-[220px] sm:h-[320px] md:h-[400px] rounded-md overflow-hidden shadow border border-slate-200">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={FAMAS_COORDINATES}
          defaultZoom={13}
          mapId="UNIRIDE_FAMA_MAP"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          disableDefaultUI={true}
          zoomControl={true}
          onClick={onPositionSelected ? handleRealMapClick : undefined}
        >
          <MapReCenterer center={activeDestination || activeOrigin || FAMAS_COORDINATES} zoom={computedZoom} />

          <AdvancedMarker position={FAMAS_COORDINATES} title="FeMASS - Cidade Universitária">
            <Pin background="#000000" glyphColor="#fff" scale={1.1}>
              <Navigation className="h-3.5 w-3.5 text-white" />
            </Pin>
          </AdvancedMarker>

          {activeOrigin && (
            <AdvancedMarker position={{ lat: activeOrigin.lat, lng: activeOrigin.lng }} title={activeOrigin.name}>
              <Pin background="#475569" glyphColor="#fff">
                <div className="text-xs font-bold text-white">A</div>
              </Pin>
            </AdvancedMarker>
          )}

          {activeDestination && (
            <AdvancedMarker position={{ lat: activeDestination.lat, lng: activeDestination.lng }} title={activeDestination.name}>
              <Pin background="#000000" glyphColor="#fff">
                <div className="text-xs font-bold text-white">B</div>
              </Pin>
            </AdvancedMarker>
          )}

          {passengerStops.map((stop, idx) => (
            <AdvancedMarker key={`real-stop-${idx}`} position={{ lat: stop.lat, lng: stop.lng }} title={`Parada: ${stop.name}`}>
              <Pin background="#4f46e5" glyphColor="#fff">
                <div className="text-[10px] font-bold text-white">{idx + 1}</div>
              </Pin>
            </AdvancedMarker>
          ))}

          {activeOrigin && activeDestination && (
            <RouteDisplay origin={activeOrigin} destination={activeDestination} onComputed={setGoogleMetrics} />
          )}
        </Map>
      </APIProvider>

      {/* Dynamic Route Details Box for Real Google Maps View */}
      {activeOrigin && activeDestination && (() => {
        const distanceVal = googleMetrics?.distanceKm ?? calculateDistanceKm(activeOrigin.lat, activeOrigin.lng, activeDestination.lat, activeDestination.lng);
        const durationVal = googleMetrics?.durationMin ?? calculateDurationMin(distanceVal);
        return (
          <div className="absolute bottom-3 left-3 right-3 z-25 bg-white text-slate-900 p-3 rounded-md shadow-md border border-slate-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-150 rounded text-slate-900 border border-slate-200">
                <Navigation className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <div className="max-w-[190px] sm:max-w-[245px]">
                <span className="block text-[8px] text-green-600 uppercase font-black tracking-wider flex items-center gap-1 mb-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Rota Real Ativa
                </span>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-950 truncate block">
                  {activeOrigin.name} ➔ {activeDestination.name}
                </span>
                <span className="text-[8px] text-slate-500 block truncate leading-tight">{activeOrigin.address}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0 bg-slate-50 p-1.5 rounded border border-slate-150">
              <span className="block text-xs font-black text-black uppercase tracking-wider">≈ {durationVal} min</span>
              <span className="block text-[9px] text-slate-650 font-bold">{distanceVal} km</span>
            </div>
          </div>
        );
      })()}

      <button
        onClick={() => setBypassWithSimulation(true)}
        className="absolute top-3 right-3 z-20 bg-white hover:bg-slate-50 text-slate-700 hover:text-black border border-slate-200 px-2.5 py-1.5 rounded-md text-[9px] uppercase font-bold tracking-wider shadow-sm flex items-center gap-1 transition-all"
      >
        <Shield className="h-3 w-3 text-slate-800" />
        Alternar para OSM-Real
      </button>
    </div>
  );
}
