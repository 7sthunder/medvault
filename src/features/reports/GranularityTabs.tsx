"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { REPORT_GRANULARITIES, REPORT_GRANULARITY_TEXT } from "@/shared/enums";
import type { ReportGranularity } from "@/shared/enums";

/**
 * §11.11 `/reports` granularity switcher (daily / weekly / monthly). Pure tab control;
 * the parent maps the selected value into the report query input.
 */
export function GranularityTabs({
  value,
  onChange,
}: {
  value: ReportGranularity;
  onChange: (g: ReportGranularity) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as ReportGranularity)}>
      <TabsList className="w-full" variant="default">
        {REPORT_GRANULARITIES.map((granularity) => (
          <TabsTrigger key={granularity} value={granularity} className="h-8 px-4">
            {REPORT_GRANULARITY_TEXT[granularity]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}