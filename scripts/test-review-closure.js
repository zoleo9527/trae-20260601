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

  await section('初始状态：陈静 = pending_review，已预置待复审待办', async () => {
    const list = await request({ ...BASE, path: '/api/registrations?status=pending_review', method: 'GET' });
    const d = list.data.data.items[0];
    console.log(`  考生：${d.candidate_name}`);
    console.log(`  状态：${d.status} / ${d.status_label}`);
    console.log(`  补正完成：${d.supplement_completed}  补正人：${d.supplement_by_name}  补正时间：${d.supplement_time}`);
    console.log(`  处理归属：${d.handler_name || '-'}，原退回原因：${d.reject_reason}`);
    console.log(`  补正说明：${d.supplement_remark}`);

    const adminR = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr('admin_wang') });
    const pendingRe = adminR.data.data.items.filter(t => t.type === 're_review_pending');
    console.log(`\n  王考务 待复审待办数：${pendingRe.length}`);
    pendingRe.forEach(t => console.log(`    · ${t.title}\n      ${t.content}`));
  });

  let chenId;
  let liuId;
  await section('报名详情（陈静）：完整时间线闭环展示', async () => {
    const list = await request({ ...BASE, path: '/api/registrations?status=pending_review', method: 'GET' });
    chenId = list.data.data.items[0].id;
    const r = await request({ ...BASE, path: `/api/registrations/${chenId}`, method: 'GET' });
    const d = r.data.data;
    console.log(`  状态：${d.status} / ${d.status_label}`);
    console.log(`  补正完成：${d.supplement_completed}，补正人：${d.supplement_by_name}，补正时间：${d.supplement_time}`);
    console.log(`  时间线：`);
    (d.timeline || []).forEach(tl => console.log(`    · ${tl.created_at}  ${tl.action_type.padEnd(20)} ${tl.operator_name || '系统'}  ${tl.detail}`));
  });

  await section('① 补正完成验证：刘洋 → 陈工标记完成，考务立即出现待复审', async () => {
    const list = await request({ ...BASE, path: '/api/registrations?status=rejected', method: 'GET' });
    const liu = list.data.data.items.find(i => i.candidate_name === '刘洋');
    if (!liu) { console.log('  跳过：未找到刘洋'); return; }
    liuId = liu.id;
    console.log(`  操作前刘洋状态：${liu.status_label}  supplement_completed=${liu.supplement_completed}`);
    const r = await request({
      ...BASE, path: `/api/registrations/${liu.id}/supplement`, method: 'POST',
      headers: hdr('tech_chen'),
    }, {
      remark: '已重新上传清晰的身份证正反面照片，请核验',
      mark_resolved: true,
    });
    const d = r.data.data;
    console.log(`  操作后状态：${d.status} / ${d.status_label}`);
    console.log(`  补正完成=${d.supplement_completed}  补正人：${d.supplement_by_name}  补正时间：${d.supplement_time}`);

    const admin1 = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr('admin_wang') });
    const admin2 = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr('admin_li') });
    const p1 = admin1.data.data.items.filter(t => t.type === 're_review_pending' && t.registration_id === liu.id);
    const p2 = admin2.data.data.items.filter(t => t.type === 're_review_pending' && t.registration_id === liu.id);
    console.log(`  王考务看到待复审：${p1.length > 0 ? '✅' : '❌'}`);
    console.log(`  李专员看到待复审：${p2.length > 0 ? '✅' : '❌'}`);
    const tech = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr('tech_chen') });
    const pChen = tech.data.data.items.filter(t => t.type === 'supplement_pending' && t.registration_id === liu.id);
    console.log(`  陈工的补正待办里还能看到刘洋：${pChen.length > 0 ? '❌（有问题，应移除）' : '✅（已完成，不再重复）'}`);
  });

  let rejectedForErrorTest;
  await section('② 状态校验：非 rejected 调用 mark_resolved 应返回 E2003', async () => {
    const list = await request({ ...BASE, path: '/api/registrations?status=pending&limit=1', method: 'GET' });
    const id = list.data.data.items[0].id;
    const r = await request({
      ...BASE, path: `/api/registrations/${id}/supplement`, method: 'POST',
      headers: hdr('tech_chen'),
    }, { remark: '故意标记', mark_resolved: true });
    console.log(`  状态码：${r.status}  错误码：${r.data?.error?.code}`);
    console.log(`  消息：${r.data?.error?.message} ${r.data?.error?.details?.hint || ''}`);
  });

  await section('③ 接回复审：王考务将陈静的 pending_review → pending', async () => {
    const r = await request({
      ...BASE, path: `/api/registrations/${chenId}/reopen`, method: 'POST',
      headers: hdr('admin_wang'),
    }, {
      reason: '补正材料审核无误，接回重新进入审核队列',
      reassign_invigilator_id: cache['inv_zhang'].id,
    });
    const d = r.data.data;
    console.log(`  状态：${d.status} / ${d.status_label}`);
    console.log(`  重新分配监考：${d.assigned_invigilator_name || '-'}`);
    console.log(`  时间线最后一条：`);
    const last = (d.timeline || []).slice(-1)[0];
    console.log(`    · ${last.created_at}  ${last.action_type}  ${last.operator_name}  ${last.detail}`);
    const adminR = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr('admin_wang') });
    const pendingA = adminR.data.data.items.filter(t => t.type === 'audit_pending' && t.registration_id === chenId);
    const pendingR = adminR.data.data.items.filter(t => t.type === 're_review_pending' && t.registration_id === chenId);
    console.log(`  王考务：${pendingA.length > 0 ? '✅ audit_pending 待审核已出现' : '❌'}`);
    console.log(`  王考务：${pendingR.length === 0 ? '✅ re_review_pending 已清除' : '❌（仍在待复审）'}`);
  });

  await section('④ 状态校验：非 pending_review 调用 reopen 应返回 E2003', async () => {
    const list = await request({ ...BASE, path: '/api/registrations?status=approved&limit=1', method: 'GET' });
    const id = list.data.data.items[0].id;
    const r = await request({
      ...BASE, path: `/api/registrations/${id}/reopen`, method: 'POST',
      headers: hdr('admin_wang'),
    }, { reason: '测试非法状态' });
    console.log(`  状态码：${r.status}  错误码：${r.data?.error?.code}`);
    console.log(`  消息：${r.data?.error?.message} ${r.data?.error?.details?.hint || ''}`);
  });

  await section('⑤ 完整闭环：提交→退回→补正→复审通过→生成准考证', async () => {
    let id;
    {
      const r = await request({ ...BASE, path: '/api/registrations', method: 'POST' }, {
        candidate_name: '闭环考生', id_card: '11010119990808123X',
        exam_type: '英语六级', phone: '13600136000',
      });
      id = r.data.data.id;
      console.log(`  步骤1：提交报名 → id=${id.slice(0, 8)}`);
    }
    {
      const r = await request({
        ...BASE, path: `/api/registrations/${id}/audit`, method: 'POST',
        headers: hdr('admin_wang'),
      }, { action: 'reject', reason: '英语六级需要CET4成绩单，请补充上传', handler_id: cache['tech_sun'].id });
      console.log(`  步骤2：王考务退回（归属孙支持）→ status=${r.data.data.status}`);
      console.log(`    孙支持的补正待办应出现，陈工不应看到`);
      const s1 = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr('tech_sun') });
      const s2 = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr('tech_chen') });
      const m1 = s1.data.data.items.filter(t => t.type === 'supplement_pending' && t.registration_id === id);
      const m2 = s2.data.data.items.filter(t => t.type === 'supplement_pending' && t.registration_id === id);
      console.log(`    孙支持待办：${m1.length > 0 ? '✅' : '❌'}，陈工待办：${m2.length === 0 ? '✅' : '❌'}`);
    }
    {
      const r = await request({
        ...BASE, path: `/api/registrations/${id}/supplement`, method: 'POST',
        headers: hdr('tech_sun'),
      }, { remark: 'CET4成绩单已补传至附件目录', mark_resolved: true });
      console.log(`  步骤3：孙支持标记补正完成 → status=${r.data.data.status} / ${r.data.data.status_label}`);
      console.log(`    supplement_by_name=${r.data.data.supplement_by_name}，supplement_time=${r.data.data.supplement_time}`);
    }
    {
      const r = await request({
        ...BASE, path: `/api/registrations/${id}/audit`, method: 'POST',
        headers: hdr('admin_li'),
      }, { action: 'approve', assigned_invigilator_id: cache['inv_zhao'].id });
      console.log(`  步骤4：李专员复审通过（可直接 approve，无需 reopen）→ status=${r.data.data.status}`);
      console.log(`    时间线新增：`);
      (r.data.data.timeline || []).filter(t => t.action_type.includes('review') || t.action_type === 'supplement_done').forEach(tl =>
        console.log(`      · ${tl.created_at}  ${tl.action_type.padEnd(20)} ${tl.operator_name}  ${tl.detail}`)
      );
    }
    {
      const r = await request({
        ...BASE, path: '/api/tickets', method: 'POST',
        headers: hdr('inv_zhao'),
      }, { registration_id: id });
      const d = r.data.data;
      console.log(`  步骤5：赵老师生成准考证 → ${d.ticket_no}，考场：${d.room_code}，座位：${d.seat_no}`);
      console.log(`    考场监考：${(d.invigilators || []).map(i => i.name).join('、')}`);
    }
    {
      const r = await request({ ...BASE, path: `/api/registrations/${id}`, method: 'GET' });
      const d = r.data.data;
      console.log(`  步骤6：详情汇总（一条记录贯通）：`);
      console.log(`    状态：${d.status_label}，审核人：${d.auditor_name}（${d.audit_time}）`);
      console.log(`    补正：${d.supplement_by_name} @ ${d.supplement_time} — ${d.supplement_remark}`);
      console.log(`    准考证：${d.ticket_no}，考场：${d.room_code}，监考：${(d.invigilators || []).map(i => i.name).join('、') || '-'}`);
      console.log(`    完整时间线：`);
      d.timeline.forEach(tl => console.log(`      · ${tl.created_at}  ${tl.action_type.padEnd(20)} ${tl.operator_name || '系统'}  ${tl.detail}`));
    }
  });

  console.log(`\n${'═'.repeat(60)}`);
  console.log('✅ 所有闭环验证点已执行完毕');
})().catch(console.error);
