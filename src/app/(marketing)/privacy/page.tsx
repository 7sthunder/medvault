import type { Metadata } from "next";

import { InfoPage } from "@/features/legal/InfoPage";
import { PRIVACY_CONTENT } from "@/features/legal/legal-content";

export const metadata: Metadata = {
  title: PRIVACY_CONTENT.title,
  description: PRIVACY_CONTENT.description,
};

export default function PrivacyPage() {
  return <InfoPage {...PRIVACY_CONTENT} />;
}
