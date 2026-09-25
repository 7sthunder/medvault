import { redirect } from "next/navigation";

/**
 * Phase 19 — `/demo/workspace` index.
 *
 * `/demo/workspace` is the shell's own base path, so the sidebar's `stripBasePath` maps it back to
 * `/dashboard` for active-state purposes but nothing rendered a page for it. Without this, opening
 * the workspace root (which the demo banner and the "enter demo" call-to-action both do) landed on
 * a 404. The dashboard is the natural landing surface, so redirect rather than duplicate it.
 */
export default function DemoWorkspaceIndex() {
  redirect("/demo/workspace/dashboard");
}
