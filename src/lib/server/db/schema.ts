import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	role: text('role', { enum: ['consultant', 'teacher', 'admin'] }).notNull(),
	createdAt: text('created_at').default(new Date().toISOString())
});

export const students = sqliteTable('students', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	phone: text('phone'),
	createdAt: text('created_at').default(new Date().toISOString())
});

export const studentPackages = sqliteTable('student_packages', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	studentId: text('student_id')
		.notNull()
		.references(() => students.id),
	totalHours: integer('total_hours').notNull().default(0),
	remainingHours: integer('remaining_hours').notNull().default(0),
	createdAt: text('created_at').default(new Date().toISOString()),
	updatedAt: text('updated_at').default(new Date().toISOString())
});

export const consumptions = sqliteTable('consumptions', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	studentId: text('student_id')
		.notNull()
		.references(() => students.id),
	courseName: text('course_name').notNull(),
	hours: integer('hours').notNull(),
	status: text('status', { enum: ['pending', 'confirmed', 'rejected'] })
		.notNull()
		.default('pending'),
	consultantId: text('consultant_id')
		.notNull()
		.references(() => users.id),
	consultantName: text('consultant_name').notNull(),
	teacherId: text('teacher_id').references(() => users.id),
	teacherName: text('teacher_name'),
	remark: text('remark'),
	rejectReason: text('reject_reason'),
	createdAt: text('created_at').default(new Date().toISOString()),
	confirmedAt: text('confirmed_at')
});

export const makeups = sqliteTable('makeups', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	studentId: text('student_id')
		.notNull()
		.references(() => students.id),
	originalCourseDate: text('original_course_date').notNull(),
	originalCourseName: text('original_course_name').notNull(),
	reason: text('reason'),
	status: text('status', { enum: ['pending', 'scheduled', 'completed', 'cancelled'] })
		.notNull()
		.default('pending'),
	consultantId: text('consultant_id')
		.notNull()
		.references(() => users.id),
	consultantName: text('consultant_name').notNull(),
	teacherId: text('teacher_id').references(() => users.id),
	teacherName: text('teacher_name'),
	scheduledDate: text('scheduled_date'),
	classroom: text('classroom'),
	makeupContent: text('makeup_content'),
	cancelReason: text('cancel_reason'),
	createdAt: text('created_at').default(new Date().toISOString()),
	scheduledAt: text('scheduled_at'),
	completedAt: text('completed_at'),
	cancelledAt: text('cancelled_at')
});

export const auditLogs = sqliteTable('audit_logs', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull(),
	userName: text('user_name').notNull(),
	action: text('action').notNull(),
	entityType: text('entity_type').notNull(),
	entityId: text('entity_id').notNull(),
	detail: text('detail'),
	createdAt: text('created_at').default(new Date().toISOString())
});
