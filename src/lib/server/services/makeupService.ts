import { eq, and, desc, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { makeups, auditLogs, students } from '../db/schema';
import type { MakeupRecord, MakeupStatus } from '$lib/types';

interface MakeupFilters {
	studentId?: string;
	status?: MakeupStatus;
	teacherId?: string;
	consultantId?: string;
}

interface CreateMakeupData {
	studentId: string;
	originalCourseDate: string;
	originalCourseName: string;
	reason?: string;
}

export async function getMakeups(filters?: MakeupFilters): Promise<MakeupRecord[]> {
	const conditions: SQL[] = [];

	if (filters) {
		if (filters.studentId) conditions.push(eq(makeups.studentId, filters.studentId));
		if (filters.status) conditions.push(eq(makeups.status, filters.status));
		if (filters.teacherId) conditions.push(eq(makeups.teacherId, filters.teacherId));
		if (filters.consultantId) conditions.push(eq(makeups.consultantId, filters.consultantId));
	}

	const baseQuery = db
		.select({
			makeup: makeups,
			studentName: students.name
		})
		.from(makeups)
		.leftJoin(students, eq(makeups.studentId, students.id))
		.orderBy(desc(makeups.createdAt));

	let result;
	if (conditions.length > 0) {
		result = await baseQuery.where(and(...conditions)).all();
	} else {
		result = await baseQuery.all();
	}

	return result.map(({ makeup, studentName }) => ({
		...makeup,
		studentName
	})) as MakeupRecord[];
}

export async function getMakeupById(id: string): Promise<MakeupRecord | null> {
	const result = await db
		.select({
			makeup: makeups,
			studentName: students.name
		})
		.from(makeups)
		.leftJoin(students, eq(makeups.studentId, students.id))
		.where(eq(makeups.id, id))
		.limit(1)
		.get();

	if (!result) return null;

	return {
		...result.makeup,
		studentName: result.studentName
	} as MakeupRecord;
}

export async function createMakeup(
	data: CreateMakeupData,
	userId: string,
	userName: string
): Promise<MakeupRecord> {
	const [newMakeup] = await db
		.insert(makeups)
		.values({
			studentId: data.studentId,
			originalCourseDate: data.originalCourseDate,
			originalCourseName: data.originalCourseName,
			reason: data.reason,
			consultantId: userId,
			consultantName: userName
		})
		.returning();

	await db.insert(auditLogs).values({
		userId,
		userName,
		action: 'create',
		entityType: 'makeup',
		entityId: newMakeup.id,
		detail: `创建补课记录: ${data.originalCourseName}`
	});

	const student = await db.select().from(students).where(eq(students.id, data.studentId)).limit(1).get();

	return {
		...newMakeup,
		studentName: student?.name
	} as MakeupRecord;
}

export async function scheduleMakeup(
	id: string,
	teacherId: string,
	teacherName: string,
	scheduledDate: string,
	classroom: string
): Promise<MakeupRecord> {
	const [updated] = await db
		.update(makeups)
		.set({
			status: 'scheduled',
			teacherId,
			teacherName,
			scheduledDate,
			classroom,
			scheduledAt: new Date().toISOString()
		})
		.where(eq(makeups.id, id))
		.returning();

	await db.insert(auditLogs).values({
		userId: teacherId,
		userName: teacherName,
		action: 'schedule',
		entityType: 'makeup',
		entityId: id,
		detail: `安排补课: ${scheduledDate}, 教室: ${classroom}`
	});

	const student = await db.select().from(students).where(eq(students.id, updated.studentId)).limit(1).get();

	return {
		...updated,
		studentName: student?.name
	} as MakeupRecord;
}

export async function completeMakeup(id: string, content: string): Promise<MakeupRecord> {
	const [updated] = await db
		.update(makeups)
		.set({
			status: 'completed',
			makeupContent: content,
			completedAt: new Date().toISOString()
		})
		.where(eq(makeups.id, id))
		.returning();

	await db.insert(auditLogs).values({
		userId: updated.teacherId || '',
		userName: updated.teacherName || '',
		action: 'complete',
		entityType: 'makeup',
		entityId: id,
		detail: `完成补课: ${content}`
	});

	const student = await db.select().from(students).where(eq(students.id, updated.studentId)).limit(1).get();

	return {
		...updated,
		studentName: student?.name
	} as MakeupRecord;
}

export async function cancelMakeup(id: string, reason: string): Promise<MakeupRecord> {
	const [updated] = await db
		.update(makeups)
		.set({
			status: 'cancelled',
			cancelReason: reason,
			cancelledAt: new Date().toISOString()
		})
		.where(eq(makeups.id, id))
		.returning();

	await db.insert(auditLogs).values({
		userId: updated.consultantId,
		userName: updated.consultantName,
		action: 'cancel',
		entityType: 'makeup',
		entityId: id,
		detail: `取消补课: ${reason}`
	});

	const student = await db.select().from(students).where(eq(students.id, updated.studentId)).limit(1).get();

	return {
		...updated,
		studentName: student?.name
	} as MakeupRecord;
}
