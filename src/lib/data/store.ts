import type { ConsumptionRecord, Technician, User, TodoItem, IssueRecord, IssueType } from '../types';

const currentUser: User = {
  id: 'user-001',
  name: '张经理',
  role: 'admin'
};

const technicians: Technician[] = [
  { id: 'tech-001', name: '李小红', no: '008', status: 'available', skills: ['足疗', '推拿', 'SPA'] },
  { id: 'tech-002', name: '王美丽', no: '012', status: 'busy', skills: ['推拿', '油压'] },
  { id: 'tech-003', name: '张芳', no: '016', status: 'available', skills: ['足疗', '采耳'] },
  { id: 'tech-004', name: '刘燕', no: '023', status: 'rest', skills: ['SPA', '油压'] },
  { id: 'tech-005', name: '陈静', no: '028', status: 'available', skills: ['推拿', '足疗', '采耳'] }
];

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const mockRecords: ConsumptionRecord[] = [
  {
    id: 'REC-20260607-001',
    customerName: '王先生',
    handTagNo: 'A023',
    handTagStatus: 'normal',
    lockerNo: 'L-105',
    lockerStatus: 'normal',
    checkinTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
    checkoutTime: null,
    status: 'scheduling',
    totalAmount: 588,
    paidAmount: 0,
    schedules: [
      {
        id: 'sch-001',
        technicianId: 'tech-001',
        technicianName: '李小红',
        technicianNo: '008',
        serviceItem: '经典足疗（90分钟）',
        startTime: null,
        endTime: null,
        duration: 90,
        roomNo: '302',
        notes: '客户指定要008号技师，之前来过几次',
        issues: [],
        status: 'pending'
      }
    ],
    serviceRecords: [],
    notes: [
      {
        id: 'note-001',
        content: '前台登记：客户第一次来，手牌A023，储物柜L-105',
        createdBy: '前台小李',
        createdByRole: 'reception',
        createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
        type: 'general'
      },
      {
        id: 'note-002',
        content: '客户要求安排008号技师，说上次体验很好',
        createdBy: '楼层主管王',
        createdByRole: 'floor_supervisor',
        createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 5 * 60000),
        type: 'scheduling'
      }
    ],
    issues: [],
    rejectionReason: null,
    attachments: [],
    createdBy: '前台小李',
    createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 5 * 60000)
  },
  {
    id: 'REC-20260607-002',
    customerName: '张女士',
    handTagNo: 'B012',
    handTagStatus: 'lost',
    handTagLostReason: '客户在休息区休息时手牌遗失，疑似被其他客人误拿',
    handTagLostAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60000),
    lockerNo: 'L-208',
    lockerStatus: 'complaint',
    lockerComplaintReason: '储物柜有异味，客户投诉，经检查是清洁不彻底残留清洁剂味道',
    lockerComplaintAt: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 20 * 60000),
    checkinTime: new Date(today.getTime() + 8 * 60 * 60 * 1000),
    checkoutTime: null,
    status: 'in_service',
    totalAmount: 1288,
    paidAmount: 0,
    schedules: [
      {
        id: 'sch-002',
        technicianId: 'tech-002',
        technicianName: '王美丽',
        technicianNo: '012',
        serviceItem: '全身SPA（120分钟）',
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        endTime: null,
        duration: 120,
        roomNo: '501',
        notes: '客户对力度敏感，需要轻一点。客户反映上次力度太重，这次特别交代要012号技师轻柔一点',
        issues: [
          {
            id: 'issue-001',
            type: 'scheduling_conflict',
            reason: '最初安排的008号技师临时被VIP客户点走，与张女士的排班产生冲突',
            supplementaryNotes: '已与客户沟通，客户理解并同意更换为012号技师，赠送果盘一份作为补偿',
            createdBy: '楼层主管王',
            createdByRole: 'floor_supervisor',
            createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 20 * 60000),
            status: 'resolved',
            resolvedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 45 * 60000),
            resolvedBy: '楼层主管王',
            relatedScheduleId: 'sch-002'
          }
        ],
        status: 'in_progress'
      }
    ],
    serviceRecords: [
      {
        id: 'srv-001',
        scheduleId: 'sch-002',
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        endTime: null,
        actualDuration: null,
        completed: false,
        notes: '',
        issues: []
      }
    ],
    notes: [
      {
        id: 'note-003',
        content: '前台登记：VIP客户，手牌B012',
        createdBy: '前台小李',
        createdByRole: 'reception',
        createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        type: 'general'
      },
      {
        id: 'note-004',
        content: '储物柜有异味，客户投诉，已通知保洁去处理。原因：清洁不彻底残留清洁剂味道',
        createdBy: '楼层主管王',
        createdByRole: 'floor_supervisor',
        createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 20 * 60000),
        type: 'locker',
        relatedTo: 'locker-complaint'
      },
      {
        id: 'note-005',
        content: '客户手牌遗失，正在寻找。已安排临时手牌。原因：客户在休息区休息时手牌遗失，疑似被其他客人误拿',
        createdBy: '前台小李',
        createdByRole: 'reception',
        createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60000),
        type: 'hand_tag',
        relatedTo: 'hand-tag-lost'
      },
      {
        id: 'note-006',
        content: '排班备注：客户反映上次力度太重，这次特别交代要012号技师轻柔一点。注意：之前安排的008号技师与VIP客户产生冲突，已更换并征得客户同意',
        createdBy: '楼层主管王',
        createdByRole: 'floor_supervisor',
        createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 45 * 60000),
        type: 'scheduling',
        relatedTo: 'sch-002'
      }
    ],
    issues: [
      {
        id: 'issue-002',
        type: 'hand_tag_lost',
        reason: '客户在休息区休息时手牌遗失，疑似被其他客人误拿',
        supplementaryNotes: '已安排临时手牌，正在广播寻找，如找不到将收取工本费50元',
        createdBy: '前台小李',
        createdByRole: 'reception',
        createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60000),
        status: 'open'
      },
      {
        id: 'issue-003',
        type: 'locker_complaint',
        reason: '储物柜有异味，客户投诉，经检查是清洁不彻底残留清洁剂味道',
        supplementaryNotes: '保洁已重新清洁并放置香薰，客户表示可以接受，已赠送免费饮料券作为补偿',
        createdBy: '楼层主管王',
        createdByRole: 'floor_supervisor',
        createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 20 * 60000),
        status: 'resolved',
        resolvedAt: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 40 * 60000),
        resolvedBy: '楼层主管王'
      }
    ],
    rejectionReason: null,
    attachments: [],
    createdBy: '前台小李',
    createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() + 10 * 60 * 60 * 1000)
  },
  {
    id: 'REC-20260607-003',
    customerName: '李先生',
    handTagNo: 'A008',
    handTagStatus: 'normal',
    lockerNo: 'L-112',
    lockerStatus: 'normal',
    checkinTime: new Date(today.getTime() + 7 * 60 * 60 * 1000),
    checkoutTime: null,
    status: 'service_completed',
    totalAmount: 886,
    paidAmount: 0,
    schedules: [
      {
        id: 'sch-003',
        technicianId: 'tech-003',
        technicianName: '张芳',
        technicianNo: '016',
        serviceItem: '中式推拿（60分钟）',
        startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
        duration: 60,
        roomNo: '205',
        notes: '客户腰部不好，重点照顾',
        issues: [],
        status: 'completed'
      },
      {
        id: 'sch-004',
        technicianId: 'tech-005',
        technicianName: '陈静',
        technicianNo: '028',
        serviceItem: '采耳（30分钟）',
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 15 * 60000),
        endTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 45 * 60000),
        duration: 30,
        roomNo: '205',
        notes: '追加项目',
        issues: [],
        status: 'completed'
      }
    ],
    serviceRecords: [
      {
        id: 'srv-002',
        scheduleId: 'sch-003',
        startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 5 * 60000),
        actualDuration: 65,
        completed: true,
        notes: '客户满意，说按完腰舒服多了',
        issues: []
      },
      {
        id: 'srv-003',
        scheduleId: 'sch-004',
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 15 * 60000),
        endTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 42 * 60000),
        actualDuration: 27,
        completed: true,
        notes: '',
        issues: []
      }
    ],
    notes: [
      {
        id: 'note-007',
        content: '前台登记：老客户，手牌A008',
        createdBy: '前台小李',
        createdByRole: 'reception',
        createdAt: new Date(today.getTime() + 7 * 60 * 60 * 1000),
        type: 'general'
      },
      {
        id: 'note-008',
        content: '客户说最近腰间盘突出犯了，安排张芳，她对腰部护理有经验',
        createdBy: '楼层主管王',
        createdByRole: 'floor_supervisor',
        createdAt: new Date(today.getTime() + 7 * 60 * 60 * 1000 + 10 * 60000),
        type: 'scheduling',
        relatedTo: 'sch-003'
      },
      {
        id: 'note-009',
        content: '推拿做完后客户想加个采耳，已安排028号',
        createdBy: '楼层主管王',
        createdByRole: 'floor_supervisor',
        createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
        type: 'scheduling',
        relatedTo: 'sch-004'
      },
      {
        id: 'note-010',
        content: '服务全部完成，客户对016号技师评价很高，说下次还点她',
        createdBy: '楼层主管王',
        createdByRole: 'floor_supervisor',
        createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 45 * 60000),
        type: 'service'
      }
    ],
    issues: [],
    rejectionReason: null,
    attachments: [],
    createdBy: '前台小李',
    createdAt: new Date(today.getTime() + 7 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 45 * 60000)
  },
  {
    id: 'REC-20260606-015',
    customerName: '赵先生',
    handTagNo: 'C003',
    handTagStatus: 'returned',
    lockerNo: 'L-305',
    lockerStatus: 'normal',
    checkinTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    checkoutTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
    status: 'completed',
    totalAmount: 1588,
    paidAmount: 1588,
    schedules: [
      {
        id: 'sch-005',
        technicianId: 'tech-004',
        technicianName: '刘燕',
        technicianNo: '023',
        serviceItem: '豪华套餐（180分钟）',
        startTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
        duration: 180,
        roomNo: 'VIP-01',
        notes: '生日优惠客户',
        issues: [],
        status: 'completed'
      }
    ],
    serviceRecords: [
      {
        id: 'srv-004',
        scheduleId: 'sch-005',
        startTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
        actualDuration: 180,
        completed: true,
        notes: '客户很满意，送了果盘',
        issues: []
      }
    ],
    notes: [
      {
        id: 'note-011',
        content: '前台登记：生日当天来的，给了八折优惠',
        createdBy: '前台小周',
        createdByRole: 'reception',
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        type: 'general'
      },
      {
        id: 'note-012',
        content: '安排VIP包间，023号技师',
        createdBy: '楼层主管王',
        createdByRole: 'floor_supervisor',
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 10 * 60000),
        type: 'scheduling',
        relatedTo: 'sch-005'
      },
      {
        id: 'note-013',
        content: '财务已收款，微信支付1588元',
        createdBy: '财务刘',
        createdByRole: 'finance',
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
        type: 'general'
      }
    ],
    issues: [],
    rejectionReason: null,
    attachments: [],
    createdBy: '前台小周',
    createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000)
  }
];

