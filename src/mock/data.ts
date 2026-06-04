import type { RehabPlan, Staff, Elder, TimelineEvent, ExceptionRecord } from '@/types'

export const mockStaff: Staff[] = [
  { id: 's1', name: '王主管', role: 'nursing_director', phone: '13800138001' },
  { id: 's2', name: '李护工', role: 'primary_nurse', phone: '13800138002' },
  { id: 's3', name: '张护工', role: 'primary_nurse', phone: '13800138003' },
  { id: 's4', name: '刘社工', role: 'social_worker', phone: '13800138004' },
  { id: 's5', name: '陈主管', role: 'nursing_director', phone: '13800138005' }
]

export const mockElders: Elder[] = [
  { id: 'e1', name: '张爷爷', bedNumber: 'A-101', roomNumber: '301', age: 82, gender: 'male', primaryDisease: '中风后康复' },
  { id: 'e2', name: '李奶奶', bedNumber: 'A-102', roomNumber: '301', age: 78, gender: 'female', primaryDisease: '骨折术后康复' },
  { id: 'e3', name: '王爷爷', bedNumber: 'B-201', roomNumber: '302', age: 85, gender: 'male', primaryDisease: '阿尔茨海默症' },
  { id: 'e4', name: '赵奶奶', bedNumber: 'B-202', roomNumber: '302', age: 76, gender: 'female', primaryDisease: '糖尿病并发症' },
  { id: 'e5', name: '孙爷爷', bedNumber: 'C-301', roomNumber: '303', age: 88, gender: 'male', primaryDisease: '心脏病术后' }
]

