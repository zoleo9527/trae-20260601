const Database = require('better-sqlite3');
const db = new Database('./aquafarm.db');

// 找一个 CLOSED 的单子，改成 MEDICINE_ALLOCATED 状态，但 handler_role 故意设成 TECHNICIAN（不对的）
const testCase = db.prepare('SELECT * FROM disease_cases WHERE status = "CLOSED" LIMIT 1').get();
console.log('测试病害单:', testCase.case_no);

// 把状态改成 MEDICINE_ALLOCATED，但 handler_role 设为 TECHNICIAN（模拟数据错乱或绕过流程）
db.prepare('UPDATE disease_cases SET status = "MEDICINE_ALLOCATED", current_handler_role = "TECHNICIAN" WHERE id = ?').run(testCase.id);
console.log('已设置: status=MEDICINE_ALLOCATED, current_handler_role=TECHNICIAN（错误的，应该是FIELD_MANAGER）');
console.log('CASE_ID:', testCase.id);
