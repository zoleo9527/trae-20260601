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
  console.log('排序断点与留痕修复 - 专项测试');
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

  console.log('【一】初始化数据排序验证');
  console.log('  1.1 检查初始化时间线顺序');
  const timeline1 = await request('GET', '/api/records/timeline/PRJ_202606001', null, { 'X-User-Id': 'USER_001' });
  const records1 = timeline1.data.data;
  assert(records1.length >= 4, `时间线记录充足(${records1.length}条)`);

  const createIdx = records1.findIndex(r => r.action === '创建项目');
  const submitIdx = records1.findIndex(r => r.action === '提交图纸确认');
  const statusChangeIdx = records1.findIndex(r => r.action === '状态变更' && r.detail.includes('待图纸确认'));

  assert(createIdx !== -1, '存在创建项目记录');
  assert(submitIdx !== -1, '存在提交图纸确认记录');
  assert(statusChangeIdx !== -1, '存在状态变更记录');

  assert(createIdx < submitIdx, '创建项目记录在提交图纸之前');
  assert(submitIdx < statusChangeIdx, '提交图纸确认记录在状态变更之前（先业务动作，后状态变更）');

  console.log(`    顺序验证: 创建项目[${createIdx}] → 提交图纸[${submitIdx}] → 状态变更[${statusChangeIdx}] ✓`);
  console.log('');

  console.log('  1.2 检查已完成项目(PRJ_202606002)完整时间线顺序');
  const timeline2 = await request('GET', '/api/records/timeline/PRJ_202606002', null, { 'X-User-Id': 'USER_001' });
  const records2 = timeline2.data.data;

  const projectCreate = records2.findIndex(r => r.action === '创建项目');
  const drawingSubmit1 = records2.findIndex(r => r.action === '提交图纸确认' && r.detail.includes('v1'));
  const drawingReject = records2.findIndex(r => r.action === '驳回图纸');
  const drawingSubmit2 = records2.findIndex(r => r.action === '提交图纸确认' && r.detail.includes('v2'));
  const drawingConfirm = records2.findIndex(r => r.action === '确认图纸');
  const statusDrawingConfirmed = records2.findIndex(r => r.action === '状态变更' && r.detail.includes('图纸已确认') && r.operator === '李刚');
  const statusProductionPending = records2.findIndex(r => r.action === '状态变更' && r.operator === '系统');
  const scheduleSubmit = records2.findIndex(r => r.action === '提交生产排单');
  const scheduleConfirm = records2.findIndex(r => r.action === '确认生产排单');
  const statusProductionConfirmed = records2.findIndex(r => r.action === '状态变更' && r.detail.includes('生产排单已确认'));

  console.log('    完整业务链路顺序验证:');
  assert(projectCreate < drawingSubmit1, `[${projectCreate}]创建项目 → [${drawingSubmit1}]提交图纸v1`);
  assert(drawingSubmit1 < drawingReject, `[${drawingSubmit1}]提交图纸v1 → [${drawingReject}]驳回图纸`);
  assert(drawingReject < drawingSubmit2, `[${drawingReject}]驳回图纸 → [${drawingSubmit2}]提交图纸v2`);
  assert(drawingSubmit2 < drawingConfirm, `[${drawingSubmit2}]提交图纸v2 → [${drawingConfirm}]确认图纸`);
  assert(drawingConfirm < statusDrawingConfirmed, `[${drawingConfirm}]确认图纸 → [${statusDrawingConfirmed}]状态变更(图纸已确认)`);
  assert(statusDrawingConfirmed < statusProductionPending, `[${statusDrawingConfirmed}]图纸已确认 → [${statusProductionPending}]系统流转待生产`);
  assert(statusProductionPending < scheduleSubmit, `[${statusProductionPending}]待生产 → [${scheduleSubmit}]提交生产排单`);
  assert(scheduleSubmit < scheduleConfirm, `[${scheduleSubmit}]提交排单 → [${scheduleConfirm}]确认排单`);
  assert(scheduleConfirm < statusProductionConfirmed, `[${scheduleConfirm}]确认排单 → [${statusProductionConfirmed}]状态变更(排单已确认)`);

  console.log('    ✅ 完整链路顺序正确');
  console.log('');

  console.log('  1.3 验证同一时间戳下的排序（typeOrderWeight 生效）');
  const sameTimeRecords = records2.filter(r => r.time === '2026-06-06T13:20:00.000Z');
  if (sameTimeRecords.length >= 3) {
    const types = sameTimeRecords.map(r => r.action);
    console.log(`    同一时间戳(2026-06-06 13:20:00)下的记录顺序: ${types.join(' → ')}`);
    assert(types[0] === '确认图纸' || types[0] === '添加备注', `第一条是业务动作：${types[0]}`);
    assert(types.includes('确认图纸') && types.includes('状态变更'), '同时包含业务动作和状态变更');
    const confirmIdx = types.indexOf('确认图纸');
    const statusIdx = types.indexOf('状态变更');
    assert(confirmIdx < statusIdx, '确认图纸在状态变更之前');
  }
  console.log('');

  console.log('  1.4 验证初始备注写入操作记录（PRJ_202606003）');
  const timeline3 = await request('GET', '/api/records/timeline/PRJ_202606003', null, { 'X-User-Id': 'USER_001' });
  const records3 = timeline3.data.data;
  const remarkAdd = records3.find(r => r.action === '添加备注' && r.detail.includes('设计稿'));
  assert(remarkAdd !== undefined, '新建项目的初始备注写入了操作记录');
  console.log(`    初始备注记录: ${remarkAdd ? remarkAdd.detail.substring(0, 50) + '...' : '未找到'}`);
  console.log('');

  console.log('【二】新创建项目的排序验证');
  const now = Date.now();
  const freshProject = await request('POST', '/api/projects',
    {
      name: '排序验证项目-' + now,
      code: 'SORT-TEST-' + now,
      client: '测试客户',
      siteAddress: '测试地址',
      surveyDate: '2026-06-15',
      surveyPerson: '王明',
      initialRemark: '这是初始备注，验证是否写入操作记录，同时验证排序顺序'
    },
    { 'X-User-Id': 'USER_001' }
  );
  assert(freshProject.data.success, '创建新项目成功');
  const testProjectId = freshProject.data.data.id;

  console.log('  2.1 验证创建项目 + 初始备注的记录顺序');
  const timelineNew = await request('GET', `/api/records/timeline/${testProjectId}`, null, { 'X-User-Id': 'USER_001' });
  const recordsNew = timelineNew.data.data;
  assert(recordsNew.length >= 2, `至少有2条记录（创建+备注），实际${recordsNew.length}条`);

  const actionsNew = recordsNew.map(r => r.action);
  console.log(`    记录顺序: ${actionsNew.join(' → ')}`);
  assert(actionsNew[0] === '创建项目', '第一条是创建项目');
  assert(actionsNew[1] === '添加备注', '第二条是添加初始备注');
  console.log('');

  console.log('  2.2 验证完整主链路排序（提交图纸→确认图纸→提交排单→确认排单）');
  const submitDrawing = await request('POST', `/api/drawings/submit/${testProjectId}`,
    {
      version: 'v1',
      fileName: '排序验证设计图_v1.pdf',
      changes: ['测试变更1', '测试变更2']
    },
    { 'X-User-Id': 'USER_001' }
  );
  assert(submitDrawing.data.success, '项目专员提交图纸成功');
  const drawingId = submitDrawing.data.data.id;

  const confirmDrawing = await request('POST', `/api/drawings/confirm/${drawingId}`,
    { remark: '测试确认图纸，验证排序' },
    { 'X-User-Id': 'USER_002' }
  );
  assert(confirmDrawing.data.success, '制作师傅确认图纸成功');

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
  assert(submitSchedule.data.success, '制作师傅提交排单成功');
  const scheduleId = submitSchedule.data.data.id;

  const confirmSchedule = await request('POST', `/api/schedules/confirm/${scheduleId}`,
    { remark: '测试确认排单，验证排序' },
    { 'X-User-Id': 'USER_001' }
  );
  assert(confirmSchedule.data.success, '项目专员确认排单成功');

  const timelineFull = await request('GET', `/api/records/timeline/${testProjectId}`, null, { 'X-User-Id': 'USER_001' });
  const recordsFull = timelineFull.data.data;

  console.log('    📋 完整时间线（按时间正序）:');
  recordsFull.forEach((r, i) => {
    console.log(`     [${i}] ${r.time.substring(11, 19)} | ${r.action.padEnd(8)} | ${r.operator.padEnd(2)} | ${r.detail.substring(0, 45)}${r.detail.length > 45 ? '...' : ''}`);
  });

  const actionsFull = recordsFull.map(r => r.action);

  console.log('');
  console.log('    关键节点顺序验证:');
  const createIdx2 = actionsFull.indexOf('创建项目');
  const remarkIdx = actionsFull.indexOf('添加备注');
  const submitDrawIdx = actionsFull.indexOf('提交图纸确认');
  const statusDrawPendingIdx = actionsFull.findIndex((a, i) => a === '状态变更' && recordsFull[i].detail.includes('待图纸确认'));
  const confirmDrawIdx = actionsFull.indexOf('确认图纸');
  const statusDrawConfirmIdx = actionsFull.findIndex((a, i) => a === '状态变更' && recordsFull[i].detail.includes('图纸已确认') && recordsFull[i].operator === '李刚');
  const statusProdPendingIdx = actionsFull.findIndex((a, i) => a === '状态变更' && recordsFull[i].operator === '系统');
  const submitSchedIdx = actionsFull.indexOf('提交生产排单');
  const confirmSchedIdx = actionsFull.indexOf('确认生产排单');
  const statusProdConfirmIdx = actionsFull.findIndex((a, i) => a === '状态变更' && recordsFull[i].detail.includes('生产排单已确认'));

  assert(createIdx2 < remarkIdx, `[${createIdx2}]创建 → [${remarkIdx}]备注`);
  assert(remarkIdx < submitDrawIdx, `[${remarkIdx}]备注 → [${submitDrawIdx}]提交图纸`);
  assert(submitDrawIdx < statusDrawPendingIdx, `[${submitDrawIdx}]提交图纸 → [${statusDrawPendingIdx}]状态(待图纸)`);
  assert(statusDrawPendingIdx < confirmDrawIdx, `[${statusDrawPendingIdx}]待图纸 → [${confirmDrawIdx}]确认图纸`);
  assert(confirmDrawIdx < statusDrawConfirmIdx, `[${confirmDrawIdx}]确认图纸 → [${statusDrawConfirmIdx}]状态(图纸已确认)`);
  assert(statusDrawConfirmIdx < statusProdPendingIdx, `[${statusDrawConfirmIdx}]图纸已确认 → [${statusProdPendingIdx}]系统流转(待生产)`);
  assert(statusProdPendingIdx < submitSchedIdx, `[${statusProdPendingIdx}]待生产 → [${submitSchedIdx}]提交排单`);
  assert(submitSchedIdx < confirmSchedIdx, `[${submitSchedIdx}]提交排单 → [${confirmSchedIdx}]确认排单`);
  assert(confirmSchedIdx < statusProdConfirmIdx, `[${confirmSchedIdx}]确认排单 → [${statusProdConfirmIdx}]状态(排单已确认)`);

  console.log('');
  console.log('    ✅ 所有关键节点顺序正确，无排序断点');
  console.log('');

  console.log('  2.3 验证生产排单回看的 auditTrail 排序');
  const scheduleDetail = await request('GET', `/api/schedules/${scheduleId}`, null, { 'X-User-Id': 'USER_001' });
  const auditTrail = scheduleDetail.data.data.auditTrail;
  assert(auditTrail.length >= 2, `auditTrail 记录充足(${auditTrail.length}条)`);

  const auditActions = auditTrail.map(r => r.typeLabel);
  console.log(`    排单回看 auditTrail 顺序: ${auditActions.join(' → ')}`);
  assert(auditActions[0] === '提交生产排单', '第一条是提交排单');
  assert(auditActions[auditActions.length - 1] === '确认生产排单', '最后一条是确认排单');
  console.log('');

  console.log('  2.4 验证确认图纸时已无 setTimeout 异步问题（记录全部生成）');
  const systemRecord = recordsFull.find(r => r.operator === '系统');
  assert(systemRecord !== undefined, '存在系统自动流转记录');
  assert(systemRecord.detail.includes('待生产排单'), '系统流转记录内容正确');

  const systemIdx = recordsFull.findIndex(r => r.operator === '系统');
  const humanIdx = recordsFull.findIndex(r => r.action === '确认图纸');
  assert(systemIdx > humanIdx, `系统流转记录[${systemIdx}]在人工确认图纸[${humanIdx}]之后`);
  console.log('    ✅ 已移除 setTimeout，系统流转记录同步生成且顺序正确');
  console.log('');

  console.log('【三】幂等提交与排序验证');
  console.log('  3.1 重复提交不影响排序');
  const idemKey = 'sort-idem-' + Date.now();
  const submit1 = await request('POST', `/api/projects`,
    {
      name: '幂等排序测试',
      code: 'IDEM-SORT-' + Date.now(),
      client: '测试',
      siteAddress: '测试',
      surveyDate: '2026-06-15',
      surveyPerson: '王明',
      initialRemark: '幂等测试备注'
    },
    { 'X-User-Id': 'USER_001', 'X-Idempotency-Key': idemKey }
  );
  const submit2 = await request('POST', `/api/projects`,
    {
      name: '幂等排序测试',
      code: 'IDEM-SORT-' + Date.now(),
      client: '测试',
      siteAddress: '测试',
      surveyDate: '2026-06-15',
      surveyPerson: '王明',
      initialRemark: '幂等测试备注'
    },
    { 'X-User-Id': 'USER_001', 'X-Idempotency-Key': idemKey }
  );

  assert(submit2.data._idempotent === true, '第二次提交返回幂等标记');
  assert(submit1.data.data.id === submit2.data.data.id, '两次返回相同项目ID');

  const idemTimeline = await request('GET', `/api/records/timeline/${submit1.data.data.id}`, null, { 'X-User-Id': 'USER_001' });
  assert(idemTimeline.data.data.length === 2, `幂等提交不产生重复记录（2条而非4条），实际${idemTimeline.data.data.length}条`);
  console.log('    ✅ 幂等提交不破坏排序和记录完整性');
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
    console.log('\n🎉 所有排序与留痕修复验证通过！');
    console.log('   - 同一时间戳下业务动作在前、状态变更在后');
    console.log('   - 初始备注已写入操作记录');
    console.log('   - 已移除 setTimeout 异步逻辑');
    console.log('   - 完整三方交接时间线可完整追上');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('测试执行异常:', err);
  process.exit(1);
});
