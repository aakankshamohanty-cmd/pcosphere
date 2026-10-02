// GET /api/health
// A safe diagnostic: says which setup step works, without ever revealing a secret or its contents.

const { parseServiceAccount } = require("./_lib/service-account");

module.exports = async function handler(req, res) {
  const out = { geminiKey: !!process.env.GEMINI_API_KEY, groqKey: !!process.env.GROQ_API_KEY, cronSecret: !!process.env.CRON_SECRET };
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  // Only counts and yes/no answers, never content
  out.serviceAccount = {
    present: !!raw,
    length: raw.length,
    copiesOfFile: (raw.match(/"type"\s*:\s*"service_account"/g) || []).length,
    realNewlines: (raw.match(/\n/g) || []).length,
  };
  const sa = parseServiceAccount(raw);
  out.serviceAccount.readable = !!sa;
  if (sa) out.serviceAccount.projectId = sa.project_id;

  if (sa) {
    try {
      const { db } = require("./_lib/firebase");
      await db().collection("health").doc("ping").get();
      out.firestore = "ok";
    } catch (e) {
      out.firestore = { code: e.code ?? null, kind: e.constructor?.name || "Error" };
    }
  }
  res.status(200).json(out);
};
