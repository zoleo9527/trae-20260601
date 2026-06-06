export type UserRole = "DORM_MANAGER" | "COUNSELOR" | "MAINTENANCE";
export type InspectionStatus =
  | "PENDING_INSPECTION"
  | "INSPECTED"
  | "NEEDS_RECTIFICATION"
  | "RECTIFIED"
  | "RECTIFICATION_PASSED"
  | "RECTIFICATION_REJECTED"
  | "MAINTENANCE_ASSIGNED"
  | "MAINTENANCE_COMPLETED"
  | "PASSED"
  | "CLOSED";
export type InspectionGrade = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
export type TimelineEventType =
  | "CREATED"
  | "INSPECTION_SUBMITTED"
  | "NEEDS_RECTIFICATION_NOTIFIED"
  | "RECTIFICATION_SUBMITTED"
  | "RECTIFICATION_APPROVED"
  | "RECTIFICATION_REJECTED"
  | "MAINTENANCE_ASSIGNED"
  | "MAINTENANCE_COMPLETED"
  | "PASSED"
  | "CLOSED"
  | "NOTE_ADDED";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface Dorm {
  id: string;
  building: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  type: string;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  gender: string;
  major: string;
  grade: string;
  phone?: string;
  dormId?: string;
  checkInDate?: string;
  lateReturns: LateReturnRecord[];
}

export interface KeyRecord {
  id: string;
  dormId: string;
  keyNumber: string;
  status: string;
  borrower?: string;
  borrowedAt?: string;
  returnedAt?: string;
  remarks?: string;
}

export interface LateReturnRecord {
  id: string;
  studentId: string;
  date: string;
  time: string;
  reason?: string;
  recordedBy?: string;
}

export interface InspectionItem {
  id: string;
  inspectionId: string;
  category: string;
  name: string;
  isPassed?: boolean;
  score?: number;
  issue?: string;
  needRepair: boolean;
}

export interface Rectification {
  id: string;
  inspectionId: string;
  submittedBy?: string;
  submittedAt?: string;
  description: string;
  photos: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  reviewResult?: string;
  reviewComments?: string;
  isRejected: boolean;
  rejectionCount: number;
}

