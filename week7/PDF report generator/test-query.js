const { getReportData } = require("./query");

const data = getReportData();
console.log(JSON.stringify(data, null, 2));

// sanity check called out in the assignment: no single product's revenue
// should exceed total revenue
const maxProductRevenue = Math.max(...data.topProducts.map((p) => p.revenue));
if (maxProductRevenue > data.totalRevenue) {
  console.error("BUG: a product's revenue exceeds total revenue — check the query");
  process.exit(1);
}
console.log("\nSanity check passed: no product revenue exceeds total revenue.");
