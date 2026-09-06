const fs = require("fs");
const path = require("path");
const { EnrichOutputSchema } = require("./schema");

const QUARANTINE_FILE = path.join(__dirname, "..", "..", "logs", "quarantine.jsonl");

// Models sometimes wrap JSON in a code fence or add "Sure! Here's the JSON:"
// in front. Strip that noise before parsing.
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;
  return candidate.slice(firstBrace, lastBrace + 1);
}

function tryParseAndValidate(rawText) {
  const jsonText = extractJson(rawText);
  if (!jsonText) {
    return { ok: false, error: "No JSON object found in model output" };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return { ok: false, error: `JSON.parse failed: ${err.message}` };
  }

  const result = EnrichOutputSchema.safeParse(parsed);
  if (!result.success) {
    const reason = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { ok: false, error: reason };
  }

  return { ok: true, record: result.data };
}

function writeQuarantine(entry) {
  fs.mkdirSync(path.dirname(QUARANTINE_FILE), { recursive: true });
  fs.appendFileSync(QUARANTINE_FILE, JSON.stringify(entry) + "\n");
}

module.exports = { tryParseAndValidate, writeQuarantine };
