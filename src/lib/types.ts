export type UserRole = 'store_clerk' | 'equipment_manager' | 'finance';

export interface User {
	id: number;
	username: string;
	name: string;
	role: UserRole;
	created_at: string;
}

export type DeliveryStatus =
	| 'PENDING_RETURN'
	| 'RETURNED'
	| 'DAMAGE_IDENTIFIED'
	| 'MATERIALS_MISSING'
	| 'PENDING_REVIEW'
	| 'REVIEW_REJECTED'
	| 'REPAIR_PENDING'
	| 'REPAIR_IN_PROGRESS'
	| 'REPAIR_COMPLETED'
	| 'FINANCIAL_CONFIRMED'
	| 'OVERDUE'
	| 'CLOSED';

export interface Delivery {
	id: number;
	delivery_no: string;
	customer_name: string;
	customer_phone: string | null;
	equipment_name: string;
	equipment_model: string | null;
	serial_no: string | null;
	rental_start_date: string;
	expected_return_date: string;
	actual_return_date: string | null;
	deposit_amount: number;
	rental_fee: number;
	status: DeliveryStatus;
	display_status: DeliveryStatus;
	created_at: string;
	updated_at: string;
}

export type DamageSeverity = 'minor' | 'moderate' | 'severe';
export type DamageStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface DamageReport {
	id: number;
	delivery_id: number;
	reported_by: number;
	damage_type: string;
	description: string;
	severity: DamageSeverity;
	estimated_cost: number | null;
	materials_provided: string | null;
	materials_missing: string | null;
	photos: string | null;
	status: DamageStatus | 'REVIEW_REJECTED';
	reviewed_by: number | null;
	review_comment: string | null;
	reviewed_at: string | null;
	created_at: string;
	reporter?: User;
	reviewer?: User;
	repair_followups?: RepairFollowup[];
}

export type RepairStatus = 'PENDING' | 'IN_PROGRESS' | 'REPAIR_COMPLETED' | 'CANCELLED';

export interface RepairFollowup {
	id: number;
	damage_report_id: number;
	assigned_to: number;
	repair_type: string | null;
	repair_description: string | null;
	actual_cost: number | null;
	repair_status: RepairStatus;
	repair_start_date: string | null;
	repair_complete_date: string | null;
	repair_notes: string | null;
	created_by: number;
	created_at: string;
	updated_at: string;
	assignee?: User;
	creator?: User;
}

export interface StatusLog {
	id: number;
	delivery_id: number;
	old_status: DeliveryStatus | null;
	new_status: DeliveryStatus;
	changed_by: number;
	change_reason: string | null;
	created_at: string;
	changer?: User;
}

export interface Payment {
	id: number;
	delivery_id: number;
	amount: number;
	payment_type: string;
	confirmed_by: number;
	confirmed_at: string;
	notes: string | null;
	confirmer?: User;
}

export interface DeliveryDetail extends Delivery {
	damage_reports: DamageReport[];
	status_logs: StatusLog[];
	payments: Payment[];
}

export interface TimelineEvent {
	id: string;
	type: 'status' | 'damage' | 'repair' | 'payment';
	title: string;
	description: string;
	operator: string;
	operator_role: string;
	timestamp: string;
	metadata?: Record<string, unknown>;
}

export interface ResponsibilityInfo {
	role: UserRole;
	roleLabel: string;
	nextAction: string;
	overdueReason?: string;
}

