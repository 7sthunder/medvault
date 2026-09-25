"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pill, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import type { MedicationDTO } from "@/shared/types";
import { ArchiveDialog } from "./ArchiveDialog";
import { MedicationCard } from "./MedicationCard";
import type { MedicationFilterTab } from "./types";

export function MedicationListPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<MedicationFilterTab>("all");
  const [archiveTarget, setArchiveTarget] = useState<MedicationDTO | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data: medications, isLoading, error } = api.medication.list.useQuery({
    includeArchived: true,
  });

  const setStatusMutation = api.medication.setStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "active" ? "Medication resumed." : "Medication paused.",
      );
      void utils.medication.list.invalidate();
      void utils.dose.today.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update medication status.");
    },
    onSettled: () => {
      setTogglingId(null);
    },
  });

  const archiveMutation = api.medication.archive.useMutation({
    onSuccess: () => {
      toast.success("Medication archived. Historical records remain preserved.");
      setArchiveTarget(null);
      void utils.medication.list.invalidate();
      void utils.dose.today.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to archive medication.");
    },
  });

  const handleToggleStatus = (id: string, currentStatus: "active" | "paused") => {
    setTogglingId(id);
    const nextStatus = currentStatus === "active" ? "paused" : "active";
    setStatusMutation.mutate({ id, status: nextStatus });
  };

  const handleConfirmArchive = () => {
    if (!archiveTarget) return;
    archiveMutation.mutate({ id: archiveTarget.id });
  };

  // Status counts for badge tabs
  const counts = useMemo(() => {
    if (!medications) return { all: 0, active: 0, paused: 0, archived: 0 };
    const nonArchived = medications.filter((m) => !m.archivedAt);
    return {
      all: nonArchived.length,
      active: nonArchived.filter((m) => m.status === "active").length,
      paused: nonArchived.filter((m) => m.status === "paused").length,
      archived: medications.filter((m) => Boolean(m.archivedAt)).length,
    };
  }, [medications]);

  // Filtered medications
  const filteredMeds = useMemo(() => {
    if (!medications) return [];

    let list = medications;

    // Filter by tab
    if (activeTab === "all") {
      list = list.filter((m) => !m.archivedAt);
    } else if (activeTab === "active") {
      list = list.filter((m) => m.status === "active" && !m.archivedAt);
    } else if (activeTab === "paused") {
      list = list.filter((m) => m.status === "paused" && !m.archivedAt);
    } else if (activeTab === "archived") {
      list = list.filter((m) => Boolean(m.archivedAt));
    }

    // Filter by search query
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.instructions?.toLowerCase().includes(query) ||
          m.notes?.toLowerCase().includes(query),
      );
    }

    return list;
  }, [medications, activeTab, search]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900 dark:text-ink-100">
            Medications
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your prescriptions, active schedules, and daily dosages.
          </p>
        </div>
        <Button
          variant="default"
          className="gap-2 self-start sm:self-auto"
          render={<Link href="/medications/new" />}
        >
          <Plus className="size-4" />
          <span>Add Medication</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medications..."
            className="pl-9 pr-8 h-9 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
          {(
            [
              { key: "all", label: "All", count: counts.all },
              { key: "active", label: "Active", count: counts.active },
              { key: "paused", label: "Paused", count: counts.paused },
              { key: "archived", label: "Archived", count: counts.archived },
            ] as const
          ).map(({ key, label, count }) => {
            const isSelected = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Medication Cards List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-4 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-40" />
              <div className="border-t border-border pt-3 flex justify-between">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red/20 bg-red-tint/20 p-6 text-center text-sm text-red">
          Failed to load medications. Please refresh the page.
        </div>
      ) : filteredMeds.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8">
          <EmptyState
            icon={Pill}
            title={search ? "No matching medications" : "No medications found"}
            description={
              search
                ? `No medications match "${search}". Try adjusting your search term or clear the filter.`
                : activeTab === "archived"
                  ? "You have no archived medications."
                  : activeTab === "paused"
                    ? "You have no paused medications."
                    : "You haven't added any medications yet. Add your first prescription to set up your schedule."
            }
            action={
              !search && activeTab !== "archived" ? (
                <Button variant="default" className="gap-2" render={<Link href="/medications/new" />}>
                  <Plus className="size-4" />
                  <span>Add First Medication</span>
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMeds.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              onToggleStatus={handleToggleStatus}
              onOpenArchive={setArchiveTarget}
              isToggling={togglingId === med.id}
            />
          ))}
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <ArchiveDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        medicationName={archiveTarget?.name ?? ""}
        isArchiving={archiveMutation.isPending}
        onConfirm={handleConfirmArchive}
      />
    </div>
  );
}
