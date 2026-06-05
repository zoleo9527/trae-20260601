const http = require('http');

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '3',
      },
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('=== 测试首页工作面摘要 ===\n');

  console.log('1. 推进申请1到 FEE_PENDING...');
  await request('POST', '/api/bookings/1/status', { status: 'FEE_PENDING' });

  console.log('2. 驳回申请1（带备注）...');
  await request('POST', '/api/fee-reviews/1/reject', {
    reason: '金额不对，需要核实',
    note: '客户说只来了3个人，按300元收费'
  });

  console.log('3. 推进申请3到待审核...');
  await request('POST', '/api/bookings/3/status', { status: 'PENDING_REVIEW' });

  console.log('\n=== /api/dashboard/overview pendingItems ===');
  const overview = await request('GET', '/api/dashboard/overview');
  const p = overview.data.pendingItems;
  console.log('待审核:', p.awaitingReview.count, '条');
  console.log('待费用:', p.awaitingFee.count, '条');
  console.log('被驳回:', p.feeRejected.count, '条');

  if (p.feeRejected.items.length > 0) {
    const item = p.feeRejected.items[0];
    const s = item.summary;
    console.log('\n驳回项 -', item.customerName);
    console.log('  当前卡点:', s.blockPoint, '(level:', s.blockLevel, ')');
    console.log('  最近操作人:', s.latestOperator.name, '-', s.latestOperator.role);
    console.log('  最近操作时间:', new Date(s.latestOperatedAt).toLocaleString('zh-CN'));
    console.log('  最近动作:', s.latestAction);
    console.log('  备注摘要:', s.noteSummary ? s.noteSummary.content : '无');
    if (s.noteSummary) {
      console.log('  备注创建人:', s.noteSummary.createdBy.name, '-', s.noteSummary.stage);
    }
    console.log('  费用结论:', s.feeConclusion ? JSON.stringify(s.feeConclusion) : 'null');
    console.log('  优先级:', item.priorityLabel, '-', s.priorityExplanation);
    console.log('  等待时长:', s.waitHours, '小时');
  }

  if (p.awaitingReview.items.length > 0) {
    const item = p.awaitingReview.items[0];
    const s = item.summary;
    console.log('\n待审核项 -', item.customerName);
    console.log('  当前卡点:', s.blockPoint);
    console.log('  最近操作人:', s.latestOperator.name);
    console.log('  备注摘要:', s.noteSummary ? s.noteSummary.content : '无');
    console.log('  优先级说明:', s.priorityExplanation);
  }

  console.log('\n=== /api/dashboard/blocked ===');
  const blocked = await request('GET', '/api/dashboard/blocked');
  console.log('阻塞项数量:', blocked.data.length);
  if (blocked.data.length > 0) {
    blocked.data.forEach((item, i) => {
      console.log(`  ${i+1}. ${item.customerName} - ${item.summary.blockPoint} - ${item.summary.latestOperator.name}`);
    });
  } else {
    console.log('  暂无阻塞项（需超过24小时未处理才会进入）');
  }

  console.log('\n✅ 测试完成！前端只需要这两个接口就能看全摘要信息');
}

main().catch(console.error);
