// PCOSphere: quick check-in -> one realistic next step -> kind follow-up.
import { AREAS, THEMES, FEELINGS, TIMES, PLACES, CATEGORIES, FACTS, needsCare, pickIdeas, reflectionFor, FOLLOWUPS, IDEAS } from "./content.js";
import { store } from "./store.js";

// ---------- Icons ----------
const ICON = {
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/></svg>',
  them: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6M18 14.2c1.8.8 3 2.6 3 4.8"/></svg>',
};
const brandMark = '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="var(--accent)"/><circle cx="16" cy="16" r="7" fill="none" stroke="var(--accent-ink)" stroke-width="2.6"/><circle cx="22.5" cy="9.5" r="2.6" fill="var(--accent-ink)"/></svg>';

// ---------- State for the current session ----------
const ui = {
  screen: store.data.profile.onboarded ? (store.data.profile.role === "supporter" ? "supporter" : "home") : "welcome",
  setupStep: 1,
  checkin: freshCheckin(),
  options: [],
  optionIndex: 0,
  reflection: "",
  firstReflection: "",
  care: false,
  outcome: null,
  reply: "",
  factIndex: Math.floor(Date.now() / 86400000), // a different fact each day
};
let timer = null;

function freshCheckin() {
  return { feelings: [], time: 10, place: "home", note: "" };
}

// ---------- Helpers ----------
const $app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const profile = () => store.data.profile;
const feelingLabel = (id) => FEELINGS.find((f) => f.id === id)?.label || id;
const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();

function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  document.documentElement.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.meta);
}

function greeting() {
  const h = new Date().getHours();
  const part = h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
  return profile().name ? `${part}, ${esc(profile().name)}` : part;
}

function helpedIdeas() {
  const seen = new Map();
  for (const h of [...store.data.history].reverse()) {
    if (h.outcome === "better" && !seen.has(h.title)) seen.set(h.title, h);
  }
  return [...seen.values()].slice(0, 4);
}

function factsForMe() {
  const areas = new Set(profile().areas);
  const mine = FACTS.filter((f) => f.areas.includes("all") || f.areas.some((a) => areas.has(a)));
  return mine.length ? mine : FACTS;
}

function toast(msg) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function go(screen) {
  clearInterval(timer);
  ui.screen = screen;
  render();
  window.scrollTo(0, 0);
  const h = $app.querySelector("h1, h2");
  if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
}

function topbar({ back = null, settings = false } = {}) {
  return `
  <header class="topbar">
    ${back ? `<button class="icon-btn" data-action="${back}" aria-label="Back">${ICON.back}</button>` : `<span class="brand">${brandMark}<span class="brand-name">PCOSphere</span></span>`}
    ${settings ? `<button class="icon-btn" data-action="settings" aria-label="Settings">${ICON.gear}</button>` : "<span></span>"}
  </header>`;
}

// ---------- Screens ----------
function Welcome() {
  return `
  ${topbar()}
  <section class="screen">
    <div class="hero">
      <p class="eyebrow">For everyday life with PCOS</p>
      <h1>Tell me how today's going. I'll help you pick <em>one</em> small next step.</h1>
      <p>No logging marathons, no streaks to break. A couple of taps, one realistic idea, and a kind check-in after.</p>
    </div>
    <div class="paths">
      <button class="path" data-action="path-me">
        <span class="bubble-ico" style="background:var(--accent-soft);color:var(--accent)">${ICON.me}</span>
        <span><strong>I'm here for me</strong><span class="sub">I have PCOS and want everyday support</span></span>
        <span class="chev">${ICON.chev}</span>
      </button>
      <button class="path" data-action="path-them">
        <span class="bubble-ico" style="background:var(--calm);color:var(--calm-ink)">${ICON.them}</span>
        <span><strong>I'm supporting someone</strong><span class="sub">Someone close invited me to be there for them</span></span>
        <span class="chev">${ICON.chev}</span>
      </button>
    </div>
  </section>`;
}

