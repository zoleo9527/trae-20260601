import { Router, type Request, type Response } from 'express'
import { FarmerService, CreateFarmerRequest, UpdateFarmerRequest } from '../services/FarmerService'

const router = Router()
const farmerService = new FarmerService()

router.post('/', async (req: Request, res: Response) => {
  try {
    const request: CreateFarmerRequest = req.body
    const farmer = await farmerService.createFarmer(request)
    res.status(201).json({ success: true, data: farmer })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const farmers = await farmerService.getAllFarmers()
    res.json({ success: true, data: farmers })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/debt', async (req: Request, res: Response) => {
  try {
    const farmers = await farmerService.getFarmersWithDebt()
    res.json({ success: true, data: farmers })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:farmerId', async (req: Request, res: Response) => {
  try {
    const farmer = await farmerService.getFarmerById(req.params.farmerId)
    res.json({ success: true, data: farmer })
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message })
  }
})

router.get('/phone/:phone', async (req: Request, res: Response) => {
  try {
    const farmer = await farmerService.getFarmerByPhone(req.params.phone)
    res.json({ success: true, data: farmer })
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message })
  }
})

router.put('/:farmerId', async (req: Request, res: Response) => {
  try {
    const request: UpdateFarmerRequest = req.body
    const farmer = await farmerService.updateFarmer(req.params.farmerId, request)
    res.json({ success: true, data: farmer })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.put('/:farmerId/credit', async (req: Request, res: Response) => {
  try {
    const { creditLimit } = req.body
    const farmer = await farmerService.updateCreditLimit(req.params.farmerId, creditLimit)
    res.json({ success: true, data: farmer })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/:farmerId/credit', async (req: Request, res: Response) => {
  try {
    const creditInfo = await farmerService.getCreditInfo(req.params.farmerId)
    res.json({ success: true, data: creditInfo })
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message })
  }
})

router.delete('/:farmerId', async (req: Request, res: Response) => {
  try {
    await farmerService.deleteFarmer(req.params.farmerId)
    res.json({ success: true, message: '农户删除成功' })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export default router