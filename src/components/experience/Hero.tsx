import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [fails, setFails] = useState(0);
  const navigate = useNavigate();

  const handleLeftClick = () => {
    if (step === 1) setStep(2); else if (step > 0) handleFail();
  };
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step === 2) setStep(3); else if (step > 0) handleFail();
  };
  const handleFail = () => {
    setFails(f => {
      const next = f + 1;
      if (next >= 3) navigate('/lessons');
      return next;
    });
  };
  const startTest = () => { setStep(1); setFails(0); setName(''); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 3 && name.trim() && name === name.toLowerCase()) {
      // simple reset success
      setStep(0); setName(''); setFails(0);
    } else { handleFail(); }
  };
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-b-3xl pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-cyan-300/20 blur-2xl animate-pulse" />
      </div>
      <div className="max-w-6xl mx-auto px-6 pt-14 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-block mb-4 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold">✨ Aprende paso a paso</div>
          <h1 className="font-black leading-tight text-4xl sm:text-5xl md:text-6xl mb-5">
            Tecnología para <span className="block bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">personas mayores</span>
          </h1>
            <p className="text-lg md:text-xl text-blue-50 max-w-lg mb-8">Clases simples, ejercicios guiados y una comunidad que acompaña <span className="font-bold text-cyan-200">¡sin enredos!</span></p>
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button onClick={() => navigate('/lessons')} className="text-lg py-3">🚀 Empezar ahora</Button>
            <Button variant="ghost" onClick={startTest} className="text-lg py-3 border border-white/30 text-white hover:bg-white/10">🎯 Hacer test</Button>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-cyan-300 rounded-full animate-pulse" />120+ estudiantes</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-300 rounded-full animate-pulse" />100% gratuito</div>
          </div>
          {step > 0 && (
            <div className="mt-8 bg-white/95 text-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-lg">
              <div className="text-center mb-4 text-xs font-bold">Intentos: {fails} / 3</div>
              {step === 1 && <p className="font-semibold mb-4">Paso 1: Haz <span className="text-blue-600">click izquierdo</span></p>}
              {step === 2 && <p className="font-semibold mb-4">Paso 2: Haz <span className="text-purple-600">click derecho</span></p>}
              {step === 3 && <p className="font-semibold mb-4">Paso 3: Escribe tu nombre en minúsculas</p>}
              {step < 3 && (
                <button onClick={handleLeftClick} onContextMenu={handleRightClick} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow">¡PRESIONA AQUÍ!</button>
              )}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre..." className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-center" />
                  <Button type="submit" className="w-full">✅ Enviar</Button>
                </form>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center shadow-xl">
            <img src="/logo.png" alt="Connect" className="w-48 h-48 rounded-full border-8 border-white shadow" />
          </div>
        </div>
      </div>
    </header>
  );
}