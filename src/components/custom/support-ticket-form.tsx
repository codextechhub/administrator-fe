import { useState } from "react";
import { useFormik } from "formik";
import { CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { CustomTextArea } from "@/components/custom/custom-textarea";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import { selectUser } from "@/redux/features/auth/auth-slice";
import { useCreateTicketMutation } from "@/redux/services/support/support-api";
import type {
  TicketCategory,
  TicketPriority,
} from "@/redux/services/support/support-types";
import { escalationSchema } from "@/schema/onboarding";
import { apiErrorMessage } from "@/utils/api-error";
import { useOnboardingState } from "@/pages/protected/onboarding/use-onboarding-state";
import { READINESS_LABEL } from "@/pages/protected/onboarding/onboarding-labels";

/**
 * The support ticket form, and the confirmation that follows it.
 *
 * Extracted from the Get Help page so the header's headset button can open the
 * same form in a sheet without navigating, the way console-fe's does. There is
 * one implementation and two frames around it: filing a ticket from the header
 * and filing one from the page must not drift into two different forms with two
 * different validation rules.
 *
 * Filing is all it does. The rest of the support desk - the ticket list, the
 * thread, attachments - opens at go-live, so the confirmation has to be
 * self-sufficient: the reference, what happens next, and that replies come by
 * email. No "track your ticket" link, because there is nothing to track
 * against yet.
 */

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: "SUPPORT", label: "Support request" },
  { value: "BUG", label: "Bug report" },
  { value: "HELP", label: "Help" },
  { value: "ACCOUNT", label: "Account" },
  { value: "BILLING", label: "Billing" },
  { value: "OTHER", label: "Other" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

/** What another screen can hand the form to prefill it. */
export interface EscalationPrefill {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  taskKey?: string;
}

export function SupportTicketForm({
  prefill = {},
  onCancel,
  cancelLabel = "Cancel",
  onDone,
  doneLabel = "Back to control room",
  className,
}: {
  prefill?: EscalationPrefill;
  /** Called by the Cancel button. Omit it and no Cancel is offered. */
  onCancel?: () => void;
  cancelLabel?: string;
  /** Called by the confirmation's primary button. */
  onDone?: () => void;
  doneLabel?: string;
  className?: string;
}) {
  const user = useAppSelector(selectUser);
  const { state } = useOnboardingState();
  const [createTicket, { isLoading }] = useCreateTicketMutation();
  const [reference, setReference] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Which step the person was on. Taken from whoever opened the form, or the
  // first required step still outstanding - the one they are most likely stuck
  // on. It is a catalog key on a closed allowlist, never free text.
  const outstanding =
    state?.tasks.filter(
      (task) => task.status !== "DONE" && task.status !== "SKIPPED",
    ) ?? [];
  const contextTaskKey =
    prefill.taskKey ??
    outstanding.find((task) => task.is_required)?.key ??
    outstanding[0]?.key;
  const contextTaskTitle = state?.tasks.find(
    (task) => task.key === contextTaskKey,
  )?.title;

  const formik = useFormik({
    initialValues: {
      title: prefill.title ?? "",
      description: prefill.description ?? "",
      category: (prefill.category ?? "SUPPORT") as TicketCategory,
      priority: (prefill.priority ?? "MEDIUM") as TicketPriority,
    },
    validationSchema: escalationSchema,
    onSubmit: async (values) => {
      setSubmitError("");
      try {
        const result = await createTicket({
          title: values.title.trim(),
          description: values.description.trim(),
          category: values.category,
          priority: values.priority,
          context: {
            product_area: "Onboarding",
            ...(contextTaskKey ? { onboarding_task_key: contextTaskKey } : {}),
            ...(state
              ? { onboarding_readiness_state: state.readiness_state }
              : {}),
          },
        }).unwrap();
        setReference(result.data.ticket_number);
      } catch (error) {
        setSubmitError(
          apiErrorMessage(error, "We could not file your ticket. Try again."),
        );
      }
    },
  });

  if (reference) {
    return (
      <div
        className={cn(
          "flex flex-col items-center text-center gap-3 min-w-0",
          className,
        )}
      >
        <span className="size-16 rounded-full bg-green-01/10 text-green-01 grid place-content-center">
          <CircleCheckBig className="size-8" strokeWidth={1.5} />
        </span>
        <h2 className="text-lg font-semibold font-mont text-black-01">
          Ticket filed
        </h2>
        <div className="mt-1">
          <p className="text-xs text-gray-05">Reference</p>
          <code className="mt-1 inline-block rounded-md bg-gray-03 px-3 py-1.5 font-mono text-sm text-black-01">
            {reference}
          </code>
        </div>
        <p className="text-[13px] text-gray-06 max-w-[52ch] text-pretty">
          Keep this reference. CodeX support will reply
          {user?.email ? ` to ${user.email}` : " by email"}, and you can answer
          them straight from that email.
        </p>
        <p className="text-[13px] text-gray-05 max-w-[52ch] text-pretty">
          Reply to the confirmation email if you need to send us a screenshot or
          a file. The full support desk opens when your school goes live.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {onDone && <Button onClick={onDone}>{doneLabel}</Button>}
          <Button
            variant="outline"
            onClick={() => {
              setReference("");
              formik.resetForm({
                values: {
                  title: "",
                  description: "",
                  category: "SUPPORT",
                  priority: "MEDIUM",
                },
              });
            }}
          >
            File another ticket
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={formik.handleSubmit}
      className={cn("space-y-4 min-w-0", className)}
    >
      <div>
        <CustomInput
          id="title"
          label="Title"
          isRequired
          placeholder="One line on what is wrong"
          maxLength={220}
          {...formik.getFieldProps("title")}
          error={formik.touched.title ? formik.errors.title : ""}
        />
        <p className="mt-1 text-right text-xs text-gray-05">
          {formik.values.title.length}/220
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CustomNativeSelect
          id="category"
          label="Category"
          isRequired
          options={CATEGORY_OPTIONS}
          placeholder="Pick a category"
          {...formik.getFieldProps("category")}
          error={formik.touched.category ? formik.errors.category : ""}
        />

        <div className="grid gap-1.5 h-fit">
          <span className="text-sm text-black-01 after:text-error after:content-['*'] after:pl-1.5">
            Priority
          </span>
          {/* A four-way choice reads better as a segmented control than as a
              second select beside the first. flex-wrap so it stacks rather
              than overflowing a 390px screen. */}
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((option) => {
              const active = formik.values.priority === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => formik.setFieldValue("priority", option.value)}
                  className={cn(
                    "h-9 rounded-sm border px-3.5 text-sm font-mont font-medium cursor-pointer transition-colors",
                    active
                      ? "border-primary bg-pry-01 text-primary"
                      : "border-border bg-white text-gray-01 hover:bg-gray-03",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <CustomTextArea
        id="description"
        label="Description"
        isRequired
        rows={5}
        placeholder="What were you trying to do, and what happened instead?"
        {...formik.getFieldProps("description")}
        error={formik.touched.description ? formik.errors.description : ""}
      />

      <div className="rounded-md border border-border p-3.5">
        <p className="text-xs text-gray-05">Sent with your ticket</p>
        {/* A closed allowlist, and that is the point: a ticket is read by
            staff outside this school, so nothing here is free text. */}
        <div className="mt-2 flex flex-wrap gap-2">
          <ContextChip label="Product area" value="Onboarding" />
          {contextTaskTitle && (
            <ContextChip label="Step" value={contextTaskTitle} />
          )}
          {state && (
            <ContextChip
              label="Readiness"
              value={READINESS_LABEL[state.readiness_state]}
            />
          )}
        </div>
        <p className="mt-2.5 text-xs text-gray-05 text-pretty">
          Reply to the confirmation email if you need to send us a screenshot or
          a file.
        </p>
      </div>

      {submitError && (
        <p className="text-xs font-medium text-error-text text-pretty">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          loading={isLoading}
          disabled={!formik.isValid || !formik.dirty || isLoading}
        >
          File ticket
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}

function ContextChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-03 px-2 py-1 text-xs text-gray-01">
      <span className="text-gray-05">{label}:</span>
      <span className="font-medium font-mont text-black-01">{value}</span>
    </span>
  );
}
