export interface User {
	id: number;
	username: string;
	password: string;
	role: 'tax_advisor' | 'project_manager' | 'client_finance';
	name: string;
	email: string | null;
	created_at: string;
}

export interface RiskAlert {
	id: number;
	code: string;
	title: string;
	type: 'policy_dispute' | 'draft_version_chaos' | 'response_unsigned' | 'missing_docs' | 'deadline_risk' | 'system_error';
	severity: 'high' | 'medium' | 'low';
	status: 'pending' | 'processing' | 'confirming' | 'completed' | 'closed';
	assignee_id: number | null;
	creator_id: number | null;
	related_type: 'consult' | 'policy' | 'draft' | null;
	related_id: string | null;
	reject_reason: string | null;
	supplement_note: string | null;
	due_date: string | null;
	created_at: string;
	updated_at: string;
}

export interface TodoItem {
	id: number;
	risk_alert_id: number | null;
	user_id: number | null;
	todo_type: 'risk_process' | 'review_confirm' | 'sign_receive' | 'supplement_docs' | 'follow_up';
	status: 'pending' | 'processing' | 'completed';
	priority: 'high' | 'medium' | 'low' | null;
	created_at: string;
	updated_at: string;
}

export interface FollowUp {
	id: number;
	risk_alert_id: number;
	follow_date: string;
	result: 'resolved' | 'pending' | 'escalated';
	note: string | null;
	created_at: string;
}

export interface OperationLog {
	id: number;
	risk_alert_id: number | null;
	user_id: number | null;
	action: string;
	description: string | null;
	old_value: string | null;
	new_value: string | null;
	created_at: string;
}

export interface RiskAlertDetail {
	riskAlert: RiskAlert;
	todos: TodoItem[];
	followUps: FollowUp[];
	operationLogs: OperationLog[];
	assignee: User | null;
	creator: User | null;
}

export interface DashboardStats {
	total: number;
	pending: number;
	processing: number;
	confirming: number;
	completed: number;
	closed: number;
	bySeverity: { high: number; medium: number; low: number };
	byType: Record<string, number>;
}