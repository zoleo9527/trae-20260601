import type {
  User, InspectionRecord, RectificationRecord,
  TodoItem, Alert, InspectionCriterion, TimelineEvent, UserRole
} from '~/types'

export const users: Record<UserRole, User> = {
  technician: {
    id: 'u001',
    name: '张师傅',
    role: 'technician',
    avatar: '张',
    phone: '138****1234',
    department: '维保一组'
  },
  customer_service: {
    id: 'u002',
    name: '李客服',
    role: 'customer_service',
    avatar: '李',
    phone: '138****5678',
    department: '客服中心'
  },
  project_manager: {
    id: 'u003',
    name: '王主管',
    role: 'project_manager',
    avatar: '王',
    phone: '138****9012',
    department: '运维部'
  }
}

export const inspectionCriteria: InspectionCriterion[] = [
  { id: 'c001', code: '1.1', category: '机房', name: '机房环境整洁', standard: '机房内无杂物堆积，通风良好，温度≤40℃', method: '目视检查+温度计测量', isRequired: true },
  { id: 'c002', code: '1.2', category: '机房', name: '控制柜标识', standard: '控制柜标识清晰，门锁完好', method: '目视检查', isRequired: true },
  { id: 'c003', code: '1.3', category: '机房', name: '紧急救援装置', standard: '松闸扳手、盘车手轮配备齐全且标识清晰', method: '目视检查', isRequired: true },
  { id: 'c004', code: '2.1', category: '曳引系统', name: '曳引机运行状态', standard: '运行无异响、无异常振动，温度正常', method: '听测+测温', isRequired: true },
  { id: 'c005', code: '2.2', category: '曳引系统', name: '钢丝绳磨损', standard: '钢丝绳直径减少量≤7%，无断丝超标', method: '游标卡尺测量+目视', isRequired: true },
  { id: 'c006', code: '2.3', category: '曳引系统', name: '制动器功能', standard: '制动器动作灵活，制动力矩符合要求', method: '功能测试', isRequired: true },
  { id: 'c007', code: '3.1', category: '轿厢', name: '紧急报警装置', standard: '警铃/对讲系统畅通，可与外界有效通话', method: '功能测试', isRequired: true },
  { id: 'c008', code: '3.2', category: '轿厢', name: '超载保护', standard: '超载110%时应报警并停止运行', method: '功能测试', isRequired: true },
  { id: 'c009', code: '3.3', category: '轿厢', name: '平层精度', standard: '平层误差≤±5mm', method: '直尺测量', isRequired: true },
  { id: 'c010', code: '4.1', category: '门系统', name: '门联锁安全', standard: '层门打开时电梯不能启动', method: '功能测试', isRequired: true },
  { id: 'c011', code: '4.2', category: '门系统', name: '门防夹保护', standard: '关门受阻自动开门，触板/光幕有效', method: '功能测试', isRequired: true },
  { id: 'c012', code: '5.1', category: '安全保护', name: '限速器-安全钳联动', standard: '联动试验有效，动作可靠', method: '限速器动作速度校验+安全钳提拉试验', isRequired: true },
  { id: 'c013', code: '5.2', category: '安全保护', name: '缓冲器', standard: '缓冲器完好，液压缓冲器油位正常', method: '目视检查', isRequired: true },
  { id: 'c014', code: '5.3', category: '安全保护', name: '上下极限开关', standard: '极限开关动作可靠，能切断主电源', method: '模拟测试', isRequired: true },
  { id: 'c015', code: '6.1', category: '随行电缆', name: '电缆外观', standard: '无破损、无老化，绑扎固定可靠', method: '目视检查', isRequired: false }
]

