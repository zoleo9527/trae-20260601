import { NextApiRequest, NextApiResponse } from 'next';
import { getEvidencesByAppealId } from '@/server/data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    const evidences = getEvidencesByAppealId(id as string);
    res.status(200).json({ success: true, data: evidences });
  } else {
    res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
}