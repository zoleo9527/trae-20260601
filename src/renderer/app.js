const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const STATUS_COLORS = {
  '待制作': 'status-pending',
  '制作中': 'status-preparing',
  '待派单': 'status-await-dispatch',
  '已派单': 'status-dispatched',
  '配送中': 'status-delivering',
  '已送达待签收': 'status-arrived',
  '已签收': 'status-signed',
  '退回': 'status-returned',
  '已关闭': 'status-closed',
  '待签收': 'status-await-sign',
  '补材料': 'status-supplement',
  '异常': 'status-error',
};

const EXC_COLORS = {
  '催': 'exc-urgent',
  '退回': 'exc-returned',
  '补材料': 'exc-supplement',
};

const EXC_STATUS_COLORS = {
  '未处理': 'exc-status-open',
  '处理中': 'exc-status-processing',
  '已解决': 'exc-status-resolved',
};

function badge(text, cls) {
  return `<span class="badge ${cls || ''}">${text}</span>`;
}

function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nowLocal() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

let allHandlers = [];

async function loadHandlers() {
  allHandlers = await window.api.getHandlers();
  populateHandlerSelects();
}

function populateHandlerSelects() {
  const florists = allHandlers.filter(h => h.role === '花艺师');
  const dispatchers = allHandlers.filter(h => h.role === '配送调度');
  const cs = allHandlers.filter(h => h.role === '售后客服');

  fillSelect('sel-new-florist', florists);
  fillSelect('filter-order-florist', [{ id: '', name: '全部' }, ...florists]);
  fillSelect('sel-dispatcher', dispatchers);
  fillSelect('filter-dispatch-dispatcher', [{ id: '', name: '全部' }, ...dispatchers]);
  fillSelect('sel-exc-handler', allHandlers);
}

function fillSelect(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(i => `<option value="${i.id}">${escHtml(i.name)}${i.role ? '(' + i.role + ')' : ''}</option>`).join('');
}

function showModal(id) {
  document.getElementById(id).classList.add('show');
}
function hideModal(id) {
  document.getElementById(id).classList.remove('show');
}
function hideAllModals() {
  $$('.modal.show').forEach(m => m.classList.remove('show'));
}

function showSlidePanel() {
  $('#order-detail-panel').classList.add('open');
  $('#overlay').classList.add('show');
}
function hideSlidePanel() {
  $('#order-detail-panel').classList.remove('open');
  $('#overlay').classList.remove('show');
}

function initTabs() {
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      $(`#panel-${tab}`).classList.add('active');
      if (tab === 'dashboard') loadDashboard();
      if (tab === 'orders') loadOrders();
      if (tab === 'dispatches') loadDispatches();
      if (tab === 'signatures') loadSignatures();
      if (tab === 'exceptions') loadExceptions();
    });
  });
}

