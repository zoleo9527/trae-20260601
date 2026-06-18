import { ActivitySchedule } from '@/types';
import { getCurrentUser, getUserById } from './mockUsers';

const currentUser = getCurrentUser();

export const mockSchedules: ActivitySchedule[] = [
  {
    id: 'sch_001',
    courseId: 'course_001',
    courseName: '青铜器鉴赏入门',
    scheduledAt: '2026-06-20 14:00',
    location: '一楼多功能厅',
    expectedParticipants: 30,
    participantType: 'STUDENT',

    lecturerId: 'user_001',
    lecturerName: '张明',
    lecturerPhone: '13800138001',
    lecturerEmail: 'zhangming@museum.com',
    lecturerRequirements: '需要投影仪和音响设备',

    status: 'PUBLISHED',
    statusHistory: [
      {
        id: 'st_001',
        fromStatus: 'DRAFT',
        toStatus: 'PENDING_CONFIRM',
        operator: currentUser.id,
        operatorName: currentUser.name,
        createdAt: '2026-06-15 09:00',
      },
      {
        id: 'st_002',
        fromStatus: 'PENDING_CONFIRM',
        toStatus: 'APPROVED',
        operator: currentUser.id,
        operatorName: currentUser.name,
        createdAt: '2026-06-15 10:30',
      },
      {
        id: 'st_003',
        fromStatus: 'APPROVED',
        toStatus: 'PUBLISHED',
        operator: 'user_004',
        operatorName: '刘伟',
        createdAt: '2026-06-15 11:00',
      },
    ],

    changeHistory: [],

    attachments: [
      {
        id: 'att_001',
        category: 'COURSEWARE',
        fileName: '青铜器鉴赏课件.pptx',
        fileUrl: '/uploads/bronze-courseware.pptx',
        fileSize: 5242880,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.name,
        uploadedAt: '2026-06-15 08:00',
      },
    ],

    materialListId: 'mat_001',
    materialStatus: 'IN_PROGRESS',

    createdBy: currentUser.id,
    createdByName: currentUser.name,
    createdAt: '2026-06-15 08:30',
    updatedAt: '2026-06-15 11:00',
  },
  {
    id: 'sch_002',
    courseId: 'course_002',
    courseName: '陶瓷修复体验',
    scheduledAt: '2026-06-22 10:00',
    location: '三楼文物修复中心',
    expectedParticipants: 15,
    participantType: 'ADULT',

    lecturerId: 'user_002',
    lecturerName: '李华',
    lecturerPhone: '13800138002',
    lecturerEmail: 'lihua@museum.com',
    lecturerRequirements: '需要实验台和修复工具套装',

    status: 'PENDING_CONFIRM',
    statusHistory: [
      {
        id: 'st_004',
        fromStatus: 'DRAFT',
        toStatus: 'PENDING_CONFIRM',
        operator: currentUser.id,
        operatorName: currentUser.name,
        createdAt: '2026-06-17 14:00',
      },
    ],

    changeHistory: [],

    attachments: [],

    createdBy: currentUser.id,
    createdByName: currentUser.name,
    createdAt: '2026-06-17 13:30',
    updatedAt: '2026-06-17 14:00',
  },
  {
    id: 'sch_003',
    courseId: 'course_003',
    courseName: '古籍装帧亲子活动',
    scheduledAt: '2026-06-25 15:00',
    location: '二楼教育空间',
    expectedParticipants: 20,
    participantType: 'FAMILY',

    lecturerId: 'user_003',
    lecturerName: '王芳',
    lecturerPhone: '13800138003',
    lecturerEmail: 'wangfang@museum.com',
    lecturerRequirements: '需要材料包20份',

    status: 'APPROVED',
    statusHistory: [
      {
        id: 'st_005',
        fromStatus: 'DRAFT',
        toStatus: 'PENDING_CONFIRM',
        operator: 'user_003',
        operatorName: '王芳',
        createdAt: '2026-06-16 09:00',
      },
      {
        id: 'st_006',
        fromStatus: 'PENDING_CONFIRM',
        toStatus: 'APPROVED',
        operator: currentUser.id,
        operatorName: currentUser.name,
        createdAt: '2026-06-16 10:00',
      },
    ],

    changeHistory: [],

    attachments: [
      {
        id: 'att_002',
        category: 'LESSON_PLAN',
        fileName: '古籍装帧教案.docx',
        fileUrl: '/uploads/guji-lesson-plan.docx',
        fileSize: 1048576,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: 'user_003',
        uploadedByName: '王芳',
        uploadedAt: '2026-06-16 08:30',
      },
    ],

    createdBy: 'user_003',
    createdByName: '王芳',
    createdAt: '2026-06-16 08:00',
    updatedAt: '2026-06-16 10:00',
  },
  {
    id: 'sch_004',
    courseId: 'course_004',
    courseName: '书画临摹体验',
    scheduledAt: '2026-06-18 09:00',
    location: '五楼书画展厅',
    expectedParticipants: 25,
    participantType: 'STUDENT',

    lecturerId: 'user_001',
    lecturerName: '张明',
    lecturerPhone: '13800138001',
    lecturerEmail: 'zhangming@museum.com',

    status: 'CHANGED',
    statusHistory: [
      {
        id: 'st_007',
        fromStatus: 'DRAFT',
        toStatus: 'PENDING_CONFIRM',
        operator: currentUser.id,
        operatorName: currentUser.name,
        createdAt: '2026-06-10 09:00',
      },
      {
        id: 'st_008',
        fromStatus: 'PENDING_CONFIRM',
        toStatus: 'APPROVED',
        operator: currentUser.id,
        operatorName: currentUser.name,
        createdAt: '2026-06-10 10:00',
      },
      {
        id: 'st_009',
        fromStatus: 'APPROVED',
        toStatus: 'PUBLISHED',
        operator: 'user_004',
        operatorName: '刘伟',
        createdAt: '2026-06-10 11:00',
      },
      {
        id: 'st_010',
        fromStatus: 'PUBLISHED',
        toStatus: 'CHANGED',
        operator: currentUser.id,
        operatorName: currentUser.name,
        reason: '讲师时间冲突',
        remarks: '原讲师张明临时有事，调整为王芳',
        createdAt: '2026-06-17 15:00',
      },
    ],

    changeHistory: [
      {
        id: 'ch_001',
        field: 'lecturerId',
        oldValue: 'user_001',
        newValue: 'user_003',
        changedBy: currentUser.id,
        changedByName: currentUser.name,
        changedAt: '2026-06-17 15:00',
        reason: '讲师时间冲突',
      },
      {
        id: 'ch_002',
        field: 'lecturerName',
        oldValue: '张明',
        newValue: '王芳',
        changedBy: currentUser.id,
        changedByName: currentUser.name,
        changedAt: '2026-06-17 15:00',
        reason: '讲师时间冲突',
      },
    ],

    attachments: [],

    materialListId: 'mat_002',
    materialStatus: 'BLOCKED',

    createdBy: currentUser.id,
    createdByName: currentUser.name,
    createdAt: '2026-06-10 08:30',
    updatedAt: '2026-06-17 15:00',
  },
  {
    id: 'sch_005',
    courseId: 'course_005',
    courseName: '织锦工艺体验',
    scheduledAt: '2026-06-28 14:00',
    location: '四楼纺织展厅',
    expectedParticipants: 18,
    participantType: 'ADULT',

    lecturerId: 'user_002',
    lecturerName: '李华',
    lecturerPhone: '13800138002',
    lecturerEmail: 'lihua@museum.com',

    status: 'REJECTED',
    statusHistory: [
      {
        id: 'st_011',
        fromStatus: 'DRAFT',
        toStatus: 'PENDING_CONFIRM',
        operator: currentUser.id,
        operatorName: currentUser.name,
        createdAt: '2026-06-14 09:00',
      },
      {
        id: 'st_012',
        fromStatus: 'PENDING_CONFIRM',
        toStatus: 'REJECTED',
        operator: currentUser.id,
        operatorName: currentUser.name,
        reason: '内容需要调整',
        remarks: '建议增加互动环节',
        createdAt: '2026-06-14 11:00',
      },
    ],

    changeHistory: [],

    attachments: [],

    createdBy: currentUser.id,
    createdByName: currentUser.name,
    createdAt: '2026-06-14 08:30',
    updatedAt: '2026-06-14 11:00',
  },
];
