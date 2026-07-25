
export default function Administrators() {
  return (
    <main className="px-4.5 py-6 space-y-5">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div className="h-25.5 bg-white rounded-md w-full" key={idx} />
        ))}
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 1 }).map((_, idx) => (
          <div className="h-90.5 bg-white rounded-md w-full" key={idx} />
        ))}
      </div>
    </main>
  );
}
