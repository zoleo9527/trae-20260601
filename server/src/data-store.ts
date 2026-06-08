import { v4 as uuidv4 } from 'uuid';
import type { User, Complaint, TimelineEvent, Role, ComplaintStatus, AssignmentHistoryEntry } from './types.js';

const now = () => new Date().toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600000).toISOString();

function seedUsers(): Map<string, User> {
  const m = new Map<string, User>();
  const users: User[] = [
    { id: 'op1', name: '王计调', role: 'operator' },
    { id: 'guide1', name: '李导游', role: 'guide' },
    { id: 'fleet1', name: '张调度', role: 'fleet' },
    { id: 'supervisor1', name: '赵主管', role: 'supervisor' },
  ];
  users.forEach(u => m.set(u.id, u));
  return m;
}

function seedComplaints(): Map<string, Complaint> {
  const m = new Map<string, Complaint>();
  const ts = now();

  const c1: Complaint = {
    id: 'comp-001',
    title: '酒店卫生条件差',
    description: '游客反映安排的酒店房间有异味，卫生间设施老旧无法正常使用，严重影响入住体验。',
    tourGroup: '云南5日游-6月A团',
    complaintType: 'accommodation',
    severity: 'high',
    status: 'registered',
    createdBy: 'op1',
    createdByName: '王计调',
    assignmentHistory: [],
    timeline: [
      {
        id: uuidv4(),
        type: 'created',
        role: 'operator',
        authorName: '王计调',
        content: '创建投诉：酒店卫生条件差，严重等级为高',
        createdAt: ts,
      },
    ],
    dueDate: hoursFromNow(48),
    createdAt: ts,
    updatedAt: ts,
  };

  const c2: Complaint = {
    id: 'comp-002',
    title: '导游服务态度恶劣',
    description: '多名游客投诉导游在行程中态度不耐烦，对游客提问不予回应，且擅自缩短景点游览时间。',
    tourGroup: '北京3日游-6月B团',
    complaintType: 'service',
    severity: 'urgent',
    status: 'assigned',
    createdBy: 'op1',
    createdByName: '王计调',
    assignedTo: 'guide1',
    assignedToName: '李导游',
    assignedRole: 'guide',
    assignmentHistory: [
      {
        assignedTo: 'guide1',
        assignedToName: '李导游',
        assignedRole: 'guide',
        assignedBy: 'op1',
        assignedByName: '王计调',
        assignedAt: ts,
      },
    ],
    timeline: [
      {
        id: uuidv4(),
        type: 'created',
        role: 'operator',
        authorName: '王计调',
        content: '创建投诉：导游服务态度恶劣，严重等级为紧急',
        createdAt: ts,
      },
      {
        id: uuidv4(),
        type: 'assigned',
        role: 'operator',
        authorName: '王计调',
        content: '指派给导游 李导游 处理',
        createdAt: ts,
      },
    ],
    dueDate: hoursFromNow(48),
    createdAt: ts,
    updatedAt: ts,
  };

  const c3: Complaint = {
    id: 'comp-003',
    title: '旅游大巴空调故障',
    description: '旅游大巴空调全程无法制冷，6月高温天气下游客中暑风险极高，车队未及时更换车辆。',
    tourGroup: '海南5日游-5月C团',
    complaintType: 'transport',
    severity: 'high',
    status: 'processing',
    createdBy: 'op1',
    createdByName: '王计调',
    assignedTo: 'fleet1',
    assignedToName: '张调度',
    assignedRole: 'fleet',
    assignmentHistory: [
      {
        assignedTo: 'fleet1',
        assignedToName: '张调度',
        assignedRole: 'fleet',
        assignedBy: 'op1',
        assignedByName: '王计调',
        assignedAt: ts,
      },
    ],
    timeline: [
      {
        id: uuidv4(),
        type: 'created',
        role: 'operator',
        authorName: '王计调',
        content: '创建投诉：旅游大巴空调故障，严重等级为高',
        createdAt: ts,
      },
      {
        id: uuidv4(),
        type: 'assigned',
        role: 'operator',
        authorName: '王计调',
        content: '指派给车队调度 张调度 处理',
        createdAt: ts,
      },
      {
        id: uuidv4(),
        type: 'note',
        role: 'fleet',
        authorName: '张调度',
        content: '已确认车辆问题，正在联系备用车辆，预计明天可以替换。',
        createdAt: ts,
      },
      {
        id: uuidv4(),
        type: 'note',
        role: 'fleet',
        authorName: '张调度',
        content: '备用车辆已安排到位，明天早上6点出发前完成换车。同时对受影响游客致歉。',
        createdAt: ts,
      },
    ],
    dueDate: hoursFromNow(24),
    createdAt: ts,
    updatedAt: ts,
  };

  const c4: Complaint = {
    id: 'comp-004',
    title: '团队餐食标准未达标',
    description: '合同约定每餐标准为50元/人，实际安排餐食仅为20元/人水平，菜品单一且卫生存疑。',
    tourGroup: '成都4日游-5月D团',
    complaintType: 'food',
    severity: 'medium',
    status: 'compensating',
    createdBy: 'op1',
    createdByName: '王计调',
    assignedTo: 'guide1',
    assignedToName: '李导游',
    assignedRole: 'guide',
    assignmentHistory: [
      {
        assignedTo: 'guide1',
        assignedToName: '李导游',
        assignedRole: 'guide',
        assignedBy: 'op1',
        assignedByName: '王计调',
        assignedAt: ts,
      },
    ],
    compensation: {
      id: uuidv4(),
      type: 'refund',
      amount: 1200,
      description: '退还餐费差价：20人 × (50-20)元 × 2餐 = 1200元',
      status: 'proposed',
      proposedBy: 'op1',
      proposedByName: '王计调',
      proposedAt: ts,
    },
    timeline: [
      {
        id: uuidv4(),
        type: 'created',
        role: 'operator',
        authorName: '王计调',
        content: '创建投诉：团队餐食标准未达标，严重等级为中',
        createdAt: ts,
      },
      {
        id: uuidv4(),
        type: 'assigned',
        role: 'operator',
        authorName: '王计调',
        content: '指派给导游 李导游 处理',
        createdAt: ts,
      },
      {
        id: uuidv4(),
        type: 'note',
        role: 'guide',
        authorName: '李导游',
        content: '已核实，确实存在餐食降标情况，游客情绪较为激动。',
        createdAt: ts,
      },
      {
        id: uuidv4(),
        type: 'note',
        role: 'guide',
        authorName: '李导游',
        content: '已与餐厅交涉，后续餐食将按照合同标准执行。建议对已发生的差价进行补偿。',
        createdAt: ts,
      },
      {
        id: uuidv4(),
        type: 'compensation_proposed',
        role: 'operator',
        authorName: '王计调',
        content: '提出补偿方案：退还餐费差价1200元',
        createdAt: ts,
      },
    ],
    dueDate: hoursFromNow(48),
    createdAt: ts,
    updatedAt: ts,
  };

  [c1, c2, c3, c4].forEach(c => m.set(c.id, c));
  return m;
}

