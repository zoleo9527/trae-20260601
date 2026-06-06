import { eq, and, desc, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { consumptions, auditLogs, students, studentPackages } from '../db/schema';
import type { ConsumptionRecord, ConsumptionStatus } from '$lib/types';

interface ConsumptionFilters {
	studentId?: string;
	status?: ConsumptionStatus;
	teacherId?: string;
	consultantId?: string;
}

interface CreateConsumptionData {
	studentId: string;
	courseName: string;
	hours: number;
	remark?: string;
}

export async function getConsumptions(filters?: ConsumptionFilters): Promise<ConsumptionRecord[]> {
	const conditions: SQL[] = [];

	if (filters) {
		if (filters.studentId) conditions.push(eq(consumptions.studentId, filters.studentId));
		if (filters.status) conditions.push(eq(consumptions.status, filters.status));
		if (filters.teacherId) conditions.push(eq(consumptions.teacherId, filters.teacherId));
		if (filters.consultantId) conditions.push(eq(consumptions.consultantId, filters.consultantId));
	}

	const baseQuery = db
		.select({
			consumption: consumptions,
			studentName: students.name
		})
		.from(consumptions)
		.leftJoin(students, eq(consumptions.studentId, students.id))
		.orderBy(desc(consumptions.createdAt));

	let result;
	if (conditions.length > 0) {
		result = await baseQuery.where(and(...conditions)).all();
	} else {
		result = await baseQuery.all();
	}

	return result.map(({ consumption, studentName }) => ({
		...consumption,
		studentName
	})) as ConsumptionRecord[];
}

export async function getConsumptionById(id: string): Promise<ConsumptionRecord | null> {
	const result = await db
		.select({
			consumption: consumptions,
			studentName: students.name
		})
		.from(consumptions)
		.leftJoin(students, eq(consumptions.studentId, students.id))
		.where(eq(consumptions.id, id))
		.limit(1)
		.get();

	if (!result) return null;

	return {
		...result.consumption,
		studentName: result.studentName
	} as ConsumptionRecord;
}

export async function createConsumption(
	data: CreateConsumptionData,
	userId: string,
	userName: string
): Promise<ConsumptionRecord> {
	const [newConsumption] = await db
		.insert(consumptions)
		.values({
			studentId: data.studentId,
			courseName: data.courseName,
			hours: data.hours,
			remark: data.remark,
			consultantId: userId,
			consultantName: userName
		})
		.returning();

	await db.insert(auditLogs).values({
		userId,
		userName,
		action: 'create',
		entityType: 'consumption',
		entityId: newConsumption.id,
		detail: `创建课消记录: ${data.courseName}, ${data.hours}课时`
	});

	const student = await db.select().from(students).where(eq(students.id, data.studentId)).limit(1).get();

	return {
		...newConsumption,
		studentName: student?.name
	} as ConsumptionRecord;
}

export async function confirmConsumption(
	id: string,
	teacherId: string,
	teacherName: string
): Promise<ConsumptionRecord> {
	const consumption = await getConsumptionById(id);
	if (!consumption) {
		throw new Error('课消记录不存在');
	}

	if (consumption.status !== 'pending') {
		throw new Error('只有待确认状态的记录可以确认');
	}

	const [updated] = await db
		.update(consumptions)
		.set({
			status: 'confirmed',
			teacherId,
			teacherName,
			confirmedAt: new Date().toISOString()
		})
		.where(eq(consumptions.id, id))
		.returning();

	const studentPkg = await db
		.select()
		.from(studentPackages)
		.where(eq(studentPackages.studentId, consumption.studentId))
		.limit(1)
		.get();

	if (studentPkg) {
		const newRemaining = Math.max(0, studentPkg.remainingHours - consumption.hours);
		await db
			.update(studentPackages)
			.set({
				remainingHours: newRemaining,
				updatedAt: new Date().toISOString()
			})
			.where(eq(studentPackages.id, studentPkg.id));
	}

	await db.insert(auditLogs).values({
		userId: teacherId,
		userName: teacherName,
		action: 'confirm',
		entityType: 'consumption',
		entityId: id,
		detail: `确认课消记录，扣减 ${consumption.hours} 课时`
	});

	const student = await db.select().from(students).where(eq(students.id, consumption.studentId)).limit(1).get();

	return {
		...updated,
		studentName: student?.name
	} as ConsumptionRecord;
}

export async function rejectConsumption(
	id: string,
	teacherId: string,
	teacherName: string,
	reason: string
): Promise<ConsumptionRecord> {
	const [updated] = await db
		.update(consumptions)
		.set({
			status: 'rejected',
			teacherId,
			teacherName,
			rejectReason: reason
		})
		.where(eq(consumptions.id, id))
		.returning();

	await db.insert(auditLogs).values({
		userId: teacherId,
		userName: teacherName,
		action: 'reject',
		entityType: 'consumption',
		entityId: id,
		detail: `拒绝课消记录: ${reason}`
	});

	const student = await db.select().from(students).where(eq(students.id, updated.studentId)).limit(1).get();

	return {
		...updated,
		studentName: student?.name
	} as ConsumptionRecord;
}