export const mockInspections: InspectionRecord[] = [
  {
    id: 'INSP-2026-0015',
    elevatorId: 'ELV-GX001',
    elevatorName: '1号楼A座-1号梯',
    location: '高新区科技园区A座1号楼',
    inspectionDate: '2026-06-08',
    inspector: '张师傅',
    status: 'non_compliant',
    items: [
      { criterionId: 'c001', result: 'pass' },
      { criterionId: 'c002', result: 'pass' },
      { criterionId: 'c003', result: 'fail', note: '松闸扳手遗失，仅存盘车手轮', evidence: '现场未找到松闸扳手，机房工具箱内缺失' },
      { criterionId: 'c004', result: 'pass' },
      { criterionId: 'c005', result: 'pass' },
      { criterionId: 'c006', result: 'pass' },
      { criterionId: 'c007', result: 'fail', note: '对讲系统有杂音，与值班室通话不清晰', evidence: '测试对讲时声音断续，对方难以听清' },
      { criterionId: 'c008', result: 'pass' },
      { criterionId: 'c009', result: 'fail', note: '3层平层误差8mm，超出标准', evidence: '直尺测量3层上平层+8mm' },
      { criterionId: 'c010', result: 'pass' },
      { criterionId: 'c011', result: 'pass' },
      { criterionId: 'c012', result: 'pass' },
      { criterionId: 'c013', result: 'pass' },
      { criterionId: 'c014', result: 'pass' },
      { criterionId: 'c015', result: 'pass' }
    ],
    failItems: ['1.3 紧急救援装置', '3.1 紧急报警装置', '3.3 平层精度'],
    failReasons: [
      '松闸扳手遗失，违反TSG T7001-2009 2.8项要求',
      '对讲系统通话质量不达标，存在应急通讯隐患',
      '3层平层误差8mm超过±5mm标准限值'
    ],
    conclusion: '本次年检发现3项不合格，其中1项为关键项（紧急救援装置），需在整改期内完成并申请复查。',
    rectificationDeadline: '2026-06-18',
    createdAt: '2026-06-08T14:30:00',
    updatedAt: '2026-06-08T16:45:00'
  },
  {
    id: 'INSP-2026-0012',
    elevatorId: 'ELV-GX002',
    elevatorName: '1号楼A座-2号梯',
    location: '高新区科技园区A座1号楼',
    inspectionDate: '2026-06-05',
    inspector: '张师傅',
    status: 'closed',
    items: [
      { criterionId: 'c001', result: 'pass' },
      { criterionId: 'c002', result: 'pass' },
      { criterionId: 'c003', result: 'fail', note: '机房温度43℃，超标', evidence: '温度计实测43.2℃' },
      { criterionId: 'c004', result: 'pass' },
      { criterionId: 'c005', result: 'pass' },
      { criterionId: 'c006', result: 'pass' },
      { criterionId: 'c007', result: 'pass' },
      { criterionId: 'c008', result: 'pass' },
      { criterionId: 'c009', result: 'pass' },
      { criterionId: 'c010', result: 'pass' },
      { criterionId: 'c011', result: 'pass' },
      { criterionId: 'c012', result: 'pass' },
      { criterionId: 'c013', result: 'pass' },
      { criterionId: 'c014', result: 'pass' },
      { criterionId: 'c015', result: 'pass' }
    ],
    failItems: ['1.1 机房环境整洁（温度超标）'],
    failReasons: ['机房空调故障，实测温度43.2℃超出40℃限值，影响控制柜散热'],
    conclusion: '发现1项一般不合格项，整改完成并通过复查。',
    rectificationDeadline: '2026-06-12',
    createdAt: '2026-06-05T10:15:00',
    updatedAt: '2026-06-11T17:00:00'
  },
  {
    id: 'INSP-2026-0018',
    elevatorId: 'ELV-GX003',
    elevatorName: '2号楼-1号梯',
    location: '高新区科技园区B区2号楼',
    inspectionDate: '2026-06-09',
    inspector: '张师傅',
    status: 'under_review',
    items: [
      { criterionId: 'c001', result: 'pass' },
      { criterionId: 'c002', result: 'pass' },
      { criterionId: 'c003', result: 'pass' },
      { criterionId: 'c004', result: 'pass' },
      { criterionId: 'c005', result: 'pass' },
      { criterionId: 'c006', result: 'pass' },
      { criterionId: 'c007', result: 'pass' },
      { criterionId: 'c008', result: 'pass' },
      { criterionId: 'c009', result: 'pass' },
      { criterionId: 'c010', result: 'pass' },
      { criterionId: 'c011', result: 'pass' },
      { criterionId: 'c012', result: 'pass' },
      { criterionId: 'c013', result: 'pass' },
      { criterionId: 'c014', result: 'pass' },
      { criterionId: 'c015', result: 'na', note: '此梯为无机房，该项不适用' }
    ],
    failItems: [],
    failReasons: [],
    conclusion: '待主管审核确认',
    createdAt: '2026-06-09T15:20:00',
    updatedAt: '2026-06-09T15:20:00'
  },
  {
    id: 'INSP-2026-0008',
    elevatorId: 'ELV-CBD001',
    elevatorName: 'CBD中心-T3客梯',
    location: '市中心CBD大厦T3塔楼',
    inspectionDate: '2026-05-28',
    inspector: '陈师傅',
    status: 'compliant',
    items: inspectionCriteria.map(c => ({ criterionId: c.id, result: 'pass' as const })),
    failItems: [],
    failReasons: [],
    conclusion: '年检全部项目合格，通过年检。',
    createdAt: '2026-05-28T11:00:00',
    updatedAt: '2026-05-29T09:30:00'
  }
]

