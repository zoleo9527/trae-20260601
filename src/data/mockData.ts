import type { InstallationOrder, Master, PartRequest, StatusChange, DashboardStats } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createStatusChange = (
  fromStatus: string,
  toStatus: string,
  operator: string,
  operatorRole: string,
  remark: string = '',
  timestamp?: string
): StatusChange => ({
  id: generateId(),
  fromStatus,
  toStatus,
  operator,
  operatorRole,
  timestamp: timestamp || new Date().toISOString(),
  remark
});

export const masters: Master[] = [
  {
    id: 'M001',
    name: '张师傅',
    phone: '13800138001',
    skills: ['马桶安装', '淋浴房', '浴缸'],
    status: 'available',
    currentOrders: [],
    rating: 4.8
  },
  {
    id: 'M002',
    name: '李师傅',
    phone: '13800138002',
    skills: ['马桶安装', '洗手盆', '水龙头'],
    status: 'busy',
    currentOrders: ['ORD001'],
    rating: 4.6
  },
  {
    id: 'M003',
    name: '王师傅',
    phone: '13800138003',
    skills: ['淋浴房', '浴缸', '整体卫浴'],
    status: 'available',
    currentOrders: [],
    rating: 4.9
  },
  {
    id: 'M004',
    name: '赵师傅',
    phone: '13800138004',
    skills: ['马桶安装', '洗手盆'],
    status: 'off',
    currentOrders: [],
    rating: 4.5
  },
  {
    id: 'M005',
    name: '刘师傅',
    phone: '13800138005',
    skills: ['整体卫浴', '淋浴房'],
    status: 'busy',
    currentOrders: ['ORD002'],
    rating: 4.7
  },
  {
    id: 'M006',
    name: '孙师傅',
    phone: '13800138006',
    skills: ['浴缸', '马桶安装'],
    status: 'available',
    currentOrders: [],
    rating: 4.4
  }
];

