import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as NoteController from '../controllers/NoteController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', asyncHandler(authenticate), asyncHandler(NoteController.searchNotes))
router.get('/:id', asyncHandler(authenticate), asyncHandler(NoteController.getNoteById))
router.get('/:customerId/timeline', asyncHandler(authenticate), asyncHandler(NoteController.getNoteTimeline))
router.post('/', asyncHandler(authenticate), asyncHandler(NoteController.createNote))
router.put('/:id', asyncHandler(authenticate), asyncHandler(NoteController.updateNote))
router.delete('/:id', asyncHandler(authenticate), asyncHandler(NoteController.deleteNote))

export default router