import { User, Activity, Feedback, Certificate } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: '张老师',
    role: 'teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang'
  },
  {
    id: 'u2',
    name: '李志愿者',
    role: 'volunteer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li'
  },
  {
    id: 'u3',
    name: '王主管',
    role: 'supervisor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang'
  },
  {
    id: 'u4',
    name: '陈老师',
    role: 'teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen'
  },
  {
    id: 'u5',
    name: '刘志愿者',
    role: 'volunteer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu'
  }
];

export const mockActivities: Activity[] = [
  {
    id: 'a1',
    name: '青铜器探秘亲子课堂',
    date: '2024-06-15',
    lecturer: '李教授',
    participantCount: 25,
    status: 'completed'
  },
  {
    id: 'a2',
    name: '古籍修复体验课',
    date: '2024-06-16',
    lecturer: '王修复师',
    participantCount: 15,
    status: 'completed'
  },
  {
    id: 'a3',
    name: '瓷片鉴赏入门',
    date: '2024-06-14',
    lecturer: '赵老师',
    participantCount: 20,
    status: 'completed'
  },
  {
    id: 'a4',
    name: '暑期夏令营结业',
    date: '2024-06-10',
    lecturer: '多位讲师',
    participantCount: 35,
    status: 'completed'
  },
  {
    id: 'a5',
    name: '志愿者培训专场',
    date: '2024-06-12',
    lecturer: '博物馆专家团',
    participantCount: 42,
    status: 'completed'
  }
];

