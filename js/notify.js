// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// Installing PCOSphere to the Home Screen, and turning on push notifications.
// iPhone only allows web notifications once the app is added to the Home Screen (iOS 16.4+).

import { SDK, loadFirebase, api, isStandalone } from "./account.js";

const VAPID_KEY = "BC5odBOoEWXSVVnypNePfgQQN8cioTwYtKbQjELybfnmw4saGQlvV9bvGqEh93ICBMJsv55ebGnxT7nGv8NuYJo";
const TOKEN_KEY = "pcosphere.pushToken";

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isAndroid = () => /android/i.test(navigator.userAgent);
export { isStandalone };

// Android/Chrome can show its own "Install app" prompt; we keep it for our button
let installPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installPrompt = e; });
export const canPromptInstall = () => !!installPrompt;
export async function promptInstall() {
  if (!installPrompt) return false;
  installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  installPrompt = null;
  return choice.outcome === "accepted";
}

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
}

// "on" | "off" | "denied" | "needs-install" | "unsupported"
export function notificationStatus() {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted" && localStorage.getItem(TOKEN_KEY)) return "on";
  return "off";
}

// Must be called from a tap (browsers only allow permission prompts after a user gesture)
export async function enableNotifications() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: permission };
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const { app } = await loadFirebase();
    const m = await import(`${SDK}/firebase-messaging.js`);
    if (!(await m.isSupported())) return { ok: false, reason: "unsupported" };
    const token = await m.getToken(m.getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return { ok: false, reason: "no-token" };
    const r = await api("/api/push", { action: "register", token });
    if (!r.ok) return { ok: false, reason: "server" };
    localStorage.setItem(TOKEN_KEY, token);
    return { ok: true };
  } catch (e) {
    console.warn("notifications", e?.code || e?.message);
    return { ok: false, reason: "error" };
  }
}

export async function sendTestNotification() {
  const r = await api("/api/push", { action: "test" });
  return r.ok && r.data.sent > 0;
}

// Plain-language install steps for this phone
export function installSteps() {
  if (isIOS()) return [
    "Open this page in Safari",
    "Tap the Share button (the square with an arrow ↑)",
    "Scroll down and tap \"Add to Home Screen\", then \"Add\"",
    "Open PCOSphere from your Home Screen and sign in again",
  ];
  if (isAndroid()) return [
    "Tap the ⋮ menu in Chrome",
    "Tap \"Install app\" (or \"Add to Home screen\")",
    "Open PCOSphere from your Home Screen",
  ];
  return ["In Chrome or Edge, click the install icon in the address bar, or use the menu → \"Install PCOSphere\""];
}