let records: ConsumptionRecord[] = [...mockRecords];

export function getCurrentUser(): User {
  return currentUser;
}

export function getTechnicians(): Technician[] {
  return technicians;
}

export function getRecords(): ConsumptionRecord[] {
  return records.sort((a, b) => b.checkinTime.getTime() - a.checkinTime.getTime());
}

export function getRecordById(id: string): ConsumptionRecord | undefined {
  return records.find(r => r.id === id);
}

export function getTodos(role: string): TodoItem[] {
  const todos: TodoItem[] = [];
  
  records.forEach(record => {
    if (record.handTagStatus === 'lost') {
      todos.push({
        id: `todo-hand-${record.id}`,
        type: 'hand_tag',
        title: `手牌遗失处理：${record.handTagNo}`,
        description: record.handTagLostReason || `${record.customerName} 的手牌 ${record.handTagNo} 遗失，需要处理`,
        recordId: record.id,
        priority: 'high',
        role: 'reception',
        createdAt: record.updatedAt,
        issueType: 'hand_tag_lost'
      });
    }
    
    if (record.lockerStatus === 'complaint') {
      todos.push({
        id: `todo-locker-${record.id}`,
        type: 'locker',
        title: `储物柜投诉处理：${record.lockerNo}`,
        description: record.lockerComplaintReason || `${record.customerName} 的储物柜 ${record.lockerNo} 有投诉`,
        recordId: record.id,
        priority: 'medium',
        role: 'floor_supervisor',
        createdAt: record.updatedAt,
        issueType: 'locker_complaint'
      });
    }
    
    if (record.status === 'scheduling') {
      todos.push({
        id: `todo-schedule-${record.id}`,
        type: 'scheduling',
        title: `待排班：${record.customerName}`,
        description: '需要安排技师和房间',
        recordId: record.id,
        priority: 'high',
        role: 'floor_supervisor',
        createdAt: record.createdAt
      });
    }
    
    if (record.status === 'service_completed') {
      todos.push({
        id: `todo-checkout-${record.id}`,
        type: 'payment',
        title: `待结账：${record.customerName}`,
        description: `消费金额：¥${record.totalAmount}`,
        recordId: record.id,
        priority: 'medium',
        role: 'finance',
        createdAt: record.updatedAt
      });
    }
    
    if (record.status === 'in_service') {
      todos.push({
        id: `todo-service-${record.id}`,
        type: 'service',
        title: `服务进行中：${record.customerName}`,
        description: '需要关注服务进度',
        recordId: record.id,
        priority: 'low',
        role: 'floor_supervisor',
        createdAt: record.updatedAt
      });
    }
    
    record.issues.filter(i => i.status === 'open').forEach(issue => {
      let issueRole: UserRole = 'floor_supervisor';
      if (issue.type === 'hand_tag_lost') issueRole = 'reception';
      if (issue.type === 'checkout_rejection') issueRole = 'finance';
      
      todos.push({
        id: `todo-issue-${issue.id}`,
        type: 'issue',
        title: `待处理问题：${issue.type === 'scheduling_conflict' ? '排班冲突' : issue.type === 'service_rejection' ? '服务退回' : issue.type}`,
        description: issue.reason,
        recordId: record.id,
        priority: 'high',
        role: issueRole,
        createdAt: issue.createdAt,
        issueType: issue.type
      });
    });
  });
  
  return todos
    .filter(t => role === 'admin' || t.role === role)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

export function updateRecordStatus(recordId: string, status: ConsumptionRecord['status']): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    record.status = status;
    record.updatedAt = new Date();
    if (status === 'completed') {
      record.checkoutTime = new Date();
    }
  }
  return record;
}

