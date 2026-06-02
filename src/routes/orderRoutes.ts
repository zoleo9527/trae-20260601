import { Router } from 'express';
import { orderService } from '../services/orderService.js';
import { z } from 'zod';

const router = Router();

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
});

const createOrderSchema = z.object({
  groupPointId: z.string(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(11),
  items: z.array(orderItemSchema).min(1),
});

const fulfillOrderItemSchema = z.object({
  orderItemId: z.string(),
  actualQuantity: z.number().int().min(0),
  actualSubtotal: z.number().int().min(0),
});

const fulfillOrderSchema = z.object({
  items: z.array(fulfillOrderItemSchema).min(1),
});

// 创建订单
router.post('/orders', async (req, res) => {
  try {
    const dto = createOrderSchema.parse(req.body);
    const result = await orderService.createOrder(dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 获取订单列表
router.get('/orders', async (req, res) => {
  const { groupPointId, status } = req.query;
  const result = await orderService.listOrders(
    groupPointId as string | undefined,
    status as any,
  );
  res.json({ success: true, data: result });
});

// 获取单个订单
router.get('/orders/:id', async (req, res) => {
  const result = await orderService.getOrder(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, error: '订单不存在' });
    return;
  }
  res.json({ success: true, data: result });
});

// 履约订单
router.post('/orders/:id/fulfill', async (req, res) => {
  try {
    const dto = fulfillOrderSchema.parse(req.body);
    const result = await orderService.fulfillOrder(req.params.id, dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 完成订单
router.post('/orders/:id/complete', async (req, res) => {
  try {
    const result = await orderService.completeOrder(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 取消订单
router.post('/orders/:id/cancel', async (req, res) => {
  try {
    const result = await orderService.cancelOrder(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

export default router;
