import fs from 'fs';
import path from 'path';
import { 
  ExamBatch, 
  StudentNotification, 
  ExceptionRecord, 
  OperationLog,
  User,
  Student,
  RoleType,
  ExamBatchStatus,
  StudentNotificationStatus,
  ExceptionType,
  ActionType,
  ERROR_CODES
} from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'system-data.json');

interface SystemData {
  users: User[];
  students: Student[];
  examBatches: ExamBatch[];
  studentNotifications: StudentNotification[];
  exceptionRecords: ExceptionRecord[];
  operationLogs: OperationLog[];
}

const initialUsers: User[] = [
  { id: 'u1', name: '张三', role: 'registrar', phone: '13800138001' },
  { id: 'u2', name: '李四', role: 'trainer', phone: '13800138002' },
  { id: 'u3', name: '王五', role: 'safety_officer', phone: '13800138003' },
  { id: 'u4', name: '赵六', role: 'registrar', phone: '13800138004' },
];

const initialStudents: Student[] = [
  { id: 's1', name: '小明', phone: '13900139001', idCard: '110101199001011234', trainingHours: 30, documentsComplete: true },
  { id: 's2', name: '小红', phone: '13900139002', idCard: '110101199002022345', trainingHours: 25, documentsComplete: false },
  { id: 's3', name: '小刚', phone: '13900139003', idCard: '110101199003033456', trainingHours: 35, documentsComplete: true },
  { id: 's4', name: '小丽', phone: '13900139004', idCard: '110101199004044567', trainingHours: 28, documentsComplete: false },
  { id: 's5', name: '小强', phone: '13900139005', idCard: '110101199005055678', trainingHours: 32, documentsComplete: true },
  { id: 's6', name: '小芳', phone: '13900139006', idCard: '110101199006066789', trainingHours: 22, documentsComplete: true },
  { id: 's7', name: '小军', phone: '13900139007', idCard: '110101199007077890', trainingHours: 20, documentsComplete: false },
  { id: 's8', name: '小华', phone: '13900139008', idCard: '110101199008088901', trainingHours: 38, documentsComplete: true },
];

const initialExceptionRecords: ExceptionRecord[] = [
  {
    id: 'ex1',
    batchId: 'b1',
    studentId: 's2',
    studentName: '小红',
    type: 'missing_documents',
    description: '缺少体检证明和照片',
    createdAt: '2024-01-15 10:30:00',
    resolved: false,
  },
  {
    id: 'ex2',
    batchId: 'b1',
    studentId: 's4',
    studentName: '小丽',
    type: 'missing_documents',
    description: '缺少身份证复印件',
    createdAt: '2024-01-15 11:00:00',
    handlerId: 'u1',
    handlerName: '张三',
    handledAt: '2024-01-15 14:30:00',
    resolved: true,
  },
  {
    id: 'ex3',
    batchId: 'b2',
    studentId: 's7',
    studentName: '小军',
    type: 'timeout',
    description: '超过48小时未确认通知',
    createdAt: '2024-01-16 09:00:00',
    resolved: false,
  },
  {
    id: 'ex4',
    batchId: 'b3',
    studentId: 's3',
    studentName: '小刚',
    type: 'review_failed',
    description: '培训时长不足要求',
    createdAt: '2024-01-17 10:00:00',
    resolved: false,
  },
  {
    id: 'ex5',
    batchId: 'b2',
    studentId: 's6',
    studentName: '小芳',
    type: 'review_failed',
    description: '理论考试成绩未达标',
    createdAt: '2024-01-16 15:00:00',
    handlerId: 'u3',
    handlerName: '王五',
    handledAt: '2024-01-17 09:00:00',
    resolved: true,
  },
];

