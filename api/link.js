// POST /api/link
// Everything about connecting her with up to 2 trusted people, done on the server so the rules can't be bypassed.
// Actions: create-invite, invite-info, accept-invite, list, unlink, cancel-invite

const { admin, db, verifyUser } = require("./_lib/firebase");

const MAX_PEOPLE = 2;
const INVITE_DAYS = 7;
const RELATIONS = ["partner", "best friend", "friend", "mum", "dad", "sibling", "cousin", "someone close"];
const clean = (s, max) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function newCode() {
  // No look-alike characters (0/O, 1/I/L), easy to read out loud
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function activeLinksFor(uid) {
  const [asOwner, asSupporter] = await Promise.all([
    db().collection("links").where("ownerUid", "==", uid).where("active", "==", true).get(),
    db().collection("links").where("supporterUid", "==", uid).where("active", "==", true).get(),
  ]);
  const shape = (d) => {
    const x = d.data();
    return { id: d.id, ownerUid: x.ownerUid, ownerName: x.ownerName, supporterUid: x.supporterUid, supporterName: x.supporterName, relation: x.relation, createdAt: x.createdAt?.toMillis?.() || 0 };
  };
  return { mine: asOwner.docs.map(shape), supporting: asSupporter.docs.map(shape) };
}

async function openInvitesFor(uid) {
  const snap = await db().collection("invites").where("ownerUid", "==", uid).get();
  const now = Date.now();
  return snap.docs
    .map((d) => ({ code: d.id, ...d.data() }))
    .filter((i) => !i.usedBy && i.expiresAt?.toMillis?.() > now)
    .map((i) => ({ code: i.code, personName: i.personName, relation: i.relation }));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = req.body || {};
  const action = body.action;

  try {
    // Anyone holding an invite link can see whose invite it is, before signing in
    if (action === "invite-info") {
      const code = clean(body.code, 10).toUpperCase();
      const snap = code ? await db().collection("invites").doc(code).get() : null;
      if (!snap?.exists) return res.status(200).json({ valid: false });
      const i = snap.data();
      const valid = !i.usedBy && i.expiresAt.toMillis() > Date.now();
      return res.status(200).json({ valid, ownerName: i.ownerName, relation: i.relation, personName: i.personName });
    }

    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in first" });

    if (action === "list") {
      const links = await activeLinksFor(user.uid);
      const invites = await openInvitesFor(user.uid);
      return res.status(200).json({ ...links, invites });
    }

    if (action === "create-invite") {
      const { mine } = await activeLinksFor(user.uid);
      const invites = await openInvitesFor(user.uid);
      if (mine.length + invites.length >= MAX_PEOPLE) {
        return res.status(400).json({ error: `You can have up to ${MAX_PEOPLE} people for now.` });
      }
      const relation = RELATIONS.includes(body.relation) ? body.relation : "someone close";
      let code = newCode();
      for (let tries = 0; tries < 5 && (await db().collection("invites").doc(code).get()).exists; tries++) code = newCode();
      await db().collection("invites").doc(code).set({
        ownerUid: user.uid,
        ownerName: clean(body.ownerName, 30) || clean(user.name.split(" ")[0], 30) || "Your friend",
        personName: clean(body.personName, 30),
        relation,
        ownerConsentAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + INVITE_DAYS * 86400000),
        usedBy: null,
      });
      return res.status(200).json({ code });
    }

    if (action === "cancel-invite") {
      const ref = db().collection("invites").doc(clean(body.code, 10).toUpperCase());
      const snap = await ref.get();
      if (snap.exists && snap.data().ownerUid === user.uid && !snap.data().usedBy) await ref.delete();
      return res.status(200).json({ ok: true });
    }

    if (action === "accept-invite") {
      const code = clean(body.code, 10).toUpperCase();
      const inviteRef = db().collection("invites").doc(code);
      const result = await db().runTransaction(async (t) => {
        const snap = await t.get(inviteRef);
        if (!snap.exists) return { error: "This invite link doesn't work. Ask her to send a new one." };
        const i = snap.data();
        if (i.usedBy) return { error: "This invite has already been used." };
        if (i.expiresAt.toMillis() < Date.now()) return { error: "This invite has expired. Ask her to send a new one." };
        if (i.ownerUid === user.uid) return { error: "That's your own invite. Send it to your person instead." };
        const linkRef = db().collection("links").doc(`${i.ownerUid}_${user.uid}`);
        t.update(inviteRef, { usedBy: user.uid, usedAt: admin.firestore.FieldValue.serverTimestamp() });
        t.set(linkRef, {
          ownerUid: i.ownerUid,
          ownerName: i.ownerName,
          supporterUid: user.uid,
          supporterName: clean(body.supporterName, 30) || i.personName || clean(user.name.split(" ")[0], 30) || "Your person",
          relation: i.relation,
          active: true,
          ownerConsentAt: i.ownerConsentAt || i.createdAt,
          supporterConsentAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { ok: true, ownerName: i.ownerName, linkId: linkRef.id };
      });
      return res.status(result.error ? 400 : 200).json(result);
    }

    if (action === "unlink") {
      const ref = db().collection("links").doc(clean(body.linkId, 200));
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "Link not found" });
      const l = snap.data();
      if (l.ownerUid !== user.uid && l.supporterUid !== user.uid) return res.status(403).json({ error: "Not your link" });
      await ref.update({ active: false, unlinkedAt: admin.firestore.FieldValue.serverTimestamp(), unlinkedBy: user.uid });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error("link failed", action, e.message);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
