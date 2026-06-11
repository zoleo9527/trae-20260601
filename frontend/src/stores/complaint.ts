import { reactive } from 'vue'
import type { Complaint, OperationLog, BrandFeedback, ComplaintStatus, RoleKey, ResponsibilityParty } from '@/types'
import { ROLES } from '@/types'

function roleUser(key: RoleKey): string {
  return ROLES.find(r => r.key === key)?.user || key
}

function roleLabel(key: RoleKey): string {
  return ROLES.find(r => r.key === key)?.label || key
}

const now = new Date()
const daysAgo = (d: number) => {
  const date = new Date(now)
  date.setDate(date.getDate() - d)
  return date.toISOString()
}

const initialComplaints: Complaint[] = [
  {
    id: '1',
    complaintNo: 'TS-20260610-001',
    status: 'pending_supervisor',
    type: 'refund',
    customerName: '刘女士',
    customerPhone: '138****8821',
    brand: '雅诗兰黛',
    counter: 'A座1F-12',
    floor: 'A座1F',
    productName: '小棕瓶精华50ml',
    productPrice: 1080,
    purchaseDate: '2026-06-01',
    complaintDate: '2026-06-09',
    complaintContent: '顾客使用3天后出现皮肤红肿过敏现象，要求全额退款。已提供医院皮肤科诊断证明，显示接触性皮炎。',
    refundAmount: 1080,
    currentHandlerRole: 'supervisor',
    currentHandler: roleUser('supervisor'),
    submitter: roleUser('manager'),
    submitterRole: 'manager',
    submitTime: daysAgo(1),
    recheckCount: 0,
    returnCount: 0,
    operations: [
      {
        id: 'op-1-1',
        timestamp: daysAgo(2),
        operator: roleUser('manager'),
        role: 'manager',
        action: '创建客诉单',
        remark: '顾客到店投诉，初步登记信息，顾客情绪较激动。'
      },
      {
        id: 'op-1-2',
        timestamp: daysAgo(1),
        operator: roleUser('manager'),
        role: 'manager',
        action: '提交客诉单',
        remark: '已收集诊断证明照片3张、购物小票，提交楼层主管审核。附件：诊断证明.jpg、购物小票.jpg'
      }
    ],
    brandFeedbackList: []
  },
  {
    id: '2',
    complaintNo: 'TS-20260609-003',
    status: 'returned_to_manager',
    type: 'exchange',
    customerName: '陈先生',
    customerPhone: '139****5566',
    brand: 'Nike',
    counter: 'B座2F-08',
    floor: 'B座2F',
    productName: 'Air Max跑步鞋',
    productPrice: 899,
    purchaseDate: '2026-05-28',
    complaintDate: '2026-06-08',
    complaintContent: '穿着一周鞋底开胶，要求换货。顾客为VIP会员，此前有过一次换货记录。',
    exchangeProduct: '同型号同尺码新款',
    currentHandlerRole: 'manager',
    currentHandler: roleUser('manager'),
    submitter: roleUser('manager'),
    submitterRole: 'manager',
    submitTime: daysAgo(3),
    recheckCount: 0,
    returnCount: 1,
    operations: [
      {
        id: 'op-2-1',
        timestamp: daysAgo(3),
        operator: roleUser('manager'),
        role: 'manager',
        action: '创建并提交客诉单',
        remark: '顾客携带原鞋到店，鞋底开胶约2cm，已拍照留证。'
      },
      {
        id: 'op-2-2',
        timestamp: daysAgo(2),
        operator: roleUser('supervisor'),
        role: 'supervisor',
        action: '退回柜长补录',
        remark: '缺少商品原包装盒照片和会员消费记录截图，请补充后重新提交。同时建议与顾客确认换货的具体型号和尺码。'
      }
    ],
    brandFeedbackList: []
  },
  {
    id: '3',
    complaintNo: 'TS-20260608-005',
    status: 'pending_brand',
    type: 'refund',
    customerName: '张女士',
    customerPhone: '137****2233',
    brand: '蔻驰',
    counter: 'A座1F-05',
    floor: 'A座1F',
    productName: '真皮手提包',
    productPrice: 4580,
    purchaseDate: '2026-04-15',
    complaintDate: '2026-06-06',
    complaintContent: '包包使用不到两个月，手提带五金件严重褪色，怀疑假货。要求退款并赔偿。已投诉至12315，态度强硬。',
    refundAmount: 4580,
    currentHandlerRole: 'superintendent',
    currentHandler: roleUser('superintendent'),
    submitter: roleUser('manager'),
    submitterRole: 'manager',
    submitTime: daysAgo(4),
    recheckCount: 0,
    returnCount: 0,
    operations: [
      {
        id: 'op-3-1',
        timestamp: daysAgo(5),
        operator: roleUser('manager'),
        role: 'manager',
        action: '创建客诉单',
        remark: '顾客情绪非常激动，扬言要找媒体曝光。已安抚并提供饮品。'
      },
      {
        id: 'op-3-2',
        timestamp: daysAgo(5),
        operator: roleUser('manager'),
        role: 'manager',
        action: '提交楼层主管',
        remark: '已拍褪色部位细节图6张，附购买凭证。'
      },
      {
        id: 'op-3-3',
        timestamp: daysAgo(4),
        operator: roleUser('supervisor'),
        role: 'supervisor',
        action: '审核通过，转交品牌督导',
        remark: '情况属实，五金件确实存在质量问题。鉴于顾客已投诉至12315，请品牌方尽快给出处理方案。建议提供质检报告。'
      }
    ],
    brandFeedbackList: []
  },
  {
    id: '4',
    complaintNo: 'TS-20260605-002',
    status: 'brand_feedback',
    type: 'repair',
    customerName: '赵先生',
    customerPhone: '186****9988',
    brand: '浪琴',
    counter: 'A座1F-02',
    floor: 'A座1F',
    productName: '名匠系列机械表',
    productPrice: 18600,
    purchaseDate: '2025-12-20',
    complaintDate: '2026-06-05',
    complaintContent: '手表走时不准，每天快约15秒。购表半年，在保修期内。',
    currentHandlerRole: 'supervisor',
    currentHandler: roleUser('supervisor'),
    submitter: roleUser('manager'),
    submitterRole: 'manager',
    submitTime: daysAgo(6),
    recheckCount: 0,
    returnCount: 0,
    operations: [
      {
        id: 'op-4-1',
        timestamp: daysAgo(6),
        operator: roleUser('manager'),
        role: 'manager',
        action: '创建客诉单',
        remark: '顾客为高端VIP，购买多块手表。本次希望免费维修并补偿保养服务。'
      },
      {
        id: 'op-4-2',
        timestamp: daysAgo(6),
        operator: roleUser('manager'),
        role: 'manager',
        action: '提交楼层主管',
        remark: '附保卡、购表凭证，手表当前走时检测记录。'
      },
      {
        id: 'op-4-3',
        timestamp: daysAgo(5),
        operator: roleUser('supervisor'),
        role: 'supervisor',
        action: '审核通过，转交品牌督导',
        remark: '高端客户，建议品牌方妥善处理。可考虑赠送一次保养服务维护客情。'
      },
      {
        id: 'op-4-4',
        timestamp: daysAgo(4),
        operator: roleUser('superintendent'),
        role: 'superintendent',
        action: '联系品牌方',
        remark: '已发邮件至品牌售后，等待反馈。品牌方表示3个工作日内回复。'
      }
    ],
    brandFeedbackList: [
      {
        id: 'bf-4-1',
        timestamp: daysAgo(1),
        operator: `浪琴品牌售后-陈经理`,
        feedbackContent: '经品牌技术部门检测，该手表摆轮存在轻微偏移，属于保修期内正常质量问题。',
        responsibility: 'brand',
        handlingSuggestion: '1. 免费维修并出具官方检测报告；2. 赠送2次免费保养服务（价值约2000元）；3. 维修周期约7-10个工作日。已与客户电话沟通，客户表示接受。',
        attachments: ['品牌检测报告.pdf', '保养服务确认单.jpg']
      }
    ]
  },
  {
    id: '5',
    complaintNo: 'TS-20260603-007',
    status: 'returned_to_supervisor',
    type: 'refund',
    customerName: '吴女士',
    customerPhone: '135****7711',
    brand: '优衣库',
    counter: 'C座1F-15',
    floor: 'C座1F',
    productName: '羽绒服',
    productPrice: 799,
    purchaseDate: '2026-01-10',
    complaintDate: '2026-06-02',
    complaintContent: '冬季穿着后发现严重跑毛，内衬全是羽绒。购买时专柜未告知此款跑毛问题，涉嫌隐瞒。',
    refundAmount: 500,
    currentHandlerRole: 'supervisor',
    currentHandler: roleUser('supervisor'),
    submitter: roleUser('manager'),
    submitterRole: 'manager',
    submitTime: daysAgo(7),
    recheckCount: 1,
    returnCount: 1,
    operations: [
      {
        id: 'op-5-1',
        timestamp: daysAgo(9),
        operator: roleUser('manager'),
        role: 'manager',
        action: '创建客诉单',
        remark: '顾客带来了跑毛的衣服，照片显示内胆确实有大量羽绒钻出。'
      },
      {
        id: 'op-5-2',
        timestamp: daysAgo(9),
        operator: roleUser('manager'),
        role: 'manager',
        action: '提交楼层主管',
        remark: '顾客要求全额退款，但衣服已穿着5个月，建议协商部分退款。'
      },
      {
        id: 'op-5-3',
        timestamp: daysAgo(8),
        operator: roleUser('supervisor'),
        role: 'supervisor',
        action: '审核通过，转交品牌督导',
        remark: '同意部分退款方案，请品牌方确认责任比例。'
      },
      {
        id: 'op-5-4',
        timestamp: daysAgo(7),
        operator: roleUser('superintendent'),
        role: 'superintendent',
        action: '收到品牌反馈',
        remark: '品牌方承认该批次羽绒服跑毛率偏高，承担主要责任。建议退款500元。'
      }
    ],
    brandFeedbackList: [
      {
        id: 'bf-5-1',
        timestamp: daysAgo(7),
        operator: '优衣库区域-刘督导',
        feedbackContent: '该款羽绒服2025冬季批次确实存在工艺问题，品牌方已知悉并进行了改进。',
        responsibility: 'brand',
        handlingSuggestion: '品牌承担70%责任，建议退款500元（原价799元约63%）。专柜可额外赠送300元购物券。如顾客不同意，可升级至品牌总部处理。'
      }
    ]
  },
  {
    id: '6',
    complaintNo: 'TS-20260601-001',
    status: 'completed',
    type: 'exchange',
    customerName: '孙女士',
    customerPhone: '158****3344',
    brand: '周大福',
    counter: 'A座1F-08',
    floor: 'A座1F',
    productName: '足金项链',
    productPrice: 12800,
    purchaseDate: '2026-05-20',
    complaintDate: '2026-05-28',
    complaintContent: '项链佩戴一周扣头松动，差点丢失。要求更换同款新品。',
    exchangeProduct: '同款式同克重新品',
    currentHandlerRole: 'manager',
    currentHandler: roleUser('manager'),
    submitter: roleUser('manager'),
    submitterRole: 'manager',
    submitTime: daysAgo(14),
    recheckCount: 1,
    returnCount: 0,
    operations: [
      {
        id: 'op-6-1',
        timestamp: daysAgo(14),
        operator: roleUser('manager'),
        role: 'manager',
        action: '创建并提交客诉单',
        remark: '顾客为新婚客户，项链是520购买的，对质量问题非常不满。'
      },
      {
        id: 'op-6-2',
        timestamp: daysAgo(13),
        operator: roleUser('supervisor'),
        role: 'supervisor',
        action: '审核通过，转交品牌督导',
        remark: '贵重商品质量问题，请品牌方尽快处理。'
      },
      {
        id: 'op-6-3',
        timestamp: daysAgo(11),
        operator: roleUser('superintendent'),
        role: 'superintendent',
        action: '收到品牌反馈',
        remark: '品牌方同意免费换货，并额外赠送一条银手链作为补偿。'
      },
      {
        id: 'op-6-4',
        timestamp: daysAgo(10),
        operator: roleUser('supervisor'),
        role: 'supervisor',
        action: '复核通过',
        remark: '方案合理，同意执行。请柜长联系顾客到店换货。'
      },
      {
        id: 'op-6-5',
        timestamp: daysAgo(9),
        operator: roleUser('manager'),
        role: 'manager',
        action: '处理完成',
        remark: '顾客已到店完成换货，对品牌方赠送的手链表示满意。投诉已圆满解决。'
      }
    ],
    brandFeedbackList: [
      {
        id: 'bf-6-1',
        timestamp: daysAgo(12),
        operator: '周大福-区域王经理',
        feedbackContent: '经排查，该款项链弹簧扣确实存在工艺缺陷，批次号CD20260515。',
        responsibility: 'brand',
        handlingSuggestion: '1. 免费更换同款式同克重新品一条；2. 额外赠送品牌银手链一条（价值约800元）作为歉意；3. 同批次商品已通知全国专柜排查。顾客对此方案非常满意，已签字确认。'
      }
    ]
  }
]

