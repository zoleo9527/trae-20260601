import db from './database';
import {
  RouteSummary,
  StopSummary,
  VehicleSummary,
  DriverSummary,
  StudentSummary,
  ScheduleSummary
} from './types';

export interface LateEventSummary {
  id: number;
  delay_minutes: number;
  reason?: string;
  status: string;
  stop_name?: string;
  detected_time: string;
}

export function getLateEventSummary(lateEventId: number): LateEventSummary | undefined {
  const row = db.prepare(`
    SELECT le.id, le.delay_minutes, le.reason, le.status, le.detected_time, st.name as stop_name
    FROM late_events le
    LEFT JOIN stops st ON le.stop_id = st.id
    WHERE le.id = ?
  `).get(lateEventId) as any;

  if (!row) return undefined;
  return {
    id: row.id,
    delay_minutes: row.delay_minutes,
    reason: row.reason || undefined,
    status: row.status,
    stop_name: row.stop_name || undefined,
    detected_time: row.detected_time
  };
}

export function getReviewerSummary(reviewerId: number): DriverSummary | undefined {
  return getDriverSummary(reviewerId);
}

export function getHandlerSummary(handlerId: number): DriverSummary | undefined {
  return getDriverSummary(handlerId);
}

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

export interface StopReferenceCheckResult {
  can_delete: boolean;
  references: {
    students: { id: number; name: string; student_id: string }[];
    ride_records: { id: number; student_name: string; schedule_date: string }[];
    check_ins: { id: number; actual_arrival_time: string; schedule_date: string }[];
    late_events: { id: number; delay_minutes: number; reason: string | null }[];
  };
  message: string;
}

export function checkStopReferences(stopId: number): StopReferenceCheckResult {
  const students = db.prepare(`
    SELECT id, name, student_id FROM students WHERE default_stop_id = ?
  `).all(stopId) as any[];

  const rideRecords = db.prepare(`
    SELECT rr.id, s.name as student_name, sch.schedule_date
    FROM ride_records rr
    JOIN students s ON rr.student_id = s.id
    JOIN schedules sch ON rr.schedule_id = sch.id
    WHERE rr.stop_id = ?
  `).all(stopId) as any[];

  const checkIns = db.prepare(`
    SELECT ci.id, ci.actual_arrival_time, sch.schedule_date
    FROM check_ins ci
    JOIN schedules sch ON ci.schedule_id = sch.id
    WHERE ci.stop_id = ?
  `).all(stopId) as any[];

  const lateEvents = db.prepare(`
    SELECT id, delay_minutes, reason FROM late_events WHERE stop_id = ?
  `).all(stopId) as any[];

  const totalRefs = students.length + rideRecords.length + checkIns.length + lateEvents.length;
  const canDelete = totalRefs === 0;

  const parts: string[] = [];
  if (students.length > 0) parts.push(`${students.length} 名学生默认站点`);
  if (rideRecords.length > 0) parts.push(`${rideRecords.length} 条乘车记录`);
  if (checkIns.length > 0) parts.push(`${checkIns.length} 条签到记录`);
  if (lateEvents.length > 0) parts.push(`${lateEvents.length} 条迟到事件`);

  const message = canDelete
    ? '该站点可以安全删除'
    : `无法删除：该站点仍被 ${parts.join('、')} 引用，请先处理相关数据`;

  return {
    can_delete: canDelete,
    references: {
      students: students.map(s => ({ id: s.id, name: s.name, student_id: s.student_id })),
      ride_records: rideRecords.map(r => ({ id: r.id, student_name: r.student_name, schedule_date: r.schedule_date })),
      check_ins: checkIns.map(c => ({ id: c.id, actual_arrival_time: c.actual_arrival_time, schedule_date: c.schedule_date })),
      late_events: lateEvents.map(l => ({ id: l.id, delay_minutes: l.delay_minutes, reason: l.reason }))
    },
    message
  };
}
