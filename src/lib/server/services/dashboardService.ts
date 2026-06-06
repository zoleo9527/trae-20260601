import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { students, consumptions, makeups, auditLogs, studentPackages } from '../db/schema';
import type { DashboardData, TodoItem, RiskItem, ChangeItem } from '$lib/types';

export async function getDashboardData(role: string, userId: string): Promise<DashboardData> {
	const [
		studentsResult,
		consumptionsResult,
		makeupsResult,
		pendingConsumptions,
		pendingMakeups,
		confirmedConsumptions,
		auditLogsResult,
		studentPackagesResult
	] = await Promise.all([
		db.select().from(students).all(),
		db.select().from(consumptions).all(),
		db.select().from(makeups).all(),
		db.select().from(consumptions).where(eq(consumptions.status, 'pending')).all(),
		db.select().from(makeups).where(eq(makeups.status, 'pending')).all(),
		db.select().from(consumptions).where(eq(consumptions.status, 'confirmed')).all(),
		db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10).all(),
		db.select().from(studentPackages).all()
	]);

	const totalHoursConsumed = confirmedConsumptions.reduce((sum, c) => sum + c.hours, 0);
	const avgHoursPerStudent = studentsResult.length > 0 ? totalHoursConsumed / studentsResult.length : 0;

	const stats = {
		totalStudents: studentsResult.length,
		totalConsumptions: consumptionsResult.length,
		totalMakeups: makeupsResult.length,
		pendingConsumptions: pendingConsumptions.length,
		pendingMakeups: pendingMakeups.length,
		totalHoursConsumed,
		avgHoursPerStudent
	};

	const todos = await getTodosByRole(role, userId);
	const risks = await getRisks(studentPackagesResult, studentsResult);
	const recentChanges = auditLogsResult.map((log) => ({
		id: log.id,
		action: log.action,
		entityType: log.entityType,
		entityId: log.entityId,
		userId: log.userId,
		userName: log.userName,
		detail: log.detail || undefined,
		createdAt: log.createdAt || new Date().toISOString()
	})) as ChangeItem[];

	return {
		stats,
		todos,
		risks,
		recentChanges
	};
}

async function getTodosByRole(role: string, userId: string): Promise<TodoItem[]> {
	const todos: TodoItem[] = [];

	if (role === 'teacher') {
		const pendingConsumptionsForTeacher = await db
			.select()
			.from(consumptions)
			.where(eq(consumptions.status, 'pending'))
			.all();

		pendingConsumptionsForTeacher.forEach((c) => {
			todos.push({
				id: `consumption-${c.id}`,
				title: `待确认课消: ${c.courseName}`,
				description: `学生ID: ${c.studentId}, 课时: ${c.hours}`,
				type: 'consumption',
				relatedId: c.id,
				priority: 'high',
				status: 'pending',
				createdAt: c.createdAt || new Date().toISOString()
			});
		});

		const scheduledMakeups = await db
			.select()
			.from(makeups)
			.where(eq(makeups.status, 'scheduled'))
			.all();

		scheduledMakeups.forEach((m) => {
			todos.push({
				id: `makeup-${m.id}`,
				title: `待完成补课: ${m.originalCourseName}`,
				description: `学生ID: ${m.studentId}, 安排日期: ${m.scheduledDate}`,
				type: 'makeup',
				relatedId: m.id,
				priority: 'medium',
				status: 'pending',
				createdAt: m.createdAt || new Date().toISOString()
			});
		});
	} else if (role === 'consultant') {
		const pendingMakeupsForConsultant = await db
			.select()
			.from(makeups)
			.where(eq(makeups.status, 'pending'))
			.all();

		pendingMakeupsForConsultant.forEach((m) => {
			todos.push({
				id: `makeup-${m.id}`,
				title: `待安排补课: ${m.originalCourseName}`,
				description: `学生ID: ${m.studentId}, 原课程日期: ${m.originalCourseDate}`,
				type: 'makeup',
				relatedId: m.id,
				priority: 'high',
				status: 'pending',
				createdAt: m.createdAt || new Date().toISOString()
			});
		});
	} else if (role === 'admin') {
		const allPending = await db
			.select()
			.from(consumptions)
			.where(eq(consumptions.status, 'pending'))
			.all();

		allPending.forEach((c) => {
			todos.push({
				id: `consumption-${c.id}`,
				title: `待确认课消: ${c.courseName}`,
				description: `顾问: ${c.consultantName}`,
				type: 'consumption',
				relatedId: c.id,
				priority: 'medium',
				status: 'pending',
				createdAt: c.createdAt || new Date().toISOString()
			});
		});
	}

	return todos.slice(0, 10);
}

async function getRisks(packages: typeof studentPackages.$inferSelect[], studentsList: typeof students.$inferSelect[]): Promise<RiskItem[]> {
	const risks: RiskItem[] = [];
	const now = new Date();
	const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

	packages.forEach((pkg) => {
		const student = studentsList.find((s) => s.id === pkg.studentId);
		if (!student) return;

		if (pkg.remainingHours <= 5) {
			risks.push({
				id: `risk-hours-${pkg.id}`,
				type: 'hours_low',
				studentId: pkg.studentId,
				studentName: student.name,
				description: `剩余课时不足: ${pkg.remainingHours}课时`,
				level: pkg.remainingHours <= 2 ? 'high' : 'medium',
				createdAt: new Date().toISOString()
			});
		}
	});

	const pendingMakeups = await db
		.select()
		.from(makeups)
		.where(eq(makeups.status, 'pending'))
		.all();

	pendingMakeups.forEach((makeup) => {
		const student = studentsList.find((s) => s.id === makeup.studentId);
		const createdAt = new Date(makeup.createdAt || '');
		if (!student) return;

		if (createdAt < sevenDaysAgo) {
			risks.push({
				id: `risk-makeup-overdue-${makeup.id}`,
				type: 'pending_too_long',
				studentId: makeup.studentId,
				studentName: student.name,
				description: `补课申请超7天未安排: ${makeup.originalCourseName}`,
				level: 'high',
				createdAt: new Date().toISOString()
			});
		} else if (createdAt < threeDaysAgo) {
			risks.push({
				id: `risk-makeup-waiting-${makeup.id}`,
				type: 'pending_too_long',
				studentId: makeup.studentId,
				studentName: student.name,
				description: `补课申请待安排: ${makeup.originalCourseName}`,
				level: 'medium',
				createdAt: new Date().toISOString()
			});
		}
	});

	const pendingConsumptions = await db
		.select()
		.from(consumptions)
		.where(eq(consumptions.status, 'pending'))
		.all();

	pendingConsumptions.forEach((consumption) => {
		const student = studentsList.find((s) => s.id === consumption.studentId);
		const createdAt = new Date(consumption.createdAt || '');
		if (!student) return;

		if (createdAt < threeDaysAgo) {
			risks.push({
				id: `risk-consumption-waiting-${consumption.id}`,
				type: 'no_consumption',
				studentId: consumption.studentId,
				studentName: student.name,
				description: `课消记录待确认: ${consumption.courseName}, ${consumption.hours}课时`,
				level: 'medium',
				createdAt: new Date().toISOString()
			});
		}
	});

	return risks;
}
