/** A dataset this school is allowed to load, as the server offers it. */
export interface ImportTemplateSummary {
  id: number;
  name: string;
  /** `branches`, `bank_statements`, and so on. */
  dataset_type: string;
  description: string;
  instructions: string;
  /** `csv` or `xlsx`. What the upload has to be. */
  default_file_format: string;
  columns?: ImportTemplateColumn[];
}

export interface ImportTemplateColumn {
  column_name: string;
  is_required: boolean;
  data_type: string;
  sample_value: string | null;
  help_text: string;
}

/** An uploaded file, before, during or after it becomes real rows. */
export interface ImportBatch {
  id: number;
  original_filename: string;
  dataset_type: string;
  status: string;
  total_rows: number | null;
  has_critical_errors: boolean;
  is_ready_for_import: boolean;
  created_at: string;
  imported_at: string | null;
  validation_summary: ImportValidationSummary | null;
}

export interface ImportValidationSummary {
  total_issues: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  error_rows: number;
  has_critical_errors: boolean;
}

/** One thing wrong with one row, or with the file as a whole. */
export interface ImportIssue {
  id?: number;
  severity: "error" | "warning" | "info";
  code: string;
  /** null for a problem with the file itself rather than a row in it. */
  row: number | null;
  column: string;
  message: string;
}

export interface ImportValidationResult {
  summary: ImportValidationSummary;
  issues: ImportIssue[];
}

/** A running or finished import. */
export interface ImportJob {
  id: number;
  status: string;
  progress_percent: number;
  total_rows: number;
  processed_rows: number;
  succeeded_rows: number;
  failed_rows: number;
  skipped_rows: number;
  last_error_message: string;
}