export function addNote(recordId: string, note: Omit<Note, 'id' | 'createdAt'>): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    record.notes.push({
      ...note,
      id: `note-${Date.now()}`,
      createdAt: new Date()
    });
    record.updatedAt = new Date();
  }
  return record;
}

export function addSchedule(recordId: string, schedule: Omit<Schedule, 'id' | 'issues' | 'status'>): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    record.schedules.push({
      ...schedule,
      id: `sch-${Date.now()}`,
      issues: [],
      status: 'pending'
    });
    record.updatedAt = new Date();
  }
  return record;
}

export function updateSchedule(recordId: string, scheduleId: string, updates: Partial<Schedule>): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    const schedule = record.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      Object.assign(schedule, updates);
      record.updatedAt = new Date();
    }
  }
  return record;
}

export function rejectSchedule(recordId: string, scheduleId: string, reason: string, supplementaryNotes: string, operator: string, operatorRole: UserRole): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    const schedule = record.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      const issue: IssueRecord = {
        id: `issue-${Date.now()}`,
        type: 'scheduling_conflict',
        reason,
        supplementaryNotes,
        createdBy: operator,
        createdByRole: operatorRole,
        createdAt: new Date(),
        status: 'open',
        relatedScheduleId: scheduleId
      };
      
      schedule.issues.push(issue);
      schedule.rejectionReason = reason;
      schedule.status = 'pending';
      
      record.issues.push(issue);
      record.notes.push({
        id: `note-${Date.now()}`,
        content: `排班退回：${reason}。补充说明：${supplementaryNotes}`,
        createdBy: operator,
        createdByRole: operatorRole,
        createdAt: new Date(),
        type: 'rejection',
        relatedTo: scheduleId
      });
      
      record.updatedAt = new Date();
    }
  }
  return record;
}

