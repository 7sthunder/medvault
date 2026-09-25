"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HeartHandshake,
  KeyRound,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { CaregiverOverview } from "./CaregiverOverview";
import { InviteForm } from "./InviteForm";
import { LinkPatientDialog } from "./LinkPatientDialog";
import { RelationshipList } from "./RelationshipList";
import type { CaregiverTab } from "./types";

export function CaregiverPage() {
  const patientsQuery = api.caregiver.listPatients.useQuery();

  const patients = useMemo(() => patientsQuery.data ?? [], [patientsQuery.data]);
  const isCaregiverForOthers = patients.length > 0;

  const [activeTab, setActiveTab] = useState<CaregiverTab>("caregivers");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    if (isCaregiverForOthers && !selectedPatientId && patients[0]) {
      setSelectedPatientId(patients[0].patientUserId);
      setActiveTab("overview");
    }
  }, [isCaregiverForOthers, patients, selectedPatientId]);

  return (
    <div data-testid="caregiver-page" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl dark:text-ink-100">
            Caregiver Network
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Coordinate with loved ones, manage health monitors, and review adherence alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLinkDialogOpen(true)}
            className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
          >
            <KeyRound className="size-4" />
            <span>Link with Access Code</span>
          </Button>

          {activeTab !== "invite" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setActiveTab("invite")}
              className="gap-2"
            >
              <UserPlus className="size-4" />
              <span>Invite Caregiver</span>
            </Button>
          )}
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/60 p-1 w-fit">
        {isCaregiverForOthers && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all ${
              activeTab === "overview"
                ? "bg-card text-ink-900 shadow-card-sm dark:text-ink-100"
                : "text-muted-foreground hover:text-ink-900"
            }`}
          >
            <HeartHandshake className="size-4" />
            <span>Monitored Patients ({patients.length})</span>
          </button>
        )}

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "caregivers"}
          onClick={() => setActiveTab("caregivers")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all ${
            activeTab === "caregivers"
              ? "bg-card text-ink-900 shadow-card-sm dark:text-ink-100"
              : "text-muted-foreground hover:text-ink-900"
          }`}
        >
          <UserCheck className="size-4" />
          <span>My Caregivers</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "invite"}
          onClick={() => setActiveTab("invite")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all ${
            activeTab === "invite"
              ? "bg-card text-ink-900 shadow-card-sm dark:text-ink-100"
              : "text-muted-foreground hover:text-ink-900"
          }`}
        >
          <UserPlus className="size-4" />
          <span>Invite</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && isCaregiverForOthers && (
        <CaregiverOverview
          patients={patients}
          selectedPatientId={selectedPatientId || patients[0]?.patientUserId || ""}
          onSelectPatient={setSelectedPatientId}
        />
      )}

      {activeTab === "caregivers" && (
        <RelationshipList onInviteClick={() => setActiveTab("invite")} />
      )}

      {activeTab === "invite" && (
        <div className="max-w-2xl">
          <InviteForm onSuccess={() => setActiveTab("caregivers")} />
        </div>
      )}

      <LinkPatientDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onSuccess={(id) => {
          setSelectedPatientId(id);
          setActiveTab("overview");
        }}
      />
    </div>
  );
}
