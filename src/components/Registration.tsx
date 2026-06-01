import React, { useState } from 'react';
import { Student, MOCK_STUDENTS } from '../types';
import { User, Key, CheckCircle, Car, ArrowRight, BookOpen } from 'lucide-react';

interface RegistrationProps {
  onRegister: (student: Student) => void;
}

export default function Registration({ onRegister }: RegistrationProps) {
  const [matricula, setMatricula] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hasCar, setHasCar] = useState(false);
  
  // Car details
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [carActiveSpots, setCarActiveSpots] = useState(3);

  const [error, setError] = useState('');

  // Handle mock template fast-logins
  const handleFastLogin = (mockStudent: Student) => {
    onRegister(mockStudent);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!matricula || !name || !phone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (matricula.length < 4) {
      setError('O número de matrícula deve ter pelo menos 4 dígitos.');
      return;
    }

    if (hasCar && (!carModel || !carColor || !carPlate)) {
      setError('Por favor, preencha as especificações do seu veículo.');
      return;
    }

    const newStudent: Student = {
      matricula,
      name,
      phone,
      hasCar,
      ...(hasCar ? { carModel, carColor, carPlate, carActiveSpots } : {})
    };

    onRegister(newStudent);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-md border border-slate-200 shadow-sm mt-6">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mb-3 mx-auto">
          <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
        </div>
        <h1 className="text-xl font-bold tracking-tight uppercase text-emerald-600 flex items-center justify-center gap-1">
          Caronas <span className="text-slate-900 font-bold">FeMASS</span>
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
          Mobilidade Estudantil Segura e Colaborativa
        </p>
        <p className="text-[11px] text-slate-500 mt-2 max-w-xs mx-auto font-medium">
          Caronas seguras e Uber compartilhado exclusivo para universitários da Faculdade Professor Miguel Ângelo da Silva Santos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 font-medium text-xs rounded-md border border-red-150">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Número de Matrícula *
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <input
              type="text"
              placeholder="Ex: 20241029"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-slate-800 font-medium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Nome Completo *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <input
              type="text"
              placeholder="Ex: Marina Albuquerque"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-slate-800 font-medium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Celular / WhatsApp *
          </label>
          <input
            type="text"
            placeholder="Ex: (22) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-slate-800 font-medium"
            required
          />
        </div>

        {/* Car Checkbox Toggle */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-md ${hasCar ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <Car className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">Eu possuo carro de passeio</span>
              <span className="text-[10px] text-slate-500">Permite registrar rotas de carona</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={hasCar}
            onChange={(e) => setHasCar(e.target.checked)}
            className="w-4 h-4 text-slate-950 border-slate-300 rounded focus:ring-black focus:ring-offset-0"
          />
        </div>

        {/* Vehicle Fields */}
        {hasCar && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3.5 animate-fadeIn">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Especificações do Veículo</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Modelo do Carro *</label>
                <input
                  type="text"
                  placeholder="Ex: Corolla"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-slate-800 font-semibold focus:ring-1 focus:ring-black"
                  required={hasCar}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cor *</label>
                <input
                  type="text"
                  placeholder="Ex: Preto"
                  value={carColor}
                  onChange={(e) => setCarColor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-slate-800 font-semibold focus:ring-1 focus:ring-black"
                  required={hasCar}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Placa *</label>
                <input
                  type="text"
                  placeholder="Ex: BRA2E19"
                  value={carPlate}
                  onChange={(e) => setCarPlate(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-slate-800 font-semibold focus:ring-1 focus:ring-black font-mono"
                  required={hasCar}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vagas Padrão *</label>
                <select
                  value={carActiveSpots}
                  onChange={(e) => setCarActiveSpots(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-slate-800 font-semibold focus:ring-1 focus:ring-black"
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
          className="w-full py-3 bg-black text-white hover:bg-slate-800 rounded-md font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-1.5"
        >
          INICIAR NA PLATAFORMA <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Demo Quick Logins */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <span className="block text-center text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3.5">
          Para Testar rapidamente (Escolha um Perfil)
        </span>
        <div className="grid grid-cols-1 gap-2">
          {MOCK_STUDENTS.map((student) => (
            <button
              key={student.matricula}
              onClick={() => handleFastLogin(student)}
              className="w-full p-3 rounded-md border border-slate-200 hover:border-black hover:bg-slate-50 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded ${student.hasCar ? 'bg-slate-100 text-slate-850' : 'bg-slate-50 text-slate-500'}`}>
                  {student.hasCar ? <Car className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-850 group-hover:text-slate-950">
                    {student.name}
                  </span>
                  <span className="block text-[9px] text-slate-500 font-mono">
                     {student.hasCar ? `Carona (${student.carModel})` : 'Passageiro'}
                  </span>
                </div>
              </div>
              <CheckCircle className="h-4 w-4 text-slate-300 group-hover:text-black transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
