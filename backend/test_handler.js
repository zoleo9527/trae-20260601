const Database = require('better-sqlite3');
const db = new Database('./aquafarm.db');

// 找一个单子
const testCase = db.prepare('SELECT * FROM disease_cases WHERE status = "CLOSED" LIMIT 1').get();
console.log('测试病害单:', testCase.case_no, '原状态:', testCase.status);

// 把状态改成 SUBMITTED，handler_role 改成 WAREHOUSE_KEEPER
db.prepare('UPDATE disease_cases SET status = "SUBMITTED", current_handler_role = "WAREHOUSE_KEEPER" WHERE id = ?').run(testCase.id);
console.log('已修改为: SUBMITTED, handler_role: WAREHOUSE_KEEPER');
console.log('CASE_ID:', testCase.id);
