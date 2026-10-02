// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// Sends discreet push notifications through Firebase Cloud Messaging (free).
// Lock-screen text never contains the hint itself; it's only shown inside the app.

const { admin, db } = require("./firebase");

const DISCREET = { title: "PCOSphere", body: "A little idea for today 💛" };

async function sendToUser(uid, message = DISCREET) {
  const ref = db().collection("users").doc(uid);
  const tokens = ((await ref.get()).data() || {}).pushTokens || [];
  if (!tokens.length) return { sent: 0, reason: "no-device" };
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    webpush: {
      headers: { Urgency: "high", TTL: "86400" },
      data: { title: message.title, body: message.body, url: message.url || "/", tag: message.tag || "pcosphere-hint" },
    },
  });
  // Forget phones that have uninstalled or revoked permission
  const dead = res.responses
    .map((r, i) => (!r.success && ["messaging/registration-token-not-registered", "messaging/invalid-registration-token", "messaging/invalid-argument"].includes(r.error?.code) ? tokens[i] : null))
    .filter(Boolean);
  if (dead.length) await ref.update({ pushTokens: admin.firestore.FieldValue.arrayRemove(...dead) });
  return { sent: res.successCount, failed: res.failureCount, errors: [...new Set(res.responses.filter((r) => !r.success).map((r) => r.error?.code))] };
}

module.exports = { sendToUser, DISCREET };
