export type UserRole = 'consultant' | 'teacher' | 'admin';

export interface User {
	id: string;
	name: string;
	role: UserRole;
	createdAt?: string;
}

export interface Student {
	id: string;
	name: string;
	phone?: string;
	packageHours: number;
	remainingHours: number;
	createdAt?: string;
}

export type ConsumptionStatus = 'pending' | 'confirmed' | 'rejected';

export interface ConsumptionRecord {
	id: string;
	studentId: string;
	studentName?: string;
	courseName: string;
	hours: number;
	status: ConsumptionStatus;
	consultantId: string;
	consultantName: string;
	teacherId?: string;
	teacherName?: string;
	remark?: string;
	rejectReason?: string;
	createdAt: string;
	confirmedAt?: string;
}

export type MakeupStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

export interface MakeupRecord {
	id: string;
	studentId: string;
	studentName?: string;
	originalCourseDate: string;
	originalCourseName: string;
	reason?: string;
	status: MakeupStatus;
	consultantId: string;
	consultantName: string;
	teacherId?: string;
	teacherName?: string;
	scheduledDate?: string;
	classroom?: string;
	makeupContent?: string;
	cancelReason?: string;
	createdAt: string;
	scheduledAt?: string;
	completedAt?: string;
	cancelledAt?: string;
}

export interface TodoItem {
	id: string;
	title: string;
	description?: string;
	type: 'consumption' | 'makeup' | 'other';
	relatedId?: string;
	priority: 'high' | 'medium' | 'low';
	status: 'pending' | 'completed';
	createdAt: string;
	dueDate?: string;
}

export interface RiskItem {
	id: string;
	type: 'hours_low' | 'no_consumption' | 'pending_too_long';
	studentId: string;
	studentName: string;
	description: string;
	level: 'high' | 'medium' | 'low';
	createdAt: string;
}

export interface ChangeItem {
	id: string;
	action: string;
	entityType: string;
	entityId: string;
	entityName?: string;
	userId: string;
	userName: string;
	detail?: string;
	createdAt: string;
}

export interface DashboardStats {
	totalStudents: number;
	totalConsumptions: number;
	totalMakeups: number;
	pendingConsumptions: number;
	pendingMakeups: number;
	totalHoursConsumed: number;
	avgHoursPerStudent: number;
}

export interface DashboardData {
	stats: DashboardStats;
	todos: TodoItem[];
	risks: RiskItem[];
	recentChanges: ChangeItem[];
}
