import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { formatRUT as fmtRUT, validateRUT, rutLengthValid } from '@/lib/rut';

export default function Settings() {
  const { user, signOut } = useAuth();
  const profileQuery = useUserProfile();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [rut, setRut] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [showAchievements, setShowAchievements] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [showPersonal, setShowPersonal] = useState(false);
  const [showLinks, setShowLinks] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const p = profileQuery.data;
    if (p) {
      setDisplayName(p.display_name || '');
      setUsername(p.username || '');
      setFirstName(p.first_name || '');
      setLastName(p.last_name || '');
      setAge(p.age ?? '');
  setRut(p.rut || '');
      setBio(p.bio || '');
  setWebsite(p.website || '');
  setLinkedin(p.linkedin || '');
  setGithub(p.github || '');
  setPortfolio(p.portfolio || '');
      setShowAchievements(p.show_achievements ?? true);
      setShowProgress(p.show_progress ?? true);
      setShowPersonal(p.show_personal ?? false);
  setShowLinks(p.show_links ?? true);
    }
  }, [profileQuery.data]);

  const usernameIsValid = useMemo(() => /^[a-z0-9_]{3,20}$/i.test(username || ''), [username]);
  const rutIsValid = useMemo(() => !rut || validateRUT(rut), [rut]);
  const rutLenOk = useMemo(() => !rut || rutLengthValid(rut), [rut]);

  async function saveProfile() {
    if (!user) return;
    setIsLoading(true);
    setStatus(null); 
    setError(null);
    
    try {
  if (rut && !validateRUT(rut)) throw new Error('RUT inválido (8-9 dígitos + DV correcto)');
      // Check username uniqueness if changed
      if (username) {
        if (!usernameIsValid) throw new Error('Nombre de usuario inválido (solo letras, números y _; mínimo 3).');
        const { data: exists } = await supabase
          .from('users_profile')
          .select('user_id')
          .ilike('username', username)
          .neq('user_id', user.id)
          .limit(1);
        if (exists && exists.length > 0) throw new Error('El nombre de usuario ya está en uso.');
      }
      const { error } = await supabase
        .from('users_profile')
        .upsert({ 
          user_id: user.id, 
          display_name: displayName,
          username,
          first_name: firstName,
          last_name: lastName,
          age: typeof age === 'number' ? age : null,
          rut,
          bio,
          website: website || null,
          linkedin: linkedin || null,
          github: github || null,
          portfolio: portfolio || null,
          show_links: showLinks,
          show_achievements: showAchievements,
          show_progress: showProgress,
          show_personal: showPersonal
        });
      
      if (error) throw error;
      
      setStatus('✅ Perfil actualizado correctamente');
      profileQuery.refetch();
    } catch (err: any) {
      setError('❌ Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword() {
    setIsLoading(true);
    setStatus(null); 
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        user?.email || '', 
        { redirectTo: window.location.origin + '/login' }
      );
      
      if (error) throw error;
      
      setStatus('📧 Se envió un email para restablecer tu contraseña');
    } catch (err: any) {
      setError('❌ Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await signOut();
      navigate('/login');
    } catch (err: any) {
      setError('❌ Error al cerrar sesión: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-semibold mb-4">Acceso requerido</h1>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para acceder a la configuración.</p>
          <Button onClick={() => navigate('/login')}>
            Iniciar sesión
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Messages */}
        {status && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {status}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {/* Account Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Información de la cuenta</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario público (único)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="tu_usuario"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${username && !usernameIsValid ? 'border-red-400' : ''}`}
                />
                <p className="text-xs text-gray-500 mt-1">Se usará en tu perfil público: /u/{username || 'usuario'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre para mostrar
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input type="text" value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                  <input type="text" value={lastName} onChange={(e)=>setLastName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
        <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Edad</label>
                  <input type="number" min={0} value={age} onChange={(e)=>setAge(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RUT</label>
          <input type="text" value={rut} onChange={(e)=>setRut(fmtRUT(e.target.value))} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${(rut && (!rutLenOk || !rutIsValid)) ? 'border-red-400' : ''}`} />
          {rut && (!rutLenOk || !rutIsValid) && <div className="text-xs text-red-600 mt-1">RUT inválido (8-9 dígitos + DV)</div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sobre mí</label>
                <textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
              </div>

              {/* Enlaces profesionales */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sitio web</label>
                  <input type="url" value={website} onChange={(e)=>setWebsite(e.target.value)} placeholder="https://tuweb.com" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input type="url" value={linkedin} onChange={(e)=>setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/usuario" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                  <input type="url" value={github} onChange={(e)=>setGithub(e.target.value)} placeholder="https://github.com/usuario" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio</label>
                  <input type="url" value={portfolio} onChange={(e)=>setPortfolio(e.target.value)} placeholder="https://portfolio.com" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              
              <Button 
                onClick={saveProfile} 
                disabled={!!(isLoading || !usernameIsValid || (rut && (!rutLenOk || !rutIsValid)))}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </Card>

          {/* Security */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Seguridad</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Cambiar contraseña</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Te enviaremos un email con un enlace para restablecer tu contraseña.
                </p>
                <Button 
                  variant="ghost" 
                  onClick={resetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Restablecer contraseña'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Preferencias</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Mostrar progreso públicamente</h3>
                  <p className="text-sm text-gray-600">Otros podrán ver tu XP y avances.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showProgress} onChange={(e)=>setShowProgress(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:top-[2px] after:left-[2px] after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Mostrar logros públicamente</h3>
                  <p className="text-sm text-gray-600">Controla si tus insignias son visibles.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showAchievements} onChange={(e)=>setShowAchievements(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:top-[2px] after:left-[2px] after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Mostrar datos personales</h3>
                  <p className="text-sm text-gray-600">Edad y RUT en el perfil público.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showPersonal} onChange={(e)=>setShowPersonal(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:top-[2px] after:left-[2px] after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Mostrar enlaces profesionales</h3>
                  <p className="text-sm text-gray-600">Sitio, LinkedIn, GitHub, Portfolio en tu perfil público.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showLinks} onChange={(e)=>setShowLinks(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:top-[2px] after:left-[2px] after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Notificaciones por email</h3>
                  <p className="text-sm text-gray-600">Recibe actualizaciones sobre tu progreso</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Sonidos de la aplicación</h3>
                  <p className="text-sm text-gray-600">Reproducir sonidos al completar lecciones</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-red-200">
            <h2 className="text-lg font-semibold mb-4 text-red-600">Zona de peligro</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Cerrar sesión</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Cierra tu sesión actual en este dispositivo.
                </p>
                <Button 
                  variant="secondary" 
                  onClick={handleSignOut}
                  disabled={isLoading}
                >
                  {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}