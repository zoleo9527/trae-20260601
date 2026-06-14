import type {
  User,
  UserRole,
  Student,
  StudentStatus,
  Archive,
  Training,
  Exam,
  OperationLog,
  OperationType,
  Notification,
} from '@/types';

const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'consultant001',
    name: '张三',
    role: 'CONSULTANT',
    department: '招生部',
    phone: '13800138001',
    status: 'ACTIVE',
  },
  {
    id: 'u2',
    username: 'consultant002',
    name: '李四',
    role: 'CONSULTANT',
    department: '招生部',
    phone: '13800138002',
    status: 'ACTIVE',
  },
  {
    id: 'u3',
    username: 'coach001',
    name: '王五',
    role: 'COACH',
    department: '训练部',
    phone: '13800138003',
    status: 'ACTIVE',
  },
  {
    id: 'u4',
    username: 'coach002',
    name: '赵六',
    role: 'COACH',
    department: '训练部',
    phone: '13800138004',
    status: 'ACTIVE',
  },
  {
    id: 'u5',
    username: 'specialist001',
    name: '钱七',
    role: 'SPECIALIST',
    department: '考试部',
    phone: '13800138005',
    status: 'ACTIVE',
  },
  {
    id: 'u6',
    username: 'admin',
    name: '管理员',
    role: 'ADMIN',
    department: '综合部',
    phone: '13800138000',
    status: 'ACTIVE',
  },
  {
    id: 'u7',
    username: 'archiver001',
    name: '孙八',
    role: 'ARCHIVER',
    department: '档案部',
    phone: '13800138006',
    status: 'ACTIVE',
  },
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    studentNo: '20240115-001',
    name: '陈建国',
    idCard: '110101199001011234',
    phone: '13900001001',
    address: '北京市朝阳区建国路88号',
    carType: 'C1',
    enrollmentDate: '2024-01-15',
    status: 'TRAINING',
    enrollmentConsultantId: 'u1',
    coachId: 'u3',
    createdAt: '2024-01-15 09:30:00',
    updatedAt: '2024-01-25 16:00:00',
  },
  {
    id: 's2',
    studentNo: '20240116-001',
    name: '刘美丽',
    idCard: '110101199002021234',
    phone: '13900001002',
    address: '北京市海淀区中关村大街12号',
    carType: 'C2',
    enrollmentDate: '2024-01-16',
    status: 'PENDING_REVIEW',
    enrollmentConsultantId: 'u1',
    createdAt: '2024-01-16 14:20:00',
    updatedAt: '2024-01-16 14:20:00',
  },
  {
    id: 's3',
    studentNo: '20240117-001',
    name: '赵小明',
    idCard: '110101199003031234',
    phone: '13900001003',
    address: '北京市东城区王府井大街1号',
    carType: 'C1',
    enrollmentDate: '2024-01-17',
    status: 'ARCHIVED',
    enrollmentConsultantId: 'u2',
    createdAt: '2024-01-17 10:15:00',
    updatedAt: '2024-01-20 16:30:00',
  },
  {
    id: 's4',
    studentNo: '20240118-001',
    name: '孙晓红',
    idCard: '110101199004041234',
    phone: '13900001004',
    address: '北京市西城区西单大街8号',
    carType: 'C1',
    enrollmentDate: '2024-01-18',
    status: 'PENDING_EXAM_BOOKING',
    enrollmentConsultantId: 'u2',
    coachId: 'u3',
    createdAt: '2024-01-18 11:00:00',
    updatedAt: '2024-01-22 09:15:00',
  },
  {
    id: 's5',
    studentNo: '20240119-001',
    name: '李伟强',
    idCard: '110101199005051234',
    phone: '13900001005',
    address: '北京市丰台区方庄路2号',
    carType: 'C1',
    enrollmentDate: '2024-01-19',
    status: 'PENDING_EXAM',
    enrollmentConsultantId: 'u1',
    createdAt: '2024-01-19 08:45:00',
    updatedAt: '2024-01-20 10:30:00',
  },
  {
    id: 's6',
    studentNo: '20240120-001',
    name: '周芳',
    idCard: '110101199006061234',
    phone: '13900001006',
    address: '北京市通州区新华大街18号',
    carType: 'C2',
    enrollmentDate: '2024-01-20',
    status: 'DRAFT',
    enrollmentConsultantId: 'u2',
    createdAt: '2024-01-20 16:00:00',
    updatedAt: '2024-01-20 16:00:00',
  },
  {
    id: 's7',
    studentNo: '20240114-001',
    name: '吴迪',
    idCard: '110101198912121234',
    phone: '13900001007',
    address: '北京市昌平区回龙观西大街9号',
    carType: 'C1',
    enrollmentDate: '2024-01-14',
    status: 'COMPLETED',
    enrollmentConsultantId: 'u1',
    coachId: 'u4',
    createdAt: '2024-01-14 11:30:00',
    updatedAt: '2024-01-25 10:00:00',
  },
  {
    id: 's8',
    studentNo: '20240121-001',
    name: '郑秀华',
    idCard: '110101199107071234',
    phone: '13900001008',
    address: '北京市顺义区天竺镇10号',
    carType: 'C1',
    enrollmentDate: '2024-01-21',
    status: 'COACH_ASSIGNED',
    enrollmentConsultantId: 'u2',
    coachId: 'u4',
    createdAt: '2024-01-21 09:00:00',
    updatedAt: '2024-01-24 14:00:00',
  },
];

