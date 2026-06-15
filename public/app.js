const API_BASE = '/api';
let currentRole = 'warehouse_supervisor';
let currentView = 'dashboard';
let ordersCache = [];
let lastOrderStates = {};
let refreshTimer = null;

const STATUS_LABEL = {
  '待拣货': 'pending',
  '拣货中': 'pending',
  '拣货复核中': 'audit',
  '拣货复核驳回': 'rejected',
  '待装车安排': 'arrange',
  '装车中': 'loading',
  '配送中': 'transit',
  '已送达': 'done',
  '异常': 'exception',
  '已完成': 'done'
};

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function showModal(title, bodyContent, footerContent) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyContent;
  document.getElementById('modalFooter').innerHTML = footerContent;
  document.getElementById('modalOverlay').classList.add('active');
}

function hideModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

function openDrawer(which) {
  document.getElementById('drawerOverlay').classList.add('active');
  document.getElementById(which).classList.add('active');
}

function closeAllDrawers() {
  document.getElementById('drawerOverlay').classList.remove('active');
  document.querySelectorAll('.drawer').forEach(d => d.classList.remove('active'));
}

function statusTag(status) {
  const cls = STATUS_LABEL[status] || 'pending';
  return `<span class="status-tag ${cls}">${status}</span>`;
}

async function switchRole(role) {
  await api('/role', { method: 'POST', body: JSON.stringify({ role }) });
  currentRole = role;
  renderRoleButtons();
  refreshAll();
}

function renderRoleButtons() {
  const roles = [
    { key: 'warehouse_supervisor', label: '仓库主管', icon: '🏭' },
    { key: 'driver', label: '司机', icon: '🚚' },
    { key: 'customer_service', label: '客服', icon: '💬' }
  ];
  document.getElementById('roleButtons').innerHTML = roles.map(r =>
    `<button class="role-btn ${r.key === currentRole ? 'active' : ''}" data-role="${r.key}">${r.icon} ${r.label}</button>`
  ).join('');
  document.querySelectorAll('#roleButtons .role-btn').forEach(btn => {
    btn.onclick = () => switchRole(btn.dataset.role);
  });
}

