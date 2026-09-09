// db.js — uses Node's built-in node:sqlite (no install needed).
// Node flags this as experimental; it's stable enough for this assignment
// and avoids adding a dependency for something the runtime already ships.

const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "report.db");

function getDb() {
  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer TEXT NOT NULL,
      product TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  return db;
}

module.exports = { getDb, DB_PATH };
