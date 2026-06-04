import type { Bed, Resident, NursingLevel, Notification, UserRole } from '@/types';

const residents: Resident[] = [
  { id: 'r1', name: '张秀兰', age: 82, gender: 'female', admissionDate: '2025-03-15', nursingLevel: 3, bedId: 'b101', notes: [], status: 'active' },
  { id: 'r2', name: '王建国', age: 78, gender: 'male', admissionDate: '2025-01-20', nursingLevel: 2, bedId: 'b102', notes: [], status: 'active' },
  { id: 'r3', name: '李淑芬', age: 85, gender: 'female', admissionDate: '2024-11-05', nursingLevel: 5, bedId: 'b103', notes: [], status: 'active' },
  { id: 'r4', name: '赵德明', age: 76, gender: 'male', admissionDate: '2025-05-10', nursingLevel: 1, bedId: 'b201', notes: [], status: 'active' },
  { id: 'r5', name: '孙桂英', age: 88, gender: 'female', admissionDate: '2024-08-22', nursingLevel: 4, bedId: 'b202', notes: [], status: 'active' },
  { id: 'r6', name: '周志强', age: 73, gender: 'male', admissionDate: '2025-04-18', nursingLevel: 2, bedId: 'b203', notes: [], status: 'active' },
  { id: 'r7', name: '吴美华', age: 81, gender: 'female', admissionDate: '2025-02-28', nursingLevel: 3, bedId: 'b301', notes: [], status: 'active' },
  { id: 'r8', name: '郑国栋', age: 79, gender: 'male', admissionDate: '2024-12-12', nursingLevel: 4, bedId: 'b302', notes: [], status: 'active' },
  { id: 'r9', name: '陈凤英', age: 90, gender: 'female', admissionDate: '2024-06-30', nursingLevel: 5, bedId: 'b303', notes: [], status: 'active' },
  { id: 'r10', name: '刘长青', age: 75, gender: 'male', admissionDate: '2025-06-01', nursingLevel: 1, bedId: 'b304', notes: [], status: 'active' },
  { id: 'r11', name: '杨秀珍', age: 84, gender: 'female', admissionDate: '2025-03-08', nursingLevel: 3, bedId: 'b305', notes: [], status: 'active' },
  { id: 'r12', name: '黄永福', age: 77, gender: 'male', admissionDate: '2025-05-25', nursingLevel: 2, bedId: 'b306', notes: [], status: 'active' },
  { id: 'r13', name: '马秀芳', age: 86, gender: 'female', admissionDate: '2024-09-15', nursingLevel: 5, bedId: 'b307', notes: [], status: 'active' },
  { id: 'r14', name: '何振华', age: 74, gender: 'male', admissionDate: '2025-04-02', nursingLevel: 2, bedId: 'b308', notes: [], status: 'active' },
  { id: 'r15', name: '林玉梅', age: 83, gender: 'female', admissionDate: '2024-10-18', nursingLevel: 4, bedId: 'b309', notes: [], status: 'active' },
];

