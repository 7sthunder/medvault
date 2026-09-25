import type { Metadata } from "next";

import { HistoryPage } from "@/features/history/HistoryPage";

export const metadata: Metadata = { title: "History" };

/** Phase 18 (§10.8) - the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no equireUser() gate applies here. */
export default function DemohistoryPage() {
  return <HistoryPage />;
}
