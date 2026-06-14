const http = require('http');

function get(path, headers = {}) {
  return new Promise((resolve) => {
    http.get({ hostname: 'localhost', port: 4000, path, headers }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
  });
}

function post(path, body, headers = {}) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { hostname: 'localhost', port: 4000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } },
      (res) => {
        let d = '';
        res.on('data', (c) => d += c);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
      }
    );
    req.write(data);
    req.end();
  });
}

function countCsvLines(body) {
  const lines = body.split('\n').filter(l => l.trim().length > 0);
  return lines.length - 1;
}

(async () => {
  console.log('=== 日志列表 vs 导出数据一致性测试 ===\n');

  const login = await post('/api/auth/login', { username: 'admin' });
  const token = login.body.data.token;
  const authHeaders = { Authorization: 'Bearer ' + token };

  const testCases = [
    { name: '无筛选', query: '' },
    { name: '按操作人筛选(u_mgr_1)', query: 'operatorId=u_mgr_1' },
    { name: '按责任角色筛选(manager)', query: 'handlerRole=manager' },
    { name: '按责任角色筛选(appraiser)', query: 'handlerRole=appraiser' },
    { name: '按审批阶段筛选(done)', query: 'stage=done' },
    { name: '按审批阶段筛选(appraiser)', query: 'stage=appraiser' },
    { name: '组合筛选(stage=appraiser + handlerRole=appraiser)', query: 'stage=appraiser&handlerRole=appraiser' },
  ];

  let allPass = true;
  for (const tc of testCases) {
    const listRes = await get('/api/logs?' + tc.query, authHeaders);
    const listData = JSON.parse(listRes.body).data;
    const listCount = listData.length;

    const exportRes = await get('/api/logs/export?' + tc.query, authHeaders);
    const exportCount = countCsvLines(exportRes.body);

    const match = listCount === exportCount;
    if (!match) allPass = false;
    console.log(`${tc.name}: 列表 ${listCount} 条 / 导出 ${exportCount} 条 ${match ? '✓ 一致' : '✗ 不一致'}`);

    if (listData.length > 0 && exportCount > 0) {
      const first = listData[0];
      const csvFirstLine = exportRes.body.split('\n').slice(1, 2)[0];
      const hasApprovalStage = exportRes.body.split('\n')[0].includes('审批阶段');
      console.log(`   CSV 包含审批阶段列: ${hasApprovalStage ? '✓' : '✗'}`);
      console.log(`   列表首条 carNo=${first.carNo}, stage=${first.approvalStage}, handler=${first.currentHandlerName}`);
    }
    console.log('');
  }

  console.log(allPass ? '✅ 全部通过：列表与导出数据量完全一致' : '❌ 存在不一致的情况');
  console.log('\n=== 测试完成 ===');
})();
