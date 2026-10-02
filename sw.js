// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// PCOSphere service worker: receives push notifications even when the app is closed.
// Lock-screen text is always discreet; the actual idea is only shown inside the app.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {}
  const data = payload.data || payload || {};
  const title = data.title || "PCOSphere";
  const options = {
    body: data.body || "A little idea for today 🌸",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || "pcosphere-hint",
    renotify: true,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification opens (or focuses) PCOSphere
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if (new URL(c.url).origin === self.location.origin) {
        await c.focus();
        c.postMessage({ type: "hint-opened" });
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
