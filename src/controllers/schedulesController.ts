import { Request, Response } from 'express';
import db from '../database';
import { CreateScheduleRequest } from '../types';
import {
  getRouteSummary,
  getVehicleSummary,
  getDriverSummary,
  getStopSummary,
  getStudentSummary
} from '../utils';

export const getAllSchedules = (req: Request, res: Response) => {
  try {
    const { route_id, schedule_date, shift_type } = req.query;

    let query = 'SELECT * FROM schedules WHERE 1=1';
    const params: any[] = [];

    if (route_id) {
      query += ' AND route_id = ?';
      params.push(route_id);
    }
    if (schedule_date) {
      query += ' AND schedule_date = ?';
      params.push(schedule_date);
    }
    if (shift_type) {
      query += ' AND shift_type = ?';
      params.push(shift_type);
    }

    query += ' ORDER BY schedule_date DESC, shift_type';

    const rows = db.prepare(query).all(...params) as any[];

    const schedules = rows.map(row => enrichSchedule(row));

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

export const getScheduleById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM schedules WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedule = enrichSchedule(row, true);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};

export const createSchedule = (req: Request, res: Response) => {
  try {
    const { route_id, vehicle_id, driver_id, schedule_date, shift_type, notes } = req.body as CreateScheduleRequest;

    const result = db.prepare(`
      INSERT INTO schedules (route_id, vehicle_id, driver_id, schedule_date, shift_type, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(route_id, vehicle_id, driver_id, schedule_date, shift_type, notes);

    const scheduleId = result.lastInsertRowid as number;

    const students = db.prepare(`
      SELECT id, default_stop_id FROM students WHERE default_route_id = ?
    `).all(route_id) as any[];

    if (students.length > 0) {
      const insertRideRecord = db.prepare(`
        INSERT INTO ride_records (schedule_id, student_id, stop_id, status)
        VALUES (?, ?, ?, 'pending')
      `);

      const transaction = db.transaction((students: any[]) => {
        for (const student of students) {
          if (student.default_stop_id) {
            insertRideRecord.run(scheduleId, student.id, student.default_stop_id);
          }
        }
      });

      transaction(students);
    }

    const schedule = db.prepare(`
      SELECT * FROM schedules WHERE id = ?
    `).get(scheduleId) as any;

    const rideRecords = db.prepare(`
      SELECT rr.*, s.name as student_name, s.student_id, st.name as stop_name
      FROM ride_records rr
      JOIN students s ON rr.student_id = s.id
      JOIN stops st ON rr.stop_id = st.id
      WHERE rr.schedule_id = ?
      ORDER BY st.sequence, s.name
    `).all(scheduleId) as any[];

    const response = {
      id: scheduleId,
      message: 'Schedule created successfully',
      data: enrichSchedule(schedule, true),
      ride_records_summary: {
        total: rideRecords.length,
        students: rideRecords.map(r => ({
          id: r.student_id,
          name: r.student_name,
          student_id: r.student_id,
          stop_name: r.stop_name,
          status: r.status
        }))
      }
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

export const updateSchedule = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = db.prepare(`
      UPDATE schedules
      SET status = ?, notes = ?
      WHERE id = ?
    `).run(status, notes, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

export const deleteSchedule = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = db.prepare(`
      DELETE FROM schedules WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

function enrichSchedule(row: any, includeDetails = false) {
  const schedule: any = {
    ...row,
    route: getRouteSummary(row.route_id),
    vehicle: getVehicleSummary(row.vehicle_id),
    driver: getDriverSummary(row.driver_id)
  };

  if (includeDetails) {
    schedule.check_ins = getCheckInsByScheduleId(row.id);
    schedule.ride_records = getRideRecordsByScheduleId(row.id);
  }

  return schedule;
}

function getCheckInsByScheduleId(scheduleId: number) {
  const rows = db.prepare(`
    SELECT * FROM check_ins WHERE schedule_id = ? ORDER BY created_at
  `).all(scheduleId) as any[];

  return rows.map(row => ({
    ...row,
    stop: getStopSummary(row.stop_id),
    driver: getDriverSummary(row.driver_id)
  }));
}

function getRideRecordsByScheduleId(scheduleId: number) {
  const rows = db.prepare(`
    SELECT * FROM ride_records WHERE schedule_id = ? ORDER BY created_at
  `).all(scheduleId) as any[];

  return rows.map(row => ({
    ...row,
    student: getStudentSummary(row.student_id),
    stop: getStopSummary(row.stop_id)
  }));
}
