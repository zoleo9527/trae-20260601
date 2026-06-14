const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, raw: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const BASE = { hostname: 'localhost', port: 3000, headers: { 'Content-Type': 'application/json' } };
let cache = {};

async function loadUsers() {
  const r = await request({ ...BASE, path: '/api/users', method: 'GET' });
  r.data.data.forEach(u => { cache[u.username] = u; });
}

function hdr(username) {
  const u = cache[username];
  return { ...BASE.headers, 'X-User-Id': u.id, 'X-User-Role': u.role };
}

async function section(title, fn) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔍 ${title}`);
  console.log('─'.repeat(60));
  await fn();
}

(async () => {
  await loadUsers();

  await section('监考待办收敛：张监考 vs 赵老师（应只看到各自负责的）', async () => {
    for (const name of ['inv_zhang', 'inv_zhao']) {
      const r = await request({
        ...BASE, path: '/api/users/me/todos', method: 'GET',
        headers: hdr(name),
      });
      const todos = r.data.data.items.filter(t => t.type === 'ticket_pending');
      console.log(`  ${cache[name].name} 的准考证待办数量：${todos.length}`);
      todos.forEach(t => console.log(`    · ${t.title} | ${t.content}`));
    }
  });

  await section('技术支持待办收敛：陈工 vs 孙支持（刘洋只归属陈工）', async () => {
    for (const name of ['tech_chen', 'tech_sun']) {
      const r = await request({
        ...BASE, path: '/api/users/me/todos', method: 'GET',
        headers: hdr(name),
      });
      const todos = r.data.data.items.filter(t => t.type === 'supplement_pending');
      console.log(`  ${cache[name].name} 的补正待办数量：${todos.length}`);
      todos.forEach(t => console.log(`    · ${t.title} | ${t.content} | 未分配=${t.is_unassigned}`));
    }
  });

  await section('报名详情：含考场监考老师、处理归属、负责监考', async () => {
    const list = await request({ ...BASE, path: '/api/registrations?limit=1', method: 'GET' });
    const id = list.data.data.items[0].id;
    const r = await request({ ...BASE, path: `/api/registrations/${id}`, method: 'GET' });
    const d = r.data.data;
    console.log(`  报名ID：${d.id}`);
    console.log(`  考生：${d.candidate_name} | 状态：${d.status}`);
    console.log(`  审核人：${d.auditor_name || '-'} | 处理归属：${d.handler_name || '-'} | 负责监考：${d.assigned_invigilator_name || '-'}`);
    console.log(`  考场：${d.room_code || '-'} | 准考证号：${d.ticket_no || '-'}`);
    console.log(`  考场监考老师：${(d.invigilators || []).map(i => i.name).join('、') || '(暂无，尚未分配考场)'}`);
    console.log(`  时间线条数：${(d.timeline || []).length}`);
  });

  let assignedRegId;
  await section('审核通过并指定监考老师：验证收敛效果', async () => {
    const list = await request({ ...BASE, path: '/api/registrations?status=pending&limit=1', method: 'GET' });
    const id = list.data.data.items[0].id;
    const targetInv = cache['inv_zhao'];
    const r = await request({
      ...BASE, path: `/api/registrations/${id}/audit`, method: 'POST',
      headers: hdr('admin_wang'),
    }, { action: 'approve', assigned_invigilator_id: targetInv.id });
    assignedRegId = id;
    console.log(`  审核结果：${r.data.data.status}，负责监考：${r.data.data.assigned_invigilator_name}`);
    for (const name of ['inv_zhang', 'inv_zhao']) {
      const rr = await request({
        ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr(name),
      });
      const mine = rr.data.data.items.filter(t => t.type === 'ticket_pending' && t.registration_id === id);
      console.log(`  ${cache[name].name} 是否看到该待办：${mine.length > 0 ? '✅ 是' : '❌ 否'}`);
    }
  });

  let ticketId;
  await section('准考证生成与回看：含监考老师信息', async () => {
    const r = await request({
      ...BASE, path: '/api/tickets', method: 'POST',
      headers: hdr('inv_zhao'),
    }, { registration_id: assignedRegId });
    ticketId = r.data.data.id;
    console.log(`  生成结果：${r.data.data.ticket_no}，考场：${r.data.data.room_code}，座位：${r.data.data.seat_no}`);
    console.log(`  该考场监考：${(r.data.data.invigilators || []).map(i => i.name).join('、')}`);
    const t2 = await request({ ...BASE, path: `/api/tickets/by-registration/${assignedRegId}`, method: 'GET' });
    console.log(`  按报名回看：${t2.data.data.ticket_no}，监考：${(t2.data.data.invigilators || []).map(i => i.name).join('、')}`);
    const tl = await request({ ...BASE, path: '/api/tickets?limit=3', method: 'GET' });
    console.log(`  准考证列表每条都带 invigilators 字段：${tl.data.data.items.every(i => Array.isArray(i.invigilators)) ? '✅ 是' : '❌ 否'}`);
  });

  let rejectedId;
  await section('审核退回并指定处理人：验证归属收敛', async () => {
    const list = await request({ ...BASE, path: '/api/registrations?status=pending&limit=1', method: 'GET' });
    const id = list.data.data.items[0].id;
    const targetTech = cache['tech_sun'];
    const r = await request({
      ...BASE, path: `/api/registrations/${id}/audit`, method: 'POST',
      headers: hdr('admin_wang'),
    }, { action: 'reject', reason: '学历证明材料不符合要求', handler_id: targetTech.id });
    rejectedId = id;
    console.log(`  审核结果：${r.data.data.status}，处理归属：${r.data.data.handler_name}，退回原因：${r.data.data.reject_reason}`);
    for (const name of ['tech_chen', 'tech_sun']) {
      const rr = await request({
        ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr(name),
      });
      const mine = rr.data.data.items.filter(t => t.type === 'supplement_pending' && t.registration_id === id);
      console.log(`  ${cache[name].name} 是否看到该补正待办：${mine.length > 0 ? '✅ 是' : '❌ 否'}`);
    }
  });

  await section('补充备注并转派：验证归属变更', async () => {
    const targetTech = cache['tech_chen'];
    const r = await request({
      ...BASE, path: `/api/registrations/${rejectedId}/supplement`, method: 'POST',
      headers: hdr('admin_wang'),
    }, { remark: '请联系考生补充学信网在线验证码', handler_id: targetTech.id });
    console.log(`  转派后处理归属：${r.data.data.handler_name}，补充备注：${r.data.data.supplement_remark}`);
    for (const name of ['tech_chen', 'tech_sun']) {
      const rr = await request({
        ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr(name),
      });
      const mine = rr.data.data.items.filter(t => t.type === 'supplement_pending' && t.registration_id === rejectedId);
      console.log(`  ${cache[name].name} 是否看到该补正待办：${mine.length > 0 ? '✅ 是' : '❌ 否'}`);
    }
  });

  await section('通知定向推送：不再全员广播', async () => {
    const list = await request({ ...BASE, path: '/api/registrations?status=pending&limit=1', method: 'GET' });
    const id = list.data.data.items[0].id;
    const targetInv = cache['inv_zhang'];
    await request({
      ...BASE, path: `/api/registrations/${id}/audit`, method: 'POST',
      headers: hdr('admin_wang'),
    }, { action: 'approve', assigned_invigilator_id: targetInv.id });
    for (const name of ['inv_zhang', 'inv_zhao']) {
      const r = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr(name) });
      const notifs = r.data.data.items.filter(t => t.type === 'notification' && t.registration_id === id);
      console.log(`  ${cache[name].name} 收到相关通知数：${notifs.length}`);
      notifs.forEach(n => console.log(`    · [${n.notif_type}] ${n.title}`));
    }
  });

  console.log(`\n${'═'.repeat(60)}`);
  console.log('✅ 所有验证点已执行完毕');
})().catch(console.error);
