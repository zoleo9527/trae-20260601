import { NextApiRequest, NextApiResponse } from 'next';
import { getSummary } from '@/server/data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const summary = getSummary();
    res.status(200).json({ success: true, data: summary });
  } else {
    res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
}