function Supporter() {
  return `
  ${topbar({ back: "to-welcome" })}
  <section class="screen">
    <div class="hero">
      <p class="eyebrow">Supporting someone</p>
      <h1>That's a lovely thing to do.</h1>
      <p>When she invites you from her PCOSphere, open her invite link on this phone. You'll agree together on how it works, and then you'll get gentle ideas for showing up for her.</p>
    </div>
    <div class="card" style="margin-top:22px">
      <h3>Waiting for an invite</h3>
      <p class="muted" style="margin-top:6px">Ask her to tap <strong>Invite my person</strong> in her app and send you the link.</p>
    </div>
  </section>`;
}

function Setup() {
  const p = profile();
  const step = ui.setupStep;
  const steps = `<div class="steps" aria-label="Step ${step} of 3"><i class="on"></i><i class="${step >= 2 ? "on" : ""}"></i><i class="${step >= 3 ? "on" : ""}"></i></div>`;
  if (step === 1) {
    return `
    ${topbar({ back: "to-welcome" })}
    <section class="screen">
      ${steps}
      <h1>Hi! What should I call you?</h1>
      <p class="muted" style="margin-top:8px">Optional. It just makes things feel a bit more personal.</p>
      <div class="field">
        <label for="name">Your first name</label>
        <input class="input" id="name" autocomplete="given-name" maxlength="30" placeholder="e.g. Riya" value="${esc(p.name)}" />
      </div>
      <button class="btn btn-primary" data-action="setup-next">Continue</button>
    </section>`;
  }
  if (step === 2) {
    return `
    ${topbar({ back: "setup-back" })}
    <section class="screen">
      ${steps}
      <h1>What would you like support with?</h1>
      <p class="muted" style="margin-top:8px">Pick any. You can change this anytime in Settings.</p>
      <div class="areas" role="group" aria-label="Support areas">
        ${AREAS.map((a) => `
          <button class="area" data-action="toggle-area" data-id="${a.id}" aria-pressed="${p.areas.includes(a.id)}">
            <span class="dot" style="background:${a.color}"></span>
            <span><strong>${a.label}</strong><span class="sub">${a.sub}</span></span>
            <span class="tick">${ICON.check}</span>
          </button>`).join("")}
      </div>
      <button class="btn btn-primary" data-action="setup-next" ${p.areas.length ? "" : "disabled"}>Continue</button>
    </section>`;
  }
  return `
  ${topbar({ back: "setup-back" })}
  <section class="screen">
    ${steps}
    <h1>Make it feel like yours.</h1>
    <p class="muted" style="margin-top:8px">Pick a look. You can switch anytime.</p>
    ${ThemePicker()}
    <p class="muted" style="font-size:14px;margin-bottom:16px">Your check-ins stay on this phone. Nothing is shared with anyone unless you choose to.</p>
    <button class="btn btn-primary" data-action="setup-done">Let's begin</button>
  </section>`;
}

function ThemePicker() {
  const current = profile().theme;
  return `
  <div class="themes" role="group" aria-label="Themes">
    ${THEMES.map((t) => `
      <button class="theme-opt" data-action="pick-theme" data-id="${t.id}" aria-pressed="${current === t.id}">
        <span class="swatch" style="background:${t.colors[0]}">${t.colors.slice(1).map((c) => `<i style="background:${c}"></i>`).join("")}</span>
        <span class="label"><strong>${t.label}</strong><span>${t.sub}</span></span>
      </button>`).join("")}
  </div>`;
}

function Home() {
  const helped = helpedIdeas();
  const todayCount = store.data.checkins.filter((c) => isToday(c.ts)).length;
  const facts = factsForMe();
  const fact = facts[ui.factIndex % facts.length];
  return `
  ${topbar({ settings: true })}
  <section class="screen">
    <div class="greet">
      <p class="eyebrow">${greeting()}${todayCount ? ` · ${todayCount} check-in${todayCount > 1 ? "s" : ""} today` : ""}</p>
      <h1>How's today going?</h1>
    </div>

    <button class="checkin-card" data-action="start-checkin">
      <h2>Quick check-in</h2>
      <p>A couple of taps, then one small next step that fits your moment.</p>
      <span class="go">Start ${ICON.chev}</span>
    </button>

    ${helped.length ? `
    <div class="section-title"><h3>Things that have helped you</h3></div>
    <div class="card">
      <ul class="helped-list">
        ${helped.map((h) => `<li><span class="pill cat-${h.category}">${CATEGORIES[h.category]?.label || ""}</span>${esc(h.title)}</li>`).join("")}
      </ul>
    </div>` : ""}

    <div class="section-title"><h3>Did you know?</h3><button class="btn-link" data-action="next-fact">Another</button></div>
    <div class="card fact">
      <p class="fact-text">${esc(fact.text)}</p>
      <p class="src">Source: <a href="${fact.url}" target="_blank" rel="noopener">${esc(fact.source)}</a></p>
    </div>
  </section>`;
}

