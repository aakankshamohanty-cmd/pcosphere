// Everything PCOSphere remembers lives here, on this device only (localStorage).
// Later, signed-in users will also sync their profile and "what helped" to their account.

const KEY = "pcosphere.v1";

function defaults() {
  return {
    profile: { name: "", areas: [], theme: "cottage", role: null, onboarded: false },
    history: [],   // what she tried and how it went: { ts, ideaId, title, category, outcome }
    checkins: [],  // her check-ins: { ts, feelings, time, place, note }
    chat: [],      // the "Talk to PCOSphere" conversation: { role, text, suggestion?, care?, quickReplies? }
    usage: { day: "", count: 0 }, // messages sent today, for the gentle daily limit
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved) return defaults();
    const d = defaults();
    return { ...d, ...saved, profile: { ...d.profile, ...saved.profile } };
  } catch {
    return defaults();
  }
}

export const store = {
  data: load(),
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* private mode: keep working in memory */ }
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
