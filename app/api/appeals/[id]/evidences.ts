import { NextApiRequest, NextApiResponse } from 'next';
import { getEvidencesByAppealId } from '@/server/data';
import { getErrorResponse } from '@/utils/errors';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    try {
      if (!id) {
        res.status(400).json(getErrorResponse('APPEAL_NOT_FOUND', '缺少申诉ID'));
        return;
      }
      
      const evidences = getEvidencesByAppealId(id as string);
      res.status(200).json({ success: true, data: evidences });
    } catch (error) {
      res.status(500).json(getErrorResponse('INTERNAL_ERROR'));
    }
  } else {
    res.status(405).json(getErrorResponse('METHOD_NOT_ALLOWED'));
  }
}