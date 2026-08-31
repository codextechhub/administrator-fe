import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { apiErrorMessage } from "@/utils/api-error";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import {
  useDownloadImportTemplateMutation,
  useGetImportBatchesQuery,
  useGetImportTemplateQuery,
  useGetImportTemplatesQuery,
} from "@/redux/services/import-data/import-api";

import { ImportWizard } from "./wizard";
import { batchOutcome, batchStatus } from "./batch-status";

/**
 * Loading a school's existing roll from a spreadsheet.
 *
 * **This module orchestrates; the Data Import Engine owns the work.** The
 * engine validates, writes and records the batch. What lives here is the
 * walkthrough and the reporting back - so a rule about what a student row may
 * contain has exactly one home, and this screen cannot disagree with it.
 *
 * **The column list is the server's template, not the design's.** The design
 * draws twelve columns; the seeded `students_v1` template carries more, adding
 * branch and a guardian email precisely because the design's twelve would split
 * every family imported in one file. Writing the list here would be a second
 * copy that goes stale the first time the template changes.
 */
export default function StudentImport() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const { hasPermission } = usePermissions();
  // Held separately from "may add a student". A registrar who enrols one child
  // by hand is not thereby cleared to write four hundred rows in one action,
  // and the backend seeds the two keys apart for that reason.
  const mayImport = hasPermission(P.IMPORT_STUDENTS);

  const { data: templates, isLoading: templatesLoading } =
    useGetImportTemplatesQuery();

  // The students template, found by dataset rather than by name or position:
  // the catalogue holds every dataset the school may load and its order is not
  // ours to rely on.
  const template = useMemo(
    () => (templates ?? []).find((t) => t.dataset_type === "students"),
    [templates],
  );

  const { data: detail, isLoading: detailLoading } = useGetImportTemplateQuery(
    template?.id as number,
    { skip: !template?.id },
  );

  const { data: batches, isLoading: batchesLoading } = useGetImportBatchesQuery(
    template?.id ? { templateId: template.id } : undefined,
  );

  const [download, { isLoading: downloading }] =
    useDownloadImportTemplateMutation();

  const columns = detail?.columns ?? [];
  const rows = useMemo(
    () => (batches ?? []).filter((b) => b.dataset_type === "students"),
    [batches],
  );

  async function getTemplate() {
    if (!template) return;
    try {
      const { url, filename } = await download({
        id: template.id,
        name: template.name,
        format: template.default_file_format,
      }).unwrap();
      // A blob the browser saves, because the route is behind JWT auth and a
      // plain link would fetch it without the header and get a 401.
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "We could not download that template."));
    }
  }

  // The sidebar already hides this door, but a link or a typed URL still
  // reaches it - and a screen that renders its upload button and is refused on
  // press is worse than one that says so first.
  if (!mayImport) {
    return (
      <PageShell>
        <OutlinedNotice
          icon={Upload}
          title="You cannot import students"
          body="Loading a roll from a spreadsheet needs a permission your role does not hold. Ask whoever administers your school's roles."
        />
      </PageShell>
    );
  }

  if (!templatesLoading && !template) {
    return (
      <PageShell>
        <OutlinedNotice
          icon={Upload}
          title="Bulk import is not available for students yet"
          body="This school has no student import template. Ask CodeX support to enable it."
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="content-start gap-5" grid>
      <section className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white-02 bg-white p-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-black-01">
            {template?.name ?? "Student import"}
          </h2>
          <p className="mt-0.5 max-w-prose text-xs text-gray-05">
            {template?.description ||
              "Load a roll from a spreadsheet. Every row is checked before anything is written."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={getTemplate} disabled={downloading}>
            <Download className="size-4" />
            {downloading ? "Preparing…" : "Download template"}
          </Button>
          <Button onClick={() => setWizardOpen(true)} disabled={!template}>
            <Upload className="size-4" />
            Import students
          </Button>
        </div>
      </section>

      <section className="min-w-0 rounded-xl border border-white-02 bg-white p-4">
        <p className="text-xs font-medium text-gray-05">
          What the file must contain
        </p>
        {detailLoading ? (
          <div className="mt-3 grid gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : columns.length === 0 ? (
          <p className="mt-3 text-sm text-gray-05">
            This template does not publish its columns. Download it to see the
            headings.
          </p>
        ) : (
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {columns.map((c) => (
              <li
                key={c.column_name}
                className="flex min-w-0 items-baseline justify-between gap-2 border-b border-white-02 pb-1.5 last:border-0"
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono text-xs text-black-01">
                    {c.column_name}
                  </span>
                  {c.help_text && (
                    <span className="block truncate text-xs text-gray-05">
                      {c.help_text}
                    </span>
                  )}
                </span>
                <span
                  className={
                    c.is_required
                      ? "shrink-0 text-xs text-amber-700"
                      : "shrink-0 text-xs text-gray-05"
                  }
                >
                  {c.is_required ? "Required" : "Optional"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="min-w-0">
        <h3 className="mb-3 text-sm font-semibold text-black-01">
          Past imports
        </h3>
        <CustomTable
          tableHeaderList={["File", "Rows", "Outcome", "Status", "When"]}
          loading={batchesLoading}
          defaultBodyList={rows}
          tableBodyList={rows.map((b) => {
            const status = batchStatus(b.status);
            return {
              File: b.original_filename,
              Rows: b.total_rows ?? "-",
              Outcome: batchOutcome(b),
              Status: (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${status.chip}`}
                >
                  {status.label}
                </span>
              ),
              When: new Date(b.created_at).toLocaleDateString(),
            };
          })}
          hidePagination
          emptyText="No student imports yet"
        />
      </section>

      {template && (
        <ImportWizard
          open={wizardOpen}
          templateId={template.id}
          fileFormat={template.default_file_format}
          onClose={() => setWizardOpen(false)}
        />
      )}
    </PageShell>
  );
}
