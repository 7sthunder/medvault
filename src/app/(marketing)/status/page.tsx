import type { Metadata } from "next";

import { InfoPage } from "@/features/legal/InfoPage";
import { STATUS_CONTENT } from "@/features/legal/legal-content";

export const metadata: Metadata = {
  title: STATUS_CONTENT.title,
  description: STATUS_CONTENT.description,
};

export default function StatusPage() {
  return <InfoPage {...STATUS_CONTENT} />;
}