async function loadDashboard() {
  const stats = await window.api.getDashboardStats();

  const orderMap = {};
  stats.orderStats.forEach(s => orderMap[s.status] = s.cnt);

  const urgentCount = stats.urgentOrders.length;
  $('#dash-urgent').textContent = urgentCount;
  $('#dash-urgent-sub').textContent = urgentCount > 0 ? `${urgentCount} 单正在催办` : '无催办';

  const pendingDispatch = orderMap['待派单'] || 0;
  $('#dash-pending-dispatch').textContent = pendingDispatch;
  $('#dash-pending-dispatch-sub').textContent = pendingDispatch > 0 ? '需要立即派单' : '—';

  const sigPending = (stats.signaturePending.find(s => s.status === '待签收') || {}).cnt || 0;
  $('#dash-pending-sign').textContent = sigPending;
  $('#dash-pending-sign-sub').textContent = sigPending > 0 ? '等待签收回传' : '—';

  const sigReturned = (stats.signaturePending.find(s => s.status === '退回') || {}).cnt || 0;
  $('#dash-returned').textContent = sigReturned;
  $('#dash-returned-sub').textContent = sigReturned > 0 ? '需要处理退回' : '—';

  const sigSupp = (stats.signaturePending.find(s => s.status === '补材料') || {}).cnt || 0;
  $('#dash-supplement').textContent = sigSupp;
  $('#dash-supplement-sub').textContent = sigSupp > 0 ? '需要补充材料' : '—';

  const total = Object.values(orderMap).reduce((a, b) => a + b, 0);
  $('#dash-total').textContent = total;

  const tbody = $('#dash-urgent-table tbody');
  tbody.innerHTML = stats.urgentOrders.map(o => `
    <tr>
      <td>${escHtml(o.order_no)}</td>
      <td>${escHtml(o.customer_name)}</td>
      <td>${escHtml(o.expected_delivery_time)}</td>
      <td>${badge(o.status, STATUS_COLORS[o.status] || '')}</td>
      <td><button class="btn btn-sm btn-primary" onclick="viewOrder(${o.id})">查看</button></td>
    </tr>
  `).join('');

  const stuckDiv = $('#dash-stuck-list');
  if (stats.dispatchStuck.length === 0) {
    stuckDiv.innerHTML = '<p class="empty-text">暂无卡点</p>';
  } else {
    stuckDiv.innerHTML = stats.dispatchStuck.map(s => `
      <div class="stuck-item">
        <span class="stuck-reason">${escHtml(s.stuck_reason || '未填写')}</span>
        <span class="stuck-cnt">${s.cnt} 单</span>
      </div>
    `).join('');
  }

  const sigDiv = $('#dash-sig-reasons');
  if (stats.signaturePending.length === 0) {
    sigDiv.innerHTML = '<p class="empty-text">签收回传均已完成</p>';
  } else {
    sigDiv.innerHTML = stats.signaturePending.map(s => `
      <div class="sig-reason-item">
        ${badge(s.status, STATUS_COLORS[s.status] || '')}
        <span class="sig-reason-cnt">${s.cnt} 单</span>
      </div>
    `).join('');
  }
}

