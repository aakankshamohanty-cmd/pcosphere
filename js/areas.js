// PCOSphere area pages: each support area has its own kind of tool.
//   Food & cravings      -> Craving kitchen (AI recipes for the taste she wants)
//   Mood & mind          -> Calm corner (instant tools, listening chat, guided videos, real help)
//   Movement & strength  -> Move menu (AI routine for her energy, time and place, with how-to videos)
//   Cycle & symptoms     -> Symptom helper (carefully written info + "ask your doctor" questions)
// Health information on symptoms is written by hand, not generated, so it's reliable every time.

import { IDEAS, FACTS, CATEGORIES } from "./content.js";
import { store } from "./store.js";

let ctx;
export function setup(helpers) { ctx = helpers; }

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const AREA_PAGES = {
  food: { title: "Craving kitchen", sub: "Tell me what you're in the mood for, and I'll find something satisfying.", tile: "Craving kitchen", cat: "nourish" },
  mood: { title: "Calm corner", sub: "Small tools for loud moments, someone to talk to, and real help if you need it.", tile: "Calm corner", cat: "calm" },
  movement: { title: "Move menu", sub: "A short routine that fits your energy right now. Two minutes counts.", tile: "Move menu", cat: "move" },
  cycle: { title: "Symptom helper", sub: "Plain-language help for common PCOS symptoms, and what to ask your doctor.", tile: "Symptom helper", cat: "rest" },
};

const TASTES = [["sweet", "Sweet"], ["savoury", "Savoury"], ["tangy", "Tangy"], ["crunchy", "Crunchy"], ["warm", "Warm & cosy"]];
const ENERGY = [["low", "Low"], ["okay", "Okay"], ["good", "Good"]];
const MINUTES = [[5, "5 min"], [10, "10 min"], [20, "20 min"]];
const COOK_TIME = [[5, "5 min"], [15, "15 min"], [30, "30 min"]];
const PLACES = [["home", "At home"], ["desk", "At a desk"], ["out", "Outside"]];

const STARTERS = {
  food: ["I'm craving something sweet", "Quick high-protein breakfast idea?", "A filling evening snack?"],
  mood: ["I just need to vent", "I feel anxious and can't settle", "I feel a bit lonely today"],
  movement: ["I have no energy but want to move", "Explain strength training simply"],
  cycle: ["Explain insulin resistance simply", "What should I ask my doctor about PCOS?"],
};

const MOOD_VIDEOS = [
  ["5-minute guided breathing", "5 minute guided breathing for anxiety"],
  ["10-minute guided meditation", "10 minute guided meditation for stress"],
  ["Yoga nidra for rest", "yoga nidra for sleep and relaxation"],
  ["Gentle body scan", "body scan meditation 10 minutes"],
];

