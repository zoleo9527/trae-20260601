import { SaleControl, Remark, ControlStage, StageRecord, UserRole, HouseStatus } from '../types';
import { STAGE_MAP, ROLE_MAP } from '../utils/status';
import { generateId } from '../utils/id';
import { houses } from './houses';
import { customers } from './customers';
import { users, user_zhangwei, user_lina, user_wangqiang, user_liufang, user_chenming, user_zhaojing } from './users';

function createRemark(
  content: string,
  source: string,
  sourceName: string,
  operatorId: string,
  operatorName: string,
  operatorRole: string,
  stage: ControlStage,
  timestamp: string,
  inheritedFrom?: string
): Remark {
  return {
    id: `r_${generateId()}`,
    content,
    source,
    sourceName,
    operatorId,
    operatorName,
    operatorRole: operatorRole as UserRole,
    operatorRoleName: ROLE_MAP[operatorRole as keyof typeof ROLE_MAP],
    timestamp,
    stage,
    stageName: STAGE_MAP[stage],
    inheritedFrom,
  };
}

function createStageRecord(
  stage: ControlStage,
  handlerId: string,
  receivedAt: string,
  completedAt?: string,
  remark?: string
): StageRecord {
  const handler = users.find(u => u.id === handlerId)!;
  return {
    stage,
    stageName: STAGE_MAP[stage],
    handlerId,
    handlerName: handler.name,
    handlerRole: handler.role,
    handlerRoleName: handler.roleName,
    receivedAt,
    completedAt,
    remark,
  };
}

function getHandlerIdFromRemark(remarks: Remark[], targetStage: ControlStage): string | undefined {
  const remark = remarks.find(r => r.stage === targetStage);
  return remark?.operatorId;
}

function buildStageHistory(
  stage: ControlStage,
  applicantId: string,
  currentHandlerId: string,
  remarks: Remark[],
  timestamps: { createdAt: string; submittedAt?: string; reviewedAt?: string; lockedAt?: string; completedAt?: string; rejectedAt?: string }
): StageRecord[] {
  const history: StageRecord[] = [];
  const { createdAt, submittedAt, reviewedAt, lockedAt, completedAt, rejectedAt } = timestamps;

  history.push(createStageRecord('application', applicantId, createdAt, submittedAt, remarks.find(r => r.stage === 'application')?.content));

  if (stage !== 'application') {
    const reviewHandlerId = getHandlerIdFromRemark(remarks, 'review') ||
      getHandlerIdFromRemark(remarks, 'rejected') ||
      user_liufang;
    history.push(createStageRecord('review', reviewHandlerId, submittedAt || createdAt, reviewedAt || rejectedAt, remarks.find(r => r.stage === 'review')?.content));
  }

  if (stage === 'lock' || stage === 'completed') {
    const lockHandlerId = getHandlerIdFromRemark(remarks, 'lock') || user_zhaojing;
    history.push(createStageRecord('lock', lockHandlerId, reviewedAt || createdAt, stage === 'completed' ? lockedAt : undefined, remarks.find(r => r.stage === 'lock')?.content));
  }

  if (stage === 'completed') {
    const completedHandlerId = getHandlerIdFromRemark(remarks, 'completed') || user_zhaojing;
    history.push(createStageRecord('completed', completedHandlerId, lockedAt || createdAt, completedAt, remarks.find(r => r.stage === 'completed')?.content));
  }

  if (stage === 'rejected') {
    const rejectHandlerId = getHandlerIdFromRemark(remarks, 'rejected') || user_liufang;
    history.push(createStageRecord('rejected', rejectHandlerId, submittedAt || createdAt, rejectedAt, remarks.find(r => r.stage === 'rejected')?.content));
  }

  return history;
}

