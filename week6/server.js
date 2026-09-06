// server.js
// Same CRUD API surface as Assignment 1, but every endpoint now
// reads/writes through SQLite instead of an in-memory array.

require("dotenv").config();
const express = require("express");
const db = require("./db");
const enrichRouter = require("./src/routes/enrich");

const app = express();
app.use(express.json());
app.use(enrichRouter);

const PORT = process.env.PORT || 3000;

// Converts a raw SQLite row (done stored as 0/1) into the JSON
// shape clients expect (done as a real boolean).
function serializeTask(row) {
  return {
    id: row.id,
    title: row.title,
    done: !!row.done,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---------- GET /tasks ----------
// Optional extras supported via query params:
//   ?search=milk   -> SQL LIKE search on title
//   ?done=true     -> filter by completion status
//   ?sort=title    -> order alphabetically by title
app.get("/tasks", (req, res) => {
  const { search, done, sort } = req.query;

  let sql = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

  if (search !== undefined) {
    sql += " AND title LIKE ?";
    params.push(`%${search}%`);
  }

  if (done !== undefined) {
    if (done !== "true" && done !== "false") {
      return res
        .status(400)
        .json({ error: "done must be 'true' or 'false'" });
    }
    sql += " AND done = ?";
    params.push(done === "true" ? 1 : 0);
  }

  sql += sort === "title" ? " ORDER BY title ASC" : " ORDER BY id ASC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serializeTask));
});

// ---------- GET /stats (optional extra) ----------
// Uses SQL COUNT() instead of counting in JavaScript.
app.get("/stats", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS count FROM tasks").get().count;
  const completed = db
    .prepare("SELECT COUNT(*) AS count FROM tasks WHERE done = 1")
    .get().count;
  const pending = total - completed;

  res.json({ total, completed, pending });
});

// ---------- GET /tasks/:id ----------
app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!row) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json(serializeTask(row));
});

// ---------- POST /tasks ----------
app.post("/tasks", (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  const done = req.body.done ? 1 : 0;

  const result = db
    .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
    .run(title.trim(), done);

  const newRow = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(serializeTask(newRow));
});

// ---------- PUT /tasks/:id ----------
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!existing) {
    return res.status(404).json({ error: "Task not found" });
  }

  const { title, done } = req.body;

  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    return res.status(400).json({ error: "Title must be a non-empty string" });
  }
  if (done !== undefined && typeof done !== "boolean") {
    return res.status(400).json({ error: "done must be a boolean" });
  }

  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newDone = done !== undefined ? (done ? 1 : 0) : existing.done;

  db.prepare(
    "UPDATE tasks SET title = ?, done = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(newTitle, newDone, id);

  const updatedRow = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(serializeTask(updatedRow));
});

// ---------- DELETE /tasks/:id ----------
app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!existing) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Task API (SQLite-backed) running on http://localhost:${PORT}`);
});
