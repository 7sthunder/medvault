"use client";

import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import type { CaregiverPermissions } from "@/shared/types";

import { PERMISSION_ROWS } from "./caregiver-utils";

/**
 * §10.6/§11.12 permission editor — five switches bound to a `CaregiverPermissions` object.
 * Used in the invite form (local state) and on active relationships (live update). Parent
 * owns the value + change callback so it can wire optimistic updates/invalidation.
 */
export function PermissionsEditor({
  permissions,
  onChange,
  disabled = false,
}: {
  permissions: CaregiverPermissions;
  onChange: (next: CaregiverPermissions) => void;
  disabled?: boolean;
}) {
  const set = (key: keyof CaregiverPermissions, value: boolean) => {
    if (disabled) return;
    onChange({ ...permissions, [key]: value });
  };

  return (
    <ul className="flex flex-col gap-3" data-slot="permissions-editor">
      {PERMISSION_ROWS.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3">
          <span className="grid gap-0.5">
            <span className="text-sm font-medium text-ink-900">{row.label}</span>
            <span className="text-xs text-muted-foreground">{row.description}</span>
          </span>
          <Switch
            checked={permissions[row.key]}
            disabled={disabled}
            onCheckedChange={(next) => set(row.key, next === true)}
            aria-label={row.label}
          />
        </li>
      ))}
      <li className="text-xs text-muted-foreground" data-slot="permissions-summary">
        {activeSummary(permissions)}
      </li>
    </ul>
  );
}

function activeSummary(permissions: CaregiverPermissions): string {
  const active = PERMISSION_ROWS.filter((row) => permissions[row.key]).map((row) => row.label);
  return active.length === 0 ? "No permissions granted" : `Can ${active.join(", ").toLowerCase()}`;
}

export function PermissionChips({ permissions }: { permissions: CaregiverPermissions }) {
  return (
    <span className="flex flex-wrap gap-1">
      <Chip tone={permissions.viewAdherence ? "emerald" : "neutral"}>Adherence</Chip>
      <Chip tone={permissions.viewMedications ? "emerald" : "neutral"}>Medications</Chip>
      <Chip tone={permissions.receiveMissedDoseAlerts ? "emerald" : "neutral"}>Missed alerts</Chip>
    </span>
  );
}