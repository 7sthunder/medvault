import type { Metadata } from "next";

import { InfoPage } from "@/features/legal/InfoPage";
import { TERMS_CONTENT } from "@/features/legal/legal-content";

export const metadata: Metadata = {
  title: TERMS_CONTENT.title,
  description: TERMS_CONTENT.description,
};

export default function TermsPage() {
  return <InfoPage {...TERMS_CONTENT} />;
}
