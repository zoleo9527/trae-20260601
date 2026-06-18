import type { 
  Feedback, 
  RectificationTask, 
  InspectionItem, 
  ScheduleItem, 
  MaterialItem, 
  DashboardStats, 
  MenuItem,
  StatusHistory,
  Role
} from '~/types'

const roleNames: Record<Role, string> = {
  guide: '展教员',
  engineer: '设备工程师',
  activity_teacher: '活动老师'
}

const assignees: Record<Role, string[]> = {
  guide: ['王讲解员', '李讲解员', '张讲解员'],
  engineer: ['李工程师', '张工程师', '刘工程师'],
  activity_teacher: ['陈老师', '赵老师', '孙老师']
}

const generateId = () => Math.random().toString(36).substring(2, 11)

const createHistory = (
  status: string,
  role: Role,
  assignee: string,
  remark: string,
  createdAt: string
): StatusHistory => ({
  id: generateId(),
  status,
  role,
  assignee,
  remark,
  createdAt
})

export const menuItems: MenuItem[] = [
  { name: '工作面', path: '/', icon: 'home' },
  { name: '观众反馈', path: '/feedback', icon: 'message' },
  { name: '展项巡检', path: '/inspection', icon: 'search' },
  { name: '讲解预约', path: '/schedule', icon: 'calendar' },
  { name: '实验材料', path: '/materials', icon: 'box' }
]

const now = new Date()
const formatDate = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19)
const formatDateOnly = (d: Date) => d.toISOString().substring(0, 10)
const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 3600000)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)