function Checkin() {
  const c = ui.checkin;
  return `
  ${topbar({ back: "home" })}
  <section class="screen">
    <h1 style="margin:4px 0 20px">How's today going?</h1>

    <div class="section">
      <div class="section-head"><h3 id="q-feel">What's loudest right now?</h3><span class="hint">Pick up to 3</span></div>
      <div class="chips" role="group" aria-labelledby="q-feel">
        ${FEELINGS.map((f) => `<button class="chip" data-action="feel" data-id="${f.id}" aria-pressed="${c.feelings.includes(f.id)}">${f.label}</button>`).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h3 id="q-time">How much time do you have?</h3></div>
      <div class="seg" role="group" aria-labelledby="q-time">
        ${TIMES.map((t) => `<button data-action="time" data-id="${t.id}" aria-pressed="${c.time === t.id}">${t.label}</button>`).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h3 id="q-place">Where are you?</h3></div>
      <div class="seg" role="group" aria-labelledby="q-place">
        ${PLACES.map((p) => `<button data-action="place" data-id="${p.id}" aria-pressed="${c.place === p.id}">${p.label}</button>`).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h3><label for="note">Anything else?</label></h3><span class="hint">Optional</span></div>
      <textarea class="input" id="note" maxlength="280" placeholder="e.g. exam at 4, skipped lunch, back hurts">${esc(c.note)}</textarea>
    </div>

    <div class="sticky-cta">
      <button class="btn btn-primary" data-action="suggest" ${c.feelings.length ? "" : "disabled"}>
        ${c.feelings.length ? "Help me pick one thing" : "Tap how you're feeling"}
      </button>
    </div>
  </section>`;
}

function Thinking() {
  return `
  <section class="screen thinking">
    <div class="orb" aria-hidden="true"></div>
    <div>
      <h2>Finding something that fits…</h2>
      <p class="muted" style="margin-top:6px">${esc(ui.checkin.feelings.map(feelingLabel).join(" · "))}</p>
    </div>
  </section>`;
}

function CareNote() {
  return `
  <div class="care" role="note">
    <p><strong>Before anything else, I want to check you're okay.</strong></p>
    <p>If you're in severe pain, have fainted, or are bleeding much more than usual, please contact a doctor today, or call <a href="tel:112">112</a> in an emergency.</p>
    <p>If you're having thoughts of hurting yourself, you can talk to someone at Tele-MANAS, free and 24/7: <a href="tel:14416">14416</a>.</p>
  </div>`;
}

function Suggestion() {
  const s = ui.options[ui.optionIndex];
  return `
  ${topbar({ back: "checkin" })}
  <section class="screen">
    ${ui.care ? CareNote() : ""}
    <div class="say"><span class="who">PCOSphere</span>${esc(ui.reflection)}</div>
    <p class="eyebrow">Your one next step</p>
    <article class="idea cat-${s.category}">
      <span class="tag">${CATEGORIES[s.category].label} · about ${s.minutes} min</span>
      <h2>${esc(s.title)}</h2>
      <p class="why">${esc(s.why)}</p>
      <ol>${s.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
    </article>
    <div class="stack">
      <button class="btn btn-primary" data-action="do">Let's do it</button>
      ${ui.options.length > 1 ? `<button class="btn btn-ghost" data-action="another">Not feeling it, show me something else</button>` : ""}
    </div>
    <p class="source-note">General wellness idea, not medical advice</p>
  </section>`;
}

