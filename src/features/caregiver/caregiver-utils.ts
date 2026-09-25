import type { ChipTone } from "@/components/ui/chip";
import type {
  CaregiverRelationshipStatus,
  InvitationStatus,
  RelationType,
} from "@/shared/enums";

/** §11.12 labels */
export const RELATION_LABEL: Readonly<Record<RelationType, string>> = {
  family: "Family",
  friend: "Friend",
  professional: "Care provider",
  other: "Other",
};

export const STATUS_LABEL: Readonly<Record<CaregiverRelationshipStatus, string>> = {
  pending: "Pending",
  active: "Active",
  declined: "Declined",
  revoked: "Revoked",
};

export const INVITATION_STATUS_LABEL: Readonly<Record<InvitationStatus, string>> = {
  pending: "Pending",
  accepted: "Accepted",
  expired: "Expired",
  revoked: "Revoked",
};

export function relationshipTone(status: CaregiverRelationshipStatus): ChipTone {
  if (status === "active") return "emerald";
  if (status === "revoked" || status === "declined") return "slate";
  return "amber";
}

export interface PermissionRow {
  key: "viewAdherence" | "viewMedications" | "receiveMissedDoseAlerts" | "receiveInsights" | "canAcknowledgeAlerts";
  label: string;
  description: string;
}

/** §10.6 permission surface shipped this phase (viewMedications enables med list exposure). */
export const PERMISSION_ROWS: readonly PermissionRow[] = [
  { key: "viewAdherence", label: "View adherence", description: "See adherence rates and streak" },
  { key: "viewMedications", label: "View medications", description: "See the medication list" },
  { key: "receiveMissedDoseAlerts", label: "Missed-dose alerts", description: "Get notified when a dose is missed" },
  { key: "receiveInsights", label: "Insight updates", description: "Receive AI insight summaries" },
  { key: "canAcknowledgeAlerts", label: "Manage alerts", description: "Acknowledge and resolve alerts" },
];