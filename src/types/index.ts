export interface Student {
  id: string;
  name: string;
  avatar: string;
  className: string;
  level: string;
  costumeSize: string;
  examLevel: string;
  remainingClasses: number;
  totalClasses: number;
  joinDate: string;
  phone: string;
  parentName: string;
  gender: 'male' | 'female';
  age: number;
}

export type FeedbackStatus = 'pending' | 'processing' | 'resolved';
export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'poor';

export interface ClassFeedback {
  id: string;
  studentId: string;
  date: string;
  className: string;
  teacher: string;
  content: string;
  performance: PerformanceLevel;
  tags: string[];
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  handledBy?: string;
  handleNote?: string;
}

export type RenewalStatus = 'pending' | 'contacted' | 'negotiating' | 'signed' | 'lost';
export type RiskLevel = 'low' | 'medium' | 'high';
export type FollowUpMethod = 'phone' | 'wechat' | 'in_person' | 'other';

export interface FollowUpRecord {
  id: string;
  date: string;
  operator: string;
  method: FollowUpMethod;
  content: string;
  nextFollowUpDate?: string;
}

export interface RenewalFollowUp {
  id: string;
  studentId: string;
  expirationDate: string;
  remainingDays: number;
  packageType: string;
  packagePrice: number;
  status: RenewalStatus;
  followUpRecords: FollowUpRecord[];
  riskLevel: RiskLevel;
  keyInsights: string[];
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
}

export type LogType = 'feedback' | 'renewal' | 'student' | 'exception' | 'system';

export interface OperationLog {
  id: string;
  type: LogType;
  targetId: string;
  targetName: string;
  action: string;
  operator: string;
  timestamp: string;
  details: string;
}

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

export const RENEWAL_STATUS_LABEL: Record<RenewalStatus, string> = {
  pending: '待跟进',
  contacted: '已联系',
  negotiating: '洽谈中',
  signed: '已续费',
  lost: '已流失',
};

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export const PERFORMANCE_LABEL: Record<PerformanceLevel, string> = {
  excellent: '优秀',
  good: '良好',
  average: '一般',
  poor: '待提升',
};

export const FOLLOW_UP_METHOD_LABEL: Record<FollowUpMethod, string> = {
  phone: '电话',
  wechat: '微信',
  in_person: '当面',
  other: '其他',
};

export type ExceptionType = 'exam' | 'costume' | 'schedule' | 'other';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved';
export type ExceptionPriority = 'low' | 'medium' | 'high';

export interface ExceptionRecord {
  id: string;
  type: ExceptionType;
  title: string;
  description: string;
  studentId?: string;
  className?: string;
  priority: ExceptionPriority;
  status: ExceptionStatus;
  reportedBy: string;
  reportedAt: string;
  handledBy?: string;
  handleNote?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const EXCEPTION_TYPE_LABEL: Record<ExceptionType, string> = {
  exam: '考级相关',
  costume: '服装相关',
  schedule: '调课考勤',
  other: '其他异常',
};

export const EXCEPTION_STATUS_LABEL: Record<ExceptionStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

export const EXCEPTION_PRIORITY_LABEL: Record<ExceptionPriority, string> = {
  low: '低优先级',
  medium: '中优先级',
  high: '高优先级',
};
