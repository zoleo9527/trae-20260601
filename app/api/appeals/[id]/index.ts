import { NextApiRequest, NextApiResponse } from 'next';
import { getAppealById } from '@/server/data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    const appeal = getAppealById(id as string);
    if (!appeal) {
      res.status(404).json({ success: false, error: { code: 'APPEAL_001', message: '申诉不存在' } });
      return;
    }
    res.status(200).json({ success: true, data: appeal });
  } else {
    res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
}