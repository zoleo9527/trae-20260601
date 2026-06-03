const API = '/api';
let currentUser = null;

function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (res.status === 401) { showLogin(); return null; }
    if (res.status === 403) {
        const data = await res.json().catch(() => null);
        toast(data?.error || '权限不足', 'error');
        return null;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) { toast(data?.error || '请求失败', 'error'); return null; }
    return data;
}

async function apiDownload(path) {
    const res = await fetch(`${API}${path}`, { credentials: 'same-origin' });
    if (!res.ok) {
        if (res.status === 403) toast('权限不足，无法导出', 'error');
        else toast('导出失败', 'error');
        return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.headers.get('Content-Disposition')?.match(/filename="?(.+?)"?$/)?.[1] || 'export.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function formatDate(d) {
    if (!d) return '-';
    return d.slice(0, 10);
}

function formatDateTime(d) {
    if (!d) return '-';
    return d.slice(0, 16).replace('T', ' ');
}

function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function isManager() {
    return currentUser && currentUser.role === 'manager';
}

function showLogin() {
    currentUser = null;
    document.getElementById('app').innerHTML = renderLoginPage();
}

function renderLoginPage() {
    return `
    <div class="login-page">
        <div class="login-box">
            <h1>法律援助中心管理系统</h1>
            <p class="subtitle">本地部署 · 数据安全</p>
            <div id="login-error" style="color:var(--danger);font-size:13px;text-align:center;margin-bottom:12px;display:none;"></div>
            <div class="form-group">
                <label>用户名</label>
                <input type="text" id="login-username" placeholder="请输入用户名" autofocus>
            </div>
            <div class="form-group">
                <label>密码</label>
                <input type="password" id="login-password" placeholder="请输入密码">
            </div>
            <button class="btn btn-primary btn-lg" style="width:100%;margin-top:8px;" onclick="doLogin()">登 录</button>
            <div style="margin-top:20px;font-size:12px;color:var(--text-light);text-align:center;">
                演示账号：staff1/123456（窗口） · admin/123456（负责人）
            </div>
        </div>
    </div>`;
}

async function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) { toast('请输入用户名和密码', 'error'); return; }
    const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
        const errEl = document.getElementById('login-error');
        errEl.textContent = data.error || '登录失败';
        errEl.style.display = 'block';
        return;
    }
    currentUser = data;
    toast(`欢迎，${data.display_name}`, 'success');
    renderApp();
}

async function doLogout() {
    await fetch(`${API}/logout`, { method: 'POST', credentials: 'same-origin' });
    currentUser = null;
    showLogin();
}

function renderApp() {
    const mgr = isManager();
    document.getElementById('app').innerHTML = `
    <div class="app-layout">
        <aside class="sidebar">
            <div class="sidebar-brand">
                <h2>法律援助中心</h2>
                <small>案件管理系统</small>
            </div>
            <nav class="sidebar-nav">
                <button class="nav-item active" data-page="dashboard">${mgr ? '📊' : '📋'} 工作台</button>
                <button class="nav-item" data-page="cases">📋 案件管理</button>
                <button class="nav-item" data-page="new-case">➕ 新增登记</button>
                ${mgr ? '<button class="nav-item" data-page="lawyers">👨‍⚖️ 律师管理</button>' : ''}
                ${mgr ? '<button class="nav-item" data-page="overdue">⚠️ 超期提醒</button>' : ''}
            </nav>
            <div class="sidebar-footer">
                ${escapeHtml(currentUser.display_name)}<br>
                <span class="role-badge ${currentUser.role}">${mgr ? '负责人' : '窗口人员'}</span>
                <button class="btn btn-sm btn-outline" style="margin-top:8px;width:100%;" onclick="doLogout()">退出登录</button>
            </div>
        </aside>
        <div class="main-content">
            <header class="top-bar">
                <span class="page-title" id="page-title">工作台</span>
                <div class="user-info">
                    <span id="current-time"></span>
                </div>
            </header>
            <div class="content-area" id="page-content"></div>
        </div>
    </div>
    <div class="toast-container" id="toast-container"></div>`;

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    navigateTo('dashboard');
    updateClock();
    setInterval(updateClock, 60000);
}

function updateClock() {
    const el = document.getElementById('current-time');
    if (el) el.textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
}

function navigateTo(page, params) {
    if (page === 'lawyers' && !isManager()) { toast('权限不足', 'error'); return; }
    if (page === 'overdue' && !isManager()) { toast('权限不足', 'error'); return; }

    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
    const titles = { dashboard: '工作台', cases: '案件管理', 'new-case': '新增登记', lawyers: '律师管理', overdue: '超期提醒', 'case-detail': '案件详情' };
    document.getElementById('page-title').textContent = titles[page] || page;
    const container = document.getElementById('page-content');
    switch (page) {
        case 'dashboard': loadDashboard(); break;
        case 'cases': loadCases(); break;
        case 'new-case': loadNewCase(); break;
        case 'lawyers': loadLawyers(); break;
        case 'overdue': loadOverdue(); break;
        case 'case-detail': loadCaseDetail(params); break;
    }
}

