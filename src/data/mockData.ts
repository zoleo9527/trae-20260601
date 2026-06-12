import type { WorkOrder } from '../types';

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-001',
    orderNo: 'TC-2024-00123',
    customerName: '科技创新有限公司',
    businessType: '政策咨询',
    urgencyLevel: '紧急',
    status: '待审批',
    assignee: '张明',
    createdAt: '2024-03-15T09:30:00Z',
    updatedAt: '2024-03-15T10:20:00Z',
    attachments: [
      {
        id: 'att-001',
        name: '2023年度研发费用明细.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 245760,
        url: '#',
        uploadedBy: '张明',
        uploadedAt: '2024-03-15T09:30:00Z'
      }
    ],
    historyRemarks: [
      {
        id: 'remark-001',
        timestamp: '2024-03-15T09:30:00Z',
        operator: '张明',
        role: '税务顾问',
        action: '创建工单',
        detail: '创建工单，上传旧台账（2023年度研发费用明细.xlsx）'
      },
      {
        id: 'remark-002',
        timestamp: '2024-03-15T10:20:00Z',
        operator: '张明',
        role: '税务顾问',
        action: '完成政策判断',
        detail: `判断依据：根据《财政部 税务总局关于进一步完善研发费用税前加计扣除政策的公告》（2023年第7号），企业开展研发活动中实际发生的研发费用，未形成无形资产计入当期损益的，在按规定据实扣除的基础上，再按照实际发生额的100%在税前加计扣除。

政策引用：财税〔2023〕7号公告第一条

风险提示：客户提供的研发费用明细中，部分费用类型（如咖啡、招待费）不在加计扣除范围内，需要剔除后重新计算。

处理意见：建议客户重新梳理研发费用明细，剔除不符合规定的费用项目后，可按100%比例加计扣除。预估可节税约28万元。`
      },
      {
        id: 'remark-003',
        timestamp: '2024-03-15T11:15:00Z',
        operator: '李华',
        role: '客户财务',
        action: '补充附件',
        detail: '补充上传：本季度研发项目立项书、项目人员名单'
      }
    ],
    policyJudgment: {
      judgmentBasis: '根据《财政部 税务总局关于进一步完善研发费用税前加计扣除政策的公告》（2023年第7号），企业开展研发活动中实际发生的研发费用，未形成无形资产计入当期损益的，在按规定据实扣除的基础上，再按照实际发生额的100%在税前加计扣除。',
      policyReference: '财税〔2023〕7号公告第一条',
      riskWarning: '客户提供的研发费用明细中，部分费用类型（如咖啡、招待费）不在加计扣除范围内，需要剔除后重新计算。',
      handlingSuggestion: '建议客户重新梳理研发费用明细，剔除不符合规定的费用项目后，可按100%比例加计扣除。预估可节税约28万元。',
      judgedBy: '张明',
      judgedAt: '2024-03-15T10:20:00Z'
    }
  },
  {
    id: 'wo-002',
    orderNo: 'TC-2024-00124',
    customerName: '制造业股份有限公司',
    businessType: '争议处理',
    urgencyLevel: '普通',
    status: '审批通过',
    assignee: '张明',
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-03-11T15:00:00Z',
    attachments: [
      {
        id: 'att-002',
        name: '高新技术企业资格证书.pdf',
        type: 'application/pdf',
        size: 1024000,
        url: '#',
        uploadedBy: '张明',
        uploadedAt: '2024-03-10T09:00:00Z'
      },
      {
        id: 'att-003',
        name: '年度审计报告.pdf',
        type: 'application/pdf',
        size: 2048000,
        url: '#',
        uploadedBy: '张明',
        uploadedAt: '2024-03-10T09:00:00Z'
      }
    ],
    historyRemarks: [
      {
        id: 'remark-004',
        timestamp: '2024-03-10T09:00:00Z',
        operator: '张明',
        role: '税务顾问',
        action: '创建工单',
        detail: '创建工单，上传高新技术企业资格证书、年度审计报告'
      },
      {
        id: 'remark-005',
        timestamp: '2024-03-10T10:30:00Z',
        operator: '张明',
        role: '税务顾问',
        action: '完成政策判断',
        detail: `判断依据：客户持有有效的高新技术企业证书（证书编号：GR2023XXXXXXXX），2023年度企业所得税可享受15%优惠税率。

政策引用：企业所得税法第二十八条、国家税务总局公告2017年第24号

风险提示：客户2023年度研发投入占比为4.8%，略低于高新技术企业的研发投入要求（5%），存在被税务机关质疑的风险。

处理意见：建议客户准备充分的研发投入证明材料，如研发项目立项书、研发费用台账等，以应对可能的税务检查。`
      },
      {
        id: 'remark-006',
        timestamp: '2024-03-10T14:00:00Z',
        operator: '王强',
        role: '项目经理',
        action: '审批驳回',
        detail: '驳回原因：初步判断正确，但风险提示不够详细。需要进一步分析研发投入占比的计算方式，并提供具体的应对建议。'
      },
      {
        id: 'remark-007',
        timestamp: '2024-03-11T09:30:00Z',
        operator: '张明',
        role: '税务顾问',
        action: '补充判断',
        detail: `研发投入占比计算说明：客户2023年度研发费用为860万元，销售收入为17916万元，占比为4.8%。但根据《高新技术企业认定管理工作指引》，研发费用是指归集到特定科目的费用，需要重新核对归集口径。

应对建议：
1. 重新梳理研发费用归集，确保符合规定口径
2. 准备研发项目立项书、过程管理文档、成果转化证明等辅助材料
3. 如归集后研发投入仍低于5%，建议与税务机关提前沟通

预估结论：重新归集后，研发投入占比预计可达到5.2%`
      },
      {
        id: 'remark-008',
        timestamp: '2024-03-11T15:00:00Z',
        operator: '王强',
        role: '项目经理',
        action: '审批通过',
        detail: '审批意见：补充分析详细，风险提示充分，应对建议具体可行。请税务顾问跟进客户的研发费用归集工作。'
      }
    ],
    policyJudgment: {
      judgmentBasis: '客户持有有效的高新技术企业证书（证书编号：GR2023XXXXXXXX），2023年度企业所得税可享受15%优惠税率。',
      policyReference: '企业所得税法第二十八条、国家税务总局公告2017年第24号',
      riskWarning: '客户2023年度研发投入占比为4.8%，略低于高新技术企业的研发投入要求（5%），存在被税务机关质疑的风险。重新归集后，研发投入占比预计可达到5.2%。',
      handlingSuggestion: '建议客户准备充分的研发投入证明材料，如研发项目立项书、研发费用台账等，以应对可能的税务检查。',
      judgedBy: '张明',
      judgedAt: '2024-03-11T09:30:00Z'
    },
    approval: {
      approvalOpinion: '补充分析详细，风险提示充分，应对建议具体可行。请税务顾问跟进客户的研发费用归集工作。',
      approvalResult: '通过',
      approvedBy: '王强',
      approvedAt: '2024-03-11T15:00:00Z'
    }
  },
  {
    id: 'wo-003',
    orderNo: 'TC-2024-00125',
    customerName: '商务服务工作室',
    businessType: '税务筹划',
    urgencyLevel: '加急',
    status: '已签收',
    assignee: '陈静',
    createdAt: '2024-03-20T08:30:00Z',
    updatedAt: '2024-03-20T14:00:00Z',
    attachments: [],
    historyRemarks: [
      {
        id: 'remark-009',
        timestamp: '2024-03-20T08:30:00Z',
        operator: '陈静',
        role: '税务顾问',
        action: '创建工单',
        detail: '创建工单，客户反映本月增值税税负明显上升，希望了解是否有优惠政策可以适用。'
      },
      {
        id: 'remark-010',
        timestamp: '2024-03-20T09:15:00Z',
        operator: '陈静',
        role: '税务顾问',
        action: '完成政策判断',
        detail: `判断依据：根据《财政部 税务总局关于小微企业和个体工商户所得税优惠政策的公告》（2023年第6号）及增值税相关政策，小规模纳税人可享受以下优惠：
1. 增值税小规模纳税人适用3%征收率的应税销售收入，减按1%征收率征收增值税
2. 月销售额10万元以下（含10万元）的增值税小规模纳税人，免征增值税

政策引用：财政部 税务总局公告2023年第6号、国家税务总局公告2023年第1号

风险提示：客户为小规模纳税人，本月销售额为12万元，已超过10万元免税额度，但可享受减按1%征收的优惠。预计可节税约2400元。

处理意见：
1. 建议客户按1%征收率开具发票
2. 填写增值税及附加税费申报表（小规模纳税人适用）
3. 注意保存发票、合同等相关凭证备查`
      },
      {
        id: 'remark-011',
        timestamp: '2024-03-20T10:30:00Z',
        operator: '王强',
        role: '项目经理',
        action: '审批通过',
        detail: '审批意见：政策判断准确，优惠应用建议合理。'
      },
      {
        id: 'remark-012',
        timestamp: '2024-03-20T14:00:00Z',
        operator: '刘芳',
        role: '客户财务',
        action: '确认签收',
        detail: '签收确认：已了解政策内容和操作建议，将按要求执行。签收备注：感谢税务顾问的快速响应，加急处理很及时！'
      }
    ],
    policyJudgment: {
      judgmentBasis: '根据《财政部 税务总局关于小微企业和个体工商户所得税优惠政策的公告》（2023年第6号）及增值税相关政策，小规模纳税人可享受以下优惠：1. 增值税小规模纳税人适用3%征收率的应税销售收入，减按1%征收率征收增值税；2. 月销售额10万元以下（含10万元）的增值税小规模纳税人，免征增值税。',
      policyReference: '财政部 税务总局公告2023年第6号、国家税务总局公告2023年第1号',
      riskWarning: '客户为小规模纳税人，本月销售额为12万元，已超过10万元免税额度，但可享受减按1%征收的优惠。预计可节税约2400元。',
      handlingSuggestion: '1. 建议客户按1%征收率开具发票；2. 填写增值税及附加税费申报表（小规模纳税人适用）；3. 注意保存发票、合同等相关凭证备查。',
      judgedBy: '陈静',
      judgedAt: '2024-03-20T09:15:00Z'
    },
    approval: {
      approvalOpinion: '政策判断准确，优惠应用建议合理。',
      approvalResult: '通过',
      approvedBy: '王强',
      approvedAt: '2024-03-20T10:30:00Z'
    },
    signReceipt: {
      receiptConfirm: '已了解政策内容和操作建议，将按要求执行。',
      receiptRemark: '感谢税务顾问的快速响应，加急处理很及时！',
      receivedBy: '刘芳',
      receivedAt: '2024-03-20T14:00:00Z'
    }
  }
];
