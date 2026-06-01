import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { Student } from '../entities/Student';

export async function recalcStudentHours(studentId: number): Promise<number> {
  const attendanceRepo = AppDataSource.getRepository(Attendance);
  const studentRepo = AppDataSource.getRepository(Student);

  const attendances = await attendanceRepo.find({
    where: { studentId },
    relations: ['session'],
  });

  let totalHours = 0;
  for (const a of attendances) {
    if ((a.status === 'present' || a.status === 'makeup') && a.session) {
      totalHours += a.session.hours;
    }
  }

  await studentRepo.update(studentId, { attendedHours: totalHours });

  return totalHours;
}

export function calcHoursFromAttendances(attendances: Attendance[]): number {
  let totalHours = 0;
  for (const a of attendances) {
    if ((a.status === 'present' || a.status === 'makeup') && a.session) {
      totalHours += a.session.hours;
    }
  }
  return totalHours;
}
