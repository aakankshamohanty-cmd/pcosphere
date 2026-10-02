// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// POST /api/push
// Lets a phone register for notifications, and send itself a test one.
// Actions: register, unregister, test

const { admin, db, verifyUser } = require("./_lib/firebase");
const { sendToUser } = require("./_lib/push");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: "Please sign in first" });
  const token = String(req.body?.token || "").slice(0, 4096);
  const ref = db().collection("users").doc(user.uid);

  try {
    if (req.body?.action === "register" && token) {
      await ref.set({ pushTokens: admin.firestore.FieldValue.arrayUnion(token) }, { merge: true });
      // Keep at most 5 devices per person
      const tokens = ((await ref.get()).data() || {}).pushTokens || [];
      if (tokens.length > 5) await ref.update({ pushTokens: tokens.slice(-5) });
      return res.status(200).json({ ok: true });
    }
    if (req.body?.action === "unregister" && token) {
      await ref.set({ pushTokens: admin.firestore.FieldValue.arrayRemove(token) }, { merge: true });
      return res.status(200).json({ ok: true });
    }
    if (req.body?.action === "test") {
      const r = await sendToUser(user.uid, { title: "PCOSphere", body: "Notifications are on. Gentle ideas will arrive here 🌸", tag: "pcosphere-test" });
      return res.status(200).json(r);
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error("push failed", e.code || e.message);
    return res.status(500).json({ error: "Couldn't set up notifications", code: e.code || null });
  }
};
