import { NextApiRequest, NextApiResponse } from 'next';
import { getAppealById } from '@/server/data';
import { getErrorResponse } from '@/utils/errors';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    try {
      if (!id) {
        res.status(400).json(getErrorResponse('APPEAL_NOT_FOUND', '缺少申诉ID'));
        return;
      }
      
      const appeal = getAppealById(id as string);
      if (!appeal) {
        res.status(404).json(getErrorResponse('APPEAL_NOT_FOUND'));
        return;
      }
      res.status(200).json({ success: true, data: appeal });
    } catch (error) {
      res.status(500).json(getErrorResponse('INTERNAL_ERROR'));
    }
  } else {
    res.status(405).json(getErrorResponse('METHOD_NOT_ALLOWED'));
  }
}