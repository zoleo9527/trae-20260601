import type { PawnRecord, TodoItem, UserRole } from './types';

export const mockRecords: PawnRecord[] = [
  {
    id: 'REC001',
    pawnNo: 'DD20260614001',
    customerName: '张三',
    customerPhone: '138****5678',
    itemName: '劳力士日志型腕表',
    itemCategory: '黄金珠宝',
    estimatedValue: 85000,
    pawnAmount: 50000,
    pawnDate: '2026-06-14',
    duration: '1个月',
    assessmentResult: '通过',
    assessmentRemark: '表况良好，正品，附件齐全',
    assessedBy: '李评估师',
    assessmentTime: '2026-06-14 09:15:00',
    storageStatus: 'pending',
    photoStatus: 'pending',
    financeConfirmed: false,
    status: 'pending_storage',
    currentHandler: 'warehouse',
    operationLogs: [
      {
        id: 'LOG001',
        operation: '创建典当单',
        operator: '李评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-14 09:00:00',
        remark: '客户首次典当，身份核验通过'
      },
      {
        id: 'LOG002',
        operation: '评估完成',
        operator: '李评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-14 09:15:00',
        reason: '评估通过，建议放款5万元',
        remark: '表况95新，走时精准'
      }
    ],
    createdAt: '2026-06-14 09:00:00',
    updatedAt: '2026-06-14 09:15:00'
  },
  {
    id: 'REC002',
    pawnNo: 'DD20260614002',
    customerName: '李四',
    customerPhone: '139****1234',
    itemName: '足金项链 50g',
    itemCategory: '黄金珠宝',
    estimatedValue: 28000,
    pawnAmount: 20000,
    pawnDate: '2026-06-14',
    duration: '3个月',
    assessmentResult: '通过',
    assessmentRemark: '足金999，重量50.23g',
    assessedBy: '王评估师',
    assessmentTime: '2026-06-14 10:30:00',
    storageStatus: 'stored',
    storageLocation: 'A区-03-12号保险柜',
    storedBy: '赵库管',
    storageTime: '2026-06-14 11:00:00',
    storageRemark: '密封袋封装，标签完好',
    photoStatus: 'pending',
    financeConfirmed: false,
    status: 'pending_photo',
    currentHandler: 'warehouse',
    operationLogs: [
      {
        id: 'LOG003',
        operation: '创建典当单',
        operator: '王评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-14 10:00:00',
        remark: '老客户续当'
      },
      {
        id: 'LOG004',
        operation: '评估完成',
        operator: '王评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-14 10:30:00',
        reason: '黄金纯度达标',
        remark: '火烧验金通过'
      },
      {
        id: 'LOG005',
        operation: '入库完成',
        operator: '赵库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-14 11:00:00',
        remark: '双人复核入库'
      }
    ],
    createdAt: '2026-06-14 10:00:00',
    updatedAt: '2026-06-14 11:00:00'
  },
  {
    id: 'REC003',
    pawnNo: 'DD20260613008',
    customerName: '王五',
    customerPhone: '137****8899',
    itemName: 'iPhone 15 Pro Max 256G',
    itemCategory: '数码产品',
    estimatedValue: 7500,
    pawnAmount: 4500,
    pawnDate: '2026-06-13',
    duration: '15天',
    assessmentResult: '通过',
    assessmentRemark: '成色98新，功能正常，ID已退',
    assessedBy: '李评估师',
    assessmentTime: '2026-06-13 15:30:00',
    storageStatus: 'stored',
    storageLocation: 'B区-01-05号柜',
    storedBy: '赵库管',
    storageTime: '2026-06-13 16:00:00',
    storageRemark: '原装盒存放，配件齐全',
    photoStatus: 'taken',
    photos: [
      {
        id: 'PH001',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2015%20Pro%20Max%20front%20view%20on%20white%20background%20pawn%20shop%20evidence%20photo&image_size=square_hd',
        label: '正面照',
        uploadTime: '2026-06-13 16:10:00',
        uploadBy: '赵库管',
        remark: '屏幕完好，无划痕'
      },
      {
        id: 'PH002',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2015%20Pro%20Max%20back%20view%20titanium%20color%20pawn%20shop%20evidence%20photo&image_size=square_hd',
        label: '背面照',
        uploadTime: '2026-06-13 16:11:00',
        uploadBy: '赵库管',
        remark: '成色98新'
      },
      {
        id: 'PH003',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2015%20Pro%20Max%20serial%20number%20IMEI%20label%20close%20up%20pawn%20shop%20evidence&image_size=square_hd',
        label: '序列号/IMEI',
        uploadTime: '2026-06-13 16:12:00',
        uploadBy: '赵库管',
        remark: 'IMEI: 356789012345678'
      },
      {
        id: 'PH004',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pawn%20shop%20sealed%20package%20with%20smartphone%20inside%20evidence%20photo&image_size=square_hd',
        label: '封装照',
        uploadTime: '2026-06-13 16:15:00',
        uploadBy: '赵库管',
        remark: '封条编号：FT20260613001'
      }
    ],
    photoTakenBy: '赵库管',
    photoTime: '2026-06-13 16:15:00',
    photoRemark: '四方照片齐全，已上传系统',
    financeConfirmed: false,
    status: 'pending_review',
    currentHandler: 'counter',
    operationLogs: [
      {
        id: 'LOG006',
        operation: '创建典当单',
        operator: '李评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-13 15:00:00',
        remark: '客户急用钱，当天放款'
      },
      {
        id: 'LOG007',
        operation: '评估完成',
        operator: '李评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-13 15:30:00',
        reason: '验机通过，ID已退出',
        remark: '爱思助手全绿'
      },
      {
        id: 'LOG008',
        operation: '入库完成',
        operator: '赵库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-13 16:00:00',
        remark: '单独存放，避免刮花'
      },
      {
        id: 'LOG009',
        operation: '照片留证完成',
        operator: '赵库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-13 16:15:00',
        remark: '4张照片，含封装照'
      }
    ],
    createdAt: '2026-06-13 15:00:00',
    updatedAt: '2026-06-13 16:15:00'
  },
  {
    id: 'REC004',
    pawnNo: 'DD20260612015',
    customerName: '赵六',
    customerPhone: '136****3344',
    itemName: '1克拉钻戒 GIA VVS1',
    itemCategory: '黄金珠宝',
    estimatedValue: 68000,
    pawnAmount: 40000,
    pawnDate: '2026-06-12',
    duration: '2个月',
    assessmentResult: '通过',
    assessmentRemark: 'GIA证书齐全，钻石无荧光',
    assessedBy: '王评估师',
    assessmentTime: '2026-06-12 14:00:00',
    storageStatus: 'stored',
    storageLocation: '金库-贵重物品区-02号',
    storedBy: '钱库管',
    storageTime: '2026-06-12 14:30:00',
    storageRemark: '金库双人双锁管理',
    photoStatus: 'taken',
    photos: [
      {
        id: 'PH005',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=diamond%20ring%201%20carat%20on%20black%20velvet%20pawn%20shop%20evidence%20photo&image_size=square_hd',
        label: '钻戒正面',
        uploadTime: '2026-06-12 14:40:00',
        uploadBy: '钱库管'
      },
      {
        id: 'PH006',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=GIA%20diamond%20certificate%20document%20pawn%20shop%20evidence&image_size=square_hd',
        label: 'GIA证书',
        uploadTime: '2026-06-12 14:42:00',
        uploadBy: '钱库管',
        remark: '证书编号：GIA2023123456'
      }
    ],
    photoTakenBy: '钱库管',
    photoTime: '2026-06-12 14:45:00',
    photoRemark: '照片清晰，证书已留档',
    financeConfirmed: true,
    financeConfirmedBy: '孙会计',
    financeConfirmTime: '2026-06-12 15:00:00',
    financeRemark: '款项已划转客户账户',
    status: 'completed',
    currentHandler: 'counter',
    operationLogs: [
      {
        id: 'LOG010',
        operation: '创建典当单',
        operator: '王评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-12 13:30:00',
        remark: 'VIP客户'
      },
      {
        id: 'LOG011',
        operation: '评估完成',
        operator: '王评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-12 14:00:00',
        reason: '钻石品质优良，GIA认证',
        remark: '4C参数：1.01ct D VVS1 3EX N'
      },
      {
        id: 'LOG012',
        operation: '入库完成',
        operator: '钱库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-12 14:30:00',
        remark: '金库贵重物品区，双人复核'
      },
      {
        id: 'LOG013',
        operation: '照片留证完成',
        operator: '钱库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-12 14:45:00',
        remark: '照片已存档'
      },
      {
        id: 'LOG014',
        operation: '财务确认放款',
        operator: '孙会计',
        operatorRole: 'finance',
        operateTime: '2026-06-12 15:00:00',
        reason: '手续齐全，同意放款',
        remark: '转账凭证号：ZZ20260612001'
      }
    ],
    createdAt: '2026-06-12 13:30:00',
    updatedAt: '2026-06-12 15:00:00'
  },
  {
    id: 'REC005',
    pawnNo: 'DD20260614003',
    customerName: '孙七',
    customerPhone: '135****7788',
    itemName: '卡地亚蓝气球手表',
    itemCategory: '黄金珠宝',
    estimatedValue: 55000,
    pawnAmount: 32000,
    pawnDate: '2026-06-14',
    duration: '1个月',
    storageStatus: 'rejected',
    storageLocation: '',
    storedBy: '',
    storageTime: '',
    storageRemark: '',
    rejectReason: '客户拒绝当面拆封检查，疑似来源不明',
    photoStatus: 'pending',
    financeConfirmed: false,
    status: 'abnormal',
    abnormalReason: '入库被退回，需评估师重新核验',
    currentHandler: 'counter',
    operationLogs: [
      {
        id: 'LOG015',
        operation: '创建典当单',
        operator: '李评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-14 13:00:00',
        remark: '客户情绪激动，催促尽快办理'
      },
      {
        id: 'LOG016',
        operation: '评估完成',
        operator: '李评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-14 13:20:00',
        reason: '外观符合正品特征',
        remark: '因客户不愿拆表带，无法开盖验机芯'
      },
      {
        id: 'LOG017',
        operation: '入库退回',
        operator: '赵库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-14 13:45:00',
        reason: '入库被退回',
        remark: '必须开盖验明真伪后方可入库'
      }
    ],
    createdAt: '2026-06-14 13:00:00',
    updatedAt: '2026-06-14 13:45:00'
  },
  {
    id: 'REC006',
    pawnNo: 'DD20260611020',
    customerName: '周八',
    customerPhone: '133****5566',
    itemName: '佳能 EOS R5 相机套机',
    itemCategory: '数码产品',
    estimatedValue: 22000,
    pawnAmount: 13000,
    pawnDate: '2026-06-11',
    duration: '1个月',
    assessmentResult: '通过',
    assessmentRemark: '快门次数3200，成色99新',
    assessedBy: '王评估师',
    assessmentTime: '2026-06-11 11:00:00',
    storageStatus: 'stored',
    storageLocation: 'B区-02-18号柜',
    storedBy: '钱库管',
    storageTime: '2026-06-11 11:30:00',
    storageRemark: '防潮柜存放',
    photoStatus: 'rejected',
    photoRejectReason: '照片模糊，缺少镜头编号特写，需重拍',
    photos: [
      {
        id: 'PH007',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Canon%20EOS%20R5%20camera%20front%20view%20blurry%20photo&image_size=square_hd',
        label: '相机正面',
        uploadTime: '2026-06-11 11:40:00',
        uploadBy: '钱库管'
      }
    ],
    photoTakenBy: '钱库管',
    photoTime: '2026-06-11 11:45:00',
    photoRemark: '照片质量不合格被退回',
    financeConfirmed: false,
    status: 'abnormal',
    abnormalReason: '照片留证被退回，需重新拍摄',
    currentHandler: 'warehouse',
    operationLogs: [
      {
        id: 'LOG018',
        operation: '创建典当单',
        operator: '王评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-11 10:30:00',
        remark: '专业摄影师，相机很新'
      },
      {
        id: 'LOG019',
        operation: '评估完成',
        operator: '王评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-11 11:00:00',
        reason: '成色极新，功能正常',
        remark: '镜头：RF24-70 F2.8'
      },
      {
        id: 'LOG020',
        operation: '入库完成',
        operator: '钱库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-11 11:30:00',
        remark: '放入防潮柜，温度22°C湿度45%'
      },
      {
        id: 'LOG021',
        operation: '照片留证退回',
        operator: '李评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-11 14:00:00',
        reason: '照片质量不合格',
        remark: '照片模糊，缺少镜头编号特写，需重拍'
      }
    ],
    createdAt: '2026-06-11 10:30:00',
    updatedAt: '2026-06-11 14:00:00'
  },
  {
    id: 'REC007',
    pawnNo: 'DD20260610005',
    customerName: '吴九',
    customerPhone: '131****2233',
    itemName: '20g金条 建行发行',
    itemCategory: '黄金珠宝',
    estimatedValue: 11200,
    pawnAmount: 8000,
    pawnDate: '2026-06-10',
    duration: '6个月',
    assessmentResult: '通过',
    assessmentRemark: '建行金条，编号清晰，成色9999',
    assessedBy: '李评估师',
    assessmentTime: '2026-06-10 16:00:00',
    storageStatus: 'stored',
    storageLocation: '金库-贵金属区-15号',
    storedBy: '赵库管',
    storageTime: '2026-06-10 16:30:00',
    storageRemark: '原封包装完好',
    photoStatus: 'taken',
    photos: [
      {
        id: 'PH008',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gold%20bar%2020g%20China%20Construction%20Bank%20front%20view%20pawn%20shop%20evidence&image_size=square_hd',
        label: '金条正面',
        uploadTime: '2026-06-10 16:40:00',
        uploadBy: '赵库管'
      },
      {
        id: 'PH009',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gold%20bar%20serial%20number%20close%20up%20pawn%20shop%20evidence%20photo&image_size=square_hd',
        label: '编号特写',
        uploadTime: '2026-06-10 16:41:00',
        uploadBy: '赵库管',
        remark: '编号：CCB20240012345'
      }
    ],
    photoTakenBy: '赵库管',
    photoTime: '2026-06-10 16:45:00',
    photoRemark: '照片清晰，编号可辨',
    financeConfirmed: true,
    financeConfirmedBy: '孙会计',
    financeConfirmTime: '2026-06-10 17:00:00',
    financeRemark: '已放款',
    status: 'completed',
    currentHandler: 'counter',
    operationLogs: [
      {
        id: 'LOG022',
        operation: '创建典当单',
        operator: '李评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-10 15:30:00',
        remark: '客户长期投资，临时周转'
      },
      {
        id: 'LOG023',
        operation: '评估完成',
        operator: '李评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-10 16:00:00',
        reason: '建行正规金条',
        remark: '纯度99.99%'
      },
      {
        id: 'LOG024',
        operation: '入库完成',
        operator: '赵库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-10 16:30:00',
        remark: '贵金属区存放'
      },
      {
        id: 'LOG025',
        operation: '照片留证完成',
        operator: '赵库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-10 16:45:00',
        remark: '照片已存档'
      },
      {
        id: 'LOG026',
        operation: '财务确认放款',
        operator: '孙会计',
        operatorRole: 'finance',
        operateTime: '2026-06-10 17:00:00',
        remark: '8000元已到账'
      }
    ],
    createdAt: '2026-06-10 15:30:00',
    updatedAt: '2026-06-10 17:00:00'
  },
  {
    id: 'REC008',
    pawnNo: 'DD20260614004',
    customerName: '郑十',
    customerPhone: '132****9900',
    itemName: 'LV Neverfull 中号手袋',
    itemCategory: '奢侈名品',
    estimatedValue: 9500,
    pawnAmount: 5500,
    pawnDate: '2026-06-14',
    duration: '1个月',
    assessmentResult: '通过',
    assessmentRemark: '正品，2022年款，成色9新',
    assessedBy: '王评估师',
    assessmentTime: '2026-06-14 14:30:00',
    storageStatus: 'stored',
    storageLocation: 'C区-奢侈品区-07号',
    storedBy: '钱库管',
    storageTime: '2026-06-14 15:00:00',
    storageRemark: '防尘袋包装，悬挂存放',
    photoStatus: 'taken',
    photos: [
      {
        id: 'PH010',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Louis%20Vuitton%20Neverfull%20handbag%20front%20view%20pawn%20shop%20evidence%20photo&image_size=square_hd',
        label: '手袋正面',
        uploadTime: '2026-06-14 15:10:00',
        uploadBy: '钱库管'
      },
      {
        id: 'PH011',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Louis%20Vuitton%20date%20code%20inside%20bag%20close%20up%20pawn%20shop%20evidence&image_size=square_hd',
        label: '内标编码',
        uploadTime: '2026-06-14 15:12:00',
        uploadBy: '钱库管',
        remark: '编码：SA4220'
      },
      {
        id: 'PH012',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Louis%20Vuitton%20handbag%20with%20dust%20bag%20pawn%20shop%20evidence%20photo&image_size=square_hd',
        label: '全套包装',
        uploadTime: '2026-06-14 15:15:00',
        uploadBy: '钱库管'
      }
    ],
    photoTakenBy: '钱库管',
    photoTime: '2026-06-14 15:15:00',
    photoRemark: '细节照片齐全',
    financeConfirmed: false,
    status: 'pending_review',
    currentHandler: 'finance',
    operationLogs: [
      {
        id: 'LOG027',
        operation: '创建典当单',
        operator: '王评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-14 14:00:00',
        remark: '客户急需资金周转'
      },
      {
        id: 'LOG028',
        operation: '评估完成',
        operator: '王评估师',
        operatorRole: 'counter',
        operateTime: '2026-06-14 14:30:00',
        reason: '鉴定为正品',
        remark: '轻微使用痕迹，整体良好'
      },
      {
        id: 'LOG029',
        operation: '入库完成',
        operator: '钱库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-14 15:00:00',
        remark: '奢侈品区悬挂存放'
      },
      {
        id: 'LOG030',
        operation: '照片留证完成',
        operator: '钱库管',
        operatorRole: 'warehouse',
        operateTime: '2026-06-14 15:15:00',
        remark: '照片已审核通过'
      }
    ],
    createdAt: '2026-06-14 14:00:00',
    updatedAt: '2026-06-14 15:15:00'
  }
];