async function loadDashboard() {
    const data = await api('/dashboard');
    if (!data) return;
    const container = document.getElementById('page-content');
    const mgr = isManager();

    let overdueHtml = '';
    if (mgr && data.overdue_corrections && data.overdue_corrections.length > 0) {
        overdueHtml = `
        <div class="overdue-alert">
            <h4>⚠️ 超期未补材料（${data.overdue_corrections.length}件）</h4>
            ${data.overdue_corrections.map(c => `
                <div class="overdue-item">
                    <span><strong>${escapeHtml(c.applicant_name)}</strong> ${c.case_number} · 补正截止：${formatDate(c.deadline)}</span>
                    <button class="btn btn-sm btn-danger" onclick="navigateTo('case-detail', ${c.case_id})">查看</button>
                </div>
            `).join('')}
        </div>`;
    }

    const statusColors = {
        '待初审': '#3498db', '材料补正中': '#e67e22', '已初审': '#2980b9',
        '已分派律师': '#8e44ad', '律师已接案': '#27ae60', '办理中': '#2ecc71',
        '已结案': '#95a5a6', '已撤回': '#7f8c8d'
    };

    let chartHtml = '';
    if (mgr && data.status_distribution && data.status_distribution.length > 0) {
        const maxCount = Math.max(...data.status_distribution.map(s => s.count));
        chartHtml = `<div class="bar-chart">
            ${data.status_distribution.map(s => `
                <div class="bar-col">
                    <span class="bar-value">${s.count}</span>
                    <div class="bar" style="height:${(s.count / maxCount) * 100}px;background:${statusColors[s.status] || '#3498db'};"></div>
                    <span class="bar-label">${s.status}</span>
                </div>
            `).join('')}
        </div>`;
    }

    if (mgr) {
        container.innerHTML = `
            ${overdueHtml}
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value">${data.total_cases}</div><div class="stat-label">案件总数</div></div>
                <div class="stat-card warning"><div class="stat-value">${data.pending_review}</div><div class="stat-label">待初审</div></div>
                <div class="stat-card accent"><div class="stat-value">${data.in_correction}</div><div class="stat-label">补正中</div></div>
                <div class="stat-card success"><div class="stat-value">${data.accepted}</div><div class="stat-label">办理中</div></div>
                <div class="stat-card"><div class="stat-value">${data.closed}</div><div class="stat-label">已结案</div></div>
                <div class="stat-card"><div class="stat-value">${data.today_registered}</div><div class="stat-label">今日登记</div></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>案件状态分布</h3></div>
                ${chartHtml || '<div class="empty-state"><p>暂无数据</p></div>'}
            </div>
            <div class="card">
                <div class="card-header"><h3>最近案件</h3></div>
                ${renderRecentCasesTable(data.recent_cases)}
            </div>`;
    } else {
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card warning"><div class="stat-value">${data.pending_review}</div><div class="stat-label">待初审</div></div>
                <div class="stat-card accent"><div class="stat-value">${data.in_correction}</div><div class="stat-label">补正中</div></div>
                <div class="stat-card"><div class="stat-value">${data.total_cases}</div><div class="stat-label">案件总数</div></div>
                <div class="stat-card"><div class="stat-value">${data.today_registered}</div><div class="stat-label">今日登记</div></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>待办案件</h3></div>
                ${renderRecentCasesTable(data.recent_cases)}
            </div>`;
    }
}

function renderRecentCasesTable(cases) {
    return `<div class="table-wrapper">
        <table>
            <thead><tr><th>案件编号</th><th>申请人</th><th>类型</th><th>状态</th><th>登记时间</th><th>操作</th></tr></thead>
            <tbody>
            ${cases.length ? cases.map(c => `
                <tr>
                    <td>${c.case_number}</td>
                    <td>${escapeHtml(c.applicant_name)}</td>
                    <td>${c.case_type}</td>
                    <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                    <td>${formatDateTime(c.created_at)}</td>
                    <td><button class="btn btn-sm btn-outline" onclick="navigateTo('case-detail', ${c.id})">详情</button></td>
                </tr>
            `).join('') : '<tr><td colspan="6" class="empty-state">暂无案件</td></tr>'}
            </tbody>
        </table>
    </div>`;
}

async function loadCases() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
        <div class="toolbar">
            <input type="search" id="case-keyword" placeholder="搜索编号/姓名/身份证" style="width:240px;" onkeyup="searchCases()">
            <select id="case-status-filter" onchange="searchCases()">
                <option value="">全部状态</option>
                ${isManager()
                    ? ['待初审','材料补正中','已初审','已分派律师','律师已接案','办理中','已结案','已撤回'].map(s => `<option value="${s}">${s}</option>`).join('')
                    : ['待初审','材料补正中'].map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <button class="btn btn-primary" onclick="navigateTo('new-case')">➕ 新增登记</button>
        </div>
        <div class="card" id="cases-table-card">
            <div class="table-wrapper" id="cases-table"></div>
        </div>`;

    await searchCases();
}

async function searchCases() {
    const keyword = document.getElementById('case-keyword')?.value || '';
    const status = document.getElementById('case-status-filter')?.value || '';
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (status) params.set('status', status);

    const data = await api(`/cases?${params.toString()}`);
    if (!data) return;

    const tableEl = document.getElementById('cases-table');
    if (!tableEl) return;

    const mgr = isManager();
    const showLawyerCol = mgr;

    tableEl.innerHTML = `
        <table>
            <thead><tr>
                <th>案件编号</th><th>申请人</th><th>类型</th><th>状态</th><th>材料进度</th>
                ${showLawyerCol ? '<th>律师</th>' : ''}
                <th>更新时间</th><th>操作</th>
            </tr></thead>
            <tbody>
            ${data.cases.length ? data.cases.map(c => `
                <tr class="clickable-row" onclick="navigateTo('case-detail', ${c.id})">
                    <td>${c.case_number}</td>
                    <td>${escapeHtml(c.applicant_name)}</td>
                    <td>${c.case_type}</td>
                    <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                    <td>${c.material_progress}</td>
                    ${showLawyerCol ? `<td>${c.lawyer_name || '-'}</td>` : ''}
                    <td>${formatDateTime(c.updated_at)}</td>
                    <td><button class="btn btn-sm btn-outline" onclick="event.stopPropagation();navigateTo('case-detail', ${c.id})">详情</button></td>
                </tr>
            `).join('') : `<tr><td colspan="${showLawyerCol ? 8 : 7}" style="text-align:center;padding:40px;color:var(--text-light);">暂无案件</td></tr>`}
            </tbody>
        </table>
        ${data.total > data.per_page ? `<div class="pagination"><span class="page-info">共 ${data.total} 条 · 第 ${data.page} 页</span></div>` : ''}`;
}

function loadNewCase() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
        <div class="card">
            <div class="card-header"><h3>来访登记</h3></div>
            <div class="form-row">
                <div class="form-group">
                    <label>申请人姓名 <span class="required">*</span></label>
                    <input type="text" id="nc-name" placeholder="请输入申请人姓名">
                </div>
                <div class="form-group">
                    <label>身份证号码</label>
                    <input type="text" id="nc-idnumber" placeholder="请输入身份证号码">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>联系电话</label>
                    <input type="tel" id="nc-phone" placeholder="请输入联系电话">
                </div>
                <div class="form-group">
                    <label>案件类型 <span class="required">*</span></label>
                    <select id="nc-type" onchange="updateMaterialPreview()">
                        <option value="">请选择案件类型</option>
                        ${['民事','刑事','行政','劳动争议','婚姻家庭','交通事故','房屋纠纷','其他'].map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>住址</label>
                <input type="text" id="nc-address" placeholder="请输入住址">
            </div>
            <div class="form-group">
                <label>案件描述</label>
                <textarea id="nc-description" rows="4" placeholder="请简要描述案件情况"></textarea>
            </div>
            <div id="material-preview"></div>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-primary btn-lg" onclick="submitNewCase()">提交登记</button>
                <button class="btn btn-outline btn-lg" onclick="navigateTo('cases')">取消</button>
            </div>
        </div>`;
}

function updateMaterialPreview() {
    const type = document.getElementById('nc-type').value;
    const preview = document.getElementById('material-preview');
    if (!type) { preview.innerHTML = ''; return; }
    const materials = {
        '民事': ['身份证复印件', '低保证/经济困难证明', '案件相关证据材料', '授权委托书'],
        '刑事': ['身份证复印件', '低保证/经济困难证明', '案件相关材料', '公检法指定函'],
        '行政': ['身份证复印件', '低保证/经济困难证明', '行政决定书', '相关证据材料'],
        '劳动争议': ['身份证复印件', '低保证/经济困难证明', '劳动合同', '工资流水/欠条'],
        '婚姻家庭': ['身份证复印件', '低保证/经济困难证明', '结婚证', '相关证据材料'],
        '交通事故': ['身份证复印件', '低保证/经济困难证明', '事故认定书', '医疗费用清单'],
        '房屋纠纷': ['身份证复印件', '低保证/经济困难证明', '房屋产权证明', '租赁合同/相关材料'],
        '其他': ['身份证复印件', '低保证/经济困难证明', '案件相关材料']
    };
    const mats = materials[type] || materials['其他'];
    preview.innerHTML = `
        <div class="section-title">系统将自动生成以下必需材料清单</div>
        <ul style="list-style:none;padding:0;">
            ${mats.map((m, i) => `<li style="padding:4px 0;"><span class="tag tag-required">必需</span> ${m}</li>`).join('')}
        </ul>`;
}

async function submitNewCase() {
    const name = document.getElementById('nc-name').value.trim();
    const caseType = document.getElementById('nc-type').value;
    if (!name) { toast('请输入申请人姓名', 'error'); return; }
    if (!caseType) { toast('请选择案件类型', 'error'); return; }

    const data = {
        applicant_name: name,
        id_number: document.getElementById('nc-idnumber').value.trim(),
        phone: document.getElementById('nc-phone').value.trim(),
        address: document.getElementById('nc-address').value.trim(),
        case_type: caseType,
        case_description: document.getElementById('nc-description').value.trim(),
        extra_materials: []
    };

    const result = await api('/cases', { method: 'POST', body: data });
    if (result) {
        toast(`登记成功！案件编号：${result.case_number}`, 'success');
        navigateTo('case-detail', result.id);
    }
}

async function loadCaseDetail(caseId) {
    const data = await api(`/cases/${caseId}`);
    if (!data) return;

    const container = document.getElementById('page-content');
    const mgr = isManager();

    const materialsHtml = data.materials.map(m => {
        const statusClass = m.status;
        const statusText = { pending: '未提交', received: '已接收', rejected: '不合格' }[m.status] || m.status;
        return `
        <div class="material-item">
            <div class="mat-name">
                <span class="tag ${m.is_required ? 'tag-required' : 'tag-optional'}">${m.is_required ? '必需' : '补充'}</span>
                ${escapeHtml(m.name)}
                <span class="material-status ${statusClass}">${statusText}</span>
                ${m.notes ? `<span style="color:var(--danger);font-size:12px;">（${escapeHtml(m.notes)}）</span>` : ''}
            </div>
            <div class="mat-actions">
                ${m.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="markMaterialReceived(${m.id})">接收</button><button class="btn btn-sm btn-danger" onclick="markMaterialRejected(${m.id})">不合格</button>` : ''}
                ${m.status === 'rejected' ? `<button class="btn btn-sm btn-success" onclick="markMaterialReceived(${m.id})">重新接收</button>` : ''}
                ${!m.is_required ? `<button class="btn btn-sm btn-outline" onclick="deleteMaterial(${m.id}, ${caseId})">删除</button>` : ''}
            </div>
        </div>`;
    }).join('');

    const correctionsHtml = data.corrections.map(c => {
        const isOverdue = c.status !== 'resolved' && new Date(c.deadline) < new Date();
        return `
        <div class="correction-card ${isOverdue ? 'overdue' : ''}">
            <div class="corr-header">
                <div>
                    <strong>补正通知 #${c.id}</strong>
                    <span class="material-status ${c.status === 'resolved' ? 'received' : c.status === 'partially_resolved' ? 'pending' : 'pending'}">
                        ${{ resolved: '已解决', partially_resolved: '部分解决', pending: '待补正' }[c.status] || c.status}
                    </span>
                    ${mgr && isOverdue ? '<span style="color:var(--danger);font-weight:600;">⚠️ 已超期</span>' : ''}
                </div>
                <div>
                    <span style="font-size:12px;color:var(--text-light);">通知日：${formatDate(c.notice_date)} · 截止日：${formatDate(c.deadline)}</span>
                    <button class="btn btn-sm btn-outline" onclick="exportCorrection(${caseId}, ${c.id})">📄 导出通知</button>
                </div>
            </div>
            ${c.notes ? `<p style="font-size:13px;color:var(--text-light);margin-bottom:8px;">${escapeHtml(c.notes)}</p>` : ''}
            <ul class="corr-items">
                ${c.items.map(item => `
                    <li class="corr-item ${item.is_resolved ? 'resolved' : ''}">
                        <label class="checkbox-label">
                            <input type="checkbox" ${item.is_resolved ? 'checked disabled' : ''} onchange="toggleCorrectionItem(${c.id}, ${item.id}, this.checked)">
                            ${item.is_resolved ? '✓' : '○'} ${escapeHtml(item.description)}
                        </label>
                    </li>
                `).join('')}
            </ul>
        </div>`;
    }).join('');

    let assignmentsHtml = '';
    if (mgr) {
        assignmentsHtml = data.assignments.map(a => `
            <div class="assignment-card">
                <div>
                    <strong>${escapeHtml(a.lawyer_name)}</strong>
                    ${a.lawyer_specialty ? `（${escapeHtml(a.lawyer_specialty)}）` : ''}
                    <span class="assign-status ${a.status}">${{ pending: '待接受', accepted: '已接受', rejected: '已拒绝', withdrawn: '已撤回' }[a.status] || a.status}</span>
                    <div style="font-size:12px;color:var(--text-light);">分派时间：${formatDateTime(a.assigned_at)}${a.accepted_at ? ' · 接受时间：' + formatDateTime(a.accepted_at) : ''}</div>
                </div>
                <div>
                    ${a.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="acceptAssignment(${a.id}, ${caseId})">确认接案</button><button class="btn btn-sm btn-danger" onclick="rejectAssignment(${a.id}, ${caseId})">拒绝</button>` : ''}
                </div>
            </div>
        `).join('');
    } else if (data.assignments.length > 0) {
        const accepted = data.assignments.find(a => a.status === 'accepted');
        if (accepted) {
            assignmentsHtml = `<div class="info-item"><div class="label">承办律师</div><div class="value">${escapeHtml(accepted.lawyer_name)}${accepted.lawyer_specialty ? '（' + escapeHtml(accepted.lawyer_specialty) + '）' : ''}</div></div>`;
        }
    }

    const progressHtml = data.progress.map(p => `
        <div class="timeline-item">
            <div class="time">${formatDateTime(p.created_at)}</div>
            <div class="event">${p.to_status}${p.from_status ? `（由"${p.from_status}"变更）` : ''}</div>
            ${p.note ? `<div class="detail">${escapeHtml(p.note)}</div>` : ''}
            ${mgr && p.operator_name ? `<div class="detail">操作人：${escapeHtml(p.operator_name)}</div>` : ''}
        </div>
    `).join('');

    const nextStatuses = getNextStatuses(data.status, mgr);

    container.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:16px;">
            <button class="btn btn-outline" onclick="navigateTo('cases')">← 返回列表</button>
            <button class="btn btn-outline" onclick="exportRegistration(${caseId})">📄 导出登记表</button>
        </div>

        <div class="card">
            <div class="card-header">
                <h3>案件 ${data.case_number}</h3>
                <span class="status-badge status-${data.status}" style="font-size:14px;">${data.status}</span>
            </div>
            <div class="info-grid">
                <div class="info-item"><div class="label">申请人</div><div class="value">${escapeHtml(data.applicant_name)}</div></div>
                <div class="info-item"><div class="label">身份证号</div><div class="value">${escapeHtml(data.id_number) || '-'}</div></div>
                <div class="info-item"><div class="label">联系电话</div><div class="value">${escapeHtml(data.phone) || '-'}</div></div>
                <div class="info-item"><div class="label">住址</div><div class="value">${escapeHtml(data.address) || '-'}</div></div>
                <div class="info-item"><div class="label">案件类型</div><div class="value">${data.case_type}</div></div>
                <div class="info-item"><div class="label">登记时间</div><div class="value">${formatDateTime(data.created_at)}</div></div>
            </div>
            ${data.case_description ? `<div style="margin-top:12px;padding:12px;background:#f7f9fb;border-radius:6px;font-size:13px;"><strong>案件描述：</strong>${escapeHtml(data.case_description)}</div>` : ''}
            ${nextStatuses.length ? `
                <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
                    <span style="font-size:13px;font-weight:500;">变更状态：</span>
                    ${nextStatuses.map(s => `<button class="btn btn-sm btn-primary" style="margin-left:6px;" onclick="changeCaseStatus(${caseId}, '${s}')">${s}</button>`).join('')}
                </div>` : ''}
        </div>

        <div class="case-detail-grid">
            <div class="card">
                <div class="card-header">
                    <h3>材料清单</h3>
                    <button class="btn btn-sm btn-outline" onclick="addMaterialModal(${caseId})">添加材料</button>
                </div>
                <div class="material-list" id="material-list-${caseId}">
                    ${materialsHtml || '<div class="empty-state"><p>暂无材料</p></div>'}
                </div>
            </div>

            <div>
                <div class="card">
                    <div class="card-header">
                        <h3>补正通知</h3>
                        <button class="btn btn-sm btn-warning" onclick="createCorrectionModal(${caseId})">生成补正通知</button>
                    </div>
                    ${correctionsHtml || '<div class="empty-state"><p>暂无补正通知</p></div>'}
                </div>

                ${mgr ? `
                <div class="card">
                    <div class="card-header">
                        <h3>律师分派</h3>
                        ${data.status !== '律师已接案' && data.status !== '办理中' && data.status !== '已结案' ? `<button class="btn btn-sm btn-primary" onclick="assignLawyerModal(${caseId})">分派律师</button>` : ''}
                    </div>
                    ${assignmentsHtml || '<div class="empty-state"><p>暂无律师分派</p></div>'}
                </div>
                ` : (assignmentsHtml ? `<div class="card"><div class="card-header"><h3>承办律师</h3></div><div style="padding:4px 0;">${assignmentsHtml}</div></div>` : '')}
            </div>
        </div>

        <div class="card full-width" style="margin-top:0;">
            <div class="card-header"><h3>办理进度</h3></div>
            <div class="progress-timeline">
                ${progressHtml || '<div class="empty-state"><p>暂无进度记录</p></div>'}
            </div>
        </div>`;
}

function getNextStatuses(currentStatus, isMgr) {
    if (!isMgr) {
        const staffFlow = {
            '待初审': ['材料补正中', '已初审'],
            '材料补正中': ['已初审'],
        };
        return staffFlow[currentStatus] || [];
    }
    const flow = {
        '待初审': ['材料补正中', '已初审'],
        '材料补正中': ['已初审'],
        '已初审': ['已分派律师'],
        '已分派律师': ['律师已接案'],
        '律师已接案': ['办理中'],
        '办理中': ['已结案', '已撤回'],
    };
    return flow[currentStatus] || [];
}

async function markMaterialReceived(materialId) {
    const result = await api(`/materials/${materialId}`, { method: 'PUT', body: { status: 'received' } });
    if (result) { toast('材料已标记为接收', 'success'); reloadCurrentDetail(); }
}

async function markMaterialRejected(materialId) {
    const notes = prompt('请输入不合格原因：');
    if (notes === null) return;
    const result = await api(`/materials/${materialId}`, { method: 'PUT', body: { status: 'rejected', notes } });
    if (result) { toast('材料已标记为不合格', 'success'); reloadCurrentDetail(); }
}

async function deleteMaterial(materialId, caseId) {
    if (!confirm('确定要删除此材料吗？')) return;
    const result = await api(`/materials/${materialId}`, { method: 'DELETE' });
    if (result) { toast('材料已删除', 'success'); navigateTo('case-detail', caseId); }
}

async function toggleCorrectionItem(correctionId, itemId, checked) {
    if (!checked) return;
    const result = await api(`/corrections/${correctionId}/resolve`, {
        method: 'PUT',
        body: { resolved_items: [itemId] }
    });
    if (result) { toast('补正项已标记为解决', 'success'); reloadCurrentDetail(); }
}

async function changeCaseStatus(caseId, newStatus) {
    const note = prompt(`将案件状态变更为"${newStatus}"，备注（可选）：`);
    if (note === null) return;
    const result = await api(`/cases/${caseId}/status`, { method: 'PUT', body: { status: newStatus, note: note || '' } });
    if (result) { toast(`状态已变更为"${newStatus}"`, 'success'); reloadCurrentDetail(); }
}

async function acceptAssignment(assignmentId, caseId) {
    const result = await api(`/assignments/${assignmentId}/accept`, { method: 'PUT' });
    if (result) { toast('律师已确认接案', 'success'); navigateTo('case-detail', caseId); }
}

async function rejectAssignment(assignmentId, caseId) {
    const note = prompt('拒绝原因：');
    if (note === null) return;
    const result = await api(`/assignments/${assignmentId}/reject`, { method: 'PUT', body: { note } });
    if (result) { toast('律师已拒绝接案', 'success'); navigateTo('case-detail', caseId); }
}

function addMaterialModal(caseId) {
    showModal('添加材料', `
        <div class="form-group">
            <label>材料名称 <span class="required">*</span></label>
            <input type="text" id="add-mat-name" placeholder="请输入材料名称">
        </div>
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" id="add-mat-required"> 必需材料
            </label>
        </div>
        <div class="form-group">
            <label>备注</label>
            <input type="text" id="add-mat-notes" placeholder="可选备注">
        </div>
    `, async () => {
        const name = document.getElementById('add-mat-name').value.trim();
        if (!name) { toast('请输入材料名称', 'error'); return false; }
        const result = await api(`/cases/${caseId}/materials`, {
            method: 'POST',
            body: {
                name,
                is_required: document.getElementById('add-mat-required').checked,
                notes: document.getElementById('add-mat-notes').value.trim()
            }
        });
        if (result) { toast('材料已添加', 'success'); closeModal(); reloadCurrentDetail(); return true; }
        return false;
    });
}

async function createCorrectionModal(caseId) {
    const caseData = await api(`/cases/${caseId}`);
    if (!caseData) return;

    const pendingMaterials = caseData.materials.filter(m => m.status === 'pending' || m.status === 'rejected');

    showModal('生成补正通知', `
        <div class="form-row">
            <div class="form-group">
                <label>通知日期</label>
                <input type="date" id="corr-notice-date" value="${new Date().toISOString().slice(0, 10)}">
            </div>
            <div class="form-group">
                <label>补正期限</label>
                <input type="date" id="corr-deadline" value="${new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)}">
            </div>
        </div>
        <div class="form-group">
            <label>备注</label>
            <input type="text" id="corr-notes" placeholder="可选备注">
        </div>
        <div class="form-group">
            <label>补正项目</label>
            <div id="corr-items-list">
                ${pendingMaterials.length ? pendingMaterials.map(m => `
                    <label class="checkbox-label" style="display:block;padding:4px 0;">
                        <input type="checkbox" class="corr-mat-check" value="${m.id}" data-name="${escapeHtml(m.name)}" checked>
                        ${escapeHtml(m.name)}${m.status === 'rejected' ? `（不合格：${escapeHtml(m.notes)}）` : ''}
                    </label>
                `).join('') : '<p style="color:var(--text-light);font-size:13px;">无待补正材料，可手动添加描述</p>'}
            </div>
            <div style="margin-top:8px;">
                <input type="text" id="corr-custom-item" placeholder="自定义补正项描述，按回车添加" style="width:100%;" onkeydown="if(event.key==='Enter'){event.preventDefault();addCustomCorrItem();}">
            </div>
        </div>
    `, async () => {
        const noticeDate = document.getElementById('corr-notice-date').value;
        const deadline = document.getElementById('corr-deadline').value;
        if (!noticeDate || !deadline) { toast('请填写通知日期和补正期限', 'error'); return false; }

        const items = [];
        document.querySelectorAll('.corr-mat-check:checked').forEach(cb => {
            items.push({ material_id: parseInt(cb.value), description: cb.dataset.name + '：请尽快提交' });
        });
        document.querySelectorAll('.corr-custom-item-desc').forEach(el => {
            if (el.value.trim()) items.push({ description: el.value.trim() });
        });

        if (items.length === 0) { toast('请至少选择一项补正内容', 'error'); return false; }

        const result = await api(`/cases/${caseId}/corrections`, {
            method: 'POST',
            body: {
                notice_date: noticeDate,
                deadline,
                notes: document.getElementById('corr-notes').value.trim(),
                items
            }
        });
        if (result) { toast('补正通知已生成', 'success'); closeModal(); reloadCurrentDetail(); return true; }
        return false;
    });
}

function addCustomCorrItem() {
    const input = document.getElementById('corr-custom-item');
    const desc = input.value.trim();
    if (!desc) return;
    const list = document.getElementById('corr-items-list');
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0;';
    div.innerHTML = `<input type="text" class="corr-custom-item-desc" value="${escapeHtml(desc)}" style="flex:1;"><button class="btn btn-sm btn-outline" onclick="this.parentElement.remove()">删除</button>`;
    list.appendChild(div);
    input.value = '';
}

async function assignLawyerModal(caseId) {
    if (!isManager()) { toast('权限不足', 'error'); return; }
    const lawyers = await api('/lawyers');
    if (!lawyers) return;

    const availableLawyers = lawyers.lawyers.filter(l => l.status === 'available' || l.status === 'busy');
    showModal('分派律师', `
        <div class="form-group">
            <label>选择律师 <span class="required">*</span></label>
            <select id="assign-lawyer-id">
                <option value="">请选择律师</option>
                ${availableLawyers.map(l => `<option value="${l.id}">${escapeHtml(l.name)}（${l.specialty || '未指定专业'} · ${l.status === 'available' ? '空闲' : '忙碌'}）</option>`).join('')}
            </select>
        </div>
    `, async () => {
        const lawyerId = document.getElementById('assign-lawyer-id').value;
        if (!lawyerId) { toast('请选择律师', 'error'); return false; }
        const result = await api(`/cases/${caseId}/assign`, {
            method: 'POST',
            body: { lawyer_id: parseInt(lawyerId) }
        });
        if (result) { toast('律师已分派', 'success'); closeModal(); reloadCurrentDetail(); return true; }
        return false;
    });
}

async function loadLawyers() {
    if (!isManager()) { toast('权限不足', 'error'); navigateTo('dashboard'); return; }
    const data = await api('/lawyers');
    if (!data) return;
    const container = document.getElementById('page-content');

    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-primary" onclick="addLawyerModal()">➕ 添加律师</button>
        </div>
        <div class="card">
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>姓名</th><th>电话</th><th>专业领域</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                    ${data.lawyers.map(l => `
                        <tr>
                            <td>${escapeHtml(l.name)}</td>
                            <td>${escapeHtml(l.phone) || '-'}</td>
                            <td>${escapeHtml(l.specialty) || '-'}</td>
                            <td><span class="material-status ${l.status === 'available' ? 'received' : 'pending'}">${l.status === 'available' ? '空闲' : l.status === 'busy' ? '忙碌' : '离线'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline" onclick="editLawyerModal(${l.id}, '${escapeHtml(l.name)}', '${escapeHtml(l.phone)}', '${escapeHtml(l.specialty)}', '${l.status}')">编辑</button>
                            </td>
                        </tr>
                    `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

function addLawyerModal() {
    showModal('添加律师', `
        <div class="form-group"><label>姓名 <span class="required">*</span></label><input type="text" id="lawyer-name"></div>
        <div class="form-group"><label>电话</label><input type="tel" id="lawyer-phone"></div>
        <div class="form-group"><label>专业领域</label><input type="text" id="lawyer-specialty"></div>
        <div class="form-group"><label>状态</label><select id="lawyer-status"><option value="available">空闲</option><option value="busy">忙碌</option><option value="offline">离线</option></select></div>
    `, async () => {
        const name = document.getElementById('lawyer-name').value.trim();
        if (!name) { toast('请输入姓名', 'error'); return false; }
        const result = await api('/lawyers', {
            method: 'POST',
            body: {
                name,
                phone: document.getElementById('lawyer-phone').value.trim(),
                specialty: document.getElementById('lawyer-specialty').value.trim(),
                status: document.getElementById('lawyer-status').value
            }
        });
        if (result) { toast('律师已添加', 'success'); closeModal(); loadLawyers(); return true; }
        return false;
    });
}

function editLawyerModal(id, name, phone, specialty, status) {
    showModal('编辑律师', `
        <div class="form-group"><label>姓名</label><input type="text" id="lawyer-name" value="${escapeHtml(name)}"></div>
        <div class="form-group"><label>电话</label><input type="tel" id="lawyer-phone" value="${escapeHtml(phone)}"></div>
        <div class="form-group"><label>专业领域</label><input type="text" id="lawyer-specialty" value="${escapeHtml(specialty)}"></div>
        <div class="form-group"><label>状态</label><select id="lawyer-status"><option value="available" ${status==='available'?'selected':''}>空闲</option><option value="busy" ${status==='busy'?'selected':''}>忙碌</option><option value="offline" ${status==='offline'?'selected':''}>离线</option></select></div>
    `, async () => {
        const result = await api(`/lawyers/${id}`, {
            method: 'PUT',
            body: {
                name: document.getElementById('lawyer-name').value.trim(),
                phone: document.getElementById('lawyer-phone').value.trim(),
                specialty: document.getElementById('lawyer-specialty').value.trim(),
                status: document.getElementById('lawyer-status').value
            }
        });
        if (result) { toast('律师信息已更新', 'success'); closeModal(); loadLawyers(); return true; }
        return false;
    });
}

async function loadOverdue() {
    if (!isManager()) { toast('权限不足', 'error'); navigateTo('dashboard'); return; }
    const data = await api('/overdue');
    if (!data) return;
    const container = document.getElementById('page-content');

    const overdue = data.overdue_corrections;
    container.innerHTML = `
        <div class="card">
            <div class="card-header"><h3>⚠️ 超期未补材料</h3></div>
            ${overdue.length ? `
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>案件编号</th><th>申请人</th><th>电话</th><th>补正截止</th><th>超期天数</th><th>操作</th></tr></thead>
                        <tbody>
                        ${overdue.map(c => {
                            const days = Math.floor((new Date() - new Date(c.deadline)) / 86400000);
                            return `
                            <tr>
                                <td>${c.case_number}</td>
                                <td>${escapeHtml(c.applicant_name)}</td>
                                <td>${escapeHtml(c.phone) || '-'}</td>
                                <td>${formatDate(c.deadline)}</td>
                                <td><span style="color:var(--danger);font-weight:600;">${days}天</span></td>
                                <td><button class="btn btn-sm btn-primary" onclick="navigateTo('case-detail', ${c.case_id})">查看案件</button></td>
                            </tr>`;
                        }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<div class="empty-state"><p>🎉 暂无超期案件</p></div>'}
        </div>`;
}

function exportRegistration(caseId) {
    apiDownload(`/cases/${caseId}/export/registration`);
}

function exportCorrection(caseId, correctionId) {
    apiDownload(`/cases/${caseId}/export/correction/${correctionId}`);
}

let currentDetailCaseId = null;

function reloadCurrentDetail() {
    if (currentDetailCaseId) {
        navigateTo('case-detail', currentDetailCaseId);
    }
}

function showModal(title, bodyHtml, onConfirm) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">${bodyHtml}</div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="closeModal()">取消</button>
                <button class="btn btn-primary" id="modal-confirm-btn">确定</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    document.getElementById('modal-confirm-btn').addEventListener('click', async () => {
        const result = await onConfirm();
        if (result !== false) closeModal();
    });
}

function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
}

async function init() {
    const user = await api('/me');
    if (user) {
        currentUser = user;
        renderApp();
    } else {
        showLogin();
    }
}

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const loginBtn = document.querySelector('.login-box .btn-primary');
        if (loginBtn && document.querySelector('.login-page')) {
            doLogin();
        }
    }
});

const originalNavigateTo = navigateTo;
navigateTo = function(page, params) {
    if (page === 'case-detail' && params) {
        currentDetailCaseId = params;
    }
    originalNavigateTo(page, params);
};
