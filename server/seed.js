const { db } = require('./db');

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('数据已存在，跳过种子数据初始化');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (name, role, avatar) VALUES (?, ?, ?)
  `);

  const users = [
    { name: '张会计', role: 'accountant', avatar: '👨‍💼' },
    { name: '李会计', role: 'accountant', avatar: '👩‍💼' },
    { name: '王经理', role: 'manager', avatar: '👨‍💻' },
    { name: '赵主管', role: 'supervisor', avatar: '👩‍💻' },
  ];

  const userIds = [];
  users.forEach(u => {
    const info = insertUser.run(u.name, u.role, u.avatar);
    userIds.push(info.lastInsertRowid);
  });

  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, company_name, tax_type, industry, contact_person, contact_phone, accountant_id, manager_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const customers = [
    { name: '宏达科技', company_name: '宏达科技有限公司', tax_type: 'general', industry: '信息技术', contact_person: '陈总', contact_phone: '13800138001', accountant_idx: 0, manager_idx: 2 },
    { name: '盛源贸易', company_name: '盛源贸易有限公司', tax_type: 'small_scale', industry: '贸易', contact_person: '刘经理', contact_phone: '13800138002', accountant_idx: 1, manager_idx: 2 },
    { name: '恒信建材', company_name: '恒信建材有限公司', tax_type: 'general', industry: '建筑材料', contact_person: '周总', contact_phone: '13800138003', accountant_idx: 0, manager_idx: 2 },
    { name: '锦绣餐饮', company_name: '锦绣餐饮管理有限公司', tax_type: 'small_scale', industry: '餐饮', contact_person: '吴店长', contact_phone: '13800138004', accountant_idx: 1, manager_idx: 2 },
    { name: '智联教育', company_name: '智联教育科技有限公司', tax_type: 'general', industry: '教育', contact_person: '郑校长', contact_phone: '13800138005', accountant_idx: 0, manager_idx: 2 },
    { name: '益康医药', company_name: '益康医药连锁有限公司', tax_type: 'general', industry: '医药', contact_person: '孙总', contact_phone: '13800138006', accountant_idx: 1, manager_idx: 2 },
    { name: '金诚物流', company_name: '金诚物流有限公司', tax_type: 'small_scale', industry: '物流', contact_person: '马经理', contact_phone: '13800138007', accountant_idx: 0, manager_idx: 2 },
    { name: '优品电子', company_name: '优品电子科技有限公司', tax_type: 'general', industry: '电子', contact_person: '黄工', contact_phone: '13800138008', accountant_idx: 1, manager_idx: 2 },
  ];

  const customerIds = [];
  customers.forEach(c => {
    const info = insertCustomer.run(
      c.name, c.company_name, c.tax_type, c.industry,
      c.contact_person, c.contact_phone,
      userIds[c.accountant_idx], userIds[c.manager_idx]
    );
    customerIds.push(info.lastInsertRowid);
  });

  const insertFiling = db.prepare(`
    INSERT INTO tax_filings (customer_id, period, tax_type, status, due_date, current_remark, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLog = db.prepare(`
    INSERT INTO operation_logs (ref_type, ref_id, action, old_status, new_status, remark, operator_id, operator_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const filingsData = [
    { customer_idx: 0, period: '2026-05', tax_type: 'vat', status: 'completed', due_date: '2026-06-15', remark: '5月增值税已正常申报，数据核对无误', by_idx: 0 },
    { customer_idx: 0, period: '2026-05', tax_type: 'income', status: 'submitted', due_date: '2026-06-30', remark: '5月企业所得税已提交申报，待税务局审核', by_idx: 0 },
    { customer_idx: 1, period: '2026-05', tax_type: 'vat', status: 'in_progress', due_date: '2026-06-15', remark: '客户票据刚收到，正在整理录入中', by_idx: 1 },
    { customer_idx: 1, period: '2026-05', tax_type: 'personal_income', status: 'pending', due_date: '2026-06-15', remark: '等待客户提供工资表', by_idx: 1 },
    { customer_idx: 2, period: '2026-05', tax_type: 'vat', status: 'rejected', due_date: '2026-06-15', remark: '申报被退回，原因：进项税额比对不一致，需要客户补充认证清单', by_idx: 0 },
    { customer_idx: 2, period: '2026-05', tax_type: 'additional', status: 'pending', due_date: '2026-06-15', remark: '附加税待增值税申报完成后申报', by_idx: 0 },
    { customer_idx: 3, period: '2026-05', tax_type: 'vat', status: 'pending', due_date: '2026-06-15', remark: '客户票据尚未提交，已催交', by_idx: 1 },
    { customer_idx: 4, period: '2026-05', tax_type: 'vat', status: 'approved', due_date: '2026-06-15', remark: '申报审核通过，税款已划转', by_idx: 0 },
    { customer_idx: 5, period: '2026-05', tax_type: 'vat', status: 'in_progress', due_date: '2026-06-15', remark: '本月发票量较大，正在核对进项销项', by_idx: 1 },
    { customer_idx: 6, period: '2026-05', tax_type: 'vat', status: 'submitted', due_date: '2026-06-15', remark: '已提交电子税务局，等待回执', by_idx: 0 },
    { customer_idx: 7, period: '2026-05', tax_type: 'vat', status: 'pending', due_date: '2026-06-15', remark: '新客户，需先完善基础信息', by_idx: 1 },
    { customer_idx: 0, period: '2026-06', tax_type: 'vat', status: 'pending', due_date: '2026-07-15', remark: '6月申报期待启动', by_idx: 0 },
    { customer_idx: 1, period: '2026-06', tax_type: 'vat', status: 'pending', due_date: '2026-07-15', remark: '6月申报期待启动', by_idx: 1 },
  ];

  const filingIds = [];
  filingsData.forEach(f => {
    const info = insertFiling.run(
      customerIds[f.customer_idx], f.period, f.tax_type, f.status,
      f.due_date, f.remark, userIds[f.by_idx]
    );
    filingIds.push(info.lastInsertRowid);
    insertLog.run(
      'tax_filing', info.lastInsertRowid, '创建申报记录',
      null, f.status, f.remark, userIds[f.by_idx], users[f.by_idx].name
    );
  });

  const insertException = db.prepare(`
    INSERT INTO exceptions (customer_id, tax_filing_id, type, status, title, description, priority, related_remark, assigned_to, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const exceptionsData = [
    {
      customer_idx: 2, filing_idx: 4, type: 'reject', status: 'processing',
      title: '5月增值税申报被退回',
      description: '税务局退回5月增值税申报，原因为进项税额比对不一致。需要客户补充提供进项发票认证清单，核对差异后重新申报。',
      priority: 'urgent', remark: '申报被退回，原因：进项税额比对不一致，需要客户补充认证清单',
      assign_idx: 0, by_idx: 3
    },
    {
      customer_idx: 3, filing_idx: 6, type: 'urge', status: 'open',
      title: '5月申报票据催收',
      description: '5月税期临近，锦绣餐饮尚未提交本月票据。已通过微信和电话联系客户，客户表示本周内会整理好票据送来。',
      priority: 'high', remark: '客户票据尚未提交，已催交',
      assign_idx: 2, by_idx: 2
    },
    {
      customer_idx: 1, filing_idx: 2, type: 'supplement', status: 'processing',
      title: '补充银行流水单据',
      description: '盛源贸易5月银行流水缺少几笔转账凭证，需要客户提供银行回单以便准确记账和申报。',
      priority: 'normal', remark: '客户票据刚收到，正在整理录入中，发现缺少银行回单',
      assign_idx: 1, by_idx: 2
    },
    {
      customer_idx: 0, filing_idx: 0, type: 'urge', status: 'resolved',
      title: '5月个税数据催收',
      description: '客户延迟提交工资表，需催收以确保个税按时申报。',
      priority: 'high', remark: '已收到工资表，正在处理个税申报',
      assign_idx: 0, by_idx: 2
    },
    {
      customer_idx: 5, filing_idx: 8, type: 'supplement', status: 'open',
      title: '补充社保缴费凭证',
      description: '益康医药本月社保缴费凭证尚未提供，需要补充以用于企业所得税税前扣除。',
      priority: 'normal', remark: '本月发票量较大，正在核对进项销项，同时需要社保凭证',
      assign_idx: 1, by_idx: 2
    },
    {
      customer_idx: 7, filing_idx: 10, type: 'reject', status: 'closed',
      title: '新客户税种认定异常',
      description: '优品电子作为新客户，电子税务局显示税种认定信息不完整，需联系税务局完善后再进行申报。',
      priority: 'urgent', remark: '新客户，需先完善基础信息和税种认定',
      assign_idx: 0, by_idx: 3
    },
  ];

  const exceptionIds = [];
  exceptionsData.forEach(e => {
    const info = insertException.run(
      customerIds[e.customer_idx],
      e.filing_idx !== undefined ? filingIds[e.filing_idx] : null,
      e.type, e.status, e.title, e.description, e.priority, e.remark,
      userIds[e.assign_idx], userIds[e.by_idx]
    );
    exceptionIds.push(info.lastInsertRowid);
    insertLog.run(
      'exception', info.lastInsertRowid, '创建异常提醒',
      null, e.status, e.description, userIds[e.by_idx], users[e.by_idx].name
    );
  });

  const extraLogs = [
    { ref: 'exception', ref_idx: 0, action: '客户经理联系客户', old_s: 'open', new_s: 'processing', remark: '已电话联系客户，客户明天上午送认证清单', by_idx: 2 },
    { ref: 'exception', ref_idx: 0, action: '收到补充材料', old_s: 'processing', new_s: 'processing', remark: '客户已送来进项发票认证清单，正在核对', by_idx: 0 },
    { ref: 'exception', ref_idx: 3, action: '电话催收', old_s: 'open', new_s: 'processing', remark: '已电话联系陈总，工资表今日下班前发送', by_idx: 2 },
    { ref: 'exception', ref_idx: 3, action: '收到材料', old_s: 'processing', new_s: 'resolved', remark: '客户已发送工资表，个税申报正常进行', by_idx: 0 },
    { ref: 'exception', ref_idx: 5, action: '联系税务局', old_s: 'open', new_s: 'processing', remark: '已联系专管员，正在走税种认定流程', by_idx: 3 },
    { ref: 'exception', ref_idx: 5, action: '认定完成', old_s: 'processing', new_s: 'closed', remark: '税种认定已完成，可以正常申报', by_idx: 3 },
    { ref: 'tax_filing', ref_idx: 4, action: '提交申报', old_s: 'in_progress', new_s: 'submitted', remark: '首次提交5月增值税申报', by_idx: 0 },
    { ref: 'tax_filing', ref_idx: 4, action: '申报被退回', old_s: 'submitted', new_s: 'rejected', remark: '进项税额比对不一致，需补充认证清单', by_idx: 3 },
  ];

  extraLogs.forEach(l => {
    const refId = l.ref === 'tax_filing' ? filingIds[l.ref_idx] : exceptionIds[l.ref_idx];
    insertLog.run(
      l.ref, refId, l.action, l.old_s, l.new_s, l.remark,
      userIds[l.by_idx], users[l.by_idx].name
    );
  });

  console.log('种子数据初始化完成');
  console.log(`- 用户: ${userIds.length} 条`);
  console.log(`- 客户: ${customerIds.length} 条`);
  console.log(`- 税期申报: ${filingIds.length} 条`);
  console.log(`- 异常提醒: ${exceptionIds.length} 条`);
}

module.exports = { seed };
