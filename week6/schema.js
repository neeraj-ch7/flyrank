const { z } = require("zod");

const CATEGORIES = ["fiction", "nonfiction", "poetry", "childrens", "reference", "other"];
const QUALITY_FLAGS = ["thin_description", "mismatched_title", "non_english", "placeholder_text"];

const EnrichInputSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(4000).nullable().optional(),
});

const EnrichOutputSchema = z.object({
  category: z.enum(CATEGORIES),
  summary: z.string().min(1).max(280),
  quality_flags: z.array(z.enum(QUALITY_FLAGS)),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(300),
});

// A fixed, schema-valid response for LLM_STUB=1 — no model call made.
const STUB_RESPONSE = {
  category: "fiction",
  summary: "A stub response used for local development without calling the model.",
  quality_flags: [],
  confidence: 0.42,
  reason: "This is stub mode; no model was called.",
};

module.exports = { EnrichInputSchema, EnrichOutputSchema, STUB_RESPONSE, CATEGORIES, QUALITY_FLAGS };
