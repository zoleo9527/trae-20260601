export type Role = 'pm' | 'captain' | 'engineer'
export type TestStatus = 'pending' | 'in_progress' | 'passed' | 'failed'
export type IssueStatus = 'pending_assign' | 'in_progress' | 'pending_verify' | 'closed'
export type Severity = 'critical' | 'major' | 'minor'
export type ActionType = 'assign' | 'progress' | 'complete' | 'verify' | 'reject'

export interface Project {
  id: string
  name: string
  location: string
  status: string
}

export interface TestItem {
  id: string
  test_id: string
  name: string
  expected_result: string
  actual_result: string | null
  passed: boolean | null
  remark: string
  sort_order: number
}

export interface JointTest {
  id: string
  project_id: string
  title: string
  status: TestStatus
  executor: string
  planned_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
  items?: TestItem[]
  project?: Project
  project_name?: string
  logs?: OperationLog[]
}

export interface Issue {
  id: string
  test_id: string | null
  test_item_id: string | null
  project_id: string
  title: string
  severity: Severity
  status: IssueStatus
  assignee: string | null
  description: string
  created_at: string
  updated_at: string
  closed_at: string | null
  progresses?: IssueProgress[]
  project?: Project
  project_name?: string
  sourceTest?: JointTest
  sourceItem?: TestItem
  test_title?: string
  logs?: OperationLog[]
}

export interface IssueProgress {
  id: string
  issue_id: string
  description: string
  operator: string
  action_type: ActionType
  created_at: string
}

export interface OperationLog {
  id: string
  entity_type: 'test' | 'issue'
  entity_id: string
  action: string
  operator_role: Role
  operator_name: string
  detail: string | null
  created_at: string
  entityInfo?: { type: string; title: string } | null
}

export interface StatsData {
  pendingTests: number
  failedTests: number
  pendingIssues: number
  pendingVerifyIssues: number
  recentActivities: OperationLog[]
}

export interface TestListQuery {
  status?: TestStatus
  project?: string
  date_from?: string
  date_to?: string
}

export interface IssueListQuery {
  status?: IssueStatus
  assignee?: string
  severity?: Severity
}

export interface LogListQuery {
  entity_type?: 'test' | 'issue'
  entity_id?: string
}

export interface CreateTestRequest {
  project_id: string
  title: string
  executor?: string
  planned_at?: string
  items?: Array<{
    name: string
    expected_result?: string
  }>
}

export interface ExecuteTestItemRequest {
  testItemId: string
  passed: boolean
  remark?: string
}

export interface ConvertToIssueRequest {
  failedItemIds: string[]
}

export interface CreateIssueRequest {
  test_id?: string
  test_item_id?: string
  project_id: string
  title: string
  severity: Severity
  description?: string
  assignee?: string
}

export interface AssignIssueRequest {
  assignee: string
}

export interface ProgressIssueRequest {
  description: string
}

export interface VerifyIssueRequest {
  passed: boolean
  remark?: string
}

export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  error?: string
}

export interface RoleInfo {
  role: Role
  name: string
}
