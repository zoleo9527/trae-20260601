import {
  User,
  TrainingNeed,
  TrainingNeedStatus,
  Instructor,
  Schedule,
  ScheduleStatus,
  Enrollment,
  EnrollmentStatus,
  Student,
  Department,
  TimelineLog
} from '../types';

export const departments: Department[] = [
  { id: 'dept-1', name: '技术研发部', managerId: 'user-dept-1', managerName: '王部门' },
  { id: 'dept-2', name: '产品设计部', managerId: 'user-dept-2', managerName: '李部门' },
  { id: 'dept-3', name: '市场营销部', managerId: 'user-dept-3', managerName: '张部门' },
  { id: 'dept-4', name: '人力资源部', managerId: 'user-dept-4', managerName: '赵部门' },
];

export const users: User[] = [
  { id: 'user-manager', name: '陈经理', role: 'manager', departmentName: '培训部' },
  { id: 'user-dept-1', name: '王部门', role: 'department', departmentId: 'dept-1', departmentName: '技术研发部' },
  { id: 'user-dept-2', name: '李部门', role: 'department', departmentId: 'dept-2', departmentName: '产品设计部' },
  { id: 'user-dept-3', name: '张部门', role: 'department', departmentId: 'dept-3', departmentName: '市场营销部' },
  { id: 'user-dept-4', name: '赵部门', role: 'department', departmentId: 'dept-4', departmentName: '人力资源部' },
  { id: 'inst-1', name: '刘讲师', role: 'instructor', departmentName: '外部讲师' },
  { id: 'inst-2', name: '孙讲师', role: 'instructor', departmentName: '内部讲师' },
  { id: 'inst-3', name: '周讲师', role: 'instructor', departmentName: '外部讲师' },
];

export const instructors: Instructor[] = [
  { id: 'inst-1', name: '刘讲师', expertise: ['领导力', '团队管理'], contact: 'liu@example.com' },
  { id: 'inst-2', name: '孙讲师', expertise: ['技术架构', '敏捷开发'], contact: 'sun@example.com' },
  { id: 'inst-3', name: '周讲师', expertise: ['产品设计', '用户体验'], contact: 'zhou@example.com' },
];

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const threeDaysLater = new Date(today);
threeDaysLater.setDate(threeDaysLater.getDate() + 3);
const fiveDaysLater = new Date(today);
fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);

export const trainingNeeds: TrainingNeed[] = [
  {
    id: 'need-1',
    title: '新员工入职培训',
    description: '针对新入职员工的综合培训，包括公司文化、规章制度、职业素养等内容',
    status: TrainingNeedStatus.APPROVED,
    departmentId: 'dept-4',
    departmentName: '人力资源部',
    participantDepartments: ['dept-1', 'dept-2', 'dept-3'],
    createdAt: twoDaysAgo,
    deadline: tomorrow,
    reviewedAt: yesterday,
    reviewerId: 'user-manager',
    reviewerName: '陈经理',
  },
  {
    id: 'need-2',
    title: '敏捷开发实战培训',
    description: 'Scrum框架实践、用户故事编写、迭代规划与回顾',
    status: TrainingNeedStatus.PENDING_REVIEW,
    departmentId: 'dept-1',
    departmentName: '技术研发部',
    participantDepartments: ['dept-1', 'dept-2'],
    createdAt: yesterday,
    deadline: today,
  },
  {
    id: 'need-3',
    title: '产品设计思维工作坊',
    description: '设计思维方法论、用户研究、原型设计实践',
    status: TrainingNeedStatus.REJECTED,
    departmentId: 'dept-2',
    departmentName: '产品设计部',
    participantDepartments: ['dept-2'],
    createdAt: twoDaysAgo,
    deadline: yesterday,
    reviewedAt: yesterday,
    reviewerId: 'user-manager',
    reviewerName: '陈经理',
    rejectedReason: '培训目标不够明确，请补充具体的培训产出要求',
  },
  {
    id: 'need-4',
    title: '领导力提升培训',
    description: '针对中层管理者的领导力发展课程',
    status: TrainingNeedStatus.SCHEDULED,
    departmentId: 'dept-4',
    departmentName: '人力资源部',
    participantDepartments: ['dept-1', 'dept-2', 'dept-3'],
    createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
    deadline: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
    reviewerId: 'user-manager',
    reviewerName: '陈经理',
  },
  {
    id: 'need-5',
    title: '数据安全意识培训',
    description: '企业数据安全政策、个人信息保护、网络安全意识',
    status: TrainingNeedStatus.DRAFT,
    departmentId: 'dept-4',
    departmentName: '人力资源部',
    participantDepartments: ['dept-1', 'dept-2', 'dept-3', 'dept-4'],
    createdAt: today,
    deadline: nextWeek,
  },
];