export const mockPlans: RehabPlan[] = [
  {
    id: 'p1',
    elderId: 'e1',
    elder: mockElders[0],
    title: '张爷爷中风后肢体康复计划',
    description: '针对左侧肢体偏瘫进行系统康复训练，目标是恢复独立行走能力',
    startDate: '2026-05-01',
    expectedEndDate: '2026-07-30',
    status: 'in_progress',
    nursingDirectorId: 's1',
    nursingDirector: mockStaff[0],
    primaryNurseId: 's2',
    primaryNurse: mockStaff[1],
    socialWorkerId: 's4',
    socialWorker: mockStaff[3],
    createdAt: '2026-04-28T09:00:00',
    updatedAt: '2026-06-03T14:30:00',
    hasException: false,
    phases: [
      {
        id: 'ph1-1',
        planId: 'p1',
        phaseNumber: 1,
        title: '急性期康复',
        target: '维持关节活动度，预防肌肉萎缩',
        content: '每日被动关节活动训练、床上体位转换训练',
        startDate: '2026-05-01',
        endDate: '2026-05-14',
        status: 'approved',
        evaluatorId: 's1',
        evaluationDate: '2026-05-15',
        evaluationResult: '关节活动度维持良好，肌肉无明显萎缩，可进入下一阶段',
        evaluationScore: 85,
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph1-2',
        planId: 'p1',
        phaseNumber: 2,
        title: '恢复期训练',
        target: '增强肌力，练习坐起和站立',
        content: '肌力训练、坐位平衡训练、站立训练',
        startDate: '2026-05-15',
        endDate: '2026-05-28',
        status: 'approved',
        evaluatorId: 's1',
        evaluationDate: '2026-05-29',
        evaluationResult: '肌力提升明显，可独立坐起，辅助下可站立',
        evaluationScore: 88,
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph1-3',
        planId: 'p1',
        phaseNumber: 3,
        title: '步行训练期',
        target: '练习平行杠内行走，逐步过渡到独立行走',
        content: '平行杠训练、步态训练、上下楼梯训练',
        startDate: '2026-05-29',
        endDate: '2026-06-11',
        status: 'in_progress',
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph1-4',
        planId: 'p1',
        phaseNumber: 4,
        title: '功能巩固期',
        target: '巩固行走能力，提高日常生活自理能力',
        content: '室外行走训练、ADL训练、社交活动参与',
        startDate: '2026-06-12',
        endDate: '2026-07-30',
        status: 'not_started',
        isDelayed: false,
        isSupplemented: false
      }
    ]
  },
  {
    id: 'p2',
    elderId: 'e2',
    elder: mockElders[1],
    title: '李奶奶骨折术后康复计划',
    description: '右侧股骨颈骨折术后康复，目标恢复独立行走',
    startDate: '2026-04-15',
    expectedEndDate: '2026-06-15',
    status: 'in_progress',
    nursingDirectorId: 's1',
    nursingDirector: mockStaff[0],
    primaryNurseId: 's3',
    primaryNurse: mockStaff[2],
    socialWorkerId: 's4',
    socialWorker: mockStaff[3],
    createdAt: '2026-04-14T10:00:00',
    updatedAt: '2026-06-02T16:00:00',
    hasException: true,
    exceptionReason: '第三阶段评估拖延',
    phases: [
      {
        id: 'ph2-1',
        planId: 'p2',
        phaseNumber: 1,
        title: '术后制动期',
        target: '预防并发症，维持患肢位置',
        content: '翻身护理、深呼吸训练、健侧肢体活动',
        startDate: '2026-04-15',
        endDate: '2026-04-28',
        status: 'approved',
        evaluatorId: 's1',
        evaluationDate: '2026-04-29',
        evaluationResult: '术后恢复良好，无并发症',
        evaluationScore: 90,
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph2-2',
        planId: 'p2',
        phaseNumber: 2,
        title: '肌力恢复期',
        target: '恢复患肢肌力，练习床上活动',
        content: '股四头肌等长收缩、桥式运动、床上转移',
        startDate: '2026-04-29',
        endDate: '2026-05-12',
        status: 'supplemented',
        evaluatorId: 's1',
        evaluationDate: '2026-05-18',
        evaluationResult: '补录：肌力恢复达标，可进行站立训练',
        evaluationScore: 78,
        isDelayed: false,
        isSupplemented: true
      },
      {
        id: 'ph2-3',
        planId: 'p2',
        phaseNumber: 3,
        title: '站立步行期',
        target: '练习站立和行走',
        content: '站立训练、助行器行走、步态矫正',
        startDate: '2026-05-13',
        endDate: '2026-05-26',
        status: 'pending_review',
        evaluatorId: 's1',
        isDelayed: true,
        isSupplemented: false
      },
      {
        id: 'ph2-4',
        planId: 'p2',
        phaseNumber: 4,
        title: '功能巩固期',
        target: '巩固行走能力，提高平衡能力',
        content: '独立行走训练、平衡训练、上下楼梯',
        startDate: '2026-05-27',
        endDate: '2026-06-15',
        status: 'not_started',
        isDelayed: true,
        isSupplemented: false
      }
    ]
  },
  {
    id: 'p3',
    elderId: 'e3',
    elder: mockElders[2],
    title: '王爷爷认知功能康复计划',
    description: '针对阿尔茨海默症早期进行认知训练，延缓病情进展',
    startDate: '2026-03-01',
    expectedEndDate: '2026-08-31',
    status: 'in_progress',
    nursingDirectorId: 's5',
    nursingDirector: mockStaff[4],
    primaryNurseId: 's2',
    primaryNurse: mockStaff[1],
    socialWorkerId: 's4',
    socialWorker: mockStaff[3],
    createdAt: '2026-02-28T11:00:00',
    updatedAt: '2026-06-01T10:00:00',
    hasException: true,
    exceptionReason: '评估被驳回，需重新评估',
    phases: [
      {
        id: 'ph3-1',
        planId: 'p3',
        phaseNumber: 1,
        title: '认知评估期',
        target: '全面评估认知功能水平',
        content: 'MMSE评估、MoCA评估、日常生活能力评估',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        status: 'approved',
        evaluatorId: 's5',
        evaluationDate: '2026-03-08',
        evaluationResult: '轻度认知障碍，MMSE评分22分',
        evaluationScore: 75,
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph3-2',
        planId: 'p3',
        phaseNumber: 2,
        title: '记忆训练期',
        target: '通过记忆训练延缓记忆力下降',
        content: '数字记忆训练、图片记忆训练、生活事件回忆',
        startDate: '2026-03-08',
        endDate: '2026-04-30',
        status: 'approved',
        evaluatorId: 's5',
        evaluationDate: '2026-05-01',
        evaluationResult: '记忆能力有改善，能记住近期3件事件',
        evaluationScore: 70,
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph3-3',
        planId: 'p3',
        phaseNumber: 3,
        title: '定向力训练期',
        target: '提高时间、地点、人物定向能力',
        content: '时间定向训练、地点定向训练、人物识别训练',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        status: 'rejected',
        evaluatorId: 's5',
        evaluationDate: '2026-06-01',
        evaluationResult: '评估内容不完整，缺少具体训练记录，需重新评估',
        evaluationScore: 45,
        rejectReason: '评估资料不完整，缺少每日训练记录和量化数据',
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph3-4',
        planId: 'p3',
        phaseNumber: 4,
        title: '社会功能训练期',
        target: '维持基本社交能力',
        content: '社交活动参与、简单手工操作、音乐疗法',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        status: 'not_started',
        isDelayed: false,
        isSupplemented: false
      }
    ]
  },
  {
    id: 'p4',
    elderId: 'e4',
    elder: mockElders[3],
    title: '赵奶奶糖尿病足康复计划',
    description: '糖尿病足溃疡愈合后康复训练，预防复发',
    startDate: '2026-02-01',
    expectedEndDate: '2026-05-31',
    actualEndDate: '2026-05-28',
    status: 'completed',
    nursingDirectorId: 's5',
    nursingDirector: mockStaff[4],
    primaryNurseId: 's3',
    primaryNurse: mockStaff[2],
    socialWorkerId: 's4',
    socialWorker: mockStaff[3],
    createdAt: '2026-01-30T14:00:00',
    updatedAt: '2026-05-28T15:30:00',
    hasException: false,
    phases: [
      {
        id: 'ph4-1',
        planId: 'p4',
        phaseNumber: 1,
        title: '伤口护理期',
        target: '确保伤口完全愈合',
        content: '每日伤口换药、观察愈合情况、血糖监测',
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        status: 'approved',
        evaluatorId: 's5',
        evaluationDate: '2026-03-01',
        evaluationResult: '伤口完全愈合，无感染迹象',
        evaluationScore: 92,
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph4-2',
        planId: 'p4',
        phaseNumber: 2,
        title: '感觉功能训练',
        target: '改善足部感觉功能',
        content: '触觉训练、温度觉训练、足部按摩',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        status: 'approved',
        evaluatorId: 's5',
        evaluationDate: '2026-04-01',
        evaluationResult: '足部感觉有所改善，能分辨轻触',
        evaluationScore: 80,
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph4-3',
        planId: 'p4',
        phaseNumber: 3,
        title: '运动功能训练',
        target: '恢复足部运动功能',
        content: '踝关节活动训练、足趾活动训练、步态训练',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        status: 'approved',
        evaluatorId: 's5',
        evaluationDate: '2026-05-01',
        evaluationResult: '足部活动度明显改善，步态基本正常',
        evaluationScore: 85,
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph4-4',
        planId: 'p4',
        phaseNumber: 4,
        title: '功能巩固与教育',
        target: '巩固康复效果，进行糖尿病足预防教育',
        content: '足部护理教育、鞋子选择指导、定期复查计划',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        status: 'approved',
        evaluatorId: 's5',
        evaluationDate: '2026-05-28',
        evaluationResult: '患者及家属掌握足部护理知识，可出院',
        evaluationScore: 90,
        isDelayed: false,
        isSupplemented: false
      }
    ]
  },
  {
    id: 'p5',
    elderId: 'e5',
    elder: mockElders[4],
    title: '孙爷爷心脏病术后康复计划',
    description: '冠状动脉搭桥术后心脏康复，逐步恢复体力活动',
    startDate: '2026-05-10',
    expectedEndDate: '2026-08-18',
    status: 'in_progress',
    nursingDirectorId: 's1',
    nursingDirector: mockStaff[0],
    primaryNurseId: 's2',
    primaryNurse: mockStaff[1],
    socialWorkerId: 's4',
    socialWorker: mockStaff[3],
    createdAt: '2026-05-09T09:30:00',
    updatedAt: '2026-06-03T11:00:00',
    hasException: false,
    phases: [
      {
        id: 'ph5-1',
        planId: 'p5',
        phaseNumber: 1,
        title: '术后监护期',
        target: '生命体征稳定，伤口愈合良好',
        content: '持续心电监护、伤口护理、呼吸训练',
        startDate: '2026-05-10',
        endDate: '2026-05-23',
        status: 'approved',
        evaluatorId: 's1',
        evaluationDate: '2026-05-24',
        evaluationResult: '生命体征稳定，伤口愈合良好',
        evaluationScore: 88,
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph5-2',
        planId: 'p5',
        phaseNumber: 2,
        title: '早期活动期',
        target: '床上活动到床边站立',
        content: '床上主动活动、坐位训练、床边站立',
        startDate: '2026-05-24',
        endDate: '2026-06-06',
        status: 'in_progress',
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph5-3',
        planId: 'p5',
        phaseNumber: 3,
        title: '步行训练期',
        target: '室内行走逐步增加距离',
        content: '病房内行走、走廊行走、上下一层楼',
        startDate: '2026-06-07',
        endDate: '2026-07-18',
        status: 'not_started',
        isDelayed: false,
        isSupplemented: false
      },
      {
        id: 'ph5-4',
        planId: 'p5',
        phaseNumber: 4,
        title: '功能恢复与教育',
        target: '恢复日常生活能力，掌握心脏病自我管理',
        content: '日常生活训练、饮食指导、药物教育、心理支持',
        startDate: '2026-07-19',
        endDate: '2026-08-18',
        status: 'not_started',
        isDelayed: false,
        isSupplemented: false
      }
    ]
  }
]

