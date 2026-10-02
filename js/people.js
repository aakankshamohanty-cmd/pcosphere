// PCOSphere "support for two": sign-in, inviting up to 2 trusted people, consent on both sides,
// sending subtle hints, and the supporter's side of the app.
// Hints never say she asked. Her check-ins and chats are never shared.

import { FACTS } from "./content.js";
import { store } from "./store.js";
import { loadFirebase, currentUser, signIn, signOutUser, api, redirectPending } from "./account.js";
import { notificationStatus, enableNotifications, sendTestNotification, installSteps, canPromptInstall, promptInstall, isStandalone, registerServiceWorker } from "./notify.js";

let ctx;           // helpers from app.js: { ui, go, render, rerenderInPlace, topbar, esc, ICON, toast, profile, helpedIdeas }
let templates = null;
let poll = null;
let syncTimer = null;

const RELATIONS = ["partner", "best friend", "friend", "mum", "dad", "sibling", "cousin", "someone close"];
const SHOW_UP = [
  ["Ask, then listen.", "\"How are you, really?\" and let her lead. You don't have to fix anything."],
  ["Make offers specific.", "\"Can I bring dinner tonight?\" is easier to say yes to than \"let me know if you need anything\"."],
  ["Leave food and body comments out.", "No remarks on what or how much she eats, or on her weight. Just be good company."],
  ["Symptom days can be rough.", "A hot water bottle, a quiet evening or taking a chore off her plate can help a lot."],
  ["Mood can be part of PCOS.", "Low or anxious days aren't overreacting. Being steady and kind matters more than advice."],
  ["Celebrate small things.", "Notice her effort without turning wellness into a scorecard."],
];

const state = {
  user: null,          // { uid, email, name }
  links: { mine: [], supporting: [], invites: [] },
  loaded: false,
  inviteCode: null,    // invite being accepted on this phone
  inviteInfo: null,
  newInvite: null,     // { code, personName } just created
  inbox: [],
  nudge: { linkIds: [], kind: null, index: 0, mode: "later" },
  lastSent: null,
  busy: false,
  error: "",
};

// ---------- Setup ----------
export function setup(helpers) {
  ctx = helpers;
  store.onSave(scheduleSync);
}

export async function boot() {
  registerServiceWorker();
  // Tapping a notification while the app is open: refresh the ideas
  navigator.serviceWorker?.addEventListener("message", (e) => { if (e.data?.type === "hint-opened") refreshInbox(); });
  // An invite link looks like pcosphere.vercel.app/?invite=ABC123
  const params = new URLSearchParams(location.search);
  const code = params.get("invite");
  if (code) {
    history.replaceState(null, "", location.pathname);
    state.inviteCode = code.toUpperCase();
    ctx.go("accept");
    api("/api/link", { action: "invite-info", code: state.inviteCode }).then((r) => {
      state.inviteInfo = r.ok ? r.data : { valid: false };
      if (ctx.ui.screen === "accept") ctx.render();
    });
  }
  if (store.data.account.signedIn || code || redirectPending()) {
    await loadFirebase();
    const u = await currentUser();
    if (u) await afterSignIn(u, { quiet: true });
    else if (store.data.account.signedIn) { store.data.account.signedIn = false; store.save(); }
    ctx.render();
  }
}

function templatesReady() {
  if (!templates) {
    fetch("/js/hint-templates.json").then((r) => r.json()).then((j) => { templates = j.kinds; ctx.render(); }).catch(() => {});
  }
  return !!templates;
}

// ---------- Account ----------
async function doSignIn() {
  state.busy = true; state.error = ""; ctx.render();
  try {
    const u = await signIn();
    if (u) await afterSignIn(u);
  } catch (e) {
    state.error = "Sign-in didn't work. Please try again.";
  }
  state.busy = false;
  ctx.render();
}

async function afterSignIn(u, { quiet = false } = {}) {
  state.user = { uid: u.uid, email: u.email, name: u.displayName || "" };
  store.data.account.signedIn = true;
  store.data.account.email = u.email;
  store.save();
  await restoreOrSaveProfile();
  await refreshLinks();
  if (!quiet) ctx.toast("Signed in. Your setup is safe now.");
}

async function restoreOrSaveProfile() {
  const r = await api("/api/profile", { action: "get" });
  const remote = r.ok ? r.data.profile : null;
  const p = store.data.profile;
  if (remote && !p.onboarded) {
    // New phone: bring back her setup and what helped
    Object.assign(p, { name: remote.name, theme: remote.theme, areas: remote.areas, role: remote.role, onboarded: true });
    const known = new Set(store.data.history.map((h) => h.title));
    for (const h of remote.helped || []) {
      if (!known.has(h.title)) store.data.history.push({ ts: Date.now(), ideaId: h.ideaId, title: h.title, category: h.category, outcome: "better" });
    }
    store.save();
    ctx.applyTheme(p.theme);
  } else {
    await pushProfile();
  }
}

