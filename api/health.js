// GET /api/health
// A safe diagnostic: says which setup step works, without ever revealing a secret or its contents.

module.exports = async function handler(req, res) {
  const out = { geminiKey: !!process.env.GEMINI_API_KEY, groqKey: !!process.env.GROQ_API_KEY, cronSecret: !!process.env.CRON_SECRET };
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  out.serviceAccount = { present: !!raw, length: raw.length, startsWithBrace: raw.startsWith("{"), endsWithBrace: raw.endsWith("}") };

  let sa = null;
  try {
    sa = JSON.parse(raw);
    out.serviceAccount.parses = true;
    out.serviceAccount.projectId = sa.project_id || null;
    out.serviceAccount.hasPrivateKey = typeof sa.private_key === "string" && sa.private_key.includes("BEGIN PRIVATE KEY");
    out.serviceAccount.hasClientEmail = !!sa.client_email;
  } catch {
    out.serviceAccount.parses = false;
  }

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
