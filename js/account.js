// Google sign-in (Firebase Auth) and calls to PCOSphere's server functions.
// Firebase is only loaded when someone signs in or opens an invite, so the app stays light otherwise.
// This config is public by design; the database itself is locked and only the server can use it.

import { DEMO, DEMO_USER, demoApi } from "./demo.js";

export const SDK = "https://www.gstatic.com/firebasejs/12.19.0";
const REDIRECT_FLAG = "pcosphere.redirect";

// Sign-in runs through our own domain (Vercel forwards /__/auth to Firebase, see vercel.json),
// so iPhones don't block it as "cross-site". We always try a popup first: in an iPhone Home Screen
// app, a full-page redirect signs in a separate browser layer instead of the app itself.
export const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
const useOwnDomain = location.hostname === "pcosphere.vercel.app";

const CONFIG = {
  apiKey: "AIzaSyCiNulDd5CZThAQwI5jqXUwYi8GTNY2jnc",
  authDomain: useOwnDomain ? location.hostname : "pcosphere-24012.firebaseapp.com",
  projectId: "pcosphere-24012",
  storageBucket: "pcosphere-24012.firebasestorage.app",
  messagingSenderId: "591481585948",
  appId: "1:591481585948:web:3e5118cbbfc6d21504fad9",
};

let ready = null;
let loaded = false;
export const firebaseReady = () => loaded;
let fb = null; // { app, auth, mod }

export function loadFirebase() {
  if (DEMO) { loaded = true; fb = { app: null, auth: { currentUser: DEMO_USER }, mod: null }; return Promise.resolve(fb); }
  if (!ready) {
    ready = (async () => {
      const { initializeApp } = await import(`${SDK}/firebase-app.js`);
      const mod = await import(`${SDK}/firebase-auth.js`);
      const app = initializeApp(CONFIG);
      // Save the login in localStorage first: iPhone Home Screen apps don't reliably keep
      // IndexedDB between launches, which signed people out after closing the app.
      const auth = mod.initializeAuth(app, {
        persistence: [mod.browserLocalPersistence, mod.indexedDBLocalPersistence],
        popupRedirectResolver: mod.browserPopupRedirectResolver,
      });
      fb = { app, auth, mod };
      // Finish a redirect-style sign-in, if one was in progress
      try { await mod.getRedirectResult(auth); } catch {}
      try { localStorage.removeItem(REDIRECT_FLAG); } catch {}
      await auth.authStateReady();
      loaded = true;
      return fb;
    })();
  }
  return ready;
}

export async function currentUser() {
  const { auth } = await loadFirebase();
  return auth.currentUser;
}

export async function signIn() {
  if (DEMO) return DEMO_USER;
  const { auth, mod } = await loadFirebase();
  const provider = new mod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const redirect = async () => {
    try { localStorage.setItem(REDIRECT_FLAG, "1"); } catch {}
    await mod.signInWithRedirect(auth, provider);
    return null;
  };
  try {
    const result = await mod.signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    // Some phones block popups: fall back to a full-page sign-in
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/web-storage-unsupported"].includes(e.code)) {
      if (isStandalone()) throw e;
      return redirect();
    }
    if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return null;
    throw e;
  }
}

// ---------- Remember this phone ----------
const DEVICE_KEY = "pcosphere.deviceKey";

// After a real Google sign-in: ask the server for a private key for this phone
export async function rememberDevice() {
  if (DEMO) return;
  try { if (localStorage.getItem(DEVICE_KEY)) return; } catch { return; }
  const r = await api("/api/session", { action: "create" });
  if (r.ok && r.data.key) { try { localStorage.setItem(DEVICE_KEY, r.data.key); } catch {} }
}

// On launch, if Google forgot the login: sign back in quietly with the phone's key
export async function restoreDevice() {
  if (DEMO) return DEMO_USER;
  let key = null;
  try { key = localStorage.getItem(DEVICE_KEY); } catch {}
  if (!key) return null;
  const r = await api("/api/session", { action: "restore", key });
  if (!r.ok || !r.data.token) {
    if (r.status === 401) { try { localStorage.removeItem(DEVICE_KEY); } catch {} }
    return null;
  }
  const { auth, mod } = await loadFirebase();
  try {
    const cred = await mod.signInWithCustomToken(auth, r.data.token);
    return cred.user;
  } catch {
    return null;
  }
}

export async function forgetDevice() {
  if (DEMO) return;
  let key = null;
  try { key = localStorage.getItem(DEVICE_KEY); localStorage.removeItem(DEVICE_KEY); } catch {}
  if (key) await api("/api/session", { action: "revoke", key });
}

export function redirectPending() {
  try { return localStorage.getItem(REDIRECT_FLAG) === "1"; } catch { return false; }
}

export async function signOutUser() {
  if (DEMO) return;
  const { auth, mod } = await loadFirebase();
  await mod.signOut(auth);
}

// POST to one of our /api endpoints, with the signed-in user's ID token attached.
// Returns { ok, status, data }.
export async function api(path, body, timeoutMs = 15000) {
  if (DEMO) return demoApi(path, body);
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    if (ready && !loaded) { try { await ready; } catch {} } // wait for sign-in to be restored first
    const user = fb?.auth.currentUser || null;
    const token = user ? await user.getIdToken() : null;
    const r = await fetch(path, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    let data = {};
    try { data = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Couldn't connect. Check your internet and try again." } };
  } finally {
    clearTimeout(t);
  }
}
