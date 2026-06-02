import { Request, Response } from 'express';
import db from '../database';
import { CreateComplaintRequest, ReviewComplaintRequest } from '../types';
import {
  getStudentSummary,
  getScheduleSummary
} from '../utils';

export const getAllComplaints = (req: Request, res: Response) => {
  try {
    const { student_id, schedule_id, status, start_date, end_date } = req.query;

    let query = 'SELECT * FROM complaints WHERE 1=1';
    const params: any[] = [];

    if (student_id) {
      query += ' AND student_id = ?';
      params.push(student_id);
    }
    if (schedule_id) {
      query += ' AND schedule_id = ?';
      params.push(schedule_id);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (start_date) {
      query += ' AND date(complaint_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND date(complaint_time) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY complaint_time DESC';

    const rows = db.prepare(query).all(...params) as any[];

    const complaints = rows.map(row => enrichComplaint(row));

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

export const getComplaintById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM complaints WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = enrichComplaint(row, true);
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
};

export const createComplaint = (req: Request, res: Response) => {
  try {
    const {
      student_id, schedule_id, complaint_type, description, parent_name, parent_phone } = req.body as CreateComplaintRequest;

    const result = db.prepare(`
      INSERT INTO complaints (student_id, schedule_id, complaint_type, description, parent_name, parent_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(student_id, schedule_id, complaint_type, description, parent_name, parent_phone);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Complaint created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create complaint' });
  }
};

export const updateComplaint = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, handler_id, handler_notes } = req.body;

    const result = db.prepare(`
      UPDATE complaints
      SET status = ?, handler_id = ?, handler_notes = ?
      WHERE id = ?
    `).run(status || 'investigating', handler_id, handler_notes, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ message: 'Complaint updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint' });
  }
};

export const reviewComplaint = (req: Request, res: Response) => {
  try {
    const { complaint_id, status, review_result, reviewed_by } = req.body as ReviewComplaintRequest;

    const result = db.prepare(`
      UPDATE complaints
      SET status = ?, review_result = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `).run(status, review_result, reviewed_by, new Date().toISOString(), complaint_id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (status === 'rejected') {
      const complaint = db.prepare(`
        SELECT schedule_id FROM complaints WHERE id = ?
      `).get(complaint_id) as any;

      if (complaint && complaint.schedule_id) {
        const lateEvents = db.prepare(`
          SELECT id FROM late_events WHERE schedule_id = ? AND status = 'pending'
        `).all(complaint.schedule_id) as any[];

        for (const event of lateEvents) {
          db.prepare(`
            UPDATE late_events SET status = 'false_alarm' WHERE id = ?
          `).run(event.id);
        }
      }
    }

    res.json({ message: 'Complaint reviewed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to review complaint' });
  }
};

function enrichComplaint(row: any, includeEvidence = false) {
  const complaint: any = {
    ...row,
    student: getStudentSummary(row.student_id),
    schedule: row.schedule_id ? getScheduleSummary(row.schedule_id) : undefined
  };

  if (includeEvidence) {
    complaint.evidence = getComplaintEvidence(row);
  }

  return complaint;
}

function getComplaintEvidence(complaint: any) {
  if (!complaint.schedule_id) return null;

  const schedule = db.prepare(`
    SELECT s.*, r.name as route_name, v.plate_number, d.name as driver_name
    FROM schedules s
    JOIN routes r ON s.route_id = r.id
    JOIN vehicles v ON s.vehicle_id = v.id
    JOIN drivers d ON s.driver_id = d.id
    WHERE s.id = ?
  `).get(complaint.schedule_id) as any;

  if (schedule) {
      schedule.check_ins = db.prepare(`
      SELECT ci.*, st.name as stop_name, st.estimated_arrival_time
      FROM check_ins ci
      JOIN stops st ON ci.stop_id = st.id
      WHERE ci.schedule_id = ?
      ORDER BY ci.created_at
    `).all(complaint.schedule_id);
  }

  const studentRide = db.prepare(`
    SELECT rr.*, st.name as stop_name
    FROM ride_records rr
    JOIN stops st ON rr.stop_id = st.id
    WHERE rr.schedule_id = ? AND rr.student_id = ?
  `).get(complaint.schedule_id, complaint.student_id);

  const lateEvents = db.prepare(`
    SELECT * FROM late_events WHERE schedule_id = ?
  `).all(complaint.schedule_id);

  return {
    schedule,
    student_ride: studentRide,
    late_events: lateEvents
  };
}
