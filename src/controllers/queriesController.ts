import { Request, Response } from 'express';
import db from '../database';
import {
  getRouteSummary,
  getVehicleSummary,
  getDriverSummary,
  getStopSummary,
  getStudentSummary,
  getScheduleSummary,
  getReviewerSummary,
  getHandlerSummary,
  getLateEventSummary
} from '../utils';

export const getRouteByDate = (req: Request, res: Response) => {
  try {
    const { route_id, date } = req.params;

    const schedule = db.prepare(`
      SELECT * FROM schedules
      WHERE route_id = ? AND schedule_date = ?
      ORDER BY shift_type
    `).all(route_id, date) as any[];

    if (schedule.length === 0) {
      return res.json({
        route: getRouteSummary(Number(route_id)),
        date,
        schedules: [],
        message: '该日期此线路暂无排班'
      });
    }

    const enrichedSchedules = schedule.map(s => {
      const checkIns = db.prepare(`
        SELECT ci.*, st.name as stop_name, st.sequence, st.estimated_arrival_time
        FROM check_ins ci
        JOIN stops st ON ci.stop_id = st.id
        WHERE ci.schedule_id = ?
        ORDER BY st.sequence
      `).all(s.id) as any[];

      const rideRecords = db.prepare(`
        SELECT rr.*, st.name as stop_name, st.sequence, stu.name as student_name, stu.student_id
        FROM ride_records rr
        JOIN stops st ON rr.stop_id = st.id
        JOIN students stu ON rr.student_id = stu.id
        WHERE rr.schedule_id = ?
        ORDER BY st.sequence, stu.name
      `).all(s.id) as any[];

      const lateEvents = db.prepare(`
        SELECT * FROM late_events WHERE schedule_id = ?
      `).all(s.id);

      const complaints = db.prepare(`
        SELECT c.*, stu.name as student_name
        FROM complaints c
        JOIN students stu ON c.student_id = stu.id
        WHERE c.schedule_id = ?
      `).all(s.id);

      const enrichedComplaints = complaints.map((c: any) => {
        const reviewedBy = c.reviewed_by ? getReviewerSummary(c.reviewed_by) : undefined;
        const handler = c.handler_id ? getHandlerSummary(c.handler_id) : undefined;

        const studentInfo = db.prepare(`
          SELECT default_stop_id FROM students WHERE id = ?
        `).get(c.student_id) as any;
        const defaultStopId = studentInfo ? studentInfo.default_stop_id : null;

        const relatedLateEvents = db.prepare(`
          SELECT le.id
          FROM late_events le
          WHERE le.schedule_id = ?
            AND (le.stop_id = ? OR le.stop_id IS NULL OR ? IS NULL)
        `).all(c.schedule_id, defaultStopId, defaultStopId)
          .map((le: any) => getLateEventSummary(le.id))
          .filter(Boolean);

        const result: any = {
          ...c,
          student_name: c.student_name,
          student: getStudentSummary(c.student_id),
          reviewed_by_info: reviewedBy,
          handled_by_info: handler,
          related_late_events: relatedLateEvents
        };

        if (c.status === 'resolved' || c.status === 'rejected') {
          result.review_summary = {
            status: c.status,
            result: c.review_result,
            reviewed_at: c.reviewed_at,
            late_events_updated: relatedLateEvents.length
          };
        }

        return result;
      });

      return {
        ...s,
        route: getRouteSummary(s.route_id),
        vehicle: getVehicleSummary(s.vehicle_id),
        driver: getDriverSummary(s.driver_id),
        check_ins: checkIns,
        ride_records: rideRecords,
        late_events: lateEvents,
        complaints: enrichedComplaints,
        summary: {
          total_students: rideRecords.length,
          boarded: rideRecords.filter((r: any) => r.status === 'boarded').length,
          absent: rideRecords.filter((r: any) => r.status === 'absent').length,
          pending: rideRecords.filter((r: any) => r.status === 'pending').length,
          late_stops: checkIns.filter((c: any) => c.status === 'late').length,
          total_delay_minutes: checkIns.reduce((sum: number, c: any) => sum + Math.max(0, c.delay_minutes), 0)
        }
      };
    });

    res.json({
      route: getRouteSummary(Number(route_id)),
      date,
      schedules: enrichedSchedules
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch route by date' });
  }
};

export const getStudentRideStatus = (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const { date } = req.query;

    const queryDate = date || new Date().toISOString().split('T')[0];

    const student = db.prepare(`
      SELECT * FROM students WHERE id = ?
    `).get(student_id) as any;

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const rideRecords = db.prepare(`
      SELECT rr.*, s.schedule_date, s.shift_type, r.name as route_name
      FROM ride_records rr
      JOIN schedules s ON rr.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      WHERE rr.student_id = ? AND s.schedule_date = ?
      ORDER BY s.shift_type
    `).all(student_id, queryDate) as any[];

    const enrichedRecords = rideRecords.map(record => {
      const checkIn = record.check_in_id ? db.prepare(`
        SELECT ci.*, st.name as stop_name
        FROM check_ins ci
        JOIN stops st ON ci.stop_id = st.id
        WHERE ci.id = ?
      `).get(record.check_in_id) : null;

      const schedule = getScheduleSummary(record.schedule_id);

      const complaints = db.prepare(`
        SELECT * FROM complaints
        WHERE student_id = ? AND schedule_id = ?
        ORDER BY complaint_time DESC
      `).all(student_id, record.schedule_id);

      const enrichedComplaints = complaints.map((c: any) => {
        const reviewedBy = c.reviewed_by ? getReviewerSummary(c.reviewed_by) : undefined;
        const handler = c.handler_id ? getHandlerSummary(c.handler_id) : undefined;

        const relatedLateEvents = db.prepare(`
          SELECT le.id
          FROM late_events le
          WHERE le.schedule_id = ?
            AND (le.stop_id = ? OR le.stop_id IS NULL OR ? IS NULL)
        `).all(c.schedule_id, student.default_stop_id, student.default_stop_id)
          .map((le: any) => getLateEventSummary(le.id))
          .filter(Boolean);

        const result: any = {
          ...c,
          student: getStudentSummary(c.student_id),
          reviewed_by_info: reviewedBy,
          handled_by_info: handler,
          related_late_events: relatedLateEvents
        };

        if (c.status === 'resolved' || c.status === 'rejected') {
          result.review_summary = {
            status: c.status,
            result: c.review_result,
            reviewed_at: c.reviewed_at,
            late_events_updated: relatedLateEvents.length
          };
        }

        return result;
      });

      return {
        ...record,
        stop: getStopSummary(record.stop_id),
        check_in: checkIn,
        schedule: schedule,
        complaints: enrichedComplaints,
        status_text: getStatusText(record.status, checkIn)
      };
    });

    res.json({
      student: {
        ...student,
        default_route: student.default_route_id ? getRouteSummary(student.default_route_id) : undefined,
        default_stop: student.default_stop_id ? getStopSummary(student.default_stop_id) : undefined
      },
      date: queryDate,
      ride_records: enrichedRecords,
      summary: {
        total_trips: enrichedRecords.length,
        completed: enrichedRecords.filter((r: any) => r.status === 'boarded').length,
        issues: enrichedRecords.filter((r: any) =>
          r.status === 'absent' ||
          (r.check_in && r.check_in.status === 'late') ||
          r.complaints.length > 0
        ).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student ride status' });
  }
};

export const getDashboardStats = (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const queryDate = date || new Date().toISOString().split('T')[0];

    const totalSchedules = db.prepare(`
      SELECT COUNT(*) as count FROM schedules WHERE schedule_date = ?
    `).get(queryDate) as any;

    const schedules = db.prepare(`
      SELECT id FROM schedules WHERE schedule_date = ?
    `).all(queryDate) as any[];

    const scheduleIds = schedules.map(s => s.id);

    let totalCheckIns = 0;
    let lateCheckIns = 0;
    let totalDelayMinutes = 0;
    let totalRideRecords = 0;
    let boardedStudents = 0;
    let absentStudents = 0;

    if (scheduleIds.length > 0) {
      const placeholders = scheduleIds.map(() => '?').join(',');

      const checkInStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
          SUM(CASE WHEN delay_minutes > 0 THEN delay_minutes ELSE 0 END) as total_delay
        FROM check_ins WHERE schedule_id IN (${placeholders})
      `).get(...scheduleIds) as any;

      totalCheckIns = checkInStats.total || 0;
      lateCheckIns = checkInStats.late || 0;
      totalDelayMinutes = checkInStats.total_delay || 0;

      const rideStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'boarded' THEN 1 ELSE 0 END) as boarded,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
        FROM ride_records WHERE schedule_id IN (${placeholders})
      `).get(...scheduleIds) as any;

      totalRideRecords = rideStats.total || 0;
      boardedStudents = rideStats.boarded || 0;
      absentStudents = rideStats.absent || 0;
    }

    const pendingComplaints = db.prepare(`
      SELECT COUNT(*) as count FROM complaints WHERE status IN ('pending', 'investigating')
    `).get() as any;

    const pendingLateEvents = db.prepare(`
      SELECT COUNT(*) as count FROM late_events WHERE status = 'pending'
    `).get() as any;

    const activeVehicles = db.prepare(`
      SELECT COUNT(*) as count FROM vehicles WHERE status = 'active'
    `).get() as any;

    const activeDrivers = db.prepare(`
      SELECT COUNT(*) as count FROM drivers WHERE status = 'active'
    `).get() as any;

    res.json({
      date: queryDate,
      schedules: {
        total: totalSchedules.count || 0,
        completed: 0
      },
      check_ins: {
        total: totalCheckIns,
        on_time: totalCheckIns - lateCheckIns,
        late: lateCheckIns,
        total_delay_minutes: totalDelayMinutes
      },
      students: {
        total: totalRideRecords,
        boarded: boardedStudents,
        absent: absentStudents,
        pending: totalRideRecords - boardedStudents - absentStudents
      },
      complaints: {
        pending: pendingComplaints.count || 0
      },
      late_events: {
        pending: pendingLateEvents.count || 0
      },
      resources: {
        active_vehicles: activeVehicles.count || 0,
        active_drivers: activeDrivers.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

function getStatusText(status: string, checkIn: any): string {
  switch (status) {
    case 'boarded':
      if (checkIn && checkIn.status === 'late') {
        return `已上车（晚点 ${checkIn.delay_minutes} 分钟）`;
      }
      return '已上车';
    case 'absent':
      return '未上车';
    case 'pending':
      return '待乘车';
    default:
      return '未知';
  }
}