export const mockRectifications: RectificationRecord[] = [
  {
    id: 'RECT-2026-0015',
    inspectionId: 'INSP-2026-0015',
    elevatorId: 'ELV-GX001',
    elevatorName: '1号楼A座-1号梯',
    location: '高新区科技园区A座1号楼',
    status: 'in_progress',
    priority: 'high',
    failItems: ['1.3 紧急救援装置', '3.1 紧急报警装置', '3.3 平层精度'],
    originalReasons: [
      '松闸扳手遗失，违反TSG T7001-2009 2.8项要求',
      '对讲系统通话质量不达标，存在应急通讯隐患',
      '3层平层误差8mm超过±5mm标准限值'
    ],
    assignedTo: '张师傅',
    assigneeRole: 'technician',
    deadline: '2026-06-18',
    rectificationMeasures: [
      {
        id: 'rm001',
        itemId: 'c003',
        itemName: '1.3 紧急救援装置',
        originalProblem: '松闸扳手遗失，机房工具箱内缺失',
        measure: '已申领型号匹配的松闸扳手（规格：WB-200），并在指定位置固定安装，贴红色警示标识',
        operator: '张师傅',
        completedAt: '2026-06-09T10:30:00',
        remark: '已通知库管登记出入库记录'
      },
      {
        id: 'rm002',
        itemId: 'c007',
        itemName: '3.1 紧急报警装置',
        originalProblem: '对讲系统有杂音，与值班室通话不清晰',
        measure: '',
        operator: '',
        completedAt: '',
        remark: '对讲主机已下单采购，预计6月12日到货后更换'
      },
      {
        id: 'rm003',
        itemId: 'c009',
        itemName: '3.3 平层精度',
        originalProblem: '3层平层误差+8mm，超出±5mm标准',
        measure: '调整3层平层感应器位置，重新进行平层精度校准',
        operator: '张师傅',
        completedAt: '2026-06-09T14:15:00',
        remark: '校准后连续5次测试，误差均在±3mm以内'
      }
    ],
    createdAt: '2026-06-08T17:00:00',
    updatedAt: '2026-06-09T14:20:00'
  },
  {
    id: 'RECT-2026-0012',
    inspectionId: 'INSP-2026-0012',
    elevatorId: 'ELV-GX002',
    elevatorName: '1号楼A座-2号梯',
    location: '高新区科技园区A座1号楼',
    status: 'closed',
    priority: 'medium',
    failItems: ['1.1 机房温度超标'],
    originalReasons: ['机房空调故障，实测温度43.2℃，影响控制柜散热'],
    assignedTo: '张师傅',
    assigneeRole: 'technician',
    deadline: '2026-06-12',
    rectificationMeasures: [
      {
        id: 'rm010',
        itemId: 'c001',
        itemName: '1.1 机房环境整洁（温度）',
        originalProblem: '机房空调不制冷，温度43.2℃',
        measure: '联系空调供应商检修，更换压缩机启动电容；补充制冷剂R22约0.8kg；清洗过滤网',
        operator: '张师傅（协调空调维修）',
        completedAt: '2026-06-09T16:00:00',
        remark: '空调维修方：XX制冷，维修单号：AC-20260609-003'
      }
    ],
    recheckResults: [
      {
        id: 'rc001',
        rechecker: '王主管',
        recheckerRole: 'project_manager',
        recheckDate: '2026-06-10',
        result: 'pass',
        items: [{
          itemId: 'c001',
          itemName: '1.1 机房环境整洁（温度）',
          result: 'pass',
          note: '温度计实测机房温度25.6℃，符合≤40℃标准'
        }],
        overallConclusion: '整改完成，机房空调恢复正常，温度达标，复查通过，闭环归档。'
      }
    ],
    closedAt: '2026-06-11T17:00:00',
    closedBy: '王主管',
    createdAt: '2026-06-05T17:30:00',
    updatedAt: '2026-06-11T17:00:00'
  },
  {
    id: 'RECT-2026-0009',
    inspectionId: 'INSP-2026-0009',
    elevatorId: 'ELV-CBD002',
    elevatorName: 'CBD中心-T3货梯',
    location: '市中心CBD大厦T3塔楼',
    status: 'recheck',
    priority: 'high',
    failItems: ['4.2 门防夹保护', '5.3 上下极限开关'],
    originalReasons: [
      '货梯光幕被灰尘遮挡，防夹功能偶尔失效',
      '下极限开关接触片锈蚀，偶发误动作'
    ],
    assignedTo: '陈师傅',
    assigneeRole: 'technician',
    deadline: '2026-06-10',
    rectificationMeasures: [
      {
        id: 'rm020',
        itemId: 'c011',
        itemName: '4.2 门防夹保护',
        originalProblem: '光幕积灰导致防夹功能偶尔失效',
        measure: '拆卸光幕组件用无水乙醇清洁，重新校准光轴，测试20次全部正常',
        operator: '陈师傅',
        completedAt: '2026-06-08T11:00:00'
      },
      {
        id: 'rm021',
        itemId: 'c014',
        itemName: '5.3 上下极限开关',
        originalProblem: '下极限开关接触片锈蚀',
        measure: '更换同型号下极限开关（型号：SZ-8108），调整动作距离，模拟测试3次均可靠',
        operator: '陈师傅',
        completedAt: '2026-06-08T15:30:00',
        remark: '更换后已记录设备档案'
      }
    ],
    createdAt: '2026-06-02T09:00:00',
    updatedAt: '2026-06-08T16:00:00'
  }
]

