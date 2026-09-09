// seed.js — inserts ~200 random orders. Deletes all rows first, so running
// this twice leaves exactly one clean copy instead of doubling the count.

const { getDb } = require("./db");

const PRODUCTS = ["Widget", "Gadget", "Doohickey", "Gizmo", "Thingamajig", "Contraption"];
const CUSTOMERS = ["Alex", "Priya", "Sam", "Jordan", "Rahul", "Meera", "Chris", "Divya"];

function randomDateInLast30Days() {
  const now = Date.now();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function seed() {
  const db = getDb();

  db.exec("DELETE FROM orders");

  const insert = db.prepare(
    "INSERT INTO orders (customer, product, amount, created_at) VALUES (?, ?, ?, ?)"
  );

  for (let i = 0; i < 200; i++) {
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const amount = Math.round((5 + Math.random() * 195) * 100) / 100;
    const createdAt = randomDateInLast30Days();
    insert.run(customer, product, amount, createdAt);
  }

  const count = db.prepare("SELECT COUNT(*) AS count FROM orders").get().count;
  console.log(`Seeded orders table. Row count: ${count}`);
  db.close();
}

seed();
