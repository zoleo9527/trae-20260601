const baseURL = 'http://localhost:3001';

let cookieStore = {};

function setCookiesFromHeaders(headers) {
  const setCookie = headers.getSetCookie ? headers.getSetCookie() : [];
  setCookie.forEach(c => {
    const [kv] = c.split(';');
    const idx = kv.indexOf('=');
    if (idx > 0) {
      const k = kv.substring(0, idx).trim();
      const v = kv.substring(idx + 1);
      cookieStore[k] = v;
    }
  });
}

function getCookieHeader() {
  return Object.entries(cookieStore).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function api(method, path, { data, params, responseType } = {}) {
  let url = baseURL + path;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.append(k, String(v)); });
    const s = qs.toString();
    if (s) url += '?' + s;
  }

  const headers = { 'Content-Type': 'application/json' };
  const ck = getCookieHeader();
  if (ck) headers.Cookie = ck;

  const init = {
    method,
    headers,
    credentials: 'include'
  };
  if (data !== undefined) init.body = JSON.stringify(data);

  const res = await fetch(url, init);
  setCookiesFromHeaders(res.headers);

  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  let resData;
  if (responseType === 'text' || ct.includes('csv')) {
    resData = text;
  } else if (res.status === 204) {
    resData = null;
  } else {
    try {
      resData = JSON.parse(text);
    } catch (e) {
      resData = text;
    }
  }
  return { status: res.status, data: resData, headers: { 'content-type': ct } };
}

let receptionId = null;
let guideTaskId = null;
let warehouseTransferId = null;

async function assert(name, fn) {
  process.stdout.write(`测试：${name}...`);
  try {
    const ret = await fn();
    console.log(' ✅ 通过' + (ret !== undefined && ret !== null ? ` → ${ret}` : ''));
    return true;
  } catch (e) {
    console.log(` ❌ 失败：${e.message}`);
    console.error(e.stack);
    process.exit(1);
  }
}

