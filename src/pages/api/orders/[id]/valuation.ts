import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/data/database';
import type { Role, Valuation, ValuationRemark } from '@/types/models';
import {
  canTransitionValuation,
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
    return res.status(200).json({
      success: true,
      data: {
        valuations: order.valuations.map((v) => ({
          ...v,
          remarks: v.remarks.filter((r) =>
            role === 'PROCESSOR' || role === 'MANAGER'
              ? true
              : r.isVisibleToCustomer
          ),
        })),
        currentValuationId: order.currentValuationId,
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

    if (role !== 'PROCESSOR' && role !== 'MANAGER') {
      return res.status(403).json({
        success: false,
        error: '无权限处理估价',
      });
    }

    const { action, ...payload } = req.body;
    const now = new Date().toISOString();

    if (action === 'create' || action === 'revaluate') {
      if (role !== 'PROCESSOR') {
        return res.status(403).json({
          success: false,
          error: '只有处理人员可以创建估价',
        });
      }

      const parentValuationId =
        action === 'revaluate' ? order.currentValuationId : undefined;
      const version =
        action === 'revaluate'
          ? (order.valuations.find((v) => v.id === parentValuationId)
              ?.version || 0) + 1
          : 1;

      const valuation: Valuation = {
        id: db.generateId(),
        orderId: order.id,
        processorId: userId,
        processorName: userName,
        status: 'DRAFT',
        estimatedPrice: payload.estimatedPrice || 0,
        minPrice: payload.minPrice || 0,
        maxPrice: payload.maxPrice || 0,
        inspectionItems: payload.inspectionItems || {
          screen: '',
          battery: '',
          appearance: '',
          function: '',
          waterproof: '',
          idLocked: false,
          networkLocked: false,
        },
        remarks: [],
        photos: payload.photos || [],
        createdAt: now,
        version,
        parentValuationId,
      };

      if (payload.remark) {
        const remark: ValuationRemark = {
          id: db.generateId(),
          content: payload.remark,
          authorRole: role,
          authorId: userId,
          authorName: userName,
          timestamp: now,
          isVisibleToCustomer: payload.isRemarkVisibleToCustomer !== false,
          isCritical: payload.isRemarkCritical || false,
        };
        valuation.remarks.push(remark);
      }

      const updatedOrder = db.updateOrder(order.id, {
        valuations: [...order.valuations, valuation],
        currentValuationId: valuation.id,
      });

      if (action === 'create') {
        if (canTransitionOrder(order.status, 'PENDING_VALUATION', role)) {
          db.updateOrder(order.id, { status: 'PENDING_VALUATION' });
        }
      } else if (action === 'revaluate') {
        if (canTransitionOrder(order.status, 'RE_VALUATED', role)) {
          db.updateOrder(order.id, { status: 'RE_VALUATED' });
        }
      }

      db.addAuditLog({
        orderId: order.id,
        actorRole: role,
        actorId: userId,
        actorName: userName,
        action:
          action === 'revaluate' ? '创建重新估价' : '创建估价草稿',
        newValue: {
          valuationId: valuation.id,
          estimatedPrice: valuation.estimatedPrice,
          version,
        },
        timestamp: now,
        idempotencyKey,
      });

      db.saveIdempotentRecord(
        idempotencyKey,
        action === 'revaluate' ? 'revaluate' : 'create_valuation',
        valuation,
        order.id
      );

      return res.status(201).json({
        success: true,
        data: valuation,
      });
    }

    if (action === 'submit') {
      const valuationId = payload.valuationId;
      const valuation = order.valuations.find((v) => v.id === valuationId);

      if (!valuation) {
        return res.status(404).json({
          success: false,
          error: '估价不存在',
        });
      }

      if (!canTransitionValuation(valuation.status, 'SUBMITTED', role)) {
        return res.status(403).json({
          success: false,
          error: '无权提交此估价',
        });
      }

      if (payload.estimatedPrice !== undefined) {
        valuation.estimatedPrice = payload.estimatedPrice;
      }
      if (payload.minPrice !== undefined) {
        valuation.minPrice = payload.minPrice;
      }
      if (payload.maxPrice !== undefined) {
        valuation.maxPrice = payload.maxPrice;
      }
      if (payload.inspectionItems) {
        valuation.inspectionItems = {
          ...valuation.inspectionItems,
          ...payload.inspectionItems,
        };
      }

      valuation.status = 'SUBMITTED';
      valuation.submittedAt = now;

      if (payload.remark) {
        const remark: ValuationRemark = {
          id: db.generateId(),
          content: payload.remark,
          authorRole: role,
          authorId: userId,
          authorName: userName,
          timestamp: now,
          isVisibleToCustomer: payload.isRemarkVisibleToCustomer !== false,
          isCritical: payload.isRemarkCritical || false,
        };
        valuation.remarks.push(remark);
      }

      const updatedValuations = order.valuations.map((v) =>
        v.id === valuationId ? valuation : v
      );

      let orderUpdates: any = { valuations: updatedValuations };
      if (canTransitionOrder(order.status, 'VALUATED', 'PROCESSOR')) {
        orderUpdates.status = 'VALUATED';
      }

      const updatedOrder = db.updateOrder(order.id, orderUpdates);

      db.addAuditLog({
        orderId: order.id,
        actorRole: role,
        actorId: userId,
        actorName: userName,
        action: '提交估价待审批',
        oldValue: { status: 'DRAFT' },
        newValue: {
          status: 'SUBMITTED',
          valuationId,
          estimatedPrice: valuation.estimatedPrice,
        },
        field: 'valuation.status',
        timestamp: now,
        idempotencyKey,
      });

      db.saveIdempotentRecord(
        idempotencyKey,
        'submit_valuation',
        valuation,
        order.id
      );

      return res.status(200).json({
        success: true,
        data: valuation,
      });
    }

    if (action === 'approve' || action === 'reject') {
      if (role !== 'MANAGER') {
        return res.status(403).json({
          success: false,
          error: '只有店长可以审批估价',
        });
      }

      const valuationId = payload.valuationId;
      const valuation = order.valuations.find((v) => v.id === valuationId);

      if (!valuation) {
        return res.status(404).json({
          success: false,
          error: '估价不存在',
        });
      }

      const targetStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

      if (!canTransitionValuation(valuation.status, targetStatus, role)) {
        return res.status(403).json({
          success: false,
          error: `无权${action === 'approve' ? '通过' : '拒绝'}此估价`,
        });
      }

      valuation.status = targetStatus;
      valuation.approvedAt = now;
      valuation.approvedBy = userName;

      if (payload.remark) {
        const remark: ValuationRemark = {
          id: db.generateId(),
          content: payload.remark,
          authorRole: role,
          authorId: userId,
          authorName: userName,
          timestamp: now,
          isVisibleToCustomer: payload.isRemarkVisibleToCustomer !== false,
          isCritical: payload.isRemarkCritical || false,
        };
        valuation.remarks.push(remark);
      }

      const updatedValuations = order.valuations.map((v) =>
        v.id === valuationId ? valuation : v
      );

      const updatedOrder = db.updateOrder(order.id, {
        valuations: updatedValuations,
      });

      db.addAuditLog({
        orderId: order.id,
        actorRole: role,
        actorId: userId,
        actorName: userName,
        action: `估价${action === 'approve' ? '审批通过' : '审批拒绝'}`,
        oldValue: { status: 'SUBMITTED' },
        newValue: { status: targetStatus, valuationId },
        field: 'valuation.status',
        timestamp: now,
        idempotencyKey,
      });

      db.saveIdempotentRecord(
        idempotencyKey,
        action === 'approve' ? 'approve_valuation' : 'reject_valuation',
        valuation,
        order.id
      );

      return res.status(200).json({
        success: true,
        data: valuation,
      });
    }

    if (action === 'add_remark') {
      const valuationId = payload.valuationId;
      const valuation = order.valuations.find((v) => v.id === valuationId);

      if (!valuation) {
        return res.status(404).json({
          success: false,
          error: '估价不存在',
        });
      }

      const remark: ValuationRemark = {
        id: db.generateId(),
        content: payload.content,
        authorRole: role,
        authorId: userId,
        authorName: userName,
        timestamp: now,
        isVisibleToCustomer: payload.isVisibleToCustomer !== false,
        isCritical: payload.isCritical || false,
      };

      valuation.remarks.push(remark);

      const updatedValuations = order.valuations.map((v) =>
        v.id === valuationId ? valuation : v
      );

      db.updateOrder(order.id, { valuations: updatedValuations });

      db.addAuditLog({
        orderId: order.id,
        actorRole: role,
        actorId: userId,
        actorName: userName,
        action: '添加估价备注',
        newValue: {
          valuationId,
          remarkId: remark.id,
          isVisibleToCustomer: remark.isVisibleToCustomer,
        },
        field: 'valuation.remarks',
        timestamp: now,
        idempotencyKey,
      });

      db.saveIdempotentRecord(
        idempotencyKey,
        'add_valuation_remark',
        remark,
        order.id
      );

      return res.status(200).json({
        success: true,
        data: remark,
      });
    }

    return res.status(400).json({
      success: false,
      error: '不支持的操作类型',
    });
  }

  return res.status(405).json({ success: false, error: '不支持的方法' });
}
