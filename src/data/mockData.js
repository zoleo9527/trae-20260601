import { ORDER_STATUS, ACTION_TYPES, FLOW_TYPES } from './constants.js'
import dayjs from 'dayjs'

const generateHistory = (records) => {
  return records.map((r, idx) => ({
    id: `h-${idx + 1}`,
    ...r,
    timestamp: dayjs(r.timestamp).format('YYYY-MM-DD HH:mm:ss'),
    timestampRaw: r.timestamp
  }))
}

export const mockOrders = [
  {
    id: 'ORD-20260528-001',
    flowType: FLOW_TYPES.SMOOTH,
    flowLabel: '顺利流样例',
    customerName: '张女士',
    phone: '138****5678',
    age: 32,
    projectName: '热玛吉四代 面部900发',
    totalAmount: 15800,
    paidAmount: 15800,
    refundAmount: 15800,
    treatmentCount: 1,
    treatedCount: 0,
    currentStatus: ORDER_STATUS.REFUND_APPROVED.value,
    currentResponsible: {
      role: 'CUSTOMER_SERVICE',
      name: '李客服',
      transferFrom: {
        role: 'CONSULTANT',
        name: '王咨询师',
        reason: '双方已达成退款协议，移交财务走退款流程'
      }
    },
    consultant: '王咨询师',
    doctor: '陈医生',
    doctorAssistant: '刘助理',
    customerService: '李客服',
    createdAt: '2026-05-20 14:30:00',
    consultationRecord: {
      content: '客户主诉皮肤松弛，希望改善下颌缘轮廓。推荐热玛吉四代面部900发，告知术后可能出现轻微红肿，一般3-7天消退。客户确认理解并签字。',
      images: ['face-front.jpg', 'face-side.jpg']
    },
    quotation: {
      items: [
        { name: '热玛吉四代 面部900发', amount: 15800, quantity: 1 }
      ],
      discount: '老客户95折后15010，客户坚持原价送面膜一盒，最终按原价15800成交，附赠医用冷敷面膜2盒'
    },
    postopVisits: [],
    refundReason: '客户因个人原因（怀孕）无法继续治疗，医院规定非医疗原因退款需收取20%违约金',
    refundNegotiation: {
      customerRequest: '全额退款15800元',
      hospitalPlan: '扣除20%违约金3160元，退款12640元',
      finalAgreement: '考虑到客户特殊情况（怀孕），经店长特批，全额退款15800元'
    },
    history: generateHistory([
      {
        action: ACTION_TYPES.CREATE_ORDER,
        operator: '王咨询师',
        operatorRole: 'CONSULTANT',
        timestamp: '2026-05-20 14:30:00',
        content: '创建订单，热玛吉四代面部900发，金额15800元，客户已全款支付。',
        responsible: { role: 'CONSULTANT', name: '王咨询师' }
      },
      {
        action: ACTION_TYPES.SUBMIT_REFUND,
        operator: '张女士（客户）',
        operatorRole: 'CUSTOMER',
        timestamp: '2026-05-26 09:15:00',
        content: '客户提交退款申请，原因：怀孕，医生建议避免射频治疗。附医院孕检证明。',
        responsible: { role: 'CONSULTANT', name: '王咨询师' }
      },
      {
        action: ACTION_TYPES.NEGOTIATE_REFUND,
        operator: '王咨询师',
        operatorRole: 'CONSULTANT',
        timestamp: '2026-05-26 11:00:00',
        content: '与客户沟通：按合同非医疗原因退款扣20%违约金。客户表示理解但希望特殊处理。已同步店长。',
        responsible: { role: 'CONSULTANT', name: '王咨询师' }
      },
      {
        action: ACTION_TYPES.APPROVE_REFUND,
        operator: '王店长',
        operatorRole: 'MANAGER',
        timestamp: '2026-05-28 10:30:00',
        content: '经审批，考虑客户怀孕特殊情况，同意全额退款15800元。无需扣违约金。',
        responsible: { role: 'CUSTOMER_SERVICE', name: '李客服' },
        transferNote: '协商完成，移交客服跟进财务退款流程'
      }
    ])
  },
  {
    id: 'ORD-20260525-002',
    flowType: FLOW_TYPES.PROBLEM,
    flowLabel: '问题流样例',
    customerName: '刘先生',
    phone: '139****1234',
    age: 41,
    projectName: '玻尿酸丰太阳穴 + 下颌缘提升',
    totalAmount: 28600,
    paidAmount: 28600,
    refundAmount: 28600,
    treatmentCount: 2,
    treatedCount: 1,
    currentStatus: ORDER_STATUS.TREATMENT_WRITEOFF.value,
    currentResponsible: {
      role: 'DOCTOR_ASSISTANT',
      name: '赵助理',
      transferFrom: {
        role: 'CUSTOMER_SERVICE',
        name: '李客服',
        reason: '退款驳回，客户同意继续治疗，转回医疗端核销剩余疗程'
      }
    },
    consultant: '张咨询师',
    doctor: '王医生',
    doctorAssistant: '赵助理',
    customerService: '李客服',
    createdAt: '2026-05-10 10:00:00',
    consultationRecord: {
      content: '客户主诉太阳穴凹陷、下颌线不清晰。推荐乔雅登雅致2支丰太阳穴+下颌缘提升注射。告知可能出现局部淤青、肿胀，属正常反应。',
      images: []
    },
    quotation: {
      items: [
        { name: '乔雅登雅致 2ml', amount: 12800, quantity: 2 },
        { name: '注射服务费', amount: 3000, quantity: 1 }
      ],
      discount: '充值5万会员折扣后28600元'
    },
    postopVisits: [
      {
        date: '2026-05-12',
        content: '术后第2天回访，客户表示左侧太阳穴有轻微肿胀，嘱冷敷，无需特殊处理。'
      },
      {
        date: '2026-05-15',
        content: '术后第5天回访，肿胀消退，客户对形态满意，预约2周后复查。'
      }
    ],
    refundReason: '客户称注射后效果不明显，要求全额退款。但合同约定效果评估需1个月后，且已完成一次治疗。',
    refundNegotiation: {
      customerRequest: '全额退款28600元，认为"没效果"',
      hospitalPlan: '已完成一次治疗（太阳穴2ml），扣除已执行项目费用15800元，剩余12800元可转做其他项目或退款。客户坚持全额退款。',
      finalAgreement: '经医疗总监评估，注射位置、剂量均符合规范，效果需时间显现。驳回退款申请。客户同意继续完成剩余疗程并配合复查。'
    },
    history: generateHistory([
      {
        action: ACTION_TYPES.CREATE_ORDER,
        operator: '张咨询师',
        operatorRole: 'CONSULTANT',
        timestamp: '2026-05-10 10:00:00',
        content: '创建订单：玻尿酸丰太阳穴2ml+下颌缘提升。会员折扣后28600元，已全款支付。',
        responsible: { role: 'CONSULTANT', name: '张咨询师' }
      },
      {
        action: ACTION_TYPES.WRITE_OFF_TREATMENT,
        operator: '赵助理',
        operatorRole: 'DOCTOR_ASSISTANT',
        timestamp: '2026-05-10 15:30:00',
        content: '核销第一次治疗：太阳穴注射乔雅登雅致2ml。客户术中配合良好，无不适。',
        responsible: { role: 'DOCTOR_ASSISTANT', name: '赵助理' }
      },
      {
        action: ACTION_TYPES.SUBMIT_REFUND,
        operator: '刘先生（客户）',
        operatorRole: 'CUSTOMER',
        timestamp: '2026-05-18 14:20:00',
        content: '客户提交退款："打了和没打一样，要求全额退款"。无照片、无医疗证明材料。',
        responsible: { role: 'CONSULTANT', name: '张咨询师' }
      },
      {
        action: ACTION_TYPES.REQUEST_SUPPLEMENT,
        operator: '李客服',
        operatorRole: 'CUSTOMER_SERVICE',
        timestamp: '2026-05-18 16:00:00',
        content: '材料不全，要求客户补充：① 正面/侧面45°/侧面90°近期照片各一张；② 说明"效果不明显"的具体部位。补录时限3天。',
        responsible: { role: 'CUSTOMER_SERVICE', name: '李客服' }
      },
      {
        action: ACTION_TYPES.SUBMIT_SUPPLEMENT,
        operator: '刘先生（客户）',
        operatorRole: 'CUSTOMER',
        timestamp: '2026-05-20 10:00:00',
        content: '客户补充照片3张，但角度不标准，且未提供具体不满意部位说明。',
        responsible: { role: 'CUSTOMER_SERVICE', name: '李客服' }
      },
      {
        action: ACTION_TYPES.NEGOTIATE_REFUND,
        operator: '李客服',
        operatorRole: 'CUSTOMER_SERVICE',
        timestamp: '2026-05-22 14:00:00',
        content: '组织三方沟通（客户+咨询师+医疗总监）。医疗总监查看前后照片认为填充到位，客户主观感受偏差。建议客户1个月后复查再评估。',
        responsible: { role: 'CUSTOMER_SERVICE', name: '李客服' }
      },
      {
        action: ACTION_TYPES.REJECT_REFUND,
        operator: '王总监（医疗）',
        operatorRole: 'MEDICAL_DIRECTOR',
        timestamp: '2026-05-25 09:30:00',
        content: '驳回退款申请。理由：① 已完成一次治疗，医疗操作合规；② 合同约定效果评估需30天；③ 客户同意继续完成剩余下颌缘提升疗程。',
        responsible: { role: 'DOCTOR_ASSISTANT', name: '赵助理' },
        transferNote: '退款驳回，转回医疗端。请赵助理跟进客户剩余疗程核销，务必做好沟通记录。'
      }
    ])
  },
  {
    id: 'ORD-20260501-003',
    flowType: FLOW_TYPES.ARCHIVED,
    flowLabel: '最终归档样例',
    customerName: '陈女士',
    phone: '137****8899',
    age: 28,
    projectName: '皮秒祛斑 3次疗程',
    totalAmount: 9800,
    paidAmount: 9800,
    refundAmount: 0,
    treatmentCount: 3,
    treatedCount: 3,
    currentStatus: ORDER_STATUS.COMPLETED.value,
    currentResponsible: null,
    consultant: '吴咨询师',
    doctor: '郑医生',
    doctorAssistant: '孙助理',
    customerService: '李客服',
    createdAt: '2026-03-15 11:00:00',
    consultationRecord: {
      content: '客户面颊部黄褐斑，建议皮秒3次疗程，间隔1个月。告知色素沉着风险，术后需严格防晒。',
      images: ['melasma-before.jpg']
    },
    quotation: {
      items: [
        { name: '皮秒祛斑 单次', amount: 3800, quantity: 3 },
        { name: '修复面膜', amount: 280, quantity: 3 }
      ],
      discount: '疗程价9800元（含面膜）'
    },
    postopVisits: [
      { date: '2026-03-17', content: '术后2天，轻微红肿消退，客户遵医嘱护理。' },
      { date: '2026-04-18', content: '第二次治疗后1周回访，色斑明显变淡，客户满意。' },
      { date: '2026-05-20', content: '第三次治疗后2周回访，客户反馈色斑基本消退，建议半年后复查。' }
    ],
    refundReason: null,
    refundNegotiation: null,
    history: generateHistory([
      {
        action: ACTION_TYPES.CREATE_ORDER,
        operator: '吴咨询师',
        operatorRole: 'CONSULTANT',
        timestamp: '2026-03-15 11:00:00',
        content: '创建订单：皮秒祛斑3次疗程，金额9800元。客户已全款支付。',
        responsible: { role: 'CONSULTANT', name: '吴咨询师' }
      },
      {
        action: ACTION_TYPES.WRITE_OFF_TREATMENT,
        operator: '孙助理',
        operatorRole: 'DOCTOR_ASSISTANT',
        timestamp: '2026-03-15 15:00:00',
        content: '核销第1次皮秒治疗。客户无不适反应。',
        responsible: { role: 'DOCTOR_ASSISTANT', name: '孙助理' }
      },
      {
        action: ACTION_TYPES.WRITE_OFF_TREATMENT,
        operator: '孙助理',
        operatorRole: 'DOCTOR_ASSISTANT',
        timestamp: '2026-04-17 14:00:00',
        content: '核销第2次皮秒治疗。恢复良好，色斑改善明显。',
        responsible: { role: 'DOCTOR_ASSISTANT', name: '孙助理' }
      },
      {
        action: ACTION_TYPES.WRITE_OFF_TREATMENT,
        operator: '孙助理',
        operatorRole: 'DOCTOR_ASSISTANT',
        timestamp: '2026-05-18 14:30:00',
        content: '核销第3次皮秒治疗。疗程全部完成。',
        responsible: { role: 'DOCTOR_ASSISTANT', name: '孙助理' }
      },
      {
        action: ACTION_TYPES.ARCHIVE,
        operator: '系统',
        operatorRole: 'SYSTEM',
        timestamp: '2026-06-01 00:00:00',
        content: '疗程全部完成，客户满意，自动归档。所有资料永久保存。',
        responsible: null
      }
    ])
  },
  {
    id: 'ORD-20260530-004',
    flowType: FLOW_TYPES.PROBLEM,
    flowLabel: '待补录样例',
    customerName: '周女士',
    phone: '136****5566',
    age: 35,
    projectName: '线雕面部提升',
    totalAmount: 32000,
    paidAmount: 32000,
    refundAmount: 32000,
    treatmentCount: 1,
    treatedCount: 0,
    currentStatus: ORDER_STATUS.REFUND_SUPPLEMENT.value,
    currentResponsible: {
      role: 'CONSULTANT',
      name: '王咨询师',
      transferFrom: null
    },
    consultant: '王咨询师',
    doctor: '李医生',
    doctorAssistant: '刘助理',
    customerService: '李客服',
    createdAt: '2026-05-25 16:00:00',
    consultationRecord: {
      content: '客户中下面部松弛，推荐大V线+小线组合提升。告知线材为可吸收PPDO，维持时间约1年。',
      images: []
    },
    quotation: {
      items: [
        { name: '大V线 6根', amount: 6000, quantity: 4 },
        { name: '小线 30根', amount: 200, quantity: 30 },
        { name: '麻醉费', amount: 800, quantity: 1 }
      ],
      discount: '活动价32000元'
    },
    postopVisits: [],
    refundReason: '客户支付后次日称"家里人不同意"要求退款，未提供任何材料。',
    refundNegotiation: {
      customerRequest: '全额退款32000元',
      hospitalPlan: '按合同约定，客户单方面违约需扣除30%违约金9600元。',
      finalAgreement: null
    },
    history: generateHistory([
      {
        action: ACTION_TYPES.CREATE_ORDER,
        operator: '王咨询师',
        operatorRole: 'CONSULTANT',
        timestamp: '2026-05-25 16:00:00',
        content: '创建订单：线雕面部提升，金额32000元。客户已全款支付，预约3天后治疗。',
        responsible: { role: 'CONSULTANT', name: '王咨询师' }
      },
      {
        action: ACTION_TYPES.SUBMIT_REFUND,
        operator: '周女士（客户）',
        operatorRole: 'CUSTOMER',
        timestamp: '2026-05-26 10:00:00',
        content: '客户来电要求退款，原因：家里人不同意做。未提供书面申请及相关材料。',
        responsible: { role: 'CONSULTANT', name: '王咨询师' }
      },
      {
        action: ACTION_TYPES.REQUEST_SUPPLEMENT,
        operator: '李客服',
        operatorRole: 'CUSTOMER_SERVICE',
        timestamp: '2026-05-26 14:00:00',
        content: '需补充材料：① 客户签字的书面退款申请；② 若为医疗原因需提供相关医学证明。补录时限：3天，逾期将驳回申请。',
        responsible: { role: 'CONSULTANT', name: '王咨询师' },
        transferNote: '请王咨询师联系客户补充材料，材料齐全后再进入审核。'
      }
    ])
  }
]

export const users = {
  CONSULTANT: { name: '王咨询师', role: 'CONSULTANT', avatar: '👩‍💼' },
  DOCTOR_ASSISTANT: { name: '赵助理', role: 'DOCTOR_ASSISTANT', avatar: '👩‍⚕️' },
  CUSTOMER_SERVICE: { name: '李客服', role: 'CUSTOMER_SERVICE', avatar: '👩‍💻' }
}
