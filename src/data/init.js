const { store, generateId, resetSequence, nextSequence } = require('./store');

const RECORD_TYPE_ORDER_WEIGHT = {
  PROJECT_CREATE: 10,
  REMARK_ADD: 20,
  DRAWING_SUBMIT: 30,
  DRAWING_REJECT: 40,
  DRAWING_CONFIRM: 50,
  SCHEDULE_SUBMIT: 60,
  SCHEDULE_CONFIRM: 70,
  STATUS_CHANGE: 100
};

function createInitRecord(params) {
  const {
    projectId,
    type,
    operator,
    detail,
    fromStatus = null,
    toStatus = null,
    refId = null,
    actionTime
  } = params;

  const operatorName = operator === 'USER_001' ? '王明' : (operator === 'USER_002' ? '李刚' : (operator === 'USER_003' ? '张伟' : '系统'));
  const operatorRole = operator === 'USER_001' ? '项目专员' : (operator === 'USER_002' ? '制作师傅' : (operator === 'USER_003' ? '安装负责人' : '系统'));

  return {
    id: 'REC_' + generateId(),
    projectId,
    type,
    typeLabel: RECORD_TYPE_LABELS[type] || type,
    operator,
    operatorName,
    operatorRole,
    actionTime,
    actionTimestamp: new Date(actionTime).getTime(),
    sequence: nextSequence(),
    typeOrderWeight: RECORD_TYPE_ORDER_WEIGHT[type] || 50,
    detail,
    fromStatus,
    toStatus,
    refId
  };
}

const ROLES = {
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  PRODUCTION_MASTER: 'PRODUCTION_MASTER',
  INSTALL_LEADER: 'INSTALL_LEADER'
};

const ROLE_LABELS = {
  PROJECT_MANAGER: '项目专员',
  PRODUCTION_MASTER: '制作师傅',
  INSTALL_LEADER: '安装负责人'
};

const PROJECT_STATUS = {
  DRAFT: 'DRAFT',
  DRAWING_PENDING: 'DRAWING_PENDING',
  DRAWING_CONFIRMED: 'DRAWING_CONFIRMED',
  PRODUCTION_PENDING: 'PRODUCTION_PENDING',
  PRODUCTION_CONFIRMED: 'PRODUCTION_CONFIRMED',
  INSTALL_PENDING: 'INSTALL_PENDING',
  COMPLETED: 'COMPLETED'
};

const PROJECT_STATUS_LABELS = {
  DRAFT: '草稿',
  DRAWING_PENDING: '待图纸确认',
  DRAWING_CONFIRMED: '图纸已确认',
  PRODUCTION_PENDING: '待生产排单',
  PRODUCTION_CONFIRMED: '生产排单已确认',
  INSTALL_PENDING: '待安装',
  COMPLETED: '已完成'
};

const DRAWING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED'
};

const DRAWING_STATUS_LABELS = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  REJECTED: '已驳回'
};

const SCHEDULE_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED'
};

const SCHEDULE_STATUS_LABELS = {
  PENDING: '待确认',
  CONFIRMED: '已确认'
};

const RECORD_TYPES = {
  PROJECT_CREATE: 'PROJECT_CREATE',
  DRAWING_SUBMIT: 'DRAWING_SUBMIT',
  DRAWING_CONFIRM: 'DRAWING_CONFIRM',
  DRAWING_REJECT: 'DRAWING_REJECT',
  SCHEDULE_SUBMIT: 'SCHEDULE_SUBMIT',
  SCHEDULE_CONFIRM: 'SCHEDULE_CONFIRM',
  STATUS_CHANGE: 'STATUS_CHANGE',
  REMARK_ADD: 'REMARK_ADD'
};

const RECORD_TYPE_LABELS = {
  PROJECT_CREATE: '创建项目',
  DRAWING_SUBMIT: '提交图纸确认',
  DRAWING_CONFIRM: '确认图纸',
  DRAWING_REJECT: '驳回图纸',
  SCHEDULE_SUBMIT: '提交生产排单',
  SCHEDULE_CONFIRM: '确认生产排单',
  STATUS_CHANGE: '状态变更',
  REMARK_ADD: '添加备注'
};