export const mockTimelines: TimelineEvent[] = [
  { id: 't1', planId: 'p1', type: 'create', title: '创建康复计划', description: '由王主管创建张爷爷中风后肢体康复计划', operatorId: 's1', operatorName: '王主管', operatorRole: 'nursing_director', timestamp: '2026-04-28T09:00:00' },
  { id: 't2', planId: 'p1', type: 'status_change', title: '计划开始执行', description: '第一阶段急性期康复开始', operatorId: 's2', operatorName: '李护工', operatorRole: 'primary_nurse', timestamp: '2026-05-01T08:00:00', phaseId: 'ph1-1', phaseNumber: 1 },
  { id: 't3', planId: 'p1', type: 'evaluation', title: '第一阶段评估通过', description: '关节活动度维持良好，评分85分', operatorId: 's1', operatorName: '王主管', operatorRole: 'nursing_director', timestamp: '2026-05-15T10:30:00', phaseId: 'ph1-1', phaseNumber: 1 },
  { id: 't4', planId: 'p1', type: 'status_change', title: '进入第二阶段', description: '开始恢复期训练', operatorId: 's2', operatorName: '李护工', operatorRole: 'primary_nurse', timestamp: '2026-05-15T14:00:00', phaseId: 'ph1-2', phaseNumber: 2 },
  { id: 't5', planId: 'p1', type: 'update', title: '更新训练计划', description: '根据患者情况增加肌力训练强度', operatorId: 's2', operatorName: '李护工', operatorRole: 'primary_nurse', timestamp: '2026-05-20T11:00:00', phaseId: 'ph1-2', phaseNumber: 2 },
  { id: 't6', planId: 'p1', type: 'evaluation', title: '第二阶段评估通过', description: '肌力提升明显，评分88分', operatorId: 's1', operatorName: '王主管', operatorRole: 'nursing_director', timestamp: '2026-05-29T09:00:00', phaseId: 'ph1-2', phaseNumber: 2 },
  { id: 't7', planId: 'p1', type: 'status_change', title: '进入第三阶段', description: '开始步行训练期', operatorId: 's2', operatorName: '李护工', operatorRole: 'primary_nurse', timestamp: '2026-05-29T15:00:00', phaseId: 'ph1-3', phaseNumber: 3 },
  { id: 't8', planId: 'p2', type: 'create', title: '创建康复计划', description: '由王主管创建李奶奶骨折术后康复计划', operatorId: 's1', operatorName: '王主管', operatorRole: 'nursing_director', timestamp: '2026-04-14T10:00:00' },
  { id: 't9', planId: 'p2', type: 'evaluation', title: '第一阶段评估通过', description: '术后恢复良好，评分90分', operatorId: 's1', operatorName: '王主管', operatorRole: 'nursing_director', timestamp: '2026-04-29T10:00:00', phaseId: 'ph2-1', phaseNumber: 1 },
  { id: 't10', planId: 'p2', type: 'exception', title: '评估补录提醒', description: '第二阶段评估超期3天，需要尽快完成', operatorId: 's4', operatorName: '刘社工', operatorRole: 'social_worker', timestamp: '2026-05-15T16:00:00', phaseId: 'ph2-2', phaseNumber: 2 },
  { id: 't11', planId: 'p2', type: 'evaluation', title: '第二阶段补录评估', description: '补录：肌力恢复达标，评分78分', operatorId: 's1', operatorName: '王主管', operatorRole: 'nursing_director', timestamp: '2026-05-18T11:00:00', phaseId: 'ph2-2', phaseNumber: 2 },
  { id: 't12', planId: 'p2', type: 'exception', title: '第三阶段评估拖延', description: '原定5月26日完成评估，现已超期8天', operatorId: 's4', operatorName: '刘社工', operatorRole: 'social_worker', timestamp: '2026-06-03T09:00:00', phaseId: 'ph2-3', phaseNumber: 3 },
  { id: 't13', planId: 'p3', type: 'create', title: '创建康复计划', description: '由陈主管创建王爷爷认知功能康复计划', operatorId: 's5', operatorName: '陈主管', operatorRole: 'nursing_director', timestamp: '2026-02-28T11:00:00' },
  { id: 't14', planId: 'p3', type: 'evaluation', title: '第一阶段评估通过', description: '轻度认知障碍，评分75分', operatorId: 's5', operatorName: '陈主管', operatorRole: 'nursing_director', timestamp: '2026-03-08T10:00:00', phaseId: 'ph3-1', phaseNumber: 1 },
  { id: 't15', planId: 'p3', type: 'evaluation', title: '第二阶段评估通过', description: '记忆能力有改善，评分70分', operatorId: 's5', operatorName: '陈主管', operatorRole: 'nursing_director', timestamp: '2026-05-01T14:00:00', phaseId: 'ph3-2', phaseNumber: 2 },
  { id: 't16', planId: 'p3', type: 'evaluation', title: '第三阶段评估被驳回', description: '评估资料不完整，缺少每日训练记录', operatorId: 's5', operatorName: '陈主管', operatorRole: 'nursing_director', timestamp: '2026-06-01T16:00:00', phaseId: 'ph3-3', phaseNumber: 3 },
  { id: 't17', planId: 'p3', type: 'exception', title: '评估被驳回需重新提交', description: '请补充完整的训练记录和量化数据后重新申请评估', operatorId: 's5', operatorName: '陈主管', operatorRole: 'nursing_director', timestamp: '2026-06-01T16:30:00', phaseId: 'ph3-3', phaseNumber: 3 },
  { id: 't18', planId: 'p4', type: 'create', title: '创建康复计划', description: '由陈主管创建赵奶奶糖尿病足康复计划', operatorId: 's5', operatorName: '陈主管', operatorRole: 'nursing_director', timestamp: '2026-01-30T14:00:00' },
  { id: 't19', planId: 'p4', type: 'status_change', title: '计划完成', description: '康复计划顺利完成，患者可出院', operatorId: 's5', operatorName: '陈主管', operatorRole: 'nursing_director', timestamp: '2026-05-28T15:30:00' },
  { id: 't20', planId: 'p5', type: 'create', title: '创建康复计划', description: '由王主管创建孙爷爷心脏病术后康复计划', operatorId: 's1', operatorName: '王主管', operatorRole: 'nursing_director', timestamp: '2026-05-09T09:30:00' },
  { id: 't21', planId: 'p5', type: 'evaluation', title: '第一阶段评估通过', description: '生命体征稳定，评分88分', operatorId: 's1', operatorName: '王主管', operatorRole: 'nursing_director', timestamp: '2026-05-24T11:00:00', phaseId: 'ph5-1', phaseNumber: 1 }
]

