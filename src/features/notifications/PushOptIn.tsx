"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";

import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * VAPID public key must be a URL-safe base64 string; browsers reject anything else. Returns an
 * `ArrayBuffer` (not a `Uint8Array`) to satisfy the `BufferSource` type without a cast.
 */
function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

type Status = "unsupported" | "default" | "granted" | "denied" | "subscribing" | "subscribed";

/**
 * Web-push opt-in. Registers the service worker, asks for permission, subscribes with the VAPID
 * public key and stores the subscription server-side. Renders nothing where push is unavailable
 * (insecure origin, no service worker) so it never shows a dead button.
 */
export function PushOptIn() {
  const [status, setStatus] = useState<Status>("default");
  const publicKey = api.push.publicKey.useQuery(undefined, { retry: false });
  const subscribe = api.push.subscribe.useMutation();
  const unsubscribeAll = api.push.unsubscribeAll.useMutation();

  const sync = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    const permission = Notification.permission;
    if (permission === "denied") {
      setStatus("denied");
      return;
    }
    if (permission !== "granted") {
      setStatus("default");
      return;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    const existing = await registration?.pushManager.getSubscription();
    setStatus(existing ? "subscribed" : "granted");
  }, []);

  // Reading the Notification API is a genuine external-system sync, which is what effects are for.
  // The rule fires because `sync` eventually calls `setStatus`, but every one of those calls sits
  // behind an `await`, so none of them can run during this commit or cascade a render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void sync();
  }, [sync]);

  // No `useCallback` here: both handlers are only ever invoked from a fresh inline `onClick`
  // arrow, so memoising them changed nothing while preventing the React Compiler from compiling
  // this component at all.
  const enable = async () => {
    if (!publicKey.data?.publicKey) {
      toast.error("Push is not configured on this server.");
      return;
    }
    setStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(publicKey.data.publicKey),
        }));

      // The DOM `PushSubscription` does not expose its keys directly; serialise it instead.
      const json = subscription.toJSON();
      await subscribe.mutateAsync({
        endpoint: subscription.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      });
      setStatus("subscribed");
      toast.success("Push notifications enabled.");
    } catch (error) {
      setStatus("default");
      toast.error("Could not enable push notifications.", {
        description: (error as Error).message,
      });
    }
  };

  const disable = async () => {
    setStatus("default");
    await unsubscribeAll.mutateAsync().catch(() => void 0);
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe().catch(() => void 0);
    toast.success("Push notifications turned off.");
  };

  if (status === "unsupported" || publicKey.data?.enabled === false) return null;

  if (status === "subscribed") {
    return (
      <Button variant="outline" size="sm" onClick={() => void disable()}>
        <BellRing className="size-4" />
        Push on — turn off
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={status === "denied" || status === "subscribing"}
      onClick={() => void enable()}
    >
      {status === "subscribing" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : status === "denied" ? (
        <BellOff className="size-4" />
      ) : (
        <BellRing className="size-4" />
      )}
      {status === "denied" ? "Push blocked in browser" : "Enable push notifications"}
    </Button>
  );
}