export function addIssue(recordId: string, issue: Omit<IssueRecord, 'id' | 'createdAt' | 'status'>): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    const newIssue: IssueRecord = {
      ...issue,
      id: `issue-${Date.now()}`,
      createdAt: new Date(),
      status: 'open'
    };
    
    record.issues.push(newIssue);
    
    if (issue.relatedScheduleId) {
      const schedule = record.schedules.find(s => s.id === issue.relatedScheduleId);
      if (schedule) {
        schedule.issues.push(newIssue);
      }
    }
    
    if (issue.relatedServiceId) {
      const service = record.serviceRecords.find(s => s.id === issue.relatedServiceId);
      if (service) {
        service.issues.push(newIssue);
      }
    }
    
    const typeLabels: Record<IssueType, string> = {
      hand_tag_lost: '手牌遗失',
      locker_complaint: '储物柜投诉',
      scheduling_conflict: '排班冲突',
      service_rejection: '服务退回',
      checkout_rejection: '结账退回'
    };
    
    record.notes.push({
      id: `note-${Date.now()}`,
      content: `${typeLabels[issue.type]}：${issue.reason}。补充说明：${issue.supplementaryNotes}`,
      createdBy: issue.createdBy,
      createdByRole: issue.createdByRole,
      createdAt: new Date(),
      type: 'issue',
      relatedTo: newIssue.id
    });
    
    record.updatedAt = new Date();
  }
  return record;
}

