import { initDb, backfillExceptionSourceIds } from './server/db.js';
import { seedData } from './server/seed.js';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'server', 'farm.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// 查看当前 egg_record 异常的 source_id
function showState(label) {
  console.log(`\n=== ${label} ===`);
  const rows = db.prepare(`
    SELECT e.id, e.source_id, e.house_id, h.code, e.status, e.description, e.created_at,
           er.date as er_date, er.shift as er_shift, er.status as er_status
    FROM exceptions e
    LEFT JOIN egg_records er ON er.id = e.source_id
    LEFT JOIN houses h ON h.id = e.house_id
    WHERE e.source_type = 'egg_record'
    ORDER BY e.id
  `).all();
  rows.forEach(r => console.log(
    `  #${r.id} (${r.code}) source_id=${r.source_id} ` +
    `→ ${r.er_date || 'NULL'} ${r.er_shift || ''} ${r.er_status || ''}`
  ));
}

// 1. 先看 seed 后的初始状态
initDb();
seedData();
showState('seed 后初始状态');

// 2. 模拟旧库：全部置空 + 一个误匹配（B1 匹配到今日 pending）
const info1 = db.prepare(`
  UPDATE exceptions SET source_id = NULL, updated_at = datetime('now','localtime')
  WHERE source_type = 'egg_record' AND id IN (3, 6)
`).run();

// 把 B1 (#4) 误匹配到今日 morning 的 pending 记录
const todayPending = db.prepare(`
  SELECT id FROM egg_records
  WHERE house_id = (SELECT id FROM houses WHERE code = 'B1')
    AND date = date('now','localtime')
    AND shift = 'morning'
    AND status = 'pending'
  LIMIT 1
`).get();
if (todayPending) {
  db.prepare(`
    UPDATE exceptions SET source_id = ?, updated_at = datetime('now','localtime')
    WHERE id = 4
  `).run(todayPending.id);
  console.log(`\n[模拟误匹配] B1 异常 #4 source_id 误设为今日 pending #${todayPending.id}`);
}

showState('模拟旧库后（2个null + 1个误匹配）');

// 3. 运行回填
const result = backfillExceptionSourceIds();
console.log(`\n[回填结果] 补回: ${result.fixedNull}, 纠正: ${result.corrected}, 总数: ${result.total}`);

// 4. 最终状态
showState('回填后最终状态');

// 5. 验证
const final = db.prepare(`
  SELECT e.id, e.source_id, h.code, er.date, er.shift, er.status as er_status
  FROM exceptions e
  JOIN egg_records er ON er.id = e.source_id
  JOIN houses h ON h.id = e.house_id
  WHERE e.source_type = 'egg_record'
  ORDER BY e.id
`).all();

let allOk = true;
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yStr = yesterday.toISOString().slice(0, 10);

console.log('\n=== 验证 ===');
final.forEach(r => {
  const isYesterday = r.date === yStr;
  const ok = isYesterday;
  console.log(`  #${r.id} (${r.code}) → #${r.source_id} ${r.date} ${r.shift} ${r.er_status} ${ok ? '✓' : '✗ 不是昨日!'}`);
  if (!ok) allOk = false;
});

console.log(allOk ? '\n✅ 全部正确匹配到昨日记录！' : '\n❌ 有匹配错误！');

db.close();
