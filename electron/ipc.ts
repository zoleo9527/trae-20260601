import { IpcMain } from 'electron'
import { getDb } from './db'

function safeJsonStringify(val: any): string | null {
  if (val == null) return null
  if (typeof val === 'string') return val
  try { return JSON.stringify(val) } catch (e) { return null }
}

function safeJsonParse<T = any>(val: any, fallback: T): T {
  if (val == null || val === '') return fallback
  if (typeof val !== 'string') return val as T
  try { return JSON.parse(val) as T } catch (e) { return fallback }
}

function addActivityLog(projectId: number | null, actionType: string, detail: string, operator: string = '系统') {
  const db = getDb()
  db.prepare(`
    INSERT INTO activity_logs (project_id, action_type, action_detail, operator)
    VALUES (?, ?, ?, ?)
  `).run(projectId, actionType, detail, operator)
}

function updateProjectStatus(projectId: number, newStatus: string) {
  const db = getDb()
  db.prepare(`
    UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newStatus, projectId)
  addActivityLog(projectId, 'status_change', `项目状态变更为：${getStatusLabel(newStatus)}`)
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_survey: '待勘查',
    survey_submitted: '待审核勘查',
    wiring_planned: '布线已规划',
    in_progress: '施工中',
    completed: '已完成'
  }
  return labels[status] || status
}

function normalizePlannedMaterials(rawItems: any[]): Array<{ material_id: number; quantity: number }> {
  return (rawItems || [])
    .map(item => {
      const material_id = Number(item?.material_id ?? item?.id ?? 0)
      const quantity = Number(item?.quantity ?? item?.planned_qty ?? item?.qty ?? 0)
      return material_id > 0 ? { material_id, quantity } : null
    })
    .filter(Boolean) as Array<{ material_id: number; quantity: number }>
}

function syncProjectMaterials(projectId: number, plannedMaterials: any[]) {
  const db = getDb()
  const normalized = normalizePlannedMaterials(plannedMaterials)
  const newMaterialIds = new Set(normalized.map(item => item.material_id))
  const quantityMap = new Map(normalized.map(item => [item.material_id, item.quantity]))

  const existingList = db.prepare(
    'SELECT * FROM project_materials WHERE project_id = ?'
  ).all(projectId) as any[]

  const existingIds = new Set(existingList.map(pm => pm.material_id))

  for (const pm of existingList) {
    if (newMaterialIds.has(pm.material_id)) {
      db.prepare('UPDATE project_materials SET planned_qty = ? WHERE id = ?').run(
        quantityMap.get(pm.material_id), pm.id
      )
    } else {
      db.prepare('UPDATE project_materials SET planned_qty = 0 WHERE id = ?').run(pm.id)
    }
  }

  const insertStmt = db.prepare(`
    INSERT INTO project_materials (project_id, material_id, planned_qty, used_qty, returned_qty, is_overrun)
    VALUES (?, ?, ?, 0, 0, 0)
  `)
  for (const item of normalized) {
    if (!existingIds.has(item.material_id)) {
      insertStmt.run(projectId, item.material_id, item.quantity)
    }
  }

  db.prepare(`
    UPDATE project_materials
    SET is_overrun = CASE WHEN used_qty > planned_qty THEN 1 ELSE 0 END
    WHERE project_id = ?
  `).run(projectId)
}

export function registerIpc(ipcMain: IpcMain) {

  ipcMain.handle('getProjects', (_event, filters?: { status?: string; status_in?: string[]; keyword?: string; risk?: string; material_overuse?: boolean; completion_docs_pending?: boolean }) => {
    const db = getDb()
    let sql = 'SELECT * FROM projects WHERE 1=1'
    const params: any[] = []

    if (filters?.status) {
      sql += ' AND status = ?'
      params.push(filters.status)
    }
    if (filters?.status_in && filters.status_in.length > 0) {
      const placeholders = filters.status_in.map(() => '?').join(', ')
      sql += ` AND status IN (${placeholders})`
      params.push(...filters.status_in)
    }
    if (filters?.keyword) {
      sql += ' AND (project_name LIKE ? OR project_code LIKE ? OR client_name LIKE ? OR site_address LIKE ? OR project_manager LIKE ?)'
      const kw = `%${filters.keyword}%`
      params.push(kw, kw, kw, kw, kw)
    }
    if (filters?.risk && filters.risk !== 'none') {
      sql += ' AND risk_level != ?'
      params.push('none')
    }
    if (filters?.material_overuse) {
      sql += ' AND id IN (SELECT DISTINCT project_id FROM project_materials WHERE is_overrun = 1)'
    }
    if (filters?.completion_docs_pending) {
      sql += " AND completion_docs_status != 'done' AND completion_docs_status != 'completed'"
    }

    sql += ' ORDER BY updated_at DESC'
    return db.prepare(sql).all(...params)
  })

  ipcMain.handle('getProjectById', (_event, id: number) => {
    const db = getDb()
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  })

  ipcMain.handle('createProject', (_event, data: any) => {
    const db = getDb()
    const result = db.prepare(`
      INSERT INTO projects (project_name, project_code, client_name, site_address, project_manager, priority, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.project_name, data.project_code, data.client_name,
      data.site_address, data.project_manager, data.priority || 'normal',
      data.description
    )
    addActivityLog(result.lastInsertRowid as number, 'create_project', `创建项目：${data.project_name}`)
    return result.lastInsertRowid
  })

  ipcMain.handle('updateProject', (_event, id: number, data: any) => {
    const db = getDb()
    const fields = Object.keys(data).filter(k => data[k] !== undefined)
    if (fields.length === 0) return
    
    const setClauses = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => data[f])
    values.push(id)
    
    db.prepare(`UPDATE projects SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values)
    addActivityLog(id, 'update_project', '更新项目信息')
  })

  ipcMain.handle('deleteProject', (_event, id: number) => {
    const db = getDb()
    const project = db.prepare('SELECT project_name FROM projects WHERE id = ?').get(id) as any
    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
    addActivityLog(null, 'delete_project', `删除项目：${project?.project_name || id}`)
  })

  ipcMain.handle('getSurveyByProjectId', (_event, projectId: number) => {
    const db = getDb()
    const survey = db.prepare('SELECT * FROM surveys WHERE project_id = ? ORDER BY id DESC LIMIT 1').get(projectId) as any
    if (survey) {
      survey.cable_route_structured = safeJsonParse(survey.cable_route_structured, [])
      survey.existing_lines = safeJsonParse(survey.existing_lines, [])
      survey.difficulty_points = safeJsonParse(survey.difficulty_points, [])
    }
    return survey
  })

  ipcMain.handle('saveSurvey', (_event, projectId: number, data: any) => {
    const db = getDb()
    const existing = db.prepare('SELECT id FROM surveys WHERE project_id = ?').get(projectId) as any
    
    if (existing) {
      db.prepare(`
        UPDATE surveys SET survey_date = ?, surveyor = ?, site_condition = ?, 
          power_environment = ?, cable_route = ?, cable_route_structured = ?, equipment_position = ?, 
          ground_condition = ?, existing_lines = ?, difficulty_points = ?, remarks = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        data.survey_date, data.surveyor, data.site_condition,
        data.power_environment, data.cable_route, safeJsonStringify(data.cable_route_structured), data.equipment_position,
        data.ground_condition, safeJsonStringify(data.existing_lines), safeJsonStringify(data.difficulty_points), data.remarks, data.status || 'draft',
        existing.id
      )
      addActivityLog(projectId, 'update_survey', '更新现场勘查记录')
      return existing.id
    } else {
      const result = db.prepare(`
        INSERT INTO surveys (project_id, survey_date, surveyor, site_condition, 
          power_environment, cable_route, cable_route_structured, equipment_position, ground_condition, existing_lines, difficulty_points, remarks, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        projectId, data.survey_date, data.surveyor, data.site_condition,
        data.power_environment, data.cable_route, safeJsonStringify(data.cable_route_structured), data.equipment_position,
        data.ground_condition, safeJsonStringify(data.existing_lines), safeJsonStringify(data.difficulty_points), data.remarks, data.status || 'draft'
      )
      addActivityLog(projectId, 'create_survey', '创建现场勘查记录')
      return result.lastInsertRowid
    }
  })

  ipcMain.handle('submitSurvey', (_event, projectId: number, operator?: string) => {
    const db = getDb()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    db.prepare('UPDATE surveys SET status = ?, submitted_by = ?, submitted_at = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ?').run(
      'submitted', operator || '系统', now, projectId
    )
    updateProjectStatus(projectId, 'survey_submitted')
    addActivityLog(projectId, 'submit_survey', '提交现场勘查报告', operator || '系统')
  })

  ipcMain.handle('approveSurvey', (_event, projectId: number, operator?: string) => {
    const db = getDb()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    db.prepare('UPDATE surveys SET status = ?, confirmed_by = ?, confirmed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ?').run(
      'approved', operator || '系统', now, projectId
    )
    addActivityLog(projectId, 'approve_survey', '审核通过勘查报告', operator || '系统')
  })

  ipcMain.handle('getWiringPlansByProjectId', (_event, projectId: number) => {
    const db = getDb()
    const plans = db.prepare('SELECT * FROM wiring_plans WHERE project_id = ? ORDER BY id DESC').all(projectId) as any[]
    for (const plan of plans) {
      const rawMaterials = safeJsonParse(plan.planned_materials, [])
      plan.planned_materials = (rawMaterials || []).map((item: any) => ({
        ...item,
        material_id: Number(item?.material_id ?? item?.id ?? 0),
        quantity: Number(item?.quantity ?? item?.planned_qty ?? item?.qty ?? 0)
      }))
    }
    return plans
  })

  ipcMain.handle('saveWiringPlan', (_event, projectId: number, data: any) => {
    const db = getDb()
    const plannedMaterials = safeJsonParse(data.planned_materials, [])
    const txn = db.transaction(() => {
      let planId: number
      if (data.id) {
        db.prepare(`
          UPDATE wiring_plans SET plan_version = ?, work_face = ?, previous_conclusion = ?,
            wiring_method = ?, cable_spec = ?, cable_length = ?, conduit_spec = ?,
            conduit_length = ?, planned_materials = ?, remarks = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          data.plan_version, data.work_face, data.previous_conclusion,
          data.wiring_method, data.cable_spec, data.cable_length,
          data.conduit_spec, data.conduit_length, safeJsonStringify(data.planned_materials), data.remarks,
          data.status || 'draft', data.id
        )
        planId = data.id
        addActivityLog(projectId, 'update_wiring_plan', `更新布线计划：${data.plan_version}`)
      } else {
        const result = db.prepare(`
          INSERT INTO wiring_plans (project_id, plan_version, work_face, previous_conclusion,
            wiring_method, cable_spec, cable_length, conduit_spec, conduit_length, planned_materials, remarks, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId, data.plan_version, data.work_face, data.previous_conclusion,
          data.wiring_method, data.cable_spec, data.cable_length,
          data.conduit_spec, data.conduit_length, safeJsonStringify(data.planned_materials), data.remarks, data.status || 'draft', data.created_by || '系统'
        )
        planId = result.lastInsertRowid as number
        addActivityLog(projectId, 'create_wiring_plan', `创建布线计划：${data.plan_version}`)
      }
      syncProjectMaterials(projectId, plannedMaterials)
      return planId
    })
    return txn()
  })

  ipcMain.handle('confirmWiringPlan', (_event, projectId: number, planId: number, operator?: string) => {
    const db = getDb()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const txn = db.transaction(() => {
      db.prepare('UPDATE wiring_plans SET status = ?, confirmed_by = ?, confirmed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        'confirmed', operator || '系统', now, planId
      )
      const plan = db.prepare('SELECT planned_materials FROM wiring_plans WHERE id = ?').get(planId) as any
      if (plan) {
        const plannedMaterials = safeJsonParse(plan.planned_materials, [])
        syncProjectMaterials(projectId, plannedMaterials)
      }
      updateProjectStatus(projectId, 'wiring_planned')
      addActivityLog(projectId, 'confirm_wiring_plan', '确认布线计划', operator || '系统')
    })
    txn()
  })

  ipcMain.handle('getMaterials', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM materials ORDER BY id').all()
  })

  ipcMain.handle('getMaterialUsageByProjectId', (_event, projectId: number) => {
    const db = getDb()
    return db.prepare(`
      SELECT mur.*, m.material_name, m.spec, m.unit, m.unit_price, pm.planned_qty, pm.used_qty as project_used_qty
      FROM material_usage_records mur
      LEFT JOIN materials m ON mur.material_id = m.id
      LEFT JOIN project_materials pm ON mur.project_id = pm.project_id AND mur.material_id = pm.material_id
      WHERE mur.project_id = ?
      ORDER BY mur.created_at DESC
    `).all(projectId)
  })

  ipcMain.handle('addMaterialUsage', (_event, projectId: number, data: any) => {
    const db = getDb()
    const txn = db.transaction(() => {
      const pm = db.prepare('SELECT * FROM project_materials WHERE project_id = ? AND material_id = ?').get(projectId, data.material_id) as any
      const plannedQty = pm ? pm.planned_qty : 0
      const currentUsed = pm ? pm.used_qty : 0
      const newUsed = currentUsed + data.quantity
      const isOverrun = newUsed > plannedQty ? 1 : 0
      if (pm) {
        db.prepare('UPDATE project_materials SET used_qty = ?, is_overrun = MAX(is_overrun, ?) WHERE id = ?').run(newUsed, isOverrun, pm.id)
      }
      db.prepare('UPDATE materials SET stock_quantity = stock_quantity - ? WHERE id = ?').run(data.quantity, data.material_id)
      const result = db.prepare('INSERT INTO material_usage_records (project_id, material_id, quantity, usage_type, work_face, operator, remarks, approver, is_overrun) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        projectId, data.material_id, data.quantity, data.usage_type, data.work_face, data.operator, data.remarks, data.approver || null, isOverrun
      )
      addActivityLog(projectId, 'material_usage', '材料领用：' + data.material_name + ' x' + data.quantity + (isOverrun ? ' (超领预警)' : ''))
      return { id: result.lastInsertRowid, is_overrun: isOverrun }
    })
    return txn()
  })

  ipcMain.handle('getActivityLogs', (_event, projectId?: number, limit: number = 20) => {
    const db = getDb()
    if (projectId) {
      return db.prepare(`
        SELECT * FROM activity_logs 
        WHERE project_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(projectId, limit)
    } else {
      return db.prepare(`
        SELECT al.*, p.project_name 
        FROM activity_logs al
        LEFT JOIN projects p ON al.project_id = p.id
        ORDER BY al.created_at DESC 
        LIMIT ?
      `).all(limit)
    }
  })

  ipcMain.handle('getDashboardStats', () => {
    const db = getDb()
    const pendingSurvey = db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('pending_survey') as any
    const surveySubmitted = db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('survey_submitted') as any
    const wiringPlanned = db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('wiring_planned') as any
    const inProgress = db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('in_progress') as any
    const risky = db.prepare('SELECT COUNT(*) as count FROM projects WHERE risk_level != ?').get('none') as any
    const materialOveruse = db.prepare('SELECT COUNT(DISTINCT project_id) as count FROM project_materials WHERE is_overrun = 1').get() as any
    
    return {
      pending_survey: pendingSurvey.count,
      survey_submitted: surveySubmitted.count,
      wiring_planned: wiringPlanned.count,
      in_progress: inProgress.count,
      risky: risky.count,
      material_overuse: materialOveruse.count
    }
  })

  ipcMain.handle('getRiskyProjects', () => {
    const db = getDb()
    return db.prepare(`
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
    `).all('none')
  })

  ipcMain.handle('startConstruction', (_event, projectId: number) => {
    updateProjectStatus(projectId, 'in_progress')
    addActivityLog(projectId, 'start_construction', '项目开始施工')
  })

  ipcMain.handle('completeProject', (_event, projectId: number) => {
    updateProjectStatus(projectId, 'completed')
    addActivityLog(projectId, 'complete_project', '项目竣工验收通过')
  })

  ipcMain.handle('updateLastOpened', (_event, projectId: number) => {
    const db = getDb()
    db.prepare('UPDATE projects SET last_opened_at = CURRENT_TIMESTAMP WHERE id = ?').run(projectId)
  })

  ipcMain.handle('getRecentProjects', (_event, limit: number = 5) => {
    const db = getDb()
    return db.prepare(`
      SELECT * FROM projects 
      WHERE last_opened_at IS NOT NULL 
      ORDER BY last_opened_at DESC 
      LIMIT ?
    `).all(limit)
  })

  ipcMain.handle('getProjectMaterials', (_event, projectId: number) => {
    const db = getDb()
    return db.prepare(`
      SELECT pm.*, m.material_code, m.material_name, m.category, m.spec, m.unit, m.stock_quantity, m.unit_price
      FROM project_materials pm
      LEFT JOIN materials m ON pm.material_id = m.id
      WHERE pm.project_id = ?
      ORDER BY pm.id
    `).all(projectId)
  })

  ipcMain.handle('getTodoList', () => {
    const db = getDb()
    const todos: any[] = []
    let todoIdCounter = 1
    const pendingSurveyProjects = db.prepare('SELECT id, project_code, project_name, priority, created_at FROM projects WHERE status = ? ORDER BY created_at').all('pending_survey')
    pendingSurveyProjects.forEach((p: any) => todos.push({ id: todoIdCounter++, type: 'pending_survey', project_id: p.id, project_name: p.project_name, title: '待勘查', description: '项目等待现场勘查', priority: p.priority || 'normal', created_at: p.created_at }))
    const submittedSurveys = db.prepare('SELECT p.id, p.project_code, p.project_name, p.priority, s.submitted_at, s.submitted_by FROM surveys s JOIN projects p ON s.project_id = p.id WHERE s.status = ? ORDER BY s.submitted_at').all('submitted')
    submittedSurveys.forEach((s: any) => todos.push({ id: todoIdCounter++, type: 'survey_review', project_id: s.id, project_name: s.project_name, title: '待审核勘查', description: '由 ' + (s.submitted_by || '未知') + ' 提交', priority: s.priority || 'normal', created_at: s.submitted_at }))
    const pendingWiringPlans = db.prepare('SELECT p.id, p.project_code, p.project_name, p.priority, w.id as plan_id, w.plan_version, w.created_at FROM wiring_plans w JOIN projects p ON w.project_id = p.id WHERE w.status = ? ORDER BY w.created_at').all('draft')
    pendingWiringPlans.forEach((w: any) => todos.push({ id: todoIdCounter++, type: 'wiring_confirm', project_id: w.id, project_name: w.project_name, title: '待确认布线计划', description: '版本: ' + w.plan_version, priority: w.priority || 'normal', created_at: w.created_at }))
    const overrunProjects = db.prepare('SELECT DISTINCT p.id, p.project_code, p.project_name, p.priority FROM project_materials pm JOIN projects p ON pm.project_id = p.id WHERE pm.is_overrun = 1').all()
    overrunProjects.forEach((p: any) => todos.push({ id: todoIdCounter++, type: 'material_overuse', project_id: p.id, project_name: p.project_name, title: '材料超领预警', description: '存在材料领用超计划情况', priority: p.priority || 'normal', created_at: new Date().toISOString().replace('T', ' ').substring(0, 19) }))
    todos.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
    return todos
  })

  ipcMain.handle('markProjectOpened', (_event, projectId: number) => {
    const db = getDb()
    db.prepare('UPDATE projects SET last_opened_at = CURRENT_TIMESTAMP WHERE id = ?').run(projectId)
  })

  ipcMain.handle('getRecentActivity', (_event, limit: number = 10) => {
    const db = getDb()
    return db.prepare('SELECT al.*, p.project_name FROM activity_logs al LEFT JOIN projects p ON al.project_id = p.id ORDER BY al.created_at DESC LIMIT ?').all(limit)
  })

}
