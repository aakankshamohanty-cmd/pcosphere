// Reads the FIREBASE_SERVICE_ACCOUNT secret robustly.
// Pasting a multi-line JSON file into a one-line box can double it up or turn line breaks into real newlines,
// so we try a few safe repairs before giving up. Nothing here ever logs or returns the secret itself.

function tryParse(text) {
  try {
    const sa = JSON.parse(text);
    return sa && sa.private_key && sa.client_email ? sa : null;
  } catch {
    return null;
  }
}

// Real newlines inside the private key break JSON; turn them back into \n escapes
function escapeKeyNewlines(text) {
  return text.replace(/("private_key"\s*:\s*")([\s\S]*?)(")/, (m, a, key, z) => a + key.replace(/\r?\n/g, "\\n") + z);
}

function parseServiceAccount(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  const attempts = [text, escapeKeyNewlines(text)];
  for (const t of attempts) {
    const whole = tryParse(t);
    if (whole) return whole;
    // If it was pasted twice, the first complete {...} block is a full copy
    for (let i = t.indexOf("}"); i !== -1; i = t.indexOf("}", i + 1)) {
      const part = tryParse(t.slice(0, i + 1));
      if (part) return part;
    }
  }
  return null;
}

module.exports = { parseServiceAccount };
