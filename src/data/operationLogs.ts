import { OperationLog, OperationType, HouseStatus, ControlStage } from '../types';
import { OPERATION_TYPE_MAP, ROLE_MAP } from '../utils/status';
import { generateId } from '../utils/id';
import { saleControls } from './saleControls';

function createLog(
  saleControlId: string,
  operatorId: string,
  operatorName: string,
  operatorRole: string,
  operationType: OperationType,
  beforeStatus: HouseStatus,
  afterStatus: HouseStatus,
  beforeStage: ControlStage | undefined,
  afterStage: ControlStage | undefined,
  remark: string | undefined,
  remarkSource: string | undefined,
  timestamp: string
): OperationLog {
  return {
    id: `log_${generateId()}`,
    saleControlId,
    operatorId,
    operatorName,
    operatorRole: operatorRole as 'consultant' | 'manager' | 'controller',
    operatorRoleName: ROLE_MAP[operatorRole as keyof typeof ROLE_MAP],
    operationType,
    operationTypeName: OPERATION_TYPE_MAP[operationType],
    beforeStatus,
    afterStatus,
    beforeStage,
    afterStage,
    remark,
    remarkSource,
    timestamp,
  };
}

const operationLogs: OperationLog[] = [];

// Application 阶段 - 3条记录
// sc_001: 王建国 - 张伟 - 1-1-302 - application
const sc1 = saleControls[0];
operationLogs.push(
  createLog(sc1.id, 'u_zhangwei', '张伟', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户王建国先生看中1号楼1单元302室四室两厅，预算600万左右，准备近期全款购买。客户为企业高管，征信良好，希望能尽快锁定房源。', 'application', '2026-06-05T10:30:00.000Z'),
  createLog(sc1.id, 'u_zhangwei', '张伟', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'application', undefined, undefined, '2026-06-05T10:35:00.000Z'),
  createLog(sc1.id, 'u_zhangwei', '张伟', 'consultant', 'update_remark', 'available', 'available', 'application', 'application', '补充：客户明天上午会再来详细了解合同条款，请提前准备好相关资料。', 'application', '2026-06-05T11:00:00.000Z')
);

// sc_002: 李秀英 - 李娜 - 2-1-201 - application
const sc2 = saleControls[1];
operationLogs.push(
  createLog(sc2.id, 'u_lina', '李娜', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户李秀英女士意向2号楼1单元201室三室两厅，首付30%，公积金贷款。已看过样板间，对户型和采光都很满意。', 'application', '2026-06-06T14:20:00.000Z'),
  createLog(sc2.id, 'u_lina', '李娜', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'application', undefined, undefined, '2026-06-06T14:25:00.000Z'),
  createLog(sc2.id, 'u_lina', '李娜', 'consultant', 'update_remark', 'available', 'available', 'application', 'application', '补充：客户公积金贷款额度已查询，可贷款80万，首付需要准备195万。', 'application', '2026-06-06T15:10:00.000Z')
);

// sc_003: 张志强 - 王强 - 3-1-202 - application
const sc3 = saleControls[2];
operationLogs.push(
  createLog(sc3.id, 'u_wangqiang', '王强', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户张志强先生首次来访，意向3号楼1单元202室三室两厅，需要和家人商量后再决定。初步预算480万左右。', 'application', '2026-06-07T09:15:00.000Z'),
  createLog(sc3.id, 'u_wangqiang', '王强', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'application', undefined, undefined, '2026-06-07T09:20:00.000Z')
);

// Review 阶段 - 4条记录
// sc_004: 刘美玲 - 张伟 - 1-1-202 - review
const sc4 = saleControls[3];
operationLogs.push(
  createLog(sc4.id, 'u_zhangwei', '张伟', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户刘美玲女士意向1号楼1单元202室三室两厅，已交意向金2万元。客户资质良好，收入稳定，建议审核通过。', 'application', '2026-06-04T11:00:00.000Z'),
  createLog(sc4.id, 'u_zhangwei', '张伟', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-04T11:30:00.000Z'),
  createLog(sc4.id, 'u_liufang', '刘芳', 'manager', 'review_approve', 'available', 'available', 'review', 'review', '客户资料齐全，资质符合要求，同意进入下一环节。请销控专员尽快处理。', 'review', '2026-06-04T15:30:00.000Z')
);

// sc_005: 陈海波 - 李娜 - 2-2-102 - review
const sc5 = saleControls[4];
operationLogs.push(
  createLog(sc5.id, 'u_lina', '李娜', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户陈海波先生意向2号楼2单元102室三室两厅，第二次来访，意向明确。准备走商业贷款，首付比例40%。', 'application', '2026-06-03T10:00:00.000Z'),
  createLog(sc5.id, 'u_lina', '李娜', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-03T10:30:00.000Z'),
  createLog(sc5.id, 'u_chenming', '陈明', 'manager', 'review_approve', 'available', 'available', 'review', 'review', '客户情况已核实，征信良好，收入证明齐全。审核通过，请销控专员锁定房源。', 'review', '2026-06-03T16:00:00.000Z')
);

// sc_006: 赵丽华 - 王强 - 3-1-102 - review
const sc6 = saleControls[5];
operationLogs.push(
  createLog(sc6.id, 'u_wangqiang', '王强', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户赵丽华女士意向3号楼1单元102室两室一厅，刚需客户，准备结婚用房。预算300万左右，首付已凑齐。', 'application', '2026-06-05T14:00:00.000Z'),
  createLog(sc6.id, 'u_wangqiang', '王强', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-05T14:30:00.000Z'),
  createLog(sc6.id, 'u_liufang', '刘芳', 'manager', 'review_approve', 'available', 'available', 'review', 'review', '客户资质良好，刚需优先考虑。审核通过，请销控专员办理锁定手续。', 'review', '2026-06-05T17:20:00.000Z')
);

// sc_007: 孙伟明 - 张伟 - 2-1-301 - review
const sc7 = saleControls[6];
operationLogs.push(
  createLog(sc7.id, 'u_zhangwei', '张伟', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户孙伟明先生意向2号楼1单元301室四室两厅，改善型需求，准备置换。已看过多次，对小区环境和配套都很满意。', 'application', '2026-06-06T09:30:00.000Z'),
  createLog(sc7.id, 'u_zhangwei', '张伟', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-06T10:00:00.000Z'),
  createLog(sc7.id, 'u_chenming', '陈明', 'manager', 'review_approve', 'available', 'available', 'review', 'review', '客户为老客户推荐，资质可靠。置换贷款已预审批通过。审核通过，请销控专员锁定房源48小时。', 'review', '2026-06-06T11:45:00.000Z'),
  createLog(sc7.id, 'u_chenming', '陈明', 'manager', 'update_remark', 'available', 'available', 'review', 'review', '补充：客户旧房已网签，预计下周到账，锁定48小时足够。', 'review', '2026-06-06T11:50:00.000Z')
);

// Lock 阶段 - 5条记录
// sc_008: 周小红 - 李娜 - 1-2-102 - lock
const sc8 = saleControls[7];
operationLogs.push(
  createLog(sc8.id, 'u_lina', '李娜', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户周小红女士意向1号楼2单元102室两室一厅，单身白领，首付50%。已明确表示本周内签合同。', 'application', '2026-06-02T10:00:00.000Z'),
  createLog(sc8.id, 'u_lina', '李娜', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-02T10:30:00.000Z'),
  createLog(sc8.id, 'u_liufang', '刘芳', 'manager', 'review_approve', 'available', 'available', 'review', 'lock', '客户情况属实，收入稳定，还款能力强。审核通过，请销控专员锁定房源24小时。', 'review', '2026-06-02T14:30:00.000Z'),
  createLog(sc8.id, 'u_zhaojing', '赵静', 'controller', 'lock_house', 'available', 'locked', 'lock', 'lock', '房源已锁定，锁定时长24小时。请置业顾问尽快催促客户签约。（备注自动从审核环节带入：客户情况属实，收入稳定，还款能力强）', 'lock', '2026-06-02T15:00:00.000Z')
);

// sc_009: 吴大鹏 - 王强 - 1-1-201 - lock
const sc9 = saleControls[8];
operationLogs.push(
  createLog(sc9.id, 'u_wangqiang', '王强', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户吴大鹏先生意向1号楼1单元201室两室一厅，投资客户，全款购买。已多次了解项目投资价值。', 'application', '2026-06-03T09:00:00.000Z'),
  createLog(sc9.id, 'u_wangqiang', '王强', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-03T09:30:00.000Z'),
  createLog(sc9.id, 'u_chenming', '陈明', 'manager', 'review_approve', 'available', 'available', 'review', 'lock', '客户资金实力雄厚，投资意向明确。审核通过，请销控专员锁定房源48小时。', 'review', '2026-06-03T11:20:00.000Z'),
  createLog(sc9.id, 'u_zhaojing', '赵静', 'controller', 'lock_house', 'available', 'locked', 'lock', 'lock', '房源已锁定，锁定时长48小时。（备注自动从审核环节带入：客户资金实力雄厚，投资意向明确）', 'lock', '2026-06-03T11:45:00.000Z'),
  createLog(sc9.id, 'u_wangqiang', '王强', 'consultant', 'update_remark', 'locked', 'locked', 'lock', 'lock', '客户确认明天上午10点来签合同，请准备好认购书。', 'application', '2026-06-03T16:00:00.000Z')
);

// sc_010: 郑晓燕 - 张伟 - 2-2-101 - lock
const sc10 = saleControls[9];
operationLogs.push(
  createLog(sc10.id, 'u_zhangwei', '张伟', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户郑晓燕女士意向2号楼2单元101室两室一厅，和父母同住，需要照顾老人。对低楼层和朝向有要求。', 'application', '2026-06-04T13:00:00.000Z'),
  createLog(sc10.id, 'u_zhangwei', '张伟', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-04T13:30:00.000Z'),
  createLog(sc10.id, 'u_liufang', '刘芳', 'manager', 'review_approve', 'available', 'available', 'review', 'lock', '客户情况特殊，优先考虑。已核实购房资格，审核通过。请销控专员锁定房源72小时，客户需要时间筹款。', 'review', '2026-06-04T16:00:00.000Z'),
  createLog(sc10.id, 'u_zhaojing', '赵静', 'controller', 'lock_house', 'available', 'locked', 'lock', 'lock', '房源已锁定，锁定时长72小时。已特殊备注客户情况。（备注自动带入：客户情况特殊，优先考虑，需要时间筹款）', 'lock', '2026-06-04T16:30:00.000Z'),
  createLog(sc10.id, 'u_zhangwei', '张伟', 'consultant', 'update_remark', 'locked', 'locked', 'lock', 'lock', '客户父亲瘫痪在床，确实需要低楼层方便出行，已申请特殊照顾，领导已批准。', 'application', '2026-06-04T17:00:00.000Z')
);

// sc_011: 黄志强 - 李娜 - 2-1-102 - lock
const sc11 = saleControls[10];
operationLogs.push(
  createLog(sc11.id, 'u_lina', '李娜', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户黄志强先生意向2号楼1单元102室三室两厅，企业主，经营状况良好。准备全款购买用于自住。', 'application', '2026-06-05T08:30:00.000Z'),
  createLog(sc11.id, 'u_lina', '李娜', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-05T09:00:00.000Z'),
  createLog(sc11.id, 'u_chenming', '陈明', 'manager', 'review_approve', 'available', 'available', 'review', 'lock', '客户为优质客户，已提供资产证明。审核通过，请销控专员锁定房源48小时。', 'review', '2026-06-05T10:00:00.000Z'),
  createLog(sc11.id, 'u_zhaojing', '赵静', 'controller', 'lock_house', 'available', 'locked', 'lock', 'lock', '房源已锁定，锁定时长48小时。客户已预约后天签约。（备注自动带入：客户为优质客户，已提供资产证明）', 'lock', '2026-06-05T10:20:00.000Z'),
  createLog(sc11.id, 'u_chenming', '陈明', 'manager', 'update_remark', 'locked', 'locked', 'lock', 'lock', '客户公司年营收5000万以上，属于重点维护客户，请给予VIP待遇。', 'review', '2026-06-05T11:00:00.000Z')
);

// sc_012: 林美娟 - 王强 - 3-2-201 - lock
const sc12 = saleControls[11];
operationLogs.push(
  createLog(sc12.id, 'u_wangqiang', '王强', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户林美娟女士意向3号楼2单元201室两室一厅，年轻刚需，准备结婚。预算有限，希望能申请到优惠。', 'application', '2026-06-06T15:00:00.000Z'),
  createLog(sc12.id, 'u_wangqiang', '王强', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-06T15:30:00.000Z'),
  createLog(sc12.id, 'u_liufang', '刘芳', 'manager', 'review_approve', 'available', 'available', 'review', 'lock', '客户为刚需首套，可享受首套房优惠政策。审核通过，请销控专员锁定房源72小时，客户需要办理贷款手续。', 'review', '2026-06-06T17:30:00.000Z'),
  createLog(sc12.id, 'u_zhaojing', '赵静', 'controller', 'lock_house', 'available', 'locked', 'lock', 'lock', '房源已锁定，锁定时长72小时。已登记为首套刚需，享受优惠政策。（备注自动带入：刚需首套，享受优惠政策）', 'lock', '2026-06-06T18:00:00.000Z'),
  createLog(sc12.id, 'u_wangqiang', '王强', 'consultant', 'update_remark', 'locked', 'locked', 'lock', 'lock', '客户双方都是教师，已申请教师额外优惠，正在走审批流程。', 'application', '2026-06-06T18:30:00.000Z')
);

// Completed 阶段 - 2条记录
// sc_013: 何光明 - 张伟 - 1-1-301 - completed
const sc13 = saleControls[12];
operationLogs.push(
  createLog(sc13.id, 'u_zhangwei', '张伟', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户何光明先生意向1号楼1单元301室三室两厅，二次改善，已有两套房。准备置换后购买。', 'application', '2026-05-20T10:00:00.000Z'),
  createLog(sc13.id, 'u_zhangwei', '张伟', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-05-20T10:30:00.000Z'),
  createLog(sc13.id, 'u_liufang', '刘芳', 'manager', 'review_approve', 'available', 'available', 'review', 'lock', '客户置换房屋已网签，资金有保障。审核通过，请销控专员锁定房源72小时。', 'review', '2026-05-20T14:00:00.000Z'),
  createLog(sc13.id, 'u_zhaojing', '赵静', 'controller', 'lock_house', 'available', 'locked', 'lock', 'lock', '房源已锁定，锁定时长72小时。客户置换资金预计3天内到账。', 'lock', '2026-05-20T14:30:00.000Z'),
  createLog(sc13.id, 'u_wangqiang', '王强', 'consultant', 'update_remark', 'locked', 'locked', 'lock', 'lock', '客户旧房尾款已到账，明天可以过来签正式合同。', 'application', '2026-05-23T09:00:00.000Z'),
  createLog(sc13.id, 'u_zhaojing', '赵静', 'controller', 'complete_sale', 'locked', 'sold', 'lock', 'completed', '客户已按时签约，支付首付款50%，剩余款项办理商业贷款。交易完成。', 'complete', '2026-05-25T10:00:00.000Z')
);

// sc_014: 罗秀兰 - 李娜 - 2-1-202 - completed
const sc14 = saleControls[13];
operationLogs.push(
  createLog(sc14.id, 'u_lina', '李娜', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户罗秀兰女士意向2号楼1单元202室四室两厅，三代同堂，需要大户型。对学区和配套有较高要求。', 'application', '2026-05-25T09:00:00.000Z'),
  createLog(sc14.id, 'u_lina', '李娜', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-05-25T09:30:00.000Z'),
  createLog(sc14.id, 'u_chenming', '陈明', 'manager', 'review_approve', 'available', 'available', 'review', 'lock', '客户家庭情况符合购房政策，已提供社保和纳税证明。审核通过，请销控专员锁定房源72小时。', 'review', '2026-05-25T11:30:00.000Z'),
  createLog(sc14.id, 'u_zhaojing', '赵静', 'controller', 'lock_house', 'available', 'locked', 'lock', 'lock', '房源已锁定，锁定时长72小时。客户已明确表示签约意向。', 'lock', '2026-05-25T12:00:00.000Z'),
  createLog(sc14.id, 'u_lina', '李娜', 'consultant', 'update_remark', 'locked', 'locked', 'lock', 'lock', '客户准备全款购买，资金已到位，预约后天签约。', 'application', '2026-05-26T14:00:00.000Z'),
  createLog(sc14.id, 'u_chenming', '陈明', 'manager', 'update_remark', 'locked', 'locked', 'lock', 'lock', '全款客户，优先办理，已安排专属客服对接。', 'review', '2026-05-26T15:00:00.000Z'),
  createLog(sc14.id, 'u_zhaojing', '赵静', 'controller', 'complete_sale', 'locked', 'sold', 'lock', 'completed', '客户已签约并支付全款，交易顺利完成。客户对服务非常满意。', 'complete', '2026-05-28T15:00:00.000Z')
);

// Rejected 阶段 - 1条记录
// sc_015: 谢文杰 - 王强 - 3-1-201 - rejected
const sc15 = saleControls[14];
operationLogs.push(
  createLog(sc15.id, 'u_wangqiang', '王强', 'consultant', 'create_application', 'available', 'available', undefined, 'application', '客户谢文杰先生意向3号楼1单元201室两室一厅，自由职业，收入不稳定。首付需要借款。', 'application', '2026-06-07T10:00:00.000Z'),
  createLog(sc15.id, 'u_wangqiang', '王强', 'consultant', 'submit_for_review', 'available', 'available', 'application', 'review', undefined, undefined, '2026-06-07T10:30:00.000Z'),
  createLog(sc15.id, 'u_liufang', '刘芳', 'manager', 'review_reject', 'available', 'available', 'review', 'rejected', '客户收入证明不足，银行预审批未通过。建议客户增加首付比例或寻找共同还款人后再申请。驳回当前销控申请。', 'review', '2026-06-07T15:00:00.000Z'),
  createLog(sc15.id, 'u_wangqiang', '王强', 'consultant', 'update_remark', 'available', 'available', 'rejected', 'rejected', '已将结果告知客户，客户表示会增加首付后重新申请。', 'application', '2026-06-07T15:30:00.000Z')
);

export { operationLogs };

export const getLogsBySaleControlId = (saleControlId: string): OperationLog[] => {
  return operationLogs.filter(log => log.saleControlId === saleControlId).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

export const getLogsByOperatorId = (operatorId: string): OperationLog[] => {
  return operationLogs.filter(log => log.operatorId === operatorId).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const getLogsByOperationType = (operationType: OperationType): OperationLog[] => {
  return operationLogs.filter(log => log.operationType === operationType).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
