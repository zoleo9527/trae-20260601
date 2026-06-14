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
  const users = await req('GET', '/api/users', {});
  const userMap = {};
  users.body.data.forEach(u => userMap[u.username] = u.id);
  const wangId = userMap['admin_wang'];
  const sunId = userMap['tech_sun'];

  const headersA = { 'X-User-Id': wangId, 'X-User-Role': 'admin_staff' };
  const headersS = { 'X-User-Id': sunId, 'X-User-Role': 'tech_support' };

  console.log('\n====== 【验证1】列表返回 reopen_by_name、reopen_time、历史补正字段 ======');
  const list = await req('GET', '/api/registrations', headersA);
  console.log('list HTTP:', list.status, 'keys:', Object.keys(list.body));
  if (list.status !== 200) { console.log('ERR:', JSON.stringify(list.body)); process.exit(1); }
  const wu = list.body.data.items.find(i => i.candidate_name === '吴倩');
  console.log('吴倩 status:', wu.status, 'status_label:', wu.status_label);
  console.log('  reject_reason 保留:', !!wu.reject_reason, wu.reject_reason);
  console.log('  supplement_remark 保留:', !!wu.supplement_remark, wu.supplement_remark);
  console.log('  supplement_by_name 保留:', wu.supplement_by_name);
  console.log('  supplement_time 保留:', wu.supplement_time);
  console.log('  reopen_by_name:', wu.reopen_by_name);
  console.log('  reopen_time:', wu.reopen_time);
  console.log('  reopened:', wu.reopened, 'supplement_completed:', wu.supplement_completed);
  console.log('  handler_name:', wu.handler_name);

  console.log('\n====== 【验证2】详情返回完整闭环 + 时间线 ======');
  const det = await req('GET', `/api/registrations/${wu.id}`, headersA);
  const d = det.body.data;
  console.log('  reject_reason 保留:', !!d.reject_reason);
  console.log('  supplement_remark 保留:', !!d.supplement_remark);
  console.log('  supplement_by_name:', d.supplement_by_name);
  console.log('  supplement_time:', d.supplement_time);
  console.log('  reopen_by_name:', d.reopen_by_name);
  console.log('  reopen_time:', d.reopen_time);
  console.log('  reopened:', d.reopened, 'supplement_completed:', d.supplement_completed);
  console.log('  timeline 条数:', d.timeline.length);
  d.timeline.forEach(t => console.log(`    [${t.action_type}] ${t.operator_name || '系统'} @ ${t.created_at} → ${t.detail}`));

  console.log('\n====== 【验证3】考务待办：re_review_pending 含补正+接回历史 ======');
  const todosA = await req('GET', '/api/users/me/todos', headersA);
  if (todosA.status !== 200) { console.log('todosA ERR', todosA.status, JSON.stringify(todosA.body)); process.exit(1); }
  const todosListA = todosA.body.data.items || [];
  todosListA.forEach(t => console.log(`  [${t.type}] ${t.title} | ${t.content.substring(0,150)}${t.content.length > 150 ? '...' : ''}`));

  console.log('\n====== 【验证4】孙支持待办：吴倩含历史补正+接回信息 ======');
  const todosS = await req('GET', '/api/users/me/todos', headersS);
  const todosListS = todosS.body.data.items || [];
  todosListS.filter(t => t.type === 'supplement_pending').forEach(t => {
    console.log(`  [${t.type}] ${t.title}`);
    console.log(`    content: ${t.content}`);
    console.log(`    prev_supplement_by_name: ${t.prev_supplement_by_name}`);
    console.log(`    prev_supplement_time: ${t.prev_supplement_time}`);
    console.log(`    reopen_by_name: ${t.reopen_by_name}`);
    console.log(`    reopen_time: ${t.reopen_time}`);
  });

  console.log('\n====== 【验证5】执行真实 reopen 操作，确认历史字段不被清空 ======');
  const chen = list.body.data.items.find(i => i.candidate_name === '陈静');
  const before = await req('GET', `/api/registrations/${chen.id}`, headersA);
  console.log('  reopen 前陈静 reject_reason:', before.body.data.reject_reason);
  console.log('  reopen 前陈静 supplement_remark:', before.body.data.supplement_remark);
  console.log('  reopen 前陈静 supplement_by_name:', before.body.data.supplement_by_name);
  const reopen = await req('POST', `/api/registrations/${chen.id}/reopen`, headersA, { reason: '照片核验通过，回到待审核队列等待终审' });
  if (reopen.status !== 200) { console.log('reopen ERR', reopen.status, JSON.stringify(reopen.body)); process.exit(1); }
  console.log('  reopen HTTP status:', reopen.status, '→ status:', reopen.body.data.status, 'reopen_by_name:', reopen.body.data.reopen_by_name);
  const after = await req('GET', `/api/registrations/${chen.id}`, headersA);
  console.log('  reopen 后 status:', after.body.data.status, 'status_label:', after.body.data.status_label);
  console.log('  reopen 后 reject_reason 保留:', !!after.body.data.reject_reason, after.body.data.reject_reason);
  console.log('  reopen 后 supplement_remark 保留:', !!after.body.data.supplement_remark, after.body.data.supplement_remark);
  console.log('  reopen 后 supplement_by_name 保留:', after.body.data.supplement_by_name);
  console.log('  reopen 后 supplement_time 保留:', after.body.data.supplement_time);
  console.log('  reopen 后 reopen_by_name:', after.body.data.reopen_by_name);
  console.log('  reopen 后 reopen_time:', after.body.data.reopen_time);
  console.log('  reopen 后 timeline 末尾:');
  after.body.data.timeline.slice(-3).forEach(t => console.log(`    [${t.action_type}] ${t.operator_name} @ ${t.created_at} → ${t.detail}`));

  console.log('\n====== 【验证6】对陈静执行 approve 复审，确认历史仍保留 ======');
  const audit = await req('POST', `/api/registrations/${chen.id}/audit`, headersA, { action: 'approve' });
  console.log('  approve HTTP status:', audit.status, '→ status:', audit.body.data.status);
  const afterApprove = await req('GET', `/api/registrations/${chen.id}`, headersA);
  console.log('  approve 后 status:', afterApprove.body.data.status, 'status_label:', afterApprove.body.data.status_label);
  console.log('  approve 后 reject_reason 保留:', !!afterApprove.body.data.reject_reason);
  console.log('  approve 后 supplement_remark 保留:', !!afterApprove.body.data.supplement_remark);
  console.log('  approve 后 supplement_by_name 保留:', afterApprove.body.data.supplement_by_name);
  console.log('  approve 后 reopen_by_name 保留:', afterApprove.body.data.reopen_by_name);
  console.log('  approve 后 assigned_invigilator_name:', afterApprove.body.data.assigned_invigilator_name);

  console.log('\n✅ 全部验证完成');
})().catch(e => { console.error(e); process.exit(1); });
