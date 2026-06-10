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
  let resData;
  if (responseType === 'text' || ct.includes('csv')) {
    resData = await res.text();
  } else if (res.status === 204) {
    resData = null;
  } else {
    resData = await res.json().catch(async () => await res.text());
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
      if (res.data.id !== 1) throw new Error('用户ID应为1，实际：' + res.data.id);
      return res.data.name;
    });

    await assert('【客服】创建接待单', async () => {
      const res = await api('POST', '/api/receptions', {
        data: {
          group_name: '角色切换验证测试团',
          scheduled_date: '2026-06-12',
          contact_person: '张团长',
          contact_phone: '13800000000',
          people_count: 30,
          source: '线上预订',
          remark: '验证各环节操作者正确留痕'
        }
      });
      if (res.status !== 201 || !res.data.id) throw new Error('创建失败：' + JSON.stringify(res.data));
      receptionId = res.data.id;
      return res.data.reception_no;
    });

    await assert('【客服】分配向导（assigned_by=李客服 id=1）', async () => {
      const res = await api('POST', `/api/receptions/${receptionId}/assign-guide`, {
        data: { guide_id: 2, picking_area: 'A区水蜜桃园' }
      });
      if (res.status !== 201 || !res.data.id) throw new Error('分配失败：' + JSON.stringify(res.data));
      guideTaskId = res.data.id;
      if (res.data.assigned_by !== 1) throw new Error(`assigned_by应为1，实际${res.data.assigned_by}`);
    });

    await assert('切换到采摘向导（王向导 id=2）', async () => {
      const res = await api('POST', '/api/users/switch-role', { data: { role: 'guide' } });
      if (res.data.role !== 'guide') throw new Error('角色未变');
      if (res.data.id !== 2) throw new Error('向导ID应为2，实际：' + res.data.id);
      return res.data.name;
    });

    await assert('【向导】开始采摘（操作者为王向导）', async () => {
      const res = await api('POST', `/api/guide-tasks/${guideTaskId}/start`);
      if (res.data.status !== 'in_progress') throw new Error('状态未变：' + res.data.status);
    });

    const fruitDetails = [
      { fruit_id: 1, fruit_name: '水蜜桃', variety: '白凤', weight: 120, price: 15 },
      { fruit_id: 2, fruit_name: '葡萄', variety: '巨峰', weight: 80, price: 12 }
    ];

    await assert('【向导】完成采摘（自动生成交接单）', async () => {
      const res = await api('POST', `/api/guide-tasks/${guideTaskId}/complete`, {
        data: { fruit_details: fruitDetails, total_weight: 200, remark: '果品新鲜，采摘完成' }
      });
      if (res.data.status !== 'completed') throw new Error('任务未完成');
    });

    await assert('接待单详情返回仓库交接（串联数据）', async () => {
      const res = await api('GET', `/api/receptions/${receptionId}`);
      const gt = res.data.guideTasks && res.data.guideTasks[0];
      if (!gt) throw new Error('未找到向导任务');
      if (!gt.warehouseTransfers || gt.warehouseTransfers.length === 0)
        throw new Error('向导任务未关联仓库交接');
      warehouseTransferId = gt.warehouseTransfers[0].id;
      if (gt.warehouseTransfers[0].status !== 'pending')
        throw new Error('交接单状态应为pending：' + gt.warehouseTransfers[0].status);
      return `交接单 ${gt.warehouseTransfers[0].transfer_no}`;
    });

    await assert('切换到仓库员（陈仓库 id=4）', async () => {
      const res = await api('POST', '/api/users/switch-role', { data: { role: 'warehouse' } });
      if (res.data.role !== 'warehouse') throw new Error('角色未变');
      if (res.data.id !== 4) throw new Error('仓库员ID应为4，实际：' + res.data.id);
      return res.data.name;
    });

    await assert('【仓库】接收果品（received_by=陈仓库 id=4）', async () => {
      const res = await api('POST', `/api/warehouse-transfers/${warehouseTransferId}/receive`, {
        data: { fruit_details: fruitDetails, total_weight: 200 }
      });
      if (res.data.status !== 'received') throw new Error('未收到：' + res.data.status);
      if (res.data.received_by !== 4) throw new Error(`received_by应为4，实际${res.data.received_by}`);
    });

    await assert('【仓库】确认入库（接待单联动completed）', async () => {
      const res = await api('POST', `/api/warehouse-transfers/${warehouseTransferId}/store`, {
        data: { storage_location: '冷藏库A-03架', remark: '库位已登记，入库完成' }
      });
      if (res.data.status !== 'stored') throw new Error('未入库：' + res.data.status);
    });

    await assert('验证接待单最终状态为已完成', async () => {
      const res = await api('GET', `/api/receptions/${receptionId}`);
      if (res.data.status !== 'completed') throw new Error(`应为completed，实际${res.data.status}`);
    });

    await assert('验证审计日志各环节操作者正确留痕', async () => {
      const res = await api('GET', '/api/audit-logs', { params: { pageSize: 100 } });
      const list = res.data.list || [];

      const opMap = {};
      list.forEach(l => { opMap[`${l.biz_type}:${l.action}`] = l.operator_name; });

      console.log('\n   ↓ 各环节操作者记录：');
      Object.entries(opMap).slice(0, 12).forEach(([k, v]) => console.log(`     ${k} = ${v}`));

      const checks = [
        ['reception:创建', '李客服'],
        ['reception:分配向导', '李客服'],
        ['guide_task:开始采摘', '王向导'],
        ['guide_task:完成采摘', '王向导'],
        ['warehouse_transfer:接收', '陈仓库'],
        ['warehouse_transfer:入库', '陈仓库']
      ];
      for (const [k, expect] of checks) {
        if (opMap[k] !== expect) throw new Error(`${k} 操作者应为${expect}，实际${opMap[k]}`);
      }
      return '操作者全部正确';
    });

    await assert('导出接口未被/:id拦截（返回CSV）', async () => {
      const res = await api('GET', '/api/receptions/export', { responseType: 'text' });
      const ct = res.headers['content-type'] || '';
      const body = typeof res.data === 'string' ? res.data : '';
      if (!ct.includes('csv') && !body.includes('单号,团体名称'))
        throw new Error('导出被详情拦截或返回异常，content-type=' + ct);
      return `CSV ${body.length} 字符`;
    });

    console.log('\n🎉🎉🎉 全部 13 项测试通过！接力链路断点修复完毕！');
    console.log('✅ 导出路由顺序正确');
    console.log('✅ 角色切换真实操作者上下文（cookie+users表）');
    console.log('✅ 接待详情串联向导任务+仓库交接+直接操作');
    console.log('✅ created_by/assigned_by/received_by + 审计日志 操作者正确');
  } catch (e) {
    console.error('\n全局未捕获错误：', e);
    process.exit(1);
  }
})();