export interface TimelineEvent {
  id: string;
  inspectionId: string;
  eventType: TimelineEventType;
  userId?: string;
  user?: { name: string };
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface Inspection {
  id: string;
  dormId: string;
  inspectorId?: string;
  maintenanceId?: string;
  status: InspectionStatus;
  overallGrade?: InspectionGrade;
  inspectionDate?: string;
  deadline?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  dorm: Dorm;
  inspector?: User;
  maintenanceAssignee?: User;
  items: InspectionItem[];
  rectifications: Rectification[];
  timelineEvents: TimelineEvent[];
}

const now = new Date();

export const mockUsers: User[] = [
  {
    id: "user-dorm-1",
    username: "dorm1",
    passwordHash: "$2a$10$EixZaY3s7vjXd0J/aRc8wOz5m8zGj4JmGj4JmGj4JmGj4JmGj4JmG",
    name: "李阿姨",
    role: "DORM_MANAGER",
    phone: "13800138001",
  },
  {
    id: "user-counselor-1",
    username: "counselor1",
    passwordHash: "$2a$10$EixZaY3s7vjXd0J/aRc8wOz5m8zGj4JmGj4JmGj4JmGj4JmGj4JmG",
    name: "王老师",
    role: "COUNSELOR",
    phone: "13800138002",
  },
  {
    id: "user-maint-1",
    username: "maint1",
    passwordHash: "$2a$10$EixZaY3s7vjXd0J/aRc8wOz5m8zGj4JmGj4JmGj4JmGj4JmGj4JmG",
    name: "张师傅",
    role: "MAINTENANCE",
    phone: "13800138003",
  },
];

export const mockDorms: Dorm[] = [
  { id: "dorm-1", building: "1号楼", roomNumber: "101", floor: 1, capacity: 4, type: "standard" },
  { id: "dorm-2", building: "1号楼", roomNumber: "102", floor: 1, capacity: 4, type: "standard" },
  { id: "dorm-3", building: "1号楼", roomNumber: "201", floor: 2, capacity: 6, type: "standard" },
  { id: "dorm-4", building: "1号楼", roomNumber: "202", floor: 2, capacity: 4, type: "standard" },
  { id: "dorm-5", building: "2号楼", roomNumber: "101", floor: 1, capacity: 4, type: "standard" },
  { id: "dorm-6", building: "2号楼", roomNumber: "305", floor: 3, capacity: 4, type: "standard" },
];

export const mockStudents: Student[] = [
  {
    id: "stu-1",
    studentId: "2023001",
    name: "张伟",
    gender: "男",
    major: "计算机科学",
    grade: "2023级",
    dormId: "dorm-1",
    checkInDate: "2023-09-01T00:00:00.000Z",
    lateReturns: [
      { id: "lr-1", studentId: "stu-1", date: "2024-06-01T00:00:00.000Z", time: "23:45", reason: "图书馆学习", recordedBy: "李阿姨" },
      { id: "lr-2", studentId: "stu-1", date: "2024-06-03T00:00:00.000Z", time: "00:15", reason: "同学聚会", recordedBy: "李阿姨" },
    ],
  },
  {
    id: "stu-2",
    studentId: "2023002",
    name: "李娜",
    gender: "女",
    major: "计算机科学",
    grade: "2023级",
    dormId: "dorm-1",
    checkInDate: "2023-09-01T00:00:00.000Z",
    lateReturns: [],
  },
  {
    id: "stu-3",
    studentId: "2023003",
    name: "王强",
    gender: "男",
    major: "软件工程",
    grade: "2023级",
    dormId: "dorm-1",
    checkInDate: "2023-09-01T00:00:00.000Z",
    lateReturns: [],
  },
  {
    id: "stu-4",
    studentId: "2023004",
    name: "刘洋",
    gender: "男",
    major: "软件工程",
    grade: "2023级",
    dormId: "dorm-1",
    checkInDate: "2023-09-01T00:00:00.000Z",
    lateReturns: [],
  },
  {
    id: "stu-5",
    studentId: "2023005",
    name: "陈静",
    gender: "女",
    major: "数据科学",
    grade: "2023级",
    dormId: "dorm-2",
    checkInDate: "2023-09-01T00:00:00.000Z",
    lateReturns: [
      { id: "lr-3", studentId: "stu-5", date: "2024-06-02T00:00:00.000Z", time: "23:30", reason: "实习加班", recordedBy: "李阿姨" },
    ],
  },
  {
    id: "stu-6",
    studentId: "2023006",
    name: "赵磊",
    gender: "男",
    major: "数据科学",
    grade: "2023级",
    dormId: "dorm-2",
    checkInDate: "2023-09-01T00:00:00.000Z",
    lateReturns: [],
  },
  {
    id: "stu-7",
    studentId: "2022001",
    name: "孙明",
    gender: "男",
    major: "人工智能",
    grade: "2022级",
    dormId: "dorm-3",
    checkInDate: "2022-09-01T00:00:00.000Z",
    lateReturns: [],
  },
  {
    id: "stu-8",
    studentId: "2022002",
    name: "周芳",
    gender: "女",
    major: "人工智能",
    grade: "2022级",
    dormId: "dorm-3",
    checkInDate: "2022-09-01T00:00:00.000Z",
    lateReturns: [],
  },
];

export const mockKeyRecords: KeyRecord[] = [
  { id: "key-1", dormId: "dorm-1", keyNumber: "K-1号楼-101", status: "borrowed", borrower: "张伟", borrowedAt: now.toISOString() },
  { id: "key-2", dormId: "dorm-2", keyNumber: "K-1号楼-102", status: "in_stock" },
  { id: "key-3", dormId: "dorm-3", keyNumber: "K-1号楼-201", status: "in_stock" },
  { id: "key-4", dormId: "dorm-4", keyNumber: "K-1号楼-202", status: "borrowed", borrower: "孙明", borrowedAt: now.toISOString() },
  { id: "key-5", dormId: "dorm-5", keyNumber: "K-2号楼-101", status: "in_stock" },
  { id: "key-6", dormId: "dorm-6", keyNumber: "K-2号楼-305", status: "in_stock" },
];

export let mockInspections: Inspection[] = [
  {
    id: "insp-1",
    dormId: "dorm-1",
    inspectorId: "user-dorm-1",
    status: "NEEDS_RECTIFICATION",
    overallGrade: "POOR",
    inspectionDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    remarks: "整体卫生较差，需重点整改",
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
    dorm: mockDorms[0],
    inspector: mockUsers[0],
    items: [
      { id: "item-1-1", inspectionId: "insp-1", category: "卫生整洁", name: "地面清洁", isPassed: false, score: 30, issue: "地面有明显污渍和垃圾", needRepair: false },
      { id: "item-1-2", inspectionId: "insp-1", category: "卫生整洁", name: "床铺整理", isPassed: false, score: 40, issue: "被子未叠，衣物乱堆", needRepair: false },
      { id: "item-1-3", inspectionId: "insp-1", category: "设施设备", name: "门窗完好", isPassed: false, score: 50, issue: "窗户把手损坏，无法关闭", needRepair: true },
      { id: "item-1-4", inspectionId: "insp-1", category: "安全隐患", name: "违规电器", isPassed: true, score: 100, needRepair: false },
    ],
    rectifications: [],
    timelineEvents: [
      { id: "te-1-1", inspectionId: "insp-1", eventType: "CREATED", description: "检查单创建", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "te-1-2", inspectionId: "insp-1", eventType: "INSPECTION_SUBMITTED", description: "宿管员李阿姨完成卫生检查，评定为差", userId: "user-dorm-1", user: mockUsers[0], metadata: { grade: "POOR" }, createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 3600000).toISOString() },
      { id: "te-1-3", inspectionId: "insp-1", eventType: "NEEDS_RECTIFICATION_NOTIFIED", description: "已通知宿舍长进行整改，整改期限已超时1天", userId: "user-dorm-1", user: mockUsers[0], metadata: { deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), isOverdue: true }, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "insp-2",
    dormId: "dorm-2",
    inspectorId: "user-dorm-1",
    status: "RECTIFICATION_REJECTED",
    overallGrade: "FAIR",
    inspectionDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    remarks: "整改不彻底，需重新整改",
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
    dorm: mockDorms[1],
    inspector: mockUsers[0],
    items: [
      { id: "item-2-1", inspectionId: "insp-2", category: "卫生整洁", name: "地面清洁", isPassed: true, score: 85, needRepair: false },
      { id: "item-2-2", inspectionId: "insp-2", category: "卫生整洁", name: "桌面整洁", isPassed: false, score: 50, issue: "桌面物品堆放杂乱，书籍未整理", needRepair: false },
      { id: "item-2-3", inspectionId: "insp-2", category: "公共区域", name: "卫生间", isPassed: false, score: 40, issue: "卫生间有异味，洗手台有污垢", needRepair: false },
    ],
    rectifications: [
      {
        id: "rect-2-1",
        inspectionId: "insp-2",
        description: "已打扫卫生间，整理了桌面",
        photos: ["photo1.jpg", "photo2.jpg"],
        submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        submittedBy: "陈静",
        reviewedBy: "王老师",
        reviewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewResult: "rejected",
        reviewComments: "卫生间异味问题未解决，桌面仍有杂物堆放。请重新整改，特别注意卫生间清洁和桌面物品收纳。",
        isRejected: true,
        rejectionCount: 1,
      },
    ],
    timelineEvents: [
      { id: "te-2-1", inspectionId: "insp-2", eventType: "CREATED", description: "检查单创建", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "te-2-2", inspectionId: "insp-2", eventType: "INSPECTION_SUBMITTED", description: "宿管员李阿姨完成卫生检查，评定为一般", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 3600000).toISOString() },
      { id: "te-2-3", inspectionId: "insp-2", eventType: "NEEDS_RECTIFICATION_NOTIFIED", description: "已通知需要整改的问题", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "te-2-4", inspectionId: "insp-2", eventType: "RECTIFICATION_SUBMITTED", description: "陈静提交了整改材料", userId: undefined, metadata: { submittedBy: "陈静" }, createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "te-2-5", inspectionId: "insp-2", eventType: "RECTIFICATION_REJECTED", description: "辅导员王老师复核不通过，要求重新整改", userId: "user-counselor-1", user: mockUsers[1], metadata: { comments: "卫生间异味问题未解决，桌面仍有杂物堆放", rejectionCount: 1 }, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "insp-3",
    dormId: "dorm-3",
    inspectorId: "user-dorm-1",
    maintenanceId: "user-maint-1",
    status: "MAINTENANCE_ASSIGNED",
    overallGrade: "FAIR",
    inspectionDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    remarks: "存在设施损坏，需维修处理",
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
    dorm: mockDorms[2],
    inspector: mockUsers[0],
    maintenanceAssignee: mockUsers[2],
    items: [
      { id: "item-3-1", inspectionId: "insp-3", category: "设施设备", name: "水电正常", isPassed: false, score: 0, issue: "电灯不亮，缺材料（灯泡）", needRepair: true },
      { id: "item-3-2", inspectionId: "insp-3", category: "设施设备", name: "家具完好", isPassed: false, score: 0, issue: "椅子损坏，缺材料（螺丝、配件）", needRepair: true },
      { id: "item-3-3", inspectionId: "insp-3", category: "卫生整洁", name: "地面清洁", isPassed: true, score: 90, needRepair: false },
    ],
    rectifications: [],
    timelineEvents: [
      { id: "te-3-1", inspectionId: "insp-3", eventType: "CREATED", description: "检查单创建", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "te-3-2", inspectionId: "insp-3", eventType: "INSPECTION_SUBMITTED", description: "宿管员李阿姨完成检查，发现设施损坏缺材料", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 3600000).toISOString() },
      { id: "te-3-3", inspectionId: "insp-3", eventType: "MAINTENANCE_ASSIGNED", description: "已指派张师傅进行维修，缺灯泡和椅子配件", userId: "user-counselor-1", user: mockUsers[1], metadata: { materials: ["灯泡", "螺丝", "椅子配件"], isMaterialsMissing: true }, createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "insp-4",
    dormId: "dorm-4",
    inspectorId: "user-dorm-1",
    status: "RECTIFIED",
    overallGrade: "FAIR",
    inspectionDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    remarks: "已提交整改，等待辅导员复查",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
    dorm: mockDorms[3],
    inspector: mockUsers[0],
    items: [
      { id: "item-4-1", inspectionId: "insp-4", category: "卫生整洁", name: "物品摆放", isPassed: false, score: 55, issue: "鞋子摆放不整齐", needRepair: false },
      { id: "item-4-2", inspectionId: "insp-4", category: "公共区域", name: "垃圾处理", isPassed: false, score: 60, issue: "垃圾桶未及时清理", needRepair: false },
    ],
    rectifications: [
      {
        id: "rect-4-1",
        inspectionId: "insp-4",
        description: "已整理鞋子，清理了垃圾桶",
        photos: ["rectify1.jpg", "rectify2.jpg"],
        submittedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        submittedBy: "孙明",
      },
    ],
    timelineEvents: [
      { id: "te-4-1", inspectionId: "insp-4", eventType: "CREATED", description: "检查单创建", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "te-4-2", inspectionId: "insp-4", eventType: "INSPECTION_SUBMITTED", description: "宿管员李阿姨完成卫生检查", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString() },
      { id: "te-4-3", inspectionId: "insp-4", eventType: "NEEDS_RECTIFICATION_NOTIFIED", description: "已通知整改要求", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "te-4-4", inspectionId: "insp-4", eventType: "RECTIFICATION_SUBMITTED", description: "学生已提交整改材料，等待复查", createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "insp-5",
    dormId: "dorm-5",
    inspectorId: "user-dorm-1",
    status: "PASSED",
    overallGrade: "EXCELLENT",
    inspectionDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    remarks: "卫生状况优秀",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
    dorm: mockDorms[4],
    inspector: mockUsers[0],
    items: [
      { id: "item-5-1", inspectionId: "insp-5", category: "卫生整洁", name: "地面清洁", isPassed: true, score: 95, needRepair: false },
      { id: "item-5-2", inspectionId: "insp-5", category: "卫生整洁", name: "床铺整理", isPassed: true, score: 98, needRepair: false },
      { id: "item-5-3", inspectionId: "insp-5", category: "安全隐患", name: "违规电器", isPassed: true, score: 100, needRepair: false },
      { id: "item-5-4", inspectionId: "insp-5", category: "设施设备", name: "门窗完好", isPassed: true, score: 100, needRepair: false },
    ],
    rectifications: [],
    timelineEvents: [
      { id: "te-5-1", inspectionId: "insp-5", eventType: "CREATED", description: "检查单创建", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "te-5-2", inspectionId: "insp-5", eventType: "INSPECTION_SUBMITTED", description: "宿管员李阿姨完成卫生检查，评定为优秀", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3600000).toISOString() },
      { id: "te-5-3", inspectionId: "insp-5", eventType: "PASSED", description: "检查通过，无需整改", userId: "user-dorm-1", user: mockUsers[0], createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 7200000).toISOString() },
    ],
  },
  {
    id: "insp-6",
    dormId: "dorm-6",
    status: "PENDING_INSPECTION",
    remarks: "待检查",
    createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
    dorm: mockDorms[5],
    items: [
      { id: "item-6-1", inspectionId: "insp-6", category: "卫生整洁", name: "地面清洁", needRepair: false },
      { id: "item-6-2", inspectionId: "insp-6", category: "卫生整洁", name: "床铺整理", needRepair: false },
      { id: "item-6-3", inspectionId: "insp-6", category: "安全隐患", name: "违规电器", needRepair: false },
    ],
    rectifications: [],
    timelineEvents: [
      { id: "te-6-1", inspectionId: "insp-6", eventType: "CREATED", description: "检查单已创建，等待宿管员检查", createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString() },
    ],
  },
];

export function generateId() {
  return "id-" + Math.random().toString(36).substring(2, 9);
}
