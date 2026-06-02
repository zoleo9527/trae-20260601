import { Request, Response } from 'express';
import db from '../database';
import { CreateCheckInRequest } from '../types';
import {
  getStopSummary,
  getDriverSummary,
  getScheduleSummary,
  getRouteSummary,
  getVehicleSummary,
  getStudentSummary,
  calculateDelayMinutes,
  getCheckInStatus
} from '../utils';

export const getAllCheckIns = (req: Request, res: Response) => {
  try {
    const { schedule_id, driver_id, stop_id } = req.query;

    let query = 'SELECT * FROM check_ins WHERE 1=1';
    const params: any[] = [];

    if (schedule_id) {
      query += ' AND schedule_id = ?';
      params.push(schedule_id);
    }
    if (driver_id) {
      query += ' AND driver_id = ?';
      params.push(driver_id);
    }
    if (stop_id) {
      query += ' AND stop_id = ?';
      params.push(stop_id);
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params) as any[];

    const checkIns = rows.map(row => enrichCheckIn(row));

    res.json(checkIns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
};

export const getCheckInById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM check_ins WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Check-in not found' });
    }

    const checkIn = enrichCheckIn(row);
    res.json(checkIn);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch check-in' });
  }
};

export const createCheckIn = (req: Request, res: Response) => {
  try {
    const { schedule_id, stop_id, driver_id, actual_arrival_time, notes } = req.body as CreateCheckInRequest;

    const stop = db.prepare(`
      SELECT estimated_arrival_time FROM stops WHERE id = ?
    `).get(stop_id) as any;

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const schedule = db.prepare(`
      SELECT s.*, r.id as route_id, v.id as vehicle_id
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      JOIN vehicles v ON s.vehicle_id = v.id
      WHERE s.id = ?
    `).get(schedule_id) as any;

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const estimatedArrivalTime = `${schedule.schedule_date}T${stop.estimated_arrival_time}`;
    const delayMinutes = calculateDelayMinutes(actual_arrival_time, estimatedArrivalTime);
    const status = getCheckInStatus(delayMinutes);

    const result = db.prepare(`
      INSERT INTO check_ins (schedule_id, stop_id, driver_id, actual_arrival_time, estimated_arrival_time, status, delay_minutes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      schedule_id,
      stop_id,
      driver_id,
      actual_arrival_time,
      estimatedArrivalTime,
      status,
      delayMinutes,
      notes
    );

    const checkInId = result.lastInsertRowid as number;

    if (status === 'late' && delayMinutes > 5) {
      db.prepare(`
        INSERT INTO late_events (schedule_id, stop_id, check_in_id, delay_minutes, reason, status, reported_by)
        VALUES (?, ?, ?, ?, ?, 'pending', 'system')
      `).run(schedule_id, stop_id, checkInId, delayMinutes, notes || '自动检测到站晚点');
    }

    const checkIn = db.prepare(`
      SELECT * FROM check_ins WHERE id = ?
    `).get(checkInId) as any;

    const lateEvent = db.prepare(`
      SELECT * FROM late_events WHERE check_in_id = ?
    `).get(checkInId) as any;

    const pendingStudents = db.prepare(`
      SELECT rr.student_id
      FROM ride_records rr
      WHERE rr.schedule_id = ? AND rr.stop_id = ? AND rr.status = 'pending'
      ORDER BY rr.student_id
    `).all(schedule_id, stop_id) as any[];

    const studentSummaries = pendingStudents.map(ps => getStudentSummary(ps.student_id)).filter(Boolean);

    const response = {
      id: checkInId,
      message: 'Check-in created successfully',
      status,
      delay_minutes: delayMinutes,
      data: {
        ...checkIn,
        stop: getStopSummary(stop_id),
        driver: getDriverSummary(driver_id),
        schedule: getScheduleSummary(schedule_id),
        route: getRouteSummary(schedule.route_id),
        vehicle: getVehicleSummary(schedule.vehicle_id)
      },
      late_event: lateEvent ? {
        id: lateEvent.id,
        delay_minutes: lateEvent.delay_minutes,
        reason: lateEvent.reason,
        status: lateEvent.status
      } : null,
      pending_students: {
        count: studentSummaries.length,
        students: studentSummaries
      }
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create check-in' });
  }
};

export const updateCheckIn = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = db.prepare(`
      UPDATE check_ins
      SET notes = ?
      WHERE id = ?
    `).run(notes, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Check-in not found' });
    }

    res.json({ message: 'Check-in updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update check-in' });
  }
};

export const deleteCheckIn = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = db.prepare(`
      DELETE FROM check_ins WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Check-in not found' });
    }

    res.json({ message: 'Check-in deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete check-in' });
  }
};

function enrichCheckIn(row: any) {
  const schedule = db.prepare(`
    SELECT s.route_id, s.vehicle_id
    FROM schedules s
    WHERE s.id = ?
  `).get(row.schedule_id) as any;

  return {
    ...row,
    stop: getStopSummary(row.stop_id),
    driver: getDriverSummary(row.driver_id),
    schedule: getScheduleSummary(row.schedule_id),
    route: schedule ? getRouteSummary(schedule.route_id) : undefined,
    vehicle: schedule ? getVehicleSummary(schedule.vehicle_id) : undefined
  };
}