export const STATUS_RESPONSIBILITY: Record<DeliveryStatus, ResponsibilityInfo> = {
	PENDING_RETURN: {
		role: 'store_clerk',
		roleLabel: '门店店员',
		nextAction: '等待客户归还器材'
	},
	RETURNED: {
		role: 'store_clerk',
		roleLabel: '门店店员',
		nextAction: '检查归还器材，如有损坏提交鉴定'
	},
	DAMAGE_IDENTIFIED: {
		role: 'equipment_manager',
		roleLabel: '器材管理员',
		nextAction: '复核损坏鉴定报告'
	},
	MATERIALS_MISSING: {
		role: 'equipment_manager',
		roleLabel: '器材管理员',
		nextAction: '复核损坏鉴定（含缺材料登记）'
	},
	PENDING_REVIEW: {
		role: 'equipment_manager',
		roleLabel: '器材管理员',
		nextAction: '复核损坏鉴定报告'
	},
	REVIEW_REJECTED: {
		role: 'store_clerk',
		roleLabel: '门店店员',
		nextAction: '重新提交损坏鉴定',
		overdueReason: '复核不通过，需门店店员补充鉴定信息后重新提交'
	},
	REPAIR_PENDING: {
		role: 'equipment_manager',
		roleLabel: '器材管理员',
		nextAction: '安排维修并指定负责人'
	},
	REPAIR_IN_PROGRESS: {
		role: 'equipment_manager',
		roleLabel: '器材管理员',
		nextAction: '跟进维修进度，完成后更新状态'
	},
	REPAIR_COMPLETED: {
		role: 'finance',
		roleLabel: '财务',
		nextAction: '确认维修费用并完成财务结算'
	},
	FINANCIAL_CONFIRMED: {
		role: 'store_clerk',
		roleLabel: '门店店员',
		nextAction: '确认所有事项完成后结案'
	},
	OVERDUE: {
		role: 'finance',
		roleLabel: '财务',
		nextAction: '确认费用并完成结算',
		overdueReason: '器材逾期未还，需财务介入结算逾期费用'
	},
	CLOSED: {
		role: 'store_clerk',
		roleLabel: '门店店员',
		nextAction: '已结案，无需操作'
	}
};

export const ROLE_COLORS: Record<UserRole, string> = {
	store_clerk: 'bg-blue-100 text-blue-800 border-blue-200',
	equipment_manager: 'bg-purple-100 text-purple-800 border-purple-200',
	finance: 'bg-green-100 text-green-800 border-green-200'
};

export const ROLE_ICONS: Record<UserRole, string> = {
	store_clerk: '👤',
	equipment_manager: '🔧',
	finance: '💰'
};

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
	PENDING_RETURN: '待归还',
	RETURNED: '已归还',
	DAMAGE_IDENTIFIED: '损坏待鉴定',
	MATERIALS_MISSING: '缺材料',
	PENDING_REVIEW: '待复核',
	REVIEW_REJECTED: '复核不通过',
	REPAIR_PENDING: '待维修',
	REPAIR_IN_PROGRESS: '维修中',
	REPAIR_COMPLETED: '维修完成',
	FINANCIAL_CONFIRMED: '财务已确认',
	OVERDUE: '超时',
	CLOSED: '已结案'
};

export const STATUS_COLORS: Record<DeliveryStatus, string> = {
	PENDING_RETURN: 'bg-gray-100 text-gray-800',
	RETURNED: 'bg-green-100 text-green-800',
	DAMAGE_IDENTIFIED: 'bg-yellow-100 text-yellow-800',
	MATERIALS_MISSING: 'bg-red-100 text-red-800',
	PENDING_REVIEW: 'bg-blue-100 text-blue-800',
	REVIEW_REJECTED: 'bg-red-100 text-red-800',
	REPAIR_PENDING: 'bg-orange-100 text-orange-800',
	REPAIR_IN_PROGRESS: 'bg-purple-100 text-purple-800',
	REPAIR_COMPLETED: 'bg-teal-100 text-teal-800',
	FINANCIAL_CONFIRMED: 'bg-indigo-100 text-indigo-800',
	OVERDUE: 'bg-red-200 text-red-900',
	CLOSED: 'bg-gray-200 text-gray-800'
};

export const ROLE_LABELS: Record<UserRole, string> = {
	store_clerk: '门店店员',
	equipment_manager: '器材管理员',
	finance: '财务'
};

export const SEVERITY_LABELS: Record<DamageSeverity, string> = {
	minor: '轻微',
	moderate: '中等',
	severe: '严重'
};

export const DAMAGE_STATUS_LABELS: Record<string, string> = {
	PENDING_REVIEW: '待复核',
	APPROVED: '鉴定通过',
	REJECTED: '鉴定驳回',
	REVIEW_REJECTED: '复核不通过'
};

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
	PENDING: '待开始',
	IN_PROGRESS: '进行中',
	REPAIR_COMPLETED: '已完成',
	CANCELLED: '已取消'
};
