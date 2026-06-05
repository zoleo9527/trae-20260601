import db from './index.ts';
import { v4 as uuidv4 } from 'uuid';

function seedDatabase() {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

  const c1Id = uuidv4();
  const c2Id = uuidv4();
  const c3Id = uuidv4();
  const c4Id = uuidv4();
  const c5Id = uuidv4();

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (
      id, complaint_no, customer_name, customer_phone, type, source, priority,
      title, description, related_coach, status, current_handler_role,
      current_handler_name, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertActionLog = db.prepare(`
    INSERT INTO action_logs (
      id, complaint_id, action_type, operator_role, operator_name,
      timestamp, remark, reject_reason, supplementary_note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCompensation = db.prepare(`
    INSERT INTO compensations (
      id, complaint_id, type, amount, description, status,
      proposed_by, proposed_at, approved_by, approved_at, reject_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertComplaint.run(
    c1Id, 'TS-20260603-0001', '张先生', '13800138001', 'venue', 'onsite', 'high',
    '场地地面湿滑导致摔倒', '客户在3号场地打球时，因地面清洁后未干滑倒，膝盖擦伤',
    null, 'pending_review', 'manager', '值班店长', '李前台',
    daysAgo(1), daysAgo(1)
  );
  insertActionLog.run(uuidv4(), c1Id, 'create', 'reception', '李前台', daysAgo(2), '客户现场投诉，已登记基本信息', null, null);
  insertActionLog.run(uuidv4(), c1Id, 'submit', 'reception', '李前台', hoursAgo(26), '提交初审', null, null);

  insertComplaint.run(
    c2Id, 'TS-20260602-0002', '王女士', '13900139002', 'service', 'phone', 'urgent',
    '教练迟到且态度恶劣', '预约的私教课程，教练迟到40分钟，沟通时态度不耐烦',
    '陈教练', 'review_rejected', 'reception', '场馆前台', '李前台',
    daysAgo(2), hoursAgo(5)
  );
  insertActionLog.run(uuidv4(), c2Id, 'create', 'reception', '李前台', daysAgo(3), '电话投诉，客户情绪激动', null, null);
  insertActionLog.run(uuidv4(), c2Id, 'submit', 'reception', '李前台', daysAgo(2), '提交初审', null, null);
  insertActionLog.run(uuidv4(), c2Id, 'review_reject', 'manager', '王店长', daysAgo(1), null, '缺少教练确认信息和客户具体诉求说明，请补充完整后重提', null);
  insertActionLog.run(uuidv4(), c2Id, 'note', 'coach', '陈教练', hoursAgo(8), '当时因前一节课拖堂，确实迟到了，抱歉', null, null);

  insertComplaint.run(
    c3Id, 'TS-20260601-0003', '刘先生', '13700137003', 'equipment', 'wechat', 'medium',
    '球拍拉线磅数不符', '客户送来的球拍要求拉26磅，取货时发现实际24磅',
    null, 'pending_compensation', 'manager', '王店长', '李前台',
    daysAgo(4), hoursAgo(30)
  );
  insertActionLog.run(uuidv4(), c3Id, 'create', 'reception', '李前台', daysAgo(5), '微信客服转来的投诉', null, null);
  insertActionLog.run(uuidv4(), c3Id, 'submit', 'reception', '李前台', daysAgo(5), '提交初审', null, null);
  insertActionLog.run(uuidv4(), c3Id, 'review_approve', 'manager', '王店长', daysAgo(4), '情况属实，进入补偿流程', null, null);
  insertCompensation.run(
    uuidv4(), c3Id, 'free_service', 0, '免费重新拉线 + 赠送一次手胶更换服务',
    'pending', '李前台', hoursAgo(30), null, null, null
  );
  insertActionLog.run(uuidv4(), c3Id, 'compensation_propose', 'reception', '李前台', hoursAgo(30), '提出补偿方案', null, null);

  insertComplaint.run(
    c4Id, 'TS-20260530-0004', '赵小姐', '13600136004', 'billing', 'onsite', 'high',
    '会员卡扣费异常', '客户反映会员卡余额被扣多了，实际消费应该是120元，但扣了200元',
    null, 'completed', 'manager', '王店长', '李前台',
    daysAgo(7), daysAgo(5)
  );
  insertActionLog.run(uuidv4(), c4Id, 'create', 'reception', '李前台', daysAgo(7), '现场对账发现问题', null, null);
  insertActionLog.run(uuidv4(), c4Id, 'submit', 'reception', '李前台', daysAgo(7), '提交初审', null, null);
  insertActionLog.run(uuidv4(), c4Id, 'review_approve', 'manager', '王店长', daysAgo(6), '核实是系统bug，进入补偿', null, null);
  insertCompensation.run(
    uuidv4(), c4Id, 'refund', 80, '退还多扣的80元 + 赠送2小时场地券作为补偿',
    'approved', '李前台', daysAgo(6), '王店长', daysAgo(5), null
  );
  insertActionLog.run(uuidv4(), c4Id, 'compensation_approve', 'manager', '王店长', daysAgo(5), '补偿方案通过，已执行', null, null);
  insertActionLog.run(uuidv4(), c4Id, 'complete', 'manager', '王店长', daysAgo(5), '处理完成，客户满意', null, null);

  insertComplaint.run(
    c5Id, 'TS-20260604-0005', '孙先生', '13500135005', 'booking', 'phone', 'medium',
    '预约场地被临时取消', '客户提前一周预约的周六场地，当天被通知场地有活动占用，无法使用',
    null, 'draft', 'reception', '李前台', '李前台',
    hoursAgo(5), hoursAgo(5)
  );
  insertActionLog.run(uuidv4(), c5Id, 'create', 'reception', '李前台', hoursAgo(5), '电话投诉，正在处理中', null, null);

  console.log('样例数据初始化完成！');
}

try {
  seedDatabase();
} catch (e: any) {
  if (e.message?.includes('UNIQUE constraint failed')) {
    console.log('数据库已存在样例数据，跳过初始化');
  } else {
    console.error('初始化失败:', e);
  }
}

export default seedDatabase;
