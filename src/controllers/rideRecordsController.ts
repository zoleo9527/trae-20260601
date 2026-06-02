import { Request, Response } from 'express';
import db from '../database';
import { UpdateRideRecordRequest } from '../types';
import {
  getStudentSummary,
  getStopSummary,
  getScheduleSummary
} from '../utils';

export const getAllRideRecords = (req: Request, res: Response) => {
  try {
    const { schedule_id, student_id, status } = req.query;

    let query = 'SELECT * FROM ride_records WHERE 1=1';
    const params: any[] = [];

    if (schedule_id) {
      query += ' AND schedule_id = ?';
      params.push(schedule_id);
    }
    if (student_id) {
      query += ' AND student_id = ?';
      params.push(student_id);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params) as any[];

    const rideRecords = rows.map(row => enrichRideRecord(row));

    res.json(rideRecords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ride records' });
  }
};

export const getRideRecordById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM ride_records WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Ride record not found' });
    }

    const rideRecord = enrichRideRecord(row);
    res.json(rideRecord);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ride record' });
  }
};

export const updateRideRecord = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, board_time, notes, check_in_id } = req.body as UpdateRideRecordRequest & { check_in_id?: number };

    const result = db.prepare(`
      UPDATE ride_records
      SET status = ?, board_time = ?, notes = ?, check_in_id = ?
      WHERE id = ?
    `).run(status, board_time, notes, check_in_id, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ride record not found' });
    }

    res.json({ message: 'Ride record updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ride record' });
  }
};

export const bulkUpdateRideRecords = (req: Request, res: Response) => {
  try {
    const { schedule_id, check_in_id, updates } = req.body;

    const transaction = db.transaction((updates: any[]) => {
      const updateStmt = db.prepare(`
        UPDATE ride_records
        SET status = ?, board_time = ?, check_in_id = ?
        WHERE schedule_id = ? AND student_id = ?
      `);

      for (const update of updates) {
        updateStmt.run(
          update.status,
          update.board_time || new Date().toISOString(),
          check_in_id,
          schedule_id,
          update.student_id
        );
      }
    });

    transaction(updates);

    res.json({ message: 'Ride records updated successfully', count: updates.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ride records' });
  }
};

function enrichRideRecord(row: any) {
  return {
    ...row,
    student: getStudentSummary(row.student_id),
    stop: getStopSummary(row.stop_id),
    schedule: getScheduleSummary(row.schedule_id)
  };
}