function getTimestampsByStage(stage: ControlStage, createdAt: string, updatedAt: string) {
  const base = new Date(createdAt).getTime();
  const timestamps: any = { createdAt };

  switch (stage) {
    case 'application':
      break;
    case 'review':
      timestamps.submittedAt = new Date(base + 30 * 60 * 1000).toISOString();
      break;
    case 'lock':
      timestamps.submittedAt = new Date(base + 30 * 60 * 1000).toISOString();
      timestamps.reviewedAt = new Date(base + 4 * 60 * 60 * 1000).toISOString();
      timestamps.lockedAt = updatedAt;
      break;
    case 'completed':
      timestamps.submittedAt = new Date(base + 30 * 60 * 1000).toISOString();
      timestamps.reviewedAt = new Date(base + 4 * 60 * 60 * 1000).toISOString();
      timestamps.lockedAt = new Date(base + 5 * 60 * 60 * 1000).toISOString();
      timestamps.completedAt = updatedAt;
      break;
    case 'rejected':
      timestamps.submittedAt = new Date(base + 30 * 60 * 1000).toISOString();
      timestamps.rejectedAt = updatedAt;
      break;
  }
  return timestamps;
}

function getStatusByStage(stage: ControlStage, defaultStatus: HouseStatus): HouseStatus {
  switch (stage) {
    case 'lock':
      return 'locked';
    case 'completed':
      return 'sold';
    case 'rejected':
      return 'available';
    default:
      return 'available';
  }
}

function createSaleControl(
  houseId: string,
  customerId: string,
  applicantId: string,
  currentHandlerId: string,
  stage: ControlStage,
  lockDuration: number,
  remarks: Remark[],
  createdAt: string,
  updatedAt: string
): SaleControl {
  const house = houses.find(h => h.id === houseId)!;
  const customer = customers.find(c => c.id === customerId)!;
  const applicant = users.find(u => u.id === applicantId)!;
  const currentHandler = users.find(u => u.id === currentHandlerId)!;

  const lockExpireAt = stage === 'lock' || stage === 'completed'
    ? new Date(new Date(updatedAt).getTime() + lockDuration * 60 * 60 * 1000).toISOString()
    : undefined;

  const timestamps = getTimestampsByStage(stage, createdAt, updatedAt);
  const stageHistory = buildStageHistory(stage, applicantId, currentHandlerId, remarks, timestamps);

  const computedStatus = getStatusByStage(stage, house.status);
  const updatedHouse = { ...house, status: computedStatus };

  return {
    id: `sc_${generateId()}`,
    houseId,
    house: updatedHouse,
    customerId,
    customer,
    applicantId,
    applicant,
    currentHandlerId,
    currentHandler,
    status: computedStatus,
    stage,
    stageName: STAGE_MAP[stage],
    lockDuration,
    lockExpireAt,
    remarks,
    currentRemark: remarks.length > 0 ? remarks[remarks.length - 1].content : '',
    stageHistory,
    createdAt,
    updatedAt,
    ...timestamps,
  };
}

// Application 阶段 - 3条
const appRemarks1: Remark[] = [
  createRemark(
    '客户王建国先生看中1号楼1单元302室四室两厅，预算600万左右，准备近期全款购买。客户为企业高管，征信良好，希望能尽快锁定房源。',
    'application',
    '销控申请',
    user_zhangwei,
    '张伟',
    'consultant',
    'application',
    '2026-06-05T10:30:00.000Z'
  ),
];

const appRemarks2: Remark[] = [
  createRemark(
    '客户李秀英女士意向2号楼1单元201室三室两厅，首付30%，公积金贷款。已看过样板间，对户型和采光都很满意。',
    'application',
    '销控申请',
    user_lina,
    '李娜',
    'consultant',
    'application',
    '2026-06-06T14:20:00.000Z'
  ),
];

const appRemarks3: Remark[] = [
  createRemark(
    '客户张志强先生首次来访，意向3号楼1单元202室三室两厅，需要和家人商量后再决定。初步预算480万左右。',
    'application',
    '销控申请',
    user_wangqiang,
    '王强',
    'consultant',
    'application',
    '2026-06-07T09:15:00.000Z'
  ),
];

