const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../database");
const router = express.Router();
router.get("/", (req, res) => {
  const inspections = db.prepare("SELECT * FROM inspections ORDER BY created_at DESC").all();
  res.json(inspections);
});
router.get("/:id", (req, res) => {
  const inspection = db.prepare("SELECT * FROM inspections WHERE id = ?").get(req.params.id);
  if (!inspection) return res.status(404).json({ error: "验收记录不存在" });
  res.json(inspection);
});
router.post("/", (req, res) => {
  const { batch_id, inspector, temperature, weight, appearance, packaging, result, issues, remark } = req.body;
  const id = uuidv4();
  db.prepare("INSERT INTO inspections (id, batch_id, inspector, temperature, weight, appearance, packaging, result, issues, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, batch_id, inspector, temperature, weight, appearance, packaging, result, issues, remark);
  const inspection = db.prepare("SELECT * FROM inspections WHERE id = ?").get(id);
  res.status(201).json(inspection);
});
router.put("/:id", (req, res) => {
  const { batch_id, inspector, temperature, weight, appearance, packaging, result, issues, remark } = req.body;
  const info = db.prepare("UPDATE inspections SET batch_id = ?, inspector = ?, temperature = ?, weight = ?, appearance = ?, packaging = ?, result = ?, issues = ?, remark = ? WHERE id = ?").run(batch_id, inspector, temperature, weight, appearance, packaging, result, issues, remark, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "验收记录不存在" });
  const inspection = db.prepare("SELECT * FROM inspections WHERE id = ?").get(req.params.id);
  res.json(inspection);
});
router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM inspections WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "验收记录不存在" });
  res.status(204).send();
});
module.exports = router;
