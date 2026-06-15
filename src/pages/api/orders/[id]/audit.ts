import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/data/database';
import type { Role } from '@/types/models';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const role = req.headers['x-role'] as Role;

  const order = db.getOrder(String(id));

  if (!order) {
    return res.status(404).json({
      success: false,
      error: '回收单不存在',
    });
  }

  if (req.method === 'GET') {
    if (role !== 'MANAGER' && role !== 'PROCESSOR') {
      return res.status(403).json({
        success: false,
        error: '无权限查看审计日志',
      });
    }

    const logs = db.getAuditLogs(String(id));

    return res.status(200).json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        actorRole: log.actorRole,
        actorName: log.actorName,
        oldValue: log.oldValue,
        newValue: log.newValue,
        field: log.field,
        timestamp: log.timestamp,
        idempotencyKey: log.idempotencyKey,
      })),
    });
  }

  return res.status(405).json({ success: false, error: '不支持的方法' });
}
