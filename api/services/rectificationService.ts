import { getDb } from '../db/database.js';
import { getInspectionById, updateInspectionStatus } from './inspectionService.js';
import { getUserById } from './userService.js';
import type { RectificationStats, ReviewRequest, InspectionStatus } from '../../shared/types.js';

export function getRectificationStats(): RectificationStats {
  const db = getDb();

  const totalRow = db.prepare('SELECT COUNT(*) as count FROM inspections').get() as { count: number };
  const pendingRow = db.prepare("SELECT COUNT(*) as count FROM inspections WHERE status = 'dispatched'").get() as { count: number };
  const inProgressRow = db.prepare("SELECT COUNT(*) as count FROM inspections WHERE status = 'in_progress'").get() as { count: number };
  const pendingReviewRow = db.prepare("SELECT COUNT(*) as count FROM inspections WHERE status = 'pending_review_after'").get() as { count: number };
  const completedRow = db.prepare("SELECT COUNT(*) as count FROM inspections WHERE status = 'passed'").get() as { count: number };

  const overdueRow = db.prepare(`
    SELECT COUNT(*) as count
    FROM inspections i
    JOIN dispatches d ON i.id = d.inspection_id
    WHERE i.status IN ('dispatched', 'in_progress')
      AND d.expected_completion_time IS NOT NULL
      AND d.expected_completion_time < datetime('now')
  `).get() as { count: number };

  return {
    total: totalRow.count,
    pending: pendingRow.count,
    inProgress: inProgressRow.count,
    pendingReview: pendingReviewRow.count,
    completed: completedRow.count,
    overdue: overdueRow.count
  };
}

export function submitReview(
  data: ReviewRequest,
  reviewerId: string
): void {
  const db = getDb();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const inspection = getInspectionById(data.inspectionId);
  if (!inspection) {
    throw new Error('Inspection not found');
  }

  const reviewer = getUserById(reviewerId);
  if (!reviewer) {
    throw new Error('Reviewer not found');
  }

  const tx = db.transaction(() => {
    const newStatus: InspectionStatus = data.result === 'pass'
      ? 'passed' as InspectionStatus
      : 'rejected' as InspectionStatus;

    db.prepare(`
      UPDATE inspections
      SET review_result = ?,
          review_remark = ?,
          review_time = ?,
          reviewer_id = ?,
          status = ?
      WHERE id = ?
    `).run(
      data.result,
      data.remark,
      now,
      reviewerId,
      newStatus,
      data.inspectionId
    );

    const statusLogId = `s${Date.now()}`;
    db.prepare(`
      INSERT INTO status_logs (id, inspection_id, from_status, to_status, operator_id, remark, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      statusLogId,
      data.inspectionId,
      inspection.status,
      newStatus,
      reviewerId,
      `复查${data.result === 'pass' ? '通过' : '不通过'}：${data.remark}`,
      now
    );

    const insertPhoto = db.prepare(`
      INSERT INTO photos (id, inspection_id, url, thumbnail_url, description, upload_time, uploader_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    data.photos.forEach((photo, index) => {
      const photoId = `p${Date.now()}_${index}`;
      insertPhoto.run(
        photoId,
        data.inspectionId,
        photo.url,
        photo.thumbnailUrl,
        photo.description || '',
        now,
        reviewerId
      );
    });

    if (data.result === 'fail') {
      const latestDispatch = db.prepare(`
        SELECT * FROM dispatches
        WHERE inspection_id = ?
        ORDER BY dispatch_time DESC
        LIMIT 1
      `).get(data.inspectionId) as any;

      if (latestDispatch) {
        const reDispatchId = `d${Date.now()}`;
        db.prepare(`
          INSERT INTO dispatches (
            id, inspection_id, dispatcher_id, receiver_id,
            dispatch_time, expected_completion_time, dispatch_remark
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          reDispatchId,
          data.inspectionId,
          reviewerId,
          latestDispatch.receiver_id,
          now,
          null,
          `复查不通过，重新派发：${data.remark}`
        );

        updateInspectionStatus(
          data.inspectionId,
          'dispatched' as InspectionStatus,
          reviewerId,
          `复查不通过，重新派发：${data.remark}`
        );
      }
    }
  });

  tx();
}