const initialExamBatches: ExamBatch[] = [
  {
    id: 'b1',
    batchNumber: 'MC20240115001',
    examDate: '2024-01-20',
    examTime: '09:00',
    location: '第一考场',
    status: 'submitted',
    submitterId: 'u1',
    submitterName: '张三',
    submitTime: '2024-01-15 09:00:00',
    students: ['s1', 's2', 's3', 's4'],
    exceptionRecords: initialExceptionRecords.filter(e => e.batchId === 'b1'),
  },
  {
    id: 'b2',
    batchNumber: 'MC20240116001',
    examDate: '2024-01-21',
    examTime: '14:00',
    location: '第二考场',
    status: 'confirmed',
    submitterId: 'u4',
    submitterName: '赵六',
    submitTime: '2024-01-16 08:30:00',
    confirmerId: 'u2',
    confirmerName: '李四',
    confirmTime: '2024-01-16 10:00:00',
    students: ['s5', 's6', 's7'],
    exceptionRecords: initialExceptionRecords.filter(e => e.batchId === 'b2'),
  },
  {
    id: 'b3',
    batchNumber: 'MC20240117001',
    examDate: '2024-01-22',
    examTime: '09:00',
    location: '第一考场',
    status: 'pending',
    submitterId: 'u1',
    submitterName: '张三',
    submitTime: '2024-01-17 09:00:00',
    students: ['s3', 's8'],
    exceptionRecords: initialExceptionRecords.filter(e => e.batchId === 'b3'),
  },
  {
    id: 'b4',
    batchNumber: 'MC20240110001',
    examDate: '2024-01-12',
    examTime: '10:00',
    location: '第三考场',
    status: 'exam_completed',
    submitterId: 'u4',
    submitterName: '赵六',
    submitTime: '2024-01-10 08:00:00',
    confirmerId: 'u2',
    confirmerName: '李四',
    confirmTime: '2024-01-10 11:00:00',
    students: ['s1', 's5'],
    exceptionRecords: [],
  },
  {
    id: 'b5',
    batchNumber: 'MC20240108001',
    examDate: '2024-01-10',
    examTime: '09:00',
    location: '第二考场',
    status: 'cancelled',
    submitterId: 'u1',
    submitterName: '张三',
    submitTime: '2024-01-08 09:00:00',
    confirmerId: 'u3',
    confirmerName: '王五',
    confirmTime: '2024-01-08 10:00:00',
    students: ['s2', 's4'],
    exceptionRecords: [],
  },
];

const initialStudentNotifications: StudentNotification[] = [
  {
    id: 'n1',
    batchId: 'b1',
    studentId: 's1',
    studentName: '小明',
    status: 'confirmed',
    notifierId: 'u2',
    notifierName: '李四',
    notifyTime: '2024-01-15 10:00:00',
    confirmTime: '2024-01-15 10:30:00',
  },
  {
    id: 'n2',
    batchId: 'b1',
    studentId: 's2',
    studentName: '小红',
    status: 'pending',
    notifierId: 'u2',
    notifierName: '李四',
    notifyTime: '2024-01-15 10:00:00',
    remarks: '材料缺失，待补充',
  },
  {
    id: 'n3',
    batchId: 'b1',
    studentId: 's3',
    studentName: '小刚',
    status: 'confirmed',
    notifierId: 'u2',
    notifierName: '李四',
    notifyTime: '2024-01-15 10:00:00',
    confirmTime: '2024-01-15 11:00:00',
  },
  {
    id: 'n4',
    batchId: 'b1',
    studentId: 's4',
    studentName: '小丽',
    status: 'notified',
    notifierId: 'u2',
    notifierName: '李四',
    notifyTime: '2024-01-15 10:00:00',
  },
  {
    id: 'n5',
    batchId: 'b2',
    studentId: 's5',
    studentName: '小强',
    status: 'completed',
    notifierId: 'u2',
    notifierName: '李四',
    notifyTime: '2024-01-16 09:00:00',
    confirmTime: '2024-01-16 09:30:00',
  },
  {
    id: 'n6',
    batchId: 'b2',
    studentId: 's6',
    studentName: '小芳',
    status: 'absent',
    notifierId: 'u2',
    notifierName: '李四',
    notifyTime: '2024-01-16 09:00:00',
    remarks: '未按时到场',
  },
  {
    id: 'n7',
    batchId: 'b2',
    studentId: 's7',
    studentName: '小军',
    status: 'pending',
    notifierId: 'u2',
    notifierName: '李四',
    notifyTime: '2024-01-16 09:00:00',
    remarks: '超时未确认',
  },
  {
    id: 'n8',
    batchId: 'b3',
    studentId: 's3',
    studentName: '小刚',
    status: 'pending',
    notifierId: 'u2',
    notifierName: '李四',
    notifyTime: '2024-01-17 10:00:00',
  },
  {
    id: 'n9',
    batchId: 'b3',
    studentId: 's8',
    studentName: '小华',
    status: 'pending',
    notifierId: 'u2',
    notifierName: '李四',
    notifyTime: '2024-01-17 10:00:00',
  },
];

