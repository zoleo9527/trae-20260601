import { getDb } from './db.js';
import dayjs from 'dayjs';

export function seedData() {
  const db = getDb();

  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role, phone) VALUES (?, ?, ?, ?, ?)
  `);

  const users = [
    { username: 'feeder_wang', password: '123456', name: '王建国', role: 'feeder', phone: '138-0001-1001' },
    { username: 'feeder_li', password: '123456', name: '李大壮', role: 'feeder', phone: '138-0001-1002' },
    { username: 'feeder_zhao', password: '123456', name: '赵铁柱', role: 'feeder', phone: '138-0001-1003' },
    { username: 'sorter_chen', password: '123456', name: '陈秀兰', role: 'sorter', phone: '139-0002-2001' },
    { username: 'sorter_liu', password: '123456', name: '刘桂芳', role: 'sorter', phone: '139-0002-2002' },
    { username: 'sorter_sun', password: '123456', name: '孙丽华', role: 'sorter', phone: '139-0002-2003' },
    { username: 'manager_zhang', password: '123456', name: '张场长', role: 'manager', phone: '137-0003-3001' },
  ];

  const userIds = {};
  for (const u of users) {
    const r = insertUser.run(u.username, u.password, u.name, u.role, u.phone);
    userIds[u.username] = r.lastInsertRowid;
  }

  const insertHouse = db.prepare(`
    INSERT INTO houses (code, name, capacity, current_count, breed, age_weeks, status) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const houses = [
    { code: 'A1', name: 'A1号鸡舍', capacity: 5000, current_count: 4850, breed: '海兰褐', age_weeks: 32, status: 'active' },
    { code: 'A2', name: 'A2号鸡舍', capacity: 5000, current_count: 4720, breed: '海兰褐', age_weeks: 45, status: 'active' },
    { code: 'A3', name: 'A3号鸡舍', capacity: 5000, current_count: 4910, breed: '罗曼粉', age_weeks: 28, status: 'active' },
    { code: 'B1', name: 'B1号鸡舍', capacity: 3000, current_count: 2850, breed: '京红一号', age_weeks: 55, status: 'active' },
    { code: 'B2', name: 'B2号鸡舍', capacity: 3000, current_count: 0, breed: '京红一号', age_weeks: 0, status: 'maintenance' },
    { code: 'C1', name: 'C1号鸡舍', capacity: 8000, current_count: 7650, breed: '海兰灰', age_weeks: 38, status: 'active' },
  ];

  const houseIds = {};
  for (const h of houses) {
    const r = insertHouse.run(h.code, h.name, h.capacity, h.current_count, h.breed, h.age_weeks, h.status);
    houseIds[h.code] = r.lastInsertRowid;
  }

  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const twoDaysAgo = dayjs().subtract(2, 'day').format('YYYY-MM-DD');

  const insertInspection = db.prepare(`
    INSERT INTO inspection_cards (house_id, date, shift, feeder_id, status, temperature, humidity, ventilation, water_system, feed_system, manure_system, dead_count, sick_count, notes, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const inspections = [
    { house: 'A1', date: twoDaysAgo, shift: 'morning', feeder: 'feeder_wang', status: 'completed', temp: 22.5, hum: 65, vent: 'normal', water: 'normal', feed: 'normal', manure: 'normal', dead: 1, sick: 0, notes: null, started: `${twoDaysAgo} 06:05`, completed: `${twoDaysAgo} 06:35` },
    { house: 'A1', date: twoDaysAgo, shift: 'afternoon', feeder: 'feeder_wang', status: 'completed', temp: 24.1, hum: 60, vent: 'normal', water: 'normal', feed: 'normal', manure: 'normal', dead: 0, sick: 2, notes: '发现2只精神萎靡，已隔离观察', started: `${twoDaysAgo} 14:02`, completed: `${twoDaysAgo} 14:28` },
    { house: 'A2', date: twoDaysAgo, shift: 'morning', feeder: 'feeder_li', status: 'completed', temp: 23.0, hum: 68, vent: 'normal', water: 'normal', feed: 'normal', manure: 'normal', dead: 2, sick: 0, notes: null, started: `${twoDaysAgo} 06:10`, completed: `${twoDaysAgo} 06:40` },
    { house: 'A3', date: twoDaysAgo, shift: 'morning', feeder: 'feeder_zhao', status: 'completed', temp: 21.8, hum: 70, vent: 'normal', water: 'normal', feed: 'normal', manure: 'normal', dead: 0, sick: 0, notes: null, started: `${twoDaysAgo} 06:00`, completed: `${twoDaysAgo} 06:30` },
    { house: 'B1', date: twoDaysAgo, shift: 'morning', feeder: 'feeder_wang', status: 'completed', temp: 23.5, hum: 62, vent: 'normal', water: 'normal', feed: 'normal', manure: 'normal', dead: 3, sick: 5, notes: '老龄鸡群，死淘偏高', started: `${twoDaysAgo} 06:15`, completed: `${twoDaysAgo} 06:50` },
    { house: 'C1', date: twoDaysAgo, shift: 'morning', feeder: 'feeder_li', status: 'completed', temp: 22.0, hum: 64, vent: 'normal', water: 'normal', feed: 'normal', manure: 'normal', dead: 1, sick: 0, notes: null, started: `${twoDaysAgo} 06:08`, completed: `${twoDaysAgo} 06:38` },

    { house: 'A1', date: yesterday, shift: 'morning', feeder: 'feeder_wang', status: 'completed', temp: 22.3, hum: 66, vent: 'normal', water: 'normal', feed: 'normal', manure: 'normal', dead: 0, sick: 1, notes: '昨日隔离的2只中1只恢复', started: `${yesterday} 06:03`, completed: `${yesterday} 06:32` },
    { house: 'A1', date: yesterday, shift: 'afternoon', feeder: 'feeder_wang', status: 'abnormal', temp: 26.8, hum: 78, vent: 'poor', water: 'leak', feed: 'normal', manure: 'normal', dead: 0, sick: 3, notes: '通风系统异常+饮水管漏水，已上报', started: `${yesterday} 14:00`, completed: `${yesterday} 14:20` },
    { house: 'A2', date: yesterday, shift: 'morning', feeder: 'feeder_li', status: 'completed', temp: 23.2, hum: 67, vent: 'normal', water: 'normal', feed: 'normal', manure: 'normal', dead: 1, sick: 0, notes: null, started: `${yesterday} 06:12`, completed: `${yesterday} 06:42` },
    { house: 'A2', date: yesterday, shift: 'afternoon', feeder: 'feeder_li', status: 'in_progress', temp: null, hum: null, vent: null, water: null, feed: null, manure: null, dead: null, sick: null, notes: null, started: `${yesterday} 14:05`, completed: null },
    { house: 'A3', date: yesterday, shift: 'morning', feeder: 'feeder_zhao', status: 'pending_confirm', temp: 22.0, hum: 69, vent: 'normal', water: 'normal', feed: 'normal', manure: 'normal', dead: 0, sick: 0, notes: null, started: `${yesterday} 06:05`, completed: `${yesterday} 06:35` },
    { house: 'A3', date: yesterday, shift: 'afternoon', feeder: 'feeder_zhao', status: 'pending', temp: null, hum: null, vent: null, water: null, feed: null, manure: null, dead: null, sick: null, notes: null, started: null, completed: null },
    { house: 'B1', date: yesterday, shift: 'morning', feeder: 'feeder_wang', status: 'completed', temp: 23.8, hum: 61, vent: 'normal', water: 'normal', feed: 'low', manure: 'normal', dead: 4, sick: 8, notes: '料塔余料不足，已通知补充', started: `${yesterday} 06:18`, completed: `${yesterday} 06:55` },
    { house: 'C1', date: yesterday, shift: 'morning', feeder: 'feeder_li', status: 'pending_confirm', temp: 22.1, hum: 63, vent: 'normal', water: 'normal', feed: 'normal', manure: 'clogged', dead: 1, sick: 0, notes: '清粪带卡阻，下午需处理', started: `${yesterday} 06:10`, completed: `${yesterday} 06:45` },
    { house: 'C1', date: yesterday, shift: 'afternoon', feeder: 'feeder_li', status: 'pending', temp: null, hum: null, vent: null, water: null, feed: null, manure: null, dead: null, sick: null, notes: null, started: null, completed: null },

    { house: 'A1', date: today, shift: 'morning', feeder: 'feeder_wang', status: 'pending', temp: null, hum: null, vent: null, water: null, feed: null, manure: null, dead: null, sick: null, notes: null, started: null, completed: null },
    { house: 'A2', date: today, shift: 'morning', feeder: 'feeder_li', status: 'pending', temp: null, hum: null, vent: null, water: null, feed: null, manure: null, dead: null, sick: null, notes: null, started: null, completed: null },
    { house: 'A3', date: today, shift: 'morning', feeder: 'feeder_zhao', status: 'in_progress', temp: null, hum: null, vent: null, water: null, feed: null, manure: null, dead: null, sick: null, notes: null, started: `${today} 06:10`, completed: null },
    { house: 'B1', date: today, shift: 'morning', feeder: 'feeder_wang', status: 'pending', temp: null, hum: null, vent: null, water: null, feed: null, manure: null, dead: null, sick: null, notes: null, started: null, completed: null },
    { house: 'C1', date: today, shift: 'morning', feeder: 'feeder_li', status: 'pending', temp: null, hum: null, vent: null, water: null, feed: null, manure: null, dead: null, sick: null, notes: null, started: null, completed: null },
  ];

  const inspectionIds = {};
  for (const ins of inspections) {
    const r = insertInspection.run(
      houseIds[ins.house], ins.date, ins.shift, userIds[ins.feeder], ins.status,
      ins.temp, ins.hum, ins.vent, ins.water, ins.feed, ins.manure,
      ins.dead, ins.sick, ins.notes, ins.started, ins.completed
    );
    const key = `${ins.house}_${ins.date}_${ins.shift}`;
    inspectionIds[key] = r.lastInsertRowid;
  }

  const insertEgg = db.prepare(`
    INSERT INTO egg_records (house_id, date, shift, inspection_card_id, sorter_id, total_count, grade_a, grade_b, grade_c, cracked, dirty, soft_shell, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const eggRecords = [
    { house: 'A1', date: twoDaysAgo, shift: 'morning', inspection: 'A1', sorter: 'sorter_chen', total: 4320, a: 3580, b: 580, c: 120, cracked: 15, dirty: 20, soft: 5, status: 'confirmed', notes: null },
    { house: 'A1', date: twoDaysAgo, shift: 'afternoon', inspection: null, sorter: 'sorter_chen', total: 280, a: 230, b: 35, c: 10, cracked: 2, dirty: 3, soft: 0, status: 'confirmed', notes: null },
    { house: 'A2', date: twoDaysAgo, shift: 'morning', inspection: 'A2', sorter: 'sorter_liu', total: 4180, a: 3400, b: 620, c: 130, cracked: 18, dirty: 12, soft: 0, status: 'confirmed', notes: null },
    { house: 'A3', date: twoDaysAgo, shift: 'morning', inspection: 'A3', sorter: 'sorter_sun', total: 4500, a: 3850, b: 500, c: 120, cracked: 10, dirty: 15, soft: 5, status: 'confirmed', notes: null },
    { house: 'B1', date: twoDaysAgo, shift: 'morning', inspection: 'B1', sorter: 'sorter_chen', total: 2180, a: 1620, b: 400, c: 140, cracked: 12, dirty: 5, soft: 3, status: 'confirmed', notes: '老龄鸡产蛋率持续下降' },
    { house: 'C1', date: twoDaysAgo, shift: 'morning', inspection: 'C1', sorter: 'sorter_liu', total: 6850, a: 5800, b: 800, c: 200, cracked: 25, dirty: 18, soft: 7, status: 'confirmed', notes: null },

    { house: 'A1', date: yesterday, shift: 'morning', inspection: 'A1', sorter: 'sorter_chen', total: 4300, a: 3550, b: 590, c: 130, cracked: 14, dirty: 16, soft: 0, status: 'confirmed', notes: null },
    { house: 'A1', date: yesterday, shift: 'afternoon', inspection: null, sorter: 'sorter_chen', total: 0, a: 0, b: 0, c: 0, cracked: 0, dirty: 0, soft: 0, status: 'abnormal', notes: '下午巡检发现通风异常+漏水，产蛋中断，待处理' },
    { house: 'A2', date: yesterday, shift: 'morning', inspection: 'A2', sorter: 'sorter_liu', total: 4150, a: 3380, b: 600, c: 140, cracked: 20, dirty: 10, soft: 0, status: 'confirmed', notes: null },
    { house: 'A2', date: yesterday, shift: 'afternoon', inspection: null, sorter: 'sorter_liu', total: 0, a: 0, b: 0, c: 0, cracked: 0, dirty: 0, soft: 0, status: 'pending', notes: null },
    { house: 'A3', date: yesterday, shift: 'morning', inspection: 'A3', sorter: 'sorter_sun', total: 4480, a: 3820, b: 510, c: 120, cracked: 12, dirty: 13, soft: 5, status: 'recorded', notes: null },
    { house: 'A3', date: yesterday, shift: 'afternoon', inspection: null, sorter: 'sorter_sun', total: 0, a: 0, b: 0, c: 0, cracked: 0, dirty: 0, soft: 0, status: 'pending', notes: null },
    { house: 'B1', date: yesterday, shift: 'morning', inspection: 'B1', sorter: 'sorter_chen', total: 2100, a: 1550, b: 380, c: 150, cracked: 10, dirty: 5, soft: 5, status: 'abnormal', notes: '产蛋量比预期低15%，与饲料供应不足相关' },
    { house: 'C1', date: yesterday, shift: 'morning', inspection: 'C1', sorter: 'sorter_liu', total: 6800, a: 5750, b: 780, c: 210, cracked: 28, dirty: 22, soft: 10, status: 'recorded', notes: null },
    { house: 'C1', date: yesterday, shift: 'afternoon', inspection: null, sorter: 'sorter_liu', total: 0, a: 0, b: 0, c: 0, cracked: 0, dirty: 0, soft: 0, status: 'pending', notes: null },

    { house: 'A1', date: today, shift: 'morning', inspection: null, sorter: 'sorter_chen', total: 0, a: 0, b: 0, c: 0, cracked: 0, dirty: 0, soft: 0, status: 'pending', notes: null },
    { house: 'A2', date: today, shift: 'morning', inspection: null, sorter: 'sorter_liu', total: 0, a: 0, b: 0, c: 0, cracked: 0, dirty: 0, soft: 0, status: 'pending', notes: null },
    { house: 'A3', date: today, shift: 'morning', inspection: null, sorter: 'sorter_sun', total: 0, a: 0, b: 0, c: 0, cracked: 0, dirty: 0, soft: 0, status: 'pending', notes: null },
    { house: 'B1', date: today, shift: 'morning', inspection: null, sorter: 'sorter_chen', total: 0, a: 0, b: 0, c: 0, cracked: 0, dirty: 0, soft: 0, status: 'pending', notes: null },
    { house: 'C1', date: today, shift: 'morning', inspection: null, sorter: 'sorter_liu', total: 0, a: 0, b: 0, c: 0, cracked: 0, dirty: 0, soft: 0, status: 'pending', notes: null },
  ];

  const eggRecordIds = {};
  for (const egg of eggRecords) {
    const cardId = egg.inspection ? inspectionIds[`${egg.inspection}_${egg.date}_${egg.shift}`] || null : null;
    const r = insertEgg.run(
      houseIds[egg.house], egg.date, egg.shift, cardId, userIds[egg.sorter],
      egg.total, egg.a, egg.b, egg.c, egg.cracked, egg.dirty, egg.soft, egg.status, egg.notes
    );
    const key = `${egg.house}_${egg.date}_${egg.shift}`;
    eggRecordIds[key] = r.lastInsertRowid;
  }

  const insertException = db.prepare(`
    INSERT INTO exceptions (source_type, source_id, house_id, severity, category, description, handler_id, handler_role, status, resolution, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const exceptions = [
    {
      source_type: 'inspection', source_id: inspectionIds[`A1_${yesterday}_afternoon`],
      house_id: houseIds['A1'], severity: 'urgent', category: '设备故障',
      description: 'A1号鸡舍下午巡检发现通风系统异常（温度26.8°C，湿度78%），饮水管漏水。鸡群出现3只病鸡，需紧急处理。',
      handler_id: null, handler_role: 'manager', status: 'open', resolution: null, resolved_at: null
    },
    {
      source_type: 'inspection', source_id: inspectionIds[`A2_${yesterday}_afternoon`],
      house_id: houseIds['A2'], severity: 'urgent', category: '巡检延误',
      description: 'A2号鸡舍下午巡检卡状态为"巡检中"已超过4小时未完成，饲养员李大壮尚未提交巡检结果。',
      handler_id: userIds['manager_zhang'], handler_role: 'manager', status: 'assigned', resolution: null, resolved_at: null
    },
    {
      source_type: 'egg_record',
      source_id: eggRecordIds[`A1_${yesterday}_afternoon`],
      house_id: houseIds['A1'], severity: 'critical', category: '产蛋中断',
      description: '昨日A1号鸡舍下午产蛋记录为0，与巡检发现的通风+漏水异常直接相关，产蛋完全中断。需确认鸡群状态。',
      handler_id: null, handler_role: 'manager', status: 'open', resolution: null, resolved_at: null
    },
    {
      source_type: 'egg_record',
      source_id: eggRecordIds[`B1_${yesterday}_morning`],
      house_id: houseIds['B1'], severity: 'warning', category: '产蛋异常',
      description: '昨日B1号鸡舍上午产蛋量比预期低15%，与上午巡检记录的饲料供应不足（feed_system=low）相关。老龄鸡群叠加营养不足风险大。',
      handler_id: userIds['manager_zhang'], handler_role: 'manager', status: 'handling', resolution: null, resolved_at: null
    },
    {
      source_type: 'inspection',
      source_id: inspectionIds[`C1_${yesterday}_morning`],
      house_id: houseIds['C1'], severity: 'info', category: '设备维护',
      description: 'C1号鸡舍清粪带卡阻（manure_system=clogged），需安排下午维修。目前不影响鸡群，但持续会恶化环境。',
      handler_id: userIds['feeder_li'], handler_role: 'feeder', status: 'assigned', resolution: null, resolved_at: null
    },
    {
      source_type: 'egg_record',
      source_id: eggRecordIds[`A3_${yesterday}_afternoon`],
      house_id: houseIds['A3'], severity: 'warning', category: '记录缺失',
      description: '昨日A3号鸡舍下午产蛋记录尚未录入，巡检也未完成。分拣员孙丽华与饲养员赵铁柱均未操作。',
      handler_id: null, handler_role: 'sorter', status: 'open', resolution: null, resolved_at: null
    },
    {
      source_type: 'inspection',
      source_id: null,
      house_id: houseIds['A2'], severity: 'urgent', category: '巡检缺失',
      description: 'A2号鸡舍今日上午巡检卡尚未开始处理，已超过规定巡检时间1小时。饲养员李大壮昨日下午巡检也超时未完成。',
      handler_id: null, handler_role: 'feeder', status: 'open', resolution: null, resolved_at: null
    },
    {
      source_type: 'system',
      source_id: null,
      house_id: houseIds['B1'], severity: 'warning', category: '饲料预警',
      description: 'B1号鸡舍料塔余料不足，按当前消耗量仅能维持到今日下午。需立即安排补充饲料。',
      handler_id: null, handler_role: 'manager', status: 'open', resolution: null, resolved_at: null
    },
  ];

  const exceptionIds = [];
  for (const exc of exceptions) {
    const r = insertException.run(
      exc.source_type, exc.source_id, exc.house_id, exc.severity, exc.category,
      exc.description, exc.handler_id, exc.handler_role, exc.status, exc.resolution, exc.resolved_at
    );
    exceptionIds.push(r.lastInsertRowid);
  }

  const insertTimeline = db.prepare(`
    INSERT INTO exception_timeline (exception_id, action, content, operator_id, operator_name) VALUES (?, ?, ?, ?, ?)
  `);

  const timelines = [
    { excIdx: 0, action: 'created', content: 'A1号鸡舍巡检异常自动上报：通风异常、饮水漏水', operator_id: userIds['feeder_wang'], operator_name: '王建国' },
    { excIdx: 1, action: 'created', content: 'A2号鸡舍巡检超时，系统自动生成异常', operator_id: null, operator_name: '系统' },
    { excIdx: 1, action: 'assigned', content: '指派给张场长（场长）', operator_id: userIds['manager_zhang'], operator_name: '张场长' },
    { excIdx: 2, action: 'created', content: 'A1号产蛋中断，系统自动上报', operator_id: null, operator_name: '系统' },
    { excIdx: 3, action: 'created', content: 'B1号产蛋量异常，系统自动上报', operator_id: null, operator_name: '系统' },
    { excIdx: 3, action: 'assigned', content: '指派给张场长（场长）', operator_id: userIds['manager_zhang'], operator_name: '张场长' },
    { excIdx: 3, action: 'handling', content: '开始处理', operator_id: userIds['manager_zhang'], operator_name: '张场长' },
    { excIdx: 4, action: 'created', content: 'C1号清粪带卡阻，巡检自动上报', operator_id: userIds['feeder_li'], operator_name: '李大壮' },
    { excIdx: 4, action: 'assigned', content: '指派给李大壮（饲养员）', operator_id: userIds['manager_zhang'], operator_name: '张场长' },
    { excIdx: 5, action: 'created', content: 'A3号产蛋记录缺失，系统自动上报', operator_id: null, operator_name: '系统' },
    { excIdx: 6, action: 'created', content: 'A2号巡检缺失，系统自动上报', operator_id: null, operator_name: '系统' },
    { excIdx: 7, action: 'created', content: 'B1号饲料预警，系统自动上报', operator_id: null, operator_name: '系统' },
  ];

  for (const tl of timelines) {
    insertTimeline.run(exceptionIds[tl.excIdx], tl.action, tl.content, tl.operator_id, tl.operator_name);
  }

  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, link) VALUES (?, ?, ?, ?, ?)
  `);

  const notifications = [
    { user_id: userIds['manager_zhang'], type: 'urgent', title: 'A1号鸡舍通风系统异常', content: 'A1号下午巡检发现通风异常+漏水，3只病鸡，产蛋中断，请立即处理', link: '/exceptions' },
    { user_id: userIds['manager_zhang'], type: 'warning', title: 'A2号鸡舍巡检超时', content: 'A2号下午巡检卡已4小时未完成，今日上午巡检也未开始', link: '/inspections' },
    { user_id: userIds['feeder_wang'], type: 'urgent', title: 'A1号鸡舍异常待确认', content: '您负责的A1号鸡舍下午巡检标记为异常，请补充处理进展', link: '/inspections' },
    { user_id: userIds['feeder_li'], type: 'warning', title: 'A2号巡检卡超时提醒', content: 'A2号鸡舍下午巡检仍未完成，场长已关注', link: '/inspections' },
    { user_id: userIds['feeder_li'], type: 'info', title: 'C1号清粪带维修', content: 'C1号清粪带卡阻已指派给您，请下午处理', link: '/exceptions' },
    { user_id: userIds['sorter_chen'], type: 'urgent', title: 'A1号产蛋中断', content: 'A1号下午产蛋记录为0，请确认鸡群状态后录入', link: '/egg-records' },
    { user_id: userIds['sorter_sun'], type: 'warning', title: 'A3号记录缺失', content: 'A3号下午产蛋记录尚未录入，请尽快完成', link: '/egg-records' },
    { user_id: userIds['manager_zhang'], type: 'warning', title: 'B1号产蛋量异常', content: 'B1号产蛋量比预期低15%，与饲料不足相关，正在处理中', link: '/exceptions' },
    { user_id: userIds['feeder_wang'], type: 'warning', title: '今日巡检待开始', content: 'A1号和B1号今日上午巡检尚未开始，请尽快领取', link: '/inspections' },
    { user_id: userIds['sorter_chen'], type: 'info', title: 'A3号巡检待确认', content: 'A3号昨日早班巡检已完成，等待确认后可关联产蛋数据', link: '/inspections' },
  ];

  for (const n of notifications) {
    insertNotification.run(n.user_id, n.type, n.title, n.content, n.link);
  }
}
