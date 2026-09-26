"use client";

/**
 * The assistant conversation, shared by the full `/assistant` page and the floating launcher.
 *
 * State lives here rather than inside the panel so the two entry points are the *same*
 * conversation: open the launcher, start describing a medicine, navigate to the page, and the
 * draft and the thread come with you. It also keeps `sendTurn` reading live state instead of
 * closing over a frozen `draft`, which is what made the old inline component go stale.
 *
 * The server still holds no conversation state — the draft is sent back on every turn, and
 * nothing is written until the user sends `confirm: true`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { api } from "@/lib/trpc";
import { emptyDraft, type MedicationDraft } from "@/shared/validations/assistant";

export type Phase = "idle" | "listening" | "thinking" | "asking";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  /** `said` = typed, `heard` = transcribed from audio, `system` = notices. */
  kind: "said" | "heard" | "system";
  text: string;
  at: number;
}

/** Silence long enough counts as "I'm done talking". */
const SILENCE_MS = 1_200;
/** Hard cap so a forgotten open mic cannot record forever. */
const MAX_TURN_MS = 15_000;
/** Quota guard: a long conversation should not burn the free TTS tier unboundedly. */
const MAX_CONSECUTIVE_SPEAKS = 12;

let seq = 0;
const nextId = () => `m${++seq}`;

export interface AssistantValue {
  messages: ChatMessage[];
  draft: MedicationDraft;
  phase: Phase;
  language: string | null;
  error: string | null;
  needsConfirm: boolean;
  autoSpeak: boolean;
  continuous: boolean;
  /** 0..1 input level, for the meter and the barge-in check. */
  level: number;
  /** True when a replay is available for a message the autoplay policy blocked. */
  speak: (text: string, language?: string | null) => void;
  replay: ChatMessage | null;
  send: (utterance: string) => Promise<void>;
  confirm: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
  setAutoSpeak: (on: boolean) => void;
  setContinuous: (on: boolean) => void;
  dismissError: () => void;
  /** True once the browser has recorded a "Block" decision for the microphone. */
  micBlocked: boolean;
  /** Re-requests the mic from a user gesture. Resolves true when access is granted. */
  requestMicAccess: () => Promise<boolean>;
  /**
   * Resolved permission state, so the UI can explain the real reason instead of guessing.
   * `null` until the browser has answered — which is only ever on the client, never on the server,
   * where there is no microphone to ask about.
   */
  micState: MicState | null;
  /** Re-runs the permission probe (also re-checks secure context). */
  probeMic: () => Promise<MicState>;
  /** True while the browser's permission prompt is open, so the UI can say so. */
  asking: boolean;
}

const AssistantContext = createContext<AssistantValue | null>(null);

export function useAssistant(): AssistantValue {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("useAssistant must be used inside <AssistantProvider>");
  return value;
}

/**
 * The context value if one is already above us, else `null`.
 *
 * This exists so {@link AssistantPanel} can mount its own provider when it is rendered outside
 * the app shell. A panel reached without the shell should degrade to a private conversation,
 * not crash the page — an earlier refactor of `AppShell` dropped the provider and took
 * `/assistant` down with an exception instead of a working page.
 */
export function useOptionalAssistant(): AssistantValue | null {
  return useContext(AssistantContext);
}

/** What `navigator.permissions` reports for the microphone, plus the two environments where the
 *  API is unavailable and the browser will never prompt at all.
 *
 *  - `insecure`    — served over plain http on a non-localhost host. The browser forbids mic
 *                    outright and shows no prompt, whatever the site setting says.
 *  - `unsupported` — no `getUserMedia` at all (insecure context, or a browser without it).
 *  - `denied`      — the user answered "Block"; the browser will not prompt again.
 *  - `prompt`      — asking is all that is needed.
 *  - `granted`     — ready to record. */
type MicState = "granted" | "prompt" | "denied" | "insecure" | "unsupported";