export const schedules: Schedule[] = [
  {
    id: 'schedule-1',
    trainingNeedId: 'need-4',
    trainingNeedTitle: '领导力提升培训',
    instructorId: 'inst-1',
    instructorName: '刘讲师',
    startTime: threeDaysLater,
    endTime: new Date(threeDaysLater.getTime() + 4 * 60 * 60 * 1000),
    location: '总部3楼培训室A',
    status: ScheduleStatus.CONFIRMED,
    createdAt: twoDaysAgo,
    confirmedAt: yesterday,
    participantDepartments: ['dept-1', 'dept-2', 'dept-3'],
  },
  {
    id: 'schedule-2',
    trainingNeedId: 'need-1',
    trainingNeedTitle: '新员工入职培训',
    instructorId: 'inst-2',
    instructorName: '孙讲师',
    startTime: fiveDaysLater,
    endTime: new Date(fiveDaysLater.getTime() + 8 * 60 * 60 * 1000),
    location: '总部2楼多功能厅',
    status: ScheduleStatus.SCHEDULED,
    createdAt: yesterday,
    participantDepartments: ['dept-1', 'dept-2', 'dept-3'],
  },
  {
    id: 'schedule-3',
    trainingNeedId: 'need-x',
    trainingNeedTitle: '项目管理基础培训',
    instructorId: 'inst-3',
    instructorName: '周讲师',
    startTime: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
    endTime: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    location: '总部3楼培训室B',
    status: ScheduleStatus.PENDING,
    createdAt: today,
    participantDepartments: ['dept-1'],
  },
];

const generateStudents = (department: string, count: number): Student[] => {
  const names = ['张伟', '王芳', '李明', '赵丽', '刘洋', '陈静', '杨帆', '黄磊', '周婷', '吴强'];
  return Array.from({ length: count }, (_, i) => ({
    id: `student-${department}-${i + 1}`,
    name: names[i % names.length] + (i >= names.length ? i : ''),
    employeeId: `EMP${String(1000 + i).padStart(4, '0')}`,
    department,
    position: ['工程师', '设计师', '经理', '专员'][i % 4],
    email: `student${i + 1}@example.com`,
    phone: `138${String(10000000 + i).padStart(8, '0')}`,
  }));
};

export const enrollments: Enrollment[] = [
  {
    id: 'enroll-1',
    scheduleId: 'schedule-1',
    scheduleTitle: '领导力提升培训',
    departmentId: 'dept-1',
    departmentName: '技术研发部',
    studentList: generateStudents('技术研发部', 5),
    status: EnrollmentStatus.PENDING,
    createdAt: yesterday,
    deadline: today,
  },
  {
    id: 'enroll-2',
    scheduleId: 'schedule-1',
    scheduleTitle: '领导力提升培训',
    departmentId: 'dept-2',
    departmentName: '产品设计部',
    studentList: generateStudents('产品设计部', 3),
    status: EnrollmentStatus.CONFIRMED,
    createdAt: yesterday,
    deadline: today,
    confirmedAt: yesterday,
  },
  {
    id: 'enroll-3',
    scheduleId: 'schedule-1',
    scheduleTitle: '领导力提升培训',
    departmentId: 'dept-3',
    departmentName: '市场营销部',
    studentList: generateStudents('市场营销部', 4),
    status: EnrollmentStatus.REJECTED,
    createdAt: yesterday,
    deadline: today,
    rejectedReason: '参训人员名单需要调整，部分人员因项目原因无法参加',
    returnedAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'enroll-4',
    scheduleId: 'schedule-2',
    scheduleTitle: '新员工入职培训',
    departmentId: 'dept-1',
    departmentName: '技术研发部',
    studentList: generateStudents('技术研发部', 8),
    status: EnrollmentStatus.PENDING,
    createdAt: today,
    deadline: threeDaysLater,
  },
];

