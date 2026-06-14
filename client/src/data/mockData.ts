import type { Student, Program, Rehearsal, Attendance, MakeupTraining } from '../types';

export const mockStudents: Student[] = [
  { id: 's1', name: '张小明', age: 12, phone: '13800138001', parentPhone: '13800138001' },
  { id: 's2', name: '李小红', age: 11, phone: '13800138002', parentPhone: '13800138002' },
  { id: 's3', name: '王小华', age: 13, phone: '13800138003', parentPhone: '13800138003' },
  { id: 's4', name: '赵小雪', age: 10, phone: '13800138004', parentPhone: '13800138004' },
  { id: 's5', name: '孙小蕾', age: 12, phone: '13800138005', parentPhone: '13800138005' },
  { id: 's6', name: '周小雨', age: 11, phone: '13800138006', parentPhone: '13800138006' },
  { id: 's7', name: '吴小燕', age: 14, phone: '13800138007', parentPhone: '13800138007' },
  { id: 's8', name: '郑小芳', age: 10, phone: '13800138008', parentPhone: '13800138008' },
];

export const mockPrograms: Program[] = [
  {
    id: 'p1',
    name: '茉莉花',
    type: '古典舞',
    duration: '4:30',
    difficulty: 'medium',
    status: 'rehearsing',
    performerCount: 6,
    riskLevel: 'medium',
    notes: '节目临时调位，需重新熟悉队形',
  },
  {
    id: 'p2',
    name: '阳光少年',
    type: '现代舞',
    duration: '3:45',
    difficulty: 'easy',
    status: 'ready',
    performerCount: 8,
    riskLevel: 'low',
    notes: '整体表现良好，个别动作需加强',
  },
  {
    id: 'p3',
    name: '飞天',
    type: '民族舞',
    duration: '5:00',
    difficulty: 'hard',
    status: 'rehearsing',
    performerCount: 5,
    riskLevel: 'high',
    notes: '高难度动作较多，需重点关注',
  },
];

export const mockRehearsals: Rehearsal[] = [
  { id: 'r1', programId: 'p1', date: '2024-01-15', startTime: '14:00', endTime: '16:00', location: '一号排练厅', status: 'completed' },
  { id: 'r2', programId: 'p1', date: '2024-01-18', startTime: '10:00', endTime: '12:00', location: '一号排练厅', status: 'completed' },
  { id: 'r3', programId: 'p1', date: '2024-01-20', startTime: '14:00', endTime: '16:00', location: '一号排练厅', status: 'pending' },
  { id: 'r4', programId: 'p2', date: '2024-01-16', startTime: '15:00', endTime: '17:00', location: '二号排练厅', status: 'completed' },
  { id: 'r5', programId: 'p2', date: '2024-01-19', startTime: '09:00', endTime: '11:00', location: '二号排练厅', status: 'completed' },
  { id: 'r6', programId: 'p3', date: '2024-01-17', startTime: '16:00', endTime: '18:30', location: '三号排练厅', status: 'completed' },
  { id: 'r7', programId: 'p3', date: '2024-01-21', startTime: '14:00', endTime: '17:00', location: '三号排练厅', status: 'pending' },
];

export const mockAttendances: Attendance[] = [
  { id: 'a1', rehearsalId: 'r1', studentId: 's1', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 95 },
  { id: 'a2', rehearsalId: 'r1', studentId: 's2', present: false, reason: '生病请假', makeupCompleted: true, costumeCollected: false, parentConfirmed: true, actionCompletion: 80 },
  { id: 'a3', rehearsalId: 'r1', studentId: 's3', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 90 },
  { id: 'a4', rehearsalId: 'r1', studentId: 's4', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 85 },
  { id: 'a5', rehearsalId: 'r1', studentId: 's5', present: false, reason: '家庭旅游', makeupCompleted: false, costumeCollected: false, parentConfirmed: false, actionCompletion: 60 },
  { id: 'a6', rehearsalId: 'r1', studentId: 's6', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 92 },
  { id: 'a7', rehearsalId: 'r2', studentId: 's1', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 98 },
  { id: 'a8', rehearsalId: 'r2', studentId: 's2', present: true, reason: '', makeupCompleted: true, costumeCollected: false, parentConfirmed: true, actionCompletion: 88 },
  { id: 'a9', rehearsalId: 'r2', studentId: 's3', present: false, reason: '学校考试', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 85 },
  { id: 'a10', rehearsalId: 'r2', studentId: 's4', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 90 },
  { id: 'a11', rehearsalId: 'r2', studentId: 's5', present: false, reason: '演出前缺勤', makeupCompleted: false, costumeCollected: false, parentConfirmed: false, actionCompletion: 55 },
  { id: 'a12', rehearsalId: 'r2', studentId: 's6', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 95 },
  { id: 'a13', rehearsalId: 'r4', studentId: 's1', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 95 },
  { id: 'a14', rehearsalId: 'r4', studentId: 's2', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 92 },
  { id: 'a15', rehearsalId: 'r4', studentId: 's3', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 88 },
  { id: 'a16', rehearsalId: 'r4', studentId: 's4', present: false, reason: '身体不适', makeupCompleted: true, costumeCollected: false, parentConfirmed: true, actionCompletion: 80 },
  { id: 'a17', rehearsalId: 'r4', studentId: 's5', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 90 },
  { id: 'a18', rehearsalId: 'r4', studentId: 's6', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 93 },
  { id: 'a19', rehearsalId: 'r4', studentId: 's7', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 85 },
  { id: 'a20', rehearsalId: 'r4', studentId: 's8', present: true, reason: '', makeupCompleted: true, costumeCollected: true, parentConfirmed: true, actionCompletion: 91 },
];

export const mockMakeupTrainings: MakeupTraining[] = [
  { id: 'm1', studentId: 's2', programId: 'p1', date: '2024-01-17', startTime: '10:00', endTime: '11:30', content: '复习第一段舞蹈动作', completed: true, teacher: '王老师' },
  { id: 'm2', studentId: 's5', programId: 'p1', date: '2024-01-22', startTime: '14:00', endTime: '16:00', content: '补训完整节目动作', completed: false, teacher: '李老师' },
  { id: 'm3', studentId: 's3', programId: 'p1', date: '2024-01-20', startTime: '09:00', endTime: '10:30', content: '复习队形变化', completed: true, teacher: '王老师' },
  { id: 'm4', studentId: 's4', programId: 'p2', date: '2024-01-18', startTime: '15:00', endTime: '16:30', content: '练习跳跃动作', completed: true, teacher: '张老师' },
];
