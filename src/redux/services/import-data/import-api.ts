import { baseApi } from "../base-api";
import type {
  ImportBatch,
  ImportJob,
  ImportTemplateSummary,
  ImportValidationResult,
} from "./import-types";

// ─────────────────────────────────────────────────────────────────────────────
// Loading a school's own data, at /v1/import/.
//
// The endpoints are the platform's, not a school-scoped `/me/` surface like the
// staff list - the import engine was built for CodeX operations and later
// opened to schools. What makes that safe is server-side and worth knowing
// about here, because it decides what this client can and cannot show:
//
// A school is only ever offered ITS OWN datasets. CodeX's provisioning
// templates (`schools`, `cx_users`) are withheld from the list, and a request
// naming one is refused - see backend vs_import_data/datasets.py, which exists
// because a school administrator was briefly able to provision a tenant. So
// this client never filters the template list itself: whatever comes back is
// what this school may load, and hard-coding a list here would drift.
//
// `silent: true` throughout. Every refusal on this screen is a sentence the
// reader has to act on - a wrong file format, a row that clashes with a branch
// they already have - and belongs beside the thing that caused it rather than
// in a global toast.
// ─────────────────────────────────────────────────────────────────────────────
export const importApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** The datasets this school may load. Server-narrowed; do not filter here. */
    getImportTemplates: builder.query<ImportTemplateSummary[], void>({
      query: () => ({ url: `/import/system-import-templates/`, method: "GET" }),
      transformResponse: (response: { data?: ImportTemplateSummary[] }) =>
        response?.data ?? [],
      extraOptions: { silent: true },
      providesTags: ["ImportTemplates"],
    }),

    /** This school's upload history, newest first. */
    getImportBatches: builder.query<ImportBatch[], { templateId?: number } | void>({
      query: (args) => ({
        url: `/import/batches/`,
        method: "GET",
        params: args?.templateId ? { template_id: args.templateId } : undefined,
      }),
      transformResponse: (response: { data?: ImportBatch[] }) => response?.data ?? [],
      extraOptions: { silent: true },
      providesTags: ["ImportBatches"],
    }),

    /**
     * Upload a file against a template.
     *
     * Multipart, so the body is a FormData the caller builds - `template_id`
     * and `file`. Uploading is not importing: nothing becomes a real row until
     * the file has been checked and then committed.
     */
    uploadImportFile: builder.mutation<{ data: ImportBatch }, FormData>({
      query: (body) => ({ url: `/import/batches/`, method: "POST", body }),
      extraOptions: { silent: true },
      invalidatesTags: ["ImportBatches"],
    }),

    /** Check an upload and report what is wrong with it. Commits nothing. */
    validateImportBatch: builder.mutation<
      { data: ImportValidationResult },
      number
    >({
      query: (id) => ({
        url: `/import/batches/${id}/validate/`,
        method: "POST",
        body: {},
      }),
      extraOptions: { silent: true },
      invalidatesTags: ["ImportBatches"],
    }),

    /**
     * Commit a checked upload.
     *
     * Invalidates the checklist too: the platform decides whether "Upload
     * Initial Datasets" is done by looking at what arrived, so a finished
     * import can change the card behind this screen.
     */
    startImport: builder.mutation<{ data: { batch_id: string } }, number>({
      query: (id) => ({
        url: `/import/batches/${id}/start-import/`,
        method: "POST",
        body: {},
      }),
      extraOptions: { silent: true },
      invalidatesTags: ["ImportBatches", "Onboarding"],
    }),

    /** How a commit is going, or how it ended. */
    getImportJobs: builder.query<ImportJob[], number>({
      query: (batchId) => ({
        url: `/import/batches/${batchId}/jobs/`,
        method: "GET",
      }),
      transformResponse: (response: { data?: ImportJob[] }) => response?.data ?? [],
      extraOptions: { silent: true },
      providesTags: ["ImportBatches"],
    }),
  }),
});

export const {
  useGetImportTemplatesQuery,
  useGetImportBatchesQuery,
  useUploadImportFileMutation,
  useValidateImportBatchMutation,
  useStartImportMutation,
  useGetImportJobsQuery,
} = importApi;
