export interface User {
  id: string
  name: string
  role: 'teacher' | 'volunteer' | 'manager'
  department: string
}

export interface Material {
  id: string
  name: string
  quantity: number
  requiredQuantity: number
  status: 'ready' | 'missing' | 'partial'
}

export interface Course {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  maxParticipants: number
  currentParticipants: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'
  materials: Material[]
  teacherId: string
  submitterId: string
  createdAt: string
  updatedAt: string
  timeline: TimelineItem[]
  issues: Issue[]
}

export interface TimelineItem {
  id: string
  action: string
  actorId: string
  actorName: string
  timestamp: string
  description: string
}

export interface Issue {
  id: string
  type: 'missing_material' | 'timeout' | 'review_failed'
  title: string
  description: string
  status: 'open' | 'resolved'
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface Registration {
  id: string
  courseId: string
  participantName: string
  phone: string
  email: string
  status: 'confirmed' | 'waitlist' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface WaitlistEntry {
  id: string
  courseId: string
  participantName: string
  phone: string
  email: string
  position: number
  status: 'active' | 'promoted' | 'rejected' | 'cancelled'
  createdAt: string
  updatedAt: string
  promotedAt?: string
}

export interface TeacherSchedule {
  id: string
  teacherId: string
  courseId: string
  date: string
  status: 'assigned' | 'confirmed' | 'completed' | 'cancelled'
  assignedAt: string
  confirmedAt?: string
}

export const users: User[] = [
  { id: 'u1', name: '王老师', role: 'teacher', department: '社教部' },
  { id: 'u2', name: '李老师', role: 'teacher', department: '社教部' },
  { id: 'u3', name: '张老师', role: 'teacher', department: '社教部' },
  { id: 'u4', name: '陈志愿者', role: 'volunteer', department: '志愿者团队' },
  { id: 'u5', name: '刘主管', role: 'manager', department: '活动管理部' },
  { id: 'u6', name: '赵主管', role: 'manager', department: '活动管理部' },
]

export const materials: Material[] = [
  { id: 'm1', name: '考古工具套装', quantity: 10, requiredQuantity: 15, status: 'partial' },
  { id: 'm2', name: '文物复制品', quantity: 0, requiredQuantity: 8, status: 'missing' },
  { id: 'm3', name: '讲解手册', quantity: 50, requiredQuantity: 50, status: 'ready' },
  { id: 'm4', name: '投影设备', quantity: 1, requiredQuantity: 1, status: 'ready' },
  { id: 'm5', name: '互动道具', quantity: 0, requiredQuantity: 20, status: 'missing' },
]

export const courses: Course[] = [
  {
    id: 'c1',
    title: '青铜器修复体验课',
    description: '让参与者亲身体验青铜器修复的过程，了解文物保护的基本知识和技巧。',
    date: '2024-07-15',
    startTime: '09:00',
    endTime: '12:00',
    location: '博物馆多功能厅',
    maxParticipants: 20,
    currentParticipants: 18,
    status: 'approved',
    materials: [
      { id: 'm1', name: '青铜修复工具', quantity: 18, requiredQuantity: 20, status: 'partial' },
      { id: 'm2', name: '青铜碎片样品', quantity: 0, requiredQuantity: 20, status: 'missing' },
      { id: 'm3', name: '修复手册', quantity: 20, requiredQuantity: 20, status: 'ready' },
    ],
    teacherId: 'u1',
    submitterId: 'u1',
    createdAt: '2024-06-01T09:00:00Z',
    updatedAt: '2024-06-15T14:30:00Z',
    timeline: [
      { id: 't1', action: 'submit', actorId: 'u1', actorName: '王老师', timestamp: '2024-06-01T09:00:00Z', description: '提交课程申请' },
      { id: 't2', action: 'review', actorId: 'u5', actorName: '刘主管', timestamp: '2024-06-03T10:00:00Z', description: '审核通过' },
      { id: 't3', action: 'material_check', actorId: 'u4', actorName: '陈志愿者', timestamp: '2024-06-10T14:00:00Z', description: '检查物料清单' },
    ],
    issues: [
      { id: 'i1', type: 'missing_material', title: '缺青铜碎片样品', description: '需要20个青铜碎片样品，目前库存为0', status: 'open', createdAt: '2024-06-10T14:30:00Z' },
      { id: 'i2', type: 'missing_material', title: '修复工具不足', description: '需要20套修复工具，目前只有18套', status: 'open', createdAt: '2024-06-10T14:35:00Z' },
    ]
  },
  {
    id: 'c2',
    title: '古画鉴赏工作坊',
    description: '深入了解中国古代绘画艺术，学习古画鉴赏的基本方法。',
    date: '2024-07-20',
    startTime: '14:00',
    endTime: '17:00',
    location: '书画展厅',
    maxParticipants: 15,
    currentParticipants: 15,
    status: 'approved',
    materials: [
      { id: 'm1', name: '古画复制品', quantity: 15, requiredQuantity: 15, status: 'ready' },
      { id: 'm2', name: '放大镜', quantity: 10, requiredQuantity: 15, status: 'partial' },
      { id: 'm3', name: '鉴赏指南', quantity: 15, requiredQuantity: 15, status: 'ready' },
    ],
    teacherId: 'u2',
    submitterId: 'u2',
    createdAt: '2024-06-05T11:00:00Z',
    updatedAt: '2024-06-18T09:00:00Z',
    timeline: [
      { id: 't1', action: 'submit', actorId: 'u2', actorName: '李老师', timestamp: '2024-06-05T11:00:00Z', description: '提交课程申请' },
      { id: 't2', action: 'review', actorId: 'u6', actorName: '赵主管', timestamp: '2024-06-08T15:00:00Z', description: '审核通过' },
      { id: 't3', action: 'material_check', actorId: 'u4', actorName: '陈志愿者', timestamp: '2024-06-15T10:00:00Z', description: '检查物料清单' },
      { id: 't4', action: 'registration_open', actorId: 'u5', actorName: '刘主管', timestamp: '2024-06-18T09:00:00Z', description: '开放报名' },
    ],
    issues: [
      { id: 'i1', type: 'missing_material', title: '放大镜不足', description: '需要15个放大镜，目前只有10个', status: 'open', createdAt: '2024-06-15T10:30:00Z' },
    ]
  },
  {
    id: 'c3',
    title: '陶艺制作体验',
    description: '亲身体验传统陶艺制作工艺，制作属于自己的陶艺作品。',
    date: '2024-07-25',
    startTime: '09:00',
    endTime: '12:00',
    location: '陶艺工作室',
    maxParticipants: 12,
    currentParticipants: 12,
    status: 'submitted',
    materials: [
      { id: 'm1', name: '陶土', quantity: 0, requiredQuantity: 24, status: 'missing' },
      { id: 'm2', name: '陶艺工具', quantity: 10, requiredQuantity: 12, status: 'partial' },
      { id: 'm3', name: '釉料', quantity: 12, requiredQuantity: 12, status: 'ready' },
    ],
    teacherId: 'u3',
    submitterId: 'u3',
    createdAt: '2024-06-10T14:00:00Z',
    updatedAt: '2024-06-10T14:00:00Z',
    timeline: [
      { id: 't1', action: 'submit', actorId: 'u3', actorName: '张老师', timestamp: '2024-06-10T14:00:00Z', description: '提交课程申请' },
    ],
    issues: [
      { id: 'i1', type: 'missing_material', title: '陶土库存不足', description: '需要24公斤陶土，目前库存为0', status: 'open', createdAt: '2024-06-10T14:15:00Z' },
      { id: 'i2', type: 'timeout', title: '物料准备超时', description: '距离开课还有15天，关键物料仍未准备', status: 'open', createdAt: '2024-06-18T09:00:00Z' },
    ]
  },
  {
    id: 'c4',
    title: '甲骨文探秘',
    description: '探索中国最早的文字形式，了解甲骨文的发现和研究历程。',
    date: '2024-07-30',
    startTime: '14:00',
    endTime: '17:00',
    location: '甲骨文展厅',
    maxParticipants: 25,
    currentParticipants: 5,
    status: 'draft',
    materials: [
      { id: 'm1', name: '甲骨片复制品', quantity: 0, requiredQuantity: 25, status: 'missing' },
      { id: 'm2', name: '拓印工具', quantity: 0, requiredQuantity: 25, status: 'missing' },
      { id: 'm3', name: '甲骨文手册', quantity: 0, requiredQuantity: 25, status: 'missing' },
    ],
    teacherId: 'u1',
    submitterId: 'u4',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
    timeline: [
      { id: 't1', action: 'draft', actorId: 'u4', actorName: '陈志愿者', timestamp: '2024-06-15T10:00:00Z', description: '创建课程草稿' },
    ],
    issues: []
  },
  {
    id: 'c5',
    title: '古代建筑模型制作',
    description: '学习中国古代建筑的结构特点，亲手制作建筑模型。',
    date: '2024-08-01',
    startTime: '09:00',
    endTime: '12:00',
    location: '青少年活动中心',
    maxParticipants: 10,
    currentParticipants: 10,
    status: 'rejected',
    materials: [
      { id: 'm1', name: '建筑材料包', quantity: 0, requiredQuantity: 10, status: 'missing' },
      { id: 'm2', name: '图纸', quantity: 10, requiredQuantity: 10, status: 'ready' },
    ],
    teacherId: 'u2',
    submitterId: 'u2',
    createdAt: '2024-06-08T16:00:00Z',
    updatedAt: '2024-06-12T11:00:00Z',
    timeline: [
      { id: 't1', action: 'submit', actorId: 'u2', actorName: '李老师', timestamp: '2024-06-08T16:00:00Z', description: '提交课程申请' },
      { id: 't2', action: 'review', actorId: 'u5', actorName: '刘主管', timestamp: '2024-06-12T11:00:00Z', description: '审核未通过' },
    ],
    issues: [
      { id: 'i1', type: 'review_failed', title: '课程内容不符合要求', description: '课程主题与博物馆定位不符，需要重新调整', status: 'resolved', createdAt: '2024-06-12T11:00:00Z', resolvedAt: '2024-06-12T11:30:00Z', resolvedBy: 'u5' },
    ]
  },
]

export const registrations: Registration[] = [
  { id: 'r1', courseId: 'c1', participantName: '张三', phone: '13800138001', email: 'zhangsan@example.com', status: 'confirmed', createdAt: '2024-06-16T09:00:00Z', updatedAt: '2024-06-16T09:00:00Z' },
  { id: 'r2', courseId: 'c1', participantName: '李四', phone: '13800138002', email: 'lisi@example.com', status: 'confirmed', createdAt: '2024-06-16T09:30:00Z', updatedAt: '2024-06-16T09:30:00Z' },
  { id: 'r3', courseId: 'c1', participantName: '王五', phone: '13800138003', email: 'wangwu@example.com', status: 'confirmed', createdAt: '2024-06-16T10:00:00Z', updatedAt: '2024-06-16T10:00:00Z' },
  { id: 'r4', courseId: 'c2', participantName: '赵六', phone: '13800138004', email: 'zhaoliu@example.com', status: 'confirmed', createdAt: '2024-06-18T09:00:00Z', updatedAt: '2024-06-18T09:00:00Z' },
  { id: 'r5', courseId: 'c2', participantName: '孙七', phone: '13800138005', email: 'sunqi@example.com', status: 'confirmed', createdAt: '2024-06-18T09:15:00Z', updatedAt: '2024-06-18T09:15:00Z' },
  { id: 'r6', courseId: 'c3', participantName: '周八', phone: '13800138006', email: 'zhouba@example.com', status: 'confirmed', createdAt: '2024-06-12T14:00:00Z', updatedAt: '2024-06-12T14:00:00Z' },
]

export const waitlist: WaitlistEntry[] = [
  { id: 'w1', courseId: 'c1', participantName: '吴九', phone: '13800138007', email: 'wujiu@example.com', position: 1, status: 'active', createdAt: '2024-06-16T11:00:00Z', updatedAt: '2024-06-16T11:00:00Z' },
  { id: 'w2', courseId: 'c1', participantName: '郑十', phone: '13800138008', email: 'zhengshi@example.com', position: 2, status: 'active', createdAt: '2024-06-16T11:30:00Z', updatedAt: '2024-06-16T11:30:00Z' },
  { id: 'w3', courseId: 'c2', participantName: '钱十一', phone: '13800138009', email: 'qianshiyi@example.com', position: 1, status: 'active', createdAt: '2024-06-18T10:00:00Z', updatedAt: '2024-06-18T10:00:00Z' },
  { id: 'w4', courseId: 'c2', participantName: '冯十二', phone: '13800138010', email: 'fengshi@er@example.com', position: 2, status: 'active', createdAt: '2024-06-18T10:30:00Z', updatedAt: '2024-06-18T10:30:00Z' },
  { id: 'w5', courseId: 'c3', participantName: '陈十三', phone: '13800138011', email: 'chenshisan@example.com', position: 1, status: 'active', createdAt: '2024-06-14T09:00:00Z', updatedAt: '2024-06-14T09:00:00Z' },
]

export const schedules: TeacherSchedule[] = [
  { id: 's1', teacherId: 'u1', courseId: 'c1', date: '2024-07-15', status: 'confirmed', assignedAt: '2024-06-03T10:00:00Z', confirmedAt: '2024-06-03T11:00:00Z' },
  { id: 's2', teacherId: 'u2', courseId: 'c2', date: '2024-07-20', status: 'confirmed', assignedAt: '2024-06-08T15:00:00Z', confirmedAt: '2024-06-09T09:00:00Z' },
  { id: 's3', teacherId: 'u3', courseId: 'c3', date: '2024-07-25', status: 'assigned', assignedAt: '2024-06-10T14:00:00Z' },
]