function scheduleSync() {
  if (!store.data.account.signedIn || !state.user) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(pushProfile, 1500);
}

async function pushProfile() {
  const p = store.data.profile;
  if (!p.onboarded) return;
  await api("/api/profile", {
    action: "save",
    profile: { name: p.name, role: p.role, theme: p.theme, areas: p.areas, helped: ctx.helpedIdeas().map((h) => ({ ideaId: h.ideaId, title: h.title, category: h.category })) },
  });
}

async function refreshLinks() {
  if (!state.user) return;
  const r = await api("/api/link", { action: "list" });
  if (r.ok) state.links = { mine: r.data.mine || [], supporting: r.data.supporting || [], invites: r.data.invites || [] };
  state.loaded = true;
}

async function refreshInbox() {
  if (!state.user) return;
  const r = await api("/api/hint", { action: "inbox" });
  if (r.ok) {
    const before = state.inbox.map((h) => h.id).join();
    state.inbox = r.data.hints || [];
    if (before !== state.inbox.map((h) => h.id).join() && ctx.ui.screen === "supporterHome") ctx.render();
  }
}

// Load Google sign-in ahead of time whenever a sign-in button is on screen.
// Browsers (Safari especially) only allow the sign-in popup if it opens right after the tap,
// so it must not wait for a download first.
export function prewarm(root) {
  if (root.querySelector('[data-action="sign-in"], [data-action="accept"], [data-action="invite-create"], [data-action="notif-enable"]')) {
    loadFirebase().catch(() => {});
  }
}

export function isLinked() {
  return state.links.mine.length > 0;
}

// ---------- Small pieces shown on her screens ----------
export function homeCards() {
  const p = store.data.profile;
  const { esc, ICON } = ctx;
  let html = "";

  // "Did they reach out?" for recent nudges (private to her)
  const pending = store.data.nudges.filter((n) => n.outcome === null && Date.now() - n.ts < 3 * 86400000 && Date.now() - n.ts > (n.mode === "now" ? 5 : 20) * 60000);
  const n = pending[pending.length - 1];
  if (n) {
    html += `
    <div class="card asked-card" style="margin-top:12px">
      <h3>Did ${esc(n.names.join(" or "))} reach out?</h3>
      <p class="muted" style="margin:4px 0 12px;font-size:14px">Just for you. They'll never see this.</p>
      <div class="row">
        <button class="btn btn-primary" data-action="nudge-outcome" data-id="${n.ts}" data-outcome="asked">They asked 💛</button>
        <button class="btn btn-ghost" data-action="nudge-outcome" data-id="${n.ts}" data-outcome="not-yet">Not yet</button>
      </div>
    </div>`;
  }

  if (p.areas.includes("person") || isLinked() || state.links.invites.length) {
    const names = state.links.mine.map((l) => l.supporterName);
    html += `
    <button class="path" style="margin-top:12px" data-action="people">
      <span class="bubble-ico" style="background:var(--accent-soft);color:var(--accent)">${ICON.them}</span>
      <span><strong>${names.length ? `Your ${names.length > 1 ? "people" : "person"}: ${esc(names.join(" & "))}` : "Your person"}</strong>
      <span class="sub">${names.length ? "Send a gentle nudge, or manage who's linked" : state.links.invites.length ? "Invite sent. Waiting for them to accept" : "Invite someone close to show up for you"}</span></span>
      <span class="chev">${ICON.chev}</span>
    </button>`;
  }

  // Gentle nudge to protect her setup, after she's used the app a little
  if (!store.data.account.signedIn && !store.data.account.dismissedSigninNudge && store.data.checkins.length >= 1) {
    html += `
    <div class="card" style="margin-top:12px">
      <h3>Keep your setup safe</h3>
      <p class="muted" style="margin:4px 0 12px;font-size:14px">Sign in with Google so your name, theme and what helps come back if you change phones. Check-ins and chats still stay on this phone.</p>
      <div class="row">
        <button class="btn btn-primary" data-action="sign-in">Sign in</button>
        <button class="btn btn-ghost" data-action="dismiss-signin">Not now</button>
      </div>
    </div>`;
  }
  return html;
}

