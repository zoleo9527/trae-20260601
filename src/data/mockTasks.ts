import type { SurveyTask } from '../types/task.types';
import { TaskStatus, UrgencyLevel } from '../types/task.types';
import type { User } from '../types/user.types';
import { UserRole } from '../types/user.types';
import { getCurrentTime, generateTaskNo } from '../utils';

const currentUser: User = {
  userId: 'user-001',
  username: 'zhangsan',
  realName: '张三',
  phone: '13800138000',
  email: 'zhangsan@example.com',
  role: UserRole.CLAIMS_SPECIALIST,
  department: '理赔部',
  active: true,
  createdTime: '2024-01-01 00:00:00'
};

export const mockUsers: User[] = [
  currentUser,
  {
    userId: 'user-002',
    username: 'lisi',
    realName: '李四',
    phone: '13800138001',
    email: 'lisi@example.com',
    role: UserRole.SURVEYOR,
    department: '查勘部',
    active: true,
    createdTime: '2024-01-01 00:00:00'
  },
  {
    userId: 'user-003',
    username: 'wangwu',
    realName: '王五',
    phone: '13800138002',
    email: 'wangwu@example.com',
    role: UserRole.SURVEYOR,
    department: '查勘部',
    active: true,
    createdTime: '2024-01-01 00:00:00'
  },
  {
    userId: 'user-004',
    username: 'zhaoliu',
    realName: '赵六',
    phone: '13800138003',
    email: 'zhaoliu@example.com',
    role: UserRole.REVIEW_SUPERVISOR,
    department: '核赔部',
    active: true,
    createdTime: '2024-01-01 00:00:00'
  }
];

const now = getCurrentTime();
const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
const threeDaysAgo = new Date(Date.now() - 259200000).toISOString();

export const mockTasks: SurveyTask[] = [
  {
    taskId: 'task-001',
    taskNo: generateTaskNo(),
    claimNo: 'CL202401150001',
    policyNo: 'POL2024000123',
    licensePlate: '京A12345',
    vehicleType: '小型轿车',
    ownerName: '王小明',
    ownerPhone: '13912345678',
    accidentTime: oneDayAgo,
    accidentLocation: '北京市朝阳区建国路',
    accidentDesc: '追尾事故，前车急刹车导致',
    urgencyLevel: UrgencyLevel.URGENT,
    status: TaskStatus.PENDING_PROCESS,
    assignedSurveyorId: 'user-002',
    assignedSurveyorName: '李四',
    assignedTime: oneDayAgo,
    claimAmount: 15000,
    createdBy: 'user-001',
    createdByName: '张三',
    createdTime: oneDayAgo,
    updatedTime: oneDayAgo
  },
  {
    taskId: 'task-002',
    taskNo: generateTaskNo(),
    claimNo: 'CL202401150002',
    policyNo: 'POL2024000456',
    licensePlate: '京B67890',
    vehicleType: 'SUV',
    ownerName: '李大明',
    ownerPhone: '13998765432',
    accidentTime: twoDaysAgo,
    accidentLocation: '北京市海淀区中关村大街',
    accidentDesc: '变道刮蹭',
    urgencyLevel: UrgencyLevel.NORMAL,
    status: TaskStatus.PROCESSING,
    assignedSurveyorId: 'user-003',
    assignedSurveyorName: '王五',
    assignedTime: twoDaysAgo,
    surveyStartTime: new Date(Date.now() - 86400000).toISOString(),
    claimAmount: 8000,
    createdBy: 'user-001',
    createdByName: '张三',
    createdTime: twoDaysAgo,
    updatedTime: new Date(Date.now() - 86400000).toISOString()
  },
  {
    taskId: 'task-003',
    taskNo: generateTaskNo(),
    claimNo: 'CL202401140003',
    policyNo: 'POL2024000789',
    licensePlate: '京C11111',
    vehicleType: '小型轿车',
    ownerName: '张小华',
    ownerPhone: '13811112222',
    accidentTime: threeDaysAgo,
    accidentLocation: '北京市东城区王府井大街',
    accidentDesc: '停车时被刮蹭',
    urgencyLevel: UrgencyLevel.CRITICAL,
    status: TaskStatus.PENDING_ASSESSMENT,
    assignedSurveyorId: 'user-002',
    assignedSurveyorName: '李四',
    assignedTime: threeDaysAgo,
    surveyStartTime: new Date(Date.now() - 172800000).toISOString(),
    surveyEndTime: new Date(Date.now() - 86400000).toISOString(),
    claimAmount: 25000,
    createdBy: 'user-001',
    createdByName: '张三',
    createdTime: threeDaysAgo,
    updatedTime: new Date(Date.now() - 86400000).toISOString()
  },
  {
    taskId: 'task-004',
    taskNo: generateTaskNo(),
    claimNo: 'CL202401130004',
    policyNo: 'POL2024000321',
    licensePlate: '京D22222',
    vehicleType: '商务车',
    ownerName: '陈大力',
    ownerPhone: '13722223333',
    accidentTime: '2024-01-13 10:30:00',
    accidentLocation: '北京市西城区金融街',
    accidentDesc: '倒车时撞到柱子',
    urgencyLevel: UrgencyLevel.NORMAL,
    status: TaskStatus.COMPLETED,
    assignedSurveyorId: 'user-003',
    assignedSurveyorName: '王五',
    assignedTime: '2024-01-13 11:00:00',
    surveyStartTime: '2024-01-13 14:00:00',
    surveyEndTime: '2024-01-13 15:30:00',
    claimAmount: 5000,
    createdBy: 'user-001',
    createdByName: '张三',
    createdTime: '2024-01-13 10:45:00',
    updatedTime: '2024-01-14 09:00:00'
  },
  {
    taskId: 'task-005',
    taskNo: generateTaskNo(),
    claimNo: 'CL202401160001',
    policyNo: 'POL2024000654',
    licensePlate: '京E33333',
    vehicleType: '小型轿车',
    ownerName: '刘美丽',
    ownerPhone: '13633334444',
    accidentTime: now,
    accidentLocation: '北京市丰台区南三环',
    accidentDesc: '雨雪天气路滑失控',
    urgencyLevel: UrgencyLevel.CRITICAL,
    status: TaskStatus.PENDING_ASSIGN,
    claimAmount: 30000,
    createdBy: 'user-001',
    createdByName: '张三',
    createdTime: now,
    updatedTime: now
  }
];

export { currentUser };