const INITIAL_ARCHIVES: Archive[] = [
  {
    id: 'a1',
    studentId: 's1',
    archiveStatus: 'COMPLETE',
    documentStatus: 'COMPLETE',
    missingDocuments: [],
    lastUpdateBy: 'u6',
    lastUpdateAt: '2024-01-17 11:00:00',
    lockedAt: '2024-01-17 11:30:00',
    lockedBy: 'u6',
  },
  {
    id: 'a2',
    studentId: 's2',
    archiveStatus: 'PENDING',
    documentStatus: 'PENDING',
    missingDocuments: ['居住证复印件', '体检表'],
    lastUpdateBy: 'u1',
    lastUpdateAt: '2024-01-16 14:20:00',
  },
  {
    id: 'a3',
    studentId: 's3',
    archiveStatus: 'COMPLETE',
    documentStatus: 'COMPLETE',
    missingDocuments: [],
    lastUpdateBy: 'u6',
    lastUpdateAt: '2024-01-20 14:30:00',
    lockedAt: '2024-01-20 15:00:00',
    lockedBy: 'u6',
  },
  {
    id: 'a4',
    studentId: 's4',
    archiveStatus: 'COMPLETE',
    documentStatus: 'COMPLETE',
    missingDocuments: [],
    lastUpdateBy: 'u6',
    lastUpdateAt: '2024-01-21 10:00:00',
  },
  {
    id: 'a5',
    studentId: 's5',
    archiveStatus: 'PENDING',
    documentStatus: 'COMPLETE',
    missingDocuments: ['身份证复印件'],
    lastUpdateBy: 'u1',
    lastUpdateAt: '2024-01-20 10:30:00',
  },
  {
    id: 'a6',
    studentId: 's6',
    archiveStatus: 'PENDING',
    documentStatus: 'PENDING',
    missingDocuments: ['身份证复印件', '居住证复印件', '体检表', '照片'],
    lastUpdateBy: 'u2',
    lastUpdateAt: '2024-01-20 16:00:00',
  },
  {
    id: 'a7',
    studentId: 's7',
    archiveStatus: 'LOCKED',
    documentStatus: 'COMPLETE',
    missingDocuments: [],
    lastUpdateBy: 'u6',
    lastUpdateAt: '2024-01-25 10:00:00',
    lockedAt: '2024-01-25 10:30:00',
    lockedBy: 'u6',
  },
  {
    id: 'a8',
    studentId: 's8',
    archiveStatus: 'COMPLETE',
    documentStatus: 'COMPLETE',
    missingDocuments: [],
    lastUpdateBy: 'u6',
    lastUpdateAt: '2024-01-24 14:00:00',
  },
];

const INITIAL_TRAININGS: Training[] = [
  {
    id: 't1',
    studentId: 's1',
    coachId: 'u3',
    assignDate: '2024-01-18',
    progress: 'PRACTICE_BASIC',
    theoryCompleted: true,
    practiceHours: 24,
    lastProgressUpdate: '2024-01-25 16:00:00',
  },
  {
    id: 't2',
    studentId: 's4',
    coachId: 'u3',
    assignDate: '2024-01-21',
    progress: 'READY_FOR_EXAM',
    theoryCompleted: true,
    practiceHours: 36,
    lastProgressUpdate: '2024-01-22 18:00:00',
  },
  {
    id: 't3',
    studentId: 's7',
    coachId: 'u4',
    assignDate: '2024-01-15',
    progress: 'READY_FOR_EXAM',
    theoryCompleted: true,
    practiceHours: 56,
    lastProgressUpdate: '2024-01-24 10:00:00',
  },
  {
    id: 't4',
    studentId: 's8',
    coachId: 'u4',
    assignDate: '2024-01-24',
    progress: 'THEORY',
    theoryCompleted: false,
    practiceHours: 0,
    lastProgressUpdate: '2024-01-24 14:00:00',
  },
];

