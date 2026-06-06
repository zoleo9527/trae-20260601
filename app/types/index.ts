export type UserRole = "teacher" | "consultant" | "director" | "parent";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  parentId: string;
  parentName: string;
  parentPhone: string;
  classId: string;
  className: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  coverColor: string;
}

export interface ArtworkImage {
  id: string;
  url: string;
  thumbnail?: string;
  isPlaceholder: boolean;
}

export interface ReviewTemplateSection {
  id: string;
  title: string;
  placeholder: string;
  required: boolean;
}

export interface ReviewTemplate {
  id: string;
  name: string;
  courseType: string;
  sections: ReviewTemplateSection[];
}

export interface ReviewSectionAnswer {
  sectionId: string;
  content: string;
}

export type FeedbackStatus = 
  | "parent_unread" 
  | "parent_read" 
  | "parent_replied" 
  | "consultant_following" 
  | "resolved" 
  | "pending_makeup";

export type FeedbackType = 
  | "general" 
  | "praise" 
  | "question" 
  | "suggestion" 
  | "complaint" 
  | "class_change" 
  | "teacher_change"
  | "suspension" 
  | "makeup_required";

export interface Review {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  templateId: string;
  templateName: string;
  classDate: string;
  classTime: string;
  artworkImages: ArtworkImage[];
  highlights: string;
  improvements: string;
  observation: string;
  nextPractice: string;
  answers: ReviewSectionAnswer[];
  feedbackStatus: FeedbackStatus;
  feedbackType?: FeedbackType;
  createdAt: string;
  updatedAt: string;
}

export interface ParentFeedback {
  id: string;
  reviewId: string;
  parentId: string;
  parentName: string;
  content: string;
  type: FeedbackType;
  createdAt: string;
  hasTodo: boolean;
  todoId?: string;
}

export interface FollowUpRecord {
  id: string;
  reviewId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  type: "class_change" | "teacher_change" | "suspension" | "complaint" | "makeup" | "other";
  reviewId: string;
  studentName: string;
  parentName: string;
  feedbackId: string;
  status: "pending" | "in_progress" | "completed";
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  dueDate?: string;
}