const beds: Bed[] = [
  { id: 'b101', roomNumber: '101', bedNumber: '1', floor: 1, status: 'occupied', residentId: 'r1', notes: [
    { id: 'n1', content: '入住时家属反映老人夜间需要协助如厕', source: 'bed_arrangement', transferredToNursingLevel: true, createdAt: '2025-03-15T09:00:00', createdBy: 'nursing_supervisor' },
  ]},
  { id: 'b102', roomNumber: '101', bedNumber: '2', floor: 1, status: 'occupied', residentId: 'r2', notes: [] },
  { id: 'b103', roomNumber: '101', bedNumber: '3', floor: 1, status: 'occupied', residentId: 'r3', notes: [
    { id: 'n2', content: '需24小时陪护，有压疮风险', source: 'bed_arrangement', transferredToNursingLevel: true, createdAt: '2024-11-05T14:30:00', createdBy: 'nursing_supervisor' },
    { id: 'n3', content: '压疮评估已更新，需增加翻身频次', source: 'nursing_level', transferredToNursingLevel: true, createdAt: '2025-05-20T10:00:00', createdBy: 'care_worker' },
  ]},
  { id: 'b201', roomNumber: '201', bedNumber: '1', floor: 2, status: 'occupied', residentId: 'r4', notes: [] },
  { id: 'b202', roomNumber: '201', bedNumber: '2', floor: 2, status: 'occupied', residentId: 'r5', notes: [
    { id: 'n4', content: '老人情绪不稳定，需关注心理状态', source: 'bed_arrangement', transferredToNursingLevel: false, createdAt: '2024-08-22T11:00:00', createdBy: 'social_worker' },
  ]},
  { id: 'b203', roomNumber: '201', bedNumber: '3', floor: 2, status: 'occupied', residentId: 'r6', notes: [] },
  { id: 'b301', roomNumber: '301', bedNumber: '1', floor: 3, status: 'occupied', residentId: 'r7', notes: [] },
  { id: 'b302', roomNumber: '301', bedNumber: '2', floor: 3, status: 'pending_adjustment', residentId: 'r8', notes: [
    { id: 'n5', content: '近期食欲下降，需关注营养摄入', source: 'bed_arrangement', transferredToNursingLevel: true, createdAt: '2025-02-28T16:00:00', createdBy: 'care_worker' },
    { id: 'n14', content: '退回 - 健康状况变化：需要重新评估护理等级，建议升级至五级护理（发生时间：2025/5/28 14:30:00）', source: 'anomaly_return', transferredToNursingLevel: true, createdAt: '2025-06-04T07:00:00', createdBy: 'nursing_supervisor' },
  ]},
  { id: 'b303', roomNumber: '301', bedNumber: '3', floor: 3, status: 'occupied', residentId: 'r9', notes: [] },
  { id: 'b304', roomNumber: '302', bedNumber: '1', floor: 3, status: 'occupied', residentId: 'r10', notes: [] },
  { id: 'b305', roomNumber: '302', bedNumber: '2', floor: 3, status: 'occupied', residentId: 'r11', notes: [] },
  { id: 'b306', roomNumber: '302', bedNumber: '3', floor: 3, status: 'occupied', residentId: 'r12', notes: [] },
  { id: 'b307', roomNumber: '303', bedNumber: '1', floor: 3, status: 'occupied', residentId: 'r13', notes: [] },
  { id: 'b308', roomNumber: '303', bedNumber: '2', floor: 3, status: 'occupied', residentId: 'r14', notes: [] },
  { id: 'b309', roomNumber: '303', bedNumber: '3', floor: 3, status: 'occupied', residentId: 'r15', notes: [] },
  { id: 'b104', roomNumber: '102', bedNumber: '1', floor: 1, status: 'available', residentId: null, notes: [] },
  { id: 'b105', roomNumber: '102', bedNumber: '2', floor: 1, status: 'available', residentId: null, notes: [] },
  { id: 'b204', roomNumber: '202', bedNumber: '1', floor: 2, status: 'pending_adjustment', residentId: null, notes: [
    { id: 'n6', content: '需调整为无障碍床位，等待工程部处理', source: 'bed_arrangement', transferredToNursingLevel: false, createdAt: '2025-05-28T09:00:00', createdBy: 'nursing_supervisor' },
  ]},
  { id: 'b205', roomNumber: '202', bedNumber: '2', floor: 2, status: 'maintenance', residentId: null, notes: [] },
];

