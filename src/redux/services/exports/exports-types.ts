// ─────────────────────────────────────────────────────────────────────────────
// The Export Centre, as a list screen uses it.
//
// Exporting "what this table is showing" is TWO calls, not one, and the split is
// the point: `from-screen` translates the screen's own filters and reports what
// it could not carry, and only then does `quick` run anything. A single call
// would have to either refuse or guess, and guessing is how somebody asks for
// one branch's classes and silently receives every branch's.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportConfig {
  dataset_key: string;
  columns: string[];
  filters: { id: string; value: unknown }[];
  sort: unknown[];
  format: string;
  values_mode: string;
}

export interface FromScreen {
  screen: { key: string; label: string; dataset: string };
  config: ExportConfig;
  supported_formats: string[];
  /**
   * Screen filters that could not be carried into the file.
   *
   * Never empty because something went wrong - it is the honest answer for a
   * filter the dataset cannot express. A screen must show these before running,
   * because the file will not match the table the person is looking at.
   */
  unmapped?: string[];
  /** False when the file would be WIDER than the screen. */
  exact?: boolean;
  estimate?: { rows?: number; estimated_bytes?: number };
}

export interface QuickExportResult {
  /** Present when the server ran it inline; otherwise it queued. */
  file?: { id: number; name?: string } | null;
  run?: { id: number; status: string } | null;
  status?: string;
}