class DataStore {
  private complaints: Map<string, Complaint>;
  private users: Map<string, User>;

  constructor() {
    this.complaints = seedComplaints();
    this.users = seedUsers();
  }

  resetData() {
    this.complaints = seedComplaints();
    this.users = seedUsers();
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  getComplaints(): Complaint[] {
    return Array.from(this.complaints.values());
  }

  getComplaint(id: string): Complaint | undefined {
    return this.complaints.get(id);
  }

  createComplaint(data: Omit<Complaint, 'id' | 'timeline' | 'createdAt' | 'updatedAt' | 'status' | 'assignmentHistory'>): Complaint {
    const complaint: Complaint = {
      ...data,
      id: `comp-${String(this.complaints.size + 1).padStart(3, '0')}`,
      status: 'registered',
      assignmentHistory: [],
      timeline: [],
      createdAt: now(),
      updatedAt: now(),
    };
    this.complaints.set(complaint.id, complaint);
    return complaint;
  }

  updateComplaint(id: string, updates: Partial<Complaint>): Complaint | undefined {
    const complaint = this.complaints.get(id);
    if (!complaint) return undefined;
    Object.assign(complaint, updates, { updatedAt: now() });
    return complaint;
  }

  addTimelineEvent(complaintId: string, event: Omit<TimelineEvent, 'id' | 'createdAt'>): TimelineEvent | undefined {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) return undefined;
    const timelineEvent: TimelineEvent = {
      ...event,
      id: uuidv4(),
      createdAt: now(),
    };
    complaint.timeline.push(timelineEvent);
    complaint.updatedAt = now();
    return timelineEvent;
  }

  getComplaintsByRole(userId: string, role: Role): Complaint[] {
    const all = this.getComplaints();
    switch (role) {
      case 'operator':
        return all.filter(c => c.createdBy === userId);
      case 'guide':
        return all.filter(c => c.assignedTo === userId && c.assignedRole === 'guide');
      case 'fleet':
        return all.filter(c => c.assignedTo === userId && c.assignedRole === 'fleet');
      case 'supervisor':
        return all;
      default:
        return [];
    }
  }

  getOverdueComplaints(): Complaint[] {
    const current = now();
    return this.getComplaints().filter(
      c => c.dueDate && c.status !== 'closed' && c.dueDate < current
    );
  }
}

export const store = new DataStore();
