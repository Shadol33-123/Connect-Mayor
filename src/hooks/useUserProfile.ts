import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  rut: string | null;
  total_xp: number;
  bio: string | null;
  banner_style: string | null;
  avatar_url: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  show_links: boolean;
  show_achievements: boolean;
  show_progress: boolean;
  show_personal: boolean;
  updated_at: string | null;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users_profile')
  .select('user_id, username, display_name, first_name, last_name, age, rut, total_xp, bio, banner_style, avatar_url, website, linkedin, github, portfolio, show_links, show_achievements, show_progress, show_personal, updated_at')
    .eq('user_id', userId)
    .single();
  if (data) {
    (data as any).id = data.user_id;
  }
  if (error) {
    if ((error as any).code === 'PGRST116') return null; // not found
    throw error;
  }
  return data as UserProfile;
}

export function useUserProfile() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });
  return query;
}
