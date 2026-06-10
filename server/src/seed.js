const db = require('./db');
const { generateNo, logAudit } = require('./utils');

function seed() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  const receptions = [
    {
      group_name: '阳光小学三年级亲子团',
      contact_person: '王老师',
      contact_phone: '13900139001',
      people_count: 45,
      scheduled_date: today,
      scheduled_time: '09:00',
      source: '学校合作',
      status: 'pending',
      remark: '有3个小朋友对桃子过敏，请留意'
    },
    {
      group_name: '夕阳红老年旅行团',
      contact_person: '张团长',
      contact_phone: '13900139002',
      people_count: 28,
      scheduled_date: today,
      scheduled_time: '10:30',
      source: '旅行社',
      status: 'assigned',
      remark: '老人居多，节奏放慢'
    },
    {
      group_name: '互联网公司团建',
      contact_person: '李经理',
      contact_phone: '13900139003',
      people_count: 60,
      scheduled_date: tomorrow,
      scheduled_time: '08:30',
      source: '企业合作',
      status: 'picking',
      remark: '需要提供团队合影服务'
    },
    {
      group_name: '家庭自驾散客组',
      contact_person: '陈先生',
      contact_phone: '13900139004',
      people_count: 12,
      scheduled_date: yesterday,
      scheduled_time: '14:00',
      source: '线上平台',
      status: 'completed',
      remark: '共4个家庭'
    }
  ];

  const receptionIds = [];
  for (const rec of receptions) {
    const receptionNo = generateNo('JD');
    const stmt = db.prepare(`
      INSERT INTO receptions (
        reception_no, group_name, contact_person, contact_phone,
        people_count, scheduled_date, scheduled_time, source,
        status, remark, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      receptionNo, rec.group_name, rec.contact_person, rec.contact_phone,
      rec.people_count, rec.scheduled_date, rec.scheduled_time, rec.source,
      rec.status, rec.remark
    );
    receptionIds.push(result.lastInsertRowid);
    logAudit('reception', result.lastInsertRowid, '创建', { id: 1, name: '李客服' }, `创建接待单 ${receptionNo}`);
  }

  const taskNo1 = generateNo('RW');
  db.prepare(`
    INSERT INTO guide_tasks (
      task_no, reception_id, guide_id, assigned_by, status,
      picking_area, remark
    ) VALUES (?, ?, ?, 1, 'assigned', 'B区樱桃园', '老年团请慢节奏')
  `).run(taskNo1, receptionIds[1], 2);

  const taskNo2 = generateNo('RW');
  db.prepare(`
    INSERT INTO guide_tasks (
      task_no, reception_id, guide_id, assigned_by, status,
      picking_area, fruit_details, total_weight,
      start_time, end_time, remark
    ) VALUES (?, ?, ?, 1, 'in_progress', 'A区草莓园+D区水蜜桃',
      '[{"fruit_id":1,"fruit_name":"草莓","weight":25,"unit":"斤","price":30},{"fruit_id":5,"fruit_name":"水蜜桃","weight":40,"unit":"斤","price":20}]',
      65, datetime('now', '-2 hours'), NULL, '团队氛围很好')
  `).run(taskNo2, receptionIds[2], 3);

  const taskNo3 = generateNo('RW');
  const completedTask = db.prepare(`
    INSERT INTO guide_tasks (
      task_no, reception_id, guide_id, assigned_by, status,
      picking_area, fruit_details, total_weight,
      start_time, end_time, remark
    ) VALUES (?, ?, ?, 1, 'completed', 'C区蓝莓园',
      '[{"fruit_id":3,"fruit_name":"蓝莓","weight":30,"unit":"盒","price":25}]',
      30, datetime('now', '-1 days', '-3 hours'), datetime('now', '-1 days', '-1 hours'),
      '家庭组，小朋友很开心')
  `).run(taskNo3, receptionIds[3], 2);

  const transferNo = generateNo('CK');
  db.prepare(`
    INSERT INTO warehouse_transfers (
      transfer_no, guide_task_id, received_by, status,
      fruit_details, total_weight, received_time, stored_time,
      storage_location, remark
    ) VALUES (?, ?, 4, 'stored',
      '[{"fruit_id":3,"fruit_name":"蓝莓","weight":30,"unit":"盒","price":25}]',
      30, datetime('now', '-1 days', '-50 minutes'), datetime('now', '-1 days', '-30 minutes'),
      '冷藏库A区-03', '家庭自驾散客组交接完成')
  `).run(transferNo, completedTask.lastInsertRowid);

  db.prepare(`
    INSERT INTO attachments (biz_type, biz_id, file_name, file_path, file_size, file_type, uploaded_by)
    VALUES ('reception', ?, '现场合影.jpg', '', 2048000, 'image', 1)
  `).run(receptionIds[3]);

  db.prepare(`
    INSERT INTO attachments (biz_type, biz_id, file_name, file_path, file_size, file_type, uploaded_by)
    VALUES ('reception', ?, '预约确认单.pdf', '', 512000, 'pdf', 1)
  `).run(receptionIds[2]);

  console.log('示例数据导入完成');
  console.log(`  接待单：${receptionIds.length} 条`);
  console.log(`  向导任务：3 条`);
  console.log(`  仓库交接：1 条`);
  console.log(`  附件：2 条`);
}

try {
  seed();
} catch (e) {
  console.error('导入失败:', e);
} finally {
  db.close();
}