export function getTodosByRole(role: UserRole, records: PawnRecord[]): TodoItem[] {
  const todos: TodoItem[] = [];
  
  records.forEach(record => {
    if (record.status === 'pending_storage' && role === 'warehouse') {
      todos.push({
        id: `TODO-${record.id}`,
        pawnRecordId: record.id,
        pawnNo: record.pawnNo,
        itemName: record.itemName,
        type: 'storage',
        title: '待入库保管',
        description: `${record.itemName} 已评估完成，等待入库`,
        priority: 'high',
        createdAt: record.updatedAt
      });
    }
    
    if (record.status === 'pending_photo' && role === 'warehouse') {
      todos.push({
        id: `TODO-${record.id}`,
        pawnRecordId: record.id,
        pawnNo: record.pawnNo,
        itemName: record.itemName,
        type: 'photo',
        title: '待照片留证',
        description: `${record.itemName} 已入库，等待拍摄留证照片`,
        priority: 'high',
        createdAt: record.updatedAt
      });
    }
    
    if (record.status === 'pending_review' && role === 'counter') {
      todos.push({
        id: `TODO-${record.id}`,
        pawnRecordId: record.id,
        pawnNo: record.pawnNo,
        itemName: record.itemName,
        type: 'review',
        title: '待审核照片',
        description: `${record.itemName} 照片已上传，等待审核`,
        priority: 'medium',
        createdAt: record.updatedAt
      });
    }
    
    if (record.status === 'pending_review' && role === 'finance' && record.photoStatus === 'taken') {
      todos.push({
        id: `TODO-${record.id}`,
        pawnRecordId: record.id,
        pawnNo: record.pawnNo,
        itemName: record.itemName,
        type: 'finance_confirm',
        title: '待财务确认放款',
        description: `${record.itemName} 手续齐全，等待财务确认放款 ${record.pawnAmount}元`,
        priority: 'high',
        createdAt: record.updatedAt
      });
    }
    
    if (record.status === 'abnormal') {
      if (record.currentHandler === role) {
        const priority = record.abnormalReason?.includes('退回') ? 'high' : 'medium';
        todos.push({
          id: `TODO-${record.id}`,
          pawnRecordId: record.id,
          pawnNo: record.pawnNo,
          itemName: record.itemName,
          type: 'assessment',
          title: '异常处理',
          description: record.abnormalReason || '需要处理异常',
          priority,
          createdAt: record.updatedAt
        });
      }
    }
  });
  
  return todos.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export const roleNames: Record<UserRole, string> = {
  counter: '柜台评估师',
  warehouse: '库管',
  finance: '财务'
};

export const statusNames: Record<string, string> = {
  pending_assessment: '待评估',
  pending_storage: '待入库',
  pending_photo: '待拍照',
  pending_review: '待审核',
  abnormal: '异常',
  completed: '已完成',
  rejected: '已拒绝'
};

export const statusColors: Record<string, string> = {
  pending_assessment: '#f59e0b',
  pending_storage: '#3b82f6',
  pending_photo: '#8b5cf6',
  pending_review: '#ec4899',
  abnormal: '#ef4444',
  completed: '#10b981',
  rejected: '#6b7280'
};