const SYMPTOMS = {
  cramps: {
    label: "Cramps & period pain",
    explain: "Period cramps happen when the womb tightens to shed its lining. With PCOS, periods can be irregular, and some can feel heavier or more painful when they do come.",
    comfort: ["Warmth on your belly or lower back", "Gentle movement: cat-cow, a slow walk", "Rest without guilt, and something warm to sip"],
    doctor: ["Pain stops you doing everyday things, or usual pain relief doesn't help", "Very heavy bleeding (soaking a pad or tampon every 1–2 hours)", "Pain with fever, fainting, or sudden severe pain"],
    ask: ["Is my period pain within the normal range?", "What pain relief is safe for me to use?", "Should we look into why my periods are irregular?"],
    video: "gentle yoga for period cramps 10 minutes",
  },
  bloating: {
    label: "Bloating",
    explain: "Bloating is common and can come from digestion, your cycle or stress. It usually settles on its own.",
    comfort: ["A slow walk after meals", "Something warm: ginger or jeera water", "Loose clothes and eating a little more slowly"],
    doctor: ["You're bloated most days for 3 weeks or more", "It comes with pain, weight loss you didn't intend, or changes in your bowel habits", "You notice blood in your stool"],
    ask: ["Could anything I eat be making this worse?", "Is this bloating worth looking into?"],
    video: "gentle yoga for bloating relief",
  },
  acne: {
    label: "Acne & skin",
    explain: "With PCOS, higher levels of androgens (sometimes called \"male\" hormones) can make skin oilier and lead to acne. It's common, and it isn't caused by anything you did.",
    comfort: ["A gentle cleanser twice a day, and try not to pick", "Non-comedogenic moisturiser and sunscreen", "Be kind to yourself about how your skin looks today"],
    doctor: ["Acne is painful, leaving scars, or affecting how you feel", "Over-the-counter products haven't helped after 2–3 months"],
    ask: ["Which treatment options would suit me?", "Could my acne be linked to my hormones?"],
    video: "dermatologist gentle skincare routine acne prone skin",
  },
  hair: {
    label: "Hair changes",
    explain: "Extra androgens can mean more facial or body hair, or thinning hair on the head. It's common with PCOS and nothing to be ashamed of.",
    comfort: ["Choose hair removal that feels right for you, or none at all", "Gentle hair care, and loose hairstyles", "Talk about it with someone you trust if it's weighing on you"],
    doctor: ["Hair growth or hair loss is sudden or fast", "It's affecting your confidence or mood"],
    ask: ["What can help with extra hair growth or thinning?", "Are there treatments that work on the hormone side?"],
    video: "dermatologist tips hair thinning women",
  },
  fatigue: {
    label: "Tiredness",
    explain: "Feeling tired is common with PCOS. Sleep, mood, iron, thyroid and blood sugar can all play a part, so if it keeps going it's worth getting checked.",
    comfort: ["Regular meals with some protein", "A few minutes of daylight and a short walk", "A steady bedtime, and rest without guilt"],
    doctor: ["You're tired most days for several weeks", "You snore loudly or wake up unrefreshed", "Tiredness comes with low mood that won't lift"],
    ask: ["Could we check my iron, thyroid or blood sugar?", "Could my sleep be part of this?"],
    video: "10 minute gentle morning stretch energy",
  },
  periods: {
    label: "Irregular periods",
    explain: "With PCOS, the ovaries don't always release an egg, so periods can be irregular, far apart or absent for a while. It's not something you caused.",
    comfort: ["Note dates when you remember. No pressure to track perfectly", "Bring any pattern you notice to your doctor", "Remember: one irregular cycle doesn't mean something is wrong with you"],
    doctor: ["You haven't had a period in 3 months or more (and you're not pregnant)", "Very heavy, very long, or in-between bleeding", "You're trying to conceive and want support"],
    ask: ["How often should I be having a period?", "Do I need anything to protect my womb lining?", "What are my options if I want to get pregnant someday?"],
    video: "PCOS irregular periods explained by doctor",
  },
};

// Built-in backups if the AI is unavailable
const FALLBACK_ROUTINES = {
  low: { title: "Gentle unwind", moves: [["Cat-cow", "8 slow rounds", "cat cow stretch for beginners"], ["Seated twist", "3 breaths each side", "seated spinal twist"], ["Neck rolls", "5 each way", "gentle neck stretches"], ["Legs up the wall", "2 minutes", "legs up the wall pose"]] },
  okay: { title: "Easy strength snack", moves: [["Chair squats", "10 slow reps", "chair squat for beginners"], ["Wall push-ups", "8 reps", "wall push up beginner"], ["Glute bridges", "10 reps", "how to do glute bridge beginner"], ["March on the spot", "40 seconds", "marching in place exercise"]] },
  good: { title: "Feel-strong circuit", moves: [["Squats", "12 reps", "bodyweight squat proper form"], ["Incline push-ups", "10 reps", "incline push up on table"], ["Reverse lunges", "8 each side", "reverse lunge for beginners"], ["Glute bridges", "15 reps", "how to do glute bridge beginner"], ["Plank", "20–30 seconds", "plank for beginners"]] },
  desk: { title: "Desk reset", moves: [["Shoulder rolls", "10 back", "shoulder rolls exercise"], ["Seated twist", "3 breaths each side", "seated spinal twist chair"], ["Seated leg lifts", "10 each side", "seated leg raises chair"], ["Calf raises", "15 reps", "standing calf raises"]] },
  out: { title: "Easy walk", moves: [["Easy warm-up walk", "3 minutes", "how to warm up before walking"], ["Brisker walk", "as long as feels good", "brisk walking technique"], ["Slow cool-down", "2 minutes", "cool down stretches after walking"]] },
};

const state = {
  food: { tastes: [], minutes: 15, have: "", result: null, busy: false, error: "" },
  movement: { energy: "okay", minutes: 10, place: "home", result: null, busy: false, error: "" },
  cycle: { symptom: null },
};

// ---------- Home tiles ----------
export function homeTiles() {
  const chosen = Object.keys(AREA_PAGES).filter((a) => store.data.profile.areas.includes(a));
  if (!chosen.length) return "";
  return `
  <div class="section-title"><h3>Your areas</h3></div>
  <div class="tiles">
    ${chosen.map((a) => `
      <button class="tile cat-${AREA_PAGES[a].cat}" data-action="open-area" data-id="${a}">
        <strong>${AREA_PAGES[a].tile}</strong>
        <span>${{ food: "Food & cravings", mood: "Mood & mind", movement: "Movement", cycle: "Cycle & symptoms" }[a]}</span>
      </button>`).join("")}
  </div>`;
}