// Review 阶段 - 4条
const reviewRemarks1: Remark[] = [
  createRemark(
    '客户刘美玲女士意向1号楼1单元202室三室两厅，已交意向金2万元。客户资质良好，收入稳定，建议审核通过。',
    'application',
    '销控申请',
    user_zhangwei,
    '张伟',
    'consultant',
    'application',
    '2026-06-04T11:00:00.000Z'
  ),
  createRemark(
    '客户资料齐全，资质符合要求，同意进入下一环节。请销控专员尽快处理。',
    'review',
    '经理审核',
    user_liufang,
    '刘芳',
    'manager',
    'review',
    '2026-06-04T15:30:00.000Z'
  ),
];

const reviewRemarks2: Remark[] = [
  createRemark(
    '客户陈海波先生意向2号楼2单元102室三室两厅，第二次来访，意向明确。准备走商业贷款，首付比例40%。',
    'application',
    '销控申请',
    user_lina,
    '李娜',
    'consultant',
    'application',
    '2026-06-03T10:00:00.000Z'
  ),
  createRemark(
    '客户情况已核实，征信良好，收入证明齐全。审核通过，请销控专员锁定房源。',
    'review',
    '经理审核',
    user_chenming,
    '陈明',
    'manager',
    'review',
    '2026-06-03T16:00:00.000Z'
  ),
];

const reviewRemarks3: Remark[] = [
  createRemark(
    '客户赵丽华女士意向3号楼1单元102室两室一厅，刚需客户，准备结婚用房。预算300万左右，首付已凑齐。',
    'application',
    '销控申请',
    user_wangqiang,
    '王强',
    'consultant',
    'application',
    '2026-06-05T14:00:00.000Z'
  ),
  createRemark(
    '客户资质良好，刚需优先考虑。审核通过，请销控专员办理锁定手续。',
    'review',
    '经理审核',
    user_liufang,
    '刘芳',
    'manager',
    'review',
    '2026-06-05T17:20:00.000Z'
  ),
];

const reviewRemarks4: Remark[] = [
  createRemark(
    '客户孙伟明先生意向2号楼1单元301室四室两厅，改善型需求，准备置换。已看过多次，对小区环境和配套都很满意。',
    'application',
    '销控申请',
    user_zhangwei,
    '张伟',
    'consultant',
    'application',
    '2026-06-06T09:30:00.000Z'
  ),
  createRemark(
    '客户为老客户推荐，资质可靠。置换贷款已预审批通过。审核通过，请销控专员锁定房源48小时。',
    'review',
    '经理审核',
    user_chenming,
    '陈明',
    'manager',
    'review',
    '2026-06-06T11:45:00.000Z'
  ),
];

// Lock 阶段 - 5条
const lockRemarks1: Remark[] = [
  createRemark(
    '客户周小红女士意向1号楼2单元102室两室一厅，单身白领，首付50%。已明确表示本周内签合同。',
    'application',
    '销控申请',
    user_lina,
    '李娜',
    'consultant',
    'application',
    '2026-06-02T10:00:00.000Z'
  ),
  createRemark(
    '客户情况属实，收入稳定，还款能力强。审核通过，请销控专员锁定房源24小时。',
    'review',
    '经理审核',
    user_liufang,
    '刘芳',
    'manager',
    'review',
    '2026-06-02T14:30:00.000Z'
  ),
  createRemark(
    '房源已锁定，锁定时长24小时。请置业顾问尽快催促客户签约。（备注自动从审核环节带入）',
    'lock',
    '执行锁定',
    user_zhaojing,
    '赵静',
    'controller',
    'lock',
    '2026-06-02T15:00:00.000Z'
  ),
];

