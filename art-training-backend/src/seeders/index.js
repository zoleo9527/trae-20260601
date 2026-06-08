const { v4: uuidv4 } = require('uuid');
const { db, initDatabase } = require('../database');

function seed() {
  console.log('开始初始化数据库...');
  initDatabase();
  console.log('清空现有数据...');
  db.exec('DELETE FROM rejections');
  db.exec('DELETE FROM releases');
  db.exec('DELETE FROM cutting_tasks');
  db.exec('DELETE FROM inspections');
  db.exec('DELETE FROM batches');
  console.log('插入种子数据...');

  const b1 = uuidv4();
  db.prepare('INSERT INTO batches (id, batch_number, supplier, product_type, quantity, unit, temperature, weight, specification, status, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(b1, 'B202401001', '顺鑫农业', '冷鲜猪肉', 500, 'kg', 8.5, 502.3, '标准白条猪', 'rejected', '温度异常');
  const insp1 = uuidv4();
  db.prepare('INSERT INTO inspections (id, batch_id, inspector, temperature, weight, appearance, packaging, result, issues, quarantine_cert, storage_decision, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(insp1, b1, '张检验员', 8.5, 502.3, '正常', '完好', 'rejected', '温度超标', null, 'reject', '建议退回');
  db.prepare('INSERT INTO rejections (id, batch_id, rejected_by, reason, quantity, handling, remark) VALUES (?,?,?,?,?,?,?)').run(uuidv4(), b1, '李主管', '温度异常', 500, '退回', '已通知');
  console.log('  - 温度异常批次');

  const b2 = uuidv4();
  db.prepare('INSERT INTO batches (id, batch_number, supplier, product_type, quantity, unit, temperature, weight, specification, status, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(b2, 'B202401002', '鹏程食品', '冷鲜牛肉', 300, 'kg', 2.8, 315.6, '优质牛里脊', 'processing', '重量差异');
  const insp2 = uuidv4();
  db.prepare('INSERT INTO inspections (id, batch_id, inspector, temperature, weight, appearance, packaging, result, issues, quarantine_cert, storage_decision, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(insp2, b2, '王检验员', 2.8, 315.6, '良好', '完好', 'conditional', '超重15.6kg', 'QC-20240102', 'cold_storage', '主管确认');
  const ic2 = JSON.stringify({ result: 'conditional', storage_decision: 'cold_storage', issues: '超重15.6kg' });
  db.prepare('INSERT INTO cutting_tasks (id, batch_id, task_number, target_specification, target_quantity, assignee, inspection_id, inspection_conclusion, spec_adjustment, status, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(uuidv4(), b2, 'T202401001', '200g精包装', 300, '分割一组', insp2, ic2, null, 'processing', '按实际重量');
  console.log('  - 重量差异批次');

  const b3 = uuidv4();
  db.prepare('INSERT INTO batches (id, batch_number, supplier, product_type, quantity, unit, temperature, weight, specification, status, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(b3, 'B202401003', '二商肉食', '冷鲜羊肉', 200, 'kg', 3.2, 199.8, '标准羊排', 'processing', '临时改规格');
  const insp3 = uuidv4();
  db.prepare('INSERT INTO inspections (id, batch_id, inspector, temperature, weight, appearance, packaging, result, issues, quarantine_cert, storage_decision, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(insp3, b3, '赵检验员', 3.2, 199.8, '良好', '正常', 'passed', '', 'QC-20240103', 'cold_storage', '合格');
  const ic3 = JSON.stringify({ result: 'passed', storage_decision: 'cold_storage', issues: '' });
  db.prepare('INSERT INTO cutting_tasks (id, batch_id, task_number, target_specification, target_quantity, assignee, inspection_id, inspection_conclusion, spec_adjustment, status, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(uuidv4(), b3, 'T202401002', '500g家庭装', 200, '分割二组', insp3, ic3, '原500g家庭装改为250g小包装，新增羊蝎子1kg×50包', 'pending', '销售部改规格');
  console.log('  - 临时改规格批次');

  const b4 = uuidv4();
  db.prepare('INSERT INTO batches (id, batch_number, supplier, product_type, quantity, unit, temperature, weight, specification, status, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(b4, 'B202401004', '中粮肉食', '冷鲜鸡肉', 400, 'kg', 2.5, 400.2, '标准整鸡', 'completed', '正常完成');
  const insp4 = uuidv4();
  db.prepare('INSERT INTO inspections (id, batch_id, inspector, temperature, weight, appearance, packaging, result, issues, quarantine_cert, storage_decision, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(insp4, b4, '张检验员', 2.5, 400.2, '正常', '完好', 'passed', '', 'QC-20240104', 'cold_storage', '正常');
  const ic4 = JSON.stringify({ result: 'passed', storage_decision: 'cold_storage', issues: '' });
  db.prepare('INSERT INTO cutting_tasks (id, batch_id, task_number, target_specification, target_quantity, assignee, inspection_id, inspection_conclusion, spec_adjustment, status, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(uuidv4(), b4, 'T202401003', '分割鸡块', 400, '分割三组', insp4, ic4, null, 'completed', '正常完成');
  db.prepare('INSERT INTO releases (id, batch_id, released_by, quantity, destination, remark) VALUES (?,?,?,?,?,?)').run(uuidv4(), b4, '仓库管理员', 400, '生鲜配送中心', '已放行');
  console.log('  - 正常完成批次');
  const bc = db.prepare('SELECT COUNT(*) as c FROM batches').get().c;
  const ic = db.prepare('SELECT COUNT(*) as c FROM inspections').get().c;
  const tc = db.prepare('SELECT COUNT(*) as c FROM cutting_tasks').get().c;
  const rc = db.prepare('SELECT COUNT(*) as c FROM releases').get().c;
  const rjc = db.prepare('SELECT COUNT(*) as c FROM rejections').get().c;

  console.log('');
  console.log('种子数据插入完成！');
  console.log('  批次:', bc, '验收:', ic, '任务:', tc, '放行:', rc, '退回:', rjc);
  console.log('');
  const batchList = db.prepare('SELECT * FROM batches ORDER BY batch_number').all();
  console.log('===== 批次摘要 =====');
  for (const b of batchList) {
    const latestInsp = db.prepare('SELECT * FROM inspections WHERE batch_id = ? ORDER BY created_at DESC LIMIT 1').get(b.id);
    const taskCount = db.prepare('SELECT COUNT(*) as c FROM cutting_tasks WHERE batch_id = ?').get(b.id).c;
    const hasRelease = db.prepare('SELECT COUNT(*) as c FROM releases WHERE batch_id = ?').get(b.id).c > 0;
    const hasRejection = db.prepare('SELECT COUNT(*) as c FROM rejections WHERE batch_id = ?').get(b.id).c > 0;
    const adjCount = db.prepare("SELECT COUNT(*) as c FROM cutting_tasks WHERE batch_id = ? AND spec_adjustment IS NOT NULL AND spec_adjustment != ''").get(b.id).c;
    const inspResult = latestInsp ? latestInsp.result : 'none';
    const storageDec = latestInsp ? latestInsp.storage_decision : 'none';
    const tags = [];
    if (hasRelease) tags.push('已放行');
    if (hasRejection) tags.push('已退回');
    const summaryStr = 'insp=' + inspResult + ' storage=' + storageDec + ' tasks=' + taskCount + ' adj=' + adjCount + ' ' + tags.join(',');
    console.log('  ' + b.batch_number + ' | ' + summaryStr);
  }
    console.log('====================');

    const abnormalBatches = batchList.filter(b => {
      const latestInsp = db.prepare('SELECT * FROM inspections WHERE batch_id = ? ORDER BY created_at DESC LIMIT 1').get(b.id);
      const hasRejectedInsp = latestInsp && latestInsp.result === 'rejected';
      const hasRejections = db.prepare('SELECT COUNT(*) as c FROM rejections WHERE batch_id = ?').get(b.id).c > 0;
      return hasRejectedInsp || hasRejections;
    }).length;

    const pendingDispatchTasks = db.prepare("SELECT * FROM cutting_tasks WHERE status = 'pending'").all().filter(t => {
      try { const p = JSON.parse(t.inspection_conclusion || '{}'); return p.result === 'passed' || p.result === 'conditional'; } catch(e) { return false; }
    }).length;

    console.log('  异常批次数:', abnormalBatches);
    console.log('  待派工任务数:', pendingDispatchTasks);
  }

  seed();
