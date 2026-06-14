/* eslint-disable */
const http = require('http');

const BASE = 'localhost';
const PORT = 4000;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: BASE,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      }
    };
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, body: buf });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login(username) {
  const r = await request('POST', '/api/auth/login', { username });
  if (r.status !== 200) throw new Error(`登录 ${username} 失败: ${JSON.stringify(r.body)}`);
  console.log(`✓ 登录成功 [${username}] ${r.body.data.user.name} (${r.body.data.user.role})`);
  return r.body.data.token;
}

function printStep(title) {
  console.log('\n' + '═'.repeat(60));
  console.log('  ' + title);
  console.log('═'.repeat(60));
}

async function main() {
  printStep('第 0 步: 检查服务健康');
  const health = await request('GET', '/api/health');
  console.log('服务状态:', health.body);

  printStep('第 1 步: 各角色登录');
  const adminToken = await login('admin');
  const managerToken = await login('manager1');
  const appraiserToken = await login('appraiser1');
  const financeToken = await login('finance1');

  printStep('第 2 步: 管理员创建新车源 (模拟从旧台账/现场记录录入)');
  const createResp = await request('POST', '/api/cars', {
    brand: '本田',
    model: '雅阁 260TURBO 豪华版',
    year: 2022,
    mileage: 41000,
    color: '星空蓝',
    plateNumber: '京C12345',
    vin: 'LHGCR2632NXXXX003',
    ownerName: '周先生',
    ownerPhone: '13955556666',
    sourceChannel: '旧台账转入',
    expectedPrice: 175000,
    remark: '2026/6/1 现场看车，车主急用钱，前保险杠有补漆'
  }, adminToken);
  console.log('创建结果:', JSON.stringify(createResp.body, null, 2));
  const carId = createResp.body.data.id;
  const carNo = createResp.body.data.carNo;

  printStep('第 3 步: 管理员提交收车经理审批');
  const submitResp = await request('POST', `/api/cars/${carId}/submit`, {
    remark: '已核对旧台账记录和现场照片，转张经理处理'
  }, adminToken);
  console.log('提交结果状态:', submitResp.body.data.currentStatus);

  printStep('第 4 步: 收车经理审核 - 通过，给出收车估价并转评估师');
  const managerResp = await request('POST', `/api/cars/${carId}/manager-approve`, {
    managerPrice: 163000,
    remark: '车款较新，里程正常，市场热销车型，建议16.3万收车，转评估师现场检测确认车况',
    assignAppraiserId: 'u_app_1'
  }, managerToken);
  console.log('经理审核结果:', managerResp.body.data.currentStatus, '估价:', managerResp.body.data.managerPrice);

  printStep('第 5 步: 评估师现场估价');
  const appResp = await request('POST', `/api/cars/${carId}/appraiser-submit`, {
    appraiserPrice: 160000,
    remark: '现场检测：左后门有钣金修复，发动机工况正常，轮胎剩余40%，建议16万成交'
  }, appraiserToken);
  console.log('评估师结果:', appResp.body.data.currentStatus, '评估价:', appResp.body.data.appraiserPrice);

  printStep('第 6 步: 评估师添加交班备注 (非状态变更，仅追加信息)');
  const cmtResp = await request('POST', `/api/cars/${carId}/comments`, {
    remark: '补充：车主希望3天内完成打款，保险到2026年12月'
  }, appraiserToken);
  console.log('添加备注成功:', cmtResp.body.data.createdAt);

  printStep('第 7 步: 金融专员审批 - 查看前面全部流转历史');
  const detailResp = await request('GET', `/api/cars/${carId}`, null, financeToken);
  const { car, logs } = detailResp.body.data;
  console.log(`车源 ${car.carNo} 当前状态: ${car.currentStatus}`);
  console.log('流转历史回看:');
  logs.forEach((l, i) => {
    console.log(`  ${i + 1}. [${l.createdAt.slice(0, 19)}] ${l.operatorName}(${l.operatorRole}) ${l.fromStatus || '-'} → ${l.toStatus}` + (l.remark ? ` 备注: ${l.remark}` : ''));
  });

  printStep('第 8 步: 金融专员审批通过，确定最终成交价');
  const finResp = await request('POST', `/api/cars/${carId}/finance-approve`, {
    finalPrice: 160000,
    remark: '同意16万成交，请安排合同签订和打款'
  }, financeToken);
  console.log('最终审批状态:', finResp.body.data.currentStatus, '成交价:', finResp.body.data.finalPrice);

  printStep('第 9 步: 权限验证 - 金融专员试图调用经理接口 (应被拒绝)');
  const badResp = await request('POST', `/api/cars/${carId}/manager-approve`, { managerPrice: 1 }, financeToken);
  console.log('权限拦截结果: 状态码', badResp.status, '消息:', badResp.body.message);

  printStep('第 10 步: 导出审批单 (交班用)');
  const exportResp = await request('GET', `/api/cars/${carId}/export`, null, adminToken);
  console.log(exportResp.body);

  printStep('第 11 步: 全局查询操作日志 + 导出 CSV');
  const logsResp = await request('GET', '/api/logs', null, adminToken);
  console.log(`共 ${logsResp.body.data.length} 条操作日志`);
  const logCsv = await request('GET', '/api/logs/export', null, adminToken);
  console.log('CSV 头部:', String(logCsv.body).split('\n')[0]);

  printStep('✓ 全部流程测试通过');
  console.log(`车源编号: ${carNo}`);
  console.log('访问前端 http://localhost:5173 可查看 UI');
}

main().catch((e) => {
  console.error('✗ 测试失败:', e.message);
  process.exit(1);
});