export const mockTodos: Record<UserRole, TodoItem[]> = {
  technician: [
    {
      id: 'td001',
      type: 'rectification',
      title: '完成1号楼A座-1号梯对讲系统整改',
      description: '需更换对讲主机，采购已下单，预计到货后安装调试',
      relatedId: 'RECT-2026-0015',
      priority: 'high',
      deadline: '2026-06-18',
      assignedBy: '王主管',
      createdAt: '2026-06-08T17:00:00'
    },
    {
      id: 'td002',
      type: 'inspection',
      title: '完成B区3号楼年度年检',
      description: '2部客梯+1部货梯，按TSG T7001标准逐项检测',
      relatedId: 'NEW-INSPECT-001',
      priority: 'medium',
      deadline: '2026-06-15',
      createdAt: '2026-06-06T09:00:00'
    },
    {
      id: 'td003',
      type: 'recheck',
      title: 'CBD-T3货梯整改完成后自测',
      description: '先自测光幕和极限开关，再提交主管复查',
      relatedId: 'RECT-2026-0009',
      priority: 'high',
      deadline: '2026-06-10',
      createdAt: '2026-06-08T16:30:00'
    }
  ],
  customer_service: [
    {
      id: 'td101',
      type: 'rectification',
      title: '跟进1号楼A座-1号梯整改进度',
      description: '每日同步整改状态给甲方物业，张工反馈对讲设备12号到',
      relatedId: 'RECT-2026-0015',
      priority: 'medium',
      deadline: '2026-06-18',
      assignedBy: '王主管',
      createdAt: '2026-06-09T09:15:00'
    },
    {
      id: 'td102',
      type: 'review',
      title: '核对INSP-2026-0018年检资料完整性',
      description: '检查年检记录、照片、签字是否齐全后转交主管审核',
      relatedId: 'INSP-2026-0018',
      priority: 'high',
      deadline: '2026-06-11',
      createdAt: '2026-06-09T15:30:00'
    },
    {
      id: 'td103',
      type: 'system',
      title: '发送整改期限临近提醒',
      description: '系统将在6月13日自动推送临近截止的整改通知',
      relatedId: '',
      priority: 'low',
      deadline: '2026-06-13',
      createdAt: '2026-06-07T08:00:00'
    }
  ],
  project_manager: [
    {
      id: 'td201',
      type: 'review',
      title: '审核INSP-2026-0018年检报告',
      description: '2号楼1号梯年检待审核，张师傅已提交完整资料',
      relatedId: 'INSP-2026-0018',
      priority: 'high',
      deadline: '2026-06-10',
      createdAt: '2026-06-09T15:25:00'
    },
    {
      id: 'td202',
      type: 'recheck',
      title: '现场复查CBD-T3货梯整改',
      description: '陈师傅已完成光幕清洁和极限开关更换，需现场复核并签署结论',
      relatedId: 'RECT-2026-0009',
      priority: 'critical',
      deadline: '2026-06-10',
      createdAt: '2026-06-09T08:30:00'
    },
    {
      id: 'td203',
      type: 'review',
      title: '审批RECT-2026-0012闭环归档',
      description: '1号楼A座-2号梯机房空调整改，已复查通过，确认闭环',
      relatedId: 'RECT-2026-0012',
      priority: 'medium',
      deadline: '2026-06-12',
      createdAt: '2026-06-11T09:00:00'
    }
  ]
}

