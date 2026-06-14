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

(async () => {
  console.log('=== 日志交班视图接口测试 ===\n');

  const login = await post('/api/auth/login', { username: 'admin' });
  const token = login.body.data.token;
  const authHeaders = { Authorization: 'Bearer ' + token };

  // 1. meta constants 检查 approvalStages 是否存在
  const meta = await get('/api/meta/constants', authHeaders);
  const metaData = JSON.parse(meta.body).data;
  console.log('1. /meta/constants:');
  console.log('   包含 approvalStages:', !!metaData.approvalStages ? '✓' : '✗');
  console.log('   approvalStages:', JSON.stringify(metaData.approvalStages));

  // 2. 日志列表是否包含上下文字段
  const logsAll = await get('/api/logs', authHeaders);
  const logsAllData = JSON.parse(logsAll.body).data;
  console.log('\n2. /api/logs（无筛选）:');
  console.log('   返回条数:', logsAllData.length);
  if (logsAllData.length > 0) {
    const first = logsAllData[0];
    console.log('   包含 carNo 字段:', 'carNo' in first ? '✓' : '✗');
    console.log('   包含 currentHandlerName:', 'currentHandlerName' in first ? '✓' : '✗');
    console.log('   包含 currentHandlerRole:', 'currentHandlerRole' in first ? '✓' : '✗');
    console.log('   包含 latestHandledAt:', 'latestHandledAt' in first ? '✓' : '✗');
    console.log('   包含 keyRemarksSummary:', 'keyRemarksSummary' in first ? '✓' : '✗');
    console.log('   包含 approvalStage:', 'approvalStage' in first ? '✓' : '✗');
    console.log('   首条数据预览:');
    console.log('     carNo:', first.carNo);
    console.log('     currentHandlerName:', first.currentHandlerName, first.currentHandlerRole ? '(' + first.currentHandlerRole + ')' : '');
    console.log('     latestHandledAt:', first.latestHandledAt);
    console.log('     approvalStage:', first.approvalStage);
    console.log('     keyRemarksSummary:', first.keyRemarksSummary?.slice(0, 60) + '...');
  }

  // 3. 按责任角色筛选（manager）
  const logsByRole = await get('/api/logs?handlerRole=manager', authHeaders);
  const logsByRoleData = JSON.parse(logsByRole.body).data;
  console.log('\n3. /api/logs?handlerRole=manager:');
  console.log('   返回条数:', logsByRoleData.length);
  if (logsByRoleData.length > 0) {
    const allManager = logsByRoleData.every(l => l.currentHandlerRole === 'manager' || ['approved', 'rejected', 'cancelled'].includes(l.toStatus));
    console.log('   责任人均为 manager（或已结束）:', allManager ? '✓' : '✗');
  }

  // 4. 按审批阶段筛选（finance）
  const logsByStage = await get('/api/logs?stage=finance', authHeaders);
  const logsByStageData = JSON.parse(logsByStage.body).data;
  console.log('\n4. /api/logs?stage=finance:');
  console.log('   返回条数:', logsByStageData.length);
  if (logsByStageData.length > 0) {
    const allFinance = logsByStageData.every(l => l.approvalStage === 'finance');
    console.log('   阶段均为 finance:', allFinance ? '✓' : '✗');
    logsByStageData.slice(0, 2).forEach(l => {
      console.log('     carNo:', l.carNo, 'stage:', l.approvalStage, 'handler:', l.currentHandlerName);
    });
  }

  // 5. 按审批阶段筛选（done）
  const logsByDone = await get('/api/logs?stage=done', authHeaders);
  const logsByDoneData = JSON.parse(logsByDone.body).data;
  console.log('\n5. /api/logs?stage=done:');
  console.log('   返回条数:', logsByDoneData.length);
  if (logsByDoneData.length > 0) {
    const allDone = logsByDoneData.every(l => l.approvalStage === 'done');
    console.log('   阶段均为 done:', allDone ? '✓' : '✗');
  }

  // 6. 组合筛选（stage=appraiser + handlerRole=appraiser）
  const logsCombined = await get('/api/logs?stage=appraiser&handlerRole=appraiser', authHeaders);
  const logsCombinedData = JSON.parse(logsCombined.body).data;
  console.log('\n6. /api/logs?stage=appraiser&handlerRole=appraiser:');
  console.log('   返回条数:', logsCombinedData.length);

  console.log('\n=== 测试完成 ===');
})();