export function suggestionCard() {
  if (!isLinked()) return "";
  const names = state.links.mine.map((l) => l.supporterName);
  return `
  <div class="card nudge-offer" style="margin-top:16px">
    <h3>Would it help if ${ctx.esc(names.join(" or "))} reached out?</h3>
    <p class="muted" style="margin:4px 0 12px;font-size:14px">You choose what they hear. It'll never say you asked.</p>
    <button class="btn btn-soft" data-action="nudge-start">Choose a gentle nudge</button>
  </div>`;
}

export function settingsSection() {
  const { esc, ICON } = ctx;
  const acc = store.data.account;
  return `
  <div class="settings-group">
    <h3>Account</h3>
    ${acc.signedIn
      ? `<p class="muted" style="font-size:14px;margin-bottom:10px">Signed in as ${esc(acc.email || "")}. Your setup is backed up.</p>
         <button class="list-btn" data-action="sign-out">Sign out <span class="chev">${ICON.chev}</span></button>`
      : `<p class="muted" style="font-size:14px;margin-bottom:10px">Sign in to keep your setup if you change phones, and to link your person.</p>
         <button class="list-btn" data-action="sign-in">Sign in with Google <span class="chev">${ICON.chev}</span></button>`}
    ${store.data.profile.role !== "supporter" ? `<button class="list-btn" data-action="people">Your people <span class="chev">${ICON.chev}</span></button>` : ""}
  </div>
  ${InstallSection()}`;
}

// ---------- Notifications & install ----------
function NotifyCard({ compact = false } = {}) {
  const status = notificationStatus();
  if (status === "on") {
    return compact ? `
      <p class="muted" style="font-size:14px;margin-bottom:10px">Notifications are on for this phone.</p>
      <button class="list-btn" data-action="notif-test">Send me a test notification <span class="chev">${ctx.ICON.chev}</span></button>` : "";
  }
  if (status === "needs-install") {
    return `
    <div class="card notify-card">
      <h3>Get ideas as notifications</h3>
      <p class="muted" style="margin:4px 0 10px;font-size:14px">On iPhone, notifications work once PCOSphere is on your Home Screen (iOS 16.4 or newer):</p>
      <ol class="steps-list">${installSteps().map((x) => `<li>${x}</li>`).join("")}</ol>
    </div>`;
  }
  if (status === "denied") {
    return `
    <div class="card notify-card">
      <h3>Notifications are blocked</h3>
      <p class="muted" style="margin-top:4px;font-size:14px">To get gentle ideas as notifications, allow them for PCOSphere in your phone's settings. You'll still see ideas here whenever you open the app.</p>
    </div>`;
  }
  if (status === "unsupported") {
    return compact ? `<p class="muted" style="font-size:14px">This browser can't show notifications. Ideas still appear here whenever you open the app.</p>` : "";
  }
  return `
  <div class="card notify-card">
    <h3>Turn on notifications</h3>
    <p class="muted" style="margin:4px 0 12px;font-size:14px">So ideas reach you even when the app is closed. Your lock screen will only say "A little idea for today 💛".</p>
    <button class="btn btn-primary" data-action="notif-enable" ${state.busy ? "disabled" : ""}>${state.busy ? "Turning on…" : "Turn on notifications"}</button>
  </div>`;
}

export function InstallSection() {
  if (isStandalone()) return "";
  return `
  <div class="settings-group">
    <h3>Add PCOSphere to your Home Screen</h3>
    <p class="muted" style="font-size:14px;margin-bottom:10px">It opens full-screen like an app, no store needed.</p>
    ${canPromptInstall() ? `<button class="btn btn-soft" data-action="install-app">Install PCOSphere</button>`
      : `<ol class="steps-list">${installSteps().map((x) => `<li>${x}</li>`).join("")}</ol>`}
  </div>`;
}

// ---------- Screens ----------
function SignInGate(title, text) {
  return `
  <div class="card" style="margin-top:8px">
    <h3>${title}</h3>
    <p class="muted" style="margin:6px 0 14px;font-size:14px">${text}</p>
    ${state.error ? `<p class="error">${ctx.esc(state.error)}</p>` : ""}
    <button class="btn btn-primary" data-action="sign-in" ${state.busy ? "disabled" : ""}>${state.busy ? "Signing in…" : "Sign in with Google"}</button>
  </div>`;
}

