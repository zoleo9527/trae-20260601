export const STATUS_FLOW = {
  PENDING_OUTBOUND: 'pending_outbound',
  OUTBOUND_INSPECTING: 'outbound_inspecting',
  OUTBOUND_COMPLETED: 'outbound_completed',
  RENTING: 'renting',
  PENDING_RETURN: 'pending_return',
  RETURN_INSPECTING: 'return_inspecting',
  RETURN_COMPLETED: 'return_completed',
  ABNORMAL: 'abnormal',
  IN_REPAIR: 'in_repair',
  CLOSED: 'closed'
}

export const STATUS_LABELS = {
  [STATUS_FLOW.PENDING_OUTBOUND]: { label: '待出库验机', type: 'info' },
  [STATUS_FLOW.OUTBOUND_INSPECTING]: { label: '验机中', type: 'warning' },
  [STATUS_FLOW.OUTBOUND_COMPLETED]: { label: '已出库', type: 'success' },
  [STATUS_FLOW.RENTING]: { label: '租赁中', type: 'primary' },
  [STATUS_FLOW.PENDING_RETURN]: { label: '待归还复核', type: 'info' },
  [STATUS_FLOW.RETURN_INSPECTING]: { label: '复核中', type: 'warning' },
  [STATUS_FLOW.RETURN_COMPLETED]: { label: '已完成', type: 'success' },
  [STATUS_FLOW.ABNORMAL]: { label: '异常待处理', type: 'danger' },
  [STATUS_FLOW.IN_REPAIR]: { label: '维修中', type: 'warning' },
  [STATUS_FLOW.CLOSED]: { label: '已结案', type: 'success' }
}

export const INSPECTION_ITEMS = [
  { key: 'appearance', label: '外观检查', description: '机身划痕、掉漆、磕碰情况' },
  { key: 'lens', label: '镜头检查', description: '镜片划痕、霉斑、光圈叶片' },
  { key: 'sensor', label: '传感器检查', description: 'CMOS污点、坏点' },
  { key: 'shutter', label: '快门检查', description: '快门次数、快门声音' },
  { key: 'battery', label: '电池检查', description: '电池续航、充电状态' },
  { key: 'accessories', label: '配件检查', description: '充电器、数据线、镜头盖、背带' },
  { key: 'function', label: '功能测试', description: '对焦、连拍、视频录制、WiFi' }
]