function Doing() {
  const s = ui.options[ui.optionIndex];
  let stage;
  if (s.kind === "breath") {
    stage = `<div class="breath" aria-hidden="true"></div>`;
  } else if (s.kind === "timer") {
    const C = 2 * Math.PI * 100;
    stage = `
      <div class="ring-wrap">
        <svg class="ring" viewBox="0 0 220 220" aria-hidden="true">
          <circle class="track" cx="110" cy="110" r="100"></circle>
          <circle class="bar" id="ringbar" cx="110" cy="110" r="100" stroke-dasharray="${C}" stroke-dashoffset="0"></circle>
        </svg>
        <div class="ring-label" id="ringlabel" role="timer">${s.minutes}:00</div>
      </div>`;
  } else {
    stage = `<div class="blob" aria-hidden="true"></div>`;
  }
  const lead = { breath: "Follow the circle. In as it grows, out as it shrinks.", timer: "I'll keep time. Stop whenever you like.", enjoy: "Take your time. No rush to come back." }[s.kind];
  return `
  ${topbar({ back: "to-suggestion" })}
  <section class="screen doing cat-${s.category}">
    <h2>${esc(s.title)}</h2>
    <p class="muted">${lead}</p>
    <div class="stage">${stage}</div>
    ${s.kind === "breath" ? `<p class="breath-cue" id="cue" aria-live="polite">Breathe in…</p>` : ""}
    <ol class="mini-steps">${s.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
    <div class="stack">
      <button class="btn btn-primary" data-action="finished">I'm done</button>
      <button class="btn btn-ghost" data-action="skip">I'll skip this one</button>
    </div>
  </section>`;
}

function FollowUp() {
  if (ui.outcome) {
    const today = store.data.history.filter((h) => isToday(h.ts));
    return `
    ${topbar()}
    <section class="screen">
      <p class="reply">${esc(ui.reply)}</p>
      <div class="stack">
        ${ui.outcome === "skipped" ? `<button class="btn btn-primary" data-action="smaller">Give me something even smaller</button>` : ""}
        <button class="btn ${ui.outcome === "skipped" ? "btn-ghost" : "btn-primary"}" data-action="home">Done for now</button>
        <button class="btn btn-ghost" data-action="start-checkin">Check in again</button>
      </div>
      ${today.length ? `
      <div class="section-title"><h3>Today with PCOSphere</h3></div>
      <div class="today">${today.map((h) => `<span class="pill cat-${h.category}">${esc(h.title)}${h.outcome === "better" ? " ✓" : ""}</span>`).join("")}</div>` : ""}
    </section>`;
  }
  return `
  ${topbar()}
  <section class="screen">
    <p class="eyebrow">A little check-in</p>
    <h1>How do you feel now?</h1>
    <div class="feel-opts">
      <button class="feel-opt" data-action="outcome" data-id="better"><span class="face" style="background:var(--move);color:var(--move-ink)">↑</span><span><strong>A bit better</strong><span class="sub">Something shifted, even slightly</span></span></button>
      <button class="feel-opt" data-action="outcome" data-id="same"><span class="face" style="background:var(--rest);color:var(--rest-ink)">→</span><span><strong>About the same</strong><span class="sub">That's useful to know too</span></span></button>
      <button class="feel-opt" data-action="outcome" data-id="skipped"><span class="face" style="background:var(--surface-2)">·</span><span><strong>Didn't get to it</strong><span class="sub">Completely okay</span></span></button>
    </div>
  </section>`;
}

