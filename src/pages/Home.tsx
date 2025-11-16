import Button from '@/components/ui/Button';
import OutlineButton from '@/components/ui/OutlineButton';
import Pill from '@/components/ui/Pill';
import { Card } from '@/components/ui/Card';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero full-bleed */}
      <section className="w-full bg-gradient-to-br from-sky-500 to-blue-600 text-white">
        <div className="px-4 sm:px-6 lg:px-12 py-14 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Pill className="bg-white/20 text-white mb-6">✨ Aprende paso a paso</Pill>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
              Tecnología para <span className="block bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">personas mayores</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-50 mb-8">Clases simples, ejercicios guiados y una plataforma que acompaña <span className="font-bold text-cyan-200">¡sin enredos!</span></p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link to="/lessons"><Button className="text-base px-8 py-3">🚀 Empezar ahora</Button></Link>
              <OutlineButton size="lg">🎯 Hacer test</OutlineButton>
            </div>
            <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-white/95">
              <div className="flex items-center gap-2 text-sm md:text-base"><span className="w-3 h-3 rounded-full bg-cyan-200"></span>120+ estudiantes</div>
              <div className="flex items-center gap-2 text-sm md:text-base"><span className="w-3 h-3 rounded-full bg-indigo-200"></span>100% gratuito</div>
              <div className="flex items-center gap-2 text-sm md:text-base"><span className="w-3 h-3 rounded-full bg-pink-200"></span>Actualizaciones semanales</div>
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
        </div>
      </section>

      {/* ¿Por qué elegir? */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 bg-white text-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-3 uppercase tracking-tight">¿Por qué elegir <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Connect! Mayor</span>?</h2>
          <p className="text-center text-slate-600 max-w-3xl mx-auto mb-10">Una plataforma diseñada para enseñar tecnología de forma fácil, práctica y divertida. Pensada para adultos mayores y principiantes.</p>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon="📱" title="Aprende paso a paso">Contenido sencillo, con ejemplos claros y guías visuales.</FeatureCard>
            <FeatureCard icon="📈" title="Progreso visible">Sigue tu avance y celebra logros con insignias y XP.</FeatureCard>
            <FeatureCard icon="🏆" title="Mejora constante">Supera desafíos y mantén la motivación.</FeatureCard>
          </div>
        </div>
      </section>

      {/* Testimonios */}
  <section className="px-4 sm:px-6 lg:px-12 py-20 bg-gradient-to-br from-sky-200 via-sky-300 to-sky-400">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10 text-slate-800 uppercase tracking-tight">Testimonios</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Testimonial icon="👍" text="“Aprendí a usar videollamadas en una tarde.”" author="María, 67" />
            <Testimonial icon="💡" text="“Las lecciones son claras y sin tecnicismos.”" author="Jorge, 72" />
            <Testimonial icon="🚀" text="“Ahora ayudo a mis amigos con sus móviles.”" author="Ana, 64" />
          </div>
        </div>
      </section>

      {/* Explora lecciones */}
  <section className="px-4 sm:px-6 lg:px-12 py-16 bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black mb-3 text-center uppercase tracking-tight">Explora nuestras <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">lecciones</span></h2>
          <div className="text-xl md:text-2xl font-bold mb-10 text-center uppercase tracking-tight text-slate-700">Descubre todo lo que puedes aprender con nosotros</div>
      <div className="grid md:grid-cols-3 gap-8">
            <LessonCard title="Click Trainer: Red & Blue" description="Diferencia clic izquierdo y derecho con este juego."></LessonCard>
            <LessonCard title="Captcha Trainer" description="Practica escribiendo correctamente letras y números."></LessonCard>
            <LessonCard title="Encuentra el ícono" description="Reconoce íconos comunes de aplicaciones."></LessonCard>
          </div>
          <div className="mt-10 flex justify-center">
            <Link to="/lessons">
              <Button className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 focus:ring-sky-600 text-white px-10 py-4 text-base font-bold rounded-full shadow-lg flex items-center gap-2">
                <span>📘</span>
                <span>Ver todas las lecciones</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Comienza tu aventura */}
      <section className="px-4 sm:px-6 lg:px-12 py-20 bg-white">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black mb-3 uppercase tracking-tight">¡Comienza tu <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">aventura</span> hoy!</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">Elige dónde continuar: revisa tu panel de progreso o explora nuevas lecciones directamente.</p>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <CTA title="Ir al Dashboard" action="/dashboard" gradient="from-purple-500 to-blue-500">Ve tu progreso y avanza en tu ruta personal.</CTA>
          <CTA title="Ver Progreso" action="/progress" gradient="from-sky-400 to-cyan-500">Consulta tus logros y motivación.</CTA>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl p-7 shadow-md hover:shadow-xl border border-transparent bg-white relative flex flex-col">
      <div className="absolute inset-0 rounded-2xl pointer-events-none [background:linear-gradient(theme(colors.blue.400),theme(colors.cyan.300))] opacity-5" />
      <div className="text-5xl mb-5 self-center" aria-hidden="true">{icon}</div>
      <h3 className="text-xl font-semibold mb-4 leading-snug text-center">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm md:text-base text-center">{children}</p>
    </Card>
  );
}

function LessonCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="rounded-2xl p-6 shadow-md hover:shadow-xl flex flex-col gap-5">
      <div>
        <h4 className="text-2xl font-extrabold text-blue-700 mb-3 leading-tight text-center">{title}</h4>
        <p className="text-slate-600 mb-4 text-sm md:text-base text-center">{description}</p>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full w-1/6 bg-gradient-to-r from-blue-500 to-cyan-500" />
      </div>
      <div className="flex flex-col items-center gap-2 mt-4">
        <Link to="/lessons"><Button className="bg-sky-600 hover:bg-sky-700 focus:ring-sky-600 text-white px-6">Ver</Button></Link>
        <span className="text-xs text-slate-400">0% progreso</span>
      </div>
    </Card>
  );
}

function CTA({ title, action, gradient, children }: { title: string; action: string; gradient: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-3xl p-8 md:p-10 bg-gradient-to-br ${gradient} text-white shadow-lg flex flex-col items-center text-center relative overflow-hidden` }>
      <div className="absolute inset-0 rounded-3xl pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
      <div className="text-xl md:text-2xl font-extrabold mb-2 tracking-tight drop-shadow-sm">{title}</div>
      <p className="text-white/90 mb-7 text-sm md:text-base max-w-xs leading-relaxed">{children}</p>
      <Link to={action} className="group">
        <Button variant="ghost" className="bg-white/95 text-slate-800 hover:bg-white shadow-md hover:shadow-lg px-7 py-3 rounded-2xl font-semibold text-sm md:text-base flex items-center gap-2">
          <span>Ir ahora</span>
          <span className="inline-block transition group-hover:translate-x-1">→</span>
        </Button>
      </Link>
    </div>
  );
}

function Testimonial({ icon, text, author }: { icon: string; text: string; author: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border p-6 flex flex-col gap-3 hover:shadow-md transition">
  <div className="text-3xl self-center" aria-hidden>{icon}</div>
      <p className="text-slate-700 text-sm md:text-base leading-relaxed">{text}</p>
      <div className="text-xs text-slate-500">{author}</div>
    </div>
  );
}
