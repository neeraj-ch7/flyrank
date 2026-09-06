const express = require("express");
const fs = require("fs");
const path = require("path");
const { EnrichInputSchema, STUB_RESPONSE } = require("../llm/schema");
const { callModel } = require("../llm/client");
const { tryParseAndValidate, writeQuarantine } = require("../llm/parse");
const { withRetry } = require("../llm/retry");
const { logCall, PROMPT_VERSION } = require("../llm/costLog");

const router = express.Router();

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, "..", "..", "prompts", "enrich-v1.md"),
  "utf8"
);

router.post("/enrich", async (req, res) => {
  // Stage 1 — validate input before spending a single model call.
  const inputResult = EnrichInputSchema.safeParse(req.body);
  if (!inputResult.success) {
    const issue = inputResult.error.issues[0];
    return res.status(400).json({ error: `Invalid field '${issue.path.join(".")}': ${issue.message}` });
  }
  const input = inputResult.data;

  // Stage 1 — stub mode, zero model calls.
  if (process.env.LLM_STUB === "1") {
    return res.status(200).json(STUB_RESPONSE);
  }

  // Stage 4 — kill switch.
  if (process.env.LLM_ENABLED === "false") {
    return res.status(503).json({ error: "LLM feature is currently disabled" });
  }

  try {
    // First attempt.
    let call = await withRetry(() => callModel(SYSTEM_PROMPT, input));
    logCall({ model: call.usage ? call.model : undefined, usage: call.usage, durationMs: call.durationMs, repaired: false });

    let result = tryParseAndValidate(call.text);

    if (!result.ok) {
      // Stage 3 — repair retry: hand the model its own error, exactly once.
      const repairPrompt = `Your previous answer was rejected for this reason: "${result.error}". Return only corrected JSON matching the schema.`;
      call = await withRetry(() =>
        callModel(SYSTEM_PROMPT, { ...input, __previous_error__: repairPrompt, __previous_output__: call.text })
      );
      logCall({ usage: call.usage, durationMs: call.durationMs, repaired: true });
      result = tryParseAndValidate(call.text);
    }

    if (!result.ok) {
      writeQuarantine({
        input,
        error: result.error,
        prompt_version: PROMPT_VERSION,
        timestamp: new Date().toISOString(),
      });
      return res.status(422).json({ error: "Model output could not be validated after one repair attempt" });
    }

    return res.status(200).json(result.record);
  } catch (err) {
    if (err?.name === "APIConnectionTimeoutError" || err?.code === "ETIMEDOUT") {
      return res.status(504).json({ error: "Model call timed out" });
    }
    console.error("enrich route error:", err.message);
    return res.status(502).json({ error: "Upstream model call failed" });
  }
});

module.exports = router;
