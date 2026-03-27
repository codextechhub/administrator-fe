import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Edit, GraduationCap, MapPin } from "lucide-react";

export default function Branches() {
  return (
    <DashboardLayout title="Branches">
      <main className="px-4.5 py-6 space-y-5">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyData.map((item, idx) => (
            <div
              className="h-fit bg-white rounded-md w-full px-4 py-3 cursor-pointer hover:scale-98 transition-all ease-linear"
              key={idx}
            >
              <div className="flex justify-between gap-3">
                <figure
                  className={cn(
                    badgeVariants({ variant: "red" }),
                    " size-8 rounded-md grid place-content-center",
                  )}
                >
                  <GraduationCap className="size-5!" />
                </figure>
                <Badge
                  variant={
                    item?.category?.toLocaleLowerCase() === "primary"
                      ? "amber"
                      : "green"
                  }
                  className="text-xs py-0.5 h-fit rounded-lg"
                >
                  {item.category}
                </Badge>
              </div>

              <div className="mt-3">
                <h4 className="font-medium">{item.name}</h4>

                <div className="flex gap-1.5 items-center mt-1.5 text-gray-05">
                  <MapPin className="size-3 text-[#854F0B]" />
                  <p className="text-xs">{item.location.address}</p>
                </div>

                <hr className="my-3 border-gray-0 border-1.5" />

                <div className="flex items-center justify-between px-1 xl:px-3">
                  <div>
                    <p className="text-xs text-gray-05">Students</p>
                    <p className="text-lg font-semibold text-black-01">
                      {item.stats.students}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-05">Teachers</p>
                    <p className="text-lg font-semibold text-black-01">
                      {item.stats.teachers}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-05">Classes</p>
                    <p className="text-lg font-semibold text-black-01">
                      {item.stats.classes}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-3 mt-4">
                  <Button size="sm">View</Button>
                  <Button
                    size="sm"
                    variant={"outline"}
                    className="border-primary text-primary"
                  >
                    <Edit />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
}

const dummyData = [
  {
    id: "sch_001",
    name: "Caleb Primary - Magodo",
    category: "Primary",
    location: {
      address: "12 Awolowo Rd, Ikeja, Lagos",
      city: "Magodo",
      state: "Lagos",
      country: "Nigeria",
    },
    stats: {
      students: 612,
      teachers: 34,
      classes: 6,
    },
  },
  {
    id: "sch_002",
    name: "Caleb Secondary - Magodo",
    category: "Secondary",
    location: {
      address: "14 Awolowo Rd, Ikeja, Lagos",
      city: "Magodo",
      state: "Lagos",
      country: "Nigeria",
    },
    stats: {
      students: 498,
      teachers: 41,
      classes: 6,
    },
  },
  {
    id: "sch_003",
    name: "Caleb Primary - Lekki",
    category: "Primary",
    location: {
      address: "5 Admiralty Way, Lekki, Lagos",
      city: "Lekki",
      state: "Lagos",
      country: "Nigeria",
    },
    stats: {
      students: 174,
      teachers: 12,
      classes: 10,
    },
  },
  {
    id: "sch_004",
    name: "Caleb Secondary - Lekki",
    category: "Secondary",
    location: {
      address: "5 Admiralty Way, Lekki, Lagos",
      city: "Lekki",
      state: "Lagos",
      country: "Nigeria",
    },
    stats: {
      students: 104,
      teachers: 31,
      classes: 6,
    },
  },
  {
    id: "sch_005",
    name: "Caleb Secondary - Abuja",
    category: "Secondary",
    location: {
      address: "5 Admiralty Way, Wasu, Abuja",
      city: "Wasu",
      state: "Abuja",
      country: "Nigeria",
    },
    stats: {
      students: 98,
      teachers: 17,
      classes: 8,
    },
  },
];
