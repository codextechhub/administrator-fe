// One byte-size formatter for the whole app.
//
// There were four of these, in three mutually incompatible variants, because
// nothing pinned the behaviour and each screen grew its own. They disagreed on
// zero ("0 KB" vs "0 B") and on whether a round value keeps a decimal ("10 KB"
// vs "10.0 KB"), so the same file could be described two ways on two screens.
// The tests beside this file exist to stop that happening again.

/** Bytes as a person reads them. Deliberately coarse: nobody needs a file size
 *  to the byte, and "1.3 MB" compares better down a column than "1,363,148".
 *
 *  Below 10 of a unit the decimal carries real information (1.3 MB vs 1.9 MB);
 *  at or above 10 it is noise, so it is dropped. Bytes never take a decimal -
 *  there is nothing below a byte to round to. */
export function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}
