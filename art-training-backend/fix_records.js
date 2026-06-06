const fs = require("fs");
let code = fs.readFileSync("server.js", "utf8");

// 修复1: 转化跟进记录接口 - 把 .get() 改成 .run()，并且重构操作日志写入链路
const oldFollowUpRecords = ` app.post("/api/follow-ups/:id/records", (req, res) => { const id = req.params.id; const { content, method, handler_id, next_follow_at, status } = req.body; const now = new Date().toISOString(); db.prepare("INSERT INTO follow_up_records (follow_up_id, content, method, handler_id, created_at, next_follow_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, content, method, handler_id, now, next_follow_at); const updateSql = status ? "UPDATE follow_ups SET status = ?, updated_at = ?, next_follow_at = ? WHERE id = ?" : "UPDATE follow_ups SET updated_at = ?, next_follow_at = ? WHERE id = ?"; const params = status ? [staconst fs = require("fs");
let code = fs.readFileSync("server.js", "utf8");

// 修复1: 转化跟进记录接口 - 把 .get() 改成 .run()，并且重构操作日志写入链路
const oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记录接口 - 把 .geecoconst oldFollowUpRecords = ` app.post("/api/follow-ups/:id/records", (req, res) => { const id = req.p??let code = fs.readFileSync("server.js", "utf8");

// 修复1: 转化跟进记录接口 - 把 .get() 改成 .run()，并且重构操作日志写入链路
const oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记录接口 - 把 .geecoconst oldFollowUpRecords = ` app.post("/api/follow-ups/:id/records", (req, res) => { const id = req.p??let code = fs.readFileSync("server.js", "utf8");

// 修复1: 转化跟进记录接口 - 把 .get() 改成 .run()，并且重构操作日志写入链路
const oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记录接口 - 把 .geecoconst oldFollowUpRecords = ` app.post("/api/ftu
// 修复1: 转化跟进记录接口 - 把 .ge idconst oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记录接口 - 把 .ges // 修复1: 转化跟进记录接口 - 把 .geecoconsow
// 修复1: 转化跟进记录接口 - 把 .get() 改成 .run()，并且重构操作日志写入链路
const oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记录接口 - ?idconst oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记录接口 - 把 .ge?/ 修复1: 转化跟进记录接口 - 把 .geecoconsFo
// 修复1: 转化跟进记录接口 - 把 .get() 改成 .run()，并且重构操作日志写入链路
const oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记录接口 - ? rconst oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记录接口 - 把 .ge r// 修复1: 转化跟进记录接口 - 把 .geecoconspa// 修复1: 转化跟进记录接口 - 把 .ge idconst oldFollowUpRecords =rilet code = fs.readER// 修复1: 转化跟进记录接口 - 把 .ges // 修复1: 转化跟进记录接口 - 把 .geecoconsogs// 修复1: 转化跟进记录接口 - 把 .get() 改成 .run()，并且重构操作日志写入链路teconst oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记录接口 - ?idconER// 修复1: 转化跟进记录接口 - ?idconst oldFnt// 修复1: 转化跟进记录接口 - 把 .ge?/ 修复1: 转化跟进记录接口 - 把 .geecul// 修复1: 转化跟进记录接口 - 把 .get() 改成 .run()，并且重构操作日志写入链路ogconst oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记 ?)").run(id, "follow// 修复1: 转化跟进记录接口 - ? rconst oldFor// 修复1: 转化跟进记录接口 - 把 .ge r// 修复1: 转化跟进记录接口 - 把 .geecst// 修复1: 转化跟进记录接口 - ?idconER// 修复1: 转化跟进记录接口 - ?idconst oldFnt// 修复1: 转化跟进记录接口 - 把 .ge?/ 修复1: 转化跟进记录接口 - 把 .geecul// 修复1: 转化跟进记录接口 - 把 .get() 改成 .run()，并且重构操作日志写入链路ogconst oldFollowUpRecords =rilet code = fs.readFileSy? 
// 修复1: 转化跟进记 ?)").run(id, "follow// 修复1: 转化跟进记录接口 - ? rconst oldFnt// 修复1: 转化跟进记 ?)").run(id, "follow// 修复1: 转化跟进记录接口 - ? rconst oldFor// 修复1: 转化跟进记录接口 - 把 .ge r// 修复1: 转化跟进记录接口 - 把 .geecst// 修复1: 转化跟进记录接口 - ?idconER// 修复1: 转化跟进记录接口 - ?idconst oldFnt// 修复1: 转化跟进记录接口 - 把 .ge?/ 修te// 修复1: 转化跟进记 ?)").run(id, "follow// 修复1: 转化跟进记录接口 - ? rconst oldFnt// 修复1: 转化跟进记 ?)").run(id, "follow// 修复1: 转化跟进记录接口 - ? rconst oldFor// 修复1: 转化跟进记录接口 - 把 .ge r// 修复1: 转化跟进记录接口 - 把 .geecst// 修复1: 转化跟进记录接口 - ?idconER// 修复1: 转化跟进记录接口 - ?idconst oldFnt// 修复1: 转化跟进记录接口 - 把 .ge?/ 修te// 修复1: 转化跟进记 ?)").run(id, "follow// 修复1: 转化跟进记录接口 - ? rconstmplete);

fs.writeFileSync("server.js", code);
console.log("修复完成！");
