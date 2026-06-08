const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../database");
const router = express.Router();
router.get("/", (req, res) => {
  const rejections = db.prepare("SELECT * FROM rejections ORDER BY created_at DESC").all();
  res.json(rejections);
});
router.get("/:id", (req, res) => {
  const rejection = db.prepare("SELECT * FROM rejections WHERE id = ?").get(req.params.id);
  if (!rejection) return res.status(404).json({ error: "退回记录不存在" });
  res.json(rejection);
});
router.post("/", (req, res) => {
  const { batch_id, rejected_by, reason, quantity, handling, remark } = req.body;
  const id = uuidv4();
  db.prepare("INSERT INTO rejections (id, batch_id, rejected_by, reason, quantity, handling, remark) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, batch_id, rejected_by, reason, quantity, handling, remark);
  const rejection = db.prepare("SELECT * FROM rejections WHERE id = ?").get(id);
  res.status(201).json(rejection);
});
router.put("/:id", (req, res) => {
  const { batch_id, rejected_by, reason, quantity, handling, remark } = req.body;
  const info = db.prepare("UPDATE rejections SET batch_id = ?, rejected_by = ?, reason = ?, quantity = ?, handling = ?, remark = ? WHERE id = ?").run(batch_id, rejected_by, reason, quantity, handling, remark, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "退回记录不存在" });
  const rejection = db.prepare("SELECT * FROM rejections WHERE id = ?").get(req.params.id);
  res.json(rejection);
});
router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM rejections WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "退回记录不存在" });
  res.status(204).send();
});
module.exports = router;
