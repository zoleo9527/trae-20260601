const http = require('http');
function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : null;
    const opts = { hostname: '127.0.0.1', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (b) opts.headers['Content-Length'] = Buffer.byteLength(b);
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve(d); } });
    });
    r.on('error', reject);
    if (b) r.write(b);
    r.end();
  });
}
(async () => {
  const login = await req('POST', '/auth/login', { username: 'manager', password: '123456' });
  const token = login.data.accessToken;
  const login2 = await req('POST', '/auth/login', { username: 'installer', password: '123456' });
  const token2 = login2.data.accessToken;
  const users = await req('GET', '/auth/users', null, token);
  const leader = users.data.find(u => u.role === 'install_leader');
  const designer = users.data.find(u => u.role === 'designer');

  console.log('=== 创建新订单走旧流程 ===');
  const order = await req('POST', '/print-orders', { projectName: '验证关联', customerName: '测试', customerPhone: '1', contentDescription: '验证 orderId 写库' }, token);
  const oid = order.data.id;
  console.log('订单ID:', oid);

  await req('POST', `/print-orders/${oid}/assign-designer`, { designerId: designer.id }, token);
  await req('POST', `/print-orders/${oid}/submit-design`, { designFileUrl: 'http://a.com' }, token);
  await req('POST', `/print-orders/${oid}/start-print`, {}, token);
  await req('POST', `/print-orders/${oid}/complete-print`, {}, token);
  await req('POST', `/print-orders/${oid}/assign-installation`, { installLeaderId: leader.id, scheduledDate: '2026-06-20', installAddress: '测试地址', assignmentNotes: '测试派工备注' }, token);
  await req('POST', `/print-orders/${oid}/start-installation`, {}, token2);

  const pr = await req('POST', `/print-orders/${oid}/photo-return`, { photoUrls: ['http://1.jpg'], returnNotes: '测试照片' }, token2);
  const prId = pr.data?.photoReturn?.id;
  console.log('photoReturnId:', prId);

  await req('POST', `/print-orders/${oid}/photo-return/${prId}/reject`, { rejectReason: '测试退回原因', reviewNotes: '测试审核意见' }, token);
  await req('POST', `/print-orders/${oid}/notes`, { content: '测试添加备注', noteType: 'general' }, token);

  console.log('\n=== 订单详情：子对象关联检查 ===');
  const detail = await req('GET', `/print-orders/${oid}`, null, token);
  const d = detail.data;
  console.log('派工记录数:', (d.installationAssignments || []).length);
  (d.installationAssignments || []).forEach((a, i) => {
    console.log(`  [派工${i}] leader=${a.installLeader?.name || 'NO NAME'} address=${a.installAddress || 'NO ADDR'} notes=${a.assignmentNotes || 'NO NOTES'}`);
  });
  console.log('照片回传数:', (d.photoReturns || []).length);
  (d.photoReturns || []).forEach((p, i) => {
    console.log(`  [照片${i}] submit=${p.submittedBy?.name || 'NO SUBMIT'} status=${p.status} rejectReason=${p.rejectReason || 'NO REASON'} reviewNotes=${p.reviewNotes || 'NO NOTES'}`);
  });
  console.log('备注数:', (d.notes || []).length);
  (d.notes || []).forEach((n, i) => {
    console.log(`  [备注${i}] author=${n.createdBy?.name || 'NO AUTHOR'} type=${n.noteType} content=${(n.content||'').slice(0,30)}`);
  });

  console.log('\n=== Dashboard recent-changes (前8条，无裸update) ===');
  const rc = await req('GET', '/dashboard/recent-changes?limit=8', null, token);
  (rc.data || []).forEach((l, i) => {
    const bareUpdate = l.action === 'update';
    console.log(`  [${i}] ${l.operatorName} | action=${l.action}${bareUpdate ? ' ⚠️BARE UPDATE' : ''} | label=${l.actionLabel} | summary=${l.summary?.slice(0,60)}`);
  });
})();
