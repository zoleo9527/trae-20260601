import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/data/database';
import type { RecyclingOrder, Role } from '@/types/models';
import { canTransitionOrder } from '@/types/stateMachine';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  const role = req.headers['x-role'] as Role;
  const userId = req.headers['x-user-id'] as string;
  const userName = req.headers['x-user-name'] as string;

  if (req.method === 'GET') {
    const { status, urgency } = req.query;
    const statusFilter = status ? String(status).split(',') : undefined;

    const orders = db.listOrders({
      status: statusFilter,
      role,
      urgency: urgency ? String(urgency) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: orders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        status: o.status,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        device: {
          category: o.device.category,
          brand: o.device.brand,
          model: o.device.model,
          condition: o.device.condition,
        },
        urgency: o.urgency,
        source: o.source,
        currentValuationId: o.currentValuationId,
        currentPrice: o.valuations.find((v) => v.id === o.currentValuationId)
          ?.estimatedPrice,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        tags: o.tags,
      })),
    });
  }

  if (req.method === 'POST') {
    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        error: '缺少幂等键 X-Idempotency-Key',
      });
    }

    const existing = db.checkIdempotency(idempotencyKey);
    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing.response,
        idempotent: true,
      });
    }

    if (!role || !userId || !userName) {
      return res.status(400).json({
        success: false,
        error: '缺少角色或用户信息头',
      });
    }

    if (role !== 'RECEPTIONIST' && role !== 'MANAGER') {
      return res.status(403).json({
        success: false,
        error: '无权限创建回收单',
      });
    }

    const { customerName, customerPhone, customerIdCard, device, source, urgency } =
      req.body;

    if (!customerName || !customerPhone || !device) {
      return res.status(400).json({
        success: false,
        error: '缺少必要字段',
      });
    }

    const now = new Date().toISOString();
    const order: RecyclingOrder = {
      id: db.generateId(),
      orderNo: db.generateOrderNoPublic(),
      status: 'DRAFT',
      receptionistId: userId,
      receptionistName: userName,
      customerName,
      customerPhone,
      customerIdCard,
      device: {
        ...device,
        id: db.generateId(),
        defects: device.defects || [],
        accessories: device.accessories || [],
      },
      source: source || 'WALK_IN',
      urgency: urgency || 'NORMAL',
      createdAt: now,
      updatedAt: now,
      valuations: [],
      confirmations: [],
      tags: [],
    };

    db.addOrder(order);

    db.addAuditLog({
      orderId: order.id,
      actorRole: role,
      actorId: userId,
      actorName: userName,
      action: '创建回收单',
      newValue: {
        orderNo: order.orderNo,
        customerName,
        device: `${device.brand} ${device.model}`,
      },
      timestamp: now,
      idempotencyKey,
    });

    db.saveIdempotentRecord(idempotencyKey, 'create_order', order, order.id);

    return res.status(201).json({
      success: true,
      data: order,
    });
  }

  return res.status(405).json({ success: false, error: '不支持的方法' });
}