const INITIAL_EXAMS: Exam[] = [
  {
    id: 'e1',
    studentId: 's1',
    examSubject: 'THEORY',
    examDate: '2024-01-20',
    examStatus: 'TAKEN',
    examResult: 'PASSED',
    examVenue: '海淀驾校考场',
    specialistId: 'u5',
    createdAt: '2024-01-19 10:00:00',
  },
  {
    id: 'e2',
    studentId: 's4',
    examSubject: 'SUBJECT2',
    examDate: '2024-01-21',
    examStatus: 'TAKEN',
    examResult: 'FAILED',
    examVenue: '海淀驾校考场',
    specialistId: 'u5',
    createdAt: '2024-01-20 09:00:00',
  },
  {
    id: 'e3',
    studentId: 's4',
    examSubject: 'SUBJECT2',
    examDate: '2024-01-28',
    examStatus: 'SCHEDULED',
    examVenue: '海淀驾校考场',
    specialistId: 'u5',
    createdAt: '2024-01-22 09:15:00',
  },
];

const INITIAL_LOGS: OperationLog[] = [
  {
    id: 'log1',
    studentId: 's1',
    operatorId: 'u1',
    operatorRole: 'CONSULTANT',
    operationType: 'CREATE',
    afterValue: { name: '陈建国', phone: '13900001001', carType: 'C1' },
    operatedAt: '2024-01-15 09:30:00',
  },
  {
    id: 'log2',
    studentId: 's1',
    operatorId: 'u1',
    operatorRole: 'CONSULTANT',
    operationType: 'STATUS_CHANGE',
    beforeValue: { status: 'DRAFT' },
    afterValue: { status: 'PENDING_REVIEW' },
    changeReason: '学员提交报名资料，待审核',
    operatedAt: '2024-01-15 10:15:00',
  },
  {
    id: 'log3',
    studentId: 's1',
    operatorId: 'u6',
    operatorRole: 'ADMIN',
    operationType: 'STATUS_CHANGE',
    beforeValue: { status: 'PENDING_REVIEW' },
    afterValue: { status: 'REVIEW_PASSED' },
    changeReason: '资料审核通过，身份证已验证',
    operatedAt: '2024-01-16 14:20:00',
  },
  {
    id: 'log4',
    studentId: 's1',
    operatorId: 'u6',
    operatorRole: 'ADMIN',
    operationType: 'ARCHIVE_UPDATE',
    afterValue: { archiveStatus: 'COMPLETE', documentStatus: 'COMPLETE' },
    changeReason: '档案资料齐全，完成建档',
    operatedAt: '2024-01-17 11:00:00',
  },
  {
    id: 'log5',
    studentId: 's1',
    operatorId: 'u6',
    operatorRole: 'ADMIN',
    operationType: 'STATUS_CHANGE',
    beforeValue: { status: 'ARCHIVED' },
    afterValue: { status: 'COACH_ASSIGNED', coachId: 'u3' },
    changeReason: '分配王五教练进行培训',
    operatedAt: '2024-01-18 09:00:00',
  },
  {
    id: 'log6',
    studentId: 's1',
    operatorId: 'u3',
    operatorRole: 'COACH',
    operationType: 'STATUS_CHANGE',
    beforeValue: { status: 'COACH_ASSIGNED' },
    afterValue: { status: 'TRAINING' },
    changeReason: '开始理论培训',
    operatedAt: '2024-01-18 09:30:00',
  },
  {
    id: 'log7',
    studentId: 's1',
    operatorId: 'u3',
    operatorRole: 'COACH',
    operationType: 'TRAINING_UPDATE',
    beforeValue: { progress: 'THEORY', theoryCompleted: false },
    afterValue: { progress: 'PRACTICE_BASIC', theoryCompleted: true, practiceHours: 4 },
    changeReason: '理论考试通过，开始基础练习',
    operatedAt: '2024-01-22 16:00:00',
  },
  {
    id: 'log8',
    studentId: 's1',
    operatorId: 'u3',
    operatorRole: 'COACH',
    operationType: 'TRAINING_UPDATE',
    beforeValue: { practiceHours: 12 },
    afterValue: { practiceHours: 24 },
    changeReason: '完成本周练车任务，累计24学时',
    operatedAt: '2024-01-25 16:00:00',
  },
  {
    id: 'log9',
    studentId: 's2',
    operatorId: 'u1',
    operatorRole: 'CONSULTANT',
    operationType: 'CREATE',
    afterValue: { name: '刘美丽', phone: '13900001002', carType: 'C2' },
    operatedAt: '2024-01-16 14:20:00',
  },
  {
    id: 'log10',
    studentId: 's2',
    operatorId: 'u1',
    operatorRole: 'CONSULTANT',
    operationType: 'STATUS_CHANGE',
    beforeValue: { status: 'DRAFT' },
    afterValue: { status: 'PENDING_REVIEW' },
    changeReason: '提交报名，缺居住证和体检表',
    operatedAt: '2024-01-16 14:30:00',
  },
  {
    id: 'log11',
    studentId: 's3',
    operatorId: 'u2',
    operatorRole: 'CONSULTANT',
    operationType: 'CREATE',
    afterValue: { name: '赵小明', phone: '13900001003', carType: 'C1' },
    operatedAt: '2024-01-17 10:15:00',
  },
  {
    id: 'log12',
    studentId: 's3',
    operatorId: 'u5',
    operatorRole: 'SPECIALIST',
    operationType: 'UPDATE',
    beforeValue: { medicalStatus: 'PENDING' },
    afterValue: { medicalStatus: 'PASSED' },
    changeReason: '体检结果合格，视力5.0',
    operatedAt: '2024-01-20 16:30:00',
  },
  {
    id: 'log13',
    studentId: 's3',
    operatorId: 'u6',
    operatorRole: 'ADMIN',
    operationType: 'ARCHIVE_UPDATE',
    afterValue: { archiveStatus: 'COMPLETE' },
    changeReason: '所有资料齐全',
    operatedAt: '2024-01-20 14:30:00',
  },
  {
    id: 'log14',
    studentId: 's4',
    operatorId: 'u2',
    operatorRole: 'CONSULTANT',
    operationType: 'CREATE',
    afterValue: { name: '孙晓红', phone: '13900001004', carType: 'C1' },
    operatedAt: '2024-01-18 11:00:00',
  },
  {
    id: 'log15',
    studentId: 's4',
    operatorId: 'u5',
    operatorRole: 'SPECIALIST',
    operationType: 'EXAM_SCHEDULE',
    afterValue: { examSubject: 'SUBJECT2', examDate: '2024-01-21', examVenue: '海淀驾校考场' },
    operatedAt: '2024-01-20 09:00:00',
  },
  {
    id: 'log16',
    studentId: 's4',
    operatorId: 'u5',
    operatorRole: 'SPECIALIST',
    operationType: 'EXAM_RESULT',
    beforeValue: { examStatus: 'SCHEDULED' },
    afterValue: { examStatus: 'TAKEN', examResult: 'FAILED' },
    changeReason: '科目二考试未通过，坡道定点停车压线',
    operatedAt: '2024-01-21 16:00:00',
  },
  {
    id: 'log17',
    studentId: 's4',
    operatorId: 'u5',
    operatorRole: 'SPECIALIST',
    operationType: 'EXAM_SCHEDULE',
    afterValue: { examSubject: 'SUBJECT2', examDate: '2024-01-28', examVenue: '海淀驾校考场' },
    changeReason: '预约补考',
    operatedAt: '2024-01-22 09:15:00',
  },
  {
    id: 'log18',
    studentId: 's5',
    operatorId: 'u1',
    operatorRole: 'CONSULTANT',
    operationType: 'CREATE',
    afterValue: { name: '李伟强', phone: '13900001005', carType: 'C1' },
    operatedAt: '2024-01-19 08:45:00',
  },
  {
    id: 'log19',
    studentId: 's5',
    operatorId: 'u6',
    operatorRole: 'ADMIN',
    operationType: 'STATUS_CHANGE',
    beforeValue: { status: 'REVIEW_PASSED' },
    afterValue: { status: 'PENDING_EXAM' },
    changeReason: '等待体检安排',
    operatedAt: '2024-01-20 10:30:00',
  },
  {
    id: 'log20',
    studentId: 's6',
    operatorId: 'u2',
    operatorRole: 'CONSULTANT',
    operationType: 'CREATE',
    afterValue: { name: '周芳', phone: '13900001006', carType: 'C2' },
    changeReason: '意向客户，资料待完善',
    operatedAt: '2024-01-20 16:00:00',
  },
  {
    id: 'log21',
    studentId: 's7',
    operatorId: 'u1',
    operatorRole: 'CONSULTANT',
    operationType: 'CREATE',
    afterValue: { name: '吴迪', phone: '13900001007', carType: 'C1' },
    operatedAt: '2024-01-14 11:30:00',
  },
  {
    id: 'log22',
    studentId: 's7',
    operatorId: 'u6',
    operatorRole: 'ADMIN',
    operationType: 'STATUS_CHANGE',
    beforeValue: { status: 'EXAM_PASSED_FINAL' },
    afterValue: { status: 'COMPLETED' },
    changeReason: '所有考试通过，结业',
    operatedAt: '2024-01-25 10:00:00',
  },
  {
    id: 'log23',
    studentId: 's8',
    operatorId: 'u2',
    operatorRole: 'CONSULTANT',
    operationType: 'CREATE',
    afterValue: { name: '郑秀华', phone: '13900001008', carType: 'C1' },
    operatedAt: '2024-01-21 09:00:00',
  },
  {
    id: 'log24',
    studentId: 's8',
    operatorId: 'u6',
    operatorRole: 'ADMIN',
    operationType: 'STATUS_CHANGE',
    beforeValue: { status: 'ARCHIVED' },
    afterValue: { status: 'COACH_ASSIGNED', coachId: 'u4' },
    changeReason: '分配赵六教练',
    operatedAt: '2024-01-24 14:00:00',
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    studentId: 's3',
    recipientId: 'u3',
    recipientRole: 'COACH',
    notificationType: 'STUDENT_UPDATE',
    title: '学员体检状态变更',
    content: '学员赵小明体检状态已更新为合格',
    relatedOperationId: 'log12',
    isRead: false,
    isConfirmed: false,
    createdAt: '2024-01-20 16:30:00',
  },
  {
    id: 'n2',
    studentId: 's2',
    recipientId: 'u1',
    recipientRole: 'CONSULTANT',
    notificationType: 'STUDENT_UPDATE',
    title: '学员档案缺件提醒',
    content: '学员刘美丽档案缺少居住证复印件和体检表',
    relatedOperationId: 'log10',
    isRead: true,
    isConfirmed: false,
    createdAt: '2024-01-16 14:25:00',
  },
  {
    id: 'n3',
    studentId: 's2',
    recipientId: '',
    recipientRole: 'ARCHIVER',
    notificationType: 'ARCHIVE_UPDATE',
    title: '新学员报名待建档',
    content: '招生顾问张三新增学员刘美丽，等待建档审核',
    relatedOperationId: 'log9',
    isRead: false,
    isConfirmed: false,
    createdAt: '2024-01-16 14:20:00',
  },
  {
    id: 'n4',
    studentId: 's5',
    recipientId: '',
    recipientRole: 'ARCHIVER',
    notificationType: 'ARCHIVE_UPDATE',
    title: '学员报名信息变更',
    content: '学员李伟强状态变更为待体检，请检查档案完整性',
    relatedOperationId: 'log19',
    isRead: false,
    isConfirmed: false,
    createdAt: '2024-01-20 10:30:00',
  },
  {
    id: 'n5',
    studentId: 's8',
    recipientId: 'u4',
    recipientRole: 'COACH',
    notificationType: 'STUDENT_UPDATE',
    title: '新学员分配通知',
    content: '学员郑秀华已分配给您，请安排培训计划',
    relatedOperationId: 'log24',
    isRead: false,
    isConfirmed: false,
    createdAt: '2024-01-24 14:00:00',
  },
  {
    id: 'n6',
    studentId: 's4',
    recipientId: '',
    recipientRole: 'ARCHIVER',
    notificationType: 'EXAM_RESULT',
    title: '考试成绩更新',
    content: '学员孙晓红科目二考试未通过，已预约补考',
    relatedOperationId: 'log17',
    isRead: true,
    isConfirmed: false,
    createdAt: '2024-01-22 09:15:00',
  },
];

