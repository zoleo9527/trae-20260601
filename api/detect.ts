import { getDb } from './database.js'

interface CauseChainItem {
  event: string
  time: string
  detail: string
}

interface DetectedProblem {
  id: number
  type: string
  isNew: boolean
}

interface ExistingProblem {
  id: number
  status: string
  fingerprint: string | null
}

/**
 * 生成问题单的业务事实指纹
 * 指纹是稳定的，相同业务事实会生成相同指纹
 */
function generateFingerprint(type: string, params: Record<string, string | number>): string {
  const parts: string[] = [type]
  
  switch (type) {
    case 'misplaced':
      parts.push(String(params.container_id), String(params.expected_slot || ''), String(params.yard_slot || ''))
      break
    case 'overdue':
    case 'expiring_soon':
    case 'stuck_inspecting':
    case 'no_inspection':
    case 'yard_stagnation':
      parts.push(String(params.container_id))
      break
    case 'missed_notify':
    case 'detained':
      parts.push(String(params.inspection_id))
      break
    case 'stuck_move':
      parts.push(String(params.move_task_id))
      break
    default:
      parts.push(String(params.container_id || params.inspection_id || params.move_task_id || 'unknown'))
  }
  
  return parts.join('_')
}

/**
 * 检查已存在问题单的状态，决定是否需要创建新的问题单
 * 基于业务事实指纹进行匹配：
 * - 如果存在同指纹的 rejected 状态问题单，不创建新的（同一业务事实已确认不需要处理）
 * - 如果存在同指纹的 open 状态问题单，不创建新的（避免重复待处理）
 * - 如果存在同指纹的 rescheduled/supplemented 状态问题单，创建新的（风险再次暴露）
 * - 向后兼容：fingerprint 为 NULL 的旧记录参与同类型去重（基于 container_id/inspection_id/move_task_id）
 */
function shouldCreateNewProblem(existingList: ExistingProblem[], fingerprint: string): { create: boolean; latestId: number | null } {
  // 优先查找完全同指纹的记录
  const sameFingerprintList = existingList.filter(p => p.fingerprint === fingerprint)
  
  // 向后兼容：如果没有找到同指纹的记录，检查 fingerprint 为 NULL 的旧记录
  // 这些旧记录的指纹需要根据其 container_id/inspection_id/move_task_id 来匹配
  if (sameFingerprintList.length === 0) {
    const nullFingerprintList = existingList.filter(p => p.fingerprint === null)
    if (nullFingerprintList.length > 0) {
      // 旧记录存在，使用旧记录的状态判断
      return determineByStatus(nullFingerprintList)
    }
    // 没有任何记录，创建新的
    return { create: true, latestId: null }
  }
  
  return determineByStatus(sameFingerprintList)
}

/**
 * 根据问题单状态列表决定是否创建新问题单
 */
function determineByStatus(sameFingerprintList: ExistingProblem[]): { create: boolean; latestId: number | null } {
  // 检查是否存在 rejected 状态问题单
  const hasRejected = sameFingerprintList.some(p => p.status === 'rejected')
  if (hasRejected) {
    return { create: false, latestId: sameFingerprintList[sameFingerprintList.length - 1].id }
  }
  
  // 检查是否存在 open 状态问题单
  const hasOpen = sameFingerprintList.some(p => p.status === 'open')
  if (hasOpen) {
    const openProblem = sameFingerprintList.find(p => p.status === 'open')
    return { create: false, latestId: openProblem?.id || sameFingerprintList[0].id }
  }
  
  // 检查是否存在 resolved 状态问题单（风险已解决，可以重新检测）
  const hasResolved = sameFingerprintList.some(p => p.status === 'resolved')
  if (hasResolved) {
    return { create: true, latestId: null }
  }
  
  // 检查是否存在 rescheduled/supplemented 状态问题单（风险再次暴露）
  const hasRescheduledOrSupplemented = sameFingerprintList.some(p => p.status === 'rescheduled' || p.status === 'supplemented')
  if (hasRescheduledOrSupplemented) {
    return { create: true, latestId: sameFingerprintList[sameFingerprintList.length - 1].id }
  }
  
  // 其他状态：不创建新的
  return { create: false, latestId: sameFingerprintList[sameFingerprintList.length - 1].id }
}