export const mockAlerts: Alert[] = [
  {
    id: 'al001',
    type: 'rectification',
    title: '新增整改派单：紧急救援装置',
    message: '年检发现1号楼A座-1号梯松闸扳手遗失（关键项），请立即启动整改流程。',
    relatedId: 'RECT-2026-0015',
    relatedType: 'rectification',
    priority: 'high',
    isRead: false,
    createdAt: '2026-06-08T16:50:00'
  },
  {
    id: 'al002',
    type: 'deadline',
    title: '整改期限临近预警',
    message: 'RECT-2026-0009（CBD-T3货梯）整改将于2026-06-10到期，当前状态：待复查。',
    relatedId: 'RECT-2026-0009',
    relatedType: 'rectification',
    priority: 'critical',
    isRead: false,
    createdAt: '2026-06-09T08:00:00'
  },
  {
    id: 'al003',
    type: 'non_compliant',
    title: '年检不合格：3项问题',
    message: '1号楼A座-1号梯年检发现3项不合格（含1项关键项），已生成整改单。',
    relatedId: 'INSP-2026-0015',
    relatedType: 'inspection',
    priority: 'high',
    isRead: true,
    createdAt: '2026-06-08T16:45:00'
  },
  {
    id: 'al004',
    type: 'recheck',
    title: '整改完成待复查',
    message: 'CBD-T3货梯整改措施已提交，请安排现场复查。',
    relatedId: 'RECT-2026-0009',
    relatedType: 'rectification',
    priority: 'high',
    isRead: true,
    createdAt: '2026-06-08T16:05:00'
  },
  {
    id: 'al005',
    type: 'system',
    title: '年检资料待审核',
    message: 'INSP-2026-0018（2号楼1号梯）年检资料已提交，请及时审核。',
    relatedId: 'INSP-2026-0018',
    relatedType: 'inspection',
    priority: 'medium',
    isRead: true,
    createdAt: '2026-06-09T15:20:00'
  },
  {
    id: 'al006',
    type: 'deadline',
    title: '整改期限超期预警（测试）',
    message: 'RECT-2026-XXXX整改已超期2天，请立即处理并说明原因。',
    priority: 'critical',
    isRead: false,
    createdAt: '2026-06-07T09:00:00'
  }
]