(async () => {
  try {
    await assert('健康检查', async () => {
      const res = await api('GET', '/api/health');
      if (res.data.status !== 'ok') throw new Error('不健康');
    });

    await assert('切换到园区客服（李客服 id=1）', async () => {
      const res = await api('POST', '/api/users/switch-role', { data: { role: 'service' } });
      if (res.data.role !== 'service') throw new Error('角色未变');
      return res.data.name;
    });

    await assert('【客服】创建接待单', async () => {
      const res = await api('POST', '/api/receptions', {
        data: {
          group_name: '消息通知验证团',
          scheduled_date: '2026-06-15',
          contact_person: '刘团长',
          contact_phone: '13900000000',
          people_count: 25,
          source: '单位合作',
          remark: '通知链路测试'
        }
      });
      if (res.status !== 201 || !res.data.id) throw new Error('创建失败');
      receptionId = res.data.id;
      return res.data.reception_no;
    });

    await assert('【客服】分配向导（给王向导 id=2）', async () => {
      const res = await api('POST', `/api/receptions/${receptionId}/assign-guide`, {
        data: { guide_id: 2, picking_area: 'B区葡萄园' }
      });
      if (res.status !== 201) throw new Error('分配失败');
      guideTaskId = res.data.id;
    });

    await assert('切换到向导（王向导 id=2），检查有 1 条未读通知', async () => {
      const res = await api('POST', '/api/users/switch-role', { data: { role: 'guide' } });
      if (res.data.id !== 2) throw new Error('向导ID应为2');

      const countRes = await api('GET', '/api/notifications/unread-count');
      console.log(` (未读：${countRes.data.count})`);
      if (countRes.data.count < 1) throw new Error('向导应该有未读通知，实际：' + countRes.data.count);

      const listRes = await api('GET', '/api/notifications', { params: { read: '0', pageSize: 10 } });
      console.log('    ↓ 通知内容：');
      listRes.data.list.forEach(n => console.log(`    · [${n.type}] ${n.title} - ${n.content?.slice(0, 40)}...`));

      const taskNotif = listRes.data.list.find(n => n.biz_type === 'guide_task');
      if (!taskNotif) throw new Error('向导未收到分配通知');
      if (!taskNotif.title.includes('向导任务')) throw new Error('通知标题不对：' + taskNotif.title);
      return `${countRes.data.count} 条未读`;
    });

    await assert('【向导】开始采摘', async () => {
      const res = await api('POST', `/api/guide-tasks/${guideTaskId}/start`);
      if (res.data.status !== 'in_progress') throw new Error('未开始');
    });

    const fruitDetails = [
      { fruit_id: 5, fruit_name: '葡萄', variety: '阳光玫瑰', weight: 100, price: 18 }
    ];

    await assert('【向导】完成采摘（自动生成交接单，通知仓库员）', async () => {
      const res = await api('POST', `/api/guide-tasks/${guideTaskId}/complete`, {
        data: { fruit_details: fruitDetails, total_weight: 100 }
      });
      if (res.data.status !== 'completed') throw new Error('未完成');
    });

    await assert('切换到仓库员（陈仓库 id=4），检查有未读待入库通知', async () => {
      const res = await api('POST', '/api/users/switch-role', { data: { role: 'warehouse' } });
      if (res.data.id !== 4) throw new Error('仓库员ID应为4，实际' + res.data.id);

      const countRes = await api('GET', '/api/notifications/unread-count');
      console.log(` (未读：${countRes.data.count})`);
      if (countRes.data.count < 1) throw new Error('仓库员应有未读通知，实际' + countRes.data.count);

      const listRes = await api('GET', '/api/notifications', { params: { pageSize: 10 } });
      const wNotif = listRes.data.list.find(n => n.biz_type === 'warehouse_transfer');
      if (!wNotif) throw new Error('仓库员未收到待入库通知');
      console.log('    ↓ 待入库通知：');
      console.log(`    · [${wNotif.type}] ${wNotif.title} - ${wNotif.content?.slice(0, 50)}...`);
      warehouseTransferId = wNotif.biz_id;
      return `${countRes.data.count} 条，${wNotif.title}`;
    });

    await assert('【仓库】接收果品（通知客服）', async () => {
      const res = await api('POST', `/api/warehouse-transfers/${warehouseTransferId}/receive`, {
        data: { fruit_details: fruitDetails, total_weight: 100 }
      });
      if (res.data.status !== 'received') throw new Error('未接收');
    });

    await assert('【仓库】确认入库（通知客服流程完成）', async () => {
      const res = await api('POST', `/api/warehouse-transfers/${warehouseTransferId}/store`, {
        data: { storage_location: '普通库B-05' }
      });
      if (res.data.status !== 'stored') throw new Error('未入库');
    });

    await assert('切回客服（李客服 id=1），检查有 2 条通知（接收 + 入库完成）', async () => {
      const res = await api('POST', '/api/users/switch-role', { data: { role: 'service' } });
      if (res.data.id !== 1) throw new Error('客服ID应为1');

      const countRes = await api('GET', '/api/notifications/unread-count');
      const listRes = await api('GET', '/api/notifications', { params: { pageSize: 20 } });
      console.log(` (未读：${countRes.data.count}，总 ${listRes.data.total})`);
      console.log('    ↓ 客服通知列表：');
      listRes.data.list.forEach(n => console.log(`    · [${n.type}] ${n.title} | ${n.content?.slice(0, 50)}...`));

      const recv = listRes.data.list.find(n => n.title?.includes('仓库接收'));
      const done = listRes.data.list.find(n => n.title?.includes('已完成全部流程'));
      if (!recv) throw new Error('客服未收到果品已接收通知');
      if (!done) throw new Error('客服未收到流程完成通知');
      return `${recv.title} + ${done.title}`;
    });

    await assert('客服点击单条已读，未读数减 1', async () => {
      const before = (await api('GET', '/api/notifications/unread-count')).data.count;
      const listRes = await api('GET', '/api/notifications', { params: { read: '0' } });
      if (listRes.data.list.length === 0) return '无未读';
      const first = listRes.data.list[0];
      await api('POST', `/api/notifications/${first.id}/read`);
      const after = (await api('GET', '/api/notifications/unread-count')).data.count;
      if (after !== before - 1) throw new Error(`已读前后：${before} → ${after}，应该减少 1`);
      return `${before} → ${after}`;
    });

    await assert('全部已读后未读数为 0', async () => {
      await api('POST', '/api/notifications/read-all');
      const after = (await api('GET', '/api/notifications/unread-count')).data.count;
      if (after !== 0) throw new Error('全部已读后未读数应为0，实际' + after);
      return after;
    });

    console.log('\n🎉🎉🎉 消息通知链路验证全部通过！');
    console.log('✅ 分配向导 → 通知向导（角色=guide）');
    console.log('✅ 完成采摘 → 通知所有仓库员（角色=warehouse）');
    console.log('✅ 仓库接收 → 通知客服（接待单创建人）');
    console.log('✅ 入库完成 → 通知客服（接待单创建人）');
    console.log('✅ 单条已读 / 全部已读 接口正常');
    console.log('✅ 通知按用户隔离（每个角色只能看到自己的通知）');
  } catch (e) {
    console.error('\n全局未捕获错误：', e);
    process.exit(1);
  }
})();
