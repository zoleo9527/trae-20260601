import express from 'express'
import cors from 'cors'
import { initDatabase, db, run, get, all, FlowRecord } from './database'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/api/users', async (req, res) => {
  try {
    const users = await all('SELECT * FROM users')
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: '获取用户失败' })
  }
})

app.get('/api/key-persons', async (req, res) => {
  try {
    const keyPersons = await all('SELECT * FROM key_persons')
    res.json(keyPersons.map(kp => ({
      ...kp,
      careLevel: kp.care_level
    })))
  } catch (error) {
    res.status(500).json({ error: '获取重点对象列表失败' })
  }
})

app.get('/api/visits', async (req, res) => {
  try {
    const visits = await all(`
      SELECT v.*, 
        kp.id as kp_id, kp.name as kp_name, kp.age as kp_age, kp.address as kp_address, 
        kp.phone as kp_phone, kp.type as kp_type, kp.care_level as kp_care_level, kp.description as kp_description
      FROM visit_records v
      JOIN key_persons kp ON v.key_person_id = kp.id
      ORDER BY v.updated_at DESC
    `)
    
    const result = visits.map(v => ({
      id: v.id,
      keyPersonId: v.key_person_id,
      keyPerson: {
        id: v.kp_id,
        name: v.kp_name,
        age: v.kp_age,
        address: v.kp_address,
        phone: v.kp_phone,
        type: v.kp_type,
        careLevel: v.kp_care_level,
        description: v.kp_description
      },
      socialWorkerId: v.social_worker_id,
      socialWorkerName: v.social_worker_name,
      scheduledDate: v.scheduled_date,
      actualDate: v.actual_date,
      status: v.status,
      notes: v.notes,
      createdAt: v.created_at,
      updatedAt: v.updated_at
    }))
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取回访记录失败' })
  }
})

app.get('/api/visits/:id', async (req, res) => {
  try {
    const visit = await get(`
      SELECT v.*, 
        kp.id as kp_id, kp.name as kp_name, kp.age as kp_age, kp.address as kp_address, 
        kp.phone as kp_phone, kp.type as kp_type, kp.care_level as kp_care_level, kp.description as kp_description
      FROM visit_records v
      JOIN key_persons kp ON v.key_person_id = kp.id
      WHERE v.id = ?
    `, [req.params.id])
    
    if (!visit) {
      return res.status(404).json({ error: '回访记录不存在' })
    }
    
    const result = {
      id: visit.id,
      keyPersonId: visit.key_person_id,
      keyPerson: {
        id: visit.kp_id,
        name: visit.kp_name,
        age: visit.kp_age,
        address: visit.kp_address,
        phone: visit.kp_phone,
        type: visit.kp_type,
        careLevel: visit.kp_care_level,
        description: visit.kp_description
      },
      socialWorkerId: visit.social_worker_id,
      socialWorkerName: visit.social_worker_name,
      scheduledDate: visit.scheduled_date,
      actualDate: visit.actual_date,
      status: visit.status,
      notes: visit.notes,
      createdAt: visit.created_at,
      updatedAt: visit.updated_at
    }
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取回访记录失败' })
  }
})