export const feedbackList: Feedback[] = [
  {
    id: 'fb001',
    title: '恐龙化石展区互动屏幕死机',
    content: '一楼恐龙化石展区的互动展示屏幕突然死机，重启后仍然无法正常工作，孩子们无法体验互动内容。',
    type: 'fault',
    status: 'engineer_processing',
    priority: 'high',
    visitorName: '刘先生',
    visitorContact: '13800138001',
    exhibitionId: 'ex001',
    exhibitionName: '恐龙化石展区',
    createdAt: formatDate(addHours(now, -48)),
    updatedAt: formatDate(addHours(now, -2)),
    tags: ['设备故障', '互动屏', '恐龙展区'],
    currentRole: 'engineer',
    currentAssignee: '李工程师',
    relatedInspectionId: 'ins003',
    history: [
      createHistory('pending', 'guide', '王讲解员', '观众现场反馈，已登记', formatDate(addHours(now, -48))),
      createHistory('guide_processing', 'guide', '王讲解员', '已到现场核实，确认为硬件故障，需要工程师处理', formatDate(addHours(now, -46))),
      createHistory('guide_completed', 'guide', '王讲解员', '已流转至设备工程师', formatDate(addHours(now, -44))),
      createHistory('engineer_processing', 'engineer', '李工程师', '已接单，正在排查故障原因', formatDate(addHours(now, -42)))
    ],
    tasks: [
      {
        id: 'rt001',
        title: '恐龙展区互动屏维修',
        description: '排查互动屏死机原因，更换故障硬件，恢复系统正常运行',
        feedbackId: 'fb001',
        status: 'in_progress',
        priority: 'high',
        role: 'engineer',
        assignee: '李工程师',
        deadline: formatDateOnly(addDays(now, 1)),
        createdAt: formatDate(addHours(now, -42)),
        progress: 60,
        remark: '已确定为主板故障，配件正在调货',
        history: [
          createHistory('pending', 'engineer', '李工程师', '任务已创建', formatDate(addHours(now, -42))),
          createHistory('in_progress', 'engineer', '李工程师', '开始现场检测', formatDate(addHours(now, -40)))
        ]
      }
    ]
  },
  {
    id: 'fb002',
    title: '周末讲解场次要提前预约',
    content: '周末带孩子来参观，想预约10点的"恐龙世界探秘"讲解，但是到了现场才知道已经约满了，建议增加预约提醒功能。',
    type: 'suggestion',
    status: 'guide_completed',
    priority: 'medium',
    visitorName: '张女士',
    visitorContact: '13900139002',
    createdAt: formatDate(addHours(now, -72)),
    updatedAt: formatDate(addHours(now, -6)),
    tags: ['讲解预约', '周末', '建议'],
    currentRole: 'activity_teacher',
    currentAssignee: '陈老师',
    relatedScheduleId: 'sch002',
    history: [
      createHistory('pending', 'guide', '李讲解员', '观众电话反馈预约问题', formatDate(addHours(now, -72))),
      createHistory('guide_processing', 'guide', '李讲解员', '核实预约系统数据，确认当日场次已满', formatDate(addHours(now, -70))),
      createHistory('guide_completed', 'guide', '李讲解员', '已协调活动老师研究优化方案', formatDate(addHours(now, -68))),
      createHistory('activity_processing', 'activity_teacher', '陈老师', '正在评估增加周末场次的可行性', formatDate(addHours(now, -66))),
      createHistory('activity_completed', 'activity_teacher', '陈老师', '已制定方案：周末增加14:00场，系统增加预约提醒功能', formatDate(addHours(now, -6)))
    ],
    tasks: [
      {
        id: 'rt002',
        title: '周末讲解场次优化',
        description: '评估增加周末讲解场次，在预约系统中增加提前提醒功能',
        feedbackId: 'fb002',
        status: 'completed',
        priority: 'medium',
        role: 'activity_teacher',
        assignee: '陈老师',
        deadline: formatDateOnly(addDays(now, -1)),
        createdAt: formatDate(addHours(now, -68)),
        completedAt: formatDate(addHours(now, -6)),
        progress: 100,
        remark: '方案已通过，下周开始执行',
        history: [
          createHistory('pending', 'activity_teacher', '陈老师', '任务已创建', formatDate(addHours(now, -68))),
          createHistory('in_progress', 'activity_teacher', '陈老师', '调研观众需求和讲解员排班', formatDate(addHours(now, -66))),
          createHistory('completed', 'activity_teacher', '陈老师', '方案制定完成，增加周末14:00场次', formatDate(addHours(now, -6)))
        ]
      }
    ]
  },
  {
    id: 'fb003',
    title: '科学实验课材料不足',
    content: '带孩子参加"火山爆发"实验课，发现小苏打材料不足，很多孩子只能围观不能亲手操作，体验很差。',
    type: 'complaint',
    status: 'guide_processing',
    priority: 'high',
    visitorName: '王先生',
    visitorContact: '13700137003',
    createdAt: formatDate(addHours(now, -3)),
    updatedAt: formatDate(addHours(now, -1)),
    tags: ['实验材料', '耗材', '科学实验'],
    currentRole: 'guide',
    currentAssignee: '张讲解员',
    relatedMaterialId: 'mat001',
    history: [
      createHistory('pending', 'guide', '张讲解员', '现场接到家长投诉', formatDate(addHours(now, -3))),
      createHistory('guide_processing', 'guide', '张讲解员', '正在核实材料库存情况', formatDate(addHours(now, -2)))
    ],
    tasks: []
  },
  {
    id: 'fb004',
    title: '电梯A座故障停用',
    content: '主楼西侧电梯已停用三天，老人和行动不便的观众参观非常困难，希望尽快修复。',
    type: 'complaint',
    status: 'engineer_processing',
    priority: 'high',
    visitorName: '李奶奶',
    visitorContact: '13600136004',
    createdAt: formatDate(addHours(now, -96)),
    updatedAt: formatDate(addHours(now, -8)),
    tags: ['设施故障', '电梯', '无障碍'],
    currentRole: 'engineer',
    currentAssignee: '张工程师',
    relatedInspectionId: 'ins006',
    history: [
      createHistory('pending', 'guide', '王讲解员', '服务台接到老年观众投诉', formatDate(addHours(now, -96))),
      createHistory('guide_processing', 'guide', '王讲解员', '已联系物业，确认为曳引机故障', formatDate(addHours(now, -94))),
      createHistory('guide_completed', 'guide', '王讲解员', '流转至设备工程师处理', formatDate(addHours(now, -92))),
      createHistory('engineer_processing', 'engineer', '张工程师', '配件已到，正在组织维修', formatDate(addHours(now, -24)))
    ],
    tasks: [
      {
        id: 'rt004',
        title: '电梯A座曳引机更换',
        description: '更换故障曳引机，完成安全检测后恢复运行',
        feedbackId: 'fb004',
        status: 'in_progress',
        priority: 'high',
        role: 'engineer',
        assignee: '张工程师',
        deadline: formatDateOnly(addDays(now, 0)),
        createdAt: formatDate(addHours(now, -92)),
        progress: 75,
        remark: '曳引机已吊装到位，正在接线调试',
        history: [
          createHistory('pending', 'engineer', '张工程师', '任务已创建', formatDate(addHours(now, -92))),
          createHistory('in_progress', 'engineer', '张工程师', '等待配件到货', formatDate(addHours(now, -90))),
          createHistory('in_progress', 'engineer', '张工程师', '配件到货，开始施工', formatDate(addHours(now, -24)))
        ]
      }
    ]
  },
  {
    id: 'fb005',
    title: '14:00两场讲解时间冲突',
    content: '预约了14:00的"科学实验秀"和"艺术鉴赏之旅"，发现两场都是14:00开始，时间完全冲突，系统没有提示。',
    type: 'complaint',
    status: 'activity_processing',
    priority: 'medium',
    visitorName: '赵女士',
    visitorContact: '13500135005',
    createdAt: formatDate(addHours(now, -20)),
    updatedAt: formatDate(addHours(now, -4)),
    tags: ['讲解预约', '时间冲突', '系统bug'],
    currentRole: 'activity_teacher',
    currentAssignee: '赵老师',
    relatedScheduleId: 'sch004',
    history: [
      createHistory('pending', 'guide', '李讲解员', '观众在线反馈预约冲突', formatDate(addHours(now, -20))),
      createHistory('guide_processing', 'guide', '李讲解员', '已核实，两场次确实时间重叠', formatDate(addHours(now, -18))),
      createHistory('guide_completed', 'guide', '李讲解员', '已联系观众，建议调整其中一场', formatDate(addHours(now, -16))),
      createHistory('activity_processing', 'activity_teacher', '赵老师', '正在优化排期，避免后续冲突', formatDate(addHours(now, -4)))
    ],
    tasks: [
      {
        id: 'rt005',
        title: '讲解场次排期优化',
        description: '检查所有讲解场次排期，解决时间冲突问题，优化系统冲突检测',
        feedbackId: 'fb005',
        status: 'in_progress',
        priority: 'medium',
        role: 'activity_teacher',
        assignee: '赵老师',
        deadline: formatDateOnly(addDays(now, 2)),
        createdAt: formatDate(addHours(now, -16)),
        progress: 40,
        remark: '已调整"艺术鉴赏之旅"至14:30开始，正在排查其他可能的冲突',
        history: [
          createHistory('pending', 'activity_teacher', '赵老师', '任务已创建', formatDate(addHours(now, -16))),
          createHistory('in_progress', 'activity_teacher', '赵老师', '开始排查全月排期', formatDate(addHours(now, -4)))
        ]
      }
    ]
  },
  {
    id: 'fb006',
    title: '食用色素红色缺货',
    content: '准备开展"色彩魔法"实验课，发现红色食用色素已经用完，影响实验效果。',
    type: 'fault',
    status: 'activity_completed',
    priority: 'high',
    visitorName: '陈老师',
    visitorContact: '13400134006',
    createdAt: formatDate(addHours(now, -120)),
    updatedAt: formatDate(addHours(now, -12)),
    tags: ['实验材料', '缺货', '化学试剂'],
    currentRole: 'guide',
    currentAssignee: '王讲解员',
    relatedMaterialId: 'mat005',
    history: [
      createHistory('pending', 'activity_teacher', '陈老师', '活动老师课前检查发现缺货', formatDate(addHours(now, -120))),
      createHistory('activity_processing', 'activity_teacher', '陈老师', '已紧急申请采购', formatDate(addHours(now, -118))),
      createHistory('activity_completed', 'activity_teacher', '陈老师', '材料已采购入库，验收完成', formatDate(addHours(now, -12)))
    ],
    tasks: [
      {
        id: 'rt006',
        title: '红色食用色素紧急采购',
        description: '紧急采购红色食用色素10瓶，确保实验课正常开展',
        feedbackId: 'fb006',
        status: 'verified',
        priority: 'high',
        role: 'activity_teacher',
        assignee: '陈老师',
        deadline: formatDateOnly(addDays(now, -2)),
        createdAt: formatDate(addHours(now, -118)),
        completedAt: formatDate(addHours(now, -24)),
        progress: 100,
        remark: '采购10瓶，已入库8瓶，剩余2瓶在途',
        history: [
          createHistory('pending', 'activity_teacher', '陈老师', '任务已创建', formatDate(addHours(now, -118))),
          createHistory('in_progress', 'activity_teacher', '陈老师', '已下单采购', formatDate(addHours(now, -116))),
          createHistory('completed', 'activity_teacher', '陈老师', '材料到货', formatDate(addHours(now, -24))),
          createHistory('verified', 'activity_teacher', '陈老师', '验收合格，已入库', formatDate(addHours(now, -12)))
        ]
      }
    ]
  },
  {
    id: 'fb007',
    title: 'VR体验设备画面卡顿',
    content: '三楼科技厅的VR体验设备画面卡顿严重，经常出现眩晕感，希望尽快检修。',
    type: 'fault',
    status: 'pending',
    priority: 'medium',
    visitorName: '周同学',
    visitorContact: '13300133007',
    exhibitionId: 'ex003',
    exhibitionName: '科技互动区',
    createdAt: formatDate(addHours(now, -1)),
    updatedAt: formatDate(addHours(now, -1)),
    tags: ['设备故障', 'VR', '画面卡顿'],
    currentRole: 'guide',
    currentAssignee: '王讲解员',
    relatedInspectionId: 'ins003',
    history: [
      createHistory('pending', 'guide', '王讲解员', '观众现场反馈，待核实', formatDate(addHours(now, -1)))
    ],
    tasks: []
  },
  {
    id: 'fb008',
    title: '讲解员服务非常专业',
    content: '今天参观时王讲解员的讲解非常生动专业，孩子收获很大，特地表扬！',
    type: 'praise',
    status: 'resolved',
    priority: 'low',
    visitorName: '吴先生',
    visitorContact: '13200132008',
    createdAt: formatDate(addHours(now, -144)),
    updatedAt: formatDate(addHours(now, -140)),
    tags: ['表扬', '讲解服务'],
    currentRole: 'guide',
    currentAssignee: '王讲解员',
    history: [
      createHistory('pending', 'guide', '李讲解员', '收到观众表扬', formatDate(addHours(now, -144))),
      createHistory('guide_processing', 'guide', '李讲解员', '已转达王讲解员及部门', formatDate(addHours(now, -143))),
      createHistory('resolved', 'guide', '李讲解员', '已记录表扬档案', formatDate(addHours(now, -140)))
    ],
    tasks: []
  }
]