async function loadOrders() {
  const filter = {};
  const status = $('#filter-order-status').value;
  const source = $('#filter-order-source').value;
  const florist = $('#filter-order-florist').value;
  const kw = $('#filter-order-kw').value.trim();
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (florist) filter.florist_id = parseInt(florist);
  if (kw) filter.keyword = kw;

  const orders = await window.api.getOrders(filter);
  const tbody = $('#order-table tbody');
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td class="td-order-no">${escHtml(o.order_no)}</td>
      <td>${escHtml(o.customer_name)}</td>
      <td>${escHtml(o.customer_phone)}</td>
      <td>${escHtml(o.flower_type)}</td>
      <td class="td-addr">${escHtml(o.delivery_address)}</td>
      <td>${escHtml(o.expected_delivery_time)}</td>
      <td>${escHtml(o.florist_name || '')}</td>
      <td>${escHtml(o.source)}</td>
      <td>${badge(o.status, STATUS_COLORS[o.status] || '')}</td>
      <td class="td-actions">
        <button class="btn btn-sm btn-secondary" onclick="viewOrder(${o.id})">详情</button>
        ${o.status === '待派单' || o.status === '制作中' ? `<button class="btn btn-sm btn-primary" onclick="openDispatchModal(${o.id}, '${escHtml(o.order_no)}')">派单</button>` : ''}
        <button class="btn btn-sm btn-warn" onclick="openExceptionModal(${o.id}, '${escHtml(o.order_no)}')">异常</button>
      </td>
    </tr>
  `).join('');
}

async function loadDispatches() {
  const filter = {};
  const status = $('#filter-dispatch-status').value;
  const dispatcher = $('#filter-dispatch-dispatcher').value;
  if (status) filter.status = status;
  if (dispatcher) filter.dispatcher_id = parseInt(dispatcher);

  const dispatches = await window.api.getDispatches(filter);
  const tbody = $('#dispatch-table tbody');
  tbody.innerHTML = dispatches.map(d => `
    <tr>
      <td class="td-order-no">${escHtml(d.order_no)}</td>
      <td>${escHtml(d.customer_name)}</td>
      <td>${escHtml(d.expected_delivery_time)}</td>
      <td>${escHtml(d.dispatcher_name || '')}</td>
      <td>${escHtml(d.courier_name)}</td>
      <td>${escHtml(d.courier_phone)}</td>
      <td>${escHtml(d.dispatch_time)}</td>
      <td class="td-stuck">${d.stuck_reason ? `<span class="stuck-tag">${escHtml(d.stuck_reason)}</span>` : ''}</td>
      <td>${badge(d.status, STATUS_COLORS[d.status] || '')}</td>
      <td class="td-actions">
        <button class="btn btn-sm btn-secondary" onclick="editDispatch(${d.id}, ${d.order_id})">编辑</button>
        ${d.status === '已送达待签收' ? `<button class="btn btn-sm btn-primary" onclick="openSignatureModal(${d.id}, '${escHtml(d.order_no)}')">签收</button>` : ''}
        ${d.status !== '已送达待签收' && d.status !== '退回' ? `<button class="btn btn-sm btn-primary" onclick="openSignatureModal(${d.id}, '${escHtml(d.order_no)}')">签收</button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function loadSignatures() {
  const filter = {};
  const status = $('#filter-sig-status').value;
  if (status) filter.status = status;

  const signatures = await window.api.getSignatures(filter);
  const tbody = $('#signature-table tbody');
  tbody.innerHTML = signatures.map(s => `
    <tr>
      <td class="td-order-no">${escHtml(s.order_no)}</td>
      <td>${escHtml(s.customer_name)}</td>
      <td>${escHtml(s.expected_delivery_time)}</td>
      <td>${escHtml(s.courier_name)}</td>
      <td>${escHtml(s.signed_by)}</td>
      <td>${escHtml(s.signed_at)}</td>
      <td>${badge(s.status, STATUS_COLORS[s.status] || '')}</td>
      <td>${escHtml(s.return_reason)}</td>
      <td>${escHtml(s.supplement_desc)}</td>
      <td class="td-actions">
        <button class="btn btn-sm btn-secondary" onclick="editSignature(${s.id}, ${s.dispatch_id}, '${escHtml(s.order_no)}')">编辑</button>
        <button class="btn btn-sm btn-info" onclick="viewSignatureHistory(${s.dispatch_id})">回看</button>
      </td>
    </tr>
  `).join('');
}

async function loadExceptions() {
  const filter = {};
  const type = $('#filter-exc-type').value;
  const status = $('#filter-exc-status').value;
  if (type) filter.type = type;
  if (status) filter.status = status;

  const exceptions = await window.api.getExceptions(filter);
  const tbody = $('#exception-table tbody');
  tbody.innerHTML = exceptions.map(e => `
    <tr>
      <td class="td-order-no">${escHtml(e.order_no)}</td>
      <td>${escHtml(e.customer_name)}</td>
      <td>${badge(e.type, EXC_COLORS[e.type] || '')}</td>
      <td class="td-desc">${escHtml(e.description)}</td>
      <td>${escHtml(e.handler_name || '')}</td>
      <td>${badge(e.status, EXC_STATUS_COLORS[e.status] || '')}</td>
      <td>${escHtml(e.created_at)}</td>
      <td>${escHtml(e.resolved_at)}</td>
      <td class="td-actions">
        ${e.status !== '已解决' ? `<button class="btn btn-sm btn-primary" onclick="editException(${e.id}, ${e.order_id}, '${escHtml(e.order_no)}')">处理</button>` : '<span class="text-muted">已解决</span>'}
      </td>
    </tr>
  `).join('');
}

window.viewOrder = async function(orderId) {
  const detail = await window.api.getOrderFullDetail(orderId);
  if (!detail) return;

  const o = detail.order;
  let html = `
    <div class="detail-section">
      <h3>订单信息</h3>
      <div class="detail-grid">
        <div><span class="detail-label">订单号</span><span>${escHtml(o.order_no)}</span></div>
        <div><span class="detail-label">客户</span><span>${escHtml(o.customer_name)}</span></div>
        <div><span class="detail-label">电话</span><span>${escHtml(o.customer_phone)}</span></div>
        <div><span class="detail-label">花型</span><span>${escHtml(o.flower_type)}</span></div>
        <div><span class="detail-label">风格</span><span>${escHtml(o.arrangement_style)}</span></div>
        <div><span class="detail-label">地址</span><span>${escHtml(o.delivery_address)}</span></div>
        <div><span class="detail-label">期望送达</span><span>${escHtml(o.expected_delivery_time)}</span></div>
        <div><span class="detail-label">花艺师</span><span>${escHtml(o.florist_name || '未分配')}</span></div>
        <div><span class="detail-label">来源</span><span>${escHtml(o.source)}</span></div>
        <div><span class="detail-label">状态</span><span>${badge(o.status, STATUS_COLORS[o.status])}</span></div>
        <div><span class="detail-label">备注</span><span>${escHtml(o.remarks)}</span></div>
      </div>
    </div>
  `;

  html += `<div class="detail-section"><h3>谁在处理</h3>`;
  const florist = o.florist_name ? `<div class="handler-tag"><span class="handler-role">花艺师</span>${escHtml(o.florist_name)}</div>` : '';
  const dispatchHandlers = detail.dispatches.map(d => `<div class="handler-tag"><span class="handler-role">配送调度</span>${escHtml(d.dispatcher_name || '未分配')}</div>`).join('');
  const excHandlers = detail.exceptions.filter(e => e.status !== '已解决').map(e => `<div class="handler-tag"><span class="handler-role">售后客服</span>${escHtml(e.handler_name || '未分配')}</div>`).join('');
  html += florist + dispatchHandlers + excHandlers || '<p class="empty-text">暂无处理人</p>';
  html += `</div>`;

  html += `<div class="detail-section"><h3>派单记录</h3>`;
  if (detail.dispatches.length === 0) {
    html += '<p class="empty-text">暂无派单记录</p>';
  } else {
    html += detail.dispatches.map(d => `
      <div class="timeline-item">
        <div class="timeline-time">${escHtml(d.dispatch_time || d.created_at)}</div>
        <div class="timeline-body">
          <div>${badge(d.status, STATUS_COLORS[d.status])} 调度: ${escHtml(d.dispatcher_name || '—')} 配送员: ${escHtml(d.courier_name || '—')}</div>
          ${d.stuck_reason ? `<div class="stuck-tag">卡点: ${escHtml(d.stuck_reason)}</div>` : ''}
          ${d.notes ? `<div class="text-muted">${escHtml(d.notes)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }
  html += `</div>`;

  html += `<div class="detail-section"><h3>签收回传</h3>`;
  if (detail.signatureFlow.length === 0) {
    html += '<p class="empty-text">暂无签收记录</p>';
  } else {
    detail.signatureFlow.forEach(sf => {
      html += `<div class="sig-flow-group"><div class="sig-flow-courier">配送员: ${escHtml(sf.dispatch.courier_name || '—')}</div>`;
      sf.signatures.forEach(s => {
        html += `
          <div class="timeline-item">
            <div class="timeline-time">${escHtml(s.signed_at || s.created_at)}</div>
            <div class="timeline-body">
              <div>${badge(s.status, STATUS_COLORS[s.status])} 签收人: ${escHtml(s.signed_by || '—')}</div>
              ${s.return_reason ? `<div class="return-reason">退回原因: ${escHtml(s.return_reason)}</div>` : ''}
              ${s.supplement_desc ? `<div class="supplement-desc">补材料: ${escHtml(s.supplement_desc)}</div>` : ''}
              ${s.remarks ? `<div class="text-muted">${escHtml(s.remarks)}</div>` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    });
  }
  html += `</div>`;

  html += `<div class="detail-section"><h3>异常记录</h3>`;
  if (detail.exceptions.length === 0) {
    html += '<p class="empty-text">暂无异常</p>';
  } else {
    html += detail.exceptions.map(e => `
      <div class="timeline-item">
        <div class="timeline-time">${escHtml(e.created_at)}</div>
        <div class="timeline-body">
          <div>${badge(e.type, EXC_COLORS[e.type])} ${badge(e.status, EXC_STATUS_COLORS[e.status])}</div>
          <div>${escHtml(e.description)}</div>
          <div class="text-muted">处理人: ${escHtml(e.handler_name || '—')}</div>
        </div>
      </div>
    `).join('');
  }
  html += `</div>`;

  html += `<div class="detail-section"><h3>交接日志</h3>`;
  if (detail.handovers.length === 0) {
    html += '<p class="empty-text">暂无交接记录</p>';
  } else {
    html += detail.handovers.map(h => `
      <div class="timeline-item">
        <div class="timeline-time">${escHtml(h.created_at)}</div>
        <div class="timeline-body">
          <div>${escHtml(h.from_handler_name || '—')} → ${escHtml(h.to_handler_name || '—')} (${escHtml(h.from_stage)} → ${escHtml(h.to_stage)})</div>
          ${h.notes ? `<div class="text-muted">${escHtml(h.notes)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }
  html += `</div>`;

  html += `
    <div class="detail-section detail-actions">
      <button class="btn btn-primary" onclick="openDispatchModal(${o.id}, '${escHtml(o.order_no)}')">派单</button>
      <button class="btn btn-warn" onclick="openExceptionModal(${o.id}, '${escHtml(o.order_no)}')">登记异常</button>
      ${o.status === '制作中' ? `<button class="btn btn-secondary" onclick="changeOrderStatus(${o.id}, '待派单')">完成制作</button>` : ''}
      ${o.status === '待制作' ? `<button class="btn btn-secondary" onclick="changeOrderStatus(${o.id}, '制作中')">开始制作</button>` : ''}
    </div>
  `;

  $('#order-detail-body').innerHTML = html;
  showSlidePanel();
};

window.changeOrderStatus = async function(orderId, newStatus) {
  await window.api.updateOrder(orderId, { status: newStatus });
  viewOrder(orderId);
  loadOrders();
  loadDashboard();
};

window.openDispatchModal = async function(orderId, orderNo) {
  const form = $('#form-dispatch');
  form.reset();
  form.order_id.value = orderId;
  form.dispatch_id.value = '';
  form.order_no_display.value = orderNo;
  form.dispatch_time.value = nowLocal();
  form.status.value = '已派单';

  const existingDispatches = await window.api.getDispatchesByOrder(orderId);
  if (existingDispatches.length > 0) {
    const latest = existingDispatches[0];
    form.dispatch_id.value = latest.id;
    form.dispatcher_id.value = latest.dispatcher_id || '';
    form.courier_name.value = latest.courier_name || '';
    form.courier_phone.value = latest.courier_phone || '';
    form.dispatch_time.value = latest.dispatch_time || nowLocal();
    form.status.value = latest.status;
    form.stuck_reason.value = latest.stuck_reason || '';
    form.notes.value = latest.notes || '';
  }

  showModal('modal-dispatch');
};

window.editDispatch = async function(dispatchId, orderId) {
  const dispatches = await window.api.getDispatchesByOrder(orderId);
  const d = dispatches.find(x => x.id === dispatchId);
  if (!d) return;

  const form = $('#form-dispatch');
  form.reset();
  form.order_id.value = orderId;
  form.dispatch_id.value = d.id;
  form.order_no_display.value = d.order_no || '';
  form.dispatcher_id.value = d.dispatcher_id || '';
  form.courier_name.value = d.courier_name || '';
  form.courier_phone.value = d.courier_phone || '';
  form.dispatch_time.value = d.dispatch_time || nowLocal();
  form.status.value = d.status;
  form.stuck_reason.value = d.stuck_reason || '';
  form.notes.value = d.notes || '';

  showModal('modal-dispatch');
};

window.openSignatureModal = function(dispatchId, orderNo) {
  const form = $('#form-signature');
  form.reset();
  form.dispatch_id.value = dispatchId;
  form.signature_id.value = '';
  form.order_no_display.value = orderNo;
  form.signed_at.value = nowLocal();
  form.status.value = '待签收';
  toggleSigFields('待签收');
  showModal('modal-signature');
};

window.editSignature = async function(sigId, dispatchId, orderNo) {
  const sigs = await window.api.getSignaturesByDispatch(dispatchId);
  const s = sigs.find(x => x.id === sigId);
  if (!s) return;

  const form = $('#form-signature');
  form.reset();
  form.dispatch_id.value = dispatchId;
  form.signature_id.value = s.id;
  form.order_no_display.value = orderNo;
  form.signed_by.value = s.signed_by || '';
  form.signed_at.value = s.signed_at || nowLocal();
  form.status.value = s.status;
  form.return_reason.value = s.return_reason || '';
  form.supplement_desc.value = s.supplement_desc || '';
  form.remarks.value = s.remarks || '';
  toggleSigFields(s.status);
  showModal('modal-signature');
};

window.viewSignatureHistory = async function(dispatchId) {
  const sigs = await window.api.getSignaturesByDispatch(dispatchId);
  if (sigs.length === 0) {
    alert('暂无签收回传记录');
    return;
  }

  let html = '<h3>签收回传记录</h3>';
  sigs.forEach(s => {
    html += `
      <div style="border-left:3px solid #4f46e5;padding:8px 12px;margin:8px 0;background:#f8f7ff;border-radius:4px;">
        <div>${badge(s.status, STATUS_COLORS[s.status])} 签收人: ${escHtml(s.signed_by || '—')} 时间: ${escHtml(s.signed_at || '—')}</div>
        ${s.return_reason ? `<div style="color:#dc2626;">退回原因: ${escHtml(s.return_reason)}</div>` : ''}
        ${s.supplement_desc ? `<div style="color:#d97706;">补材料: ${escHtml(s.supplement_desc)}</div>` : ''}
        ${s.remarks ? `<div style="color:#6b7280;">备注: ${escHtml(s.remarks)}</div>` : ''}
      </div>
    `;
  });

  const body = $('#order-detail-body');
  body.innerHTML = html;
  showSlidePanel();
};

window.openExceptionModal = function(orderId, orderNo) {
  const form = $('#form-exception');
  form.reset();
  form.order_id.value = orderId;
  form.exception_id.value = '';
  form.order_no_display.value = orderNo;
  form.status.value = '未处理';
  showModal('modal-exception');
};

window.editException = function(excId, orderId, orderNo) {
  const form = $('#form-exception');
  form.reset();
  form.order_id.value = orderId;
  form.exception_id.value = excId;
  form.order_no_display.value = orderNo;
  form.status.value = '处理中';
  showModal('modal-exception');
};

function toggleSigFields(status) {
  $('#sig-return-wrap').style.display = status === '退回' ? '' : 'none';
  $('#sig-supplement-wrap').style.display = status === '补材料' ? '' : 'none';
}

async function submitOrder() {
  const form = $('#form-new-order');
  const fd = new FormData(form);
  const o = {};
  fd.forEach((v, k) => o[k] = v);
  if (o.florist_id) o.florist_id = parseInt(o.florist_id);
  if (!o.order_no || !o.customer_name) {
    alert('订单号和客户姓名必填');
    return;
  }
  try {
    await window.api.createOrder(o);
    hideModal('modal-new-order');
    form.reset();
    loadOrders();
    loadDashboard();
  } catch (err) {
    alert('创建订单失败: ' + err.message);
  }
}

async function submitDispatch() {
  const form = $('#form-dispatch');
  const fd = new FormData(form);
  const d = {};
  fd.forEach((v, k) => d[k] = v);

  const orderId = parseInt(d.order_id);
  const dispatchId = d.dispatch_id ? parseInt(d.dispatch_id) : null;
  d.dispatcher_id = parseInt(d.dispatcher_id);
  d.order_id = orderId;

  try {
    if (dispatchId) {
      const { order_id, dispatch_id, order_no_display, ...fields } = d;
      await window.api.updateDispatch(dispatchId, fields);
      const orderStatusMap = {
        '待派单': '待派单',
        '已派单': '已派单',
        '配送中': '配送中',
        '已送达待签收': '已送达待签收',
        '退回': '退回',
        '异常': '退回',
      };
      await window.api.updateOrder(orderId, { status: orderStatusMap[d.status] || '已派单' });
    } else {
      delete d.dispatch_id;
      d.status = d.status || '已派单';
      await window.api.createDispatch(d);
      const orderStatusMap = {
        '待派单': '待派单',
        '已派单': '已派单',
        '配送中': '配送中',
        '已送达待签收': '已送达待签收',
        '退回': '退回',
        '异常': '退回',
      };
      await window.api.updateOrder(orderId, { status: orderStatusMap[d.status] || '已派单' });
    }

    if (d.status === '已派单' || d.status === '配送中') {
      const order = await window.api.getOrderById(orderId);
      const dispatchers = allHandlers.filter(h => h.role === '配送调度');
      const dispatcher = dispatchers.find(h => h.id === d.dispatcher_id);
      if (order && dispatcher) {
        const florists = allHandlers.filter(h => h.role === '花艺师');
        const florist = florists.find(h => h.id === order.florist_id);
        await window.api.createHandoverLog({
          order_id: orderId,
          from_handler_id: florist ? florist.id : null,
          to_handler_id: dispatcher.id,
          from_stage: '制作',
          to_stage: '配送',
          notes: `配送员: ${d.courier_name || '—'}`,
        });
      }
    }

    hideModal('modal-dispatch');
    loadDispatches();
    loadOrders();
    loadDashboard();
  } catch (err) {
    alert('派单操作失败: ' + err.message);
  }
}

async function submitSignature() {
  const form = $('#form-signature');
  const fd = new FormData(form);
  const s = {};
  fd.forEach((v, k) => s[k] = v);

  const dispatchId = parseInt(s.dispatch_id);
  const signatureId = s.signature_id ? parseInt(s.signature_id) : null;
  s.dispatch_id = dispatchId;

  try {
    if (signatureId) {
      const { dispatch_id, signature_id, order_no_display, ...fields } = s;
      await window.api.updateSignature(signatureId, fields);
    } else {
      delete s.signature_id;
      await window.api.createSignature(s);
    }

    if (s.status === '已签收') {
      const dispatch = (await window.api.getDispatches({})).find(d2 => d2.id === dispatchId);
      if (dispatch) {
        await window.api.updateOrder(dispatch.order_id, { status: '已签收' });
      }
    } else if (s.status === '退回') {
      const dispatch = (await window.api.getDispatches({})).find(d2 => d2.id === dispatchId);
      if (dispatch) {
        await window.api.updateOrder(dispatch.order_id, { status: '退回' });
      }
    }

    hideModal('modal-signature');
    loadSignatures();
    loadOrders();
    loadDashboard();
  } catch (err) {
    alert('签收操作失败: ' + err.message);
  }
}

async function submitException() {
  const form = $('#form-exception');
  const fd = new FormData(form);
  const e = {};
  fd.forEach((v, k) => e[k] = v);

  const orderId = parseInt(e.order_id);
  const exceptionId = e.exception_id ? parseInt(e.exception_id) : null;
  e.order_id = orderId;
  if (e.handler_id) e.handler_id = parseInt(e.handler_id);

  try {
    if (exceptionId) {
      const { order_id, exception_id, order_no_display, ...fields } = e;
      if (fields.status === '已解决') {
        fields.resolved_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      }
      await window.api.updateException(exceptionId, fields);
    } else {
      delete e.exception_id;
      await window.api.createException(e);
    }

    hideModal('modal-exception');
    loadExceptions();
    loadDashboard();
  } catch (err) {
    alert('异常登记失败: ' + err.message);
  }
}

function initModals() {
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) modal.classList.remove('show');
    });
  });

  $$('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });
  });

  $('#btn-new-order').addEventListener('click', () => {
    const form = $('#form-new-order');
    form.reset();
    showModal('modal-new-order');
    form.order_no.focus();
  });

  $('#btn-submit-order').addEventListener('click', submitOrder);
  $('#btn-submit-dispatch').addEventListener('click', submitDispatch);
  $('#btn-submit-signature').addEventListener('click', submitSignature);
  $('#btn-submit-exception').addEventListener('click', submitException);

  $('#sel-sig-status').addEventListener('change', (e) => {
    toggleSigFields(e.target.value);
  });

  $('#btn-close-detail').addEventListener('click', hideSlidePanel);
  $('#overlay').addEventListener('click', hideSlidePanel);
}