export const timelineLogs: TimelineLog[] = [
  {
    id: 'log-1',
    entityType: 'training_need',
    entityId: 'need-1',
    action: '创建培训需求',
    fromStatus: '',
    toStatus: TrainingNeedStatus.DRAFT,
    operatorId: 'user-dept-4',
    operatorName: '赵部门',
    operatorRole: 'department',
    createdAt: twoDaysAgo,
  },
  {
    id: 'log-2',
    entityType: 'training_need',
    entityId: 'need-1',
    action: '提交审核',
    fromStatus: TrainingNeedStatus.DRAFT,
    toStatus: TrainingNeedStatus.PENDING_REVIEW,
    operatorId: 'user-dept-4',
    operatorName: '赵部门',
    operatorRole: 'department',
    createdAt: twoDaysAgo,
  },
  {
    id: 'log-3',
    entityType: 'training_need',
    entityId: 'need-1',
    action: '审核通过',
    fromStatus: TrainingNeedStatus.PENDING_REVIEW,
    toStatus: TrainingNeedStatus.APPROVED,
    operatorId: 'user-manager',
    operatorName: '陈经理',
    operatorRole: 'manager',
    createdAt: yesterday,
  },
  {
    id: 'log-4',
    entityType: 'schedule',
    entityId: 'schedule-1',
    action: '创建排期',
    fromStatus: '',
    toStatus: ScheduleStatus.SCHEDULED,
    operatorId: 'user-manager',
    operatorName: '陈经理',
    operatorRole: 'manager',
    createdAt: twoDaysAgo,
  },
  {
    id: 'log-5',
    entityType: 'schedule',
    entityId: 'schedule-1',
    action: '讲师确认排期',
    fromStatus: ScheduleStatus.SCHEDULED,
    toStatus: ScheduleStatus.CONFIRMED,
    operatorId: 'inst-1',
    operatorName: '刘讲师',
    operatorRole: 'instructor',
    createdAt: yesterday,
  },
  {
    id: 'log-6',
    entityType: 'enrollment',
    entityId: 'enroll-2',
    action: '部门确认学员名单',
    fromStatus: EnrollmentStatus.PENDING,
    toStatus: EnrollmentStatus.CONFIRMED,
    operatorId: 'user-dept-2',
    operatorName: '李部门',
    operatorRole: 'department',
    createdAt: yesterday,
  },
  {
    id: 'log-7',
    entityType: 'enrollment',
    entityId: 'enroll-3',
    action: '部门退回报名',
    fromStatus: EnrollmentStatus.PENDING,
    toStatus: EnrollmentStatus.REJECTED,
    operatorId: 'user-dept-3',
    operatorName: '张部门',
    operatorRole: 'department',
    createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
    details: { reason: '参训人员名单需要调整，部分人员因项目原因无法参加' },
  },
];

