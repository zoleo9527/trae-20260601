import { eq, and, desc, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { makeups, auditLogs, students } from '../db/schema';
import type { MakeupRecord, MakeupStatus, User } from '$lib/types';

class PermissionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'PermissionError';
	}
}

class StateError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'StateError';
	}
}

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
	user: User,
	scheduledDate: string,
	classroom: string
): Promise<MakeupRecord> {
	const makeup = await getMakeupById(id);
	if (!makeup) {
		throw new Error('补课记录不存在');
	}

	if (makeup.status !== 'pending') {
		throw new StateError('只有待安排状态的补课可以被安排');
	}

	if (user.role !== 'teacher' && user.role !== 'admin') {
		throw new PermissionError('只有任课老师或校区主管可以安排补课');
	}

	const [updated] = await db
		.update(makeups)
		.set({
			status: 'scheduled',
			teacherId: user.id,
			teacherName: user.name,
			scheduledDate,
			classroom,
			scheduledAt: new Date().toISOString()
		})
		.where(eq(makeups.id, id))
		.returning();

	await db.insert(auditLogs).values({
		userId: user.id,
		userName: user.name,
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

export async function completeMakeup(
	id: string,
	user: User,
	content: string
): Promise<MakeupRecord> {
	const makeup = await getMakeupById(id);
	if (!makeup) {
		throw new Error('补课记录不存在');
	}

	if (makeup.status !== 'scheduled') {
		throw new StateError('只有待上课状态的补课可以被完成');
	}

	if (user.role !== 'teacher' && user.role !== 'admin') {
		throw new PermissionError('只有任课老师或校区主管可以完成补课');
	}

	if (user.role === 'teacher' && makeup.teacherId !== user.id) {
		throw new PermissionError('只有安排该补课的任课老师可以完成此补课');
	}

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
		userId: user.id,
		userName: user.name,
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

export async function cancelMakeup(
	id: string,
	user: User,
	reason: string
): Promise<MakeupRecord> {
	const makeup = await getMakeupById(id);
	if (!makeup) {
		throw new Error('补课记录不存在');
	}

	if (makeup.status !== 'pending' && makeup.status !== 'scheduled') {
		throw new StateError('只有待安排或待上课状态的补课可以被取消');
	}

	const isOwner = makeup.consultantId === user.id;
	const isAdmin = user.role === 'admin';

	if (makeup.status === 'pending') {
		if (!isOwner && !isAdmin) {
			throw new PermissionError('待安排状态的补课只有创建人或校区主管可以取消');
		}
		if (user.role === 'consultant' && !isOwner) {
			throw new PermissionError('课程顾问只能取消自己创建的补课申请');
		}
	}

	if (makeup.status === 'scheduled') {
		if (!isAdmin) {
			throw new PermissionError('待上课状态的补课只有校区主管可以取消');
		}
	}

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
		userId: user.id,
		userName: user.name,
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

export { PermissionError, StateError };
