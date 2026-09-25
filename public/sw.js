/*
 * MediTrack AI push service worker.
 *
 * Two jobs: display a notification when the push service delivers one, and route a click back
 * into the app. Deliberately dependency-free and cache-free — it never intercepts fetches, so
 * it cannot interfere with the app's own caching or auth.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "MediTrack AI";
  const options = {
    body: payload.body || "",
    // `tag` collapses a repeat of the same alert instead of stacking duplicates.
    tag: payload.tag || "meditrackai",
    renotify: false,
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url: payload.url || "/notifications", notificationId: payload.notificationId },
    // A reminder is time-critical; keep it on screen until acted on.
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = (event.notification.data && event.notification.data.url) || "/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if there is one, otherwise open a new one.
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
