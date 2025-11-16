import { useState } from 'react';

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('');
  return (
    <footer className="mt-20 bg-slate-950 text-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full ring-2 ring-blue-400/30" />
              <span className="text-xl font-bold">Connect! Mayor</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">Aprender tecnología puede ser simple y motivador. Ofrecemos rutas guiadas, ejercicios prácticos y un progreso claro para personas mayores y principiantes.</p>
            <div className="flex gap-3 mt-4" aria-label="Redes sociales">
              <Social icon="🐦" label="Twitter" href="#" />
              <Social icon="📘" label="Facebook" href="#" />
              <Social icon="💬" label="WhatsApp" href="#" />
              <Social icon="▶️" label="YouTube" href="#" />
            </div>
          </div>

          {/* Producto */}
          <FooterGroup title="Producto">
            <FooterLink to="/lessons">Lecciones</FooterLink>
            <FooterLink to="/dashboard">Dashboard</FooterLink>
            <FooterLink to="/progress">Progreso</FooterLink>
            <FooterLink to="/settings">Configuración</FooterLink>
          </FooterGroup>

          {/* Aprendizaje */}
          <FooterGroup title="Aprendizaje">
            <FooterLink to="/lessons">Ejercicios guiados</FooterLink>
            <FooterLink to="/lessons">Entrenadores</FooterLink>
            <FooterLink to="/lessons">Primeros pasos</FooterLink>
            <FooterLink to="/lessons">Iconos comunes</FooterLink>
          </FooterGroup>

          {/* Empresa */}
          <FooterGroup title="Empresa">
            <FooterLink to="#">Quiénes somos</FooterLink>
            <FooterLink to="#">Blog</FooterLink>
            <FooterLink to="#">Testimonios</FooterLink>
            <FooterLink to="#">Contacto</FooterLink>
          </FooterGroup>

          {/* Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold tracking-wide text-slate-100">Mantente informado</h3>
            <p className="text-sm text-slate-400">Recibe consejos y nuevas lecciones. Máx. 1 correo semanal.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); setEmail(''); alert('Suscripción registrada (demo)'); }}
              className="flex flex-col sm:flex-row gap-3"
              aria-label="Formulario de newsletter"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Correo electrónico"
              />
              <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400">Suscribirme</button>
            </form>
            <p className="text-[11px] text-slate-500">Al suscribirte aceptas nuestras políticas de privacidad.</p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="text-lg" aria-hidden>📧</span><span>soporte@connectmayor.com</span></div>
              <div className="flex items-center gap-2"><span className="text-lg" aria-hidden>📞</span><span>+34 600 000 000</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© {year} Connect! Mayor. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6 text-xs">
            <a href="#" className="hover:text-white">Privacidad</a>
            <a href="#" className="hover:text-white">Términos</a>
            <a href="#" className="hover:text-white">Accesibilidad</a>
            <LanguageSelect />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
      <ul className="space-y-2 text-sm text-slate-400">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={to} className="hover:text-white transition-colors">{children}</a>
    </li>
  );
}

function Social({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span aria-hidden>{icon}</span>
    </a>
  );
}

function LanguageSelect() {
  return (
    <label className="inline-flex items-center gap-2 text-slate-400">
      <span className="sr-only">Idioma</span>
      <span>🌐</span>
      <select className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="es">ES</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}