function Settings() {
  const p = profile();
  return `
  ${topbar({ back: "home" })}
  <section class="screen">
    <h1 style="margin:4px 0 22px">Settings</h1>

    <div class="settings-group">
      <h3>Your name</h3>
      <div class="row" style="align-items:center">
        <input class="input" id="name" maxlength="30" placeholder="Your first name" value="${esc(p.name)}" />
        <button class="btn btn-soft" style="flex:0 0 auto;width:auto" data-action="save-name">Save</button>
      </div>
    </div>

    <div class="settings-group">
      <h3>Support areas</h3>
      <div class="areas" style="margin:0" role="group" aria-label="Support areas">
        ${AREAS.map((a) => `
          <button class="area" data-action="toggle-area" data-id="${a.id}" aria-pressed="${p.areas.includes(a.id)}">
            <span class="dot" style="background:${a.color}"></span>
            <span><strong>${a.label}</strong><span class="sub">${a.sub}</span></span>
            <span class="tick">${ICON.check}</span>
          </button>`).join("")}
      </div>
    </div>

    <div class="settings-group">
      <h3>Theme</h3>
      ${ThemePicker()}
    </div>

    <div class="settings-group">
      <h3>About & privacy</h3>
      <button class="list-btn" data-action="about">How PCOSphere works <span class="chev">${ICON.chev}</span></button>
      <button class="list-btn" data-action="reset">Clear everything on this phone <span class="chev">${ICON.chev}</span></button>
    </div>
  </section>`;
}

function About() {
  return `
  ${topbar({ back: "settings" })}
  <section class="screen prose">
    <h1 style="margin:4px 0 8px">How PCOSphere works</h1>
    <p>PCOSphere is a warm, low-pressure companion for everyday life with PCOS. You tell it how things are in a few taps, and it suggests <strong>one</strong> realistic next step that fits your time and where you are: a satisfying snack, a short stretch, a calming reset, or permission to rest. Then it asks how it went, and remembers what helps you.</p>
    <p><strong>What it won't do:</strong> diagnose, count calories, call food a "slip", treat movement as payback, or pretend your cycle phase decides what you should eat or feel.</p>
    <p><strong>Your data:</strong> your check-ins are saved only on this phone. Nothing is shared with anyone unless you choose to.</p>
    <p class="muted">General wellness ideas only. Please talk to your doctor about symptoms or treatment. In an emergency call 112. For mental health support, Tele-MANAS is free and 24/7 at 14416.</p>
  </section>`;
}

function render() {
  const screens = { welcome: Welcome, supporter: Supporter, setup: Setup, home: Home, checkin: Checkin, thinking: Thinking, suggestion: Suggestion, doing: Doing, followup: FollowUp, settings: Settings, about: About };
  $app.innerHTML = (screens[ui.screen] || Home)();
  if (ui.screen === "doing") startActivity();
}

// Re-render without jumping to the top or losing focus (used for chip taps)
function rerenderInPlace(from) {
  const y = window.scrollY;
  render();
  $app.querySelector(".screen")?.style.setProperty("animation", "none");
  window.scrollTo(0, y);
  if (from?.dataset.action) {
    const sel = `[data-action="${from.dataset.action}"]${from.dataset.id ? `[data-id="${from.dataset.id}"]` : ""}`;
    $app.querySelector(sel)?.focus({ preventScroll: true });
  }
}

// ---------- The suggestion flow ----------
function getSuggestion() {
  const c = ui.checkin;
  store.addCheckin({ feelings: c.feelings, time: c.time, place: c.place, note: c.note });
  ui.options = pickIdeas(c, profile(), store.data.history);
  ui.optionIndex = 0;
  ui.reflection = reflectionFor(c, profile().name);
  ui.firstReflection = ui.reflection;
  ui.care = needsCare(c.note);
  go("thinking");
  setTimeout(() => go("suggestion"), 800);
}

function startActivity() {
  const s = ui.options[ui.optionIndex];
  if (s.kind === "timer") {
    const total = Math.max(1, s.minutes) * 60;
    const C = 2 * Math.PI * 100;
    const bar = document.getElementById("ringbar");
    const label = document.getElementById("ringlabel");
    let left = total;
    timer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        label.textContent = "Done";
        bar.style.strokeDashoffset = C;
        return;
      }
      label.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      bar.style.strokeDashoffset = C * (1 - left / total);
    }, 1000);
  }
  if (s.kind === "breath") {
    const cue = document.getElementById("cue");
    let t = 0;
    timer = setInterval(() => {
      t = (t + 1) % 10;
      cue.textContent = t < 4 ? "Breathe in…" : "and slowly out…";
    }, 1000);
  }
}

function record(outcome) {
  const s = ui.options[ui.optionIndex];
  store.addHistory({ ideaId: s.id, title: s.title, category: s.category, feelings: ui.checkin.feelings, outcome });
}

