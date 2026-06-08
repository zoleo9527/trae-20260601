const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../database");
const router = express.Router();
router.get("/", (req, res) => {
  const releases = db.prepare("SELECT * FROM releases ORDER BY created_at DESC").all();
  res.json(releases);
});
router.get("/:id", (req, res) => {
  const release = db.prepare("SELECT * FROM releases WHERE id = ?").get(req.params.id);
  if (!release) return res.status(404).json({ error: "放行记录不存在" });
  res.json(release);
});
router.post("/", (req, res) => {
  const { batch_id, released_by, quantity, destination, remark } = req.body;
  const id = uuidv4();
  db.prepare("INSERT INTO releases (id, batch_id, released_by, quantity, destination, remark) VALUES (?, ?, ?, ?, ?, ?)").run(id, batch_id, released_by, quantity, destination, remark);
  const release = db.prepare("SELECT * FROM releases WHERE id = ?").get(id);
  res.status(201).json(release);
});
router.put("/:id", (req, res) => {
  const { batch_id, released_by, quantity, destination, remark } = req.body;
  const info = db.prepare("UPDATE releases SET batch_id = ?, released_by = ?, quantity = ?, destination = ?, remark = ? WHERE id = ?").run(batch_id, released_by, quantity, destination, remark, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "放行记录不存在" });
  const release = db.prepare("SELECT * FROM releases WHERE id = ?").get(req.params.id);
  res.json(release);
});
router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM releases WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "放行记录不存在" });
  res.status(204).send();
});
module.exports = router;