export const inspectionItems: InspectionItem[] = [
  {
    id: 'ins001',
    name: '恐龙化石骨架',
    location: '一楼古生物厅',
    category: '展品',
    status: 'normal',
    lastInspectionDate: formatDateOnly(addDays(now, -2)),
    nextInspectionDate: formatDateOnly(addDays(now, 5)),
    inspector: '王巡检员',
    issues: 0
  },
  {
    id: 'ins002',
    name: '互动投影设备',
    location: '二楼数字展厅',
    category: '设备',
    status: 'warning',
    lastInspectionDate: formatDateOnly(addDays(now, -3)),
    nextInspectionDate: formatDateOnly(addDays(now, 4)),
    inspector: '李巡检员',
    issues: 1,
    lastRemark: '投影亮度略有下降，建议更换灯泡'
  },
  {
    id: 'ins003',
    name: 'VR体验设备',
    location: '三楼科技厅',
    category: '设备',
    status: 'error',
    lastInspectionDate: formatDateOnly(addDays(now, -1)),
    nextInspectionDate: formatDateOnly(addDays(now, 6)),
    inspector: '张巡检员',
    issues: 2,
    lastRemark: '画面卡顿，疑似显卡故障，已关联反馈fb001、fb007',
    relatedFeedbackId: 'fb001'
  },
  {
    id: 'ins004',
    name: '古代陶瓷展柜',
    location: '二楼历史厅',
    category: '展品',
    status: 'normal',
    lastInspectionDate: formatDateOnly(addDays(now, -4)),
    nextInspectionDate: formatDateOnly(addDays(now, 3)),
    inspector: '赵巡检员',
    issues: 0
  },
  {
    id: 'ins005',
    name: '消防喷淋系统',
    location: '全馆',
    category: '安全设施',
    status: 'normal',
    lastInspectionDate: formatDateOnly(addDays(now, -7)),
    nextInspectionDate: formatDateOnly(addDays(now, 23)),
    inspector: '陈巡检员',
    issues: 0
  },
  {
    id: 'ins006',
    name: '电梯A座',
    location: '主楼西侧',
    category: '设施',
    status: 'error',
    lastInspectionDate: formatDateOnly(addDays(now, 0)),
    nextInspectionDate: formatDateOnly(addDays(now, 7)),
    inspector: '王巡检员',
    issues: 3,
    lastRemark: '曳引机故障停用，维修中，关联反馈fb004',
    relatedFeedbackId: 'fb004'
  },
  {
    id: 'ins007',
    name: '中央空调主机',
    location: '地下机房',
    category: '设备',
    status: 'normal',
    lastInspectionDate: formatDateOnly(addDays(now, -5)),
    nextInspectionDate: formatDateOnly(addDays(now, 9)),
    inspector: '李巡检员',
    issues: 0
  },
  {
    id: 'ins008',
    name: '安全监控系统',
    location: '全馆',
    category: '安全设施',
    status: 'warning',
    lastInspectionDate: formatDateOnly(addDays(now, -2)),
    nextInspectionDate: formatDateOnly(addDays(now, 5)),
    inspector: '张巡检员',
    issues: 1,
    lastRemark: '3号摄像头画面模糊，需清洁镜头'
  },
  {
    id: 'ins009',
    name: '互动触摸屏5号',
    location: '三楼科学互动区',
    category: '设备',
    status: 'error',
    lastInspectionDate: formatDateOnly(addDays(now, -1)),
    nextInspectionDate: formatDateOnly(addDays(now, 6)),
    inspector: '李巡检员',
    issues: 1,
    lastRemark: '触摸屏无响应，已报修'
  }
]

