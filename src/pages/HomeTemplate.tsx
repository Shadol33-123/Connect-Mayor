import Button from '@/components/ui/Button';
import OutlineButton from '@/components/ui/OutlineButton';
import Pill from '@/components/ui/Pill';
import StatBadge from '@/components/ui/StatBadge';

export default function HomeTemplate() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-blue-600 text-white">
  {/* Nav provided by PublicLayout */}

      <header className="w-full px-4 sm:px-6 lg:px-12 py-10 sm:py-12 lg:py-16 grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
        <div>
          <Pill className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white mb-6">✨ Aprende paso a paso</Pill>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
            Tecnología para <span className="block bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">personas mayores</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-50 mb-8">Clases simples, ejercicios guiados y una comunidad que acompaña. <span className="font-bold text-cyan-200">¡Sin enredos!</span></p>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button className="text-base px-8 py-3">🚀 Empezar ahora</Button>
            <OutlineButton size="lg">🎯 Hacer test</OutlineButton>
          </div>
          <div className="flex items-center gap-6 sm:gap-8">
            <StatBadge color="cyan">120+ estudiantes activos</StatBadge>
            <StatBadge color="indigo">100% gratuito</StatBadge>
          </div>
        </div>
        <div>
          <div className="relative rounded-3xl p-4 sm:p-6 bg-white/20 backdrop-blur shadow-2xl">
            <div className="aspect-video rounded-2xl bg-white/70 grid place-items-center">
              <img src="/logo.png" className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full shadow-2xl" alt="Connect" />
            </div>
            <div className="absolute -bottom-6 left-6 bg-white rounded-2xl shadow-xl px-4 py-3 text-slate-800">
              <div className="text-2xl font-extrabold">120+</div>
              <div className="text-xs">alumnos aprendiendo</div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}