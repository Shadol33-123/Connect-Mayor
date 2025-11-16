import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { completeLesson } from '@/lib/progress';

export default function LessonDetail() {
  const { id } = useParams();
  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Sin id');
      return completeLesson(id);
    },
  });
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Detalle de la Lección</h1>
      <p className="mb-4">ID: {id}</p>
      {error && <div className="text-red-600 text-sm">{(error as any).message}</div>}
      {isSuccess ? (
        <div className="text-green-700">¡Completada! XP sumada.</div>
      ) : (
        <button onClick={()=>mutate()} disabled={isPending} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {isPending ? 'Guardando...' : 'Completar y ganar XP'}
        </button>
      )}
    </div>
  );
}
