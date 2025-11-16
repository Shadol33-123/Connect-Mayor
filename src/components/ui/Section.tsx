export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-6xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}