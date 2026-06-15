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

    console.log('\n=== 2. 获取安装队长列表 ===');
    const users = await req('/auth/users', { token });
    const leaders = (users.data || []).filter(u => u.role === 'install_leader');
    console.log('安装队长:', leaders.map(u => `${u.id}-${u.name}`).join(', '));
    if (!leaders.length) { console.log('没有安装队长，无法测试派工'); return; }
    const leaderId = leaders[0].id;

    console.log('\n=== 3. 创建测试订单 ===');
    const order = await req('/print-orders', {
      method: 'POST', token,
      body: { projectName: '一体化广告牌-测试', customerName: '测试客户A', customerPhone: '13800000001', priority: 'urgent', contentDescription: '楼顶大型喷绘，需现场安装', expectedDelivery: '2026-06-20T10:00:00.000Z' },
    });
    console.log('订单 code:', order.code, order.message || '');
    if (order.code !== 0) return;
    const orderId = order.data.id;
    console.log('订单ID:', orderId, '状态:', order.data.status);

    console.log('\n=== 4. 推进订单到待派工 (模拟快速走流程) ===');
    await req(`/print-orders/${orderId}/assign-designer`, { method: 'POST', token, body: { designerId: (users.data.find(u => u.role === 'designer') || {}).id } });
    const sub = await req(`/print-orders/${orderId}/submit-design`, { method: 'POST', token, body: { designFile: 'http://demo/design.psd' } });
    console.log('提交设计 code:', sub.code, '状态:', sub.data?.status);
    const startp = await req(`/print-orders/${orderId}/start-print`, { method: 'POST', token });
    console.log('开始喷绘 code:', startp.code, '状态:', startp.data?.status);
    const finish = await req(`/print-orders/${orderId}/complete-print`, { method: 'POST', token });
    console.log('喷绘完成 code:', finish.code, '当前状态:', finish.data?.status);

    console.log('\n=== 5. 创建一体化安装任务 (关键!) ===');
    const task = await req(`/print-orders/${orderId}/tasks`, {
      method: 'POST', token,
      body: { installLeaderId: leaderId, installTime: '2026-06-16 09:00', installAddress: '测试大道888号(现场)', teamMembers: ['队员甲', '队员乙'], assignmentNotes: '注意安全，楼顶作业，带齐工具' },
    });
    console.log('任务创建 code:', task.code, task.message || '');
    if (task.code !== 0) return;
    const taskId = task.data.task.id;
    console.log('任务ID:', taskId, '轮次: #' + task.data.task.taskRound);
    console.log('  安装队长:', task.data.task.installLeader?.name, '派工人:', task.data.task.assignedBy?.name);
    console.log('  状态:', task.data.task.status, '卡住等级:', task.data.task.stuckLevel);

    console.log('\n=== 6. 登录安装队长，开始安装 (责任人不丢失) ===');
    const login2 = await req('/auth/login', { method: 'POST', body: { username: 'installer', password: '123456' } });
    const token2 = login2.data.accessToken;
    console.log('安装队长登录:', login2.data?.name);

    const start = await req(`/print-orders/tasks/${taskId}/start`, { method: 'POST', token: token2 });
    const startTask = start.data?.task || {};
    console.log('开始安装 code:', start.code, '任务状态:', startTask.status);
    console.log('  责任人仍在: 安装队长=', startTask.installLeaderName || startTask.installLeader?.name, '派工人=', startTask.assignedByName || startTask.assignedBy?.name);

    console.log('\n=== 7. 提交照片回传 (同任务，责任人保留) ===');
    const photo = await req(`/print-orders/tasks/${taskId}/photo-return`, {
      method: 'POST', token: token2,
      body: { photoUrls: ['http://demo/photo1.jpg', 'http://demo/photo2.jpg'], returnNotes: '已完成安装，整体效果良好，客户在场确认' },
    });
    console.log('照片回传 code:', photo.code, photo.message || '');
    if (photo.code === 0) {
      const pt = photo.data.task || {};
      console.log('  状态:', pt.status);
      console.log('  照片数:', (pt.photoUrls || []).length);
      console.log('  提交人:', pt.submittedByName || pt.submittedBy?.name);
      console.log('  责任人不丢失: 安装队长=', pt.installLeaderName || pt.installLeader?.name, '派工人=', pt.assignedByName || pt.assignedBy?.name);
    }

    console.log('\n=== 8. 管理员退回 (第一次测试责任追溯) ===');
    const reject = await req(`/print-orders/tasks/${taskId}/photo-reject`, {
      method: 'POST', token,
      body: { rejectReason: '右下角灯箱位置有明显气泡，需返工重贴', reviewNotes: '客户不同意接收，请尽快重拍' },
    });
    console.log('退回 code:', reject.code, reject.message || '');
    if (reject.code === 0) {
      const rt = reject.data.task || {};
      console.log('  状态:', rt.status, '退回原因:', rt.rejectReason);
      console.log('  历史责任清晰: 派工人=', rt.assignedByName || rt.assignedBy?.name, '安装队长=', rt.installLeaderName || rt.installLeader?.name, '提交人=', rt.submittedByName || rt.submittedBy?.name);
      console.log('  审核意见:', rt.reviewNotes, '审核人=', rt.reviewedByName || rt.reviewedBy?.name);
      console.log('  同一条task记录内派工+照片+退回原因全包含:', !!rt.assignmentNotes, !!(rt.photoUrls || []).length, !!rt.rejectReason);
    }

    console.log('\n=== 9. 添加补充备注 (留存责任说明) ===');
    const supp = await req(`/print-orders/tasks/${taskId}/supplement`, {
      method: 'POST', token: token2,
      body: { content: '已安排队员下午3点前返工重贴，预计2小时完成' },
    });
    console.log('补充备注 code:', supp.code, '备注数:', (supp.data?.supplementNotes || []).length);

    console.log('\n=== 10. 再次提交 + 验收 (第二次，验证轮次保持) ===');
    await req(`/print-orders/tasks/${taskId}/photo-return`, { method: 'POST', token: token2, body: { photoUrls: ['http://demo/photo3.jpg'], returnNotes: '返工完成，气泡已消除' } });
    const approve = await req(`/print-orders/tasks/${taskId}/photo-approve`, { method: 'POST', token, body: { reviewNotes: '合格，验收通过' } });
    const at = approve.data?.task || {};
    console.log('验收通过 code:', approve.code, '最终状态:', at.status, '轮次仍为 #' + at.taskRound);

    console.log('\n=== 11. 卡住分析 Dashboard 测试 ===');
    await req(`/print-orders/tasks/refresh-stuck`, { method: 'POST', token });
    const stuck = await req('/dashboard/stuck', { token });
    console.log('卡住分析组数:', stuck.data?.length);
    (stuck.data || []).forEach(g => console.log('  -', g.statusLabel, '卡住', g.stuckCount, '/', g.totalInStatus, '判定:', (g.judgementHint||'').slice(0, 20) + '...'));

    console.log('\n=== 12. 我的待办(安装队长视角) ===');
    const todo = await req('/dashboard/waiting-for-me', { token: token2 });
    console.log('队长待办: myActiveTasks=', todo.data?.myActiveTasks?.length, 'rejectedTasks=', (todo.data?.rejectedTasks || todo.data?.myTasks || todo.data)?.length);

    console.log('\n=== 13. 最近改动 (验证日志完整) ===');
    const changes = await req('/dashboard/recent-changes?limit=10', { token });
    console.log('最近改动条数:', changes.data?.length);
    (changes.data || []).slice(0, 5).forEach(c => console.log('  -', c.operatorName, c.actionLabel, '|', (c.summary||'').slice(0, 30)));

    console.log('\n=== 全部流程测试完成 ✅ ===');
  } catch (e) {
    console.error('测试出错:', e.message);
    console.error(e.stack);
  }
})();
