// query.js — turns 200 rows into the four numbers a report actually needs.

const { getDb } = require("../db");

function getReportData() {
  const db = getDb();

  const totals = db
    .prepare("SELECT COUNT(*) AS totalOrders, SUM(amount) AS totalRevenue FROM orders")
    .get();

  const topProducts = db
    .prepare(
      `SELECT product, SUM(amount) AS revenue
       FROM orders
       GROUP BY product
       ORDER BY revenue DESC
       LIMIT 5`
    )
    .all();

  const ordersPerDay = db
    .prepare(
      `SELECT created_at AS date, COUNT(*) AS count
       FROM orders
       WHERE created_at >= date('now', '-7 days')
       GROUP BY created_at
       ORDER BY created_at ASC`
    )
    .all();

  db.close();

  return {
    totalOrders: totals.totalOrders,
    totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
    topProducts,
    ordersPerDay,
  };
}

module.exports = { getReportData };