export const mockFeedbacks: Feedback[] = [
  {
    id: 'f1',
    activityId: 'a1',
    activityName: '青铜器探秘亲子课堂',
    submittedAt: '2024-06-15 16:30',
    content: {
      summary: '活动圆满完成，亲子互动热烈。孩子们对青铜器表现出极大兴趣，特别是铭文拓印环节。',
      ratings: 4.8,
      comments: [
        '希望能有更多动手实践环节',
        '讲解非常专业，孩子学到了很多',
        '建议增加活动时间',
        '下次还想参加！'
      ],
      photos: []
    },
    status: 'completed',
    currentStep: 'supervisor',
    assigneeId: 'u3',
    assigneeName: '王主管',
    certificateEligible: true,
    flowLogs: [
      {
        id: 'fl1-1',
        relatedType: 'feedback',
        relatedId: 'f1',
        operatorId: 'u1',
        operatorName: '张老师',
        action: 'submit',
        remark: '活动顺利结束，收集到25份反馈表',
        timestamp: '2024-06-15 16:30'
      },
      {
        id: 'fl1-2',
        relatedType: 'feedback',
        relatedId: 'f1',
        operatorId: 'u1',
        operatorName: '张老师',
        action: 'review',
        remark: '反馈整体良好，学员满意度高',
        timestamp: '2024-06-15 17:00'
      },
      {
        id: 'fl1-3',
        relatedType: 'feedback',
        relatedId: 'f1',
        operatorId: 'u2',
        operatorName: '李志愿者',
        action: 'organize',
        remark: '已整理反馈内容，标注重点建议',
        timestamp: '2024-06-16 09:30'
      },
      {
        id: 'fl1-4',
        relatedType: 'feedback',
        relatedId: 'f1',
        operatorId: 'u3',
        operatorName: '王主管',
        action: 'approve',
        remark: '审核通过，确认符合发证条件',
        timestamp: '2024-06-16 14:00'
      }
    ]
  },
  {
    id: 'f2',
    activityId: 'a2',
    activityName: '古籍修复体验课',
    submittedAt: '2024-06-16 15:00',
    content: {
      summary: '活动当天设备出现故障，部分环节临时调整。部分学员反馈体验受影响。',
      ratings: 3.5,
      comments: [
        '古籍修复讲解很专业',
        '但是装裱机坏了，只能看视频',
        '希望能补做一次完整活动',
        '工作人员态度很好'
      ],
      photos: []
    },
    status: 'pending_review',
    currentStep: 'teacher',
    assigneeId: 'u1',
    assigneeName: '张老师',
    certificateEligible: false,
    isOverdue: true,
    flowLogs: [
      {
        id: 'fl2-1',
        relatedType: 'feedback',
        relatedId: 'f2',
        operatorId: 'u4',
        operatorName: '陈老师',
        action: 'submit',
        remark: '活动结束，收集到12份反馈',
        timestamp: '2024-06-16 15:00'
      },
      {
        id: 'fl2-2',
        relatedType: 'feedback',
        relatedId: 'f2',
        operatorId: 'u1',
        operatorName: '张老师',
        action: 'reject',
        remark: '反馈显示设备问题，需补充设备故障说明和处理措施',
        timestamp: '2024-06-16 16:30'
      },
      {
        id: 'fl2-3',
        relatedType: 'feedback',
        relatedId: 'f2',
        operatorId: 'u4',
        operatorName: '陈老师',
        action: 'note',
        remark: '已联系技术部门，设备已在维修。申请补办一次完整活动。',
        timestamp: '2024-06-17 10:00'
      }
    ]
  },
  {
    id: 'f3',
    activityId: 'a3',
    activityName: '瓷片鉴赏入门',
    submittedAt: '2024-06-14 17:00',
    content: {
      summary: '活动顺利完成，学员对各朝代瓷器特征有了基本了解。',
      ratings: 4.5,
      comments: [
        '赵老师讲得很好',
        '希望能多看些实物',
        '建议增加鉴定互动环节'
      ],
      photos: []
    },
    status: 'organized',
    currentStep: 'volunteer',
    assigneeId: 'u2',
    assigneeName: '李志愿者',
    certificateEligible: true,
    isOverdue: true,
    flowLogs: [
      {
        id: 'fl3-1',
        relatedType: 'feedback',
        relatedId: 'f3',
        operatorId: 'u4',
        operatorName: '陈老师',
        action: 'submit',
        remark: '活动结束，反馈已收集',
        timestamp: '2024-06-14 17:00'
      },
      {
        id: 'fl3-2',
        relatedType: 'feedback',
        relatedId: 'f3',
        operatorId: 'u4',
        operatorName: '陈老师',
        action: 'review',
        remark: '反馈质量良好，符合标准',
        timestamp: '2024-06-14 18:00'
      },
      {
        id: 'fl3-3',
        relatedType: 'feedback',
        relatedId: 'f3',
        operatorId: 'u2',
        operatorName: '李志愿者',
        action: 'organize',
        remark: '正在整理，准备提交终审',
        timestamp: '2024-06-15 09:00'
      }
    ]
  },
  {
    id: 'f4',
    activityId: 'a4',
    activityName: '暑期夏令营结业',
    submittedAt: '2024-06-10 16:00',
    content: {
      summary: '夏令营圆满结束，35名学员顺利完成全部课程。',
      ratings: 4.9,
      comments: [
        '课程内容丰富',
        '老师们都很专业负责',
        '孩子收获很大',
        '明年还要参加'
      ],
      photos: []
    },
    status: 'completed',
    currentStep: 'supervisor',
    assigneeId: 'u3',
    assigneeName: '王主管',
    certificateEligible: true,
    flowLogs: [
      {
        id: 'fl4-1',
        relatedType: 'feedback',
        relatedId: 'f4',
        operatorId: 'u1',
        operatorName: '张老师',
        action: 'submit',
        remark: '夏令营结业，反馈汇总完成',
        timestamp: '2024-06-10 16:00'
      },
      {
        id: 'fl4-2',
        relatedType: 'feedback',
        relatedId: 'f4',
        operatorId: 'u1',
        operatorName: '张老师',
        action: 'review',
        remark: '满意度很高，学员反馈积极',
        timestamp: '2024-06-10 17:00'
      },
      {
        id: 'fl4-3',
        relatedType: 'feedback',
        relatedId: 'f4',
        operatorId: 'u5',
        operatorName: '刘志愿者',
        action: 'organize',
        remark: '已整理所有反馈和学员名单',
        timestamp: '2024-06-11 10:00'
      },
      {
        id: 'fl4-4',
        relatedType: 'feedback',
        relatedId: 'f4',
        operatorId: 'u3',
        operatorName: '王主管',
        action: 'approve',
        remark: '审核通过，开始准备结业证书',
        timestamp: '2024-06-11 14:00'
      }
    ]
  },
  {
    id: 'f5',
    activityId: 'a5',
    activityName: '志愿者培训专场',
    submittedAt: '2024-06-12 17:30',
    content: {
      summary: '培训完成，但部分学员迟到影响整体效果。需跟进迟到人员的后续培训。',
      ratings: 3.8,
      comments: [
        '培训内容很实用',
        '但有人迟到影响氛围',
        '建议加强考勤管理',
        '总体还是满意的'
      ],
      photos: []
    },
    status: 'pending_approval',
    currentStep: 'supervisor',
    assigneeId: 'u3',
    assigneeName: '王主管',
    certificateEligible: false,
    flowLogs: [
      {
        id: 'fl5-1',
        relatedType: 'feedback',
        relatedId: 'f5',
        operatorId: 'u4',
        operatorName: '陈老师',
        action: 'submit',
        remark: '培训结束，反馈已收集',
        timestamp: '2024-06-12 17:30'
      },
      {
        id: 'fl5-2',
        relatedType: 'feedback',
        relatedId: 'f5',
        operatorId: 'u4',
        operatorName: '陈老师',
        action: 'review',
        remark: '整体满意，但考勤有问题',
        timestamp: '2024-06-12 18:00'
      },
      {
        id: 'fl5-3',
        relatedType: 'feedback',
        relatedId: 'f5',
        operatorId: 'u5',
        operatorName: '刘志愿者',
        action: 'organize',
        remark: '已整理反馈。备注：8人迟到，其中3人严重迟到。建议对这3人暂缓发证，要求补训。',
        timestamp: '2024-06-13 09:00'
      }
    ]
  }
];

