import DashboardLayout from "@/components/layout/dashboard-layout";

export default function AcademicCalender() {
  return (
    <DashboardLayout title="Academic Calender">
      <main className="px-4.5 py-6 space-y-5">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 31 }).map((_, idx) => (
            <div className="h-25.5 bg-white rounded-md w-full" key={idx} />
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
}
