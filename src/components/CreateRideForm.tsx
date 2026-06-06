import React, { useState } from 'react';
import { Student, LocationPoint, CAMPUS_POINT, Trip } from '../types';
import { Car, Send, Clock, UserPlus, Info, MapPin, Search } from 'lucide-react';
import MapComponent from './MapComponent';
import LocationSearchModal from './LocationSearchModal';

interface CreateRideFormProps {
  currentStudent: Student;
  onCreateTrip: (newTrip: Trip) => void;
  onCancel: () => void;
  initialOrigin?: LocationPoint | null;
  initialDestination?: LocationPoint | null;
}

export default function CreateRideForm({ 
  currentStudent, 
  onCreateTrip, 
  onCancel,
  initialOrigin,
  initialDestination 
}: CreateRideFormProps) {
  const [type, setType] = useState<'carona' | 'uber'>('carona');
  
  // Modal for robust location search in create form
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchModalType, setSearchModalType] = useState<'origin' | 'destination'>('origin');
  
  // Time and estimate parameters
  const [departureTime, setDepartureTime] = useState('18:00');
  const [customPrice, setCustomPrice] = useState('5.00');
  const [customSpots, setCustomSpots] = useState('3');

  // Precise location states - completely free and precise fields rather than fixed dropdowns
  const [origin, setOrigin] = useState<LocationPoint>(() => {
    return initialOrigin || {
      name: 'Praia dos Cavaleiros',
      address: 'Av. Atlântica - Cavaleiros, Macaé - RJ',
      lat: -22.4082,
      lng: -41.8025
    };
  });

  const [destination, setDestination] = useState<LocationPoint>(() => {
    return initialDestination || {
      name: 'FeMASS (Cidade Universitária)',
      address: 'Rua Aloísio da Silva Gomes, 50 - Granja dos Cavaleiros, Macaé - RJ',
      lat: -22.401889,
      lng: -41.810574
    };
  });

  const [mapTargetMode, setMapTargetMode] = useState<'origin' | 'destination'>('origin');

  // Dynamic distance calculation in Km for real-time estimates
  const getDistanceKm = (from: LocationPoint, to: LocationPoint) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (to.lat - from.lat) * (Math.PI / 180);
    const dLng = (to.lng - from.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.lat * (Math.PI / 180)) * Math.cos(to.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distRatio = R * c * 1.25; // Adjusted driving ratio
    return Math.max(0.5, distRatio);
  };

  const distanceVal = getDistanceKm(origin, destination);
  const minutesVal = Math.max(3, Math.round(distanceVal * 1.8));

  // Uber estimate formula for Macaé: Base R$ 5.50 + R$ 2.45 per km + R$ 0.45 per min. Min: R$ 9.50
  const uberEstimate = Math.max(9.50, 5.50 + (distanceVal * 2.45) + (minutesVal * 0.45));
  // 99 estimate formula for Macaé: Base R$ 5.00 + R$ 2.15 per km + R$ 0.35 per min. Min: R$ 8.50
  const r99Estimate = Math.max(8.50, 5.00 + (distanceVal * 2.15) + (minutesVal * 0.35));

  const totalDividedSpots = Number(customSpots) + 1; // Creator + passenger spots
  const individualUber = uberEstimate / totalDividedSpots;
  const individual99 = r99Estimate / totalDividedSpots;

  // Swap target locations helper
  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Set origin or destination to FeMASS coordinate
  const setPointToCampus = (target: 'origin' | 'destination') => {
    if (target === 'origin') {
      setOrigin(CAMPUS_POINT);
    } else {
      setDestination(CAMPUS_POINT);
    }
  };

  // Handles updating exact coordinate targets via Map clicks
  const handleMapPositionSelected = (point: LocationPoint) => {
    if (mapTargetMode === 'origin') {
      setOrigin(point);
    } else {
      setDestination(point);
    }
  };

  const applyPriceEstimation = (price: number) => {
    setCustomPrice(price.toFixed(2).replace('.', ','));
  };

  const parseNormalizedPrice = (val: string) => {
    const normalized = val.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handlePriceChange = (val: string) => {
    // Permite apenas números e no máximo uma vírgula ou ponto como delimitador decimal
    let cleaned = val.replace(/[^0-9.,]/g, '');
    const separatorsCount = (cleaned.match(/[.,]/g) || []).length;
    if (separatorsCount > 1) {
      const firstSepIndex = cleaned.search(/[.,]/);
      const sep = cleaned[firstSepIndex];
      cleaned = cleaned.replace(/[.,]/g, '');
      cleaned = cleaned.slice(0, firstSepIndex) + sep + cleaned.slice(firstSepIndex);
    }
    setCustomPrice(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin.name || !destination.name) {
      alert('Por favor, defina o nome e o endereço tanto para a Origem quanto para o Destino.');
      return;
    }

    const spots = type === 'carona' 
      ? (currentStudent.carActiveSpots || Number(customSpots))
      : Number(customSpots);

    const numericCustomPrice = parseNormalizedPrice(customPrice);
    const price = type === 'carona'
      ? numericCustomPrice
      : (numericCustomPrice / (spots + 1)); // Split cost among creator + spots

    const generatedTrip: Trip = {
      id: `trip_${Date.now()}`,
      creatorMatricula: currentStudent.matricula,
      creatorName: currentStudent.name,
      creatorPhone: currentStudent.phone,
      type,
      origin,
      destination,
      departureTime,
      priceEstimate: Number(price.toFixed(2)),
      availableSpots: spots,
      maxSpots: spots,
      status: 'aberta',
      passengers: [],
      messages: [],
      ...(type === 'carona' && currentStudent.hasCar ? {
        carDetails: {
          model: currentStudent.carModel || 'Carro Acadêmico',
          color: currentStudent.carColor || 'Cor Neutra',
          plate: currentStudent.carPlate || 'AAA-0A00'
        }
      } : {})
    };

    onCreateTrip(generatedTrip);
  };

  return (
    <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Oferecer Trajeto / Compartilhar</h2>
        <button
          onClick={onCancel}
          className="text-[10px] text-slate-500 hover:text-black font-semibold uppercase tracking-wider underline underline-offset-2"
        >
          Cancelar
        </button>
      </div>

      {/* Select Type Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-md">
        <button
          type="button"
          onClick={() => setType('carona')}
          className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${
            type === 'carona'
              ? 'bg-black text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Car className="h-3.5 w-3.5" />
          Dar Carona
        </button>
        <button
          type="button"
          onClick={() => setType('uber')}
          className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${
            type === 'uber'
              ? 'bg-black text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Dividir Uber
        </button>
      </div>

      {type === 'carona' && !currentStudent.hasCar && (
        <div className="p-3.5 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-amber-900 leading-relaxed font-semibold">
            <strong>Aviso de Veículo:</strong> Você não possui carro cadastrado para oferecer caronas no momento. Acesse a guia <strong>Perfil</strong> para registrar os dados do seu veículo primeiro, ou clique em <strong>Dividir Uber</strong> acima.
          </p>
        </div>
      )}

      {/* Inputs de Endereços Exatos e Customizáveis */}
      <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Trajeto Selecionado</span>
          <button 
            type="button"
            onClick={handleSwapLocations}
            className="text-[8.5px] font-bold uppercase text-slate-800 bg-white border border-slate-250 px-2.5 py-1 hover:bg-slate-50 rounded shadow-sm transition flex items-center gap-1"
          >
            Inverter Trajeto (⇆)
          </button>
        </div>

        {/* Ponto de Partida (Origem) Selector card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">📍 Ponto de Partida (Origem)</span>
            <button
              type="button"
              onClick={() => setPointToCampus('origin')}
              className="text-[8px] uppercase font-bold text-emerald-600 hover:text-emerald-800 hover:underline transition"
            >
              Definir FeMASS
            </button>
          </div>
          
          <div 
            onClick={() => {
              setSearchModalType('origin');
              setIsSearchModalOpen(true);
            }}
            className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-black cursor-pointer p-3 rounded-md shadow-sm transition-all text-left"
          >
            <div className="truncate flex-1 pr-2">
              <span className="block text-[11px] font-bold text-slate-900 truncate">
                {origin.name}
              </span>
              <span className="block text-[9.5px] text-slate-500 truncate leading-none mt-1 font-medium">
                {origin.address}
              </span>
            </div>
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Ponto de Chegada (Destino) Selector card */}
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider font-semibold">🏁 Ponto de Chegada (Destino)</span>
            <button
              type="button"
              onClick={() => setPointToCampus('destination')}
              className="text-[8px] uppercase font-bold text-emerald-600 hover:text-emerald-800 hover:underline transition"
            >
              Definir FeMASS
            </button>
          </div>
          
          <div 
            onClick={() => {
              setSearchModalType('destination');
              setIsSearchModalOpen(true);
            }}
            className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-black cursor-pointer p-3 rounded-md shadow-sm transition-all text-left"
          >
            <div className="truncate flex-1 pr-2">
              <span className="block text-[11px] font-bold text-slate-900 truncate">
                {destination.name}
              </span>
              <span className="block text-[9.5px] text-slate-500 truncate leading-none mt-1 font-medium">
                {destination.address}
              </span>
            </div>
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Dynamic Map interaction panel - Click to pinpoint precise point OR read typed addresses */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Mapa de Verificação das Ruas
          </span>
          <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-wider bg-green-50 px-2.5 py-0.5 rounded">
            Distância: {distanceVal.toFixed(1)} km
          </span>
        </div>

        {/* Integrated Interactive Map */}
        <MapComponent 
          origin={origin} 
          destination={destination} 
          onPositionSelected={handleMapPositionSelected}
          interactiveLabel={`Clique no mapa para registrar o ponto exato de ${mapTargetMode === 'origin' ? 'Origem' : 'Destino'}`}
        />

        {/* Map selection targeting controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMapTargetMode('origin')}
            className={`py-1.5 px-2.5 rounded text-[10px] font-bold uppercase tracking-wide border flex items-center justify-center gap-1.5 transition-all ${
              mapTargetMode === 'origin'
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapPin className="h-3 w-3 text-red-500" />
            Marcar Origem no Mapa
          </button>
          <button
            type="button"
            onClick={() => setMapTargetMode('destination')}
            className={`py-1.5 px-2.5 rounded text-[10px] font-bold uppercase tracking-wide border flex items-center justify-center gap-1.5 transition-all ${
              mapTargetMode === 'destination'
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapPin className="h-3 w-3 text-slate-800" />
            Marcar Destino no Mapa
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Uber & 99 Estimated Price live calculator comparison board */}
        {type === 'uber' && (
          <div className="p-3 bg-slate-900 text-white rounded-md space-y-2.5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">📊 Pre-Cálculo de Tarifas Macaé</span>
              <span className="text-[8px] font-mono text-indigo-400 font-bold">Fórmula Corrigida</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white/5 border border-white/10 rounded space-y-1">
                <span className="text-[8px] text-zinc-400 font-bold block uppercase tracking-wider">UberX (Total)</span>
                <span className="text-xs font-mono font-bold text-white">R$ {uberEstimate.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => applyPriceEstimation(uberEstimate)}
                  className="w-full mt-1.5 py-1 px-2 bg-white text-black font-bold rounded text-[8px] uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  Usar Valor Uber
                </button>
              </div>

              <div className="p-2 bg-white/5 border border-white/10 rounded space-y-1">
                <span className="text-[8px] text-zinc-400 font-bold block uppercase tracking-wider">99Pop (Total)</span>
                <span className="text-xs font-mono font-bold text-white">R$ {r99Estimate.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => applyPriceEstimation(r99Estimate)}
                  className="w-full mt-1.5 py-1 px-2 bg-yellow-400 text-slate-950 font-bold rounded text-[8px] uppercase tracking-wider hover:bg-yellow-300 transition-colors"
                >
                  Usar Valor 99
                </button>
              </div>
            </div>

            {/* Split estimate */}
            <div className="bg-white/10 p-2 rounded text-center text-[9px]">
              Com <strong className="text-white">{totalDividedSpots} pessoas</strong> (você + {customSpots} vagas), o custo individual aproximado fica em 
              <br/>
              <strong className="text-green-400 font-bold">R$ {individualUber.toFixed(2)}</strong> na Uber ou <strong className="text-yellow-400 font-bold">R$ {individual99.toFixed(2)}</strong> na 99!
            </div>
          </div>
        )}

        {/* Departure Time & Final Price Setup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Horário de Saída</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-md focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 truncate" title={type === 'carona' ? 'Contribuição (R$)' : 'Valor Total (R$)'}>
              {type === 'carona' ? 'Contribuição (R$)' : 'Valor Total p/ Dividir (R$)'}
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={customPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-md focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-bold"
              required
            />
            {type === 'uber' && (
              <span className="text-[8px] text-indigo-600 font-bold mt-1 block">
                Individual: R$ {(parseNormalizedPrice(customPrice) / totalDividedSpots).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Passenger spots list select count */}
        {type === 'uber' && (
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-r mb-1">Quantos passageiros adicionais?</label>
            <select
              value={customSpots}
              onChange={(e) => setCustomSpots(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-md focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-bold"
            >
              <option value="1">Dividir com +1 colega (Carro em 2)</option>
              <option value="2">Dividir com +2 colegas (Carro em 3)</option>
              <option value="3">Dividir com +3 colegas (Carro em 4)</option>
            </select>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={type === 'carona' && !currentStudent.hasCar}
          className={`w-full py-3 rounded-md font-bold uppercase tracking-wider text-[10px] shadow transition-colors flex items-center justify-center gap-1.5 ${
            type === 'carona' && !currentStudent.hasCar
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
              : 'bg-black text-white hover:bg-slate-850'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          {type === 'carona' ? 'Publicar Carona Universitária' : 'Iniciar Partilha de Uber'}
        </button>
      </form>

      {/* Robust address autocomplete modal */}
      <LocationSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title={searchModalType === 'origin' ? "Definir Partida (Origem)" : "Definir Destino (Chegada)"}
        type={searchModalType}
        initialValue={searchModalType === 'origin' ? origin : destination}
        onConfirm={(point) => {
          if (searchModalType === 'origin') {
            setOrigin(point);
          } else {
            setDestination(point);
          }
          setIsSearchModalOpen(false);
        }}
      />
    </div>
  );
}
