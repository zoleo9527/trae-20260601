import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

export function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'weak_current.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  createTables()
  seedIfEmpty()
  return db
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

function createTables() {
  const d = getDb()
  
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
  `)

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
  `)

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
  `)

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
  `)

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
  `)

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
  `)

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
  `)
}

function seedIfEmpty() {
  const d = getDb()
  const count = d.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }
  
  if (count.count > 0) return

  const insertProject = d.prepare(`
    INSERT INTO projects (project_name, project_code, client_name, site_address, project_manager, construction_team, document_staff, status, priority, description, risk_level, risk_reason, completion_docs_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertActivity = d.prepare(`
    INSERT INTO activity_logs (project_id, action_type, action_detail, operator, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertSurvey = d.prepare(`
    INSERT INTO surveys (project_id, survey_date, surveyor, submitted_by, submitted_at, confirmed_by, confirmed_at, site_condition, power_environment, cable_route, cable_route_structured, equipment_position, ground_condition, existing_lines, difficulty_points, remarks, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertWiringPlan = d.prepare(`
    INSERT INTO wiring_plans (project_id, plan_version, work_face, previous_conclusion, wiring_method, cable_spec, cable_length, conduit_spec, conduit_length, planned_materials, remarks, status, created_by, confirmed_by, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMaterial = d.prepare(`
    INSERT INTO materials (material_code, material_name, category, spec, unit, stock_quantity, unit_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertProjectMaterial = d.prepare(`
    INSERT INTO project_materials (project_id, material_id, planned_qty, used_qty, returned_qty, is_overrun, overrun_approved_by, overrun_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertUsageRecord = d.prepare(`
    INSERT INTO material_usage_records (project_id, material_id, quantity, usage_type, work_face, operator, approver, is_overrun, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const projects = [
    {
      name: '智慧大厦综合布线工程',
      code: 'RD2026001',
      client: '智慧科技有限公司',
      address: '北京市朝阳区建国路88号',
      manager: '张工',
      team: '一班',
      docs: '刘资料员',
      status: 'pending_survey',
      priority: 'high',
      desc: '新建办公楼弱电综合布线，包括网络、电话、监控系统',
      risk: 'high',
      riskReason: '工期紧张，需在30天内完成，客户方进场时间有冲突',
      docsStatus: 'pending',
      created: '2026-06-01 09:00:00'
    },
    {
      name: '阳光小区监控改造项目',
      code: 'RD2026002',
      client: '阳光物业管理公司',
      address: '上海市浦东新区张江路123号',
      manager: '李工',
      team: '二班',
      docs: '王资料员',
      status: 'survey_submitted',
      priority: 'medium',
      desc: '小区监控系统升级改造，新增高清摄像头50个',
      risk: 'medium',
      riskReason: '现场环境复杂，老线路改造难度大，部分桥架锈蚀需更换',
      docsStatus: 'pending',
      created: '2026-05-28 14:30:00'
    },
    {
      name: '创新园区数据中心建设',
      code: 'RD2026003',
      client: '创新产业园运营公司',
      address: '深圳市南山区科技园路99号',
      manager: '王工',
      team: '三班',
      docs: '赵资料员',
      status: 'wiring_planned',
      priority: 'high',
      desc: '数据中心机房建设，含UPS、精密空调、综合布线',
      risk: 'none',
      riskReason: '',
      docsStatus: 'in_progress',
      created: '2026-05-20 10:15:00'
    },
    {
      name: '悦达商场智能照明系统',
      code: 'RD2026004',
      client: '悦达商业集团',
      address: '广州市天河区天河路56号',
      manager: '赵工',
      team: '一班',
      docs: '钱资料员',
      status: 'in_progress',
      priority: 'medium',
      desc: '商场智能照明控制系统安装调试',
      risk: 'low',
      riskReason: '部分区域夜间施工受限，材料有超领预警',
      docsStatus: 'pending',
      created: '2026-05-10 08:45:00'
    },
    {
      name: '金茂酒店弱电维保',
      code: 'RD2026005',
      client: '金茂酒店管理公司',
      address: '成都市锦江区春熙路66号',
      manager: '陈工',
      team: '二班',
      docs: '孙资料员',
      status: 'completed',
      priority: 'low',
      desc: '酒店弱电系统年度维保服务',
      risk: 'none',
      riskReason: '',
      docsStatus: 'done',
      created: '2026-04-15 16:00:00'
    }
  ]

  const materials = [
    { code: 'MAT001', name: '六类非屏蔽网线', category: '线缆', spec: 'CAT6 UTP 305m/箱', unit: '箱', stock: 50, price: 580 },
    { code: 'MAT002', name: '单模光缆', category: '线缆', spec: '4芯 室内', unit: '米', stock: 2000, price: 3.5 },
    { code: 'MAT003', name: 'PVC线管', category: '管材', spec: 'Φ20mm', unit: '米', stock: 5000, price: 2.8 },
    { code: 'MAT004', name: '镀锌钢管', category: '管材', spec: 'Φ25mm', unit: '米', stock: 1000, price: 12.5 },
    { code: 'MAT005', name: '网络配线架', category: '设备', spec: '24口 六类', unit: '个', stock: 30, price: 280 },
    { code: 'MAT006', name: '高清网络摄像机', category: '设备', spec: '400万像素', unit: '台', stock: 80, price: 1200 }
  ]

  const transaction = d.transaction(() => {
    const projectIds: number[] = []
    const materialIds: number[] = []
    
    projects.forEach((p, idx) => {
      const result = insertProject.run(
        p.name, p.code, p.client, p.address, p.manager,
        p.team, p.docs, p.status, p.priority, p.desc,
        p.risk, p.riskReason, p.docsStatus, p.created
      )
      projectIds.push(result.lastInsertRowid as number)

      insertActivity.run(
        result.lastInsertRowid, 'create_project',
        `创建项目：${p.name}`, '系统', p.created
      )
    })

    materials.forEach(m => {
      const r = insertMaterial.run(m.code, m.name, m.category, m.spec, m.unit, m.stock, m.price)
      materialIds.push(r.lastInsertRowid as number)
    })

    insertSurvey.run(
      projectIds[1], '2026-05-29', '李工', '李工', '2026-05-29 17:30:00',
      null, null,
      '小区环境良好，有弱电井可利用，路面硬化完成',
      '各楼栋配电房供电正常，门卫室有机柜位置',
      '走弱电井和楼栋间桥架，主干道地下管道',
      '起点:门卫室机房 → 1号楼弱电井 → 2号楼弱电井 → 3号楼弱电井 → 地下车库监控点',
      '门卫室、各出入口、停车场、主干道、电梯轿厢',
      '地面为水泥地，主干道可开槽，绿化带走PVC管',
      '老同轴电缆部分可用，建议新增独立管线，预留3个备用点位',
      '老线路改造需与物业确认停电时间，周末施工优先',
      'submitted'
    )
    insertActivity.run(
      projectIds[1], 'submit_survey',
      '提交现场勘查报告，等待项目经理审核', '李工', '2026-05-29 17:30:00'
    )

    insertSurvey.run(
      projectIds[2], '2026-05-22', '王工', '王工', '2026-05-22 16:00:00',
      '技术总监', '2026-05-23 10:00:00',
      '机房场地已就绪，地面做了架空30cm，墙面已刷白',
      '有专用配电房，双路供电，UPS位置已预留',
      '上走线桥架，分强弱电桥架，间距30cm',
      '强电桥架: 配电房 → 服务器区 → 网络区; 弱电桥架: 进线间 → 网络区 → 服务器区 → 存储区',
      '服务器机柜12个、网络机柜4个、存储机柜2个位置已定',
      '架空地板30cm，下走线备用',
      '无老旧线路，全新建设',
      '需配合装修进度，空调安装完成后再进场布线',
      'approved'
    )
    insertActivity.run(
      projectIds[2], 'submit_survey', '提交勘查报告', '王工', '2026-05-22 16:00:00'
    )
    insertActivity.run(
      projectIds[2], 'approve_survey',
      '审核通过勘查报告，可进入布线规划阶段', '技术总监', '2026-05-23 10:00:00'
    )

    const plannedMats = JSON.stringify([
      { material_id: materialIds[0], qty: 30, remark: '六类网线' },
      { material_id: materialIds[2], qty: 500, remark: 'PVC线管' },
      { material_id: materialIds[3], qty: 100, remark: '镀锌钢管' }
    ])
    insertWiringPlan.run(
      projectIds[2], 'V1.0', '主机房',
      '勘查结论：机房条件良好，架空地板适合上走线，双路供电满足要求，可按标准方案实施。注意事项：需避开空调管路和消防喷淋。',
      '上走线桥架（强弱电分离）',
      '六类非屏蔽、4芯单模光缆',
      5000,
      '镀锌桥架 200*100',
      200,
      plannedMats,
      '机房分三个区域：服务器区、网络区、存储区；每个区域独立汇聚；光缆预留100%冗余',
      'confirmed',
      '王工', '项目经理', '2026-05-25 14:00:00'
    )
    insertActivity.run(
      projectIds[2], 'create_wiring_plan', '创建布线计划 V1.0', '王工', '2026-05-24 09:00:00'
    )
    insertActivity.run(
      projectIds[2], 'confirm_wiring_plan',
      '确认布线计划 V1.0，材料计划已同步', '项目经理', '2026-05-25 14:00:00'
    )

    insertProjectMaterial.run(projectIds[3], materialIds[0], 20, 25, 0, 1, '项目经理', '现场点位增加，客户确认')
    insertProjectMaterial.run(projectIds[3], materialIds[2], 600, 800, 0, 1, '项目经理', '路径变更，增加弯头和预留')
    insertProjectMaterial.run(projectIds[2], materialIds[0], 30, 0, 0, 0, null, null)
    insertProjectMaterial.run(projectIds[2], materialIds[2], 500, 0, 0, 0, null, null)

    insertUsageRecord.run(projectIds[3], materialIds[0], 20, '领出', '一楼公共区域', '赵工', null, 0, '照明控制系统布线')
    insertUsageRecord.run(projectIds[3], materialIds[0], 5, '领出', '二楼办公区', '赵工', '项目经理', 1, '超领：新增5个AP点位，客户已确认')
    insertUsageRecord.run(projectIds[3], materialIds[2], 600, '领出', '一楼公共区域', '赵工', null, 0, '照明控制系统布线')
    insertUsageRecord.run(projectIds[3], materialIds[2], 200, '领出', '二楼办公区', '赵工', '项目经理', 1, '超领：路由调整，增加绕行距离')

    insertActivity.run(projectIds[0], 'status_change', '项目状态变更为：待勘查', '系统', '2026-06-01 09:00:00')
    insertActivity.run(projectIds[1], 'status_change', '项目状态变更为：待审核勘查', '系统', '2026-05-29 17:30:00')
    insertActivity.run(projectIds[2], 'status_change', '项目状态变更为：布线已规划', '系统', '2026-05-25 14:00:00')
    insertActivity.run(projectIds[3], 'status_change', '项目状态变更为：施工中', '系统', '2026-05-15 09:00:00')
    insertActivity.run(projectIds[3], 'material_overrun', '材料超领预警：六类网线超5箱、PVC管超200米', '系统', '2026-06-05 11:20:00')
    insertActivity.run(projectIds[4], 'status_change', '项目状态变更为：已完成', '系统', '2026-05-20 16:00:00')
    insertActivity.run(projectIds[4], 'complete_project', '项目竣工验收通过，竣工资料已归档', '陈工', '2026-05-20 16:30:00')
  })

  transaction()
}