app.post('/api/visits', async (req, res) => {
  try {
    const { keyPersonId, socialWorkerId, socialWorkerName, scheduledDate, notes } = req.body
    const id = uuidv4()
    const now = new Date().toISOString()
    
    await run(
      `INSERT INTO visit_records (id, key_person_id, social_worker_id, social_worker_name, scheduled_date, actual_date, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NULL, 'pending', ?, ?, ?)`,
      [id, keyPersonId, socialWorkerId, socialWorkerName, scheduledDate, notes || null, now, now]
    )
    
    await run(
      `INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'visit', id, '创建任务', socialWorkerId, socialWorkerName, 'socialWorker', notes, now]
    )
    
    const visit = await get(`
      SELECT v.*, 
        kp.id as kp_id, kp.name as kp_name, kp.age as kp_age, kp.address as kp_address, 
        kp.phone as kp_phone, kp.type as kp_type, kp.care_level as kp_care_level, kp.description as kp_description
      FROM visit_records v
      JOIN key_persons kp ON v.key_person_id = kp.id
      WHERE v.id = ?
    `, [id])
    
    const result = {
      id: visit.id,
      keyPersonId: visit.key_person_id,
      keyPerson: {
        id: visit.kp_id,
        name: visit.kp_name,
        age: visit.kp_age,
        address: visit.kp_address,
        phone: visit.kp_phone,
        type: visit.kp_type,
        careLevel: visit.kp_care_level,
        description: visit.kp_description
      },
      socialWorkerId: visit.social_worker_id,
      socialWorkerName: visit.social_worker_name,
      scheduledDate: visit.scheduled_date,
      actualDate: visit.actual_date,
      status: visit.status,
      notes: visit.notes,
      createdAt: visit.created_at,
      updatedAt: visit.updated_at
    }
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '创建回访记录失败' })
  }
})

app.put('/api/visits/:id', async (req, res) => {
  try {
    const { status, actualDate, notes, operatorId, operatorName, operatorRole } = req.body
    const now = new Date().toISOString()
    
    const oldVisit = await get('SELECT * FROM visit_records WHERE id = ?', [req.params.id])
    if (!oldVisit) {
      return res.status(404).json({ error: '回访记录不存在' })
    }
    
    await run(
      `UPDATE visit_records SET status = ?, actual_date = ?, notes = ?, updated_at = ? WHERE id = ?`,
      [status, actualDate || oldVisit.actual_date, notes || oldVisit.notes, now, req.params.id]
    )
    
    if (status === 'completed' && oldVisit.status !== 'completed') {
      await run(
        `INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'visit', req.params.id, '完成回访', operatorId, operatorName, operatorRole, notes, now]
      )
    }
    
    if (status === 'blocked' && oldVisit.status !== 'blocked') {
      await run(
        `INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'visit', req.params.id, '标记卡住', operatorId, operatorName, operatorRole, notes, now]
      )
    }
    
    if (status === 'pending' && oldVisit.status === 'blocked') {
      await run(
        `INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'visit', req.params.id, '协调解决', operatorId, operatorName, operatorRole, notes || '社区干部已协调解决', now]
      )
    }
    
    const visit = await get(`
      SELECT v.*, 
        kp.id as kp_id, kp.name as kp_name, kp.age as kp_age, kp.address as kp_address, 
        kp.phone as kp_phone, kp.type as kp_type, kp.care_level as kp_care_level, kp.description as kp_description
      FROM visit_records v
      JOIN key_persons kp ON v.key_person_id = kp.id
      WHERE v.id = ?
    `, [req.params.id])
    
    const result = {
      id: visit.id,
      keyPersonId: visit.key_person_id,
      keyPerson: {
        id: visit.kp_id,
        name: visit.kp_name,
        age: visit.kp_age,
        address: visit.kp_address,
        phone: visit.kp_phone,
        type: visit.kp_type,
        careLevel: visit.kp_care_level,
        description: visit.kp_description
      },
      socialWorkerId: visit.social_worker_id,
      socialWorkerName: visit.social_worker_name,
      scheduledDate: visit.scheduled_date,
      actualDate: visit.actual_date,
      status: visit.status,
      notes: visit.notes,
      createdAt: visit.created_at,
      updatedAt: visit.updated_at
    }
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '更新回访记录失败' })
  }
})

