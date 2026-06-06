import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, X, Search, Check, Navigation, Map, Loader2, Sparkles } from 'lucide-react';
import { LocationPoint } from '../types';
import MapComponent from './MapComponent';

export const MACAE_NEIGHBORHOODS: LocationPoint[] = [
  { name: 'FeMASS (Cidade Universitária)', address: 'Granja dos Cavaleiros, Macaé - RJ (Campus Central)', lat: -22.401889, lng: -41.810574 },
  { name: 'Cavaleiros', address: 'Bairro Cavaleiros, Macaé - RJ (Praia dos Cavaleiros)', lat: -22.4082, lng: -41.8025 },
  { name: 'Centro', address: 'Centro de Macaé, Macaé - RJ', lat: -22.3787, lng: -41.7853 },
  { name: 'Parque Aeroporto', address: 'Bairro Parque Aeroporto, Macaé - RJ (Zona Norte)', lat: -22.3422, lng: -41.7483 },
  { name: 'Imbetiba', address: 'Bairro Imbetiba, Macaé - RJ (Praia de Imbetiba)', lat: -22.3831, lng: -41.7766 },
  { name: 'Glória', address: 'Bairro da Glória, Macaé - RJ', lat: -22.3985, lng: -41.8120 },
  { name: 'Granja dos Cavaleiros', address: 'Bairro Granja dos Cavaleiros, Macaé - RJ', lat: -22.4010, lng: -41.8130 },
  { name: 'Praia do Pecado', address: 'Bairro Praia do Pecado, Macaé - RJ', lat: -22.4132, lng: -41.7981 },
  { name: 'Novo Cavaleiros', address: 'Bairro Novo Cavaleiros, Macaé - RJ', lat: -22.4115, lng: -41.8190 },
  { name: 'Riviera Fluminense', address: 'Bairro Riviera Fluminense, Macaé - RJ', lat: -22.3912, lng: -41.7960 },
  { name: 'Aroeira', address: 'Bairro Aroeira, Macaé - RJ', lat: -22.3795, lng: -41.8050 },
  { name: 'Lagomar', address: 'Bairro Lagomar, Macaé - RJ', lat: -22.3115, lng: -41.7090 },
  { name: 'Cancela Preta', address: 'Bairro Cancela Preta, Macaé - RJ', lat: -22.3970, lng: -41.8020 },
  { name: 'Visconde de Araújo', address: 'Bairro Visconde de Araújo, Macaé - RJ', lat: -22.3690, lng: -41.7910 },
  { name: 'Miramar', address: 'Bairro Miramar, Macaé - RJ', lat: -22.3820, lng: -41.7910 },
  { name: 'Sol e Mar', address: 'Bairro Sol e Mar, Macaé - RJ', lat: -22.3940, lng: -41.8090 },
  { name: 'Barra de Macaé', address: 'Bairro Barra de Macaé, Macaé - RJ', lat: -22.3610, lng: -41.7690 },
  { name: 'Vale das Palmeiras', address: 'Bairro Vale das Palmeiras, Macaé - RJ', lat: -22.3955, lng: -41.8145 },
  { name: 'Alto dos Cajueiros', address: 'Bairro Alto dos Cajueiros, Macaé - RJ', lat: -22.3850, lng: -41.7890 }
];

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'origin' | 'destination';
  initialValue: LocationPoint | null;
  onConfirm: (point: LocationPoint) => void;
}

