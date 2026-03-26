import DashboardLayout from "@/components/layout/dashboard-layout";

export default function AcademicCalender() {
  return (
    <DashboardLayout title="Academics">
      <main className="px-4.5 py-6 space-y-5">
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
      </main>
    </DashboardLayout>
  );
}
