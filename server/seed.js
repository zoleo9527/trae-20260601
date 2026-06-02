const { initDb, getDb } = require('./db');

function seed() {
  const db = initDb();

  const orderCount = db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt;
  if (orderCount > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0];
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString().split('T')[0];
  const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0];
  const weekLater = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
  const todayStr = today;

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, client_name, brand, product, sales_person, total_amount, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMaterial = db.prepare(`
    INSERT INTO materials (order_id, file_name, file_type, duration, version, status, upload_time, review_notes, reviewer, review_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (order_id, material_id, channel, time_slot, schedule_date, duration, position, status, conflict_note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBroadcast = db.prepare(`
    INSERT INTO broadcast_logs (schedule_id, actual_air_time, air_status, confirmed, confirmed_by, confirmed_time, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (order_id, material_id, action, from_status, to_status, operator, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {

    // === 场景1: 客户改版 ===
    const order1 = insertOrder.run(
      'ADS-2026-001', '星河地产', '星河湾', '夏季楼盘推广', '张明', 280000, 'revision_needed',
      '客户要求更换主视觉，从城市景观版改为家庭温馨版，已与销售确认',
      fiveDaysAgo + ' 09:00:00', yesterday + ' 14:30:00'
    );
    const orderId1 = order1.lastInsertRowid;

    const mat1v1 = insertMaterial.run(
      orderId1, '星河湾_城市景观_15s_v1.mp4', 'video', 15, 1, 'revision_needed',
      fiveDaysAgo + ' 10:00:00', '客户要求改版，更换主视觉方向', '李审核', yesterday + ' 14:30:00'
    );
    const mat1v2 = insertMaterial.run(
      orderId1, '星河湾_家庭温馨_15s_v2.mp4', 'video', 15, 2, 'pending_review',
      yesterday + ' 15:00:00', null, null, null
    );

    insertSchedule.run(orderId1, mat1v1.lastInsertRowid, '综合频道', '19:30', today, 15, 'A1', 'cancelled', null, fiveDaysAgo + ' 11:00:00');
    insertSchedule.run(orderId1, mat1v2.lastInsertRowid, '综合频道', '19:30', tomorrow, 15, 'A1', 'scheduled', null, yesterday + ' 16:00:00');
    insertSchedule.run(orderId1, mat1v2.lastInsertRowid, '影视频道', '20:00', dayAfter, 15, 'A2', 'scheduled', null, yesterday + ' 16:00:00');

    insertAudit.run(orderId1, mat1v1.lastInsertRowid, 'material_review', 'pending_review', 'revision_needed', '李审核', '客户要求改版，旧版素材退回', fiveDaysAgo + ' 14:00:00');
    insertAudit.run(orderId1, mat1v2.lastInsertRowid, 'material_upload', null, 'pending_review', '张明', '上传新版家庭温馨版素材', yesterday + ' 15:00:00');
    insertAudit.run(orderId1, null, 'order_status_change', 'in_review', 'revision_needed', '系统', '订单状态更新：等待素材审核', yesterday + ' 14:30:00');


    // === 场景2: 素材不合规 ===
    const order2 = insertOrder.run(
      'ADS-2026-002', '康美药业', '康美', '健康产品广告', '王丽', 150000, 'material_rejected',
      '素材中含有未经批准的功效宣传，需要修改后重新提交',
      threeDaysAgo + ' 10:00:00', yesterday + ' 11:00:00'
    );
    const orderId2 = order2.lastInsertRowid;

    const mat2 = insertMaterial.run(
      orderId2, '康美_健康产品_30s_v1.mp4', 'video', 30, 1, 'rejected',
      threeDaysAgo + ' 11:00:00',
      '素材第8-12秒含有"包治百病"等绝对化用语，违反《广告法》第九条；第18秒价格标识与实际不符，请修改后重新提交',
      '赵合规', yesterday + ' 11:00:00'
    );

    insertSchedule.run(orderId2, mat2.lastInsertRowid, '生活频道', '18:30', today, 30, 'B1', 'cancelled', '素材审核未通过，排期取消', threeDaysAgo + ' 12:00:00');

    insertAudit.run(orderId2, mat2.lastInsertRowid, 'material_review', 'pending_review', 'rejected', '赵合规', '素材不合规：含绝对化用语及虚假价格标识', yesterday + ' 11:00:00');
    insertAudit.run(orderId2, null, 'order_status_change', 'in_review', 'material_rejected', '系统', '订单状态更新：素材审核不通过', yesterday + ' 11:00:00');


    // === 场景3: 排期冲突 ===
    const order3 = insertOrder.run(
      'ADS-2026-003', '畅行汽车', '畅行SUV', '新车上市推广', '陈晓', 350000, 'scheduled',
      '与ADS-2026-004在同一时段存在排期冲突，需要协调',
      threeDaysAgo + ' 14:00:00', today + ' 09:00:00'
    );
    const orderId3 = order3.lastInsertRowid;

    const mat3 = insertMaterial.run(
      orderId3, '畅行SUV_新车上市_15s_v1.mp4', 'video', 15, 1, 'approved',
      threeDaysAgo + ' 15:00:00', '素材合规，准予播出', '赵合规', yesterday + ' 10:00:00'
    );

    insertSchedule.run(orderId3, mat3.lastInsertRowid, '综合频道', '19:30', tomorrow, 15, 'A1', 'conflict', '与ADS-2026-004时段冲突，需协调', yesterday + ' 09:00:00');
    insertSchedule.run(orderId3, mat3.lastInsertRowid, '影视频道', '20:15', dayAfter, 15, 'A2', 'scheduled', null, yesterday + ' 09:00:00');
    insertSchedule.run(orderId3, mat3.lastInsertRowid, '体育频道', '21:00', weekLater, 15, 'B1', 'scheduled', null, yesterday + ' 09:00:00');

    insertAudit.run(orderId3, mat3.lastInsertRowid, 'material_review', 'pending_review', 'approved', '赵合规', '素材合规，准予播出', yesterday + ' 10:00:00');
    insertAudit.run(orderId3, null, 'schedule_conflict', null, null, '排期-刘排', '与ADS-2026-004在综合频道19:30时段冲突', today + ' 09:00:00');


    // === 场景3的冲突方 ===
    const order4 = insertOrder.run(
      'ADS-2026-004', '美味食品', '美味零食', '暑期促销', '王丽', 200000, 'scheduled',
      '与ADS-2026-003在同一时段存在排期冲突，已加急处理',
      threeDaysAgo + ' 14:30:00', today + ' 09:00:00'
    );
    const orderId4 = order4.lastInsertRowid;

    const mat4 = insertMaterial.run(
      orderId4, '美味零食_暑期促销_15s_v1.mp4', 'video', 15, 1, 'approved',
      threeDaysAgo + ' 16:00:00', '素材合规，准予播出', '赵合规', yesterday + ' 10:30:00'
    );

    insertSchedule.run(orderId4, mat4.lastInsertRowid, '综合频道', '19:30', tomorrow, 15, 'A1', 'conflict', '与ADS-2026-003时段冲突，需协调', yesterday + ' 09:00:00');
    insertSchedule.run(orderId4, mat4.lastInsertRowid, '生活频道', '19:00', dayAfter, 15, 'A1', 'scheduled', null, yesterday + ' 09:00:00');

    insertAudit.run(orderId4, mat4.lastInsertRowid, 'material_review', 'pending_review', 'approved', '赵合规', '素材合规，准予播出', yesterday + ' 10:30:00');
    insertAudit.run(orderId4, null, 'schedule_conflict', null, null, '排期-刘排', '与ADS-2026-003在综合频道19:30时段冲突', today + ' 09:00:00');


    // === 场景4: 已播待确认 ===
    const fourDaysAgo = new Date(now.getTime() - 4 * 86400000).toISOString().split('T')[0];
    const order5 = insertOrder.run(
      'ADS-2026-005', '蓝天教育', '蓝天英语', '暑期课程推广', '张明', 120000, 'aired_pending',
      '昨日已播出，等待客户确认播出效果',
      fiveDaysAgo + ' 08:00:00', yesterday + ' 20:00:00'
    );
    const orderId5 = order5.lastInsertRowid;

    const mat5 = insertMaterial.run(
      orderId5, '蓝天英语_暑期课程_15s_v1.mp4', 'video', 15, 1, 'approved',
      fiveDaysAgo + ' 09:00:00', '素材合规，准予播出', '赵合规', fourDaysAgo + ' 10:00:00'
    );

    const sched5a = insertSchedule.run(orderId5, mat5.lastInsertRowid, '综合频道', '18:30', yesterday, 15, 'B1', 'aired', null, fourDaysAgo + ' 11:00:00');
    const sched5b = insertSchedule.run(orderId5, mat5.lastInsertRowid, '少儿频道', '17:45', yesterday, 15, 'A1', 'aired', null, fourDaysAgo + ' 11:00:00');
    insertSchedule.run(orderId5, mat5.lastInsertRowid, '综合频道', '18:30', today, 15, 'B1', 'scheduled', null, fourDaysAgo + ' 11:00:00');
    insertSchedule.run(orderId5, mat5.lastInsertRowid, '少儿频道', '17:45', today, 15, 'A1', 'scheduled', null, fourDaysAgo + ' 11:00:00');

    insertBroadcast.run(sched5a.lastInsertRowid, yesterday + ' 18:30:15', 'aired', 0, null, null, '正常播出，信号正常', yesterday + ' 18:31:00');
    insertBroadcast.run(sched5b.lastInsertRowid, yesterday + ' 17:45:08', 'aired', 0, null, null, '正常播出，信号正常', yesterday + ' 17:46:00');

    insertAudit.run(orderId5, mat5.lastInsertRowid, 'material_review', 'pending_review', 'approved', '赵合规', '素材合规，准予播出', fourDaysAgo + ' 10:00:00');
    insertAudit.run(orderId5, null, 'order_status_change', 'scheduled', 'aired_pending', '系统', '订单状态更新：部分排期已播出，待确认', yesterday + ' 20:00:00');


    // === 额外: 已完成的历史订单 ===
    const order6 = insertOrder.run(
      'ADS-2026-006', '优品家居', '优品沙发', '五一促销', '陈晓', 180000, 'completed',
      '五一期间投放已完成，客户确认播出效果良好',
      '2026-04-20 09:00:00', '2026-05-06 10:00:00'
    );
    const orderId6 = order6.lastInsertRowid;

    const mat6 = insertMaterial.run(
      orderId6, '优品沙发_五一促销_15s_v1.mp4', 'video', 15, 1, 'approved',
      '2026-04-20 10:00:00', '素材合规', '赵合规', '2026-04-21 10:00:00'
    );

    const sched6a = insertSchedule.run(orderId6, mat6.lastInsertRowid, '综合频道', '19:00', '2026-05-01', 15, 'A2', 'aired', null, '2026-04-22 09:00:00');
    const sched6b = insertSchedule.run(orderId6, mat6.lastInsertRowid, '生活频道', '20:30', '2026-05-01', 15, 'B1', 'aired', null, '2026-04-22 09:00:00');

    insertBroadcast.run(sched6a.lastInsertRowid, '2026-05-01 19:00:12', 'aired', 1, '张明', '2026-05-02 10:00:00', '播出正常', '2026-05-01 19:01:00');
    insertBroadcast.run(sched6b.lastInsertRowid, '2026-05-01 20:30:05', 'aired', 1, '张明', '2026-05-02 10:00:00', '播出正常', '2026-05-01 20:31:00');

    insertAudit.run(orderId6, mat6.lastInsertRowid, 'material_review', 'pending_review', 'approved', '赵合规', '素材合规', '2026-04-21 10:00:00');
    insertAudit.run(orderId6, null, 'order_status_change', 'aired_pending', 'completed', '张明', '客户确认播出效果良好，订单完成', '2026-05-06 10:00:00');
  });

  transaction();
  console.log('Seed data inserted successfully!');
  console.log('');
  console.log('Demo scenarios:');
  console.log('  ADS-2026-001 (星河地产) - 客户改版：旧版素材退回，新版待审核');
  console.log('  ADS-2026-002 (康美药业) - 素材不合规：含绝对化用语，审核驳回');
  console.log('  ADS-2026-003 (畅行汽车) - 排期冲突：与004同时段');
  console.log('  ADS-2026-004 (美味食品) - 排期冲突：与003同时段');
  console.log('  ADS-2026-005 (蓝天教育) - 已播待确认：昨日已播，等待客户确认');
  console.log('  ADS-2026-006 (优品家居) - 已完成：历史订单');
}

seed();
