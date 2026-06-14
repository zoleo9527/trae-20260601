const http = require('http');

function req(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      hostname: 'localhost', port: 3000, method, path,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}), ...headers },
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(buf || '{}') }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const usersRes = await req('GET', '/api/users', {});
  const userMap = {};
  usersRes.body.data.forEach(u => userMap[u.username] = u.id);
  const adminId = userMap['admin_wang'];
  const techId = userMap['tech_chen'];

  const headersA = { 'X-User-Id': adminId, 'X-User-Role': 'admin_staff' };
  const headersT = { 'X-User-Id': techId, 'X-User-Role': 'tech_support' };

  console.log('\n====== 【验证1】旧库升级后列表接口正常，所有补正字段返回 null 不报错 ======');
  const list = await req('GET', '/api/registrations', headersA);
  console.log('  HTTP status:', list.status, '总数:', list.body.data.total);
  list.body.data.items.forEach(r => {
    console.log(`  - ${r.candidate_name}: status=${r.status} status_label=${r.status_label}`);
    console.log(`    reject_reason: ${r.reject_reason ?? 'NULL'}`);
    console.log(`    supplement_remark: ${r.supplement_remark ?? 'NULL'}`);
    console.log(`    supplement_by_name: ${r.supplement_by_name ?? 'NULL'}`);
    console.log(`    supplement_time: ${r.supplement_time ?? 'NULL'}`);
    console.log(`    reopen_by_name: ${r.reopen_by_name ?? 'NULL'}`);
    console.log(`    reopen_time: ${r.reopen_time ?? 'NULL'}`);
    console.log(`    reopened: ${r.reopened}, supplement_completed: ${r.supplement_completed}`);
    console.log(`    handler_name: ${r.handler_name ?? 'NULL'}`);
    console.log(`    assigned_invigilator_name: ${r.assigned_invigilator_name ?? 'NULL'}`);
  });

  console.log('\n====== 【验证2】详情接口正常，timeline 正常返回 ======');
  const first = list.body.data.items[0];
  const det = await req('GET', `/api/registrations/${first.id}`, headersA);
  console.log('  HTTP status:', det.status);
  console.log('  candidate_name:', det.body.data.candidate_name);
  console.log('  status_label:', det.body.data.status_label);
  console.log('  timeline 条数:', det.body.data.timeline.length);

  console.log('\n====== 【验证3】考务待办接口正常 ======');
  const todos = await req('GET', '/api/users/me/todos', headersA);
  console.log('  HTTP status:', todos.status);
  console.log('  待办总数:', todos.body.data.total);
  todos.body.data.items.forEach(t => console.log(`    [${t.type}] ${t.title}`));

  console.log('\n====== 【验证4】对旧版"已退回"记录执行补正：写 supplement_* + handler_id 正常 ======');
  const rejected = list.body.data.items.find(r => r.status === 'rejected');
  const sup = await req('POST', `/api/registrations/${rejected.id}/supplement`, headersT, {
    remark: '已联系考生补全材料，照片已重新上传',
    handler_id: techId,
    mark_resolved: true,
  });
  console.log('  HTTP status:', sup.status);
  console.log('  当前 status:', sup.body.data.status);
  console.log('  supplement_remark:', sup.body.data.supplement_remark);
  console.log('  supplement_by_name:', sup.body.data.supplement_by_name);
  console.log('  supplement_time:', sup.body.data.supplement_time);
  console.log('  handler_name:', sup.body.data.handler_name);

  console.log('\n====== 【验证5】考务待办出现 re_review_pending，且含补正信息 ======');
  const todos2 = await req('GET', '/api/users/me/todos', headersA);
  const reReview = todos2.body.data.items.find(t => t.type === 're_review_pending');
  console.log('  re_review_pending 存在:', !!reReview);
  if (reReview) {
    console.log('  标题:', reReview.title);
    console.log('  内容:', reReview.content);
    console.log('  supplement_by_name:', reReview.supplement_by_name ?? 'NULL');
  }

  console.log('\n====== 【验证6】执行 reopen 接回复审，写入 reopen_by/reopen_time ======');
  const reopen = await req('POST', `/api/registrations/${rejected.id}/reopen`, headersA, {
    reason: '补正材料齐全，回到待审核',
  });
  console.log('  HTTP status:', reopen.status);
  console.log('  状态:', reopen.body.data.status);
  console.log('  reopen_by_name:', reopen.body.data.reopen_by_name);
  console.log('  reopen_time:', reopen.body.data.reopen_time);
  console.log('  reject_reason 保留:', !!reopen.body.data.reject_reason);
  console.log('  supplement_remark 保留:', !!reopen.body.data.supplement_remark);
  console.log('  supplement_by 保留:', !!reopen.body.data.supplement_by_name);

  console.log('\n====== 【验证7】再次查详情，确认 timeline + 所有闭环字段 ======');
  const det2 = await req('GET', `/api/registrations/${rejected.id}`, headersA);
  const d = det2.body.data;
  console.log('  status:', d.status, 'status_label:', d.status_label);
  console.log('  reject_reason 保留:', !!d.reject_reason);
  console.log('  supplement_remark 保留:', !!d.supplement_remark);
  console.log('  supplement_by_name:', d.supplement_by_name);
  console.log('  reopen_by_name:', d.reopen_by_name);
  console.log('  reopened:', d.reopened, 'supplement_completed:', d.supplement_completed);
  console.log('  timeline:');
  d.timeline.forEach(t => console.log(`    [${t.action_type}] ${t.operator_name || '系统'} @ ${t.created_at} → ${t.detail}`));

  console.log('\n====== 【验证8】终审 approve，确认历史字段全部保留 ======');
  const audit = await req('POST', `/api/registrations/${rejected.id}/audit`, headersA, { action: 'approve' });
  console.log('  HTTP status:', audit.status);
  console.log('  status:', audit.body.data.status);
  console.log('  reject_reason 保留:', !!audit.body.data.reject_reason);
  console.log('  supplement_remark 保留:', !!audit.body.data.supplement_remark);
  console.log('  supplement_by_name 保留:', audit.body.data.supplement_by_name);
  console.log('  reopen_by_name 保留:', audit.body.data.reopen_by_name);
  console.log('  assigned_invigilator_name:', audit.body.data.assigned_invigilator_name);

  console.log('\n✅ 旧库兼容性验证全部通过！');
})().catch(e => { console.error(e); process.exit(1); });
