import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, UserPlus, Search, ArrowRight, DollarSign, Clock, 
  Users, User, Key, BookOpen, Send, Phone, MessageSquare, 
  MapPin, Plus, List, Calendar, Heart, ShieldAlert, Navigation 
} from 'lucide-react';

import { 
  Student, LocationPoint, Trip, POPULAR_PLACES, CAMPUS_POINT, 
  MOCK_INITIAL_TRIPS, FAMAS_COORDINATES 
} from './types';

import MapComponent from './components/MapComponent';
import Registration from './components/Registration';
import CreateRideForm from './components/CreateRideForm';
import RidesList from './components/RidesList';
import RideDetails from './components/RideDetails';
import ProfileTab from './components/ProfileTab';
import LocationSearchModal from './components/LocationSearchModal';

export default function App() {
  // Authentication & Profile States
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem('uniride_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Active trips list (loaded from LocalStorage or pre-populated from Mock data)
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('uniride_trips');
    return saved ? JSON.parse(saved) : MOCK_INITIAL_TRIPS;
  });

  // Navigation states
  // Active Tab: 'inicio' | 'viagens' | 'mensagens' | 'perfil'
  const [activeTab, setActiveTab] = useState<'inicio' | 'viagens' | 'mensagens' | 'perfil'>('inicio');
  
  // Detail views and creation forms
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Search/Pill location selectors
  const [searchOrigin, setSearchOrigin] = useState<LocationPoint | null>(null);
  const [searchDestination, setSearchDestination] = useState<LocationPoint | null>(null);

  // States to control high-fidelity Uber-like Location Selector Popup Modal
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationModalType, setLocationModalType] = useState<'origin' | 'destination'>('origin');

  // Interactive pinpoint selection targets on the home page map ('origin' | 'destination')
  const [homeMapTargetMode, setHomeMapTargetMode] = useState<'origin' | 'destination'>('origin');

  // Active Map Route visualization overrides
  const [activeMapRoute, setActiveMapRoute] = useState<{ origin: LocationPoint; destination: LocationPoint } | null>(null);

  const handleHomeMapPositionSelected = (point: LocationPoint) => {
    if (homeMapTargetMode === 'origin') {
      setSearchOrigin(point);
    } else {
      setSearchDestination(point);
    }
    // De-activate overrides when actively filtering with custom clicked pins
    setActiveMapRoute(null);
  };

  // Save trips to local storage whenever list changes
  useEffect(() => {
    localStorage.setItem('uniride_trips', JSON.stringify(trips));
  }, [trips]);

  // Keep selected trip updated when overall list changes (for real-time message updates)
  useEffect(() => {
    if (selectedTrip) {
      const updated = trips.find(t => t.id === selectedTrip.id);
      if (updated) {
        setSelectedTrip(updated);
      }
    }
  }, [trips, selectedTrip]);

  const handleRegister = (student: Student) => {
    setCurrentStudent(student);
    localStorage.setItem('uniride_user', JSON.stringify(student));
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    localStorage.removeItem('uniride_user');
    // Clear state
    setActiveTab('inicio');
    setSelectedTrip(null);
    setShowCreateForm(false);
  };

  const handleUpdateStudent = (updated: Student) => {
    setCurrentStudent(updated);
    localStorage.setItem('uniride_user', JSON.stringify(updated));
  };

  const handleCreateTrip = (newTrip: Trip) => {
    setTrips([newTrip, ...trips]);
    setShowCreateForm(false);
    // Automatically select the newly created trip to view
    setSelectedTrip(newTrip);
  };

  const handleJoinTrip = (tripId: string, stopLocation?: LocationPoint) => {
    if (!currentStudent) return;
    
    setTrips(prevTrips => 
      prevTrips.map(trip => {
        if (trip.id === tripId) {
          // Verify if already registered or if spots are full
          const isRegistered = trip.passengers.some(p => p.matricula === currentStudent.matricula);
          if (isRegistered || trip.availableSpots === 0) return trip;
          
          return {
            ...trip,
            availableSpots: trip.availableSpots - 1,
            passengers: [...trip.passengers, { ...currentStudent, stopLocation }]
          };
        }
        return trip;
      })
    );
  };

  const handleLeaveTrip = (tripId: string) => {
    if (!currentStudent) return;

    setTrips(prevTrips =>
      prevTrips.map(trip => {
        if (trip.id === tripId) {
          const isRegistered = trip.passengers.some(p => p.matricula === currentStudent.matricula);
          if (!isRegistered) return trip;

          return {
            ...trip,
            availableSpots: trip.availableSpots + 1,
            passengers: trip.passengers.filter(p => p.matricula !== currentStudent.matricula)
          };
        }
        return trip;
      })
    );
  };

  const handleSendMessage = (tripId: string, text: string) => {
    if (!currentStudent) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderMatricula: currentStudent.matricula,
      senderName: currentStudent.name,
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setTrips(prevTrips =>
      prevTrips.map(trip => {
        if (trip.id === tripId) {
          return {
            ...trip,
            messages: [...trip.messages, newMsg]
          };
        }
        return trip;
      })
    );
  };

  const handleUpdateTripStops = (tripId: string, customStops: LocationPoint[]) => {
    setTrips(prevTrips =>
      prevTrips.map(trip => {
        if (trip.id === tripId) {
          return {
            ...trip,
            customStops
          };
        }
        return trip;
      })
    );
  };

  const handleQuickLocate = (orig: LocationPoint | null, dest: LocationPoint | null) => {
    if (orig && dest) {
      setActiveMapRoute({ origin: orig, destination: dest });
    } else {
      setActiveMapRoute(null);
    }
  };

  // If user is not logged in / registered, force registration screen
  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Registration onRegister={handleRegister} />
        </motion.div>
      </div>
    );
  }

  // Filter trips user created or joined for "Minhas Viagens" tab
  const myTrips = trips.filter(trip => 
    trip.creatorMatricula === currentStudent.matricula || 
    trip.passengers.some(p => p.matricula === currentStudent.matricula)
  );

  // Trips with active messages that user participates in for "Mensagens" tab
  const messageTrips = trips.filter(trip => 
    (trip.creatorMatricula === currentStudent.matricula || 
    trip.passengers.some(p => p.matricula === currentStudent.matricula))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-slate-200">
      
      {/* Brand Header & Profile overview */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-5 py-3.5 border-b border-slate-250 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            Caronas<span className="text-slate-900 font-bold">FeMASS</span>
          </h1>
          <span className="text-[9px] font-bold text-slate-400 block tracking-wider leading-none uppercase mt-0.5">
            Mobilidade Estudantil Segura e Colaborativa
          </span>
        </div>

        {/* Small avatar shortcut trigger */}
        <button 
          onClick={() => {
            setActiveTab('perfil');
            setSelectedTrip(null);
            setShowCreateForm(false);
          }}
          className="flex items-center gap-2 p-1 px-2.5 hover:bg-slate-50 rounded transition-all border border-slate-200"
        >
          <div className="h-6 w-6 bg-black text-white font-bold text-[10px] flex items-center justify-center rounded uppercase">
            {currentStudent.name.charAt(0)}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 hidden sm:inline">
            Olá, {currentStudent.name.split(' ')[0]}
          </span>
        </button>
      </header>

      {/* Main viewport Container scrollable */}
      <main className="flex-1 overflow-y-auto pb-24">
        
        {/* If viewing Trip Details */}
        {selectedTrip ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            {/* Visual map preview before details */}
            <div className="mb-4">
              <MapComponent 
                origin={selectedTrip.origin} 
                destination={selectedTrip.destination} 
                selectedTripRoute={{ origin: selectedTrip.origin, destination: selectedTrip.destination }}
                passengerStops={[
                  ...(selectedTrip.customStops || []),
                  ...(selectedTrip.passengers.map(p => p.stopLocation).filter(Boolean) as LocationPoint[])
                ]}
              />
            </div>

            <RideDetails
              trip={selectedTrip}
              currentStudent={currentStudent}
              onJoinTrip={handleJoinTrip}
              onLeaveTrip={handleLeaveTrip}
              onSendMessage={handleSendMessage}
              onUpdateTripStops={handleUpdateTripStops}
              onBack={() => {
                setSelectedTrip(null);
                setActiveMapRoute(null);
              }}
            />
          </motion.div>
        ) : (
          /* Standard Navigation Tabs routing */
          <div>
            {activeTab === 'inicio' && (
              <div className="space-y-4 p-4 animate-fadeIn">
                
                {/* Custom Segmented Controller for Two Key User Intents */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200/60 rounded-lg shrink-0 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                    }}
                    className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      !showCreateForm
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50 font-black'
                        : 'text-slate-550 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <Search className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    Ver Viagens Disponíveis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(true);
                    }}
                    className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      showCreateForm
                        ? 'bg-black text-white shadow-sm font-black'
                        : 'text-slate-550 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Publicar Rota (Carona/Uber)
                  </button>
                </div>

                {!showCreateForm ? (
                  /* Option 1: View active published trips waiting for collaborators, with location search */
                  <div className="space-y-4">
                    {/* Floating Search Widget (replica of standard Uber layouts) */}
                    <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-3.5">
                      <div className="flex items-center gap-3">
                        {/* Visual left indicator dots connected by real line */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="h-3 w-3 rounded-full bg-slate-900 flex items-center justify-center">
                            <div className="h-1 w-1 bg-white rounded-full animate-pulse" />
                          </div>
                          <div className="h-7 border-l-2 border-dashed border-slate-350" />
                          <div className="h-3 w-3 bg-black flex items-center justify-center rotate-45">
                            <div className="h-1 w-1 bg-white shrink-0" />
                          </div>
                        </div>

                        <div className="flex-1 space-y-2.5">
                          {/* Search Origin Bar Input Trigger */}
                          <div 
                            onClick={() => {
                              setLocationModalType('origin');
                              setIsLocationModalOpen(true);
                            }}
                            className="group flex items-center justify-between py-2 px-3 bg-slate-50 border border-slate-200 hover:border-black cursor-pointer rounded-md transition-all text-slate-800"
                          >
                            <div className="truncate flex-1">
                              <span className="block text-[7px] uppercase font-bold text-slate-400 tracking-wider">Origem (Partida)</span>
                              {searchOrigin ? (
                                <span className="block text-xs font-bold text-slate-950 truncate">
                                  📍 {searchOrigin.name}
                                </span>
                              ) : (
                                <span className="block text-xs font-semibold text-slate-400 italic">
                                  De onde você está saindo?
                                </span>
                              )}
                            </div>
                            {searchOrigin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchOrigin(null);
                                }}
                                className="p-1 text-slate-400 hover:text-black hover:bg-slate-200 rounded shrink-0 ml-2 text-[9px] font-bold"
                              >
                                Zerar
                              </button>
                            )}
                          </div>

                          {/* Search Destination Bar Input Trigger */}
                          <div 
                            onClick={() => {
                              setLocationModalType('destination');
                              setIsLocationModalOpen(true);
                            }}
                            className="group flex items-center justify-between py-2 px-3 bg-slate-50 border border-slate-200 hover:border-black cursor-pointer rounded-md transition-all text-slate-800"
                          >
                            <div className="truncate flex-1">
                              <span className="block text-[7px] uppercase font-bold text-slate-400 tracking-wider">Destino (Chegada)</span>
                              {searchDestination ? (
                                <span className="block text-xs font-bold text-slate-950 truncate">
                                  🏁 {searchDestination.name}
                                </span>
                              ) : (
                                <span className="block text-xs font-semibold text-slate-400 italic">
                                  Para onde você vai?
                                </span>
                              )}
                            </div>
                            {searchDestination && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchDestination(null);
                                }}
                                className="p-1 text-slate-400 hover:text-black hover:bg-slate-200 rounded shrink-0 ml-2 text-[9px] font-bold"
                              >
                                Zerar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reset coordinates button if coordinates exist */}
                      {(searchOrigin || searchDestination) && (
                        <button
                          onClick={() => {
                            setSearchOrigin(null);
                            setSearchDestination(null);
                          }}
                          className="text-[9px] text-center w-full font-bold uppercase tracking-wider text-slate-550 hover:text-black hover:underline pt-2 border-t border-slate-150 block"
                        >
                          Limpar Filtros de Localização
                        </button>
                      )}
                    </div>

                    {/* Map interface preview - only rendered when query routes exist */}
                    {searchOrigin && searchDestination ? (
                      <MapComponent 
                        origin={searchOrigin} 
                        destination={searchDestination} 
                        selectedTripRoute={activeMapRoute}
                        onPositionSelected={handleHomeMapPositionSelected}
                        interactiveLabel="Visualizando Rota"
                      />
                    ) : (
                      <div className="p-6 bg-slate-50 border border-dashed border-slate-250 text-center rounded-md space-y-2">
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-600">📍 Visualização de Rota Geral</p>
                        <p className="text-[9.5px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                          Por favor, digite ou selecione uma <strong>Origem</strong> e um <strong>Destino</strong> nos campos de busca acima. O mapa exibirá o trajeto exato com ruas e estimativas assim que ambos estiverem definidos!
                        </p>
                      </div>
                    )}

                    {/* Uber-like Location Selection Overlay Modal */}
                    <LocationSearchModal
                      isOpen={isLocationModalOpen}
                      onClose={() => setIsLocationModalOpen(false)}
                      title={locationModalType === 'origin' ? "Escolher Origem (Partida)" : "Escolher Destino (Chegada)"}
                      type={locationModalType}
                      initialValue={locationModalType === 'origin' ? searchOrigin : searchDestination}
                      onConfirm={(point) => {
                        if (locationModalType === 'origin') {
                          setSearchOrigin(point);
                        } else {
                          setSearchDestination(point);
                        }
                        setActiveMapRoute(null);
                      }}
                    />


                    {/* Main listings list */}
                    <RidesList 
                      trips={trips} 
                      onSelectTrip={setSelectedTrip} 
                      onQuickLocate={handleQuickLocate}
                    />
                  </div>
                ) : (
                  /* Option 2: Publish/Creation form (automatically receives searchOrigin and searchDestination) */
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CreateRideForm
                      currentStudent={currentStudent}
                      onCreateTrip={handleCreateTrip}
                      onCancel={() => setShowCreateForm(false)}
                      initialOrigin={searchOrigin}
                      initialDestination={searchDestination}
                    />
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'viagens' && (
              <div className="space-y-4 p-4 animate-fadeIn">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Minhas Viagens</h2>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {myTrips.length} cadastradas
                  </span>
                </div>

                {myTrips.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-md border border-slate-200 shadow-sm space-y-3.5">
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">Você ainda não criou rotas ou pediu caroninha em nenhuma viagem.</p>
                    <button
                      onClick={() => setActiveTab('inicio')}
                      className="inline-flex py-2 px-4 bg-black hover:bg-slate-800 text-white text-[10px] font-bold rounded-md uppercase tracking-wider transition shadow-sm"
                    >
                      Procurar Trajetos Ativos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTrips.map(trip => {
                      const isCreator = trip.creatorMatricula === currentStudent.matricula;
                      return (
                        <div
                          key={trip.id}
                          onClick={() => handleRideClickFromMenu(trip)}
                          className="p-4 bg-white border border-slate-200 hover:border-slate-400 rounded-md cursor-pointer hover:shadow-sm transition-all flex items-center justify-between shadow-sm relative overflow-hidden"
                        >
                          <div className="space-y-1.5 flex-1 pr-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[12px] uppercase tracking-wide text-slate-850">{trip.origin.name.replace(' (Cidade Universitária)', '')}</span>
                              <ArrowRight className="h-3 w-3 text-slate-400" />
                              <span className="font-bold text-[12px] uppercase tracking-wide text-slate-850">{trip.destination.name.replace(' (Cidade Universitária)', '')}</span>
                            </div>

                            <div className="flex items-center gap-3.5 text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-250">{trip.departureTime}</span>
                              <span className="flex items-center gap-1 font-semibold">
                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                {trip.passengers.length} passageiro(s) nisto
                              </span>
                            </div>

                            <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isCreator 
                                ? 'bg-black text-white' 
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {isCreator ? 'Motorista / Criador' : 'Vaga Garantida'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="block text-xs font-bold text-slate-800 mb-2">R$ {trip.priceEstimate.toFixed(2)}</span>
                            <div className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded text-[9px] uppercase tracking-wider font-bold text-slate-700 hover:bg-slate-100">
                              Gerenciar
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mensagens' && (
              <div className="space-y-4 p-4 animate-fadeIn">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Suas Conversas</h2>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {messageTrips.length} chat(s)
                  </span>
                </div>

                {messageTrips.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-md border border-slate-200 shadow-sm space-y-2">
                    <p className="text-xs text-slate-500 font-semibold">Sem chats ativos. Mande mensagens após garantir sua vaga em algum trajeto!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messageTrips.map(trip => {
                      const lastMsg = trip.messages[trip.messages.length - 1];
                      return (
                        <div
                          key={trip.id}
                          onClick={() => handleRideClickFromMenu(trip)}
                          className="p-4 bg-white border border-slate-200 hover:border-slate-400 rounded-md cursor-pointer hover:shadow-sm transition-all flex items-start gap-3.5 shadow-sm"
                        >
                          <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-850 truncate max-w-[160px] uppercase tracking-wide">
                                Chat: {trip.origin.name.replace(' (Cidade Universitária)', '')} ➔ {trip.destination.name.replace(' (Cidade Universitária)', '')}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono font-bold border border-slate-200 bg-slate-50 px-1 py-0.5 rounded">{trip.departureTime}</span>
                            </div>
                            <p className="text-[10px] text-slate-550 truncate font-semibold">
                              {lastMsg ? (
                                <span><strong>{lastMsg.senderName.split(' ')[0]}: </strong>{lastMsg.text}</span>
                              ) : (
                                <span className="text-slate-400 italic">Sem mensagens enviadas. Envie um oi!</span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'perfil' && (
              <div className="p-4 animate-fadeIn">
                <ProfileTab
                  student={currentStudent}
                  onLogout={handleLogout}
                  onUpdateStudent={handleUpdateStudent}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Persistent Bottom navigation menu bar (Matches screenshot perfectly) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 flex justify-between items-center shadow-md">
        {/* Navigation Tab: Inicio */}
        <button
          onClick={() => {
            setActiveTab('inicio');
            setSelectedTrip(null);
            setShowCreateForm(false);
          }}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            activeTab === 'inicio' ? 'text-black font-bold' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <MapPin className="h-5 w-5" strokeWidth={activeTab === 'inicio' ? 2.5 : 2} />
          <span className="text-[9px] uppercase tracking-wider font-bold">Início</span>
        </button>

        {/* Navigation Tab: Minhas Viagens */}
        <button
          onClick={() => {
            setActiveTab('viagens');
            setSelectedTrip(null);
            setShowCreateForm(false);
          }}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            activeTab === 'viagens' ? 'text-black font-bold' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <Calendar className="h-5 w-5" strokeWidth={activeTab === 'viagens' ? 2.5 : 2} />
          <span className="text-[9px] uppercase tracking-wider font-bold">Viagens</span>
        </button>

        {/* Navigation Tab: Mensagens */}
        <button
          onClick={() => {
            setActiveTab('mensagens');
            setSelectedTrip(null);
            setShowCreateForm(false);
          }}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            activeTab === 'mensagens' ? 'text-black font-bold' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <MessageSquare className="h-5 w-5" strokeWidth={activeTab === 'mensagens' ? 2.5 : 2} />
          <span className="text-[9px] uppercase tracking-wider font-bold">Mensagens</span>
        </button>

        {/* Navigation Tab: Perfil */}
        <button
          onClick={() => {
            setActiveTab('perfil');
            setSelectedTrip(null);
            setShowCreateForm(false);
          }}
          className={`flex flex-col items-center gap-0.5 transition-colors relative ${
            activeTab === 'perfil' ? 'text-black font-bold' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <User className="h-5 w-5" strokeWidth={activeTab === 'perfil' ? 2.5 : 2} />
          <span className="text-[9px] uppercase tracking-wider font-bold">Perfil</span>
          
          {/* Subtle profile indicator dots */}
          {currentStudent.hasCar && (
            <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-black border border-white" />
          )}
        </button>
      </nav>
    </div>
  );

  function handleRideClickFromMenu(trip: Trip) {
    setSelectedTrip(trip);
  }
}