function People() {
  const { esc, topbar } = ctx;
  const total = state.links.mine.length + state.links.invites.length;
  return `
  ${topbar({ back: "home" })}
  <section class="screen">
    <h1 style="margin:4px 0 8px">Your people</h1>
    <p class="muted" style="margin-bottom:18px">Up to 2 people who agree to be part of your journey. They get gentle ideas for showing up for you, and never see your check-ins or chats.</p>
    ${!state.user ? SignInGate("Sign in to link your person", "Linking needs a Google sign-in on both phones, so hints reach the right person and either of you can unlink anytime.") : `
      ${!state.loaded ? `<p class="muted">Loading…</p>` : ""}
      ${state.links.mine.map((l) => `
        <div class="card person">
          <div><strong>${esc(l.supporterName)}</strong><span class="muted"> · your ${esc(l.relation)}</span></div>
          <button class="btn-link" data-action="unlink" data-id="${esc(l.id)}">Unlink</button>
        </div>`).join("")}
      ${state.links.invites.map((i) => `
        <div class="card person">
          <div><strong>${esc(i.personName || "Invite")}</strong><span class="muted"> · waiting to accept</span></div>
          <div class="row" style="flex:0 0 auto;gap:4px">
            <button class="btn-link" data-action="invite-share" data-id="${esc(i.code)}">Share again</button>
            <button class="btn-link" data-action="invite-cancel" data-id="${esc(i.code)}">Cancel</button>
          </div>
        </div>`).join("")}
      <div class="stack" style="margin-top:16px">
        ${isLinked() ? `<button class="btn btn-primary" data-action="nudge-start">Send a gentle nudge</button>` : ""}
        ${total < 2 ? `<button class="btn ${isLinked() ? "btn-ghost" : "btn-primary"}" data-action="invite-new">Invite ${total ? "another person" : "my person"}</button>` : `<p class="muted" style="font-size:14px;text-align:center">You've linked 2 people, the most for now.</p>`}
      </div>`}
  </section>`;
}

function Invite() {
  const { esc, topbar } = ctx;
  const ui = ctx.ui;
  ui.invite = ui.invite || { personName: "", relation: "partner" };
  if (state.newInvite) {
    const url = `${location.origin}/?invite=${state.newInvite.code}`;
    return `
    ${topbar({ back: "people" })}
    <section class="screen">
      <p class="eyebrow">Invite ready</p>
      <h1>Send this to ${esc(state.newInvite.personName || "your person")}</h1>
      <p class="muted" style="margin:8px 0 18px">When they open it, they'll see how it works and agree before anything is linked. The link works for 7 days.</p>
      <div class="card invite-link"><code>${esc(url)}</code></div>
      <div class="stack" style="margin-top:14px">
        <button class="btn btn-primary" data-action="invite-share" data-id="${esc(state.newInvite.code)}">Share invite</button>
        <a class="btn btn-ghost" href="https://wa.me/?text=${encodeURIComponent(inviteMessage(url))}" target="_blank" rel="noopener">Send on WhatsApp</a>
        <button class="btn btn-ghost" data-action="invite-copy" data-id="${esc(state.newInvite.code)}">Copy link</button>
      </div>
    </section>`;
  }
  return `
  ${topbar({ back: "people" })}
  <section class="screen">
    <h1 style="margin:4px 0 8px">Invite your person</h1>
    <p class="muted" style="margin-bottom:6px">Someone close who'd like to show up for you: a partner, friend, family member.</p>
    ${!state.user ? SignInGate("First, sign in", "So the invite comes from you, and you can unlink anytime.") : `
      <div class="field">
        <label for="person-name">Their first name</label>
        <input class="input" id="person-name" maxlength="30" placeholder="e.g. Arjun" value="${esc(ui.invite.personName)}" />
      </div>
      <div class="section">
        <div class="section-head"><h3 id="q-rel">They're your…</h3></div>
        <div class="chips" role="group" aria-labelledby="q-rel">
          ${RELATIONS.map((r) => `<button class="chip" data-action="invite-rel" data-id="${r}" aria-pressed="${ui.invite.relation === r}">${r}</button>`).join("")}
        </div>
      </div>
      <div class="card consent">
        <h3>How this works</h3>
        <ul>
          <li>They'll know PCOSphere's hints are inspired by what you choose to share.</li>
          <li>They'll <strong>never</strong> see your check-ins or chats.</li>
          <li>Hints never say you asked, so they're simply a nudge to reach out.</li>
          <li>Nothing is sent unless you choose to send it. Either of you can unlink anytime.</li>
        </ul>
      </div>
      ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
      <button class="btn btn-primary" style="margin-top:16px" data-action="invite-create" ${state.busy ? "disabled" : ""}>${state.busy ? "Creating…" : "I agree, create invite link"}</button>`}
  </section>`;
}

function inviteMessage(url) {
  const name = store.data.profile.name;
  return `${name ? `It's ${name}! ` : ""}I'd love you to be my person on PCOSphere. Now and then it'll send you a gentle idea for showing up for me. Open this to see how it works: ${url}`;
}

