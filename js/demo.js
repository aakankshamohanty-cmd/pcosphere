// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// "See both sides" demo: two copies of PCOSphere running side by side on demo.html, already linked.
// Two stories:
//   Partner: Riya (has PCOS) and Arjun, her person         -> ?demo=her / ?demo=him
//   Family:  Riya and her mum Meera, who both use the app   -> ?demo=daughter / ?demo=mum
//            and are each other's person (support goes both ways)
// Linking and hints run here in the browser, shared through localStorage, so the demo never touches
// real accounts or the real database. The AI (chat, check-ins, recipes, routines) is the real thing.

const PEOPLE = {
  her: { uid: "demo-her", name: "Riya", role: "me", theme: "cottage", story: "partner" },
  him: { uid: "demo-him", name: "Arjun", role: "supporter", theme: "cottage", story: "partner" },
  daughter: { uid: "demo-riya", name: "Riya", role: "me", theme: "cottage", story: "family" },
  mum: { uid: "demo-meera", name: "Meera", role: "me", theme: "blush", story: "family" },
};

export const DEMO = (() => {
  const d = new URLSearchParams(location.search).get("demo");
  return PEOPLE[d] ? d : null;
})();

const me = DEMO ? PEOPLE[DEMO] : null;
const SHARED = me?.story === "family" ? "pcosphere.demo.family" : "pcosphere.demo.shared";

// Links are "owner -> supporter": the owner sends hints, the supporter receives them
const LINKS = {
  partner: [
    { id: "demo-link", ownerUid: "demo-her", ownerName: "Riya", supporterUid: "demo-him", supporterName: "Arjun", relation: "partner" },
  ],
  family: [
    { id: "demo-riya-meera", ownerUid: "demo-riya", ownerName: "Riya", supporterUid: "demo-meera", supporterName: "Meera", relation: "mum" },
    { id: "demo-meera-riya", ownerUid: "demo-meera", ownerName: "Meera", supporterUid: "demo-riya", supporterName: "Riya", relation: "daughter" },
  ],
};

export const DEMO_USER = me ? { uid: me.uid, email: `${me.name.toLowerCase()} (demo)`, displayName: me.name } : null;

export function demoProfile() {
  const supporterOnly = me.role === "supporter";
  return {
    name: me.name,
    areas: supporterOnly ? [] : ["food", "mood", "movement", "cycle", "person"],
    theme: me.theme,
    role: me.role,
    onboarded: true,
  };
}

function shared() {
  try { return JSON.parse(localStorage.getItem(SHARED)) || { inactive: [], hints: [] }; }
  catch { return { inactive: [], hints: [] }; }
}
function saveShared(s) {
  try { localStorage.setItem(SHARED, JSON.stringify(s)); } catch {}
}
const activeLinks = (s) => LINKS[me.story].filter((l) => !(s.inactive || []).includes(l.id));

let templates = null;
async function loadTemplates() {
  if (!templates) templates = (await (await fetch("/js/hint-templates.json")).json()).kinds;
  return templates;
}

function deliverDue(s) {
  const now = Date.now();
  let changed = false;
  for (const h of s.hints) if (!h.delivered && h.deliverAt <= now) { h.delivered = true; h.deliveredAt = now; changed = true; }
  return changed;
}

const ok = (data) => ({ ok: true, status: 200, data });
const fail = (error) => ({ ok: false, status: 400, data: { error } });

// Stands in for the real /api endpoints during the demo
export async function demoApi(path, body = {}) {
  const s = shared();
  const links = activeLinks(s);
  const mine = links.filter((l) => l.ownerUid === me.uid);
  const supporting = links.filter((l) => l.supporterUid === me.uid);

  if (path === "/api/link") {
    switch (body.action) {
      case "list": return ok({ mine, supporting, invites: [] });
      case "unlink": s.inactive = [...new Set([...(s.inactive || []), body.linkId])]; saveShared(s); return ok({ ok: true });
      case "invite-info": return ok({ valid: false });
      default: return fail("Invites are switched off in the demo. These two are already linked.");
    }
  }
  if (path === "/api/hint") {
    if (body.action === "send") {
      const targets = mine.filter((l) => (body.linkIds || []).includes(l.id));
      if (!targets.length) return fail("You're not linked anymore. Tap Reset demo to link again.");
      const t = await loadTemplates();
      const kind = t[body.kind] ? body.kind : "talk";
      const lines = t[kind].lines;
      const line = lines[Number.isInteger(body.index) ? body.index % lines.length : 0];
      const delay = body.mode === "now" ? 0 : 20 + Math.floor(Math.random() * 41);
      const now = Date.now();
      for (const l of targets) {
        s.hints.push({ id: "h" + now + l.id, linkId: l.id, to: l.supporterUid, text: line.replace(/\{name\}/g, l.ownerName), kind, mode: body.mode, createdAt: now, deliverAt: now + delay * 60000, delivered: delay === 0, deliveredAt: delay === 0 ? now : null, seen: false });
      }
      saveShared(s);
      return ok({ sent: targets.map((l) => ({ linkId: l.id, supporterName: l.supporterName, deliverInMinutes: delay })) });
    }
    if (body.action === "inbox") {
      if (deliverDue(s)) saveShared(s);
      const ids = new Set(supporting.map((l) => l.id));
      const hints = s.hints.filter((h) => h.delivered && h.to === me.uid && ids.has(h.linkId)).sort((a, b) => b.deliveredAt - a.deliveredAt).slice(0, 20);
      return ok({ hints: hints.map(({ id, text, kind, seen, deliveredAt }) => ({ id, text, kind, seen, deliveredAt })) });
    }
    if (body.action === "seen") {
      const h = s.hints.find((x) => x.id === body.hintId && x.to === me.uid);
      if (h) { h.seen = true; saveShared(s); }
      return ok({ ok: true });
    }
    if (body.action === "deliver-now") {
      const pending = s.hints.filter((h) => !h.delivered && mine.some((l) => l.id === h.linkId));
      for (const h of pending) h.deliverAt = Date.now();
      deliverDue(s); saveShared(s);
      return ok({ released: pending.length });
    }
  }
  if (path === "/api/profile") return ok(body.action === "get" ? { profile: null } : { ok: true });
  if (path === "/api/push") return ok({ ok: true, sent: 0 });
  if (path === "/api/session") return ok({});
  return fail("Not available in the demo");
}

// Called when the other demo phone changes something (e.g. a nudge was sent)
export function onDemoChange(fn) {
  window.addEventListener("storage", (e) => { if (e.key === SHARED) fn(); });
}
