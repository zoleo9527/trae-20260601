import type { User, KeyPerson, VisitRecord, Issue } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: '李社工',
    role: 'socialWorker',
    phone: '13800138001',
    department: '社区志愿服务站'
  },
  {
    id: 'u2',
    name: '王队长',
    role: 'volunteerLeader',
    phone: '13800138002',
    department: '志愿者一队'
  },
  {
    id: 'u3',
    name: '张主任',
    role: 'communityLeader',
    phone: '13800138003',
    department: '社区居委会'
  }
]

export const mockKeyPersons: KeyPerson[] = [
  {
    id: 'kp1',
    name: '刘大爷',
    age: 78,
    address: '幸福小区3号楼2单元101室',
    phone: '13900139001',
    type: '孤寡老人',
    careLevel: 'high',
    description: '独居，患有高血压，需要定期送药'
  },
  {
    id: 'kp2',
    name: '陈阿姨',
    age: 65,
    address: '幸福小区5号楼1单元302室',
    phone: '13900139002',
    type: '残疾人',
    careLevel: 'high',
    description: '下肢残疾，行动不便，需协助购物'
  },
  {
    id: 'kp3',
    name: '赵奶奶',
    age: 82,
    address: '幸福小区2号楼3单元401室',
    phone: '13900139003',
    type: '空巢老人',
    careLevel: 'medium',
    description: '子女在外工作，定期探望'
  },
  {
    id: 'kp4',
    name: '孙大哥',
    age: 45,
    address: '幸福小区7号楼2单元201室',
    phone: '13900139004',
    type: '低保户',
    careLevel: 'medium',
    description: '失业，有子女在读，需要就业帮扶'
  },
  {
    id: 'kp5',
    name: '周阿姨',
    age: 70,
    address: '幸福小区1号楼1单元502室',
    phone: '13900139005',
    type: '独居老人',
    careLevel: 'low',
    description: '身体状况良好，定期电话回访'
  },
  {
    id: 'kp6',
    name: '吴大叔',
    age: 68,
    address: '幸福小区6号楼3单元102室',
    phone: '13900139006',
    type: '退役军人',
    careLevel: 'medium',
    description: '需要定期关怀慰问'
  }
]

export const mockVisitRecords: VisitRecord[] = [
  {
    id: 'v1',
    keyPersonId: 'kp1',
    keyPerson: mockKeyPersons[0],
    socialWorkerId: 'u1',
    socialWorkerName: '李社工',
    scheduledDate: '2026-06-15',
    actualDate: '2026-06-15',
    status: 'completed',
    notes: '血压控制良好，已送药',
    createdAt: '2026-06-10T10:00:00',
    updatedAt: '2026-06-15T14:30:00'
  },
  {
    id: 'v2',
    keyPersonId: 'kp2',
    keyPerson: mockKeyPersons[1],
    socialWorkerId: 'u1',
    socialWorkerName: '李社工',
    scheduledDate: '2026-06-16',
    status: 'pending',
    createdAt: '2026-06-12T09:00:00',
    updatedAt: '2026-06-12T09:00:00'
  },
  {
    id: 'v3',
    keyPersonId: 'kp3',
    keyPerson: mockKeyPersons[2],
    socialWorkerId: 'u1',
    socialWorkerName: '李社工',
    scheduledDate: '2026-06-10',
    status: 'overdue',
    notes: '电话无人接听，需要上门确认',
    createdAt: '2026-06-05T11:00:00',
    updatedAt: '2026-06-10T17:00:00'
  },
  {
    id: 'v4',
    keyPersonId: 'kp4',
    keyPerson: mockKeyPersons[3],
    socialWorkerId: 'u1',
    socialWorkerName: '李社工',
    scheduledDate: '2026-06-14',
    actualDate: '2026-06-14',
    status: 'completed',
    createdAt: '2026-06-11T10:00:00',
    updatedAt: '2026-06-14T15:00:00'
  },
  {
    id: 'v5',
    keyPersonId: 'kp5',
    keyPerson: mockKeyPersons[4],
    socialWorkerId: 'u1',
    socialWorkerName: '李社工',
    scheduledDate: '2026-06-12',
    status: 'blocked',
    notes: '老人拒绝回访，需要社区干部介入',
    createdAt: '2026-06-08T09:30:00',
    updatedAt: '2026-06-12T16:00:00'
  },
  {
    id: 'v6',
    keyPersonId: 'kp6',
    keyPerson: mockKeyPersons[5],
    socialWorkerId: 'u1',
    socialWorkerName: '李社工',
    scheduledDate: '2026-06-17',
    status: 'pending',
    createdAt: '2026-06-13T14:00:00',
    updatedAt: '2026-06-13T14:00:00'
  }
]

export const mockIssues: Issue[] = [
  {
    id: 'i1',
    visitId: 'v1',
    visitRecord: mockVisitRecords[0],
    reporterId: 'u1',
    reporterName: '李社工',
    title: '刘大爷药品短缺',
    description: '刘大爷反映降压药即将用完，需要协助购买',
    category: '生活物资',
    status: 'resolved',
    assignedTo: 'u2',
    assignedName: '王队长',
    createdAt: '2026-06-15T14:35:00',
    updatedAt: '2026-06-16T10:00:00'
  },
  {
    id: 'i2',
    visitId: 'v3',
    visitRecord: mockVisitRecords[2],
    reporterId: 'u1',
    reporterName: '李社工',
    title: '赵奶奶失联',
    description: '连续三天电话无人接听，敲门无人应答，需要上门确认安全',
    category: '紧急情况',
    status: 'processing',
    assignedTo: 'u2',
    assignedName: '王队长',
    createdAt: '2026-06-10T17:15:00',
    updatedAt: '2026-06-16T09:00:00'
  },
  {
    id: 'i3',
    visitId: 'v5',
    visitRecord: mockVisitRecords[4],
    reporterId: 'u1',
    reporterName: '李社工',
    title: '周阿姨拒绝回访',
    description: '周阿姨对回访工作有抵触情绪，不愿配合，需要社区干部沟通协调',
    category: '沟通协调',
    status: 'escalated',
    assignedTo: 'u3',
    assignedName: '张主任',
    createdAt: '2026-06-12T16:30:00',
    updatedAt: '2026-06-13T10:00:00',
    escalationReason: '社工多次沟通无效，需上级介入'
  },
  {
    id: 'i4',
    visitId: 'v4',
    visitRecord: mockVisitRecords[3],
    reporterId: 'u1',
    reporterName: '李社工',
    title: '孙大哥就业需求',
    description: '孙大哥希望找到一份稳定工作，有电工技能，需要就业推荐',
    category: '就业帮扶',
    status: 'pending',
    createdAt: '2026-06-14T15:30:00',
    updatedAt: '2026-06-14T15:30:00'
  }
]
