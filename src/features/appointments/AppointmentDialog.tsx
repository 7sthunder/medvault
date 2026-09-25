"use client";

import { useState } from "react";
import { Calendar, Hospital, Loader2, Stethoscope, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";

export interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientUserId?: string;
  patientName?: string;
  onSuccess?: () => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  patientUserId,
  patientName,
  onSuccess,
}: AppointmentDialogProps) {
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  // Default to tomorrow 10:00 AM local
  const [dateTime, setDateTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const utils = api.useUtils();

  const createMutation = api.appointments.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Appointment with ${data.doctorName} scheduled!`);
      utils.appointments.list.invalidate();
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to schedule appointment.");
    },
  });

  const resetForm = () => {
    setDoctorName("");
    setSpecialty("");
    setClinicName("");
    setNotes("");
    setReminderEnabled(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) {
      toast.error("Doctor's name is required.");
      return;
    }
    if (!dateTime) {
      toast.error("Please pick a valid appointment date and time.");
      return;
    }

    createMutation.mutate({
      patientUserId,
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || undefined,
      clinicName: clinicName.trim() || undefined,
      appointmentDate: new Date(dateTime),
      notes: notes.trim() || undefined,
      reminderEnabled,
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Stethoscope className="size-4" />
          </div>
          <span>Schedule Doctor Appointment</span>
        </div>
      }
      description={
        patientName
          ? `Add an upcoming medical consultation or specialist appointment for ${patientName}.`
          : "Add an upcoming medical consultation, checkup, or clinic appointment."
      }
      footer={
        <div className="flex w-full items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="gap-2"
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm Schedule
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Doctor / Specialist Name" required>
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g. Dr. Catherine Brooks"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="pl-9"
              required
            />
            <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          </div>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Medical Specialty">
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g. Cardiologist"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="pl-9"
              />
              <Stethoscope className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            </div>
          </FormField>

          <FormField label="Clinic / Hospital">
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g. Grace Memorial Clinic"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="pl-9"
              />
              <Hospital className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            </div>
          </FormField>
        </div>

        <FormField label="Date & Time" required>
          <div className="relative">
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="pl-9"
              required
            />
            <Calendar className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          </div>
        </FormField>

        <FormField label="Appointment Notes / Instructions">
          <Textarea
            placeholder="e.g. Fast for 8 hours before appointment, bring blood sugar log and current medications."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </FormField>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="reminder-enabled"
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="reminder-enabled" className="text-xs font-medium text-foreground cursor-pointer">
            Send reminder notification 24 hours and 2 hours prior
          </label>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