export const ABNORMAL_TYPES = [
  { key: 'scratch', label: '外观划痕', severity: 'low' },
  { key: 'dent', label: '磕碰凹陷', severity: 'medium' },
  { key: 'lens_damage', label: '镜头损伤', severity: 'high' },
  { key: 'sensor_dirty', label: '传感器污点', severity: 'medium' },
  { key: 'function_fault', label: '功能故障', severity: 'high' },
  { key: 'accessory_missing', label: '配件缺失', severity: 'low' },
  { key: 'battery_dead', label: '电池损坏', severity: 'medium' }
]

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const mockRentals = [
  {
    id: 'RT20260603001',
    orderNo: 'ORD20260603001',
    equipment: {
      id: 'EQ001',
      name: 'Sony A7M4 全画幅微单',
      category: '机身',
      serialNo: 'SN-7M4-2025-88321',
      purchaseDate: '2025-03-15',
      originalValue: 16800
    },
    customer: {
      name: '张三',
      phone: '138****8888',
      idCard: '310***********1234'
    },
    rentalPeriod: {
      start: '2026-06-03 14:00',
      end: '2026-06-05 14:00',
      days: 2
    },
    deposit: 5000,
    dailyRate: 180,
    totalAmount: 360,
    status: STATUS_FLOW.PENDING_OUTBOUND,
    statusHistory: [
      {
        status: STATUS_FLOW.PENDING_OUTBOUND,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 30 * 60 * 1000,
        remark: '订单支付成功，待出库验机',
        attachments: []
      }
    ],
    outboundInspection: null,
    returnInspection: null,
    createdAt: now - 2 * 60 * 60 * 1000,
    createdBy: '李前台'
  },
  {
    id: 'RT20260603002',
    orderNo: 'ORD20260603002',
    equipment: {
      id: 'EQ002',
      name: 'Canon EF 24-70mm f/2.8L II',
      category: '镜头',
      serialNo: 'SN-CAN-2024-55678',
      purchaseDate: '2024-08-20',
      originalValue: 12500
    },
    customer: {
      name: '李四',
      phone: '139****6666',
      idCard: '320***********5678'
    },
    rentalPeriod: {
      start: '2026-06-02 10:00',
      end: '2026-06-04 10:00',
      days: 2
    },
    deposit: 4000,
    dailyRate: 150,
    totalAmount: 300,
    status: STATUS_FLOW.RENTING,
    statusHistory: [
      {
        status: STATUS_FLOW.PENDING_OUTBOUND,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 2 * day,
        remark: '订单支付成功，待出库验机',
        attachments: []
      },
      {
        status: STATUS_FLOW.OUTBOUND_INSPECTING,
        operator: '王出库',
        operatorRole: 'frontline',
        timestamp: now - 2 * day + 30 * 60 * 1000,
        remark: '开始出库验机',
        attachments: []
      },
      {
        status: STATUS_FLOW.OUTBOUND_COMPLETED,
        operator: '王出库',
        operatorRole: 'frontline',
        timestamp: now - 2 * day + 50 * 60 * 1000,
        remark: '出库验机完成，客户确认签字',
        attachments: [{ type: 'signature', name: '客户签字确认', url: '#', uploadedAt: now - 2 * day + 50 * 60 * 1000 }]
      },
      {
        status: STATUS_FLOW.RENTING,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 2 * day + 50 * 60 * 1000,
        remark: '设备已出库，租赁开始',
        attachments: []
      }
    ],
    outboundInspection: {
      inspector: '王出库',
      inspectedAt: now - 2 * day + 50 * 60 * 1000,
      items: {
        appearance: {
          result: 'abnormal',
          description: '镜身有轻微使用痕迹，卡口处有一处约2mm划痕（已拍照留存）',
          photos: ['#mock1', '#mock2'],
          keyPoint: true
        },
        lens: {
          result: 'normal',
          description: '镜片通透无划痕，光圈叶片开合正常，无霉斑',
          photos: ['#mock3'],
          keyPoint: true
        },
        sensor: { result: 'not_applicable', description: '镜头无需检查传感器', photos: [], keyPoint: false },
        shutter: { result: 'not_applicable', description: '镜头无需检查快门', photos: [], keyPoint: false },
        battery: { result: 'not_applicable', description: '镜头不含电池', photos: [], keyPoint: false },
        accessories: {
          result: 'normal',
          description: '原装镜头盖、遮光罩、镜头袋齐全',
          photos: ['#mock4'],
          keyPoint: false
        },
        function: {
          result: 'normal',
          description: '自动对焦正常，变焦环阻尼均匀',
          photos: [],
          keyPoint: true
        }
      },
      overallResult: 'normal',
      summary: '整体成色良好，卡口处轻微划痕为使用痕迹，已向客户说明并确认。',
      customerConfirmed: true,
      signature: '#signature1'
    },
    returnInspection: null,
    createdAt: now - 3 * day,
    createdBy: '李前台'
  },
  {
    id: 'RT20260603003',
    orderNo: 'ORD20260603003',
    equipment: {
      id: 'EQ003',
      name: 'DJI Ronin-S 稳定器',
      category: '配件',
      serialNo: 'SN-DJI-2025-33445',
      purchaseDate: '2025-01-10',
      originalValue: 4800
    },
    customer: {
      name: '王五',
      phone: '137****9999',
      idCard: '330***********9012'
    },
    rentalPeriod: {
      start: '2026-06-01 09:00',
      end: '2026-06-03 09:00',
      days: 2
    },
    deposit: 2000,
    dailyRate: 80,
    totalAmount: 160,
    status: STATUS_FLOW.PENDING_RETURN,
    statusHistory: [
      {
        status: STATUS_FLOW.PENDING_OUTBOUND,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 3 * day,
        remark: '订单支付成功，待出库验机',
        attachments: []
      },
      {
        status: STATUS_FLOW.OUTBOUND_INSPECTING,
        operator: '王出库',
        operatorRole: 'frontline',
        timestamp: now - 3 * day + 20 * 60 * 1000,
        remark: '开始出库验机',
        attachments: []
      },
      {
        status: STATUS_FLOW.OUTBOUND_COMPLETED,
        operator: '王出库',
        operatorRole: 'frontline',
        timestamp: now - 3 * day + 45 * 60 * 1000,
        remark: '出库验机完成',
        attachments: []
      },
      {
        status: STATUS_FLOW.RENTING,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 3 * day + 45 * 60 * 1000,
        remark: '设备已出库，租赁开始',
        attachments: []
      },
      {
        status: STATUS_FLOW.PENDING_RETURN,
        operator: '客户',
        operatorRole: 'customer',
        timestamp: now - 2 * 60 * 60 * 1000,
        remark: '客户预约归还，待复核',
        attachments: []
      }
    ],
    outboundInspection: {
      inspector: '王出库',
      inspectedAt: now - 3 * day + 45 * 60 * 1000,
      items: {
        appearance: {
          result: 'normal',
          description: '外观完好，无明显磕碰',
          photos: ['#mock5'],
          keyPoint: false
        },
        lens: { result: 'not_applicable', description: '稳定器无需检查镜头', photos: [], keyPoint: false },
        sensor: { result: 'not_applicable', description: '稳定器无需检查传感器', photos: [], keyPoint: false },
        shutter: { result: 'not_applicable', description: '稳定器无需检查快门', photos: [], keyPoint: false },
        battery: {
          result: 'normal',
          description: '电池充电正常，续航约12小时',
          photos: [],
          keyPoint: true
        },
        accessories: {
          result: 'normal',
          description: '充电器、USB-C线、快装板、收纳箱齐全',
          photos: ['#mock6'],
          keyPoint: false
        },
        function: {
          result: 'normal',
          description: '三轴稳定正常，各模式切换流畅，APP连接正常',
          photos: [],
          keyPoint: true
        }
      },
      overallResult: 'normal',
      summary: '全新成色，所有功能正常。',
      customerConfirmed: true,
      signature: '#signature2'
    },
    returnInspection: null,
    createdAt: now - 4 * day,
    createdBy: '李前台'
  },
  {
    id: 'RT20260603004',
    orderNo: 'ORD20260602001',
    equipment: {
      id: 'EQ004',
      name: 'Nikon Z6 II 机身',
      category: '机身',
      serialNo: 'SN-NIK-2024-11223',
      purchaseDate: '2024-11-05',
      originalValue: 14500
    },
    customer: {
      name: '赵六',
      phone: '136****3333',
      idCard: '340***********3456'
    },
    rentalPeriod: {
      start: '2026-05-30 09:00',
      end: '2026-06-02 09:00',
      days: 3
    },
    deposit: 4500,
    dailyRate: 160,
    totalAmount: 480,
    status: STATUS_FLOW.ABNORMAL,
    statusHistory: [
      {
        status: STATUS_FLOW.PENDING_OUTBOUND,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 5 * day,
        remark: '订单支付成功，待出库验机',
        attachments: []
      },
      {
        status: STATUS_FLOW.OUTBOUND_COMPLETED,
        operator: '王出库',
        operatorRole: 'frontline',
        timestamp: now - 5 * day + 40 * 60 * 1000,
        remark: '出库验机完成',
        attachments: []
      },
      {
        status: STATUS_FLOW.RENTING,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 5 * day + 40 * 60 * 1000,
        remark: '设备已出库',
        attachments: []
      },
      {
        status: STATUS_FLOW.PENDING_RETURN,
        operator: '客户',
        operatorRole: 'customer',
        timestamp: now - 8 * 60 * 60 * 1000,
        remark: '客户归还',
        attachments: []
      },
      {
        status: STATUS_FLOW.RETURN_INSPECTING,
        operator: '刘复核',
        operatorRole: 'frontline',
        timestamp: now - 7 * 60 * 60 * 1000,
        remark: '开始归还复核',
        attachments: []
      },
      {
        status: STATUS_FLOW.ABNORMAL,
        operator: '刘复核',
        operatorRole: 'frontline',
        timestamp: now - 6 * 60 * 60 * 1000,
        remark: '发现异常：LCD屏幕有划痕，传感器有污点',
        attachments: [
          { type: 'image', name: '屏幕划痕照', url: '#', uploadedAt: now - 6 * 60 * 60 * 1000 },
          { type: 'image', name: '传感器污点照', url: '#', uploadedAt: now - 6 * 60 * 60 * 1000 }
        ]
      }
    ],
    outboundInspection: {
      inspector: '王出库',
      inspectedAt: now - 5 * day + 40 * 60 * 1000,
      items: {
        appearance: {
          result: 'normal',
          description: '外观完好，LCD屏幕无划痕',
          photos: ['#mock7'],
          keyPoint: true
        },
        lens: { result: 'not_applicable', description: '仅机身', photos: [], keyPoint: false },
        sensor: {
          result: 'normal',
          description: '传感器洁净，无污点坏点',
          photos: ['#mock8'],
          keyPoint: true
        },
        shutter: {
          result: 'normal',
          description: '快门次数：12500次',
          photos: [],
          keyPoint: true
        },
        battery: {
          result: 'normal',
          description: '原装电池1块，续航正常',
          photos: [],
          keyPoint: false
        },
        accessories: {
          result: 'normal',
          description: '充电器、肩带、机身盖齐全',
          photos: [],
          keyPoint: false
        },
        function: {
          result: 'normal',
          description: '所有功能测试正常',
          photos: [],
          keyPoint: true
        }
      },
      overallResult: 'normal',
      summary: '成色99新，功能完好。LCD屏幕、传感器均已拍照留底。',
      customerConfirmed: true,
      signature: '#signature3'
    },
    returnInspection: {
      inspector: '刘复核',
      inspectedAt: now - 6 * 60 * 60 * 1000,
      items: {
        appearance: {
          result: 'abnormal',
          description: 'LCD屏幕左下角新增一处约3cm划痕（出库时无）',
          photos: ['#mock9', '#mock10'],
          keyPoint: true,
          abnormalType: 'scratch'
        },
        lens: { result: 'not_applicable', description: '仅机身', photos: [], keyPoint: false },
        sensor: {
          result: 'abnormal',
          description: '传感器中央区域新增3处污点（出库时洁净）',
          photos: ['#mock11', '#mock12'],
          keyPoint: true,
          abnormalType: 'sensor_dirty'
        },
        shutter: {
          result: 'normal',
          description: '快门次数：12850次，增加350次',
          photos: [],
          keyPoint: true
        },
        battery: {
          result: 'normal',
          description: '电池归还正常',
          photos: [],
          keyPoint: false
        },
        accessories: {
          result: 'normal',
          description: '配件齐全',
          photos: [],
          keyPoint: false
        },
        function: {
          result: 'normal',
          description: '功能测试正常',
          photos: [],
          keyPoint: true
        }
      },
      overallResult: 'abnormal',
      summary: '归还时发现LCD屏幕新增3cm划痕、传感器新增3处污点。已与出库照片对比确认。',
      anomalyReport: {
        type: 'damage',
        estimatedCost: 800,
        description: 'LCD屏幕更换约600元，传感器清洁约200元',
        customerAcknowledged: false,
        pendingAction: '待与客户协商赔偿事宜'
      },
      customerConfirmed: false
    },
    repairRecord: null,
    createdAt: now - 6 * day,
    createdBy: '李前台'
  },
  {
    id: 'RT20260603005',
    orderNo: 'ORD20260528002',
    equipment: {
      id: 'EQ005',
      name: 'Sony FE 70-200mm f/2.8 GM II',
      category: '镜头',
      serialNo: 'SN-SON-2025-99887',
      purchaseDate: '2025-06-18',
      originalValue: 18800
    },
    customer: {
      name: '孙七',
      phone: '135****7777',
      idCard: '350***********7890'
    },
    rentalPeriod: {
      start: '2026-05-26 09:00',
      end: '2026-05-28 09:00',
      days: 2
    },
    deposit: 6000,
    dailyRate: 220,
    totalAmount: 440,
    status: STATUS_FLOW.CLOSED,
    statusHistory: [
      {
        status: STATUS_FLOW.PENDING_OUTBOUND,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 8 * day,
        remark: '订单支付成功',
        attachments: []
      },
      {
        status: STATUS_FLOW.OUTBOUND_COMPLETED,
        operator: '王出库',
        operatorRole: 'frontline',
        timestamp: now - 8 * day + 35 * 60 * 1000,
        remark: '出库验机完成',
        attachments: []
      },
      {
        status: STATUS_FLOW.RENTING,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 8 * day + 35 * 60 * 1000,
        remark: '租赁开始',
        attachments: []
      },
      {
        status: STATUS_FLOW.PENDING_RETURN,
        operator: '客户',
        operatorRole: 'customer',
        timestamp: now - 6 * day + 1 * 60 * 60 * 1000,
        remark: '客户归还',
        attachments: []
      },
      {
        status: STATUS_FLOW.RETURN_COMPLETED,
        operator: '刘复核',
        operatorRole: 'frontline',
        timestamp: now - 6 * day,
        remark: '归还复核完成，无异常',
        attachments: []
      },
      {
        status: STATUS_FLOW.CLOSED,
        operator: '张经理',
        operatorRole: 'manager',
        timestamp: now - 6 * day + 30 * 60 * 1000,
        remark: '押金已退还，订单结案',
        attachments: [{ type: 'receipt', name: '押金退还凭证', url: '#', uploadedAt: now - 6 * day + 30 * 60 * 1000 }]
      }
    ],
    outboundInspection: {
      inspector: '王出库',
      inspectedAt: now - 8 * day + 35 * 60 * 1000,
      items: {
        appearance: { result: 'normal', description: '外观完好', photos: [], keyPoint: false },
        lens: { result: 'normal', description: '镜片完美', photos: [], keyPoint: true },
        sensor: { result: 'not_applicable', description: '镜头', photos: [], keyPoint: false },
        shutter: { result: 'not_applicable', description: '镜头', photos: [], keyPoint: false },
        battery: { result: 'not_applicable', description: '镜头', photos: [], keyPoint: false },
        accessories: { result: 'normal', description: '配件齐全', photos: [], keyPoint: false },
        function: { result: 'normal', description: '功能正常', photos: [], keyPoint: true }
      },
      overallResult: 'normal',
      summary: '全新镜头，功能完好。',
      customerConfirmed: true
    },
    returnInspection: {
      inspector: '刘复核',
      inspectedAt: now - 6 * day,
      items: {
        appearance: { result: 'normal', description: '与出库时一致', photos: [], keyPoint: false },
        lens: { result: 'normal', description: '镜片完好，与出库一致', photos: [], keyPoint: true },
        sensor: { result: 'not_applicable', description: '镜头', photos: [], keyPoint: false },
        shutter: { result: 'not_applicable', description: '镜头', photos: [], keyPoint: false },
        battery: { result: 'not_applicable', description: '镜头', photos: [], keyPoint: false },
        accessories: { result: 'normal', description: '齐全', photos: [], keyPoint: false },
        function: { result: 'normal', description: '正常', photos: [], keyPoint: true }
      },
      overallResult: 'normal',
      summary: '与出库状态一致，无异常。',
      customerConfirmed: true
    },
    createdAt: now - 9 * day,
    createdBy: '李前台'
  },
  {
    id: 'RT20260603006',
    orderNo: 'ORD20260601003',
    equipment: {
      id: 'EQ006',
      name: 'Canon EOS R5 机身',
      category: '机身',
      serialNo: 'SN-CAN-2025-77665',
      purchaseDate: '2025-09-12',
      originalValue: 25800
    },
    customer: {
      name: '周八',
      phone: '134****5555',
      idCard: '360***********2345'
    },
    rentalPeriod: {
      start: '2026-05-31 09:00',
      end: '2026-06-02 09:00',
      days: 2
    },
    deposit: 8000,
    dailyRate: 280,
    totalAmount: 560,
    status: STATUS_FLOW.IN_REPAIR,
    statusHistory: [
      {
        status: STATUS_FLOW.PENDING_OUTBOUND,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 4 * day,
        remark: '订单支付成功',
        attachments: []
      },
      {
        status: STATUS_FLOW.OUTBOUND_COMPLETED,
        operator: '王出库',
        operatorRole: 'frontline',
        timestamp: now - 4 * day + 30 * 60 * 1000,
        remark: '出库验机完成',
        attachments: []
      },
      {
        status: STATUS_FLOW.RENTING,
        operator: '系统',
        operatorRole: 'system',
        timestamp: now - 4 * day + 30 * 60 * 1000,
        remark: '租赁开始',
        attachments: []
      },
      {
        status: STATUS_FLOW.PENDING_RETURN,
        operator: '客户',
        operatorRole: 'customer',
        timestamp: now - 2 * day + 30 * 60 * 1000,
        remark: '客户归还',
        attachments: []
      },
      {
        status: STATUS_FLOW.ABNORMAL,
        operator: '刘复核',
        operatorRole: 'frontline',
        timestamp: now - 2 * day,
        remark: '发现卡口断裂',
        attachments: []
      },
      {
        status: STATUS_FLOW.IN_REPAIR,
        operator: '张经理',
        operatorRole: 'manager',
        timestamp: now - 1 * day,
        remark: '已送修，客户同意承担维修费用',
        attachments: [{ type: 'repair', name: '维修工单', url: '#', uploadedAt: now - 1 * day }]
      }
    ],
    outboundInspection: {
      inspector: '王出库',
      inspectedAt: now - 4 * day + 30 * 60 * 1000,
      items: {
        appearance: { result: 'normal', description: '卡口完好', photos: ['#mock13'], keyPoint: true },
        lens: { result: 'not_applicable', description: '仅机身', photos: [], keyPoint: false },
        sensor: { result: 'normal', description: '洁净', photos: [], keyPoint: true },
        shutter: { result: 'normal', description: '8500次', photos: [], keyPoint: true },
        battery: { result: 'normal', description: '正常', photos: [], keyPoint: false },
        accessories: { result: 'normal', description: '齐全', photos: [], keyPoint: false },
        function: { result: 'normal', description: '正常', photos: [], keyPoint: true }
      },
      overallResult: 'normal',
      summary: '成色完好，卡口已拍照留底。',
      customerConfirmed: true
    },
    returnInspection: {
      inspector: '刘复核',
      inspectedAt: now - 2 * day,
      items: {
        appearance: {
          result: 'abnormal',
          description: '机身卡口断裂（出库时完好）',
          photos: ['#mock14', '#mock15'],
          keyPoint: true,
          abnormalType: 'dent'
        },
        lens: { result: 'not_applicable', description: '仅机身', photos: [], keyPoint: false },
        sensor: { result: 'normal', description: '正常', photos: [], keyPoint: true },
        shutter: { result: 'normal', description: '8900次', photos: [], keyPoint: true },
        battery: { result: 'normal', description: '正常', photos: [], keyPoint: false },
        accessories: { result: 'normal', description: '齐全', photos: [], keyPoint: false },
        function: {
          result: 'abnormal',
          description: '由于卡口断裂，无法安装镜头测试',
          photos: [],
          keyPoint: true,
          abnormalType: 'function_fault'
        }
      },
      overallResult: 'abnormal',
      summary: '卡口断裂，无法正常使用。客户承认是意外掉落导致。',
      anomalyReport: {
        type: 'damage',
        estimatedCost: 3500,
        description: '更换机身卡口总成约3500元',
        customerAcknowledged: true,
        pendingAction: '维修中，从押金扣除维修费用'
      },
      customerConfirmed: true
    },
    repairRecord: {
      repairOrderNo: 'RP20260602001',
      repairShop: '佳能官方售后中心',
      sendDate: '2026-06-02',
      estimatedCompletion: '2026-06-10',
      estimatedCost: 3500,
      status: 'repairing',
      notes: '客户已确认承担费用'
    },
    createdAt: now - 5 * day,
    createdBy: '李前台'
  }
]