export const mockExceptions: ExceptionRecord[] = [
  {
    id: 'ex1',
    planId: 'p2',
    phaseId: 'ph2-3',
    type: 'delay',
    title: '第三阶段评估拖延',
    reason: '原定5月26日完成评估，现已超期8天。责任护工张护工因请假未能及时安排评估。',
    handlerId: 's1',
    handlerName: '王主管',
    status: 'processing',
    createdAt: '2026-06-03T09:00:00'
  },
  {
    id: 'ex2',
    planId: 'p3',
    phaseId: 'ph3-3',
    type: 'reject',
    title: '第三阶段评估被驳回',
    reason: '评估资料不完整，缺少每日训练记录和量化数据。需要李护工补充完整后重新提交评估申请。',
    handlerId: 's2',
    handlerName: '李护工',
    status: 'processing',
    createdAt: '2026-06-01T16:30:00'
  },
  {
    id: 'ex3',
    planId: 'p2',
    phaseId: 'ph2-2',
    type: 'supplement',
    title: '第二阶段补录评估',
    reason: '第二阶段评估超期3天，已进行补录。原因是评估期间护理主管外出培训。',
    handlerId: 's1',
    handlerName: '王主管',
    status: 'resolved',
    createdAt: '2026-05-15T16:00:00',
    resolvedAt: '2026-05-18T11:00:00',
    resolution: '已完成补录评估，评分78分，可进入下一阶段'
  }
]

export function getPlans(): RehabPlan[] {
  return mockPlans
}

export function getPlanById(id: string): RehabPlan | undefined {
  return mockPlans.find(p => p.id === id)
}

export function getTimelinesByPlanId(planId: string): TimelineEvent[] {
  return mockTimelines.filter(t => t.planId === planId).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

export function getExceptionsByPlanId(planId: string): ExceptionRecord[] {
  return mockExceptions.filter(e => e.planId === planId)
}

export function getAllExceptions(): ExceptionRecord[] {
  return mockExceptions
}
