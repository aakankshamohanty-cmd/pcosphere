// Google sign-in (Firebase Auth) and calls to PCOSphere's server functions.
// Firebase is only loaded when someone signs in or opens an invite, so the app stays light otherwise.
// This config is public by design; the database itself is locked and only the server can use it.

const SDK = "https://www.gstatic.com/firebasejs/12.19.0";
const CONFIG = {
  apiKey: "AIzaSyCiNulDd5CZThAQwI5jqXUwYi8GTNY2jnc",
  authDomain: "pcosphere-24012.firebaseapp.com",
  projectId: "pcosphere-24012",
  storageBucket: "pcosphere-24012.firebasestorage.app",
  messagingSenderId: "591481585948",
  appId: "1:591481585948:web:3e5118cbbfc6d21504fad9",
};

let ready = null;
let fb = null; // { app, auth, mod }

export function loadFirebase() {
  if (!ready) {
    ready = (async () => {
      const { initializeApp } = await import(`${SDK}/firebase-app.js`);
      const mod = await import(`${SDK}/firebase-auth.js`);
      const app = initializeApp(CONFIG);
      const auth = mod.getAuth(app);
      fb = { app, auth, mod };
      // Finish a redirect-style sign-in, if one was in progress
      try { await mod.getRedirectResult(auth); } catch {}
      await auth.authStateReady();
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
  const { auth, mod } = await loadFirebase();
  const provider = new mod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await mod.signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    // Some phones block popups: fall back to a full-page sign-in
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/web-storage-unsupported"].includes(e.code)) {
      await mod.signInWithRedirect(auth, provider);
      return null;
    }
    if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return null;
    throw e;
  }
}

export async function signOutUser() {
  const { auth, mod } = await loadFirebase();
  await mod.signOut(auth);
}

// POST to one of our /api endpoints, with the signed-in user's ID token attached.
// Returns { ok, status, data }.
export async function api(path, body, timeoutMs = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
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
