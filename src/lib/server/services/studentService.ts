import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { students, studentPackages, consumptions, makeups } from '../db/schema';
import type { Student, ConsumptionRecord, MakeupRecord } from '$lib/types';

export async function getStudents(): Promise<Student[]> {
	const studentsWithPackages = await db
		.select({
			student: students,
			pkg: studentPackages
		})
		.from(students)
		.leftJoin(studentPackages, eq(students.id, studentPackages.studentId))
		.all();

	return studentsWithPackages.map(({ student, pkg }) => ({
		id: student.id,
		name: student.name,
		phone: student.phone || undefined,
		packageHours: pkg?.totalHours || 0,
		remainingHours: pkg?.remainingHours || 0,
		createdAt: student.createdAt || undefined
	}));
}

export async function getStudentById(id: string): Promise<Student | null> {
	const result = await db
		.select({
			student: students,
			pkg: studentPackages
		})
		.from(students)
		.leftJoin(studentPackages, eq(students.id, studentPackages.studentId))
		.where(eq(students.id, id))
		.limit(1)
		.get();

	if (!result) return null;

	return {
		id: result.student.id,
		name: result.student.name,
		phone: result.student.phone || undefined,
		packageHours: result.pkg?.totalHours || 0,
		remainingHours: result.pkg?.remainingHours || 0,
		createdAt: result.student.createdAt || undefined
	};
}

export async function getStudentDetail(id: string): Promise<{
	student: Student;
	consumptionHistory: ConsumptionRecord[];
	makeupHistory: MakeupRecord[];
} | null> {
	const student = await getStudentById(id);
	if (!student) return null;

	const [consumptionHistory, makeupHistory] = await Promise.all([
		db
			.select()
			.from(consumptions)
			.where(eq(consumptions.studentId, id))
			.orderBy(desc(consumptions.createdAt))
			.all(),
		db
			.select()
			.from(makeups)
			.where(eq(makeups.studentId, id))
			.orderBy(desc(makeups.createdAt))
			.all()
	]);

	return {
		student,
		consumptionHistory: consumptionHistory as ConsumptionRecord[],
		makeupHistory: makeupHistory as MakeupRecord[]
	};
}
