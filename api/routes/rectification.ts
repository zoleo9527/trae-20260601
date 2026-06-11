import { Router } from 'express';
import type { Request, Response } from 'express';
import { getRectificationStats, submitReview } from '../services/rectificationService.js';
import { getPendingReviewInspections } from '../services/inspectionService.js';
import type { ReviewRequest } from '../../shared/types.js';

const router = Router();

router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = getRectificationStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting rectification stats:', error);
    res.status(500).json({ error: 'Failed to get rectification stats' });
  }
});

router.get('/reviews/pending', (req: Request, res: Response) => {
  try {
    const inspections = getPendingReviewInspections();
    res.json(inspections);
  } catch (error) {
    console.error('Error getting pending review inspections:', error);
    res.status(500).json({ error: 'Failed to get pending review inspections' });
  }
});

router.post('/reviews', (req: Request, res: Response) => {
  try {
    const data = req.body as ReviewRequest;
    const reviewerId = req.header('X-User-Id') || 'u001';

    submitReview(data, reviewerId);
    res.status(200).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;
