import { MaterialList } from '@/types';

export const mockMaterials: MaterialList[] = [
  {
    id: 'mat_001',
    scheduleId: 'sch_001',
    scheduleSnapshot: {
      lecturerName: '张明',
      scheduledAt: '2026-06-20 14:00',
      location: '一楼多功能厅',
      expectedParticipants: 30,
    },

    status: 'IN_PROGRESS',
    statusHistory: [
      {
        id: 'mst_001',
        fromStatus: 'NOT_STARTED',
        toStatus: 'IN_PROGRESS',
        operator: 'user_006',
        operatorName: '赵军',
        createdAt: '2026-06-15 12:00',
      },
    ],

    materials: [
      {
        id: 'mi_001',
        name: '青铜器复制品套装',
        category: 'DEMO',
        quantity: 5,
        unit: '套',
        status: 'PREPARED',
      },
      {
        id: 'mi_002',
        name: '高清投影设备',
        category: 'DEMO',
        quantity: 1,
        unit: '套',
        status: 'PREPARED',
      },
      {
        id: 'mi_003',
        name: '音响系统',
        category: 'DEMO',
        quantity: 1,
        unit: '套',
        status: 'PREPARED',
      },
      {
        id: 'mi_004',
        name: '鉴别工具套装',
        category: 'OPERATION',
        quantity: 10,
        unit: '套',
        status: 'PREPARED',
      },
      {
        id: 'mi_005',
        name: '防护手套',
        category: 'OPERATION',
        quantity: 30,
        unit: '副',
        remarks: '需提前检查是否有破损',
        status: 'PREPARED',
      },
      {
        id: 'mi_006',
        name: '活动宣传折页',
        category: 'DISPLAY',
        quantity: 35,
        unit: '份',
        status: 'PREPARED',
      },
    ],

    preparedBy: 'user_006',
    preparedByName: '赵军',
    startedAt: '2026-06-15 12:00',

    isAcknowledged: false,

    attachments: [],

    createdAt: '2026-06-15 11:00',
    updatedAt: '2026-06-17 16:00',
  },
  {
    id: 'mat_002',
    scheduleId: 'sch_004',
    scheduleSnapshot: {
      lecturerName: '王芳',
      scheduledAt: '2026-06-18 09:00',
      location: '五楼书画展厅',
      expectedParticipants: 25,
    },

    status: 'BLOCKED',
    statusHistory: [
      {
        id: 'mst_002',
        fromStatus: 'IN_PROGRESS',
        toStatus: 'BLOCKED',
        operator: 'user_007',
        operatorName: '孙丽',
        reason: '排班信息变更，需要重新确认',
        remarks: '讲师从张明变更为王芳',
        createdAt: '2026-06-17 15:30',
      },
    ],

    materials: [
      {
        id: 'mi_007',
        name: '毛笔套装',
        category: 'OPERATION',
        quantity: 25,
        unit: '套',
        status: 'PREPARED',
      },
      {
        id: 'mi_008',
        name: '宣纸',
        category: 'OPERATION',
        quantity: 50,
        unit: '张',
        remarks: '需要提前裁剪成标准尺寸',
        status: 'PREPARED',
      },
      {
        id: 'mi_009',
        name: '墨汁',
        category: 'OPERATION',
        quantity: 10,
        unit: '瓶',
        status: 'PREPARED',
      },
      {
        id: 'mi_010',
        name: '国画颜料套装',
        category: 'OPERATION',
        quantity: 5,
        unit: '套',
        status: 'PENDING',
      },
      {
        id: 'mi_011',
        name: '毡垫',
        category: 'OPERATION',
        quantity: 25,
        unit: '块',
        status: 'PENDING',
      },
    ],

    preparedBy: 'user_007',
    preparedByName: '孙丽',
    startedAt: '2026-06-11 10:00',

    isAcknowledged: false,

    attachments: [
      {
        id: 'mat_att_001',
        category: 'PHOTO',
        fileName: '物料准备照片.jpg',
        fileUrl: '/uploads/material-prep-001.jpg',
        fileSize: 2097152,
        mimeType: 'image/jpeg',
        uploadedBy: 'user_007',
        uploadedByName: '孙丽',
        uploadedAt: '2026-06-12 14:00',
      },
    ],

    createdAt: '2026-06-10 11:30',
    updatedAt: '2026-06-17 15:30',
  },
];
