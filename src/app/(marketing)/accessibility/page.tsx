import type { Metadata } from "next";

import { InfoPage } from "@/features/legal/InfoPage";
import { ACCESSIBILITY_CONTENT } from "@/features/legal/legal-content";

export const metadata: Metadata = {
  title: ACCESSIBILITY_CONTENT.title,
  description: ACCESSIBILITY_CONTENT.description,
};

export default function AccessibilityPage() {
  return <InfoPage {...ACCESSIBILITY_CONTENT} />;
}