async function loadDashboard() {
  const data = await api('/dashboard');
  const orders = await api('/orders');
  ordersCache = orders;

  document.getElementById('noticeBadge').textContent = data.unreadCount || '';

  const pendingAuditOrders = orders.filter(o =>
    o.status === '拣货复核中' || o.status === '拣货复核驳回'
  );
  const loadingOrders = orders.filter(o =>
    o.status === '待装车安排' || o.status === '装车中' || o.status === '配送中'
  );

  let roleHint = '';
  if (currentRole === 'warehouse_supervisor') {
    roleHint = '<p class="stat-hint">请优先处理拣货复核</p>';
  } else if (currentRole === 'driver') {
    roleHint = '<p class="stat-hint">请查看装车安排任务</p>';
  } else {
    roleHint = '<p class="stat-hint">请关注异常通知</p>';
  }

  document.getElementById('view-dashboard').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card info">
        <div class="stat-label">待拣货复核</div>
        <div class="stat-value">${data.pendingAudit}</div>
        <p class="stat-hint">仓库主管处理中</p>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">待装车安排</div>
        <div class="stat-value">${data.pendingArrange}</div>
        <p class="stat-hint">等待调度分配车辆</p>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">装车 / 配送中</div>
        <div class="stat-value">${data.loading + data.inTransit}</div>
        <p class="stat-hint">司机执行中</p>
      </div>
      <div class="stat-card danger">
        <div class="stat-label">异常订单</div>
        <div class="stat-value">${data.exception}</div>
        <p class="stat-hint">${data.openExceptions} 条待客服处理</p>
      </div>
      <div class="stat-card success">
        <div class="stat-label">已完成</div>
        <div class="stat-value">${data.byStatus['已完成'] || 0}</div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">📌 我的待办 ${roleHint}</div>
      ${currentRole === 'warehouse_supervisor' ? `
        ${pendingAuditOrders.length ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${pendingAuditOrders.map(o => `
                <tr>
                  <td><strong>${o.id}</strong></td>
                  <td>${o.customer}</td>
                  <td>${statusTag(o.status)}</td>
                  <td>${o.createdAt}</td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="openPickingAudit('${o.id}')">去复核</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-text">暂无待办任务</div></div>'}
      ` : ''}
      ${currentRole === 'driver' ? `
        ${loadingOrders.length ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户 / 地址</th>
                <th>装车状态</th>
                <th>司机 / 车牌</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${loadingOrders.map(o => `
                <tr>
                  <td><strong>${o.id}</strong></td>
                  <td>
                    <div>${o.customer}</div>
                    <div style="font-size:12px;color:#6b7280">${o.address}</div>
                  </td>
                  <td>${statusTag(o.status)}</td>
                  <td>${o.loadingArrange?.driver || '<span style="color:#9ca3af">未分配</span>'}</td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="openLoadingView('${o.id}')">查看装车</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-text">暂无装车任务</div></div>'}
      ` : ''}
      ${currentRole === 'customer_service' ? `
        ${data.exception > 0 ? `
          <div id="dashboardExceptions"></div>
        ` : '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-text">暂无异常待处理</div></div>'}
      ` : ''}
    </div>

    <div class="card">
      <div class="section-title">📋 全部订单概览</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>物料</th>
            <th>状态</th>
            <th>预计送达</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td><strong>${o.id}</strong></td>
              <td>${o.customer}</td>
              <td>${o.items.map(i => i.material).join('、')}</td>
              <td>${statusTag(o.status)}</td>
              <td>${o.expectedDelivery}</td>
              <td><button class="btn btn-secondary btn-sm" onclick="openOrderDetail('${o.id}')">详情</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (currentRole === 'customer_service') {
    loadDashboardExceptions();
  }
}

async function loadDashboardExceptions() {
  const exceptions = await api('/exceptions?status=待处理');
  const el = document.getElementById('dashboardExceptions');
  if (!el) return;
  if (!exceptions.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-text">暂无异常待处理</div></div>';
    return;
  }
  el.innerHTML = exceptions.map(e => `
    <div class="exception-item">
      <div class="exception-header">
        <span class="exception-type">⚠️ ${e.type} - ${e.material}</span>
        <span class="exception-status pending">${e.status}</span>
      </div>
      <div class="exception-meta">
        订单 ${e.orderId} | 计划 ${e.plannedQty}${e.material.includes('管') || e.material.includes('钢筋') ? '米/根' : e.material.includes('砖') ? '块' : '袋'} /
        实际 ${e.actualQty}${e.material.includes('管') || e.material.includes('钢筋') ? '米/根' : e.material.includes('砖') ? '块' : '袋'} |
        差异 <strong class="diff-negative">${e.diff > 0 ? '+' : ''}${e.diff}</strong> |
        上报人：${e.reporter} | ${e.reportTime}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-primary btn-sm" onclick="openExceptionDrawer('${e.orderId}')">查看详情</button>
        <button class="btn btn-warning btn-sm" onclick="escalateException('${e.id}')">升级处理</button>
      </div>
    </div>
  `).join('');
}

async function loadOrders() {
  const orders = await api('/orders');
  ordersCache = orders;

  document.getElementById('view-orders').innerHTML = `
    <div class="card">
      <div class="filter-bar">
        <label>状态筛选：</label>
        <select id="statusFilter">
          <option value="">全部</option>
          <option>待拣货</option>
          <option>拣货中</option>
          <option>拣货复核中</option>
          <option>拣货复核驳回</option>
          <option>待装车安排</option>
          <option>装车中</option>
          <option>配送中</option>
          <option>异常</option>
          <option>已完成</option>
        </select>
        <button class="btn btn-secondary btn-sm" onclick="refreshAll()">🔄 刷新</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>送货地址</th>
            <th>联系人</th>
            <th>物料</th>
            <th>状态</th>
            <th>预计送达</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="ordersTableBody">
          ${renderOrdersRows(orders)}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('statusFilter').onchange = async (e) => {
    const status = e.target.value;
    const list = status ? orders.filter(o => o.status === status) : orders;
    document.getElementById('ordersTableBody').innerHTML = renderOrdersRows(list);
  };
}

function renderOrdersRows(orders) {
  if (!orders.length) {
    return `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无订单</div></div></td></tr>`;
  }
  return orders.map(o => {
    const changed = hasOrderChanged(o);
    return `
      <tr class="${changed ? 'highlight-change' : ''}">
        <td>
          <strong>${o.id}</strong>
          ${changed ? '<span class="change-badge">已更新</span>' : ''}
        </td>
        <td>${o.customer}</td>
        <td style="font-size:12px;max-width:200px">${o.address}</td>
        <td>${o.contact}<br><span style="font-size:11px;color:#6b7280">${o.phone}</span></td>
        <td style="font-size:12px">${o.items.map(i => `${i.material} ${i.qty}${i.unit}`).join('<br>')}</td>
        <td>${statusTag(o.status)}</td>
        <td style="font-size:12px">${o.expectedDelivery}</td>
        <td style="font-size:12px">${o.createdAt}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm" onclick="openOrderDetail('${o.id}')">详情</button>
            ${o.status === '拣货复核中' || o.status === '拣货复核驳回' ?
              `<button class="btn btn-primary btn-sm" onclick="openPickingAudit('${o.id}')">复核</button>` : ''}
            ${o.status === '待装车安排' || o.status === '装车中' ?
              `<button class="btn btn-primary btn-sm" onclick="openLoadingView('${o.id}')">装车</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadPickingView() {
  const all = await api('/orders');
  const list = all.filter(o =>
    o.status === '拣货复核中' || o.status === '拣货复核驳回' ||
    o.status === '待装车安排' || o.status === '装车中'
  );

  document.getElementById('view-picking').innerHTML = `
    <div class="tabs">
      <button class="tab active" data-tab="pending">待复核 (${list.filter(o => o.status === '拣货复核中' || o.status === '拣货复核驳回').length})</button>
      <button class="tab" data-tab="done">已复核 (${list.filter(o => o.status === '待装车安排' || o.status === '装车中').length})</button>
    </div>
    <div id="pickingTabContent"></div>
  `;

  function renderTab(tab) {
    const data = tab === 'pending'
      ? list.filter(o => o.status === '拣货复核中' || o.status === '拣货复核驳回')
      : list.filter(o => o.status === '待装车安排' || o.status === '装车中');

    document.getElementById('pickingTabContent').innerHTML = data.length ? `
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>物料明细</th>
              <th>状态</th>
              <th>复核人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(o => `
              <tr>
                <td><strong>${o.id}</strong></td>
                <td>${o.customer}</td>
                <td style="font-size:12px">
                  ${(o.pickingAudit?.actualItems || o.items).map(i => `
                    <div>${i.material}：
                      ${i.plannedQty || i.qty}${i.unit}
                      ${i.diff !== undefined && i.diff !== 0 ?
                        `→ <strong class="${i.diff < 0 ? 'diff-negative' : 'diff-positive'}">${i.actualQty}${i.unit} (${i.diff > 0 ? '+' : ''}${i.diff})</strong>` : ''}
                    </div>
                  `).join('')}
                </td>
                <td>${statusTag(o.status)}</td>
                <td>${o.pickingAudit?.auditor || '<span style="color:#9ca3af">-</span>'}</td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-primary btn-sm" onclick="openPickingAudit('${o.id}')">${tab === 'pending' ? '去复核' : '查看/修改'}</button>
                    ${tab === 'done' ? `<button class="btn btn-warning btn-sm" onclick="resetPickingAudit('${o.id}')">重置</button>` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无数据</div></div>';
  }

  renderTab('pending');
  document.querySelectorAll('#view-picking .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#view-picking .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTab(tab.dataset.tab);
    };
  });
}

async function openPickingAudit(orderId) {
  const order = await api(`/orders/${orderId}`);
  const audit = order.pickingAudit || { actualItems: order.items.map(i => ({
    material: i.material, unit: i.unit, plannedQty: i.qty, actualQty: i.qty, diff: 0, reason: ''
  })), remark: '' };

  const canEdit = currentRole === 'warehouse_supervisor';

  showModal(`拣货复核 - ${order.id}`, `
    <div class="detail-grid" style="margin-bottom:16px">
      <div>
        <div class="detail-label">客户</div>
        <div class="detail-value">${order.customer}</div>
      </div>
      <div>
        <div class="detail-label">状态</div>
        <div>${statusTag(order.status)}</div>
      </div>
      <div>
        <div class="detail-label">送货地址</div>
        <div class="detail-value" style="font-size:13px">${order.address}</div>
      </div>
      <div>
        <div class="detail-label">联系人 / 电话</div>
        <div class="detail-value" style="font-size:13px">${order.contact} ${order.phone}</div>
      </div>
    </div>

    <div class="detail-section">
      <div class="section-title" style="font-size:14px;margin-bottom:10px">📦 复核明细</div>
      <table class="items-table" id="auditItemsTable">
        <thead>
          <tr>
            <th>物料</th>
            <th>单位</th>
            <th>计划数量</th>
            <th>实际数量</th>
            <th>差异</th>
            <th>差异原因</th>
          </tr>
        </thead>
        <tbody>
          ${audit.actualItems.map((item, idx) => `
            <tr>
              <td>${item.material}</td>
              <td>${item.unit}</td>
              <td>${item.plannedQty}</td>
              <td>
                <input type="number" min="0" data-idx="${idx}" class="actual-qty-input"
                  value="${item.actualQty}" ${canEdit ? '' : 'disabled'}>
              </td>
              <td class="diff-cell" data-idx="${idx}">
                ${item.diff > 0 ? `<span class="diff-positive">+${item.diff}</span>` :
                  item.diff < 0 ? `<span class="diff-negative">${item.diff}</span>` :
                  '<span style="color:#9ca3af">0</span>'}
              </td>
              <td>
                <input type="text" class="reason-input" data-idx="${idx}"
                  value="${item.reason || ''}" ${canEdit ? '' : 'disabled'}
                  placeholder="填写差异原因...">
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="form-group">
      <label class="form-label">复核备注</label>
      <textarea class="form-textarea" id="auditRemark" ${canEdit ? '' : 'disabled'}
        placeholder="请填写复核意见...">${audit.remark || ''}</textarea>
    </div>

    ${order.status === '装车中' || order.status === '待装车安排' ? `
      <div style="padding:10px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e;margin-bottom:14px">
        ⚠️ 该订单已进入装车安排阶段，修改复核数据后，司机侧将收到变更通知。
      </div>
    ` : ''}
  `, canEdit ? `
    <button class="btn btn-secondary" onclick="hideModal()">取消</button>
    <button class="btn btn-danger" onclick="submitAudit('${orderId}', 'reject')">驳回重拣</button>
    <button class="btn btn-primary" onclick="submitAudit('${orderId}', 'pass')">复核通过</button>
  ` : `
    <button class="btn btn-secondary" onclick="hideModal()">关闭</button>
    <span style="color:#9ca3af;font-size:12px">当前角色无编辑权限</span>
  `);

  document.querySelectorAll('.actual-qty-input').forEach(inp => {
    inp.oninput = () => updateAuditDiff(audit.actualItems);
  });
}

function updateAuditDiff(items) {
  document.querySelectorAll('.actual-qty-input').forEach(inp => {
    const idx = parseInt(inp.dataset.idx);
    const actual = parseInt(inp.value) || 0;
    const planned = items[idx].plannedQty;
    const diff = actual - planned;
    items[idx].actualQty = actual;
    items[idx].diff = diff;
    const cell = document.querySelector(`.diff-cell[data-idx="${idx}"]`);
    if (cell) {
      cell.innerHTML = diff > 0 ? `<span class="diff-positive">+${diff}</span>` :
        diff < 0 ? `<span class="diff-negative">${diff}</span>` :
        '<span style="color:#9ca3af">0</span>';
    }
  });
}

async function submitAudit(orderId, action) {
  const items = [];
  document.querySelectorAll('#auditItemsTable tbody tr').forEach((tr, idx) => {
    const inputs = tr.querySelectorAll('input');
    const actualQty = parseInt(inputs[0]?.value) || 0;
    const reason = inputs[1]?.value || '';
    const order = ordersCache.find(o => o.id === orderId);
    const base = order.pickingAudit?.actualItems?.[idx] || order.items[idx];
    items.push({
      material: base.material,
      unit: base.unit,
      plannedQty: base.plannedQty || base.qty,
      actualQty,
      reason
    });
  });

  const remark = document.getElementById('auditRemark')?.value || '';
  try {
    await api(`/orders/${orderId}/picking-audit`, {
      method: 'PUT',
      body: JSON.stringify({ auditor: '张主管', actualItems: items, remark, action })
    });
    hideModal();
    toast(action === 'reject' ? '已驳回，需要重新拣货' : '复核已提交', action === 'reject' ? 'warning' : 'success');
    if (action === 'pass') {
      markOrderChanged(orderId);
    }
    refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function resetPickingAudit(orderId) {
  if (!confirm('确定要重置该订单的拣货复核吗？将恢复到待复核状态。')) return;
  try {
    await api(`/orders/${orderId}/picking-audit/reset`, { method: 'POST', body: JSON.stringify({ operator: '张主管' }) });
    toast('已重置为待复核状态', 'info');
    refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function goToLoadingCard(orderId) {
  if (currentView !== 'loading') {
    switchView('loading', { scrollToOrder: orderId });
  } else {
    const el = document.getElementById(`loading-card-${orderId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-change');
      setTimeout(() => el.classList.remove('highlight-change'), 3000);
    }
  }
}

async function openLoadingView(orderId) {
  if (currentView !== 'loading') {
    switchView('loading', { scrollToOrder: orderId });
  } else {
    const el = document.getElementById(`loading-card-${orderId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-change');
      setTimeout(() => el.classList.remove('highlight-change'), 3000);
    }
  }
}

async function loadLoadingView() {
  const all = await api('/orders');
  const list = all.filter(o =>
    o.status === '待装车安排' || o.status === '装车中' || o.status === '配送中'
  );
  const summaryList = await api('/orders-change-summary');
  const summaryMap = {};
  summaryList.forEach(s => summaryMap[s.orderId] = s);

  document.getElementById('view-loading').innerHTML = `
    <div class="section-title">🚚 装车安排看板 <span style="font-size:12px;font-weight:400;color:#6b7280;margin-left:8px">跨角色变更追踪</span></div>
    <div class="filter-bar" style="margin-bottom:16px">
      <label>快速筛选：</label>
      <div class="role-buttons" style="background:#f3f4f6;padding:3px;border-radius:6px">
        <button class="role-btn active" data-loading-filter="all">全部 (${list.length})</button>
        <button class="role-btn" data-loading-filter="diff">🔔 有复核变更 (${list.filter(o => summaryMap[o.id]?.hasAuditChange).length})</button>
        <button class="role-btn" data-loading-filter="exception">⚠️ 异常待处理 (${list.filter(o => summaryMap[o.id]?.hasOpenException).length})</button>
      </div>
      <span style="margin-left:auto;font-size:12px;color:#6b7280">
        💡 黄色卡片表示复核有变更记录，红色标记表示有未处理异常
      </span>
    </div>
    <div id="loadingOrderList">
      ${list.length ? list.map(o => renderLoadingCard(o, summaryMap[o.id])).join('') :
        '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无待装车订单</div></div>'}
    </div>
  `;

  document.querySelectorAll('[data-loading-filter]').forEach(btn => {
    btn.onclick = async () => {
      document.querySelectorAll('[data-loading-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.loadingFilter;
      let filtered = list;
      if (filter === 'diff') filtered = list.filter(o => summaryMap[o.id]?.hasAuditChange);
      if (filter === 'exception') filtered = list.filter(o => summaryMap[o.id]?.hasOpenException);
      document.getElementById('loadingOrderList').innerHTML = filtered.length ?
        filtered.map(o => renderLoadingCard(o, summaryMap[o.id])).join('') :
        '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">该筛选条件下无订单</div></div>';
    };
  });
}

function renderLoadingCard(order, summary) {
  const changed = hasOrderChanged(order);
  const la = order.loadingArrange || {};
  const audit = order.pickingAudit;
  const hasException = summary?.hasOpenException || false;

  return `
    <div class="order-card ${changed ? 'changed' : ''} ${hasException ? 'exception-card' : ''}" id="loading-card-${order.id}" data-order-id="${order.id}">
      <div class="order-card-header ${changed ? 'changed' : ''} ${hasException ? 'changed' : ''}">
        <div>
          <span class="order-id">${order.id}</span>
          <span class="order-customer">${order.customer}</span>
          ${changed ? '<span class="change-badge">🔔 复核数据已更新</span>' : ''}
          ${hasException ? '<span class="change-badge" style="background:#dc2626">⚠️ 有未处理异常</span>' : ''}
        </div>
        <div>
          ${statusTag(order.status)}
          <button class="btn btn-secondary btn-sm" style="margin-left:8px" onclick="openOrderDetail('${order.id}')">回看详情</button>
        </div>
      </div>
      <div class="order-card-body">
        ${summary?.hasAuditChange || summary?.exceptionCount ? `
          <div style="margin-bottom:12px;padding:10px;border-radius:6px;background:${summary?.hasOpenException ? '#fef2f2' : '#fffbeb'};border:1px solid ${summary?.hasOpenException ? '#fecaca' : '#fde68a'}">
            <div style="font-size:12px;font-weight:600;color:${summary?.hasOpenException ? '#991b1b' : '#92400e'};margin-bottom:4px">
              ${summary?.hasOpenException ? '⚠️ 变更追踪 - 有未处理异常' : '🔔 变更追踪 - 有复核变更记录'}
            </div>
            ${summary?.lastAuditChangeSummary ? `<div style="font-size:12px;color:#374151">📝 最近复核操作：${summary.lastAuditChangeSummary}</div>` : ''}
            ${summary?.diffSummary ? `<div style="font-size:12px;color:#374151;margin-top:2px">📦 当前数量差异：${summary.diffSummary}</div>` : ''}
            ${summary?.exceptionSummary ? `<div style="font-size:12px;color:#374151;margin-top:2px">⚠️ 异常：${summary.exceptionSummary}</div>` : ''}
            ${summary?.noticeStatusByRole ? `
              <div style="margin-top:6px;font-size:11px;color:#6b7280">
                通知状态：
                🏭 仓库主管 ${summary.noticeStatusByRole.warehouse_supervisor.unread > 0 ? `<span style="color:#dc2626;font-weight:600">${summary.noticeStatusByRole.warehouse_supervisor.unread}未读</span>` : '<span style="color:#059669">✓</span>'}
                ｜ 🚚 司机 ${summary.noticeStatusByRole.driver.unread > 0 ? `<span style="color:#dc2626;font-weight:600">${summary.noticeStatusByRole.driver.unread}未读</span>` : '<span style="color:#059669">✓</span>'}
                ｜ 💬 客服 ${summary.noticeStatusByRole.customer_service.unread > 0 ? `<span style="color:#dc2626;font-weight:600">${summary.noticeStatusByRole.customer_service.unread}未读</span>` : '<span style="color:#059669">✓</span>'}
              </div>
            ` : ''}
          </div>
        ` : ''}
        <div class="detail-grid">
          <div>
            <div class="detail-label">送货地址</div>
            <div class="detail-value">${order.address}</div>
          </div>
          <div>
            <div class="detail-label">联系人</div>
            <div class="detail-value">${order.contact} / ${order.phone}</div>
          </div>
          <div>
            <div class="detail-label">司机 / 车牌</div>
            <div class="detail-value">${la.driver || '<span style="color:#9ca3af">未分配</span>'} ${la.vehicle ? `/ ${la.vehicle}` : ''}</div>
          </div>
          <div>
            <div class="detail-label">预计送达</div>
            <div class="detail-value">${order.expectedDelivery}</div>
          </div>
        </div>
        <div style="margin-top:14px">
          <div class="detail-label" style="margin-bottom:6px">📦 装车清单
            ${audit?.actualItems?.some(i => i.diff !== 0) ?
              '<span style="color:#dc2626;font-size:12px;margin-left:6px">（含数量差异）</span>' : ''}
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th>物料</th>
                <th>单位</th>
                <th>计划</th>
                <th>实际</th>
                <th>差异</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              ${(audit?.actualItems || order.items).map(i => `
                <tr>
                  <td>${i.material}</td>
                  <td>${i.unit}</td>
                  <td>${i.plannedQty || i.qty}</td>
                  <td><strong>${i.actualQty !== undefined ? i.actualQty : i.qty}</strong></td>
                  <td>${i.diff !== undefined && i.diff !== 0 ?
                    `<span class="${i.diff < 0 ? 'diff-negative' : 'diff-positive'}">${i.diff > 0 ? '+' : ''}${i.diff}</span>` :
                    '<span style="color:#9ca3af">-</span>'}
                  </td>
                  <td style="font-size:12px;color:#6b7280">${i.reason || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${la.remark ? `<div style="margin-top:10px;padding:8px;background:#f0f9ff;border-radius:6px;font-size:12px;color:#1e40af">📝 ${la.remark}</div>` : ''}
      </div>
      <div class="order-card-footer">
        <div style="font-size:12px;color:#6b7280">
          ${la.arrangeTime ? `调度时间：${la.arrangeTime}` : '未安排'}
          ${summary?.lastAuditTime ? ` · 最后复核：${summary.lastAuditTime}` : ''}
        </div>
        <div class="btn-group">
          ${order.status === '待装车安排' && currentRole === 'warehouse_supervisor' ?
            `<button class="btn btn-primary btn-sm" onclick="openArrangeModal('${order.id}')">安排装车</button>` : ''}
          ${order.status === '装车中' && currentRole === 'driver' ?
            `<button class="btn btn-success btn-sm" onclick="completeLoading('${order.id}')">装车完成，出发配送</button>` : ''}
          ${order.status === '待装车安排' && currentRole === 'driver' ?
            `<button class="btn btn-primary btn-sm" onclick="startLoading('${order.id}')">开始装车</button>` : ''}
          ${order.status === '配送中' && currentRole === 'driver' ?
            `<button class="btn btn-success btn-sm" onclick="confirmDelivered('${order.id}')">确认送达签收</button>` : ''}
          ${currentRole === 'warehouse_supervisor' && order.status !== '配送中' ?
            `<button class="btn btn-secondary btn-sm" onclick="openArrangeModal('${order.id}')">修改安排</button>` : ''}
          ${summary?.hasOpenException || summary?.hasAuditChange ?
            `<button class="btn btn-warning btn-sm" onclick="openExceptionDrawer('${order.id}')">异常处理</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function hasOrderChanged(order) {
  if (!lastOrderStates[order.id]) {
    lastOrderStates[order.id] = JSON.stringify(order.pickingAudit);
    return false;
  }
  const prev = lastOrderStates[order.id];
  const curr = JSON.stringify(order.pickingAudit);
  return prev !== curr;
}

function markOrderChanged(orderId) {
  delete lastOrderStates[orderId];
}

async function openArrangeModal(orderId) {
  const order = await api(`/orders/${orderId}`);
  const la = order.loadingArrange || {};

  showModal(`装车安排 - ${order.id}`, `
    <div class="form-group">
      <label class="form-label">司机姓名</label>
      <input type="text" class="form-input" id="arrDriver" value="${la.driver || '刘师傅'}" placeholder="请输入司机姓名">
    </div>
    <div class="form-group">
      <label class="form-label">司机电话</label>
      <input type="text" class="form-input" id="arrPhone" value="${la.driverPhone || '13600136004'}" placeholder="请输入司机电话">
    </div>
    <div class="form-group">
      <label class="form-label">车牌号</label>
      <input type="text" class="form-input" id="arrVehicle" value="${la.vehicle || '皖A·B8888'}" placeholder="请输入车牌号">
    </div>
    <div class="form-group">
      <label class="form-label">配送备注</label>
      <textarea class="form-textarea" id="arrRemark" placeholder="配送路线、注意事项等...">${la.remark || ''}</textarea>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="hideModal()">取消</button>
    <button class="btn btn-primary" onclick="submitArrange('${orderId}')">确认安排</button>
  `);
}

async function submitArrange(orderId) {
  try {
    await api(`/orders/${orderId}/loading-arrange`, {
      method: 'PUT',
      body: JSON.stringify({
        arranger: '王调度',
        driver: document.getElementById('arrDriver').value,
        driverPhone: document.getElementById('arrPhone').value,
        vehicle: document.getElementById('arrVehicle').value,
        remark: document.getElementById('arrRemark').value
      })
    });
    hideModal();
    toast('装车安排已保存，司机已收到通知', 'success');
    refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function startLoading(orderId) {
  try {
    await api(`/orders/${orderId}/loading-start`, { method: 'POST', body: JSON.stringify({ operator: '刘师傅' }) });
    toast('已开始装车', 'info');
    refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function completeLoading(orderId) {
  if (!confirm('确认装车完成，开始配送？')) return;
  try {
    await api(`/orders/${orderId}/loading-complete`, { method: 'POST', body: JSON.stringify({ operator: '刘师傅' }) });
    toast('已出发配送，客服已收到通知', 'success');
    refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function confirmDelivered(orderId) {
  const order = ordersCache.find(o => o.id === orderId);
  showModal(`送达签收 - ${orderId}`, `
    <div class="form-group">
      <label class="form-label">签收人</label>
      <input type="text" class="form-input" id="signer" value="${order?.contact || ''}" placeholder="请输入签收人姓名">
    </div>
    <div class="form-group">
      <label class="form-label">签收备注</label>
      <textarea class="form-textarea" id="signRemark" placeholder="如有异常请备注..."></textarea>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="hideModal()">取消</button>
    <button class="btn btn-success" onclick="submitDelivered('${orderId}')">确认签收</button>
  `);
}

async function submitDelivered(orderId) {
  try {
    await api(`/orders/${orderId}/delivered`, {
      method: 'POST',
      body: JSON.stringify({
        operator: '刘师傅',
        signer: document.getElementById('signer').value,
        remark: document.getElementById('signRemark').value
      })
    });
    hideModal();
    toast('已完成签收，订单完成', 'success');
    refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function loadExceptionsView() {
  const exceptions = await api('/exceptions');
  const summaryList = await api('/orders-change-summary');
  const summaryMap = {};
  summaryList.forEach(s => summaryMap[s.orderId] = s);

  document.getElementById('view-exceptions').innerHTML = `
    <div class="section-title">⚠️ 异常处理中心 <span style="font-size:12px;font-weight:400;color:#6b7280;margin-left:8px">跨角色变更追踪</span></div>
    <div class="filter-bar">
      <label>状态：</label>
      <select id="exceptionFilter">
        <option value="">全部</option>
        <option value="待处理">待处理</option>
        <option value="已处理">已处理</option>
        <option value="已升级">已升级</option>
      </select>
      <label style="margin-left:12px">关联订单：</label>
      <select id="exceptionOrderFilter">
        <option value="">全部</option>
        <option value="loading">仅装车阶段订单</option>
        <option value="hasChange">有复核变更订单</option>
      </select>
      <button class="btn btn-danger btn-sm" onclick="triggerDemoException()">🎯 触发异常演示</button>
    </div>
    <div id="exceptionListContent">
      ${renderExceptionList(exceptions, summaryMap)}
    </div>
  `;

  function applyExceptionFilters() {
    const status = document.getElementById('exceptionFilter').value;
    const orderFilter = document.getElementById('exceptionOrderFilter').value;
    let list = exceptions;
    if (status) list = list.filter(ex => ex.status === status);
    if (orderFilter === 'loading') list = list.filter(ex => {
      const s = summaryMap[ex.orderId];
      return s && ['待装车安排', '装车中', '配送中'].includes(s.status);
    });
    if (orderFilter === 'hasChange') list = list.filter(ex => summaryMap[ex.orderId]?.hasAuditChange);
    document.getElementById('exceptionListContent').innerHTML = renderExceptionList(list, summaryMap);
  }

  document.getElementById('exceptionFilter').onchange = applyExceptionFilters;
  document.getElementById('exceptionOrderFilter').onchange = applyExceptionFilters;
}

function renderExceptionList(list, summaryMap) {
  if (!list.length) {
    return '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">暂无异常记录</div></div>';
  }
  return list.map(e => {
    const s = summaryMap ? summaryMap[e.orderId] : null;
    const isInLoading = s && ['待装车安排', '装车中', '配送中'].includes(s.status);
    const hasChange = s?.hasAuditChange || false;
    return `
    <div class="exception-item ${e.status === '已处理' ? 'handled' : ''}">
      <div class="exception-header">
        <span class="exception-type">
          ${e.status === '待处理' ? '⚠️' : e.status === '已升级' ? '🚨' : '✅'} ${e.type} - ${e.material}
        </span>
        <span class="exception-status ${e.status === '待处理' ? 'pending' : 'handled'}">${e.status}</span>
      </div>
      <div class="exception-meta">
        订单 <strong>${e.orderId}</strong> ${s ? `(${s.customer})` : ''} |
        计划 ${e.plannedQty} | 实际 ${e.actualQty} |
        差异 <strong class="diff-negative">${e.diff > 0 ? '+' : ''}${e.diff}</strong> |
        上报人：${e.reporter} | ${e.reportTime}
        ${hasChange ? '<span style="margin-left:8px;padding:2px 8px;background:#fef3c7;color:#92400e;border-radius:10px;font-size:11px">有复核变更</span>' : ''}
        ${isInLoading ? '<span style="margin-left:8px;padding:2px 8px;background:#dbeafe;color:#1e40af;border-radius:10px;font-size:11px">装车阶段</span>' : ''}
      </div>
      ${e.handleRemark ? `<div class="exception-remark">处理结果：${e.handleRemark} (${e.handler} @ ${e.handleTime})</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" onclick="openOrderDetail('${e.orderId}')">查看订单</button>
        ${isInLoading ? `
          <button class="btn btn-primary btn-sm" onclick="goToLoadingCard('${e.orderId}')">🚚 跳转装车卡片</button>
        ` : ''}
        ${e.status === '待处理' ? `
          <button class="btn btn-warning btn-sm" onclick="escalateException('${e.id}')">升级处理</button>
          <button class="btn btn-primary btn-sm" onclick="handleException('${e.id}')">处理异常</button>
        ` : ''}
      </div>
    </div>
  `}).join('');
}

async function escalateException(id) {
  try {
    await api(`/exceptions/${id}/escalate`, { method: 'POST' });
    toast('异常已升级，客服已收到提醒', 'warning');
    refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function handleException(id) {
  const exception = (await api('/exceptions')).find(e => e.id === id);
  if (!exception) return;

  showModal(`处理异常 - ${exception.orderId}`, `
    <div style="margin-bottom:14px">
      <strong>${exception.type}：</strong>${exception.material} (${exception.plannedQty} → ${exception.actualQty}, 差异 ${exception.diff > 0 ? '+' : ''}${exception.diff})
    </div>
    <div class="form-group">
      <label class="form-label">处理结果</label>
      <select class="form-select" id="exStatus">
        <option value="已处理">已处理 - 客户同意部分发货</option>
        <option value="已处理">已处理 - 等待补货后发</option>
        <option value="已处理">已处理 - 取消该物料</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">处理备注</label>
      <textarea class="form-textarea" id="exRemark" placeholder="请详细描述处理方式和客户沟通结果..."></textarea>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="hideModal()">取消</button>
    <button class="btn btn-primary" onclick="submitExceptionHandle('${id}')">提交处理</button>
  `);
}

async function submitExceptionHandle(id) {
  try {
    await api(`/exceptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: '已处理',
        handler: '客服小王',
        handleRemark: document.getElementById('exRemark').value
      })
    });
    hideModal();
    toast('异常已处理完成', 'success');
    refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function triggerDemoException() {
  showModal('🎯 异常演示触发', `
    <p style="margin-bottom:16px;color:#6b7280">选择要触发的异常类型，系统会自动生成对应的异常记录、通知和状态变更：</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-danger" style="justify-content:flex-start" onclick="doTriggerDemo('reject')">
        🚫 拣货复核驳回 &nbsp;<span style="font-weight:400;font-size:12px;color:#fecaca">订单状态变为"拣货复核驳回"，通知仓库主管和客服</span>
      </button>
      <button class="btn btn-warning" style="justify-content:flex-start" onclick="doTriggerDemo('shortage')">
        📦 库存短缺异常 &nbsp;<span style="font-weight:400;font-size:12px;color:#fde68a">生成库存短缺异常记录，通知多角色同步感知</span>
      </button>
    </div>
    <div style="margin-top:16px;padding:10px;background:#f0f9ff;border-radius:6px;font-size:12px;color:#1e40af">
      💡 提示：触发后请切换不同角色查看通知和状态变化，体验真实流程。
    </div>
  `, `
    <button class="btn btn-secondary" onclick="hideModal()">取消</button>
  `);
}

async function doTriggerDemo(type) {
  try {
    const res = await api('/demo/trigger-exception', {
      method: 'POST',
      body: JSON.stringify({ type })
    });
    hideModal();
    toast(res.message || '异常已触发', 'warning');
    markOrderChanged(res.orderId);
    refreshAll();

    if (type === 'shortage') {
      setTimeout(() => {
        switchRole('customer_service');
        setTimeout(() => {
          loadNotices().then(() => openDrawer('noticeDrawer'));
        }, 500);
      }, 500);
    }
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function openExceptionDrawer(orderId) {
  const order = await api(`/orders/${orderId}`);
  const exceptions = await api(`/exceptions?orderId=${orderId}`);

  document.getElementById('exceptionDrawerBody').innerHTML = `
    <div class="detail-section">
      <div class="detail-label">订单</div>
      <div class="detail-value">${order.id} - ${order.customer}</div>
    </div>
    <div class="detail-section">
      <div class="detail-label">当前状态</div>
      <div>${statusTag(order.status)}</div>
    </div>
    <div class="section-title" style="font-size:14px">异常记录</div>
    ${exceptions.length ? exceptions.map(e => `
      <div class="exception-item ${e.status === '已处理' ? 'handled' : ''}">
        <div class="exception-header">
          <span class="exception-type">${e.type} - ${e.material}</span>
          <span class="exception-status ${e.status === '待处理' ? 'pending' : 'handled'}">${e.status}</span>
        </div>
        <div class="exception-meta">
          计划 ${e.plannedQty} / 实际 ${e.actualQty} / 差异 ${e.diff > 0 ? '+' : ''}${e.diff}
        </div>
        ${e.handleRemark ? `<div class="exception-remark">${e.handleRemark} (${e.handler})</div>` : ''}
        ${e.status === '待处理' ? `
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-primary btn-sm" onclick="handleException('${e.id}');closeAllDrawers()">处理</button>
            <button class="btn btn-warning btn-sm" onclick="escalateException('${e.id}')">升级</button>
          </div>
        ` : ''}
      </div>
    `).join('') : '<div class="empty-state"><div class="empty-state-text" style="padding:20px;font-size:13px">该订单暂无异常记录</div></div>'}

    <div class="section-title" style="font-size:14px;margin-top:20px">操作日志</div>
    <div class="audit-timeline" id="exAuditLogs"></div>
  `;

  const logs = await api(`/orders/${orderId}/audit-logs`);
  document.getElementById('exAuditLogs').innerHTML = logs.map(l => `
    <div class="audit-item">
      <div class="audit-action">${l.action}</div>
      <div class="audit-meta">${l.operator} (${l.role === 'warehouse_supervisor' ? '仓库主管' : l.role === 'driver' ? '司机' : '客服'}) · ${l.time}</div>
      ${l.remark ? `<div class="audit-remark">${l.remark}</div>` : ''}
    </div>
  `).join('');

  openDrawer('exceptionDrawer');
}

async function loadLocations() {
  const locations = await api('/locations');
  document.getElementById('view-locations').innerHTML = `
    <div class="section-title">🗄️ 库位表</div>
    <div class="location-grid">
      ${locations.map(l => `
        <div class="location-card">
          <div class="location-code">${l.code}</div>
          <div class="location-material">${l.material}</div>
          <div style="font-size:12px;color:#6b7280">${l.name}</div>
          <div class="location-stock">
            <span>当前库存</span>
            <strong>${l.stock} ${l.unit}</strong>
          </div>
          <div class="location-stock" style="border:none;padding-top:4px">
            <span>容量</span>
            <span style="color:#6b7280">${l.capacity} ${l.unit}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function openOrderDetail(orderId) {
  const order = await api(`/orders/${orderId}`);
  const exceptions = await api(`/exceptions?orderId=${orderId}`);
  const summaryList = await api('/orders-change-summary');
  const summary = summaryList.find(s => s.orderId === orderId);

  document.getElementById('orderDetailTitle').textContent = `订单详情 - ${order.id}`;

  let summaryHtml = '';
  if (summary && (summary.hasAuditChange || summary.exceptionCount > 0)) {
    const bgColor = summary.hasOpenException ? '#fef2f2' : '#fffbeb';
    const borderColor = summary.hasOpenException ? '#fecaca' : '#fde68a';
    const titleColor = summary.hasOpenException ? '#991b1b' : '#92400e';

    let noticeByRoleHtml = '';
    if (summary.noticeStatusByRole) {
      const ns = summary.noticeStatusByRole;
      noticeByRoleHtml = `
        <div style="margin-top:8px;padding-top:8px;border-top:1px dashed ${borderColor}">
          <div style="font-size:12px;font-weight:500;color:#6b7280;margin-bottom:6px">📬 各角色通知状态</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px">
            <div style="padding:6px 8px;background:white;border-radius:4px;border:1px solid #e5e7eb">
              <div style="color:#6b7280">🏭 仓库主管</div>
              <div>${ns.warehouse_supervisor.unread > 0 ?
                `<span style="color:#dc2626;font-weight:600">${ns.warehouse_supervisor.unread} 条未读</span> / 共${ns.warehouse_supervisor.total}条` :
                `<span style="color:#059669">✅ 全部已读</span> / 共${ns.warehouse_supervisor.total}条`}</div>
            </div>
            <div style="padding:6px 8px;background:white;border-radius:4px;border:1px solid #e5e7eb">
              <div style="color:#6b7280">🚚 司机</div>
              <div>${ns.driver.unread > 0 ?
                `<span style="color:#dc2626;font-weight:600">${ns.driver.unread} 条未读</span> / 共${ns.driver.total}条` :
                `<span style="color:#059669">✅ 全部已读</span> / 共${ns.driver.total}条`}</div>
            </div>
            <div style="padding:6px 8px;background:white;border-radius:4px;border:1px solid #e5e7eb">
              <div style="color:#6b7280">💬 客服</div>
              <div>${ns.customer_service.unread > 0 ?
                `<span style="color:#dc2626;font-weight:600">${ns.customer_service.unread} 条未读</span> / 共${ns.customer_service.total}条` :
                `<span style="color:#059669">✅ 全部已读</span> / 共${ns.customer_service.total}条`}</div>
            </div>
          </div>
        </div>
      `;
    }

    summaryHtml = `
      <div style="margin-bottom:18px;padding:14px;border-radius:8px;background:${bgColor};border:1px solid ${borderColor}">
        <div style="font-size:14px;font-weight:600;color:${titleColor};margin-bottom:8px">
          ⚡ 跨角色变更追踪汇总
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <div>
            <span style="color:#6b7280">最近复核操作：</span>
            ${summary.lastAuditChangeSummary ? `<strong style="color:#1f2937">${summary.lastAuditChangeSummary}</strong>` : '<span style="color:#9ca3af">无复核记录</span>'}
          </div>
          <div>
            <span style="color:#6b7280">当前数量差异：</span>
            ${summary.diffSummary ? `<strong style="color:#1f2937">${summary.diffSummary}</strong>` : '<span style="color:#9ca3af">无差异</span>'}
          </div>
          <div>
            <span style="color:#6b7280">复核时间：</span>
            ${summary.lastAuditTime ? `<strong style="color:#1f2937">${summary.lastAuditTime}</strong>` : '<span style="color:#9ca3af">未复核</span>'}
          </div>
          <div>
            <span style="color:#6b7280">异常处理结论：</span>
            ${summary.exceptionSummary ? `<strong style="color:#1f2937">${summary.exceptionSummary}</strong>` : '<span style="color:#9ca3af">无异常</span>'}
          </div>
        </div>
        ${noticeByRoleHtml}
        ${summary.hasOpenException || summary.hasAuditChange ? `
          <div style="margin-top:10px;padding-top:10px;border-top:1px dashed ${borderColor};display:flex;gap:8px">
            <button class="btn btn-warning btn-sm" onclick="closeAllDrawers(); openExceptionDrawer('${orderId}')">查看异常</button>
            ${['待装车安排', '装车中', '配送中'].includes(order.status) ?
              `<button class="btn btn-primary btn-sm" onclick="closeAllDrawers(); goToLoadingCard('${orderId}')">跳转到装车卡片</button>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  document.getElementById('orderDetailBody').innerHTML = summaryHtml + `
    <div class="detail-grid">
      <div>
        <div class="detail-label">客户</div>
        <div class="detail-value">${order.customer}</div>
      </div>
      <div>
        <div class="detail-label">当前状态</div>
        <div>${statusTag(order.status)}</div>
      </div>
      <div>
        <div class="detail-label">送货地址</div>
        <div class="detail-value" style="font-size:13px">${order.address}</div>
      </div>
      <div>
        <div class="detail-label">联系人 / 电话</div>
        <div class="detail-value" style="font-size:13px">${order.contact} ${order.phone}</div>
      </div>
      <div>
        <div class="detail-label">预计送达</div>
        <div class="detail-value">${order.expectedDelivery}</div>
      </div>
      <div>
        <div class="detail-label">创建时间</div>
        <div class="detail-value" style="font-size:13px">${order.createdAt}</div>
      </div>
    </div>

    <div class="section-title" style="font-size:14px;margin-top:18px">📦 订单物料</div>
    <table class="items-table">
      <thead>
        <tr><th>物料</th><th>单位</th><th>订购数量</th><th>库位</th></tr>
      </thead>
      <tbody>
        ${order.items.map(i => `
          <tr><td>${i.material}</td><td>${i.unit}</td><td>${i.qty}</td><td>${i.locationCode}</td></tr>
        `).join('')}
      </tbody>
    </table>

    ${order.pickingAudit ? `
      <div class="section-title" style="font-size:14px;margin-top:18px">✅ 拣货复核记录</div>
      <div style="font-size:12px;color:#6b7280;margin-bottom:8px">
        复核人：${order.pickingAudit.auditor || '<span style="color:#9ca3af">未复核</span>'}
        ${order.pickingAudit.auditTime ? ` · 时间：${order.pickingAudit.auditTime}` : ''}
      </div>
      <table class="items-table">
        <thead>
          <tr><th>物料</th><th>计划</th><th>实际</th><th>差异</th><th>原因</th></tr>
        </thead>
        <tbody>
          ${order.pickingAudit.actualItems.map(i => `
            <tr>
              <td>${i.material}</td>
              <td>${i.plannedQty}</td>
              <td><strong>${i.actualQty}</strong></td>
              <td>${i.diff !== 0 ? `<span class="${i.diff < 0 ? 'diff-negative' : 'diff-positive'}">${i.diff > 0 ? '+' : ''}${i.diff}</span>` : '-'}</td>
              <td style="font-size:12px">${i.reason || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${order.pickingAudit.remark ? `<div style="margin-top:8px;padding:8px;background:#f0f9ff;border-radius:6px;font-size:12px">📝 ${order.pickingAudit.remark}</div>` : ''}
    ` : ''}

    ${order.loadingArrange ? `
      <div class="section-title" style="font-size:14px;margin-top:18px">🚚 装车安排</div>
      <div class="detail-grid">
        <div><div class="detail-label">调度</div><div class="detail-value">${order.loadingArrange.arranger || '-'}</div></div>
        <div><div class="detail-label">安排时间</div><div class="detail-value" style="font-size:13px">${order.loadingArrange.arrangeTime || '-'}</div></div>
        <div><div class="detail-label">司机</div><div class="detail-value">${order.loadingArrange.driver || '-'}</div></div>
        <div><div class="detail-label">车牌</div><div class="detail-value">${order.loadingArrange.vehicle || '-'}</div></div>
      </div>
      ${order.loadingArrange.remark ? `<div style="margin-top:8px;padding:8px;background:#f0f9ff;border-radius:6px;font-size:12px">📝 ${order.loadingArrange.remark}</div>` : ''}
    ` : ''}

    ${order.deliveryReceipt ? `
      <div class="section-title" style="font-size:14px;margin-top:18px">📨 送货回单</div>
      <div class="detail-grid">
        <div><div class="detail-label">签收人</div><div class="detail-value">${order.deliveryReceipt.signer}</div></div>
        <div><div class="detail-label">签收时间</div><div class="detail-value" style="font-size:13px">${order.deliveryReceipt.signTime}</div></div>
      </div>
      ${order.deliveryReceipt.remark ? `<div style="margin-top:8px;padding:8px;background:#f0f9ff;border-radius:6px;font-size:12px">📝 ${order.deliveryReceipt.remark}</div>` : ''}
    ` : ''}

    ${exceptions.length ? `
      <div class="section-title" style="font-size:14px;margin-top:18px">⚠️ 异常记录</div>
      ${exceptions.map(e => `
        <div class="exception-item ${e.status === '已处理' ? 'handled' : ''}">
          <div class="exception-header">
            <span class="exception-type">${e.type} - ${e.material}</span>
            <span class="exception-status ${e.status === '待处理' ? 'pending' : 'handled'}">${e.status}</span>
          </div>
          <div class="exception-meta">计划 ${e.plannedQty} / 实际 ${e.actualQty} / 差异 ${e.diff > 0 ? '+' : ''}${e.diff} · ${e.reporter}</div>
          ${e.handleRemark ? `<div class="exception-remark">${e.handleRemark} (${e.handler})</div>` : ''}
        </div>
      `).join('')}
    ` : ''}

    <div class="section-title" style="font-size:14px;margin-top:18px">📜 操作日志</div>
    <div class="audit-timeline">
      ${(order.auditLogs || []).map(l => `
        <div class="audit-item">
          <div class="audit-action">${l.action}</div>
          <div class="audit-meta">${l.operator} (${l.role === 'warehouse_supervisor' ? '仓库主管' : l.role === 'driver' ? '司机' : '客服'}) · ${l.time}</div>
          ${l.remark ? `<div class="audit-remark">${l.remark}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  openDrawer('orderDetailDrawer');
}

async function loadNotices() {
  const notices = await api(`/notices?role=${currentRole}`);
  const container = document.getElementById('noticeList');

  if (!notices.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无消息</div></div>';
    return;
  }

  container.innerHTML = notices.map(n => `
    <div class="notice-item ${n.read ? '' : 'unread'}" data-id="${n.id}" data-order="${n.orderId || ''}">
      <div class="notice-title">${n.title}</div>
      <div class="notice-content">${n.content}</div>
      <div class="notice-time">${n.time}</div>
    </div>
  `).join('');

  document.querySelectorAll('.notice-item').forEach(el => {
    el.onclick = async () => {
      const id = el.dataset.id;
      const orderId = el.dataset.order;
      if (id) {
        await api(`/notices/${id}/read`, { method: 'POST' });
      }
      closeAllDrawers();
      if (orderId) {
        openOrderDetail(orderId);
      }
      refreshBadge();
    };
  });
}

async function refreshBadge() {
  try {
    const data = await api('/dashboard');
    document.getElementById('noticeBadge').textContent = data.unreadCount || '';
  } catch (e) {}
}

function switchView(view, options = {}) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  renderView(view).then(() => {
    if (options.scrollToOrder) {
      setTimeout(() => {
        const el = document.getElementById(`loading-card-${options.scrollToOrder}`) ||
                   document.querySelector(`[data-order-id="${options.scrollToOrder}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-change');
          setTimeout(() => el.classList.remove('highlight-change'), 3000);
        }
      }, 100);
    }
  });
}

async function renderView(view) {
  switch (view) {
    case 'dashboard': await loadDashboard(); break;
    case 'orders': await loadOrders(); break;
    case 'picking': await loadPickingView(); break;
    case 'loading': await loadLoadingView(); break;
    case 'exceptions': await loadExceptionsView(); break;
    case 'locations': await loadLocations(); break;
  }
}

async function refreshAll() {
  try {
    const r = await api('/role');
    currentRole = r.role;
    renderRoleButtons();
    await renderView(currentView);
    await refreshBadge();
  } catch (e) {
    console.error('refresh failed', e);
  }
}

async function resetData() {
  if (!confirm('确定要重置所有演示数据吗？所有操作记录将被清空。')) return;
  try {
    await api('/reset', { method: 'POST' });
    lastOrderStates = {};
    toast('演示数据已重置', 'success');
    refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

function init() {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.onclick = () => switchView(n.dataset.view);
  });

  document.getElementById('noticeBtn').onclick = async () => {
    await loadNotices();
    openDrawer('noticeDrawer');
  };

  document.getElementById('closeNoticeDrawer').onclick = closeAllDrawers;
  document.getElementById('closeExceptionDrawer').onclick = closeAllDrawers;
  document.getElementById('closeOrderDetailDrawer').onclick = closeAllDrawers;
  document.getElementById('drawerOverlay').onclick = closeAllDrawers;
  document.getElementById('closeModal').onclick = hideModal;
  document.getElementById('modalOverlay').onclick = (e) => {
    if (e.target.id === 'modalOverlay') hideModal();
  };

  document.getElementById('resetBtn').onclick = resetData;

  document.getElementById('markAllReadBtn').onclick = async () => {
    await api('/notices/read-all', { method: 'POST', body: JSON.stringify({ role: currentRole }) });
    await loadNotices();
    refreshBadge();
    toast('已全部标为已读', 'info');
  };

  refreshAll();

  refreshTimer = setInterval(() => {
    if (!document.hidden) {
      refreshBadge();
      if (currentView === 'dashboard' || currentView === 'loading' || currentView === 'orders') {
        renderView(currentView);
      }
    }
  }, 10000);
}

document.addEventListener('DOMContentLoaded', init);