const lockRemarks2: Remark[] = [
  createRemark(
    '客户吴大鹏先生意向1号楼1单元201室两室一厅，投资客户，全款购买。已多次了解项目投资价值。',
    'application',
    '销控申请',
    user_wangqiang,
    '王强',
    'consultant',
    'application',
    '2026-06-03T09:00:00.000Z'
  ),
  createRemark(
    '客户资金实力雄厚，投资意向明确。审核通过，请销控专员锁定房源48小时。',
    'review',
    '经理审核',
    user_chenming,
    '陈明',
    'manager',
    'review',
    '2026-06-03T11:20:00.000Z'
  ),
  createRemark(
    '房源已锁定，锁定时长48小时。（备注自动从审核环节带入：客户资金实力雄厚，投资意向明确）',
    'lock',
    '执行锁定',
    user_zhaojing,
    '赵静',
    'controller',
    'lock',
    '2026-06-03T11:45:00.000Z'
  ),
];

const lockRemarks3: Remark[] = [
  createRemark(
    '客户郑晓燕女士意向2号楼2单元101室两室一厅，和父母同住，需要照顾老人。对低楼层和朝向有要求。',
    'application',
    '销控申请',
    user_zhangwei,
    '张伟',
    'consultant',
    'application',
    '2026-06-04T13:00:00.000Z'
  ),
  createRemark(
    '客户情况特殊，优先考虑。已核实购房资格，审核通过。请销控专员锁定房源72小时，客户需要时间筹款。',
    'review',
    '经理审核',
    user_liufang,
    '刘芳',
    'manager',
    'review',
    '2026-06-04T16:00:00.000Z'
  ),
  createRemark(
    '房源已锁定，锁定时长72小时。已特殊备注客户情况。（备注自动带入：客户情况特殊，优先考虑，需要时间筹款）',
    'lock',
    '执行锁定',
    user_zhaojing,
    '赵静',
    'controller',
    'lock',
    '2026-06-04T16:30:00.000Z'
  ),
];

const lockRemarks4: Remark[] = [
  createRemark(
    '客户黄志强先生意向2号楼1单元102室三室两厅，企业主，经营状况良好。准备全款购买用于自住。',
    'application',
    '销控申请',
    user_lina,
    '李娜',
    'consultant',
    'application',
    '2026-06-05T08:30:00.000Z'
  ),
  createRemark(
    '客户为优质客户，已提供资产证明。审核通过，请销控专员锁定房源48小时。',
    'review',
    '经理审核',
    user_chenming,
    '陈明',
    'manager',
    'review',
    '2026-06-05T10:00:00.000Z'
  ),
  createRemark(
    '房源已锁定，锁定时长48小时。客户已预约后天签约。（备注自动带入：客户为优质客户，已提供资产证明）',
    'lock',
    '执行锁定',
    user_zhaojing,
    '赵静',
    'controller',
    'lock',
    '2026-06-05T10:20:00.000Z'
  ),
];

const lockRemarks5: Remark[] = [
  createRemark(
    '客户林美娟女士意向3号楼2单元201室两室一厅，年轻刚需，准备结婚。预算有限，希望能申请到优惠。',
    'application',
    '销控申请',
    user_wangqiang,
    '王强',
    'consultant',
    'application',
    '2026-06-06T15:00:00.000Z'
  ),
  createRemark(
    '客户为刚需首套，可享受首套房优惠政策。审核通过，请销控专员锁定房源72小时，客户需要办理贷款手续。',
    'review',
    '经理审核',
    user_liufang,
    '刘芳',
    'manager',
    'review',
    '2026-06-06T17:30:00.000Z'
  ),
  createRemark(
    '房源已锁定，锁定时长72小时。已登记为首套刚需，享受优惠政策。（备注自动带入：刚需首套，享受优惠政策）',
    'lock',
    '执行锁定',
    user_zhaojing,
    '赵静',
    'controller',
    'lock',
    '2026-06-06T18:00:00.000Z'
  ),
];