const initialOperationLogs: OperationLog[] = [
  { id: 'log1', operationType: '创建考试批次', targetType: 'batch', targetId: 'b1', operatorId: 'u1', operatorName: '张三', operatorRole: 'registrar', timestamp: '2024-01-15 09:00:00', details: '创建批次 MC20240115001' },
  { id: 'log2', operationType: '提交考试批次', targetType: 'batch', targetId: 'b1', operatorId: 'u1', operatorName: '张三', operatorRole: 'registrar', timestamp: '2024-01-15 09:00:00', details: '提交批次 MC20240115001' },
  { id: 'log3', operationType: '发送学员通知', targetType: 'notification', targetId: 'n1', operatorId: 'u2', operatorName: '李四', operatorRole: 'trainer', timestamp: '2024-01-15 10:00:00', details: '通知学员 小明' },
  { id: 'log4', operationType: '确认学员通知', targetType: 'notification', targetId: 'n1', operatorId: 'u3', operatorName: '王五', operatorRole: 'safety_officer', timestamp: '2024-01-15 10:30:00', details: '确认学员小明的通知' },
  { id: 'log5', operationType: '创建异常记录', targetType: 'exception', targetId: 'ex1', operatorId: 'u2', operatorName: '李四', operatorRole: 'trainer', timestamp: '2024-01-15 10:30:00', details: '记录小红材料缺失异常' },
  { id: 'log6', operationType: '确认考试批次', targetType: 'batch', targetId: 'b2', operatorId: 'u2', operatorName: '李四', operatorRole: 'trainer', timestamp: '2024-01-16 10:00:00', details: '确认批次 MC20240116001' },
  { id: 'log7', operationType: '处理异常记录', targetType: 'exception', targetId: 'ex2', operatorId: 'u1', operatorName: '张三', operatorRole: 'registrar', timestamp: '2024-01-15 14:30:00', details: '处理小丽材料缺失异常，已补充' },
];

class DataStore {
  private data: SystemData;
  private initialized: boolean = false;

