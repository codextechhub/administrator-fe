import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

export default function ClassDetails() {
  return (
    <DashboardLayout hasBack title="Class Details">
      <main className="px-4.5 py-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-black-01 text-lg font-medium truncate">
            JSS 2 - Caleb Primary - Magodo
          </p>
          <Button className="text-sm">Edit Class</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="h-fit min-h-26 font-mont bg-white rounded-md w-full px-6 py-5 flex flex-col justify-between">
            <p className="font-medium text-sm text-gray-01">Class Teacher</p>
            <p className="text-2xl font-semibold text-black-01 truncate">
              Mrs. Jane Doe
            </p>
          </div>
          <div className="h-fit min-h-26 font-mont bg-white rounded-md w-full px-6 py-5 flex flex-col justify-between">
            <p className="font-medium text-sm text-gray-01">Students</p>
            <p className="text-2xl font-semibold text-black-01 truncate">38</p>
          </div>
          <div className="h-fit min-h-26 font-mont bg-white rounded-md w-full px-6 py-5 flex flex-col justify-between">
            <p className="font-medium text-sm text-gray-01">Subjects</p>
            <p className="text-2xl font-semibold text-black-01 truncate">9</p>
          </div>
          <div className="h-fit min-h-26 font-mont bg-white rounded-md w-full px-6 py-5 flex flex-col justify-between">
            <p className="font-medium text-sm text-gray-01">Avg. Score</p>
            <p className="text-2xl font-semibold text-black-01 truncate">74%</p>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