export const orders: InstallationOrder[] = [
  {
    id: 'ORD001',
    customerName: '陈先生',
    customerPhone: '13900139001',
    address: '上海市浦东新区张江高科技园区碧波路500号',
    productType: '智能马桶',
    productModel: 'TOTO-NEOREST-AS',
    status: 'in_progress',
    createTime: '2024-01-15T09:00:00Z',
    scheduledTime: '2024-01-17T14:00:00Z',
    dispatcher: '调度员小王',
    assignedMaster: '李师傅',
    assignedMasterId: 'M002',
    partRequests: [
      {
        id: 'PR001',
        orderId: 'ORD001',
        partName: '进水阀',
        partCode: 'TOTO-IV-001',
        quantity: 1,
        status: 'approved',
        requester: '李师傅',
        requestTime: '2024-01-15T10:30:00Z',
        statusHistory: [
          createStatusChange('', 'requested', '李师傅', '安装师傅', '原装进水阀损坏，需要更换', '2024-01-15T10:30:00Z'),
          createStatusChange('requested', 'approved', '仓库管理员小张', '仓库管理', '已核实库存，配件已批准', '2024-01-15T11:00:00Z')
        ],
        currentHandler: '仓库管理员小张',
        currentHandlerRole: '仓库管理',
        remark: '等待师傅领取，库存编号: STK-00123'
      },
      {
        id: 'PR006',
        orderId: 'ORD001',
        partName: '密封圈',
        partCode: 'SEAL-001',
        quantity: 2,
        status: 'approved',
        requester: '李师傅',
        requestTime: '2024-01-15T10:35:00Z',
        statusHistory: [
          createStatusChange('', 'requested', '李师傅', '安装师傅', '原装密封圈老化', '2024-01-15T10:35:00Z'),
          createStatusChange('requested', 'approved', '仓库管理员小张', '仓库管理', '已批准', '2024-01-15T11:05:00Z')
        ],
        currentHandler: '李师傅',
        currentHandlerRole: '安装师傅',
        remark: '已领取，用于更换老化密封圈'
      }
    ],
    dispatchRecords: [
      {
        id: 'DR001',
        orderId: 'ORD001',
        masterId: 'M002',
        masterName: '李师傅',
        status: 'accepted',
        dispatchTime: '2024-01-15T09:30:00Z',
        acceptTime: '2024-01-15T09:45:00Z',
        statusHistory: [
          createStatusChange('', 'assigned', '调度员小王', '调度员', '根据师傅技能和位置分配，优先安排经验丰富的师傅', '2024-01-15T09:30:00Z'),
          createStatusChange('assigned', 'accepted', '李师傅', '安装师傅', '确认接单，预计后天下午施工', '2024-01-15T09:45:00Z')
        ],
        remark: '客户要求下午2点后上门'
      }
    ],
    statusHistory: [
      createStatusChange('', 'pending', '系统', '系统', '订单创建，自动分配到调度队列', '2024-01-15T09:00:00Z'),
      createStatusChange('pending', 'assigned', '调度员小王', '调度员', '已分配给李师傅，电话已通知', '2024-01-15T09:30:00Z'),
      createStatusChange('assigned', 'in_progress', '李师傅', '安装师傅', '师傅已到场开始安装，客户已确认', '2024-01-17T14:00:00Z')
    ],
    afterSaleHandler: '客服小美',
    afterSaleStatus: 'processing',
    remark: '客户要求下午2点后上门，地址位于张江园区内'
  },
  {
    id: 'ORD002',
    customerName: '林女士',
    customerPhone: '13900139002',
    address: '上海市徐汇区漕河泾开发区虹漕路421号',
    productType: '淋浴房',
    productModel: '科勒-K-7000',
    status: 'assigned',
    createTime: '2024-01-16T10:00:00Z',
    scheduledTime: '2024-01-18T10:00:00Z',
    dispatcher: '调度员小王',
    assignedMaster: '刘师傅',
    assignedMasterId: 'M005',
    partRequests: [
      {
        id: 'PR002',
        orderId: 'ORD002',
        partName: '玻璃胶',
        partCode: 'GLUE-001',
        quantity: 2,
        status: 'approved',
        requester: '刘师傅',
        requestTime: '2024-01-16T14:00:00Z',
        statusHistory: [
          createStatusChange('', 'requested', '刘师傅', '安装师傅', '淋浴房安装需要玻璃胶密封', '2024-01-16T14:00:00Z'),
          createStatusChange('requested', 'approved', '仓库管理员小张', '仓库管理', '库存充足，已批准', '2024-01-16T14:30:00Z')
        ],
        currentHandler: '刘师傅',
        currentHandlerRole: '安装师傅',
        remark: '已领取'
      },
      {
        id: 'PR003',
        orderId: 'ORD002',
        partName: '滑轮组件',
        partCode: 'ROLLER-K-002',
        quantity: 1,
        status: 'requested',
        requester: '刘师傅',
        requestTime: '2024-01-16T14:05:00Z',
        statusHistory: [
          createStatusChange('', 'requested', '刘师傅', '安装师傅', '原装滑轮有异响，需要更换', '2024-01-16T14:05:00Z')
        ],
        currentHandler: '仓库管理员小张',
        currentHandlerRole: '仓库管理',
        remark: '等待审批，库存紧张，需从总部调配'
      }
    ],
    dispatchRecords: [
      {
        id: 'DR002',
        orderId: 'ORD002',
        masterId: 'M005',
        masterName: '刘师傅',
        status: 'assigned',
        dispatchTime: '2024-01-16T10:30:00Z',
        statusHistory: [
          createStatusChange('', 'assigned', '调度员小王', '调度员', '根据师傅技能匹配分配，刘师傅擅长淋浴房安装', '2024-01-16T10:30:00Z')
        ],
        remark: '等待师傅确认接单'
      }
    ],
    statusHistory: [
      createStatusChange('', 'pending', '系统', '系统', '订单创建', '2024-01-16T10:00:00Z'),
      createStatusChange('pending', 'assigned', '调度员小王', '调度员', '已分配给刘师傅，等待师傅确认', '2024-01-16T10:30:00Z')
    ],
    remark: '客户周末不在家，工作日可上门，地址在漕河泾开发区'
  },
  {
    id: 'ORD003',
    customerName: '黄先生',
    customerPhone: '13900139003',
    address: '上海市闵行区莘庄镇莘建路100号',
    productType: '浴缸',
    productModel: '箭牌-AC-888',
    status: 'pending',
    createTime: '2024-01-17T08:00:00Z',
    partRequests: [],
    dispatchRecords: [],
    statusHistory: [
      createStatusChange('', 'pending', '系统', '系统', '订单创建，等待调度分配', '2024-01-17T08:00:00Z')
    ],
    remark: '客户要求尽快安装，已加急处理'
  },
  {
    id: 'ORD004',
    customerName: '周女士',
    customerPhone: '13900139004',
    address: '上海市静安区南京西路1266号',
    productType: '洗手盆',
    productModel: '九牧-JM-200',
    status: 'completed',
    createTime: '2024-01-10T11:00:00Z',
    scheduledTime: '2024-01-12T09:00:00Z',
    completeTime: '2024-01-12T11:30:00Z',
    dispatcher: '调度员小李',
    assignedMaster: '张师傅',
    assignedMasterId: 'M001',
    partRequests: [
      {
        id: 'PR004',
        orderId: 'ORD004',
        partName: '下水管',
        partCode: 'PIPE-JM-001',
        quantity: 1,
        status: 'installed',
        requester: '张师傅',
        requestTime: '2024-01-11T15:00:00Z',
        statusHistory: [
          createStatusChange('', 'requested', '张师傅', '安装师傅', '客户要求更换下水管', '2024-01-11T15:00:00Z'),
          createStatusChange('requested', 'approved', '仓库管理员小张', '仓库管理', '已批准', '2024-01-11T15:30:00Z'),
          createStatusChange('approved', 'picked', '张师傅', '安装师傅', '已领取配件', '2024-01-12T08:30:00Z'),
          createStatusChange('picked', 'installed', '张师傅', '安装师傅', '配件已安装完成', '2024-01-12T11:00:00Z')
        ],
        remark: '配件流程完整，客户签字确认'
      }
    ],
    dispatchRecords: [
      {
        id: 'DR003',
        orderId: 'ORD004',
        masterId: 'M001',
        masterName: '张师傅',
        status: 'completed',
        dispatchTime: '2024-01-10T14:00:00Z',
        acceptTime: '2024-01-10T14:30:00Z',
        completeTime: '2024-01-12T11:30:00Z',
        statusHistory: [
          createStatusChange('', 'assigned', '调度员小李', '调度员', '分配给张师傅', '2024-01-10T14:00:00Z'),
          createStatusChange('assigned', 'accepted', '张师傅', '安装师傅', '确认接单', '2024-01-10T14:30:00Z'),
          createStatusChange('accepted', 'completed', '张师傅', '安装师傅', '安装完成，客户满意签字', '2024-01-12T11:30:00Z')
        ],
        remark: '安装顺利完成'
      }
    ],
    statusHistory: [
      createStatusChange('', 'pending', '系统', '系统', '订单创建', '2024-01-10T11:00:00Z'),
      createStatusChange('pending', 'assigned', '调度员小李', '调度员', '已分配给张师傅', '2024-01-10T14:00:00Z'),
      createStatusChange('assigned', 'in_progress', '张师傅', '安装师傅', '开始安装', '2024-01-12T09:00:00Z'),
      createStatusChange('in_progress', 'completed', '张师傅', '安装师傅', '安装完成，客户签字确认', '2024-01-12T11:30:00Z')
    ],
    remark: '客户对服务非常满意，已推荐给邻居'
  },
  {
    id: 'ORD005',
    customerName: '吴先生',
    customerPhone: '13900139005',
    address: '上海市长宁区延安西路900号',
    productType: '整体卫浴',
    productModel: '恒洁-HJ-PRO',
    status: 'delayed',
    createTime: '2024-01-14T13:00:00Z',
    scheduledTime: '2024-01-16T15:00:00Z',
    dispatcher: '调度员小王',
    assignedMaster: '王师傅',
    assignedMasterId: 'M003',
    partRequests: [
      {
        id: 'PR005',
        orderId: 'ORD005',
        partName: '混水阀',
        partCode: 'MIX-HJ-001',
        quantity: 1,
        status: 'requested',
        requester: '王师傅',
        requestTime: '2024-01-16T16:00:00Z',
        statusHistory: [
          createStatusChange('', 'requested', '王师傅', '安装师傅', '混水阀漏水，需要更换', '2024-01-16T16:00:00Z')
        ],
        currentHandler: '仓库管理员小张',
        currentHandlerRole: '仓库管理',
        remark: '等待审批，配件缺货中，预计后天到货'
      }
    ],
    dispatchRecords: [
      {
        id: 'DR004',
        orderId: 'ORD005',
        masterId: 'M003',
        masterName: '王师傅',
        status: 'accepted',
        dispatchTime: '2024-01-14T14:00:00Z',
        acceptTime: '2024-01-14T14:30:00Z',
        statusHistory: [
          createStatusChange('', 'assigned', '调度员小王', '调度员', '分配给王师傅，整体卫浴专家', '2024-01-14T14:00:00Z'),
          createStatusChange('assigned', 'accepted', '王师傅', '安装师傅', '确认接单', '2024-01-14T14:30:00Z')
        ],
        remark: '师傅已到场，但配件问题导致延期'
      }
    ],
    statusHistory: [
      createStatusChange('', 'pending', '系统', '系统', '订单创建', '2024-01-14T13:00:00Z'),
      createStatusChange('pending', 'assigned', '调度员小王', '调度员', '已分配给王师傅', '2024-01-14T14:00:00Z'),
      createStatusChange('assigned', 'in_progress', '王师傅', '安装师傅', '师傅到场开始安装', '2024-01-16T15:00:00Z'),
      createStatusChange('in_progress', 'delayed', '王师傅', '安装师傅', '发现混水阀漏水，等待配件', '2024-01-16T16:30:00Z')
    ],
    afterSaleHandler: '客服小美',
    afterSaleStatus: 'processing',
    remark: '配件缺货，预计延迟2天，已通知客户'
  },
  {
    id: 'ORD006',
    customerName: '郑女士',
    customerPhone: '13900139006',
    address: '上海市普陀区金沙江路1000号',
    productType: '智能马桶',
    productModel: '箭牌-AI-999',
    status: 'pending',
    createTime: '2024-01-17T11:00:00Z',
    partRequests: [],
    dispatchRecords: [],
    statusHistory: [
      createStatusChange('', 'pending', '系统', '系统', '订单创建，等待调度', '2024-01-17T11:00:00Z')
    ],
    remark: '新客户，首次合作'
  },
  {
    id: 'ORD007',
    customerName: '钱先生',
    customerPhone: '13900139007',
    address: '上海市杨浦区五角场万达广场',
    productType: '淋浴房',
    productModel: '摩恩-MN-5000',
    status: 'in_progress',
    createTime: '2024-01-15T08:30:00Z',
    scheduledTime: '2024-01-17T09:00:00Z',
    dispatcher: '调度员小李',
    assignedMaster: '王师傅',
    assignedMasterId: 'M003',
    partRequests: [
      {
        id: 'PR007',
        orderId: 'ORD007',
        partName: '玻璃门铰链',
        partCode: 'HINGE-MN-001',
        quantity: 2,
        status: 'installed',
        requester: '王师傅',
        requestTime: '2024-01-15T09:00:00Z',
        statusHistory: [
          createStatusChange('', 'requested', '王师傅', '安装师傅', '需要额外铰链', '2024-01-15T09:00:00Z'),
          createStatusChange('requested', 'approved', '仓库管理员小张', '仓库管理', '已批准', '2024-01-15T09:30:00Z'),
          createStatusChange('approved', 'picked', '王师傅', '安装师傅', '已领取', '2024-01-17T08:30:00Z'),
          createStatusChange('picked', 'installed', '王师傅', '安装师傅', '已安装', '2024-01-17T10:00:00Z')
        ],
        remark: '配件安装完成'
      }
    ],
    dispatchRecords: [
      {
        id: 'DR005',
        orderId: 'ORD007',
        masterId: 'M003',
        masterName: '王师傅',
        status: 'accepted',
        dispatchTime: '2024-01-15T09:00:00Z',
        acceptTime: '2024-01-15T09:15:00Z',
        statusHistory: [
          createStatusChange('', 'assigned', '调度员小李', '调度员', '分配给王师傅', '2024-01-15T09:00:00Z'),
          createStatusChange('assigned', 'accepted', '王师傅', '安装师傅', '确认接单', '2024-01-15T09:15:00Z')
        ]
      }
    ],
    statusHistory: [
      createStatusChange('', 'pending', '系统', '系统', '订单创建', '2024-01-15T08:30:00Z'),
      createStatusChange('pending', 'assigned', '调度员小李', '调度员', '已分配给王师傅', '2024-01-15T09:00:00Z'),
      createStatusChange('assigned', 'in_progress', '王师傅', '安装师傅', '开始安装', '2024-01-17T09:00:00Z')
    ],
    remark: '商业场所安装，时间紧迫'
  }
];

export const getDashboardStats = (): DashboardStats => ({
  totalOrders: orders.length,
  pendingOrders: orders.filter(o => o.status === 'pending').length,
  inProgressOrders: orders.filter(o => o.status === 'in_progress').length,
  completedOrders: orders.filter(o => o.status === 'completed').length,
  delayedOrders: orders.filter(o => o.status === 'delayed').length,
  pendingParts: orders.reduce((acc, o) => acc + o.partRequests.filter(p => p.status === 'requested').length, 0),
  unassignedMasters: masters.filter(m => m.status === 'available').length
});

export const findOrderById = (id: string): InstallationOrder | undefined => 
  orders.find(o => o.id === id);

export const findMasterById = (id: string): Master | undefined =>
  masters.find(m => m.id === id);

export const getAllPartRequests = (): (PartRequest & { orderInfo: InstallationOrder })[] => 
  orders.flatMap(order => 
    order.partRequests.map(pr => ({ ...pr, orderInfo: order }))
  );
