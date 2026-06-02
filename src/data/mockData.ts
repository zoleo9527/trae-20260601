import type { Appointment, Counselor, TriageItem, RiskCase, ScaleRecord, TodoItem, User, CounselorSchedule } from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: '张接待', role: 'reception' },
  { id: 'u2', name: '李咨询师', role: 'counselor' },
  { id: 'u3', name: '王督导', role: 'supervisor' },
];

export const mockCounselors: Counselor[] = [
  { id: 'c1', name: '陈咨询师', specialty: ['焦虑障碍', '青少年心理'] },
  { id: 'c2', name: '刘咨询师', specialty: ['抑郁障碍', '亲密关系'] },
  { id: 'c3', name: '周咨询师', specialty: ['创伤后应激', '职场压力'] },
  { id: 'c4', name: '赵咨询师', specialty: ['家庭治疗', '自我成长'] },
];

export const mockAppointments: Appointment[] = [
  { id: 'a1', clientId: 'cl1', clientName: '来访者001', counselorId: 'c1', counselorName: '陈咨询师', date: '2026-06-02', time: '09:00', type: 'followup', status: 'scheduled', scaleStatus: 'submitted', createdAt: '2026-05-28' },
  { id: 'a2', clientId: 'cl2', clientName: '来访者002', counselorId: 'c2', counselorName: '刘咨询师', date: '2026-06-02', time: '10:00', type: 'initial', status: 'scheduled', scaleStatus: 'sent', createdAt: '2026-05-30' },
  { id: 'a3', clientId: 'cl3', clientName: '来访者003', counselorId: 'c1', counselorName: '陈咨询师', date: '2026-06-02', time: '14:00', type: 'followup', status: 'scheduled', scaleStatus: 'not_sent', createdAt: '2026-05-25' },
  { id: 'a4', clientId: 'cl4', clientName: '来访者004', counselorId: null, date: '2026-06-02', time: '15:00', type: 'initial', status: 'pending', scaleStatus: 'not_sent', createdAt: '2026-06-01' },
  { id: 'a5', clientId: 'cl5', clientName: '来访者005', counselorId: 'c3', counselorName: '周咨询师', date: '2026-06-02', time: '16:00', type: 'followup', status: 'rescheduled', scaleStatus: 'submitted', rescheduleRequest: { reason: '临时有事需要改期', requestedDate: '2026-06-03', requestedTime: '10:00' }, createdAt: '2026-05-20' },
  { id: 'a6', clientId: 'cl6', clientName: '来访者006', counselorId: 'c2', counselorName: '刘咨询师', date: '2026-06-03', time: '09:00', type: 'followup', status: 'scheduled', scaleStatus: 'retest_needed', createdAt: '2026-05-15' },
  { id: 'a7', clientId: 'cl7', clientName: '来访者007', counselorId: 'c4', counselorName: '赵咨询师', date: '2026-06-03', time: '11:00', type: 'initial', status: 'scheduled', scaleStatus: 'not_sent', createdAt: '2026-06-01' },
  { id: 'a8', clientId: 'cl8', clientName: '来访者008', counselorId: 'c1', counselorName: '陈咨询师', date: '2026-06-03', time: '14:00', type: 'followup', status: 'scheduled', scaleStatus: 'sent', createdAt: '2026-05-10' },
  { id: 'a9', clientId: 'cl9', clientName: '来访者009', counselorId: null, date: '2026-06-04', time: '10:00', type: 'initial', status: 'pending', scaleStatus: 'not_sent', createdAt: '2026-06-02' },
  { id: 'a10', clientId: 'cl10', clientName: '来访者010', counselorId: 'c3', counselorName: '周咨询师', date: '2026-06-01', time: '15:00', type: 'followup', status: 'completed', scaleStatus: 'submitted', createdAt: '2026-05-05' },
  { id: 'a11', clientId: 'cl11', clientName: '来访者011', counselorId: 'c2', counselorName: '刘咨询师', date: '2026-06-01', time: '09:00', type: 'followup', status: 'completed', scaleStatus: 'retest_submitted', createdAt: '2026-04-28' },
  { id: 'a12', clientId: 'cl12', clientName: '来访者012', counselorId: 'c4', counselorName: '赵咨询师', date: '2026-06-04', time: '14:00', type: 'followup', status: 'scheduled', scaleStatus: 'submitted', createdAt: '2026-05-18' },
  { id: 'a13', clientId: 'cl13', clientName: '来访者013', counselorId: 'c1', counselorName: '陈咨询师', date: '2026-06-05', time: '10:00', type: 'initial', status: 'scheduled', scaleStatus: 'sent', createdAt: '2026-06-02' },
  { id: 'a14', clientId: 'cl14', clientName: '来访者014', counselorId: null, date: '2026-06-05', time: '14:00', type: 'initial', status: 'pending', scaleStatus: 'not_sent', createdAt: '2026-06-02' },
  { id: 'a15', clientId: 'cl15', clientName: '来访者015', counselorId: 'c3', counselorName: '周咨询师', date: '2026-06-03', time: '15:00', type: 'followup', status: 'rescheduled', scaleStatus: 'submitted', rescheduleRequest: { reason: '身体不适需改期', requestedDate: '2026-06-06', requestedTime: '09:00' }, createdAt: '2026-05-22' },
  { id: 'a16', clientId: 'cl16', clientName: '来访者016', counselorId: 'c2', counselorName: '刘咨询师', date: '2026-06-04', time: '15:00', type: 'followup', status: 'scheduled', scaleStatus: 'not_sent', createdAt: '2026-05-28' },
];

