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

    const complaintId = result.lastInsertRowid as number;

    const complaint = db.prepare(`
      SELECT * FROM complaints WHERE id = ?
    `).get(complaintId) as any;

    const student = db.prepare(`
      SELECT * FROM students WHERE id = ?
    `).get(student_id) as any;

    let scheduleInfo = null;
    let relatedCheckIns = [];
    let studentRideRecord = null;
    let relatedLateEvents = [];

    if (schedule_id) {
      const schedule = db.prepare(`
        SELECT s.*, r.name as route_name, v.plate_number, v.model as vehicle_model, d.name as driver_name, d.phone as driver_phone
        FROM schedules s
        JOIN routes r ON s.route_id = r.id
        JOIN vehicles v ON s.vehicle_id = v.id
        JOIN drivers d ON s.driver_id = d.id
        WHERE s.id = ?
      `).get(schedule_id) as any;

      if (schedule) {
        scheduleInfo = {
          id: schedule.id,
          schedule_date: schedule.schedule_date,
          shift_type: schedule.shift_type,
          status: schedule.status,
          route: {
            id: schedule.route_id,
            name: schedule.route_name
          },
          vehicle: {
            id: schedule.vehicle_id,
            plate_number: schedule.plate_number,
            model: schedule.vehicle_model
          },
          driver: {
            id: schedule.driver_id,
            name: schedule.driver_name,
            phone: schedule.driver_phone
          }
        };

        relatedCheckIns = db.prepare(`
          SELECT ci.*, st.name as stop_name, st.sequence
          FROM check_ins ci
          JOIN stops st ON ci.stop_id = st.id
          WHERE ci.schedule_id = ?
          ORDER BY st.sequence
        `).all(schedule_id) as any[];

        studentRideRecord = db.prepare(`
          SELECT rr.*, st.name as stop_name
          FROM ride_records rr
          JOIN stops st ON rr.stop_id = st.id
          WHERE rr.schedule_id = ? AND rr.student_id = ?
        `).get(schedule_id, student_id) as any;

        relatedLateEvents = db.prepare(`
          SELECT * FROM late_events WHERE schedule_id = ?
        `).all(schedule_id) as any[];
      }
    }

    const similarComplaints = db.prepare(`
      SELECT c.*, s.name as student_name
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      WHERE c.schedule_id = ? AND c.id != ?
      ORDER BY c.complaint_time DESC
    `).all(schedule_id, complaintId) as any[];

    const response = {
      id: complaintId,
      message: 'Complaint created successfully',
      data: {
        ...complaint,
        student: {
          id: student.id,
          name: student.name,
          student_id: student.student_id,
          grade: student.grade,
          class: student.class,
          parent_name: student.parent_name,
          parent_phone: student.parent_phone
        },
        schedule: scheduleInfo
      },
      evidence_preview: {
        has_schedule: !!scheduleInfo,
        has_check_ins: relatedCheckIns.length,
        has_ride_record: !!studentRideRecord,
        has_late_events: relatedLateEvents.length,
        related_check_ins: relatedCheckIns.slice(0, 3).map(ci => ({
          id: ci.id,
          stop_name: ci.stop_name,
          actual_arrival_time: ci.actual_arrival_time,
          status: ci.status,
          delay_minutes: ci.delay_minutes
        })),
        student_ride_record: studentRideRecord ? {
          id: studentRideRecord.id,
          stop_name: studentRideRecord.stop_name,
          status: studentRideRecord.status,
          board_time: studentRideRecord.board_time
        } : null,
        related_late_events: relatedLateEvents.slice(0, 2).map(le => ({
          id: le.id,
          delay_minutes: le.delay_minutes,
          reason: le.reason,
          status: le.status
        }))
      },
      similar_complaints: {
        count: similarComplaints.length,
        complaints: similarComplaints.slice(0, 3).map(sc => ({
          id: sc.id,
          student_name: sc.student_name,
          complaint_type: sc.complaint_type,
          status: sc.status
        }))
      }
    };

    res.status(201).json(response);
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

    const complaint = db.prepare(`
      SELECT * FROM complaints WHERE id = ?
    `).get(complaint_id) as any;

    const student = db.prepare(`
      SELECT id, name, student_id, grade, class, parent_name, parent_phone
      FROM students WHERE id = ?
    `).get(complaint.student_id) as any;

    let scheduleInfo = null;
    if (complaint.schedule_id) {
      const schedule = db.prepare(`
        SELECT s.*, r.name as route_name, v.plate_number, d.name as driver_name
        FROM schedules s
        JOIN routes r ON s.route_id = r.id
        JOIN vehicles v ON s.vehicle_id = v.id
        JOIN drivers d ON s.driver_id = d.id
        WHERE s.id = ?
      `).get(complaint.schedule_id) as any;

      if (schedule) {
        scheduleInfo = {
          id: schedule.id,
          schedule_date: schedule.schedule_date,
          shift_type: schedule.shift_type,
          route_name: schedule.route_name,
          plate_number: schedule.plate_number,
          driver_name: schedule.driver_name
        };
      }
    }

    const response = {
      message: 'Complaint reviewed successfully',
      data: {
        ...complaint,
        student,
        schedule: scheduleInfo
      }
    };

    res.json(response);
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
