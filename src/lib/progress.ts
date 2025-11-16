import { supabase } from '@/lib/supabaseClient';

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
  xp_earned: number;
  lesson_title?: string | null;
};

export async function completeLesson(lessonId: string, xp: number = 50) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('lesson_progress')
    .insert({ user_id: user.id, lesson_id: lessonId, xp_earned: xp })
    .select('*')
    .single();
  if (error) throw error;
  return data as LessonProgress;
}

export async function getUserProgress() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [] as LessonProgress[];
  // join with lessons to include the lesson title
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('id,user_id,lesson_id,completed_at,xp_earned,lessons(title)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  // map nested lessons.title into lesson_title for easier use in UI
  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    lesson_id: r.lesson_id,
    completed_at: r.completed_at,
    xp_earned: r.xp_earned,
    lesson_title: r.lessons?.title ?? null,
  }));
  return rows as LessonProgress[];
}
