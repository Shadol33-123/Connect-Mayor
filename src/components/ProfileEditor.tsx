import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabaseClient';
import { AVATAR_PRESETS, resolveAvatar } from '@/lib/avatars';

interface BannerStyle {
  id: string;
  name: string;
  gradient: string;
  texture: string;
  preview: string;
}

const BANNER_STYLES: BannerStyle[] = [
  {
    id: 'ocean',
    name: 'Océano',
  gradient: 'from-blue-600 via-sky-500 to-cyan-500',
  texture: 'before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.15),transparent_50%)] after:absolute after:inset-0 after:pointer-events-none after:bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.2),transparent_50%)]',
    preview: 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500'
  },
  {
    id: 'sunset',
    name: 'Atardecer',
  gradient: 'from-orange-500 via-red-500 to-pink-600',
  texture: 'before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_30%_70%,rgba(254,240,138,0.2),transparent_50%)] after:absolute after:inset-0 after:pointer-events-none after:bg-[radial-gradient(circle_at_70%_30%,rgba(251,146,60,0.15),transparent_50%)]',
    preview: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600'
  },
  {
    id: 'forest',
    name: 'Bosque',
  gradient: 'from-green-600 via-emerald-500 to-teal-600',
  texture: 'before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_25%_75%,rgba(187,247,208,0.15),transparent_50%)] after:absolute after:inset-0 after:pointer-events-none after:bg-[radial-gradient(circle_at_75%_25%,rgba(110,231,183,0.2),transparent_50%)]',
    preview: 'bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600'
  },
  {
    id: 'purple',
    name: 'Galaxia',
  gradient: 'from-purple-600 via-violet-600 to-indigo-700',
  texture: 'before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_40%_60%,rgba(196,181,253,0.15),transparent_50%)] after:absolute after:inset-0 after:pointer-events-none after:bg-[radial-gradient(circle_at_60%_40%,rgba(139,92,246,0.1),transparent_50%)]',
    preview: 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700'
  },
  {
    id: 'gold',
    name: 'Dorado',
  gradient: 'from-yellow-500 via-amber-500 to-orange-500',
  texture: 'before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_50%_50%,rgba(254,240,138,0.25),transparent_50%)] after:absolute after:inset-0 after:pointer-events-none after:bg-[radial-gradient(circle_at_20%_80%,rgba(251,191,36,0.15),transparent_50%)]',
    preview: 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500'
  }
  ,{
    id: 'carbon',
    name: 'Carbono',
    gradient: 'from-gray-800 via-gray-600 to-gray-900',
    texture: 'before:absolute before:inset-0 before:pointer-events-none before:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.04)_0_10px,transparent_10_20px)] after:absolute after:inset-0 after:pointer-events-none after:bg-[radial-gradient(circle_at_60%_40%,rgba(0,0,0,0.15),transparent_50%)]',
    preview: 'bg-gradient-to-r from-gray-800 via-gray-600 to-gray-900'
  }
];

interface ProfileEditorProps {
  children: React.ReactNode;
}

export default function ProfileEditor({ children }: ProfileEditorProps) {
  const profileQuery = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profileQuery.data?.display_name || '');
  const [bio, setBio] = useState(profileQuery.data?.bio || '');
  const [selectedBanner, setSelectedBanner] = useState(profileQuery.data?.banner_style || 'ocean');
  const [selectedAvatar, setSelectedAvatar] = useState(profileQuery.data?.avatar_url || AVATAR_PRESETS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ya no subimos imagen: usamos presets. (Dejar gancho por si luego reactivamos upload)

  const handleSave = async () => {
    setIsLoading(true);
    try {
  const avatarUrl = selectedAvatar; // guardamos id de preset o URL

      // Update profile (users_profile)
      const { error } = await supabase
        .from('users_profile')
        .update({
          display_name: displayName,
          bio: bio,
          banner_style: selectedBanner,
          avatar_url: avatarUrl
        })
        .eq('user_id', profileQuery.data?.id);

      if (error) throw error;

      // Refetch profile data
      profileQuery.refetch();
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Presets */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Avatar</label>
            <div className="grid grid-cols-5 gap-3">
              {AVATAR_PRESETS.map(p => (
                <button key={p.id} onClick={()=>setSelectedAvatar(p.id)} className={`w-16 h-16 rounded-xl ${p.bg} grid place-items-center text-2xl text-white shadow relative ${selectedAvatar===p.id?'ring-2 ring-blue-500 ring-offset-2':''}`}>
                  <span aria-hidden>{p.icon}</span>
                  {selectedAvatar===p.id && <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full px-1">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu nombre"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sobre mí</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Cuéntanos algo sobre ti..."
            />
          </div>

          {/* Banner Styles (5 presets ya definidos) */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Estilo de banner</label>
            <div className="grid grid-cols-5 gap-3">
              {BANNER_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedBanner(style.id)}
                  className={`aspect-[2/1] rounded-lg ${style.preview} relative overflow-hidden transition-all ${
                    selectedBanner === style.id 
                      ? 'ring-3 ring-blue-500 ring-offset-2' 
                      : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                >
                  {selectedBanner === style.id && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white text-lg">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-center">
              {BANNER_STYLES.find(s => s.id === selectedBanner)?.name}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { BANNER_STYLES };