export default function LocationSearchModal({
  isOpen,
  onClose,
  title,
  type,
  initialValue,
  onConfirm
}: LocationSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(initialValue);

  // Dynamic set of neighborhoods compiled of hardcoded defaults and localStorage customized addresses
  const [allNeighborhoods, setAllNeighborhoods] = useState<LocationPoint[]>(() => {
    try {
      const saved = localStorage.getItem('uniride_custom_addresses');
      const custom: LocationPoint[] = saved ? JSON.parse(saved) : [];
      // Put custom items at the front for easy selection
      return [...custom, ...MACAE_NEIGHBORHOODS];
    } catch (e) {
      console.warn("Could not load custom addresses:", e);
      return MACAE_NEIGHBORHOODS;
    }
  });

  // Synchronize with parent's initial value when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedPoint(initialValue);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, initialValue]);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const queryNormalized = searchQuery.toLowerCase().trim();
    const localMatches = allNeighborhoods.filter(n =>
      n.name.toLowerCase().includes(queryNormalized) ||
      n.address.toLowerCase().includes(queryNormalized)
    );

    // Immediately show local matches to keep feedback instantaneous
    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      setSelectedPoint(localMatches[0]);
    }

    setIsLoading(true);
    const delayDebounce = setTimeout(() => {
      const fetchResults = async () => {
        try {
          // 1. Check if Google Maps is fully initialized & contains Places Autocomplete
          if (
            typeof window !== 'undefined' &&
            window.google?.maps?.places
          ) {
            const autocompleteService = new window.google.maps.places.AutocompleteService();
            const geocoder = new window.google.maps.Geocoder();

            autocompleteService.getPlacePredictions(
              {
                input: searchQuery,
                componentRestrictions: { country: 'br' }, // Brazil-centric
                locationBias: { lat: -22.37, lng: -41.78 } // Prefer Macaé region bias
              },
              async (predictions, status) => {
                if (status === 'OK' && predictions && predictions.length > 0) {
                  const items: LocationPoint[] = [];
                  
                  // Limit geocode requests to prevent quota congestion and remain fast
                  for (const pred of predictions.slice(0, 3)) {
                    try {
                      const geoResult = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                        geocoder.geocode({ placeId: pred.place_id }, (res, geoStatus) => {
                          if (geoStatus === 'OK' && res) resolve(res);
                          else reject(geoStatus);
                        });
                      });
                      if (geoResult[0]) {
                        items.push({
                          name: pred.structured_formatting.main_text,
                          address: pred.description,
                          lat: geoResult[0].geometry.location.lat(),
                          lng: geoResult[0].geometry.location.lng()
                        });
                      }
                    } catch (e) {
                      console.warn("Geocoding predictions fallback warning:", e);
                    }
                  }

                  if (items.length > 0) {
                    const combined = [...localMatches, ...items.filter(p => !localMatches.some(lm => lm.name.toLowerCase() === p.name.toLowerCase()))];
                    setSearchResults(combined);
                    setSelectedPoint(combined[0]);
                    setIsLoading(false);
                    return;
                  }
                }
                
                // Fallback to OSM Nominatim if empty google results
                await runNominatimFallback(searchQuery, localMatches);
              }
            );
          } else {
            // 2. OpenStreetMap Nominatim Fallback
            await runNominatimFallback(searchQuery, localMatches);
          }
        } catch (error) {
          console.error("Primary maps search failure, trying Nominatim:", error);
          await runNominatimFallback(searchQuery, localMatches);
        }
      };

      fetchResults();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, allNeighborhoods]);

  const runNominatimFallback = async (query: string, localMatches: LocationPoint[] = []) => {
    try {
      // Prioritize landmarks in Brazil, Macaé or other RJ neighborhoods
      let queryStr = query;
      if (!query.toLowerCase().includes('macaé') && !query.toLowerCase().includes('rj')) {
        queryStr = `${query}, Macaé, RJ, Brasil`;
      }

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&accept-language=pt-BR&limit=5`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const points: LocationPoint[] = data.map((item: any) => {
            const parts = item.display_name.split(',');
            const placeName = parts[0] || "Localização";
            const remainderAddress = parts.slice(1, 4).join(',').trim() || item.display_name;
            return {
              name: placeName,
              address: remainderAddress,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            };
          });
          
          const combined = [...localMatches, ...points.filter(p => !localMatches.some(lm => lm.name.toLowerCase() === p.name.toLowerCase()))];
          setSearchResults(combined);
          if (combined.length > 0) {
            setSelectedPoint(combined[0]);
          }
        }
      }
    } catch (err) {
      console.error("OSM Nominatim Fallback failure:", err);
      if (localMatches.length > 0) {
        setSearchResults(localMatches);
        setSelectedPoint(localMatches[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (place: LocationPoint) => {
    setSelectedPoint(place);
    // Clear predictions list to let the map shine
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleMapPinpointSelected = (point: LocationPoint) => {
    setSelectedPoint(point);
  };

  const handleConfirmSelection = () => {
    if (searchResults.length > 0) {
      onConfirm(searchResults[0]);
      onClose();
    } else if (selectedPoint) {
      onConfirm(selectedPoint);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4">
        {/* Semi-transparent clickable backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Sliding Modal Bottom Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 120 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 120 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] z-10"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-800">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-green-600 flex items-center gap-1.5 mb-0.5">
                <Sparkles className="h-3 w-3 text-green-500 shrink-0" />
                Busca de Endereço Real (Uber/99 Style)
              </span>
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-950">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-black hover:bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Fechar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-slate-50">
            {/* Search Input Area */}
            <div className="p-4 bg-white border-b border-slate-150 space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder={type === 'origin' ? "De onde você está saindo? (Exp: Praia dos Cavaleiros)" : "Para onde você deseja ir? (Exp: Centro Macaé)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmSelection();
                    }
                  }}
                  className="w-full pl-10 pr-10 py-3 text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-md focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-semibold placeholder:text-slate-400"
                />
                
                {isLoading ? (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 animate-spin" />
                ) : searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 hover:text-black font-extrabold uppercase tracking-wider"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Quick suggestions tray of Macaé neighborhoods when input is empty */}
              {!searchQuery.trim() && (
                <div className="space-y-1.5 pt-1.5">
                  <span className="block text-[8px] font-black tracking-wider text-slate-400 uppercase">🎒 Sugestões de Bairro (Macaé e Salvos)</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1.5 bg-slate-50 border border-slate-150 rounded font-sans">
                    {allNeighborhoods.map((bairro, idx) => {
                      const isPredefined = MACAE_NEIGHBORHOODS.some(n => n.name === bairro.name);
                      return (
                        <button
                          key={`bairro-pill-${idx}`}
                          type="button"
                          onClick={() => {
                            setSelectedPoint(bairro);
                          }}
                          className={`px-2 py-1.5 text-[9.5px] font-bold rounded-md transition flex items-center gap-1 shadow-sm border ${
                            selectedPoint?.name === bairro.name 
                              ? 'bg-black text-white border-black' 
                              : 'bg-white border-slate-200 text-slate-800 hover:border-black hover:bg-slate-50'
                          }`}
                        >
                          <MapPin className="h-2.5 w-2.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[120px]">{bairro.name}</span>
                          {!isPredefined && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                try {
                                  const saved = localStorage.getItem('uniride_custom_addresses');
                                  const customList: LocationPoint[] = saved ? JSON.parse(saved) : [];
                                  const filtered = customList.filter(item => item.name !== bairro.name);
                                  localStorage.setItem('uniride_custom_addresses', JSON.stringify(filtered));
                                  setAllNeighborhoods([...filtered, ...MACAE_NEIGHBORHOODS]);
                                  if (selectedPoint?.name === bairro.name) {
                                    setSelectedPoint(null);
                                  }
                                } catch (err) {
                                  console.error("Failed to delete custom address:", err);
                                }
                              }}
                              className="ml-1 text-slate-400 hover:text-red-500 font-black p-0.5 rounded-full hover:bg-slate-100 shrink-0 text-[10px]"
                              title="Remover endereço salvo"
                            >
                              ×
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic confirmation button for custom typed text */}
              {searchQuery.trim().length > 0 && (
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const text = searchQuery.trim();
                      const customPoint: LocationPoint = {
                        name: text,
                        address: `${text}, Macaé - RJ (Salvo)`,
                        lat: -22.3787, // Center of Macaé as fallback
                        lng: -41.7853
                      };
                      
                      try {
                        const saved = localStorage.getItem('uniride_custom_addresses');
                        const customList: LocationPoint[] = saved ? JSON.parse(saved) : [];
                        if (!customList.some(item => item.name.toLowerCase() === text.toLowerCase())) {
                          const newList = [customPoint, ...customList];
                          localStorage.setItem('uniride_custom_addresses', JSON.stringify(newList));
                          setAllNeighborhoods([...newList, ...MACAE_NEIGHBORHOODS]);
                        }
                      } catch (err) {
                        console.error("Could not write custom address:", err);
                      }

                      handleSelectSuggestion(customPoint);
                    }}
                    className="w-full p-2.5 bg-indigo-50 hover:bg-indigo-100/90 text-indigo-950 font-black text-[10.5px] rounded border border-indigo-200/50 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2 truncate text-left">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0 animate-pulse" />
                      <span className="truncate">Usar exatamente o digitado: <strong>"{searchQuery}"</strong></span>
                    </div>
                    <span className="text-[8px] uppercase tracking-wider bg-indigo-200 text-indigo-800 font-black px-1.5 py-0.5 rounded shrink-0">
                      Confirmar
                    </span>
                  </button>
                </div>
              )}

              {/* Dynamic Search Suggestions Panel */}
              {(searchResults.length > 0 || searchQuery.trim()) && (
                <div className="bg-white rounded-md border border-slate-150 max-h-[180px] overflow-y-auto shadow-md">
                  {searchResults.length === 0 && !isLoading ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 italic">
                      Nenhum endereço encontrado para "{searchQuery}". Toque no botão azul acima para confirmar exatamente o que digitou, ou use o mapa abaixo.
                    </div>
                  ) : (
                    searchResults.map((result, idx) => (
                      <div
                        key={`search-res-${idx}`}
                        onClick={() => handleSelectSuggestion(result)}
                        className="p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer flex items-start gap-3 transition-colors text-slate-800"
                      >
                        <MapPin className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                        <div className="truncate text-left">
                          <span className="block text-xs font-bold text-slate-900 truncate">
                            {result.name}
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                            {result.address}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

            {/* Interactive Map Section (Uber style) - Collapsed/Hidden on mobile if typing to prevent screen crowding and keyboard overlaps */}
            <div className={`flex flex-col relative transition-all overflow-hidden ${
              searchQuery.trim() ? 'hidden sm:flex sm:h-[300px] sm:relative sm:flex-1' : 'flex-1 min-h-[160px] h-[220px] sm:h-[300px]'
            }`}>
              <div className="absolute inset-0 z-0">
                <MapComponent
                  origin={type === 'origin' ? selectedPoint : null}
                  destination={type === 'destination' ? selectedPoint : null}
                  onPositionSelected={handleMapPinpointSelected}
                  interactiveLabel={`Toque no mapa para marcar a localização exata de ${type === 'origin' ? 'origem' : 'destino'}`}
                />
              </div>

              {/* Dynamic floating feedback overlay */}
              <div className="absolute top-3 left-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-md shadow-md border border-slate-200 z-10 pointer-events-none flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-black shrink-0 animate-bounce" />
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-800">
                  Arraste ou toque no mapa acima para fixar o ponto exato!
                </span>
              </div>
            </div>

            {/* Selected Location Details Panel */}
            {selectedPoint && (
              <div className="p-4 bg-white border-t border-slate-150 space-y-1 shrink-0">
                <span className="text-[8px] font-extrabold text-green-600 uppercase tracking-widest block">
                  📍 Endereço Selecionado
                </span>
                <div className="flex items-start justify-between gap-4">
                  <div className="truncate">
                    <h4 className="text-xs font-black text-slate-950 truncate">
                      {selectedPoint.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {selectedPoint.address}
                    </p>
                    <span className="inline-block mt-1 font-mono text-[8px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150">
                      Coordenadas: {selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}
                    </span>
                  </div>
                  <X className="h-4 w-4 text-slate-400 rotate-45 shrink-0" />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Button Footer */}
          {selectedPoint ? (
            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-4">
              <div className="truncate max-w-[55%]">
                <span className="block text-[8px] font-bold uppercase text-slate-400">Pronto para confirmar:</span>
                <span className="block text-xs font-black text-slate-950 truncate mt-0.5">{selectedPoint.name}</span>
              </div>
              <button
                type="button"
                onClick={handleConfirmSelection}
                className="py-3 px-5 bg-black hover:bg-slate-850 text-white font-extrabold rounded-md shadow-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all animate-bounce"
              >
                <Check className="h-4 w-4 text-green-400 stroke-[3]" />
                Confirmar Localização
              </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[10px] font-bold uppercase text-slate-400 shrink-0">
              Selecione um lugar por busca ou tocando no mapa para confirmar
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
