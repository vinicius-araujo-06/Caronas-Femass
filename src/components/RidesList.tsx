import { useState } from 'react';
import { Trip, LocationPoint, POPULAR_PLACES } from '../types';
import { Car, UserPlus, MapPin, Search, ArrowRight, DollarSign, Clock, Users, Navigation } from 'lucide-react';

interface RidesListProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onQuickLocate: (origin: LocationPoint | null, dest: LocationPoint | null) => void;
}

export default function RidesList({ trips, onSelectTrip, onQuickLocate }: RidesListProps) {
  const [filterType, setFilterType] = useState<'all' | 'carona' | 'uber'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering logic
  const filteredTrips = trips.filter(trip => {
    // 1. Filter by type
    if (filterType !== 'all' && trip.type !== filterType) return false;

    // 2. Filter by search query (neighborhood name or student name)
    const matchesSearch = 
      trip.origin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.creatorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    return true;
  });

  const handleRideClick = (trip: Trip) => {
    // Draw the route on the map dynamically!
    onQuickLocate(trip.origin, trip.destination);
    onSelectTrip(trip);
  };

  return (
    <div className="space-y-5">
      {/* Search Header and Inputs */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por local, estudante ou destino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-850 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-semibold"
          />
        </div>
      </div>

      {/* Como você quer viajar? Toggles */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">Como você quer viajar?</h3>
        <div className="grid grid-cols-2 gap-3.5">
          {/* Option: Carona */}
          <button
            onClick={() => setFilterType(filterType === 'carona' ? 'all' : 'carona')}
            className={`p-4 rounded-md border text-left transition-all relative overflow-hidden group ${
              filterType === 'carona'
                ? 'bg-slate-50/50 border-2 border-black shadow-sm'
                : 'bg-white hover:bg-slate-50/50 border-slate-200 shadow-sm'
            }`}
          >
            <div className="p-2 bg-slate-905 bg-black text-white rounded-md w-fit mb-3 group-hover:scale-105 transition-transform">
              <Car className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Carona com alunos</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Encontre acadêmicos que estão indo de carro para o mesmo destino.
            </p>
            {filterType === 'carona' && (
              <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-black animate-ping" />
            )}
          </button>

          {/* Option: Uber compartilhado */}
          <button
            onClick={() => setFilterType(filterType === 'uber' ? 'all' : 'uber')}
            className={`p-4 rounded-md border text-left transition-all relative overflow-hidden group ${
              filterType === 'uber'
                ? 'bg-slate-50/50 border-2 border-black shadow-sm'
                : 'bg-white hover:bg-slate-50/50 border-slate-200 shadow-sm'
            }`}
          >
            <div className="p-2 bg-slate-905 bg-black text-white rounded-md w-fit mb-3 group-hover:scale-105 transition-transform">
              <UserPlus className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Uber compartilhado</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Divida uma corrida de Uber/99 e economize dinheiro diariamente.
            </p>
            {filterType === 'uber' && (
              <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-black animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Rides List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Trajetos Ativos {filterType !== 'all' && `(${filterType === 'carona' ? 'Caronas' : 'Ubers'})`}
          </h3>
          <span className="text-[10px] font-bold uppercase text-slate-400">
            {filteredTrips.length} {filteredTrips.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-md border border-slate-200 shadow-sm space-y-2">
            <p className="text-xs font-medium text-slate-500">Nenhum trajeto universitário disponível para os filtros selecionados.</p>
            <p className="text-[10px] text-slate-400">Que tal ser o primeiro a ofertar ou publicar uma rota para seus colegas?</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => {
              const isFull = trip.availableSpots === 0;
              const hasCar = trip.carDetails;

              return (
                <div
                  key={trip.id}
                  onClick={() => handleRideClick(trip)}
                  className={`p-4 bg-white border border-slate-200 rounded-md hover:border-black transition-all cursor-pointer flex items-center justify-between group shadow-sm relative overflow-hidden ${
                    isFull ? 'bg-slate-55/40 opacity-80' : 'hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 pr-2">
                    {/* Visual representation tag based on ride type */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 text-slate-900 flex items-center justify-center">
                        {trip.type === 'carona' ? <Car className="h-4.5 w-4.5" /> : <UserPlus className="h-4.5 w-4.5" />}
                      </div>
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-white rounded-full flex items-center justify-center border border-slate-350">
                        <div className={`h-1.5 w-1.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} />
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {/* Origin to Destination row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[13px] text-slate-900 uppercase tracking-tight">
                          {trip.origin.name.replace(' (Cidade Universitária)', '')}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="font-bold text-[13px] text-slate-900 uppercase tracking-tight">
                          {trip.destination.name.replace(' (Cidade Universitária)', '')}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-450" />
                          <strong className="text-slate-800">{trip.departureTime}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-455" />
                          {isFull ? (
                            <span className="text-red-650 font-bold uppercase tracking-wider text-[9px]">Lotado</span>
                          ) : (
                            <span className="uppercase tracking-wider text-[9px]">{trip.availableSpots} {trip.availableSpots === 1 ? 'vaga' : 'vagas'}</span>
                          )}
                        </span>
                      </div>

                      {/* Creator Profile */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-700 uppercase border border-slate-200">
                          {trip.creatorName.charAt(0)}
                        </div>
                        <div className="text-[10px] text-slate-550 font-medium">
                          Sugerido por <strong className="text-slate-800">{trip.creatorName.split(' ')[0]}</strong>
                          {trip.type === 'carona' && hasCar && (
                            <span className="text-[9px] text-slate-400 ml-1.5 font-normal italic">
                              ({trip.carDetails?.model} • Placa {trip.carDetails?.plate})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action trigger */}
                  <div className="text-right pl-3 flex flex-col items-end gap-1.5">
                    <div className="text-right">
                      <span className="block text-sm font-bold text-green-600">
                        R$ {trip.priceEstimate.toFixed(2)}
                      </span>
                      {trip.type === 'uber' && <span className="text-[8px] text-slate-400 font-normal uppercase tracking-wider block">p/ pessoa</span>}
                    </div>
                    <div className="p-1 px-[7px] border border-slate-200 rounded-md group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-white transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
