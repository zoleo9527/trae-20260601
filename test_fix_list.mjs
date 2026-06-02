import http from 'http';
import { execSync } from 'child_process';

function fetchJSON(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== 结算列表修复验证 ===\n');

  execSync('rm -f prisma/dev.db && npx prisma db push --accept-data-loss && pnpm seed', {
    cwd: '/Users/zhangliu/Documents/private/model-test/trae-20260601-2',
    stdio: 'pipe',
  });

  const batches = await fetchJSON('/api/batches');
  const batchId = batches.data[0].id;
  const leaderId = batches.data[0].groupPoint.leaderId;

  const s = await fetchJSON('/api/settlements', 'POST', {
    leaderId,
    periodStart: '2026-06-01T00:00:00.000Z',
    periodEnd: '2026-06-02T23:59:59.999Z',
    batchIds: [batchId],
    createdBy: '运营-小张',
  });

  // 1. 验证团长列表摘要字段
  console.log('1️⃣  验证团长结算摘要:');
  const list = await fetchJSON(`/api/leaders/${leaderId}/settlements`);
  const item = list.data[0];

  console.log(`   settlementNo: ${item.settlementNo}`);
  console.log(`   batchCount: ${item.batchCount}`);
  console.log(`   orderCount: ${item.orderCount}`);
  console.log(`   afterSaleCount: ${item.afterSaleCount}`);
  console.log(`   adjustmentCount: ${item.adjustmentCount}`);

  const batchCountExists = 'batchCount' in item;
  const orderCountCorrect = item.orderCount === 3;
  const batchCountCorrect = item.batchCount === 1;
  const notConfused = item.batchCount !== item.orderCount;

  console.log(`   batchCount 字段存在: ${batchCountExists ? '✅' : '❌'}`);
  console.log(`   orderCount=3 (3笔订单): ${orderCountCorrect ? '✅' : '❌'}`);
  console.log(`   batchCount=1 (1个批次): ${batchCountCorrect ? '✅' : '❌'}`);
  console.log(`   不再混淆批次数与订单数: ${notConfused ? '✅' : '❌'}\n`);

  // 2. 验证运营列表接口 leaderId + status 参数解析
  console.log('2️⃣  验证运营列表参数解析:');
  const withLeader = await fetchJSON(`/api/settlements?leaderId=${leaderId}`);
  console.log(`   leaderId 筛选: ${withLeader.data.length > 0 ? '✅' : '❌'}`);

  const withStatus = await fetchJSON(`/api/settlements?status=DRAFT`);
  console.log(`   status 筛选: ${withStatus.data.length > 0 ? '✅' : '❌'}`);

  const withBoth = await fetchJSON(`/api/settlements?leaderId=${leaderId}&status=DRAFT`);
  console.log(`   双参数筛选: ${withBoth.data.length > 0 ? '✅' : '❌'}`);

  const invalid = await fetchJSON(`/api/settlements?status=INVALID`);
  console.log(`   无效状态被拦截: ${!invalid.success ? '✅' : '❌'}\n`);

  // 3. 验证列表与明细结构一致
  console.log('3️⃣  验证列表与明细结构一致:');
  const detail = await fetchJSON(`/api/leaders/${leaderId}/settlements/${s.data.id}`);
  const fields = ['netSettlement', 'refundAmount', 'compensationAmount', 'commissionAdjust', 'status'];
  const consistent = fields.every(f => item[f] === detail.data[f]);
  console.log(`   金额字段一致: ${consistent ? '✅' : '❌'}`);
  console.log(`   净额: 列表=${item.netSettlement} 明细=${detail.data.netSettlement}\n`);

  console.log('=== 完成 ===');
}

main().catch(console.error);