// Completed 阶段 - 2条
const completedRemarks1: Remark[] = [
  createRemark(
    '客户何光明先生意向1号楼1单元301室三室两厅，二次改善，已有两套房。准备置换后购买。',
    'application',
    '销控申请',
    user_zhangwei,
    '张伟',
    'consultant',
    'application',
    '2026-05-20T10:00:00.000Z'
  ),
  createRemark(
    '客户置换房屋已网签，资金有保障。审核通过，请销控专员锁定房源72小时。',
    'review',
    '经理审核',
    user_liufang,
    '刘芳',
    'manager',
    'review',
    '2026-05-20T14:00:00.000Z'
  ),
  createRemark(
    '房源已锁定，锁定时长72小时。客户置换资金预计3天内到账。',
    'lock',
    '执行锁定',
    user_zhaojing,
    '赵静',
    'controller',
    'lock',
    '2026-05-20T14:30:00.000Z'
  ),
  createRemark(
    '客户已按时签约，支付首付款50%，剩余款项办理商业贷款。交易完成。',
    'complete',
    '完成销售',
    user_zhaojing,
    '赵静',
    'controller',
    'completed',
    '2026-05-25T10:00:00.000Z'
  ),
];

const completedRemarks2: Remark[] = [
  createRemark(
    '客户罗秀兰女士意向2号楼1单元202室四室两厅，三代同堂，需要大户型。对学区和配套有较高要求。',
    'application',
    '销控申请',
    user_lina,
    '李娜',
    'consultant',
    'application',
    '2026-05-25T09:00:00.000Z'
  ),
  createRemark(
    '客户家庭情况符合购房政策，已提供社保和纳税证明。审核通过，请销控专员锁定房源72小时。',
    'review',
    '经理审核',
    user_chenming,
    '陈明',
    'manager',
    'review',
    '2026-05-25T11:30:00.000Z'
  ),
  createRemark(
    '房源已锁定，锁定时长72小时。客户已明确表示签约意向。',
    'lock',
    '执行锁定',
    user_zhaojing,
    '赵静',
    'controller',
    'lock',
    '2026-05-25T12:00:00.000Z'
  ),
  createRemark(
    '客户已签约并支付全款，交易顺利完成。客户对服务非常满意。',
    'complete',
    '完成销售',
    user_zhaojing,
    '赵静',
    'controller',
    'completed',
    '2026-05-28T15:00:00.000Z'
  ),
];

// Rejected 阶段 - 1条
const rejectedRemarks1: Remark[] = [
  createRemark(
    '客户谢文杰先生意向3号楼1单元201室两室一厅，自由职业，收入不稳定。首付需要借款。',
    'application',
    '销控申请',
    user_wangqiang,
    '王强',
    'consultant',
    'application',
    '2026-06-07T10:00:00.000Z'
  ),
  createRemark(
    '客户收入证明不足，银行预审批未通过。建议客户增加首付比例或寻找共同还款人后再申请。驳回当前销控申请。',
    'review',
    '经理审核',
    user_liufang,
    '刘芳',
    'manager',
    'rejected',
    '2026-06-07T15:00:00.000Z'
  ),
];

