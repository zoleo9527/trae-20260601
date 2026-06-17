import express from 'express'
import {
  createSettlement,
  getSettlementById,
  getSettlements,
  updateSettlement,
  getUnsettledSettlements
} from '../services/settlementService'
import { UpdateSettlementRequest, SettlementFilter } from '../types'

const router = express.Router()

router.post('/:teamBuildingId', async (req, res) => {
  try {
    const { teamBuildingId } = req.params
    const userId = req.headers['x-user-id'] || 'admin'
    const { notes } = req.body as { notes?: string }
    const result = await createSettlement(teamBuildingId, userId as string, notes)
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await getSettlementById(id)
    if (!result) {
      return res.status(404).json({ error: 'Settlement not found' })
    }
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const filter: SettlementFilter = {
      status: req.query.status as SettlementFilter['status'],
      dateStart: req.query.dateStart as string,
      dateEnd: req.query.dateEnd as string
    }
    const result = await getSettlements(filter, page, pageSize)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body as UpdateSettlementRequest
    const userId = req.headers['x-user-id'] || 'admin'
    const result = await updateSettlement(id, data, userId as string)
    if (!result) {
      return res.status(404).json({ error: 'Settlement not found' })
    }
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/overview/unsettled', async (req, res) => {
  try {
    const result = await getUnsettledSettlements()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

export default router