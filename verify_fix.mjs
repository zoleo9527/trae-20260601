import http from 'http';

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

  console.log('=== 1. 金额汇总 ===');
  console.log(`应得佣金: ${(s.commissionAmount/100).toFixed(2)}元`);
  console.log(`称重补差: ${(s.weightAdjustment/100).toFixed(2)}元`);
  console.log(`退款扣除: ${(s.refundAmount/100).toFixed(2)}元`);
  console.log(`赔付扣除: ${(s.compensationAmount/100).toFixed(2)}元`);
  console.log(`佣金调整: ${(s.commissionAdjust/100).toFixed(2)}元`);
  console.log(`结算净额: ${(s.netSettlement/100).toFixed(2)}元`);
  console.log();

  console.log('=== 2. 关键修复验证 ===');
  console.log(`✅ 称重补差 = -100分（不含缺货的-8900）: ${s.weightAdjustment === -100}`);
  console.log(`✅ 退款扣除 = 8900分（车厘子缺货）: ${s.refundAmount === 8900}`);
  console.log(`✅ 净额 = -5167分（无重复计算）: ${s.netSettlement === -5167}`);

  const compLine = s.detailLines.find(l => l.lineType === 'compensation');
  console.log(`✅ 坏果率在计算依据中: ${compLine?.calculationDetail?.includes('坏果率40%')}`);
  console.log();

  console.log('=== 3. 明细行分类 ===');
  let currentCategory = '';
  for (const line of s.detailLines) {
    if (line.lineType === 'summary' && line.description.startsWith('=====')) {
      currentCategory = line.description.replace(/=====/g, '').trim();
      console.log(`\n${currentCategory}  小计: ${(line.amount/100).toFixed(2)}元`);
    } else if (line.lineType === 'summary') {
      console.log(`\n结算汇总: ${(line.amount/100).toFixed(2)}元  ${line.calculationDetail}`);
    } else {
      console.log(`  - ${line.description}: ${(line.amount/100).toFixed(2)}元`);
    }
  }

  console.log('\n=== 4. 团长查看接口 ===');
  const leaderView = await fetchJSON(`/api/leaders/${leaderId}/settlements/${s.id}`);
  const lv = leaderView.data;
  console.log(`团长看到净额: ${(lv.netSettlement/100).toFixed(2)}元`);
  console.log(`明细行数: ${lv.detailLines.length}`);
  console.log(`与结算单一致: ${lv.netSettlement === s.netSettlement}`);
}

main().catch(console.error);
