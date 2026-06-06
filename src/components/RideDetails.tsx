import React, { useState, useEffect, useRef } from 'react';
import { Trip, Student, CAMPUS_POINT, LocationPoint } from '../types';
import { 
  Car, UserPlus, ArrowLeft, Phone, Users, MapPin, 
  MessageSquare, Send, CheckCircle2, AlertCircle, Share2, 
  Navigation, ExternalLink, Copy, Check 
} from 'lucide-react';
import MapComponent from './MapComponent';

interface RideDetailsProps {
  trip: Trip;
  currentStudent: Student;
  onJoinTrip: (tripId: string, stopLocation?: LocationPoint) => void;
  onLeaveTrip: (tripId: string) => void;
  onSendMessage: (tripId: string, messageText: string) => void;
  onUpdateTripStops?: (tripId: string, customStops: LocationPoint[]) => void;
  onBack: () => void;
}

export default function RideDetails({
  trip,
  currentStudent,
  onJoinTrip,
  onLeaveTrip,
  onSendMessage,
  onUpdateTripStops,
  onBack
}: RideDetailsProps) {
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [wantsCustomStop, setWantsCustomStop] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // States for Driver customized route waypoints
  const [driverWantsCustomStop, setDriverWantsCustomStop] = useState(false);
  const [driverStopPoint, setDriverStopPoint] = useState<LocationPoint>({
    name: 'Ponto de Coleta da Carona',
    address: 'Clique no mapa abaixo para marcar o desvio',
    lat: -22.39,
    lng: -41.80
  });

  // Default coordinate for new custom passenger stop (Macaé town area)
  const [selectedPassengerStop, setSelectedPassengerStop] = useState<LocationPoint>({
    name: 'Ponto de Encontro Escolhido',
    address: 'Selecione no mapa ao clicar acima',
    lat: -22.39,
    lng: -41.80
  });

  const isPassenger = trip.passengers.some(p => p.matricula === currentStudent.matricula);
  const isCreator = trip.creatorMatricula === currentStudent.matricula;
  const isFull = trip.availableSpots === 0;

  useEffect(() => {
    // Scroll chats to bottom when messages load/change
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [trip.messages]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(trip.id, chatInput.trim());
    setChatInput('');
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Distance calculating helper
  const getDistanceKm = (from: LocationPoint, to: LocationPoint) => {
    const R = 6371;
    const dLat = (to.lat - from.lat) * (Math.PI / 180);
    const dLng = (to.lng - from.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.lat * (Math.PI / 180)) * Math.cos(to.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1.25; // Simple adjusted driving distance
  };

  // Compile active passenger stops AND driver custom altered waypoints
  const activeStops = [
    ...(trip.customStops || []),
    ...(trip.passengers.map(p => p.stopLocation).filter(Boolean) as LocationPoint[])
  ];

  // Sequential total multi-stop route calculation
  let sequentialDistanceKm = 0;
  let cursorPoint = trip.origin;
  for (const stop of activeStops) {
    sequentialDistanceKm += getDistanceKm(cursorPoint, stop);
    cursorPoint = stop;
  }
  sequentialDistanceKm += getDistanceKm(cursorPoint, trip.destination);

  const realDistance = Math.max(0.5, sequentialDistanceKm);
  const realDurationMin = Math.max(3, Math.round(realDistance * 1.8));

  // Dynamically estimated split-price using Macaé fares
  // Base R$ 5.50 + R$ 2.45 per Km + R$ 0.45 per Min
  const dynamicUberTotal = Math.max(9.50, 5.50 + (realDistance * 2.45) + (realDurationMin * 0.45));
  // Base R$ 5.00 + R$ 2.15 per Km + R$ 0.35 per Min
  const dynamic99Total = Math.max(8.50, 5.00 + (realDistance * 2.15) + (realDurationMin * 0.35));

  const totalPeople = trip.passengers.length + 1;
  const individualUberSplit = dynamicUberTotal / totalPeople;
  const individual99Split = dynamic99Total / totalPeople;

  // Generate Google Maps Directions link detailing all intermediate coordinates
  const waypointsSegment = activeStops.map(s => `${s.lat},${s.lng}`).join('|');
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${trip.origin.lat},${trip.origin.lng}&destination=${trip.destination.lat},${trip.destination.lng}${waypointsSegment ? `&waypoints=${encodeURIComponent(waypointsSegment)}` : ''}`;

  // Simple direct links to the main ride sharing portals (Web App / Sites)
  // Users will input the copied addresses manually in their active app.
  const uberWebPortalUrl = 'https://m.uber.com';
  const r99WebPortalUrl = 'https://99app.com';

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm max-w-md mx-auto space-y-4 text-slate-850">
      
      {/* Header action */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </button>

        <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
          trip.type === 'carona' 
            ? 'bg-emerald-50 border-emerald-150 text-emerald-800' 
            : 'bg-indigo-50 border-indigo-150 text-indigo-800'
        }`}>
          {trip.type === 'carona' ? '🚗 Carona Amiga' : '📱 Dividir Táxi / Uber'}
        </span>
      </div>

      <div className="p-4 pt-1 space-y-4">
        {/* Dynamic Map Routing Summary */}
        <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">
              Sentido e Paradas
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              Distância Total: {realDistance.toFixed(1)} km
            </span>
          </div>

          <div className="flex items-center justify-between mt-2 flex-wrap gap-2 text-xs font-bold text-slate-800">
            <span className="truncate max-w-[150px]">{trip.origin.name.replace(' (Cidade Universitária)', '')}</span>
            <span className="text-slate-400">➔</span>
            <span className="truncate max-w-[150px]">{trip.destination.name.replace(' (Cidade Universitária)', '')}</span>
          </div>

          <p className="text-[9px] font-semibold text-slate-500 leading-relaxed pt-1.5 border-t border-slate-100">
            Saída programada para as <strong className="text-slate-800 font-bold">{trip.departureTime}</strong>. 
            Custo total estimado em <strong className="text-slate-800 font-bold">R$ {trip.priceEstimate.toFixed(2)}</strong>.
          </p>
        </div>

        {/* Live pricing recalculated card widget */}
        {trip.type === 'uber' && (
          <div className="p-3.5 bg-slate-900 text-white rounded-md space-y-2 border border-slate-800">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">📊 Recálculo Live com Paradas</span>
              <span className="text-[8px] font-mono text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">Rachado em {totalPeople}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-1.5 bg-white/5 border border-white/10 rounded">
                <span className="text-[8px] text-zinc-400 font-bold block uppercase tracking-wider">UberX Total</span>
                <span className="text-xs font-mono font-bold text-white block">R$ {dynamicUberTotal.toFixed(2)}</span>
                <span className="text-[8px] text-emerald-400 font-bold block mt-0.5">R$ {individualUberSplit.toFixed(2)} /pessoa</span>
              </div>
              <div className="p-1.5 bg-white/5 border border-white/10 rounded">
                <span className="text-[8px] text-zinc-400 font-bold block uppercase tracking-wider">99Pop Total</span>
                <span className="text-xs font-mono font-bold text-white block">R$ {dynamic99Total.toFixed(2)}</span>
                <span className="text-[8px] text-yellow-400 font-bold block mt-0.5">R$ {individual99Split.toFixed(2)} /pessoa</span>
              </div>
            </div>
          </div>
        )}

        {/* Creator Info details */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-slate-900 text-white font-bold rounded-full flex items-center justify-center uppercase leading-none font-mono text-xs">
              {trip.creatorName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[8px] font-bold uppercase text-slate-400">Criado por:</span>
              <h3 className="text-xs font-bold text-slate-800 truncate">{trip.creatorName}</h3>
              <p className="text-[9px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                <Phone className="h-3 w-3 text-slate-400" />
                {trip.creatorPhone}
              </p>
            </div>
          </div>

          {trip.carDetails && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600 font-semibold">
              <span>🚗 {trip.carDetails.model} ({trip.carDetails.color})</span>
              <span className="bg-slate-200 px-2 py-0.5 rounded font-mono font-bold uppercase text-slate-800 text-[9px]">
                Placa: {trip.carDetails.plate}
              </span>
            </div>
          )}
        </div>

        {/* Carona Navigation Launcher (For the driver) */}
        {trip.type === 'carona' && isCreator && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-md space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5 font-sans">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                {isFull ? '🟢 Carro Completo! Partir Agora?' : '🗺️ Rota da sua Carona no GPS'}
              </span>
              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isFull ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-850'
              }`}>
                {isFull ? 'Pronto p/ Rodar' : `${trip.availableSpots} vagas restando`}
              </span>
            </div>
            <p className="text-[10px] text-emerald-800 leading-normal font-semibold font-sans">
              {isFull 
                ? 'Sua carona está com todas as vagas preenchidas! Clique no botão abaixo para abrir a rota otimizada diretamente no GPS (Google Maps) com todos os pontos de embarque/desembarque de seus passageiros calculados.'
                : 'Abra a rota da sua carona diretamente no GPS (Google Maps) para navegar de forma interativa de sua origem ao destino, calculando as paradas/desvios planejados.'
              }
            </p>
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 text-center shadow-sm font-sans transition-all"
            >
              Abrir Rota no Mapa <ExternalLink className="h-3.5 w-3.5 text-white" />
            </a>
          </div>
        )}

        {/* Ajustar Rota do Carro (Only for Driver of a Carona) */}
        {isCreator && trip.type === 'carona' && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-sm border border-emerald-250">
                🛠️ Ajustar Rota (Dono do Carro)
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                {trip.customStops?.length || 0} paradas extras
              </span>
            </div>

            <p className="text-[10px] text-slate-600 leading-normal font-semibold">
              Você pode customizar o trajeto inserindo pontos de desvio ou paradas para contemplar as pessoas da carona:
            </p>

            {/* List current driver custom stops */}
            {trip.customStops && trip.customStops.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Trajeto Alterado com Desvios:</span>
                <div className="space-y-1.5">
                  {trip.customStops.map((cstop, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200 text-xs">
                      <div className="truncate pr-2">
                        <span className="block font-bold text-slate-850 text-[10px] truncate">
                          📍 Desvio {idx + 1}: {cstop.name}
                        </span>
                        <span className="block text-[8px] text-slate-400 truncate leading-tight mt-0.5">
                          {cstop.address}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateTripStops) {
                            const updated = (trip.customStops || []).filter((_, sIdx) => sIdx !== idx);
                            onUpdateTripStops(trip.id, updated);
                          }
                        }}
                        className="text-[8px] font-bold text-rose-700 hover:text-rose-900 shrink-0 px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 uppercase tracking-wider"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form to add a stop */}
            {driverWantsCustomStop ? (
              <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-md shadow-sm">
                <div className="space-y-1">
                  <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Nome ou Descrição do Ponto</span>
                  <input
                    type="text"
                    value={driverStopPoint.name}
                    onChange={(e) => setDriverStopPoint({ ...driverStopPoint, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-850 font-bold focus:outline-none focus:border-black"
                    placeholder="Ex: Próximo à padaria, Posto de gasolina"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-500">Clique no mapa abaixo para selecionar a localização do desvio:</span>
                  
                  {/* Interactive picker */}
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <MapComponent 
                      origin={trip.origin} 
                      destination={trip.destination} 
                      onPositionSelected={(pt) => {
                        setDriverStopPoint({
                          ...driverStopPoint,
                          address: pt.address || 'Localização marcada pelo motorista',
                          lat: pt.lat,
                          lng: pt.lng
                        });
                      }}
                      interactiveLabel="Clique para marcar o ponto do desvio"
                    />
                  </div>

                  <div className="p-2 bg-slate-50 rounded border border-slate-100 text-[9px] font-semibold text-slate-700">
                    <span className="block text-[8px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Ponto Selecionado:</span>
                    <span className="block text-slate-850 truncate font-bold mt-1">📍 {driverStopPoint.name}</span>
                    <span className="block text-[8px] text-slate-400 font-normal truncate mt-0.5">{driverStopPoint.address}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateTripStops) {
                        const updated = [...(trip.customStops || []), driverStopPoint];
                        onUpdateTripStops(trip.id, updated);
                        setDriverWantsCustomStop(false);
                        // Reset to default
                        setDriverStopPoint({
                          name: 'Ponto de Coleta da Carona',
                          address: 'Clique no mapa abaixo para marcar o desvio',
                          lat: -22.39,
                          lng: -41.80
                        });
                      }
                    }}
                    className="flex-1 py-1.5 bg-black text-white hover:bg-slate-850 rounded text-[9px] font-bold uppercase tracking-wider shadow"
                  >
                    Salvar Novo Desvio
                  </button>
                  <button
                    type="button"
                    onClick={() => setDriverWantsCustomStop(false)}
                    className="py-1.5 px-3 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 rounded text-[9px] font-bold uppercase tracking-wider"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDriverWantsCustomStop(true)}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded font-bold text-[9px] uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                Alterar Trajeto / Adicionar Desvio
              </button>
            )}
          </div>
        )}

        {/* Current Passengers List, highlighting individual stops if informed */}
        <div className="space-y-2">
          <h3 className="text-[9px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            Parceiros de Trajeto ({trip.passengers.length}/{trip.maxSpots} vagas ocupadas)
          </h3>
          
          <div className="space-y-2">
            {trip.passengers.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic font-semibold pl-1">
                Por enquanto, sem passageiros cadastrados nesta rota. Peça para entrar abaixo!
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {trip.passengers.map((passenger) => (
                  <div key={passenger.matricula} className="p-2.5 bg-slate-50 rounded-md border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-850 uppercase font-mono">
                        {passenger.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <span className="block text-[10px] font-bold text-slate-850 truncate">{passenger.name}</span>
                        {passenger.stopLocation ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[8px] font-bold mt-0.5 truncate max-w-[200px]">
                            <MapPin className="h-2.5 w-2.5 text-indigo-500" />
                            Parada: {passenger.stopLocation.name}
                          </span>
                        ) : (
                          <span className="block text-[8px] text-slate-400 italic">Parada Padrão do Trajeto</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                      Vaga Ativa
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Toggle Button (Join/Leave) - Includes Stop picking selection for incoming passengers */}
        {!isCreator && (
          <div className="space-y-3 pt-2">
            {isPassenger ? (
              <button
                onClick={() => onLeaveTrip(trip.id)}
                className="w-full py-2.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 rounded-md font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                Desistir da Minha Vaga (Sair)
              </button>
            ) : (
              <div className="space-y-3">
                {/* Join Form incorporating accurate map pinpointing for dropoffs */}
                {!isFull && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Onde você vai ficar / descer?</h4>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setWantsCustomStop(false)}
                          className={`px-2 py-1 text-[8px] uppercase font-bold rounded border transition-colors ${
                            !wantsCustomStop 
                              ? 'bg-black text-white border-black shadow' 
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Parada Padrão
                        </button>
                        <button
                          type="button"
                          onClick={() => setWantsCustomStop(true)}
                          className={`px-2 py-1 text-[8px] uppercase font-bold rounded border transition-colors flex items-center gap-1 ${
                            wantsCustomStop 
                              ? 'bg-black text-white border-black shadow' 
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          <MapPin className="h-2 w-2 text-indigo-500" />
                          No Mapa (Exato)
                        </button>
                      </div>
                    </div>

                    {wantsCustomStop && (
                      <div className="space-y-2">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Clique no mapa para marcar sua parada exata:</span>
                        
                        {/* Interactive map centered on route */}
                        <div className="border border-slate-200 rounded">
                          <MapComponent 
                            origin={trip.origin} 
                            destination={trip.destination} 
                            onPositionSelected={(pt) => {
                              setSelectedPassengerStop(pt);
                            }}
                            interactiveLabel="Clique no mapa para definir sua PARADA exata"
                          />
                        </div>

                        <div className="p-2 bg-white border border-slate-200 rounded font-semibold">
                          <span className="text-[8px] text-indigo-600 font-bold block uppercase tracking-wider">Ponto Selecionado:</span>
                          <span className="text-[9px] text-slate-800 font-bold block truncate mt-0.5">
                            📍 {selectedPassengerStop.name}
                          </span>
                          <span className="text-[8px] text-slate-400 block truncate font-normal">
                            {selectedPassengerStop.address}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        onJoinTrip(trip.id, wantsCustomStop ? selectedPassengerStop : undefined);
                      }}
                      className="w-full py-2.5 bg-black hover:bg-slate-850 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <UserPlus className="h-4 w-4" />
                      Garantir Vaga {wantsCustomStop ? 'com Parada Custom' : '(Parada Padrão)'}
                    </button>
                  </div>
                )}

                {isFull && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded text-center text-[10px] text-slate-500 font-bold uppercase">
                    🚫 Viagem Cheia (Todas as vagas preenchidas)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Complete multi-stop step-by-step itinerary copiable block representation */}
        {trip.type === 'uber' && (isPassenger || isCreator) && (
          <div className="p-4 bg-slate-900 text-white rounded-md space-y-3.5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-emerald-400" />
                Navegador e Paradas da Corrida
              </h4>
              <span className="text-[8px] font-bold text-emerald-400 border border-emerald-400/20 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                Pronto p/ Rodar
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-[9.5px] text-slate-300 leading-relaxed font-semibold">
                Copie os endereços em sequência para colar no app da Uber/99 ou use um redirecionamento abaixo:
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded text-[8px] text-amber-200 leading-normal font-sans">
                💡 <strong>Dica de Uso:</strong> Use o botão <strong>"Abrir em nova aba"</strong> no topo para que seu navegador e celular gerenciem a abertura das rotas com facilidade.
              </div>
            </div>

            {/* Direct Multi-Stop Deep links & Easy Launch Cards */}
            <div className="space-y-3">
              {/* Simplified Platform Launchers */}
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-md space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white block">🚀 Escolha seu Aplicativo de Corrida</span>
                <p className="text-[9px] text-zinc-300 leading-normal">
                  Abra o aplicativo abaixo de sua preferência e insira a rota manualmente usando os endereços da lista de cópia rápida abaixo.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                  <a
                    href={uberWebPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 bg-white hover:bg-slate-100 text-black rounded text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 text-center shadow-sm font-sans"
                  >
                    Abrir Uber <ExternalLink className="h-3 w-3 text-slate-600" />
                  </a>
                  <a
                    href={r99WebPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 bg-[#FFCC00] hover:bg-[#E6B800] text-black rounded text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 text-center shadow-sm font-sans"
                  >
                    Abrir 99 <ExternalLink className="h-3 w-3 text-slate-800" />
                  </a>
                </div>
              </div>
            </div>

            {/* Itinerary Copier list */}
            <div className="space-y-1.5 bg-white/5 p-3 rounded-md border border-white/10">
              <span className="text-[8px] text-zinc-400 font-bold block uppercase tracking-wider mb-1 text-center">📋 Copiar Endereços para colar no Uber / 99</span>
              
              {/* Origin */}
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[8px]">
                <div className="truncate flex-1">
                  <strong className="text-white">Partida:</strong> <span className="text-zinc-300">{trip.origin.address}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(trip.origin.address, 'origin')}
                  className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1 transition-all"
                >
                  {copiedId === 'origin' ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2.5 w-2.5" />}
                  {copiedId === 'origin' ? 'Feito' : 'Copiar'}
                </button>
              </div>

              {/* Stops from passengers */}
              {activeStops.map((stop, sidx) => (
                <div key={sidx} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[8px]">
                  <div className="truncate flex-1">
                    <strong className="text-emerald-400">Stop {sidx + 1}:</strong> <span className="text-zinc-300">{stop.address}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(stop.address, `stop_${sidx}`)}
                    className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1 transition-all"
                  >
                    {copiedId === `stop_${sidx}` ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2.5 w-2.5" />}
                    {copiedId === `stop_${sidx}` ? 'Feito' : 'Copiar'}
                  </button>
                </div>
              ))}

              {/* Final Destination */}
              <div className="flex items-center justify-between gap-2 text-[8px]">
                <div className="truncate flex-1">
                  <strong className="text-white">Chegada:</strong> <span className="text-zinc-300">{trip.destination.address}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(trip.destination.address, 'dest')}
                  className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1 transition-all"
                >
                  {copiedId === 'dest' ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2.5 w-2.5" />}
                  {copiedId === 'dest' ? 'Feito' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat window coordination box */}
        <div className="border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col h-[220px]">
          <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-slate-600" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Coordenação e Mensagens</span>
          </div>

          {/* Conversation messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50/20">
            {trip.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-[9px] text-slate-400 italic font-semibold">Mande um oi para organizar o ponto de encontro!</span>
              </div>
            ) : (
              trip.messages.map((msg) => {
                const messageFromSelf = msg.senderMatricula === currentStudent.matricula;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      messageFromSelf ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <span className="text-[8px] text-slate-400 px-1 font-bold">
                      {msg.senderName.split(' ')[0]} • {msg.timestamp}
                    </span>
                    <div className={`p-2 rounded mt-0.5 leading-relaxed break-words text-[10px] ${
                      messageFromSelf 
                        ? 'bg-black text-white font-semibold' 
                        : 'bg-white text-slate-850 border border-slate-200 shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Message form input */}
          <form onSubmit={handleSendChatMessage} className="p-1.5 border-t border-slate-200 flex gap-1.5 bg-slate-50">
            <input
              type="text"
              placeholder="Digite sua mensagem de encontro..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-white border border-slate-200 text-xs text-slate-800 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-semibold"
            />
            <button
              type="submit"
              className="px-3 bg-black hover:bg-slate-850 text-white rounded-md transition-colors"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      </div>
      <div className="pb-4" />
    </div>
  );
}
