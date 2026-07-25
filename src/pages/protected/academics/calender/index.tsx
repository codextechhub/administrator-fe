import { Badge } from "@/components/ui/badge";
import { cn, formatMonthYearShort } from "@/lib/utils";
import { routesPath } from "@/routes/routesPath";
import { Check } from "lucide-react";
import { useNavigate } from "react-router";

export default function AcademicCalender() {
  const navigate = useNavigate();

  return (
    <main className="px-4.5 py-6 space-y-5">
      <div className="grid lg:grid-cols-2 gap-6">
        {dummyData.academic_sessions.map((item, idx) => (
          <div
            className={cn(
              "h-fit bg-white rounded-md w-full px-4 py-3 cursor-pointer hover:scale-98 transition-all ease-linear",
              item.status?.toLowerCase() === "active" &&
                "border border-green-01",
            )}
            key={idx}
            onClick={() => {
              navigate(
                routesPath.PROTECTED.ACADEMIC.CALENDER_DETAILS_ID(item.id),
              );
            }}
          >
            <div className="flex justify-between gap-3">
              <div className="">
                <h5 className="text-base font-medium text-black-01">
                  {item.name} Academic Session
                </h5>
                <p className="text-xs text-gray-01">
                  {formatMonthYearShort(item.start_date)} -{" "}
                  {formatMonthYearShort(item.end_date)}
                </p>
              </div>

              <Badge
                variant={
                  item.status?.toLowerCase() === "active"
                    ? "active"
                    : item.status?.toLowerCase() === "completed"
                      ? "amber"
                      : "pending"
                }
                className="text-[11px] h-fit py-0 rounded-full uppercase"
              >
                {item.status}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-3">
              {item?.terms?.map((chi, id) => (
                <Badge
                  variant={
                    chi?.status === "pending"
                      ? "outline"
                      : chi?.status === "ongoing"
                        ? "pending"
                        : "active"
                  }
                  key={id}
                  className="h-fit text-xs py-0.5 rounded-full"
                >
                  {chi?.label}{" "}
                  {chi?.status === "completed" ? (
                    <Check className="ml-1" />
                  ) : chi?.status === "ongoing" ? (
                    " — ongoing"
                  ) : (
                    ""
                  )}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6 text-sm text-gray-01">
              <p className="">{item?.metrics.branches} branches</p>{" "}
              <span className="size-1 rounded-full block bg-gray-01" />
              <p className="">{item?.metrics.students} students</p>
              <span className="size-1 rounded-full block bg-gray-01" />
              <p className="">{item?.metrics.classes} classes</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const dummyData = {
  academic_sessions: [
    {
      id: "234VEFE43JFJ4FDWEK",
      name: "2025 / 2026",
      start_date: "2025-09-27T10:30:00.000Z",
      end_date: "2026-07-27T10:30:00.000Z",
      status: "Active",
      terms: [
        { label: "Term 1", status: "completed" },
        { label: "Term 2", status: "ongoing" },
        { label: "Term 3", status: "pending" },
      ],
      metrics: {
        branches: 3,
        students: 1284,
        classes: 16,
      },
    },
    {
      id: "43REDMRR3R342323",
      name: "2026 / 2027",
      start_date: "2026-09-27T10:30:00.000Z",
      end_date: "2027-07-27T10:30:00.000Z",
      status: "Inactive",
      terms: [
        { label: "Term 1", status: "pending" },
        { label: "Term 2", status: "pending" },
        { label: "Term 3", status: "pending" },
      ],
      metrics: {
        branches: 3,
        students: 1284,
        classes: 16,
      },
    },
    {
      id: "06GKFGRRV435VF",
      name: "2024 / 2025",
      start_date: "2024-09-27T10:30:00.000Z",
      end_date: "2025-07-27T10:30:00.000Z",
      status: "Completed",
      terms: [
        { label: "Term 1", status: "completed" },
        { label: "Term 2", status: "completed" },
        { label: "Term 3", status: "completed" },
      ],
      metrics: {
        branches: 2,
        students: 1101,
        classes: 16,
      },
    },
  ],
};
