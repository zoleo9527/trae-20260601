import express from 'express'
import {
  getActivityStatusTransitions,
  getSettlementStatusTransitions,
  getActivityToSettlementMapping,
  transitionActivityStatus,
  transitionSettlementStatus,
  getActivityStatusFlow,
  getSettlementStatusFlow,
  ActivityStatus,
  SettlementStatus
} from '../services/statusFlowService'

const router = express.Router()

router.get('/activity/transitions/:status', (req, res) => {
  try {
    const { status } = req.params
    const validStatuses: ActivityStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    
    if (!validStatuses.includes(status as ActivityStatus)) {
      return res.status(400).json({ error: '无效的活动状态' })
    }

    const transitions = getActivityStatusTransitions(status as ActivityStatus)
    res.json({ currentStatus: status, transitions })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/settlement/transitions/:status', (req, res) => {
  try {
    const { status } = req.params
    const validStatuses: SettlementStatus[] = ['UNSETTLED', 'PARTIAL', 'SETTLED', 'DISPUTED']
    
    if (!validStatuses.includes(status as SettlementStatus)) {
      return res.status(400).json({ error: '无效的结算状态' })
    }

    const transitions = getSettlementStatusTransitions(status as SettlementStatus)
    res.json({ currentStatus: status, transitions })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/mapping/:activityStatus', (req, res) => {
  try {
    const { activityStatus } = req.params
    const validStatuses: ActivityStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    
    if (!validStatuses.includes(activityStatus as ActivityStatus)) {
      return res.status(400).json({ error: '无效的活动状态' })
    }

    const allowedSettlementStatuses = getActivityToSettlementMapping(activityStatus as ActivityStatus)
    res.json({ activityStatus, allowedSettlementStatuses })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.post('/activity/:activityId/transition', async (req, res) => {
  try {
    const { activityId } = req.params
    const { newStatus } = req.body as { newStatus: ActivityStatus }
    const userId = req.headers['x-user-id'] || 'admin'

    if (!newStatus) {
      return res.status(400).json({ error: '缺少新状态参数' })
    }

    const result = await transitionActivityStatus(activityId, newStatus, userId as string)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.post('/settlement/:settlementId/transition', async (req, res) => {
  try {
    const { settlementId } = req.params
    const { newStatus } = req.body as { newStatus: SettlementStatus }
    const userId = req.headers['x-user-id'] || 'admin'

    if (!newStatus) {
      return res.status(400).json({ error: '缺少新状态参数' })
    }

    const result = await transitionSettlementStatus(settlementId, newStatus, userId as string)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/activity/:activityId/flow', async (req, res) => {
  try {
    const { activityId } = req.params
    const result = await getActivityStatusFlow(activityId)
    res.json(result)
  } catch (error) {
    res.status(404).json({ error: (error as Error).message })
  }
})

router.get('/settlement/:settlementId/flow', async (req, res) => {
  try {
    const { settlementId } = req.params
    const result = await getSettlementStatusFlow(settlementId)
    res.json(result)
  } catch (error) {
    res.status(404).json({ error: (error as Error).message })
  }
})

export default router