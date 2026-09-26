/**
 * Web push sender (§10.7 `webPush` channel). Wraps the `web-push` library so the rest of the
 * codebase never touches VAPID config or push-service error codes.
 *
 * VAPID keys are read lazily (not at module load) so a missing key degrades to "push disabled"
 * instead of crashing the server at import time, and so tests can stub `process.env`.
 *
 * `web-push` reaches `agent-base`, which does a bare `require("http")` that webpack cannot resolve
 * when the module is bundled. It is therefore listed in `serverExternalPackages` in
 * `next.config.ts`, so Next leaves it out of the server bundle and Node `require`s it from
 * `node_modules` at runtime. That is what lets it be a normal static import here: the previous
 * `createRequire` workaround existed only to keep the module out of the graph, and it defeated
 * itself — webpack's `createRequire` hook cannot statically parse a non-literal argument, so the
 * loader always returned null and push delivery was silently disabled.
 *
 * The import is still wrapped in a lazy `require` so that a missing optional dependency degrades
 * to "push disabled" rather than breaking the server build, which is what the `IgnorePlugin` in
 * `next.config.ts` and the lazy VAPID read below are both there to guarantee.
 */

import { log } from "@/lib/log";

/** Type-only, so it is erased at compile time and never becomes a runtime import. */
type WebPushClient = typeof import("web-push");

let cached: WebPushClient | null = null;

/** Resolve `web-push` on first use. Returns null if it is missing or unloadable. */
function getWebPush(): WebPushClient | null {
  if (cached) return cached;
  try {
    // `web-push` is in `serverExternalPackages`, so this resolves from `node_modules` at runtime
    // rather than being pulled into the bundle. The indirection is kept only so a missing optional
    // dependency downgrades to "push disabled" instead of failing the build.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require("web-push") as WebPushClient;
  } catch (error) {
    log.warn("web-push could not be loaded; push delivery is disabled", {
      message: (error as Error).message,
    });
    return null;
  }
  return cached;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Route to open when the notification is clicked. */
  url?: string;
  tag?: string;
  /** Notification id, so the SW can mark it read server-side. */
  notificationId?: string;
}

let configuredFor: string | null = null;

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/** Read + validate the VAPID trio. Returns null when push is not configured. */
export function readVapidConfig(): VapidConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return {
    publicKey,
    privateKey,
    subject: process.env.VAPID_SUBJECT?.trim() || "mailto:dev@meditrackai.local",
  };
}

/** True when a VAPID pair is present, i.e. web push can be delivered. */
export function isPushConfigured(): boolean {
  return readVapidConfig() !== null;
}

/** The public key browsers need for `applicationServerKey`, or null when unconfigured. */
export function publicVapidKey(): string | null {
  return readVapidConfig()?.publicKey ?? null;
}

/**
 * Apply VAPID config to the `web-push` singleton. Idempotent per key pair so a rotated key
 * re-initialises instead of silently signing with the previous private key.
 */
function ensureConfigured(): VapidConfig | null {
  const config = readVapidConfig();
  if (!config) return null;
  const webpush = getWebPush();
  if (!webpush) return null;
  if (configuredFor !== config.privateKey) {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    configuredFor = config.privateKey;
  }
  return config;
}

export type PushResult =
  | { status: "sent" }
  | { status: "gone" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

/**
 * Send one payload to one subscription. Never throws: a push failure must never roll back the
 * in-app notification row, and callers fan out over every device a user owns.
 *
 * `gone` means the push service rejected the endpoint permanently (404/410) and the caller
 * should delete the row.
 */
export async function sendPush(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<PushResult> {
  if (!ensureConfigured()) {
    return { status: "skipped", reason: "vapid-not-configured" };
  }

  const webpush = getWebPush();
  if (!webpush) {
    return { status: "skipped", reason: "web-push-unavailable" };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/notifications",
    tag: payload.tag ?? payload.notificationId ?? "meditrackai",
    notificationId: payload.notificationId,
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      body,
      { TTL: 60 * 60, urgency: "high" },
    );
    return { status: "sent" };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { status: "gone" };
    }
    log.warn("Push delivery failed", {
      statusCode,
      message: (error as Error).message,
    });
    return { status: "failed", reason: (error as Error).message };
  }
}
