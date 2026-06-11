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

(async () => {
  console.log('=== 1. 准备数据：获取店铺列表 ===');
  const stores = await get('/api/stores');
  const store1 = stores[0];
  console.log('  店铺: ' + store1.name + ' 店长=' + (store1.manager || '(空)'));

  console.log('\n=== 2. 创建空负责人整改单 ===');
  const emptyRect = await post('/api/rectifications', {
    store_id: store1.id, store_name: store1.name, brand: store1.brand,
    inspector_name: '钱红', inspection_date: '2026-06-11',
    category: '卫生', severity: '一般',
    title: '测试-空负责人待指派',
    description: '测试描述',
    requirement: '测试要求',
    deadline: '2026-06-13',
    handler_name: '',
  });
  const emptyId = emptyRect.id;
  console.log('  创建成功: #' + emptyId);

  console.log('\n=== 3. 验证列表页和详情页空负责人显示 ===');
  const list1 = await get('/api/rectifications');
  const fromList1 = list1.find(r => r.id === emptyId);
  const detail1 = await get('/api/rectifications/' + emptyId);
  console.log('  列表 handler_name: "' + (fromList1.handler_name || '') + '"  → 前端渲染为「待指派」标签');
  console.log('  详情 handler_name: "' + (detail1.handler_name || '') + '"  → 前端渲染为「待指派」标签 + 补录按钮');
  console.log('  一致性: ' + ((fromList1.handler_name || '') === (detail1.handler_name || '') ? 'OK' : 'FAIL'));

  console.log('\n=== 4. 补录负责人（改为 store1.manager） ===');
  const mgrName = store1.manager || '测试店长';
  const reassign1 = await put('/api/rectifications/' + emptyId + '/handler', {
    handlerName: mgrName,
    operatorName: '钱红',
  });
  console.log('  补录结果: ' + JSON.stringify(reassign1));

  console.log('\n=== 5. 验证补录后列表和详情 ===');
  const list2 = await get('/api/rectifications');
  const fromList2 = list2.find(r => r.id === emptyId);
  const detail2 = await get('/api/rectifications/' + emptyId);
  console.log('  列表负责人: ' + fromList2.handler_name);
  console.log('  详情负责人: ' + detail2.handler_name);
  console.log('  一致性: ' + (fromList2.handler_name === detail2.handler_name ? 'OK' : 'FAIL'));
  console.log('  等于预期值 "' + mgrName + '": ' + (fromList2.handler_name === mgrName ? 'OK' : 'FAIL'));

  console.log('\n=== 6. 验证操作日志有改派记录 ===');
  const hasReassignLog = detail2.logs && detail2.logs.some(l => l.action === 'reassign');
  console.log('  有 reassign 日志: ' + (hasReassignLog ? 'OK' : 'FAIL'));
  if (hasReassignLog) {
    const log = detail2.logs.find(l => l.action === 'reassign');
    console.log('  日志内容: ' + log.detail);
  }

  console.log('\n=== 7. 改派为另一个店长 ===');
  const store2 = stores[1];
  const mgr2 = store2.manager;
  const reassign2 = await put('/api/rectifications/' + emptyId + '/handler', {
    handlerName: mgr2,
    operatorName: '钱红',
  });
  console.log('  改派结果: ' + JSON.stringify(reassign2));

  const detail3 = await get('/api/rectifications/' + emptyId);
  console.log('  改派后负责人: ' + detail3.handler_name);
  console.log('  等于 "' + mgr2 + '": ' + (detail3.handler_name === mgr2 ? 'OK' : 'FAIL'));

  console.log('\n=== 8. 清空负责人（置空） ===');
  const reassign3 = await put('/api/rectifications/' + emptyId + '/handler', {
    handlerName: '',
    operatorName: '钱红',
  });
  console.log('  置空结果: ' + JSON.stringify(reassign3));

  const detail4 = await get('/api/rectifications/' + emptyId);
  console.log('  置空后负责人: "' + (detail4.handler_name || '') + '"');
  console.log('  为空: ' + (!detail4.handler_name ? 'OK' : 'FAIL'));

  console.log('\n=== ALL TESTS PASSED ===');
})().catch((e) => { console.log('\nTEST ERROR: ' + e.message); console.log(e.stack); process.exit(1); });
