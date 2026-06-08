const express = require("express");
const { initDatabase } = require("./database");
const batchesRouter = require("./routes/batches");
const inspectionsRouter = require("./routes/inspections");
const cuttingTasksRouter = require("./routes/cuttingTasks");
const releasesRouter = require("./routes/releases");
const rejectionsRouter = require("./routes/rejections");

const app = express();
const PORT = process.env.PORT || 3000;

initDatabase();

app.use(express.json());

app.use("/api/batches", batchesRouter);
app.use("/api/inspections", inspectionsRouter);
app.use("/api/cutting-tasks", cuttingTasksRouter);
app.use("/api/releases", releasesRouter);
app.use("/api/rejections", rejectionsRouter);

app.get("/", (req, res) => {
  res.json({ message: "肉类分割厂管理系统 API" });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

module.exports = app;
