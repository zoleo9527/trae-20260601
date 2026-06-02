import type { Member, Course, BodyMeasurement, TrainingPlan, LeaveRequest, AttendanceRecord } from '../types';

export const members: Member[] = [
  {
    id: 'm1',
    name: '王小明',
    avatar: 'https://i.pravatar.cc/150?img=1',
    phone: '138****1234',
    joinDate: '2025-03-15',
    status: 'risk',
    packageRemaining: 2,
    packageTotal: 36,
    lastVisit: '2026-05-10',
    coachId: 'c1',
    coachName: '李教练',
    goals: ['减脂', '塑形'],
    riskLevel: 'high',
    riskReason: '课包即将耗尽，连续3周未到店',
    daysSinceLastVisit: 23,
    lastMeasurementDate: '2026-04-20',
    daysSinceLastMeasurement: 43
  },
  {
    id: 'm2',
    name: '张丽华',
    avatar: 'https://i.pravatar.cc/150?img=5',
    phone: '139****5678',
    joinDate: '2025-06-20',
    status: 'risk',
    packageRemaining: 3,
    packageTotal: 24,
    lastVisit: '2026-05-28',
    coachId: 'c1',
    coachName: '李教练',
    goals: ['减脂', '核心力量'],
    riskLevel: 'high',
    riskReason: '减脂停滞3周，体脂无变化',
    daysSinceLastVisit: 5,
    lastMeasurementDate: '2026-05-15',
    daysSinceLastMeasurement: 18
  },
  {
    id: 'm3',
    name: '陈志强',
    avatar: 'https://i.pravatar.cc/150?img=3',
    phone: '137****9012',
    joinDate: '2025-01-10',
    status: 'risk',
    packageRemaining: 4,
    packageTotal: 48,
    lastVisit: '2026-05-15',
    coachId: 'c2',
    coachName: '王教练',
    goals: ['增肌', '力量提升'],
    riskLevel: 'medium',
    riskReason: '最近2周缺席较多，微信无回复',
    daysSinceLastVisit: 18,
    lastMeasurementDate: '2026-05-01',
    daysSinceLastMeasurement: 32
  },
  {
    id: 'm4',
    name: '刘芳',
    avatar: 'https://i.pravatar.cc/150?img=9',
    phone: '136****3456',
    joinDate: '2025-09-05',
    status: 'active',
    packageRemaining: 12,
    packageTotal: 36,
    lastVisit: '2026-06-01',
    coachId: 'c1',
    coachName: '李教练',
    goals: ['塑形', '柔韧性'],
    riskLevel: 'low',
    daysSinceLastVisit: 1,
    lastMeasurementDate: '2026-05-25',
    daysSinceLastMeasurement: 8
  },
  {
    id: 'm5',
    name: '赵伟',
    avatar: 'https://i.pravatar.cc/150?img=8',
    phone: '135****7890',
    joinDate: '2025-11-20',
    status: 'active',
    packageRemaining: 28,
    packageTotal: 48,
    lastVisit: '2026-06-02',
    coachId: 'c2',
    coachName: '王教练',
    goals: ['增肌', '爆发力'],
    riskLevel: 'low',
    daysSinceLastVisit: 0,
    lastMeasurementDate: '2026-05-28',
    daysSinceLastMeasurement: 5
  },
  {
    id: 'm6',
    name: '孙婷婷',
    avatar: 'https://i.pravatar.cc/150?img=10',
    phone: '134****2345',
    joinDate: '2026-01-15',
    status: 'risk',
    packageRemaining: 18,
    packageTotal: 24,
    lastVisit: '2026-05-20',
    coachId: 'c1',
    coachName: '李教练',
    goals: ['减脂', '产后恢复'],
    riskLevel: 'medium',
    riskReason: '近两周频繁请假，训练不规律',
    daysSinceLastVisit: 13,
    lastMeasurementDate: '2026-04-15',
    daysSinceLastMeasurement: 48
  },
  {
    id: 'm7',
    name: '周建国',
    avatar: 'https://i.pravatar.cc/150?img=12',
    phone: '133****6789',
    joinDate: '2025-08-10',
    status: 'active',
    packageRemaining: 8,
    packageTotal: 36,
    lastVisit: '2026-05-31',
    coachId: 'c2',
    coachName: '王教练',
    goals: ['康复训练', '力量恢复'],
    riskLevel: 'low',
    daysSinceLastVisit: 2,
    lastMeasurementDate: '2026-05-20',
    daysSinceLastMeasurement: 13
  },
  {
    id: 'm8',
    name: '吴丽娜',
    avatar: 'https://i.pravatar.cc/150?img=16',
    phone: '132****0123',
    joinDate: '2026-02-28',
    status: 'active',
    packageRemaining: 20,
    packageTotal: 24,
    lastVisit: '2026-06-01',
    coachId: 'c1',
    coachName: '李教练',
    goals: ['塑形', '马甲线'],
    riskLevel: 'low',
    daysSinceLastVisit: 1,
    lastMeasurementDate: '2026-05-30',
    daysSinceLastMeasurement: 3
  },
  {
    id: 'm9',
    name: '郑浩然',
    avatar: 'https://i.pravatar.cc/150?img=11',
    phone: '131****4567',
    joinDate: '2025-04-20',
    status: 'inactive',
    packageRemaining: 15,
    packageTotal: 36,
    lastVisit: '2026-04-25',
    coachId: 'c2',
    coachName: '王教练',
    goals: ['减脂', '心肺功能'],
    riskLevel: 'high',
    riskReason: '超过1个月未到店，电话未接',
    daysSinceLastVisit: 38,
    lastMeasurementDate: '2026-03-10',
    daysSinceLastMeasurement: 84
  },
  {
    id: 'm10',
    name: '黄思琪',
    avatar: 'https://i.pravatar.cc/150?img=20',
    phone: '130****8901',
    joinDate: '2026-04-01',
    status: 'active',
    packageRemaining: 16,
    packageTotal: 24,
    lastVisit: '2026-06-02',
    coachId: 'c1',
    coachName: '李教练',
    goals: ['减脂', '塑形'],
    riskLevel: 'low',
    daysSinceLastVisit: 0,
    lastMeasurementDate: '2026-05-28',
    daysSinceLastMeasurement: 5
  },
  {
    id: 'm11',
    name: '林大伟',
    avatar: 'https://i.pravatar.cc/150?img=15',
    phone: '158****2345',
    joinDate: '2025-12-01',
    status: 'active',
    packageRemaining: 22,
    packageTotal: 48,
    lastVisit: '2026-05-30',
    coachId: 'c2',
    coachName: '王教练',
    goals: ['增肌', '卧推100kg'],
    riskLevel: 'low',
    daysSinceLastVisit: 3,
    lastMeasurementDate: '2026-05-15',
    daysSinceLastMeasurement: 18
  },
  {
    id: 'm12',
    name: '杨雪',
    avatar: 'https://i.pravatar.cc/150?img=25',
    phone: '159****6789',
    joinDate: '2026-03-10',
    status: 'risk',
    packageRemaining: 1,
    packageTotal: 12,
    lastVisit: '2026-05-25',
    coachId: 'c1',
    coachName: '李教练',
    goals: ['塑形', '减脂'],
    riskLevel: 'high',
    riskReason: '课包仅剩1节，暂无续费意向',
    daysSinceLastVisit: 8,
    lastMeasurementDate: '2026-05-10',
    daysSinceLastMeasurement: 23
  }
];

