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
  console.log('=== 快照串单修复验证 ===\n');

  execSync('rm -f prisma/dev.db && npx prisma db push --accept-data-loss && pnpm seed', {
    cwd: '/Users/zhangliu/Documents/private/model-test/trae-20260601-2',
    stdio: 'pipe',
  });

  const batches = await fetchJSON('/api/batches');
  const batchId = batches.data[0].id;
  const leaderId = batches.data[0].groupPoint.leaderId;

  const settlement = await fetchJSON('/api/settlements', 'POST', {
    leaderId,
    periodStart: '2026-06-01T00:00:00.000Z',
    periodEnd: '2026-06-02T23:59:59.999Z',
    batchIds: [batchId],
    createdBy: '运营-小张',
  });
  const s = settlement.data;
  const settlementId = s.id;

  const original = await fetchJSON(`/api/settlements/${settlementId}`);
  const origRefunds = original.data.detailLines.filter(l => l.lineType === 'refund').length;
  const origWeights = original.data.detailLines.filter(l => l.lineType === 'weight').length;
  const origComp = original.data.detailLines.filter(l => l.lineType === 'compensation').length;
  const origNet = original.data.netSettlement;
  const origWeightAdj = original.data.weightAdjustment;

  console.log(`1️⃣  创建结算单，快照时刻:`);
  console.log(`   退款: ${origRefunds}条, 称重: ${origWeights}条, 赔付: ${origComp}条`);
  console.log(`   净额: ${origNet}分, 称重补差: ${origWeightAdj}分\n`);

  const orders = await fetchJSON('/api/orders');
  const order2 = orders.data.find(o => o.orderNo === 'ORD202606010002');
  const order1 = orders.data.find(o => o.orderNo === 'ORD202606010001');

  console.log('2️⃣  结算后新增2条售后（模拟串单场景）...');
  const newAs1 = await fetchJSON('/api/after-sales', 'POST', {
    orderId: order2.id, type: 'BAD_PRODUCT', reason: '鸡蛋破损(结算后新增)',
    badQuantity: 2, totalQuantity: 2, handledBy: '客服-小王',
  });
  if (newAs1.data) {
    await fetchJSON(`/api/after-sales/${newAs1.data.id}/handle`, 'POST', { status: 'APPROVED', handledBy: '客服-小王' });
    console.log(`   ✅ 新增坏果售后: ${newAs1.data.afterSaleNo}`);
  }

  const newAs2 = await fetchJSON('/api/after-sales', 'POST', {
    orderId: order1.id, type: 'OUT_OF_STOCK', reason: '苹果部分缺货(结算后新增)',
    productId: order1.items[0].productId, quantity: 1, handledBy: '客服-小王',
  });
  if (newAs2.data) {
    await fetchJSON(`/api/after-sales/${newAs2.data.id}/handle`, 'POST', { status: 'APPROVED', handledBy: '客服-小王' });
    console.log(`   ✅ 新增缺货售后: ${newAs2.data.afterSaleNo}`);
  }

  const pendingAs = await fetchJSON('/api/after-sales', 'POST', {
    orderId: order2.id, type: 'OTHER', reason: '其他问题(未审批)',
  });
  console.log(`   ⚠️  新增未审批售后: ${pendingAs.data?.afterSaleNo || 'N/A'}\n`);

  console.log('3️⃣  验证结算详情快照隔离...');
  const after = await fetchJSON(`/api/settlements/${settlementId}`);
  const afterRefunds = after.data.detailLines.filter(l => l.lineType === 'refund').length;
  const afterWeights = after.data.detailLines.filter(l => l.lineType === 'weight').length;
  const afterComp = after.data.detailLines.filter(l => l.lineType === 'compensation').length;

  const r1 = afterRefunds === origRefunds;
  const r2 = afterWeights === origWeights;
  const r3 = afterComp === origComp;
  const r4 = after.data.netSettlement === origNet;
  const r5 = after.data.weightAdjustment === origWeightAdj;

  console.log(`   退款明细不变 (${afterRefunds} vs ${origRefunds}): ${r1 ? '✅' : '❌'}`);
  console.log(`   称重明细不变 (${afterWeights} vs ${origWeights}): ${r2 ? '✅' : '❌'}`);
  console.log(`   赔付明细不变 (${afterComp} vs ${origComp}): ${r3 ? '✅' : '❌'}`);
  console.log(`   净额不变 (${after.data.netSettlement} vs ${origNet}): ${r4 ? '✅' : '❌'}`);
  console.log(`   称重补差不变 (${after.data.weightAdjustment} vs ${origWeightAdj}): ${r5 ? '✅' : '❌'}\n`);

  console.log('4️⃣  验证团长查看接口...');
  const leaderView = await fetchJSON(`/api/leaders/${leaderId}/settlements/${settlementId}`);
  const lr = leaderView.data.netSettlement === origNet && leaderView.data.weightAdjustment === origWeightAdj;
  console.log(`   团长净额: ${leaderView.data.netSettlement}分, 称重补差: ${leaderView.data.weightAdjustment}分: ${lr ? '✅' : '❌'}\n`);

  const allPassed = r1 && r2 && r3 && r4 && r5 && lr;
  console.log('=== 最终结果 ===');
  console.log(allPassed ? '✅ 快照串单修复验证全部通过！后续新增/未通过的记录不会混入结算详情' : '❌ 快照隔离存在问题');
}

main().catch(console.error);