export const mockCertificates: Certificate[] = [
  {
    id: 'c1',
    feedbackId: 'f1',
    activityId: 'a1',
    activityName: '青铜器探秘亲子课堂',
    recipientName: '张小明',
    recipientPhone: '138****1234',
    status: 'issued',
    issueMethod: 'onsite',
    issuedAt: '2024-06-17 10:00',
    issuedBy: 'u3',
    flowLogs: [
      {
        id: 'cl1-1',
        relatedType: 'certificate',
        relatedId: 'c1',
        operatorId: 'u2',
        operatorName: '李志愿者',
        action: 'note',
        remark: '生成证书草稿',
        timestamp: '2024-06-16 15:00'
      },
      {
        id: 'cl1-2',
        relatedType: 'certificate',
        relatedId: 'c1',
        operatorId: 'u2',
        operatorName: '李志愿者',
        action: 'issue',
        remark: '现场发放给家长',
        timestamp: '2024-06-17 10:00'
      }
    ]
  },
  {
    id: 'c2',
    feedbackId: 'f1',
    activityId: 'a1',
    activityName: '青铜器探秘亲子课堂',
    recipientName: '李小雨',
    recipientPhone: '139****5678',
    status: 'issued',
    issueMethod: 'mail',
    issuedAt: '2024-06-18 09:30',
    issuedBy: 'u3',
    flowLogs: [
      {
        id: 'cl2-1',
        relatedType: 'certificate',
        relatedId: 'c2',
        operatorId: 'u2',
        operatorName: '李志愿者',
        action: 'note',
        remark: '生成证书草稿',
        timestamp: '2024-06-16 15:00'
      },
      {
        id: 'cl2-2',
        relatedType: 'certificate',
        relatedId: 'c2',
        operatorId: 'u3',
        operatorName: '王主管',
        action: 'issue',
        remark: '已安排邮寄',
        timestamp: '2024-06-18 09:30'
      }
    ]
  },
  {
    id: 'c3',
    feedbackId: 'f4',
    activityId: 'a4',
    activityName: '暑期夏令营结业',
    recipientName: '王小强',
    status: 'ready',
    issueMethod: 'onsite',
    flowLogs: [
      {
        id: 'cl3-1',
        relatedType: 'certificate',
        relatedId: 'c3',
        operatorId: 'u5',
        operatorName: '刘志愿者',
        action: 'note',
        remark: '已生成证书，待发放',
        timestamp: '2024-06-11 15:00'
      }
    ]
  },
  {
    id: 'c4',
    feedbackId: 'f4',
    activityId: 'a4',
    activityName: '暑期夏令营结业',
    recipientName: '陈晓华',
    status: 'ready',
    issueMethod: 'onsite',
    flowLogs: [
      {
        id: 'cl4-1',
        relatedType: 'certificate',
        relatedId: 'c4',
        operatorId: 'u5',
        operatorName: '刘志愿者',
        action: 'note',
        remark: '已生成证书，待发放',
        timestamp: '2024-06-11 15:00'
      }
    ]
  },
  {
    id: 'c5',
    feedbackId: 'f4',
    activityId: 'a4',
    activityName: '暑期夏令营结业',
    recipientName: '刘思琪',
    status: 'pending',
    flowLogs: [
      {
        id: 'cl5-1',
        relatedType: 'certificate',
        relatedId: 'c5',
        operatorId: 'u5',
        operatorName: '刘志愿者',
        action: 'note',
        remark: '准备生成证书',
        timestamp: '2024-06-11 16:00'
      }
    ]
  },
  {
    id: 'c6',
    feedbackId: 'f5',
    activityId: 'a5',
    activityName: '志愿者培训专场',
    recipientName: '赵敏',
    recipientPhone: '137****9012',
    status: 'pending',
    flowLogs: [
      {
        id: 'cl6-1',
        relatedType: 'certificate',
        relatedId: 'c6',
        operatorId: 'u5',
        operatorName: '刘志愿者',
        action: 'note',
        remark: '暂缓发证，需补训后再发',
        timestamp: '2024-06-13 10:00'
      }
    ]
  }
];

export const currentUser = mockUsers[2];