function Nudge() {
  const { esc, topbar } = ctx;
  if (!templatesReady()) return `${topbar({ back: "home" })}<section class="screen"><p class="muted">Loading…</p></section>`;
  const n = state.nudge;
  const people = state.links.mine;
  const names = people.filter((l) => n.linkIds.includes(l.id)).map((l) => l.supporterName);
  const preview = n.kind ? templates[n.kind].lines[n.index].replace(/\{name\}/g, store.data.profile.name || "you") : "";
  const modes = [
    ["now", "I'd like support now", "Sent straight away"],
    ["later", "A gentle nudge later", "Arrives in 20–60 minutes, so it feels natural"],
    ["private", "Keep this private", "Nothing is sent"],
  ];
  return `
  ${topbar({ back: "home" })}
  <section class="screen">
    <h1 style="margin:4px 0 18px">A gentle nudge</h1>
    ${people.length > 1 ? `
    <div class="section">
      <div class="section-head"><h3 id="q-who">Who?</h3></div>
      <div class="chips" role="group" aria-labelledby="q-who">
        ${people.map((l) => `<button class="chip" data-action="nudge-who" data-id="${esc(l.id)}" aria-pressed="${n.linkIds.includes(l.id)}">${esc(l.supporterName)}</button>`).join("")}
      </div>
    </div>` : ""}
    <div class="section">
      <div class="section-head"><h3 id="q-what">What would help?</h3></div>
      <div class="chips" role="group" aria-labelledby="q-what">
        ${Object.entries(templates).map(([k, t]) => `<button class="chip" data-action="nudge-kind" data-id="${k}" aria-pressed="${n.kind === k}">${t.label}</button>`).join("")}
      </div>
    </div>
    ${n.kind ? `
    <div class="card preview">
      <p class="eyebrow">${esc(names.join(" & ") || "They")} will see</p>
      <p class="preview-text">“${esc(preview)}”</p>
      <button class="btn-link" style="padding:0;min-height:32px" data-action="nudge-shuffle">Try different wording</button>
    </div>` : ""}
    <div class="section" style="margin-top:20px">
      <div class="section-head"><h3 id="q-when">How?</h3></div>
      <div class="feel-opts" style="margin:0" role="radiogroup" aria-labelledby="q-when">
        ${modes.map(([id, title, sub]) => `
          <button class="feel-opt" role="radio" aria-checked="${n.mode === id}" data-action="nudge-mode" data-id="${id}">
            <span class="radio"></span><span><strong>${title}</strong><span class="sub">${sub}</span></span>
          </button>`).join("")}
      </div>
    </div>
    ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
    <div class="sticky-cta">
      <button class="btn btn-primary" data-action="nudge-send" ${(n.mode !== "private" && (!n.kind || !n.linkIds.length)) || state.busy ? "disabled" : ""}>
        ${n.mode === "private" ? "Keep it private" : state.busy ? "Sending…" : n.mode === "now" ? "Send now" : "Send a little later"}
      </button>
      <p class="muted" style="font-size:12px;text-align:center;margin-top:8px">Nudges are for gentle gestures. For anything urgent, call or message them directly.</p>
    </div>
  </section>`;
}

function NudgeSent() {
  const { esc, topbar } = ctx;
  const s = state.lastSent;
  return `
  ${topbar()}
  <section class="screen">
    <p class="reply">Done. ${esc(s.names.join(" & "))} will get a gentle idea ${s.mode === "now" ? "now" : "in a little while"}. It won't say you asked.</p>
    <div class="stack">
      <button class="btn btn-primary" data-action="home">Back to home</button>
      ${s.mode === "later" ? `<button class="btn-link" data-action="nudge-deliver-now">Testing? Deliver it now</button>` : ""}
    </div>
  </section>`;
}