function initializeData() {
  resetSequence();

  store.users = [
    {
      id: 'USER_001',
      name: '王明',
      role: ROLES.PROJECT_MANAGER,
      roleLabel: ROLE_LABELS.PROJECT_MANAGER,
      phone: '13800000001',
      department: '项目部',
      createdAt: '2026-01-10T09:00:00.000Z'
    },
    {
      id: 'USER_002',
      name: '李刚',
      role: ROLES.PRODUCTION_MASTER,
      roleLabel: ROLE_LABELS.PRODUCTION_MASTER,
      phone: '13800000002',
      department: '生产部',
      createdAt: '2026-01-12T09:00:00.000Z'
    },
    {
      id: 'USER_003',
      name: '张伟',
      role: ROLES.INSTALL_LEADER,
      roleLabel: ROLE_LABELS.INSTALL_LEADER,
      phone: '13800000003',
      department: '安装部',
      createdAt: '2026-01-15T09:00:00.000Z'
    }
  ];

  store.projects = [
    {
      id: 'PRJ_202606001',
      name: '万达广场A区标识系统',
      code: 'WDGY-A-2026',
      client: '大连万达商业地产股份有限公司',
      siteAddress: '上海市浦东新区沪南路999号',
      surveyDate: '2026-06-05',
      surveyPerson: '王明',
      designFile: 'WDGY-A区设计图_v3.pdf',
      productionOrder: 'PO-2026-0612-001',
      status: PROJECT_STATUS.DRAWING_PENDING,
      statusLabel: PROJECT_STATUS_LABELS.DRAWING_PENDING,
      currentHandler: 'USER_002',
      currentHandlerName: '李刚',
      projectManagerId: 'USER_001',
      projectManagerName: '王明',
      productionMasterId: 'USER_002',
      productionMasterName: '李刚',
      installLeaderId: 'USER_003',
      installLeaderName: '张伟',
      createdAt: '2026-06-08T10:30:00.000Z',
      createdBy: 'USER_001',
      createdByName: '王明',
      updatedAt: '2026-06-10T14:20:00.000Z',
      remarks: [
        {
          id: generateId(),
          content: '现场勘测已完成，墙面平整度符合要求，需注意主入口标识安装高度与消防喷淋的位置关系',
          author: '王明',
          authorId: 'USER_001',
          createdAt: '2026-06-08T11:15:00.000Z'
        },
        {
          id: generateId(),
          content: '客户反馈B1层停车场指引标识需增加夜光材质，设计图已更新至v3版本，请核对',
          author: '王明',
          authorId: 'USER_001',
          createdAt: '2026-06-10T14:20:00.000Z'
        }
      ]
    },
    {
      id: 'PRJ_202606002',
      name: '阳光住宅小区标识标牌',
      code: 'YGZX-2026',
      client: '阳光置业集团有限公司',
      siteAddress: '杭州市余杭区文一西路1818号',
      surveyDate: '2026-06-01',
      surveyPerson: '王明',
      designFile: 'YGZX_小区标识设计_最终版.dwg',
      productionOrder: 'PO-2026-0605-003',
      status: PROJECT_STATUS.PRODUCTION_CONFIRMED,
      statusLabel: PROJECT_STATUS_LABELS.PRODUCTION_CONFIRMED,
      currentHandler: 'USER_003',
      currentHandlerName: '张伟',
      projectManagerId: 'USER_001',
      projectManagerName: '王明',
      productionMasterId: 'USER_002',
      productionMasterName: '李刚',
      installLeaderId: 'USER_003',
      installLeaderName: '张伟',
      createdAt: '2026-06-03T09:00:00.000Z',
      createdBy: 'USER_001',
      createdByName: '王明',
      updatedAt: '2026-06-12T16:45:00.000Z',
      remarks: [
        {
          id: generateId(),
          content: '小区东门入口处有地埋电缆，安装立柱标识时需避让，详见现场勘测表附图',
          author: '王明',
          authorId: 'USER_001',
          createdAt: '2026-06-03T10:30:00.000Z'
        },
        {
          id: generateId(),
          content: '图纸已确认，设计文件中楼栋牌字体从黑体调整为客户指定的方正兰亭黑',
          author: '李刚',
          authorId: 'USER_002',
          createdAt: '2026-06-06T13:20:00.000Z'
        },
        {
          id: generateId(),
          content: '生产排单已确认，不锈钢板材已下周三入库，预计6月18日开始安装，请安装队提前安排人手',
          author: '李刚',
          authorId: 'USER_002',
          createdAt: '2026-06-12T16:45:00.000Z'
        }
      ]
    },
    {
      id: 'PRJ_202606003',
      name: '科技园B栋导视系统',
      code: 'KJY-B-2026',
      client: '中关村科技园发展有限公司',
      siteAddress: '北京市海淀区中关村大街27号',
      surveyDate: '2026-06-10',
      surveyPerson: '王明',
      designFile: null,
      productionOrder: null,
      status: PROJECT_STATUS.DRAFT,
      statusLabel: PROJECT_STATUS_LABELS.DRAFT,
      currentHandler: 'USER_001',
      currentHandlerName: '王明',
      projectManagerId: 'USER_001',
      projectManagerName: '王明',
      productionMasterId: 'USER_002',
      productionMasterName: '李刚',
      installLeaderId: 'USER_003',
      installLeaderName: '张伟',
      createdAt: '2026-06-12T15:00:00.000Z',
      createdBy: 'USER_001',
      createdByName: '王明',
      updatedAt: '2026-06-12T15:00:00.000Z',
      remarks: [
        {
          id: generateId(),
          content: '客户尚未提供最终设计稿，等设计方交付后再推进',
          author: '王明',
          authorId: 'USER_001',
          createdAt: '2026-06-12T15:00:00.000Z'
        }
      ]
    }
  ];

  store.drawings = [
    {
      id: 'DRW_' + generateId(),
      projectId: 'PRJ_202606001',
      projectName: '万达广场A区标识系统',
      version: 'v3',
      fileName: 'WDGY-A区设计图_v3.pdf',
      fileUrl: '/files/WDGY-A区设计图_v3.pdf',
      status: DRAWING_STATUS.PENDING,
      statusLabel: DRAWING_STATUS_LABELS.PENDING,
      submittedBy: 'USER_001',
      submittedByName: '王明',
      submittedAt: '2026-06-10T14:15:00.000Z',
      confirmedBy: null,
      confirmedByName: null,
      confirmedAt: null,
      confirmRemark: null,
      changes: [
        'B1层停车场指引标识增加夜光材质',
        '主入口Logo标识尺寸从1200mm调整为1500mm'
      ]
    },
    {
      id: 'DRW_' + generateId(),
      projectId: 'PRJ_202606002',
      projectName: '阳光住宅小区标识标牌',
      version: 'v2',
      fileName: 'YGZX_小区标识设计_最终版.dwg',
      fileUrl: '/files/YGZX_小区标识设计_最终版.dwg',
      status: DRAWING_STATUS.CONFIRMED,
      statusLabel: DRAWING_STATUS_LABELS.CONFIRMED,
      submittedBy: 'USER_001',
      submittedByName: '王明',
      submittedAt: '2026-06-05T10:00:00.000Z',
      confirmedBy: 'USER_002',
      confirmedByName: '李刚',
      confirmedAt: '2026-06-06T13:20:00.000Z',
      confirmRemark: '楼栋牌字体从黑体调整为方正兰亭黑，其余设计内容无问题，可进入生产环节',
      changes: [
        '楼栋牌字体调整为方正兰亭黑',
        '地下车库标识增加反光条'
      ]
    },
    {
      id: 'DRW_' + generateId(),
      projectId: 'PRJ_202606002',
      projectName: '阳光住宅小区标识标牌',
      version: 'v1',
      fileName: 'YGZX_小区标识设计_v1.dwg',
      fileUrl: '/files/YGZX_小区标识设计_v1.dwg',
      status: DRAWING_STATUS.REJECTED,
      statusLabel: DRAWING_STATUS_LABELS.REJECTED,
      submittedBy: 'USER_001',
      submittedByName: '王明',
      submittedAt: '2026-06-04T16:00:00.000Z',
      confirmedBy: 'USER_002',
      confirmedByName: '李刚',
      confirmedAt: '2026-06-05T09:30:00.000Z',
      confirmRemark: '楼栋牌使用的黑体字客户不认可，需更换为方正兰亭黑；地下车库标识缺少反光条设计，请设计方补充',
      changes: []
    }
  ];

  store.schedules = [
    {
      id: 'SCH_' + generateId(),
      projectId: 'PRJ_202606002',
      projectName: '阳光住宅小区标识标牌',
      status: SCHEDULE_STATUS.CONFIRMED,
      statusLabel: SCHEDULE_STATUS_LABELS.CONFIRMED,
      productionStartDate: '2026-06-15',
      productionEndDate: '2026-06-17',
      installStartDate: '2026-06-18',
      installEndDate: '2026-06-20',
      materialPlan: [
        { name: '304不锈钢板 1.5mm', quantity: '25张', eta: '2026-06-14' },
        { name: '亚克力板 5mm', quantity: '12张', eta: '2026-06-13' },
        { name: 'LED光源模块', quantity: '80套', eta: '2026-06-13' },
        { name: '反光膜 工程级', quantity: '3卷', eta: '2026-06-13' }
      ],
      productionTasks: [
        { name: '激光切割不锈钢板材', worker: '李刚', date: '2026-06-15', duration: '1天' },
        { name: '折弯焊接成型', worker: '李刚、赵强', date: '2026-06-16', duration: '1天' },
        { name: '表面处理与烤漆', worker: '外包', date: '2026-06-17', duration: '1天' },
        { name: '亚克力雕刻与组装', worker: '李刚', date: '2026-06-17', duration: '0.5天' }
      ],
      installPlan: [
        { area: '小区主入口', items: 3, workers: '张伟、刘强', date: '2026-06-18' },
        { area: '楼栋标识(1-8号楼)', items: 24, workers: '张伟、刘强、王健', date: '2026-06-19' },
        { area: '地下车库导视', items: 15, workers: '张伟、王健', date: '2026-06-20' }
      ],
      submittedBy: 'USER_002',
      submittedByName: '李刚',
      submittedAt: '2026-06-11T11:00:00.000Z',
      confirmedBy: 'USER_001',
      confirmedByName: '王明',
      confirmedAt: '2026-06-12T16:45:00.000Z',
      confirmRemark: '排单合理，请安装队提前与物业沟通进场时间，注意避开高考期间(6月7-9日)的噪音管控',
      remarks: [
        {
          id: generateId(),
          content: '不锈钢板材供应商确认6月14日上午可送达工厂',
          author: '李刚',
          authorId: 'USER_002',
          createdAt: '2026-06-11T14:30:00.000Z'
        }
      ]
    },
    {
      id: 'SCH_' + generateId(),
      projectId: 'PRJ_202606001',
      projectName: '万达广场A区标识系统',
      status: SCHEDULE_STATUS.PENDING,
      statusLabel: SCHEDULE_STATUS_LABELS.PENDING,
      productionStartDate: null,
      productionEndDate: null,
      installStartDate: null,
      installEndDate: null,
      materialPlan: [],
      productionTasks: [],
      installPlan: [],
      submittedBy: null,
      submittedByName: null,
      submittedAt: null,
      confirmedBy: null,
      confirmedByName: null,
      confirmedAt: null,
      confirmRemark: null,
      remarks: []
    }
  ];

  store.records = [
    createInitRecord({
      projectId: 'PRJ_202606001',
      type: RECORD_TYPES.PROJECT_CREATE,
      operator: 'USER_001',
      actionTime: '2026-06-08T10:30:00.000Z',
      detail: '创建项目「万达广场A区标识系统」，项目编号 WDGY-A-2026',
      fromStatus: null,
      toStatus: PROJECT_STATUS.DRAFT
    }),
    createInitRecord({
      projectId: 'PRJ_202606001',
      type: RECORD_TYPES.REMARK_ADD,
      operator: 'USER_001',
      actionTime: '2026-06-08T11:15:00.000Z',
      detail: '添加备注：现场勘测已完成，墙面平整度符合要求，需注意主入口标识安装高度与消防喷淋的位置关系',
      fromStatus: PROJECT_STATUS.DRAFT,
      toStatus: PROJECT_STATUS.DRAFT
    }),
    createInitRecord({
      projectId: 'PRJ_202606001',
      type: RECORD_TYPES.DRAWING_SUBMIT,
      operator: 'USER_001',
      actionTime: '2026-06-10T14:15:00.000Z',
      detail: '提交图纸确认：WDGY-A区设计图_v3.pdf，版本v3，主要变更：B1层停车场指引标识增加夜光材质、主入口Logo标识尺寸从1200mm调整为1500mm',
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_PENDING,
      refId: store.drawings[0].id
    }),
    createInitRecord({
      projectId: 'PRJ_202606001',
      type: RECORD_TYPES.STATUS_CHANGE,
      operator: 'USER_001',
      actionTime: '2026-06-10T14:15:00.000Z',
      detail: '项目状态从「草稿」变更为「待图纸确认」，当前处理人：李刚(制作师傅)',
      fromStatus: PROJECT_STATUS.DRAFT,
      toStatus: PROJECT_STATUS.DRAWING_PENDING
    }),
    createInitRecord({
      projectId: 'PRJ_202606001',
      type: RECORD_TYPES.REMARK_ADD,
      operator: 'USER_001',
      actionTime: '2026-06-10T14:20:00.000Z',
      detail: '添加备注：客户反馈B1层停车场指引标识需增加夜光材质，设计图已更新至v3版本，请核对',
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_PENDING
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.PROJECT_CREATE,
      operator: 'USER_001',
      actionTime: '2026-06-03T09:00:00.000Z',
      detail: '创建项目「阳光住宅小区标识标牌」，项目编号 YGZX-2026',
      fromStatus: null,
      toStatus: PROJECT_STATUS.DRAFT
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.REMARK_ADD,
      operator: 'USER_001',
      actionTime: '2026-06-03T10:30:00.000Z',
      detail: '添加备注：小区东门入口处有地埋电缆，安装立柱标识时需避让，详见现场勘测表附图',
      fromStatus: PROJECT_STATUS.DRAFT,
      toStatus: PROJECT_STATUS.DRAFT
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.DRAWING_SUBMIT,
      operator: 'USER_001',
      actionTime: '2026-06-04T16:00:00.000Z',
      detail: '提交图纸确认：YGZX_小区标识设计_v1.dwg，版本v1',
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_PENDING,
      refId: store.drawings[2].id
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.DRAWING_REJECT,
      operator: 'USER_002',
      actionTime: '2026-06-05T09:30:00.000Z',
      detail: '驳回图纸v1：楼栋牌使用的黑体字客户不认可，需更换为方正兰亭黑；地下车库标识缺少反光条设计，请设计方补充',
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_PENDING,
      refId: store.drawings[2].id
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.DRAWING_SUBMIT,
      operator: 'USER_001',
      actionTime: '2026-06-05T10:00:00.000Z',
      detail: '提交图纸确认：YGZX_小区标识设计_最终版.dwg，版本v2，主要变更：楼栋牌字体调整为方正兰亭黑、地下车库标识增加反光条',
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_PENDING,
      refId: store.drawings[1].id
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.DRAWING_CONFIRM,
      operator: 'USER_002',
      actionTime: '2026-06-06T13:20:00.000Z',
      detail: '确认图纸v2：楼栋牌字体从黑体调整为方正兰亭黑，其余设计内容无问题，可进入生产环节',
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_CONFIRMED,
      refId: store.drawings[1].id
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.STATUS_CHANGE,
      operator: 'USER_002',
      actionTime: '2026-06-06T13:20:00.000Z',
      detail: '项目状态从「待图纸确认」变更为「图纸已确认」',
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_CONFIRMED
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.STATUS_CHANGE,
      operator: 'SYSTEM',
      actionTime: '2026-06-06T13:20:00.000Z',
      detail: '项目状态从「图纸已确认」自动变更为「待生产排单」，当前处理人：李刚(制作师傅)',
      fromStatus: PROJECT_STATUS.DRAWING_CONFIRMED,
      toStatus: PROJECT_STATUS.PRODUCTION_PENDING
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.REMARK_ADD,
      operator: 'USER_002',
      actionTime: '2026-06-06T13:20:00.000Z',
      detail: '添加备注：图纸已确认，设计文件中楼栋牌字体从黑体调整为客户指定的方正兰亭黑',
      fromStatus: PROJECT_STATUS.PRODUCTION_PENDING,
      toStatus: PROJECT_STATUS.PRODUCTION_PENDING
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.SCHEDULE_SUBMIT,
      operator: 'USER_002',
      actionTime: '2026-06-11T11:00:00.000Z',
      detail: '提交生产排单：生产周期6月15日-6月17日，安装周期6月18日-6月20日，共4类物料、4项生产任务、3个安装区域',
      fromStatus: PROJECT_STATUS.PRODUCTION_PENDING,
      toStatus: PROJECT_STATUS.PRODUCTION_PENDING,
      refId: store.schedules[0].id
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.STATUS_CHANGE,
      operator: 'USER_002',
      actionTime: '2026-06-11T11:00:00.000Z',
      detail: '项目状态从「待生产排单」变更为「待生产排单」，当前处理人：王明(项目专员)',
      fromStatus: PROJECT_STATUS.PRODUCTION_PENDING,
      toStatus: PROJECT_STATUS.PRODUCTION_PENDING
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.SCHEDULE_CONFIRM,
      operator: 'USER_001',
      actionTime: '2026-06-12T16:45:00.000Z',
      detail: '确认生产排单：排单合理，请安装队提前与物业沟通进场时间，注意避开高考期间(6月7-9日)的噪音管控',
      fromStatus: PROJECT_STATUS.PRODUCTION_PENDING,
      toStatus: PROJECT_STATUS.PRODUCTION_CONFIRMED,
      refId: store.schedules[0].id
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.STATUS_CHANGE,
      operator: 'USER_001',
      actionTime: '2026-06-12T16:45:00.000Z',
      detail: '项目状态从「待生产排单」变更为「生产排单已确认」，当前处理人：张伟(安装负责人)',
      fromStatus: PROJECT_STATUS.PRODUCTION_PENDING,
      toStatus: PROJECT_STATUS.PRODUCTION_CONFIRMED
    }),
    createInitRecord({
      projectId: 'PRJ_202606002',
      type: RECORD_TYPES.REMARK_ADD,
      operator: 'USER_002',
      actionTime: '2026-06-12T16:45:00.000Z',
      detail: '添加备注：生产排单已确认，不锈钢板材已下周三入库，预计6月18日开始安装，请安装队提前安排人手',
      fromStatus: PROJECT_STATUS.PRODUCTION_CONFIRMED,
      toStatus: PROJECT_STATUS.PRODUCTION_CONFIRMED
    }),
    createInitRecord({
      projectId: 'PRJ_202606003',
      type: RECORD_TYPES.PROJECT_CREATE,
      operator: 'USER_001',
      actionTime: '2026-06-12T15:00:00.000Z',
      detail: '创建项目「科技园B栋导视系统」，项目编号 KJY-B-2026',
      fromStatus: null,
      toStatus: PROJECT_STATUS.DRAFT
    }),
    createInitRecord({
      projectId: 'PRJ_202606003',
      type: RECORD_TYPES.REMARK_ADD,
      operator: 'USER_001',
      actionTime: '2026-06-12T15:00:00.000Z',
      detail: '添加备注：客户尚未提供最终设计稿，等设计方交付后再推进',
      fromStatus: PROJECT_STATUS.DRAFT,
      toStatus: PROJECT_STATUS.DRAFT
    })
  ];

  store.idempotency = {};

  console.log('[Init] 数据初始化完成');
  console.log(`  - 用户: ${store.users.length} 个`);
  console.log(`  - 项目: ${store.projects.length} 个`);
  console.log(`  - 图纸: ${store.drawings.length} 份`);
  console.log(`  - 排单: ${store.schedules.length} 份`);
  console.log(`  - 操作记录: ${store.records.length} 条`);
}

module.exports = {
  initializeData,
  ROLES,
  ROLE_LABELS,
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  DRAWING_STATUS,
  DRAWING_STATUS_LABELS,
  SCHEDULE_STATUS,
  SCHEDULE_STATUS_LABELS,
  RECORD_TYPES,
  RECORD_TYPE_LABELS
};
