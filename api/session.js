// POST /api/session
// "Remember this phone": iPhone Home Screen apps can forget Google's login when closed.
// After a real sign-in, the phone gets a private device key; only a hash of it is stored here.
// On the next launch, the key is exchanged for a fresh sign-in pass, with no Google screen needed.
// Actions: create (signed in), restore (with key), revoke (signed in)

const crypto = require("crypto");
const { admin, db, verifyUser } = require("./_lib/firebase");

const MAX_DEVICES = 5;
const hash = (key) => crypto.createHash("sha256").update(String(key)).digest("hex");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = req.body || {};
  try {
    if (body.action === "restore") {
      const key = String(body.key || "");
      if (key.length < 40) return res.status(400).json({ error: "bad key" });
      const snap = await db().collection("users").where("deviceKeys", "array-contains", hash(key)).limit(1).get();
      if (snap.empty) return res.status(401).json({ error: "This phone isn't remembered anymore. Please sign in again." });
      const token = await admin.auth().createCustomToken(snap.docs[0].id);
      return res.status(200).json({ token });
    }

    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in first" });
    const ref = db().collection("users").doc(user.uid);

    if (body.action === "create") {
      const key = crypto.randomBytes(32).toString("hex");
      const current = ((await ref.get()).data() || {}).deviceKeys || [];
      await ref.set({ deviceKeys: [...current, hash(key)].slice(-MAX_DEVICES) }, { merge: true });
      return res.status(200).json({ key });
    }

    if (body.action === "revoke") {
      const key = String(body.key || "");
      if (key) await ref.set({ deviceKeys: admin.firestore.FieldValue.arrayRemove(hash(key)) }, { merge: true });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error("session failed", body.action, e.code || e.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
