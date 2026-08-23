import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import { usePermissions } from "@/hooks/use-permissions";
import { apiErrorMessage, parseApiError } from "@/utils/api-error";
import {
  useGetImportBatchesQuery,
  useGetImportTemplatesQuery,
  useStartImportMutation,
  useUploadImportFileMutation,
  useValidateImportBatchMutation,
} from "@/redux/services/import-data/import-api";
import type {
  ImportIssue,
  ImportTemplateSummary,
  ImportValidationSummary,
} from "@/redux/services/import-data/import-types";
import { InlineNotice } from "./components/inline-notice";
import { datasetLabel, datasetBlurb } from "./onboarding-labels";

/**
 * "Upload Initial Datasets" - load the school's own data from a file.
 *
 * Three things about this screen are deliberate.
 *
 * **The dataset list is never filtered here.** Whatever the server offers is
 * what this school may load. CodeX's own provisioning templates are withheld
 * server-side, and a request naming one is refused - see the backend's
 * `vs_import_data/datasets.py`, which exists because a school administrator was
 * briefly able to provision a tenant through this very engine. A list
 * hard-coded in the client would drift from that rule and could only ever drift
 * in the dangerous direction.
 *
 * **Uploading is not importing.** A file is uploaded, then checked, then
 * committed, and nothing becomes a real row until the third step. The screen
 * keeps those visibly separate because the checking step is the one that saves
 * a school from a bad spreadsheet, and a single "Import" button would let a
 * reader skip past it without noticing.
 *
 * **It says what it cannot do.** Students, staff and parents are what a school
 * most expects to upload here, and there is no template for any of them yet.
 * The screen names that absence rather than presenting a short list as if it
 * were the whole story, because a school that uploads its branches and believes
 * it has finished has been misled by the silence.
 */

const HISTORY_COLUMNS = ["File", "Dataset", "Rows", "Status", "Uploaded"];

/** What the reader is doing right now, which decides what the panel shows. */
type Stage = "choose" | "checking" | "checked" | "committing" | "done";

