import { z } from "zod";

import { emailSchema, nameSchema } from "./common";

/**
 * Phase 06/07 — auth form contracts (plan §13). Shared both ends:
 * the client validates instantly (react-hook-form + zodResolver),
 * the server re-validates the same rules on submit (authoritative).
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-zA-Z]/, "Password must include a letter.")
    .regex(/[0-9]/, "Password must include a number."),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
