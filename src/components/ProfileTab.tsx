import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { 
  User, Car, Phone, ShieldCheck, Award, 
  MapPin, LogOut, Check, Sparkles, TrendingDown, Leaf,
  Key
} from 'lucide-react';

interface ProfileTabProps {
  student: Student;
  onLogout: () => void;
  onUpdateStudent: (updated: Student) => void;
}

export default function ProfileTab({ student, onLogout, onUpdateStudent }: ProfileTabProps) {
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [carModel, setCarModel] = useState(student.carModel || '');
  const [carColor, setCarColor] = useState(student.carColor || '');
  const [carPlate, setCarPlate] = useState(student.carPlate || '');
  const [carActiveSpots, setCarActiveSpots] = useState(student.carActiveSpots || 3);
  const [hasCar, setHasCar] = useState(student.hasCar);

  const [message, setMessage] = useState('');
  
  // Custom API key states
  const [customKey, setCustomKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('CUSTOM_GOOGLE_MAPS_API_KEY') || '';
      setCustomKey(savedKey);
      setIsKeySaved(Boolean(savedKey.trim()));
    }
  }, []);

  const handleSaveKey = () => {
    if (typeof window !== 'undefined') {
      if (customKey.trim()) {
        localStorage.setItem('CUSTOM_GOOGLE_MAPS_API_KEY', customKey.trim());
        setIsKeySaved(true);
        setMessage('VITE_GOOGLE_MAPS_PLATFORM_KEY salva! Recarregando a tela...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        alert('Por favor digite uma chave de API válida.');
      }
    }
  };

  const handleClearKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('CUSTOM_GOOGLE_MAPS_API_KEY');
      setCustomKey('');
      setIsKeySaved(false);
      setMessage('Chave personalizada removida! Restaurando simulação padrão...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (hasCar && (!carModel || !carColor || !carPlate)) {
      alert('Por favor, preencha todas as especificações do veículo.');
      return;
    }

    const updatedStudent: Student = {
      ...student,
      hasCar,
      ...(hasCar ? { carModel, carColor, carPlate, carActiveSpots } : { carModel: undefined, carColor: undefined, carPlate: undefined, carActiveSpots: undefined })
    };

    onUpdateStudent(updatedStudent);
    setIsEditingCar(false);
    setMessage('Perfil atualizado com sucesso!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-md mx-auto p-5 bg-white rounded-md border border-slate-200 shadow-sm space-y-6">
      {/* Header Profile Info card */}
      <div className="p-5 bg-black text-white rounded-md relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estudante FeMASS</span>
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <h2 className="text-base font-bold uppercase tracking-tight">{student.name}</h2>
          <span className="block text-[11px] text-slate-400 font-mono">Matrícula: {student.matricula}</span>
        </div>

        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-sm text-black uppercase border border-slate-200 shadow-sm">
          {student.name.charAt(0)}
        </div>
      </div>

      {message && (
        <div className="p-3 bg-slate-50 text-slate-800 text-xs font-bold rounded-md border border-slate-200 flex items-center gap-1.5">
          <Check className="h-4 w-4" />
          {message}
        </div>
      )}

      {/* Sustainable & Savings Impact Metrics */}
      <div>
        <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-slate-700" />
          Seu Impacto Acadêmico Caronas FeMASS
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {/* Carbon Footprint reduction */}
          <div className="p-3 bg-white border border-slate-200 rounded-md text-center space-y-1">
            <Leaf className="h-4 w-4 text-slate-800 mx-auto" />
            <span className="block text-[9px] text-slate-500 font-bold leading-tight">CO₂ Reduzido</span>
            <span className="text-xs font-bold text-slate-800">12.5 kg</span>
          </div>

          {/* Money Saved */}
          <div className="p-3 bg-white border border-slate-200 rounded-md text-center space-y-1">
            <TrendingDown className="h-4 w-4 text-slate-800 mx-auto" />
            <span className="block text-[9px] text-slate-500 font-bold leading-tight">Economia Est.</span>
            <span className="text-xs font-bold text-slate-850">R$ 148,00</span>
          </div>

          {/* Group Rides */}
          <div className="p-3 bg-white border border-slate-200 rounded-md text-center space-y-1">
            <Award className="h-4 w-4 text-slate-800 mx-auto" />
            <span className="block text-[9px] text-slate-500 font-bold leading-tight">Pontos Uni</span>
            <span className="text-xs font-bold text-slate-800">420 pts</span>
          </div>
        </div>
      </div>

      {/* Personal Contact Info */}
      <div className="space-y-3.5">
        <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Informações de Contato</h3>
        
        <div className="space-y-2">
          <div className="p-3.5 bg-slate-50 rounded-md flex items-center gap-3 border border-slate-200">
            <Phone className="h-4 w-4 text-slate-400" />
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-wider">Celular / WhatsApp</span>
              <span className="text-xs font-bold text-slate-700">{student.phone}</span>
            </div>
          </div>
          
          <div className="p-3.5 bg-slate-50 rounded-md flex items-center gap-3 border border-slate-200">
            <MapPin className="h-4 w-4 text-slate-400" />
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-wider">Campus Principal</span>
              <span className="text-xs font-bold text-slate-750">Macaé - Cidade Universitária FeMASS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Management */}
      <div className="pt-2">
        {isEditingCar ? (
          <form onSubmit={handleSave} className="space-y-4 p-4 border border-slate-200 rounded-md bg-slate-50/50">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Atualizar Dados do Carro</h4>
              <button
                type="button"
                onClick={() => setIsEditingCar(false)}
                className="text-[10px] text-slate-500 hover:text-black font-bold uppercase tracking-wider underline underline-offset-2"
              >
                Cancelar
              </button>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-md flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Habilitar veículo para Caronas</span>
              <input
                type="checkbox"
                checked={hasCar}
                onChange={(e) => setHasCar(e.target.checked)}
                className="w-4 h-4 accent-black text-black rounded"
              />
            </div>

            {hasCar && (
              <div className="space-y-3 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-0.5">Modelo do Carro</label>
                    <input
                      type="text"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                      required={hasCar}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-0.5">Cor</label>
                    <input
                      type="text"
                      value={carColor}
                      onChange={(e) => setCarColor(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                      required={hasCar}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-0.5">Placa do Veículo</label>
                    <input
                      type="text"
                      value={carPlate}
                      onChange={(e) => setCarPlate(e.target.value.toUpperCase())}
                      className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-semibold font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                      required={hasCar}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-0.5">Vagas Disponíveis</label>
                    <select
                      value={carActiveSpots}
                      onChange={(e) => setCarActiveSpots(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    >
                      <option value={1}>1 vaga</option>
                      <option value={2}>2 vagas</option>
                      <option value={3}>3 vagas</option>
                      <option value={4}>4 vagas</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-black hover:bg-slate-850 text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-sm transition-colors"
            >
              Salvar Especificações
            </button>
          </form>
        ) : (
          <div className="p-4 border border-slate-200 rounded-md shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-50 rounded-md text-slate-500 border border-slate-200">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[8px] text-slate-450 uppercase font-bold tracking-wider leading-none">Status de Registro</span>
                <span className="text-xs font-bold text-slate-800">
                  {student.hasCar ? `Veículo Cadastrado (${student.carModel})` : 'Sem Veículo para Caronas'}
                </span>
              </div>
            </div>

            {student.hasCar && (
              <div className="p-3 bg-slate-50 rounded-md space-y-1 border border-slate-200 text-[10px] text-slate-650 font-medium">
                <span className="block">Cor: <strong>{student.carColor}</strong></span>
                <span className="block">Placa: <strong>{student.carPlate}</strong></span>
                <span className="block">Vagas Padrão: <strong>{student.carActiveSpots} vagas</strong></span>
              </div>
            )}

            <button
              onClick={() => setIsEditingCar(true)}
              className="w-full mt-2 py-2 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-705 rounded-md transition-all"
            >
              Atualizar dados do veículo
            </button>
          </div>
        )}
      </div>

      {/* Google Maps Credentials Config (Pente Fino) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-250 text-slate-800 rounded-md border border-slate-3D">
            <Key className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none font-mono">Ajustes do Mapa</span>
            <span className="text-xs font-bold text-slate-850">Chave do Google Maps</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">
          Para desfrutar de rotas de trânsito em tempo real, ruas precisas de Macaé e autocompletar automático ao digitar endereços, cole sua chave da plataforma abaixo:
        </p>

        <div className="space-y-2">
          <input
            type="password"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            placeholder="Cole sua GOOGLE_MAPS_API_KEY aqui"
            className="w-full text-xs font-mono bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveKey}
              className="flex-1 py-1.5 bg-slate-900 hover:bg-black text-white text-[9px] font-bold uppercase tracking-wider rounded transition"
            >
              Ativar Chave Real
            </button>
            {isKeySaved && (
              <button
                type="button"
                onClick={handleClearKey}
                className="py-1.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[9px] font-bold uppercase tracking-wider rounded transition"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {isKeySaved ? (
          <div className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
            Chave Ativa! Toda a geolocalização e rotas são coordenadas em tempo real.
          </div>
        ) : (
          <div className="text-[9px] text-slate-650 font-semibold bg-amber-50 px-2.5 py-1 rounded border border-amber-200/60 leading-normal">
            Nenhuma chave pessoal salva. Utilizando o simulador inteligente integrado configurado para Macaé, RJ.
          </div>
        )}
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full py-2.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm border border-slate-200 flex items-center justify-center gap-1.5 transition-all text-center"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sair / Trocar de Código de Matrícula
      </button>
    </div>
  );
}
