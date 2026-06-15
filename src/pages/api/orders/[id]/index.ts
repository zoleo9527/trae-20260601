import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/data/database';
import type { Role, RecyclingOrderStatus } from '@/types/models';
import {
  canTransitionOrder,
  STATUS_LABELS,
} from '@/types/stateMachine';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  const role = req.headers['x-role'] as Role;
  const userId = req.headers['x-user-id'] as string;
  const userName = req.headers['x-user-name'] as string;

  const order = db.getOrder(String(id));

  if (!order) {
    return res.status(404).json({
      success: false,
      error: '回收单不存在',
    });
  }

  if (req.method === 'GET') {
    const filteredOrder = {
      ...order,
      valuations: order.valuations.map((v) => ({
        ...v,
        remarks: v.remarks.filter((r) =>
          role === 'PROCESSOR' || role === 'MANAGER'
            ? true
            : r.isVisibleToCustomer
        ),
      })),
    };

    return res.status(200).json({
      success: true,
      data: filteredOrder,
    });
  }

  if (req.method === 'PATCH') {
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

    const { status, cancelReason, tags } = req.body;
    const now = new Date().toISOString();
    const updates: any = {};

    if (status && status !== order.status) {
      if (!canTransitionOrder(order.status, status as RecyclingOrderStatus, role)) {
        return res.status(403).json({
          success: false,
          error: `无权将状态从 ${STATUS_LABELS[order.status]} 变更为 ${STATUS_LABELS[status as RecyclingOrderStatus]}`,
        });
      }

      updates.status = status;

      if (status === 'COMPLETED') {
        updates.completedAt = now;
        const currentValuation = order.valuations.find(
          (v) => v.id === order.currentValuationId
        );
        if (currentValuation) {
          updates.finalPrice = currentValuation.estimatedPrice;
        }
      }

      if (status === 'CANCELLED') {
        updates.cancelledAt = now;
        if (cancelReason) {
          updates.cancelReason = cancelReason;
        }
      }

      db.addAuditLog({
        orderId: order.id,
        actorRole: role,
        actorId: userId,
        actorName: userName,
        action: `状态变更: ${STATUS_LABELS[order.status]} → ${STATUS_LABELS[status as RecyclingOrderStatus]}`,
        oldValue: { status: order.status },
        newValue: { status },
        field: 'order.status',
        timestamp: now,
        idempotencyKey,
      });
    }

    if (tags !== undefined) {
      updates.tags = tags;
      db.addAuditLog({
        orderId: order.id,
        actorRole: role,
        actorId: userId,
        actorName: userName,
        action: '更新标签',
        oldValue: { tags: order.tags },
        newValue: { tags },
        field: 'order.tags',
        timestamp: now,
        idempotencyKey,
      });
    }

    const updated = db.updateOrder(order.id, updates);

    db.saveIdempotentRecord(idempotencyKey, 'update_order', updated, order.id);

    return res.status(200).json({
      success: true,
      data: updated,
    });
  }

  return res.status(405).json({ success: false, error: '不支持的方法' });
}