export const mockDeposits = [
  {
    id: 'DP001',
    rentalId: 'RT20260603002',
    amount: 4000,
    paymentMethod: 'wechat',
    screenshotUrl: '#deposit1',
    paidAt: now - 2 * day,
    refunded: false
  },
  {
    id: 'DP002',
    rentalId: 'RT20260603004',
    amount: 4500,
    paymentMethod: 'alipay',
    screenshotUrl: '#deposit2',
    paidAt: now - 5 * day,
    refunded: false,
    holdReason: '待处理异常赔偿'
  },
  {
    id: 'DP003',
    rentalId: 'RT20260603005',
    amount: 6000,
    paymentMethod: 'wechat',
    screenshotUrl: '#deposit3',
    paidAt: now - 8 * day,
    refunded: true,
    refundedAt: now - 6 * day + 30 * 60 * 1000,
    refundMethod: 'original',
    refundReceiptUrl: '#receipt1'
  }
]

export const mockRepairRecords = [
  {
    id: 'RR001',
    rentalId: 'RT20260603006',
    equipmentId: 'EQ006',
    repairOrderNo: 'RP20260602001',
    repairShop: '佳能官方售后中心',
    contact: '王师傅 138****1234',
    sendDate: '2026-06-02',
    estimatedCompletion: '2026-06-10',
    estimatedCost: 3500,
    actualCost: null,
    status: 'repairing',
    damageDescription: '机身卡口断裂',
    repairDescription: '更换机身卡口总成',
    photos: ['#repair1', '#repair2'],
    createdBy: '张经理',
    createdAt: now - 1 * day
  }
]