export const saleControls: SaleControl[] = [
  // Application 阶段 - 3条
  createSaleControl(
    'h_1_1_302',
    'c_001',
    user_zhangwei,
    user_zhangwei,
    'application',
    0,
    appRemarks1,
    '2026-06-05T10:30:00.000Z',
    '2026-06-05T10:30:00.000Z'
  ),
  createSaleControl(
    'h_2_1_201',
    'c_002',
    user_lina,
    user_lina,
    'application',
    0,
    appRemarks2,
    '2026-06-06T14:20:00.000Z',
    '2026-06-06T14:20:00.000Z'
  ),
  createSaleControl(
    'h_3_1_202',
    'c_003',
    user_wangqiang,
    user_wangqiang,
    'application',
    0,
    appRemarks3,
    '2026-06-07T09:15:00.000Z',
    '2026-06-07T09:15:00.000Z'
  ),

  // Review 阶段 - 4条
  createSaleControl(
    'h_1_1_202',
    'c_004',
    user_zhangwei,
    user_liufang,
    'review',
    24,
    reviewRemarks1,
    '2026-06-04T11:00:00.000Z',
    '2026-06-04T15:30:00.000Z'
  ),
  createSaleControl(
    'h_2_2_102',
    'c_005',
    user_lina,
    user_chenming,
    'review',
    48,
    reviewRemarks2,
    '2026-06-03T10:00:00.000Z',
    '2026-06-03T16:00:00.000Z'
  ),
  createSaleControl(
    'h_3_1_102',
    'c_006',
    user_wangqiang,
    user_liufang,
    'review',
    24,
    reviewRemarks3,
    '2026-06-05T14:00:00.000Z',
    '2026-06-05T17:20:00.000Z'
  ),
  createSaleControl(
    'h_2_1_301',
    'c_007',
    user_zhangwei,
    user_chenming,
    'review',
    48,
    reviewRemarks4,
    '2026-06-06T09:30:00.000Z',
    '2026-06-06T11:45:00.000Z'
  ),

  // Lock 阶段 - 5条
  createSaleControl(
    'h_1_2_102',
    'c_008',
    user_lina,
    user_zhaojing,
    'lock',
    24,
    lockRemarks1,
    '2026-06-02T10:00:00.000Z',
    '2026-06-02T15:00:00.000Z'
  ),
  createSaleControl(
    'h_1_1_201',
    'c_009',
    user_wangqiang,
    user_zhaojing,
    'lock',
    48,
    lockRemarks2,
    '2026-06-03T09:00:00.000Z',
    '2026-06-03T11:45:00.000Z'
  ),
  createSaleControl(
    'h_2_2_101',
    'c_010',
    user_zhangwei,
    user_zhaojing,
    'lock',
    72,
    lockRemarks3,
    '2026-06-04T13:00:00.000Z',
    '2026-06-04T16:30:00.000Z'
  ),
  createSaleControl(
    'h_2_1_102',
    'c_011',
    user_lina,
    user_zhaojing,
    'lock',
    48,
    lockRemarks4,
    '2026-06-05T08:30:00.000Z',
    '2026-06-05T10:20:00.000Z'
  ),
  createSaleControl(
    'h_3_2_201',
    'c_012',
    user_wangqiang,
    user_zhaojing,
    'lock',
    72,
    lockRemarks5,
    '2026-06-06T15:00:00.000Z',
    '2026-06-06T18:00:00.000Z'
  ),

  // Completed 阶段 - 2条
  createSaleControl(
    'h_1_1_301',
    'c_013',
    user_zhangwei,
    user_zhaojing,
    'completed',
    72,
    completedRemarks1,
    '2026-05-20T10:00:00.000Z',
    '2026-05-25T10:00:00.000Z'
  ),
  createSaleControl(
    'h_2_1_202',
    'c_014',
    user_lina,
    user_zhaojing,
    'completed',
    72,
    completedRemarks2,
    '2026-05-25T09:00:00.000Z',
    '2026-05-28T15:00:00.000Z'
  ),

  // Rejected 阶段 - 1条
  createSaleControl(
    'h_3_1_201',
    'c_015',
    user_wangqiang,
    user_liufang,
    'rejected',
    0,
    rejectedRemarks1,
    '2026-06-07T10:00:00.000Z',
    '2026-06-07T15:00:00.000Z'
  ),
];

export const getSaleControlById = (id: string): SaleControl | undefined => {
  return saleControls.find(sc => sc.id === id);
};

export const getSaleControlsByStage = (stage: ControlStage): SaleControl[] => {
  return saleControls.filter(sc => sc.stage === stage);
};

export const getSaleControlsByApplicant = (applicantId: string): SaleControl[] => {
  return saleControls.filter(sc => sc.applicantId === applicantId);
};

export const getSaleControlsByHouse = (houseId: string): SaleControl[] => {
  return saleControls.filter(sc => sc.houseId === houseId);
};
