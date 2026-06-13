import { create } from 'zustand';
import {
  User,
  TrainingNeed,
  Schedule,
  Enrollment,
  TimelineLog,
  TodoItem,
  TodoType,
  TrainingNeedStatus,
  ScheduleStatus,
  EnrollmentStatus,
  Student,
  EnrollmentHistory,
} from '../types';
import {
  users,
  trainingNeeds as initialTrainingNeeds,
  schedules as initialSchedules,
  enrollments as initialEnrollments,
  timelineLogs as initialTimelineLogs,
  instructors,
  getTodosForManager,
  getTodosForDepartment,
  getTodosForInstructor,
} from '../data/mockData';

interface AppState {
  currentUser: User | null;
  trainingNeeds: TrainingNeed[];
  schedules: Schedule[];
  enrollments: Enrollment[];
  timelineLogs: TimelineLog[];
  todos: {
    today: TodoItem[];
    overdue: TodoItem[];
    returned: TodoItem[];
  };

  actions: {
    setCurrentUser: (user: User | null) => void;
    fetchTodos: () => void;
    submitTrainingNeed: (id: string) => void;
    approveTrainingNeed: (id: string) => void;
    rejectTrainingNeed: (id: string, reason: string) => void;
    createSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt'>) => void;
    confirmSchedule: (id: string, confirmed: boolean, reason?: string) => void;
    confirmEnrollment: (id: string, students: Student[]) => void;
    rejectEnrollment: (id: string, reason: string) => void;
    resetEnrollment: (id: string, reason: string) => void;
    addTimelineLog: (log: Omit<TimelineLog, 'id' | 'createdAt'>) => void;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: users[0],
  trainingNeeds: initialTrainingNeeds,
  schedules: initialSchedules,
  enrollments: initialEnrollments,
  timelineLogs: initialTimelineLogs,
  todos: {
    today: [],
    overdue: [],
    returned: [],
  },

  actions: {
    setCurrentUser: (user) => {
      set({ currentUser: user });
      get().actions.fetchTodos();
    },

    fetchTodos: () => {
      const { currentUser } = get();
      if (!currentUser) return;

      let todos;
      switch (currentUser.role) {
        case 'manager':
          todos = getTodosForManager();
          break;
        case 'department':
          todos = getTodosForDepartment(currentUser.departmentId || '');
          break;
        case 'instructor':
          todos = getTodosForInstructor(currentUser.id);
          break;
        default:
          todos = { today: [], overdue: [], returned: [] };
      }
      set({ todos });
    },

    submitTrainingNeed: (id) => {
      const { trainingNeeds, currentUser, timelineLogs } = get();
      const needIndex = trainingNeeds.findIndex((n) => n.id === id);
      if (needIndex === -1) return;

      const updatedNeeds = [...trainingNeeds];
      updatedNeeds[needIndex] = {
        ...updatedNeeds[needIndex],
        status: TrainingNeedStatus.PENDING_REVIEW,
      };

      const newLog: TimelineLog = {
        id: `log-${Date.now()}`,
        entityType: 'training_need',
        entityId: id,
        action: '提交审核',
        fromStatus: TrainingNeedStatus.DRAFT,
        toStatus: TrainingNeedStatus.PENDING_REVIEW,
        operatorId: currentUser?.id || '',
        operatorName: currentUser?.name || '',
        operatorRole: currentUser?.role || 'department',
        createdAt: new Date(),
      };

      set({
        trainingNeeds: updatedNeeds,
        timelineLogs: [...timelineLogs, newLog],
      });
      get().actions.fetchTodos();
    },

    approveTrainingNeed: (id) => {
      const { trainingNeeds, currentUser, timelineLogs } = get();
      const needIndex = trainingNeeds.findIndex((n) => n.id === id);
      if (needIndex === -1) return;

      const now = new Date();
      const updatedNeeds = [...trainingNeeds];
      updatedNeeds[needIndex] = {
        ...updatedNeeds[needIndex],
        status: TrainingNeedStatus.APPROVED,
        reviewedAt: now,
        reviewerId: currentUser?.id,
        reviewerName: currentUser?.name,
      };

      const newLog: TimelineLog = {
        id: `log-${Date.now()}`,
        entityType: 'training_need',
        entityId: id,
        action: '审核通过',
        fromStatus: TrainingNeedStatus.PENDING_REVIEW,
        toStatus: TrainingNeedStatus.APPROVED,
        operatorId: currentUser?.id || '',
        operatorName: currentUser?.name || '',
        operatorRole: currentUser?.role || 'manager',
        createdAt: now,
      };

      set({
        trainingNeeds: updatedNeeds,
        timelineLogs: [...timelineLogs, newLog],
      });
      get().actions.fetchTodos();
    },

    rejectTrainingNeed: (id, reason) => {
      const { trainingNeeds, currentUser, timelineLogs } = get();
      const needIndex = trainingNeeds.findIndex((n) => n.id === id);
      if (needIndex === -1) return;

      const now = new Date();
      const updatedNeeds = [...trainingNeeds];
      updatedNeeds[needIndex] = {
        ...updatedNeeds[needIndex],
        status: TrainingNeedStatus.REJECTED,
        reviewedAt: now,
        reviewerId: currentUser?.id,
        reviewerName: currentUser?.name,
        rejectedReason: reason,
      };

      const newLog: TimelineLog = {
        id: `log-${Date.now()}`,
        entityType: 'training_need',
        entityId: id,
        action: '审核退回',
        fromStatus: TrainingNeedStatus.PENDING_REVIEW,
        toStatus: TrainingNeedStatus.REJECTED,
        operatorId: currentUser?.id || '',
        operatorName: currentUser?.name || '',
        operatorRole: currentUser?.role || 'manager',
        createdAt: now,
        details: { reason },
      };

      set({
        trainingNeeds: updatedNeeds,
        timelineLogs: [...timelineLogs, newLog],
      });
      get().actions.fetchTodos();
    },

    createSchedule: (scheduleData) => {
      const { schedules, currentUser, timelineLogs, trainingNeeds } = get();
      const newSchedule: Schedule = {
        id: `schedule-${Date.now()}`,
        ...scheduleData,
        createdAt: new Date(),
      };

      const needIndex = trainingNeeds.findIndex((n) => n.id === scheduleData.trainingNeedId);
      let updatedNeeds = trainingNeeds;
      if (needIndex !== -1) {
        updatedNeeds = [...trainingNeeds];
        updatedNeeds[needIndex] = {
          ...updatedNeeds[needIndex],
          status: TrainingNeedStatus.SCHEDULED,
        };
      }

      const newLog: TimelineLog = {
        id: `log-${Date.now()}`,
        entityType: 'schedule',
        entityId: newSchedule.id,
        action: '创建排期',
        fromStatus: '',
        toStatus: ScheduleStatus.SCHEDULED,
        operatorId: currentUser?.id || '',
        operatorName: currentUser?.name || '',
        operatorRole: currentUser?.role || 'manager',
        createdAt: new Date(),
      };

      set({
        schedules: [...schedules, newSchedule],
        trainingNeeds: updatedNeeds,
        timelineLogs: [...timelineLogs, newLog],
      });
      get().actions.fetchTodos();
    },

    confirmSchedule: (id, confirmed, reason) => {
      const { schedules, enrollments, currentUser, timelineLogs } = get();
      const scheduleIndex = schedules.findIndex((s) => s.id === id);
      if (scheduleIndex === -1) return;

      const now = new Date();
      const updatedSchedules = [...schedules];
      const schedule = updatedSchedules[scheduleIndex];

      if (confirmed) {
        updatedSchedules[scheduleIndex] = {
          ...schedule,
          status: ScheduleStatus.CONFIRMED,
          confirmedAt: now,
        };

        const newLog: TimelineLog = {
          id: `log-${Date.now()}`,
          entityType: 'schedule',
          entityId: id,
          action: '讲师确认排期',
          fromStatus: ScheduleStatus.SCHEDULED,
          toStatus: ScheduleStatus.CONFIRMED,
          operatorId: currentUser?.id || '',
          operatorName: currentUser?.name || '',
          operatorRole: currentUser?.role || 'instructor',
          createdAt: now,
        };

        const newEnrollments: Enrollment[] = schedule.participantDepartments.map((deptId, index) => {
          const dept = {
            'dept-1': '技术研发部',
            'dept-2': '产品设计部',
            'dept-3': '市场营销部',
            'dept-4': '人力资源部',
          }[deptId] || deptId;

          const deadline = new Date(schedule.startTime);
          deadline.setDate(deadline.getDate() - 2);

          return {
            id: `enroll-${Date.now()}-${index}`,
            scheduleId: id,
            scheduleTitle: schedule.trainingNeedTitle,
            departmentId: deptId,
            departmentName: dept,
            studentList: [],
            status: EnrollmentStatus.PENDING,
            createdAt: now,
            deadline,
          };
        });

        set({
          schedules: updatedSchedules,
          enrollments: [...enrollments, ...newEnrollments],
          timelineLogs: [...timelineLogs, newLog],
        });
      } else {
        updatedSchedules[scheduleIndex] = {
          ...schedule,
          status: ScheduleStatus.REJECTED,
          rejectedReason: reason,
        };

        const newLog: TimelineLog = {
          id: `log-${Date.now()}`,
          entityType: 'schedule',
          entityId: id,
          action: '讲师拒绝排期',
          fromStatus: ScheduleStatus.SCHEDULED,
          toStatus: ScheduleStatus.REJECTED,
          operatorId: currentUser?.id || '',
          operatorName: currentUser?.name || '',
          operatorRole: currentUser?.role || 'instructor',
          createdAt: now,
          details: { reason },
        };

        set({
          schedules: updatedSchedules,
          timelineLogs: [...timelineLogs, newLog],
        });
      }
      get().actions.fetchTodos();
    },

    confirmEnrollment: (id, students) => {
      const { enrollments, currentUser, timelineLogs } = get();
      const enrollmentIndex = enrollments.findIndex((e) => e.id === id);
      if (enrollmentIndex === -1) return;

      const now = new Date();
      const updatedEnrollments = [...enrollments];
      const oldEnrollment = updatedEnrollments[enrollmentIndex];
      
      const historyEntry: EnrollmentHistory = {
        version: (oldEnrollment.history?.length || 0) + 1,
        studentList: oldEnrollment.studentList,
        updatedAt: now,
        updatedBy: currentUser?.name || '',
        status: oldEnrollment.status,
      };

      updatedEnrollments[enrollmentIndex] = {
        ...updatedEnrollments[enrollmentIndex],
        status: EnrollmentStatus.CONFIRMED,
        studentList: students,
        confirmedAt: now,
        history: [...(oldEnrollment.history || []), historyEntry],
      };

      const newLog: TimelineLog = {
        id: `log-${Date.now()}`,
        entityType: 'enrollment',
        entityId: id,
        action: '部门确认学员名单',
        fromStatus: EnrollmentStatus.PENDING,
        toStatus: EnrollmentStatus.CONFIRMED,
        operatorId: currentUser?.id || '',
        operatorName: currentUser?.name || '',
        operatorRole: currentUser?.role || 'department',
        createdAt: now,
        details: { studentCount: students.length },
      };

      set({
        enrollments: updatedEnrollments,
        timelineLogs: [...timelineLogs, newLog],
      });
      get().actions.fetchTodos();
    },

    rejectEnrollment: (id, reason) => {
      const { enrollments, currentUser, timelineLogs } = get();
      const enrollmentIndex = enrollments.findIndex((e) => e.id === id);
      if (enrollmentIndex === -1) return;

      const now = new Date();
      const updatedEnrollments = [...enrollments];
      updatedEnrollments[enrollmentIndex] = {
        ...updatedEnrollments[enrollmentIndex],
        status: EnrollmentStatus.REJECTED,
        rejectedReason: reason,
        returnedAt: now,
      };

      const newLog: TimelineLog = {
        id: `log-${Date.now()}`,
        entityType: 'enrollment',
        entityId: id,
        action: '部门退回报名',
        fromStatus: EnrollmentStatus.PENDING,
        toStatus: EnrollmentStatus.REJECTED,
        operatorId: currentUser?.id || '',
        operatorName: currentUser?.name || '',
        operatorRole: currentUser?.role || 'department',
        createdAt: now,
        details: { reason },
      };

      set({
        enrollments: updatedEnrollments,
        timelineLogs: [...timelineLogs, newLog],
      });
      get().actions.fetchTodos();
    },

    resetEnrollment: (id, reason) => {
      const { enrollments, currentUser, timelineLogs } = get();
      const enrollmentIndex = enrollments.findIndex((e) => e.id === id);
      if (enrollmentIndex === -1) return;

      const now = new Date();
      const updatedEnrollments = [...enrollments];
      const oldEnrollment = updatedEnrollments[enrollmentIndex];
      const oldStatus = oldEnrollment.status;

      const historyEntry: EnrollmentHistory = {
        version: (oldEnrollment.history?.length || 0) + 1,
        studentList: oldEnrollment.studentList,
        updatedAt: now,
        updatedBy: currentUser?.name || '',
        status: oldStatus,
      };

      updatedEnrollments[enrollmentIndex] = {
        ...updatedEnrollments[enrollmentIndex],
        status: EnrollmentStatus.PENDING,
        studentList: [],
        history: [...(oldEnrollment.history || []), historyEntry],
      };

      const newLog: TimelineLog = {
        id: `log-${Date.now()}`,
        entityType: 'enrollment',
        entityId: id,
        action: '重置报名数据',
        fromStatus: oldStatus,
        toStatus: EnrollmentStatus.PENDING,
        operatorId: currentUser?.id || '',
        operatorName: currentUser?.name || '',
        operatorRole: currentUser?.role || 'manager',
        createdAt: now,
        details: { reason },
      };

      set({
        enrollments: updatedEnrollments,
        timelineLogs: [...timelineLogs, newLog],
      });
      get().actions.fetchTodos();
    },

    addTimelineLog: (log) => {
      const { timelineLogs } = get();
      const newLog: TimelineLog = {
        ...log,
        id: `log-${Date.now()}`,
        createdAt: new Date(),
      };
      set({ timelineLogs: [...timelineLogs, newLog] });
    },
  },
}));