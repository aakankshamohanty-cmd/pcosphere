// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// Everything PCOSphere remembers lives here, on this device only (localStorage).
// Later, signed-in users will also sync their profile and "what helped" to their account.

import { DEMO, demoProfile } from "./demo.js";

// The demo phones keep their own separate data, never mixed with a real user's
const KEY = DEMO ? `pcosphere.demo.${DEMO}` : "pcosphere.v1";

function defaults() {
  if (DEMO) {
    return {
      profile: demoProfile(),
      history: DEMO !== "him" ? [{ ts: Date.now() - 86400000, ideaId: "stroll", title: "A ten-minute stroll, no goal", category: "move", outcome: "better" }] : [],
      checkins: [], chat: [], usage: { day: "", count: 0 },
      account: { signedIn: true, dismissedSigninNudge: true }, nudges: [],
    };
  }
  return {
    profile: { name: "", areas: [], theme: "cottage", role: null, onboarded: false },
    history: [],   // what she tried and how it went: { ts, ideaId, title, category, outcome }
    checkins: [],  // her check-ins: { ts, feelings, time, place, note }
    chat: [],      // the "Talk to PCOSphere" conversation: { role, text, suggestion?, care?, quickReplies? }
    usage: { day: "", count: 0 }, // messages sent today, for the gentle daily limit
    account: { signedIn: false, dismissedSigninNudge: false },
    nudges: [],    // hints she chose to send: { ts, names, kind, mode, outcome: null | "asked" | "not-yet" }
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved) return defaults();
    const d = defaults();
    return { ...d, ...saved, profile: { ...d.profile, ...saved.profile }, account: { ...d.account, ...saved.account } };
  } catch {
    return defaults();
  }
}

export const store = {
  data: load(),
  listeners: [],
  onSave(fn) { this.listeners.push(fn); },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* private mode: keep working in memory */ }
    for (const fn of this.listeners) fn();
  },
  setProfile(patch) {
    Object.assign(this.data.profile, patch);
    this.save();
  },
  addCheckin(checkin) {
    this.data.checkins.push({ ts: Date.now(), ...checkin });
    this.data.checkins = this.data.checkins.slice(-100);
    this.save();
  },
  addHistory(entry) {
    this.data.history.push({ ts: Date.now(), ...entry });
    this.data.history = this.data.history.slice(-100);
    this.save();
  },
  addChat(message) {
    this.data.chat.push({ ts: Date.now(), ...message });
    this.data.chat = this.data.chat.slice(-60);
    this.save();
  },
  clearChat() {
    this.data.chat = [];
    this.save();
  },
  messagesToday() {
    const today = new Date().toDateString();
    return this.data.usage.day === today ? this.data.usage.count : 0;
  },
  countMessage() {
    const today = new Date().toDateString();
    this.data.usage = { day: today, count: this.messagesToday() + 1 };
    this.save();
  },
  reset() {
    try { localStorage.removeItem(KEY); } catch {}
    this.data = defaults();
  },
};
