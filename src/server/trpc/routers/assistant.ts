import { z } from "zod";

import { assistantService } from "@/server/domain/assistant/service";
import { audioClipSchema, medicationDraftSchema } from "@/shared/validations/assistant";

import { protectedProcedure, router } from "../trpc";

/**
 * Voice intake router — conversational medication entry.
 *
 * `transcribe` (mic → text) and `turn` (text → slot filling) are the loop the UI drives.
 * `speak` renders the assistant's question as audio. The draft is held CLIENT-SIDE and sent
 * back each turn, so this router needs no conversation state and is safe to run stateless.
 *
 * The only write happens inside `turn` when the client sends `confirm: true`; the server
 * then re-validates the draft through `medicationSchema`/`scheduleSchema` before calling
 * `medicationService.create`. A model response alone can never create a medication.
 */
export const assistantRouter = router({
  /** Whether voice intake can run at all (no key configured → the UI hides the mic). */
  status: protectedProcedure.query(() => ({ enabled: assistantService.available() })),

  /** Speech → text. Accepts any language the model supports. */
  transcribe: protectedProcedure
    .input(audioClipSchema)
    .mutation(({ input }) => assistantService.transcribe(input.audioBase64, input.mimeType)),

  /** One conversational turn: fold in an utterance, ask the next question, or confirm. */
  turn: protectedProcedure
    .input(
      z.object({
        utterance: z.string().trim().max(2000).optional(),
        draft: medicationDraftSchema.optional(),
        confirm: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      assistantService.turn(ctx.db, ctx.user.id, ctx.user.timezone ?? "UTC", input),
    ),

  /**
   * The assistant's reply as audio, in the patient's own language.
   * A mutation, not a query: the UI triggers it imperatively on tap and must not fetch on mount.
   */
  speak: protectedProcedure
    .input(
      z.object({
        text: z.string().trim().min(1).max(600),
        language: z.string().max(40).nullable(),
      }),
    )
    .mutation(({ input }) => assistantService.speak(input.text, input.language)),
});
