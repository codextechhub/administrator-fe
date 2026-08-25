import { GraduationCap, UsersRound } from "lucide-react";
import { useGetAcademicOverviewQuery } from "@/redux/services/academics/academics-api";

/**
 * Class teachers, and who sits in each class.
 *
 * This screen deliberately shows nothing rather than sample names, and that is
 * the design's decision rather than an unfinished corner. Both halves depend on
 * records that live OUTSIDE this module - staff and students - and neither
 * model exists in the product yet. Assignments are the one part of the academic
 * structure that cannot be designed ahead of its data.
 *
 * So each panel says what it will do, what has to exist first, and what opens
 * it. What it does NOT do is offer a button: a control that answers 403, or a
 * form with an empty picker, is a promise the platform breaks. The classes ARE
 * ready, and the panel says so, because "there is nothing here" and "there is
 * nothing here YET, and here is what is missing" are different messages and
 * only one of them can be acted on.
 */
export default function Assignments() {
  const { data } = useGetAcademicOverviewQuery();
  const classes = data?.data.counts.classes ?? 0;

  const panels = [
    {
      icon: UsersRound,
      title: "Class teachers",
      sub: "The teacher responsible for each class.",
      why:
        classes > 0
          ? `There ${classes === 1 ? "is 1 class" : `are ${classes} classes`} ready, but no staff records to assign to them. Teachers arrive with the staff import, or when they accept an invitation.`
          : "Teachers are assigned to classes here. Both have to exist first.",
      unlock: "Opens once at least one member of staff exists.",
    },
    {
      icon: GraduationCap,
      title: "Class lists",
      sub: "Which pupils sit in each class.",
      why: "Pupils are placed into classes here once student records exist. Nothing is created in this module.",
      unlock: "Opens once the student import has completed.",
    },
  ];

  return (
    <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
      <div>
        <h2 className="text-base font-medium text-black-01">Assignments</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-01 text-pretty">
          Who teaches each class, and who sits in it. Both depend on records that
          live outside this module, so neither can be filled in from here yet.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {panels.map((panel) => (
          <section
            key={panel.title}
            className="min-w-0 rounded-md bg-white px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-content-center rounded-md bg-gray-04 text-gray-06">
                <panel.icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-black-01">{panel.title}</p>
                <p className="text-xs text-gray-05">{panel.sub}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-white-02 bg-white-05 px-4 py-5 text-center">
              <p className="text-sm font-medium text-gray-06">Not yet available</p>
              <p className="mx-auto mt-1.5 max-w-sm text-xs text-gray-05 text-pretty">
                {panel.why}
              </p>
            </div>

            <p className="mt-3 text-xs text-gray-05">{panel.unlock}</p>
          </section>
        ))}
      </div>

      <p className="max-w-3xl text-xs text-gray-05 text-pretty">
        This screen shows nothing rather than sample names on purpose.
        Assignments are the one part of the academic structure that cannot be
        designed ahead of the data, so it stays empty until staff and students
        are real.
      </p>
    </main>
  );
}
