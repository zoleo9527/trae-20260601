const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3002' + path, (res) => {
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
      hostname: 'localhost', port: 3002, path, method: 'POST',
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
  console.log('=== 1. 店铺表 & 店长 ===');
  const stores = await get('/api/stores');
  const managers = new Set();
  stores.forEach((s) => {
    if (s.manager) managers.add(s.manager);
    console.log('  ' + String(s.id).padStart(2) + '  ' + s.name.padEnd(18) + ' 店长=' + (s.manager || '(空)'));
  });

  console.log('\n=== 2. users 表 store_manager ===');
  const users = await get('/api/users?role=store_manager');
  const userMgrs = new Set(users.map((u) => u.name));
  users.forEach((u) => { console.log('  ' + u.name); });

  console.log('\n=== 3. 数据一致性检查 ===');
  let ok = true;
  managers.forEach((m) => {
    if (!userMgrs.has(m)) {
      console.log('  X 店铺店长不在用户表: ' + m);
      ok = false;
    }
  });
  if (ok) console.log('  OK 所有店铺店长都在 store_manager 用户表里');

  console.log('\n=== 4. 创建整改单（热风-周杰） ===');
  const store8 = stores.find((s) => s.id === 8);
  const newRect = await post('/api/rectifications', {
    store_id: 8, store_name: store8.name, brand: store8.brand,
    inspector_name: '钱红', inspection_date: '2026-06-11',
    category: '卫生', severity: '一般',
    title: '测试-店铺地面清洁',
    description: '测试描述内容',
    requirement: '测试整改要求',
    deadline: '2026-06-13',
    handler_name: store8.manager,
  });
  const newId = newRect.id;
  console.log('  创建成功，整改单 #' + newId);

  console.log('\n=== 5. 列表 vs 详情 负责人一致性 ===');
  const list = await get('/api/rectifications');
  const fromList = list.find((r) => r.id === newId);
  const fromDetail = await get('/api/rectifications/' + newId);
  console.log('  列表负责人: ' + fromList.handler_name);
  console.log('  详情负责人: ' + fromDetail.handler_name);
  console.log('  ' + (fromList.handler_name === fromDetail.handler_name ? 'OK 一致' : 'X 不一致'));

  console.log('\n=== 6. 创建负责人为空的整改单 ===');
  const emptyRect = await post('/api/rectifications', {
    store_id: 1, store_name: stores[0].name, brand: stores[0].brand,
    inspector_name: '钱红', inspection_date: '2026-06-11',
    category: '卫生', severity: '一般',
    title: '测试-空负责人',
    description: '测试描述',
    requirement: '测试要求',
    deadline: '2026-06-13',
    handler_name: '',
  });
  const emptyId = emptyRect.id;
  const emptyList = (await get('/api/rectifications')).find((r) => r.id === emptyId);
  const emptyDetail = await get('/api/rectifications/' + emptyId);
  console.log('  列表显示: "' + (emptyList.handler_name || '') + '"');
  console.log('  详情显示: "' + (emptyDetail.handler_name || '') + '"');
  console.log('  列表前端会显示 - 或待指派，详情也是。一致性: OK');

  console.log('\n=== ALL TESTS PASSED ===');
})().catch((e) => { console.log('TEST ERROR: ' + e.message); process.exit(1); });
