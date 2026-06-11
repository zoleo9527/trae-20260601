import type { LeaseRecord, LeaseStatus, StatusHistory, User } from '~/types/lease'
import { USERS } from '~/utils/constants'

const uid = () => Math.random().toString(36).slice(2, 10)
const dt = (daysAgo: number, hour: number, minute: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function makeHistory(
  fromStatus: LeaseStatus | null,
  toStatus: LeaseStatus,
  userId: string,
  time: string,
  remark: string,
  rejectReason?: string
): StatusHistory {
  const user = USERS[userId]
  return {
    id: uid(),
    fromStatus,
    toStatus,
    operator: user,
    operatorRole: user.role,
    timestamp: time,
    remark,
    rejectReason
  }
}

export const MOCK_RECORDS: LeaseRecord[] = [
  {
    id: 'R001',
    recordNo: 'L-2026-0601',
    companyName: '云瀚科技有限公司',
    contactName: '刘浩然',
    contactPhone: '138****5521',
    contactPosition: '行政总监',
    building: 'A栋',
    floor: '12F',
    room: '1201-1204',
    area: 680,
    industry: '人工智能',
    intendedUse: '研发+办公',
    currentStatus: 'contract_pending',
    plan: {
      monthlyRent: 75.0,
      rentUnit: '元/㎡/月',
      freeRentMonths: 3,
      freeRentRemark: '合同期前3个月免租，其中1个月装修免租+2个月经营免租',
      leaseYears: 5,
      depositMonths: 3,
      increaseRate: '第三年起每年递增5%',
      paymentMethod: '季度支付，提前15天',
      decorationDays: 60,
      earlyTerminationPenalty: '剩余租期租金总额的20%'
    },
    contract: {
      partyA: '产业园区运营管理有限公司',
      partyB: '云瀚科技有限公司',
      legalRepresentative: '李建国',
      signers: ['李建国', '刘浩然']
    },
    decoration: {
      requirements: ['办公区吊顶改造', '强弱电综合布线', '玻璃隔断12间', '独立空调机组4台'],
      risks: ['原有消防喷淋需改造']
    },
    createUser: USERS.chenjie,
    createTime: dt(10, 9, 30),
    currentHandler: USERS.zhaowei,
    currentHandlerRole: 'manager',
    statusHistory: [
      makeHistory(null, 'lead_created', 'chenjie', dt(10, 9, 30), '客户经园区企业推荐，意向12层整层东南朝向'),
      makeHistory('lead_created', 'lead_following', 'chenjie', dt(9, 14, 0), '首次带看，客户反馈面积合适，关注免租期和装修时间'),
      makeHistory('lead_following', 'plan_pending', 'chenjie', dt(7, 11, 20), '根据客户需求提交租赁方案，申请5年租期+3个月免租'),
      makeHistory('plan_pending', 'plan_rejected', 'zhaowei', dt(6, 16, 45), '方案初次审核', '免租期3个月过长，建议调整为2个月；装修期需明确是否含在免租期内'),
      makeHistory('plan_rejected', 'plan_pending', 'chenjie', dt(5, 10, 15), '与客户沟通后调整：免租期2.5个月（装修1.5个月+经营1个月），租期仍5年'),
      makeHistory('plan_pending', 'plan_approved', 'zhaowei', dt(4, 15, 30), '免租期方案合理，通过；合同起草注意装修进场需物业工程联合验收'),
      makeHistory('plan_approved', 'contract_pending', 'chenjie', dt(2, 13, 0), '合同已起草完成，核心条款与方案一致，提交经理审批')
    ],
    supplements: [
      {
        id: uid(),
        content: '客户补充要求：合同到期后享有优先续租权，续租涨幅不超过8%',
        author: USERS.chenjie,
        authorRole: 'supervisor',
        timestamp: dt(3, 17, 20)
      },
      {
        id: uid(),
        content: '已告知优先续租权条款为园区标准条款，会写入合同补充条款中',
        author: USERS.sunli,
        authorRole: 'supervisor',
        timestamp: dt(2, 9, 30)
      }
    ]
  },
  {
    id: 'R002',
    recordNo: 'L-2026-0598',
    companyName: '硕恒生物科技',
    contactName: '周雪梅',
    contactPhone: '139****7788',
    contactPosition: '总经理助理',
    building: 'B栋',
    floor: '6F',
    room: '605-607',
    area: 420,
    industry: '生物医药',
    intendedUse: '实验室+办公',
    currentStatus: 'decoration_pending',
    plan: {
      monthlyRent: 82.0,
      rentUnit: '元/㎡/月',
      freeRentMonths: 2,
      freeRentRemark: '装修免租1.5个月 + 经营免租0.5个月',
      leaseYears: 3,
      depositMonths: 2,
      increaseRate: '第二年递增6%',
      paymentMethod: '半年支付',
      decorationDays: 45,
      earlyTerminationPenalty: '3个月租金'
    },
    contract: {
      contractNo: 'HT-2026-B605',
      signedDate: dt(1, 10, 0),
      startDate: '2026-06-15',
      endDate: '2029-06-14',
      partyA: '产业园区运营管理有限公司',
      partyB: '硕恒生物科技（上海）有限公司',
      legalRepresentative: '王博士',
      signers: ['李建国', '王博士']
    },
    decoration: {
      applyDate: dt(0, 8, 30),
      expectedStartDate: '2026-06-15',
      expectedCompleteDate: '2026-07-30',
      requirements: ['实验室通风系统', '三级污水处理', '防爆电路', '12小时应急供电'],
      risks: ['通风井需穿梁，需结构验算', '污水处理设备占地超出租赁红线1.2㎡']
    },
    createUser: USERS.sunli,
    createTime: dt(18, 10, 0),
    currentHandler: USERS.wanggang,
    currentHandlerRole: 'property_engineer',
    statusHistory: [
      makeHistory(null, 'lead_created', 'sunli', dt(18, 10, 0), '客户从官网入驻申请渠道进入'),
      makeHistory('lead_created', 'lead_following', 'sunli', dt(17, 14, 30), '两次带看，客户明确需要实验室排水、通风条件'),
      makeHistory('lead_following', 'plan_pending', 'sunli', dt(14, 11, 0), '提交3年方案，B栋6层为生物产业聚集区'),
      makeHistory('plan_pending', 'plan_approved', 'zhaowei', dt(13, 16, 0), '符合产业导向，通过；装修方案需物业重点审核'),
      makeHistory('plan_approved', 'contract_pending', 'sunli', dt(10, 15, 0), '合同待审，含物业装修管理附件'),
      makeHistory('contract_pending', 'contract_approved', 'zhaowei', dt(1, 10, 0), '合同签订完成，已移交物业工程启动装修审批流程'),
      makeHistory('contract_approved', 'decoration_pending', 'wanggang', dt(0, 8, 30), '收到装修申请与设计方案，需7个工作日内完成工程审核')
    ],
    supplements: [
      {
        id: uid(),
        content: '污水处理设备占地问题已与相邻608室客户沟通，同意临时借用1.5㎡，需三方协议',
        author: USERS.sunli,
        authorRole: 'supervisor',
        timestamp: dt(0, 14, 0)
      }
    ]
  },
  {
    id: 'R003',
    recordNo: 'L-2026-0603',
    companyName: '瀚海数字传媒',
    contactName: '马可欣',
    contactPhone: '186****2231',
    contactPosition: '运营副总',
    building: 'C栋',
    floor: '3F',
    room: '301',
    area: 260,
    industry: '文化传媒',
    intendedUse: '直播间+办公',
    currentStatus: 'plan_pending',
    plan: {
      monthlyRent: 68.0,
      rentUnit: '元/㎡/月',
      freeRentMonths: 4,
      freeRentRemark: '客户要求4个月免租（含装修2个月），称行业惯例',
      leaseYears: 2,
      depositMonths: 2,
      increaseRate: '无递增',
      paymentMethod: '月付',
      decorationDays: 30,
      earlyTerminationPenalty: '2个月租金'
    },
    contract: {
      partyA: '产业园区运营管理有限公司',
      partyB: '瀚海数字传媒有限公司',
      legalRepresentative: '马可欣',
      signers: []
    },
    decoration: {
      requirements: ['直播间声学装修', '双层隔音玻璃', '独立供电回路'],
      risks: []
    },
    createUser: USERS.chenjie,
    createTime: dt(3, 15, 30),
    currentHandler: USERS.zhaowei,
    currentHandlerRole: 'manager',
    statusHistory: [
      makeHistory(null, 'lead_created', 'chenjie', dt(3, 15, 30), '写字楼中介转介，客户急租，要求6月底前进场'),
      makeHistory('lead_created', 'lead_following', 'chenjie', dt(2, 10, 30), '带看C栋3层，对层高和承重满意，但要求免租期长'),
      makeHistory('lead_following', 'plan_pending', 'chenjie', dt(1, 16, 0), '按客户要求提交2年+4个月免租方案，备注待经理审核')
    ],
    supplements: []
  },
  {
    id: 'R004',
    recordNo: 'L-2026-0595',
    companyName: '磐峰智造科技',
    contactName: '胡建军',
    contactPhone: '137****9988',
    contactPosition: '董事长秘书',
    building: 'A栋',
    floor: '8F',
    room: '整层',
    area: 1250,
    industry: '智能制造',
    intendedUse: '总部办公',
    currentStatus: 'contract_rejected',
    plan: {
      monthlyRent: 72.0,
      rentUnit: '元/㎡/月',
      freeRentMonths: 4,
      freeRentRemark: '前4个月免租（2个月装修+2个月经营），第五年额外再免1个月',
      leaseYears: 5,
      depositMonths: 6,
      increaseRate: '第四年起递增6%',
      paymentMethod: '年度支付',
      decorationDays: 90,
      earlyTerminationPenalty: '6个月租金'
    },
    contract: {
      partyA: '产业园区运营管理有限公司',
      partyB: '磐峰智造科技股份有限公司',
      legalRepresentative: '胡建军',
      signers: []
    },
    decoration: {
      requirements: ['整层承重加固', 'VIP电梯直达', '屋顶基站预留'],
      risks: ['屋顶基站需规划审批']
    },
    createUser: USERS.sunli,
    createTime: dt(30, 9, 0),
    currentHandler: USERS.sunli,
    currentHandlerRole: 'supervisor',
    statusHistory: [
      makeHistory(null, 'lead_created', 'sunli', dt(30, 9, 0), '区招商局重点项目引荐，客户拟整层租赁'),
      makeHistory('lead_created', 'lead_following', 'sunli', dt(28, 10, 0), '董事长亲自考察园区，会谈2小时'),
      makeHistory('lead_following', 'plan_pending', 'sunli', dt(25, 14, 0), '提交5年整层方案，年付优惠'),
      makeHistory('plan_pending', 'plan_approved', 'zhaowei', dt(22, 16, 0), '重大项目，已上报总经理特批'),
      makeHistory('plan_approved', 'contract_pending', 'sunli', dt(15, 10, 0), '合同拟稿中，含屋顶基站补充协议'),
      makeHistory('contract_pending', 'contract_rejected', 'zhaowei', dt(5, 17, 30), '合同条款审核', '1）屋顶基站条款需明确运营商责任与安全评估；2）免租期"第五年额外再免1个月"表述模糊，需明确触发条件；3）承重加固费用承担未写清；4）年付优惠价格未附测算表')
    ],
    supplements: [
      {
        id: uid(),
        content: '已将经理意见反馈公司法务，正在修订合同条款，承重加固由我方承担30%',
        author: USERS.sunli,
        authorRole: 'supervisor',
        timestamp: dt(4, 10, 30)
      },
      {
        id: uid(),
        content: '屋顶基站规划审批流程已咨询城管部门，预计需15个工作日',
        author: USERS.wanggang,
        authorRole: 'property_engineer',
        timestamp: dt(3, 15, 0)
      }
    ]
  },
  {
    id: 'R005',
    recordNo: 'L-2026-0589',
    companyName: '明悦教育咨询',
    contactName: '黄晓芬',
    contactPhone: '158****6644',
    contactPosition: '行政主管',
    building: 'C栋',
    floor: '5F',
    room: '503',
    area: 180,
    industry: '教育培训',
    intendedUse: '小型培训教室',
    currentStatus: 'completed',
    plan: {
      monthlyRent: 70.0,
      rentUnit: '元/㎡/月',
      freeRentMonths: 1.5,
      freeRentRemark: '1.5个月装修免租',
      leaseYears: 2,
      depositMonths: 2,
      increaseRate: '第二年递增4%',
      paymentMethod: '季度支付',
      decorationDays: 20,
      earlyTerminationPenalty: '2个月租金'
    },
    contract: {
      contractNo: 'HT-2026-C503',
      signedDate: dt(25, 14, 0),
      startDate: '2026-05-01',
      endDate: '2028-04-30',
      partyA: '产业园区运营管理有限公司',
      partyB: '明悦教育咨询有限公司',
      legalRepresentative: '黄晓芬',
      signers: ['李建国', '黄晓芬']
    },
    decoration: {
      applyDate: dt(24, 9, 0),
      planSubmitDate: dt(23, 10, 0),
      approvedDate: dt(21, 15, 0),
      expectedStartDate: '2026-05-05',
      expectedCompleteDate: '2026-05-25',
      engineerInCharge: '张敏',
      requirements: ['6间小教室隔断', '投影设备预埋'],
      risks: []
    },
    createUser: USERS.chenjie,
    createTime: dt(35, 10, 0),
    statusHistory: [
      makeHistory(null, 'lead_created', 'chenjie', dt(35, 10, 0), '园区老租户续租扩租介绍'),
      makeHistory('lead_created', 'lead_following', 'chenjie', dt(34, 14, 0), '快速带看，客户决策简单'),
      makeHistory('lead_following', 'plan_pending', 'chenjie', dt(32, 11, 0), '常规方案无特殊需求'),
      makeHistory('plan_pending', 'plan_approved', 'zhaowei', dt(31, 10, 0), '小面积快速通过'),
      makeHistory('plan_approved', 'contract_pending', 'chenjie', dt(28, 15, 0), '合同标准模板'),
      makeHistory('contract_pending', 'contract_approved', 'zhaowei', dt(25, 14, 0), '签署完成'),
      makeHistory('contract_approved', 'decoration_pending', 'zhangmin', dt(24, 9, 0), '装修申请收齐'),
      makeHistory('decoration_pending', 'decoration_approved', 'zhangmin', dt(21, 15, 0), '装修方案通过，无结构改动'),
      makeHistory('decoration_approved', 'completed', 'chenjie', dt(5, 17, 0), '客户已正式入驻，教室正常开课')
    ],
    supplements: []
  },
  {
    id: 'R006',
    recordNo: 'L-2026-0605',
    companyName: '星途新能源汽车',
    contactName: '林芳',
    contactPhone: '188****1122',
    contactPosition: '区域拓展总监',
    building: 'D栋（裙楼）',
    floor: '1F',
    room: '102-103',
    area: 520,
    industry: '新能源汽车',
    intendedUse: '品牌展示厅+交付中心',
    currentStatus: 'lead_following',
    plan: {
      monthlyRent: 0,
      rentUnit: '元/㎡/月',
      freeRentMonths: 0,
      freeRentRemark: '',
      leaseYears: 0,
      depositMonths: 0,
      increaseRate: '',
      paymentMethod: '',
      decorationDays: 0,
      earlyTerminationPenalty: ''
    },
    contract: {
      partyA: '产业园区运营管理有限公司',
      partyB: '星途新能源汽车销售有限公司',
      legalRepresentative: '',
      signers: []
    },
    decoration: {
      requirements: [],
      risks: []
    },
    createUser: USERS.sunli,
    createTime: dt(0, 11, 30),
    currentHandler: USERS.sunli,
    currentHandlerRole: 'supervisor',
    statusHistory: [
      makeHistory(null, 'lead_created', 'sunli', dt(0, 11, 30), '客户主动来电，意向裙楼一层做汽车展厅，需洽谈车位配套'),
      makeHistory('lead_created', 'lead_following', 'sunli', dt(0, 14, 0), '下午带看现场，初步沟通面积需求，车位需协调')
    ],
    supplements: []
  }
]
