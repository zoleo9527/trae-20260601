const Database = require('better-sqlite3');
const dayjs = require('dayjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'yard.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_no TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT '20GP',
      size_text TEXT DEFAULT '',
      owner TEXT DEFAULT '',
      cargo_type TEXT DEFAULT 'GENERAL',
      weight_kg REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ENTERING',
      entry_time TEXT DEFAULT '',
      expected_departure TEXT DEFAULT '',
      actual_departure TEXT DEFAULT '',
      slot_id INTEGER,
      gate_record_id INTEGER,
      inspection_status TEXT DEFAULT 'NONE',
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS gate_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER,
      container_no TEXT NOT NULL,
      truck_no TEXT DEFAULT '',
      driver_name TEXT DEFAULT '',
      driver_phone TEXT DEFAULT '',
      operator_id INTEGER,
      operator_name TEXT DEFAULT '',
      entry_type TEXT DEFAULT 'IMPORT',
      entry_time TEXT DEFAULT '',
      gate_status TEXT DEFAULT 'REGISTERED',
      modified_at TEXT DEFAULT '',
      modified_by TEXT DEFAULT '',
      modification_reason TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block TEXT NOT NULL,
      bay TEXT NOT NULL,
      row TEXT NOT NULL,
      tier TEXT NOT NULL,
      slot_code TEXT NOT NULL UNIQUE,
      container_id INTEGER,
      container_no TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'EMPTY',
      allowed_type TEXT DEFAULT '',
      allowed_cargo TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS slot_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL,
      container_no TEXT NOT NULL,
      slot_id INTEGER NOT NULL,
      slot_code TEXT NOT NULL,
      allocated_by TEXT DEFAULT '',
      allocated_at TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      previous_slot_id INTEGER,
      reason TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS status_change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_no TEXT NOT NULL,
      from_status TEXT DEFAULT '',
      to_status TEXT NOT NULL,
      changed_by TEXT DEFAULT '',
      changed_at TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      detail TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS fee_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL,
      container_no TEXT NOT NULL,
      free_days INTEGER DEFAULT 7,
      actual_days INTEGER DEFAULT 0,
      daily_rate REAL DEFAULT 50,
      total_fee REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING',
      dispute_reason TEXT DEFAULT '',
      dispute_handler TEXT DEFAULT '',
      dispute_result TEXT DEFAULT '',
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS inspection_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL,
      container_no TEXT NOT NULL,
      plan_type TEXT NOT NULL DEFAULT 'CUSTOMS',
      planned_date TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      notified_at TEXT DEFAULT '',
      notified_to TEXT DEFAULT '',
      missed_reason TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS export_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_type TEXT NOT NULL,
      parameters TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'PENDING',
      file_path TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT '',
      completed_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT DEFAULT ''
    );
  `);

  seedData(db);
  return db;
}

function seedData(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM slots').get();
  if (count.c > 0) return;

  const now = dayjs();
  const insertSlot = db.prepare(`
    INSERT INTO slots (block, bay, row, tier, slot_code, status, allowed_type, allowed_cargo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const slotTypes = {
    A: { allowed_type: '20GP', allowed_cargo: 'GENERAL' },
    B: { allowed_type: '40GP', allowed_cargo: 'GENERAL' },
    C: { allowed_type: '40HC', allowed_cargo: 'DANGEROUS' },
  };

  const insertManySlots = db.transaction(() => {
    for (const block of ['A', 'B', 'C']) {
      for (let bay = 1; bay <= 6; bay++) {
        for (let row = 1; row <= 6; row++) {
          for (let tier = 1; tier <= 4; tier++) {
            const bayStr = String(bay).padStart(2, '0');
            const rowStr = String(row).padStart(2, '0');
            const tierStr = String(tier).padStart(2, '0');
            const slotCode = `${block}-${bayStr}-${rowStr}-${tierStr}`;
            insertSlot.run(
              block, bayStr, rowStr, tierStr, slotCode,
              'EMPTY',
              slotTypes[block].allowed_type,
              slotTypes[block].allowed_cargo
            );
          }
        }
      }
    }
  });
  insertManySlots();

  const insertStaff = db.prepare(
    'INSERT INTO staff (name, role, phone) VALUES (?, ?, ?)'
  );
  const insertManyStaff = db.transaction(() => {
    insertStaff.run('王建国', 'GATE_OPERATOR', '13800001001');
    insertStaff.run('李秀英', 'GATE_OPERATOR', '13800001002');
    insertStaff.run('张伟', 'GATE_OPERATOR', '13800001003');
    insertStaff.run('刘洋', 'YARD_DISPATCHER', '13800002001');
    insertStaff.run('陈静', 'YARD_DISPATCHER', '13800002002');
    insertStaff.run('赵磊', 'CUSTOMER_SERVICE', '13800003001');
    insertStaff.run('孙丽', 'CUSTOMER_SERVICE', '13800003002');
  });
  insertManyStaff();

  const insertContainer = db.prepare(`
    INSERT INTO containers (container_no, type, size_text, owner, cargo_type, weight_kg, status, entry_time, expected_departure, actual_departure, slot_id, gate_record_id, inspection_status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGateRecord = db.prepare(`
    INSERT INTO gate_records (container_id, container_no, truck_no, driver_name, driver_phone, operator_id, operator_name, entry_type, entry_time, gate_status, modified_at, modified_by, modification_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAllocation = db.prepare(`
    INSERT INTO slot_allocations (container_id, container_no, slot_id, slot_code, allocated_by, allocated_at, status, previous_slot_id, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStatusLog = db.prepare(`
    INSERT INTO status_change_logs (container_no, from_status, to_status, changed_by, changed_at, reason, detail)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFeeItem = db.prepare(`
    INSERT INTO fee_items (container_id, container_no, free_days, actual_days, daily_rate, total_fee, status, dispute_reason, dispute_handler, dispute_result, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInspectionPlan = db.prepare(`
    INSERT INTO inspection_plans (container_id, container_no, plan_type, planned_date, status, notified_at, notified_to, missed_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateSlot = db.prepare(`
    UPDATE slots SET container_id = ?, container_no = ?, status = ? WHERE id = ?
  `);

  const seedAll = db.transaction(() => {
    const containers = [
      { no: 'CMAU1234567', type: '20GP', size_text: '20英尺标准箱', owner: '中远海运', cargo_type: 'GENERAL', weight: 18500, status: 'IN_YARD', entry: -12, departure: 5, slot_code: 'A-01-01-01', gate_op: '王建国', entry_type: 'IMPORT', truck: '京A12345', driver: '马超', phone: '13900001111', insp: 'NONE', notes: '' },
      { no: 'MSCU2345678', type: '40GP', size_text: '40英尺标准箱', owner: '地中海航运', cargo_type: 'GENERAL', weight: 24500, status: 'IN_YARD', entry: -10, departure: 3, slot_code: 'B-02-03-02', gate_op: '李秀英', entry_type: 'IMPORT', truck: '京B23456', driver: '黄忠', phone: '13900002222', insp: 'PENDING', notes: '需海关查验' },
      { no: 'EGLV3456789', type: '40HC', size_text: '40英尺高箱', owner: '长荣海运', cargo_type: 'DANGEROUS', weight: 22000, status: 'IN_YARD', entry: -8, departure: 2, slot_code: 'C-03-02-01', gate_op: '张伟', entry_type: 'TRANSSHIPMENT', truck: '京C34567', driver: '赵云', phone: '13900003333', insp: 'NOTIFIED', notes: '危险品-3类' },
      { no: 'OOLU4567890', type: '20GP', size_text: '20英尺标准箱', owner: '东方海外', cargo_type: 'GENERAL', weight: 15200, status: 'ALLOCATED', entry: -6, departure: 8, slot_code: 'A-02-04-03', gate_op: '王建国', entry_type: 'EXPORT', truck: '京D45678', driver: '关羽', phone: '13900004444', insp: 'NONE', notes: '' },
      { no: 'HLCU5678901', type: '40GP', size_text: '40英尺标准箱', owner: '赫伯罗特', cargo_type: 'GENERAL', weight: 26800, status: 'IN_YARD', entry: -15, departure: -2, slot_code: 'B-01-01-01', gate_op: '李秀英', entry_type: 'IMPORT', truck: '京E56789', driver: '张飞', phone: '13900005555', insp: 'INSPECTED', notes: '逾期滞留' },
      { no: 'YMLU6789012', type: '45HC', size_text: '45英尺高箱', owner: '阳明海运', cargo_type: 'GENERAL', weight: 31000, status: 'MISPLACED', entry: -9, departure: 1, slot_code: 'A-03-02-02', gate_op: '张伟', entry_type: 'IMPORT', truck: '京F67890', driver: '刘备', phone: '13900006666', insp: 'NONE', notes: '错放A区-应为B区' },
      { no: 'CSLU7890123', type: '20GP', size_text: '20英尺标准箱', owner: '中远海运', cargo_type: 'DANGEROUS', weight: 16800, status: 'MISPLACED', entry: -7, departure: 4, slot_code: 'B-04-01-01', gate_op: '王建国', entry_type: 'TRANSSHIPMENT', truck: '京G78901', driver: '诸葛亮', phone: '13900007777', insp: 'PENDING', notes: '危险品错放B区-应为C区' },
      { no: 'TCLU8901234', type: '40HC', size_text: '40英尺高箱', owner: '太平船务', cargo_type: 'DANGEROUS', weight: 20500, status: 'IN_YARD', entry: -5, departure: 6, slot_code: 'C-01-03-04', gate_op: '李秀英', entry_type: 'IMPORT', truck: '京H89012', driver: '周瑜', phone: '13900008888', insp: 'INSPECTED', notes: '' },
      { no: 'MAEU9012345', type: '20GP', size_text: '20英尺标准箱', owner: '马士基', cargo_type: 'GENERAL', weight: 14200, status: 'ENTERING', entry: 0, departure: 10, slot_code: null, gate_op: '张伟', entry_type: 'EXPORT', truck: '京J90123', driver: '孙权', phone: '13900009999', insp: 'NONE', notes: '刚到大门' },
      { no: 'CMAU0123456', type: '40GP', size_text: '40英尺标准箱', owner: '中远海运', cargo_type: 'GENERAL', weight: 28300, status: 'DEPARTING', entry: -20, departure: 0, slot_code: 'B-03-05-02', gate_op: '王建国', entry_type: 'IMPORT', truck: '京K01234', driver: '曹操', phone: '13900010000', insp: 'INSPECTED', notes: '正在出库' },
      { no: 'MSCU1122334', type: '20GP', size_text: '20英尺标准箱', owner: '地中海航运', cargo_type: 'GENERAL', weight: 17600, status: 'DEPARTED', entry: -25, departure: -1, slot_code: null, gate_op: '李秀英', entry_type: 'IMPORT', truck: '京L11223', driver: '司马懿', phone: '13900011111', insp: 'INSPECTED', notes: '已离港' },
      { no: 'EGLV2233445', type: '40HC', size_text: '40英尺高箱', owner: '长荣海运', cargo_type: 'DANGEROUS', weight: 23100, status: 'IN_YARD', entry: -11, departure: -1, slot_code: 'C-02-04-01', gate_op: '张伟', entry_type: 'TRANSSHIPMENT', truck: '京M22334', driver: '吕布', phone: '13900012222', insp: 'NOTIFIED', notes: '逾期滞留+危险品' },
      { no: 'OOLU3344556', type: '20GP', size_text: '20英尺标准箱', owner: '东方海外', cargo_type: 'GENERAL', weight: 13800, status: 'IN_YARD', entry: -14, departure: -3, slot_code: 'A-04-05-02', gate_op: '王建国', entry_type: 'EXPORT', truck: '京N33445', driver: '典韦', phone: '13900013333', insp: 'NONE', notes: '严重逾期' },
      { no: 'HLCU4455667', type: '40GP', size_text: '40英尺标准箱', owner: '赫伯罗特', cargo_type: 'GENERAL', weight: 25600, status: 'IN_YARD', entry: -4, departure: 7, slot_code: 'B-05-02-03', gate_op: '李秀英', entry_type: 'IMPORT', truck: '京P44556', driver: '许褚', phone: '13900014444', insp: 'PENDING', notes: '' },
      { no: 'YMLU5566778', type: '20GP', size_text: '20英尺标准箱', owner: '阳明海运', cargo_type: 'GENERAL', weight: 16100, status: 'ALLOCATED', entry: -3, departure: 9, slot_code: 'A-05-06-01', gate_op: '张伟', entry_type: 'EXPORT', truck: '京Q55667', driver: '甘宁', phone: '13900015555', insp: 'NONE', notes: '' },
      { no: 'CSLU6677889', type: '40HC', size_text: '40英尺高箱', owner: '中远海运', cargo_type: 'DANGEROUS', weight: 24200, status: 'IN_YARD', entry: -6, departure: 0, slot_code: 'C-04-01-02', gate_op: '王建国', entry_type: 'TRANSSHIPMENT', truck: '京R66778', driver: '太史慈', phone: '13900016666', insp: 'NOTIFIED', notes: '检疫通知已发' },
      { no: 'TCLU7788990', type: '45HC', size_text: '45英尺高箱', owner: '太平船务', cargo_type: 'GENERAL', weight: 33500, status: 'MISPLACED', entry: -8, departure: 2, slot_code: 'A-06-03-01', gate_op: '李秀英', entry_type: 'IMPORT', truck: '京S77889', driver: '黄盖', phone: '13900017777', insp: 'NONE', notes: '45HC放于A区20GP位' },
    ];

    const containerIds = [];
    const gateRecordIds = [];

    for (const c of containers) {
      const entryTime = now.add(c.entry, 'day').format('YYYY-MM-DD HH:mm:ss');
      const expDep = c.departure !== null ? now.add(c.departure, 'day').format('YYYY-MM-DD HH:mm:ss') : '';
      const actualDep = c.status === 'DEPARTED' ? now.add(-1, 'day').format('YYYY-MM-DD HH:mm:ss') : '';

      let slotId = null;
      if (c.slot_code) {
        const slot = db.prepare('SELECT id FROM slots WHERE slot_code = ?').get(c.slot_code);
        if (slot) slotId = slot.id;
      }

      const result = insertContainer.run(
        c.no, c.type, c.size_text, c.owner, c.cargo_type, c.weight, c.status,
        entryTime, expDep, actualDep, slotId, null, c.insp, c.notes
      );
      const cId = result.lastInsertRowid;
      containerIds.push({ id: cId, no: c.no, status: c.status, slot_code: c.slot_code, slot_id: slotId });

      const grResult = insertGateRecord.run(
        cId, c.no, c.truck, c.driver, c.phone,
        c.gate_op === '王建国' ? 1 : c.gate_op === '李秀英' ? 2 : 3,
        c.gate_op, c.entry_type, entryTime,
        c.status === 'ENTERING' ? 'REGISTERED' : 'APPROVED',
        '', '', ''
      );
      const grId = grResult.lastInsertRowid;
      gateRecordIds.push(grId);

      db.prepare('UPDATE containers SET gate_record_id = ? WHERE id = ?').run(grId, cId);

      if (slotId && c.status !== 'DEPARTED') {
        updateSlot.run(cId, c.no, 'OCCUPIED', slotId);

        insertAllocation.run(
          cId, c.no, slotId, c.slot_code, '刘洋',
          now.add(c.entry + 1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          'ACTIVE', null, ''
        );
      }

      if (c.status !== 'ENTERING') {
        insertStatusLog.run(
          c.no, '', 'ENTERING',
          c.gate_op, entryTime, '进场登记', `集装箱${c.no}进场`
        );
        if (c.status !== 'ENTERING') {
          insertStatusLog.run(
            c.no, 'ENTERING', c.status === 'DEPARTING' ? 'IN_YARD' : c.status,
            '系统', now.add(c.entry + 1, 'day').format('YYYY-MM-DD HH:mm:ss'),
            c.status === 'MISPLACED' ? '错位检测' : '状态更新',
            c.status === 'MISPLACED' ? `检测到错位：${c.notes}` : `状态变更为${c.status}`
          );
        }
        if (c.status === 'DEPARTING') {
          insertStatusLog.run(
            c.no, 'IN_YARD', 'DEPARTING',
            '赵磊', now.format('YYYY-MM-DD HH:mm:ss'),
            '出库操作', '客户申请提箱'
          );
        }
        if (c.status === 'DEPARTED') {
          insertStatusLog.run(
            c.no, 'DEPARTING', 'DEPARTED',
            '赵磊', now.add(-1, 'day').format('YYYY-MM-DD HH:mm:ss'),
            '离港确认', '集装箱已离港'
          );
        }
      }
    }

    const overdueContainers = [
      { idx: 4, free: 7, rate: 50 },
      { idx: 11, free: 5, rate: 80 },
      { idx: 12, free: 7, rate: 50 },
    ];
    for (const oc of overdueContainers) {
      const c = containers[oc.idx];
      const cId = containerIds[oc.idx].id;
      const entryTime = now.add(c.entry, 'day');
      const actualDays = now.diff(entryTime, 'day');
      const totalFee = Math.max(0, (actualDays - oc.free) * oc.rate);

      insertFeeItem.run(
        cId, c.no, oc.free, actualDays, oc.rate, totalFee,
        oc.idx === 11 ? 'DISPUTED' : 'PENDING',
        oc.idx === 11 ? '认为免费天数应为10天而非5天' : '',
        oc.idx === 11 ? '赵磊' : '',
        '',
        now.add(-1, 'day').format('YYYY-MM-DD HH:mm:ss')
      );
    }

    const normalFees = [0, 1, 2, 3, 7, 8, 14];
    for (const idx of normalFees) {
      const c = containers[idx];
      const cId = containerIds[idx].id;
      const entryTime = now.add(c.entry, 'day');
      const actualDays = now.diff(entryTime, 'day');
      const freeDays = c.cargo_type === 'DANGEROUS' ? 3 : 7;
      const rate = c.type === '20GP' ? 50 : 80;
      const totalFee = Math.max(0, (actualDays - freeDays) * rate);

      insertFeeItem.run(
        cId, c.no, freeDays, actualDays, rate, totalFee,
        actualDays > freeDays ? 'PENDING' : 'PAID',
        '', '', '',
        now.add(-2, 'day').format('YYYY-MM-DD HH:mm:ss')
      );
    }

    const inspectionPlansData = [
      { idx: 1, type: 'CUSTOMS', planned: -3, status: 'MISSED', notified: -5, notifiedTo: '海关-张科长', missedReason: '货主未按时到场配合查验' },
      { idx: 2, type: 'QUARANTINE', planned: -1, status: 'MISSED', notified: -3, notifiedTo: '检疫-李主任', missedReason: '集装箱堆位过高无法接近' },
      { idx: 6, type: 'CUSTOMS', planned: 1, status: 'NOTIFIED', notified: -1, notifiedTo: '海关-王处长', missedReason: '' },
      { idx: 7, type: 'COMMODITY', planned: 2, status: 'NOTIFIED', notified: -1, notifiedTo: '商检-赵工', missedReason: '' },
      { idx: 8, type: 'QUARANTINE', planned: 3, status: 'SCHEDULED', notified: '', notifiedTo: '', missedReason: '' },
      { idx: 11, type: 'CUSTOMS', planned: -6, status: 'COMPLETED', notified: -8, notifiedTo: '海关-刘关员', missedReason: '' },
      { idx: 14, type: 'QUARANTINE', planned: 4, status: 'SCHEDULED', notified: '', notifiedTo: '', missedReason: '' },
      { idx: 15, type: 'COMMODITY', planned: -2, status: 'MISSED', notified: -4, notifiedTo: '商检-孙工', missedReason: '申报资料不齐全' },
    ];

    for (const ip of inspectionPlansData) {
      const c = containers[ip.idx];
      const cId = containerIds[ip.idx].id;
      const plannedDate = now.add(ip.planned, 'day').format('YYYY-MM-DD');
      const notifiedAt = ip.notified !== '' ? now.add(ip.notified, 'day').format('YYYY-MM-DD HH:mm:ss') : '';

      insertInspectionPlan.run(
        cId, c.no, ip.type, plannedDate, ip.status,
        notifiedAt, ip.notifiedTo, ip.missedReason
      );
    }
  });

  seedAll();
  console.log('[DB] 种子数据初始化完成');
  return db;
}

module.exports = { getDb, initDatabase };
