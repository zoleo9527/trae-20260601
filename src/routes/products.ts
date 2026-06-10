import { Router, type Request, type Response } from 'express'
import { ProductService, CreateProductRequest, UpdateProductRequest } from '../services/ProductService'

const router = Router()
const productService = new ProductService()

router.post('/', async (req: Request, res: Response) => {
  try {
    const request: CreateProductRequest = req.body
    const product = await productService.createProduct(request)
    res.status(201).json({ success: true, data: product })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as 'pesticide' | 'seed' | 'fertilizer' | undefined
    let products
    if (type) {
      products = await productService.getProductsByType(type)
    } else {
      products = await productService.getAllProducts()
    }
    res.json({ success: true, data: products })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/seeds', async (req: Request, res: Response) => {
  try {
    const seeds = await productService.getSeeds()
    res.json({ success: true, data: seeds })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/pesticides', async (req: Request, res: Response) => {
  try {
    const pesticides = await productService.getPesticides()
    res.json({ success: true, data: pesticides })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/restricted', async (req: Request, res: Response) => {
  try {
    const products = await productService.getRestrictedProducts()
    res.json({ success: true, data: products })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/alerts/low-stock', async (req: Request, res: Response) => {
  try {
    const alerts = await productService.getLowStockAlerts()
    res.json({ success: true, data: alerts })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/seasonal/:cropType', async (req: Request, res: Response) => {
  try {
    const suggestions = await productService.getSeasonalStockSuggestion(req.params.cropType)
    res.json({ success: true, data: suggestions })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductById(req.params.productId)
    res.json({ success: true, data: product })
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message })
  }
})

router.put('/:productId', async (req: Request, res: Response) => {
  try {
    const request: UpdateProductRequest = req.body
    const product = await productService.updateProduct(req.params.productId, request)
    res.json({ success: true, data: product })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.put('/:productId/stock', async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body
    const product = await productService.updateStock(req.params.productId, quantity)
    res.json({ success: true, data: product })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.delete('/:productId', async (req: Request, res: Response) => {
  try {
    await productService.deleteProduct(req.params.productId)
    res.json({ success: true, message: '商品删除成功' })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export default router