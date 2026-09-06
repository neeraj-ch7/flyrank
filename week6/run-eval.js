// scripts/run-eval.js — runs evals/cases.json against the running server
// and reports how many matched on category (the key field).

require("dotenv").config();
const cases = require("../evals/cases.json");

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
  let passed = 0;
  const failures = [];

  for (const testCase of cases) {
    const res = await fetch(`${BASE_URL}/enrich`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCase.input),
    });
    const body = await res.json();

    const matched = res.status === 200 && body.category === testCase.expected_category;
    if (matched) {
      passed += 1;
    } else {
      failures.push({ name: testCase.name, expected: testCase.expected_category, got: body });
    }
  }

  console.log(`\n${passed}/${cases.length} matched on category`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`- ${f.name}: expected "${f.expected}", got:`, JSON.stringify(f.got));
    }
  }
}

main().catch((err) => {
  console.error("Eval run crashed:", err);
  process.exit(1);
});
