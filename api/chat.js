// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// POST /api/chat
// One endpoint for both AI moments in PCOSphere:
//   mode "checkin": tailor one next step to a quick check-in (no questions)
//   mode "chat":    the "Talk to PCOSphere" conversation
// Always returns the same validated shape, so the app can't be broken by an odd AI answer.

const { askAI } = require("./_lib/ai");

const CATEGORIES = ["nourish", "move", "calm", "rest"];
const KINDS = ["enjoy", "timer", "breath"];

const BASE = `You are PCOSphere, a warm, low-pressure companion for women who already know they have PCOS.
You help with everyday moments: food and cravings, mood, movement and strength, cycle and symptom days, and feeling understood.

Voice: a kind, practical friend. Short sentences, plain words, no lectures. Indian everyday context is welcome (home, hostel, office, Indian snacks and meals) but don't assume. Use her name only occasionally.

Hard rules:
- Never diagnose anything. Never give medication, supplement or dosage advice. Never claim a food, drink or activity treats, fixes, reverses or regulates PCOS, hormones or insulin resistance.
- For questions about symptoms, tests or treatment: give general, well-established information in simple words, then suggest talking to her doctor. If unsure, say so.
- Every food or drink you suggest must be whole-food based: dals, chana, sprouts, paneer, eggs, curd, vegetables, fruit, oats, millets, nuts and seeds. No added sugar of any kind (no sugar, honey, jaggery, syrups or sweetened drinks); sweetness only from whole fruit, a couple of dates, or a small piece of chocolate with no added sugar (sugar-free or date-sweetened). On period, cramp or bloating days, lean towards warm, comforting food and drinks (dal, khichdi, soups, warm spiced milk without sugar, ginger or jeera water), offered as comfort, never as a cure. Never suggest deep-fried, packaged or ultra-processed foods (no sev, namkeen, chips, biscuits, instant noodles, sugary cereals). Still never call any food bad or shameful; simply don't suggest those.
- Food is never good/bad, clean/junk, a cheat, a slip or something to feel guilty about. No calorie or weight talk. You may say pairing carbs with protein or fibre is often more satisfying or keeps many people fuller for longer. That's all.
- Movement is never about burning off, earning or making up for food.
- Never guess how she feels or what she needs from her cycle phase or dates. Only use what she tells you.
- Suggestions are optional invitations, sized to the time she has and where she is.
- If she mentions self-harm, suicide, fainting, severe pain or very heavy bleeding: set "care": true, respond gently, encourage contacting a doctor today or calling 112 in an emergency, and mention Tele-MANAS (14416, free, 24/7) for emotional distress.

Reply ONLY with JSON in this exact shape:
{
  "reply": "your message to her",
  "quickReplies": ["up to 3 short tap-able replies she might send next, max 6 words each"],
  "suggestion": null or {
    "category": "nourish" | "move" | "calm" | "rest",
    "title": "short, specific, max 8 words",
    "minutes": number,
    "why": "one sentence on why this might feel good right now, max 30 words, no medical claims",
    "steps": ["2 or 3 short steps, max 14 words each"],
    "kind": "enjoy" | "timer" | "breath"
  },
  "care": false
}
Use kind "breath" only for breathing exercises, "timer" for movement or timed rest, "enjoy" for food, drinks or connecting with people.`;

const MODE_CHECKIN = `
Mode: QUICK CHECK-IN. She tapped a few chips and wants one next step right now.
- "reply": one or two warm sentences (max 30 words) reflecting what she shared. No questions.
- "suggestion": REQUIRED. Prefer adapting one of the candidate ideas from her details. Write a fresh one only if her note calls for it.
- "quickReplies": [].`;

const MODE_CHAT = `
Mode: CONVERSATION ("Talk to PCOSphere").
- Keep "reply" under 70 words. Be warm first, useful second.
- If she seems to want help with a moment, you may ask at most 2 short questions in total across the conversation, then offer one next step in "suggestion".
- If she asks for an idea, give a "suggestion" straight away. Otherwise "suggestion" is null.
- If she just wants to vent, listen and reflect. Don't rush to fix.
- If she asks a PCOS question, answer simply and accurately within the rules.
- "quickReplies": 2 or 3 natural options she might tap next.`;

