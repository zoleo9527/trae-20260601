import { Router } from 'express'
import { z } from 'zod'
import { authenticateToken, requireRole } from '../middleware/auth'
import {
  createAnnouncement,
  submitForReview,
  reviewAnnouncement,
  publishAnnouncement,
  withdrawAnnouncement,
  getAnnouncementById,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
} from '../services/announcementService'
import { AnnouncementStatus } from '@prisma/client'

const router = Router()

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  assetName: z.string().min(1),
  assetLocation: z.string().min(1),
  basePrice: z.number().positive(),
  auctionDate: z.coerce.date(),
  endDate: z.coerce.date(),
  depositAmount: z.number().positive()
})

router.post('/', authenticateToken, requireRole(['PROJECT_MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const validatedData = createSchema.parse(req.body)
    const { user } = req
    const announcement = await createAnnouncement(
      validatedData.title,
      validatedData.content,
      validatedData.assetName,
      validatedData.assetLocation,
      validatedData.basePrice,
      validatedData.auctionDate,
      validatedData.endDate,
      validatedData.depositAmount,
      user!.userId,
      user!.username
    )
    res.status(201).json(announcement)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/:id/submit', authenticateToken, requireRole(['PROJECT_MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    const { user } = req
    const announcement = await submitForReview(id, user!.userId, user!.username)
    res.json(announcement)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/:id/review', authenticateToken, requireRole(['REVIEWER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    const { approved } = req.body
    const { user } = req
    const announcement = await reviewAnnouncement(id, user!.userId, user!.username, approved)
    res.json(announcement)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/:id/publish', authenticateToken, requireRole(['PROJECT_MANAGER', 'REVIEWER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    const { user } = req
    const announcement = await publishAnnouncement(id, user!.userId, user!.username)
    res.json(announcement)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/:id/withdraw', authenticateToken, requireRole(['PROJECT_MANAGER', 'REVIEWER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    const { user } = req
    const announcement = await withdrawAnnouncement(id, user!.userId, user!.username)
    res.json(announcement)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const announcement = await getAnnouncementById(id)
    if (!announcement) {
      return res.status(404).json({ error: '公告不存在' })
    }
    res.json(announcement)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query
    const announcementStatus = status ? (status as AnnouncementStatus) : undefined
    const announcements = await getAnnouncements(announcementStatus)
    res.json(announcements)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authenticateToken, requireRole(['PROJECT_MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    const { user } = req
    const updateData = req.body
    const announcement = await updateAnnouncement(id, updateData, user!.userId, user!.username)
    res.json(announcement)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/:id', authenticateToken, requireRole(['PROJECT_MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    const { user } = req
    await deleteAnnouncement(id, user!.userId, user!.username)
    res.status(204).send()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

export default router