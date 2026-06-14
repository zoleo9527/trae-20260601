const STATUS_TEXT = {
  draft: '草稿', submitted: '已提交待审', approved: '已完成', rejected: '已驳回',
  pending_cash: '待现金核对', pending: '待盘点', counting: '盘点中',
  matched: '账实相符', mismatched: '账实不符', escalated: '已升级片区', resolved: '已解决'
};
const SHIFT_TEXT = { morning: '早班', afternoon: '下午班', night: '夜班' };
const ROLE_TEXT = { clerk: '店员', store_manager: '店长', area_manager: '片区管理员' };
const TYPE_TEXT = { redeem_register: '兑奖登记单', fault_ticket: '设备故障单', bank_slip: '银行回执', receipt: '收据', other: '其他' };
const NOTIF_TYPE_TEXT = { approval: '审批', review: '待处理', escalation: '升级', mismatch: '差异', overdue: '超期' };
const MATERIAL_ICON = { redeem_register: '🎟️', fault_ticket: '🛠️', bank_slip: '🏦', receipt: '🧾', other: '📄' };

let currentUser = { id: 3, name: '张店长', role: 'store_manager', store_id: 1, area_id: 1 };
let currentPage = 'dashboard';
let pageCache = {};

function fmtMoney(v) {
  if (v === null || v === undefined) return '—';
  return '¥' + Number(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function fmtTime(t) {
  const d = new Date(t);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function diffClass(d) {
  if (d === null || d === undefined) return '';
  if (d < 0) return 'diff-neg';
  if (d > 0) return 'diff-pos';
  return 'diff-zero';
}
function diffText(d) {
  if (d === null || d === undefined) return '—';
  const prefix = d > 0 ? '+' : '';
  return prefix + fmtMoney(d);
}
function getHeaders() { return { 'X-User-ID': currentUser.id, 'Content-Type': 'application/json' }; }

async function api(url, method='GET', body) {
  try {
    const opts = { method, headers: getHeaders() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('/api' + url, opts);
    const data = await res.json();
    return data;
  } catch(e) {
    console.error('API error:', url, e);
    return { code: -1, message: '网络请求失败: ' + e.message, data: null };
  }
}

function errorPage(msg) {
  return `<div class="alert alert-danger" style="margin:24px;"><span class="alert-icon">⚠️</span><div><b>加载失败</b><br>${msg||'未知错误'}<br><button class="btn btn-primary" style="margin-top:10px;" onclick="loadPage(currentPage)">重试</button></div></div>`;
}

async function init() {
  try {
    const r = await api('/users');
    if (r.code !== 0) { document.getElementById('pageContent').innerHTML = errorPage(r.message); return; }
    const users = r.data || [];
    const sel = document.getElementById('roleSelect');
    sel.innerHTML = users.map(u => {
      const store = u.store_id ? (u.store_id===1?'朝阳店':u.store_id===2?'中关村店':'金融街店') : '片区';
      return `<option value="${u.id}">${u.name} · ${ROLE_TEXT[u.role]} · ${store}</option>`;
    }).join('');
    sel.value = currentUser.id;
    updateUserInfo();
    updateUnreadCount();
    loadPage('dashboard');
  } catch(e) {
    console.error('init error:', e);
    document.getElementById('pageContent').innerHTML = errorPage('初始化失败: ' + e.message);
  }
}

async function updateUnreadCount() {
  const r = await api('/notifications/unread');
  const cnt = r.data?.count || 0;
  const badge = document.getElementById('unreadBadge');
  if (cnt > 0) { badge.style.display = 'flex'; badge.textContent = cnt; }
  else badge.style.display = 'none';
}

function updateUserInfo() {
  document.getElementById('userName').textContent = currentUser.name;
  const store = currentUser.store_id ? (currentUser.store_id===1?'朝阳路旗舰店':currentUser.store_id===2?'海淀中关村店':'西城金融街店') : '全片区';
  document.getElementById('userRole').textContent = ROLE_TEXT[currentUser.role] + ' · ' + store;
  document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);
}

async function switchUser(id) {
  try {
    const r = await api('/users');
    const u = (r.data || []).find(x => x.id == id);
    if (u) {
      currentUser = u;
      updateUserInfo();
      updateUnreadCount();
      pageCache = {};
      loadPage(currentPage);
    }
  } catch(e) { console.error('switchUser error:', e); }
}

function navTo(page) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  loadPage(page);
}

async function loadPage(page) {
  currentPage = page;
  const pc = document.getElementById('pageContent');
  try {
    if (page === 'dashboard') pc.innerHTML = await renderDashboard();
    else if (page === 'shifts') pc.innerHTML = await renderShifts();
    else if (page === 'cash') pc.innerHTML = await renderCash();
    else if (page === 'notifications') pc.innerHTML = await renderNotifications();
    else if (page === 'logs') pc.innerHTML = await renderLogs();
    else pc.innerHTML = errorPage('未知页面');
  } catch(e) {
    console.error('loadPage error:', page, e);
    pc.innerHTML = errorPage('页面加载异常: ' + e.message);
  }
  document.getElementById('notifPanel').style.display = 'none';
  window.scrollTo(0, 0);
}

// ===== Dashboard (role-based workspace) =====
async function renderDashboard() {
  const [shifts, cashs, notifs, logs] = await Promise.all([
    api('/shifts?view=pending'),
    api('/cash?view=pending'),
    api('/notifications?unread=1'),
    api('/logs')
  ]);
  if (shifts.code !== 0 || cashs.code !== 0) {
    return errorPage('仪表盘数据加载失败: ' + (shifts.message || cashs.message));
  }
  const ss = shifts.data || [];
  const cs = cashs.data || [];
  const unread = notifs.data || [];
  const recentLogs = (logs.data || []).slice(0, 8);

  const shiftBadge = document.getElementById('shiftBadge');
  const shiftPending = ss.length;
  if (shiftPending > 0) { shiftBadge.style.display = 'block'; shiftBadge.textContent = shiftPending; }
  else shiftBadge.style.display = 'none';
  const cashBadge = document.getElementById('cashBadge');
  const cashPending = cs.length;
  if (cashPending > 0) { cashBadge.style.display = 'block'; cashBadge.textContent = cashPending; }
  else cashBadge.style.display = 'none';

  const g = roleGreeting();
  let statsHtml = '';
  if (currentUser.role === 'clerk') {
    const draft = ss.filter(s => s.status === 'draft').length;
    const rejected = ss.filter(s => s.status === 'rejected').length;
    const myCash = cs.filter(c => ['pending','counting','mismatched','escalated'].includes(c.status)).length;
    statsHtml = `
      <div class="stat-card purple"><div class="stat-label">我的班结</div><div class="stat-value">${ss.length}</div><div class="stat-desc">全部历史班结</div></div>
      <div class="stat-card orange"><div class="stat-label">待我处理</div><div class="stat-value">${draft + rejected}</div><div class="stat-desc">草稿 / 被驳回重提</div></div>
      <div class="stat-card blue"><div class="stat-label">现金核对中</div><div class="stat-value">${myCash}</div><div class="stat-desc">我的班结正在核现金</div></div>
      <div class="stat-card green"><div class="stat-label">已完成</div><div class="stat-value">0</div><div class="stat-desc">闭环班结+现金全通过</div></div>`;
  } else if (currentUser.role === 'store_manager') {
    const pendingApproval = ss.filter(s => s.status === 'submitted').length;
    const pendingCash = cs.filter(c => ['pending','counting'].includes(c.status)).length;
    const mismatch = cs.filter(c => c.status === 'mismatched').length;
    const matched = cs.filter(c => c.status === 'matched').length;
    statsHtml = `
      <div class="stat-card orange"><div class="stat-label">待我审核班结</div><div class="stat-value">${pendingApproval}</div><div class="stat-desc">店员提交待审核</div></div>
      <div class="stat-card blue"><div class="stat-label">待现金盘点</div><div class="stat-value">${pendingCash}</div><div class="stat-desc">审核通过待盘点</div></div>
      <div class="stat-card red"><div class="stat-label">账实不符</div><div class="stat-value">${mismatch}</div><div class="stat-desc">差异待处理</div></div>
      <div class="stat-card green"><div class="stat-label">已核对完成</div><div class="stat-value">${matched}</div><div class="stat-desc">本月账实相符</div></div>`;
  } else {
    const escalated = cs.filter(c => c.status === 'escalated').length;
    const mismatchedAll = cs.filter(c => c.status === 'mismatched').length;
    const allShifts = ss.length;
    const approved = ss.filter(s => s.status === 'approved').length;
    statsHtml = `
      <div class="stat-card red"><div class="stat-label">待我裁定</div><div class="stat-value">${escalated}</div><div class="stat-desc">升级至片区的差异</div></div>
      <div class="stat-card orange"><div class="stat-label">门店差异关注</div><div class="stat-value">${mismatchedAll + ss.filter(s => s.status === 'submitted').length}</div><div class="stat-desc">未解决差异+未审核班结</div></div>
      <div class="stat-card blue"><div class="stat-label">在途班结</div><div class="stat-value">${allShifts}</div><div class="stat-desc">全片区班结总数</div></div>
      <div class="stat-card green"><div class="stat-label">已完成闭环</div><div class="stat-value">${approved}</div><div class="stat-desc">班结+现金全通过</div></div>`;
  }

  return `
    <div class="page-header">
      <div>
        <div class="page-title">👋 ${g.greet}，${g.name}
          <span class="type-badge role-${currentUser.role}" style="font-size:12px;margin-left:8px;vertical-align:middle;">${g.roleLabel} · ${g.store}</span>
        </div>
        <div class="page-subtitle">这是您的工作台，处理您职责范围内的待办事项与关注项</div>
      </div>
    </div>

    <div class="stats-grid">${statsHtml}</div>

    <div class="detail-grid">
      <div>
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header">
            <div class="card-title">⏰ 我的待办（按责任到人）</div>
            <button class="btn btn-sm btn-primary" onclick="navTo('${currentUser.role==='clerk'?'shifts':'cash'}')">去处理 →</button>
          </div>
          <div class="card-body" style="padding:0;">
            ${renderTodoList(ss, cs)}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">👀 我关注的未闭环项</div></div>
          <div class="card-body" style="padding:0;">
            ${renderOpenIssues(ss, cs)}
          </div>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header">
            <div class="card-title">🔔 未读通知</div>
            <button class="btn btn-sm btn-outline" onclick="navTo('notifications')">全部</button>
          </div>
          <div class="notif-list" style="max-height:240px;">
            ${unreadNotifs(unread)}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">📜 最近动态</div></div>
          <div class="card-body">
            <div class="timeline" style="max-height:320px;">
              ${recentLogs.length ? recentLogs.map(l => renderTimelineItem(l)).join('') : '<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">📜</div></div>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function roleGreeting() {
  const name = currentUser.name;
  const store = currentUser.store_id ? (currentUser.store_id===1?'朝阳路旗舰店':currentUser.store_id===2?'海淀中关村店':'西城金融街店') : '全片区';
  const roleLabel = ROLE_TEXT[currentUser.role];
  const hour = new Date().getHours();
  const greet = hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
  return { name, store, roleLabel, greet };
}

function renderTodoList(ss, cs) {
  const items = [];
  if (currentUser.role === 'clerk') {
    ss.filter(s => s.status === 'draft').forEach(s =>
      items.push({ tag:'待提交', level:'warn', title:`${s.shift_no} 还在草稿中`, desc:'', action:`viewShift(${s.id})` }));
    ss.filter(s => s.status === 'rejected').forEach(s =>
      items.push({ tag:'被驳回', level:'danger', title:`${s.shift_no} 被驳回需重提`, desc: s.reject_reason||'', action:`viewShift(${s.id})` }));
    cs.filter(c => ['pending','counting'].includes(c.status)).forEach(c =>
      items.push({ tag:'现金核对中', level:'info', title:`CV${String(c.id).padStart(4,'0')} 现金${STATUS_TEXT[c.status]}`, desc:c.difference!==null&&c.difference!==undefined?`差异 ${diffText(c.difference)}`:'', action:`viewCash(${c.id})` }));
  } else if (currentUser.role === 'store_manager') {
    ss.filter(s => s.status === 'submitted').forEach(s => {
      const diff = (s.cash_actual !== null && s.cash_actual !== undefined) ? (s.cash_actual - s.cash_expected) : 0;
      items.push({ tag:'待审核', level:'warn', title:`${s.shift_no} 待审核 · ${s.clerk_name||''}`,
        desc: diff !== 0 ? `现金自报${diffText(diff)}，需重点关注` : '请尽快审核',
        action:`viewShift(${s.id})` });
    });
    cs.filter(c => c.status === 'pending').forEach(c =>
      items.push({ tag:'待盘点', level:'warn', title:`CV${String(c.id).padStart(4,'0')} 待现金盘点`, desc:`申报${fmtMoney(c.cash_declared)}`, action:`viewCash(${c.id})` }));
    cs.filter(c => c.status === 'counting').forEach(c =>
      items.push({ tag:'盘点中', level:'info', title:`CV${String(c.id).padStart(4,'0')} 正在盘点`, desc:'', action:`viewCash(${c.id})` }));
    cs.filter(c => c.status === 'mismatched').forEach(c =>
      items.push({ tag:'差异', level:'danger', title:`CV${String(c.id).padStart(4,'0')} 账实不符 ${diffText(c.difference)}`, desc:c.notes||'请尽快处理或升级', action:`viewCash(${c.id})` }));
  } else {
    cs.filter(c => c.status === 'escalated').forEach(c =>
      items.push({ tag:'待裁定', level:'danger', title:`${c.store_name||''} 现金差异${diffText(c.difference)}`, desc:c.notes||'店长与店员无法达成一致', action:`viewCash(${c.id})` }));
    ss.filter(s => s.status === 'submitted').forEach(s =>
      items.push({ tag:'待关注', level:'warn', title:`${s.store_name||''} ${s.shift_no} 长时间未审核`, desc:`${s.clerk_name||''} 提交于${fmtTime(s.created_at).slice(5)}`, action:`viewShift(${s.id})` }));
    cs.filter(c => c.status === 'mismatched').forEach(c =>
      items.push({ tag:'差异待处理', level:'warn', title:`${c.store_name||''} 差异${diffText(c.difference)} 门店处理中`, desc:'门店店长处理中，关注进展', action:`viewCash(${c.id})` }));
  }
  if (!items.length) return `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">太棒了，当前没有待办！</div></div>`;
  return items.slice(0, 8).map(it => `
    <div style="padding:12px 20px;border-bottom:1px solid #f3f4f6;display:flex;gap:12px;align-items:flex-start;cursor:pointer;" onclick="${it.action}">
      <span class="tag ${it.level==='danger'?'tag-danger':'tag-warning'}">${it.tag}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:500;font-size:13px;color:#111827;">${it.title}</div>
        ${it.desc ? `<div style="font-size:12px;color:#6b7280;margin-top:3px;line-height:1.5;">${it.desc}</div>` : ''}
      </div>
      <span style="color:#6d28d9;font-size:12px;flex-shrink:0;">查看 →</span>
    </div>
  `).join('');
}

function renderOpenIssues(ss, cs) {
  const issues = [];
  ss.filter(s => s.status === 'rejected').forEach(s =>
    issues.push({ icon:'❌', title:`${s.shift_no} 被驳回`, desc:`${s.clerk_name||'店员'}提交的班结被店长驳回`,
      tag:'班结驳回', action:`viewShift(${s.id})` }));
  ss.filter(s => s.status === 'submitted' && s.cash_actual !== null && s.cash_actual !== undefined && s.cash_actual !== s.cash_expected).forEach(s =>
    issues.push({ icon:'⚠️', title:`${s.shift_no} 现金申报差异${diffText((s.cash_actual||0) - s.cash_expected)}`,
      desc:'店员自报与系统应收有差异，待核实',
      tag:'现金差异预警', action:`viewShift(${s.id})` }));
  cs.filter(c => c.status === 'escalated').forEach(c =>
    issues.push({ icon:'🚨', title:`${c.store_name||''} 现金${diffText(c.difference)} 已升级`,
      desc:c.notes||'店长与店员无法达成一致，片区介入',
      tag:'升级待裁定', action:`viewCash(${c.id})` }));
  cs.filter(c => c.status === 'mismatched').forEach(c =>
    issues.push({ icon:'💸', title:`${c.store_name||''} 现金${diffText(c.difference)} 不符`,
      desc:c.material_notes||'差异原因待说明',
      tag:'差异处理中', action:`viewCash(${c.id})` }));
  cs.filter(c => c.status === 'pending').forEach(c =>
    issues.push({ icon:'💰', title:`${c.store_name||''} CV${String(c.id).padStart(4,'0')} 待盘点`,
      desc:`申报${fmtMoney(c.cash_declared)}`,
      tag:'待盘点', action:`viewCash(${c.id})` }));
  ss.filter(s => s.status === 'submitted' && (s.cash_actual === null || s.cash_actual === undefined || s.cash_actual === s.cash_expected)).forEach(s =>
    issues.push({ icon:'⏳', title:`${s.shift_no} 待店长审核`,
      desc:`${s.clerk_name||''}提交，销售${fmtMoney(s.total_sales)}`,
      tag:'待审核', action:`viewShift(${s.id})` }));

  if (!issues.length) return `<div class="empty-state"><div class="empty-icon">🎉</div><div class="empty-text">全部闭环，没问题！</div></div>`;
  return issues.slice(0, 6).map(i => `
    <div style="padding:12px 20px;border-bottom:1px solid #f3f4f6;display:flex;gap:12px;align-items:flex-start;">
      <div style="font-size:18px;flex-shrink:0;">${i.icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span class="tag tag-warning">${i.tag}</span>
          <a class="link-btn" style="font-size:13px;font-weight:500;" onclick="${i.action}">${i.title}</a>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;line-height:1.5;">${i.desc}</div>
      </div>
    </div>
  `).join('');
}

function unreadNotifs(list) {
  if (!list.length) return '<div class="empty-state" style="padding:30px 0;"><div class="empty-icon">✉️</div><div class="empty-text">暂无未读通知</div></div>';
  return list.slice(0, 6).map(n => renderNotifItem(n, true)).join('');
}

// ===== Shifts =====
async function renderShifts() {
  const status = pageCache.shiftStatus || '';
  let url = '/shifts';
  if (status) url += '?status=' + status;
  const r = await api(url);
  const list = r.data || [];

  const pageTitle = currentUser.role === 'clerk' ? '我的班结' : '销售班结';
  const subtitle = currentUser.role === 'clerk'
    ? '您创建的所有班结：草稿→提交→店长审核→现金核对'
    : (currentUser.role === 'store_manager' ? '本店全部销售班结（仅本店范围内审核）' : '全片区班结总览（关注异常项）');

  const showClerkCol = currentUser.role !== 'clerk';
  const showStoreCol = currentUser.role === 'area_manager';

  return `
    <div class="page-header">
      <div>
        <div class="page-title">📝 ${pageTitle}</div>
        <div class="page-subtitle">${subtitle}</div>
      </div>
      ${currentUser.role === 'clerk' ? `<button class="btn btn-primary" onclick="openShiftCreate()">+ 新建班结</button>` : ''}
    </div>

    <div class="card">
      <div class="card-body">
        <div class="filter-bar">
          <select onchange="filterShift('status', this.value)">
            <option value="">全部状态</option>
            <option value="draft" ${status==='draft'?'selected':''}>草稿</option>
            <option value="submitted" ${status==='submitted'?'selected':''}>已提交待审</option>
            <option value="rejected" ${status==='rejected'?'selected':''}>已驳回</option>
            <option value="pending_cash" ${status==='pending_cash'?'selected':''}>待现金核对</option>
            <option value="approved" ${status==='approved'?'selected':''}>已完成</option>
          </select>
          <span style="font-size:12px;color:#6b7280;margin-left:auto;">
            共 <b style="color:#111827;">${list.length}</b> 条 · 
            ${currentUser.role==='clerk'?'我的':(currentUser.role==='store_manager'?'本店':'片区')}
          </span>
        </div>

        <table>
          <thead><tr>
            <th>班结编号</th>
            ${showClerkCol ? '<th>店员</th>' : ''}
            ${showStoreCol ? '<th>门店</th>' : ''}
            <th>班次</th>
            <th>日期</th>
            <th style="text-align:right;">销售总额</th>
            <th style="text-align:right;">应收现金</th>
            <th>责任链</th>
            <th>状态</th>
            <th>操作</th>
          </tr></thead>
          <tbody>
            ${list.length ? list.map(s => {
              const owner = s.clerk_name || '-';
              return `<tr>
                <td><a class="link-btn" onclick="viewShift(${s.id})"><b>${s.shift_no}</b></a></td>
                ${showClerkCol ? `<td><span class="type-badge role-clerk">${s.clerk_name||'-'}</span></td>` : ''}
                ${showStoreCol ? `<td>${s.store_name||'-'}</td>` : ''}
                <td><span class="type-badge shift-${s.shift_type}">${SHIFT_TEXT[s.shift_type]}</span></td>
                <td>${s.shift_date ? s.shift_date.slice(0,10) : '-'}</td>
                <td style="text-align:right;" class="info-value money">${fmtMoney(s.total_sales)}</td>
                <td style="text-align:right;" class="info-value money">${fmtMoney(s.cash_expected)}</td>
                <td><span class="type-badge role-clerk">${owner}</span>
                  ${s.approved_by_name ? ` <span class="type-badge role-store_manager" style="margin-left:4px;">${s.approved_by_name}</span>` : ''}
                </td>
                <td><span class="status-badge status-${s.status}">${STATUS_TEXT[s.status]}</span></td>
                <td><button class="btn btn-sm btn-outline" onclick="viewShift(${s.id})">详情</button></td>
              </tr>`;
            }).join('') : `<tr><td colspan="${showClerkCol?(showStoreCol?9:8):(showStoreCol?8:7)}"><div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">暂无数据</div></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function filterShift(key, val) {
  pageCache['shift' + key.charAt(0).toUpperCase() + key.slice(1)] = val;
  loadPage('shifts');
}

async function viewShift(id) {
  try {
    const [shift, logs] = await Promise.all([
      api('/shifts/' + id),
      api(`/logs?ref_type=shift_settlement&ref_id=${id}`)
    ]);
    const s = shift.data;
    if (!s) { alert('未找到或无权查看'); navTo('shifts'); return; }

  const isClerk = currentUser.role === 'clerk' && currentUser.id === s.clerk_id;
  const isMgr = currentUser.role === 'store_manager' && currentUser.store_id === s.store_id;
  const isArea = currentUser.role === 'area_manager';

  document.getElementById('pageContent').innerHTML = `
    <a class="back-link" onclick="navTo('shifts')">← 返回班结列表</a>

    <div class="page-header">
      <div>
        <div class="page-title">${s.shift_no}
          <span class="status-badge status-${s.status}" style="font-size:12px;margin-left:8px;">${STATUS_TEXT[s.status]}</span>
        </div>
        <div class="page-subtitle">
          ${s.store_name||''} · ${SHIFT_TEXT[s.shift_type]} · ${(s.shift_date||'').slice(0,10)}
        </div>
      </div>
      <div class="action-bar">
        ${isClerk && s.status === 'draft' ? `<button class="btn btn-warning" onclick="shiftAction(${s.id},'submit')">提交审核</button>` : ''}
        ${isClerk && s.status === 'rejected' ? `<button class="btn btn-primary" onclick="shiftAction(${s.id},'submit')">重新提交</button>
          <button class="btn btn-outline" onclick="openCashUpdate(${s.id})">修改申报现金</button>` : ''}
        ${isMgr && s.status === 'submitted' ? `<button class="btn btn-success" onclick="shiftAction(${s.id},'approve')">审核通过 → 转现金核对</button>
          <button class="btn btn-danger" onclick="openShiftReject(${s.id})">驳回</button>` : ''}
        ${(isMgr||isArea) && s.status === 'pending_cash' ? `<button class="btn btn-success" onclick="gotoCashByShift('${s.shift_no}',${s.id})">去做现金核对 →</button>` : ''}
        ${isArea && s.status === 'submitted' ? `<button class="btn btn-warning" onclick="alert('已督促店长尽快处理')">督促店长</button>` : ''}
      </div>
    </div>

    <div class="detail-grid">
      <div>
        ${s.status === 'rejected' && s.reject_reason ? `<div class="alert alert-danger"><span class="alert-icon">❌</span><div><b>驳回原因：</b>${s.reject_reason}</div></div>` : ''}
        ${s.status === 'pending_cash' ? `<div class="alert alert-info"><span class="alert-icon">💡</span><div>
          <b>上一环节结论：</b>数据审核已通过，审核人：${s.approved_by_name||'店长'}
          <br>责任链：<b>${s.clerk_name||'店员'}</b> → <b>${s.approved_by_name||'店长'}</b> → 现金核对环节
        </div></div>` : ''}
        ${s.status === 'submitted' && s.cash_actual !== null && s.cash_actual !== undefined && s.cash_actual !== s.cash_expected ? `<div class="alert alert-warn"><span class="alert-icon">⚠️</span><div><b>现金申报差异预警：</b>系统应收 ${fmtMoney(s.cash_expected)}，店员自报 ${fmtMoney(s.cash_actual)}，差异 ${diffText(s.cash_actual - s.cash_expected)}。请重点询问原因！</div></div>` : ''}
        ${s.status === 'approved' ? `<div class="alert alert-info" style="background:#ecfdf5;border-color:#a7f3d0;color:#065f46;"><span class="alert-icon">✅</span><div><b>已完成闭环。</b>数据+现金核对均已通过，责任链完整。</div></div>` : ''}

        <div class="card" style="margin-bottom:20px;">
          <div class="card-header"><div class="card-title">💵 销售金额明细</div></div>
          <div class="card-body">
            <div class="amount-row"><span class="amount-label">电脑票销售额</span><span class="amount-value">${fmtMoney(s.ticket_sales)}</span></div>
            <div class="amount-row"><span class="amount-label">即开票销售额</span><span class="amount-value">${fmtMoney(s.scratch_sales)}</span></div>
            <div class="amount-row amount-total"><span class="amount-label">销售合计 ( = 现金应收 )</span><span class="amount-value">${fmtMoney(s.total_sales)}</span></div>
            <div class="amount-row" style="margin-top:6px;"><span class="amount-label">店员自报实收现金</span><span class="amount-value ${diffClass((s.cash_actual||0)-s.cash_expected)}">${s.cash_actual!==null&&s.cash_actual!==undefined?fmtMoney(s.cash_actual):'—'}</span></div>
            <div class="amount-row"><span class="amount-label">差异 (自报 - 应收)</span><span class="amount-value ${diffClass((s.cash_actual||0)-s.cash_expected)}">${s.cash_actual!==null&&s.cash_actual!==undefined?diffText(s.cash_actual-s.cash_expected):'—'}</span></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">👤 责任链摘要 · 上一环节入口</div></div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item"><div class="info-label">门店</div><div class="info-value">${s.store_name||'-'}</div></div>
              <div class="info-item"><div class="info-label">班次类型</div><div class="info-value"><span class="type-badge shift-${s.shift_type}">${SHIFT_TEXT[s.shift_type]}</span></div></div>
              <div class="info-item"><div class="info-label">值班店员（第一责任人）</div><div class="info-value">${s.clerk_name||'-'} <span class="type-badge role-clerk">店员</span></div></div>
              <div class="info-item"><div class="info-label">审核人（第二责任人）</div><div class="info-value">${s.approved_by_name||'<span style="color:#9ca3af;">(尚未审核)</span>'} ${s.approved_by_name?'<span class="type-badge role-store_manager">店长</span>':''}</div></div>
              <div class="info-item"><div class="info-label">创建时间</div><div class="info-value">${fmtTime(s.created_at)}</div></div>
              <div class="info-item"><div class="info-label">最后更新</div><div class="info-value">${fmtTime(s.updated_at)}</div></div>
            </div>
            ${renderNextStep(s.status)}
            ${renderPrevStep(s)}
            ${s.status === 'pending_cash' || s.status === 'approved' ? `<div style="margin-top:12px;"><button class="btn btn-sm btn-outline" onclick="gotoCashByShift('${s.shift_no}',${s.id})">→ 前往下一环节：现金核对</button></div>` : ''}
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-header"><div class="card-title">⏱️ 时间线 · 操作日志 <span class="count-tag">${(logs.data||[]).length}</span></div></div>
          <div class="card-body">
            <div class="timeline history-list">
              ${(logs.data||[]).length ? (logs.data||[]).map(l => renderTimelineItem(l)).join('') : '<div class="empty-state" style="padding:30px 0;"><div class="empty-icon">📜</div><div class="empty-text">暂无操作记录</div></div>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  recentLogsPreview();
  } catch(e) { console.error('viewShift error:', e); document.getElementById('pageContent').innerHTML = errorPage('班结详情加载失败: ' + e.message); }
}

function renderNextStep(status) {
  const map = {
    draft: { label:'下一步：店员提交审核', role:'clerk' },
    submitted: { label:'下一步：店长审核', role:'store_manager' },
    rejected: { label:'下一步：店员修改重提', role:'clerk' },
    pending_cash: { label:'下一步：店长现金盘点', role:'store_manager' },
    approved: { label:'已完成闭环', role:'' }
  };
  const step = map[status];
  if (!step) return '';
  return `<div style="margin-top:12px;padding:10px 12px;background:#ede9fe;border-radius:6px;font-size:12px;color:#6d28d9;">
    👉 <b>${step.label}</b>${step.role ? `（责任角色：${ROLE_TEXT[step.role]}）` : ''}</div>`;
}

function renderPrevStep(s) {
  let text = '';
  if (s.status === 'rejected') text = '上一环节：店长审核（驳回）';
  else if (s.status === 'submitted') text = '上一环节：店员创建并提交';
  else if (s.status === 'pending_cash' || s.status === 'approved') text = '上一环节：店长数据审核通过';
  if (!text) return '';
  return `<div style="margin-top:8px;padding:10px 12px;background:#f0fdf4;border-radius:6px;font-size:12px;color:#065f46;">⬅ <b>${text}</b></div>`;
}

function renderTimelineItem(l) {
  const dotClass = { create:'create', submit:'submit', approve:'approve', reject:'reject', escalate:'escalate',
    auto_close:'approve', count_result:'escalate', start_count:'create', submit_count:'approve',
    upload_material:'', match:'approve', resolve:'approve' }[l.action] || '';
  const actionText = {
    create:'📝 创建', submit:'📤 提交', approve:'✅ 批准', reject:'❌ 驳回', escalate:'⬆️ 升级',
    start_count:'🔢 开始盘点', submit_count:'📊 盘点完成', upload_material:'📎 上传材料',
    match:'🤝 确认匹配', resolve:'🎉 解决', update_notes:'📝 更新备注',
    update_cash:'✏️ 修改金额', count_result:'📊 盘点结果', final_approve:'✅ 最终批准',
    auto_close:'🔒 自动闭环'
  }[l.action] || l.action;
  return `<div class="timeline-item">
    <div class="timeline-dot ${dotClass}"></div>
    <div class="timeline-time">${fmtTime(l.created_at)}</div>
    <div class="timeline-title">
      ${actionText}
      ${l.old_status && l.new_status ? `<span class="status-change"><span class="status-badge status-${l.old_status}">${STATUS_TEXT[l.old_status]}</span> → <span class="status-badge status-${l.new_status}">${STATUS_TEXT[l.new_status]}</span></span>` : ''}
    </div>
    <div class="timeline-detail">${l.detail||'-'}</div>
    <span class="timeline-operator role-${l.operator_role}">${l.operator_name} · ${ROLE_TEXT[l.operator_role]}</span>
  </div>`;
}

async function shiftAction(id, act, payload) {
  const r = await api(`/shifts/${id}/${act}`, 'POST', payload || {});
  if (r.code === 0) {
    updateUnreadCount();
    viewShift(id);
  } else { alert(r.message || '操作失败'); viewShift(id); }
}

function openShiftReject(id) {
  showModal('驳回班结', `
    <div class="form-group"><label>驳回原因（必填，店员可见）</label>
    <textarea id="rejectReason" placeholder="例如：系统数据与销售小票总额不一致，请核对即开票部分后重新提交。" style="min-height:90px;"></textarea></div>
  `, () => {
    const reason = document.getElementById('rejectReason').value.trim();
    if (!reason) { alert('请填写驳回原因'); return false; }
    shiftAction(id, 'reject', { reason });
    return true;
  });
}

function openCashUpdate(id) {
  showModal('修改申报现金', `
    <div class="form-group"><label>实际申报现金（元）</label>
    <input type="number" id="cashVal" step="0.01" placeholder="请输入实际金额"></div>
  `, () => {
    const v = parseFloat(document.getElementById('cashVal').value);
    if (isNaN(v) || v < 0) { alert('请输入正确金额'); return false; }
    shiftAction(id, 'update_cash', { amount: v });
    return true;
  });
}

function openShiftCreate() {
  showModal('新建销售班结', `
    <div class="form-row">
      <div class="form-group"><label>班次类型</label>
        <select id="ns_type"><option value="morning">早班</option><option value="afternoon">下午班</option><option value="night">夜班</option></select></div>
      <div class="form-group"><label>日期</label><input type="text" id="ns_date" value="${new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>电脑票销售额(元)</label><input type="number" id="ns_ticket" step="0.01" value="0"></div>
      <div class="form-group"><label>即开票销售额(元)</label><input type="number" id="ns_scratch" step="0.01" value="0"></div>
    </div>
    <div class="form-group"><label>实际实收现金(元)（可稍后修改）</label><input type="number" id="ns_cash" step="0.01" value="0"></div>
  `, async () => {
    const body = {
      store_id: currentUser.store_id || 1,
      shift_type: document.getElementById('ns_type').value,
      shift_date: document.getElementById('ns_date').value,
      ticket_sales: parseFloat(document.getElementById('ns_ticket').value) || 0,
      scratch_sales: parseFloat(document.getElementById('ns_scratch').value) || 0,
      cash_actual: parseFloat(document.getElementById('ns_cash').value) || 0
    };
    const r = await api('/shifts', 'POST', body);
    if (r.code === 0) { loadPage('shifts'); return true; }
    else { alert(r.message); return false; }
  });
}

async function gotoCashByShift(shiftNo, sid) {
  const r = await api('/cash');
  const found = (r.data||[]).find(c => c.shift_settlement_id === sid);
  if (found) viewCash(found.id);
  else alert('未找到对应的现金核对单');
}

// ===== Cash Verifications =====
async function renderCash() {
  const status = pageCache.cashStatus || '';
  let url = '/cash';
  if (status) url += '?status=' + status;
  const r = await api(url);
  const list = r.data || [];

  const pageTitle = currentUser.role === 'clerk' ? '我的现金核对'
    : currentUser.role === 'store_manager' ? '本店现金核对'
    : '片区现金核对';
  const subtitle = currentUser.role === 'clerk'
    ? '关联您班结的现金核对进度（仅查看）'
    : (currentUser.role === 'store_manager' ? '本店现金核对全流程：盘点→差异说明→升级或匹配' : '全片区现金核对总览（关注升级与差异）');

  const showClerkCol = currentUser.role !== 'clerk';
  const showStoreCol = currentUser.role === 'area_manager';

  return `
    <div class="page-header">
      <div>
        <div class="page-title">💰 ${pageTitle}</div>
        <div class="page-subtitle">${subtitle}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="filter-bar">
          <select onchange="filterCash('status', this.value)">
            <option value="">全部状态</option>
            <option value="pending" ${status==='pending'?'selected':''}>待盘点</option>
            <option value="counting" ${status==='counting'?'selected':''}>盘点中</option>
            <option value="matched" ${status==='matched'?'selected':''}>账实相符</option>
            <option value="mismatched" ${status==='mismatched'?'selected':''}>账实不符</option>
            <option value="escalated" ${status==='escalated'?'selected':''}>已升级片区</option>
            <option value="resolved" ${status==='resolved'?'selected':''}>已解决</option>
          </select>
          <span style="font-size:12px;color:#6b7280;margin-left:auto;">共 <b style="color:#111827;">${list.length}</b> 条</span>
        </div>

        <table>
          <thead><tr>
            <th>核对编号</th>
            <th>关联班结</th>
            ${showClerkCol ? '<th>店员责任人</th>' : ''}
            ${showStoreCol ? '<th>门店</th>' : ''}
            <th style="text-align:right;">申报现金</th>
            <th style="text-align:right;">实盘现金</th>
            <th style="text-align:right;">差异</th>
            <th>当前责任人</th>
            <th>上环节结论</th>
            <th>状态</th>
            <th>操作</th>
          </tr></thead>
          <tbody>
            ${list.length ? list.map(c => {
              const clerk = c.clerk_name || '-';
              const handler = c.area_manager_name || c.store_manager_name || '待分配';
              const handlerRole = c.area_manager_id ? 'role-area_manager' : 'role-store_manager';
              const prevSummary = c.prev_conclusion_summary || c.previous_conclusion || '—';
              return `<tr>
                <td><a class="link-btn" onclick="viewCash(${c.id})"><b>CV${String(c.id).padStart(4,'0')}</b></a></td>
                <td>${c.shift_no?`<a class="link-btn" onclick="viewShift(${c.shift_settlement_id})">${c.shift_no}</a>`:'-'}</td>
                ${showClerkCol ? `<td><span class="type-badge role-clerk">${clerk}</span></td>` : ''}
                ${showStoreCol ? `<td>${c.store_name||'-'}</td>` : ''}
                <td style="text-align:right;" class="info-value money">${fmtMoney(c.cash_declared)}</td>
                <td style="text-align:right;" class="info-value money">${c.cash_counted!==null&&c.cash_counted!==undefined?fmtMoney(c.cash_counted):'—'}</td>
                <td style="text-align:right;" class="${diffClass(c.difference)}">${c.difference!==null&&c.difference!==undefined?diffText(c.difference):'—'}</td>
                <td><span class="type-badge ${handlerRole}">${handler}</span></td>
                <td style="font-size:11px;color:#6b7280;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${prevSummary}">${prevSummary}</td>
                <td><span class="status-badge status-${c.status}">${STATUS_TEXT[c.status]}</span></td>
                <td><button class="btn btn-sm btn-primary" onclick="viewCash(${c.id})">工作面</button></td>
              </tr>`;
            }).join('') : `<tr><td colspan="${showClerkCol?(showStoreCol?11:10):(showStoreCol?10:9)}"><div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">暂无数据</div></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function filterCash(key, val) {
  pageCache['cash' + key.charAt(0).toUpperCase() + key.slice(1)] = val;
  loadPage('cash');
}

async function viewCash(id) {
  try {
  const [cash, logs] = await Promise.all([
    api('/cash/' + id),
    api(`/logs?ref_type=cash_verification&ref_id=${id}`)
  ]);
  const c = cash.data;
  if (!c) { alert('未找到或无权查看'); navTo('cash'); return; }
  const s = c.shift_info;

  const isMgr = currentUser.role === 'store_manager' && currentUser.store_id === c.store_id;
  const isArea = currentUser.role === 'area_manager';
  const canActMgr = isMgr && ['pending','counting','mismatched'].includes(c.status);
  const canActArea = isArea && c.status === 'escalated';
  const diff = c.difference;

  const clerkName = s ? s.clerk_name : (c.clerk_name || '-');
  const storeMgrName = c.store_manager_name || '-';
  const areaMgrName = c.area_manager_name || '';

  // 上一环节
  let prevStep = '';
  if (s) {
    prevStep = `上一环节：班结 ${s.shift_no}（${s.approved_by_name ? s.approved_by_name + ' 已审核通过' : '已审核通过'}）`;
  }

  // 下一步
  let nextStep = '';
  if (c.status === 'pending') nextStep = '下一步：店长开始现场盘点';
  else if (c.status === 'counting') nextStep = '下一步：提交盘点结果';
  else if (c.status === 'mismatched') nextStep = '下一步：说明原因 / 升级片区';
  else if (c.status === 'escalated') nextStep = '下一步：片区管理员裁定';
  else if (c.status === 'matched' || c.status === 'resolved') nextStep = '已完成';

  document.getElementById('pageContent').innerHTML = `
    <a class="back-link" onclick="navTo('cash')">← 返回现金核对列表</a>

    <div class="page-header">
      <div>
        <div class="page-title">CV${String(c.id).padStart(4,'0')}
          <span class="status-badge status-${c.status}" style="font-size:12px;margin-left:8px;">${STATUS_TEXT[c.status]}</span>
          ${diff!==null&&diff!==undefined?`<span class="${diffClass(diff)}" style="margin-left:8px;font-weight:700;">${diffText(diff)}</span>`:''}
        </div>
        <div class="page-subtitle">
          ${s?`<a class="link-btn" onclick="viewShift(${s.id})">关联班结: ${s.shift_no}</a> · `:''}
          ${c.store_name||''}${s?` · ${SHIFT_TEXT[s.shift_type]} · ${clerkName} 值班`:''}
        </div>
      </div>
      <div class="action-bar">
        ${isMgr && c.status === 'pending' ? `<button class="btn btn-primary" onclick="cashAction(${c.id},'start_count')">开始现场盘点</button>` : ''}
        ${isMgr && c.status === 'counting' ? `<button class="btn btn-success" onclick="openCountSubmit(${c.id}, ${c.cash_declared})">提交盘点结果</button>` : ''}
        ${isMgr && c.status === 'mismatched' ? `<button class="btn btn-warning" onclick="openEscalate(${c.id})">升级至片区管理员</button>
          <button class="btn btn-success" onclick="cashAction(${c.id},'match')">确认为相符（特殊情况）</button>` : ''}
        ${isArea && c.status === 'escalated' ? `<button class="btn btn-success" onclick="openResolve(${c.id})">裁定并解决</button>` : ''}
        ${(canActMgr || canActArea) ? `<button class="btn btn-outline" onclick="openAddMaterial(${c.id})">+ 上传材料</button>` : ''}
        ${(canActMgr || canActArea) ? `<button class="btn btn-outline" onclick="openEditNotes(${c.id})">更新备注/结论</button>` : ''}
      </div>
    </div>

    ${c.status === 'escalated' ? `<div class="alert alert-danger"><span class="alert-icon">🚨</span><div><b>已升级至片区管理员：</b>${c.notes||'店长与店员无法达成一致，片区介入裁定中'}</div></div>` : ''}
    ${c.status === 'mismatched' && diff!==null ? `<div class="alert alert-warn"><span class="alert-icon">⚠️</span><div><b>账实不符：</b>申报 ${fmtMoney(c.cash_declared)}，实盘 ${fmtMoney(c.cash_counted)}，差异 ${diffText(diff)}。请上传证明材料说明原因，或升级至片区处理。</div></div>` : ''}
    ${(c.status === 'matched' || c.status === 'resolved') ? `<div class="alert alert-info" style="background:#ecfdf5;border-color:#a7f3d0;color:#065f46;"><span class="alert-icon">✅</span><div><b>现金核对已完成：</b>${c.resolution || '账实相符，责任链完整'}</div></div>` : ''}

    <div class="three-col">
      <!-- Column 1: 金额 + 上环节 + 责任链 -->
      <div>
        <div class="card" style="margin-bottom:16px;">
          <div class="card-header"><div class="card-title">💵 金额核对（同一工作面）</div></div>
          <div class="card-body">
            <div class="amount-row"><span class="amount-label">系统销售应收 (来自班结)</span><span class="amount-value">${fmtMoney(c.cash_declared)}</span></div>
            <div class="amount-row"><span class="amount-label">店员自报现金 (来自班结)</span><span class="amount-value ${diffClass((s?.cash_actual||0)-c.cash_declared)}">${s && s.cash_actual!==null&&s.cash_actual!==undefined?fmtMoney(s.cash_actual):'—'}</span></div>
            <div class="amount-row"><span class="amount-label">店长/片区实盘现金</span><span class="amount-value ${diffClass(diff)}">${c.cash_counted!==null&&c.cash_counted!==undefined?fmtMoney(c.cash_counted):'<span style="color:#9ca3af;">(尚未盘点)</span>'}</span></div>
            <div class="amount-row amount-total"><span class="amount-label">最终差异 (实盘 - 应收)</span><span class="amount-value ${diffClass(diff)}">${diff!==null&&diff!==undefined?diffText(diff):'—'}</span></div>
          </div>
        </div>

        <div class="card" style="margin-bottom:16px;">
          <div class="card-header"><div class="card-title">🔗 上一环节（销售班结）入口</div></div>
          <div class="card-body">
            ${s ? `
              <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">班结编号</div>
              <div style="font-weight:600;margin-bottom:10px;">
                <a class="link-btn" onclick="viewShift(${s.id})">${s.shift_no}</a>
                <span class="status-badge status-${s.status}" style="margin-left:6px;">${STATUS_TEXT[s.status]}</span>
              </div>
              <div class="info-grid">
                <div class="info-item"><div class="info-label">店员（第一责任人）</div><div class="info-value">${s.clerk_name||'-'}</div></div>
                <div class="info-item"><div class="info-label">审核店长</div><div class="info-value">${s.approved_by_name||'-'}</div></div>
                <div class="info-item"><div class="info-label">销售合计</div><div class="info-value money">${fmtMoney(s.total_sales)}</div></div>
                <div class="info-item"><div class="info-label">创建时间</div><div class="info-value" style="font-size:12px;">${fmtTime(s.created_at)}</div></div>
              </div>
              ${s.reject_reason ? `<div style="margin-top:10px;padding:8px;background:#fef2f2;border-radius:4px;font-size:12px;color:#991b1b;"><b>上次驳回：</b>${s.reject_reason}</div>` : ''}
              ${nextStep ? `<div style="margin-top:12px;padding:10px 12px;background:#ede9fe;border-radius:6px;font-size:12px;color:#6d28d9;">👉 <b>${nextStep}</b></div>` : ''}
            ` : '<div style="color:#9ca3af;font-size:12px;">未找到关联班结信息</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">👥 责任链摘要</div></div>
          <div class="card-body" style="padding-top:12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
              <span class="type-badge role-clerk">店员</span>
              <span style="font-weight:500;">${clerkName}</span>
              <span style="color:#9ca3af;">→</span>
              <span class="type-badge role-store_manager">店长</span>
              <span style="font-weight:500;">${storeMgrName}</span>
              ${areaMgrName ? `<span style="color:#9ca3af;">→</span><span class="type-badge role-area_manager">片区</span><span style="font-weight:500;">${areaMgrName}</span>` : ''}
            </div>
            <div style="font-size:12px;color:#6b7280;line-height:1.6;">
              ${c.status === 'escalated' ? '当前处于片区裁定阶段，最终责任：店员对差异负主要责任，店长负审核责任，片区负最终裁定责任。' : '当前处于门店核对阶段，店员负主要责任，店长负盘点责任。'}
            </div>
          </div>
        </div>
      </div>

      <!-- Column 2: 材料 + 备注 -->
      <div>
        <div class="card" style="margin-bottom:16px;">
          <div class="card-header">
            <div class="card-title">📎 核对材料（兑奖登记/故障单/回执） <span class="count-tag">${(c.materials||[]).length}</span></div>
          </div>
          <div class="card-body">
            ${(c.materials||[]).length ? `<div class="material-list">
              ${c.materials.map(m => `
                <div class="material-item">
                  <div class="material-icon">${MATERIAL_ICON[m.type] || '📄'}</div>
                  <div class="material-body">
                    <div class="material-name">${m.name}</div>
                    <div class="material-meta">${TYPE_TEXT[m.type]||m.type}${m.reference_no?` · 编号:${m.reference_no}`:''}${m.uploaded_by_name?` · ${m.uploaded_by_name}上传`:''} · ${fmtTime(m.created_at)}</div>
                  </div>
                  ${m.amount!==null&&m.amount!==undefined?`<div class="material-amount">${fmtMoney(m.amount)}</div>`:''}
                </div>
              `).join('')}
            </div>` : '<div class="empty-state" style="padding:24px 0;"><div class="empty-icon">📎</div><div class="empty-text">尚未上传材料</div></div>'}
          </div>
        </div>

        <div class="card" style="margin-bottom:16px;">
          <div class="card-header"><div class="card-title">📝 备注 & 结论（同屏展示）</div></div>
          <div class="card-body" style="padding-top:12px;">
            <div class="form-group" style="margin-bottom:10px;"><label style="color:#6b7280;">上一环节/历史说明</label>
              <div style="background:#f9fafb;padding:10px;border-radius:6px;font-size:13px;border:1px solid #f3f4f6;white-space:pre-wrap;line-height:1.6;">${c.previous_conclusion || '<span style="color:#9ca3af;">暂无</span>'}</div>
            </div>
            <div class="form-group" style="margin-bottom:10px;"><label style="color:#6b7280;">材料说明</label>
              <div style="background:#f9fafb;padding:10px;border-radius:6px;font-size:13px;border:1px solid #f3f4f6;white-space:pre-wrap;line-height:1.6;">${c.material_notes || '<span style="color:#9ca3af;">暂无</span>'}</div>
            </div>
            <div class="form-group" style="margin-bottom:10px;"><label style="color:#6b7280;">当前备注（差异原因/沟通记录）</label>
              <div style="background:#f9fafb;padding:10px;border-radius:6px;font-size:13px;border:1px solid #f3f4f6;white-space:pre-wrap;line-height:1.6;">${c.notes || '<span style="color:#9ca3af;">暂无</span>'}</div>
            </div>
            <div class="form-group"><label style="color:#6b7280;">最终解决结论</label>
              <div style="background:#f9fafb;padding:10px;border-radius:6px;font-size:13px;border:1px solid #f3f4f6;white-space:pre-wrap;line-height:1.6;">${c.resolution || '<span style="color:#9ca3af;">(处理完成后填写)</span>'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Column 3: 时间线 -->
      <div>
        <div class="card">
          <div class="card-header"><div class="card-title">⏱️ 责任时间线 · 操作日志 <span class="count-tag">${(logs.data||[]).length}</span></div></div>
          <div class="card-body">
            <div class="timeline history-list">
              ${(logs.data||[]).length ? (logs.data||[]).map(l => renderTimelineItem(l)).join('') : '<div class="empty-state" style="padding:30px 0;"><div class="empty-icon">📜</div><div class="empty-text">暂无记录</div></div>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  recentLogsPreview();
  } catch(e) { console.error('viewCash error:', e); document.getElementById('pageContent').innerHTML = errorPage('现金核对详情加载失败: ' + e.message); }
}

async function cashAction(id, act, payload) {
  const r = await api(`/cash/${id}/${act}`, 'POST', payload || {});
  if (r.code === 0) { updateUnreadCount(); viewCash(id); }
  else { alert(r.message || '操作失败'); viewCash(id); }
}

function openCountSubmit(id, declared) {
  showModal('提交盘点结果', `
    <div class="form-group"><label>店长实盘现金（元）</label>
      <div style="padding:6px 10px;background:#ede9fe;border-radius:6px;margin-bottom:10px;font-size:12px;color:#6d28d9;">系统申报金额：<b style="font-size:14px;">${fmtMoney(declared)}</b></div>
      <input type="number" id="cs_count" step="0.01" value="${declared}">
    </div>
  `, () => {
    const v = parseFloat(document.getElementById('cs_count').value);
    if (isNaN(v) || v < 0) { alert('请输入正确金额'); return false; }
    cashAction(id, 'submit_count', { cash_counted: v });
    return true;
  });
}

function openEscalate(id) {
  showModal('升级至片区管理员', `
    <div class="form-group"><label>升级原因（片区管理员可见，必填）</label>
    <textarea id="esc_reason" style="min-height:100px;" placeholder="例如：店员王小明坚持短款500元是因为替隔壁店临时兑奖，但无记录；双方各执一词，已调取监控但画面有死角，申请片区裁定。"></textarea></div>
  `, () => {
    const r = document.getElementById('esc_reason').value.trim();
    if (!r) { alert('请填写升级原因'); return false; }
    cashAction(id, 'escalate', { reason: r });
    return true;
  });
}

function openResolve(id) {
  showModal('片区裁定 · 最终解决', `
    <div class="form-group"><label>解决结论（必填，存入历史档案）</label>
    <textarea id="res_val" style="min-height:100px;" placeholder="请输入最终裁定结论..."></textarea></div>
  `, () => {
    const v = document.getElementById('res_val').value.trim();
    if (!v) { alert('请填写结论'); return false; }
    cashAction(id, 'resolve', { resolution: v });
    return true;
  });
}

function openAddMaterial(id) {
  showModal('上传核对材料', `
    <div class="form-group"><label>材料类型</label>
      <select id="am_type">
        <option value="redeem_register">兑奖登记单</option>
        <option value="fault_ticket">设备故障单</option>
        <option value="bank_slip">银行回执</option>
        <option value="receipt">收据</option>
        <option value="other">其他</option>
      </select></div>
    <div class="form-group"><label>材料名称/标题</label>
      <input type="text" id="am_name" placeholder="例如：6月12日兑奖登记表"></div>
    <div class="form-row">
      <div class="form-group"><label>参考编号</label><input type="text" id="am_ref" placeholder="可选"></div>
      <div class="form-group"><label>涉及金额</label><input type="number" id="am_amt" step="0.01" placeholder="可选"></div>
    </div>
  `, () => {
    const name = document.getElementById('am_name').value.trim();
    if (!name) { alert('请填写材料名称'); return false; }
    const body = {
      type: document.getElementById('am_type').value,
      name,
      reference_no: document.getElementById('am_ref').value.trim() || null,
      amount: parseFloat(document.getElementById('am_amt').value) || null
    };
    api(`/cash/${id}/materials`, 'POST', body).then(r => {
      if (r.code === 0) { closeModal(); viewCash(id); }
      else alert(r.message);
    });
    return false;
  });
}

function openEditNotes(id) {
  api('/cash/' + id).then(r => {
    const c = r.data;
    if (!c) return;
    showModal('更新备注 / 结论', `
      <div class="form-group"><label>上一环节/历史说明</label>
        <textarea id="en_prev" style="min-height:60px;">${c.previous_conclusion||''}</textarea></div>
      <div class="form-group"><label>材料说明</label>
        <textarea id="en_mat" style="min-height:60px;">${c.material_notes||''}</textarea></div>
      <div class="form-group"><label>当前备注（差异原因/沟通记录）</label>
        <textarea id="en_notes" style="min-height:80px;">${c.notes||''}</textarea></div>
    `, () => {
      const body = {
        previous_conclusion: document.getElementById('en_prev').value.trim(),
        material_notes: document.getElementById('en_mat').value.trim(),
        notes: document.getElementById('en_notes').value.trim()
      };
      cashAction(id, 'update_notes', body);
      return true;
    });
  });
}

// ===== Notifications =====
async function renderNotifications() {
  const r = await api('/notifications');
  const list = r.data || [];
  return `
    <div class="page-header">
      <div>
        <div class="page-title">🔔 通知中心</div>
        <div class="page-subtitle">所有与您相关的审批、差异、升级等提醒</div>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        ${list.length ? `<div class="notif-list">${list.map(n => renderNotifItem(n, false)).join('')}</div>`
          : '<div class="empty-state"><div class="empty-icon">✉️</div><div class="empty-text">暂无通知</div></div>'}
      </div>
    </div>
  `;
}

function renderNotifItem(n, hideUnread) {
  const typeClass = { approval:'tag-info', review:'tag-warning', escalation:'tag-danger', mismatch:'tag-danger', overdue:'tag-danger' }[n.type] || 'tag-info';
  const icon = n.type==='approval'?'✅':n.type==='escalation'?'⬆️':n.type==='mismatch'?'💸':n.type==='overdue'?'⏰':'📢';
  return `<div class="notif-item ${!n.is_read && !hideUnread ? 'unread' : ''}" onclick="goNotif(${n.id}, '${n.ref_type}', ${n.ref_id})" style="display:flex;gap:10px;align-items:flex-start;">
    <div class="notif-icon" style="flex-shrink:0;font-size:16px;">${icon}</div>
    <div class="notif-body" style="flex:1;min-width:0;">
      <div class="notif-title" style="display:flex;align-items:center;gap:6px;">${n.title} ${!n.is_read && !hideUnread ? '<span style="width:8px;height:8px;background:#ef4444;border-radius:50%;display:inline-block;"></span>' : ''} <span class="tag ${typeClass}">${NOTIF_TYPE_TEXT[n.type]||n.type}</span></div>
      <div class="notif-desc" style="font-size:12px;color:#4b5563;line-height:1.5;margin-top:3px;">${n.content||''}</div>
      <div class="notif-time" style="font-size:11px;color:#9ca3af;margin-top:4px;">${fmtTime(n.created_at)}</div>
    </div>
  </div>`;
}

async function goNotif(notifId, refType, refId) {
  api(`/notifications/${notifId}/read`, 'POST');
  updateUnreadCount();
  if (refType === 'shift_settlement') viewShift(refId);
  else if (refType === 'cash_verification') viewCash(refId);
}

// ===== Operation Logs =====
async function renderLogs() {
  const r = await api('/logs?limit=100');
  const list = r.data || [];
  return `
    <div class="page-header">
      <div>
        <div class="page-title">📜 操作日志总览</div>
        <div class="page-subtitle">全系统操作留痕 · 时间线完整可追溯</div>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="timeline history-list">
          ${list.length ? list.map(l => renderTimelineItem(l)).join('') : '<div class="empty-state"><div class="empty-icon">📜</div><div class="empty-text">暂无日志</div></div>'}
        </div>
      </div>
    </div>
  `;
}

// ===== Modal =====
function showModal(title, bodyHtml, onOk) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  const okBtn = document.getElementById('modalOkBtn');
  okBtn.onclick = () => {
    if (onOk) {
      const result = onOk();
      if (result !== false) closeModal();
    } else closeModal();
  };
  document.getElementById('modalOverlay').style.display = 'flex';
  setTimeout(() => {
    const firstInput = document.querySelector('#modalBody input, #modalBody textarea, #modalBody select');
    if (firstInput) firstInput.focus();
  }, 50);
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

// ===== Notif panel =====
async function toggleNotifPanel() {
  const p = document.getElementById('notifPanel');
  if (p.style.display === 'block') { p.style.display = 'none'; return; }
  const r = await api('/notifications?unread=1');
  const list = r.data || [];
  document.getElementById('notifList').innerHTML = list.length
    ? list.slice(0,8).map(n => renderNotifItem(n, false)).join('')
    : '<div class="empty-state" style="padding:30px 0;"><div class="empty-icon">✉️</div><div class="empty-text">暂无未读通知</div></div>';
  p.style.display = 'block';
}

async function readAllNotif() {
  const r = await api('/notifications?unread=1');
  const list = r.data || [];
  for (const n of list) {
    await api(`/notifications/${n.id}/read`, 'POST');
  }
  updateUnreadCount();
  toggleNotifPanel();
  if (currentPage === 'notifications') loadPage('notifications');
}

// Utils
function recentLogsPreview() {}

document.addEventListener('click', (e) => {
  const panel = document.getElementById('notifPanel');
  const bell = document.getElementById('notifBell');
  if (panel.style.display === 'block' && !panel.contains(e.target) && !bell.contains(e.target)) {
    panel.style.display = 'none';
  }
});