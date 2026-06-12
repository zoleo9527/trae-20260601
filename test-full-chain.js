const http = require('http');

function req(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost', port: 3001, path, method,
      headers: {
        'Authorization': token ? 'Bearer ' + token : '',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const r = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve({ _status: res.statusCode, _body: body }); }
      });
    });
    r.on('error', reject);
    r.write(data);
    r.end();
  });
}

const GET = (p, t) => req('GET', p, t);
const POST = (p, t, b) => req('POST', p, t, b);

async function main() {
  let pass = 0, fail = 0;
  const check = (name, actual, expected) => {
    if (actual === expected) { console.log(`  ✓ ${name}`); pass++; }
    else { console.log(`  ✗ ${name}: expected ${expected}, got ${actual}`); fail++; }
  };

  console.log('=== 全链路验证 ===\n');

  const c = await POST('/api/auth/login', '', { username: 'consultant', password: '123456' });
  const m = await POST('/api/auth/login', '', { username: 'manager', password: '123456' });
  const ct = c.token, mt = m.token;

  // 1. 预约看房
  console.log('【1】预约看房 → 房源联动');
  const props = await GET('/api/properties', ct);
  const vacant = props.find(p => p.status === 'vacant');
  if (!vacant) { console.log('  跳过：无空置房源\n'); }
  else {
    const v = await POST('/api/viewings', ct, {
      propertyId: vacant.id, customerName: '链路客户', customerPhone: '13800000000',
      scheduledAt: new Date(Date.now() + 86400000).toISOString()
    });
    check('创建看房记录', !!v.id, true);
    const p1 = await GET('/api/properties/' + vacant.id, ct);
    check('房源状态→viewing_scheduled', p1.status, 'viewing_scheduled');
  }

  // 2. 报价全流程
  console.log('\n【2】报价创建→提交→确认');
  const targetProp = vacant || props[0];
  const q = await POST('/api/quotations', ct, {
    propertyId: targetProp.id, customerName: '链路客户', customerPhone: '13800000000',
    companyName: '链路公司', monthlyRent: 15000, leaseTerm: 12, rentFreePeriod: 1,
    depositMonths: 2, paymentMethod: 'quarterly',
    validUntil: new Date(Date.now() + 30*86400000).toISOString(),
    items: [{ name: '房屋租金', description: '12个月', quantity: 12, unit: '月', unitPrice: 15000, amount: 180000 }]
  });
  check('创建报价', !!q.id, true);

  if (q.id) {
    const qs = await POST('/api/quotations/' + q.id + '/submit', ct, { remarks: '请审批' });
    check('提交报价状态', qs.status, 'submitted');
    const qa = await POST('/api/quotations/' + q.id + '/approve', mt, { approvalComment: '同意' });
    check('确认报价状态', qa.status, 'approved');
    const p2 = await GET('/api/properties/' + targetProp.id, ct);
    check('房源状态→quotation_approved', p2.status, 'quotation_approved');
  }

  // 3. 起草合同
  console.log('\n【3】起草合同→提交审核→房源联动');
  if (q.id) {
    const co = await POST('/api/contracts', ct, {
      propertyId: targetProp.id, quotationId: q.id,
      customerName: '链路客户', customerPhone: '13800000000', companyName: '链路公司',
      monthlyRent: 15000, leaseTerm: 12, rentFreePeriod: 1, depositAmount: 30000,
      paymentMethod: 'quarterly', leaseStartDate: '2026-07-01', leaseEndDate: '2027-06-30',
      clauses: [
        { category: 'basic', title: '租赁期限', content: '租期12个月', order: 1 },
        { category: 'payment', title: '租金', content: '月租金15000元', order: 2 },
      ]
    });
    check('创建合同', !!co.id, true);
    
    if (co.id) {
      const p3 = await GET('/api/properties/' + targetProp.id, ct);
      check('房源状态→contract_drafting', p3.status, 'contract_drafting');
      
      const cs = await POST('/api/contracts/' + co.id + '/submit-review', ct);
      check('提交审核状态', cs.status, 'under_review');
      const p4 = await GET('/api/properties/' + targetProp.id, ct);
      check('房源状态→contract_reviewing', p4.status, 'contract_reviewing');
      
      const tl = await GET('/api/logs/timeline/contract/' + co.id, ct);
      check('操作时间线记录数>0', tl.length > 0, true);
    }
  }

  console.log(`\n=== 结果: ${pass} passed, ${fail} failed ===`);
  if (fail === 0) console.log('全链路验证通过 ✓');
}

main().catch(console.error);