function Accept() {
  const { esc, topbar } = ctx;
  const info = state.inviteInfo;
  if (!info) return `${topbar()}<section class="screen thinking"><div class="orb"></div><p class="muted">Opening invite…</p></section>`;
  if (!info.valid && !state.accepted) {
    return `
    ${topbar()}
    <section class="screen">
      <h1 style="margin:16px 0 10px">This invite link doesn't work anymore</h1>
      <p class="muted">It may have expired or already been used. Ask her to send a new one from her PCOSphere.</p>
      <button class="btn btn-ghost" style="margin-top:20px" data-action="to-welcome">Go to PCOSphere</button>
    </section>`;
  }
  const name = esc(info.ownerName);
  return `
  ${topbar()}
  <section class="screen">
    <p class="eyebrow">An invite for you</p>
    <h1>${name} would like you to be her person.</h1>
    <p class="muted" style="margin:10px 0 18px">PCOSphere is a gentle everyday companion for people with PCOS. ${name} chose you as someone close.</p>
    <div class="card consent">
      <h3>What this means</h3>
      <ul>
        <li>Now and then, you'll get a gentle idea for showing up for ${name}, like asking how she's really doing, or planning a quiet evening.</li>
        <li>Ideas are inspired by what ${name} chooses to share, but they won't say when she asked. Take them as a nudge to reach out.</li>
        <li>You won't see her check-ins or chats.</li>
        <li>Either of you can unlink anytime.</li>
      </ul>
    </div>
    <div class="field">
      <label for="supporter-name">Your first name</label>
      <input class="input" id="supporter-name" maxlength="30" value="${esc(info.personName || "")}" placeholder="Your name" />
    </div>
    ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
    <button class="btn btn-primary" data-action="accept" ${state.busy ? "disabled" : ""}>${state.busy ? "One moment…" : state.user ? "I agree" : "I agree, sign in with Google"}</button>
    <p class="muted" style="font-size:12px;text-align:center;margin-top:10px">Signing in makes sure the ideas reach you, and only you.</p>
  </section>`;
}