export function detectProblems(containerId?: number): DetectedProblem[] {
  const db = getDb()
  const now = new Date()
  const nowStr = now.toISOString().replace('T', ' ').slice(0, 19)
  const detected: DetectedProblem[] = []

  const containerFilter = containerId ? ` AND c.id = ${containerId}` : ''

  const misplacedContainers = db.prepare(
    `SELECT c.* FROM containers c WHERE c.expected_slot IS NOT NULL AND c.yard_slot IS NOT NULL AND c.yard_slot != c.expected_slot AND c.status != 'exited'${containerFilter}`
  ).all() as any[]

  for (const c of misplacedContainers) {
    const fingerprint = generateFingerprint('misplaced', { 
      container_id: c.id, 
      expected_slot: c.expected_slot, 
      yard_slot: c.yard_slot 
    })
    
    const existingList = db.prepare(
      `SELECT id, status, fingerprint FROM problem_orders WHERE container_id = ? AND type = 'misplaced' ORDER BY id`
    ).all(c.id) as ExistingProblem[]
    const decision = shouldCreateNewProblem(existingList, fingerprint)
    if (!decision.create) {
      if (decision.latestId) {
        detected.push({ id: decision.latestId, type: 'misplaced', isNew: false })
      }
      continue
    }

    const completedMoves = db.prepare(
      `SELECT * FROM move_tasks WHERE container_id = ? AND status = 'completed' ORDER BY completed_at DESC`
    ).all(c.id) as any[]
    const lastMove = completedMoves[0]
    const justifiedByMove = lastMove && lastMove.to_slot === c.yard_slot

    if (justifiedByMove) continue

    const cause = `闸口登记堆位${c.expected_slot}，实际在${c.yard_slot}，无移箱任务记录`
    const chain: CauseChainItem[] = [
      { event: 'gate_register', time: c.entered_at, detail: `闸口登记指定堆位${c.expected_slot}` },
    ]
    if (completedMoves.length > 0) {
      for (const mt of completedMoves) {
        chain.push({ event: 'move_completed', time: mt.completed_at!, detail: `移箱完成: ${mt.from_slot}→${mt.to_slot}` })
      }
      chain.push({ event: 'position_mismatch', time: nowStr, detail: `最新移箱目标${lastMove.to_slot}与实际位置${c.yard_slot}仍不一致，疑似再次错放` })
    } else {
      chain.push({ event: 'no_move_task', time: nowStr, detail: `无${c.expected_slot}→${c.yard_slot}移箱任务记录` })
      chain.push({ event: 'position_mismatch', time: nowStr, detail: `实际堆位${c.yard_slot}与登记堆位${c.expected_slot}不一致，吊装错位` })
    }

    const actionData = JSON.stringify({ expected: c.expected_slot, actual: c.yard_slot })
    const result = db.prepare(
      `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, fingerprint, detected_at, updated_at) VALUES (?, 'misplaced', 'critical', 'open', ?, ?, ?, ?, ?, ?, ?)`
    ).run(c.id, `错放箱: 登记${c.expected_slot}实际${c.yard_slot}`, cause, JSON.stringify(chain), actionData, fingerprint, nowStr, nowStr)
    detected.push({ id: Number(result.lastInsertRowid), type: 'misplaced', isNew: true })
  }

  const overdueContainers = db.prepare(
    `SELECT c.* FROM containers c WHERE c.free_storage_until IS NOT NULL AND c.free_storage_until < ? AND c.status != 'exited'${containerFilter}`
  ).all(nowStr) as any[]

  for (const c of overdueContainers) {
    const fingerprint = generateFingerprint('overdue', { container_id: c.id })
    
    const existingList = db.prepare(
      `SELECT id, status, fingerprint FROM problem_orders WHERE container_id = ? AND type = 'overdue' ORDER BY id`
    ).all(c.id) as ExistingProblem[]
    const decision = shouldCreateNewProblem(existingList, fingerprint)
    if (!decision.create) {
      if (decision.latestId) {
        detected.push({ id: decision.latestId, type: 'overdue', isNew: false })
      }
      continue
    }

    const freeDate = c.free_storage_until.slice(0, 10)
    const diffMs = now.getTime() - new Date(c.free_storage_until).getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const cause = `免堆期至${freeDate}已过期，超期${diffDays}天未提箱`
    const chain: CauseChainItem[] = [
      { event: 'container_entered', time: c.entered_at, detail: `闸口进场登记，堆位${c.yard_slot || '未分配'}` },
      { event: 'free_storage_set', time: c.entered_at, detail: `免堆期至${freeDate}` },
    ]
    const inspections = db.prepare('SELECT * FROM inspections WHERE container_id = ?').all(c.id) as any[]
    if (inspections.length === 0) {
      const enterDays = Math.floor((now.getTime() - new Date(c.entered_at).getTime()) / (1000 * 60 * 60 * 24))
      chain.push({ event: 'no_inspection', time: nowStr, detail: `进场${enterDays}天无查验计划，无出场记录` })
    }
    chain.push({ event: 'free_storage_expired', time: nowStr, detail: `免堆期已过期${diffDays}天，超期堆存费争议风险` })

    const result = db.prepare(
      `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, fingerprint, detected_at, updated_at) VALUES (?, 'overdue', 'critical', 'open', ?, ?, ?, '{}', ?, ?, ?)`
    ).run(c.id, `免堆期已过期，超期${diffDays}天未提箱`, cause, JSON.stringify(chain), fingerprint, nowStr, nowStr)
    detected.push({ id: Number(result.lastInsertRowid), type: 'overdue', isNew: true })
  }

  const expiringSoon = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const expiringContainers = db.prepare(
    `SELECT c.* FROM containers c WHERE c.free_storage_until IS NOT NULL AND c.free_storage_until >= ? AND c.free_storage_until < ? AND c.status != 'exited'${containerFilter}`
  ).all(nowStr, expiringSoon) as any[]

  for (const c of expiringContainers) {
    const fingerprint = generateFingerprint('expiring_soon', { container_id: c.id })
    
    const existingList = db.prepare(
      `SELECT id, status, fingerprint FROM problem_orders WHERE container_id = ? AND type = 'expiring_soon' ORDER BY id`
    ).all(c.id) as ExistingProblem[]
    const decision = shouldCreateNewProblem(existingList, fingerprint)
    if (!decision.create) {
      if (decision.latestId) {
        detected.push({ id: decision.latestId, type: 'expiring_soon', isNew: false })
      }
      continue
    }

    const freeDate = c.free_storage_until.slice(0, 10)
    const diffMs = new Date(c.free_storage_until).getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const cause = `免堆期${freeDate}即将到期，剩余${diffHours}小时`
    const chain: CauseChainItem[] = [
      { event: 'container_entered', time: c.entered_at, detail: `闸口进场登记，堆位${c.yard_slot || '未分配'}` },
      { event: 'free_storage_set', time: c.entered_at, detail: `免堆期至${freeDate}` },
      { event: 'no_exit_plan', time: nowStr, detail: `距免堆期仅剩${diffHours}小时，无出场计划` },
    ]
    const inspections = db.prepare('SELECT * FROM inspections WHERE container_id = ? AND status NOT IN (\'completed\')').all(c.id) as any[]
    if (inspections.length > 0) {
      chain.push({ event: 'inspection_blocking', time: nowStr, detail: `${inspections.length}个查验未完成，阻碍出场` })
    }

    const result = db.prepare(
      `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, fingerprint, detected_at, updated_at) VALUES (?, 'expiring_soon', 'warning', 'open', ?, ?, ?, '{}', ?, ?, ?)`
    ).run(c.id, `免堆期即将到期，剩余${diffHours}小时`, cause, JSON.stringify(chain), fingerprint, nowStr, nowStr)
    detected.push({ id: Number(result.lastInsertRowid), type: 'expiring_soon', isNew: true })
  }

  const soonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const missedInspections = db.prepare(
    `SELECT insp.* FROM inspections insp WHERE insp.status = 'planned' AND insp.notified_at IS NULL AND insp.planned_at < ?${containerId ? ` AND insp.container_id = ${containerId}` : ''}`
  ).all(soonThreshold) as any[]

  for (const insp of missedInspections) {
    const fingerprint = generateFingerprint('missed_notify', { inspection_id: insp.id })
    
    const existingList = db.prepare(
      `SELECT id, status, fingerprint FROM problem_orders WHERE inspection_id = ? AND type = 'missed_notify' ORDER BY id`
    ).all(insp.id) as ExistingProblem[]
    const decision = shouldCreateNewProblem(existingList, fingerprint)
    if (!decision.create) {
      if (decision.latestId) {
        detected.push({ id: decision.latestId, type: 'missed_notify', isNew: false })
      }
      continue
    }

    const plannedDate = insp.planned_at.slice(0, 10)
    const cause = `查验计划${plannedDate}执行，但截至${nowStr.slice(0, 10)}仍未通知客户`
    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(insp.container_id) as any
    const chain: CauseChainItem[] = [
      { event: 'inspection_planned', time: insp.created_at || insp.planned_at, detail: `创建${insp.type === 'full' ? '全掏' : insp.type === 'random' ? '抽查' : '开箱'}查验计划，计划时间${insp.planned_at.slice(0, 16)}` },
      { event: 'no_notify', time: nowStr, detail: `距计划执行不足24小时，仍未通知客户到场` },
      { event: 'risk', time: nowStr, detail: '客户不知情将导致查验无法按时执行' },
    ]
    if (container?.free_storage_until) {
      const freeDate = container.free_storage_until.slice(0, 10)
      chain.push({ event: 'storage_pressure', time: nowStr, detail: `免堆期${freeDate}，查验延误可能引发超期` })
    }

    const result = db.prepare(
      `INSERT INTO problem_orders (container_id, inspection_id, type, severity, status, description, cause, cause_chain, action_data, fingerprint, detected_at, updated_at) VALUES (?, ?, 'missed_notify', 'critical', 'open', ?, ?, ?, '{}', ?, ?, ?)`
    ).run(insp.container_id, insp.id, '查验计划已生成但未通知客户', cause, JSON.stringify(chain), fingerprint, nowStr, nowStr)
    detected.push({ id: Number(result.lastInsertRowid), type: 'missed_notify', isNew: true })
  }

  const detainedInspections = db.prepare(
    `SELECT insp.* FROM inspections insp WHERE insp.result = 'detained'${containerId ? ` AND insp.container_id = ${containerId}` : ''}`
  ).all() as any[]

  for (const insp of detainedInspections) {
    const fingerprint = generateFingerprint('detained', { inspection_id: insp.id })
    
    const existingList = db.prepare(
      `SELECT id, status, fingerprint FROM problem_orders WHERE inspection_id = ? AND type = 'detained' ORDER BY id`
    ).all(insp.id) as ExistingProblem[]
    const decision = shouldCreateNewProblem(existingList, fingerprint)
    if (!decision.create) {
      if (decision.latestId) {
        detected.push({ id: decision.latestId, type: 'detained', isNew: false })
      }
      continue
    }

    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(insp.container_id) as any
    const cause = '查验结果为扣留，客户未提供完整报关材料'
    const detainedDays = insp.completed_at ? Math.floor((now.getTime() - new Date(insp.completed_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
    const chain: CauseChainItem[] = [
      { event: 'inspection_planned', time: insp.planned_at, detail: '创建查验计划' },
      { event: 'inspection_executed', time: insp.completed_at || nowStr, detail: '执行查验，开箱→掏箱→结果' },
      { event: 'inspection_result', time: insp.completed_at || nowStr, detail: '查验结果：扣留，报关材料不完整' },
      { event: 'no_supplement', time: nowStr, detail: `客户${detainedDays}天未补证，箱体持续占用堆位${container?.yard_slot || ''}` },
    ]

    const result = db.prepare(
      `INSERT INTO problem_orders (container_id, inspection_id, type, severity, status, description, cause, cause_chain, action_data, fingerprint, detected_at, updated_at) VALUES (?, ?, 'detained', 'critical', 'open', ?, ?, ?, '{}', ?, ?, ?)`
    ).run(insp.container_id, insp.id, '海关扣留，需等待补证材料', cause, JSON.stringify(chain), fingerprint, nowStr, nowStr)
    detected.push({ id: Number(result.lastInsertRowid), type: 'detained', isNew: true })
  }

  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const stuckInspecting = db.prepare(
    `SELECT c.* FROM containers c WHERE c.status = 'inspecting' AND c.entered_at < ?${containerFilter}`
  ).all(twentyFourHoursAgo) as any[]

  for (const c of stuckInspecting) {
    const fingerprint = generateFingerprint('stuck_inspecting', { container_id: c.id })
    
    const existingList = db.prepare(
      `SELECT id, status, fingerprint FROM problem_orders WHERE container_id = ? AND type = 'stuck_inspecting' ORDER BY id`
    ).all(c.id) as ExistingProblem[]
    const decision = shouldCreateNewProblem(existingList, fingerprint)
    if (!decision.create) {
      if (decision.latestId) {
        detected.push({ id: decision.latestId, type: 'stuck_inspecting', isNew: false })
      }
      continue
    }

    const stuckHours = Math.floor((now.getTime() - new Date(c.entered_at).getTime()) / (1000 * 60 * 60))
    const cause = `进场后${stuckHours}小时仍处于查验中，无查验计划或查验停滞`
    const chain: CauseChainItem[] = [
      { event: 'container_entered', time: c.entered_at, detail: `闸口进场登记，堆位${c.yard_slot || '未分配'}` },
    ]
    const inspections = db.prepare('SELECT * FROM inspections WHERE container_id = ?').all(c.id) as any[]
    if (inspections.length === 0) {
      chain.push({ event: 'no_inspection_plan', time: nowStr, detail: `进场${stuckHours}小时，仍未创建查验计划` })
    } else {
      const latestInsp = inspections[inspections.length - 1]
      chain.push({ event: 'inspection_stalled', time: latestInsp.planned_at, detail: `查验计划存在但停滞在${latestInsp.step}步骤` })
    }
    chain.push({ event: 'stuck', time: nowStr, detail: `查验中状态停滞${stuckHours}小时，无法流转` })

    const result = db.prepare(
      `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, fingerprint, detected_at, updated_at) VALUES (?, 'stuck_inspecting', 'warning', 'open', ?, ?, ?, '{}', ?, ?, ?)`
    ).run(c.id, `查验停滞，进场${stuckHours}小时仍在查验中`, cause, JSON.stringify(chain), fingerprint, nowStr, nowStr)
    detected.push({ id: Number(result.lastInsertRowid), type: 'stuck_inspecting', isNew: true })
  }

  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const stuckMoveTasks = db.prepare(
    `SELECT mt.* FROM move_tasks mt WHERE mt.status = 'pending' AND mt.created_at < ?${containerId ? ` AND mt.container_id = ${containerId}` : ''}`
  ).all(twelveHoursAgo) as any[]

  for (const mt of stuckMoveTasks) {
    const fingerprint = generateFingerprint('stuck_move', { move_task_id: mt.id })
    
    const existingList = db.prepare(
      `SELECT id, status, fingerprint FROM problem_orders WHERE move_task_id = ? AND type = 'stuck_move' ORDER BY id`
    ).all(mt.id) as ExistingProblem[]
    const decision = shouldCreateNewProblem(existingList, fingerprint)
    if (!decision.create) {
      if (decision.latestId) {
        detected.push({ id: decision.latestId, type: 'stuck_move', isNew: false })
      }
      continue
    }

    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(mt.container_id) as any
    const stuckHours = Math.floor((now.getTime() - new Date(mt.created_at).getTime()) / (1000 * 60 * 60))
    const cause = `移箱任务创建后${stuckHours}小时未执行，${mt.from_slot}→${mt.to_slot}`
    const chain: CauseChainItem[] = []
    if (mt.source_inspection_id) {
      const insp = db.prepare('SELECT * FROM inspections WHERE id = ?').get(mt.source_inspection_id) as any
      if (insp) {
        chain.push({ event: 'inspection_result', time: insp.completed_at || mt.created_at, detail: `查验${insp.result === 'released' ? '放行' : insp.result}，需移箱` })
      }
    }
    chain.push({ event: 'move_task_created', time: mt.created_at, detail: `创建移箱任务: ${mt.from_slot}→${mt.to_slot}` })
    chain.push({ event: 'move_pending_timeout', time: nowStr, detail: `任务pending超${stuckHours}小时，箱仍占原堆位${container?.yard_slot || mt.from_slot}` })
    if (container?.free_storage_until) {
      const freeDate = container.free_storage_until.slice(0, 10)
      chain.push({ event: 'storage_pressure', time: nowStr, detail: `免堆期${freeDate}，移箱延误可能引发超期` })
    }

    const result = db.prepare(
      `INSERT INTO problem_orders (container_id, move_task_id, type, severity, status, description, cause, cause_chain, action_data, fingerprint, detected_at, updated_at) VALUES (?, ?, 'stuck_move', 'warning', 'open', ?, ?, ?, '{}', ?, ?, ?)`
    ).run(mt.container_id, mt.id, `移箱任务超12小时未执行: ${mt.from_slot}→${mt.to_slot}`, cause, JSON.stringify(chain), fingerprint, nowStr, nowStr)
    detected.push({ id: Number(result.lastInsertRowid), type: 'stuck_move', isNew: true })
  }

  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const noInspectionContainers = db.prepare(
    `SELECT c.* FROM containers c WHERE c.status IN ('yarded', 'inspecting') AND c.entered_at < ? AND c.id NOT IN (SELECT DISTINCT container_id FROM inspections)${containerFilter}`
  ).all(sixHoursAgo) as any[]

  for (const c of noInspectionContainers) {
    const fingerprint = generateFingerprint('no_inspection', { container_id: c.id })
    
    const existingList = db.prepare(
      `SELECT id, status, fingerprint FROM problem_orders WHERE container_id = ? AND type = 'no_inspection' ORDER BY id`
    ).all(c.id) as ExistingProblem[]
    const decision = shouldCreateNewProblem(existingList, fingerprint)
    if (!decision.create) {
      if (decision.latestId) {
        detected.push({ id: decision.latestId, type: 'no_inspection', isNew: false })
      }
      continue
    }

    const waitHours = Math.floor((now.getTime() - new Date(c.entered_at).getTime()) / (1000 * 60 * 60))
    const cause = `进场${waitHours}小时无查验计划，状态${c.status}，无法推进流转`
    const chain: CauseChainItem[] = [
      { event: 'container_entered', time: c.entered_at, detail: `闸口进场登记，堆位${c.yard_slot || '未分配'}` },
    ]
    if (c.free_storage_until) {
      const freeDate = c.free_storage_until.slice(0, 10)
      chain.push({ event: 'free_storage_set', time: c.entered_at, detail: `免堆期至${freeDate}` })
    }
    chain.push({ event: 'no_inspection_plan', time: nowStr, detail: `进场${waitHours}小时仍未创建查验计划，调度未分配查验指令` })
    if (c.free_storage_until) {
      const remainingMs = new Date(c.free_storage_until).getTime() - now.getTime()
      if (remainingMs < 72 * 60 * 60 * 1000) {
        chain.push({ event: 'storage_pressure', time: nowStr, detail: `免堆期${c.free_storage_until.slice(0, 10)}临近，无查验计划将直接超期` })
      }
    }

    const result = db.prepare(
      `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, fingerprint, detected_at, updated_at) VALUES (?, 'no_inspection', 'warning', 'open', ?, ?, ?, '{}', ?, ?, ?)`
    ).run(c.id, `进场${waitHours}小时无查验计划`, cause, JSON.stringify(chain), fingerprint, nowStr, nowStr)
    detected.push({ id: Number(result.lastInsertRowid), type: 'no_inspection', isNew: true })
  }

  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const stagnantContainers = db.prepare(
    `SELECT c.* FROM containers c WHERE c.status = 'inspection_done' AND c.entered_at < ?${containerFilter}`
  ).all(eightHoursAgo) as any[]

  for (const c of stagnantContainers) {
    const fingerprint = generateFingerprint('yard_stagnation', { container_id: c.id })
    
    const existingList = db.prepare(
      `SELECT id, status, fingerprint FROM problem_orders WHERE container_id = ? AND type = 'yard_stagnation' ORDER BY id`
    ).all(c.id) as ExistingProblem[]
    const decision = shouldCreateNewProblem(existingList, fingerprint)
    if (!decision.create) {
      if (decision.latestId) {
        detected.push({ id: decision.latestId, type: 'yard_stagnation', isNew: false })
      }
      continue
    }

    const completedInsp = db.prepare(
      `SELECT * FROM inspections WHERE container_id = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT 1`
    ).get(c.id) as any
    const hasMoveTask = db.prepare(
      `SELECT id FROM move_tasks WHERE container_id = ? AND status NOT IN ('cancelled')`
    ).get(c.id)

    if (hasMoveTask) continue

    const stagnantHours = completedInsp
      ? Math.floor((now.getTime() - new Date(completedInsp.completed_at).getTime()) / (1000 * 60 * 60))
      : Math.floor((now.getTime() - new Date(c.entered_at).getTime()) / (1000 * 60 * 60))
    const cause = `查验完成${stagnantHours}小时未安排移箱出场，箱体占位`
    const chain: CauseChainItem[] = [
      { event: 'container_entered', time: c.entered_at, detail: `闸口进场登记，堆位${c.yard_slot || '未分配'}` },
    ]
    if (completedInsp) {
      chain.push({ event: 'inspection_completed', time: completedInsp.completed_at, detail: `查验完成，结果${completedInsp.result === 'released' ? '放行' : completedInsp.result}` })
    }
    chain.push({ event: 'no_move_task', time: nowStr, detail: `查验放行${stagnantHours}小时，未创建移箱任务，放行箱占位` })
    if (c.free_storage_until) {
      const freeDate = c.free_storage_until.slice(0, 10)
      chain.push({ event: 'storage_pressure', time: nowStr, detail: `免堆期${freeDate}，查验后滞留可能引发超期堆存费` })
    }

    const result = db.prepare(
      `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, fingerprint, detected_at, updated_at) VALUES (?, 'yard_stagnation', 'warning', 'open', ?, ?, ?, '{}', ?, ?, ?)`
    ).run(c.id, `查验完成未移箱出场，滞留${stagnantHours}小时`, cause, JSON.stringify(chain), fingerprint, nowStr, nowStr)
    detected.push({ id: Number(result.lastInsertRowid), type: 'yard_stagnation', isNew: true })
  }

  return detected
}
