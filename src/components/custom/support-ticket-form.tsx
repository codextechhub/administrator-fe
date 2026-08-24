import { useRef, useState } from "react";
import { useFormik } from "formik";
import { CircleCheckBig, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { CustomTextArea } from "@/components/custom/custom-textarea";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import { selectUser } from "@/redux/features/auth/auth-slice";
import {
  useAddTicketAttachmentMutation,
  useCreateTicketMutation,
} from "@/redux/services/support/support-api";
import type {
  TicketCategory,
  TicketPriority,
} from "@/redux/services/support/support-types";
import { escalationSchema } from "@/schema/onboarding";
import { apiErrorMessage } from "@/utils/api-error";
import { useOnboardingState } from "@/pages/protected/onboarding/use-onboarding-state";

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

/**
 * What the server will take, mirrored here so the picker offers the same set.
 *
 * The server is the rule: it checks the extension, the size, AND that the
 * bytes match the extension, which is the check a file picker cannot make.
 * This attribute just saves somebody choosing a file that was always going to
 * be refused.
 */
const ACCEPTED_FILES = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.csv,.xls,.xlsx";
const MAX_ATTACHMENT_MB = 10;
const MAX_ATTACHMENTS = 5;

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
  submitLabel = "Create ticket",
  compact = false,
  className,
}: {
  prefill?: EscalationPrefill;
  /** Called by the Cancel button. Omit it and no Cancel is offered. */
  onCancel?: () => void;
  cancelLabel?: string;
  /** Called by the confirmation's primary button. */
  onDone?: () => void;
  doneLabel?: string;
  submitLabel?: string;
  /**
   * Tighter, for the header panel: less air between fields, and the actions
   * right-aligned under them rather than left-aligned like a page form.
   */
  compact?: boolean;
  className?: string;
}) {
  const user = useAppSelector(selectUser);
  const { state } = useOnboardingState();
  const [createTicket, { isLoading }] = useCreateTicketMutation();
  const [addAttachment] = useAddTicketAttachmentMutation();
  const [reference, setReference] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  // Files that did not upload after the ticket itself was created. The ticket
  // is real and the person must not be told it failed, so this is reported on
  // the confirmation rather than as an error.
  const [failedFiles, setFailedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const filePicker = useRef<HTMLInputElement>(null);

  const addFiles = (chosen: FileList | null) => {
    if (!chosen?.length) return;
    setFileError("");
    const next = [...files];
    for (const file of Array.from(chosen)) {
      if (next.length >= MAX_ATTACHMENTS) {
        setFileError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
        break;
      }
      if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
        setFileError(`${file.name} is over ${MAX_ATTACHMENT_MB} MB.`);
        continue;
      }
      // Same file chosen twice is a slip, not an intent.
      const already = next.some(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      );
      if (!already) next.push(file);
    }
    setFiles(next);
    if (filePicker.current) filePicker.current.value = "";
  };

  // Which step the person was on. Taken from whoever opened the form, or the
  // first required step still outstanding - the one they are most likely stuck
  // on. It is a catalog key on a closed allowlist, never free text.
  //
  // Sent with the ticket but NOT shown. It is routing information for the
  // people who pick the ticket up, and printing it back at a school made them
  // read a paragraph about plumbing they had not asked about.
  const outstanding =
    state?.tasks.filter(
      (task) => task.status !== "DONE" && task.status !== "SKIPPED",
    ) ?? [];
  const contextTaskKey =
    prefill.taskKey ??
    outstanding.find((task) => task.is_required)?.key ??
    outstanding[0]?.key;

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

        // Uploaded one at a time, after the ticket exists, because that is what
        // the endpoint takes. A file that fails here does NOT fail the ticket:
        // it is already filed, and telling somebody otherwise would have them
        // raise it a second time.
        if (files.length) {
          setUploading(true);
          const failed: string[] = [];
          for (const file of files) {
            try {
              await addAttachment({
                ticketId: String(result.data.id),
                file,
              }).unwrap();
            } catch {
              failed.push(file.name);
            }
          }
          setFailedFiles(failed);
          setUploading(false);
        }

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
        {failedFiles.length > 0 ? (
          // Said plainly and separately from the reference. The ticket IS
          // filed; only the files did not make it, and somebody who reads
          // "something went wrong" here will raise the whole thing again.
          <p className="text-[13px] text-error-text max-w-[52ch] text-pretty">
            Your ticket is filed, but {failedFiles.join(", ")} did not upload.
            Reply to the confirmation email to send{" "}
            {failedFiles.length === 1 ? "it" : "them"}.
          </p>
        ) : (
          <p className="text-[13px] text-gray-05 max-w-[52ch] text-pretty">
            The full support desk opens when your school goes live.
          </p>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {onDone && <Button onClick={onDone}>{doneLabel}</Button>}
          <Button
            variant="outline"
            onClick={() => {
              setReference("");
              setFiles([]);
              setFailedFiles([]);
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
      className={cn(compact ? "space-y-3 min-w-0" : "space-y-4 min-w-0", className)}
    >
      <div>
        <CustomInput
          id="title"
          label="Title"
          isRequired
          placeholder="Briefly describe the issue"
          maxLength={220}
          {...formik.getFieldProps("title")}
          error={formik.touched.title ? formik.errors.title : ""}
        />
        <p className="mt-1 text-right text-xs text-gray-05">
          {formik.values.title.length}/220
        </p>
      </div>

      <CustomTextArea
        id="description"
        label="Description"
        isRequired
        rows={5}
        placeholder="What happened, what did you expect, and what have you tried?"
        {...formik.getFieldProps("description")}
        error={formik.touched.description ? formik.errors.description : ""}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CustomNativeSelect
          id="category"
          label="Category"
          options={CATEGORY_OPTIONS}
          placeholder="Pick a category"
          {...formik.getFieldProps("category")}
          error={formik.touched.category ? formik.errors.category : ""}
        />

        <CustomNativeSelect
          id="priority"
          label="Priority"
          options={PRIORITY_OPTIONS}
          placeholder="Pick a priority"
          {...formik.getFieldProps("priority")}
          error={formik.touched.priority ? formik.errors.priority : ""}
        />
      </div>

      <div>
        <input
          ref={filePicker}
          type="file"
          multiple
          accept={ACCEPTED_FILES}
          className="sr-only"
          onChange={(event) => addFiles(event.target.files)}
        />
        <button
          type="button"
          onClick={() => filePicker.current?.click()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-white px-3 py-3 text-xs font-medium text-gray-05 transition hover:border-primary/35 hover:text-primary"
        >
          <Paperclip className="size-4" />
          Add screenshots or files
        </button>
        <p className="mt-1.5 text-[11px] text-gray-05">
          Optional. Up to {MAX_ATTACHMENTS} files, {MAX_ATTACHMENT_MB} MB each.
          Images, PDFs and spreadsheets.
        </p>

        {files.length > 0 && (
          <ul className="mt-2 grid gap-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex items-center gap-2 rounded-md bg-gray-03 px-2.5 py-1.5"
              >
                <Paperclip className="size-3.5 shrink-0 text-gray-05" />
                <span className="min-w-0 flex-1 truncate text-xs text-black-01">
                  {file.name}
                </span>
                <span className="shrink-0 text-[10px] text-gray-05 tabular-nums">
                  {Math.max(1, Math.round(file.size / 1024))} KB
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setFiles(files.filter((_, i) => i !== index))
                  }
                  className="shrink-0 rounded p-0.5 text-gray-05 hover:bg-gray-04 hover:text-black-01"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {fileError && (
          <p className="mt-1.5 text-xs font-medium text-error-text">
            {fileError}
          </p>
        )}
      </div>

      {submitError && (
        <p className="text-xs font-medium text-error-text text-pretty">
          {submitError}
        </p>
      )}

      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          compact && "justify-end pt-1",
        )}
      >
        {compact && onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          loading={isLoading || uploading}
          disabled={!formik.isValid || !formik.dirty || isLoading || uploading}
        >
          {submitLabel}
        </Button>
        {!compact && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
