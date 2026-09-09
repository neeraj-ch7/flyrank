const express = require("express");
const { serve } = require("inngest/express");
const { randomUUID } = require("crypto");
const { inngest } = require("./inngestClient");
const { sayHello, makeReport, heartbeat } = require("./functions");
const { reports } = require("./store");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Stage 2 — accept fast, work later.
app.post("/reports", async (req, res) => {
  const { topic } = req.body || {};

  if (!topic || typeof topic !== "string") {
    return res.status(400).json({ error: "topic is required" });
  }

  const id = randomUUID();
  reports.set(id, { id, topic, status: "pending" });

  await inngest.send({ name: "report/requested", data: { id, topic } });

  return res.status(202).json({ id, status: "pending" });
});

// Status endpoint.
app.get("/reports/:id", (req, res) => {
  const report = reports.get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  return res.json(report);
});

// Extra: control panel — list all reports and their statuses.
app.get("/reports", (req, res) => {
  return res.json(Array.from(reports.values()));
});

app.use(
  "/api/inngest",
  serve({ client: inngest, functions: [sayHello, makeReport, heartbeat] })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Background job API running on http://localhost:${PORT}`);
});
