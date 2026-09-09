// render.js — builds the HTML template, then asks headless Chromium to
// "print" it to PDF. The page-break fix (tr { break-inside: avoid }, thead
// repeating per page) is baked in from the start, per the assignment's
// Stage 3 checkpoint.

const { chromium } = require("playwright");

function buildHtml(reportData, allOrders) {
  const today = new Date().toISOString().slice(0, 10);

  const topProductRows = reportData.topProducts
    .map((p) => `<tr><td>${p.product}</td><td>$${p.revenue.toFixed(2)}</td></tr>`)
    .join("");

  const allOrderRows = allOrders
    .map(
      (o) =>
        `<tr><td>${o.id}</td><td>${o.customer}</td><td>${o.product}</td><td>$${o.amount.toFixed(2)}</td><td>${o.created_at}</td></tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, sans-serif; color: #1A1A1A; padding: 20px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .date { color: #666; font-size: 13px; margin-bottom: 20px; }
  .totals { display: flex; gap: 40px; margin-bottom: 24px; }
  .totals div { font-size: 14px; }
  .totals strong { display: block; font-size: 20px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #ddd; font-size: 12px; }
  th { background: #f4f4f4; }
  h2 { font-size: 16px; margin-top: 28px; }
  /* the Stage 3 page-break fix */
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
</style>
</head>
<body>
  <h1>Sales Report</h1>
  <div class="date">Generated ${today}</div>

  <div class="totals">
    <div>Total orders<strong>${reportData.totalOrders}</strong></div>
    <div>Total revenue<strong>$${reportData.totalRevenue.toFixed(2)}</strong></div>
  </div>

  <h2>Top 5 products by revenue</h2>
  <table>
    <thead><tr><th>Product</th><th>Revenue</th></tr></thead>
    <tbody>${topProductRows}</tbody>
  </table>

  <h2>All orders (${allOrders.length})</h2>
  <table>
    <thead><tr><th>ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Date</th></tr></thead>
    <tbody>${allOrderRows}</tbody>
  </table>
</body>
</html>`;
}

async function renderPdf(html, outputPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: outputPath, format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
}

module.exports = { buildHtml, renderPdf };
