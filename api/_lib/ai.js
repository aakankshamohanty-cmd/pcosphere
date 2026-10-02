// Shared AI helper for PCOSphere's server functions.
// Tries Gemini first, then Groq as a backup. Keys come from Vercel's environment variables
// and never reach the browser. Files in api/_lib are helpers, not public endpoints.

const GEMINI_MODELS = (process.env.GEMINI_MODELS || "gemini-3.1-flash-lite,gemini-3-flash-preview,gemini-2.5-flash").split(",").map((s) => s.trim()).filter(Boolean);
const GROQ_MODELS = (process.env.GROQ_MODELS || "openai/gpt-oss-120b,openai/gpt-oss-20b").split(",").map((s) => s.trim()).filter(Boolean);

function withTimeout(ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(t) };
}

// Pull the first {...} block out of a reply, in case a model wraps JSON in extra text
function parseJson(text) {
  if (!text) throw new Error("empty");
  try { return JSON.parse(text); } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
  throw new Error("not json");
}

async function callGemini(model, system, messages) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no gemini key");
  // Gemini wants the conversation to start with the user
  const turns = messages.slice(messages.findIndex((m) => m.role === "user"));
  const t = withTimeout(7000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: t.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })),
        generationConfig: { responseMimeType: "application/json", temperature: 0.8, maxOutputTokens: 2048 },
      }),
    });
    if (!r.ok) throw new Error(`gemini ${model} ${r.status}`);
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    return parseJson(text);
  } finally {
    t.done();
  }
}

async function callGroq(model, system, messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no groq key");
  const t = withTimeout(9000);
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: t.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        max_completion_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, ...messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }))],
      }),
    });
    if (!r.ok) throw new Error(`groq ${model} ${r.status}`);
    const data = await r.json();
    return parseJson(data?.choices?.[0]?.message?.content || "");
  } finally {
    t.done();
  }
}

// Returns { data, provider } or throws if every provider failed.
async function askAI(system, messages, { skipGemini = false } = {}) {
  const errors = [];
  for (const model of skipGemini ? [] : GEMINI_MODELS) {
    try { return { data: await callGemini(model, system, messages), provider: `gemini:${model}` }; }
    catch (e) {
      errors.push(e.message);
      // A timeout means Gemini is slow right now: don't try more Gemini models, go straight to Groq
      if (e.name === "AbortError") break;
    }
  }
  for (const model of GROQ_MODELS) {
    try { return { data: await callGroq(model, system, messages), provider: `groq:${model}` }; }
    catch (e) { errors.push(e.message); }
  }
  const err = new Error("all providers failed");
  err.details = errors;
  throw err;
}

module.exports = { askAI };
