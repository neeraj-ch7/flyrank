const PROMPT_VERSION = "enrich-v1";

// One structured log line per model call, written to stdout per twelve-factor
// practice (never invent a log file for this — let the environment route it).
function logCall({ model, usage, durationMs, repaired }) {
  console.log(
    JSON.stringify({
      event: "llm_call",
      prompt_version: PROMPT_VERSION,
      model,
      input_tokens: usage?.prompt_tokens ?? null,
      output_tokens: usage?.completion_tokens ?? null,
      duration_ms: durationMs,
      repaired: !!repaired,
      timestamp: new Date().toISOString(),
    })
  );
}

module.exports = { logCall, PROMPT_VERSION };
