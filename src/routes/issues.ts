import { Router } from 'express';
import { IssueDetectionRepository } from '../repositories/index.js';

const router = Router();
const issueRepo = new IssueDetectionRepository();

router.get('/', async (req, res) => {
  try {
    const { unresolvedOnly } = req.query;
    const issues = issueRepo.findAll(unresolvedOnly === 'true');
    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: '获取问题列表失败' });
  }
});

router.get('/reservation/:reservationId', async (req, res) => {
  try {
    const { unresolvedOnly } = req.query;
    const issues = issueRepo.findByReservationId(
      req.params.reservationId,
      unresolvedOnly === 'true'
    );
    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: '获取问题列表失败' });
  }
});

router.post('/:id/resolve', async (req, res) => {
  try {
    const resolvedBy = req.headers['x-staff-id'] as string;
    if (!resolvedBy) {
      return res.status(401).json({ error: '缺少员工ID' });
    }

    issueRepo.resolve(req.params.id, resolvedBy);
    res.json({ success: true, message: '问题已标记为已解决' });
  } catch (error) {
    console.error('Error resolving issue:', error);
    res.status(500).json({ error: '解决，问题失败' });
  }
});

export default router;