export const todayCourses: Course[] = [
  {
    id: 'c1',
    memberId: 'm5',
    memberName: '赵伟',
    memberAvatar: 'https://i.pravatar.cc/150?img=8',
    coachId: 'c2',
    date: '2026-06-02',
    startTime: '09:00',
    endTime: '10:00',
    status: 'completed',
    type: '力量训练',
    notes: '今天状态不错，卧推加了5kg'
  },
  {
    id: 'c2',
    memberId: 'm10',
    memberName: '黄思琪',
    memberAvatar: 'https://i.pravatar.cc/150?img=20',
    coachId: 'c1',
    date: '2026-06-02',
    startTime: '10:30',
    endTime: '11:30',
    status: 'completed',
    type: '减脂训练',
    notes: '有氧坚持下来了'
  },
  {
    id: 'c3',
    memberId: 'm4',
    memberName: '刘芳',
    memberAvatar: 'https://i.pravatar.cc/150?img=9',
    coachId: 'c1',
    date: '2026-06-02',
    startTime: '14:00',
    endTime: '15:00',
    status: 'scheduled',
    type: '塑形训练'
  },
  {
    id: 'c4',
    memberId: 'm8',
    memberName: '吴丽娜',
    memberAvatar: 'https://i.pravatar.cc/150?img=16',
    coachId: 'c1',
    date: '2026-06-02',
    startTime: '15:30',
    endTime: '16:30',
    status: 'scheduled',
    type: '核心训练'
  },
  {
    id: 'c5',
    memberId: 'm7',
    memberName: '周建国',
    memberAvatar: 'https://i.pravatar.cc/150?img=12',
    coachId: 'c2',
    date: '2026-06-02',
    startTime: '16:00',
    endTime: '17:00',
    status: 'scheduled',
    type: '康复训练'
  },
  {
    id: 'c6',
    memberId: 'm11',
    memberName: '林大伟',
    memberAvatar: 'https://i.pravatar.cc/150?img=15',
    coachId: 'c2',
    date: '2026-06-02',
    startTime: '19:00',
    endTime: '20:00',
    status: 'scheduled',
    type: '力量训练'
  },
  {
    id: 'c7',
    memberId: 'm2',
    memberName: '张丽华',
    memberAvatar: 'https://i.pravatar.cc/150?img=5',
    coachId: 'c1',
    date: '2026-06-02',
    startTime: '19:30',
    endTime: '20:30',
    status: 'scheduled',
    type: '减脂训练'
  }
];

