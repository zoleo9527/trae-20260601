import { NextApiRequest, NextApiResponse } from 'next';
import { getAppeals } from '@/server/data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const appeals = getAppeals();
    res.status(200).json({ success: true, data: appeals });
  } else {
    res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
}