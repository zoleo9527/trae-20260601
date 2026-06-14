const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const BASE = { hostname: 'localhost', port: 3000, headers: { 'Content-Type': 'application/json' } };

async function runSample(name, fn) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`▶ ${name}`);
  try {
    await fn();
  } catch (e) {
    console.log(`  ✗ 请求异常: ${e.message}`);
  }
}

async function main() {
  console.log('异常样例触发测试 — 请确保服务已启动（npm start）');
  console.log('每个样例都应该触发对应错误码并返回结构化错误响应\n');

  await runSample('1. 参数校验失败 E1001 — 提交空报名', async () => {
    const r = await request({ ...BASE, path: '/api/registrations', method: 'POST' }, {});
    console.log(`  状态码: ${r.status}  错误码: ${r.data?.error?.code}`);
    console.log(`  消息:   ${r.data?.error?.message}`);
    console.log(`  详情:   ${JSON.stringify(r.data?.error?.details)}`);
  });

  await runSample('2. 报名不存在 E2001 — 查询假ID', async () => {
    const r = await request({ ...BASE, path: '/api/registrations/not-exist-id', method: 'GET' });
    console.log(`  状态码: ${r.status}  错误码: ${r.data?.error?.code}`);
    console.log(`  消息:   ${r.data?.error?.message}`);
  });

  await runSample('3. 审核操作无效 E2004 — 使用 delete 操作', async () => {
    const regs = await request({ ...BASE, path: '/api/registrations?status=pending&limit=1', method: 'GET' });
    const id = regs.data?.data?.items?.[0]?.id;
    const users = await request({ ...BASE, path: '/api/users?role=admin_staff', method: 'GET' });
    const adminId = users.data?.data?.[0]?.id;
    if (!id || !adminId) { console.log('  跳过：缺少测试数据'); return; }
    const r = await request({
      ...BASE,
      path: `/api/registrations/${id}/audit`,
      method: 'POST',
      headers: { ...BASE.headers, 'X-User-Id': adminId, 'X-User-Role': 'admin_staff' },
    }, { action: 'delete', reason: '测试' });
    console.log(`  状态码: ${r.status}  错误码: ${r.data?.error?.code}`);
    console.log(`  消息:   ${r.data?.error?.message}`);
  });

  await runSample('4. 退回缺少原因 E2005 — 退回不传 reason', async () => {
    const regs = await request({ ...BASE, path: '/api/registrations?status=pending&limit=1', method: 'GET' });
    const id = regs.data?.data?.items?.[0]?.id;
    const users = await request({ ...BASE, path: '/api/users?role=admin_staff', method: 'GET' });
    const adminId = users.data?.data?.[0]?.id;
    if (!id || !adminId) { console.log('  跳过：缺少测试数据'); return; }
    const r = await request({
      ...BASE,
      path: `/api/registrations/${id}/audit`,
      method: 'POST',
      headers: { ...BASE.headers, 'X-User-Id': adminId, 'X-User-Role': 'admin_staff' },
    }, { action: 'reject' });
    console.log(`  状态码: ${r.status}  错误码: ${r.data?.error?.code}`);
    console.log(`  消息:   ${r.data?.error?.message}`);
  });

  await runSample('5. 重复审核 E2002 — 审核一条已通过的报名', async () => {
    const regs = await request({ ...BASE, path: '/api/registrations?status=approved&limit=1', method: 'GET' });
    const id = regs.data?.data?.items?.[0]?.id;
    const users = await request({ ...BASE, path: '/api/users?role=admin_staff', method: 'GET' });
    const adminId = users.data?.data?.[0]?.id;
    if (!id || !adminId) { console.log('  跳过：缺少测试数据'); return; }
    const r = await request({
      ...BASE,
      path: `/api/registrations/${id}/audit`,
      method: 'POST',
      headers: { ...BASE.headers, 'X-User-Id': adminId, 'X-User-Role': 'admin_staff' },
    }, { action: 'approve' });
    console.log(`  状态码: ${r.status}  错误码: ${r.data?.error?.code}`);
    console.log(`  消息:   ${r.data?.error?.message}`);
  });

  await runSample('6. 未通过审核生成准考证 E4003 — 对 pending 状态生成准考证', async () => {
    const regs = await request({ ...BASE, path: '/api/registrations?status=pending&limit=1', method: 'GET' });
    const id = regs.data?.data?.items?.[0]?.id;
    const users = await request({ ...BASE, path: '/api/users?role=admin_staff', method: 'GET' });
    const adminId = users.data?.data?.[0]?.id;
    if (!id || !adminId) { console.log('  跳过：缺少测试数据'); return; }
    const r = await request({
      ...BASE,
      path: '/api/tickets',
      method: 'POST',
      headers: { ...BASE.headers, 'X-User-Id': adminId, 'X-User-Role': 'admin_staff' },
    }, { registration_id: id });
    console.log(`  状态码: ${r.status}  错误码: ${r.data?.error?.code}`);
    console.log(`  消息:   ${r.data?.error?.message}`);
  });

  await runSample('7. 准考证不存在 E4002 — 查询假准考证ID', async () => {
    const r = await request({ ...BASE, path: '/api/tickets/fake-ticket-id', method: 'GET' });
    console.log(`  状态码: ${r.status}  错误码: ${r.data?.error?.code}`);
    console.log(`  消息:   ${r.data?.error?.message}`);
  });

  await runSample('8. 角色无权 E5002 — 监考老师去审核报名', async () => {
    const regs = await request({ ...BASE, path: '/api/registrations?status=pending&limit=1', method: 'GET' });
    const id = regs.data?.data?.items?.[0]?.id;
    const users = await request({ ...BASE, path: '/api/users?role=invigilator', method: 'GET' });
    const invId = users.data?.data?.[0]?.id;
    if (!id || !invId) { console.log('  跳过：缺少测试数据'); return; }
    const r = await request({
      ...BASE,
      path: `/api/registrations/${id}/audit`,
      method: 'POST',
      headers: { ...BASE.headers, 'X-User-Id': invId, 'X-User-Role': 'invigilator' },
    }, { action: 'approve' });
    console.log(`  状态码: ${r.status}  错误码: ${r.data?.error?.code}`);
    console.log(`  消息:   ${r.data?.error?.message}`);
  });

  await runSample('9. 退回触发待办与通知 — 提交→退回→技术支持看到补正待办', async () => {
    let regId;
    {
      const r = await request({ ...BASE, path: '/api/registrations', method: 'POST' }, {
        candidate_name: '测试退回考生',
        id_card: '11010119990909123X',
        exam_type: '英语四级',
        phone: '13900139000',
      });
      regId = r.data?.data?.id;
      console.log(`  已创建报名: ${regId}`);
    }
    {
      const users = await request({ ...BASE, path: '/api/users?role=admin_staff', method: 'GET' });
      const adminId = users.data?.data?.[0]?.id;
      const r = await request({
        ...BASE,
        path: `/api/registrations/${regId}/audit`,
        method: 'POST',
        headers: { ...BASE.headers, 'X-User-Id': adminId, 'X-User-Role': 'admin_staff' },
      }, { action: 'reject', reason: '证件信息与系统不匹配，请核查后重新提交' });
      console.log(`  已退回, 状态码: ${r.status}, 当前报名状态: ${r.data?.data?.status}`);
      console.log(`  退回原因已写入记录: ${r.data?.data?.reject_reason}`);
    }
    {
      const users = await request({ ...BASE, path: '/api/users?role=tech_support', method: 'GET' });
      const techUser = users.data?.data?.[0];
      const r = await request({
        ...BASE,
        path: '/api/users/me/todos',
        method: 'GET',
        headers: { ...BASE.headers, 'X-User-Id': techUser.id, 'X-User-Role': techUser.role },
      });
      const related = r.data?.data?.items?.filter?.(t => t.registration_id === regId) || [];
      console.log(`  技术支持（${techUser.name}）待办数量: ${r.data?.data?.total}`);
      related.forEach(t => console.log(`    - [${t.type}] ${t.title} | ${t.content}`));
    }
  });

  await runSample('10. 完整正向流程 — 提交→审核通过→生成准考证→详情一览', async () => {
    let regId;
    {
      const r = await request({ ...BASE, path: '/api/registrations', method: 'POST' }, {
        candidate_name: '全流程考生',
        id_card: '110101199911117777',
        exam_type: '计算机二级',
        phone: '13700137000',
        email: 'fullflow@example.com',
      });
      regId = r.data?.data?.id;
      console.log(`  ① 已提交报名: ${regId}`);
    }
    {
      const users = await request({ ...BASE, path: '/api/users?role=admin_staff', method: 'GET' });
      const admin = users.data?.data?.[0];
      const r = await request({
        ...BASE,
        path: `/api/registrations/${regId}/audit`,
        method: 'POST',
        headers: { ...BASE.headers, 'X-User-Id': admin.id, 'X-User-Role': admin.role },
      }, { action: 'approve' });
      console.log(`  ② 审核通过（${admin.name}）, 状态: ${r.data?.data?.status}`);
    }
    {
      const users = await request({ ...BASE, path: '/api/users?role=invigilator', method: 'GET' });
      const inv = users.data?.data?.[0];
      const r = await request({
        ...BASE,
        path: '/api/tickets',
        method: 'POST',
        headers: { ...BASE.headers, 'X-User-Id': inv.id, 'X-User-Role': inv.role },
      }, { registration_id: regId });
      console.log(`  ③ 准考证生成（${inv.name}）: ${r.data?.data?.ticket_no}，考场：${r.data?.data?.room_code}，座位：${r.data?.data?.seat_no}`);
    }
    {
      const r = await request({ ...BASE, path: `/api/registrations/${regId}`, method: 'GET' });
      const d = r.data?.data || {};
      console.log(`  ④ 详情汇总（同一条记录）：`);
      console.log(`     考生: ${d.candidate_name} / ${d.id_card}`);
      console.log(`     状态: ${d.status}  审核人: ${d.auditor_name || '-'}  审核时间: ${d.audit_time || '-'}`);
      console.log(`     退回原因: ${d.reject_reason || '-'}  补充备注: ${d.supplement_remark || '-'}`);
      console.log(`     准考证: ${d.ticket_no || '-'}  考场: ${d.room_code || '-'}  座位: ${d.seat_no || '-'}`);
      console.log(`     时间线：`);
      (d.timeline || []).forEach(t => console.log(`       · ${t.created_at}  ${t.action_type.padEnd(16)} ${t.operator_name || '系统'}  ${t.detail}`));
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 所有异常样例与正向流程演示完毕');
}

main().catch(console.error);