function initFilters() {
  $('#btn-filter-order').addEventListener('click', loadOrders);
  $('#btn-filter-dispatch').addEventListener('click', loadDispatches);
  $('#btn-filter-sig').addEventListener('click', loadSignatures);
  $('#btn-filter-exc').addEventListener('click', loadExceptions);

  $('#filter-order-status').addEventListener('change', loadOrders);
  $('#filter-order-source').addEventListener('change', loadOrders);
  $('#filter-order-florist').addEventListener('change', loadOrders);
  $('#filter-order-kw').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadOrders();
  });
  $('#filter-dispatch-status').addEventListener('change', loadDispatches);
  $('#filter-dispatch-dispatcher').addEventListener('change', loadDispatches);
  $('#filter-sig-status').addEventListener('change', loadSignatures);
  $('#filter-exc-type').addEventListener('change', loadExceptions);
  $('#filter-exc-status').addEventListener('change', loadExceptions);
}

function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      const form = $('#form-new-order');
      form.reset();
      showModal('modal-new-order');
      setTimeout(() => form.order_no.focus(), 100);
    }
    if (e.key === 'Escape') {
      hideAllModals();
      hideSlidePanel();
    }
  });
}

async function init() {
  await loadHandlers();
  initTabs();
  initModals();
  initFilters();
  initKeyboard();
  loadDashboard();
}

document.addEventListener('DOMContentLoaded', init);
