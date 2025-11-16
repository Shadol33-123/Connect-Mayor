import { Outlet, useLocation } from 'react-router-dom';
import Nav from './Nav';
import Footer from '@/components/experience/Footer';

export default function PublicLayout() {
  const { pathname } = useLocation();
  // Pages that should remain constrained (e.g., login) can be listed here
  const constrained = pathname.startsWith('/login');
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className={constrained ? 'max-w-6xl mx-auto p-4' : 'p-0'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}