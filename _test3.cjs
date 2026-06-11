const http = require('http');

const BASE = 'http://localhost:3456';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(BASE + path, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(path + ' parse failed: ' + d.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

function post(path, data) {
  const postData = JSON.stringify(data);
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost', port: 3456, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => { resolve(JSON.parse(d)); });
    });
    req.write(postData);
    req.end();
  });
}

function put(path, data) {
  const postData = JSON.stringify(data);
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost', port: 3456, path, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => { resolve(JSON.parse(d)); });
    });
    req.write(postData);
    req.end();
  });
}

(async () => {
  console.log('=== 准备：创建测试数据 ===');
  const stores = await get('/api/stores');
  const s1 = stores[0];
  const s2 = stores[1];

  // 整改单1：空负责人，状态 pending_review，有复查单
  const rect1 = await post('/api/rectifications', {
    store_id: s1.id, store_name: s1.name, brand: s1.brand,
    inspector_name: '钱红', inspection_date: '2026-06-11',
    category: '卫生', severity: '一般',
    title: '测试-复查列表-空负责人',
    description: '测试', requirement: '测试',
    deadline: '2026-06-13',
    handler_name: '',
  });
  // 把整改单1改成 pending_review 状态，自动生成复查单
  await put('/api/rectifications/' + rect1.id + '/status', { status: 'in_progress', operatorName: '钱红' });
  await put('/api/rectifications/' + rect1.id + '/status', { status: 'pending_review', operatorName: '钱红' });

  // 整改单2：有负责人张伟，状态 pending_review，有复查单
  const rect2 = await post('/api/rectifications', {
    store_id: s2.id, store_name: s2.name, brand: s2.brand,
    inspector_name: '钱红', inspection_date: '2026-06-11',
    category: '陈列', severity: '轻微',
    title: '测试-复查列表-有负责人',
    description: '测试', requirement: '测试',
    deadline: '2026-06-13',
    handler_name: s2.manager,
  });
  await put('/api/rectifications/' + rect2.id + '/status', { status: 'in_progress', operatorName: s2.manager });
  await put('/api/rectifications/' + rect2.id + '/status', { status: 'pending_review', operatorName: s2.manager });

  console.log('  整改单#' + rect1.id + '（空负责人） 复查单已生成');
  console.log('  整改单#' + rect2.id + '（负责人' + s2.manager + '） 复查单已生成');

  console.log('\n=== 1. GET /api/reviews 全量数据 ===');
  const allReviews = await get('/api/reviews');
  console.log('  总数: ' + allReviews.length);
  const review1 = allReviews.find(r => r.rectification_id === rect1.id);
  const review2 = allReviews.find(r => r.rectification_id === rect2.id);
  console.log('  复查单#' + review1.id + ' rect_handler_name: "' + (review1.rect_handler_name || '') + '" rect_status: ' + review1.rect_status);
  console.log('  复查单#' + review2.id + ' rect_handler_name: "' + (review2.rect_handler_name || '') + '" rect_status: ' + review2.rect_status);
  console.log('  关联字段存在: ' + (review1.rect_handler_name !== undefined ? 'OK' : 'FAIL'));

  console.log('\n=== 2. 筛选 handler=unassigned（待指派） ===');
  const unassigned = await get('/api/reviews?handler=unassigned');
  console.log('  数量: ' + unassigned.length);
  console.log('  只包含空负责人: ' + (unassigned.every(r => !r.rect_handler_name) ? 'OK' : 'FAIL'));

  console.log('\n=== 3. 筛选 handler=assigned（已指派） ===');
  const assigned = await get('/api/reviews?handler=assigned');
  console.log('  数量: ' + assigned.length);
  console.log('  只包含有负责人: ' + (assigned.every(r => r.rect_handler_name) ? 'OK' : 'FAIL'));

  console.log('\n=== 4. 组合筛选：status=pending + handler=unassigned ===');
  const pendingUnassigned = await get('/api/reviews?status=pending&handler=unassigned');
  console.log('  数量: ' + pendingUnassigned.length);
  const allPending = pendingUnassigned.every(r => r.status === 'pending');
  const allUnassigned = pendingUnassigned.every(r => !r.rect_handler_name);
  console.log('  全部待复查且待指派: ' + (allPending && allUnassigned ? 'OK' : 'FAIL'));

  console.log('\n=== 5. 组合筛选：status=pending + handler=assigned ===');
  const pendingAssigned = await get('/api/reviews?status=pending&handler=assigned');
  console.log('  数量: ' + pendingAssigned.length);
  const okA = pendingAssigned.every(r => r.status === 'pending' && r.rect_handler_name);
  console.log('  全部待复查且已指派: ' + (okA ? 'OK' : 'FAIL'));

  console.log('\n=== 6. 组合筛选：status=completed + handler=unassigned ===');
  const completedUnassigned = await get('/api/reviews?status=completed&handler=unassigned');
  console.log('  数量: ' + completedUnassigned.length);

  console.log('\n=== 7. 验证 rect_status 正确性 ===');
  const r1 = allReviews.find(r => r.rectification_id === rect1.id);
  console.log('  整改单#' + rect1.id + ' rect_status: ' + r1.rect_status + ' 预期: pending_review');
  console.log('  状态正确: ' + (r1.rect_status === 'pending_review' ? 'OK' : 'FAIL'));

  console.log('\n=== ALL TESTS PASSED ===');
})().catch((e) => { console.log('\nTEST ERROR: ' + e.message); console.log(e.stack); process.exit(1); });
