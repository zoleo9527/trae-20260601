export type UserRole = 'roaster' | 'cupper' | 'cs';

export interface User {
	id: number;
	username: string;
	role: UserRole;
	display_name: string;
}

export interface GreenBean {
	id: number;
	batch_no: string;
	name: string;
	origin: string;
	variety: string;
	process: string;
	weight_kg: number;
	remaining_kg: number;
	bag_count: number;
	supplier: string;
	contract_no: string;
	arrival_date: string;
	warehouse_location: string;
	moisture_content: number | null;
	density: number | null;
	screen_size: string | null;
	notes: string | null;
	status: 'pending_inspection' | 'inspected' | 'stored' | 'exception';
	created_by: number;
	created_at: string;
	updated_at: string;
}

export interface RoastingPlan {
	id: number;
	plan_no: string;
	green_bean_id: number;
	plan_date: string;
	target_roast_level: string;
	batch_size_kg: number;
	expected_output_kg: number;
	priority: 'low' | 'normal' | 'high' | 'urgent';
	status: 'planned' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
	assigned_roaster: number | null;
	notes: string | null;
	created_by: number;
	created_at: string;
	updated_at: string;
}

export interface RoastBatch {
	id: number;
	batch_no: string;
	roasting_plan_id: number;
	green_bean_id: number;
	roaster_id: number;
	actual_roast_level: string;
	start_time: string;
	end_time: string | null;
	input_weight_kg: number;
	output_weight_kg: number | null;
	notes: string | null;
	created_at: string;
}

export interface CuppingRecord {
	id: number;
	roast_batch_id: number;
	cupper_id: number;
	aroma_score: number;
	flavor_score: number;
	aftertaste_score: number;
	acidity_score: number;
	body_score: number;
	balance_score: number;
	overall_score: number;
	notes: string | null;
	created_at: string;
}

export interface Exception {
	id: number;
	entity_type: 'green_bean' | 'roasting_plan' | 'roast_batch';
	entity_id: number;
	severity: 'low' | 'medium' | 'high' | 'critical';
	title: string;
	description: string;
	resolution: string | null;
	status: 'open' | 'in_progress' | 'resolved' | 'closed';
	handler_id: number | null;
	created_by: number;
	created_at: string;
	resolved_at: string | null;
}

export interface TimelineEvent {
	id: number;
	entity_type: string;
	entity_id: number;
	event_type: string;
	description: string;
	created_by: number | null;
	created_at: string;
	creator_name?: string;
}
