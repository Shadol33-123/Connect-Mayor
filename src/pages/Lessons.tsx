import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Card, CardMeta } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getUserProgress } from '@/lib/progress';
import Skeleton from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface Lesson { id: string; title: string; description: string | null; xp: number; level?: 'basico'|'medio'|'experto'|null; }

// New helper data shape for levels summary
interface LevelSummary {
  id: 'basico' | 'medio' | 'experto';
  title: string;
  description: string;
  topics: number;
  lessons: number;
  xpTotal: number;
  gradient: string; // tailwind gradient classes
  icon: string; // emoji placeholder
  completed: number;
  percent: number;
}

export default function Lessons() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lessons').select('id,title,description,xp,level').order('order_index');
      if (error) throw error;
      return data as Lesson[];
    },
  });
  const progressQuery = useQuery({
    queryKey: ['progress'],
    queryFn: () => getUserProgress(),
  });

  // Estado: niveles abiertos (acordeón multi-open)
  const [openLevels, setOpenLevels] = useState<Record<'basico'|'medio'|'experto', boolean>>({ basico: true, medio: false, experto: false });
  const toggleLevel = (lvl: 'basico'|'medio'|'experto') => setOpenLevels(o => ({ ...o, [lvl]: !o[lvl] }));

  // Progress helpers
  const completedSet = useMemo(() => new Set(progressQuery.data?.map(p => p.lesson_id) || []), [progressQuery.data]);

  // Agrupar lecciones por nivel (preserva orden original)
  const grouped = useMemo(() => {
    const base: Record<'basico'|'medio'|'experto', Lesson[]> = { basico: [], medio: [], experto: [] };
    data?.forEach(l => { if (l.level) base[l.level].push(l); });
    return base;
  }, [data]);

  // Calcular summary por nivel
  const levelSummaries: LevelSummary[] = useMemo(() => {
    const mk = (id: LevelSummary['id'], title: string, description: string, gradient: string, icon: string): LevelSummary => {
      const lessonsArr = grouped[id];
      const xpTotal = lessonsArr.reduce((a,b)=>a+b.xp,0);
      const completed = lessonsArr.filter(l => completedSet.has(l.id)).length;
      const percent = lessonsArr.length ? Math.round((completed / lessonsArr.length) * 100) : 0;
      return { id, title, description, topics: 0, lessons: lessonsArr.length, xpTotal, gradient, icon, completed, percent };
    };
    return [
      mk('basico','Nivel Básico','Fundamentos esenciales para usar una computadora','from-emerald-400 to-green-500','🌱'),
      mk('medio','Nivel Medio','Habilidades intermedias para ser más productivo','from-indigo-500 to-blue-500','🚀'),
      mk('experto','Nivel Avanzado','Dominio completo y técnicas avanzadas','from-pink-500 to-violet-500','🎯'),
    ];
  }, [grouped, completedSet]);

  const summary = useMemo(() => ({
    niveles: 3,
    temas: 12,
    lecciones: data?.length || 0,
    xp: data?.reduce((a,b)=>a+b.xp,0) || 0,
  }), [data]);

  const levelBadge = (lvl?: Lesson['level']) => {
    if (!lvl) return null;
    const map: Record<string,string> = { basico:'bg-emerald-100 text-emerald-800', medio:'bg-amber-100 text-amber-800', experto:'bg-rose-100 text-rose-800' };
    const label = lvl === 'basico' ? 'Básico' : lvl === 'medio' ? 'Medio' : 'Experto';
    return <span className={`text-[10px] px-2 py-1 rounded ${map[lvl]}`}>{label}</span>;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black mb-3">🎓 Lecciones CONNECT Mayor</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">Aprende tecnología paso a paso. Un programa estructurado desde conceptos básicos hasta habilidades avanzadas.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="relative overflow-hidden rounded-2xl py-6 text-center">
          <div className="text-3xl font-black">{summary.niveles}</div>
          <div className="text-xs uppercase tracking-wide text-slate-600">Niveles</div>
        </Card>
        <Card className="relative overflow-hidden rounded-2xl py-6 text-center">
          <div className="text-3xl font-black">{summary.temas}</div>
          <div className="text-xs uppercase tracking-wide text-slate-600">Temas</div>
        </Card>
        <Card className="relative overflow-hidden rounded-2xl py-6 text-center">
          <div className="text-3xl font-black text-violet-600">{summary.lecciones}</div>
          <div className="text-xs uppercase tracking-wide text-slate-600">Lecciones</div>
        </Card>
        <Card className="relative overflow-hidden rounded-2xl py-6 text-center">
          <div className="text-3xl font-black flex items-center justify-center gap-1"><span className="text-amber-500">⚡</span>{summary.xp}+</div>
          <div className="text-xs uppercase tracking-wide text-slate-600">XP Total</div>
        </Card>
      </div>

      <div className="space-y-6">
        {levelSummaries.map(lvl => {
          const isOpen = openLevels[lvl.id];
          return (
            <div key={lvl.id} className="rounded-2xl bg-white shadow-sm border overflow-hidden">
              {/* Header card clickable */}
              <button
                type="button"
                onClick={() => toggleLevel(lvl.id)}
                className="w-full relative text-left group"
                aria-expanded={isOpen}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${lvl.gradient} opacity-90`} />
                <div className="relative p-6 text-white flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">{lvl.icon} {lvl.title}</h3>
                      <p className="text-xs opacity-90 max-w-lg">{lvl.description}</p>
                    </div>
                    <div className="text-right text-xs font-medium">
                      <div className="text-lg font-semibold">{lvl.percent}%</div>
                      <div className="opacity-80">{lvl.completed}/{lvl.lessons} lecciones</div>
                    </div>
                  </div>
                  <ProgressBar value={lvl.percent} className="h-2 bg-white/30" />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="opacity-80">XP Total: {lvl.xpTotal}</span>
                    <span className="inline-flex items-center gap-1">{isOpen ? 'Ocultar' : 'Ver'} lecciones <span>{isOpen ? '▲' : '▼'}</span></span>
                  </div>
                </div>
              </button>
              {/* Panel de lecciones */}
              <div className={`transition-all duration-300 ${isOpen ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} bg-gradient-to-b from-slate-50 to-white`}> 
                <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped[lvl.id].length === 0 && (
                    <div className="col-span-full text-center text-slate-500 text-sm">No hay lecciones en este nivel todavía.</div>
                  )}
                  {grouped[lvl.id].map(l => {
                    const completed = completedSet.has(l.id);
                    const percent = completed ? 100 : 0;
                    return (
                      <Card key={l.id} className="flex flex-col justify-between rounded-2xl p-5 shadow-md hover:shadow-lg relative">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-extrabold text-blue-700 leading-tight">{l.title}</h4>
                            <div className="flex items-center gap-2">
                              {levelBadge(l.level)}
                              <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{l.xp} XP</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-[auto,1fr] gap-3 items-start">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 grid place-items-center text-lg" aria-hidden>📘</div>
                            {l.description && <CardMeta>{l.description}</CardMeta>}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center text-[11px] px-2 py-1 rounded-full ${completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{completed ? '✔ Completada' : 'Pendiente'}</span>
                            <span className="text-[11px] text-slate-500">{percent}%</span>
                          </div>
                          <Link to={`/lessons/${l.id}`}>
                            <Button variant={completed ? 'ghost' : 'primary'} className="text-xs px-4 py-2">{completed ? 'Revisar' : 'Abrir'}</Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
