// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// POST /api/profile
// Keeps a signed-in user's setup safe if they change phones: name, theme, support areas, role and "what helped".
// Check-ins and chats are NOT stored here; they stay on the phone.
// Actions: get, save

const { admin, db, verifyUser } = require("./_lib/firebase");

const AREAS = ["cycle", "food", "mood", "movement", "person"];
const THEMES = ["cottage", "gothic", "blush", "pop"];
const clean = (s, max) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: "Please sign in first" });
  const ref = db().collection("users").doc(user.uid);

  try {
    if (req.body?.action === "get") {
      const d = (await ref.get()).data() || {};
      return res.status(200).json({ profile: d.profile || null });
    }
    if (req.body?.action === "save") {
      const p = req.body.profile || {};
      const profile = {
        name: clean(p.name, 30),
        role: p.role === "supporter" ? "supporter" : "me",
        theme: THEMES.includes(p.theme) ? p.theme : "cottage",
        areas: (Array.isArray(p.areas) ? p.areas : []).filter((a) => AREAS.includes(a)),
        helped: (Array.isArray(p.helped) ? p.helped : []).slice(0, 12).map((h) => ({
          ideaId: clean(h.ideaId, 60), title: clean(h.title, 80), category: clean(h.category, 10),
        })),
      };
      await ref.set({ profile, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error("profile failed", e.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