const nursingLevels: NursingLevel[] = [
  {
    id: 'nl1', residentId: 'r1', level: 3, source: 'bed_arrangement', status: 'confirmed',
    createdAt: '2025-03-15T09:30:00', confirmedAt: '2025-03-15T10:00:00',
    anomalyDetail: null,
    notes: [{ id: 'n1', content: '入住时家属反映老人夜间需要协助如厕', source: 'bed_arrangement', transferredToNursingLevel: true, createdAt: '2025-03-15T09:00:00', createdBy: 'nursing_supervisor' }],
    history: [{ id: 'h1', fromLevel: 3, toLevel: 3, source: 'bed_arrangement', changedAt: '2025-03-15T10:00:00', changedBy: 'nursing_supervisor', note: '初始评估' }],
  },
  {
    id: 'nl2', residentId: 'r3', level: 5, source: 'bed_arrangement', status: 'confirmed',
    createdAt: '2024-11-05T15:00:00', confirmedAt: '2024-11-05T16:00:00',
    anomalyDetail: null,
    notes: [
      { id: 'n2', content: '需24小时陪护，有压疮风险', source: 'bed_arrangement', transferredToNursingLevel: true, createdAt: '2024-11-05T14:30:00', createdBy: 'nursing_supervisor' },
      { id: 'n3', content: '压疮评估已更新，需增加翻身频次', source: 'nursing_level', transferredToNursingLevel: true, createdAt: '2025-05-20T10:00:00', createdBy: 'care_worker' },
    ],
    history: [
      { id: 'h2', fromLevel: 5, toLevel: 5, source: 'bed_arrangement', changedAt: '2024-11-05T16:00:00', changedBy: 'nursing_supervisor', note: '初始评估' },
      { id: 'h3', fromLevel: 4, toLevel: 5, source: 'periodic_assessment', changedAt: '2025-05-20T10:00:00', changedBy: 'care_worker', note: '压疮风险升级' },
    ],
  },
  {
    id: 'nl3', residentId: 'r5', level: 4, source: 'bed_arrangement', status: 'anomaly',
    createdAt: '2024-08-22T11:30:00', confirmedAt: null,
    anomalyDetail: { type: 'behavior_change', description: '近期频繁拒绝进食，情绪波动大，家属反映有攻击性行为', action: 'alert', occurredAt: '2025-06-03T10:00:00' },
    notes: [
      { id: 'n4', content: '老人情绪不稳定，需关注心理状态', source: 'bed_arrangement', transferredToNursingLevel: false, createdAt: '2024-08-22T11:00:00', createdBy: 'social_worker' },
    ],
    history: [{ id: 'h4', fromLevel: 4, toLevel: 4, source: 'bed_arrangement', changedAt: '2024-08-22T12:00:00', changedBy: 'nursing_supervisor', note: '初始评估' }],
  },
  {
    id: 'nl4', residentId: 'r8', level: 4, source: 'periodic_assessment', status: 'returned',
    createdAt: '2025-05-25T14:00:00', confirmedAt: null,
    anomalyDetail: { type: 'health_change', description: '血压持续偏高，当前护理等级可能不足', action: 'return', occurredAt: '2025-05-28T14:30:00', returnedFrom: 'nursing_level', returnReason: '需要重新评估护理等级，建议升级至五级护理' },
    notes: [
      { id: 'n5', content: '近期食欲下降，需关注营养摄入', source: 'bed_arrangement', transferredToNursingLevel: true, createdAt: '2025-02-28T16:00:00', createdBy: 'care_worker' },
    ],
    history: [
      { id: 'h5', fromLevel: 3, toLevel: 4, source: 'bed_arrangement', changedAt: '2025-02-28T17:00:00', changedBy: 'nursing_supervisor', note: '初始评估' },
      { id: 'h6', fromLevel: 4, toLevel: 4, source: 'periodic_assessment', changedAt: '2025-05-25T14:00:00', changedBy: 'care_worker', note: '定期评估中发现异常' },
    ],
  },
  {
    id: 'nl5', residentId: 'r7', level: 3, source: 'bed_arrangement', status: 'pending',
    createdAt: '2025-06-01T08:00:00', confirmedAt: null, anomalyDetail: null,
    notes: [], history: [],
  },
  {
    id: 'nl6', residentId: 'r9', level: 5, source: 'bed_arrangement', status: 'confirmed',
    createdAt: '2024-06-30T10:00:00', confirmedAt: '2024-06-30T11:00:00',
    anomalyDetail: null,
    notes: [],
    history: [{ id: 'h7', fromLevel: 5, toLevel: 5, source: 'bed_arrangement', changedAt: '2024-06-30T11:00:00', changedBy: 'nursing_supervisor', note: '初始评估' }],
  },
  {
    id: 'nl7', residentId: 'r11', level: 3, source: 'periodic_assessment', status: 'pending',
    createdAt: '2025-06-03T09:00:00', confirmedAt: null, anomalyDetail: null,
    notes: [],
    history: [{ id: 'h8', fromLevel: 2, toLevel: 3, source: 'periodic_assessment', changedAt: '2025-06-03T09:00:00', changedBy: 'care_worker', note: '定期评估升级' }],
  },
  {
    id: 'nl8', residentId: 'r15', level: 4, source: 'anomaly_report', status: 'anomaly',
    createdAt: '2025-06-02T15:00:00', confirmedAt: null,
    anomalyDetail: { type: 'family_complaint', description: '家属反映护理不到位，要求更换护理方案', action: 'alert', occurredAt: '2025-06-02T14:00:00' },
    notes: [],
    history: [{ id: 'h9', fromLevel: 3, toLevel: 4, source: 'anomaly_report', changedAt: '2025-06-02T15:00:00', changedBy: 'social_worker', note: '家属投诉触发升级' }],
  },
  {
    id: 'nl9', residentId: 'r13', level: 5, source: 'bed_arrangement', status: 'pending',
    createdAt: '2025-06-04T07:00:00', confirmedAt: null, anomalyDetail: null,
    notes: [],
    history: [],
  },
  {
    id: 'nl10', residentId: 'r10', level: 1, source: 'bed_arrangement', status: 'pending',
    createdAt: '2025-06-01T09:00:00', confirmedAt: null, anomalyDetail: null,
    notes: [],
    history: [],
  },
];

const notifications: Notification[] = [
  { id: 'nt1', type: 'anomaly', title: '异常标记', description: '孙桂英（202房）行为异常，需关注', read: false, createdAt: '2025-06-04T08:30:00', relatedId: 'nl3', relatedType: 'nursing_level' },
  { id: 'nt2', type: 'return', title: '退回通知', description: '郑国栋（302房）护理等级评估已退回，需重新安排', read: false, createdAt: '2025-06-04T07:00:00', relatedId: 'nl4', relatedType: 'nursing_level' },
  { id: 'nt3', type: 'anomaly', title: '家属投诉', description: '林玉梅（303房）家属投诉护理不到位', read: false, createdAt: '2025-06-02T15:00:00', relatedId: 'nl8', relatedType: 'nursing_level' },
  { id: 'nt4', type: 'level_change', title: '等级变更', description: '杨秀珍护理等级从二级升至三级', read: true, createdAt: '2025-06-03T09:00:00', relatedId: 'nl7', relatedType: 'nursing_level' },
  { id: 'nt5', type: 'task', title: '待评估', description: '吴美华（301房）护理等级待评估', read: true, createdAt: '2025-06-01T08:00:00', relatedId: 'nl5', relatedType: 'nursing_level' },
];

export const mockData = {
  residents,
  beds,
  nursingLevels,
  notifications,
};

export function getInitialData() {
  const stored = localStorage.getItem('nursing_home_data');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return mockData;
    }
  }
  return mockData;
}

export function persistData(data: typeof mockData) {
  localStorage.setItem('nursing_home_data', JSON.stringify(data));
}
