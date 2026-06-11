"use strict";
const electron = require("electron");
const path = require("path");
const Database = require("better-sqlite3");
let db = null;
function initDb() {
  const dbPath = path.join(electron.app.getPath("userData"), "weak_current.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  createTables();
  seedIfEmpty();
  return db;
}
function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
function createTables() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      project_code TEXT UNIQUE,
      client_name TEXT,
      site_address TEXT,
      project_manager TEXT,
      construction_team TEXT,
      document_staff TEXT,
      status TEXT NOT NULL DEFAULT 'pending_survey',
      priority TEXT DEFAULT 'normal',
      description TEXT,
      risk_level TEXT DEFAULT 'none',
      risk_reason TEXT,
      completion_docs_status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_opened_at TEXT
    )
  `);
  d.exec(`
    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      survey_date TEXT,
      surveyor TEXT,
      submitted_by TEXT,
      submitted_at TEXT,
      confirmed_by TEXT,
      confirmed_at TEXT,
      site_condition TEXT,
      power_environment TEXT,
      cable_route TEXT,
      cable_route_structured TEXT,
      equipment_position TEXT,
      ground_condition TEXT,
      existing_lines TEXT,
      difficulty_points TEXT,
      remarks TEXT,
      attachment_paths TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  d.exec(`
    CREATE TABLE IF NOT EXISTS wiring_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      plan_version TEXT,
      work_face TEXT,
      previous_conclusion TEXT,
      wiring_method TEXT,
      cable_spec TEXT,
      cable_length REAL,
      conduit_spec TEXT,
      conduit_length REAL,
      planned_materials TEXT,
      remarks TEXT,
      status TEXT DEFAULT 'draft',
      created_by TEXT,
      confirmed_by TEXT,
      confirmed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  d.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_code TEXT,
      material_name TEXT NOT NULL,
      category TEXT,
      spec TEXT,
      unit TEXT,
      stock_quantity REAL DEFAULT 0,
      unit_price REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  d.exec(`
    CREATE TABLE IF NOT EXISTS project_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      planned_qty REAL DEFAULT 0,
      used_qty REAL DEFAULT 0,
      returned_qty REAL DEFAULT 0,
      is_overrun INTEGER DEFAULT 0,
      overrun_approved_by TEXT,
      overrun_reason TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id)
    )
  `);
  d.exec(`
    CREATE TABLE IF NOT EXISTS material_usage_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      usage_type TEXT DEFAULT '领出',
      work_face TEXT,
      operator TEXT,
      approver TEXT,
      is_overrun INTEGER DEFAULT 0,
      remarks TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id)
    )
  `);
  d.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      action_type TEXT NOT NULL,
      action_detail TEXT,
      operator TEXT DEFAULT '系统',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);
}
function seedIfEmpty() {
  const d = getDb();
  const count = d.prepare("SELECT COUNT(*) as count FROM projects").get();
  if (count.count > 0) return;
  const insertProject = d.prepare(`
    INSERT INTO projects (project_name, project_code, client_name, site_address, project_manager, construction_team, document_staff, status, priority, description, risk_level, risk_reason, completion_docs_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertActivity = d.prepare(`
    INSERT INTO activity_logs (project_id, action_type, action_detail, operator, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertSurvey = d.prepare(`
    INSERT INTO surveys (project_id, survey_date, surveyor, submitted_by, submitted_at, confirmed_by, confirmed_at, site_condition, power_environment, cable_route, cable_route_structured, equipment_position, ground_condition, existing_lines, difficulty_points, remarks, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertWiringPlan = d.prepare(`
    INSERT INTO wiring_plans (project_id, plan_version, work_face, previous_conclusion, wiring_method, cable_spec, cable_length, conduit_spec, conduit_length, planned_materials, remarks, status, created_by, confirmed_by, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMaterial = d.prepare(`
    INSERT INTO materials (material_code, material_name, category, spec, unit, stock_quantity, unit_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertProjectMaterial = d.prepare(`
    INSERT INTO project_materials (project_id, material_id, planned_qty, used_qty, returned_qty, is_overrun, overrun_approved_by, overrun_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertUsageRecord = d.prepare(`
    INSERT INTO material_usage_records (project_id, material_id, quantity, usage_type, work_face, operator, approver, is_overrun, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const projects = [
    {
      name: "智慧大厦综合布线工程",
      code: "RD2026001",
      client: "智慧科技有限公司",
      address: "北京市朝阳区建国路88号",
      manager: "张工",
      team: "一班",
      docs: "刘资料员",
      status: "pending_survey",
      priority: "high",
      desc: "新建办公楼弱电综合布线，包括网络、电话、监控系统",
      risk: "high",
      riskReason: "工期紧张，需在30天内完成，客户方进场时间有冲突",
      docsStatus: "pending",
      created: "2026-06-01 09:00:00"
    },
    {
      name: "阳光小区监控改造项目",
      code: "RD2026002",
      client: "阳光物业管理公司",
      address: "上海市浦东新区张江路123号",
      manager: "李工",
      team: "二班",
      docs: "王资料员",
      status: "survey_submitted",
      priority: "medium",
      desc: "小区监控系统升级改造，新增高清摄像头50个",
      risk: "medium",
      riskReason: "现场环境复杂，老线路改造难度大，部分桥架锈蚀需更换",
      docsStatus: "pending",
      created: "2026-05-28 14:30:00"
    },
    {
      name: "创新园区数据中心建设",
      code: "RD2026003",
      client: "创新产业园运营公司",
      address: "深圳市南山区科技园路99号",
      manager: "王工",
      team: "三班",
      docs: "赵资料员",
      status: "wiring_planned",
      priority: "high",
      desc: "数据中心机房建设，含UPS、精密空调、综合布线",
      risk: "none",
      riskReason: "",
      docsStatus: "in_progress",
      created: "2026-05-20 10:15:00"
    },
    {
      name: "悦达商场智能照明系统",
      code: "RD2026004",
      client: "悦达商业集团",
      address: "广州市天河区天河路56号",
      manager: "赵工",
      team: "一班",
      docs: "钱资料员",
      status: "in_progress",
      priority: "medium",
      desc: "商场智能照明控制系统安装调试",
      risk: "low",
      riskReason: "部分区域夜间施工受限，材料有超领预警",
      docsStatus: "pending",
      created: "2026-05-10 08:45:00"
    },
    {
      name: "金茂酒店弱电维保",
      code: "RD2026005",
      client: "金茂酒店管理公司",
      address: "成都市锦江区春熙路66号",
      manager: "陈工",
      team: "二班",
      docs: "孙资料员",
      status: "completed",
      priority: "low",
      desc: "酒店弱电系统年度维保服务",
      risk: "none",
      riskReason: "",
      docsStatus: "done",
      created: "2026-04-15 16:00:00"
    }
  ];
  const materials = [
    { code: "MAT001", name: "六类非屏蔽网线", category: "线缆", spec: "CAT6 UTP 305m/箱", unit: "箱", stock: 50, price: 580 },
    { code: "MAT002", name: "单模光缆", category: "线缆", spec: "4芯 室内", unit: "米", stock: 2e3, price: 3.5 },
    { code: "MAT003", name: "PVC线管", category: "管材", spec: "Φ20mm", unit: "米", stock: 5e3, price: 2.8 },
    { code: "MAT004", name: "镀锌钢管", category: "管材", spec: "Φ25mm", unit: "米", stock: 1e3, price: 12.5 },
    { code: "MAT005", name: "网络配线架", category: "设备", spec: "24口 六类", unit: "个", stock: 30, price: 280 },
    { code: "MAT006", name: "高清网络摄像机", category: "设备", spec: "400万像素", unit: "台", stock: 80, price: 1200 }
  ];
  const transaction = d.transaction(() => {
    const projectIds = [];
    const materialIds = [];
    projects.forEach((p, idx) => {
      const result = insertProject.run(
        p.name,
        p.code,
        p.client,
        p.address,
        p.manager,
        p.team,
        p.docs,
        p.status,
        p.priority,
        p.desc,
        p.risk,
        p.riskReason,
        p.docsStatus,
        p.created
      );
      projectIds.push(result.lastInsertRowid);
      insertActivity.run(
        result.lastInsertRowid,
        "create_project",
        `创建项目：${p.name}`,
        "系统",
        p.created
      );
    });
    materials.forEach((m) => {
      const r = insertMaterial.run(m.code, m.name, m.category, m.spec, m.unit, m.stock, m.price);
      materialIds.push(r.lastInsertRowid);
    });
    insertSurvey.run(
      projectIds[1],
      "2026-05-29",
      "李工",
      "李工",
      "2026-05-29 17:30:00",
      null,
      null,
      "小区环境良好，有弱电井可利用，路面硬化完成",
      "各楼栋配电房供电正常，门卫室有机柜位置",
      "走弱电井和楼栋间桥架，主干道地下管道",
      "起点:门卫室机房 → 1号楼弱电井 → 2号楼弱电井 → 3号楼弱电井 → 地下车库监控点",
      "门卫室、各出入口、停车场、主干道、电梯轿厢",
      "地面为水泥地，主干道可开槽，绿化带走PVC管",
      "老同轴电缆部分可用，建议新增独立管线，预留3个备用点位",
      "老线路改造需与物业确认停电时间，周末施工优先",
      "submitted"
    );
    insertActivity.run(
      projectIds[1],
      "submit_survey",
      "提交现场勘查报告，等待项目经理审核",
      "李工",
      "2026-05-29 17:30:00"
    );
    insertSurvey.run(
      projectIds[2],
      "2026-05-22",
      "王工",
      "王工",
      "2026-05-22 16:00:00",
      "技术总监",
      "2026-05-23 10:00:00",
      "机房场地已就绪，地面做了架空30cm，墙面已刷白",
      "有专用配电房，双路供电，UPS位置已预留",
      "上走线桥架，分强弱电桥架，间距30cm",
      "强电桥架: 配电房 → 服务器区 → 网络区; 弱电桥架: 进线间 → 网络区 → 服务器区 → 存储区",
      "服务器机柜12个、网络机柜4个、存储机柜2个位置已定",
      "架空地板30cm，下走线备用",
      "无老旧线路，全新建设",
      "需配合装修进度，空调安装完成后再进场布线",
      "approved"
    );
    insertActivity.run(
      projectIds[2],
      "submit_survey",
      "提交勘查报告",
      "王工",
      "2026-05-22 16:00:00"
    );
    insertActivity.run(
      projectIds[2],
      "approve_survey",
      "审核通过勘查报告，可进入布线规划阶段",
      "技术总监",
      "2026-05-23 10:00:00"
    );
    const plannedMats = JSON.stringify([
      { material_id: materialIds[0], qty: 30, remark: "六类网线" },
      { material_id: materialIds[2], qty: 500, remark: "PVC线管" },
      { material_id: materialIds[3], qty: 100, remark: "镀锌钢管" }
    ]);
    insertWiringPlan.run(
      projectIds[2],
      "V1.0",
      "主机房",
      "勘查结论：机房条件良好，架空地板适合上走线，双路供电满足要求，可按标准方案实施。注意事项：需避开空调管路和消防喷淋。",
      "上走线桥架（强弱电分离）",
      "六类非屏蔽、4芯单模光缆",
      5e3,
      "镀锌桥架 200*100",
      200,
      plannedMats,
      "机房分三个区域：服务器区、网络区、存储区；每个区域独立汇聚；光缆预留100%冗余",
      "confirmed",
      "王工",
      "项目经理",
      "2026-05-25 14:00:00"
    );
    insertActivity.run(
      projectIds[2],
      "create_wiring_plan",
      "创建布线计划 V1.0",
      "王工",
      "2026-05-24 09:00:00"
    );
    insertActivity.run(
      projectIds[2],
      "confirm_wiring_plan",
      "确认布线计划 V1.0，材料计划已同步",
      "项目经理",
      "2026-05-25 14:00:00"
    );
    insertProjectMaterial.run(projectIds[3], materialIds[0], 20, 25, 0, 1, "项目经理", "现场点位增加，客户确认");
    insertProjectMaterial.run(projectIds[3], materialIds[2], 600, 800, 0, 1, "项目经理", "路径变更，增加弯头和预留");
    insertProjectMaterial.run(projectIds[2], materialIds[0], 30, 0, 0, 0, null, null);
    insertProjectMaterial.run(projectIds[2], materialIds[2], 500, 0, 0, 0, null, null);
    insertUsageRecord.run(projectIds[3], materialIds[0], 20, "领出", "一楼公共区域", "赵工", null, 0, "照明控制系统布线");
    insertUsageRecord.run(projectIds[3], materialIds[0], 5, "领出", "二楼办公区", "赵工", "项目经理", 1, "超领：新增5个AP点位，客户已确认");
    insertUsageRecord.run(projectIds[3], materialIds[2], 600, "领出", "一楼公共区域", "赵工", null, 0, "照明控制系统布线");
    insertUsageRecord.run(projectIds[3], materialIds[2], 200, "领出", "二楼办公区", "赵工", "项目经理", 1, "超领：路由调整，增加绕行距离");
    insertActivity.run(projectIds[0], "status_change", "项目状态变更为：待勘查", "系统", "2026-06-01 09:00:00");
    insertActivity.run(projectIds[1], "status_change", "项目状态变更为：待审核勘查", "系统", "2026-05-29 17:30:00");
    insertActivity.run(projectIds[2], "status_change", "项目状态变更为：布线已规划", "系统", "2026-05-25 14:00:00");
    insertActivity.run(projectIds[3], "status_change", "项目状态变更为：施工中", "系统", "2026-05-15 09:00:00");
    insertActivity.run(projectIds[3], "material_overrun", "材料超领预警：六类网线超5箱、PVC管超200米", "系统", "2026-06-05 11:20:00");
    insertActivity.run(projectIds[4], "status_change", "项目状态变更为：已完成", "系统", "2026-05-20 16:00:00");
    insertActivity.run(projectIds[4], "complete_project", "项目竣工验收通过，竣工资料已归档", "陈工", "2026-05-20 16:30:00");
  });
  transaction();
}
function addActivityLog(projectId, actionType, detail, operator = "系统") {
  const db2 = getDb();
  db2.prepare(`
    INSERT INTO activity_logs (project_id, action_type, action_detail, operator)
    VALUES (?, ?, ?, ?)
  `).run(projectId, actionType, detail, operator);
}
function updateProjectStatus(projectId, newStatus) {
  const db2 = getDb();
  db2.prepare(`
    UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newStatus, projectId);
  addActivityLog(projectId, "status_change", `项目状态变更为：${getStatusLabel(newStatus)}`);
}
function getStatusLabel(status) {
  const labels = {
    pending_survey: "待勘查",
    survey_submitted: "待审核勘查",
    wiring_planned: "布线已规划",
    in_progress: "施工中",
    completed: "已完成"
  };
  return labels[status] || status;
}
function registerIpc(ipcMain) {
  ipcMain.handle("getProjects", (_event, filters) => {
    const db2 = getDb();
    let sql = "SELECT * FROM projects WHERE 1=1";
    const params = [];
    if (filters == null ? void 0 : filters.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }
    if ((filters == null ? void 0 : filters.status_in) && filters.status_in.length > 0) {
      const placeholders = filters.status_in.map(() => "?").join(", ");
      sql += ` AND status IN (${placeholders})`;
      params.push(...filters.status_in);
    }
    if (filters == null ? void 0 : filters.keyword) {
      sql += " AND (project_name LIKE ? OR project_code LIKE ? OR client_name LIKE ? OR site_address LIKE ? OR project_manager LIKE ?)";
      const kw = `%${filters.keyword}%`;
      params.push(kw, kw, kw, kw, kw);
    }
    if ((filters == null ? void 0 : filters.risk) && filters.risk !== "none") {
      sql += " AND risk_level != ?";
      params.push("none");
    }
    if (filters == null ? void 0 : filters.material_overuse) {
      sql += " AND id IN (SELECT DISTINCT project_id FROM project_materials WHERE is_overrun = 1)";
    }
    if (filters == null ? void 0 : filters.completion_docs_pending) {
      sql += " AND completion_docs_status != 'done' AND completion_docs_status != 'completed'";
    }
    sql += " ORDER BY updated_at DESC";
    return db2.prepare(sql).all(...params);
  });
  ipcMain.handle("getProjectById", (_event, id) => {
    const db2 = getDb();
    return db2.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  });
  ipcMain.handle("createProject", (_event, data) => {
    const db2 = getDb();
    const result = db2.prepare(`
      INSERT INTO projects (project_name, project_code, client_name, site_address, project_manager, priority, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.project_name,
      data.project_code,
      data.client_name,
      data.site_address,
      data.project_manager,
      data.priority || "normal",
      data.description
    );
    addActivityLog(result.lastInsertRowid, "create_project", `创建项目：${data.project_name}`);
    return result.lastInsertRowid;
  });
  ipcMain.handle("updateProject", (_event, id, data) => {
    const db2 = getDb();
    const fields = Object.keys(data).filter((k) => data[k] !== void 0);
    if (fields.length === 0) return;
    const setClauses = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => data[f]);
    values.push(id);
    db2.prepare(`UPDATE projects SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
    addActivityLog(id, "update_project", "更新项目信息");
  });
  ipcMain.handle("deleteProject", (_event, id) => {
    const db2 = getDb();
    const project = db2.prepare("SELECT project_name FROM projects WHERE id = ?").get(id);
    db2.prepare("DELETE FROM projects WHERE id = ?").run(id);
    addActivityLog(null, "delete_project", `删除项目：${(project == null ? void 0 : project.project_name) || id}`);
  });
  ipcMain.handle("getSurveyByProjectId", (_event, projectId) => {
    const db2 = getDb();
    return db2.prepare("SELECT * FROM surveys WHERE project_id = ? ORDER BY id DESC LIMIT 1").get(projectId);
  });
  ipcMain.handle("saveSurvey", (_event, projectId, data) => {
    const db2 = getDb();
    const existing = db2.prepare("SELECT id FROM surveys WHERE project_id = ?").get(projectId);
    if (existing) {
      db2.prepare(`
        UPDATE surveys SET survey_date = ?, surveyor = ?, site_condition = ?, 
          power_environment = ?, cable_route = ?, cable_route_structured = ?, equipment_position = ?, 
          ground_condition = ?, existing_lines = ?, difficulty_points = ?, remarks = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        data.survey_date,
        data.surveyor,
        data.site_condition,
        data.power_environment,
        data.cable_route,
        data.cable_route_structured,
        data.equipment_position,
        data.ground_condition,
        data.existing_lines,
        data.difficulty_points,
        data.remarks,
        data.status || "draft",
        existing.id
      );
      addActivityLog(projectId, "update_survey", "更新现场勘查记录");
      return existing.id;
    } else {
      const result = db2.prepare(`
        INSERT INTO surveys (project_id, survey_date, surveyor, site_condition, 
          power_environment, cable_route, cable_route_structured, equipment_position, ground_condition, existing_lines, difficulty_points, remarks, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        projectId,
        data.survey_date,
        data.surveyor,
        data.site_condition,
        data.power_environment,
        data.cable_route,
        data.cable_route_structured,
        data.equipment_position,
        data.ground_condition,
        data.existing_lines,
        data.difficulty_points,
        data.remarks,
        data.status || "draft"
      );
      addActivityLog(projectId, "create_survey", "创建现场勘查记录");
      return result.lastInsertRowid;
    }
  });
  ipcMain.handle("submitSurvey", (_event, projectId, operator) => {
    const db2 = getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
    db2.prepare("UPDATE surveys SET status = ?, submitted_by = ?, submitted_at = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ?").run(
      "submitted",
      operator || "系统",
      now,
      projectId
    );
    updateProjectStatus(projectId, "survey_submitted");
    addActivityLog(projectId, "submit_survey", "提交现场勘查报告", operator || "系统");
  });
  ipcMain.handle("approveSurvey", (_event, projectId, operator) => {
    const db2 = getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
    db2.prepare("UPDATE surveys SET status = ?, confirmed_by = ?, confirmed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ?").run(
      "approved",
      operator || "系统",
      now,
      projectId
    );
    addActivityLog(projectId, "approve_survey", "审核通过勘查报告", operator || "系统");
  });
  ipcMain.handle("getWiringPlansByProjectId", (_event, projectId) => {
    const db2 = getDb();
    return db2.prepare("SELECT * FROM wiring_plans WHERE project_id = ? ORDER BY id DESC").all(projectId);
  });
  ipcMain.handle("saveWiringPlan", (_event, projectId, data) => {
    const db2 = getDb();
    if (data.id) {
      db2.prepare(`
        UPDATE wiring_plans SET plan_version = ?, work_face = ?, previous_conclusion = ?,
          wiring_method = ?, cable_spec = ?, cable_length = ?, conduit_spec = ?,
          conduit_length = ?, planned_materials = ?, remarks = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        data.plan_version,
        data.work_face,
        data.previous_conclusion,
        data.wiring_method,
        data.cable_spec,
        data.cable_length,
        data.conduit_spec,
        data.conduit_length,
        typeof data.planned_materials === "object" ? JSON.stringify(data.planned_materials) : data.planned_materials,
        data.remarks,
        data.status || "draft",
        data.id
      );
      addActivityLog(projectId, "update_wiring_plan", `更新布线计划：${data.plan_version}`);
      return data.id;
    } else {
      const result = db2.prepare(`
        INSERT INTO wiring_plans (project_id, plan_version, work_face, previous_conclusion,
          wiring_method, cable_spec, cable_length, conduit_spec, conduit_length, planned_materials, remarks, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        projectId,
        data.plan_version,
        data.work_face,
        data.previous_conclusion,
        data.wiring_method,
        data.cable_spec,
        data.cable_length,
        data.conduit_spec,
        data.conduit_length,
        typeof data.planned_materials === "object" ? JSON.stringify(data.planned_materials) : data.planned_materials,
        data.remarks,
        data.status || "draft",
        data.created_by || "系统"
      );
      addActivityLog(projectId, "create_wiring_plan", `创建布线计划：${data.plan_version}`);
      return result.lastInsertRowid;
    }
  });
  ipcMain.handle("confirmWiringPlan", (_event, projectId, planId, operator) => {
    const db2 = getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
    db2.prepare("UPDATE wiring_plans SET status = ?, confirmed_by = ?, confirmed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      "confirmed",
      operator || "系统",
      now,
      planId
    );
    updateProjectStatus(projectId, "wiring_planned");
    addActivityLog(projectId, "confirm_wiring_plan", "确认布线计划", operator || "系统");
  });
  ipcMain.handle("getMaterials", () => {
    const db2 = getDb();
    return db2.prepare("SELECT * FROM materials ORDER BY id").all();
  });
  ipcMain.handle("getMaterialUsageByProjectId", (_event, projectId) => {
    const db2 = getDb();
    return db2.prepare(`
      SELECT mur.*, m.material_name, m.spec, m.unit, m.unit_price, pm.planned_qty, pm.used_qty as project_used_qty
      FROM material_usage_records mur
      LEFT JOIN materials m ON mur.material_id = m.id
      LEFT JOIN project_materials pm ON mur.project_id = pm.project_id AND mur.material_id = pm.material_id
      WHERE mur.project_id = ?
      ORDER BY mur.created_at DESC
    `).all(projectId);
  });
  ipcMain.handle("addMaterialUsage", (_event, projectId, data) => {
    const db2 = getDb();
    const txn = db2.transaction(() => {
      const pm = db2.prepare("SELECT * FROM project_materials WHERE project_id = ? AND material_id = ?").get(projectId, data.material_id);
      const plannedQty = pm ? pm.planned_qty : 0;
      const currentUsed = pm ? pm.used_qty : 0;
      const newUsed = currentUsed + data.quantity;
      const isOverrun = newUsed > plannedQty && plannedQty > 0 ? 1 : 0;
      if (pm) {
        db2.prepare("UPDATE project_materials SET used_qty = ?, is_overrun = MAX(is_overrun, ?) WHERE id = ?").run(newUsed, isOverrun, pm.id);
      }
      db2.prepare("UPDATE materials SET stock_quantity = stock_quantity - ? WHERE id = ?").run(data.quantity, data.material_id);
      const result = db2.prepare("INSERT INTO material_usage_records (project_id, material_id, quantity, usage_type, work_face, operator, remarks, approver, is_overrun) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        projectId,
        data.material_id,
        data.quantity,
        data.usage_type,
        data.work_face,
        data.operator,
        data.remarks,
        data.approver || null,
        isOverrun
      );
      addActivityLog(projectId, "material_usage", "材料领用：" + data.material_name + " x" + data.quantity + (isOverrun ? " (超领预警)" : ""));
      return { id: result.lastInsertRowid, is_overrun: isOverrun };
    });
    return txn();
  });
  ipcMain.handle("getActivityLogs", (_event, projectId, limit = 20) => {
    const db2 = getDb();
    if (projectId) {
      return db2.prepare(`
        SELECT * FROM activity_logs 
        WHERE project_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(projectId, limit);
    } else {
      return db2.prepare(`
        SELECT al.*, p.project_name 
        FROM activity_logs al
        LEFT JOIN projects p ON al.project_id = p.id
        ORDER BY al.created_at DESC 
        LIMIT ?
      `).all(limit);
    }
  });
  ipcMain.handle("getDashboardStats", () => {
    const db2 = getDb();
    const pendingSurvey = db2.prepare("SELECT COUNT(*) as count FROM projects WHERE status = ?").get("pending_survey");
    const surveySubmitted = db2.prepare("SELECT COUNT(*) as count FROM projects WHERE status = ?").get("survey_submitted");
    const wiringPlanned = db2.prepare("SELECT COUNT(*) as count FROM projects WHERE status = ?").get("wiring_planned");
    const inProgress = db2.prepare("SELECT COUNT(*) as count FROM projects WHERE status = ?").get("in_progress");
    const risky = db2.prepare("SELECT COUNT(*) as count FROM projects WHERE risk_level != ?").get("none");
    const materialOveruse = db2.prepare("SELECT COUNT(DISTINCT project_id) as count FROM project_materials WHERE is_overrun = 1").get();
    return {
      pending_survey: pendingSurvey.count,
      survey_submitted: surveySubmitted.count,
      wiring_planned: wiringPlanned.count,
      in_progress: inProgress.count,
      risky: risky.count,
      material_overuse: materialOveruse.count
    };
  });
  ipcMain.handle("getRiskyProjects", () => {
    const db2 = getDb();
    return db2.prepare(`
      SELECT * FROM projects 
      WHERE risk_level != ? 
      ORDER BY 
        CASE risk_level 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
          ELSE 4 
        END,
        updated_at DESC
    `).all("none");
  });
  ipcMain.handle("startConstruction", (_event, projectId) => {
    updateProjectStatus(projectId, "in_progress");
    addActivityLog(projectId, "start_construction", "项目开始施工");
  });
  ipcMain.handle("completeProject", (_event, projectId) => {
    updateProjectStatus(projectId, "completed");
    addActivityLog(projectId, "complete_project", "项目竣工验收通过");
  });
  ipcMain.handle("updateLastOpened", (_event, projectId) => {
    const db2 = getDb();
    db2.prepare("UPDATE projects SET last_opened_at = CURRENT_TIMESTAMP WHERE id = ?").run(projectId);
  });
  ipcMain.handle("getRecentProjects", (_event, limit = 5) => {
    const db2 = getDb();
    return db2.prepare(`
      SELECT * FROM projects 
      WHERE last_opened_at IS NOT NULL 
      ORDER BY last_opened_at DESC 
      LIMIT ?
    `).all(limit);
  });
  ipcMain.handle("getProjectMaterials", (_event, projectId) => {
    const db2 = getDb();
    return db2.prepare(`
      SELECT pm.*, m.material_code, m.material_name, m.category, m.spec, m.unit, m.stock_quantity, m.unit_price
      FROM project_materials pm
      LEFT JOIN materials m ON pm.material_id = m.id
      WHERE pm.project_id = ?
      ORDER BY pm.id
    `).all(projectId);
  });
  ipcMain.handle("getTodoList", () => {
    const db2 = getDb();
    const todos = [];
    let todoIdCounter = 1;
    const pendingSurveyProjects = db2.prepare("SELECT id, project_code, project_name, priority, created_at FROM projects WHERE status = ? ORDER BY created_at").all("pending_survey");
    pendingSurveyProjects.forEach((p) => todos.push({ id: todoIdCounter++, type: "pending_survey", project_id: p.id, project_name: p.project_name, title: "待勘查", description: "项目等待现场勘查", priority: p.priority || "normal", created_at: p.created_at }));
    const submittedSurveys = db2.prepare("SELECT p.id, p.project_code, p.project_name, p.priority, s.submitted_at, s.submitted_by FROM surveys s JOIN projects p ON s.project_id = p.id WHERE s.status = ? ORDER BY s.submitted_at").all("submitted");
    submittedSurveys.forEach((s) => todos.push({ id: todoIdCounter++, type: "survey_review", project_id: s.id, project_name: s.project_name, title: "待审核勘查", description: "由 " + (s.submitted_by || "未知") + " 提交", priority: s.priority || "normal", created_at: s.submitted_at }));
    const pendingWiringPlans = db2.prepare("SELECT p.id, p.project_code, p.project_name, p.priority, w.id as plan_id, w.plan_version, w.created_at FROM wiring_plans w JOIN projects p ON w.project_id = p.id WHERE w.status = ? ORDER BY w.created_at").all("draft");
    pendingWiringPlans.forEach((w) => todos.push({ id: todoIdCounter++, type: "wiring_confirm", project_id: w.id, project_name: w.project_name, title: "待确认布线计划", description: "版本: " + w.plan_version, priority: w.priority || "normal", created_at: w.created_at }));
    const overrunProjects = db2.prepare("SELECT DISTINCT p.id, p.project_code, p.project_name, p.priority FROM project_materials pm JOIN projects p ON pm.project_id = p.id WHERE pm.is_overrun = 1").all();
    overrunProjects.forEach((p) => todos.push({ id: todoIdCounter++, type: "material_overuse", project_id: p.id, project_name: p.project_name, title: "材料超领预警", description: "存在材料领用超计划情况", priority: p.priority || "normal", created_at: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19) }));
    todos.sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
    return todos;
  });
  ipcMain.handle("markProjectOpened", (_event, projectId) => {
    const db2 = getDb();
    db2.prepare("UPDATE projects SET last_opened_at = CURRENT_TIMESTAMP WHERE id = ?").run(projectId);
  });
  ipcMain.handle("getRecentActivity", (_event, limit = 10) => {
    const db2 = getDb();
    return db2.prepare("SELECT al.*, p.project_name FROM activity_logs al LEFT JOIN projects p ON al.project_id = p.id ORDER BY al.created_at DESC LIMIT ?").all(limit);
  });
}
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: "弱电施工管理系统",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.app.whenReady().then(() => {
  initDb();
  registerIpc(electron.ipcMain);
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