interface ComplaintState {
  list: Complaint[]
}

const state = reactive<ComplaintState>({
  list: [...initialComplaints]
})

export function useComplaintStore() {
  function getList() {
    return state.list
  }

  function getById(id: string): Complaint | undefined {
    return state.list.find(c => c.id === id)
  }

  function addOperation(complaintId: string, log: Omit<OperationLog, 'id'>) {
    const complaint = getById(complaintId)
    if (!complaint) return
    complaint.operations.push({
      ...log,
      id: `op-${complaintId}-${complaint.operations.length + 1}-${Date.now()}`
    })
  }

  function addBrandFeedback(complaintId: string, feedback: Omit<BrandFeedback, 'id'>) {
    const complaint = getById(complaintId)
    if (!complaint) return
    complaint.brandFeedbackList.push({
      ...feedback,
      id: `bf-${complaintId}-${complaint.brandFeedbackList.length + 1}-${Date.now()}`
    })
  }

  function updateStatus(complaintId: string, status: ComplaintStatus, handlerRole: RoleKey) {
    const complaint = getById(complaintId)
    if (!complaint) return
    complaint.status = status
    complaint.currentHandlerRole = handlerRole
    complaint.currentHandler = roleUser(handlerRole)
  }

  function incrementReturnCount(complaintId: string) {
    const complaint = getById(complaintId)
    if (!complaint) return
    complaint.returnCount += 1
  }

  function incrementRecheckCount(complaintId: string) {
    const complaint = getById(complaintId)
    if (!complaint) return
    complaint.recheckCount += 1
  }

  function createComplaint(
    data: Partial<Complaint> & {
      complaintNo: string
      type: Complaint['type']
      customerName: string
      customerPhone: string
      brand: string
      counter: string
      floor: string
      productName: string
      productPrice: number
      purchaseDate: string
      complaintDate: string
      complaintContent: string
    },
    submitterRole: RoleKey
  ): Complaint | null {
    if (submitterRole !== 'manager') {
      console.warn(`[createComplaint] 仅柜长(manager)可发起客诉单，当前角色:${submitterRole}`)
      return null
    }

    const timestamp = new Date().toISOString()
    const submitterName = roleUser(submitterRole)

    const newComplaint: Complaint = {
      id: String(Date.now()),
      status: 'pending_supervisor',
      currentHandlerRole: 'supervisor',
      currentHandler: roleUser('supervisor'),
      submitter: submitterName,
      submitterRole,
      submitTime: timestamp,
      recheckCount: 0,
      returnCount: 0,
      operations: [
        {
          id: `op-new-${Date.now()}`,
          timestamp,
          operator: submitterName,
          role: submitterRole,
          action: '创建并提交客诉单',
          remark: data.complaintContent?.slice(0, 100) || ''
        }
      ],
      brandFeedbackList: [],
      ...data
    }
    state.list.unshift(newComplaint)
    return newComplaint
  }

  function getLatestRecheck(c: Complaint): OperationLog | undefined {
    return c.operations
      .filter(o => o.action.includes('复核通过'))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }

  function getLatestReturn(c: Complaint): OperationLog | undefined {
    return c.operations
      .filter(o => o.action.includes('退回'))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }

  function getLatestBrandFeedbackOp(c: Complaint): OperationLog | undefined {
    return c.operations
      .filter(o => o.action.includes('品牌反馈') || o.action.includes('提交品牌反馈'))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }

  function getRecheckList(c: Complaint): OperationLog[] {
    return c.operations
      .filter(o => o.action.includes('复核通过'))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  function getReturnList(c: Complaint): OperationLog[] {
    return c.operations
      .filter(o => o.action.includes('退回'))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  return {
    state,
    getList,
    getById,
    addOperation,
    addBrandFeedback,
    updateStatus,
    incrementReturnCount,
    incrementRecheckCount,
    createComplaint,
    roleUser,
    roleLabel,
    getLatestRecheck,
    getLatestReturn,
    getLatestBrandFeedbackOp,
    getRecheckList,
    getReturnList
  }
}
