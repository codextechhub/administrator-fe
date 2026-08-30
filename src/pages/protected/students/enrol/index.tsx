import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PageShell } from "@/components/layout/page-shell";
import { routesPath } from "@/routes/routesPath";
import { useBranchLens } from "@/hooks/use-branch-lens";
import { apiDetailMessage, parseApiError } from "@/utils/api-error";
import { useGetClassesQuery } from "@/redux/services/academics/academics-api";
import {
  useEnrolStudentMutation,
  useGetAdmissionPolicyQuery,
} from "@/redux/services/students/students-api";
import type { EnrolWrite, Gender } from "@/redux/services/students/students-types";

import { ConfirmDialog } from "../drawers/confirm-dialog";
import { Field, errorInputClass, inputClass } from "../drawers/drawer-shell";
import { GuardianRows, type GuardianDraft } from "./guardian-rows";

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Under 2 or over 25 is a mistyped year, not a pupil. Mirrors the backend. */
function dobProblem(value: string): string {
  if (!value) return "A date of birth is required.";
  const now = today();
  if (value > now) return "That date is in the future.";
  const years = Number(now.slice(0, 4)) - Number(value.slice(0, 4));
  if (years < 2) return "That would make the student under 2 years old.";
  if (years > 25) return "That would make the student over 25. Check the year.";
  return "";
}

/**
 * Enrol one student by hand, or save them as an applicant.
 *
 * **One form, one flag** - the same shape the backend takes. Two forms would be
 * two sets of rules and the second would be the one that forgets a check. The
 * flag moves which field is required: an enrolment joins a CLASS, an applicant
 * records the LEVEL applied for, because nobody has given them a seat yet.
 *
 * **The admission number is optional and the school owns its format.** The
 * design pre-fills the next free number in `BFS/YYYY/NNNN`, which is right for
 * Brightfield and wrong for the platform - Corona numbers its students
 * `CSS-24-0117`. The rule lives in the school's admission policy, so this reads
 * it, shows the school's own hint, and requires the field only when the school
 * says it is required. There is no next-number generator on the backend, so
 * nothing is pre-filled rather than a Brightfield-shaped guess being offered to
 * every school.
 *
 * **Duplicate and over-capacity are the server's questions to ask.** Both are
 * sent false; the server refuses, and only then does the form put the question
 * to the registrar. "Is this a different child with the same name and birthday?"
 * is not ours to answer on their behalf.
 */
