import db from './database';
import {
  RouteSummary,
  StopSummary,
  VehicleSummary,
  DriverSummary,
  StudentSummary,
  ScheduleSummary
} from './types';

export function getRouteSummary(routeId: number): RouteSummary | undefined {
  const row = db.prepare(`
    SELECT id, name, direction
    FROM routes
    WHERE id = ?
  `).get(routeId) as any;

  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    direction: row.direction
  };
}

export function getStopSummary(stopId: number): StopSummary | undefined {
  const row = db.prepare(`
    SELECT id, name, estimated_arrival_time
    FROM stops
    WHERE id = ?
  `).get(stopId) as any;

  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    estimated_arrival_time: row.estimated_arrival_time
  };
}

export function getVehicleSummary(vehicleId: number): VehicleSummary | undefined {
  const row = db.prepare(`
    SELECT id, plate_number, model
    FROM vehicles
    WHERE id = ?
  `).get(vehicleId) as any;

  if (!row) return undefined;
  return {
    id: row.id,
    plate_number: row.plate_number,
    model: row.model
  };
}

export function getDriverSummary(driverId: number): DriverSummary | undefined {
  const row = db.prepare(`
    SELECT id, name, phone
    FROM drivers
    WHERE id = ?
  `).get(driverId) as any;

  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone
  };
}

export function getStudentSummary(studentId: number): StudentSummary | undefined {
  const row = db.prepare(`
    SELECT id, name, student_id, grade, class, parent_name, parent_phone
    FROM students
    WHERE id = ?
  `).get(studentId) as any;

  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    student_id: row.student_id,
    grade: row.grade,
    class: row.class,
    parent_name: row.parent_name,
    parent_phone: row.parent_phone
  };
}

export function getScheduleSummary(scheduleId: number): ScheduleSummary | undefined {
  const row = db.prepare(`
    SELECT s.id, s.schedule_date, s.shift_type, r.name as route_name
    FROM schedules s
    JOIN routes r ON s.route_id = r.id
    WHERE s.id = ?
  `).get(scheduleId) as any;

  if (!row) return undefined;
  return {
    id: row.id,
    schedule_date: row.schedule_date,
    shift_type: row.shift_type,
    route_name: row.route_name
  };
}

export function calculateDelayMinutes(
  actualTime: string,
  estimatedTime: string
): number {
  const actual = new Date(actualTime).getTime();
  const estimated = new Date(estimatedTime).getTime();
  return Math.round((actual - estimated) / 60000);
}

export function getCheckInStatus(delayMinutes: number): 'on_time' | 'late' | 'early' {
  if (delayMinutes > 5) return 'late';
  if (delayMinutes < -5) return 'early';
  return 'on_time';
}
