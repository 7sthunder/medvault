"use client";

/**
 * The conversation surface: message thread, live draft card, composer and mic controls.
 *
 * Rendered by both `/assistant` (full height) and the floating launcher (dialog / drawer) so
 * there is exactly one implementation of the chat to reason about.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, MicOff, RotateCcw, Volume2 } from "lucide-react";

import { cn } from "cn";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { useAssistant } from "@/features/assistant/assistant-context";
import type { MedicationDraft } from "@/shared/validations/assistant";

const DRAFT_LABELS: { key: keyof MedicationDraft; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "dosageAmount", label: "Dose" },
  { key: "startDate", label: "Start" },
];

/** Opening suggestions, so it is obvious the bot reads their record and not just intake. */
const STARTERS = [
  "Which medicines am I taking?",
  "What's my next dose?",
  "How have I done this week?",
];

const MIC_DENIED_TEXT =
  "Microphone access was denied. Click the padlock or camera icon beside the address bar, set Microphone to Allow, then reload this page.";

export function AssistantThread({
  variant,
  className,
}: {
  variant: "page" | "sheet";
  className?: string;
}) {
  const {
    messages,
    draft,
    phase,
    needsConfirm,
    autoSpeak,
    continuous,
    level,
    send,
    confirm,
    startRecording,
    stopRecording,
    reset,
    setAutoSpeak,
    setContinuous,
    micBlocked,
    requestMicAccess,
    error,
    dismissError,
    micState,
    probeMic,
    asking,
  } = useAssistant();

  const [typed, setTyped] = useState("");
  const host = typeof window === "undefined" ? "this site" : window.location.host;
  const bottom = useRef<HTMLDivElement | null>(null);
  const held = useRef(false);
  const pointerStarted = useRef(false);
  const listening = phase === "listening";
  const busy = phase === "thinking";

  useEffect(() => {
    // Optional call: jsdom does not implement scrollIntoView, and an older engine may not
    // either. Auto-scrolling is a nicety, so never let it break the render.
    bottom.current?.scrollIntoView?.({ block: "end" });
  }, [messages, needsConfirm]);

  const submit = () => {
    const text = typed.trim();
    if (!text) return;
    setTyped("");
    void send(text);
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        variant === "page" && "h-[calc(100dvh-13rem)]",
        className,
      )}
    >
      <div aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="py-2">
            <EmptyState
              compact
              icon={Mic}
              title="Tell me about a medicine, or ask me something"
              description="I can add a medication by listening, and answer questions about your own record."
            />
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {STARTERS.map((text) => (
                <Button
                  key={text}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void send(text)}
                >
                  {text}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <ChatBubble key={m.id} role={m.kind === "system" ? "system" : m.role}>
              {m.kind === "heard" ? (
                <span>
                  <span className="sr-only">Heard: </span>
                  {m.text}
                </span>
              ) : (
                m.text
              )}
            </ChatBubble>
          ))
        )}
        <div ref={bottom} />
      </div>

      {/* Pinned so the collected values are always visible, not buried in the thread. */}
      <div className="mt-3 rounded-xl border border-border bg-surface p-3">
        <dl className="grid grid-cols-3 gap-2 text-xs">
          {DRAFT_LABELS.map(({ key, label }) => (
            <div key={key} className="rounded-lg bg-background px-2 py-1.5">
              <dt className="text-ink-500">{label}</dt>
              <dd className="truncate font-medium text-ink-900">
                {draft[key] === null ? "—" : String(draft[key])}
              </dd>
            </div>
          ))}
        </dl>

        {needsConfirm ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void confirm()} disabled={busy} className="gap-2">
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check className="size-4" aria-hidden />
              )}
              Yes, save it
            </Button>
            <Button type="button" variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="size-4" aria-hidden />
              Start over
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {micState === "insecure" ? (
          <Alert variant="destructive" className="w-full gap-2 py-2 text-sm" role="alert">
            <Mic className="size-4 shrink-0" aria-hidden />
            <AlertDescription className="flex-1">
              Your browser blocks the microphone on <strong>{host}</strong> because it is not a
              secure origin. No permission setting can change this. Open{" "}
              <a
                href="http://localhost:3000/assistant"
                className="font-semibold underline underline-offset-2"
              >
                http://localhost:3000/assistant
              </a>{" "}
              on this computer instead.
            </AlertDescription>
          </Alert>
        ) : null}

        {micState !== "insecure" && (micBlocked || error || micState === "denied") ? (
          <Alert
            variant="destructive"
            className="w-full items-start gap-2 py-2 text-sm"
            role="alert"
          >
            <Mic className="mt-0.5 size-4 shrink-0" aria-hidden />
            <AlertDescription className="flex-1">{error ?? MIC_DENIED_TEXT}</AlertDescription>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void requestMicAccess().then(() => probeMic())}
              className="shrink-0 gap-1.5"
            >
              <Mic className="size-3.5" aria-hidden />
              Enable microphone
            </Button>
            <button
              type="button"
              onClick={dismissError}
              className="shrink-0 text-xs underline underline-offset-2"
            >
              Dismiss
            </button>
          </Alert>
        ) : null}

        {micState === "prompt" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void requestMicAccess().then(() => probeMic())}
            className="gap-2"
          >
            <Mic className="size-4" aria-hidden />
            Enable microphone
          </Button>
        ) : null}
        {listening ? (
          <Button type="button" onClick={stopRecording} className="gap-2">
            <MicOff className="size-4" aria-hidden />
            Stop speaking
          </Button>
        ) : (
          <Button
            type="button"
            disabled={busy}
            className="select-none gap-2 touch-none"
            // Hold-to-talk is the fast path; click/Enter remains the accessible equivalent, so
            // nothing depends on holding a button down.
            onPointerDown={() => {
              // Guard against the click that always follows: without this, a plain click ran
              // startRecording twice, and the second call's hush() tore down the first stream
              // while getUserMedia was still resolving, so the mic never actually started.
              pointerStarted.current = true;
              held.current = true;
              void startRecording();
            }}
            onClick={() => {
              if (pointerStarted.current) {
                pointerStarted.current = false;
                return;
              }
              void startRecording();
            }}
            onPointerUp={() => {
              if (held.current && continuous) {
                held.current = false;
                stopRecording();
              }
            }}
            onPointerLeave={() => {
              if (held.current && continuous) {
                held.current = false;
                stopRecording();
              }
            }}
            aria-pressed={listening}
          >
            {busy || asking ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Mic className="size-4" aria-hidden />
            )}
            {asking ? "Waiting for permission…" : busy ? "Thinking…" : "Speak"}
          </Button>
        )}

        {listening ? (
          <span
            aria-hidden="true"
            className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-soft"
            title="Input level"
          >
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-75"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </span>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAutoSpeak(!autoSpeak)}
          aria-pressed={autoSpeak}
          className="gap-2"
        >
          <Volume2 className="size-4" aria-hidden />
          {autoSpeak ? "Voice on" : "Voice off"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setContinuous(!continuous)}
          aria-pressed={continuous}
        >
          {continuous ? "Hands-free on" : "Hands-free off"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Start over
        </Button>
      </div>

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="assistant-composer" className="sr-only">
          Type your answer
        </label>
        <Textarea
          id="assistant-composer"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter is a newline, so multi-line answers stay possible.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Or type your answer…"
          rows={1}
          className="min-h-10 flex-1"
        />
        <Button type="submit" variant="outline" disabled={!typed.trim() || busy}>
          Send
        </Button>
      </form>
    </div>
  );
}