export const bodyMeasurements: BodyMeasurement[] = [
  {
    id: 'bm1',
    memberId: 'm2',
    date: '2026-04-15',
    weight: 68.5,
    bodyFat: 28.5,
    muscle: 42.3,
    bmi: 24.8,
    waist: 82,
    chest: 92,
    hips: 98,
    photos: ['https://picsum.photos/200/300?random=1', 'https://picsum.photos/200/300?random=2'],
    notes: '刚开始减脂计划'
  },
  {
    id: 'bm2',
    memberId: 'm2',
    date: '2026-05-01',
    weight: 67.2,
    bodyFat: 27.8,
    muscle: 42.8,
    bmi: 24.3,
    waist: 80,
    chest: 91,
    hips: 96,
    photos: ['https://picsum.photos/200/300?random=3', 'https://picsum.photos/200/300?random=4'],
    notes: '两周效果不错，继续保持'
  },
  {
    id: 'bm3',
    memberId: 'm2',
    date: '2026-05-15',
    weight: 66.8,
    bodyFat: 27.6,
    muscle: 42.9,
    bmi: 24.2,
    waist: 79,
    chest: 91,
    hips: 96,
    photos: ['https://picsum.photos/200/300?random=5', 'https://picsum.photos/200/300?random=6'],
    notes: '进入平台期，需要调整训练计划'
  }
];

