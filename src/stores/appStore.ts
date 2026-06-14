import { create } from 'zustand';
import type { User, Student, Notification, Archive, Training, Exam, OperationLog } from '@/types';
import { db } from '@/services/database';

interface AppState {
  currentUser: User | null;
  users: User[];
  students: Student[];
  notifications: Notification[];
  isLoading: boolean;

  setCurrentUser: (userId: string) => void;
  loadUsers: () => void;
  loadStudents: (filters?: { status?: string[]; consultantId?: string; keyword?: string }) => void;
  loadNotifications: () => void;

  getStudentById: (id: string) => Student | undefined;
  getArchiveByStudentId: (studentId: string) => Archive | undefined;
  getTrainingByStudentId: (studentId: string) => Training | undefined;
  getExamsByStudentId: (studentId: string) => Exam[];
  getLogsByStudentId: (studentId: string) => OperationLog[];

  createStudent: (data: Omit<Student, 'id' | 'studentNo' | 'createdAt' | 'updatedAt'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>, reason?: string) => { student: Student; logs: OperationLog[] };
  getAssignedStudents: (coachId: string) => (Student & { training?: Training })[];
  updateTrainingProgress: (studentId: string, updates: Partial<Training>, notes?: string) => Training;
  scheduleExam: (data: Omit<Exam, 'id' | 'createdAt'>) => Exam;
  recordExamResult: (examId: string, result: 'PASSED' | 'FAILED', absenceReason?: string) => Exam;
  getExams: (filters?: { studentId?: string; examStatus?: string[]; examSubject?: string }) => Exam[];
  getAllLogs: (filters?: { operatorId?: string; operationType?: string[] }) => OperationLog[];
  getDashboardStats: () => ReturnType<typeof db.getDashboardStats>;
  markNotificationAsRead: (id: string) => void;
  confirmNotification: (id: string) => void;
  getUnreadNotificationCount: () => number;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  students: [],
  notifications: [],
  isLoading: false,

  setCurrentUser: (userId: string) => {
    db.setCurrentUser(userId);
    set({ currentUser: db.getCurrentUser() });
    get().loadNotifications();
  },

  loadUsers: () => {
    set({ users: db.getUsers() });
  },

  loadStudents: (filters) => {
    set({ students: db.getStudents(filters) });
  },

  loadNotifications: () => {
    const { currentUser } = get();
    if (currentUser) {
      set({ notifications: db.getNotifications(currentUser.id) });
    }
  },

  getStudentById: (id: string) => {
    return db.getStudentById(id);
  },

  getArchiveByStudentId: (studentId: string) => {
    return db.getArchiveByStudentId(studentId);
  },

  getTrainingByStudentId: (studentId: string) => {
    return db.getTrainingByStudentId(studentId);
  },

  getExamsByStudentId: (studentId: string) => {
    return db.getExamsByStudentId(studentId);
  },

  getLogsByStudentId: (studentId: string) => {
    return db.getLogsByStudentId(studentId);
  },

  createStudent: (data) => {
    const student = db.createStudent(data);
    get().loadStudents();
    return student;
  },

  updateStudent: (id, updates, reason) => {
    const result = db.updateStudent(id, updates, reason);
    get().loadStudents();
    get().loadNotifications();
    return result;
  },

  getAssignedStudents: (coachId) => {
    return db.getAssignedStudents(coachId);
  },

  updateTrainingProgress: (studentId, updates, notes) => {
    const training = db.updateTrainingProgress(studentId, updates, notes);
    get().loadStudents();
    return training;
  },

  scheduleExam: (data) => {
    const exam = db.scheduleExam(data);
    get().loadStudents();
    return exam;
  },

  recordExamResult: (examId, result, absenceReason) => {
    const exam = db.recordExamResult(examId, result, absenceReason);
    get().loadStudents();
    return exam;
  },

  getExams: (filters) => {
    return db.getExams(filters);
  },

  getAllLogs: (filters) => {
    return db.getAllLogs(filters);
  },

  getDashboardStats: () => {
    return db.getDashboardStats();
  },

  markNotificationAsRead: (id: string) => {
    db.markNotificationAsRead(id);
    get().loadNotifications();
  },

  confirmNotification: (id: string) => {
    db.confirmNotification(id);
    get().loadNotifications();
  },

  getUnreadNotificationCount: () => {
    const { currentUser } = get();
    if (!currentUser) return 0;
    return db.getUnreadNotificationCount(currentUser.id);
  },
}));