function SupporterHome() {
  const { esc, topbar, ICON } = ctx;
  if (!poll && state.user) { refreshInbox(); poll = setInterval(refreshInbox, 20000); }
  const linked = state.links.supporting;
  if (!state.user || !linked.length) {
    return `
    ${topbar({ back: "to-welcome" })}
    <section class="screen">
      <div class="hero">
        <p class="eyebrow">Supporting someone</p>
        <h1>That's a lovely thing to do.</h1>
        <p>When she invites you from her PCOSphere, open her invite link on this phone. You'll both agree on how it works, then you'll get gentle ideas for showing up for her.</p>
      </div>
      ${!state.user ? SignInGate("Already linked?", "Sign in with the same Google account to see your ideas on this phone.") : `<div class="card"><h3>Waiting for an invite</h3><p class="muted" style="margin-top:6px">Ask her to tap <strong>Invite my person</strong> in her app and send you the link.</p></div>`}
    </section>`;
  }
  const names = [...new Set(linked.map((l) => l.ownerName))];
  const latest = state.inbox[0];
  const older = state.inbox.slice(1, 6);
  const facts = FACTS.filter((f) => ["not-alone", "not-cysts", "mood", "no-shame"].includes(f.id));
  const when = (t) => {
    const mins = Math.round((Date.now() - t) / 60000);
    return mins < 1 ? "just now" : mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.round(mins / 60)} h ago` : new Date(t).toLocaleDateString();
  };
  return `
  ${topbar({ settings: true })}
  <section class="screen">
    <div class="greet">
      <p class="eyebrow">You're ${esc(names.join(" & "))}'s person 💛</p>
      <h1>Ways to show up today</h1>
    </div>
    ${NotifyCard()}
    ${latest ? `
      <div class="hint-card ${latest.seen ? "" : "fresh"}">
        <p class="eyebrow">A little idea · ${when(latest.deliveredAt)}</p>
        <p class="hint-text">${esc(latest.text)}</p>
        ${latest.seen ? `<p class="muted" style="font-size:14px">Noted 💛</p>` : `<button class="btn btn-primary" data-action="hint-seen" data-id="${esc(latest.id)}">Got it 💛</button>`}
      </div>` : `
      <div class="card">
        <h3>No ideas right now</h3>
        <p class="muted" style="margin-top:6px;font-size:14px">When there's a gentle idea for showing up, it'll appear here. You don't need to wait for one, though.</p>
      </div>`}
    ${older.length ? `
      <div class="section-title"><h3>Earlier ideas</h3></div>
      <div class="card"><ul class="helped-list">${older.map((h) => `<li><span class="muted" style="flex:none;font-size:12px;width:64px">${when(h.deliveredAt)}</span>${esc(h.text)}</li>`).join("")}</ul></div>` : ""}
    <div class="section-title"><h3>Good to know</h3></div>
    <div class="card"><ul class="tips">${SHOW_UP.map(([t, d]) => `<li><strong>${t}</strong> ${d}</li>`).join("")}</ul></div>
    <div class="section-title"><h3>A little about PCOS</h3></div>
    ${facts.map((f) => `<div class="card fact"><p class="fact-text">${esc(f.text)}</p><p class="src">Source: <a href="${f.url}" target="_blank" rel="noopener">${esc(f.source)}</a></p></div>`).join("")}
  </section>`;
}

function SupporterSettings() {
  const { esc, topbar, ICON } = ctx;
  return `
  ${topbar({ back: "supporterHome" })}
  <section class="screen">
    <h1 style="margin:4px 0 22px">Settings</h1>
    <div class="settings-group">
      <h3>You're linked with</h3>
      ${state.links.supporting.map((l) => `
        <div class="card person"><div><strong>${esc(l.ownerName)}</strong></div><button class="btn-link" data-action="unlink" data-id="${esc(l.id)}">Unlink</button></div>`).join("") || `<p class="muted">No one yet.</p>`}
    </div>
    <div class="settings-group">
      <h3>Notifications</h3>
      ${NotifyCard({ compact: true }) || `<p class="muted" style="font-size:14px">Not on yet. Turn them on from your home screen.</p>`}
    </div>
    ${InstallSection()}
    <div class="settings-group">
      <h3>Theme</h3>
      ${ctx.themePicker()}
    </div>
    <div class="settings-group">
      <h3>Account</h3>
      <p class="muted" style="font-size:14px;margin-bottom:10px">Signed in as ${esc(store.data.account.email || "")}</p>
      <button class="list-btn" data-action="sign-out">Sign out <span class="chev">${ICON.chev}</span></button>
    </div>
  </section>`;
}

export const screens = { people: People, invite: Invite, nudge: Nudge, nudgeSent: NudgeSent, accept: Accept, supporterHome: SupporterHome, supporterSettings: SupporterSettings };

// ---------- Actions ----------
export const ACTIONS = new Set([
  "sign-in", "sign-out", "dismiss-signin", "people", "invite-new", "invite-rel", "invite-create", "invite-share", "invite-copy",
  "invite-cancel", "unlink", "nudge-start", "nudge-who", "nudge-kind", "nudge-shuffle", "nudge-mode", "nudge-send",
  "nudge-deliver-now", "nudge-outcome", "accept", "hint-seen", "supporter-settings", "notif-enable", "notif-test", "install-app",
]);
export async function handle(action, el) {
  const { ui, go, render, toast } = ctx;
  const id = el.dataset.id;
  switch (action) {
    case "sign-in": await doSignIn(); if (ui.screen === "welcome" && state.user) go(store.data.profile.onboarded ? homeFor() : "welcome"); return true;
    case "sign-out":
      await signOutUser();
      state.user = null;
      state.links = { mine: [], supporting: [], invites: [] };
      clearInterval(poll); poll = null;
      store.data.account = { signedIn: false, dismissedSigninNudge: true };
      store.save();
      toast("Signed out");
      go(store.data.profile.role === "supporter" ? "supporterHome" : "settings");
      return true;
    case "dismiss-signin": store.data.account.dismissedSigninNudge = true; store.save(); render(); return true;
    case "people": state.error = ""; go("people"); refreshLinks().then(() => ui.screen === "people" && render()); return true;
    case "invite-new": state.newInvite = null; state.error = ""; ui.invite = { personName: "", relation: "partner" }; go("invite"); return true;
    case "invite-rel": ui.invite.personName = document.getElementById("person-name")?.value || ""; ui.invite.relation = id; ctx.rerenderInPlace(el); return true;
    case "invite-create": {
      ui.invite.personName = document.getElementById("person-name")?.value.trim() || "";
      state.busy = true; state.error = ""; render();
      const r = await api("/api/link", { action: "create-invite", personName: ui.invite.personName, relation: ui.invite.relation, ownerName: store.data.profile.name });
      state.busy = false;
      if (r.ok) { state.newInvite = { code: r.data.code, personName: ui.invite.personName }; await refreshLinks(); }
      else state.error = r.data.error || "Couldn't create the invite. Please try again.";
      render();
      return true;
    }
    case "invite-share": {
      const url = `${location.origin}/?invite=${id}`;
      if (navigator.share) { try { await navigator.share({ title: "PCOSphere", text: inviteMessage(url) }); } catch {} }
      else { await copy(url); toast("Link copied"); }
      return true;
    }
    case "invite-copy": await copy(`${location.origin}/?invite=${id}`); toast("Link copied"); return true;
    case "invite-cancel":
      if (confirm("Cancel this invite? The link will stop working.")) {
        await api("/api/link", { action: "cancel-invite", code: id });
        await refreshLinks(); render();
      }
      return true;
    case "unlink": {
      const l = [...state.links.mine, ...state.links.supporting].find((x) => x.id === id);
      const who = l ? (l.ownerUid === state.user?.uid ? l.supporterName : l.ownerName) : "them";
      if (!confirm(`Unlink ${who}? No more hints will be shared between you.`)) return true;
      const r = await api("/api/link", { action: "unlink", linkId: id });
      if (r.ok) { await refreshLinks(); toast("Unlinked"); render(); } else toast(r.data.error || "Couldn't unlink");
      return true;
    }
    case "nudge-start": {
      state.error = "";
      const lastAsked = [...store.data.nudges].reverse().find((n) => n.outcome === "asked");
      state.nudge = { linkIds: state.links.mine.slice(0, 1).map((l) => l.id), kind: lastAsked?.kind || null, index: 0, mode: "later" };
      if (state.nudge.kind) state.nudge.index = Math.floor(Math.random() * 3);
      go("nudge");
      return true;
    }
    case "nudge-who": {
      const ids = state.nudge.linkIds;
      state.nudge.linkIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      ctx.rerenderInPlace(el);
      return true;
    }
    case "nudge-kind": state.nudge.kind = id; state.nudge.index = Math.floor(Math.random() * templates[id].lines.length); ctx.rerenderInPlace(el); return true;
    case "nudge-shuffle": state.nudge.index = (state.nudge.index + 1) % templates[state.nudge.kind].lines.length; ctx.rerenderInPlace(el); return true;
    case "nudge-mode": state.nudge.mode = id; ctx.rerenderInPlace(el); return true;
    case "nudge-send": {
      const n = state.nudge;
      if (n.mode === "private") { toast("Kept private 💛"); go("home"); return true; }
      state.busy = true; state.error = ""; render();
      const r = await api("/api/hint", { action: "send", linkIds: n.linkIds, kind: n.kind, index: n.index, mode: n.mode });
      state.busy = false;
      if (!r.ok) { state.error = r.data.error || "Couldn't send. Please try again."; render(); return true; }
      const names = r.data.sent.map((s) => s.supporterName);
      store.data.nudges.push({ ts: Date.now(), names, kind: n.kind, mode: n.mode, outcome: null });
      store.data.nudges = store.data.nudges.slice(-50);
      store.save();
      state.lastSent = { names, mode: n.mode };
      go("nudgeSent");
      return true;
    }
    case "nudge-deliver-now": {
      const r = await api("/api/hint", { action: "deliver-now" });
      toast(r.ok ? "Delivered" : "Couldn't deliver right now");
      return true;
    }
    case "nudge-outcome": {
      const n = store.data.nudges.find((x) => String(x.ts) === id);
      if (n) { n.outcome = el.dataset.outcome; store.save(); }
      toast(el.dataset.outcome === "asked" ? "Love that. I'll remember what works for you two." : "That's okay. Some days are busy. You can always reach out to them too.");
      render();
      return true;
    }
    case "accept": {
      const supporterName = document.getElementById("supporter-name")?.value.trim() || "";
      state.error = "";
      if (!state.user) { await doSignIn(); if (!state.user) return true; }
      state.busy = true; render();
      const r = await api("/api/link", { action: "accept-invite", code: state.inviteCode, supporterName });
      state.busy = false;
      if (!r.ok) { state.error = r.data.error || "Couldn't accept. Please try again."; render(); return true; }
      state.accepted = true;
      store.setProfile({ role: "supporter", onboarded: true, name: supporterName || store.data.profile.name });
      await refreshLinks();
      toast(`You're now ${r.data.ownerName}'s person 💛`);
      go("supporterHome");
      return true;
    }
    case "hint-seen": {
      const h = state.inbox.find((x) => x.id === id);
      if (h) h.seen = true;
      render();
      api("/api/hint", { action: "seen", hintId: id });
      return true;
    }
    case "supporter-settings": go("supporterSettings"); return true;
    case "notif-enable": {
      if (!state.user) { toast("Please sign in first"); return true; }
      state.busy = true; render();
      const r = await enableNotifications();
      state.busy = false;
      if (r.ok) {
        const sent = await sendTestNotification();
        toast(sent ? "Notifications on. We sent you a test 💛" : "Notifications on");
      } else {
        toast(r.reason === "denied" ? "Notifications were blocked" : "Couldn't turn on notifications. Try again in a moment.");
      }
      render();
      return true;
    }
    case "notif-test": toast((await sendTestNotification()) ? "Test sent. Check your notifications" : "Couldn't send a test right now"); return true;
    case "install-app": await promptInstall(); render(); return true;
  }
  return false;
}

function homeFor() {
  return store.data.profile.role === "supporter" ? "supporterHome" : "home";
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); } catch {
    const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch {} t.remove();
  }
}