app.get('/api/issues', async (req, res) => {
  try {
    const issues = await all(`
      SELECT i.*, 
        v.id as v_id, v.key_person_id as v_key_person_id, v.social_worker_id as v_social_worker_id, 
        v.social_worker_name as v_social_worker_name, v.scheduled_date as v_scheduled_date, 
        v.actual_date as v_actual_date, v.status as v_status, v.notes as v_notes, 
        v.created_at as v_created_at, v.updated_at as v_updated_at,
        kp.id as kp_id, kp.name as kp_name, kp.age as kp_age, kp.address as kp_address, 
        kp.phone as kp_phone, kp.type as kp_type, kp.care_level as kp_care_level, kp.description as kp_description
      FROM issues i
      LEFT JOIN visit_records v ON i.visit_id = v.id
      LEFT JOIN key_persons kp ON v.key_person_id = kp.id
      ORDER BY i.updated_at DESC
    `)
    
    const result = issues.map(i => ({
      id: i.id,
      visitId: i.visit_id,
      visitRecord: i.v_id ? {
        id: i.v_id,
        keyPersonId: i.v_key_person_id,
        keyPerson: {
          id: i.kp_id,
          name: i.kp_name,
          age: i.kp_age,
          address: i.kp_address,
          phone: i.kp_phone,
          type: i.kp_type,
          careLevel: i.kp_care_level,
          description: i.kp_description
        },
        socialWorkerId: i.v_social_worker_id,
        socialWorkerName: i.v_social_worker_name,
        scheduledDate: i.v_scheduled_date,
        actualDate: i.v_actual_date,
        status: i.v_status,
        notes: i.v_notes,
        createdAt: i.v_created_at,
        updatedAt: i.v_updated_at
      } : undefined,
      reporterId: i.reporter_id,
      reporterName: i.reporter_name,
      title: i.title,
      description: i.description,
      category: i.category,
      status: i.status,
      assignedTo: i.assigned_to,
      assignedName: i.assigned_name,
      escalationReason: i.escalation_reason,
      createdAt: i.created_at,
      updatedAt: i.updated_at
    }))
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取问题列表失败' })
  }
})

app.get('/api/issues/:id', async (req, res) => {
  try {
    const issue = await get(`
      SELECT i.*, 
        v.id as v_id, v.key_person_id as v_key_person_id, v.social_worker_id as v_social_worker_id, 
        v.social_worker_name as v_social_worker_name, v.scheduled_date as v_scheduled_date, 
        v.actual_date as v_actual_date, v.status as v_status, v.notes as v_notes, 
        v.created_at as v_created_at, v.updated_at as v_updated_at,
        kp.id as kp_id, kp.name as kp_name, kp.age as kp_age, kp.address as kp_address, 
        kp.phone as kp_phone, kp.type as kp_type, kp.care_level as kp_care_level, kp.description as kp_description
      FROM issues i
      LEFT JOIN visit_records v ON i.visit_id = v.id
      LEFT JOIN key_persons kp ON v.key_person_id = kp.id
      WHERE i.id = ?
    `, [req.params.id])
    
    if (!issue) {
      return res.status(404).json({ error: '问题不存在' })
    }
    
    const result = {
      id: issue.id,
      visitId: issue.visit_id,
      visitRecord: issue.v_id ? {
        id: issue.v_id,
        keyPersonId: issue.v_key_person_id,
        keyPerson: {
          id: issue.kp_id,
          name: issue.kp_name,
          age: issue.kp_age,
          address: issue.kp_address,
          phone: issue.kp_phone,
          type: issue.kp_type,
          careLevel: issue.kp_care_level,
          description: issue.kp_description
        },
        socialWorkerId: issue.v_social_worker_id,
        socialWorkerName: issue.v_social_worker_name,
        scheduledDate: issue.v_scheduled_date,
        actualDate: issue.v_actual_date,
        status: issue.v_status,
        notes: issue.v_notes,
        createdAt: issue.v_created_at,
        updatedAt: issue.v_updated_at
      } : undefined,
      reporterId: issue.reporter_id,
      reporterName: issue.reporter_name,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      assignedTo: issue.assigned_to,
      assignedName: issue.assigned_name,
      escalationReason: issue.escalation_reason,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at
    }
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取问题详情失败' })
  }
})

