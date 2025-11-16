import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SaberActivoHome() {
  return (
    <div className="bg-[#FAFAFA] text-[#222]">
      {/* Hero */}
      <section id="inicio" className="w-full px-4 sm:px-6 lg:px-12 py-12 lg:py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">Tu Próximo Conocimiento Empieza Aquí.</h1>
          <p className="text-lg md:text-xl leading-relaxed mb-8">Cursos en línea 100% personalizados, diseñados para tu ritmo.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="/lessons">
              <Button className="text-lg px-8 py-3">Comenzar a Explorar</Button>
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-video rounded-3xl bg-white border border-slate-200 grid place-items-center">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" aria-hidden="true" />
          </div>
          <div className="absolute -bottom-6 left-6 bg-white border border-slate-200 rounded-2xl shadow px-4 py-3">
            <div className="text-2xl font-extrabold">Ruta Personal</div>
            <div className="text-sm text-slate-600">Aprende con bifurcaciones inteligentes</div>
          </div>
        </div>
      </section>

  {/* Módulo Interactivo: Mouse */}
      <InteractiveMouseModule />

  {/* Modelo de aprendizaje */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-6">Tu Ruta de Aprendizaje Única</h2>
        <div className="grid md:grid-cols-3 gap-6 text-lg">
          <Point icon="📝" title="Evaluamos">Comenzamos con preguntas simples sobre lo que ya sabes.</Point>
          <Point icon="🧭" title="Adaptamos">Saltamos las lecciones que ya dominas.</Point>
          <Point icon="🚀" title="Avanzas">Solo aprendes lo que es nuevo e importante para ti.</Point>
        </div>
      </section>

  {/* Categorías de cursos */}
      <section id="cursos" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-8">Categorías destacadas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CategoryCard icon="💻" title="Tecnología Básica" />
          <CategoryCard icon="📱" title="Celular y Mensajería" />
          <CategoryCard icon="🌐" title="Internet Seguro" />
          <CategoryCard icon="💳" title="Trámites y Pagos" />
        </div>
      </section>

  {/* Soporte */}
      <section id="ayuda" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-3">¿Preguntas? Te ayudamos.</h2>
            <p className="text-lg text-slate-700 mb-6">Estamos para acompañarte. Resolvemos tus dudas por teléfono o chat fácil.</p>
            <a href="mailto:soporte@saberactivo.com" className="inline-block">
              <Button className="text-lg px-7 py-3">Solicitar Asistencia Simple</Button>
            </a>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200 p-8">
            <ul className="space-y-3 text-lg">
              <li>• Respuesta humana y cercana</li>
              <li>• Horario amplio</li>
              <li>• Paso a paso claro</li>
            </ul>
          </div>
        </div>
      </section>
  </div>
  );
}

function Point({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6">
      <div className="text-3xl" aria-hidden="true">{icon}</div>
      <h3 className="text-xl font-semibold mt-3 mb-2">{title}</h3>
      <p className="text-slate-700 leading-relaxed">{children}</p>
    </div>
  );
}

function CategoryCard({ icon, title }: { icon: string; title: string }) {
  return (
    <Card>
      <div className="text-4xl mb-3" aria-hidden="true">{icon}</div>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <a href="/lessons" className="inline-block">
        <Button className="w-full">Ver Cursos</Button>
      </a>
    </Card>
  );
}

function InteractiveMouseModule() {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const done = hovered && clicked;
  return (
    <section className="max-w-7xl mx-auto px-6 py-20" aria-labelledby="mouse-title">
      <h2 id="mouse-title" className="text-3xl font-bold mb-3">¿Nuevo en esto? ¡Practiquemos el mouse!</h2>
      <p className="text-lg text-slate-700 mb-6">Actividad opcional para ganar confianza. Sigue los pasos y obtén un mensaje de felicitación.</p>
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <Card>
          <div className="space-y-5">
            <Step done={hovered} title="Apuntar (hover)">
              Mueve el cursor sobre el círculo hasta que cambie de color.
            </Step>
            <Step done={clicked} title="Click único">
              Presiona el botón grande etiquetado "¡Click Aquí!".
            </Step>
            <div aria-live="polite" className="text-lg font-semibold">
              {done ? '¡Lo lograste! Ahora tienes el control.' : 'Completa los pasos para finalizar.'}
            </div>
          </div>
        </Card>
        <div className="grid gap-6">
          <div
            role="button"
            tabIndex={0}
            aria-label="Círculo para practicar el hover"
            onMouseEnter={() => setHovered(true)}
            onFocus={() => setHovered(true)}
            className={`w-48 h-48 rounded-full mx-auto transition shadow ${hovered ? 'bg-emerald-400' : 'bg-cyan-300 animate-pulse'}`}
          />
          <Button
            aria-label="Botón de práctica de clic"
            className="text-lg py-3"
            onClick={() => setClicked(true)}
          >
            ¡Click Aquí!
          </Button>
        </div>
      </div>
    </section>
  );
}

function Step({ done, title, children }: { done: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 inline-flex w-6 h-6 items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{done ? '✓' : '1'}</span>
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-slate-700">{children}</div>
      </div>
    </div>
  );
}