export const mockTriageItems: TriageItem[] = [
  { id: 't1', appointmentId: 'a4', clientName: '来访者004', intakeNotes: '自述近一个月睡眠差，情绪低落，对事物兴趣减退', suggestedCounselors: ['c1', 'c2'], assignedCounselorId: null, status: 'pending', createdAt: '2026-06-01' },
  { id: 't2', appointmentId: 'a9', clientName: '来访者009', intakeNotes: '职场压力大，经常焦虑，影响工作效率', suggestedCounselors: ['c3', 'c1'], assignedCounselorId: null, status: 'pending', createdAt: '2026-06-02' },
  { id: 't3', appointmentId: 'a14', clientName: '来访者014', intakeNotes: '青少年来访者，家长反映孩子厌学、情绪波动大', suggestedCounselors: ['c1', 'c4'], assignedCounselorId: null, status: 'pending', createdAt: '2026-06-02' },
  { id: 't4', appointmentId: 'a7', clientName: '来访者007', intakeNotes: '家庭关系紧张，希望改善沟通模式', suggestedCounselors: ['c4'], assignedCounselorId: 'c4', status: 'assigned', createdAt: '2026-06-01' },
];

export const mockRiskCases: RiskCase[] = [
  { id: 'r1', appointmentId: 'a10', clientName: '来访者010', counselorName: '周咨询师', riskLevel: 'high', riskIndicators: ['自杀意念', '严重抑郁', '社会隔离'], status: 'pending_review', reportedAt: '2026-06-01 17:30' },
  { id: 'r2', appointmentId: 'a6', clientName: '来访者006', counselorName: '刘咨询师', riskLevel: 'critical', riskIndicators: ['自伤行为史', '近期应激事件', '无社会支持'], status: 'pending_review', reportedAt: '2026-06-02 08:15' },
  { id: 'r3', appointmentId: 'a11', clientName: '来访者011', counselorName: '刘咨询师', riskLevel: 'high', riskIndicators: ['物质滥用', '家庭冲突', '冲动行为'], status: 'reviewed', reportedAt: '2026-06-01 10:00', reviewedAt: '2026-06-01 14:30', supervisorNotes: '建议增加咨询频率，安排紧急联系人' },
];

