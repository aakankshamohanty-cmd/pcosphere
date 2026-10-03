// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// POST /api/area
// AI tools for the area pages:
//   mode "recipes": Craving kitchen, 2–3 quick recipes for the taste she's after
//   mode "routine": Move menu, a short routine sized to her energy, time and place
// Videos are YouTube *searches* written by the AI, so links never break.

const { askAI } = require("./_lib/ai");

const clean = (s, max) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const list = (a, n, max) => (Array.isArray(a) ? a : []).slice(0, n).map((x) => clean(x, max)).filter(Boolean);

const RULES = `You are PCOSphere, a warm companion for women with PCOS. Indian everyday context is welcome.
Never mention calories, weight loss, "good/bad" or "guilt-free" food, burning off food, or that anything treats or fixes PCOS or insulin resistance.
No medical claims. Keep wording short, kind and practical. Reply ONLY with JSON.`;

const RECIPES = `Task: suggest 3 quick, satisfying recipes for what she's craving.
Pair carbs with protein and/or fibre (it's often more satisfying), using common Indian kitchen ingredients.
Every food or drink you suggest must be whole-food based: dals, chana, sprouts, paneer, eggs, curd, vegetables, fruit, oats, millets, nuts and seeds. No added sugar of any kind (no sugar, honey, jaggery, syrups or sweetened drinks); sweetness only from whole fruit, a couple of dates, or a small piece of chocolate with no added sugar (sugar-free or date-sweetened). On period, cramp or bloating days, lean towards warm, comforting food and drinks (dal, khichdi, soups, warm spiced milk without sugar, ginger or jeera water), offered as comfort, never as a cure. Never suggest deep-fried, packaged or ultra-processed foods (no sev, namkeen, chips, biscuits, instant noodles, sugary cereals). Still never call any food bad or shameful; simply don't suggest those.
If she lists something at home that doesn't fit these rules, quietly leave it out and use the rest.
Respect her time limit and use what she has at home if she listed anything.
JSON shape:
{
  "intro": "one warm sentence, max 20 words",
  "recipes": [
    {
      "title": "max 6 words",
      "minutes": number,
      "tags": ["1 to 3 of: protein, fibre, no-cook, one-pan, sweet, savoury, tangy, crunchy, warm"],
      "ingredients": ["3 to 7 short items with rough amounts"],
      "steps": ["2 to 5 short steps, max 16 words each"],
      "why": "one sentence on why it's satisfying, max 20 words"
    }
  ]
}`;

const ROUTINE = `Task: build one short, doable movement routine for right now.
Match her energy: low = very gentle (mobility, stretching, walking), okay = easy strength, good = a bit more effort.
Respect the time and place (desk = seated or standing, no floor work; out = walking-based).
Use 3 to 6 moves. Strength is welcome (squats, wall push-ups, glute bridges, rows with a bag), but keep it beginner-friendly.
JSON shape:
{
  "intro": "one warm sentence, max 20 words",
  "title": "max 6 words",
  "minutes": number,
  "moves": [
    { "name": "move name", "amount": "e.g. 10 slow reps, or 40 seconds", "how": "one cue, max 14 words", "video": "a YouTube search query to learn this move, e.g. 'how to do glute bridge beginner'" }
  ],
  "note": "one gentle line, e.g. stop if anything hurts, max 16 words"
}`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const b = req.body || {};
  try {
    if (b.mode === "recipes") {
      const ask = `She's craving: ${list(b.tastes, 5, 20).join(", ") || "anything"}. Time: up to ${Number(b.minutes) || 15} minutes. At home: ${clean(b.have, 160) || "the usual basics"}.${b.name ? ` Her name: ${clean(b.name, 30)}.` : ""}`;
      const { data, provider } = await askAI(`${RULES}\n${RECIPES}`, [{ role: "user", text: ask }]);
      const recipes = (Array.isArray(data.recipes) ? data.recipes : []).slice(0, 3).map((r) => ({
        title: clean(r.title, 60),
        minutes: Math.min(Math.max(Math.round(Number(r.minutes) || 10), 1), 60),
        tags: list(r.tags, 3, 16),
        ingredients: list(r.ingredients, 8, 60),
        steps: list(r.steps, 6, 140),
        why: clean(r.why, 160),
      })).filter((r) => r.title && r.ingredients.length && r.steps.length);
      if (!recipes.length) throw new Error("no recipes");
      return res.status(200).json({ intro: clean(data.intro, 160), recipes, provider });
    }

    if (b.mode === "routine") {
      const ask = `Energy: ${clean(b.energy, 10) || "okay"}. Time: about ${Number(b.minutes) || 10} minutes. Place: ${clean(b.place, 20) || "home"}.`;
      const { data, provider } = await askAI(`${RULES}\n${ROUTINE}`, [{ role: "user", text: ask }]);
      const moves = (Array.isArray(data.moves) ? data.moves : []).slice(0, 6).map((m) => ({
        name: clean(m.name, 50), amount: clean(m.amount, 40), how: clean(m.how, 120), video: clean(m.video, 80),
      })).filter((m) => m.name);
      if (moves.length < 2) throw new Error("no routine");
      return res.status(200).json({
        intro: clean(data.intro, 160),
        title: clean(data.title, 60) || "Your routine",
        minutes: Math.min(Math.max(Math.round(Number(data.minutes) || Number(b.minutes) || 10), 2), 30),
        moves,
        note: clean(data.note, 120),
        provider,
      });
    }

    return res.status(400).json({ error: "Unknown mode" });
  } catch (e) {
    console.error("area failed", b.mode, e.message);
    return res.status(502).json({ error: "AI unavailable" });
  }
};
