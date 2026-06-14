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
  console.log('=== 导出接口鉴权测试 ===\n');

  // 1. 无 token
  const r1 = await get('/api/cars/fake/export');
  console.log('1. 无 token 导出审批单:', r1.status, '→', r1.status === 401 ? '✓ 正确拦截' : '✗ 有问题');

  // 2. 登录
  const login = await post('/api/auth/login', { username: 'admin' });
  const token = login.body.data.token;
  console.log('2. 登录获取 token 成功');

  // 3. 获取车源 ID
  const cars = await get('/api/cars', { Authorization: 'Bearer ' + token });
  const carsData = JSON.parse(cars.body).data;
  const carId = carsData[0].id;
  console.log('3. 获取车源 ID:', carId);

  // 4. query token 导出审批单
  const r4 = await get(`/api/cars/${carId}/export?token=${token}`);
  const hasTxt = r4.body.includes('二手车源收购审批单');
  console.log('4. query token 导出审批单:', r4.status, hasTxt ? '✓ 内容正确' : '✗ 内容异常');
  console.log('   正文预览:', r4.body.slice(0, 80).replace(/\n/g, ' '));

  // 5. Authorization header 导出审批单
  const r5 = await get(`/api/cars/${carId}/export`, { Authorization: 'Bearer ' + token });
  const hasTxt2 = r5.body.includes('二手车源收购审批单');
  console.log('5. header token 导出审批单:', r5.status, hasTxt2 ? '✓ 内容正确' : '✗ 内容异常');

  // 6. query token 导出日志 CSV
  const r6 = await get(`/api/logs/export?token=${token}`);
  const hasCsv = r6.body.includes('时间,操作人');
  console.log('6. query token 导出日志 CSV:', r6.status, hasCsv ? '✓ 内容正确' : '✗ 内容异常');
  console.log('   CSV 首行:', r6.body.split('\n')[0]);

  // 7. 检查 Content-Disposition 中文文件名
  const cd = r5.headers['content-disposition'];
  console.log('7. Content-Disposition:', cd);
  console.log('   包含 UTF-8 文件名:', cd && cd.includes("filename*=UTF-8''") ? '✓ 是' : '✗ 否');

  console.log('\n=== 测试完成 ===');
})();
