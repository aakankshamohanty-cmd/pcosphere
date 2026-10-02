// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// POST /api/hint
// Sends her chosen gentle hint to her person(s), now or after a random 20–60 minute delay.
// Actions: send, inbox, seen, deliver-now
// Hints never say she asked. The wording comes only from js/hint-templates.json.

const { admin, db, verifyUser } = require("./_lib/firebase");
const TEMPLATES = require("../js/hint-templates.json").kinds;
const { deliverDue } = require("./_lib/deliver");
const { sendToUser } = require("./_lib/push");

const MAX_HINTS_PER_DAY = 6;
const DELAY_MIN = 20;
const DELAY_MAX = 60;
const clean = (s, max) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const ms = (ts) => ts?.toMillis?.() || 0;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = req.body || {};
  const action = body.action;

  try {
    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in first" });

    if (action === "send") {
      const kind = TEMPLATES[body.kind] ? body.kind : null;
      if (!kind) return res.status(400).json({ error: "Pick what would help" });
      const lines = TEMPLATES[kind].lines;
      const index = Number.isInteger(body.index) && body.index >= 0 && body.index < lines.length ? body.index : Math.floor(Math.random() * lines.length);
      const mode = body.mode === "now" ? "now" : "later";
      const linkIds = (Array.isArray(body.linkIds) ? body.linkIds : []).slice(0, 2).map((x) => clean(x, 200));
      if (!linkIds.length) return res.status(400).json({ error: "Choose who to nudge" });

      // A gentle daily limit, so hints stay special
      const userRef = db().collection("users").doc(user.uid);
      const today = new Date().toISOString().slice(0, 10);
      const u = (await userRef.get()).data() || {};
      const sentToday = u.hintDay === today ? u.hintCount || 0 : 0;
      if (sentToday + linkIds.length > MAX_HINTS_PER_DAY) {
        return res.status(429).json({ error: "That's plenty of nudges for today. Try again tomorrow." });
      }

      const now = Date.now();
      const sent = [];
      for (const linkId of linkIds) {
        const linkSnap = await db().collection("links").doc(linkId).get();
        const l = linkSnap.data();
        if (!linkSnap.exists || !l.active || l.ownerUid !== user.uid) continue;
        const delayMin = mode === "now" ? 0 : DELAY_MIN + Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1));
        const ref = await db().collection("hints").add({
          linkId,
          ownerUid: user.uid,
          supporterUid: l.supporterUid,
          kind,
          text: lines[index].replace(/\{name\}/g, l.ownerName),
          mode,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          deliverAt: admin.firestore.Timestamp.fromMillis(now + delayMin * 60000),
          delivered: mode === "now",
          deliveredAt: mode === "now" ? admin.firestore.FieldValue.serverTimestamp() : null,
          seen: false,
          pushed: false,
        });
        sent.push({ id: ref.id, linkId, supporterName: l.supporterName, supporterUid: l.supporterUid, deliverInMinutes: delayMin });
      }
      if (!sent.length) return res.status(400).json({ error: "Those links aren't active anymore." });
      if (mode === "now") {
        const uids = [...new Set(sent.map((x) => x.supporterUid))];
        await Promise.all(uids.map((uid) => sendToUser(uid).catch(() => null)));
      }
      await userRef.set({ hintDay: today, hintCount: sentToday + sent.length }, { merge: true });
      return res.status(200).json({ sent: sent.map(({ supporterUid, ...rest }) => rest) });
    }

    if (action === "inbox") {
      // Only hints sent to this person, from links that are still active
      const base = db().collection("hints").where("supporterUid", "==", user.uid);
      await deliverDue(base);
      const snap = await base.where("delivered", "==", true).get();
      const linkIds = [...new Set(snap.docs.map((d) => d.data().linkId))];
      const active = new Set();
      for (const id of linkIds) {
        const l = await db().collection("links").doc(id).get();
        if (l.exists && l.data().active) active.add(id);
      }
      const hints = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((h) => active.has(h.linkId))
        .sort((a, b) => ms(b.deliveredAt) - ms(a.deliveredAt))
        .slice(0, 20)
        .map((h) => ({ id: h.id, text: h.text, kind: h.kind, seen: h.seen, deliveredAt: ms(h.deliveredAt) || ms(h.deliverAt) }));
      return res.status(200).json({ hints });
    }

    if (action === "seen") {
      const ref = db().collection("hints").doc(clean(body.hintId, 100));
      const snap = await ref.get();
      if (snap.exists && snap.data().supporterUid === user.uid) await ref.update({ seen: true, seenAt: admin.firestore.FieldValue.serverTimestamp() });
      return res.status(200).json({ ok: true });
    }

    // Demo shortcut so reviewers don't have to wait 20–60 minutes: she can release her own pending hints now
    if (action === "deliver-now") {
      const snap = await db().collection("hints").where("ownerUid", "==", user.uid).where("delivered", "==", false).get();
      const batch = db().batch();
      for (const d of snap.docs) batch.update(d.ref, { deliverAt: admin.firestore.Timestamp.now() });
      await batch.commit();
      await deliverDue(db().collection("hints").where("ownerUid", "==", user.uid));
      return res.status(200).json({ released: snap.size });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error("hint failed", action, e.message);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