export default function OnboardingImport() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const fileInput = useRef<HTMLInputElement>(null);

  const templates = useGetImportTemplatesQuery();
  const batches = useGetImportBatchesQuery();

  const [upload, uploadState] = useUploadImportFileMutation();
  const [check, checkState] = useValidateImportBatchMutation();
  const [commit, commitState] = useStartImportMutation();

  const [chosen, setChosen] = useState<ImportTemplateSummary | null>(null);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [summary, setSummary] = useState<ImportValidationSummary | null>(null);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [stage, setStage] = useState<Stage>("choose");

  const canCommit = hasPermission(P.COMMIT_IMPORT);
  const busy =
    uploadState.isLoading || checkState.isLoading || commitState.isLoading;

  const offered = templates.data ?? [];

  /** Start over without losing which dataset the reader picked. */
  function reset() {
    setBatchId(null);
    setSummary(null);
    setIssues([]);
    setStage("choose");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onFile(file: File) {
    if (!chosen) return;
    const body = new FormData();
    body.append("template_id", String(chosen.id));
    body.append("file", file);
    try {
      const created = await upload(body).unwrap();
      const id = created?.data?.id;
      if (!id) throw new Error("no batch");
      setBatchId(id);
      setStage("checking");
      // Checked immediately rather than behind a second button. The reader has
      // just handed over a file; the only useful next thing is what is wrong
      // with it, and making them ask for that is a step with no decision in it.
      const result = await check(id).unwrap();
      setSummary(result?.data?.summary ?? null);
      setIssues(result?.data?.issues ?? []);
      setStage("checked");
    } catch (error) {
      const parsed = parseApiError(error);
      toast.error(apiErrorMessage(parsed, "We could not read that file."));
      reset();
    }
  }

  async function onCommit() {
    if (batchId == null) return;
    setStage("committing");
    try {
      await commit(batchId).unwrap();
      setStage("done");
      toast.success("Your file is being imported.");
    } catch (error) {
      const parsed = parseApiError(error);
      toast.error(apiErrorMessage(parsed, "We could not start that import."));
      setStage("checked");
    }
  }

  const historyRows = useMemo(
    () =>
      (batches.data ?? []).map((batch) => ({
        File: batch.original_filename,
        Dataset: datasetLabel(batch.dataset_type),
        Rows: batch.total_rows ?? "-",
        Status: <StatusChip status={batch.status} failed={batch.has_critical_errors} />,
        Uploaded: new Date(batch.created_at).toLocaleDateString(),
      })),
    [batches.data],
  );

  const blocking = summary?.has_critical_errors ?? false;

  return (
    <div className="grid grid-cols-1 min-w-0 gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          className="h-8 px-2 text-gray-01"
          onClick={() => navigate(routesPath.PROTECTED.ONBOARDING.INDEX)}
        >
          <ArrowLeft className="size-4" />
          Control room
        </Button>
      </div>

      <header className="min-w-0">
        <h1 className="text-xl font-semibold text-black-01 font-mont text-balance">
          Upload Initial Datasets
        </h1>
        <p className="mt-1.5 text-sm text-gray-01 max-w-[70ch] text-pretty">
          Load your school's own records from a spreadsheet. Download the
          template for a dataset, fill it in, and upload it - we check the file
          and tell you what is wrong before anything is saved.
        </p>
      </header>

      {/* What this cannot do yet, said before the reader invests any effort. */}
      <InlineNotice tone="info" icon={Info} title="Students, staff and parents are not ready yet">
        There is no template for them, so they cannot be uploaded here today.
        You can skip this step and load them once your school is live. Staff who
        need to sign in can be invited from{" "}
        <button
          type="button"
          className="underline underline-offset-2 font-medium"
          onClick={() => navigate(routesPath.PROTECTED.ONBOARDING.STAFF)}
        >
          Add Staff &amp; Invitations
        </button>{" "}
        in the meantime.
      </InlineNotice>

      <section className="bg-white rounded-md px-3 py-4 sm:px-5 min-w-0">
        <h2 className="text-sm font-semibold text-black-01 font-mont">
          Choose a dataset
        </h2>

        {templates.isLoading ? (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : offered.length === 0 ? (
          <p className="mt-3 text-sm text-gray-05">
            No dataset is available for your school to upload right now.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {offered.map((template) => {
              const active = chosen?.id === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setChosen(template);
                    reset();
                  }}
                  className={[
                    "text-left rounded-md border p-4 transition-colors min-w-0",
                    active
                      ? "border-primary bg-pry-01"
                      : "border-border hover:border-gray-04",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileSpreadsheet className="size-4 shrink-0 mt-0.5 text-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black-01 truncate">
                        {datasetLabel(template.dataset_type)}
                      </p>
                      <p className="mt-1 text-xs text-gray-05 text-pretty">
                        {datasetBlurb(template.dataset_type)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {chosen && (
        <section className="bg-white rounded-md px-3 py-4 sm:px-5 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-black-01 font-mont">
                {datasetLabel(chosen.dataset_type)}
              </h2>
              {chosen.instructions && (
                <p className="mt-1 text-xs text-gray-05 max-w-[70ch] text-pretty">
                  {chosen.instructions}
                </p>
              )}
            </div>
            <a
              href={`/api/v1/import/system-import-templates/${chosen.id}/download/`}
              className="shrink-0"
            >
              <Button variant="outline" className="h-9">
                <Download className="size-4" />
                Download template
              </Button>
            </a>
          </div>

          <div className="mt-4 rounded-md border border-dashed border-gray-04 p-5 text-center">
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
            <Upload className="size-5 mx-auto text-gray-05" />
            <p className="mt-2 text-sm text-black-01">
              {stage === "checking"
                ? "Checking your file…"
                : `Upload your filled-in ${chosen.default_file_format.toUpperCase()} file`}
            </p>
            <Button
              variant="outline"
              className="mt-3 h-9"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              Choose file
            </Button>
          </div>

          {stage === "checked" && summary && (
            <div className="mt-4">
              {blocking ? (
                <InlineNotice
                  tone="danger"
                  icon={AlertTriangle}
                  title={`${summary.error_count} ${summary.error_count === 1 ? "problem" : "problems"} to fix first`}
                >
                  Nothing has been saved. Correct these in your file and upload
                  it again.
                </InlineNotice>
              ) : (
                <InlineNotice
                  tone="success"
                  icon={CheckCircle2}
                  title="Your file looks good"
                >
                  Nothing has been saved yet. Import it when you are ready.
                </InlineNotice>
              )}

              {issues.length > 0 && (
                <ul className="mt-3 grid gap-1.5 max-h-64 overflow-y-auto">
                  {issues.slice(0, 50).map((issue, index) => (
                    <li
                      key={issue.id ?? index}
                      className="flex items-start gap-2 text-xs text-gray-01"
                    >
                      <Badge
                        variant={issue.severity === "error" ? "rejected" : "pending"}
                        className="shrink-0"
                      >
                        {issue.row == null ? "File" : `Row ${issue.row}`}
                      </Badge>
                      <span className="min-w-0 text-pretty">
                        {issue.column ? `${issue.column}: ` : ""}
                        {issue.message}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {issues.length > 50 && (
                <p className="mt-2 text-xs text-gray-05">
                  Showing the first 50 of {issues.length}. Fix these and upload
                  again to see the rest.
                </p>
              )}

              {!blocking && (
                <PermissionGate permission={P.COMMIT_IMPORT}>
                  <Button
                    className="mt-4 h-10"
                    disabled={busy || !canCommit}
                    onClick={() => void onCommit()}
                  >
                    Import {summary.error_rows === 0 ? "this file" : "the good rows"}
                  </Button>
                </PermissionGate>
              )}
            </div>
          )}

          {stage === "committing" && (
            <p className="mt-4 text-sm text-gray-01">Importing your file…</p>
          )}

          {stage === "done" && (
            <div className="mt-4">
              <InlineNotice
                tone="success"
                icon={CheckCircle2}
                title="Import started"
              >
                Your rows are being created. This can take a moment for a large
                file - the history below updates when it finishes.
              </InlineNotice>
              <Button variant="outline" className="mt-3 h-9" onClick={reset}>
                Upload another file
              </Button>
            </div>
          )}
        </section>
      )}

      <PermissionGate permission={P.BROWSE_IMPORTS}>
        <section className="bg-white rounded-md px-3 py-4 sm:px-5 min-w-0">
          <h2 className="text-sm font-semibold text-black-01 font-mont">
            Your uploads
          </h2>
          <div className="mt-3 min-w-0">
            <CustomTable
              tableHeaderList={HISTORY_COLUMNS}
              tableBodyList={historyRows}
              loading={batches.isLoading}
              loadingText="Loading your uploads…"
              emptyText="You have not uploaded anything yet."
              hidePagination
            />
          </div>
        </section>
      </PermissionGate>
    </div>
  );
}

/**
 * The batch's state, in the school's words, coloured by who has to act.
 *
 * The engine has fourteen states because it distinguishes things a school does
 * not care about - detecting a dataset from mapping its columns. What a reader
 * needs to know is only ever one of three things: it worked, it needs me, or it
 * is still going. An unmapped state tidies its slug rather than being hidden,
 * so a state added on the backend still reads as something.
 */
const STATUS_LABEL: Record<string, { text: string; tone: "success" | "rejected" | "pending" }> = {
  import_succeeded: { text: "Imported", tone: "success" },
  import_partial: { text: "Partly imported", tone: "rejected" },
  import_failed: { text: "Import failed", tone: "rejected" },
  validation_failed: { text: "Needs fixing", tone: "rejected" },
  rolled_back: { text: "Rolled back", tone: "rejected" },
  cancelled: { text: "Cancelled", tone: "rejected" },
  import_queued: { text: "Importing", tone: "pending" },
  import_running: { text: "Importing", tone: "pending" },
  ready_to_import: { text: "Ready to import", tone: "pending" },
  uploaded: { text: "Checking", tone: "pending" },
  validating: { text: "Checking", tone: "pending" },
  detecting: { text: "Checking", tone: "pending" },
  mapping_required: { text: "Needs fixing", tone: "rejected" },
  draft: { text: "Not sent", tone: "pending" },
};

function StatusChip({ status, failed }: { status: string; failed: boolean }) {
  // A file with blocking problems reads as needing the reader whatever stage
  // the engine thinks it is at: the engine's state is about the pipeline, and
  // this column is about whose turn it is.
  if (failed) return <Badge variant="rejected">Needs fixing</Badge>;
  const known = STATUS_LABEL[status];
  if (known) return <Badge variant={known.tone}>{known.text}</Badge>;
  return <Badge variant="pending">{status.replace(/_/g, " ")}</Badge>;
}