/**
 * The microphone verdict, held in a small store outside React instead of in component state.
 *
 * `navigator.permissions.query` is the only way to learn the *real* reason the microphone is
 * unavailable, and it answers asynchronously, so the answer cannot be derived during render.
 * Reading it through `useSyncExternalStore` puts the write where one belongs — inside a
 * subscription callback — rather than in a mount effect that sets state and cascades an extra
 * render through every page that mounts the assistant. It also means the browser is asked once
 * per page load instead of once per effect run, and the `change` event is observed by one
 * listener rather than a new one per probe.
 *
 * The store is module-level on purpose: the answer belongs to the origin, not to a component, so
 * the `/assistant` page and the floating launcher share it.
 */
let micAnswer: MicState | null = null;
let micStatus: PermissionStatus | null = null;
let micProbeStarted = false;
const micListeners = new Set<() => void>();

function publishMicState(state: MicState | null) {
  if (state === micAnswer) return;
  micAnswer = state;
  for (const listener of micListeners) listener();
}

/**
 * The part of the verdict that needs no async call, because it is a property of the environment
 * rather than of the user. `null` means the environment is fine and the browser has to be asked.
 */
function readMicEnv(): MicState | null {
  if (typeof window === "undefined") return null;
  if (!window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  return null;
}

/** The verdict as it stands: the environment if it rules the microphone out, else the browser's. */
function getMicState(): MicState | null {
  return readMicEnv() ?? micAnswer;
}

/** Ask the browser and publish what it says. Safe to call repeatedly, e.g. from a retry button. */
async function refreshMicState(): Promise<MicState> {
  if (typeof navigator === "undefined") return "unsupported";
  let status: PermissionStatus | null = null;
  try {
    status = (await navigator.permissions?.query({ name: "microphone" as PermissionName })) ?? null;
  } catch {
    // Safari and Firefox reject the query for `microphone`; treat it as "ask and see".
  }
  if (status && status !== micStatus) {
    micStatus = status;
    status.addEventListener("change", () => publishMicState(micStatus?.state as MicState));
  }
  publishMicState(status ? (status.state as MicState) : "prompt");
  return getMicState() ?? "prompt";
}

function subscribeMicState(onStoreChange: () => void) {
  micListeners.add(onStoreChange);
  if (!micProbeStarted) {
    micProbeStarted = true;
    void refreshMicState();
  }
  return () => {
    micListeners.delete(onStoreChange);
  };
}

/** The server has no microphone to ask about, and hydration must not guess at one. */
const getServerMicState = () => null;

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<MedicationDraft>(emptyDraft);
  const [phase, setPhase] = useState<Phase>("idle");
  const [language, setLanguage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micBlocked, setMicBlocked] = useState(false);
  const micState = useSyncExternalStore(subscribeMicState, getMicState, getServerMicState);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [continuous, setContinuous] = useState(false);
  const [level, setLevel] = useState(0);
  const [replay, setReplay] = useState<ChatMessage | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const requesting = useRef(false);
  const [asking, setAsking] = useState(false);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const speakCount = useRef(0);
  // Read inside the audio loop and the turn handler, which must not be re-created per frame.
  const autoSpeakRef = useRef(autoSpeak);
  const levelRef = useRef(0);

  // Mirrors into refs in an effect, not during render: reading a ref while rendering is
  // flagged, and these feed the audio loop which must not be torn down every frame.
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const utils = api.useUtils();
  const turn = api.assistant.turn.useMutation();
  const transcribe = api.assistant.transcribe.useMutation();
  const speakMutation = api.assistant.speak.useMutation();

  const push = useCallback((message: Omit<ChatMessage, "id" | "at">) => {
    setMessages((prev) => [...prev, { ...message, id: nextId(), at: Date.now() }]);
  }, []);

  const say = useCallback(
    (text: string, lang?: string | null) => {
      push({ role: "assistant", kind: "said", text });
      if (lang) setLanguage(lang);
    },
    [push],
  );

  /** Stop whatever clip is playing. Used by barge-in, reset and unmount. */
  const hush = useCallback(() => {
    const el = audioEl.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
      audioEl.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, lang?: string | null) => {
      void (async () => {
        try {
          const audio = await speakMutation.mutateAsync({ text, language: lang ?? language });
          const bytes = Uint8Array.from(atob(audio.audioBase64), (c) => c.charCodeAt(0));
          const url = URL.createObjectURL(new Blob([bytes], { type: audio.mimeType }));
          const el = new Audio(url);
          audioEl.current = el;
          el.onended = () => {
            URL.revokeObjectURL(url);
            if (audioEl.current === el) audioEl.current = null;
          };
          await el.play();
          // Autoplay can be refused with no user gesture in play. The text is already on
          // screen, so offer a replay rather than failing silently.
          setReplay(
            (prev) =>
              prev ?? { id: nextId(), role: "assistant", kind: "said", text, at: Date.now() },
          );
        } catch {
          setReplay({ id: nextId(), role: "assistant", kind: "said", text, at: Date.now() });
        }
      })();
    },
    [speakMutation, language],
  );

  /** One conversational turn. The draft travels with every request; the server keeps no state. */
  const runTurn = useCallback(
    async (input: { utterance?: string; confirm?: boolean }) => {
      setPhase("thinking");
      setError(null);
      try {
        const result = await turn.mutateAsync({ ...input, draft });
        setDraft(result.draft);
        setNeedsConfirm(result.status === "confirm");
        setLanguage(result.language);
        say(result.question, result.language);

        const shouldSpeak =
          autoSpeakRef.current &&
          result.status !== "saved" &&
          speakCount.current < MAX_CONSECUTIVE_SPEAKS;
        if (shouldSpeak) speakCount.current += 1;
        else if (result.status === "saved") speakCount.current = 0;
        if (shouldSpeak) speak(result.question, result.language);

        if (result.status === "saved") {
          setDraft(emptyDraft());
          setNeedsConfirm(false);
          void utils.medication.list.invalidate();
        }
        setPhase("asking");
      } catch (cause) {
        setPhase("idle");
        const text = cause instanceof Error ? cause.message : "Something went wrong.";
        setError(text);
        push({ role: "system", kind: "system", text });
      }
    },
    [turn, draft, utils, say, push, speak],
  );

  const send = useCallback(
    async (utterance: string) => {
      const text = utterance.trim();
      if (!text) return;
      push({ role: "user", kind: "said", text });
      await runTurn({ utterance: text });
    },
    [push, runTurn],
  );

  const confirm = useCallback(async () => {
    await runTurn({ confirm: true });
  }, [runTurn]);

  /** Feed a recorded clip to the model, then treat the transcript as the next utterance. */
  const handleClip = useCallback(
    async (base64: string, mimeType: string) => {
      setPhase("thinking");
      try {
        const heard = await transcribe.mutateAsync({ audioBase64: base64, mimeType });
        push({ role: "user", kind: "heard", text: heard.text });
        setLanguage(heard.language);
        await runTurn({ utterance: heard.text });
      } catch (cause) {
        setPhase("idle");
        const text = cause instanceof Error ? cause.message : "I could not hear that.";
        setError(text);
        push({ role: "system", kind: "system", text });
      }
    },
    [transcribe, runTurn, push],
  );

  const stopRecording = useCallback(() => {
    recorder.current?.stop();
    recorder.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    // Re-entrancy guard. A pointerdown and the click that follows it land back to back, and a
    // second getUserMedia while the first still awaits the permission prompt yields two competing
    // streams and a discarded recorder — which presents to the user as a microphone that simply
    // never turns on. Only the first caller is allowed to proceed.
    if (requesting.current || recorder.current) return;

    requesting.current = true;
    setAsking(true);
    setError(null);
    hush();

    // `getUserMedia` is gated on a secure context, and on plain http it fails immediately and
    // silently with no permission prompt — so the user would be told their mic was "denied"
    // when it was never even offered.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      const text = `The microphone is blocked because this page is not on a secure connection (you are on ${window.location.host}). Browsers forbid the microphone on plain http for any host other than localhost, and show no permission prompt. Open http://localhost:3000/assistant instead.`;
      setError(text);
      push({ role: "system", kind: "system", text });
      setPhase("idle");
      requesting.current = false;
      setAsking(false);
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const text = "This browser cannot record audio. Please type instead.";
      publishMicState("unsupported");
      setError(text);
      push({ role: "system", kind: "system", text });
      setPhase("idle");
      requesting.current = false;
      setAsking(false);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicBlocked(false);
      requesting.current = false;
      setAsking(false);
      setPhase("listening");
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : "";
      const denied = name === "NotAllowedError" || name === "SecurityError";
      const text = denied
        ? "Microphone permission was denied. You can type your answer instead."
        : name === "NotFoundError" || name === "DevicesNotFoundError"
          ? "No microphone was found. You can type your answer instead."
          : name === "NotReadableError"
            ? "Your microphone is in use by another app."
            : "The microphone could not be started. You can type your answer instead.";
      setPhase("idle");
      setError(text);
      setMicBlocked(denied);
      if (denied) publishMicState("denied");
      push({ role: "system", kind: "system", text });

      requesting.current = false;
      setAsking(false);
      requesting.current = false;
      return;
    }

    streamRef.current = stream;
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setLevel(0);
      const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
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
      await handleClip(base64, rec.mimeType || "audio/webm");
    };
    rec.start();
    recorder.current = rec;
    requesting.current = false;
    setAsking(false);
    setPhase("listening");

    // Zero-dependency activity meter. An `AnalyserNode` RMS is enough to tell "talking" from
    // "quiet" and to cut the bot off when the patient interrupts — no VAD model to download.
    if (continuous) {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const THRESHOLD = 0.07;
      let quietSince = Date.now();
      const startedAt = Date.now();
      const tick = () => {
        if (recorder.current !== rec) {
          void ctx.close();
          return;
        }
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) {
          const centred = (v - 128) / 128;
          sum += centred * centred;
        }
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms * 6));
        const now = Date.now();
        if (rms > THRESHOLD) {
          quietSince = now;
          // Barge-in: the patient started talking over the reply, so stop talking.
          if (audioEl.current) hush();
        } else if (now - quietSince > SILENCE_MS || now - startedAt > MAX_TURN_MS) {
          stopRecording();
          void ctx.close();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [continuous, handleClip, hush, push, stopRecording]);

  const reset = useCallback(() => {
    hush();
    setDraft(emptyDraft());
    setMessages([]);
    setError(null);
    setNeedsConfirm(false);
    setLanguage(null);
    setPhase("idle");
    speakCount.current = 0;
  }, [hush]);

  /**
   * Live microphone preflight, for the moments the UI asks for it again (the "Enable microphone"
   * retry, after a grant or a block). The verdict itself is read from the store, which probes the
   * browser on the first subscribe — see {@link subscribeMicState} for why that is not an effect.
   */
  const probeMic = useCallback((): Promise<MicState> => refreshMicState(), []);

  const dismissError = useCallback(() => setError(null), []);

  /**
   * Re-offer the microphone.
   *
   * Once a user answers "Block" the browser remembers that decision and `getUserMedia` rejects
   * without ever showing a prompt again, so pressing Speak silently does nothing. This must run
   * from a real click to count as a user gesture, and it deliberately opens then immediately
   * closes the stream: acquiring a track is what clears a `prompt` state, and the caller then
   * starts a fresh recording.
   */
  const requestMicAccess = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicBlocked(false);
      publishMicState("granted");
      setError(null);
      return true;
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setMicBlocked(true);
        publishMicState("denied");
        setError(
          "Still blocked. Click the padlock or camera icon beside the address bar, set Microphone to Allow, then reload the page.",
        );
      }
      return false;
    }
  }, []);

  useEffect(
    () => () => {
      recorder.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioEl.current?.pause();
    },
    [],
  );

  const value = useMemo<AssistantValue>(
    () => ({
      messages,
      draft,
      phase,
      language,
      error,
      needsConfirm,
      autoSpeak,
      continuous,
      level,
      replay,
      speak,
      send,
      confirm,
      startRecording,
      stopRecording,
      reset,
      setAutoSpeak,
      setContinuous,
      dismissError,
      micBlocked,
      requestMicAccess,
      micState,
      probeMic,
      asking,
    }),
    [
      messages,
      draft,
      phase,
      language,
      error,
      needsConfirm,
      autoSpeak,
      continuous,
      level,
      replay,
      speak,
      send,
      confirm,
      startRecording,
      stopRecording,
      reset,
      dismissError,
      micBlocked,
      requestMicAccess,
      micState,
      probeMic,
      asking,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