  constructor() {
    this.data = {
      users: [],
      students: [],
      examBatches: [],
      studentNotifications: [],
      exceptionRecords: [],
      operationLogs: [],
    };
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromFile(): boolean {
    try {
      this.ensureDataDir();
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading data from file:', error);
      return false;
    }
  }

  private saveToFile() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving data to file:', error);
    }
  }

  public initialize() {
    if (this.initialized) return;
    
    if (!this.loadFromFile()) {
      this.data = {
        users: initialUsers,
        students: initialStudents,
        examBatches: initialExamBatches,
        studentNotifications: initialStudentNotifications,
        exceptionRecords: initialExceptionRecords,
        operationLogs: initialOperationLogs,
      };
      this.saveToFile();
    }
    
    this.initialized = true;
  }

  public getData(): SystemData {
    this.initialize();
    return this.data;
  }

  public saveData() {
    this.saveToFile();
  }

  public getUsers(): User[] {
    return this.getData().users;
  }

  public getStudents(): Student[] {
    return this.getData().students;
  }

  public getStudentById(id: string): Student | undefined {
    return this.getData().students.find(s => s.id === id);
  }

  public getExamBatches(status?: ExamBatchStatus): ExamBatch[] {
    const batches = this.getData().examBatches;
    if (status) {
      return batches.filter(b => b.status === status);
    }
    return batches;
  }

  public getExamBatchById(id: string): ExamBatch | undefined {
    return this.getData().examBatches.find(b => b.id === id);
  }

  public createExamBatch(batch: Omit<ExamBatch, 'id' | 'submitTime' | 'exceptionRecords'>): ExamBatch {
    const newBatch: ExamBatch = {
      ...batch,
      id: `b${Date.now()}`,
      submitTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      exceptionRecords: [],
    };
    this.data.examBatches.push(newBatch);
    this.saveToFile();
    return newBatch;
  }

  public updateExamBatch(id: string, updates: Partial<ExamBatch>): ExamBatch | null {
    const index = this.data.examBatches.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    this.data.examBatches[index] = {
      ...this.data.examBatches[index],
      ...updates,
    };
    this.saveToFile();
    return this.data.examBatches[index];
  }

  public getNotifications(batchId?: string, status?: StudentNotificationStatus): StudentNotification[] {
    let result = this.getData().studentNotifications;
    if (batchId) {
      result = result.filter(n => n.batchId === batchId);
    }
    if (status) {
      result = result.filter(n => n.status === status);
    }
    return result;
  }

  public getNotificationById(id: string): StudentNotification | undefined {
    return this.getData().studentNotifications.find(n => n.id === id);
  }

  public createNotification(notification: Omit<StudentNotification, 'id' | 'notifyTime'>): StudentNotification {
    const newNotification: StudentNotification = {
      ...notification,
      id: `n${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notifyTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    this.data.studentNotifications.push(newNotification);
    this.saveToFile();
    return newNotification;
  }

  public updateNotification(id: string, updates: Partial<StudentNotification>): StudentNotification | null {
    const index = this.data.studentNotifications.findIndex(n => n.id === id);
    if (index === -1) return null;
    
    this.data.studentNotifications[index] = {
      ...this.data.studentNotifications[index],
      ...updates,
    };
    this.saveToFile();
    return this.data.studentNotifications[index];
  }

  public getExceptions(batchId?: string, type?: ExceptionType, resolved?: boolean): ExceptionRecord[] {
    let result = this.getData().exceptionRecords;
    if (batchId) {
      result = result.filter(e => e.batchId === batchId);
    }
    if (type) {
      result = result.filter(e => e.type === type);
    }
    if (resolved !== undefined) {
      result = result.filter(e => e.resolved === resolved);
    }
    return result;
  }

  public getExceptionById(id: string): ExceptionRecord | undefined {
    return this.getData().exceptionRecords.find(e => e.id === id);
  }

  public createException(exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'resolved'>): ExceptionRecord {
    const newException: ExceptionRecord = {
      ...exception,
      id: `ex${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      resolved: false,
    };
    this.data.exceptionRecords.push(newException);
    
    const batch = this.getExamBatchById(exception.batchId);
    if (batch) {
      batch.exceptionRecords.push(newException);
      this.saveToFile();
    }
    
    return newException;
  }

  public updateException(id: string, updates: Partial<ExceptionRecord>): ExceptionRecord | null {
    const index = this.data.exceptionRecords.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    this.data.exceptionRecords[index] = {
      ...this.data.exceptionRecords[index],
      ...updates,
    };
    
    const exception = this.data.exceptionRecords[index];
    const batch = this.getExamBatchById(exception.batchId);
    if (batch) {
      const batchExceptionIndex = batch.exceptionRecords.findIndex(e => e.id === id);
      if (batchExceptionIndex !== -1) {
        batch.exceptionRecords[batchExceptionIndex] = exception;
      }
    }
    
    this.saveToFile();
    return this.data.exceptionRecords[index];
  }

  public addOperationLog(log: Omit<OperationLog, 'id'>): OperationLog {
    const newLog: OperationLog = {
      ...log,
      id: `log${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.data.operationLogs.unshift(newLog);
    this.saveToFile();
    return newLog;
  }

  public getOperationLogs(targetType?: 'batch' | 'notification' | 'exception', targetId?: string): OperationLog[] {
    let result = this.getData().operationLogs;
    if (targetType) {
      result = result.filter(l => l.targetType === targetType);
    }
    if (targetId) {
      result = result.filter(l => l.targetId === targetId);
    }
    return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public validateActionPermission(action: ActionType, role: RoleType): { allowed: boolean; errorCode?: string; message?: string } {
    const actionPermissionMap: Record<ActionType, { roles: RoleType[]; errorCode: string; message: string }> = {
      'create_batch': { roles: ['registrar'], errorCode: 'USR002', message: '只有报名员可以创建考试批次' },
      'submit_batch': { roles: ['registrar'], errorCode: 'USR002', message: '只有报名员可以提交考试批次' },
      'confirm_batch': { roles: ['trainer', 'safety_officer'], errorCode: 'USR002', message: '只有场地教练或安全员可以确认批次' },
      'cancel_batch': { roles: ['trainer', 'safety_officer'], errorCode: 'USR002', message: '只有场地教练或安全员可以取消批次' },
      'complete_exam': { roles: ['safety_officer'], errorCode: 'USR002', message: '只有安全员可以完成考试' },
      'send_notification': { roles: ['trainer'], errorCode: 'USR002', message: '只有场地教练可以发送通知' },
      'confirm_notification': { roles: ['safety_officer'], errorCode: 'USR002', message: '只有安全员可以确认通知' },
      'mark_absent': { roles: ['trainer', 'safety_officer'], errorCode: 'USR002', message: '只有场地教练或安全员可以标记缺考' },
      'complete_notification': { roles: ['trainer'], errorCode: 'USR002', message: '只有场地教练可以完成通知' },
      'handle_exception': { roles: ['registrar', 'trainer', 'safety_officer'], errorCode: 'USR002', message: '您没有权限处理异常' },
    };

    const config = actionPermissionMap[action];
    if (!config) {
      return { allowed: false, errorCode: 'USR002', message: '未知的操作类型' };
    }

    const allowed = config.roles.includes(role);
    return {
      allowed,
      errorCode: allowed ? undefined : config.errorCode,
      message: allowed ? undefined : config.message,
    };
  }

  public generateBatchNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = this.data.examBatches.filter(b => b.batchNumber.startsWith(`MC${dateStr}`)).length + 1;
    return `MC${dateStr}${count.toString().padStart(3, '0')}`;
  }
}

export const dataStore = new DataStore();