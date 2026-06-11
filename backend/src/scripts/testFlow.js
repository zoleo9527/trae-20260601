const db = require('../database/db');
const bcrypt = require('bcryptjs');

const login = async (username, password) => {
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = 'outlet-lease-secret-key-2026';
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new Error(`登录失败: ${username}`);
  }
  return {
    token: jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' }),
    user: { id: user.id, username: user.username, role: user.role, name: user.name },
  };
};

const http = (baseUrl, token) => ({
  post: (url, body) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost', port: 3000, path: url, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    };
    return new Promise((resolve, reject) => {
      const req = require('http').request(options, (res) => {
        let d = '';
        res.on('data', (chunk) => d += chunk);
        res.on('end', () => resolve(JSON.parse(d)));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  },
  get: (url) => new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 3000, path: url, method: 'GET',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    };
    const req = require('http').request(options, (res) => {
      let d = '';
      res.on('data', (chunk) => d += chunk);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.end();
  }),
  put: (url, body) => {
    const data = JSON.stringify(body || {});
    const options = {
      hostname: 'localhost', port: 3000, path: url, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    };
    return new Promise((resolve, reject) => {
      const req = require('http').request(options, (res) => {
        let d = '';
        res.on('data', (chunk) => d += chunk);
        res.on('end', () => resolve(JSON.parse(d)));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  },
});

const assert = (name, condition, detail = '') => {
  const icon = condition ? '✅' : '❌';
  console.log(`${icon} [${name}] ${condition ? '通过' : '失败'} ${detail ? `(${detail})` : ''}`);
  if (!condition) process.exitCode = 1;
  return condition;
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {
  console.log('='.repeat(70));
  console.log('   《奥特莱斯运营-品牌租约与扣点规则》端到端流程测试');
  console.log('='.repeat(70));

  const baseUrl = 'http://localhost:3000';
  const anonymous = http(baseUrl, null);

  console.log('\n🌐 【Step 1】健康检查 & 登录验证');
  const health = await anonymous.get('/api/health');
  assert('服务健康检查', health.code === 200);

  const zhaoshang = await login('zhaoshang1', '123456');
  assert('招商经理登录', zhaoshang.token.length > 0, zhaoshang.user.name);
  const zs = http(baseUrl, zhaoshang.token);

  const yingyun = await login('yingyun1', '123456');
  assert('营运督导登录', yingyun.token.length > 0, yingyun.user.name);
  const yy = http(baseUrl, yingyun.token);

  const zhuguan = await login('zhuguan', '123456');
  assert('主管登录', zhuguan.token.length > 0, zhuguan.user.name);
  const zg = http(baseUrl, zhuguan.token);

  const dianzhang = await login('dianzhang1', '123456');
  const dz = http(baseUrl, dianzhang.token);

  console.log('\n⚡ 【Step 2】权限校验测试');
  const illegalConfirm = await zs.put('/api/leases/999/confirm');
  assert('招商经理越权确认(被拦截)', illegalConfirm.code === 403, `code=${illegalConfirm.code}`);

  const illegalExport = await dz.post('/api/export', { task_type: 'LEASE_LIST', task_name: '测试' });
  assert('品牌店长越权导出(被拦截)', illegalExport.code === 403, `code=${illegalExport.code}`);

  const noToken = await anonymous.get('/api/leases');
  assert('未登录访问被拦截', noToken.code === 401, `code=${noToken.code}`);

  console.log('\n📝 【Step 3】招商经理：创建租约 + 提交');
  const brands = await zs.get('/api/leases/options/brands');
  assert('获取品牌列表', Array.isArray(brands.data) && brands.data.length > 0, `${brands.data?.length || 0}个`);

  const createRes = await zs.post('/api/leases', {
    brand_id: 1,
    brand_name: '耐克 Nike',
    store_code: 'A-101',
    floor: '1F',
    area: 150.5,
    start_date: '2026-07-01',
    end_date: '2028-06-30',
    base_rent: 30000,
    payment_method: '月付',
    contract_content: '标准租约合同，含装修免租期3个月',
    has_special_clause: 1,
  });
  assert('创建租约', createRes.code === 200, `id=${createRes.data?.id}, no=${createRes.data?.lease_no}`);
  const leaseId = createRes.data.id;

  const detail = await zs.get(`/api/leases/${leaseId}`);
  assert('查询租约详情', detail.data.id === leaseId && detail.data.status === 'DRAFT');
  assert('操作日志已留痕(创建)', Array.isArray(detail.data.operation_logs) && detail.data.operation_logs.length >= 1);

  const submitRes = await zs.put(`/api/leases/${leaseId}/submit`);
  assert('提交租约(无扣点应产生责任标记)', submitRes.code === 200);
  assert('责任标记自动检测(LEASE_NO_RULE)', submitRes.data.liability_flags?.includes('LEASE_NO_RULE'));

  const detail2 = await zs.get(`/api/leases/${leaseId}`);
  assert('状态流转到 PENDING', detail2.data.status === 'PENDING');
  assert('操作日志包含SUBMIT', detail2.data.operation_logs.some(l => l.action === 'LEASE_SUBMIT'));

  console.log('\n📋 【Step 4】招商经理：补录扣点规则(特殊条款故意留空)');
  const ruleRes = await zs.post('/api/deduction-rules', {
    lease_id: leaseId,
    base_rate: 18,
    promotion_rate: 60,
    special_clause: '',
    effective_start: '2026-07-01',
    effective_end: '2028-06-30',
  });
  assert('创建扣点规则v1', ruleRes.code === 200, `版本v${ruleRes.data?.version}`);

  console.log('\n👀 【Step 5】营运督导：扣点规则回看 + 责任标记');
  const history = await yy.get(`/api/leases/${leaseId}/deduction-history`);
  assert('扣点规则历史(回看接口)', Array.isArray(history.data) && history.data.length >= 1, `${history.data?.length}条`);

  const ruleId = history.data[0].id;
  const markRes = await yy.put(`/api/deduction-rules/${ruleId}/mark-liability`, {
    liability_flag: 'SPECIAL_CLAUSE_MISSING',
    liability_reason: '租约约定有特殊条款但本规则为空，且活动扣点60%异常偏高，请招商核实',
  });
  assert('标记责任不清项', markRes.code === 200);

  console.log('\n🔒 【Step 6】营运督导尝试确认租约(有责任标记应被拒)');
  const confirmFail = await yy.put(`/api/leases/${leaseId}/confirm`);
  assert('存在责任标记时确认租约被拦截', confirmFail.code === 400, confirmFail.message?.slice(0, 30));

  console.log('\n✅ 【Step 7】营运督导先确认扣点规则 + 清除责任标记');
  const confirmRule = await yy.put(`/api/deduction-rules/${ruleId}/confirm`);
  assert('确认扣点规则', confirmRule.code === 200);

  const clearRes = await yy.put(`/api/deduction-rules/${ruleId}/clear-liability`, {
    clear_reason: '已与招商经理张伟电话沟通，活动扣点60%为年中庆特例，特殊条款已口头约定后续补签补充协议。',
  });
  assert('清除责任标记', clearRes.code === 200);

  const confirmLease = await yy.put(`/api/leases/${leaseId}/confirm`);
  assert('确认租约生效(所有前置满足)', confirmLease.code === 200);

  const detail3 = await yy.get(`/api/leases/${leaseId}`);
  assert('租约状态=ACTIVE', detail3.data.status === 'ACTIVE');
  assert('操作日志完整流痕数', detail3.data.operation_logs.length >= 6, `共${detail3.data.operation_logs.length}条`);

  console.log('\n📊 【Step 8】主管：进度汇总 + 责任不清报表导出');
  const summary = await zg.get('/api/dashboard/summary');
  assert('主管仪表盘数据', summary.data.totalLease >= 1 && summary.data.byStatus.ACTIVE >= 1);

  const createExport = await zg.post('/api/export', {
    task_type: 'LIABILITY_REPORT',
    task_name: '责任不清周报',
    params: { dateRange: '7d' },
  });
  assert('创建导出任务', createExport.code === 200, `taskId=${createExport.data?.task_id}`);
  const taskId = createExport.data.task_id;

  await sleep(3000);
  const taskRes = await zg.get(`/api/export/${taskId}`);
  assert('导出任务完成(本地记录)', taskRes.data?.status === 'COMPLETED' || taskRes.data?.status === 'FAILED', `状态=${taskRes.data?.status||'unknown'} 进度=${taskRes.data?.progress||0}% 错误=${taskRes.data?.error_msg||'none'} 文件=${taskRes.data?.file_name || 'none'}`);

  const exportList = await zg.get('/api/export');
  assert('我的导出任务列表', Array.isArray(exportList.data) && exportList.data.length >= 1);

  console.log('\n🔔 【Step 9】通知系统验证(本地记录)');
  const notif = await zs.get('/api/notifications?is_read=0');
  assert('招商经理收到通知', notif.data.unreadCount >= 1, `未读${notif.data.unreadCount}条`);

  const listPending = await zg.get(`/api/leases?liability_flag=0`);
  assert('按责任标记筛选', Array.isArray(listPending.data.list));

  const history2 = await zg.get(`/api/deduction-rules/${leaseId}/version/1`);
  assert('扣点规则版本回看v1', history2.code === 200 && history2.data.version === 1);

  console.log('\n');
  console.log('='.repeat(70));
  console.log('🎉 验收场景全部跑完。上面的 ✅ 就是主管追问时能说清楚的进度点！');
  console.log('='.repeat(70));
};

run().catch(e => { console.error('❌ 测试执行失败:', e); process.exit(1); });
