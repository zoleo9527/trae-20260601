import dayjs from 'dayjs';
import db from './db.js';

const today = dayjs();
const tomorrow = today.add(1, 'day');
const yesterday = today.subtract(1, 'day');

const insertUser = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)');
const insertPatient = db.prepare('INSERT INTO patients (name, phone, gender, age, notes) VALUES (?, ?, ?, ?, ?)');
const insertNode = db.prepare(`
  INSERT INTO treatment_nodes (patient_id, node_type, planned_date, actual_date, status, notes, doctor_id, consumable_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertConsumable = db.prepare(`
  INSERT INTO consumables (name, model, batch_no, category, stock_qty, locked_qty, used_qty, unit, status, location, patient_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertAlert = db.prepare('INSERT INTO alerts (patient_id, type, message, is_read) VALUES (?, ?, ?, ?)');
const insertLog = db.prepare('INSERT INTO operation_logs (user_id, user_name, user_role, action, detail, patient_id) VALUES (?, ?, ?, ?, ?, ?)');

const seed = db.transaction(() => {
  db.prepare('DELETE FROM operation_logs').run();
  db.prepare('DELETE FROM alerts').run();
  db.prepare('DELETE FROM treatment_nodes').run();
  db.prepare('DELETE FROM consumables').run();
  db.prepare('DELETE FROM patients').run();
  db.prepare('DELETE FROM users').run();

  const zhangId = insertUser.run('zhangqt', '123456', 'frontdesk', '张前台').lastInsertRowid;
  const liId = insertUser.run('liys', '123456', 'doctor', '李医生').lastInsertRowid;
  const wangId = insertUser.run('wangkg', '123456', 'warehouse', '王库管').lastInsertRowid;

  const p1 = insertPatient.run('王大明', '13800001001', '男', 45, '右下后牙缺失').lastInsertRowid;
  const p2 = insertPatient.run('李秀英', '13800001002', '女', 52, '左上后牙缺失，骨质疏松').lastInsertRowid;
  const p3 = insertPatient.run('张伟', '13800001003', '男', 38, '上前牙外伤缺失').lastInsertRowid;
  const p4 = insertPatient.run('陈丽华', '13800001004', '女', 60, '双侧下后牙缺失，已完成全部治疗').lastInsertRowid;
  const p5 = insertPatient.run('刘强', '13800001005', '男', 42, '左下后牙缺失').lastInsertRowid;

  const c1 = insertConsumable.run('Nobel Replace 种植体', 'NP-4.3x10', 'B2024-001', 'implant', 5, 1, 0, '个', 'locked', 'A区货架3层', p1).lastInsertRowid;
  const c2 = insertConsumable.run('Straumann SLA 种植体', 'ST-4.1x12', 'B2024-002', 'implant', 3, 1, 1, '个', 'locked', 'A区货架3层', p2).lastInsertRowid;
  const c3 = insertConsumable.run('Osstem GS 种植体', 'OS-4.5x10', 'B2024-003', 'implant', 8, 0, 0, '个', 'available', 'A区货架2层', null).lastInsertRowid;
  const c4 = insertConsumable.run('Nobel 基台', 'NB-AB-4.3', 'B2024-004', 'abutment', 4, 1, 0, '个', 'locked', 'B区货架1层', p1).lastInsertRowid;
  const c5 = insertConsumable.run('Straumann 基台', 'ST-AB-4.1', 'B2024-005', 'abutment', 3, 0, 1, '个', 'available', 'B区货架1层', null).lastInsertRowid;
  const c6 = insertConsumable.run('氧化锆全瓷冠', 'ZC-A2', 'B2024-006', 'crown', 6, 0, 0, '颗', 'available', 'C区货架2层', null).lastInsertRowid;
  const c7 = insertConsumable.run('外科手术套件', 'SK-PRO', 'B2024-007', 'tool', 2, 0, 0, '套', 'available', 'D区货架1层', null).lastInsertRowid;
  const c8 = insertConsumable.run('Dentium 种植体', 'DT-4.0x10', 'B2023-012', 'implant', 0, 0, 2, '个', 'expired', 'A区货架1层', null).lastInsertRowid;
  const c9 = insertConsumable.run('Nobel 临时基台', 'NB-TA-4.3', 'B2024-009', 'abutment', 3, 0, 0, '个', 'available', 'B区货架2层', null).lastInsertRowid;
  const c10 = insertConsumable.run('钴铬合金冠', 'CC-B2', 'B2024-010', 'crown', 4, 0, 0, '颗', 'available', 'C区货架1层', null).lastInsertRowid;

  // 患者1: 王大明 - 完成到surgery1，拆线计划明天
  insertNode.run(p1, 'film', today.subtract(30, 'day').format('YYYY-MM-DD'), today.subtract(30, 'day').format('YYYY-MM-DD'), 'completed', '全景片显示骨量充足', liId, null);
  insertNode.run(p1, 'consultation', today.subtract(28, 'day').format('YYYY-MM-DD'), today.subtract(28, 'day').format('YYYY-MM-DD'), 'completed', '制定种植方案，选择Nobel Replace', liId, null);
  insertNode.run(p1, 'surgery1', today.subtract(14, 'day').format('YYYY-MM-DD'), today.subtract(14, 'day').format('YYYY-MM-DD'), 'completed', '一期手术顺利，植入Nobel 4.3x10', liId, c1);
  insertNode.run(p1, 'suture_removal', tomorrow.format('YYYY-MM-DD'), null, 'planned', null, liId, null);
  insertNode.run(p1, 'surgery2', today.add(45, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);
  insertNode.run(p1, 'crown', today.add(75, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);

  // 患者2: 李秀英 - 完成到拆线，surgery2计划下周
  insertNode.run(p2, 'film', today.subtract(45, 'day').format('YYYY-MM-DD'), today.subtract(45, 'day').format('YYYY-MM-DD'), 'completed', 'CBCT显示骨密度稍低', liId, null);
  insertNode.run(p2, 'consultation', today.subtract(43, 'day').format('YYYY-MM-DD'), today.subtract(43, 'day').format('YYYY-MM-DD'), 'completed', '方案: Straumann SLA种植体', liId, null);
  insertNode.run(p2, 'surgery1', today.subtract(30, 'day').format('YYYY-MM-DD'), today.subtract(30, 'day').format('YYYY-MM-DD'), 'completed', '一期手术完成', liId, c2);
  insertNode.run(p2, 'suture_removal', today.subtract(16, 'day').format('YYYY-MM-DD'), today.subtract(16, 'day').format('YYYY-MM-DD'), 'completed', '拆线顺利，伤口愈合良好', liId, null);
  insertNode.run(p2, 'surgery2', today.add(7, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);
  insertNode.run(p2, 'crown', today.add(37, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);

  // 患者3: 张伟 - 只拍了片，咨询明天
  insertNode.run(p3, 'film', today.subtract(5, 'day').format('YYYY-MM-DD'), today.subtract(5, 'day').format('YYYY-MM-DD'), 'completed', '前牙区外伤后缺失', liId, null);
  insertNode.run(p3, 'consultation', tomorrow.format('YYYY-MM-DD'), null, 'planned', null, liId, null);
  insertNode.run(p3, 'surgery1', today.add(14, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);
  insertNode.run(p3, 'suture_removal', today.add(28, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);
  insertNode.run(p3, 'surgery2', today.add(60, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);
  insertNode.run(p3, 'crown', today.add(90, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);

  // 患者4: 陈丽华 - 全部完成
  insertNode.run(p4, 'film', today.subtract(120, 'day').format('YYYY-MM-DD'), today.subtract(120, 'day').format('YYYY-MM-DD'), 'completed', '全景片检查', liId, null);
  insertNode.run(p4, 'consultation', today.subtract(118, 'day').format('YYYY-MM-DD'), today.subtract(118, 'day').format('YYYY-MM-DD'), 'completed', '制定双侧种植方案', liId, null);
  insertNode.run(p4, 'surgery1', today.subtract(100, 'day').format('YYYY-MM-DD'), today.subtract(100, 'day').format('YYYY-MM-DD'), 'completed', '一期手术顺利完成', liId, null);
  insertNode.run(p4, 'suture_removal', today.subtract(86, 'day').format('YYYY-MM-DD'), today.subtract(86, 'day').format('YYYY-MM-DD'), 'completed', '拆线完成', liId, null);
  insertNode.run(p4, 'surgery2', today.subtract(55, 'day').format('YYYY-MM-DD'), today.subtract(55, 'day').format('YYYY-MM-DD'), 'completed', '二期手术完成，安装基台', liId, null);
  insertNode.run(p4, 'crown', today.subtract(20, 'day').format('YYYY-MM-DD'), today.subtract(20, 'day').format('YYYY-MM-DD'), 'completed', '全瓷冠修复完成，患者满意', liId, null);

  // 患者5: 刘强 - 拆线已过3天未完成，遗漏随访
  insertNode.run(p5, 'film', today.subtract(25, 'day').format('YYYY-MM-DD'), today.subtract(25, 'day').format('YYYY-MM-DD'), 'completed', '左下后牙缺失', liId, null);
  insertNode.run(p5, 'consultation', today.subtract(23, 'day').format('YYYY-MM-DD'), today.subtract(23, 'day').format('YYYY-MM-DD'), 'completed', '制定种植方案', liId, null);
  insertNode.run(p5, 'surgery1', today.subtract(10, 'day').format('YYYY-MM-DD'), today.subtract(10, 'day').format('YYYY-MM-DD'), 'completed', '一期手术完成', liId, null);
  insertNode.run(p5, 'suture_removal', today.subtract(3, 'day').format('YYYY-MM-DD'), null, 'planned', '患者未到院拆线', liId, null);
  insertNode.run(p5, 'surgery2', today.add(35, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);
  insertNode.run(p5, 'crown', today.add(65, 'day').format('YYYY-MM-DD'), null, 'planned', null, liId, null);

  // 提醒
  insertAlert.run(p5, 'missed_followup', '刘强的拆线已过3天未完成，请尽快联系患者安排拆线', 0);
  insertAlert.run(p2, 'consumable_change', '李秀英的Straumann基台型号需要从ST-AB-4.1更换为ST-AB-4.5', 0);
  insertAlert.run(p1, 'reschedule', '王大明的拆线时间需要确认，原计划明天', 0);

  // 操作日志
  insertLog.run(zhangId, '张前台', 'frontdesk', '创建患者', '创建患者: 王大明', p1);
  insertLog.run(zhangId, '张前台', 'frontdesk', '创建患者', '创建患者: 李秀英', p2);
  insertLog.run(zhangId, '张前台', 'frontdesk', '创建患者', '创建患者: 张伟', p3);
  insertLog.run(zhangId, '张前台', 'frontdesk', '创建患者', '创建患者: 陈丽华', p4);
  insertLog.run(zhangId, '张前台', 'frontdesk', '创建患者', '创建患者: 刘强', p5);
  insertLog.run(liId, '李医生', 'doctor', '完成治疗节点', '完成王大明的一期手术', p1);
  insertLog.run(liId, '李医生', 'doctor', '完成治疗节点', '完成李秀英的拆线', p2);
  insertLog.run(wangId, '王库管', 'warehouse', '添加耗材', '添加耗材: Nobel Replace 种植体', null);
  insertLog.run(wangId, '王库管', 'warehouse', '添加耗材', '添加耗材: Straumann SLA 种植体', null);
  insertLog.run(zhangId, '张前台', 'frontdesk', '锁定耗材', '锁定Nobel种植体给患者王大明', p1);
  insertLog.run(zhangId, '张前台', 'frontdesk', '锁定耗材', '锁定Straumann基台给患者李秀英', p2);

  console.log('种子数据已成功插入！');
  console.log(`用户: 3 (${zhangId}, ${liId}, ${wangId})`);
  console.log(`患者: 5 (${p1}, ${p2}, ${p3}, ${p4}, ${p5})`);
  console.log(`耗材: 10`);
  console.log(`提醒: 3`);
  console.log(`操作日志: 11`);
});

seed();