export const scheduleList: ScheduleItem[] = [
  {
    id: 'sch001',
    title: '恐龙世界探秘',
    guideName: '王讲解员',
    date: formatDateOnly(addDays(now, 1)),
    startTime: '09:30',
    endTime: '10:30',
    location: '一楼古生物厅',
    maxVisitors: 30,
    currentVisitors: 25,
    status: 'available',
    description: '深入了解恐龙的演化历史，探索远古生物的奥秘。'
  },
  {
    id: 'sch002',
    title: '中华文明五千年',
    guideName: '李讲解员',
    date: formatDateOnly(addDays(now, 1)),
    startTime: '10:00',
    endTime: '11:30',
    location: '二楼历史厅',
    maxVisitors: 25,
    currentVisitors: 25,
    status: 'full',
    description: '穿越时空，领略中华文明的辉煌历程。'
  },
  {
    id: 'sch003',
    title: '科学实验秀',
    guideName: '张讲解员',
    date: formatDateOnly(addDays(now, 1)),
    startTime: '14:00',
    endTime: '15:00',
    location: '三楼科技厅',
    maxVisitors: 40,
    currentVisitors: 18,
    status: 'available',
    description: '趣味科学实验，激发孩子的科学探索精神。'
  },
  {
    id: 'sch004',
    title: '艺术鉴赏之旅',
    guideName: '刘讲解员',
    date: formatDateOnly(addDays(now, 1)),
    startTime: '14:30',
    endTime: '16:00',
    location: '四楼艺术厅',
    maxVisitors: 20,
    currentVisitors: 12,
    status: 'available',
    description: '欣赏名家画作，感受艺术之美。',
    conflictInfo: '原14:00场次已调整至14:30，避免与科学实验秀冲突'
  },
  {
    id: 'sch005',
    title: '恐龙世界探秘',
    guideName: '王讲解员',
    date: formatDateOnly(addDays(now, 2)),
    startTime: '09:30',
    endTime: '10:30',
    location: '一楼古生物厅',
    maxVisitors: 30,
    currentVisitors: 10,
    status: 'available',
    description: '深入了解恐龙的演化历史，探索远古生物的奥秘。'
  },
  {
    id: 'sch006',
    title: '科学实验秀',
    guideName: '张讲解员',
    date: formatDateOnly(addDays(now, 2)),
    startTime: '14:00',
    endTime: '15:00',
    location: '三楼科技厅',
    maxVisitors: 40,
    currentVisitors: 40,
    status: 'full',
    description: '趣味科学实验，激发孩子的科学探索精神。'
  },
  {
    id: 'sch007',
    title: '科学实验秀',
    guideName: '陈老师',
    date: formatDateOnly(addDays(now, 2)),
    startTime: '14:00',
    endTime: '15:00',
    location: '三楼科技厅',
    maxVisitors: 30,
    currentVisitors: 5,
    status: 'available',
    description: '周末加开场次，趣味科学实验。',
    conflictInfo: '根据fb002反馈新增的周末场次'
  },
  {
    id: 'sch008',
    title: '夜场特别讲解',
    guideName: '赵讲解员',
    date: formatDateOnly(addDays(now, 3)),
    startTime: '19:00',
    endTime: '20:30',
    location: '全馆',
    maxVisitors: 50,
    currentVisitors: 48,
    status: 'full',
    description: '夜幕下的博物馆，别有一番神秘氛围。'
  }
]