export const getTodosForManager = () => {
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const yesterdayEvening = new Date(today);
  yesterdayEvening.setDate(yesterdayEvening.getDate() - 1);
  yesterdayEvening.setHours(23, 59, 59, 999);

  const todayItems: any[] = [];
  const overdueItems: any[] = [];
  const returnedItems: any[] = [];

  trainingNeeds.forEach(need => {
    if (need.status === TrainingNeedStatus.PENDING_REVIEW && need.deadline >= todayStart && need.deadline <= todayEnd) {
      todayItems.push({
        id: `todo-need-${need.id}`,
        type: '今天要办',
        category: 'need',
        title: need.title,
        description: `待审核的培训需求 - ${need.departmentName}`,
        deadline: need.deadline,
        priority: 'high' as const,
        status: need.status,
        actions: ['审核通过', '退回'],
        createdAt: need.createdAt,
        entityId: need.id,
      });
    }
    if (need.status === TrainingNeedStatus.REJECTED && need.reviewedAt && need.reviewedAt >= yesterdayEvening) {
      returnedItems.push({
        id: `todo-need-${need.id}`,
        type: '刚刚退回',
        category: 'need',
        title: need.title,
        description: `已退回 - ${need.rejectedReason}`,
        deadline: need.deadline,
        priority: 'high' as const,
        status: need.status,
        actions: ['查看详情', '重新提交'],
        createdAt: need.createdAt,
        returnedAt: need.reviewedAt,
        entityId: need.id,
      });
    }
  });

  schedules.forEach(schedule => {
    if (schedule.status === ScheduleStatus.SCHEDULED && schedule.startTime >= todayStart && schedule.startTime <= todayEnd) {
      todayItems.push({
        id: `todo-schedule-${schedule.id}`,
        type: '今天要办',
        category: 'schedule',
        title: schedule.trainingNeedTitle,
        description: `待讲师确认 - ${schedule.instructorName}`,
        deadline: schedule.startTime,
        priority: 'medium' as const,
        status: schedule.status,
        actions: ['查看详情', '催办'],
        createdAt: schedule.createdAt,
        entityId: schedule.id,
      });
    }
  });

  enrollments.forEach(enrollment => {
    if (enrollment.status === EnrollmentStatus.PENDING && enrollment.deadline < todayStart) {
      overdueItems.push({
        id: `todo-enroll-${enrollment.id}`,
        type: '已经拖延',
        category: 'enrollment',
        title: enrollment.scheduleTitle,
        description: `${enrollment.departmentName} 学员名单待确认`,
        deadline: enrollment.deadline,
        priority: 'high' as const,
        status: enrollment.status,
        actions: ['催办', '查看详情'],
        createdAt: enrollment.createdAt,
        entityId: enrollment.id,
      });
    }
    if (enrollment.status === EnrollmentStatus.REJECTED && enrollment.returnedAt && enrollment.returnedAt >= yesterdayEvening) {
      returnedItems.push({
        id: `todo-enroll-${enrollment.id}`,
        type: '刚刚退回',
        category: 'enrollment',
        title: enrollment.scheduleTitle,
        description: `${enrollment.departmentName} 退回: ${enrollment.rejectedReason}`,
        deadline: enrollment.deadline,
        priority: 'medium' as const,
        status: enrollment.status,
        actions: ['查看详情', '重新排期'],
        createdAt: enrollment.createdAt,
        returnedAt: enrollment.returnedAt,
        entityId: enrollment.id,
      });
    }
  });

  return { today: todayItems, overdue: overdueItems, returned: returnedItems };
};

export const getTodosForDepartment = (departmentId: string) => {
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todayItems: any[] = [];
  const overdueItems: any[] = [];
  const returnedItems: any[] = [];

  enrollments.filter(e => e.departmentId === departmentId).forEach(enrollment => {
    if (enrollment.status === EnrollmentStatus.PENDING && enrollment.deadline >= todayStart && enrollment.deadline <= todayEnd) {
      todayItems.push({
        id: `todo-enroll-${enrollment.id}`,
        type: '今天要办',
        category: 'enrollment',
        title: enrollment.scheduleTitle,
        description: '学员名单待确认',
        deadline: enrollment.deadline,
        priority: 'high' as const,
        status: enrollment.status,
        actions: ['确认名单', '退回'],
        createdAt: enrollment.createdAt,
        entityId: enrollment.id,
      });
    }
    if (enrollment.status === EnrollmentStatus.PENDING && enrollment.deadline < todayStart) {
      overdueItems.push({
        id: `todo-enroll-${enrollment.id}`,
        type: '已经拖延',
        category: 'enrollment',
        title: enrollment.scheduleTitle,
        description: '学员名单确认已超期',
        deadline: enrollment.deadline,
        priority: 'high' as const,
        status: enrollment.status,
        actions: ['确认名单', '退回'],
        createdAt: enrollment.createdAt,
        entityId: enrollment.id,
      });
    }
  });

  return { today: todayItems, overdue: overdueItems, returned: returnedItems };
};

export const getTodosForInstructor = (instructorId: string) => {
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todayItems: any[] = [];
  const overdueItems: any[] = [];
  const returnedItems: any[] = [];

  schedules.filter(s => s.instructorId === instructorId).forEach(schedule => {
    if (schedule.status === ScheduleStatus.SCHEDULED) {
      if (schedule.startTime >= todayStart && schedule.startTime <= todayEnd) {
        todayItems.push({
          id: `todo-schedule-${schedule.id}`,
          type: '今天要办',
          category: 'schedule',
          title: schedule.trainingNeedTitle,
          description: `待确认排期 - ${schedule.location}`,
          deadline: schedule.startTime,
          priority: 'high' as const,
          status: schedule.status,
          actions: ['确认排期', '拒绝'],
          createdAt: schedule.createdAt,
          entityId: schedule.id,
        });
      }
    }
  });

  return { today: todayItems, overdue: overdueItems, returned: returnedItems };
};