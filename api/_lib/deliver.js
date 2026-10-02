// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// Delivers pending "later" hints whose time has come, and sends each person a discreet push.
// Shared by the scheduler (/api/deliver), the person's inbox and the demo "deliver now" shortcut.

const { admin, db } = require("./firebase");
const { sendToUser } = require("./push");

const ms = (ts) => ts?.toMillis?.() || 0;

async function deliverDue(query) {
  const snap = await query.where("delivered", "==", false).get();
  const now = Date.now();
  const due = snap.docs.filter((d) => ms(d.data().deliverAt) <= now);
  if (!due.length) return [];

  const delivered = [];
  for (const d of due) {
    const h = d.data();
    const link = await db().collection("links").doc(h.linkId).get();
    if (!link.exists || !link.data().active) {
      // Unlinked in the meantime: the hint quietly expires and is never shown
      await d.ref.update({ delivered: true, cancelled: true, deliveredAt: admin.firestore.FieldValue.serverTimestamp() });
      continue;
    }
    await d.ref.update({ delivered: true, deliveredAt: admin.firestore.FieldValue.serverTimestamp() });
    delivered.push({ id: d.id, ...h });
  }
  // One discreet notification per person, even if several hints arrive together
  const people = [...new Set(delivered.map((h) => h.supporterUid))];
  await Promise.all(people.map((uid) => sendToUser(uid).catch(() => null)));
  return delivered;
}

module.exports = { deliverDue };
