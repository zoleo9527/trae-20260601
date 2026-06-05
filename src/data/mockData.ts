import type { Coach, Venue, ScheduleRecord } from '@/types';

const now = Date.now();
const hour = 60 * 60 * 1000;
const minute = 60 * 1000;

export const mockCoaches: Coach[] = [
  { id: 'c1', name: '张教练', phone: '138****1234', specialty: ['羽毛球', '网球'] },
  { id: 'c2', name: '李教练', phone: '139****5678', specialty: ['篮球', '体能'] },
  { id: 'c3', name: '王教练', phone: '137****9012', specialty: ['羽毛球', '乒乓球'] },
  { id: 'c4', name: '赵教练', phone: '136****3456', specialty: ['游泳', '健身'] },
];

export const mockVenues: Venue[] = [
  { id: 'v1', name: '1号羽毛球场', type: '羽毛球', capacity: 4 },
  { id: 'v2', name: '2号羽毛球场', type: '羽毛球', capacity: 4 },
  { id: 'v3', name: '篮球场A区', type: '篮球', capacity: 10 },
  { id: 'v4', name: '乒乓球室', type: '乒乓球', capacity: 6 },
];

export const mockRecords: ScheduleRecord[] = [
  {
    id: 'r1',
    studentName: '小明',
    studentPhone: '135****1111',
    courseType: '羽毛球私教课',
    coachId: 'c1',
    coachName: '张教练',
    venueId: 'v1',
    venueName: '1号羽毛球场',
    scheduledDate: '2026-06-05',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    status: 'pending_coach_confirm',
    createdAt: now - 25 * minute,
    updatedAt: now - 25 * minute,
    isOverdue: false,
    responsibility: 'none',
    hasResponsibilityRisk: false,
    rejectCount: 0,
    history: [
      {
        id: 'h1',
        timestamp: now - 25 * minute,
        operator: 'reception',
        operatorName: '前台小王',
        action: '创建排班记录',
      }
    ]
  },
  {
    id: 'r2',
    studentName: '小红',
    studentPhone: '135****2222',
    courseType: '篮球团体课',
    coachId: 'c2',
    coachName: '李教练',
    venueId: 'v3',
    venueName: '篮球场A区',
    scheduledDate: '2026-06-05',
    startTime: '10:00',
    endTime: '11:30',
    duration: 90,
    status: 'pending_reception_handle',
    createdAt: now - 2 * hour,
    updatedAt: now - 40 * minute,
    isOverdue: true,
    rejectedAt: now - 40 * minute,
    rejectedBy: 'c2',
    rejectReason: 'venue_issue',
    rejectRemark: '场地有积水，无法正常训练',
    coachRemark: '我到场地后发现地面湿滑，已拍照留存',
    responsibility: 'none',
    hasResponsibilityRisk: false,
    rejectCount: 1,
    history: [
      {
        id: 'h2-1',
        timestamp: now - 2 * hour,
        operator: 'reception',
        operatorName: '前台小李',
        action: '创建排班记录',
      },
      {
        id: 'h2-2',
        timestamp: now - 40 * minute,
        operator: 'coach',
        operatorName: '李教练',
        action: '退回记录',
        remark: '场地有积水，无法正常训练'
      }
    ]
  },
  {
    id: 'r3',
    studentName: '小华',
    studentPhone: '135****3333',
    courseType: '羽毛球提高班',
    coachId: 'c1',
    coachName: '张教练',
    venueId: 'v2',
    venueName: '2号羽毛球场',
    scheduledDate: '2026-06-05',
    startTime: '14:00',
    endTime: '15:30',
    duration: 90,
    status: 'pending_manager_audit',
    createdAt: now - 5 * hour,
    updatedAt: now - 1.5 * hour,
    isOverdue: false,
    rejectedAt: now - 3 * hour,
    rejectedBy: 'c1',
    rejectReason: 'time_conflict',
    rejectRemark: '这个时间我另有安排',
    receptionRemark: '排班表上周就发了，教练自己没看',
    coachRemark: '上周的排班有变动，没人通知我',
    responsibility: 'unclear',
    hasResponsibilityRisk: true,
    rejectCount: 2,
    history: [
      {
        id: 'h3-1',
        timestamp: now - 5 * hour,
        operator: 'reception',
        operatorName: '前台小王',
        action: '创建排班记录',
      },
      {
        id: 'h3-2',
        timestamp: now - 3 * hour,
        operator: 'coach',
        operatorName: '张教练',
        action: '退回记录',
        remark: '这个时间我另有安排'
      },
      {
        id: 'h3-3',
        timestamp: now - 2.5 * hour,
        operator: 'reception',
        operatorName: '前台小王',
        action: '补充备注',
        remark: '排班表上周就发了，教练自己没看'
      },
      {
        id: 'h3-4',
        timestamp: now - 2 * hour,
        operator: 'coach',
        operatorName: '张教练',
        action: '补充备注',
        remark: '上周的排班有变动，没人通知我'
      },
      {
        id: 'h3-5',
        timestamp: now - 1.5 * hour,
        operator: 'reception',
        operatorName: '前台小王',
        action: '提交店长仲裁',
      }
    ]
  },
  {
    id: 'r4',
    studentName: '小强',
    studentPhone: '135****4444',
    courseType: '乒乓球入门课',
    coachId: 'c3',
    coachName: '王教练',
    venueId: 'v4',
    venueName: '乒乓球室',
    scheduledDate: '2026-06-05',
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    status: 'completed',
    createdAt: now - 8 * hour,
    updatedAt: now - 6 * hour,
    isOverdue: false,
    confirmedAt: now - 6 * hour,
    confirmedBy: 'c3',
    responsibility: 'none',
    hasResponsibilityRisk: false,
    rejectCount: 0,
    history: [
      {
        id: 'h4-1',
        timestamp: now - 8 * hour,
        operator: 'reception',
        operatorName: '前台小李',
        action: '创建排班记录',
      },
      {
        id: 'h4-2',
        timestamp: now - 6 * hour,
        operator: 'coach',
        operatorName: '王教练',
        action: '确认课时完成',
      }
    ]
  },
  {
    id: 'r5',
    studentName: '小丽',
    studentPhone: '135****5555',
    courseType: '羽毛球私教课',
    coachId: 'c3',
    coachName: '王教练',
    venueId: 'v1',
    venueName: '1号羽毛球场',
    scheduledDate: '2026-06-05',
    startTime: '18:00',
    endTime: '19:00',
    duration: 60,
    status: 'pending_coach_confirm',
    createdAt: now - 15 * minute,
    updatedAt: now - 15 * minute,
    isOverdue: false,
    responsibility: 'none',
    hasResponsibilityRisk: false,
    rejectCount: 0,
    history: [
      {
        id: 'h5',
        timestamp: now - 15 * minute,
        operator: 'reception',
        operatorName: '前台小王',
        action: '创建排班记录',
      }
    ]
  },
  {
    id: 'r6',
    studentName: '小刚',
    studentPhone: '135****6666',
    courseType: '篮球私教课',
    coachId: 'c2',
    coachName: '李教练',
    venueId: 'v3',
    venueName: '篮球场A区',
    scheduledDate: '2026-06-05',
    startTime: '19:00',
    endTime: '20:30',
    duration: 90,
    status: 'disputed',
    createdAt: now - 10 * hour,
    updatedAt: now - 4 * hour,
    isOverdue: false,
    rejectedAt: now - 7 * hour,
    rejectedBy: 'c2',
    rejectReason: 'student_no_show',
    rejectRemark: '学员迟到40分钟后才来，要求我补时',
    receptionRemark: '学员说堵车，教练直接走了',
    coachRemark: '我等了30分钟，场地还有下一场预约',
    responsibility: 'both',
    responsibilityRemark: '双方沟通不及时，各承担一半责任',
    hasResponsibilityRisk: true,
    rejectCount: 3,
    history: [
      {
        id: 'h6-1',
        timestamp: now - 10 * hour,
        operator: 'reception',
        operatorName: '前台小李',
        action: '创建排班记录',
      },
      {
        id: 'h6-2',
        timestamp: now - 7 * hour,
        operator: 'coach',
        operatorName: '李教练',
        action: '退回记录',
        remark: '学员迟到40分钟后才来，要求我补时'
      },
      {
        id: 'h6-3',
        timestamp: now - 6 * hour,
        operator: 'reception',
        operatorName: '前台小李',
        action: '补充备注',
        remark: '学员说堵车，教练直接走了'
      },
      {
        id: 'h6-4',
        timestamp: now - 5.5 * hour,
        operator: 'coach',
        operatorName: '李教练',
        action: '补充备注',
        remark: '我等了30分钟，场地还有下一场预约'
      },
      {
        id: 'h6-5',
        timestamp: now - 4 * hour,
        operator: 'manager',
        operatorName: '刘店长',
        action: '标记为争议记录',
        remark: '双方沟通不及时，各承担一半责任'
      }
    ]
  },
  {
    id: 'r7',
    studentName: '小美',
    studentPhone: '135****7777',
    courseType: '游泳课',
    coachId: 'c4',
    coachName: '赵教练',
    venueId: 'v4',
    venueName: '乒乓球室',
    scheduledDate: '2026-06-05',
    startTime: '20:00',
    endTime: '21:00',
    duration: 60,
    status: 'pending_coach_confirm',
    createdAt: now - 5 * minute,
    updatedAt: now - 5 * minute,
    isOverdue: false,
    responsibility: 'none',
    hasResponsibilityRisk: false,
    rejectCount: 0,
    history: [
      {
        id: 'h7',
        timestamp: now - 5 * minute,
        operator: 'reception',
        operatorName: '前台小王',
        action: '创建排班记录',
      }
    ]
  }
];
