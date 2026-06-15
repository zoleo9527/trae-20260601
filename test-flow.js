const http = require('http');
const BASE = '127.0.0.1';
const PORT = 3000;

function req(path, opt = {}) {
  return new Promise((resolve, reject) => {
    const body = opt.body ? JSON.stringify(opt.body) : null;
    const h = {
      'Content-Type': 'application/json',
      ...(opt.token ? { Authorization: 'Bearer ' + opt.token } : {}),
      ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
    };
    const r = http.request({ host: BASE, port: PORT, path, method: opt.method || 'GET', headers: h }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ code: -1, message: data }); } });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}
(async () => {
  try {
    console.log('=== 1. 登录 (manager) ===');
    const login = await req('/auth/login', { method: 'POST', body: { username: 'manager', password: '123456' } });
    console.log('登录 code:', login.code, login.message || '');
    if (login.code !== 0) return;
    const token = login.data.accessToken;
    console.log('用户:', login.data.name, login.data.role);

    const users = await req('/auth/users', { token });
    const leaders = (users.data || []).filter(u => u.role === 'install_leader');
    const leaderId = leaders[0].id;

    console.log('\n=== 2. 创建测试订单(走旧流程) ===');
    const order1 = await req('/print-orders', {
      method: 'POST', token,
      body: { projectName: '旧流程-广告牌测试', customerName: '旧流程客户', customerPhone: '13800000002', priority: 'normal', contentDescription: '测试旧照片回传流程', expectedDelivery: '2026-06-20T10:00:00.000Z' },
    });
    const orderId1 = order1.data.id;
    console.log('订单ID:', orderId1);

    console.log('\n=== 3. 推进到安装中(旧流程) ===');
    await req(`/print-orders/${orderId1}/assign-designer`, { method: 'POST', token, body: { designerId: (users.data.find(u => u.role === 'designer') || {}).id } });
    await req(`/print-orders/${orderId1}/submit-design`, { method: 'POST', token, body: { designFile: 'http://demo/design.psd' } });
    await req(`/print-orders/${orderId1}/start-print`, { method: 'POST', token });
    await req(`/print-orders/${orderId1}/complete-print`, { method: 'POST', token });
    const assignRes = await req(`/print-orders/${orderId1}/assign-installation`, { method: 'POST', token, body: { installLeaderId: leaderId, installTime: '2026-06-16T09:00:00.000Z', installAddress: '旧流程地址', assignmentNotes: '旧流程派工备注' } });
    console.log('旧派工 code:', assignRes.code);
    const assignmentId = assignRes.data?.assignment?.id;

    const login2 = await req('/auth/login', { method: 'POST', body: { username: 'installer', password: '123456' } });
    const token2 = login2.data.accessToken;

    await req(`/print-orders/${orderId1}/start-installation`, { method: 'POST', token: token2 });
    console.log('旧流程已到安装中');

    console.log('\n=== 4. 旧流程-提交照片回传 ===');
    const photoRes = await req(`/print-orders/${orderId1}/photo-return`, { method: 'POST', token: token2, body: { photoUrls: ['http://demo/old1.jpg', 'http://demo/old2.jpg'], returnNotes: '旧流程照片回传说明' } });
    console.log('旧照片回传 code:', photoRes.code);
    const photoReturnId = photoRes.data?.photoReturn?.id;
    console.log('photoReturnId:', photoReturnId);

    console.log('\n=== 5. 旧流程-退回照片(含退回原因+审核意见) ===');
    const rejectRes = await req(`/print-orders/${orderId1}/photo-return/${photoReturnId}/reject`, {
      method: 'POST', token,
      body: { rejectReason: '旧流程退回：灯箱有气泡，需返工', reviewNotes: '客户不接受，请重拍' },
    });
    console.log('旧退回 code:', rejectRes.code, '状态:', rejectRes.data?.order?.status);

    console.log('\n=== 6. 旧流程-重提交 + 验收通过 ===');
    const photoRes2 = await req(`/print-orders/${orderId1}/photo-return`, { method: 'POST', token: token2, body: { photoUrls: ['http://demo/old3.jpg'], returnNotes: '返工完成' } });
    const photoReturnId2 = photoRes2.data?.photoReturn?.id;
    const approveRes = await req(`/print-orders/${orderId1}/photo-return/${photoReturnId2}/approve`, { method: 'POST', token, body: { reviewNotes: '旧流程验收通过，合格' } });
    console.log('旧验收 code:', approveRes.code, '状态:', approveRes.data?.order?.status);

    console.log('\n=== 7. 添加备注(验证 add_note 入订单历史) ===');
    const noteRes = await req(`/print-orders/${orderId1}/notes`, { method: 'POST', token, body: { content: '客户要求追加防水处理', noteType: 'general' } });
    console.log('添加备注 code:', noteRes.code);

    console.log('\n=== 8. 检查旧流程订单日志(关键验证：submit_photo_return/approve_photo/reject_photo/add_note + 退回原因) ===');
    const logs1 = await req(`/print-orders/${orderId1}/logs?page=1&pageSize=50`, { token });
    const items1 = (logs1.data?.items || []);
    console.log('旧流程日志总数:', logs1.data?.total);
    items1.forEach(i => {
      const action = i.metadata?.action || i.action;
      const extra = [];
      if (i.metadata?.rejectReason) extra.push(`退回原因: ${i.metadata.rejectReason}`);
      if (i.metadata?.reviewNotes) extra.push(`审核意见: ${i.metadata.reviewNotes}`);
      if (i.metadata?.photoCount) extra.push(`${i.metadata.photoCount}张照片`);
      if (i.metadata?.contentPreview) extra.push(`内容: ${i.metadata.contentPreview}`);
      if (i.metadata?.noteType) extra.push(`类型: ${i.metadata.noteType}`);
      console.log(`  - ${action} | ${i.operator?.name || '系统'} ${extra.length ? '| ' + extra.join(' | ') : ''}`);
    });

    const hasSubmitPhoto = items1.some(i => (i.metadata?.action || i.action) === 'submit_photo_return');
    const hasRejectPhoto = items1.some(i => (i.metadata?.action || i.action) === 'reject_photo');
    const hasApprovePhoto = items1.some(i => (i.metadata?.action || i.action) === 'approve_photo');
    const hasAddNote = items1.some(i => (i.metadata?.action || i.action) === 'add_note');
    const rejectLog = items1.find(i => (i.metadata?.action || i.action) === 'reject_photo');
    const approveLog = items1.find(i => (i.metadata?.action || i.action) === 'approve_photo');
    console.log('  ✅ submit_photo_return 存在:', hasSubmitPhoto);
    console.log('  ✅ reject_photo 存在:', hasRejectPhoto);
    console.log('  ✅ approve_photo 存在:', hasApprovePhoto);
    console.log('  ✅ add_note 存在:', hasAddNote);
    console.log('  ✅ reject_photo 含 rejectReason:', !!(rejectLog?.metadata?.rejectReason));
    console.log('  ✅ reject_photo 含 reviewNotes:', !!(rejectLog?.metadata?.reviewNotes));
    console.log('  ✅ approve_photo 含 reviewNotes:', !!(approveLog?.metadata?.reviewNotes));

    console.log('\n=== 9. 创建一体化任务订单(走新流程) ===');
    const order2 = await req('/print-orders', {
      method: 'POST', token,
      body: { projectName: '一体化-广告牌测试', customerName: '一体化客户', customerPhone: '13800000003', priority: 'urgent', contentDescription: '测试一体化任务退回原因入日志', expectedDelivery: '2026-06-20T10:00:00.000Z' },
    });
    const orderId2 = order2.data.id;
    await req(`/print-orders/${orderId2}/assign-designer`, { method: 'POST', token, body: { designerId: (users.data.find(u => u.role === 'designer') || {}).id } });
    await req(`/print-orders/${orderId2}/submit-design`, { method: 'POST', token, body: { designFile: 'http://demo/design.psd' } });
    await req(`/print-orders/${orderId2}/start-print`, { method: 'POST', token });
    await req(`/print-orders/${orderId2}/complete-print`, { method: 'POST', token });

    const taskRes = await req(`/print-orders/${orderId2}/tasks`, { method: 'POST', token, body: { installLeaderId: leaderId, installTime: '2026-06-16T09:00:00.000Z', installAddress: '一体化测试地址', assignmentNotes: '一体化派工备注' } });
    const taskId = taskRes.data.task.id;
    console.log('一体化任务ID:', taskId);

    await req(`/print-orders/tasks/${taskId}/start`, { method: 'POST', token: token2 });
    await req(`/print-orders/tasks/${taskId}/photo-return`, { method: 'POST', token: token2, body: { photoUrls: ['http://demo/new1.jpg'], returnNotes: '一体化首次照片' } });

    console.log('\n=== 10. 一体化任务退回(含退回原因+审核意见) ===');
    const taskReject = await req(`/print-orders/tasks/${taskId}/photo-reject`, {
      method: 'POST', token,
      body: { rejectReason: '一体化退回：右下角有气泡', reviewNotes: '请尽快返工' },
    });
    console.log('一体化退回 code:', taskReject.code);

    await req(`/print-orders/tasks/${taskId}/supplement`, { method: 'POST', token: token2, body: { content: '已安排返工' } });

    console.log('\n=== 11. 检查一体化订单日志(关键：reject_task_photo 含退回原因+审核意见) ===');
    const logs2 = await req(`/print-orders/${orderId2}/logs?page=1&pageSize=50`, { token });
    const items2 = (logs2.data?.items || []);
    console.log('一体化日志总数:', logs2.data?.total);
    items2.forEach(i => {
      const action = i.metadata?.action || i.action;
      const extra = [];
      if (i.metadata?.rejectReason) extra.push(`退回原因: ${i.metadata.rejectReason}`);
      if (i.metadata?.reviewNotes) extra.push(`审核意见: ${i.metadata.reviewNotes}`);
      if (i.metadata?.photoCount) extra.push(`${i.metadata.photoCount}张照片`);
      if (i.metadata?.contentPreview) extra.push(`内容: ${i.metadata.contentPreview}`);
      console.log(`  - ${action} | ${i.operator?.name || '系统'} ${extra.length ? '| ' + extra.join(' | ') : ''}`);
    });

    const taskRejectLog = items2.find(i => (i.metadata?.action || i.action) === 'reject_task_photo');
    console.log('  ✅ reject_task_photo 含 rejectReason:', !!(taskRejectLog?.metadata?.rejectReason));
    console.log('  ✅ reject_task_photo 含 reviewNotes:', !!(taskRejectLog?.metadata?.reviewNotes));
    if (taskRejectLog?.metadata?.rejectReason) {
      console.log('  📝 退回原因内容:', taskRejectLog.metadata.rejectReason);
    }
    if (taskRejectLog?.metadata?.reviewNotes) {
      console.log('  📝 审核意见内容:', taskRejectLog.metadata.reviewNotes);
    }

    console.log('\n=== 12. 检查旧流程无裸 update 或空说明 ===');
    const rawUpdate = items1.filter(i => (i.metadata?.action || i.action) === 'update' && !i.metadata?.action);
    console.log('旧流程裸 update 数量:', rawUpdate.length, rawUpdate.length === 0 ? '✅ 无裸 update' : '❌ 仍有裸 update');

    console.log('\n=== 全部测试完成 ✅ ===');
  } catch (e) {
    console.error('测试出错:', e.message);
    console.error(e.stack);
  }
})();