class DatabaseService {
  private users: User[] = [...INITIAL_USERS];
  private students: Student[] = [...INITIAL_STUDENTS];
  private archives: Archive[] = [...INITIAL_ARCHIVES];
  private trainings: Training[] = [...INITIAL_TRAININGS];
  private exams: Exam[] = [...INITIAL_EXAMS];
  private logs: OperationLog[] = [...INITIAL_LOGS];
  private notifications: Notification[] = [...INITIAL_NOTIFICATIONS];
  private currentUser: User = this.users[0];

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getCurrentUser(): User {
    return this.currentUser;
  }

  setCurrentUser(userId: string): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.currentUser = user;
    }
  }

  getStudents(filters?: {
    status?: string[];
    consultantId?: string;
    keyword?: string;
  }): Student[] {
    let result = [...this.students];
    if (filters?.status?.length) {
      result = result.filter((s) => filters.status!.includes(s.status));
    }
    if (filters?.consultantId) {
      result = result.filter((s) => s.enrollmentConsultantId === filters.consultantId);
    }
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.studentNo.toLowerCase().includes(kw) ||
          s.idCard.includes(kw)
      );
    }
    return result;
  }

  getStudentById(id: string): Student | undefined {
    return this.students.find((s) => s.id === id);
  }

  createStudent(data: Omit<Student, 'id' | 'studentNo' | 'createdAt' | 'updatedAt'>): Student {
    const today = new Date().toISOString().split('T')[0];
    const count = this.students.filter((s) => s.enrollmentDate.startsWith(today)).length + 1;
    const student: Student = {
      ...data,
      id: `s${Date.now()}`,
      studentNo: `${today.replace(/-/g, '')}-${String(count).padStart(3, '0')}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.students.push(student);

    const archive: Archive = {
      id: `a${Date.now()}`,
      studentId: student.id,
      archiveStatus: 'PENDING',
      documentStatus: 'PENDING',
      missingDocuments: [],
      lastUpdateBy: this.currentUser.id,
      lastUpdateAt: student.createdAt,
    };
    this.archives.push(archive);

    const log: OperationLog = {
      id: `log${Date.now()}`,
      studentId: student.id,
      operatorId: this.currentUser.id,
      operatorRole: this.currentUser.role,
      operationType: 'CREATE',
      afterValue: { name: student.name },
      operatedAt: student.createdAt,
    };
    this.logs.push(log);

    return student;
  }

  updateStudent(
    id: string,
    updates: Partial<Student>,
    changeReason?: string
  ): { student: Student; logs: OperationLog[] } {
    const student = this.students.find((s) => s.id === id);
    if (!student) throw new Error('Student not found');

    const beforeValue: Record<string, any> = {};
    const logEntries: OperationLog[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'updatedAt' && student[key as keyof Student] !== value) {
        beforeValue[key] = student[key as keyof Student];
      }
    });

    if (Object.keys(beforeValue).length > 0) {
      const operationType: OperationType = beforeValue.status ? 'STATUS_CHANGE' : 'UPDATE';
      const log: OperationLog = {
        id: `log${Date.now()}`,
        studentId: student.id,
        operatorId: this.currentUser.id,
        operatorRole: this.currentUser.role,
        operationType,
        beforeValue,
        afterValue: updates,
        changeReason,
        operatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      logEntries.push(log);
      this.logs.push(log);

      if (beforeValue.status) {
        const fromStatus = beforeValue.status as StudentStatus;
        const toStatus = (updates as Record<string, any>).status as StudentStatus;
        
        const statusChangeNotifications: { recipientRole: UserRole; title: string; content: string }[] = [];

        if (toStatus === 'PENDING_REVIEW') {
          statusChangeNotifications.push({
            recipientRole: 'ARCHIVER',
            title: '新学员报名待建档',
            content: `招生顾问${this.currentUser.name}提交了学员${student.name}的报名审核，请检查档案资料`,
          });
        }

        if (fromStatus === 'PENDING_REVIEW' && toStatus === 'REVIEW_PASSED') {
          statusChangeNotifications.push({
            recipientRole: 'ARCHIVER',
            title: '学员审核通过',
            content: `学员${student.name}资料审核通过，请完成建档工作`,
          });
        }

        if (fromStatus === 'REVIEW_PASSED' && toStatus === 'ARCHIVED') {
          statusChangeNotifications.push({
            recipientRole: 'COACH',
            title: '学员已建档',
            content: `学员${student.name}已完成建档，可以分配教练进行培训`,
          });
        }

        if (fromStatus === 'ARCHIVED' && toStatus === 'COACH_ASSIGNED') {
          const coach = this.users.find((u) => u.id === (updates as Record<string, any>).coachId);
          statusChangeNotifications.push({
            recipientRole: 'COACH',
            title: '新学员分配通知',
            content: `学员${student.name}已分配给${coach?.name || '您'}，请安排培训计划`,
          });
        }

        if (toStatus === 'PENDING_EXAM') {
          statusChangeNotifications.push({
            recipientRole: 'ARCHIVER',
            title: '学员待体检',
            content: `学员${student.name}已进入体检环节，请检查档案完整性`,
          });
        }

        if (toStatus === 'COMPLETED') {
          statusChangeNotifications.push({
            recipientRole: 'ARCHIVER',
            title: '学员结业',
            content: `学员${student.name}已完成全部培训并结业`,
          });
        }

        statusChangeNotifications.forEach((notif) => {
          const notification: Notification = {
            id: `n${Date.now()}`,
            studentId: student.id,
            recipientId: '',
            recipientRole: notif.recipientRole,
            notificationType: 'STUDENT_UPDATE',
            title: notif.title,
            content: notif.content,
            relatedOperationId: log.id,
            isRead: false,
            isConfirmed: false,
            createdAt: log.operatedAt,
          };
          this.notifications.push(notification);
        });
      }

      if (beforeValue.medicalStatus || beforeValue.residencePermitStatus) {
        const notification: Notification = {
          id: `n${Date.now()}`,
          studentId: student.id,
          recipientId: '',
          recipientRole: 'COACH',
          notificationType: 'STUDENT_UPDATE',
          title: '学员关键信息变更',
          content: `学员${student.name}的${beforeValue.medicalStatus ? '体检' : '居住证'}状态已变更`,
          relatedOperationId: log.id,
          isRead: false,
          isConfirmed: false,
          createdAt: log.operatedAt,
        };
        this.notifications.push(notification);
      }
    }

    Object.assign(student, updates, {
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });

    return { student, logs: logEntries };
  }

  getArchiveByStudentId(studentId: string): Archive | undefined {
    return this.archives.find((a) => a.studentId === studentId);
  }

  updateArchive(
    studentId: string,
    updates: Partial<Archive>,
    changeReason?: string
  ): Archive {
    const archive = this.archives.find((a) => a.studentId === studentId);
    if (!archive) throw new Error('Archive not found');

    const beforeValue: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (archive[key as keyof Archive] !== value) {
        beforeValue[key] = archive[key as keyof Archive];
      }
    });

    Object.assign(archive, updates, {
      lastUpdateBy: this.currentUser.id,
      lastUpdateAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });

    if (Object.keys(beforeValue).length > 0) {
      const log: OperationLog = {
        id: `log${Date.now()}`,
        studentId,
        operatorId: this.currentUser.id,
        operatorRole: this.currentUser.role,
        operationType: 'ARCHIVE_UPDATE',
        beforeValue,
        afterValue: updates,
        changeReason,
        operatedAt: archive.lastUpdateAt,
      };
      this.logs.push(log);
    }

    return archive;
  }

  getTrainingByStudentId(studentId: string): Training | undefined {
    return this.trainings.find((t) => t.studentId === studentId);
  }

  getExamsByStudentId(studentId: string): Exam[] {
    return this.exams.filter((e) => e.studentId === studentId);
  }

  getLogsByStudentId(studentId: string): OperationLog[] {
    return this.logs.filter((l) => l.studentId === studentId).sort((a, b) =>
      b.operatedAt.localeCompare(a.operatedAt)
    );
  }

  getAllLogs(filters?: {
    operatorId?: string;
    operationType?: string[];
  }): OperationLog[] {
    let result = [...this.logs].sort((a, b) => b.operatedAt.localeCompare(a.operatedAt));
    if (filters?.operatorId) {
      result = result.filter((l) => l.operatorId === filters.operatorId);
    }
    if (filters?.operationType?.length) {
      result = result.filter((l) => filters.operationType!.includes(l.operationType));
    }
    return result;
  }

  getNotifications(userId?: string): Notification[] {
    if (userId) {
      return this.notifications.filter((n) => n.recipientId === userId || n.recipientRole === this.users.find(u => u.id === userId)?.role);
    }
    return this.notifications;
  }

  getUnreadNotificationCount(userId: string): number {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return 0;
    return this.notifications.filter(
      (n) =>
        (n.recipientId === userId || n.recipientRole === user.role) && !n.isRead
    ).length;
  }

  markNotificationAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.isRead = true;
    }
  }

  confirmNotification(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.isConfirmed = true;
      notification.confirmedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
  }

  getDashboardStats() {
    const totalStudents = this.students.length;
    const statusCounts = this.students.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stuckOrders = this.students
      .filter((s) => ['PENDING_REVIEW', 'PENDING_EXAM'].includes(s.status))
      .map((s) => ({
        studentId: s.id,
        studentName: s.name,
        studentNo: s.studentNo,
        currentStatus: s.status,
        stuckReason:
          s.status === 'PENDING_REVIEW'
            ? '待资料审核超时'
            : '待体检超时',
        stuckDays: Math.floor(
          (Date.now() - new Date(s.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        ),
        consultantName:
          this.users.find((u) => u.id === s.enrollmentConsultantId)?.name || '',
      }));

    const missingDocumentsCount = this.archives.filter(
      (a) => a.missingDocuments.length > 0
    ).length;

    const consultantWorkload = this.users
      .filter((u) => u.role === 'CONSULTANT')
      .map((u) => ({
        userId: u.id,
        userName: u.name,
        pendingCount: this.students.filter(
          (s) => s.enrollmentConsultantId === u.id && s.status !== 'COMPLETED'
        ).length,
        overdueCount: this.students.filter(
          (s) =>
            s.enrollmentConsultantId === u.id &&
            ['PENDING_REVIEW', 'PENDING_EXAM'].includes(s.status)
        ).length,
      }));

    const coachWorkload = this.users
      .filter((u) => u.role === 'COACH')
      .map((u) => ({
        userId: u.id,
        userName: u.name,
        pendingCount: this.trainings.filter(
          (t) => t.coachId === u.id && t.progress !== 'READY_FOR_EXAM'
        ).length,
        overdueCount: 0,
      }));

    const specialistWorkload = this.users
      .filter((u) => u.role === 'SPECIALIST')
      .map((u) => ({
        userId: u.id,
        userName: u.name,
        pendingCount: this.exams.filter(
          (e) => e.specialistId === u.id && e.examStatus === 'PENDING'
        ).length,
        overdueCount: this.exams.filter(
          (e) =>
            e.specialistId === u.id &&
            e.examStatus === 'SCHEDULED' &&
            new Date(e.examDate) < new Date()
        ).length,
      }));

    return {
      totalStudents,
      statusCounts,
      stuckOrders,
      overdueCount: stuckOrders.length,
      missingDocumentsCount,
      consultantWorkload,
      coachWorkload,
      specialistWorkload,
    };
  }

  getAssignedStudents(coachId: string): (Student & { training?: Training })[] {
    return this.students
      .filter((s) => s.coachId === coachId)
      .map((s) => ({
        ...s,
        training: this.trainings.find((t) => t.studentId === s.id),
      }));
  }

  updateTrainingProgress(
    studentId: string,
    updates: Partial<Training>,
    notes?: string
  ): Training {
    let training = this.trainings.find((t) => t.studentId === studentId);
    if (!training) {
      training = {
        id: `t${Date.now()}`,
        studentId,
        coachId: this.currentUser.id,
        assignDate: new Date().toISOString().split('T')[0],
        progress: 'NOT_STARTED',
        theoryCompleted: false,
        practiceHours: 0,
        lastProgressUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      this.trainings.push(training);
    }

    Object.assign(training, updates, {
      lastProgressUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });

    const log: OperationLog = {
      id: `log${Date.now()}`,
      studentId,
      operatorId: this.currentUser.id,
      operatorRole: this.currentUser.role,
      operationType: 'TRAINING_UPDATE',
      beforeValue: training,
      afterValue: updates,
      changeReason: notes,
      operatedAt: training.lastProgressUpdate,
    };
    this.logs.push(log);

    return training;
  }

  scheduleExam(data: Omit<Exam, 'id' | 'createdAt'>): Exam {
    const exam: Exam = {
      ...data,
      id: `e${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.exams.push(exam);

    const log: OperationLog = {
      id: `log${Date.now()}`,
      studentId: exam.studentId,
      operatorId: this.currentUser.id,
      operatorRole: this.currentUser.role,
      operationType: 'EXAM_SCHEDULE',
      afterValue: { examSubject: exam.examSubject, examDate: exam.examDate },
      operatedAt: exam.createdAt,
    };
    this.logs.push(log);

    return exam;
  }

  recordExamResult(
    examId: string,
    result: 'PASSED' | 'FAILED',
    absenceReason?: string
  ): Exam {
    const exam = this.exams.find((e) => e.id === examId);
    if (!exam) throw new Error('Exam not found');

    const beforeStatus = exam.examStatus;
    exam.examResult = result;

    if (result === 'PASSED') {
      exam.examStatus = 'TAKEN';
    } else {
      exam.examStatus = absenceReason ? 'ABSENT' : 'TAKEN';
      if (absenceReason) {
        exam.absenceReason = absenceReason;
      }
    }

    const log: OperationLog = {
      id: `log${Date.now()}`,
      studentId: exam.studentId,
      operatorId: this.currentUser.id,
      operatorRole: this.currentUser.role,
      operationType: 'EXAM_RESULT',
      beforeValue: { examStatus: beforeStatus },
      afterValue: { examStatus: exam.examStatus, examResult: result },
      changeReason: result === 'PASSED' ? '考试合格' : (absenceReason ? `缺考: ${absenceReason}` : '考试不合格'),
      operatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.logs.push(log);

    return exam;
  }

  getExams(filters?: {
    studentId?: string;
    examStatus?: string[];
    examSubject?: string;
  }): Exam[] {
    let result = [...this.exams];
    if (filters?.studentId) {
      result = result.filter((e) => e.studentId === filters.studentId);
    }
    if (filters?.examStatus?.length) {
      result = result.filter((e) => filters.examStatus!.includes(e.examStatus));
    }
    if (filters?.examSubject) {
      result = result.filter((e) => e.examSubject === filters.examSubject);
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export const db = new DatabaseService();
