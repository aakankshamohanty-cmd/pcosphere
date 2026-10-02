// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// Talks to PCOSphere's /api/chat endpoint. Returns null if the AI can't be reached,
// so every caller can fall back to the built-in idea library instead of showing an error.

export const DAILY_CHAT_LIMIT = 50;

export async function askAI({ mode, messages = [], context = {} }, timeoutMs = 14000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ mode, messages, context }),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// When the AI is unavailable, guess which check-in feelings a message is about,
// so the built-in library can still offer something relevant.
const KEYWORDS = {
  "craving-sweet": /crav|snack|munch|sweet|chocolate|dessert|sugar|mithai|ice ?cream|cake/i,
  "craving-salty": /salty|chips|namkeen|crunchy|fries/i,
  "skipped-meal": /hungry|skipped|haven'?t eaten|didn'?t eat|no lunch|no breakfast/i,
  "low-energy": /tired|exhausted|sleepy|no energy|low energy|drained|fatigue/i,
  "crampy": /cramp|ache|pain/i,
  "bloated": /bloat/i,
  "on-period": /period|menstrua/i,
  "anxious": /anxious|anxiety|stress|panic|worried|overwhelm|nervous/i,
  "low-mood": /sad|low|down|cry|flat|upset|hopeless|meh/i,
  "lonely": /lonely|alone|misunderstood|nobody|no one/i,
  "restless": /restless|can'?t sit|fidget|antsy/i,
};

export function guessFeelings(text) {
  return Object.entries(KEYWORDS).filter(([, re]) => re.test(text)).map(([id]) => id).slice(0, 3);
}
