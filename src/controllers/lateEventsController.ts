import { Request, Response } from 'express';
import db from '../database';
import {
  getScheduleSummary,
  getStopSummary
} from '../utils';

export const getAllLateEvents = (req: Request, res: Response) => {
  try {
    const { schedule_id, status, start_date, end_date } = req.query;

    let query = 'SELECT * FROM late_events WHERE 1=1';
    const params: any[] = [];

    if (schedule_id) {
      query += ' AND schedule_id = ?';
      params.push(schedule_id);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (start_date) {
      query += ' AND date(detected_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND date(detected_time) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY detected_time DESC';

    const rows = db.prepare(query).all(...params) as any[];

    const lateEvents = rows.map(row => enrichLateEvent(row));

    res.json(lateEvents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch late events' });
  }
};

export const getLateEventById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM late_events WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Late event not found' });
    }

    const lateEvent = enrichLateEvent(row);
    res.json(lateEvent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch late event' });
  }
};

export const createLateEvent = (req: Request, res: Response) => {
  try {
    const { schedule_id, stop_id, check_in_id, delay_minutes, reason, reported_by } = req.body;

    const result = db.prepare(`
      INSERT INTO late_events (schedule_id, stop_id, check_in_id, delay_minutes, reason, status, reported_by)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(schedule_id, stop_id, check_in_id, delay_minutes, reason, reported_by || 'manual');

    res.status(201).json({ id: result.lastInsertRowid, message: 'Late event created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create late event' });
  }
};

export const updateLateEvent = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const result = db.prepare(`
      UPDATE late_events
      SET status = ?, reason = ?
      WHERE id = ?
    `).run(status, reason, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Late event not found' });
    }

    res.json({ message: 'Late event updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update late event' });
  }
};

function enrichLateEvent(row: any) {
  return {
    ...row,
    schedule: getScheduleSummary(row.schedule_id),
    stop: row.stop_id ? getStopSummary(row.stop_id) : undefined
  };
}
