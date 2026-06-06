import { db } from './index';
import { users, students, studentPackages, consumptions, makeups, auditLogs } from './schema';

const seedUsers = [
	{ id: 'u1', name: '张顾问', role: 'consultant' as const },
	{ id: 'u2', name: '李老师', role: 'teacher' as const },
	{ id: 'u3', name: '王主管', role: 'admin' as const },
	{ id: 'u4', name: '刘顾问', role: 'consultant' as const },
	{ id: 'u5', name: '陈老师', role: 'teacher' as const }
];

const seedStudents = [
	{ id: 's1', name: '小明', phone: '13800138001' },
	{ id: 's2', name: '小红', phone: '13800138002' },
	{ id: 's3', name: '小华', phone: '13800138003' },
	{ id: 's4', name: '小丽', phone: '13800138004' },
	{ id: 's5', name: '小强', phone: '13800138005' }
];

const seedPackages = [
	{ id: 'p1', studentId: 's1', totalHours: 48, remainingHours: 32 },
	{ id: 'p2', studentId: 's2', totalHours: 24, remainingHours: 5 },
	{ id: 'p3', studentId: 's3', totalHours: 60, remainingHours: 45 },
	{ id: 'p4', studentId: 's4', totalHours: 36, remainingHours: 36 },
	{ id: 'p5', studentId: 's5', totalHours: 12, remainingHours: 2 }
];

const seedConsumptions = [
	{
		id: 'c1', studentId: 's1', courseName: '钢琴基础课', hours: 2, status: 'confirmed' as const, consultantId: 'u1', consultantName: '张顾问', teacherId: 'u2', teacherName: '李老师', remark: '正常上课', createdAt: '2026-06-01T10:00:00.000Z', confirmedAt: '2026-06-01T12:00:00.000Z' },
	{
		id: 'c2', studentId: 's2', courseName: '舞蹈启蒙班', hours: 1, status: 'pending' as const, consultantId: 'u4', consultantName: '刘顾问', createdAt: '2026-06-05T09:00:00.000Z' },
	{
		id: 'c3', studentId: 's3', courseName: '美术素描', hours: 3, status: 'confirmed' as const, consultantId: 'u1', consultantName: '张顾问', teacherId: 'u5', teacherName: '陈老师', remark: '', createdAt: '2026-06-03T14:00:00.000Z', confirmedAt: '2026-06-03T16:00:00.000Z' },
	{
		id: 'c4', studentId: 's1', courseName: '钢琴进阶课', hours: 2, status: 'pending' as const, consultantId: 'u1', consultantName: '张顾问', createdAt: '2026-06-06T08:00:00.000Z' },
	{
		id: 'c5', studentId: 's5', courseName: '书法班', hours: 1, status: 'rejected' as const, consultantId: 'u4', consultantName: '刘顾问', teacherId: 'u2', teacherName: '李老师', rejectReason: '学生未到课', createdAt: '2026-06-02T15:00:00.000Z', confirmedAt: '2026-06-02T17:00:00.000Z' }
];

const seedMakeups = [
	{
		id: 'm1', studentId: 's2', originalCourseDate: '2026-06-02', originalCourseName: '舞蹈启蒙班', reason: '生病请假', status: 'pending' as const, consultantId: 'u1', consultantName: '张顾问', createdAt: '2026-06-02T18:00:00.000Z'
	},
	{
		id: 'm2', studentId: 's1', originalCourseDate: '2026-05-28', originalCourseName: '钢琴基础课', reason: '外出旅游', status: 'scheduled' as const, consultantId: 'u4', consultantName: '刘顾问', teacherId: 'u2', teacherName: '李老师', scheduledDate: '2026-06-10T14:00:00.000Z', classroom: 'A201', scheduledAt: '2026-06-03T10:00:00.000Z', createdAt: '2026-05-28T20:00:00.000Z'
	},
	{
		id: 'm3', studentId: 's3', originalCourseDate: '2026-05-25', originalCourseName: '美术素描', reason: '学校活动冲突', status: 'completed' as const, consultantId: 'u1', consultantName: '张顾问', teacherId: 'u5', teacherName: '陈老师', scheduledDate: '2026-06-01T15:00:00.000Z', classroom: 'B102', makeupContent: '补素描基础技法练习', scheduledAt: '2026-05-26T09:00:00.000Z', completedAt: '2026-06-01T17:00:00.000Z', createdAt: '2026-05-25T18:00:00.000Z'
	},
	{
		id: 'm4', studentId: 's4', originalCourseDate: '2026-06-04', originalCourseName: '声乐课', reason: '临时有事', status: 'cancelled' as const, consultantId: 'u4', consultantName: '刘顾问', teacherId: 'u5', teacherName: '陈老师', cancelReason: '学生不需要补课', scheduledDate: '2026-06-08T10:00:00.000Z', classroom: 'C301', scheduledAt: '2026-06-05T09:00:00.000Z', cancelledAt: '2026-06-06T08:00:00.000Z', createdAt: '2026-06-04T19:00:00.000Z'
	}
];

export async function seedDatabase() {
	try {
		await db.insert(users).values(seedUsers).onConflictDoNothing();
		await db.insert(students).values(seedStudents).onConflictDoNothing();
		await db.insert(studentPackages).values(seedPackages).onConflictDoNothing();
		await db.insert(consumptions).values(seedConsumptions).onConflictDoNothing();
		await db.insert(makeups).values(seedMakeups).onConflictDoNothing();
		console.log('Database seeded successfully');
	} catch (error) {
		console.error('Error seeding database:', error);
	}
}