export function resolveIssue(recordId: string, issueId: string, resolvedBy: string): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    const issue = record.issues.find(i => i.id === issueId);
    if (issue) {
      issue.status = 'resolved';
      issue.resolvedAt = new Date();
      issue.resolvedBy = resolvedBy;
      
      if (issue.relatedScheduleId) {
        const schedule = record.schedules.find(s => s.id === issue.relatedScheduleId);
        const scheduleIssue = schedule?.issues.find(i => i.id === issueId);
        if (scheduleIssue) {
          scheduleIssue.status = 'resolved';
          scheduleIssue.resolvedAt = new Date();
          scheduleIssue.resolvedBy = resolvedBy;
        }
      }
      
      if (issue.relatedServiceId) {
        const service = record.serviceRecords.find(s => s.id === issue.relatedServiceId);
        const serviceIssue = service?.issues.find(i => i.id === issueId);
        if (serviceIssue) {
          serviceIssue.status = 'resolved';
          serviceIssue.resolvedAt = new Date();
          serviceIssue.resolvedBy = resolvedBy;
        }
      }
      
      record.updatedAt = new Date();
    }
  }
  return record;
}

export function addServiceRecord(recordId: string, service: Omit<ServiceRecord, 'id' | 'issues'>): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    record.serviceRecords.push({
      ...service,
      id: `srv-${Date.now()}`,
      issues: []
    });
    
    const schedule = record.schedules.find(s => s.id === service.scheduleId);
    if (schedule) {
      schedule.status = 'in_progress';
      schedule.startTime = service.startTime;
    }
    
    if (record.status === 'scheduling') {
      record.status = 'in_service';
    }
    
    record.updatedAt = new Date();
  }
  return record;
}

export function updateServiceRecord(recordId: string, serviceId: string, updates: Partial<ServiceRecord>): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    const service = record.serviceRecords.find(s => s.id === serviceId);
    if (service) {
      Object.assign(service, updates);
      record.updatedAt = new Date();
    }
  }
  return record;
}

