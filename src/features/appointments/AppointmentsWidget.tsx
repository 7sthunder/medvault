"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Hospital,
  Plus,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { AppointmentDialog } from "./AppointmentDialog";

export interface AppointmentsWidgetProps {
  patientUserId?: string;
  patientName?: string;
  canManage?: boolean;
}

export function AppointmentsWidget({
  patientUserId,
  patientName,
  canManage = true,
}: AppointmentsWidgetProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const utils = api.useUtils();
  const { data: appointments, isLoading } = api.appointments.list.useQuery({
    patientUserId,
    includePast: false,
  });

  const updateMutation = api.appointments.update.useMutation({
    onSuccess: () => {
      toast.success("Appointment updated.");
      utils.appointments.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update appointment.");
    },
  });

  const cancelMutation = api.appointments.cancel.useMutation({
    onSuccess: () => {
      toast.success("Appointment cancelled.");
      utils.appointments.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel appointment.");
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Stethoscope className="size-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-foreground">
              Doctor Appointments
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {patientName ? `Upcoming visits for ${patientName}` : "Upcoming consultations & clinic visits"}
            </p>
          </div>
        </div>

        {canManage && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="h-7 gap-1 rounded-lg px-2.5 text-xs font-semibold"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2.5">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && (!appointments || appointments.length === 0) && (
        <div className="rounded-xl border border-dashed border-border/70 p-4 text-center">
          <p className="text-xs text-muted-foreground">No upcoming doctor appointments.</p>
          {canManage && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="mt-1 h-auto p-0 text-xs font-semibold text-primary"
            >
              + Schedule consultation
            </Button>
          )}
        </div>
      )}

      {!isLoading && appointments && appointments.length > 0 && (
        <div className="divide-y divide-border/60">
          {appointments.slice(0, 4).map((apt) => {
            const dateObj = new Date(apt.appointmentDate);

            return (
              <div key={apt.id} className="group flex items-start justify-between py-3 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{apt.doctorName}</span>
                    {apt.specialty && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                        {apt.specialty}
                      </Badge>
                    )}
                    {apt.status === "completed" && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">
                        Done
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-primary" />
                      {format(dateObj, "MMM d, h:mm a")}
                    </span>
                    {apt.clinicName && (
                      <span className="flex items-center gap-1">
                        <Hospital className="size-3" />
                        {apt.clinicName}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/80">
                      ({formatDistanceToNow(dateObj, { addSuffix: true })})
                    </span>
                  </div>

                  {apt.notes && (
                    <p className="text-[11px] text-muted-foreground italic line-clamp-1">
                      &quot;{apt.notes}&quot;
                    </p>
                  )}
                </div>

                {canManage && apt.status === "scheduled" && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      title="Mark as completed"
                      onClick={() => updateMutation.mutate({ id: apt.id, status: "completed" })}
                      className="rounded p-1 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
                    >
                      <CheckCircle2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Cancel appointment"
                      onClick={() => cancelMutation.mutate({ id: apt.id })}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <XCircle className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patientUserId={patientUserId}
        patientName={patientName}
      />
    </div>
  );
}
