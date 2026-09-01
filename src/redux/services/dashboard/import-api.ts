import { toast } from "sonner";
import { generateQueryString } from "@/utils/helpers";
import { appendTenantQuery } from "@/utils/tenant-context";
import { routesPath } from "@/routes/routes-path";
import { baseApi } from "../base-api";
import type {
  CreateTemplatePayload,
  UpdateTemplatePayload,
  ImportAuditLogItem,
  ImportBatch,
  ImportBatchListItem,
  ImportJob,
  ImportJobListItem,
  ImportNotification,
  ImportTemplate,
  ImportTemplateListItem,
  PaginatedResponse,
  RollbackRecord,
  RollbackResponse,
  StartImportResponse,
  ValidationIssueDetail,
  ValidationIssueListItem,
  ValidationRunResponse,
  CancelImportResponse,
} from "./import-types";

type Params = Record<string, string | number>;

export const importApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Templates ───────────────────────────────────────────────────────────
    getImportTemplates: builder.query<PaginatedResponse<ImportTemplateListItem>, Params>({
      query: (params) => ({
        url: `/import/system-import-templates/${generateQueryString(params)}`,
        method: "GET",
      }),
      providesTags: ["ImportTemplates"],
    }),

    getImportTemplate: builder.query<{ data: ImportTemplate } | ImportTemplate, number>({
      query: (id) => ({ url: `/import/system-import-templates/${id}/`, method: "GET" }),
      providesTags: (_res, _err, id) => [{ type: "ImportTemplates", id }],
    }),

    createImportTemplate: builder.mutation<{ data: ImportTemplate }, CreateTemplatePayload>({
      query: (body) => ({ url: `/import/system-import-templates/`, method: "POST", body }),
      invalidatesTags: ["ImportTemplates"],
    }),

    updateImportTemplate: builder.mutation<
      { data: ImportTemplate } | ImportTemplate,
      { id: number; body: UpdateTemplatePayload }
    >({
      query: ({ id, body }) => ({
        url: `/import/system-import-templates/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: "ImportTemplates", id }, "ImportTemplates"],
    }),

    // Resolves to an object URL (caller must revokeObjectURL when done) -
    // storing the raw Blob in redux state trips the serializability check.
    downloadImportTemplate: builder.mutation<string, { id: number; format: "csv" | "xlsx" }>({
      query: ({ id, format }) => ({
        url: `/import/system-import-templates/${id}/download/?file_format=${format}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (blob: Blob) => URL.createObjectURL(blob),
    }),

    // ── Batches ─────────────────────────────────────────────────────────────
    createImportBatch: builder.mutation<{ data: ImportBatchListItem }, FormData>({
      query: (formData) => ({
        url: `/import/batches/`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["ImportBatches"],
    }),

    getImportBatches: builder.query<PaginatedResponse<ImportBatchListItem>, Params>({
      query: (params) => ({
        url: `/import/batches/${generateQueryString(params)}`,
        method: "GET",
      }),
      providesTags: ["ImportBatches"],
    }),

    getImportBatch: builder.query<{ data: ImportBatch } | ImportBatch, number>({
      query: (id) => ({ url: `/import/batches/${id}/`, method: "GET" }),
      providesTags: (_res, _err, id) => [{ type: "ImportBatches", id }],
    }),

    updateImportBatch: builder.mutation<
      ImportBatch,
      { id: number; body: { sheet_name?: string; header_row_index?: number; notes?: string } }
    >({
      query: ({ id, body }) => ({ url: `/import/batches/${id}/`, method: "PATCH", body }),
      invalidatesTags: (_res, _err, { id }) => [{ type: "ImportBatches", id }, "ImportBatches"],
    }),

    deleteImportBatch: builder.mutation<void, number>({
      query: (id) => ({ url: `/import/batches/${id}/`, method: "DELETE" }),
      invalidatesTags: ["ImportBatches"],
    }),

    cancelImportBatch: builder.mutation<CancelImportResponse, number>({
      query: (id) => ({ url: `/import/batches/${id}/cancel/`, method: "POST" }),
      invalidatesTags: (_res, _err, id) => [
        { type: "ImportBatches", id },
        "ImportBatches",
      ],
    }),

    // ── Validation ──────────────────────────────────────────────────────────
    validateImportBatch: builder.mutation<
      ValidationRunResponse,
      { id: number; body?: { run_full_validation?: boolean; include_warnings?: boolean } }
    >({
      query: ({ id, body }) => ({
        url: `/import/batches/${id}/validate/`,
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "ImportBatches", id },
        "ImportBatches",
        "ImportValidationIssues",
      ],
    }),

    getValidationIssues: builder.query<
      PaginatedResponse<ValidationIssueListItem>,
      { batchId: number; params?: Params }
    >({
      query: ({ batchId, params }) => ({
        url: `/import/batches/${batchId}/issues/${generateQueryString(params ?? {})}`,
        method: "GET",
      }),
      providesTags: (_res, _err, { batchId }) => [
        { type: "ImportValidationIssues", id: batchId },
        "ImportValidationIssues",
      ],
    }),

    getValidationIssue: builder.query<ValidationIssueDetail, { batchId: number; issueId: number }>({
      query: ({ batchId, issueId }) => ({
        url: `/import/batches/${batchId}/issues/${issueId}/`,
        method: "GET",
      }),
    }),

    resolveValidationIssue: builder.mutation<
      ValidationIssueDetail,
      { batchId: number; issueId: number }
    >({
      query: ({ batchId, issueId }) => ({
        url: `/import/batches/${batchId}/issues/${issueId}/resolve/`,
        method: "PATCH",
        body: { is_resolved: true },
      }),
      invalidatesTags: (_res, _err, { batchId }) => [
        { type: "ImportValidationIssues", id: batchId },
        { type: "ImportBatches", id: batchId },
        "ImportValidationIssues",
      ],
    }),

    // ── Jobs ────────────────────────────────────────────────────────────────
    startImportBatch: builder.mutation<
      StartImportResponse,
      { id: number; body?: { run_async?: boolean; stop_on_first_error?: boolean } }
    >({
      query: ({ id, body }) => ({
        url: `/import/batches/${id}/start-import/`,
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "ImportBatches", id },
        { type: "ImportJobs", id },
        "ImportBatches",
        "ImportJobs",
      ],
      // Queuing is the only moment the user is told the work has *started* -
      // BackgroundJob notifications are terminal-state only, and the Queues
      // page's completion toasts need that page open to fire. Announcing it
      // here covers every caller (wizard + batch detail), so neither has to
      // toast for itself.
      async onQueryStarted({ body }, { queryFulfilled }) {
        // Synchronous runs return once the import is done - "started" is wrong.
        if (body?.run_async === false) return;
        try {
          await queryFulfilled;
        } catch {
          // The base-query interceptor owns the failure toast.
          return;
        }
        toast.success("Import started.", {
          description:
            "Runs in the background - you can leave this page. You'll get a notification when it finishes.",
          action: {
            label: "View queues",
            onClick: () => {
              // Lazy: routes/ pulls in the pages that import this slice, so a
              // static import here would close a module cycle.
              void import("@/routes").then(({ router }) =>
                router.navigate(routesPath.PROTECTED.EXPORT.QUEUES),
              );
            },
          },
        });
      },
    }),

    getImportJobs: builder.query<
      PaginatedResponse<ImportJobListItem>,
      { batchId: number; params?: Params }
    >({
      query: ({ batchId, params }) => ({
        url: `/import/batches/${batchId}/jobs/${generateQueryString(params ?? {})}`,
        method: "GET",
      }),
      providesTags: (_res, _err, { batchId }) => [
        { type: "ImportJobs", id: batchId },
        "ImportJobs",
      ],
    }),

    getImportJob: builder.query<{ data: ImportJob }, { batchId: number; jobId: number }>({
      query: ({ batchId, jobId }) => ({
        url: `/import/batches/${batchId}/jobs/${jobId}/`,
        method: "GET",
      }),
      providesTags: (_res, _err, { jobId }) => [{ type: "ImportJobs", id: jobId }],
    }),

    // ── Rollback ────────────────────────────────────────────────────────────
    rollbackImportJob: builder.mutation<
      RollbackResponse,
      { batchId: number; jobId: number; reason?: string }
    >({
      query: ({ batchId, jobId, reason }) => ({
        url: `/import/batches/${batchId}/jobs/${jobId}/rollback/`,
        method: "POST",
        body: { reason: reason ?? "" },
      }),
      invalidatesTags: (_res, _err, { batchId, jobId }) => [
        { type: "ImportBatches", id: batchId },
        { type: "ImportJobs", id: jobId },
        "ImportBatches",
        "ImportJobs",
      ],
    }),

    getRollbackRecords: builder.query<
      PaginatedResponse<RollbackRecord>,
      { batchId: number; jobId: number }
    >({
      query: ({ batchId, jobId }) => ({
        url: `/import/batches/${batchId}/jobs/${jobId}/rollbacks/`,
        method: "GET",
      }),
    }),

    // ── Audit + Notifications ──────────────────────────────────────────────
    getImportAuditLogs: builder.query<
      PaginatedResponse<ImportAuditLogItem>,
      { batchId: number; params?: Params }
    >({
      query: ({ batchId, params }) => ({
        url: `/import/batches/${batchId}/audit-logs/${generateQueryString(params ?? {})}`,
        method: "GET",
      }),
    }),

    getImportNotifications: builder.query<
      PaginatedResponse<ImportNotification>,
      { batchId: number; params?: Params }
    >({
      query: ({ batchId, params }) => ({
        url: `/import/batches/${batchId}/notifications/${generateQueryString(params ?? {})}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  // templates
  useGetImportTemplatesQuery,
  useGetImportTemplateQuery,
  useCreateImportTemplateMutation,
  useUpdateImportTemplateMutation,
  useDownloadImportTemplateMutation,
  // batches
  useCreateImportBatchMutation,
  useGetImportBatchesQuery,
  useGetImportBatchQuery,
  useUpdateImportBatchMutation,
  useDeleteImportBatchMutation,
  useCancelImportBatchMutation,
  // validation
  useValidateImportBatchMutation,
  useGetValidationIssuesQuery,
  useGetValidationIssueQuery,
  useResolveValidationIssueMutation,
  // jobs
  useStartImportBatchMutation,
  useGetImportJobsQuery,
  useGetImportJobQuery,
  // rollback
  useRollbackImportJobMutation,
  useGetRollbackRecordsQuery,
  // audit + notifications
  useGetImportAuditLogsQuery,
  useGetImportNotificationsQuery,
} = importApi;

// Direct URL helper for download links (template scaffold + issue CSV export).
const BASE_URL = import.meta.env.VITE_BACKEND_URL as string;

export const importDownloadUrls = {
  templateDownload: (templateId: number, format: "csv" | "xlsx") =>
    appendTenantQuery(`${BASE_URL}/import/system-import-templates/${templateId}/download/?file_format=${format}`),
  validationIssuesExport: (batchId: number) =>
    appendTenantQuery(`${BASE_URL}/import/batches/${batchId}/issues/export/`),
  batchFileDownload: (batchId: number) =>
    appendTenantQuery(`${BASE_URL}/import/batches/${batchId}/download/`),
};
