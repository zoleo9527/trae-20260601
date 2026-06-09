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
    const existing = db.prepare(
      `SELECT id FROM problem_orders WHERE container_id = ? AND type = 'misplaced' AND status NOT IN ('resolved', 'rejected')`
    ).get(c.id)
    if (!existing) {
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
        `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, 'misplaced', 'critical', 'open', ?, ?, ?, ?, ?, ?)`
      ).run(c.id, `错放箱: 登记${c.expected_slot}实际${c.yard_slot}`, cause, JSON.stringify(chain), actionData, nowStr, nowStr)
      detected.push({ id: Number(result.lastInsertRowid), type: 'misplaced', isNew: true })
    } else {
      detected.push({ id: (existing as any).id, type: 'misplaced', isNew: false })
    }
  }

  const overdueContainers = db.prepare(
    `SELECT c.* FROM containers c WHERE c.free_storage_until IS NOT NULL AND c.free_storage_until < ? AND c.status != 'exited'${containerFilter}`
  ).all(nowStr) as any[]

  for (const c of overdueContainers) {
    const existing = db.prepare(
      `SELECT id FROM problem_orders WHERE container_id = ? AND type = 'overdue' AND status NOT IN ('resolved', 'rejected')`
    ).get(c.id)
    if (!existing) {
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
        `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, 'overdue', 'critical', 'open', ?, ?, ?, '{}', ?, ?)`
      ).run(c.id, `免堆期已过期，超期${diffDays}天未提箱`, cause, JSON.stringify(chain), nowStr, nowStr)
      detected.push({ id: Number(result.lastInsertRowid), type: 'overdue', isNew: true })
    } else {
      detected.push({ id: (existing as any).id, type: 'overdue', isNew: false })
    }
  }

  const expiringSoon = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const expiringContainers = db.prepare(
    `SELECT c.* FROM containers c WHERE c.free_storage_until IS NOT NULL AND c.free_storage_until >= ? AND c.free_storage_until < ? AND c.status != 'exited'${containerFilter}`
  ).all(nowStr, expiringSoon) as any[]

  for (const c of expiringContainers) {
    const existing = db.prepare(
      `SELECT id FROM problem_orders WHERE container_id = ? AND type = 'expiring_soon' AND status NOT IN ('resolved', 'rejected')`
    ).get(c.id)
    if (!existing) {
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
        `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, 'expiring_soon', 'warning', 'open', ?, ?, ?, '{}', ?, ?)`
      ).run(c.id, `免堆期即将到期，剩余${diffHours}小时`, cause, JSON.stringify(chain), nowStr, nowStr)
      detected.push({ id: Number(result.lastInsertRowid), type: 'expiring_soon', isNew: true })
    } else {
      detected.push({ id: (existing as any).id, type: 'expiring_soon', isNew: false })
    }
  }

  const soonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const missedInspections = db.prepare(
    `SELECT insp.* FROM inspections insp WHERE insp.status = 'planned' AND insp.notified_at IS NULL AND insp.planned_at < ?${containerId ? ` AND insp.container_id = ${containerId}` : ''}`
  ).all(soonThreshold) as any[]

  for (const insp of missedInspections) {
    const existing = db.prepare(
      `SELECT id FROM problem_orders WHERE inspection_id = ? AND type = 'missed_notify' AND status NOT IN ('resolved', 'rejected')`
    ).get(insp.id)
    if (!existing) {
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
        `INSERT INTO problem_orders (container_id, inspection_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, ?, 'missed_notify', 'critical', 'open', ?, ?, ?, '{}', ?, ?)`
      ).run(insp.container_id, insp.id, '查验计划已生成但未通知客户', cause, JSON.stringify(chain), nowStr, nowStr)
      detected.push({ id: Number(result.lastInsertRowid), type: 'missed_notify', isNew: true })
    } else {
      detected.push({ id: (existing as any).id, type: 'missed_notify', isNew: false })
    }
  }

  const detainedInspections = db.prepare(
    `SELECT insp.* FROM inspections insp WHERE insp.result = 'detained'${containerId ? ` AND insp.container_id = ${containerId}` : ''}`
  ).all() as any[]

  for (const insp of detainedInspections) {
    const existing = db.prepare(
      `SELECT id FROM problem_orders WHERE inspection_id = ? AND type = 'detained' AND status NOT IN ('resolved', 'rejected')`
    ).get(insp.id)
    if (!existing) {
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
        `INSERT INTO problem_orders (container_id, inspection_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, ?, 'detained', 'critical', 'open', ?, ?, ?, '{}', ?, ?)`
      ).run(insp.container_id, insp.id, '海关扣留，需等待补证材料', cause, JSON.stringify(chain), nowStr, nowStr)
      detected.push({ id: Number(result.lastInsertRowid), type: 'detained', isNew: true })
    } else {
      detected.push({ id: (existing as any).id, type: 'detained', isNew: false })
    }
  }

  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const stuckInspecting = db.prepare(
    `SELECT c.* FROM containers c WHERE c.status = 'inspecting' AND c.entered_at < ?${containerFilter}`
  ).all(twentyFourHoursAgo) as any[]

  for (const c of stuckInspecting) {
    const existing = db.prepare(
      `SELECT id FROM problem_orders WHERE container_id = ? AND type = 'stuck_inspecting' AND status NOT IN ('resolved', 'rejected')`
    ).get(c.id)
    if (!existing) {
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
        `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, 'stuck_inspecting', 'warning', 'open', ?, ?, ?, '{}', ?, ?)`
      ).run(c.id, `查验停滞，进场${stuckHours}小时仍在查验中`, cause, JSON.stringify(chain), nowStr, nowStr)
      detected.push({ id: Number(result.lastInsertRowid), type: 'stuck_inspecting', isNew: true })
    } else {
      detected.push({ id: (existing as any).id, type: 'stuck_inspecting', isNew: false })
    }
  }

  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const stuckMoveTasks = db.prepare(
    `SELECT mt.* FROM move_tasks mt WHERE mt.status = 'pending' AND mt.created_at < ?${containerId ? ` AND mt.container_id = ${containerId}` : ''}`
  ).all(twelveHoursAgo) as any[]

  for (const mt of stuckMoveTasks) {
    const existing = db.prepare(
      `SELECT id FROM problem_orders WHERE move_task_id = ? AND type = 'stuck_move' AND status NOT IN ('resolved', 'rejected')`
    ).get(mt.id)
    if (!existing) {
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
        `INSERT INTO problem_orders (container_id, move_task_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, ?, 'stuck_move', 'warning', 'open', ?, ?, ?, '{}', ?, ?)`
      ).run(mt.container_id, mt.id, `移箱任务超12小时未执行: ${mt.from_slot}→${mt.to_slot}`, cause, JSON.stringify(chain), nowStr, nowStr)
      detected.push({ id: Number(result.lastInsertRowid), type: 'stuck_move', isNew: true })
    } else {
      detected.push({ id: (existing as any).id, type: 'stuck_move', isNew: false })
    }
  }

  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const noInspectionContainers = db.prepare(
    `SELECT c.* FROM containers c WHERE c.status IN ('yarded', 'inspecting') AND c.entered_at < ? AND c.id NOT IN (SELECT DISTINCT container_id FROM inspections)${containerFilter}`
  ).all(sixHoursAgo) as any[]

  for (const c of noInspectionContainers) {
    const existing = db.prepare(
      `SELECT id FROM problem_orders WHERE container_id = ? AND type = 'no_inspection' AND status NOT IN ('resolved', 'rejected')`
    ).get(c.id)
    if (!existing) {
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
        `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, 'no_inspection', 'warning', 'open', ?, ?, ?, '{}', ?, ?)`
      ).run(c.id, `进场${waitHours}小时无查验计划`, cause, JSON.stringify(chain), nowStr, nowStr)
      detected.push({ id: Number(result.lastInsertRowid), type: 'no_inspection', isNew: true })
    } else {
      detected.push({ id: (existing as any).id, type: 'no_inspection', isNew: false })
    }
  }

  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const stagnantContainers = db.prepare(
    `SELECT c.* FROM containers c WHERE c.status = 'inspection_done' AND c.entered_at < ?${containerFilter}`
  ).all(eightHoursAgo) as any[]

  for (const c of stagnantContainers) {
    const existing = db.prepare(
      `SELECT id FROM problem_orders WHERE container_id = ? AND type = 'yard_stagnation' AND status NOT IN ('resolved', 'rejected')`
    ).get(c.id)
    if (!existing) {
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
        `INSERT INTO problem_orders (container_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, 'yard_stagnation', 'warning', 'open', ?, ?, ?, '{}', ?, ?)`
      ).run(c.id, `查验完成未移箱出场，滞留${stagnantHours}小时`, cause, JSON.stringify(chain), nowStr, nowStr)
      detected.push({ id: Number(result.lastInsertRowid), type: 'yard_stagnation', isNew: true })
    } else {
      detected.push({ id: (existing as any).id, type: 'yard_stagnation', isNew: false })
    }
  }

  return detected
}
