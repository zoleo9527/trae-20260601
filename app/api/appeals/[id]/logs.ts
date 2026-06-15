import { NextApiRequest, NextApiResponse } from 'next';
import { getAuditLogsByAppealId } from '@/server/data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    const logs = getAuditLogsByAppealId(id as string);
    res.status(200).json({ success: true, data: logs });
  } else {
    res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
}