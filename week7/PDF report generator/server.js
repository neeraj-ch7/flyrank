const express = require("express");
const reportsRouter = require("./routes/reports");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(reportsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PDF report generator running on http://localhost:${PORT}`);
});
