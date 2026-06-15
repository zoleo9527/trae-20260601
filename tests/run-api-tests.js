const http = require('http');

const BASE_URL = 'http://localhost:3005';

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, raw: true });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

let passCount = 0;
let failCount = 0;
const errors = [];

function assert(condition, message, detail = '') {
  if (condition) {
    passCount++;
    console.log(`  ✅ ${message}`);
  } else {
    failCount++;
    errors.push({ message, detail });
    console.log(`  ❌ ${message} ${detail ? '- ' + detail : ''}`);
  }
}

async function runTests() {
  console.log('========================================');
  console.log('标识制作厂工作流系统 - 自动化API测试');
  console.log('========================================\n');

  console.log('【前置检查】服务是否可用');
  try {
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.data && health.data.status === 'ok', '健康检查通过');
  } catch (e) {
    console.log('  ❌ 服务不可用，请先执行 npm start 启动服务');
    process.exit(1);
  }
  console.log('');

  console.log('【一】用户与权限模块');
  const users = await request('GET', '/api/users');
  assert(users.status === 200 && users.data.success, '获取用户列表成功');
  assert(users.data.data.length === 3, `用户数量正确(${users.data.data.length}/3)`);

  const roles = users.data.data.map(u => u.role);
  assert(roles.includes('PROJECT_MANAGER'), '存在项目专员角色');
  assert(roles.includes('PRODUCTION_MASTER'), '存在制作师傅角色');
  assert(roles.includes('INSTALL_LEADER'), '存在安装负责人角色');
  console.log('');

  console.log('【二】项目数据初始化验证');
  const projects = await request('GET', '/api/projects', null, { 'X-User-Id': 'USER_001' });
  assert(projects.status === 200 && projects.data.success, '获取项目列表成功');
  assert(projects.data.data.length >= 3, `项目数量充足(${projects.data.data.length})`);

  const projectDetail = await request('GET', '/api/projects/PRJ_202606002', null, { 'X-User-Id': 'USER_001' });
  assert(projectDetail.data.success, '获取项目详情成功');
  assert(projectDetail.data.data.remarks && projectDetail.data.data.remarks.length > 0, '项目包含历史备注');
  assert(projectDetail.data.data.timeline && projectDetail.data.data.timeline.length > 0, '项目包含操作时间线');

  const hasHandler = projectDetail.data.data.currentHandler && projectDetail.data.data.currentHandlerName;
  assert(hasHandler, '项目有明确的当前处理人');
  console.log('');

  console.log('【三】图纸确认模块');
  console.log('  3.1 图纸历史回看');
  const drawingHistory = await request('GET', '/api/drawings/history/PRJ_202606002', null, { 'X-User-Id': 'USER_001' });
  assert(drawingHistory.data.success, '获取图纸历史成功');
  assert(drawingHistory.data.data.length >= 2, `图纸历史记录充足(${drawingHistory.data.data.length})`);

  const rejected = drawingHistory.data.data.find(d => d.status === 'REJECTED');
  assert(rejected && rejected.confirmedByName, '驳回图纸有处理人留痕');
  assert(rejected && rejected.confirmedAt, '驳回图纸有时间留痕');
  assert(rejected && rejected.confirmRemark, '驳回图纸有处理备注');

  const confirmed = drawingHistory.data.data.find(d => d.status === 'CONFIRMED');
  assert(confirmed && confirmed.confirmedByName === '李刚', '确认图纸由制作师傅李刚处理');
  console.log('');

  console.log('  3.2 权限校验测试');
  const drawings = await request('GET', '/api/drawings?projectId=PRJ_202606001', null, { 'X-User-Id': 'USER_001' });
  const pendingDrawing = drawings.data.data.find(d => d.status === 'PENDING');
  if (pendingDrawing) {
    const rejectByInstall = await request('POST', `/api/drawings/confirm/${pendingDrawing.id}`,
      { remark: 'test' },
      { 'X-User-Id': 'USER_003' }
    );
    assert(rejectByInstall.status === 403, '安装负责人无权确认图纸（返回403）');
  }
  console.log('');

  console.log('  3.3 幂等提交测试');
  const idemKey = 'test-drawing-' + Date.now();
  const submit1 = await request('POST', '/api/drawings/submit/PRJ_202606003',
    {
      version: 'v1',
      fileName: 'test-design.pdf',
      changes: ['test']
    },
    { 'X-User-Id': 'USER_001', 'X-Idempotency-Key': idemKey }
  );
  assert(submit1.data.success && !submit1.data._idempotent, '首次提交成功（非幂等返回）');

  const submit2 = await request('POST', '/api/drawings/submit/PRJ_202606003',
    {
      version: 'v1',
      fileName: 'test-design.pdf',
      changes: ['test']
    },
    { 'X-User-Id': 'USER_001', 'X-Idempotency-Key': idemKey }
  );
  assert(submit2.data._idempotent === true, '重复提交返回幂等标记');
  assert(submit1.data.data.id === submit2.data.data.id, '幂等返回相同的图纸ID');
  console.log('');

  console.log('【四】生产排单模块');
  console.log('  4.1 生产排单回看（已确认的历史排单）');
  const scheduleHistory = await request('GET', '/api/schedules/project/PRJ_202606002', null, { 'X-User-Id': 'USER_001' });
  assert(scheduleHistory.data.success, '获取排单历史成功');
  const confirmedSchedule = scheduleHistory.data.data.find(s => s.status === 'CONFIRMED');
  assert(confirmedSchedule, '存在已确认的排单');
  assert(confirmedSchedule.confirmedByName === '王明', '排单由项目专员王明确认');
  assert(confirmedSchedule.confirmedAt, '排单确认有时间留痕');
  assert(confirmedSchedule.materialPlan && confirmedSchedule.materialPlan.length > 0, '排单包含物料计划');
  assert(confirmedSchedule.productionTasks && confirmedSchedule.productionTasks.length > 0, '排单包含生产任务');
  assert(confirmedSchedule.installPlan && confirmedSchedule.installPlan.length > 0, '排单包含安装计划');

  const scheduleDetail = await request('GET', `/api/schedules/${confirmedSchedule.id}`, null, { 'X-User-Id': 'USER_001' });
  const auditTrail = scheduleDetail.data.data.auditTrail;
  assert(auditTrail && auditTrail.length >= 4, `排单回看 auditTrail 记录充足(≥4条)，实际${auditTrail ? auditTrail.length : 0}条`);
  const auditActions = auditTrail.map(r => r.typeLabel);
  const auditDetails = auditTrail.map(r => r.detail);
  assert(auditActions.includes('提交生产排单'), 'auditTrail 包含提交排单记录');
  assert(auditActions.includes('确认生产排单'), 'auditTrail 包含确认排单记录');
  const handoverPM = auditDetails.find(d => d.includes('项目专员'));
  const handoverInstall = auditDetails.find(d => d.includes('安装负责人'));
  assert(handoverPM !== undefined, 'auditTrail 包含制作师傅移交给项目专员的交接留痕');
  assert(handoverInstall !== undefined, 'auditTrail 包含项目专员移交给安装负责人的交接留痕');
  console.log('    排单回看 auditTrail: ' + auditActions.join(' → '));
  console.log('');

  console.log('  4.2 主链路完整流程测试：图纸确认 -> 生产排单 -> 排单确认');
  const freshProject = await request('POST', '/api/projects',
    {
      name: '自动化测试项目-' + Date.now(),
      code: 'AUTO-' + Date.now(),
      client: '测试客户',
      siteAddress: '测试地址',
      surveyDate: '2026-06-15',
      surveyPerson: '王明',
      initialRemark: '这是自动化测试创建的项目，用于验证完整流程'
    },
    { 'X-User-Id': 'USER_001' }
  );
  assert(freshProject.data.success, '创建新项目成功');
  const testProjectId = freshProject.data.data.id;
  assert(freshProject.data.data.status === 'DRAFT', '新项目状态为草稿');

  const submitDrawing = await request('POST', `/api/drawings/submit/${testProjectId}`,
    {
      version: 'v1',
      fileName: 'auto-test-design-v1.pdf',
      changes: ['自动化测试用图']
    },
    { 'X-User-Id': 'USER_001' }
  );
  assert(submitDrawing.data.success, '项目专员提交图纸成功');
  assert(submitDrawing.data.data.status === 'PENDING', '图纸状态为待确认');

  const projectAfterSubmit = await request('GET', `/api/projects/${testProjectId}`, null, { 'X-User-Id': 'USER_001' });
  assert(projectAfterSubmit.data.data.status === 'DRAWING_PENDING', '项目状态流转为待图纸确认');
  assert(projectAfterSubmit.data.data.currentHandlerName === '李刚', '处理人交接给制作师傅李刚');

  const confirmDrawing = await request('POST', `/api/drawings/confirm/${submitDrawing.data.data.id}`,
    { remark: '自动化测试：图纸确认通过' },
    { 'X-User-Id': 'USER_002' }
  );
  assert(confirmDrawing.data.success, '制作师傅确认图纸成功');
  assert(confirmDrawing.data.data.status === 'CONFIRMED', '图纸状态为已确认');

  await new Promise(r => setTimeout(r, 500));
  const projectAfterDrawingConfirm = await request('GET', `/api/projects/${testProjectId}`, null, { 'X-User-Id': 'USER_001' });
  assert(projectAfterDrawingConfirm.data.data.status === 'PRODUCTION_PENDING', '项目自动流转为待生产排单');
  assert(projectAfterDrawingConfirm.data.data.currentHandlerName === '李刚', '处理人仍为制作师傅（提交排单）');

  const submitSchedule = await request('POST', `/api/schedules/submit/${testProjectId}`,
    {
      productionStartDate: '2026-06-20',
      productionEndDate: '2026-06-22',
      installStartDate: '2026-06-24',
      installEndDate: '2026-06-25',
      materialPlan: [{ name: '测试材料', quantity: '10个', eta: '2026-06-18' }],
      productionTasks: [{ name: '测试生产任务', worker: '李刚', date: '2026-06-20', duration: '1天' }],
      installPlan: [{ area: '测试区域', items: 5, workers: '张伟', date: '2026-06-24' }]
    },
    { 'X-User-Id': 'USER_002' }
  );
  assert(submitSchedule.data.success, '制作师傅提交生产排单成功');
  assert(submitSchedule.data.data.status === 'PENDING', '排单状态为待确认');

  const projectAfterScheduleSubmit = await request('GET', `/api/projects/${testProjectId}`, null, { 'X-User-Id': 'USER_001' });
  assert(projectAfterScheduleSubmit.data.data.status === 'PRODUCTION_PENDING', '项目状态为待生产排单确认');
  assert(projectAfterScheduleSubmit.data.data.currentHandlerName === '王明', '处理人交接给项目专员（确认排单）');

  const confirmSchedule = await request('POST', `/api/schedules/confirm/${submitSchedule.data.data.id}`,
    { remark: '自动化测试：排单确认通过' },
    { 'X-User-Id': 'USER_001' }
  );
  assert(confirmSchedule.data.success, '项目专员确认排单成功');
  assert(confirmSchedule.data.data.status === 'CONFIRMED', '排单状态为已确认');

  const projectFinal = await request('GET', `/api/projects/${testProjectId}`, null, { 'X-User-Id': 'USER_001' });
  assert(projectFinal.data.data.status === 'PRODUCTION_CONFIRMED', '项目最终状态为生产排单已确认');
  assert(projectFinal.data.data.currentHandlerName === '张伟', '处理人最终交接给安装负责人张伟');
  console.log('');

  console.log('【五】操作留痕验证');
  const timeline = await request('GET', `/api/records/timeline/${testProjectId}`, null, { 'X-User-Id': 'USER_001' });
  assert(timeline.data.success, '获取时间线成功');
  assert(timeline.data.data.length >= 10, `时间线记录充足(≥10条)，实际${timeline.data.data.length}条`);

  const operators = [...new Set(timeline.data.data.map(t => t.operator))];
  assert(operators.includes('王明'), '时间线有王明(项目专员)的操作记录');
  assert(operators.includes('李刚'), '时间线有李刚(制作师傅)的操作记录');
  assert(operators.includes('张伟') || operators.includes('系统'), '时间线有系统或安装负责人的交接记录');
  assert(operators.includes('系统'), '时间线有系统自动流转记录');

  const actions = timeline.data.data.map(t => t.action);
  assert(actions.includes('创建项目'), '有创建项目记录');
  assert(actions.includes('添加备注'), '有初始备注记录');
  assert(actions.includes('提交图纸确认'), '有提交图纸记录');
  assert(actions.includes('确认图纸'), '有确认图纸记录');
  assert(actions.includes('提交生产排单'), '有提交排单记录');
  assert(actions.includes('确认生产排单'), '有确认排单记录');
  assert(actions.includes('状态变更'), '有状态变更记录');

  const statusChanges = timeline.data.data.filter(t => t.action === '状态变更');
  const hasHandoverPM = statusChanges.some(t => t.detail.includes('项目专员'));
  const hasHandoverInstall = statusChanges.some(t => t.detail.includes('安装负责人'));
  assert(hasHandoverPM, '存在制作师傅移交给项目专员的交接留痕');
  assert(hasHandoverInstall, '存在项目专员移交给安装负责人的交接留痕');
  console.log(`    状态变更记录共${statusChanges.length}条：包含交接PM和交接Install ✓`);

  console.log('\n  📋 完整时间线:');
  timeline.data.data.forEach(t => {
    console.log(`     [${t.time.substring(0, 19)}] ${t.operator}(${t.role}) - ${t.action}: ${t.detail.substring(0, 60)}${t.detail.length > 60 ? '...' : ''}`);
  });
  console.log('');

  console.log('========================================');
  console.log('测试结果汇总');
  console.log('========================================');
  console.log(`  通过: ${passCount}`);
  console.log(`  失败: ${failCount}`);
  console.log(`  总计: ${passCount + failCount}`);
  console.log('========================================');

  if (errors.length > 0) {
    console.log('\n失败详情:');
    errors.forEach(e => {
      console.log(`  - ${e.message} ${e.detail}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 所有测试通过！主链路完整可跑通。');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('测试执行异常:', err);
  process.exit(1);
});
