import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/data/database';
import type { Role, CustomerConfirmation } from '@/types/models';
import {
  canTransitionConfirmation,
  canTransitionOrder,
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
    const now = new Date();
    let hasExpired = false;

    order.confirmations.forEach((c) => {
      if (c.status === 'PENDING' && c.expiredAt && new Date(c.expiredAt) <= now) {
        c.status = 'EXPIRED';
        hasExpired = true;
        db.addAuditLog({
          orderId: order.id,
          actorRole: 'MANAGER',
          actorId: 'system',
          actorName: '系统',
          action: '确认记录自动过期',
          oldValue: { status: 'PENDING', expiredAt: c.expiredAt },
          newValue: { status: 'EXPIRED' },
          field: 'confirmation.status',
          timestamp: now.toISOString(),
          idempotencyKey: `expire-${c.id}-${now.getTime()}`,
        });
      }
    });

    if (hasExpired) {
      db.updateOrder(order.id, { confirmations: [...order.confirmations] });
    }

    const visibleRemarks = new Set<string>();
    order.confirmations.forEach((c) => {
      c.seenValuationRemarks.forEach((rid) => visibleRemarks.add(rid));
    });

    return res.status(200).json({
      success: true,
      data: {
        confirmations: order.confirmations,
        visibleRemarkIds: Array.from(visibleRemarks),
        currentValuation: order.currentValuationId
          ? order.valuations.find((v) => v.id === order.currentValuationId)
          : null,
      },
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

    const { action, ...payload } = req.body;
    const now = new Date().toISOString();

    if (action === 'initiate') {
      if (role !== 'RECEPTIONIST' && role !== 'MANAGER') {
        return res.status(403).json({
          success: false,
          error: '无权限发起客户确认',
        });
      }

      const currentValuation = order.valuations.find(
        (v) => v.id === order.currentValuationId
      );

      if (!currentValuation || currentValuation.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          error: '当前估价未审批通过，无法发起客户确认',
        });
      }

      const defaultExpiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const confirmation: CustomerConfirmation = {
        id: db.generateId(),
        orderId: order.id,
        valuationId: currentValuation.id,
        status: 'PENDING',
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerIdCard: order.customerIdCard,
        createdAt: now,
        confirmationMethod: payload.confirmationMethod || 'ON_SITE',
        expiredAt: payload.expiredAt || defaultExpiredAt,
        seenValuationRemarks: [],
      };

      let orderUpdates: any = {
        confirmations: [...order.confirmations, confirmation],
      };

      if (canTransitionOrder(order.status, 'PENDING_CONFIRMATION', role)) {
        orderUpdates.status = 'PENDING_CONFIRMATION';
      }

      const updatedOrder = db.updateOrder(order.id, orderUpdates);

      const visibleRemarkCount = currentValuation.remarks.filter(
        (r) => r.isVisibleToCustomer
      ).length;

      db.addAuditLog({
        orderId: order.id,
        actorRole: role,
        actorId: userId,
        actorName: userName,
        action: '发起客户确认',
        newValue: {
          confirmationId: confirmation.id,
          valuationId: currentValuation.id,
          price: currentValuation.estimatedPrice,
          visibleRemarkCount,
          seenRemarkCount: 0,
        },
        timestamp: now,
        idempotencyKey,
      });

      db.saveIdempotentRecord(
        idempotencyKey,
        'initiate_confirmation',
        confirmation,
        order.id
      );

      return res.status(201).json({
        success: true,
        data: {
          confirmation,
          visibleRemarks: currentValuation.remarks.filter(
            (r) => r.isVisibleToCustomer
          ),
        },
      });
    }

    if (action === 'confirm' || action === 'object') {
      if (role !== 'RECEPTIONIST' && role !== 'MANAGER') {
        return res.status(403).json({
          success: false,
          error: '无权限处理客户确认',
        });
      }

      const confirmationId = payload.confirmationId;
      const confirmation = order.confirmations.find(
        (c) => c.id === confirmationId
      );

      if (!confirmation) {
        return res.status(404).json({
          success: false,
          error: '确认记录不存在',
        });
      }

      if (confirmation.status === 'EXPIRED') {
        return res.status(400).json({
          success: false,
          error: '确认记录已过期，请重新发起客户确认',
        });
      }

      const targetStatus = action === 'confirm' ? 'CONFIRMED' : 'OBJECTED';

      if (!canTransitionConfirmation(confirmation.status, targetStatus, role)) {
        return res.status(403).json({
          success: false,
          error: `无权${action === 'confirm' ? '确认' : '记录异议'}`,
        });
      }

      confirmation.status = targetStatus;
      confirmation.confirmedAt = now;

      if (action === 'confirm') {
        confirmation.confirmedPrice = payload.confirmedPrice;
        confirmation.signature = payload.signature;
      } else {
        confirmation.objectionContent = payload.objectionContent;
        confirmation.objectionPhotos = payload.objectionPhotos || [];
      }

      const currentValuation = order.valuations.find(
        (v) => v.id === confirmation.valuationId
      );
      if (currentValuation) {
        const newlySeenRemarks = payload.seenRemarkIds || [];
        confirmation.seenValuationRemarks = Array.from(
          new Set([...confirmation.seenValuationRemarks, ...newlySeenRemarks])
        );
      }

      const updatedConfirmations = order.confirmations.map((c) =>
        c.id === confirmationId ? confirmation : c
      );

      let orderUpdates: any = { confirmations: updatedConfirmations };
      if (
        action === 'confirm' &&
        canTransitionOrder(order.status, 'CONFIRMED', role)
      ) {
        orderUpdates.status = 'CONFIRMED';
      } else if (
        action === 'object' &&
        canTransitionOrder(order.status, 'OBJECTED', role)
      ) {
        orderUpdates.status = 'OBJECTED';
      }

      const updatedOrder = db.updateOrder(order.id, orderUpdates);

      db.addAuditLog({
        orderId: order.id,
        actorRole: role,
        actorId: userId,
        actorName: userName,
        action:
          action === 'confirm' ? '客户确认接受估价' : '客户提出异议',
        oldValue: { status: 'PENDING' },
        newValue: {
          status: targetStatus,
          confirmationId,
          confirmedPrice: confirmation.confirmedPrice,
          objectionContent: confirmation.objectionContent,
        },
        field: 'confirmation.status',
        timestamp: now,
        idempotencyKey,
      });

      db.saveIdempotentRecord(
        idempotencyKey,
        action === 'confirm' ? 'confirm_price' : 'object_price',
        confirmation,
        order.id
      );

      return res.status(200).json({
        success: true,
        data: confirmation,
      });
    }

    if (action === 'mark_seen') {
      const confirmationId = payload.confirmationId;
      const confirmation = order.confirmations.find(
        (c) => c.id === confirmationId
      );

      if (!confirmation) {
        return res.status(404).json({
          success: false,
          error: '确认记录不存在',
        });
      }

      if (confirmation.status === 'EXPIRED') {
        return res.status(400).json({
          success: false,
          error: '确认记录已过期，无法标记查看',
        });
      }

      const remarkIds = payload.remarkIds || [];
      confirmation.seenValuationRemarks = Array.from(
        new Set([...confirmation.seenValuationRemarks, ...remarkIds])
      );

      const updatedConfirmations = order.confirmations.map((c) =>
        c.id === confirmationId ? confirmation : c
      );

      db.updateOrder(order.id, { confirmations: updatedConfirmations });

      db.addAuditLog({
        orderId: order.id,
        actorRole: role,
        actorId: userId,
        actorName: userName,
        action: '客户已查看备注',
        newValue: {
          confirmationId,
          seenRemarkIds: remarkIds,
        },
        field: 'confirmation.seenValuationRemarks',
        timestamp: now,
        idempotencyKey,
      });

      db.saveIdempotentRecord(
        idempotencyKey,
        'mark_remarks_seen',
        { seen: remarkIds },
        order.id
      );

      return res.status(200).json({
        success: true,
        data: { seen: remarkIds },
      });
    }

    return res.status(400).json({
      success: false,
      error: '不支持的操作类型',
    });
  }

  return res.status(405).json({ success: false, error: '不支持的方法' });
}
