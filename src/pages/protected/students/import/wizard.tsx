import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiDetailMessage } from "@/utils/api-error";
import {
  useGetImportIssuesQuery,
  useStartImportMutation,
  useUploadImportFileMutation,
  useValidateImportBatchMutation,
} from "@/redux/services/import-data/import-api";
import type {
  ImportBatch,
  ImportValidationSummary,
} from "@/redux/services/import-data/import-types";

import { ConfirmDialog } from "../drawers/confirm-dialog";

const STEPS = ["Upload", "Check", "Confirm", "Done"] as const;

/**
 * The import walkthrough.
 *
 * **Four steps, not the design's seven.** The design draws Upload, Columns,
 * Validation, Review, Confirm, Import and Done - but three of those describe
 * work the engine does in one call and reports on once. A step a reader presses
 * Next through is not a step, it is a page of the same step; column matching in
 * particular is something the engine decides and never asks about, so drawing a
 * screen for it would promise a control that does not exist.
 *
 * **Nothing is written until Confirm.** Upload stores the file, Check validates
 * it and reports, and only Start writes rows. A batch abandoned before that
 * point has cost the school nothing, which is why leaving mid-way is allowed
 * without ceremony.
 *
 * **Errors block and warnings do not**, which is the engine's rule and the one
 * thing this screen must not soften: a file with errors offers no way forward
 * except fixing it, and a file with only warnings says what will be read
 * differently and lets the school proceed.
 */
