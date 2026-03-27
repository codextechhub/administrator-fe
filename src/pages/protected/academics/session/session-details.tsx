import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVariantColor } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export default function SessionDetails() {
  return (
    <DashboardLayout hasBack title="Session Details">
      <main className="px-4.5 py-6 pb-10">
        <div className="flex items-center justify-between gap-5">
          <h4 className="text-xl font-medium text-black-01 font-mont">
            {dummyData.session_name}
          </h4>

          <div className="inline-flex items-center gap-3">
            <Badge
              variant={"success"}
              className="h-fit py-0.5 rounded-full text-sm"
            >
              {dummyData.status}
            </Badge>

            <Button variant={"outline"} className="border-primary text-primary">
              Edit Session
            </Button>
          </div>
        </div>

        <div className="inline-flex items-center mt-4 gap-2">
          <p className="text-gray-06 text-nowrap">Active branch:</p>

          <div className="inline-flex flex-wrap items-center gap-3">
            {dummyData?.branches?.map((chi, idx) => (
              <Badge
                key={idx}
                variant={"teal"}
                className="py-0 h-fit text-sm rounded-full text-nowrap"
              >
                {chi.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-4 mt-6">
          {dummyData.terms?.map((item, idx) => (
            <div
              className="w-full px-4 py-3 pb-5 rounded-md bg-white"
              key={idx}
            >
              <div className="flex items-center justify-between gap-5">
                <div className="">
                  <p className="font-medium text-black-01">{item.term_name}</p>
                  <p className="text-xs text-gray-06">
                    {item.start_date} - {item.end_date}
                  </p>
                </div>

                <Badge
                  variant={
                    item.status?.toLowerCase() === "completed"
                      ? "success"
                      : item.status?.toLowerCase() === "ongoing"
                        ? "pending"
                        : "red"
                  }
                  className="text-xs py-0.5 h-fit rounded-full"
                >
                  {item.status}
                </Badge>
              </div>

              <div className="space-y-2 mt-5">
                {item.events.map((chi, id) => (
                  <div
                    key={id}
                    className="border rounded-md flex justify-between items-center px-3 py-2 bg-gray-04"
                  >
                    <div className="inline-flex items-center gap-2">
                      <div
                        className="size-2 rounded-full bg-teal-01"
                        style={{
                          backgroundColor: getVariantColor(chi.color_code),
                        }}
                      />
                      <p className="truncate text-sm font-medium text-gray-01">
                        {chi.title}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-3">
                      <p className="text-xs">
                        {chi.start_date}
                        {chi.end_date && ` — ${chi.end_date}`}
                      </p>
                      <Badge
                        variant={chi.color_code as any}
                        className="text-xs py-0.5 h-fit rounded-full"
                      >
                        {chi.category}
                      </Badge>
                      <Button
                        size={"sm"}
                        variant={"ghost"}
                        className="text-destructive hover:text-destructive py-0 h-fit"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant={"ghost"}
                  className="border rounded-md w-full h-10 bg-gray-04 text-sm text-primary"
                >
                  <Plus />
                  Add event to {item.term_name}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
}

const dummyData = {
  session_id: "session-2025-2026",
  session_name: "2025 / 2026 Academic Session",
  status: "Active",
  branches: [
    { id: "branch-001", name: "Primary — Magodo" },
    { id: "branch-002", name: "Secondary — Magodo" },
    { id: "branch-003", name: "Primary — Lekki" },
  ],
  terms: [
    {
      term_id: "t1-2025",
      term_name: "Term 1",
      status: "Completed",
      start_date: "2025-09-09",
      end_date: "2025-12-13",
      duration_weeks: 14,
      events: [
        {
          id: "evt-01",
          title: "Term 1 begins",
          start_date: "Sep 9, 2025",
          end_date: null,
          category: "Term",
          color_code: "blue",
        },
        {
          id: "evt-02",
          title: "First CA test",
          start_date: "Oct 6, 2025",
          end_date: "Oct 10, 2025",
          category: "Exam",
          color_code: "amber",
        },
        {
          id: "evt-03",
          title: "Mid-term break",
          start_date: "Oct 20, 2025",
          end_date: "Oct 24, 2025",
          category: "Holiday",
          color_code: "green",
        },
        {
          id: "evt-04",
          title: "PTA meeting",
          start_date: "Nov 8, 2025",
          end_date: null,
          category: "PTA",
          color_code: "red",
        },
        {
          id: "evt-05",
          title: "End of term exams",
          start_date: "Nov 24, 2025",
          end_date: "Dec 6, 2025",
          category: "Exam",
          color_code: "teal",
        },
        {
          id: "evt-06",
          title: "Result / report cards released",
          start_date: "Dec 10, 2025",
          end_date: null,
          category: "Results",
          color_code: "amber",
        },
        {
          id: "evt-07",
          title: "Term 1 ends",
          start_date: "Dec 13, 2025",
          end_date: null,
          category: "Term",
          color_code: "green",
        },
      ],
    },
    {
      term_id: "t2-2026",
      term_name: "Term 2",
      status: "Ongoing",
      start_date: "2026-01-12",
      end_date: "2026-04-03",
      duration_weeks: 12,
      events: [
        {
          id: "evt-01",
          title: "Term 2 begins",
          start_date: "Jan 9, 2026",
          end_date: null,
          category: "Term",
          color_code: "blue",
        },
        {
          id: "evt-05",
          title: "End of term exams",
          start_date: "Nov 24, 2025",
          end_date: "Dec 6, 2025",
          category: "Exam",
          color_code: "teal",
        },
        {
          id: "evt-06",
          title: "Result / report cards released",
          start_date: "Dec 10, 2025",
          end_date: null,
          category: "Results",
          color_code: "amber",
        },
        {
          id: "evt-07",
          title: "Term 2 ends",
          start_date: "Mar 13, 2026",
          end_date: null,
          category: "Term",
          color_code: "green",
        },
      ],
    },
    {
      term_id: "t#-#0#6",
      term_name: "Term 2",
      status: "Not Started",
      start_date: "2026-01-12",
      end_date: "2026-04-03",
      duration_weeks: 12,
      events: [],
    },
  ],
};
