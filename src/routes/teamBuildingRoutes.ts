import express from 'express'
import {
  createTeamBuilding,
  getTeamBuildingById,
  getTeamBuildings,
  updateTeamBuilding,
  deleteTeamBuilding,
  getPendingTeamBuildings,
  getHighRiskTeamBuildings,
  getRecentChanges
} from '../services/teamBuildingService'
import { CreateTeamBuildingRequest, UpdateTeamBuildingRequest, TeamBuildingFilter } from '../types'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const data = req.body as CreateTeamBuildingRequest
    const userId = req.headers['x-user-id'] || 'admin'
    const result = await createTeamBuilding(data, userId as string)
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await getTeamBuildingById(id)
    if (!result) {
      return res.status(404).json({ error: 'Team building not found' })
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
    const filter: TeamBuildingFilter = {
      status: req.query.status as TeamBuildingFilter['status'],
      riskLevel: req.query.riskLevel as TeamBuildingFilter['riskLevel'],
      dateStart: req.query.dateStart as string,
      dateEnd: req.query.dateEnd as string,
      keyword: req.query.keyword as string
    }
    const result = await getTeamBuildings(filter, page, pageSize)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body as UpdateTeamBuildingRequest
    const userId = req.headers['x-user-id'] || 'admin'
    const result = await updateTeamBuilding(id, data, userId as string)
    if (!result) {
      return res.status(404).json({ error: 'Team building not found' })
    }
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await deleteTeamBuilding(id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/overview/pending', async (req, res) => {
  try {
    const result = await getPendingTeamBuildings()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/overview/high-risk', async (req, res) => {
  try {
    const result = await getHighRiskTeamBuildings()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/overview/recent-changes', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7
    const result = await getRecentChanges(days)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

export default router