app.post('/api/issues', async (req, res) => {
  try {
    const { visitId, reporterId, reporterName, title, description, category } = req.body
    const id = uuidv4()
    const now = new Date().toISOString()
    
    await run(
      `INSERT INTO issues (id, visit_id, reporter_id, reporter_name, title, description, category, status, assigned_to, assigned_name, escalation_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, ?, ?)`,
      [id, visitId, reporterId, reporterName, title, description, category, now, now]
    )
    
    await run(
      `INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'issue', id, '上报问题', reporterId, reporterName, 'socialWorker', title, now]
    )
    
    const issue = await get(`
      SELECT i.*, 
        v.id as v_id, v.key_person_id as v_key_person_id, v.social_worker_id as v_social_worker_id, 
        v.social_worker_name as v_social_worker_name, v.scheduled_date as v_scheduled_date, 
        v.actual_date as v_actual_date, v.status as v_status, v.notes as v_notes, 
        v.created_at as v_created_at, v.updated_at as v_updated_at,
        kp.id as kp_id, kp.name as kp_name, kp.age as kp_age, kp.address as kp_address, 
        kp.phone as kp_phone, kp.type as kp_type, kp.care_level as kp_care_level, kp.description as kp_description
      FROM issues i
      LEFT JOIN visit_records v ON i.visit_id = v.id
      LEFT JOIN key_persons kp ON v.key_person_id = kp.id
      WHERE i.id = ?
    `, [id])
    
    const result = {
      id: issue.id,
      visitId: issue.visit_id,
      visitRecord: issue.v_id ? {
        id: issue.v_id,
        keyPersonId: issue.v_key_person_id,
        keyPerson: {
          id: issue.kp_id,
          name: issue.kp_name,
          age: issue.kp_age,
          address: issue.kp_address,
          phone: issue.kp_phone,
          type: issue.kp_type,
          careLevel: issue.kp_care_level,
          description: issue.kp_description
        },
        socialWorkerId: issue.v_social_worker_id,
        socialWorkerName: issue.v_social_worker_name,
        scheduledDate: issue.v_scheduled_date,
        actualDate: issue.v_actual_date,
        status: issue.v_status,
        notes: issue.v_notes,
        createdAt: issue.v_created_at,
        updatedAt: issue.v_updated_at
      } : undefined,
      reporterId: issue.reporter_id,
      reporterName: issue.reporter_name,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      assignedTo: issue.assigned_to,
      assignedName: issue.assigned_name,
      escalationReason: issue.escalation_reason,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at
    }
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '创建问题失败' })
  }
})

app.put('/api/issues/:id', async (req, res) => {
  try {
    const { status, assignedTo, assignedName, escalationReason, operatorId, operatorName, operatorRole } = req.body
    const now = new Date().toISOString()
    
    const oldIssue = await get('SELECT * FROM issues WHERE id = ?', [req.params.id])
    if (!oldIssue) {
      return res.status(404).json({ error: '问题不存在' })
    }
    
    await run(
      `UPDATE issues SET status = ?, assigned_to = ?, assigned_name = ?, escalation_reason = ?, updated_at = ? WHERE id = ?`,
      [status, assignedTo || oldIssue.assigned_to, assignedName || oldIssue.assigned_name, escalationReason || oldIssue.escalation_reason, now, req.params.id]
    )
    
    if (status === 'processing' && oldIssue.status !== 'processing') {
      await run(
        `INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'issue', req.params.id, '开始处理', operatorId, operatorName, operatorRole, null, now]
      )
    }
    
    if (status === 'resolved' && oldIssue.status !== 'resolved') {
      await run(
        `INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'issue', req.params.id, '处理完成', operatorId, operatorName, operatorRole, null, now]
      )
    }
    
    if (status === 'escalated' && oldIssue.status !== 'escalated') {
      await run(
        `INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'issue', req.params.id, '升级上报', operatorId, operatorName, operatorRole, escalationReason, now]
      )
    }
    
    if (status === 'resolved' && oldIssue.status === 'escalated') {
      await run(
        `INSERT INTO flow_records (id, target_type, target_id, action, operator_id, operator_name, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'issue', req.params.id, '协调解决', operatorId, operatorName, operatorRole, escalationReason, now]
      )
    }
    
    const issue = await get(`
      SELECT i.*, 
        v.id as v_id, v.key_person_id as v_key_person_id, v.social_worker_id as v_social_worker_id, 
        v.social_worker_name as v_social_worker_name, v.scheduled_date as v_scheduled_date, 
        v.actual_date as v_actual_date, v.status as v_status, v.notes as v_notes, 
        v.created_at as v_created_at, v.updated_at as v_updated_at,
        kp.id as kp_id, kp.name as kp_name, kp.age as kp_age, kp.address as kp_address, 
        kp.phone as kp_phone, kp.type as kp_type, kp.care_level as kp_care_level, kp.description as kp_description
      FROM issues i
      LEFT JOIN visit_records v ON i.visit_id = v.id
      LEFT JOIN key_persons kp ON v.key_person_id = kp.id
      WHERE i.id = ?
    `, [req.params.id])
    
    const result = {
      id: issue.id,
      visitId: issue.visit_id,
      visitRecord: issue.v_id ? {
        id: issue.v_id,
        keyPersonId: issue.v_key_person_id,
        keyPerson: {
          id: issue.kp_id,
          name: issue.kp_name,
          age: issue.kp_age,
          address: issue.kp_address,
          phone: issue.kp_phone,
          type: issue.kp_type,
          careLevel: issue.kp_care_level,
          description: issue.kp_description
        },
        socialWorkerId: issue.v_social_worker_id,
        socialWorkerName: issue.v_social_worker_name,
        scheduledDate: issue.v_scheduled_date,
        actualDate: issue.v_actual_date,
        status: issue.v_status,
        notes: issue.v_notes,
        createdAt: issue.v_created_at,
        updatedAt: issue.v_updated_at
      } : undefined,
      reporterId: issue.reporter_id,
      reporterName: issue.reporter_name,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      assignedTo: issue.assigned_to,
      assignedName: issue.assigned_name,
      escalationReason: issue.escalation_reason,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at
    }
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '更新问题失败' })
  }
})

app.get('/api/flow-records/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params
    const flows = await all(
      `SELECT * FROM flow_records WHERE target_type = ? AND target_id = ? ORDER BY created_at ASC`,
      [type, id]
    )
    
    const result: FlowRecord[] = flows.map(f => ({
      id: f.id,
      targetType: f.target_type,
      targetId: f.target_id,
      action: f.action,
      operatorId: f.operator_id,
      operatorName: f.operator_name,
      operatorRole: f.operator_role,
      details: f.details,
      createdAt: f.created_at
    }))
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取流转记录失败' })
  }
})

app.get('/api/stats', async (req, res) => {
  try {
    const totalVisits = await get('SELECT COUNT(*) as count FROM visit_records')
    const pendingVisits = await get('SELECT COUNT(*) as count FROM visit_records WHERE status = ?', ['pending'])
    const overdueVisits = await get('SELECT COUNT(*) as count FROM visit_records WHERE status = ?', ['overdue'])
    const blockedVisits = await get('SELECT COUNT(*) as count FROM visit_records WHERE status = ?', ['blocked'])
    
    const totalIssues = await get('SELECT COUNT(*) as count FROM issues')
    const pendingIssues = await get('SELECT COUNT(*) as count FROM issues WHERE status = ?', ['pending'])
    const processingIssues = await get('SELECT COUNT(*) as count FROM issues WHERE status = ?', ['processing'])
    const resolvedIssues = await get('SELECT COUNT(*) as count FROM issues WHERE status = ?', ['resolved'])
    const escalatedIssues = await get('SELECT COUNT(*) as count FROM issues WHERE status = ?', ['escalated'])
    
    res.json({
      totalVisits: totalVisits.count,
      pendingVisits: pendingVisits.count,
      overdueVisits: overdueVisits.count,
      blockedVisits: blockedVisits.count,
      totalIssues: totalIssues.count,
      pendingIssues: pendingIssues.count,
      processingIssues: processingIssues.count,
      resolvedIssues: resolvedIssues.count,
      escalatedIssues: escalatedIssues.count
    })
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

async function startServer() {
  await initDatabase()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

startServer()