// GET /api/deliver?key=CRON_SECRET  (called every minute by cron-job.org)
// Finds "gentle nudge later" hints whose random 20–60 minute delay is up, delivers them and sends a discreet push.

const { db } = require("./_lib/firebase");
const { deliverDue } = require("./_lib/deliver");

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const given = req.query?.key || (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!secret || given !== secret) return res.status(401).json({ error: "Not allowed" });
  try {
    const delivered = await deliverDue(db().collection("hints"));
    return res.status(200).json({ delivered: delivered.length });
  } catch (e) {
    console.error("deliver failed", e.message);
    return res.status(500).json({ error: "deliver failed" });
  }
};
