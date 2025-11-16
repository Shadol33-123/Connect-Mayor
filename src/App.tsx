import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/pages/_components/Layout';
import PublicLayout from '@/pages/_components/PublicLayout';

const Login = lazy(() => import('@/pages/Login'));
const Home = lazy(() => import('@/pages/Home'));
const HomeTemplate = lazy(() => import('@/pages/HomeTemplate'));
const SaberActivoHome = lazy(() => import('@/pages/SaberActivoHome'));
const Lessons = lazy(() => import('@/pages/Lessons'));
const LessonDetail = lazy(() => import('@/pages/LessonDetail'));
const Profile = lazy(() => import('@/pages/Profile'));
const Progress = lazy(() => import('@/pages/Progress'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Ranking = lazy(() => import('@/pages/Ranking'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const PublicProfile = lazy(() => import('@/pages/PublicProfile'));
const ProfilesSearch = lazy(() => import('@/pages/ProfilesSearch'));
const Friends = lazy(() => import('@/pages/Friends'));
const Community = lazy(() => import('@/pages/Community'));
const Me = () => {
  // redirige al perfil público del usuario o a settings si falta username
  const { user } = useAuth();
  const { useUserProfile } = require('@/hooks/useUserProfile');
  const { data } = useUserProfile();
  if (!user) return <Navigate to="/login" replace />;
  if (data?.username) return <Navigate to={`/u/${data.username}`} replace />;
  return <Navigate to="/settings" replace />;
};

export default function App() {
  const { user, loading } = useAuth();
  const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (loading) return <div className="p-4">Cargando...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-600">Cargando…</div>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/template" element={<HomeTemplate />} />
          <Route path="/saberactivo" element={<SaberActivoHome />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/profiles" element={<ProfilesSearch />} />
        </Route>
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lessons/:id" element={<LessonDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/me" element={<Me />} />
          <Route path="/comunidad" element={<Community />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
