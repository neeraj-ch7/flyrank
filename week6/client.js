const OpenAI = require("openai");

// Explicit 30s timeout — the SDK default is 10 minutes, which is not a
// real timeout for an HTTP endpoint. maxRetries is set to 0 here because
// we implement our own retry policy (Stage 4) instead of relying on the
// SDK's silent default of retrying twice.
const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
  timeout: 30000,
  maxRetries: 0,
});

const MODEL = process.env.LLM_MODEL;

async function callModel(systemPrompt, userContent) {
  const start = Date.now();
  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      // user content is JSON-encoded so it cannot break out of its own
      // quotes and is never concatenated into the system prompt — the two
      // cheap prompt-injection defenses from Stage 2.
      { role: "user", content: JSON.stringify(userContent) },
    ],
  });

  return {
    text: res.choices[0].message.content,
    usage: res.usage,
    durationMs: Date.now() - start,
  };
}

module.exports = { callModel, MODEL };
