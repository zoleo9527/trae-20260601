import express, { type Request, type Response } from 'express';
import { getOrders, getOrderById, updateOrderSpec, updateBloomForecast } from '../services/orderService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status } = req.query;
    const orders = getOrders(status as string);
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
    });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const order = getOrderById(id);
    if (!order) {
      res.status(404).json({
        success: false,
        message: '订单不存在',
      });
      return;
    }
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
    });
  }
});

router.put('/:id/spec', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { spec, quantity, operator } = req.body;

    if (!spec) {
      res.status(400).json({
        success: false,
        message: '规格不能为空',
      });
      return;
    }

    const order = updateOrderSpec(id, spec, quantity, operator);
    if (!order) {
      res.status(404).json({
        success: false,
        message: '订单不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
      message: '规格更新成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新规格失败',
    });
  }
});

router.put('/:id/bloom', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { bloomForecast, operator } = req.body;

    if (!bloomForecast) {
      res.status(400).json({
        success: false,
        message: '花期预测不能为空',
      });
      return;
    }

    const order = updateBloomForecast(id, bloomForecast, operator);
    if (!order) {
      res.status(404).json({
        success: false,
        message: '订单不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
      message: '花期预测更新成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新花期预测失败',
    });
  }
});

export default router;