export const trainingPlans: TrainingPlan[] = [
  {
    id: 'tp1',
    memberId: 'm2',
    memberName: '张丽华',
    week: 12,
    day: '周一',
    exercises: [
      { name: '热身（跑步机）', sets: 1, reps: '10分钟', weight: 0 },
      { name: '深蹲', sets: 4, reps: '12次', weight: 40, notes: '注意膝盖方向' },
      { name: '硬拉', sets: 4, reps: '10次', weight: 50 },
      { name: '腿举', sets: 3, reps: '15次', weight: 80 },
      { name: '有氧（椭圆机）', sets: 1, reps: '20分钟', weight: 0 }
    ]
  },
  {
    id: 'tp2',
    memberId: 'm2',
    memberName: '张丽华',
    week: 12,
    day: '周三',
    exercises: [
      { name: '热身（划船机）', sets: 1, reps: '10分钟', weight: 0 },
      { name: '卧推', sets: 4, reps: '12次', weight: 25 },
      { name: '哑铃飞鸟', sets: 3, reps: '15次', weight: 10 },
      { name: '坐姿划船', sets: 4, reps: '12次', weight: 35 },
      { name: '有氧（动感单车）', sets: 1, reps: '25分钟', weight: 0 }
    ]
  },
  {
    id: 'tp3',
    memberId: 'm2',
    memberName: '张丽华',
    week: 12,
    day: '周五',
    exercises: [
      { name: '动态热身', sets: 1, reps: '10分钟', weight: 0 },
      { name: '引体向上（辅助）', sets: 4, reps: '8次', weight: 0 },
      { name: '高位下拉', sets: 4, reps: '12次', weight: 30 },
      { name: '核心训练', sets: 3, reps: '30秒', weight: 0, notes: '平板支撑+侧桥' },
      { name: 'HIIT', sets: 1, reps: '15分钟', weight: 0 }
    ]
  }
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: 'lr1',
    memberId: 'm6',
    memberName: '孙婷婷',
    memberAvatar: 'https://i.pravatar.cc/150?img=10',
    startDate: '2026-06-03',
    endDate: '2026-06-05',
    reason: '出差去上海，请假3天',
    status: 'pending',
    createdAt: '2026-06-01 14:30'
  },
  {
    id: 'lr2',
    memberId: 'm1',
    memberName: '王小明',
    memberAvatar: 'https://i.pravatar.cc/150?img=1',
    startDate: '2026-05-20',
    endDate: '2026-06-05',
    reason: '脚踝扭伤，需要休养',
    status: 'approved',
    makeupCourse: '2026-06-10 19:00',
    createdAt: '2026-05-19 09:15'
  },
  {
    id: 'lr3',
    memberId: 'm3',
    memberName: '陈志强',
    memberAvatar: 'https://i.pravatar.cc/150?img=3',
    startDate: '2026-05-28',
    endDate: '2026-05-30',
    reason: '公司团建',
    status: 'approved',
    makeupCourse: '2026-06-04 18:00',
    createdAt: '2026-05-25 16:45'
  },
  {
    id: 'lr4',
    memberId: 'm9',
    memberName: '郑浩然',
    memberAvatar: 'https://i.pravatar.cc/150?img=11',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    reason: '暂时不想练了',
    status: 'rejected',
    createdAt: '2026-04-30 10:00'
  }
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: 'a1', memberId: 'm5', memberName: '赵伟', date: '2026-06-02', courseType: '力量训练', status: 'completed', coachName: '王教练' },
  { id: 'a2', memberId: 'm10', memberName: '黄思琪', date: '2026-06-02', courseType: '减脂训练', status: 'completed', coachName: '李教练' },
  { id: 'a3', memberId: 'm4', memberName: '刘芳', date: '2026-06-01', courseType: '塑形训练', status: 'completed', coachName: '李教练' },
  { id: 'a4', memberId: 'm8', memberName: '吴丽娜', date: '2026-06-01', courseType: '核心训练', status: 'completed', coachName: '李教练' },
  { id: 'a5', memberId: 'm7', memberName: '周建国', date: '2026-05-31', courseType: '康复训练', status: 'completed', coachName: '王教练' },
  { id: 'a6', memberId: 'm11', memberName: '林大伟', date: '2026-05-30', courseType: '力量训练', status: 'completed', coachName: '王教练' },
  { id: 'a7', memberId: 'm2', memberName: '张丽华', date: '2026-05-28', courseType: '减脂训练', status: 'completed', coachName: '李教练' },
  { id: 'a8', memberId: 'm6', memberName: '孙婷婷', date: '2026-05-20', courseType: '产后恢复', status: 'cancelled', coachName: '李教练' }
];

export const stats = {
  today: {
    totalCourses: 7,
    completed: 2,
    attendanceRate: 85.7,
    newMembers: 1
  },
  week: {
    totalCourses: 42,
    completed: 38,
    attendanceRate: 90.5,
    newMembers: 3
  },
  month: {
    renewRate: 68.5,
    activeMembers: 28,
    avgAttendance: 3.2
  }
};

export const weeklyActivityData = [
  { day: '周一', courses: 8, members: 6 },
  { day: '周二', courses: 6, members: 5 },
  { day: '周三', courses: 9, members: 7 },
  { day: '周四', courses: 7, members: 6 },
  { day: '周五', courses: 10, members: 8 },
  { day: '周六', courses: 12, members: 10 },
  { day: '周日', courses: 5, members: 4 }
];

export const weightTrendData = [
  { date: '4/15', weight: 68.5, bodyFat: 28.5 },
  { date: '4/22', weight: 67.8, bodyFat: 28.0 },
  { date: '4/29', weight: 67.2, bodyFat: 27.8 },
  { date: '5/6', weight: 67.0, bodyFat: 27.7 },
  { date: '5/13', weight: 66.8, bodyFat: 27.6 },
  { date: '5/20', weight: 66.9, bodyFat: 27.6 },
  { date: '5/27', weight: 66.8, bodyFat: 27.6 }
];
