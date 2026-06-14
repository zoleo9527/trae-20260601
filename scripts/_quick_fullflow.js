const { spawn, execSync } = require('child_process');
const path = require('path');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const http = require('http');
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

(async () => {
  // 步骤1：获取用户
  let users;
  {
    const r = await request({ ...BASE, path: '/api/users', method: 'GET' });
    users = {};
    r.data.data.forEach(u => users[u.username] = u);
  }
  const hdr = u => ({ ...BASE.headers, 'X-User-Id': u.id, 'X-User-Role': u.role });

  let id;
  // 步骤1 提交
  {
    const r = await request({ ...BASE, path: '/api/registrations', method: 'POST' }, {
      candidate_name: '闭环考生', id_card: '11010119990808123X',
      exam_type: '英语六级', phone: '13600136000',
    });
    if (!r.data.success) { console.log('步骤1失败', JSON.stringify(r.data.error)); process.exit(1); }
    id = r.data.data.id;
    console.log('步骤1 OK: 提交报名', id.slice(0, 10));
  }
  // 步骤2 退回归属孙支持
  {
    const r = await request({
      ...BASE, path: `/api/registrations/${id}/audit`, method: 'POST',
      headers: hdr(users.admin_wang),
    }, { action: 'reject', reason: '英语六级需要CET4成绩单，请补充上传', handler_id: users.tech_sun.id });
    console.log('步骤2 OK: 退回，status=' + r.data.data.status, 'handler=' + r.data.data.handler_name);
    // 查孙支持与陈工待办
    const s1 = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr(users.tech_sun) });
    const s2 = await request({ ...BASE, path: '/api/users/me/todos', method: 'GET', headers: hdr(users.tech_chen) });
    const m1 = s1.data.data.items.filter(t => t.type === 'supplement_pending' && t.registration_id === id);
    const m2 = s2.data.data.items.filter(t => t.type === 'supplement_pending' && t.registration_id === id);
    console.log(`  孙支持待办有：${m1.length > 0 ? '是' : '否'}，陈工待办有：${m2.length > 0 ? '是（应否！）' : '否'}`);
  }
  // 步骤3 孙支持标记补正完成
  {
    const r = await request({
      ...BASE, path: `/api/registrations/${id}/supplement`, method: 'POST',
      headers: hdr(users.tech_sun),
    }, { remark: 'CET4成绩单已补传至附件目录', mark_resolved: true });
    const d = r.data.data;
    console.log('步骤3 OK: 补正完成，status=' + d.status + '/' + d.status_label, 'by=' + d.supplement_by_name + '@' + d.supplement_time);
  }
  // 步骤4 李专员复审通过
  {
    const r = await request({
      ...BASE, path: `/api/registrations/${id}/audit`, method: 'POST',
      headers: hdr(users.admin_li),
    }, { action: 'approve', assigned_invigilator_id: users.inv_zhao.id });
    const d = r.data.data;
    console.log('步骤4 OK: 复审通过，status=' + d.status, 'inv=' + d.assigned_invigilator_name);
    const notif = d.timeline.filter(t => t.action_type.startsWith('re_review') || t.action_type === 'supplement_done');
    notif.forEach(t => console.log('  timeline:', t.action_type, t.operator_name, t.detail));
  }
  // 步骤5 赵老师生成准考证
  {
    const r = await request({
      ...BASE, path: '/api/tickets', method: 'POST',
      headers: hdr(users.inv_zhao),
    }, { registration_id: id });
    const d = r.data.data;
    console.log('步骤5 OK: 准考证号=' + d.ticket_no, '考场=' + d.room_code, '座位=' + d.seat_no, '监考=' + d.invigilators.map(i => i.name).join(','));
  }
  // 步骤6 详情汇总
  {
    const r = await request({ ...BASE, path: `/api/registrations/${id}`, method: 'GET' });
    const d = r.data.data;
    console.log('步骤6 详情汇总：');
    console.log('  状态:', d.status_label, '审核人:', d.auditor_name, '审核时间:', d.audit_time);
    console.log('  补正处理人:', d.supplement_by_name, '补正时间:', d.supplement_time, '补正完成:', d.supplement_completed);
    console.log('  准考证:', d.ticket_no, '考场:', d.room_code, '监考:', (d.invigilators || []).map(i => i.name).join(','));
    console.log('  时间线：');
    d.timeline.forEach(tl => console.log('    ·', tl.created_at, tl.action_type.padEnd(20), tl.operator_name || '系统', tl.detail));
  }
})().catch(e => { console.error(e); process.exit(1); });
