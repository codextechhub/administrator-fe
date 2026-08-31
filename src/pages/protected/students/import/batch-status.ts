import type { ImportBatch } from "@/redux/services/import-data/import-types";

/**
 * The engine's batch states, spelled for a person.
 *
 * Keyed on the engine's own lowercase codes - `ImportBatchStatusChoices` in
 * `vs_import_data/models.py`. Writing them uppercase here left every chip
 * showing its raw code, so a school read "validation_failed" where the screen
 * meant "Validation failed"; the lookup is lowercased on the way in so a
 * casing change on either side cannot bring that back.
 *
 * A state not listed falls back to itself, tidied - a status added on the
 * backend then reads as words rather than vanishing from the table.
 */
const STATUS: Record<string, { label: string; chip: string }> = {
  draft: { label: "Draft", chip: "bg-gray-500/10 text-gray-600" },
  uploaded: { label: "Uploaded", chip: "bg-gray-500/10 text-gray-600" },
  detecting: { label: "Reading the file", chip: "bg-primary/10 text-primary" },
  mapping_required: {
    label: "Needs column mapping",
    chip: "bg-amber-500/10 text-amber-700",
  },
  validating: { label: "Checking", chip: "bg-primary/10 text-primary" },
  validation_failed: {
    label: "Validation failed",
    chip: "bg-red-500/10 text-red-600",
  },
  ready_to_import: { label: "Ready to import", chip: "bg-primary/10 text-primary" },
  import_queued: { label: "Queued", chip: "bg-primary/10 text-primary" },
  import_running: { label: "Importing", chip: "bg-primary/10 text-primary" },
  import_partial: {
    label: "Partly imported",
    chip: "bg-amber-500/10 text-amber-700",
  },
  import_succeeded: { label: "Imported", chip: "bg-green-700/10 text-green-800" },
  import_failed: { label: "Import failed", chip: "bg-red-500/10 text-red-600" },
  rolled_back: { label: "Rolled back", chip: "bg-gray-500/10 text-gray-600" },
  partially_rolled_back: {
    label: "Partly rolled back",
    chip: "bg-amber-500/10 text-amber-700",
  },
  cancelled: { label: "Cancelled", chip: "bg-gray-500/10 text-gray-600" },
};

export function batchStatus(raw: string): { label: string; chip: string } {
  const known = STATUS[(raw ?? "").toLowerCase()];
  if (known) return known;
  return {
    label: (raw ?? "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
    chip: "bg-gray-500/10 text-gray-600",
  };
}

/**
 * What a batch actually did, in one phrase.
 *
 * The status says where the batch got to; this says what a school got out of
 * it, which is what somebody scanning the table is asking. A batch that never
 * wrote anything says so rather than showing a dash that reads as "fine".
 */
export function batchOutcome(batch: ImportBatch): string {
  const status = (batch.status ?? "").toLowerCase();
  const summary = batch.validation_summary;
  const rows = batch.total_rows;

  if (status === "validation_failed") return "Nothing imported";
  if (status === "cancelled") return "Cancelled before writing";
  if (status === "rolled_back") return "Undone";
  if (status === "import_succeeded") {
    return rows ? `${rows} ${rows === 1 ? "student" : "students"} created` : "Imported";
  }
  if (status === "import_partial") {
    const skipped = summary?.error_rows ?? 0;
    return skipped
      ? `${skipped} ${skipped === 1 ? "row" : "rows"} skipped`
      : "Partly imported";
  }
  if (status === "import_failed") return "Nothing written";
  if (status === "ready_to_import") {
    return summary?.warning_count
      ? `${summary.warning_count} warnings, ready`
      : "Checked, not yet imported";
  }
  if (summary?.total_issues) {
    return `${summary.error_count} errors, ${summary.warning_count} warnings`;
  }
  return "-";
}
