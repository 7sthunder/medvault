"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, RotateCcw, Check } from "lucide-react";

import { cn } from "cn";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { emptyDraft, type MedicationDraft } from "@/shared/validations/assistant";

/**
 * Voice intake — add a medication by talking, in any language the model supports.
 *
 * Interaction shape is deliberately push-to-talk *toggle*, not hold-to-talk: holding a button
 * excludes switch users, voice-control users, and anyone with a tremor. One tap to start,
 * one tap to stop.
 *
 * The draft lives in React state and is sent back on every turn, so the server holds no
 * conversation state. Nothing is saved until the user taps "Save", which sends `confirm: true`
 * and lets the server validate the draft through the same schema the manual form uses.
 *
 * Every path degrades to typing: no key configured, mic denied, or a browser without
 * MediaRecorder still gets a working intake with the same follow-up questions.
 */

type Phase = "idle" | "listening" | "thinking" | "asking";

const DRAFT_LABELS: { key: keyof MedicationDraft; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "dosageAmount", label: "Dose" },
  { key: "startDate", label: "Start" },
];

export function VoiceIntake({ onSaved, className }: { onSaved?: () => void; className?: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [draft, setDraft] = useState<MedicationDraft>(emptyDraft);
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [language, setLanguage] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);

  const status = api.assistant.status.useQuery();
  const utils = api.useUtils();

  const turn = api.assistant.turn.useMutation();
  const transcribe = api.assistant.transcribe.useMutation();
  const speak = api.assistant.speak.useMutation();

  /** Hand a chunk of spoken audio to the model, then feed the transcript back as a turn. */
  const runUtterance = useCallback(
    async (base64: string, mimeType: string) => {
      setPhase("thinking");
      const heard = await transcribe.mutateAsync({ audioBase64: base64, mimeType });
      setTranscript(heard.text);
      setLanguage(heard.language);
      await sendTurn({ utterance: heard.text });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transcribe],
  );

  const sendTurn = useCallback(
    async (input: { utterance?: string; confirm?: boolean }) => {
      setPhase("thinking");
      setError(null);
      try {
        const result = await turn.mutateAsync({ ...input, draft });
        setDraft(result.draft);
        setQuestion(result.question);
        setLanguage(result.language);
        setNeedsConfirm(result.status === "confirm");
        setPhase("asking");
        if (result.status === "saved") {
          await utils.medication.list.invalidate();
          setDraft(emptyDraft());
          setNeedsConfirm(false);
          setTranscript("");
          onSaved?.();
        }
      } catch (cause) {
        setPhase("idle");
        setError(
          cause instanceof Error ? cause.message : "Something went wrong. Please try again.",
        );
      }
    },
    [turn, draft, utils, onSaved],
  );

  /** Read the assistant's question out loud, in the language the patient used. */
  const speakQuestion = useCallback(
    async (text: string) => {
      try {
        const audio = await speak.mutateAsync({ text, language });
        const bytes = Uint8Array.from(atob(audio.audioBase64), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: audio.mimeType }));
        const ctx = audioCtx.current ?? new AudioContext();
        audioCtx.current = ctx;
        const el = new Audio(url);
        await el.play();
      } catch {
        // Speech is a nicety; the question is already on screen and in the live region.
      }
    },
    [speak, language],
  );

  const startRecording = useCallback(async () => {
    setError(null);

    // `getUserMedia` is gated on a secure context, and the failure is silent + immediate
    // (no permission prompt) on plain http, so it has to be checked explicitly or the user
    // is told their microphone was "denied" when it was never even offered.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError(
        "The microphone needs a secure connection. Open the app on localhost, or over HTTPS, then try again.",
      );
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot record audio. Please type instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        chunks.current = [];
        if (blob.size === 0) {
          setPhase("idle");
          return;
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
          reader.onerror = () => reject(new Error("Could not read the recording."));
          reader.readAsDataURL(blob);
        });
        await runUtterance(base64, type);
      };
      rec.start();
      recorder.current = rec;
      setPhase("listening");
    } catch (cause) {
      setPhase("idle");
      const name = cause instanceof DOMException ? cause.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Microphone permission was denied. You can type your answer instead.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No microphone was found. You can type your answer instead.");
      } else if (name === "NotReadableError") {
        setError("Your microphone is in use by another app.");
      } else {
        setError("The microphone could not be started. You can type your answer instead.");
      }
    }
  }, [runUtterance]);

  const stopRecording = useCallback(() => {
    recorder.current?.stop();
    recorder.current = null;
  }, []);

  const reset = useCallback(() => {
    setDraft(emptyDraft());
    setQuestion("");
    setTranscript("");
    setTyped("");
    setError(null);
    setNeedsConfirm(false);
    setPhase("idle");
  }, []);

  useEffect(() => () => recorder.current?.stop(), []);

  if (status.data?.enabled === false) {
    return (
      <p
        className={cn(
          "rounded-xl border border-border bg-surface p-3 text-sm text-ink-600",
          className,
        )}
      >
        Voice entry needs a Gemini API key. Add a medication with the form instead.
      </p>
    );
  }

  return (
    <section
      aria-label="Add a medication by voice"
      className={cn("rounded-xl border border-border bg-surface p-4 shadow-sm", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Add a medication by voice</h2>
          <p className="text-sm text-ink-600">
            Speak in any language. I will ask for anything I miss.
          </p>
        </div>
        {language ? (
          <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-ink-600">
            {language}
          </span>
        ) : null}
      </div>

      {/* Collected so far — the same fields the manual form would show. */}
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {DRAFT_LABELS.map(({ key, label }) => (
          <div key={key} className="rounded-lg bg-background px-2 py-1.5">
            <dt className="text-ink-500">{label}</dt>
            <dd className="truncate font-medium text-ink-900">
              {draft[key] === null ? "—" : String(draft[key])}
            </dd>
          </div>
        ))}
      </dl>

      {/* Politely announced so a screen reader hears every question. */}
      <p
        aria-live="polite"
        className="mt-3 min-h-10 rounded-lg bg-primary-soft px-3 py-2 text-sm text-ink-900"
      >
        {error ?? question ?? "Tap the microphone and tell me about the medicine."}
      </p>

      {transcript ? (
        <p className="mt-2 text-xs text-ink-600">
          <span className="font-medium">Heard:</span> {transcript}
        </p>
      ) : null}

      {needsConfirm ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void sendTurn({ confirm: true })}
            disabled={turn.isPending}
            className="gap-2"
          >
            <Check className="size-4" aria-hidden />
            Yes, save it
          </Button>
          <Button type="button" variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="size-4" aria-hidden />
            Start over
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          {phase === "listening" ? (
            <Button type="button" onClick={stopRecording} className="gap-2">
              <MicOff className="size-4" aria-hidden />
              Stop speaking
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void startRecording()}
              disabled={phase === "thinking"}
              className="gap-2"
            >
              {phase === "thinking" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Mic className="size-4" aria-hidden />
              )}
              {phase === "thinking" ? "Listening…" : "Speak"}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const text = question;
              if (text) void speakQuestion(text);
            }}
            disabled={!question || phase === "thinking"}
          >
            Read it aloud
          </Button>
        </div>
      )}

      {/* Typing always works, whatever the microphone is doing. */}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!typed.trim()) return;
          setTranscript(typed);
          void sendTurn({ utterance: typed });
          setTyped("");
        }}
      >
        <label htmlFor="voice-intake-typed" className="sr-only">
          Type your answer
        </label>
        <input
          id="voice-intake-typed"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Or type your answer…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline" disabled={!typed.trim() || turn.isPending}>
          Send
        </Button>
      </form>
    </section>
  );
}
