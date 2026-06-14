import { Appeal, OperationHistory, Attachment } from '../types';

const STORAGE_KEY = 'insurance_appeal_system';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateAppealNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `TS${year}${month}${day}${random}`;
}

export function initializeMockData(): void {
  const existingData = localStorage.getItem(STORAGE_KEY);
  if (existingData) {
    return;
  }

  const appeals: Appeal[] = [
    // 顺利流样例
    {
      id: generateId(),
      appealNumber: 'TS20240115001',
      customerName: '张先生',
      customerPhone: '138****5678',
      appealContent: '对车险理赔金额8000元有异议,认为应赔付12000元',
      oldLedgerInfo: '保单号P202312001,出险日期2024-01-10,定损金额8000元',
      assignedProfessional: '李工',
      status: 'archived',
      createdAt: new Date('2024-01-15 09:00:00'),
      updatedAt: new Date('2024-01-16 10:05:00'),
      siteRecord: '车辆前保险杠、左前翼子板、左前大灯受损,4S店报价单显示配件费9500元,工时费2500元',
      professionalOpinion: '建议按4S店报价赔付,原定损金额偏低',
      reviewConclusion: '同意专业人员意见,按12000元赔付',
      isException: false
    },
    // 问题流样例
    {
      id: generateId(),
      appealNumber: 'TS20240116002',
      customerName: '李女士',
      customerPhone: '139****1234',
      appealContent: '对拒赔决定有异议,认为事故在保险期内',
      oldLedgerInfo: '保单号P202311002,保险期限2023-01-01至2023-12-31,出险日期2024-01-05',
      assignedProfessional: '王工',
      status: 'archived',
      createdAt: new Date('2024-01-16 11:00:00'),
      updatedAt: new Date('2024-01-18 10:05:00'),
      siteRecord: '经核查,出险日期确实在保单到期后5天',
      professionalOpinion: '出险日期在新保单保险期内,建议正常理赔',
      reviewConclusion: '同意按新保单理赔',
      returnReason: '需核实客户是否已续保,是否有宽限期约定',
      supplementNote: '经联系客户,客户于2023-12-20已续保,保单号P202401001,保险期限2024-01-01至2024-12-31',
      isException: false
    },
    // 待分配申诉
    {
      id: generateId(),
      appealNumber: generateAppealNumber(),
      customerName: '赵先生',
      customerPhone: '137****9876',
      appealContent: '对理赔时效有异议,认为处理时间过长',
      oldLedgerInfo: '保单号P202401003,出险日期2024-01-12,已提交材料但未收到理赔结果',
      status: 'pending_assignment',
      createdAt: new Date(),
      updatedAt: new Date(),
      isException: false
    },
    {
      id: generateId(),
      appealNumber: generateAppealNumber(),
      customerName: '钱女士',
      customerPhone: '136****5432',
      appealContent: '对定损金额有异议,认为配件价格过高',
      oldLedgerInfo: '保单号P202401004,出险日期2024-01-13,定损金额15000元',
      status: 'pending_assignment',
      createdAt: new Date(),
      updatedAt: new Date(),
      isException: false
    },
    {
      id: generateId(),
      appealNumber: generateAppealNumber(),
      customerName: '孙先生',
      customerPhone: '135****8765',
      appealContent: '对拒赔理由有异议,认为事故属于保险责任范围',
      oldLedgerInfo: '保单号P202401005,出险日期2024-01-14,拒赔理由:不在保险责任范围',
      status: 'pending_assignment',
      createdAt: new Date(),
      updatedAt: new Date(),
      isException: false
    },
    // 待核查申诉
    {
      id: generateId(),
      appealNumber: generateAppealNumber(),
      customerName: '周女士',
      customerPhone: '134****2109',
      appealContent: '对理赔金额有异议,认为应赔付更多',
      oldLedgerInfo: '保单号P202401006,出险日期2024-01-11,定损金额5000元',
      assignedProfessional: '李工',
      status: 'pending_investigation',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isException: false
    },
    {
      id: generateId(),
      appealNumber: generateAppealNumber(),
      customerName: '吴先生',
      customerPhone: '133****6543',
      appealContent: '对理赔流程有异议,认为流程过于复杂',
      oldLedgerInfo: '保单号P202401007,出险日期2024-01-10,已提交材料但流程未推进',
      assignedProfessional: '王工',
      status: 'pending_investigation',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isException: false
    },
    // 待复核申诉
    {
      id: generateId(),
      appealNumber: generateAppealNumber(),
      customerName: '郑女士',
      customerPhone: '132****0987',
      appealContent: '对理赔金额有异议,认为定损金额偏低',
      oldLedgerInfo: '保单号P202401008,出险日期2024-01-09,定损金额3000元',
      assignedProfessional: '李工',
      status: 'pending_review',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      siteRecord: '车辆左后门受损,维修店报价2800元',
      professionalOpinion: '建议按维修店报价赔付',
      isException: false
    },
    // 已退回申诉(异常)
    {
      id: generateId(),
      appealNumber: generateAppealNumber(),
      customerName: '冯先生',
      customerPhone: '131****4321',
      appealContent: '对理赔金额有异议,认为应赔付更多',
      oldLedgerInfo: '保单号P202401009,出险日期2024-01-08,定损金额6000元',
      assignedProfessional: '王工',
      status: 'returned',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
      siteRecord: '车辆前挡风玻璃受损',
      professionalOpinion: '建议按报价赔付',
      returnReason: '需要补充车辆受损照片和维修报价单',
      isException: true,
      exceptionReason: '已退回,需要补充材料'
    }
  ];

  const operationHistory: OperationHistory[] = [
    // 顺利流操作历史
    {
      id: generateId(),
      appealId: appeals[0].id,
      operatorRole: 'receptionist',
      operatorName: '张三',
      operationType: 'create',
      operationContent: '录入客户申诉信息',
      operationTime: new Date('2024-01-15 09:00:00')
    },
    {
      id: generateId(),
      appealId: appeals[0].id,
      operatorRole: 'receptionist',
      operatorName: '张三',
      operationType: 'assign',
      operationContent: '分配专业人员:李工',
      operationTime: new Date('2024-01-15 09:30:00')
    },
    {
      id: generateId(),
      appealId: appeals[0].id,
      operatorRole: 'professional',
      operatorName: '李工',
      operationType: 'submit_investigation',
      operationContent: '提交现场核查结果和专业意见',
      operationTime: new Date('2024-01-15 14:30:00')
    },
    {
      id: generateId(),
      appealId: appeals[0].id,
      operatorRole: 'supervisor',
      operatorName: '赵总',
      operationType: 'approve',
      operationContent: '复核通过,同意按12000元赔付',
      operationTime: new Date('2024-01-16 10:00:00')
    },
    // 问题流操作历史
    {
      id: generateId(),
      appealId: appeals[1].id,
      operatorRole: 'receptionist',
      operatorName: '张三',
      operationType: 'create',
      operationContent: '录入客户申诉信息',
      operationTime: new Date('2024-01-16 11:00:00')
    },
    {
      id: generateId(),
      appealId: appeals[1].id,
      operatorRole: 'receptionist',
      operatorName: '张三',
      operationType: 'assign',
      operationContent: '分配专业人员:王工',
      operationTime: new Date('2024-01-16 11:30:00')
    },
    {
      id: generateId(),
      appealId: appeals[1].id,
      operatorRole: 'professional',
      operatorName: '王工',
      operationType: 'submit_investigation',
      operationContent: '提交现场核查结果',
      operationTime: new Date('2024-01-16 16:00:00')
    },
    {
      id: generateId(),
      appealId: appeals[1].id,
      operatorRole: 'supervisor',
      operatorName: '赵总',
      operationType: 'return',
      operationContent: '退回重新核查',
      reason: '需核实客户是否已续保,是否有宽限期约定',
      operationTime: new Date('2024-01-17 09:30:00')
    },
    {
      id: generateId(),
      appealId: appeals[1].id,
      operatorRole: 'professional',
      operatorName: '王工',
      operationType: 'supplement',
      operationContent: '补充续保保单信息',
      operationTime: new Date('2024-01-17 15:00:00')
    },
    {
      id: generateId(),
      appealId: appeals[1].id,
      operatorRole: 'supervisor',
      operatorName: '赵总',
      operationType: 'approve',
      operationContent: '复核通过,同意按新保单理赔',
      operationTime: new Date('2024-01-18 10:00:00')
    }
  ];

  const attachments: Attachment[] = [
    {
      id: generateId(),
      appealId: appeals[0].id,
      fileName: '4S店报价单.jpg',
      fileUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=car%20repair%20quotation%20document%20with%20price%20details&image_size=landscape_4_3',
      uploadedBy: '李工',
      uploadTime: new Date('2024-01-15 14:30:00')
    },
    {
      id: generateId(),
      appealId: appeals[1].id,
      fileName: '保单信息截图.jpg',
      fileUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=insurance%20policy%20document%20with%20dates&image_size=landscape_4_3',
      uploadedBy: '王工',
      uploadTime: new Date('2024-01-16 16:00:00')
    },
    {
      id: generateId(),
      appealId: appeals[1].id,
      fileName: '续保保单.jpg',
      fileUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=renewed%20insurance%20policy%20document&image_size=landscape_4_3',
      uploadedBy: '王工',
      uploadTime: new Date('2024-01-17 15:00:00')
    }
  ];

  const data = {
    appeals,
    operationHistory,
    attachments
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadData(): { appeals: Appeal[]; operationHistory: OperationHistory[]; attachments: Attachment[] } {
  initializeMockData();
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return { appeals: [], operationHistory: [], attachments: [] };
  }
  
  const parsed = JSON.parse(data);
  return {
    appeals: parsed.appeals.map((a: Appeal) => ({
      ...a,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt)
    })),
    operationHistory: parsed.operationHistory.map((o: OperationHistory) => ({
      ...o,
      operationTime: new Date(o.operationTime)
    })),
    attachments: parsed.attachments.map((a: Attachment) => ({
      ...a,
      uploadTime: new Date(a.uploadTime)
    }))
  };
}

export function saveData(data: { appeals: Appeal[]; operationHistory: OperationHistory[]; attachments: Attachment[] }): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetData(): void {
  localStorage.removeItem(STORAGE_KEY);
  initializeMockData();
}