// ---------- Pieces ----------
const seg = (action, options, current) => `
  <div class="seg" role="group">
    ${options.map(([id, label]) => `<button data-action="${action}" data-id="${id}" aria-pressed="${String(current) === String(id)}">${label}</button>`).join("")}
  </div>`;

function startersBlock(area) {
  return `
  <div class="section-title"><h3>Ask PCOSphere</h3></div>
  <div class="chips">${STARTERS[area].map((q) => `<button class="chip" data-action="area-ask" data-text="${ctx.esc(q)}">${ctx.esc(q)}</button>`).join("")}</div>`;
}

function factsBlock(area) {
  const facts = FACTS.filter((f) => f.areas.includes(area));
  if (!facts.length) return "";
  return `
  <div class="section-title"><h3>Did you know?</h3></div>
  ${facts.map((f) => `<div class="card fact"><p class="fact-text">${ctx.esc(f.text)}</p><p class="src">Source: <a href="${f.url}" target="_blank" rel="noopener">${ctx.esc(f.source)}</a></p></div>`).join("")}`;
}

// ---------- Area pages ----------
function Food() {
  const s = state.food;
  const { esc } = ctx;
  return `
    <div class="section">
      <div class="section-head"><h3>What are you in the mood for?</h3><span class="hint">Pick any</span></div>
      <div class="chips">${TASTES.map(([id, label]) => `<button class="chip" data-action="food-taste" data-id="${id}" aria-pressed="${s.tastes.includes(id)}">${label}</button>`).join("")}</div>
    </div>
    <div class="section">
      <div class="section-head"><h3>How much time?</h3></div>
      ${seg("food-min", COOK_TIME, s.minutes)}
    </div>
    <div class="section">
      <div class="section-head"><h3><label for="food-have">What's at home?</label></h3><span class="hint">Optional</span></div>
      <input class="input" id="food-have" maxlength="160" placeholder="e.g. paneer, oats, curd, banana" value="${esc(s.have)}" />
    </div>
    ${s.error ? `<p class="error">${esc(s.error)}</p>` : ""}
    <button class="btn btn-primary" data-action="food-go" ${s.busy ? "disabled" : ""}>${s.busy ? "Finding ideas…" : "Find me something"}</button>
    ${s.result ? `
      ${s.result.intro ? `<div class="say" style="margin-top:20px"><span class="who">PCOSphere</span>${esc(s.result.intro)}</div>` : ""}
      ${s.result.recipes.map((r, i) => `
        <article class="idea cat-nourish recipe">
          <span class="tag">${r.minutes} min${r.tags.length ? " · " + r.tags.map(esc).join(" · ") : ""}</span>
          <h3>${esc(r.title)}</h3>
          ${r.why ? `<p class="why">${esc(r.why)}</p>` : ""}
          ${r.ingredients.length ? `<p class="mini-head">You'll need</p><ul>${r.ingredients.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
          <p class="mini-head">How</p>
          <ol>${r.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
          <button class="btn btn-soft" style="margin-top:14px" data-action="food-cook" data-id="${i}">I'm making this</button>
        </article>`).join("")}
      <p class="source-note">${s.result.fromAI ? "Ideas by AI · " : ""}General ideas, not medical or dietary advice</p>` : ""}
  `;
}

function Mood() {
  const tools = [["breathing", "Breathe"], ["grounding", "Ground"], ["brain-dump", "Brain dump"]];
  return `
    <div class="tools">
      ${tools.map(([id, label]) => `<button class="tool cat-calm" data-action="area-idea" data-id="${id}"><strong>${label}</strong><span>${IDEAS.find((i) => i.id === id)?.minutes || 2} min</span></button>`).join("")}
    </div>
    <button class="path" style="margin-top:14px" data-action="area-ask" data-text="I just need to vent">
      <span class="bubble-ico" style="background:var(--calm);color:var(--calm-ink)">${ctx.ICON.chat}</span>
      <span><strong>Talk it out</strong><span class="sub">I'll listen first. No fixing unless you want it.</span></span>
      <span class="chev">${ctx.ICON.chev}</span>
    </button>
    <div class="section-title"><h3>Guided videos</h3></div>
    <div class="card"><ul class="link-list">${MOOD_VIDEOS.map(([label, q]) => `<li><a href="${yt(q)}" target="_blank" rel="noopener">▶ ${label}</a></li>`).join("")}</ul></div>
    <div class="care" style="margin-top:16px">
      <p><strong>Need more support?</strong></p>
      <p>If low mood or anxiety lasts more than two weeks, or gets in the way of daily life, a doctor or counsellor can really help. Anxiety and low mood are more common with PCOS. You're not overreacting.</p>
      <p>Talk to someone now at Tele-MANAS, free and 24/7: <a href="tel:14416">14416</a>. In an emergency, call <a href="tel:112">112</a>.</p>
    </div>
  `;
}

function Movement() {
  const s = state.movement;
  const { esc } = ctx;
  const r = s.result;
  return `
    <div class="section"><div class="section-head"><h3>Energy right now?</h3></div>${seg("move-energy", ENERGY, s.energy)}</div>
    <div class="section"><div class="section-head"><h3>Time?</h3></div>${seg("move-min", MINUTES, s.minutes)}</div>
    <div class="section"><div class="section-head"><h3>Where?</h3></div>${seg("move-place", PLACES, s.place)}</div>
    ${s.error ? `<p class="error">${esc(s.error)}</p>` : ""}
    <button class="btn btn-primary" data-action="move-go" ${s.busy ? "disabled" : ""}>${s.busy ? "Building your routine…" : "Build my routine"}</button>
    ${r ? `
      ${r.intro ? `<div class="say" style="margin-top:20px"><span class="who">PCOSphere</span>${esc(r.intro)}</div>` : ""}
      <article class="idea cat-move">
        <span class="tag">Move · about ${r.minutes} min</span>
        <h3>${esc(r.title)}</h3>
        <ol class="moves">${r.moves.map((m) => `
          <li><div><strong>${esc(m.name)}</strong>${m.amount ? ` · ${esc(m.amount)}` : ""}${m.how ? `<span class="how">${esc(m.how)}</span>` : ""}${m.video ? `<a class="how-link" href="${yt(m.video)}" target="_blank" rel="noopener">▶ How to</a>` : ""}</div></li>`).join("")}</ol>
        ${r.note ? `<p class="why" style="margin-top:12px">${esc(r.note)}</p>` : ""}
        <button class="btn btn-primary" style="margin-top:14px" data-action="move-start">Start the timer</button>
      </article>
      <p class="source-note">${r.fromAI ? "Routine by AI · " : ""}Go at your own pace. Stop if anything hurts</p>` : ""}
  `;
}

function Cycle() {
  const s = state.cycle;
  const { esc } = ctx;
  const sym = s.symptom ? SYMPTOMS[s.symptom] : null;
  return `
    <div class="section">
      <div class="section-head"><h3>What's bothering you?</h3></div>
      <div class="chips">${Object.entries(SYMPTOMS).map(([id, x]) => `<button class="chip" data-action="cycle-sym" data-id="${id}" aria-pressed="${s.symptom === id}">${x.label}</button>`).join("")}</div>
    </div>
    ${sym ? `
      <article class="card symptom">
        <h2>${esc(sym.label)}</h2>
        <p style="margin-top:8px">${esc(sym.explain)}</p>
        <p class="mini-head">Things that might help</p>
        <ul>${sym.comfort.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <p class="mini-head">See a doctor if</p>
        <ul>${sym.doctor.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <p class="mini-head">Questions you could ask your doctor</p>
        <ul>${sym.ask.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="row" style="margin-top:14px;flex-wrap:wrap">
          <a class="btn btn-ghost" href="${yt(sym.video)}" target="_blank" rel="noopener">▶ Watch a video</a>
          <button class="btn btn-soft" data-action="area-ask" data-text="${esc(`Tell me more about ${sym.label.toLowerCase()} with PCOS`)}">Ask PCOSphere</button>
        </div>
      </article>
      <p class="source-note">General information, not a diagnosis. Your doctor knows your situation best</p>` : ""}
  `;
}

function Area() {
  const id = ctx.ui.area;
  const page = AREA_PAGES[id];
  const body = { food: Food, mood: Mood, movement: Movement, cycle: Cycle }[id]();
  return `
  ${ctx.topbar({ back: "home" })}
  <section class="screen">
    <p class="eyebrow">${{ food: "Food & cravings", mood: "Mood & mind", movement: "Movement & strength", cycle: "Cycle & symptoms" }[id]}</p>
    <h1>${page.title}</h1>
    <p class="muted" style="margin:8px 0 20px">${page.sub}</p>
    ${body}
    ${startersBlock(id)}
    ${factsBlock(id)}
  </section>`;
}

export const screens = { area: Area };

// ---------- Actions ----------
export const ACTIONS = new Set(["open-area", "area-ask", "area-idea", "food-taste", "food-min", "food-go", "food-cook", "move-energy", "move-min", "move-place", "move-go", "move-start", "cycle-sym"]);

export async function handle(action, el) {
  const { ui, go, render, rerenderInPlace } = ctx;
  const id = el.dataset.id;
  const f = state.food;
  const m = state.movement;
  switch (action) {
    case "open-area": ui.area = id; go("area"); break;
    case "area-ask": ctx.startChat(el.dataset.text); break;
    case "area-idea": {
      const idea = IDEAS.find((i) => i.id === id);
      if (idea) ctx.startIdea(idea, "area");
      break;
    }
    case "food-taste":
      f.have = document.getElementById("food-have")?.value || f.have;
      f.tastes = f.tastes.includes(id) ? f.tastes.filter((t) => t !== id) : [...f.tastes, id];
      rerenderInPlace(el);
      break;
    case "food-min": f.have = document.getElementById("food-have")?.value || f.have; f.minutes = Number(id); rerenderInPlace(el); break;
    case "food-go": {
      f.have = document.getElementById("food-have")?.value.trim() || "";
      f.busy = true; f.error = ""; rerenderInPlace(el);
      const r = await post({ mode: "recipes", tastes: f.tastes.map((t) => TASTES.find((x) => x[0] === t)[1]), minutes: f.minutes, have: f.have, name: store.data.profile.name });
      f.busy = false;
      if (r?.recipes?.length) f.result = { ...r, fromAI: true };
      else f.result = foodFallback();
      render();
      document.querySelector(".recipe")?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
    case "food-cook": {
      const r = f.result.recipes[Number(id)];
      ctx.startIdea({ id: "recipe-" + Date.now(), category: "nourish", title: r.title, minutes: r.minutes, why: r.why || "Enjoy making it, and enjoy eating it.", steps: r.steps.slice(0, 4), kind: "enjoy" }, "area");
      break;
    }
    case "move-energy": m.energy = id; rerenderInPlace(el); break;
    case "move-min": m.minutes = Number(id); rerenderInPlace(el); break;
    case "move-place": m.place = id; rerenderInPlace(el); break;
    case "move-go": {
      m.busy = true; m.error = ""; rerenderInPlace(el);
      const r = await post({ mode: "routine", energy: m.energy, minutes: m.minutes, place: PLACES.find((p) => p[0] === m.place)[1] });
      m.busy = false;
      m.result = r?.moves?.length ? { ...r, fromAI: true } : moveFallback();
      render();
      document.querySelector(".moves")?.scrollIntoView({ behavior: "smooth", block: "center" });
      break;
    }
    case "move-start": {
      const r = m.result;
      ctx.startIdea({ id: "routine-" + Date.now(), category: "move", title: r.title, minutes: r.minutes, why: r.intro || "", steps: r.moves.map((x) => `${x.name}${x.amount ? `: ${x.amount}` : ""}`), kind: "timer" }, "area");
      break;
    }
    case "cycle-sym": state.cycle.symptom = state.cycle.symptom === id ? null : id; rerenderInPlace(el); break;
  }
}

async function post(body) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch("/api/area", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function foodFallback() {
  const want = state.food.tastes;
  const tagFor = { sweet: "craving-sweet", savoury: "craving-salty", crunchy: "craving-salty", tangy: "craving-salty", warm: "bloated" };
  const tags = want.map((t) => tagFor[t]);
  const pool = IDEAS.filter((i) => i.category === "nourish" && i.minutes <= state.food.minutes);
  const ranked = pool.sort((a, b) => b.tags.filter((t) => tags.includes(t)).length - a.tags.filter((t) => tags.includes(t)).length).slice(0, 3);
  return {
    intro: "I couldn't reach the recipe helper just now, so here are a few favourites from my idea box.",
    recipes: ranked.map((i) => ({ title: i.title, minutes: i.minutes, tags: [], ingredients: [], steps: i.steps, why: i.why })),
    fromAI: false,
  };
}

function moveFallback() {
  const m = state.movement;
  const key = m.place === "desk" ? "desk" : m.place === "out" ? "out" : m.energy;
  const r = FALLBACK_ROUTINES[key];
  return {
    intro: "Here's a simple one from my idea box.",
    title: r.title,
    minutes: m.minutes,
    moves: r.moves.map(([name, amount, video]) => ({ name, amount, how: "", video })),
    note: "Go at your own pace, and stop if anything hurts.",
    fromAI: false,
  };
}

// Used by app.js to show a category label for area-made ideas
export const categoryLabel = (c) => CATEGORIES[c]?.label || "";
