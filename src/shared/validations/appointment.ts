import { z } from "zod";

export const appointmentCreateSchema = z.object({
  patientUserId: z.string().optional(),
  doctorName: z.string().min(1, "Doctor's name is required").max(100),
  specialty: z.string().max(100).optional().nullable(),
  clinicName: z.string().max(150).optional().nullable(),
  appointmentDate: z.coerce.date(),
  notes: z.string().max(1000).optional().nullable(),
  reminderEnabled: z.boolean().default(true),
});

export const appointmentUpdateSchema = z.object({
  id: z.string().min(1),
  doctorName: z.string().min(1).max(100).optional(),
  specialty: z.string().max(100).optional().nullable(),
  clinicName: z.string().max(150).optional().nullable(),
  appointmentDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
  reminderEnabled: z.boolean().optional(),
});

export const appointmentQuerySchema = z.object({
  patientUserId: z.string().optional(),
  includePast: z.boolean().default(false),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;