export const materialList: MaterialItem[] = [
  {
    id: 'mat001',
    name: '小苏打',
    category: '化学试剂',
    quantity: 50,
    unit: 'kg',
    minStock: 20,
    status: 'normal',
    location: 'A区-01货架',
    lastUpdated: formatDateOnly(addDays(now, -2))
  },
  {
    id: 'mat002',
    name: '白醋',
    category: '化学试剂',
    quantity: 30,
    unit: 'L',
    minStock: 25,
    status: 'normal',
    location: 'A区-02货架',
    lastUpdated: formatDateOnly(addDays(now, -1))
  },
  {
    id: 'mat003',
    name: '实验烧杯(500ml)',
    category: '实验器具',
    quantity: 15,
    unit: '个',
    minStock: 20,
    status: 'low',
    location: 'B区-03货架',
    lastUpdated: formatDateOnly(addDays(now, -3)),
    lastRemark: '库存偏低，建议采购'
  },
  {
    id: 'mat004',
    name: '护目镜',
    category: '防护用品',
    quantity: 5,
    unit: '副',
    minStock: 10,
    status: 'low',
    location: 'C区-01货架',
    lastUpdated: formatDateOnly(addDays(now, -4)),
    lastRemark: '库存不足，需尽快补充'
  },
  {
    id: 'mat005',
    name: '食用色素(红)',
    category: '化学试剂',
    quantity: 8,
    unit: '瓶',
    minStock: 5,
    status: 'normal',
    location: 'A区-05货架',
    lastUpdated: formatDateOnly(addDays(now, 0)),
    lastRemark: '根据fb006反馈紧急采购，已入库8瓶',
    relatedFeedbackId: 'fb006'
  },
  {
    id: 'mat006',
    name: '试管架',
    category: '实验器具',
    quantity: 20,
    unit: '个',
    minStock: 10,
    status: 'normal',
    location: 'B区-01货架',
    lastUpdated: formatDateOnly(addDays(now, -2))
  },
  {
    id: 'mat007',
    name: '一次性手套',
    category: '防护用品',
    quantity: 200,
    unit: '只',
    minStock: 100,
    status: 'normal',
    location: 'C区-02货架',
    lastUpdated: formatDateOnly(addDays(now, -1))
  },
  {
    id: 'mat008',
    name: '酒精灯',
    category: '实验器具',
    quantity: 8,
    unit: '个',
    minStock: 10,
    status: 'low',
    location: 'B区-05货架',
    lastUpdated: formatDateOnly(addDays(now, -7)),
    lastRemark: '库存偏低'
  },
  {
    id: 'mat009',
    name: '食用色素(蓝)',
    category: '化学试剂',
    quantity: 0,
    unit: '瓶',
    minStock: 5,
    status: 'out',
    location: 'A区-05货架',
    lastUpdated: formatDateOnly(addDays(now, -5)),
    lastRemark: '已缺货，需紧急采购'
  },
  {
    id: 'mat010',
    name: '柠檬酸',
    category: '化学试剂',
    quantity: 12,
    unit: 'kg',
    minStock: 15,
    status: 'low',
    location: 'A区-03货架',
    lastUpdated: formatDateOnly(addDays(now, -3)),
    lastRemark: '库存即将不足'
  }
]

