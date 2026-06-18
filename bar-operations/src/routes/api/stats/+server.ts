import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async () => {
  try {
    const stats = {
      exhibits: db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal,
          SUM(CASE WHEN status = 'fault_pending' OR status = 'repairing' THEN 1 ELSE 0 END) as fault
        FROM exhibits
      `).get() as any,

      inspections: db.prepare(`
        SELECT COUNT(*) as today
        FROM inspections
        WHERE date(created_at) = date('now')
      `).get() as any,

      faults: db.prepare(`
        SELECT
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM fault_reports
      `).get() as any
    };

    const result = {
      totalExhibits: stats.exhibits.total || 0,
      normalExhibits: stats.exhibits.normal || 0,
      faultExhibits: stats.exhibits.fault || 0,
      todayInspections: stats.inspections.today || 0,
      pendingFaults: stats.faults.pending || 0,
      processingFaults: stats.faults.processing || 0,
      completedFaults: stats.faults.completed || 0
    };

    return json(result);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
};
