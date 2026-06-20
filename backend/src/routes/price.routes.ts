import { Router, Request, Response } from 'express';
import * as priceService from '../services/price.service';
import { ApiResponse, MaterialType, GradeLevel } from '../types';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const { material_type, grade_level, unit_price } = req.body;
    const price = priceService.addPrice(material_type, grade_level, unit_price);
    res.json({ success: true, data: price, message: '价格添加成功' } as ApiResponse<typeof price>);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message } as ApiResponse<null>);
  }
});

router.get('/', (req: Request, res: Response) => {
  const prices = priceService.getAllPrices();
  res.json({ success: true, data: prices } as ApiResponse<typeof prices>);
});

router.get('/active', (req: Request, res: Response) => {
  const prices = priceService.getActivePrices();
  res.json({ success: true, data: prices } as ApiResponse<typeof prices>);
});

router.get('/matrix', (req: Request, res: Response) => {
  const matrix = priceService.getPriceMatrix();
  res.json({ success: true, data: matrix } as ApiResponse<typeof matrix>);
});

router.get('/:materialType/:gradeLevel', (req: Request, res: Response) => {
  const price = priceService.getCurrentPrice(
    req.params.materialType as MaterialType,
    req.params.gradeLevel as GradeLevel
  );
  if (price === undefined) {
    return res.status(404).json({ success: false, error: '未找到对应价格' } as ApiResponse<null>);
  }
  res.json({ success: true, data: { unit_price: price } } as ApiResponse<{ unit_price: number }>);
});

export default router;
