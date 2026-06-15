import { NextApiRequest, NextApiResponse } from 'next';
import { getAppeals } from '@/server/data';
import { getErrorResponse } from '@/utils/errors';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const appeals = getAppeals();
      res.status(200).json({ success: true, data: appeals });
    } catch (error) {
      res.status(500).json(getErrorResponse('INTERNAL_ERROR'));
    }
  } else {
    res.status(405).json(getErrorResponse('METHOD_NOT_ALLOWED'));
  }
}