export const dashboardStats: DashboardStats = {
  totalFeedback: 156,
  pendingFeedback: 23,
  resolvedFeedback: 128,
  resolutionRate: 82,
  activeTasks: 15,
  completedTasks: 42,
  inspectionItems: 58,
  normalItems: 52,
  todaySchedules: 6,
  totalVisitors: 1280,
  materialsCount: 128,
  lowStockCount: 8,
  roleStats: [
    { role: 'guide', roleName: '展教员', pendingCount: 12, processingCount: 3, completedCount: 45 },
    { role: 'engineer', roleName: '设备工程师', pendingCount: 5, processingCount: 2, completedCount: 18 },
    { role: 'activity_teacher', roleName: '活动老师', pendingCount: 6, processingCount: 2, completedCount: 15 }
  ]
}

export const statusLabels: Record<string, string> = {
  pending: '待处理',
  guide_processing: '展教员处理中',
  guide_completed: '展教员已处理',
  engineer_processing: '工程师处理中',
  engineer_completed: '工程师已处理',
  activity_processing: '活动老师处理中',
  activity_completed: '活动老师已处理',
  resolved: '已解决',
  closed: '已关闭',
  in_progress: '进行中',
  completed: '已完成',
  verified: '已验收',
  available: '可预约',
  full: '已满',
  cancelled: '已取消',
  conflict: '有冲突',
  normal: '正常',
  warning: '警告',
  error: '异常',
  low: '库存低',
  out: '缺货'
}

export const roleLabels: Record<Role, string> = roleNames

export const assigneeList = assignees
