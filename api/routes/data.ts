import { Router } from 'express'
import {
  projectCtrl, cableCtrl, teamCtrl, requisitionCtrl,
  checkinCtrl, pointCtrl, shortageCtrl, returnCtrl,
  timelineCtrl, traceCtrl, exportCtrl
} from '../controllers/dataController'

const router = Router()

router.get('/projects', projectCtrl.list)
router.get('/cables', cableCtrl.list)
router.get('/teams', teamCtrl.list)

router.get('/requisitions', requisitionCtrl.list)
router.get('/requisitions/:id', requisitionCtrl.get)
router.post('/requisitions', requisitionCtrl.create)
router.put('/requisitions/:id/approve', requisitionCtrl.approve)
router.put('/requisitions/:id/issue', requisitionCtrl.issue)

router.get('/checkins', checkinCtrl.list)
router.post('/checkins', checkinCtrl.create)
router.put('/checkins/:id/checkout', checkinCtrl.checkout)

router.get('/points', pointCtrl.list)
router.post('/points', pointCtrl.create)

router.get('/shortages', shortageCtrl.list)
router.post('/shortages', shortageCtrl.create)
router.put('/shortages/:id', shortageCtrl.update)

router.get('/returns', returnCtrl.list)
router.post('/returns', returnCtrl.create)
router.put('/returns/:id/receive', returnCtrl.receive)

router.get('/timeline/:projectId?', timelineCtrl.get)
router.get('/trace/:requisitionId?', traceCtrl.get)

router.get('/export/requisitions', exportCtrl.requisitions)
router.get('/export/points', exportCtrl.points)
router.get('/export/returns', exportCtrl.returns)

export default router
