const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const log = require('electron-log');

class AppDatabase {
  constructor() {
    const path_module = require('path');
    const fs = require('fs');
    
    const dbPath = path_module.join(__dirname, '../../data/customization.db');
    
    const dataDir = path_module.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    log.info('数据库路径:', dbPath);
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    this.migrateDatabase();
    this.initializeTables();
    this.initializeSampleData();
  }

  initializeTables() {
    log.info('初始化数据库表...');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        appointment_date DATE NOT NULL,
        appointment_time TIME,
        tailor_id INTEGER,
        pattern_maker_id INTEGER,
        customer_service_id INTEGER,
        current_owner_id INTEGER,
        current_owner_role TEXT,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tailor_id) REFERENCES employees(id),
        FOREIGN KEY (pattern_maker_id) REFERENCES employees(id),
        FOREIGN KEY (customer_service_id) REFERENCES employees(id),
        FOREIGN KEY (current_owner_id) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        assignee_id INTEGER,
        assignee_role TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date DATE,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id),
        FOREIGN KEY (assignee_id) REFERENCES employees(id),
        FOREIGN KEY (created_by) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL,
        height REAL,
        weight REAL,
        bust REAL,
        waist REAL,
        hip REAL,
        shoulder_width REAL,
        arm_length REAL,
        leg_length REAL,
        custom_measurements TEXT,
        notes TEXT,
        measured_by INTEGER,
        measured_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id),
        FOREIGN KEY (measured_by) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS fabric_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL,
        fabric_name TEXT NOT NULL,
        fabric_code TEXT,
        color TEXT,
        pattern TEXT,
        supplier TEXT,
        price_per_meter REAL,
        width REAL,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id),
        FOREIGN KEY (created_by) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS style_confirmations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL,
        style_name TEXT NOT NULL,
        style_type TEXT,
        design_description TEXT,
        style_sketch TEXT,
        approval_status TEXT DEFAULT 'pending',
        approved_by INTEGER,
        approved_at DATETIME,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id),
        FOREIGN KEY (approved_by) REFERENCES employees(id),
        FOREIGN KEY (created_by) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS fitting_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL,
        fitting_stage TEXT NOT NULL,
        fitting_date DATE,
        fit_rating INTEGER,
        issues TEXT,
        adjustments TEXT,
        notes TEXT,
        fitter_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id),
        FOREIGN KEY (fitter_id) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS operation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        description TEXT,
        operator_id INTEGER,
        operator_name TEXT,
        old_data TEXT,
        new_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (operator_id) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS recent_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        item_title TEXT,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        accessed_by INTEGER,
        FOREIGN KEY (accessed_by) REFERENCES employees(id)
      );

      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
      CREATE INDEX IF NOT EXISTS idx_appointments_owner ON appointments(current_owner_id);
      CREATE INDEX IF NOT EXISTS idx_measurements_appointment ON measurements(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_fabric_cards_appointment ON fabric_cards(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_style_confirmations_appointment ON style_confirmations(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_fitting_records_appointment ON fitting_records(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_operation_history_created ON operation_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_recent_items_accessed ON recent_items(last_accessed);
      CREATE INDEX IF NOT EXISTS idx_todos_appointment ON todos(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_todos_assignee ON todos(assignee_id);
      CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
    `);

    log.info('数据库表初始化完成');
  }

  migrateDatabase() {
    log.info('执行数据库迁移...');

    try {
      const columns = this.db.prepare(`
        PRAGMA table_info(appointments)
      `).all();
      
      const columnNames = columns.map(col => col.name);
      
      if (!columnNames.includes('current_owner_id')) {
        log.info('添加 current_owner_id 字段到 appointments 表');
        this.db.exec(`ALTER TABLE appointments ADD COLUMN current_owner_id INTEGER`);
      }
      
      if (!columnNames.includes('current_owner_role')) {
        log.info('添加 current_owner_role 字段到 appointments 表');
        this.db.exec(`ALTER TABLE appointments ADD COLUMN current_owner_role TEXT`);
      }
      
      if (!columnNames.includes('updated_at')) {
        log.info('添加 updated_at 字段到 appointments 表');
        this.db.exec(`ALTER TABLE appointments ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
      }

      const todosExists = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='todos'
      `).get();
      
      if (!todosExists) {
        log.info('创建 todos 表');
        this.db.exec(`
          CREATE TABLE todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointment_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            assignee_id INTEGER,
            assignee_role TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            due_date DATE,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (appointment_id) REFERENCES appointments(id),
            FOREIGN KEY (assignee_id) REFERENCES employees(id),
            FOREIGN KEY (created_by) REFERENCES employees(id)
          );
          CREATE INDEX idx_todos_appointment ON todos(appointment_id);
          CREATE INDEX idx_todos_assignee ON todos(assignee_id);
          CREATE INDEX idx_todos_status ON todos(status);
        `);
      }

      const recentItemsExists = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='recent_items'
      `).get();
      
      if (!recentItemsExists) {
        log.info('创建 recent_items 表');
        this.db.exec(`
          CREATE TABLE recent_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_type TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            item_title TEXT,
            last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
            accessed_by INTEGER,
            FOREIGN KEY (accessed_by) REFERENCES employees(id)
          );
          CREATE INDEX idx_recent_items_accessed ON recent_items(last_accessed);
        `);
      }

      const operationHistoryExists = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='operation_history'
      `).get();
      
      if (!operationHistoryExists) {
        log.info('创建 operation_history 表');
        this.db.exec(`
          CREATE TABLE operation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation_type TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            description TEXT,
            operator_id INTEGER,
            operator_name TEXT,
            old_data TEXT,
            new_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (operator_id) REFERENCES employees(id)
          );
          CREATE INDEX idx_operation_history_created ON operation_history(created_at);
        `);
      }

      log.info('数据库迁移完成');
    } catch (error) {
      log.error('数据库迁移失败:', error);
    }
  }

  initializeSampleData() {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM employees').get();
    
    if (count.count > 0) {
      log.info('样例数据已存在，跳过初始化');
      return;
    }

    log.info('初始化样例数据...');

    const insertEmployee = this.db.prepare(`
      INSERT INTO employees (name, role, phone) VALUES (?, ?, ?)
    `);

    const tailors = [
      ['张量体', 'tailor', '13800138001'],
      ['李量体', 'tailor', '13800138002'],
      ['王量体', 'tailor', '13800138003']
    ];

    const patternMakers = [
      ['赵版师', 'pattern_maker', '13900139001'],
      ['孙版师', 'pattern_maker', '13900139002']
    ];

    const customerServices = [
      ['周客服', 'customer_service', '13700137001'],
      ['吴客服', 'customer_service', '13700137002']
    ];

    [...tailors, ...patternMakers, ...customerServices].forEach(emp => {
      insertEmployee.run(...emp);
    });

    const insertAppointment = this.db.prepare(`
      INSERT INTO appointments 
      (customer_name, customer_phone, appointment_date, appointment_time, tailor_id, pattern_maker_id, customer_service_id, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const appointments = [
      [today, '09:00', 1, 1, 1, 'pending', '女士西装定制，需加急'],
      [today, '10:30', 2, null, 1, 'confirmed', '新郎礼服定制'],
      [today, '14:00', 1, 2, 1, 'in_progress', '旗袍定制'],
      [tomorrow, '11:00', 3, 1, 2, 'pending', '女士大衣定制'],
      [yesterday, '15:00', 2, 1, 1, 'completed', '男士西装定制 - 已完成'],
      [yesterday, '16:30', 1, null, 2, 'risk', '女士连衣裙 - 尺寸异常'],
      [today, '16:00', 2, 2, 1, 'pending', '商务衬衫定制'],
      [tomorrow, '09:30', 3, 1, 2, 'pending', '婚礼礼服定制 - 重要客户']
    ];

    const customers = [
      ['王女士', '13500135001'],
      ['李先生', '13500135002'],
      ['张女士', '13500135003'],
      ['赵女士', '13500135004'],
      ['孙先生', '13500135005'],
      ['周女士', '13500135006'],
      ['吴先生', '13500135007'],
      ['郑女士', '13500135008']
    ];

    appointments.forEach((apt, index) => {
      const customer = customers[index];
      insertAppointment.run(
        customer[0],
        customer[1],
        apt[0],
        apt[1],
        apt[2],
        apt[3],
        apt[4],
        apt[5],
        apt[6]
      );
    });

    const insertMeasurement = this.db.prepare(`
      INSERT INTO measurements 
      (appointment_id, height, weight, bust, waist, hip, shoulder_width, arm_length, leg_length, measured_by, measured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const measurements = [
      [2, 165, 55, 85, 68, 88, 38, 55, 100, 2, `${yesterday} 10:30:00`],
      [3, 170, 62, 90, 72, 95, 40, 58, 105, 1, `${today} 14:15:00`],
      [5, 175, 70, 95, 80, 100, 42, 60, 108, 2, `${yesterday} 15:30:00`],
      [6, 158, null, 82, null, 86, 37, null, null, 1, `${yesterday} 16:45:00`]
    ];

    measurements.forEach(m => {
      insertMeasurement.run(...m);
    });

    const insertStyleConfirmation = this.db.prepare(`
      INSERT INTO style_confirmations 
      (appointment_id, style_name, style_type, design_description, approval_status, approved_by, approved_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const styleConfirmations = [
      [2, '经典款西装', '西装', '双排扣，平驳头，黑色', 'approved', 1, `${yesterday} 11:00:00`, 2],
      [3, '改良旗袍', '旗袍', '立领，侧开衩，红色丝绸', 'pending', null, null, 1],
      [5, '商务西装', '西装', '单排扣，戗驳头，深蓝色', 'approved', 1, `${yesterday} 16:00:00`, 2],
      [6, 'A字连衣裙', '连衣裙', '圆领，短袖，藏蓝色', 'rejected', 2, `${yesterday} 17:30:00`, 1]
    ];

    styleConfirmations.forEach(sc => {
      insertStyleConfirmation.run(...sc);
    });

    const insertFabricCard = this.db.prepare(`
      INSERT INTO fabric_cards 
      (appointment_id, fabric_name, fabric_code, color, pattern, supplier, price_per_meter, width, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const fabricCards = [
      [2, '意大利羊毛面料', 'IT-WL-2024', '深灰色', '净色', '意大利面料商', 380, 150, 2],
      [3, '真丝双绉', 'CN-SS-102', '中国红', '净色', '苏州丝绸', 260, 110, 1],
      [5, '英式精纺羊毛', 'UK-WF-305', '藏蓝色', '细条纹', '英国面料商', 420, 150, 2],
      [6, '弹力棉麻', 'CN-CM-201', '藏蓝色', '净色', '国产面料', 120, 140, 1]
    ];

    fabricCards.forEach(fc => {
      insertFabricCard.run(...fc);
    });

    const insertFittingRecord = this.db.prepare(`
      INSERT INTO fitting_records 
      (appointment_id, fitting_stage, fitting_date, fit_rating, issues, adjustments, fitter_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const fittingRecords = [
      [3, '第一次试衣', today, 3, '腰部略紧，袖子稍长', '放松腰部2cm，缩短袖口5cm', 1],
      [5, '成衣检查', yesterday, 5, '无问题', '无需调整', 2],
      [6, '第一次试衣', yesterday, 2, '多处尺寸需要重新核对，原始量体数据不完整', '需要重新量体', 1]
    ];

    fittingRecords.forEach(fr => {
      insertFittingRecord.run(...fr);
    });

    const insertOperationHistory = this.db.prepare(`
      INSERT INTO operation_history 
      (operation_type, entity_type, entity_id, description, operator_id, operator_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const operations = [
      ['create', 'appointment', 4, '创建了量体预约 - 赵女士', 1, '张量体'],
      ['update', 'appointment', 3, '更新预约状态为进行中', 1, '张量体'],
      ['confirm', 'style', 1, '款式确认已批准 - 经典款西装', 1, '张量体'],
      ['reject', 'style', 4, '款式确认已拒绝 - A字连衣裙', 2, '赵版师'],
      ['warning', 'measurement', 6, '量体数据不完整 - 周女士', 1, '张量体'],
      ['complete', 'appointment', 5, '订单已完成', 2, '李量体']
    ];

    operations.forEach(op => {
      insertOperationHistory.run(...op);
    });

    const insertRecentItem = this.db.prepare(`
      INSERT INTO recent_items 
      (item_type, item_id, item_title, accessed_by)
      VALUES (?, ?, ?, ?)
    `);

    const recentItems = [
      ['appointment', 3, '张女士 - 旗袍定制', 1],
      ['appointment', 6, '周女士 - 连衣裙', 1],
      ['style_confirmation', 2, '李先生 - 经典款西装', 2],
      ['style_confirmation', 3, '张女士 - 改良旗袍', 1]
    ];

    recentItems.forEach(item => {
      insertRecentItem.run(...item);
    });

    log.info('样例数据初始化完成');
  }

  getAppointments(filters = {}) {
    let query = `
      SELECT 
        a.*,
        t.name as tailor_name,
        pm.name as pattern_maker_name,
        cs.name as customer_service_name
      FROM appointments a
      LEFT JOIN employees t ON a.tailor_id = t.id
      LEFT JOIN employees pm ON a.pattern_maker_id = pm.id
      LEFT JOIN employees cs ON a.customer_service_id = cs.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }
    
    if (filters.date) {
      query += ' AND a.appointment_date = ?';
      params.push(filters.date);
    }
    
    if (filters.tailor_id) {
      query += ' AND a.tailor_id = ?';
      params.push(filters.tailor_id);
    }
    
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    
    return this.db.prepare(query).all(...params);
  }

  getAppointment(id) {
    const appointment = this.db.prepare(`
      SELECT 
        a.*,
        t.name as tailor_name,
        pm.name as pattern_maker_name,
        cs.name as customer_service_name,
        co.name as current_owner_name
      FROM appointments a
      LEFT JOIN employees t ON a.tailor_id = t.id
      LEFT JOIN employees pm ON a.pattern_maker_id = pm.id
      LEFT JOIN employees cs ON a.customer_service_id = cs.id
      LEFT JOIN employees co ON a.current_owner_id = co.id
      WHERE a.id = ?
    `).get(id);
    
    if (appointment) {
      appointment.measurements = this.getMeasurements(id);
      appointment.fabric_cards = this.getFabricCards(id);
      appointment.style_confirmations = this.getStyleConfirmations({ appointment_id: id });
      appointment.fitting_records = this.getFittingRecords(id);
    }
    
    return appointment;
  }

  createAppointment(data) {
    const result = this.db.prepare(`
      INSERT INTO appointments 
      (customer_name, customer_phone, appointment_date, appointment_time, 
       tailor_id, pattern_maker_id, customer_service_id, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.customer_name,
      data.customer_phone,
      data.appointment_date,
      data.appointment_time,
      data.tailor_id,
      data.pattern_maker_id,
      data.customer_service_id,
      data.status || 'pending',
      data.notes
    );
    
    this.addOperationHistory({
      operation_type: 'create',
      entity_type: 'appointment',
      entity_id: result.lastInsertRowid,
      description: `创建了量体预约 - ${data.customer_name}`,
      operator_id: data.operator_id,
      operator_name: data.operator_name
    });
    
    return result.lastInsertRowid;
  }

  updateAppointment(id, data) {
    const appointment = this.getAppointment(id);
    const oldStatus = appointment.status;
    
    this.db.prepare(`
      UPDATE appointments SET
        customer_name = COALESCE(?, customer_name),
        customer_phone = COALESCE(?, customer_phone),
        appointment_date = COALESCE(?, appointment_date),
        appointment_time = COALESCE(?, appointment_time),
        tailor_id = COALESCE(?, tailor_id),
        pattern_maker_id = COALESCE(?, pattern_maker_id),
        customer_service_id = COALESCE(?, customer_service_id),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.customer_name,
      data.customer_phone,
      data.appointment_date,
      data.appointment_time,
      data.tailor_id,
      data.pattern_maker_id,
      data.customer_service_id,
      data.status,
      data.notes,
      id
    );
    
    if (data.status && data.status !== oldStatus) {
      this.addOperationHistory({
        operation_type: 'status_change',
        entity_type: 'appointment',
        entity_id: id,
        description: `预约状态从 ${oldStatus} 更新为 ${data.status}`,
        operator_id: data.operator_id,
        operator_name: data.operator_name
      });
    }
    
    return id;
  }

  createMeasurement(data) {
    const result = this.db.prepare(`
      INSERT INTO measurements 
      (appointment_id, height, weight, bust, waist, hip, shoulder_width, arm_length, leg_length, custom_measurements, notes, measured_by, measured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      data.appointment_id,
      data.height,
      data.weight,
      data.bust,
      data.waist,
      data.hip,
      data.shoulder_width,
      data.arm_length,
      data.leg_length,
      data.custom_measurements,
      data.notes,
      data.measured_by
    );
    
    this.addOperationHistory({
      operation_type: 'create',
      entity_type: 'measurement',
      entity_id: result.lastInsertRowid,
      description: `创建了量体记录`,
      operator_id: data.measured_by
    });
    
    return result.lastInsertRowid;
  }

  getMeasurements(appointmentId) {
    return this.db.prepare(`
      SELECT m.*, e.name as measured_by_name
      FROM measurements m
      LEFT JOIN employees e ON m.measured_by = e.id
      WHERE m.appointment_id = ?
      ORDER BY m.created_at DESC
    `).all(appointmentId);
  }

  createFabricCard(data) {
    const result = this.db.prepare(`
      INSERT INTO fabric_cards 
      (appointment_id, fabric_name, fabric_code, color, pattern, supplier, price_per_meter, width, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.appointment_id,
      data.fabric_name,
      data.fabric_code,
      data.color,
      data.pattern,
      data.supplier,
      data.price_per_meter,
      data.width,
      data.notes,
      data.created_by
    );
    
    this.addOperationHistory({
      operation_type: 'create',
      entity_type: 'fabric_card',
      entity_id: result.lastInsertRowid,
      description: `创建了面料卡 - ${data.fabric_name}`,
      operator_id: data.created_by
    });
    
    return result.lastInsertRowid;
  }

  getFabricCards(appointmentId) {
    return this.db.prepare(`
      SELECT fc.*, e.name as created_by_name
      FROM fabric_cards fc
      LEFT JOIN employees e ON fc.created_by = e.id
      WHERE fc.appointment_id = ?
      ORDER BY fc.created_at DESC
    `).all(appointmentId);
  }

  createStyleConfirmation(data) {
    const result = this.db.prepare(`
      INSERT INTO style_confirmations 
      (appointment_id, style_name, style_type, design_description, style_sketch, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.appointment_id,
      data.style_name,
      data.style_type,
      data.design_description,
      data.style_sketch,
      data.notes,
      data.created_by
    );
    
    this.addOperationHistory({
      operation_type: 'create',
      entity_type: 'style_confirmation',
      entity_id: result.lastInsertRowid,
      description: `创建了款式确认 - ${data.style_name}`,
      operator_id: data.created_by
    });
    
    return result.lastInsertRowid;
  }

  getStyleConfirmations(filters = {}) {
    let query = `
      SELECT 
        sc.*,
        e.name as approved_by_name,
        ce.name as created_by_name,
        a.customer_name
      FROM style_confirmations sc
      LEFT JOIN employees e ON sc.approved_by = e.id
      LEFT JOIN employees ce ON sc.created_by = ce.id
      LEFT JOIN appointments a ON sc.appointment_id = a.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.appointment_id) {
      query += ' AND sc.appointment_id = ?';
      params.push(filters.appointment_id);
    }
    
    if (filters.approval_status) {
      query += ' AND sc.approval_status = ?';
      params.push(filters.approval_status);
    }
    
    query += ' ORDER BY sc.created_at DESC';
    
    return this.db.prepare(query).all(...params);
  }

  getStyleConfirmation(id) {
    const confirmation = this.db.prepare(`
      SELECT 
        sc.*,
        e.name as approved_by_name,
        ce.name as created_by_name,
        a.customer_name,
        a.customer_phone
      FROM style_confirmations sc
      LEFT JOIN employees e ON sc.approved_by = e.id
      LEFT JOIN employees ce ON sc.created_by = ce.id
      LEFT JOIN appointments a ON sc.appointment_id = a.id
      WHERE sc.id = ?
    `).get(id);
    
    return confirmation;
  }

  updateStyleConfirmation(id, data) {
    this.db.prepare(`
      UPDATE style_confirmations SET
        style_name = COALESCE(?, style_name),
        style_type = COALESCE(?, style_type),
        design_description = COALESCE(?, design_description),
        style_sketch = COALESCE(?, style_sketch),
        approval_status = COALESCE(?, approval_status),
        approved_by = COALESCE(?, approved_by),
        approved_at = CASE WHEN ? = 'approved' OR ? = 'rejected' THEN CURRENT_TIMESTAMP ELSE approved_at END,
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.style_name,
      data.style_type,
      data.design_description,
      data.style_sketch,
      data.approval_status,
      data.approved_by,
      data.approval_status,
      data.approval_status,
      data.notes,
      id
    );
    
    if (data.approval_status) {
      this.addOperationHistory({
        operation_type: data.approval_status,
        entity_type: 'style_confirmation',
        entity_id: id,
        description: `款式确认${data.approval_status === 'approved' ? '已批准' : '已拒绝'} - ${data.style_name || ''}`,
        operator_id: data.approved_by
      });
    }
    
    return id;
  }

  createFittingRecord(data) {
    const result = this.db.prepare(`
      INSERT INTO fitting_records 
      (appointment_id, fitting_stage, fitting_date, fit_rating, issues, adjustments, notes, fitter_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.appointment_id,
      data.fitting_stage,
      data.fitting_date,
      data.fit_rating,
      data.issues,
      data.adjustments,
      data.notes,
      data.fitter_id
    );
    
    this.addOperationHistory({
      operation_type: 'create',
      entity_type: 'fitting_record',
      entity_id: result.lastInsertRowid,
      description: `创建了试衣记录 - ${data.fitting_stage}`,
      operator_id: data.fitter_id
    });
    
    return result.lastInsertRowid;
  }

  getFittingRecords(appointmentId) {
    return this.db.prepare(`
      SELECT fr.*, e.name as fitter_name
      FROM fitting_records fr
      LEFT JOIN employees e ON fr.fitter_id = e.id
      WHERE fr.appointment_id = ?
      ORDER BY fr.fitting_date DESC
    `).all(appointmentId);
  }

  addOperationHistory(data) {
    let operatorName = data.operator_name;
    
    if (!operatorName && data.operator_id) {
      const employee = this.db.prepare('SELECT name FROM employees WHERE id = ?').get(data.operator_id);
      operatorName = employee ? employee.name : '未知';
    } else if (!operatorName) {
      operatorName = '系统';
    }
    
    this.db.prepare(`
      INSERT INTO operation_history 
      (operation_type, entity_type, entity_id, description, operator_id, operator_name, old_data, new_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.operation_type,
      data.entity_type,
      data.entity_id,
      data.description,
      data.operator_id,
      operatorName,
      data.old_data,
      data.new_data
    );
  }

  getOperationHistory(filters = {}) {
    let query = `
      SELECT * FROM operation_history
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.entity_type) {
      query += ' AND entity_type = ?';
      params.push(filters.entity_type);
    }
    
    if (filters.entity_id) {
      query += ' AND entity_id = ?';
      params.push(filters.entity_id);
    }
    
    if (filters.operator_id) {
      query += ' AND operator_id = ?';
      params.push(filters.operator_id);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(filters.limit || 100);
    
    return this.db.prepare(query).all(...params);
  }

  getRecentItems() {
    return this.db.prepare(`
      SELECT * FROM recent_items
      ORDER BY last_accessed DESC
      LIMIT 10
    `).all();
  }

  addRecentItem(data) {
    this.db.prepare(`
      DELETE FROM recent_items WHERE item_type = ? AND item_id = ?
    `).run(data.item_type, data.item_id);
    
    this.db.prepare(`
      INSERT INTO recent_items (item_type, item_id, item_title, accessed_by)
      VALUES (?, ?, ?, ?)
    `).run(data.item_type, data.item_id, data.item_title, data.accessed_by);
    
    this.db.prepare(`
      DELETE FROM recent_items WHERE id NOT IN (
        SELECT id FROM recent_items ORDER BY last_accessed DESC LIMIT 20
      )
    `).run();
  }

  getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    
    const stats = {
      pending_appointments: this.db.prepare(`
        SELECT COUNT(*) as count FROM appointments 
        WHERE status = 'pending' AND appointment_date BETWEEN ? AND ?
      `).get(today, weekLater).count,
      
      in_progress_appointments: this.db.prepare(`
        SELECT COUNT(*) as count FROM appointments 
        WHERE status = 'in_progress'
      `).get().count,
      
      today_appointments: this.db.prepare(`
        SELECT COUNT(*) as count FROM appointments 
        WHERE appointment_date = ?
      `).get(today).count,
      
      pending_style_confirmations: this.db.prepare(`
        SELECT COUNT(*) as count FROM style_confirmations 
        WHERE approval_status = 'pending'
      `).get().count,
      
      rejected_style_confirmations: this.db.prepare(`
        SELECT COUNT(*) as count FROM style_confirmations 
        WHERE approval_status = 'rejected'
      `).get().count
    };
    
    return stats;
  }

  getRiskItems() {
    const riskItems = [];
    
    const incompleteMeasurements = this.db.prepare(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM measurements m WHERE m.appointment_id = a.id) as measurement_count
      FROM appointments a
      LEFT JOIN measurements m ON a.id = m.appointment_id
      WHERE a.status IN ('pending', 'confirmed', 'in_progress')
      GROUP BY a.id
      HAVING measurement_count = 0
    `).all();
    
    incompleteMeasurements.forEach(item => {
      riskItems.push({
        type: 'measurement_missing',
        severity: 'high',
        appointment_id: item.id,
        customer_name: item.customer_name,
        message: '缺少量体数据',
        appointment_date: item.appointment_date
      });
    });
    
    const incompleteStyleConfirmations = this.db.prepare(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM style_confirmations sc WHERE sc.appointment_id = a.id AND sc.approval_status = 'pending') as pending_styles
      FROM appointments a
      WHERE a.status IN ('pending', 'confirmed', 'in_progress')
    `).all().filter(item => item.pending_styles > 0);
    
    incompleteStyleConfirmations.forEach(item => {
      riskItems.push({
        type: 'style_unconfirmed',
        severity: 'medium',
        appointment_id: item.id,
        customer_name: item.customer_name,
        message: `有 ${item.pending_styles} 个款式待确认`,
        appointment_date: item.appointment_date
      });
    });
    
    const delayedAppointments = this.db.prepare(`
      SELECT a.*, 
        (SELECT MAX(fr.fitting_date) FROM fitting_records fr WHERE fr.appointment_id = a.id) as last_fitting
      FROM appointments a
      WHERE a.status = 'in_progress'
        AND a.appointment_date < date('now', '-7 days')
        AND last_fitting < date('now', '-7 days')
    `).all();
    
    delayedAppointments.forEach(item => {
      riskItems.push({
        type: 'delayed',
        severity: 'high',
        appointment_id: item.id,
        customer_name: item.customer_name,
        message: '订单进度延迟',
        appointment_date: item.appointment_date
      });
    });
    
    return riskItems;
  }

  createTodo(data) {
    const result = this.db.prepare(`
      INSERT INTO todos 
      (appointment_id, title, description, assignee_id, assignee_role, priority, due_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.appointment_id,
      data.title,
      data.description,
      data.assignee_id,
      data.assignee_role,
      data.priority || 'medium',
      data.due_date,
      data.created_by || 1
    );
    
    this.addOperationHistory({
      operation_type: 'create',
      entity_type: 'todo',
      entity_id: result.lastInsertRowid,
      description: `创建待办: ${data.title}`,
      operator_id: data.created_by
    });
    
    return result.lastInsertRowid;
  }

  getTodos(filters = {}) {
    let query = `
      SELECT 
        t.*,
        a.customer_name,
        e.name as assignee_name,
        ce.name as created_by_name
      FROM todos t
      LEFT JOIN appointments a ON t.appointment_id = a.id
      LEFT JOIN employees e ON t.assignee_id = e.id
      LEFT JOIN employees ce ON t.created_by = ce.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.appointment_id) {
      query += ' AND t.appointment_id = ?';
      params.push(filters.appointment_id);
    }
    
    if (filters.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }
    
    if (filters.assignee_id) {
      query += ' AND t.assignee_id = ?';
      params.push(filters.assignee_id);
    }
    
    if (filters.assignee_role) {
      query += ' AND t.assignee_role = ?';
      params.push(filters.assignee_role);
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    return this.db.prepare(query).all(...params);
  }

  updateTodo(id, data) {
    const result = this.db.prepare(`
      UPDATE todos SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        assignee_id = COALESCE(?, assignee_id),
        assignee_role = COALESCE(?, assignee_role),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `).run(
      data.title,
      data.description,
      data.assignee_id,
      data.assignee_role,
      data.status,
      data.priority,
      data.due_date,
      data.status,
      id
    );
    
    return id;
  }

  deleteTodo(id) {
    this.db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    return id;
  }

  updateAppointmentOwner(appointmentId, ownerId, ownerRole) {
    this.db.prepare(`
      UPDATE appointments SET
        current_owner_id = ?,
        current_owner_role = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ownerId, ownerRole, appointmentId);
    
    return appointmentId;
  }

  getAppointmentsWithOwner() {
    return this.db.prepare(`
      SELECT 
        a.*,
        t.name as tailor_name,
        pm.name as pattern_maker_name,
        cs.name as customer_service_name,
        co.name as current_owner_name
      FROM appointments a
      LEFT JOIN employees t ON a.tailor_id = t.id
      LEFT JOIN employees pm ON a.pattern_maker_id = pm.id
      LEFT JOIN employees cs ON a.customer_service_id = cs.id
      LEFT JOIN employees co ON a.current_owner_id = co.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `).all();
  }

  getEmployees() {
    return this.db.prepare(`
      SELECT * FROM employees ORDER BY role, name
    `).all();
  }
}

module.exports = AppDatabase;