export function ImportWizard({
  open,
  templateId,
  fileFormat,
  onClose,
}: {
  open: boolean;
  templateId: number;
  fileFormat: string;
  onClose: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [summary, setSummary] = useState<ImportValidationSummary | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [abandoning, setAbandoning] = useState(false);

  const [upload, { isLoading: uploading }] = useUploadImportFileMutation();
  const [validate, { isLoading: validating }] = useValidateImportBatchMutation();
  const [start, { isLoading: starting }] = useStartImportMutation();

  const { data: issues, isLoading: issuesLoading } = useGetImportIssuesQuery(
    batch?.id as number,
    { skip: !batch?.id || step < 1 },
  );

  const blocked = Boolean(summary?.has_critical_errors || summary?.error_count);

  function reset() {
    setStep(0);
    setFile(null);
    setBatch(null);
    setSummary(null);
  }

  function leave() {
    // Before Confirm nothing has been written, so leaving costs the school
    // nothing and does not need a warning. After it, the run is the engine's
    // and closing the panel does not stop it.
    if (step === 1 && batch) {
      setAbandoning(true);
      return;
    }
    reset();
    onClose();
  }

  async function doUpload() {
    if (!file) return;
    const body = new FormData();
    // `template_id`, which is what the engine's serializer names. Sending
    // `template` was accepted by the browser and refused by the server with a
    // field error the generic toast then hid.
    body.append("template_id", String(templateId));
    body.append("file", file);
    try {
      const created = await upload(body).unwrap();
      setBatch(created.data);
      setStep(1);
      // Validation follows the upload without asking: a file that has been
      // uploaded and not checked is a batch in limbo, and nobody wants to
      // press a second button to find out whether their file is any good.
      const checked = await validate(created.data.id).unwrap();
      setSummary(checked.data?.summary ?? null);
    } catch (error) {
      // The field detail, not the generic envelope message: a serializer
      // refusal puts the sentence worth reading in `detail.<field>` and leaves
      // `message` as "An error occurred", which tells nobody anything.
      toast.error(apiDetailMessage(error, "We could not read that file."));
    }
  }

  async function doStart() {
    if (!batch) return;
    setConfirming(false);
    try {
      await start(batch.id).unwrap();
      setStep(3);
      toast.success("Import started. The students appear as it runs.");
    } catch (error) {
      toast.error(apiDetailMessage(error, "We could not start that import."));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white sm:max-w-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white-02 p-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-black-01">
              Import students
            </h2>
            <p className="mt-0.5 text-xs text-gray-05">
              Step {step + 1} of {STEPS.length} · {STEPS[step]}
            </p>
          </div>
          <button
            type="button"
            onClick={leave}
            aria-label="Close"
            className="text-gray-05 hover:text-black-01"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-w-0 flex-1 overflow-y-auto p-4">
          {/* ── 1. the file ─────────────────────────────────────────────── */}
          {step === 0 && (
            <div className="grid gap-3">
              <input
                ref={fileInput}
                type="file"
                accept={fileFormat === "csv" ? ".csv" : ".xlsx,.xls,.csv"}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white-02 p-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileSpreadsheet className="size-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-black-01">{file.name}</p>
                      <p className="text-xs text-gray-05">
                        {Math.max(1, Math.round(file.size / 1024))} KB
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setFile(null)}>
                    Remove
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="rounded-xl border border-dashed border-white-02 px-4 py-10 text-center hover:border-primary/40"
                >
                  <FileSpreadsheet className="mx-auto size-6 text-gray-05" />
                  <p className="mt-2 text-sm text-black-01">
                    Choose a file to import
                  </p>
                  <p className="mt-0.5 text-xs text-gray-05">
                    Use the template, so the headings match.
                  </p>
                </button>
              )}
            </div>
          )}

          {/* ── 2. what the engine found ────────────────────────────────── */}
          {step === 1 && (
            <div className="grid gap-3">
              {validating || issuesLoading ? (
                <>
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      "rounded-xl border p-4",
                      blocked
                        ? "border-red-200 bg-red-50"
                        : "border-green-700/30 bg-green-700/5",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        blocked ? "text-red-700" : "text-green-800",
                      )}
                    >
                      {blocked
                        ? `${summary?.error_rows ?? summary?.error_count ?? 0} ${
                            (summary?.error_rows ?? 0) === 1 ? "row" : "rows"
                          } cannot be imported`
                        : "Every row is ready to import"}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-05">
                      {blocked
                        ? "Fix these in the file and upload it again. Nothing has been written."
                        : summary?.warning_count
                          ? `${summary.warning_count} warnings will be imported as read. Nothing blocks you.`
                          : "No problems found."}
                    </p>
                  </div>

                  {(issues ?? []).length > 0 && (
                    <ul className="grid gap-2">
                      {(issues ?? []).slice(0, 50).map((issue, i) => (
                        <li
                          key={issue.id ?? `${issue.row}-${issue.column}-${i}`}
                          className={cn(
                            "border-l-2 pl-3",
                            issue.severity === "error"
                              ? "border-red-400"
                              : "border-amber-400",
                          )}
                        >
                          <p className="text-sm text-black-01">
                            {issue.row != null ? `Row ${issue.row}` : "The file"}
                            {issue.column ? ` · ${issue.column}` : ""}
                          </p>
                          <p className="text-xs text-gray-05">{issue.message}</p>
                        </li>
                      ))}
                      {(issues ?? []).length > 50 && (
                        <li className="text-xs text-gray-05">
                          {(issues ?? []).length - 50} more not shown. Fix these
                          first and check again.
                        </li>
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 3. confirm ──────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="grid gap-3">
              <dl className="grid gap-2">
                {[
                  ["File", batch?.original_filename ?? "-"],
                  ["Rows in the file", String(batch?.total_rows ?? "-")],
                  ["Warnings", String(summary?.warning_count ?? 0)],
                  ["Status on creation", "Enrolled"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid gap-0.5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-3"
                  >
                    <dt className="text-xs text-gray-05">{label}</dt>
                    <dd className="min-w-0 break-words text-sm text-black-01">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="rounded-lg bg-gray-04 px-3 py-2 text-xs text-gray-05">
                Students are created as Enrolled, with no class. Place them from
                Classes &amp; Transfers afterwards.
              </p>
            </div>
          )}

          {/* ── 4. done ─────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="grid gap-3 py-6 text-center">
              <p className="text-sm font-semibold text-black-01">
                The import is running
              </p>
              <p className="text-xs text-gray-05">
                The engine writes the rows in the background. Close this and the
                batch shows its result in Past imports when it finishes.
              </p>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white-02 p-4">
          {step === 0 && (
            <>
              <Button variant="outline" onClick={leave}>
                Cancel
              </Button>
              <Button onClick={doUpload} disabled={!file || uploading}>
                {uploading ? "Uploading…" : "Upload and check"}
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <Button variant="outline" onClick={leave}>
                Cancel
              </Button>
              {blocked ? (
                <Button
                  onClick={() => {
                    reset();
                  }}
                >
                  Upload a fixed file
                </Button>
              ) : (
                <Button onClick={() => setStep(2)} disabled={validating}>
                  Continue
                </Button>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setConfirming(true)} disabled={starting}>
                Start import
              </Button>
            </>
          )}
          {step === 3 && (
            <Button
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Done
            </Button>
          )}
        </footer>
      </div>

      <ConfirmDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={doStart}
        title="Create these students?"
        body={`${batch?.total_rows ?? "The"} rows will be created as enrolled students. This cannot be undone from here.`}
        confirmLabel="Start import"
        busy={starting}
      />

      <ConfirmDialog
        open={abandoning}
        onCancel={() => setAbandoning(false)}
        onConfirm={() => {
          setAbandoning(false);
          reset();
          onClose();
        }}
        title="Leave this import?"
        body="Nothing has been written yet, so the file is simply discarded. You can upload it again at any time."
        confirmLabel="Leave"
      />
    </div>
  );
}
