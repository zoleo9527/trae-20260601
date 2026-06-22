export type Role = 'pm' | 'captain' | 'engineer'
export type TestStatus = 'pending' | 'in_progress' | 'passed' | 'failed'
export type IssueStatus = 'pending_assign' | 'in_progress' | 'pending_verify' | 'closed'
export type Severity = 'critical' | 'major' | 'minor'
export type ActionType = 'assign' | 'progress' | 'complete' | 'verify' | 'reject'

export interface Project { id: string; name: string; location: string; status: string }
export interface TestItem { id: string; test_id: string; name: string; expected_result: string; actual_result: string | null; passed: boolean | null; remark: string; sort_order: number }
export interface JointTest { id: string; project_id: string; title: string; status: TestStatus; executor: string; planned_at: string; completed_at: string | null; created_at: string; updated_at: string; items?: TestItem[]; project?: Project }
export interface Issue { id: string; test_id: string | null; test_item_id: string | null; project_id: string; title: string; severity: Severity; status: IssueStatus; assignee: string | null; description: string; created_at: string; updated_at: string; closed_at: string | null; progresses?: IssueProgress[]; project?: Project; sourceTest?: JointTest; sourceItem?: TestItem }
export interface IssueProgress { id: string; issue_id: string; description: string; operator: string; action_type: ActionType; created_at: string }
export interface OperationLog { id: string; entity_type: 'test' | 'issue'; entity_id: string; action: string; operator_role: Role; operator_name: string; detail: string | null; created_at: string }
