import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.resolve(__dirname, '../data/pigfarm.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  return _db
}

const SLA_HOURS: Record<string, number> = {
  pending_transfer: 24,
  transferred: 12,
  pending_assessment: 24,
  pending_approval: 12,
}

export function getSlaHours(status: string): number {
  return SLA_HOURS[status] || 24
}

export const STATUS_FLOW: Record<string, { next: string; responsible: string; label: string }> = {
  pending_transfer: { next: 'transferred', responsible: '繁育员', label: '确认转栏' },
  transferred: { next: 'pending_assessment', responsible: '繁育员', label: '提交评估' },
  pending_assessment: { next: 'pending_approval', responsible: '兽医', label: '完成健康评估' },
  pending_approval: { next: 'culled', responsible: '场长', label: '审批淘汰决定' },
  culled: { next: '', responsible: '', label: '已完成淘汰' },
  retained: { next: '', responsible: '', label: '已完成留养' },
}

export function initDb(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ear_tag TEXT NOT NULL,
      breed TEXT NOT NULL,
      age_days INTEGER NOT NULL,
      from_pen TEXT NOT NULL,
      to_pen TEXT NOT NULL,
      reason TEXT NOT NULL,
      remark TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending_transfer',
      operator TEXT NOT NULL,
      operator_role TEXT NOT NULL DEFAULT '繁育员',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      deadline_at TEXT,
      confirmed_at TEXT,
      submitted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL REFERENCES transfers(id),
      ear_tag TEXT NOT NULL,
      breed TEXT NOT NULL,
      age_days INTEGER NOT NULL,
      from_pen TEXT NOT NULL,
      to_pen TEXT NOT NULL,
      health_score INTEGER,
      cull_recommend INTEGER DEFAULT 0,
      vet_name TEXT,
      vet_remark TEXT DEFAULT '',
      assessed_at TEXT,
      approver_name TEXT,
      approval_remark TEXT DEFAULT '',
      approved_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending_assessment',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      deadline_at TEXT
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER,
      assessment_id INTEGER,
      operator TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT DEFAULT '',
      remark TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `)

  const count = db.prepare('SELECT COUNT(*) as cnt FROM transfers').get() as { cnt: number }
  if (count.cnt === 0) {
    seedData(db)
  }
}

function seedData(db: Database.Database): void {
  const now = new Date()
  const fmt = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  }
  const hoursAgo = (h: number) => { const d = new Date(now.getTime() - h * 3600000); return fmt(d) }
  const hoursLater = (h: number) => { const d = new Date(now.getTime() + h * 3600000); return fmt(d) }

  const insertTransfer = db.prepare(`
    INSERT INTO transfers (ear_tag, breed, age_days, from_pen, to_pen, reason, remark, status, operator, operator_role, created_at, updated_at, deadline_at, confirmed_at, submitted_at)
    VALUES (@ear_tag, @breed, @age_days, @from_pen, @to_pen, @reason, @remark, @status, @operator, @operator_role, @created_at, @updated_at, @deadline_at, @confirmed_at, @submitted_at)
  `)

  const insertAssessment = db.prepare(`
    INSERT INTO assessments (transfer_id, ear_tag, breed, age_days, from_pen, to_pen, health_score, cull_recommend, vet_name, vet_remark, assessed_at, approver_name, approval_remark, approved_at, status, created_at, updated_at, deadline_at)
    VALUES (@transfer_id, @ear_tag, @breed, @age_days, @from_pen, @to_pen, @health_score, @cull_recommend, @vet_name, @vet_remark, @assessed_at, @approver_name, @approval_remark, @approved_at, @status, @created_at, @updated_at, @deadline_at)
  `)

  const insertLog = db.prepare(`
    INSERT INTO operation_logs (transfer_id, assessment_id, operator, operator_role, action, detail, remark, created_at)
    VALUES (@transfer_id, @assessment_id, @operator, @operator_role, @action, @detail, @remark, @created_at)
  `)

  const seedRecords: any[] = [
    {
      ear_tag: 'EP2026-0301', breed: '大白', age_days: 28, from_pen: '分娩舍A3', to_pen: '保育舍B1',
      reason: '断奶转群', remark: '窝次较大，8头断奶仔猪，个体均匀度一般，注意观察弱仔',
      status: 'pending_transfer', operator: '张建国', operator_role: '繁育员',
      created_at: hoursAgo(6), updated_at: hoursAgo(6), deadline_at: hoursLater(18), confirmed_at: null, submitted_at: null,
    },
    {
      ear_tag: 'EP2026-0298', breed: '长白', age_days: 32, from_pen: '分娩舍A1', to_pen: '保育舍B2',
      reason: '断奶转群', remark: '其中1头右后肢跛行，转栏后重点关注',
      status: 'pending_transfer', operator: '张建国', operator_role: '繁育员',
      created_at: hoursAgo(30), updated_at: hoursAgo(30), deadline_at: hoursAgo(6), confirmed_at: null, submitted_at: null,
    },
    {
      ear_tag: 'EP2026-0295', breed: '杜洛克', age_days: 35, from_pen: '分娩舍A2', to_pen: '保育舍B1',
      reason: '体重不达标需并群', remark: '体况偏瘦，采食量偏低，并群后需调整饲喂方案',
      status: 'transferred', operator: '张建国', operator_role: '繁育员',
      created_at: hoursAgo(48), updated_at: hoursAgo(36), deadline_at: hoursAgo(24), confirmed_at: hoursAgo(36), submitted_at: null,
    },
    {
      ear_tag: 'EP2026-0290', breed: '大白', age_days: 40, from_pen: '保育舍B1', to_pen: '育成舍C2',
      reason: '生长发育迟缓需评估', remark: '持续消瘦2周，疑似慢性腹泻，与同栏对比明显偏小',
      status: 'pending_assessment', operator: '李秀芬', operator_role: '繁育员',
      created_at: hoursAgo(72), updated_at: hoursAgo(18), deadline_at: hoursLater(6), confirmed_at: hoursAgo(60), submitted_at: hoursAgo(18),
    },
    {
      ear_tag: 'EP2026-0285', breed: '长白', age_days: 45, from_pen: '保育舍B2', to_pen: '育成舍C1',
      reason: '关节肿大需评估', remark: '左前肢腕关节肿胀，跛行加重，已持续1周',
      status: 'pending_assessment', operator: '李秀芬', operator_role: '繁育员',
      created_at: hoursAgo(96), updated_at: hoursAgo(30), deadline_at: hoursAgo(6), confirmed_at: hoursAgo(80), submitted_at: hoursAgo(30),
    },
    {
      ear_tag: 'EP2026-0280', breed: '大白', age_days: 50, from_pen: '保育舍B1', to_pen: '育成舍C3',
      reason: '反复呼吸道症状', remark: '咳嗽持续3周，用药后反复，体重已落后同龄15%',
      status: 'pending_approval', operator: '张建国', operator_role: '繁育员',
      created_at: hoursAgo(120), updated_at: hoursAgo(8), deadline_at: hoursLater(4), confirmed_at: hoursAgo(108), submitted_at: hoursAgo(96),
    },
    {
      ear_tag: 'EP2026-0275', breed: '杜洛克', age_days: 55, from_pen: '保育舍B3', to_pen: '育成舍C2',
      reason: '严重疝气影响生长', remark: '脐疝增大明显，影响采食和行走',
      status: 'pending_approval', operator: '李秀芬', operator_role: '繁育员',
      created_at: hoursAgo(144), updated_at: hoursAgo(20), deadline_at: hoursAgo(8), confirmed_at: hoursAgo(132), submitted_at: hoursAgo(120),
    },
    {
      ear_tag: 'EP2026-0270', breed: '大白', age_days: 60, from_pen: '保育舍B2', to_pen: '育成舍C1',
      reason: '久治不愈肺炎', remark: '体温反复升高，胸片显示肺部感染灶，抗生素治疗无效',
      status: 'culled', operator: '张建国', operator_role: '繁育员',
      created_at: hoursAgo(168), updated_at: hoursAgo(60), deadline_at: null, confirmed_at: hoursAgo(156), submitted_at: hoursAgo(144),
    },
    {
      ear_tag: 'EP2026-0265', breed: '长白', age_days: 42, from_pen: '保育舍B1', to_pen: '育成舍C3',
      reason: '腹泻后恢复评估', remark: '严重腹泻后恢复良好，体重已追上同龄',
      status: 'retained', operator: '李秀芬', operator_role: '繁育员',
      created_at: hoursAgo(192), updated_at: hoursAgo(72), deadline_at: null, confirmed_at: hoursAgo(180), submitted_at: hoursAgo(168),
    },
    {
      ear_tag: 'EP2026-0260', breed: '杜洛克', age_days: 38, from_pen: '分娩舍A3', to_pen: '保育舍B2',
      reason: '先天畸形评估', remark: '先天性肛门闭锁手术后恢复，需评估后续留养价值',
      status: 'retained', operator: '张建国', operator_role: '繁育员',
      created_at: hoursAgo(216), updated_at: hoursAgo(96), deadline_at: null, confirmed_at: hoursAgo(204), submitted_at: hoursAgo(192),
    },
  ]

  const transferIds: number[] = []

  for (const r of seedRecords) {
    const result = insertTransfer.run(r)
    transferIds.push(Number(result.lastInsertRowid))
  }

  const assessmentSeeds: any[] = [
    { idx: 3, health_score: null, cull_recommend: 0, vet_name: null, vet_remark: '', assessed_at: null, approver_name: null, approval_remark: '', approved_at: null, status: 'pending_assessment', deadline_at: hoursLater(6) },
    { idx: 4, health_score: null, cull_recommend: 0, vet_name: null, vet_remark: '', assessed_at: null, approver_name: null, approval_remark: '', approved_at: null, status: 'pending_assessment', deadline_at: hoursAgo(6) },
    { idx: 5, health_score: 3, cull_recommend: 1, vet_name: '王伟民', vet_remark: '慢性肺炎反复发作，肺实变明显，抗生素治疗3个疗程无效，建议淘汰', assessed_at: hoursAgo(8), approver_name: null, approval_remark: '', approved_at: null, status: 'pending_approval', deadline_at: hoursLater(4) },
    { idx: 6, health_score: 2, cull_recommend: 1, vet_name: '王伟民', vet_remark: '脐疝直径超过8cm，影响行走和采食，手术风险大且经济效益低，强烈建议淘汰', assessed_at: hoursAgo(20), approver_name: null, approval_remark: '', approved_at: null, status: 'pending_approval', deadline_at: hoursAgo(8) },
    { idx: 7, health_score: 2, cull_recommend: 1, vet_name: '王伟民', vet_remark: '肺部感染严重，体温41.2℃持续不退，无治疗价值', assessed_at: hoursAgo(72), approver_name: '赵明华', approval_remark: '同意淘汰，安排明日处理', approved_at: hoursAgo(60), status: 'culled', deadline_at: null },
    { idx: 8, health_score: 7, cull_recommend: 0, vet_name: '王伟民', vet_remark: '腹泻已痊愈，消化功能恢复，体重回升正常，建议继续留养观察', assessed_at: hoursAgo(96), approver_name: '赵明华', approval_remark: '留养，2周后复查', approved_at: hoursAgo(72), status: 'retained', deadline_at: null },
    { idx: 9, health_score: 6, cull_recommend: 0, vet_name: '王伟民', vet_remark: '肛门闭锁术后恢复良好，排便功能正常，体重稳步增长，可留养', assessed_at: hoursAgo(120), approver_name: '赵明华', approval_remark: '留养，持续监测', approved_at: hoursAgo(96), status: 'retained', deadline_at: null },
  ]

  const assessmentIds: number[] = []

  for (const a of assessmentSeeds) {
    const t = seedRecords[a.idx]
    const tid = transferIds[a.idx]
    const result = insertAssessment.run({
      transfer_id: tid,
      ear_tag: t.ear_tag,
      breed: t.breed,
      age_days: t.age_days,
      from_pen: t.from_pen,
      to_pen: t.to_pen,
      health_score: a.health_score,
      cull_recommend: a.cull_recommend,
      vet_name: a.vet_name,
      vet_remark: a.vet_remark,
      assessed_at: a.assessed_at,
      approver_name: a.approver_name,
      approval_remark: a.approval_remark,
      approved_at: a.approved_at,
      status: a.status,
      created_at: t.submitted_at || t.updated_at,
      updated_at: t.updated_at,
      deadline_at: a.deadline_at,
    })
    assessmentIds.push(Number(result.lastInsertRowid))
  }

  const logSeeds: any[] = [
    { transfer_id: transferIds[0], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0301`, remark: '窝次较大，8头断奶仔猪', created_at: hoursAgo(6) },
    { transfer_id: transferIds[1], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0298`, remark: '其中1头右后肢跛行', created_at: hoursAgo(30) },
    { transfer_id: transferIds[2], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0295`, remark: '体况偏瘦，采食量偏低', created_at: hoursAgo(48) },
    { transfer_id: transferIds[2], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'confirm', detail: `确认转栏 EP2026-0295`, remark: '已转至保育舍B1', created_at: hoursAgo(36) },
    { transfer_id: transferIds[3], assessment_id: null, operator: '李秀芬', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0290`, remark: '持续消瘦2周，疑似慢性腹泻', created_at: hoursAgo(72) },
    { transfer_id: transferIds[3], assessment_id: null, operator: '李秀芬', operator_role: '繁育员', action: 'confirm', detail: `确认转栏 EP2026-0290`, remark: '', created_at: hoursAgo(60) },
    { transfer_id: transferIds[3], assessment_id: assessmentIds[0], operator: '李秀芬', operator_role: '繁育员', action: 'submit', detail: `提交评估申请 EP2026-0290`, remark: '请尽快评估', created_at: hoursAgo(18) },
    { transfer_id: transferIds[4], assessment_id: null, operator: '李秀芬', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0285`, remark: '左前肢腕关节肿胀', created_at: hoursAgo(96) },
    { transfer_id: transferIds[4], assessment_id: null, operator: '李秀芬', operator_role: '繁育员', action: 'confirm', detail: `确认转栏 EP2026-0285`, remark: '', created_at: hoursAgo(80) },
    { transfer_id: transferIds[4], assessment_id: assessmentIds[1], operator: '李秀芬', operator_role: '繁育员', action: 'submit', detail: `提交评估申请 EP2026-0285`, remark: '跛行加重，紧急评估', created_at: hoursAgo(30) },
    { transfer_id: transferIds[5], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0280`, remark: '咳嗽持续3周，用药后反复', created_at: hoursAgo(120) },
    { transfer_id: transferIds[5], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'confirm', detail: `确认转栏 EP2026-0280`, remark: '', created_at: hoursAgo(108) },
    { transfer_id: transferIds[5], assessment_id: assessmentIds[2], operator: '张建国', operator_role: '繁育员', action: 'submit', detail: `提交评估申请 EP2026-0280`, remark: '', created_at: hoursAgo(96) },
    { transfer_id: transferIds[5], assessment_id: assessmentIds[2], operator: '王伟民', operator_role: '兽医', action: 'assess', detail: `完成评估 EP2026-0280，健康评分3，建议淘汰`, remark: '慢性肺炎反复发作，肺实变明显', created_at: hoursAgo(8) },
    { transfer_id: transferIds[6], assessment_id: null, operator: '李秀芬', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0275`, remark: '脐疝增大明显', created_at: hoursAgo(144) },
    { transfer_id: transferIds[6], assessment_id: null, operator: '李秀芬', operator_role: '繁育员', action: 'confirm', detail: `确认转栏 EP2026-0275`, remark: '', created_at: hoursAgo(132) },
    { transfer_id: transferIds[6], assessment_id: assessmentIds[3], operator: '李秀芬', operator_role: '繁育员', action: 'submit', detail: `提交评估申请 EP2026-0275`, remark: '', created_at: hoursAgo(120) },
    { transfer_id: transferIds[6], assessment_id: assessmentIds[3], operator: '王伟民', operator_role: '兽医', action: 'assess', detail: `完成评估 EP2026-0275，健康评分2，建议淘汰`, remark: '脐疝直径超过8cm，强烈建议淘汰', created_at: hoursAgo(20) },
    { transfer_id: transferIds[7], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0270`, remark: '体温反复升高', created_at: hoursAgo(168) },
    { transfer_id: transferIds[7], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'confirm', detail: `确认转栏 EP2026-0270`, remark: '', created_at: hoursAgo(156) },
    { transfer_id: transferIds[7], assessment_id: assessmentIds[4], operator: '张建国', operator_role: '繁育员', action: 'submit', detail: `提交评估申请 EP2026-0270`, remark: '', created_at: hoursAgo(144) },
    { transfer_id: transferIds[7], assessment_id: assessmentIds[4], operator: '王伟民', operator_role: '兽医', action: 'assess', detail: `完成评估 EP2026-0270，健康评分2，建议淘汰`, remark: '肺部感染严重，无治疗价值', created_at: hoursAgo(72) },
    { transfer_id: transferIds[7], assessment_id: assessmentIds[4], operator: '赵明华', operator_role: '场长', action: 'approve', detail: `审批通过淘汰 EP2026-0270`, remark: '同意淘汰，安排明日处理', created_at: hoursAgo(60) },
    { transfer_id: transferIds[8], assessment_id: null, operator: '李秀芬', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0265`, remark: '严重腹泻后恢复良好', created_at: hoursAgo(192) },
    { transfer_id: transferIds[8], assessment_id: null, operator: '李秀芬', operator_role: '繁育员', action: 'confirm', detail: `确认转栏 EP2026-0265`, remark: '', created_at: hoursAgo(180) },
    { transfer_id: transferIds[8], assessment_id: assessmentIds[5], operator: '李秀芬', operator_role: '繁育员', action: 'submit', detail: `提交评估申请 EP2026-0265`, remark: '', created_at: hoursAgo(168) },
    { transfer_id: transferIds[8], assessment_id: assessmentIds[5], operator: '王伟民', operator_role: '兽医', action: 'assess', detail: `完成评估 EP2026-0265，健康评分7，建议留养`, remark: '消化功能恢复，体重回升正常', created_at: hoursAgo(96) },
    { transfer_id: transferIds[8], assessment_id: assessmentIds[5], operator: '赵明华', operator_role: '场长', action: 'approve', detail: `审批留养 EP2026-0265`, remark: '留养，2周后复查', created_at: hoursAgo(72) },
    { transfer_id: transferIds[9], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'create', detail: `创建转栏记录 EP2026-0260`, remark: '先天性肛门闭锁手术后恢复', created_at: hoursAgo(216) },
    { transfer_id: transferIds[9], assessment_id: null, operator: '张建国', operator_role: '繁育员', action: 'confirm', detail: `确认转栏 EP2026-0260`, remark: '', created_at: hoursAgo(204) },
    { transfer_id: transferIds[9], assessment_id: assessmentIds[6], operator: '张建国', operator_role: '繁育员', action: 'submit', detail: `提交评估申请 EP2026-0260`, remark: '', created_at: hoursAgo(192) },
    { transfer_id: transferIds[9], assessment_id: assessmentIds[6], operator: '王伟民', operator_role: '兽医', action: 'assess', detail: `完成评估 EP2026-0260，健康评分6，建议留养`, remark: '术后恢复良好，排便功能正常', created_at: hoursAgo(120) },
    { transfer_id: transferIds[9], assessment_id: assessmentIds[6], operator: '赵明华', operator_role: '场长', action: 'approve', detail: `审批留养 EP2026-0260`, remark: '留养，持续监测', created_at: hoursAgo(96) },
  ]

  for (const l of logSeeds) {
    insertLog.run(l)
  }
}