export const mockScaleRecords: ScaleRecord[] = [
  { id: 's1', appointmentId: 'a1', clientName: '来访者001', scaleType: 'SCL-90', status: 'submitted', sentAt: '2026-05-29', submittedAt: '2026-05-31', clientNotified: true, needsRetest: false },
  { id: 's2', appointmentId: 'a2', clientName: '来访者002', scaleType: 'PHQ-9', status: 'sent', sentAt: '2026-05-31', clientNotified: true, needsRetest: false },
  { id: 's3', appointmentId: 'a3', clientName: '来访者003', scaleType: 'GAD-7', status: 'not_sent', clientNotified: false, needsRetest: false },
  { id: 's4', appointmentId: 'a6', clientName: '来访者006', scaleType: 'SDS', status: 'retest_needed', sentAt: '2026-05-20', submittedAt: '2026-05-22', clientNotified: true, needsRetest: true, retestDeadline: '2026-06-03' },
  { id: 's5', appointmentId: 'a7', clientName: '来访者007', scaleType: 'SAS', status: 'not_sent', clientNotified: false, needsRetest: false },
  { id: 's6', appointmentId: 'a8', clientName: '来访者008', scaleType: 'SCL-90', status: 'sent', sentAt: '2026-06-01', clientNotified: true, needsRetest: false },
  { id: 's7', appointmentId: 'a11', clientName: '来访者011', scaleType: 'PHQ-9', status: 'retest_submitted', sentAt: '2026-05-15', submittedAt: '2026-05-16', clientNotified: true, needsRetest: true },
  { id: 's8', appointmentId: 'a12', clientName: '来访者012', scaleType: 'GAD-7', status: 'submitted', sentAt: '2026-05-25', submittedAt: '2026-05-28', clientNotified: true, needsRetest: false },
  { id: 's9', appointmentId: 'a13', clientName: '来访者013', scaleType: 'SDS', status: 'sent', sentAt: '2026-06-02', clientNotified: true, needsRetest: false },
  { id: 's10', appointmentId: 'a16', clientName: '来访者016', scaleType: 'SAS', status: 'not_sent', clientNotified: false, needsRetest: false },
];

export const mockTodoItems: TodoItem[] = [
  { id: 'todo1', title: '处理来访者005改期申请', description: '申请改至6月3日10:00', priority: 'high', type: 'reschedule', relatedId: 'a5', dueAt: '2026-06-02 12:00' },
  { id: 'todo2', title: '处理来访者015改期申请', description: '申请改至6月6日09:00', priority: 'medium', type: 'reschedule', relatedId: 'a15', dueAt: '2026-06-03 09:00' },
  { id: 'todo3', title: '为来访者004分配咨询师', priority: 'high', type: 'triage', relatedId: 't1', dueAt: '2026-06-02 12:00' },
  { id: 'todo4', title: '为来访者009分配咨询师', priority: 'medium', type: 'triage', relatedId: 't2', dueAt: '2026-06-03 10:00' },
  { id: 'todo5', title: '发送来访者003量表', priority: 'medium', type: 'scale', relatedId: 's3', dueAt: '2026-06-02 12:00' },
  { id: 'todo6', title: '提醒来访者006复测量表', description: '截止日期6月3日', priority: 'high', type: 'scale', relatedId: 's4', dueAt: '2026-06-02 17:00' },
  { id: 'todo7', title: '审核来访者006高风险个案', priority: 'high', type: 'risk', relatedId: 'r2', dueAt: '2026-06-02 12:00' },
  { id: 'todo8', title: '审核来访者010高风险个案', priority: 'medium', type: 'risk', relatedId: 'r1', dueAt: '2026-06-02 17:00' },
];

const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

export const mockSchedules: CounselorSchedule[] = [
  { counselorId: 'c1', date: '2026-06-02', availableSlots: ['11:00', '15:00'], bookedSlots: ['09:00', '14:00'] },
  { counselorId: 'c1', date: '2026-06-03', availableSlots: ['09:00', '10:00', '11:00', '15:00', '16:00'], bookedSlots: ['14:00'] },
  { counselorId: 'c2', date: '2026-06-02', availableSlots: ['09:00', '11:00', '14:00', '15:00', '16:00'], bookedSlots: ['10:00'] },
  { counselorId: 'c2', date: '2026-06-03', availableSlots: ['10:00', '11:00', '14:00', '15:00', '16:00'], bookedSlots: ['09:00'] },
  { counselorId: 'c3', date: '2026-06-02', availableSlots: ['09:00', '10:00', '11:00', '14:00'], bookedSlots: ['15:00', '16:00'] },
  { counselorId: 'c3', date: '2026-06-03', availableSlots: ['09:00', '11:00', '14:00', '16:00'], bookedSlots: ['10:00', '15:00'] },
  { counselorId: 'c4', date: '2026-06-02', availableSlots: timeSlots, bookedSlots: [] },
  { counselorId: 'c4', date: '2026-06-03', availableSlots: ['09:00', '10:00', '14:00', '15:00', '16:00'], bookedSlots: ['11:00'] },
];

export const currentUser = mockUsers[0];
