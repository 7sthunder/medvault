/**
 * Phase 19 — shared client-side file download.
 *
 * `URL.revokeObjectURL` must not fire synchronously after `anchor.click()`: Safari treats the
 * object URL as already dead and cancels the transfer, so the download silently produces nothing.
 * Revoking on the next tick is the documented workaround. The settings export had this and the
 * reports export did not, which is why the same bug appeared in one place and not the other — so
 * the helper now lives here and both callers share it.
 */
export function triggerFileDownload(
  filename: string,
  contents: Blob | string,
  type = "text/csv;charset=utf-8",
): void {
  const blob = contents instanceof Blob ? contents : new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