export const ROLES = {
  frontline: {
    key: 'frontline',
    name: '一线操作员',
    permissions: [
      'outbound:inspect',
      'outbound:view',
      'return:review',
      'return:view',
      'history:view',
      'batch:process'
    ],
    description: '负责出库验机和归还复核的一线操作人员'
  },
  manager: {
    key: 'manager',
    name: '门店经理',
    permissions: [
      'outbound:view',
      'return:view',
      'history:view',
      'history:export',
      'batch:process',
      'batch:approve',
      'anomaly:handle',
      'repair:manage',
      'deposit:refund'
    ],
    description: '负责查看所有记录、处理异常、审批批量操作'
  },
  admin: {
    key: 'admin',
    name: '系统管理员',
    permissions: ['*'],
    description: '拥有所有操作权限'
  }
}

export const INTEGRATION_POINTS = [
  {
    id: 'INT001',
    name: '押金系统集成',
    description: '对接微信/支付宝支付系统，自动获取押金支付凭证',
    status: 'pending',
    mockDataLocation: 'src/data/mockData.js - mockDeposits',
    currentImplementation: '使用模拟数据，押金截图为占位URL'
  },
  {
    id: 'INT002',
    name: '维修系统集成',
    description: '对接维修管理系统，同步维修进度和费用',
    status: 'pending',
    mockDataLocation: 'src/data/mockData.js - mockRepairRecords',
    currentImplementation: '维修记录为模拟数据'
  },
  {
    id: 'INT003',
    name: '订单系统集成',
    description: '对接租赁订单系统，自动同步订单信息',
    status: 'pending',
    mockDataLocation: 'src/data/mockData.js - mockRentals',
    currentImplementation: '租赁订单为模拟数据'
  },
  {
    id: 'INT004',
    name: '电子签名集成',
    description: '对接电子签名系统，客户确认时生成法律效力签名',
    status: 'pending',
    mockDataLocation: 'src/data/mockData.js - signature字段',
    currentImplementation: '签名为占位符'
  },
  {
    id: 'INT005',
    name: '短信通知集成',
    description: '状态变化时自动通知客户和经办人',
    status: 'pending',
    mockDataLocation: 'stores/equipment.js - statusChange动作',
    currentImplementation: '仅本地状态更新，无实际通知发送'
  },
  {
    id: 'INT006',
    name: '图片存储集成',
    description: '验机照片上传至对象存储服务（OSS/COS）',
    status: 'pending',
    mockDataLocation: 'src/views/outbound/InspectForm.vue - 照片上传区域',
    currentImplementation: '照片上传为前端模拟，未实际存储'
  }
]
