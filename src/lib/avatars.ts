export type AvatarPreset = {
  id: string;
  label: string;
  bg: string; // tailwind classes
  icon: string; // emoji or short text initial
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'classic_blue', label: 'Clásico Azul', bg: 'bg-gradient-to-br from-blue-500 to-sky-500', icon: '👤' },
  { id: 'sunset', label: 'Atardecer', bg: 'bg-gradient-to-br from-orange-500 to-pink-500', icon: '🌅' },
  { id: 'forest', label: 'Bosque', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', icon: '🌿' },
  { id: 'galaxy', label: 'Galaxia', bg: 'bg-gradient-to-br from-purple-600 to-indigo-700', icon: '🪐' },
  { id: 'metal', label: 'Metálico', bg: 'bg-gradient-to-br from-slate-400 to-slate-600', icon: '⚙️' },
  { id: 'carbon', label: 'Carbono', bg: 'bg-gradient-to-br from-gray-800 to-gray-600', icon: '🦾' },
];

export function resolveAvatar(presetOrUrl: string | null | undefined) {
  if (!presetOrUrl) return { type: 'empty' as const };
  // If it looks like URL
  if (/^https?:\/\//i.test(presetOrUrl)) return { type: 'url' as const, url: presetOrUrl };
  const preset = AVATAR_PRESETS.find(p => p.id === presetOrUrl);
  if (preset) return { type: 'preset' as const, preset };
  return { type: 'empty' as const };
}
