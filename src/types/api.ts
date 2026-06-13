export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'trainer_manager' | 'department_head' | 'instructor' | 'trainee';
  department: string;
  avatar?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  instructor?: User;
  createdBy?: User;
  enrollments?: Enrollment[];
  _count?: {
    enrollments: number;
  };
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  attendanceStatus: 'pending' | 'signed' | 'late' | 'leave' | 'absent';
  certificateStatus: 'none' | 'pending' | 'issued';
  notes?: string;
  user?: User;
}

export interface Attendance {
  id: string;
  enrollmentId: string;
  courseId: string;
  userId: string;
  signInTime?: string;
  status: 'signed' | 'late' | 'leave' | 'absent';
  notes?: string;
  exceptionId?: string;
  exception?: Exception;
}

export interface Exception {
  id: string;
  type: 'attendance' | 'exam' | 'homework' | 'other';
  relatedType: string;
  relatedId: string;
  userId: string;
  description: string;
  adminNotes?: string;
  status: 'pending' | 'processing' | 'processed' | 'archived';
  solution?: string;
  attachments?: string[];
  createdAt: string;
  processedAt?: string;
  archivedAt?: string;
  user?: User;
  operatedBy?: User;
}

export interface Homework {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  deadline: string;
  attachments?: string[];
  totalScore: number;
  status: 'draft' | 'published' | 'closed';
  createdById: string;
  createdAt: string;
  submissions?: HomeworkSubmission[];
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  userId: string;
  submittedAt: string;
  score?: number;
  status: 'pending' | 'submitted' | 'late' | 'graded';
  attachments?: string[];
  gradeNotes?: string;
  versionNumber: number;
  isLatest: boolean;
  gradedById?: string;
  gradedAt?: string;
  gradedBy?: User;
  user?: User;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  duration: number;
  passingScore: number;
  totalScore: number;
  startTime: string;
  endTime: string;
  questionIds?: string[];
  status: 'draft' | 'published' | 'ongoing' | 'grading' | 'published' | 'archived';
  createdById: string;
  createdAt: string;
  examScores?: ExamScore[];
}

export interface ExamScore {
  id: string;
  examId: string;
  userId: string;
  score?: number;
  status: 'pending' | 'grading' | 'graded' | 'published';
  answerSheetUrl?: string;
  notes?: string;
  gradedById?: string;
  gradedAt?: string;
  gradedBy?: User;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content?: string;
  channel: 'in_app' | 'email' | 'wechat' | 'dingtalk';
  status: 'pending' | 'sent' | 'read';
  sentAt?: string;
  readAt?: string;
  metadata?: string;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  module: string;
  action: string;
  relatedType?: string;
  relatedId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: User;
}
