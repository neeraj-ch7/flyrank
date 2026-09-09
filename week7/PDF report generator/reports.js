const express = require("express");
const path = require("path");
const fs = require("fs");
const { getDb } = require("../db");
const { getReportData } = require("../report/query");
const { buildHtml, renderPdf } = require("../report/render");

const router = express.Router();
const REPORTS_DIR = path.join(__dirname, "..", "..", "reports");

router.post("/reports", async (req, res) => {
  const force = req.body?.force === true;
  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();

  // Stage 5 — idempotency: same day, same request twice -> one file.
  // Excludes 'pending' rows (a report that started rendering but failed
  // should not count as "today's report already exists").
  if (!force) {
    const existing = db
      .prepare(
        "SELECT * FROM reports WHERE date(created_at) = date(?) AND path != 'pending' ORDER BY id DESC LIMIT 1"
      )
      .get(today);
    if (existing) {
      db.close();
      return res.status(200).json({ id: existing.id, file: `/reports/${existing.id}/file` });
    }
  }

  let insertedId = null;
  try {
    const reportData = getReportData();
    const allOrders = db.prepare("SELECT * FROM orders ORDER BY id").all();
    const html = buildHtml(reportData, allOrders);

    fs.mkdirSync(REPORTS_DIR, { recursive: true });

    // insert first to get an id, then render to <id>.pdf
    const insert = db
      .prepare("INSERT INTO reports (path, created_at) VALUES (?, ?)")
      .run("pending", new Date().toISOString());
    const id = Number(insert.lastInsertRowid);
    insertedId = id;
    const filePath = path.join(REPORTS_DIR, `${id}.pdf`);

    await renderPdf(html, filePath);

    db.prepare("UPDATE reports SET path = ? WHERE id = ?").run(filePath, id);
    db.close();

    return res.status(201).json({ id, file: `/reports/${id}/file` });
  } catch (err) {
    // Clean up the pending row so a failed render never lingers as a
    // half-finished report that idempotency or GET /reports/:id could
    // stumble on.
    if (insertedId !== null) {
      db.prepare("DELETE FROM reports WHERE id = ?").run(insertedId);
    }
    db.close();
    console.error("Report generation failed:", err.message);
    return res.status(500).json({ error: "Report generation failed", detail: err.message });
  }
});

router.get("/reports/:id", (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(Number(req.params.id));
  db.close();

  if (!row) {
    return res.status(404).json({ error: "Report not found" });
  }
  return res.json({ id: row.id, file: `/reports/${row.id}/file`, created_at: row.created_at });
});

router.get("/reports/:id/file", (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(Number(req.params.id));
  db.close();

  if (!row || row.path === "pending" || !fs.existsSync(row.path)) {
    return res.status(404).json({ error: "Report file not found" });
  }
  return res.sendFile(row.path);
});

module.exports = router;
