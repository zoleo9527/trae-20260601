export type Role = '教务老师' | '任课老师' | '家长顾问';

export type PracticeStatus = '待处理' | '已确认' | '已退回' | '已完成';

export type ReviewStatus = '待点评' | '已点评' | '待确认' | '已完成';

export interface Student {
  id: string;
  name: string;
  avatar?: string;
  age: number;
  instrument: string;
  level: string;
  parentPhone: string;
}

export interface PracticeRecord {
  id: string;
  studentId: string;
  studentName: string;
  instrument: string;
  practiceDate: string;
  duration: number;
  content: string;
  note: string;
  status: PracticeStatus;
  createdAt: string;
  updatedAt: string;
  handledBy?: string;
  reviewId?: string;
}

export interface StageReview {
  id: string;
  studentId: string;
  studentName: string;
  instrument: string;
  stage: string;
  startDate: string;
  endDate: string;
  overallEvaluation: string;
  skillsEvaluation: {
    technique: number;
    expression: number;
    rhythm: number;
    progress: number;
  };
  improvementSuggestions: string;
  nextStageGoals: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  relatedPracticeNotes: string[];
  reviewedBy?: string;
  confirmedBy?: string;
}

export interface FilterOptions {
  role: Role;
  studentName?: string;
  instrument?: string;
  status?: PracticeStatus | ReviewStatus;
  dateRange?: { start: string; end: string };
}

export interface DashboardStats {
  todayPending: number;
  overdueCount: number;
  returnedCount: number;
  totalStudents: number;
}
