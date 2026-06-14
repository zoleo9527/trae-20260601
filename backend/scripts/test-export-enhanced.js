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
  console.log('=== 导出增强功能测试 ===\n');

  const login = await post('/api/auth/login', { username: 'admin' });
  const token = login.body.data.token;
  console.log('1. 登录成功');

  const cars = await get('/api/cars', { Authorization: 'Bearer ' + token });
  const carsData = JSON.parse(cars.body).data;
  const carId = carsData[0].id;
  console.log('2. 获取车源 ID:', carId, `(${carsData[0].carNo})`);

  // --- 审批单导出：检查交班关键信息 ---
  const rApproval = await get(`/api/cars/${carId}/export`, { Authorization: 'Bearer ' + token });
  const hasHandover = rApproval.body.includes('交班关键信息');
  const hasHandler = rApproval.body.includes('当前责任人');
  const hasLatestTime = rApproval.body.includes('最近处理时间');
  const hasKeyRemarks = rApproval.body.includes('关键备注摘要');
  console.log('3. 审批单导出:');
  console.log('   交班关键信息段:', hasHandover ? '✓' : '✗');
  console.log('   当前责任人:', hasHandler ? '✓' : '✗');
  console.log('   最近处理时间:', hasLatestTime ? '✓' : '✗');
  console.log('   关键备注摘要:', hasKeyRemarks ? '✓' : '✗');

  // 找到交班关键信息段，打印出来
  const handoverStart = rApproval.body.indexOf('--- 交班关键信息 ---');
  const handoverEnd = rApproval.body.indexOf('--- 流转历史');
  if (handoverStart > 0 && handoverEnd > 0) {
    console.log('   交班段内容:');
    rApproval.body.slice(handoverStart, handoverEnd).trim().split('\n').forEach(line => console.log('     ' + line));
  }

  // --- 日志 CSV 导出：检查新增列 ---
  const rLogsAll = await get('/api/logs/export', { Authorization: 'Bearer ' + token });
  const csvLines = rLogsAll.body.split('\n');
  const csvHeader = csvLines[0];
  console.log('\n4. 日志 CSV 导出（无筛选）:');
  console.log('   表头:', csvHeader);
  const hasHandlerCol = csvHeader.includes('当前责任人');
  const hasLatestTimeCol = csvHeader.includes('最近处理时间');
  const hasKeyRemarksCol = csvHeader.includes('关键备注摘要');
  console.log('   当前责任人列:', hasHandlerCol ? '✓' : '✗');
  console.log('   最近处理时间列:', hasLatestTimeCol ? '✓' : '✗');
  console.log('   关键备注摘要列:', hasKeyRemarksCol ? '✓' : '✗');

  // --- 日志 CSV 导出：带筛选条件 ---
  const rLogsFiltered = await get('/api/logs/export?operatorId=u_admin&operationType=create', { Authorization: 'Bearer ' + token });
  const filteredLines = rLogsFiltered.body.split('\n');
  console.log('\n5. 日志 CSV 导出（筛选: operatorId=u_admin, operationType=create）:');
  console.log('   总行数（含表头）:', filteredLines.length);
  console.log('   表头:', filteredLines[0]);
  if (filteredLines.length > 1) {
    console.log('   数据行1:', filteredLines[1].slice(0, 120) + '...');
  }

  // --- 日志 CSV 导出：只按操作人筛选 ---
  const rLogsByOp = await get('/api/logs/export?operatorId=u_mgr_1', { Authorization: 'Bearer ' + token });
  const opLines = rLogsByOp.body.split('\n');
  console.log('\n6. 日志 CSV 导出（筛选: operatorId=u_mgr_1）:');
  console.log('   总行数:', opLines.length);

  console.log('\n=== 测试完成 ===');
})();
