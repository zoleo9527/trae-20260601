import sqlite3 from 'sqlite3'
import { promisify } from 'util'

const db = new sqlite3.Database('./data/community.db')

const run = promisify(db.run.bind(db))
const get = promisify(db.get.bind(db))
const all = promisify(db.all.bind(db))

export interface FlowRecord {
  id: string
  targetType: 'visit' | 'issue'
  targetId: string
  action: string
  operatorId: string
  operatorName: string
  operatorRole: string
  details?: string
  createdAt: string
}

export async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      department TEXT
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS key_persons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      address TEXT,
      phone TEXT,
      type TEXT,
      care_level TEXT,
      description TEXT
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS visit_records (
      id TEXT PRIMARY KEY,
      key_person_id TEXT NOT NULL,
      social_worker_id TEXT NOT NULL,
      social_worker_name TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      actual_date TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (key_person_id) REFERENCES key_persons(id)
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_to TEXT,
      assigned_name TEXT,
      escalation_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (visit_id) REFERENCES visit_records(id)
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS flow_records (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    )
  `)

  const userCount = await get('SELECT COUNT(*) as count FROM users')
  if (userCount.count === 0) {
    await seedData()
  }
}

async function seedData() {
  const users = [
    { id: 'u1', name: '张社工', role: 'socialWorker', phone: '13800138001', department: '阳光社区服务站' },
    { id: 'u2', name: '李队长', role: 'volunteerLeader', phone: '13800138002', department: '阳光社区志愿队' },
    { id: 'u3', name: '王干部', role: 'communityLeader', phone: '13800138003', department: '阳光社区居委会' }
  ]

  const keyPersons = [
    { id: 'kp1', name: '王奶奶', age: 78, address: '阳光社区A栋101', phone: '13900139001', type: '独居老人', careLevel: 'high', description: '高龄独居，需要定期关怀' },
    { id: 'kp2', name: '李大爷', age: 72, address: '阳光社区B栋202', phone: '13900139002', type: '空巢老人', careLevel: 'medium', description: '子女在外地，需要定期联系' },
    { id: 'kp3', name: '张阿姨', age: 65, address: '阳光社区C栋303', phone: '13900139003', type: '残疾人', careLevel: 'high', description: '行动不便，需要生活帮扶' },
    { id: 'kp4', name: '刘叔叔', age: 58, address: '阳光社区D栋404', phone: '13900139004', type: '低保户', careLevel: 'low', description: '经济困难，需要就业帮扶' },
    { id: 'kp5', name: '陈奶奶', age: 82, address: '阳光社区E栋505', phone: '13900139005', type: '高龄老人', careLevel: 'high', description: '高龄多病，需要医疗关注' }
  ]

  const visits = [
    { id: 'v1', keyPersonId: 'kp1', socialWorkerId: 'u1', socialWorkerName: '张社工', scheduledDate: '2025-06-15', actualDate: null, status: 'pending', notes: null, createdAt: '2025-06-10T10:00:00Z', updatedAt: '2025-06-10T10:00:00Z' },
    { id: 'v2', keyPersonId: 'kp2', socialWorkerId: 'u1', socialWorkerName: '张社工', scheduledDate: '2025-06-14', actualDate: '2025-06-14', status: 'completed', notes: '老人身体状况良好，情绪稳定', createdAt: '2025-06-09T09:00:00Z', updatedAt: '2025-06-14T15:00:00Z' },
    { id: 'v3', keyPersonId: 'kp3', socialWorkerId: 'u1', socialWorkerName: '张社工', scheduledDate: '2025-06-13', actualDate: null, status: 'blocked', notes: '多次上门无人应答，电话无法接通', createdAt: '2025-06-08T08:00:00Z', updatedAt: '2025-06-13T18:00:00Z' },
    { id: 'v4', keyPersonId: 'kp4', socialWorkerId: 'u1', socialWorkerName: '张社工', scheduledDate: '2025-06-12', actualDate: '2025-06-12', status: 'completed', notes: '了解就业需求，已对接就业帮扶', createdAt: '2025-06-07T07:00:00Z', updatedAt: '2025-06-12T14:00:00Z' },
    { id: 'v5', keyPersonId: 'kp5', socialWorkerId: 'u1', socialWorkerName: '张社工', scheduledDate: '2025-06-11', actualDate: null, status: 'overdue', notes: null, createdAt: '2025-06-06T06:00:00Z', updatedAt: '2025-06-06T06:00:00Z' }
  ]

  const issues = [
    { id: 'i1', visitId: 'v2', reporterId: 'u1', reporterName: '张社工', title: '老人反映生活物资不足', description: '李大爷反映近期生活物资采购困难，需要志愿者协助', category: '生活物资', status: 'pending', assignedTo: null, assignedName: null, escalationReason: null, createdAt: '2025-06-14T16:00:00Z', updatedAt: '2025-06-14T16:00:00Z' },
    { id: 'i2', visitId: 'v4', reporterId: 'u1', reporterName: '张社工', title: '需要就业帮扶对接', description: '刘叔叔希望获得就业机会，有电工技能', category: '就业帮扶', status: 'processing', assignedTo: 'u2', assignedName: '李队长', escalationReason: null, createdAt: '2025-06-12T15:00:00Z', updatedAt: '2025-06-13T10:00:00Z' },
    { id: 'i3', visitId: 'v1', reporterId: 'u1', reporterName: '张社工', title: '老人情绪异常', description: '王奶奶近期情绪低落，可能存在心理问题', category: '沟通协调', status: 'escalated', assignedTo: 'u2', assignedName: '李队长', escalationReason: '需要专业心理辅导介入', createdAt: '2025-06-15T11:00:00Z', updatedAt: '2025-06-16T09:00:00Z' }
  ]

  for (const user of users) {
    await run(
      'INSERT INTO users (id, name, role, phone, department) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.name, user.role, user.phone, user.department]
    )
  }

  for (const kp of keyPersons) {
    await run(
      'INSERT INTO key_persons (id, name, age, address, phone, type, care_level, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [kp.id, kp.name, kp.age, kp.address, kp.phone, kp.type, kp.careLevel, kp.description]
    )
  }

  for (const visit of visits) {
    await run(
      'INSERT INTO visit_records (id, key_person_id, social_worker_id, social_worker_name, scheduled_date, actual_date, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [visit.id, visit.keyPersonId, visit.socialWorkerId, visit.socialWorkerName, visit.scheduledDate, visit.actualDate, visit.status, visit.notes, visit.createdAt, visit.updatedAt]
    )
    
    await run(
      'INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [`f${visit.id}-1`, 'visit', visit.id, '创建任务', visit.socialWorkerId, visit.socialWorkerName, 'socialWorker', null, visit.createdAt]
    )
    
    if (visit.status === 'completed') {
      await run(
        'INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [`f${visit.id}-2`, 'visit', visit.id, '完成回访', visit.socialWorkerId, visit.socialWorkerName, 'socialWorker', visit.notes, visit.updatedAt]
      )
    }
    
    if (visit.status === 'blocked') {
      await run(
        'INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [`f${visit.id}-2`, 'visit', visit.id, '标记卡住', visit.socialWorkerId, visit.socialWorkerName, 'socialWorker', visit.notes, visit.updatedAt]
      )
    }
  }

  for (const issue of issues) {
    await run(
      'INSERT INTO issues (id, visit_id, reporter_id, reporter_name, title, description, category, status, assigned_to, assigned_name, escalation_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [issue.id, issue.visitId, issue.reporterId, issue.reporterName, issue.title, issue.description, issue.category, issue.status, issue.assignedTo, issue.assignedName, issue.escalationReason, issue.createdAt, issue.updatedAt]
    )
    
    await run(
      'INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [`f${issue.id}-1`, 'issue', issue.id, '上报问题', issue.reporterId, issue.reporterName, 'socialWorker', issue.title, issue.createdAt]
    )
    
    if (issue.status === 'processing') {
      await run(
        'INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [`f${issue.id}-2`, 'issue', issue.id, '开始处理', issue.assignedTo, issue.assignedName, 'volunteerLeader', null, issue.updatedAt]
      )
    }
    
    if (issue.status === 'escalated') {
      await run(
        'INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [`f${issue.id}-2`, 'issue', issue.id, '升级上报', issue.assignedTo, issue.assignedName, 'volunteerLeader', issue.escalationReason, issue.updatedAt]
      )
    }
  }
}

export { db, run, get, all }