export function completeService(recordId: string, serviceId: string, scheduleId: string, endTime: Date, actualDuration: number | null, operator?: string, operatorRole?: UserRole): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (!record) return undefined;

  const service = record.serviceRecords.find(s => s.id === serviceId);
  if (!service) return undefined;

  service.endTime = endTime;
  service.actualDuration = actualDuration;
  service.completed = true;

  const schedule = record.schedules.find(s => s.id === scheduleId);
  if (schedule) {
    schedule.status = 'completed';
    schedule.endTime = endTime;
  }

  const allCompleted = record.schedules.every(s => s.status === 'completed');
  if (allCompleted && record.status === 'in_service') {
    record.status = 'service_completed';
  }

  if (operator && operatorRole) {
    record.notes.push({
      id: `note-${Date.now()}`,
      type: 'service',
      content: `服务结束：${schedule?.serviceItem || '未知项目'}，技师：${schedule?.technicianName || '未知'}，时长：${actualDuration || '未知'}分钟`,
      createdBy: operator,
      createdByRole: operatorRole,
      createdAt: new Date()
    });
  }

  record.updatedAt = new Date();
  return record;
}

export function confirmPaymentAndComplete(recordId: string, amount: number, operator?: string, operatorRole?: UserRole): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (!record) return undefined;

  record.paidAmount = amount;
  record.status = 'completed';

  if (operator && operatorRole) {
    record.notes.push({
      id: `note-${Date.now()}`,
      type: 'general',
      content: `确认收款 ¥${amount}，订单完成`,
      createdBy: operator,
      createdByRole: operatorRole,
      createdAt: new Date()
    });
  }

  record.updatedAt = new Date();
  return record;
}

export function updateHandTagStatus(
  recordId: string, 
  status: ConsumptionRecord['handTagStatus'], 
  reason?: string,
  supplementaryNotes?: string,
  operator?: string,
  operatorRole?: UserRole
): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    record.handTagStatus = status;
    
    if (status === 'lost' && reason) {
      record.handTagLostReason = reason;
      record.handTagLostAt = new Date();
      
      if (operator && operatorRole) {
        addIssue(recordId, {
          type: 'hand_tag_lost',
          reason,
          supplementaryNotes: supplementaryNotes || '',
          createdBy: operator,
          createdByRole: operatorRole
        });
      }
    }
    
    if (status === 'returned') {
      const openIssue = record.issues.find(i => i.type === 'hand_tag_lost' && i.status === 'open');
      if (openIssue && operator) {
        resolveIssue(recordId, openIssue.id, operator);
      }
    }
    
    record.updatedAt = new Date();
  }
  return record;
}

export function updateLockerStatus(
  recordId: string, 
  status: ConsumptionRecord['lockerStatus'], 
  reason?: string,
  supplementaryNotes?: string,
  operator?: string,
  operatorRole?: UserRole
): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    record.lockerStatus = status;
    
    if (status === 'complaint' && reason) {
      record.lockerComplaintReason = reason;
      record.lockerComplaintAt = new Date();
      
      if (operator && operatorRole) {
        addIssue(recordId, {
          type: 'locker_complaint',
          reason,
          supplementaryNotes: supplementaryNotes || '',
          createdBy: operator,
          createdByRole: operatorRole
        });
      }
    }
    
    if (status === 'normal') {
      const openIssue = record.issues.find(i => i.type === 'locker_complaint' && i.status === 'open');
      if (openIssue && operator) {
        resolveIssue(recordId, openIssue.id, operator);
      }
    }
    
    record.updatedAt = new Date();
  }
  return record;
}

export function processPayment(recordId: string, amount: number): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    record.paidAmount = amount;
    record.updatedAt = new Date();
  }
  return record;
}

export function rejectCheckout(recordId: string, reason: string, supplementaryNotes: string, operator: string, operatorRole: UserRole): ConsumptionRecord | undefined {
  const record = records.find(r => r.id === recordId);
  if (record) {
    record.rejectionReason = reason;
    
    addIssue(recordId, {
      type: 'checkout_rejection',
      reason,
      supplementaryNotes,
      createdBy: operator,
      createdByRole: operatorRole
    });
    
    record.updatedAt = new Date();
  }
  return record;
}
