// "See both sides" demo: two copies of PCOSphere (Riya and her person Arjun) running side by side
// on demo.html, already linked. Everything about linking and hints runs here in the browser,
// shared through localStorage, so the demo never touches real accounts or the real database.
// The AI (chat, check-ins, recipes, routines) is the real thing.

export const DEMO = (() => {
  const d = new URLSearchParams(location.search).get("demo");
  return d === "her" || d === "him" ? d : null;
})();

const SHARED = "pcosphere.demo.shared";
const LINK = { id: "demo-link", ownerUid: "demo-her", ownerName: "Riya", supporterUid: "demo-him", supporterName: "Arjun", relation: "partner" };

export const DEMO_USER = DEMO === "him"
  ? { uid: "demo-him", email: "arjun (demo)", displayName: "Arjun" }
  : { uid: "demo-her", email: "riya (demo)", displayName: "Riya" };

export function demoProfile() {
  return DEMO === "him"
    ? { name: "Arjun", areas: [], theme: "cottage", role: "supporter", onboarded: true }
    : { name: "Riya", areas: ["food", "mood", "movement", "cycle", "person"], theme: "cottage", role: "me", onboarded: true };
}

function shared() {
  try { return JSON.parse(localStorage.getItem(SHARED)) || { linkActive: true, hints: [] }; }
  catch { return { linkActive: true, hints: [] }; }
}
function saveShared(s) {
  try { localStorage.setItem(SHARED, JSON.stringify(s)); } catch {}
}

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
  if (path === "/api/link") {
    switch (body.action) {
      case "list":
        if (!s.linkActive) return ok({ mine: [], supporting: [], invites: [] });
        return ok(DEMO === "him" ? { mine: [], supporting: [LINK], invites: [] } : { mine: [LINK], supporting: [], invites: [] });
      case "unlink": s.linkActive = false; saveShared(s); return ok({ ok: true });
      case "invite-info": return ok({ valid: false });
      default: return fail("Invites are switched off in the demo. Riya and Arjun are already linked.");
    }
  }
  if (path === "/api/hint") {
    if (body.action === "send") {
      if (!s.linkActive) return fail("Riya and Arjun aren't linked anymore. Tap Reset demo to link them again.");
      const t = await loadTemplates();
      const kind = t[body.kind] ? body.kind : "talk";
      const lines = t[kind].lines;
      const text = lines[Number.isInteger(body.index) ? body.index % lines.length : 0].replace(/\{name\}/g, "Riya");
      const delay = body.mode === "now" ? 0 : 20 + Math.floor(Math.random() * 41);
      const now = Date.now();
      s.hints.push({ id: "h" + now, text, kind, mode: body.mode, createdAt: now, deliverAt: now + delay * 60000, delivered: delay === 0, deliveredAt: delay === 0 ? now : null, seen: false });
      saveShared(s);
      return ok({ sent: [{ linkId: LINK.id, supporterName: "Arjun", deliverInMinutes: delay }] });
    }
    if (body.action === "inbox") {
      if (DEMO !== "him") return ok({ hints: [] });
      if (deliverDue(s)) saveShared(s);
      const hints = s.linkActive ? s.hints.filter((h) => h.delivered).sort((a, b) => b.deliveredAt - a.deliveredAt).slice(0, 20) : [];
      return ok({ hints: hints.map(({ id, text, kind, seen, deliveredAt }) => ({ id, text, kind, seen, deliveredAt })) });
    }
    if (body.action === "seen") {
      const h = s.hints.find((x) => x.id === body.hintId);
      if (h) { h.seen = true; saveShared(s); }
      return ok({ ok: true });
    }
    if (body.action === "deliver-now") {
      const pending = s.hints.filter((h) => !h.delivered);
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

// Called when the other demo phone changes something (e.g. Riya sends a nudge)
export function onDemoChange(fn) {
  window.addEventListener("storage", (e) => { if (e.key === SHARED) fn(); });
}