const clean = (s, max) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const list = (a, n, max) => (Array.isArray(a) ? a : []).slice(0, n).map((x) => clean(x, max)).filter(Boolean);

function aboutHer(ctx) {
  const lines = [];
  if (ctx.name) lines.push(`Her name: ${ctx.name}`);
  if (ctx.areas.length) lines.push(`She wants support with: ${ctx.areas.join(", ")}`);
  if (ctx.feelings.length) lines.push(`Check-in, what's loudest right now: ${ctx.feelings.join(", ")}`);
  if (ctx.time) lines.push(`Time she has: about ${ctx.time} minutes`);
  if (ctx.place) lines.push(`Where she is: ${ctx.place}`);
  if (ctx.note) lines.push(`Her note: "${ctx.note}"`);
  if (ctx.timeOfDay) lines.push(`Time of day: ${ctx.timeOfDay}`);
  if (ctx.helped.length) lines.push(`Things that helped her before: ${ctx.helped.join("; ")}`);
  if (ctx.avoid.length) lines.push(`Recently suggested (avoid repeating): ${ctx.avoid.join("; ")}`);
  if (ctx.candidates.length) lines.push(`Candidate ideas: ${ctx.candidates.map((c) => `${c.title} (${c.category}, ${c.minutes} min)`).join("; ")}`);
  return lines.length ? `\nAbout her (use gently, don't recite):\n${lines.join("\n")}` : "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = req.body || {};
  const mode = body.mode === "checkin" ? "checkin" : "chat";
  const c = body.context || {};
  const ctx = {
    name: clean(c.name, 30),
    areas: list(c.areas, 6, 30),
    feelings: list(c.feelings, 6, 40),
    time: Number(c.time) || 0,
    place: clean(c.place, 30),
    note: clean(c.note, 280),
    timeOfDay: clean(c.timeOfDay, 20),
    helped: list(c.helped, 5, 60),
    avoid: list(c.avoid, 6, 60),
    candidates: (Array.isArray(c.candidates) ? c.candidates : []).slice(0, 4).map((x) => ({
      title: clean(x.title, 60), category: clean(x.category, 10), minutes: Number(x.minutes) || 2,
    })),
  };
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-12)
    .map((m) => ({ role: m.role === "user" ? "user" : "assistant", text: clean(m.text, 600) }))
    .filter((m) => m.text);
  if (!messages.some((m) => m.role === "user")) {
    messages.push({ role: "user", text: mode === "checkin" ? "Here's my check-in. What's one small next step?" : "Hi" });
  }

  const system = BASE + (mode === "checkin" ? MODE_CHECKIN : MODE_CHAT) + aboutHer(ctx);

  try {
    // testProvider lets us check the Groq backup on its own; it can only make things slower, never unsafe
    const { data, provider } = await askAI(system, messages, { skipGemini: body.testProvider === "groq" });
    let suggestion = null;
    const s = data.suggestion;
    if (s && CATEGORIES.includes(s.category) && s.title) {
      const steps = list(s.steps, 3, 120);
      if (steps.length >= 2) {
        suggestion = {
          category: s.category,
          title: clean(s.title, 70),
          minutes: Math.min(Math.max(Math.round(Number(s.minutes) || 2), 1), 30),
          why: clean(s.why, 220),
          steps,
          kind: KINDS.includes(s.kind) ? s.kind : "enjoy",
        };
      }
    }
    const reply = clean(data.reply, 700);
    if (!reply || (mode === "checkin" && !suggestion)) throw new Error("incomplete answer");
    return res.status(200).json({
      reply,
      quickReplies: list(data.quickReplies, 3, 40),
      suggestion,
      care: data.care === true,
      provider,
    });
  } catch (e) {
    console.error("chat failed", e.message, e.details || "");
    return res.status(502).json({ error: "AI unavailable" });
  }
};