export function getTimelineByInspection(inspectionId: string): TimelineEvent[] {
  if (inspectionId === 'INSP-2026-0015') {
    return [
      { id: 'tl001', timestamp: '2026-06-08T14:30:00', actor: '张师傅', actorRole: 'technician', action: '开始现场年检', detail: '1号楼A座-1号梯' },
      { id: 'tl002', timestamp: '2026-06-08T15:45:00', actor: '张师傅', actorRole: 'technician', action: '标记3项不合格', detail: '紧急救援装置、对讲、平层精度' },
      { id: 'tl003', timestamp: '2026-06-08T16:30:00', actor: '张师傅', actorRole: 'technician', action: '生成年检报告', detail: '结论：不合格，需整改' },
      { id: 'tl004', timestamp: '2026-06-08T16:45:00', actor: '系统', actorRole: 'customer_service', action: '自动派发整改通知', detail: '通知张师傅、抄送王主管' },
      { id: 'tl005', timestamp: '2026-06-08T17:00:00', actor: '王主管', actorRole: 'project_manager', action: '创建整改单并派单', detail: 'RECT-2026-0015，截止6月18日' },
      { id: 'tl006', timestamp: '2026-06-09T09:15:00', actor: '李客服', actorRole: 'customer_service', action: '通知甲方物业', detail: '已电话和微信同步物业张经理' },
      { id: 'tl007', timestamp: '2026-06-09T10:30:00', actor: '张师傅', actorRole: 'technician', action: '完成项1整改：松闸扳手', detail: '已更换匹配型号并安装' },
      { id: 'tl008', timestamp: '2026-06-09T14:20:00', actor: '张师傅', actorRole: 'technician', action: '完成项3整改：平层精度', detail: '连续5次测试误差≤3mm' }
    ]
  }
  if (inspectionId === 'INSP-2026-0012') {
    return [
      { id: 'tl101', timestamp: '2026-06-05T10:15:00', actor: '张师傅', actorRole: 'technician', action: '完成现场检测', detail: '机房温度实测43.2℃' },
      { id: 'tl102', timestamp: '2026-06-05T17:30:00', actor: '王主管', actorRole: 'project_manager', action: '创建整改单', detail: 'RECT-2026-0012，截止6月12日' },
      { id: 'tl103', timestamp: '2026-06-09T16:00:00', actor: '张师傅', actorRole: 'technician', action: '完成整改措施', detail: '空调维修完成，更换电容+充氟' },
      { id: 'tl104', timestamp: '2026-06-10T14:30:00', actor: '王主管', actorRole: 'project_manager', action: '现场复查', detail: '温度实测25.6℃，合格' },
      { id: 'tl105', timestamp: '2026-06-11T17:00:00', actor: '王主管', actorRole: 'project_manager', action: '闭环归档', detail: '整改进度：100%' }
    ]
  }
  return []
}
