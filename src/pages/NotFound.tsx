export default function NotFound() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-4">404</h1>
      <p className="text-slate-600 mb-6">La página que buscas no existe.</p>
      <a href="/" className="text-blue-700 underline">Volver al inicio</a>
    </div>
  );
}