// ---------- Events ----------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const { action, id } = el.dataset;
  const c = ui.checkin;
  const p = profile();

  switch (action) {
    case "path-me":
      store.setProfile({ role: "me" });
      ui.setupStep = 1;
      go("setup");
      break;
    case "path-them":
      store.setProfile({ role: "supporter", onboarded: true });
      go("supporter");
      break;
    case "to-welcome":
      store.setProfile({ role: null, onboarded: false });
      go("welcome");
      break;
    case "setup-next":
      if (ui.setupStep === 1) store.setProfile({ name: document.getElementById("name").value.trim().slice(0, 30) });
      ui.setupStep += 1;
      go("setup");
      break;
    case "setup-back":
      ui.setupStep -= 1;
      go("setup");
      break;
    case "setup-done":
      store.setProfile({ onboarded: true });
      go("home");
      break;
    case "toggle-area": {
      const areas = p.areas.includes(id) ? p.areas.filter((a) => a !== id) : [...p.areas, id];
      store.setProfile({ areas });
      rerenderInPlace(el);
      break;
    }
    case "pick-theme":
      store.setProfile({ theme: id });
      applyTheme(id);
      rerenderInPlace(el);
      break;
    case "start-checkin":
      ui.checkin = freshCheckin();
      go("checkin");
      break;
    case "feel":
      if (c.feelings.includes(id)) c.feelings = c.feelings.filter((f) => f !== id);
      else if (id === "okay") c.feelings = ["okay"];
      else {
        c.feelings = c.feelings.filter((f) => f !== "okay");
        if (c.feelings.length >= 3) c.feelings.shift();
        c.feelings.push(id);
      }
      rerenderInPlace(el);
      break;
    case "time": c.time = Number(id); rerenderInPlace(el); break;
    case "place": c.place = id; rerenderInPlace(el); break;
    case "suggest": getSuggestion(); break;
    case "checkin": go("checkin"); break;
    case "another":
      ui.optionIndex = (ui.optionIndex + 1) % ui.options.length;
      // The first message was written for the first idea, so use a neutral line for the others
      ui.reflection = ui.optionIndex === 0 ? ui.firstReflection
        : ["Fair enough. Here's a different kind of idea.", "No worries, how about this instead?", "Okay, something else. Maybe this one?"][(ui.optionIndex - 1) % 3];
      go("suggestion");
      break;
    case "to-suggestion": go("suggestion"); break;
    case "do": go("doing"); break;
    case "finished": ui.outcome = null; go("followup"); break;
    case "skip":
      ui.outcome = "skipped";
      ui.reply = pick(FOLLOWUPS.skipped);
      record("skipped");
      go("followup");
      break;
    case "outcome":
      ui.outcome = id;
      ui.reply = pick(FOLLOWUPS[id]);
      record(id);
      go("followup");
      break;
    case "smaller": {
      const tried = ui.options[ui.optionIndex].id;
      const tiny = IDEAS.filter((i) => i.minutes <= 2 && i.id !== tried && i.places.includes(c.place));
      const fitting = tiny.filter((i) => i.tags.some((t) => c.feelings.includes(t)));
      ui.options = [pick(fitting.length ? fitting : tiny)];
      ui.optionIndex = 0;
      ui.care = false;
      ui.reflection = "Here's a tiny one. Two minutes, tops.";
      go("suggestion");
      break;
    }
    case "home": go("home"); break;
    case "next-fact": ui.factIndex += 1; rerenderInPlace(el); break;
    case "settings": go("settings"); break;
    case "save-name":
      store.setProfile({ name: document.getElementById("name").value.trim().slice(0, 30) });
      toast("Saved");
      break;
    case "about": go("about"); break;
    case "reset":
      if (confirm("Clear your name, settings and check-ins from this phone?")) {
        store.reset();
        applyTheme(store.data.profile.theme);
        go("welcome");
      }
      break;
  }
});

// Keep the typed note without re-rendering (so the keyboard stays open)
document.addEventListener("input", (e) => {
  if (e.target.id === "note") ui.checkin.note = e.target.value;
});

applyTheme(profile().theme);
render();
