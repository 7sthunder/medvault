/**
 * Curated medication color palette for pill badges and avatars.
 * Placed in shared/ to centralize valid hex codes for medication schema.
 */

export interface MedicationColorOption {
  value: string;
  name: string;
  twClass: string;
}

export const MEDICATION_COLORS: MedicationColorOption[] = [
  { value: "#10b981", name: "Emerald", twClass: "bg-emerald-500" },
  { value: "#14b8a6", name: "Teal", twClass: "bg-teal-500" },
  { value: "#06b6d4", name: "Cyan", twClass: "bg-cyan-500" },
  { value: "#3b82f6", name: "Blue", twClass: "bg-blue-500" },
  { value: "#6366f1", name: "Indigo", twClass: "bg-indigo-500" },
  { value: "#a855f7", name: "Purple", twClass: "bg-purple-500" },
  { value: "#f43f5e", name: "Rose", twClass: "bg-rose-500" },
  { value: "#f59e0b", name: "Amber", twClass: "bg-amber-500" },
];
