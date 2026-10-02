// Firebase Admin for PCOSphere's server functions.
// Uses the FIREBASE_SERVICE_ACCOUNT secret stored in Vercel (never in the code or GitHub).

const admin = require("firebase-admin");

function init() {
  if (admin.apps.length) return admin.app();
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT missing");
  const sa = JSON.parse(raw);
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return admin.initializeApp({ credential: admin.credential.cert(sa) });
}

// Checks the signed-in user's ID token sent by the app. Returns their uid and name, or null.
async function verifyUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    init();
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, name: decoded.name || "", email: decoded.email || "" };
  } catch {
    return null;
  }
}

function db() {
  init();
  return admin.firestore();
}

module.exports = { admin, db, verifyUser };
