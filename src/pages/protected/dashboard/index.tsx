import { PageShell } from "@/components/layout/page-shell";


export default function Dashboard() {
  return (
    <PageShell className="space-y-5">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div className="h-25.5 bg-white rounded-md w-full" key={idx} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div className="h-50.5 bg-white rounded-md w-full" key={idx} />
        ))}
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 1 }).map((_, idx) => (
          <div className="h-70.5 bg-white rounded-md w-full" key={idx} />
        ))}
      </div>
    </PageShell>
  );
}
