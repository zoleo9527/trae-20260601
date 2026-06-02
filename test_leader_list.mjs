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
  console.log('=== 团长结算列表接口测试 ===\n');

  execSync('rm -f prisma/dev.db && npx prisma db push --accept-data-loss && pnpm seed', {
    cwd: '/Users/zhangliu/Documents/private/model-test/trae-20260601-2',
    stdio: 'pipe',
  });

  const batches = await fetchJSON('/api/batches');
  const batchId = batches.data[0].id;
  const leaderId = batches.data[0].groupPoint.leaderId;
  const leaderName = batches.data[0].groupPoint.leader.name;

  console.log(`团长: ${leaderName}`);
  console.log(`团长ID: ${leaderId}\n`);

  // 创建1号结算单（草稿）
  const s1 = await fetchJSON('/api/settlements', 'POST', {
    leaderId,
    periodStart: '2026-06-01T00:00:00.000Z',
    periodEnd: '2026-06-02T23:59:59.999Z',
    batchIds: [batchId],
    createdBy: '运营-小张',
  });
  console.log(`1️⃣  创建结算单1: ${s1.data.settlementNo} (DRAFT)`);

  // 创建2号结算单并锁定
  const batches2 = await fetchJSON('/api/batches');
  const s2 = await fetchJSON('/api/settlements', 'POST', {
    leaderId,
    periodStart: '2026-05-20T00:00:00.000Z',
    periodEnd: '2026-05-27T23:59:59.999Z',
    batchIds: [batchId],
    createdBy: '运营-小张',
  });
  await fetchJSON(`/api/settlements/${s2.data.id}/lock`, 'POST', { lockedBy: '财务-李姐' });
  console.log(`2️⃣  创建结算单2: ${s2.data.settlementNo} (LOCKED)\n`);

  // 测试1: 团长查看全部结算单
  console.log('3️⃣  团长查看全部结算单:');
  const all = await fetchJSON(`/api/leaders/${leaderId}/settlements`);
  for (const s of all.data) {
    console.log(`   ● ${s.settlementNo}`);
    console.log(`     状态: ${s.status} | 争议标记: ${s.isDisputed ? '是' : '否'}`);
    console.log(`     周期: ${s.periodStart.split('T')[0]} ~ ${s.periodEnd.split('T')[0]}`);
    console.log(`     净额: ${(s.netSettlement/100).toFixed(2)}元 | 退款: ${(s.refundAmount/100).toFixed(2)}元 | 赔付: ${(s.compensationAmount/100).toFixed(2)}元 | 调整: ${(s.commissionAdjust/100).toFixed(2)}元`);
    console.log(`     订单: ${s.orderCount}批 | 售后: ${s.afterSaleCount}笔 | 调整: ${s.adjustmentCount}条`);
  }
  console.log(`   共 ${all.data.length} 条记录\n`);

  // 测试2: 按状态筛选
  console.log('4️⃣  按状态筛选 (LOCKED):');
  const locked = await fetchJSON(`/api/leaders/${leaderId}/settlements?status=LOCKED`);
  console.log(`   找到 ${locked.data.length} 条 LOCKED 记录`);
  for (const s of locked.data) {
    console.log(`   ● ${s.settlementNo} (${s.status}) 净额: ${(s.netSettlement/100).toFixed(2)}元`);
  }
  console.log();

  // 测试3: 验证摘要字段完整性
  console.log('5️⃣  验证摘要字段完整性:');
  const s = all.data[0];
  const requiredFields = ['id', 'settlementNo', 'periodStart', 'periodEnd', 'status', 
    'netSettlement', 'refundAmount', 'compensationAmount', 'commissionAdjust', 
    'isDisputed', 'orderCount', 'afterSaleCount', 'adjustmentCount', 'createdAt'];
  const missing = requiredFields.filter(f => !(f in s));
  console.log(`   所有必填字段存在: ${missing.length === 0 ? '✅' : '❌'}`);
  if (missing.length > 0) console.log(`   缺失字段: ${missing.join(', ')}`);

  // 测试4: 团长先看列表再进明细
  console.log('\n6️⃣  模拟团长流程: 列表 → 查看明细');
  const firstSettlement = all.data[0];
  const detail = await fetchJSON(`/api/leaders/${leaderId}/settlements/${firstSettlement.id}`);
  console.log(`   从列表进入: ${firstSettlement.settlementNo}`);
  console.log(`   净额一致: ${detail.data.netSettlement === firstSettlement.netSettlement ? '✅' : '❌'}`);
  console.log(`   明细行数: ${detail.data.detailLines.length} 条`);

  // 测试5: 无效状态参数验证
  console.log('\n7️⃣  无效状态参数验证:');
  const invalid = await fetchJSON(`/api/leaders/${leaderId}/settlements?status=INVALID`);
  console.log(`   无效参数被拦截: ${!invalid.success ? '✅' : '❌'}`);

  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
