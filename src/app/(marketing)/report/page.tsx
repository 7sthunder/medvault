import type { Metadata } from "next";

import { InfoPage } from "@/features/legal/InfoPage";
import { REPORT_CONTENT } from "@/features/legal/legal-content";
import { ReportForm } from "@/features/legal/ReportForm";

export const metadata: Metadata = {
  title: REPORT_CONTENT.title,
  description: REPORT_CONTENT.description,
};

export default function ReportPage() {
  return (
    <InfoPage {...REPORT_CONTENT}>
      <ReportForm />
    </InfoPage>
  );
}