export default function EnrolStudent() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const branchLens = useBranchLens();

  // ?applicant=1 flips the form before anything is typed, so the Applicants
  // board can send someone straight to the right shape.
  const [asApplicant, setAsApplicant] = useState(params.get("applicant") === "1");

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "" as Gender | "",
    nationality: "Nigerian",
    state_of_origin: "",
    address: "",
    phone: "",
    email: "",
    previous_school: "",
    blood_group: "",
    allergies: "",
    conditions: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    student_number: "",
    enrolment_date: today(),
    school_class: "",
    applied_for: "",
    // Only asked at a multi-branch school. Below, and on the backend, the
    // dimension recedes entirely at a school with one site.
    branch: "",
  });
  const [guardians, setGuardians] = useState<GuardianDraft[]>([]);

  // A pinned lens is already an answer to "which branch", so the field reads
  // from it until somebody picks something else - DERIVED rather than copied
  // into state, so the two can never drift and switching the lens mid-form does
  // not silently keep the old branch. It stays editable: the lens is what you
  // are LOOKING at, not necessarily where the child attends.
  const lensBranch =
    branchLens.applies && branchLens.branch !== "all"
      ? String(branchLens.branch)
      : "";
  const branchValue = form.branch || lensBranch;

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confirmDuplicate, setConfirmDuplicate] = useState<string | null>(null);
  const [allowOverCapacity, setAllowOverCapacity] = useState(false);

  const { data: classesData } = useGetClassesQuery();
  const { data: policyData } = useGetAdmissionPolicyQuery();
  const [enrol, { isLoading }] = useEnrolStudentMutation();

  const classes = useMemo(() => classesData?.data ?? [], [classesData]);
  const policy = policyData?.data;

  // Levels come from the classes the school runs, so an applicant can never be
  // recorded against a level the school does not teach.
  const levels = useMemo(() => {
    const seen = new Map<number, string>();
    for (const c of classes) if (c.level && c.level_name) seen.set(c.level, c.level_name);
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [classes]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  const problems = useMemo(() => {
    const out: Record<string, string> = {};
    if (!form.first_name.trim()) out.first_name = "A first name is required.";
    if (!form.last_name.trim()) out.last_name = "A last name is required.";
    if (!form.gender) out.gender = "Pick a gender.";
    const dob = dobProblem(form.date_of_birth);
    if (dob) out.date_of_birth = dob;

    if (asApplicant) {
      if (!form.applied_for) out.applied_for = "Say which level they applied for.";
    } else if (!form.school_class) {
      out.school_class = "Pick the class this student is joining.";
    }

    // A student always has a branch. "The whole school" is not a place a child
    // attends, so the server refuses a multi-branch enrolment without one - and
    // asking here beats a 400 after the form has been filled in.
    if (branchLens.applies && !branchValue) {
      out.branch = "Say which branch this student attends.";
    }

    const number = form.student_number.trim();
    if (policy?.required && !number) {
      out.student_number =
        policy.hint || "This school requires an admission number.";
    } else if (number && policy?.pattern) {
      let ok = true;
      try {
        ok = new RegExp(policy.pattern).test(number);
      } catch {
        // A pattern this browser cannot compile is the school's problem to fix,
        // not a reason to block an enrolment: let the server be the judge.
        ok = true;
      }
      if (!ok) {
        out.student_number =
          policy.hint || "That does not match this school's admission number format.";
      }
    }

    const filled = guardians.filter((g) =>
      g.kind === "existing" ? Boolean(g.guardianId) : g.full_name.trim() && g.phone.trim(),
    );
    if (filled.length === 0) {
      out.guardians = "Link at least one guardian.";
    } else if (!filled.some((g) => g.is_primary)) {
      out.guardians = "Mark one guardian as the primary contact.";
    } else if (filled.some((g) => !g.relationship)) {
      out.guardians = "Set the relationship for every guardian.";
    }
    return out;
  }, [form, guardians, asApplicant, policy, branchLens.applies, branchValue]);

  const valid = Object.keys(problems).length === 0;
  const err = (key: string) => (touched[key] ? problems[key] : undefined);

  const chosenClass = classes.find((c) => String(c.id) === form.school_class);

  function body(extra: Partial<EnrolWrite>): EnrolWrite {
    const clean = (v: string) => v.trim();
    return {
      first_name: clean(form.first_name),
      middle_name: clean(form.middle_name),
      last_name: clean(form.last_name),
      date_of_birth: form.date_of_birth,
      gender: form.gender as Gender,
      nationality: clean(form.nationality),
      state_of_origin: clean(form.state_of_origin),
      address: clean(form.address),
      phone: clean(form.phone),
      email: clean(form.email),
      previous_school: clean(form.previous_school),
      blood_group: clean(form.blood_group),
      allergies: clean(form.allergies),
      conditions: clean(form.conditions),
      emergency_contact_name: clean(form.emergency_contact_name),
      emergency_contact_phone: clean(form.emergency_contact_phone),
      student_number: clean(form.student_number),
      as_applicant: asApplicant,
      ...(branchLens.applies && branchValue ? { branch: branchValue } : {}),
      ...(asApplicant
        ? { applied_for: Number(form.applied_for) }
        : {
            school_class: Number(form.school_class),
            enrolment_date: form.enrolment_date,
          }),
      allow_over_capacity: allowOverCapacity,
      confirm_duplicate: false,
      guardians: guardians
        .filter((g) =>
          g.kind === "existing" ? Boolean(g.guardianId) : g.full_name.trim(),
        )
        .map((g) =>
          g.kind === "existing"
            ? {
                guardian_id: g.guardianId,
                relationship: g.relationship,
                is_primary: g.is_primary,
              }
            : {
                full_name: g.full_name.trim(),
                phone: g.phone.trim(),
                ...(g.email.trim() ? { email: g.email.trim() } : {}),
                relationship: g.relationship,
                is_primary: g.is_primary,
              },
        ),
      ...extra,
    };
  }

  async function submit(extra: Partial<EnrolWrite> = {}) {
    if (!valid) {
      setTouched(
        Object.fromEntries(Object.keys(problems).map((k) => [k, true])),
      );
      toast.error("Some required details are missing. They are marked below.");
      return;
    }
    try {
      const created = await enrol(body(extra)).unwrap();
      toast.success(created.message || "Student saved.");
      navigate(
        asApplicant
          ? routesPath.PROTECTED.STUDENTS.APPLICANTS
          : routesPath.PROTECTED.STUDENTS.PROFILE_ID(created.data.id),
      );
    } catch (error) {
      const { code } = parseApiError(error);
      const message = apiDetailMessage(error, "We could not save that student.");
      // Two refusals are questions rather than faults, and each gets asked
      // rather than being pre-answered on the registrar's behalf.
      if (code === "DUPLICATE_STUDENT" || /already on the roll/i.test(message)) {
        setConfirmDuplicate(message);
        return;
      }
      if (/capacit/i.test(message) && !allowOverCapacity) {
        setAllowOverCapacity(true);
        toast.warning(`${message} Save again to go ahead anyway.`);
        return;
      }
      toast.error(message);
    }
  }

  return (
    <PageShell className="content-start gap-6 pb-24" grid>
      {/* One form, one flag. Switching re-labels the section below rather than
          navigating, so nothing typed so far is lost. */}
      <div className="inline-flex w-fit rounded-full border border-white-02 bg-white p-0.5">
        {[
          { key: false, label: "Enrol a student" },
          { key: true, label: "Save as an applicant" },
        ].map((t) => (
          <button
            key={String(t.key)}
            type="button"
            onClick={() => setAsApplicant(t.key)}
            className={
              asApplicant === t.key
                ? "rounded-full bg-white-03 px-3.5 py-1.5 text-sm font-semibold text-primary"
                : "rounded-full px-3.5 py-1.5 text-sm text-gray-05"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <Section title="The student">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="First name" error={err("first_name")}>
            <input
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
              onBlur={() => touch("first_name")}
              className={err("first_name") ? errorInputClass : inputClass}
            />
          </Field>
          <Field label="Middle name (optional)">
            <input
              value={form.middle_name}
              onChange={(e) => set("middle_name", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Last name" error={err("last_name")}>
            <input
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
              onBlur={() => touch("last_name")}
              className={err("last_name") ? errorInputClass : inputClass}
            />
          </Field>
          <Field
            label="Date of birth"
            error={err("date_of_birth")}
            hint={
              !problems.date_of_birth && form.date_of_birth
                ? `${Number(today().slice(0, 4)) - Number(form.date_of_birth.slice(0, 4))} years old`
                : undefined
            }
          >
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set("date_of_birth", e.target.value)}
              onBlur={() => touch("date_of_birth")}
              className={err("date_of_birth") ? errorInputClass : inputClass}
            />
          </Field>
          <Field label="Gender" error={err("gender")}>
            <NativeSelect
              value={form.gender}
              onChange={(e) => {
                set("gender", e.target.value);
                touch("gender");
              }}
              className="h-9"
            >
              <option value="">Select a gender</option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
            </NativeSelect>
          </Field>
          <Field label="Nationality">
            <input
              value={form.nationality}
              onChange={(e) => set("nationality", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="State of origin">
            <input
              value={form.state_of_origin}
              onChange={(e) => set("state_of_origin", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Previous school (optional)">
            <input
              value={form.previous_school}
              onChange={(e) => set("previous_school", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title={asApplicant ? "The application" : "Admission"}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {/* Absent at a single-branch school: the dimension recedes there and
              the server fills it in, so asking would be a question with one
              answer. */}
          {branchLens.applies && (
            <Field
              label="Branch"
              error={err("branch")}
              hint="Where this student attends. It cannot be changed here later."
            >
              <NativeSelect
                value={branchValue}
                onChange={(e) => {
                  set("branch", e.target.value);
                  touch("branch");
                }}
                className="h-9"
              >
                <option value="">Select a branch</option>
                {branchLens.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}

          {asApplicant ? (
            <Field label="Level applied for" error={err("applied_for")}>
              <NativeSelect
                value={form.applied_for}
                onChange={(e) => {
                  set("applied_for", e.target.value);
                  touch("applied_for");
                }}
                className="h-9"
              >
                <option value="">Select a level</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ) : (
            <>
              <Field label="Entry class" error={err("school_class")}>
                <NativeSelect
                  value={form.school_class}
                  onChange={(e) => {
                    set("school_class", e.target.value);
                    touch("school_class");
                    setAllowOverCapacity(false);
                  }}
                  className="h-9"
                >
                  <option value="">Select a class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Admission date">
                <input
                  type="date"
                  value={form.enrolment_date}
                  onChange={(e) => set("enrolment_date", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </>
          )}

          <Field
            label={
              policy?.required ? "Admission number" : "Admission number (optional)"
            }
            error={err("student_number")}
            hint={
              policy?.hint ||
              (policy?.required
                ? undefined
                : "This school has not set a format. Leave it blank to issue one later.")
            }
          >
            <input
              value={form.student_number}
              onChange={(e) => set("student_number", e.target.value)}
              onBlur={() => touch("student_number")}
              className={err("student_number") ? errorInputClass : inputClass}
            />
          </Field>
        </div>

        {chosenClass && !asApplicant && (
          <p className="mt-3 text-xs text-gray-05">
            Joining {chosenClass.name}
            {chosenClass.capacity ? ` · capacity ${chosenClass.capacity}` : ""}.
          </p>
        )}
      </Section>

      <Section title="Contact">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Home address">
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Student phone (optional)">
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Student email (optional)">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <GuardianRows
        rows={guardians}
        onChange={setGuardians}
        error={touched.guardians ? problems.guardians : undefined}
      />

      <Section
        title="Medical"
        note="Optional, and restricted: only staff who hold the sensitive-data permission can read these back."
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Blood group">
            <input
              value={form.blood_group}
              onChange={(e) => set("blood_group", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Allergies">
            <input
              value={form.allergies}
              onChange={(e) => set("allergies", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Conditions">
            <input
              value={form.conditions}
              onChange={(e) => set("conditions", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Emergency contact">
            <input
              value={form.emergency_contact_name}
              onChange={(e) => set("emergency_contact_name", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Emergency phone">
            <input
              value={form.emergency_contact_phone}
              onChange={(e) => set("emergency_contact_phone", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white-02 pt-4">
        <span className="mr-auto text-xs text-gray-05" aria-live="polite">
          {valid
            ? "Ready to save."
            : `${Object.keys(problems).length} ${Object.keys(problems).length === 1 ? "detail" : "details"} still needed`}
        </span>
        <Button
          variant="outline"
          onClick={() => navigate(routesPath.PROTECTED.STUDENTS.INDEX)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button onClick={() => submit()} disabled={isLoading}>
          {isLoading
            ? "Saving…"
            : asApplicant
              ? "Save applicant"
              : allowOverCapacity
                ? "Enrol anyway"
                : "Enrol student"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDuplicate != null}
        onCancel={() => setConfirmDuplicate(null)}
        onConfirm={() => {
          setConfirmDuplicate(null);
          void submit({ confirm_duplicate: true });
        }}
        title="Is this a different child?"
        body={confirmDuplicate ?? ""}
        confirmLabel="Yes, enrol them"
        busy={isLoading}
      />
    </PageShell>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold text-black-01">{title}</h3>
      {note && <p className="mt-0.5 text-xs text-gray-05">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
