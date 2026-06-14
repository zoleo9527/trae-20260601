export type Role = 'dispatcher' | 'inspector' | 'auditor' | 'admin';

export type VehicleStatus = 
  | '待检测'
  | '检测中'
  | '待审核'
  | '待发放'
  | '发放中'
  | '已发放'
  | '已完成';

export type InspectionType = '初检' | '复检' | '变更';

export type TaskStatus = '待执行' | '进行中' | '已完成' | '已驳回';

export type ReportStatus = '待审核' | '已通过' | '已驳回';

export type InspectionConclusion = '合格' | '不合格' | '需复检';

export type DistributionStatus = '待发放' | '发放中' | '已发放' | '发放异常';

export type FollowupStatus = '待回访' | '回访中' | '已完成' | '无法联系';

export type ContactResult = '成功' | '无人接听' | '号码错误' | '拒绝回访';

export type SatisfactionLevel = '非常满意' | '满意' | '基本满意' | '一般' | '不满意';

export type InspectionResult = '合格' | '不合格' | '不适用';

export interface Vehicle {
  id: string;
  plateNumber: string;
  ownerName: string;
  ownerPhone: string;
  ownerIdCard: string;
  brand: string;
  model: string;
  vinCode: string;
  registerDate: string;
  inspectionType: InspectionType;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionTask {
  id: string;
  vehicleId: string;
  inspectorId: string;
  inspectorName: string;
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
  reportId?: string;
  createdAt: string;
}

export interface InspectionItem {
  id: string;
  name: string;
  result: InspectionResult;
  remark?: string;
  photo?: string;
}

export interface InspectionReport {
  id: string;
  vehicleId: string;
  taskId: string;
  inspectorName: string;
  auditorId?: string;
  auditorName?: string;
  status: ReportStatus;
  rejectReason?: string;
  items: InspectionItem[];
  conclusion: InspectionConclusion;
  photos: string[];
  remark?: string;
  submittedAt?: string;
  auditedAt?: string;
  distributedAt?: string;
  createdAt: string;
}

export interface ReportDistribution {
  id: string;
  reportId: string;
  vehicleId: string;
  status: DistributionStatus;
  sentAt?: string;
  confirmedAt?: string;
  followupTaskId?: string;
  createdAt: string;
}

export interface FollowupRecord {
  id: string;
  taskId: string;
  type: '首次联系' | '催促' | '回访';
  contactResult: ContactResult;
  reportReceived: boolean;
  serviceSatisfaction: SatisfactionLevel;
  processSatisfaction: '满意' | '基本满意' | '不满意';
  feedback?: string;
  operator: string;
  operatedAt: string;
}

export interface FollowupResult {
  reportReceived: boolean;
  serviceSatisfaction: SatisfactionLevel;
  processSatisfaction: '满意' | '基本满意' | '不满意';
  feedback: string;
  conclusion: string;
  completedAt: string;
}

export interface FollowupTask {
  id: string;
  distributionId: string;
  reportId: string;
  vehicleId: string;
  ownerName: string;
  ownerPhone: string;
  status: FollowupStatus;
  deadline: string;
  attempts: number;
  result?: FollowupResult;
  followupRecords: FollowupRecord[];
  createdAt: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon: string;
}
