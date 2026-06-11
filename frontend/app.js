const API_BASE = 'http://localhost:8080/api';
let currentUser = null;
let currentView = 'dashboard';
let modalCallback = null;
let currentSurveyId = null;
let currentPlanId = null;

const STATUS_MAP = {
  PENDING: { label: '待处理', color: 'status-pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  IN_PROGRESS: { label: '处理中', color: 'status-progress', bg: 'bg-blue-100', text: 'text-blue-800' },
  SUBMITTED: { label: '已提交', color: 'status-submitted', bg: 'bg-purple-100', text: 'text-purple-800' },
  REVIEWING: { label: '审核中', color: 'status-reviewing', bg: 'bg-orange-100', text: 'text-orange-800' },
  APPROVED: { label: '已通过', color: 'status-approved', bg: 'bg-green-100', text: 'text-green-800' },
  REJECTED: { label: '已拒绝', color: 'status-rejected', bg: 'bg-red-100', text: 'text-red-800' },
  STUCK: { label: '已卡住', color: 'status-stuck', bg: 'bg-red-100', text: 'text-red-800' },
  CUSTOMER_REVIEWING: { label: '客户审核中', color: 'status-customer', bg: 'bg-cyan-100', text: 'text-cyan-800' },
  CONFIRMED: { label: '已确认', color: 'status-confirmed', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  REVISED: { label: '已修改', color: 'status-revised', bg: 'bg-indigo-100', text: 'text-indigo-800' }
};

const AUDIT_ACTION_LABELS = {
  CREATE: '创建',
  UPDATE: '更新',
  STATUS_CHANGE: '状态变更',
  ADD_REMARK: '添加备注',
  ASSIGN: '分配',
  APPROVE: '通过',
  REJECT: '拒绝',
  SUBMIT: '提交',
  VIEW: '查看',
  UNSTICK: '解除卡住',
  MARK_STUCK: '标记卡住'
};

function getStatusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-800' };
  return `<span class="status-badge ${s.bg} ${s.text}">${s.label}</span>`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatMoney(amount) {
  return '¥' + (amount || 0).toLocaleString('zh-CN');
}

function getStuckHours(stuckAt) {
  if (!stuckAt) return 0;
  return Math.floor((Date.now() - new Date(stuckAt).getTime()) / (1000 * 60 * 60));
}

async function api(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(currentUser && currentUser.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
  };
  
  try {
    const res = await fetch(API_BASE + url, {
      headers,
      ...options
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || '请求失败');
    }
    return data;
  } catch (e) {
    if (e.message.includes('认证令牌') || e.message.includes('401') || e.message.includes('403')) {
      if (!url.includes('/auth/login')) {
        logout();
        return null;
      }
    }
    throw e;
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showModal(title, bodyHtml, confirmCallback, confirmBtnText = '确认') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-confirm-btn').textContent = confirmBtnText;
  document.getElementById('modal').classList.remove('hidden');
  modalCallback = confirmCallback;
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  modalCallback = null;
}

function modalConfirmAction() {
  if (modalCallback) modalCallback();
  closeModal();
}

async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  
  if (!username || !password) {
    errorEl.textContent = '请输入用户名和密码';
    errorEl.classList.remove('hidden');
    return;
  }
  
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    currentUser = data.data;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('main-view').classList.remove('hidden');
    document.getElementById('user-info').textContent = `欢迎，${currentUser.realName}（${getRoleLabel(currentUser.role)}）`;
    
    showToast('登录成功');
    showView('dashboard');
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.classList.remove('hidden');
  }
}

function getRoleLabel(role) {
  const labels = {
    PROJECT_MANAGER: '项目经理',
    CONSTRUCTION_LEADER: '施工队长',
    AFTER_SALES_ENGINEER: '售后工程师'
  };
  return labels[role] || role;
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('main-view').classList.add('hidden');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('login-error').classList.add('hidden');
}

function showView(viewName) {
  currentView = viewName;
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });
  
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  
  const mainNavViews = ['dashboard', 'surveys', 'plans'];
  if (mainNavViews.includes(viewName)) {
    document.getElementById(`${viewName}-view`).classList.remove('hidden');
    mainNavViews.forEach(v => document.getElementById(`${v}-view`).classList.toggle('hidden', v !== viewName));
    
    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'surveys') renderSurveys();
    if (viewName === 'plans') renderPlans();
  } else {
    document.getElementById(`${viewName}-view`).classList.remove('hidden');
  }
}

async function renderDashboard() {
  const view = document.getElementById('dashboard-view');
  view.innerHTML = '<div class="text-center py-8"><div class="loading"></div><p class="mt-2 text-gray-500">加载中...</p></div>';
  
  try {
    const [stuckData, surveys, plans] = await Promise.all([
      api('/dashboard/stuck'),
      api('/surveys'),
      api('/plans')
    ]);
    
    const stuck = stuckData.data;
    const mySurveys = surveys.data.filter(s => s.assignedTo?.id === currentUser.userId).length;
    const myPlans = plans.data.filter(p => p.assignedTo?.id === currentUser.userId).length;
    
    view.innerHTML = `
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">卡住看板</h2>
        <p class="text-gray-500">实时监控所有卡住的点位勘察单和方案确认单</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="stat-card">
          <div class="stat-value text-red-600">${stuck.totalStuckSurveys}</div>
          <div class="stat-label">卡住的勘察单</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-red-600">${stuck.totalStuckPlans}</div>
          <div class="stat-label">卡住的方案单</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-orange-500">${stuck.potentialStuckSurveys + stuck.potentialStuckPlans}</div>
          <div class="stat-label">超时预警（24h无更新）</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-blue-600">${mySurveys + myPlans}</div>
          <div class="stat-label">分配给我的</div>
        </div>
      </div>
      
      ${stuck.stuckSurveys.length > 0 || stuck.stuckPlans.length > 0 ? `
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">🔴 已卡住的单子</h3>
          ${stuck.stuckSurveys.map(s => `
            <div class="card stuck-alert mb-3 cursor-pointer" onclick="showSurveyDetail(${s.id})">
              <div class="card-body">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">勘察</span>
                      <span class="font-medium">${s.projectCode} - ${s.projectName}</span>
                    </div>
                    <div class="text-sm text-gray-600 mt-1">${s.stuckReason}</div>
                  </div>
                  <div class="text-right">
                    ${getStatusBadge('STUCK')}
                    <div class="text-xs text-gray-500 mt-1">已卡住 ${getStuckHours(s.stuckAt)} 小时</div>
                    <div class="text-xs text-gray-500">处理人：${s.assignedToName}</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
          ${stuck.stuckPlans.map(p => `
            <div class="card stuck-alert mb-3 cursor-pointer" onclick="showPlanDetail(${p.id})">
              <div class="card-body">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">方案</span>
                      <span class="font-medium">${p.projectCode} - ${p.projectName}</span>
                    </div>
                    <div class="text-sm text-gray-600 mt-1">${p.stuckReason}</div>
                  </div>
                  <div class="text-right">
                    ${getStatusBadge('STUCK')}
                    <div class="text-xs text-gray-500 mt-1">已卡住 ${getStuckHours(p.stuckAt)} 小时</div>
                    <div class="text-xs text-gray-500">处理人：${p.assignedToName}</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${stuck.potentialStuckSurveys > 0 || stuck.potentialStuckPlans > 0 ? `
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-4">🟠 超时预警（超过24小时无更新）</h3>
          <div class="card potential-stuck">
            <div class="card-body">
              <p class="text-gray-600">
                有 ${stuck.potentialStuckSurveys} 个勘察单、${stuck.potentialStuckPlans} 个方案单超过24小时无更新，
                <a href="#" onclick="showView('surveys')" class="text-blue-600 hover:underline">去查看→</a>
              </p>
            </div>
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="card-body text-center py-12">
            <div class="text-5xl mb-4">🎉</div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">没有卡住的单子</h3>
            <p class="text-gray-500">所有项目都在正常推进中</p>
          </div>
        </div>
      `}
    `;
  } catch (e) {
    showToast('加载失败: ' + e.message, 'error');
    view.innerHTML = `<div class="text-center py-8 text-red-500">加载失败: ${e.message}</div>`;
  }
}

async function renderSurveys() {
  const view = document.getElementById('surveys-view');
  view.innerHTML = '<div class="text-center py-8"><div class="loading"></div><p class="mt-2 text-gray-500">加载中...</p></div>';
  
  try {
    const data = await api('/surveys');
    const surveys = data.data;
    
    view.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 mb-1">点位勘察</h2>
          <p class="text-gray-500">管理所有点位勘察单的状态流转和处理过程</p>
        </div>
        ${currentUser.role === 'PROJECT_MANAGER' || currentUser.role === 'CONSTRUCTION_LEADER' ? `
          <button class="btn btn-primary" onclick="showNewSurveyForm()">+ 新建勘察单</button>
        ` : ''}
      </div>
      
      <div class="mb-4 flex gap-4 flex-wrap">
        <select id="survey-filter-status" onchange="renderSurveys()" class="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部状态</option>
          ${Object.keys(STATUS_MAP).slice(0, 7).map(k => `<option value="${k}">${STATUS_MAP[k].label}</option>`).join('')}
        </select>
        <select id="survey-filter-mine" onchange="renderSurveys()" class="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部单子</option>
          <option value="true">分配给我的</option>
        </select>
        <input type="text" id="survey-search" placeholder="搜索项目名称/编号..." oninput="renderSurveys()" class="px-3 py-2 border rounded-lg text-sm flex-1 min-w-48">
      </div>
      
      <div class="card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>项目编号</th>
              <th>项目名称</th>
              <th>客户</th>
              <th>点数</th>
              <th>状态</th>
              <th>处理人</th>
              <th>截止日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="surveys-table-body">
            ${renderSurveysTableBody(surveys)}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    showToast('加载失败: ' + e.message, 'error');
  }
}

function renderSurveysTableBody(surveys) {
  const statusFilter = document.getElementById('survey-filter-status')?.value || '';
  const mineFilter = document.getElementById('survey-filter-mine')?.value || '';
  const search = document.getElementById('survey-search')?.value || '';
  
  let filtered = surveys;
  if (statusFilter) filtered = filtered.filter(s => s.status === statusFilter);
  if (mineFilter === 'true') filtered = filtered.filter(s => s.assignedTo?.id === currentUser.userId);
  if (search) filtered = filtered.filter(s => 
    s.projectName.includes(search) || s.projectCode.includes(search)
  );
  
  if (filtered.length === 0) {
    return `<tr><td colspan="8" class="text-center py-12 text-gray-500">没有找到匹配的勘察单</td></tr>`;
  }
  
  return filtered.map(s => `
    <tr class="${s.stuck ? 'bg-red-50' : ''}">
      <td class="font-mono text-sm">${s.projectCode}</td>
      <td class="font-medium">
        ${s.projectName}
        ${s.stuck ? '<span class="ml-2 text-xs text-red-600">🔴 已卡住</span>' : ''}
      </td>
      <td>${s.customerName || '-'}</td>
      <td>${s.pointCount || 0} 个</td>
      <td>${getStatusBadge(s.status)}</td>
      <td>${s.assignedTo?.realName || '-'}</td>
      <td>${formatDate(s.deadline)}</td>
      <td>
        <button onclick="showSurveyDetail(${s.id})" class="btn btn-sm btn-outline">查看</button>
        ${renderSurveyActions(s)}
      </td>
    </tr>
  `).join('');
}

function renderSurveyActions(s) {
  const actions = [];
  const isPM = currentUser.role === 'PROJECT_MANAGER';
  const isLeader = currentUser.role === 'CONSTRUCTION_LEADER';
  const isAssigned = s.assignedTo?.id === currentUser.userId;
  
  if ((s.status === 'PENDING' || s.status === 'IN_PROGRESS') && (isAssigned || isLeader || isPM)) {
    actions.push(`<button onclick="submitSurvey(${s.id})" class="btn btn-sm btn-primary">提交</button>`);
  }
  if ((s.status === 'SUBMITTED' || s.status === 'REVIEWING') && isPM) {
    actions.push(`<button onclick="approveSurvey(${s.id})" class="btn btn-sm btn-success">通过</button>`);
    actions.push(`<button onclick="rejectSurvey(${s.id})" class="btn btn-sm btn-danger">拒绝</button>`);
  }
  if (s.status !== 'STUCK' && !s.stuck) {
    actions.push(`<button onclick="markSurveyStuck(${s.id})" class="btn btn-sm btn-warning">卡住</button>`);
  }
  if (s.stuck) {
    actions.push(`<button onclick="unstickSurvey(${s.id})" class="btn btn-sm btn-success">解除</button>`);
  }
  
  return actions.join(' ');
}

async function renderPlans() {
  const view = document.getElementById('plans-view');
  view.innerHTML = '<div class="text-center py-8"><div class="loading"></div><p class="mt-2 text-gray-500">加载中...</p></div>';
  
  try {
    const data = await api('/plans');
    const plans = data.data;
    
    view.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 mb-1">方案确认</h2>
          <p class="text-gray-500">管理方案确认、客户审核和备注继承</p>
        </div>
        ${currentUser.role === 'PROJECT_MANAGER' || currentUser.role === 'CONSTRUCTION_LEADER' ? `
          <button class="btn btn-primary" onclick="showNewPlanForm()">+ 新建方案</button>
        ` : ''}
      </div>
      
      <div class="mb-4 flex gap-4 flex-wrap">
        <select id="plan-filter-status" onchange="renderPlans()" class="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部状态</option>
          ${['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'CUSTOMER_REVIEWING', 'CONFIRMED', 'REJECTED', 'REVISED', 'STUCK'].map(k => `<option value="${k}">${STATUS_MAP[k].label}</option>`).join('')}
        </select>
        <select id="plan-filter-mine" onchange="renderPlans()" class="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部单子</option>
          <option value="true">分配给我的</option>
        </select>
        <input type="text" id="plan-search" placeholder="搜索项目名称/编号..." oninput="renderPlans()" class="px-3 py-2 border rounded-lg text-sm flex-1 min-w-48">
      </div>
      
      <div class="card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>项目编号</th>
              <th>项目名称</th>
              <th>预算</th>
              <th>工期</th>
              <th>状态</th>
              <th>处理人</th>
              <th>继承备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="plans-table-body">
            ${renderPlansTableBody(plans)}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    showToast('加载失败: ' + e.message, 'error');
  }
}

function renderPlansTableBody(plans) {
  const statusFilter = document.getElementById('plan-filter-status')?.value || '';
  const mineFilter = document.getElementById('plan-filter-mine')?.value || '';
  const search = document.getElementById('plan-search')?.value || '';
  
  let filtered = plans;
  if (statusFilter) filtered = filtered.filter(p => p.status === statusFilter);
  if (mineFilter === 'true') filtered = filtered.filter(p => p.assignedTo?.id === currentUser.userId);
  if (search) filtered = filtered.filter(p => 
    p.projectName.includes(search) || p.projectCode.includes(search)
  );
  
  if (filtered.length === 0) {
    return `<tr><td colspan="8" class="text-center py-12 text-gray-500">没有找到匹配的方案确认单</td></tr>`;
  }
  
  return filtered.map(p => `
    <tr class="${p.stuck ? 'bg-red-50' : ''}">
      <td class="font-mono text-sm">${p.projectCode}</td>
      <td class="font-medium">
        ${p.projectName}
        ${p.stuck ? '<span class="ml-2 text-xs text-red-600">🔴 已卡住</span>' : ''}
      </td>
      <td>${formatMoney(p.estimatedCost)}</td>
      <td>${p.constructionDays || 0} 天</td>
      <td>${getStatusBadge(p.status)}</td>
      <td>${p.assignedTo?.realName || '-'}</td>
      <td>
        <span class="text-sm ${p.surveyId ? 'text-green-600' : 'text-gray-400'}">
          ${p.surveyId ? '✓ 已继承' : '-'}
        </span>
      </td>
      <td>
        <button onclick="showPlanDetail(${p.id})" class="btn btn-sm btn-outline">查看</button>
        ${renderPlanActions(p)}
      </td>
    </tr>
  `).join('');
}

function renderPlanActions(p) {
  const actions = [];
  const isPM = currentUser.role === 'PROJECT_MANAGER';
  const isLeader = currentUser.role === 'CONSTRUCTION_LEADER';
  const isAssigned = p.assignedTo?.id === currentUser.userId;
  
  if ((p.status === 'PENDING' || p.status === 'IN_PROGRESS' || p.status === 'REVISED') && (isAssigned || isLeader || isPM)) {
    actions.push(`<button onclick="submitPlan(${p.id})" class="btn btn-sm btn-primary">提交</button>`);
  }
  if ((p.status === 'SUBMITTED' || p.status === 'CUSTOMER_REVIEWING') && isPM) {
    actions.push(`<button onclick="confirmPlan(${p.id})" class="btn btn-sm btn-success">确认</button>`);
    actions.push(`<button onclick="rejectPlan(${p.id})" class="btn btn-sm btn-danger">拒绝</button>`);
  }
  if (p.status === 'REJECTED' && (isLeader || isPM || isAssigned)) {
    actions.push(`<button onclick="revisePlan(${p.id})" class="btn btn-sm btn-warning">修改重提</button>`);
  }
  if (p.status !== 'STUCK' && !p.stuck) {
    actions.push(`<button onclick="markPlanStuck(${p.id})" class="btn btn-sm btn-warning">卡住</button>`);
  }
  if (p.stuck) {
    actions.push(`<button onclick="unstickPlan(${p.id})" class="btn btn-sm btn-success">解除</button>`);
  }
  
  return actions.join(' ');
}

async function showSurveyDetail(id) {
  currentSurveyId = id;
  
  try {
    const isManager = currentUser.role === 'PROJECT_MANAGER' || currentUser.role === 'CONSTRUCTION_LEADER';
    
    if (!window.userList && isManager) {
      const usersRes = await api('/users').catch(() => ({ data: [] }));
      window.userList = usersRes.data || [];
    }
    
    const [surveyRes, remarksRes, auditRes] = await Promise.all([
      api(`/surveys/${id}`),
      api(`/surveys/${id}/remarks`),
      currentUser.role === 'PROJECT_MANAGER' ? api(`/audit/SURVEY/${id}`) : { data: [] }
    ]);
    
    const survey = surveyRes.data;
    const remarks = remarksRes.data;
    const audits = auditRes.data || [];
    
    currentView = 'survey-detail';
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('survey-detail-view').classList.remove('hidden');
    
    document.getElementById('survey-detail-view').innerHTML = `
      <div class="mb-4">
        <button onclick="showView('surveys')" class="text-blue-600 hover:underline mb-2 inline-block">← 返回勘察单列表</button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <div class="card-header flex justify-between items-center">
              <span>点位勘察单详情</span>
              ${survey.stuck ? '<span class="text-red-600 text-sm">🔴 已卡住</span>' : ''}
            </div>
            <div class="card-body">
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div class="text-sm text-gray-500">项目编号</div>
                  <div class="font-mono font-medium">${survey.projectCode}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">项目名称</div>
                  <div class="font-medium">${survey.projectName}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">客户名称</div>
                  <div>${survey.customerName || '-'}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">地址</div>
                  <div>${survey.address || '-'}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">点位数量</div>
                  <div class="text-lg font-semibold text-blue-600">${survey.pointCount || 0} 个</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">状态</div>
                  <div>${getStatusBadge(survey.status)}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">创建人</div>
                  <div>${survey.createdBy?.realName || '-'}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">处理人</div>
                  ${isManager ? `
                    <div class="flex gap-2">
                      <select id="survey-assignee" class="flex-1 px-2 py-1 border rounded text-sm">
                        <option value="">未分配</option>
                        ${(window.userList || []).map(u => 
                          `<option value="${u.id}" ${survey.assignedTo?.id === u.id ? 'selected' : ''}>${u.realName} (${getRoleLabel(u.role)})</option>`
                        ).join('')}
                      </select>
                      <button onclick="assignSurvey(${survey.id})" class="btn btn-sm btn-primary">分配</button>
                    </div>
                  ` : `
                    <div>${survey.assignedTo?.realName || '-'}</div>
                  `}
                </div>
              </div>
              
              <div class="mb-4">
                <div class="text-sm text-gray-500 mb-1">点位描述</div>
                <div class="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">${survey.pointDescription || '-'}</div>
              </div>
              
              ${survey.stuck ? `
                <div class="stuck-alert p-4 rounded-lg">
                  <div class="font-medium text-red-800 mb-1">🔴 卡住原因</div>
                  <div class="text-red-700 text-sm">${survey.stuckReason}</div>
                  <div class="text-xs text-red-500 mt-1">卡住时间：${formatDateTime(survey.stuckAt)}</div>
                </div>
              ` : ''}
              
              <div class="mt-6 flex flex-wrap gap-2">
                ${renderSurveyActions(survey)}
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">历史备注</div>
            <div class="card-body">
              ${remarks.length === 0 ? `
                <div class="text-center py-8 text-gray-500">暂无备注</div>
              ` : remarks.map(r => `
                <div class="remark-item">
                  <div class="remark-header">
                    <span class="font-medium">${r.createdByName}</span>
                    <span>${formatDateTime(r.createdAt)}</span>
                  </div>
                  <div class="remark-content">${r.content}</div>
                </div>
              `).join('')}
              
              <div class="mt-4">
                <textarea id="survey-new-remark" placeholder="添加备注..." class="w-full px-3 py-2 border rounded-lg text-sm" rows="2"></textarea>
                <button onclick="addSurveyRemark(${id})" class="btn btn-sm btn-primary mt-2">发送备注</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="space-y-6">
          <div class="card">
            <div class="card-header">快速操作</div>
            <div class="card-body space-y-2">
              ${survey.status === 'APPROVED' ? `
                <button onclick="showNewPlanFormForSurvey(${survey.id})" class="w-full btn btn-success">
                  📋 创建方案确认单
                </button>
              ` : ''}
              <button onclick="renderSurveys(); showView('surveys')" class="w-full btn btn-outline">
                刷新数据
              </button>
            </div>
          </div>
          
          ${currentUser.role === 'PROJECT_MANAGER' ? `
            <div class="card">
              <div class="card-header">审计日志 <span class="text-xs text-gray-400">(仅项目经理可见)</span></div>
              <div class="card-body max-h-96 overflow-y-auto">
                ${audits.length === 0 ? `
                  <div class="text-center py-4 text-gray-500 text-sm">暂无审计记录</div>
                ` : audits.map(a => `
                  <div class="audit-item">
                    <div class="audit-dot"></div>
                    <div class="audit-content">
                      <div class="audit-header">
                        <span class="audit-action">${AUDIT_ACTION_LABELS[a.action] || a.action}</span>
                        <span class="audit-time">${formatDateTime(a.performedAt)}</span>
                      </div>
                      <div class="text-xs text-gray-500 mb-1">${a.performedByName}</div>
                      <div class="audit-detail">${a.detail || a.newValue || ''}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  } catch (e) {
    showToast('加载详情失败: ' + e.message, 'error');
  }
}

async function showPlanDetail(id) {
  currentPlanId = id;
  
  try {
    const isManager = currentUser.role === 'PROJECT_MANAGER' || currentUser.role === 'CONSTRUCTION_LEADER';
    
    if (!window.userList && isManager) {
      const usersRes = await api('/users').catch(() => ({ data: [] }));
      window.userList = usersRes.data || [];
    }
    
    const [planRes, remarksRes, auditRes] = await Promise.all([
      api(`/plans/${id}`),
      api(`/plans/${id}/remarks`),
      currentUser.role === 'PROJECT_MANAGER' ? api(`/audit/PLAN/${id}`) : { data: [] }
    ]);
    
    const plan = planRes.data;
    const remarks = remarksRes.data;
    const audits = auditRes.data || [];
    
    const inheritedRemarks = remarks.filter(r => r.inherited);
    const normalRemarks = remarks.filter(r => !r.inherited);
    
    currentView = 'plan-detail';
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('plan-detail-view').classList.remove('hidden');
    
    document.getElementById('plan-detail-view').innerHTML = `
      <div class="mb-4">
        <button onclick="showView('plans')" class="text-blue-600 hover:underline mb-2 inline-block">← 返回方案确认列表</button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <div class="card-header flex justify-between items-center">
              <span>方案确认单详情</span>
              ${plan.stuck ? '<span class="text-red-600 text-sm">🔴 已卡住</span>' : ''}
            </div>
            <div class="card-body">
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div class="text-sm text-gray-500">项目编号</div>
                  <div class="font-mono font-medium">${plan.projectCode}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">项目名称</div>
                  <div class="font-medium">${plan.projectName}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">关联勘察单</div>
                  <div>
                    ${plan.survey ? `
                      <a href="#" onclick="showSurveyDetail(${plan.surveyId})" class="text-blue-600 hover:underline">
                        ${plan.survey.projectCode}
                      </a>
                    ` : '-'}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">状态</div>
                  <div>${getStatusBadge(plan.status)}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">预算金额</div>
                  <div class="text-lg font-semibold text-green-600">${formatMoney(plan.estimatedCost)}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">预计工期</div>
                  <div>${plan.constructionDays || 0} 天</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">创建人</div>
                  <div>${plan.createdBy?.realName || '-'}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">处理人</div>
                  ${isManager ? `
                    <div class="flex gap-2">
                      <select id="plan-assignee" class="flex-1 px-2 py-1 border rounded text-sm">
                        <option value="">未分配</option>
                        ${(window.userList || []).map(u => 
                          `<option value="${u.id}" ${plan.assignedTo?.id === u.id ? 'selected' : ''}>${u.realName} (${getRoleLabel(u.role)})</option>`
                        ).join('')}
                      </select>
                      <button onclick="assignPlan(${plan.id})" class="btn btn-sm btn-primary">分配</button>
                    </div>
                  ` : `
                    <div>${plan.assignedTo?.realName || '-'}</div>
                  `}
                </div>
              </div>
              
              <div class="mb-4">
                <div class="text-sm text-gray-500 mb-1">方案内容</div>
                <div class="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">${plan.planContent || '-'}</div>
              </div>
              
              <div class="mb-4">
                <div class="text-sm text-gray-500 mb-1">设备清单</div>
                <div class="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">${plan.equipmentList || '-'}</div>
              </div>
              
              ${plan.stuck ? `
                <div class="stuck-alert p-4 rounded-lg">
                  <div class="font-medium text-red-800 mb-1">🔴 卡住原因</div>
                  <div class="text-red-700 text-sm">${plan.stuckReason}</div>
                  <div class="text-xs text-red-500 mt-1">卡住时间：${formatDateTime(plan.stuckAt)}</div>
                </div>
              ` : ''}
              
              <div class="mt-6 flex flex-wrap gap-2">
                ${renderPlanActions(plan)}
              </div>
            </div>
          </div>
          
          ${inheritedRemarks.length > 0 ? `
            <div class="card">
              <div class="card-header">
                继承自勘察的备注 
                <span class="inherited-tag">勘察阶段</span>
              </div>
              <div class="card-body">
                ${inheritedRemarks.map(r => `
                  <div class="remark-item inherited">
                    <div class="remark-header">
                      <span class="font-medium">${r.createdByName}</span>
                      <span>${formatDateTime(r.createdAt)}</span>
                    </div>
                    <div class="remark-content">${r.content}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="card">
            <div class="card-header">方案阶段备注</div>
            <div class="card-body">
              ${normalRemarks.length === 0 ? `
                <div class="text-center py-8 text-gray-500">暂无方案阶段备注</div>
              ` : normalRemarks.map(r => `
                <div class="remark-item">
                  <div class="remark-header">
                    <span class="font-medium">${r.createdByName}</span>
                    <span>${formatDateTime(r.createdAt)}</span>
                  </div>
                  <div class="remark-content">${r.content}</div>
                </div>
              `).join('')}
              
              <div class="mt-4">
                <textarea id="plan-new-remark" placeholder="添加备注..." class="w-full px-3 py-2 border rounded-lg text-sm" rows="2"></textarea>
                <button onclick="addPlanRemark(${id})" class="btn btn-sm btn-primary mt-2">发送备注</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="space-y-6">
          <div class="card">
            <div class="card-header">快速操作</div>
            <div class="card-body space-y-2">
              ${plan.surveyId ? `
                <button onclick="showSurveyDetail(${plan.surveyId})" class="w-full btn btn-outline">
                  📋 查看关联勘察单
                </button>
              ` : ''}
              <button onclick="renderPlans(); showView('plans')" class="w-full btn btn-outline">
                刷新数据
              </button>
            </div>
          </div>
          
          ${currentUser.role === 'PROJECT_MANAGER' ? `
            <div class="card">
              <div class="card-header">审计日志 <span class="text-xs text-gray-400">(仅项目经理可见)</span></div>
              <div class="card-body max-h-96 overflow-y-auto">
                ${audits.length === 0 ? `
                  <div class="text-center py-4 text-gray-500 text-sm">暂无审计记录</div>
                ` : audits.map(a => `
                  <div class="audit-item">
                    <div class="audit-dot"></div>
                    <div class="audit-content">
                      <div class="audit-header">
                        <span class="audit-action">${AUDIT_ACTION_LABELS[a.action] || a.action}</span>
                        <span class="audit-time">${formatDateTime(a.performedAt)}</span>
                      </div>
                      <div class="text-xs text-gray-500 mb-1">${a.performedByName}</div>
                      <div class="audit-detail">${a.detail || a.newValue || ''}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  } catch (e) {
    showToast('加载详情失败: ' + e.message, 'error');
  }
}

async function showNewSurveyForm() {
  currentView = 'survey-detail';
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById('survey-detail-view').classList.remove('hidden');
  
  const users = await api('/users').catch(() => ({ data: [] }));
  
  document.getElementById('survey-detail-view').innerHTML = `
    <div class="mb-4">
      <button onclick="showView('surveys')" class="text-blue-600 hover:underline mb-2 inline-block">← 返回勘察单列表</button>
    </div>
    
    <div class="card">
      <div class="card-header">新建点位勘察单</div>
      <div class="card-body">
        <div class="grid grid-cols-2 gap-4">
          <div class="input-group">
            <label>项目编号 *</label>
            <input type="text" id="new-survey-code" placeholder="例如：AX-2026-008">
          </div>
          <div class="input-group">
            <label>项目名称 *</label>
            <input type="text" id="new-survey-name" placeholder="请输入项目名称">
          </div>
          <div class="input-group">
            <label>客户名称</label>
            <input type="text" id="new-survey-customer" placeholder="请输入客户名称">
          </div>
          <div class="input-group">
            <label>地址</label>
            <input type="text" id="new-survey-address" placeholder="请输入地址">
          </div>
          <div class="input-group">
            <label>点位数量</label>
            <input type="number" id="new-survey-points" placeholder="请输入点位数量" value="0">
          </div>
          <div class="input-group">
            <label>分配给</label>
            <select id="new-survey-assignee">
              <option value="">请选择处理人</option>
              ${users.data.map(u => `<option value="${u.id}">${u.realName} (${getRoleLabel(u.role)})</option>`).join('')}
            </select>
          </div>
        </div>
        
        <div class="input-group">
          <label>点位描述</label>
          <textarea id="new-survey-desc" rows="4" placeholder="请描述点位分布情况..."></textarea>
        </div>
        
        <div class="input-group">
          <label>初始备注</label>
          <textarea id="new-survey-remark" rows="2" placeholder="可添加备注..."></textarea>
        </div>
        
        <div class="flex justify-end gap-3">
          <button onclick="showView('surveys')" class="btn btn-outline">取消</button>
          <button onclick="createSurvey()" class="btn btn-primary">创建勘察单</button>
        </div>
      </div>
    </div>
  `;
}

async function showNewPlanForm(surveyId = null) {
  currentView = 'plan-new';
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById('plan-new-view').classList.remove('hidden');
  
  try {
    const [surveysRes, usersRes] = await Promise.all([
      api('/surveys'),
      api('/users').catch(() => ({ data: [] }))
    ]);
    
    const approvedSurveys = surveysRes.data.filter(s => s.status === 'APPROVED');
    
    document.getElementById('plan-new-view').innerHTML = `
      <div class="mb-4">
        <button onclick="showView('plans')" class="text-blue-600 hover:underline mb-2 inline-block">← 返回方案确认列表</button>
      </div>
      
      <div class="card">
        <div class="card-header">新建方案确认单</div>
        <div class="card-body">
          <div class="input-group">
            <label>关联勘察单 *</label>
            <select id="new-plan-survey" onchange="onSurveySelected(this.value)">
              <option value="">请选择已通过的勘察单</option>
              ${approvedSurveys.map(s => `
                <option value="${s.id}" ${surveyId === s.id ? 'selected' : ''}>
                  ${s.projectCode} - ${s.projectName} (${s.pointCount}个点位)
                </option>
              `).join('')}
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="input-group">
              <label>项目编号 *</label>
              <input type="text" id="new-plan-code" placeholder="自动填充或手动输入">
            </div>
            <div class="input-group">
              <label>项目名称 *</label>
              <input type="text" id="new-plan-name" placeholder="自动填充或手动输入">
            </div>
            <div class="input-group">
              <label>预算金额（元）</label>
              <input type="number" id="new-plan-cost" placeholder="请输入预算金额" value="0">
            </div>
            <div class="input-group">
              <label>预计工期（天）</label>
              <input type="number" id="new-plan-days" placeholder="请输入预计工期" value="0">
            </div>
            <div class="input-group" colspan="2">
              <label>分配给</label>
              <select id="new-plan-assignee">
                <option value="">请选择处理人</option>
                ${usersRes.data.map(u => `<option value="${u.id}">${u.realName} (${getRoleLabel(u.role)})</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div class="input-group">
            <label>
              <input type="checkbox" id="new-plan-inherit" checked>
              继承勘察单的所有备注
              <span class="inherited-tag">自动带入勘察阶段备注</span>
            </label>
          </div>
          
          <div class="input-group">
            <label>方案内容</label>
            <textarea id="new-plan-content" rows="6" placeholder="请输入方案内容..."></textarea>
          </div>
          
          <div class="input-group">
            <label>设备清单</label>
            <textarea id="new-plan-equipment" rows="4" placeholder="请输入设备清单..."></textarea>
          </div>
          
          <div class="input-group">
            <label>初始备注</label>
            <textarea id="new-plan-remark" rows="2" placeholder="可添加备注..."></textarea>
          </div>
          
          <div class="flex justify-end gap-3">
            <button onclick="showView('plans')" class="btn btn-outline">取消</button>
            <button onclick="createPlan()" class="btn btn-primary">创建方案确认单</button>
          </div>
        </div>
      </div>
    `;
    
    if (surveyId) {
      onSurveySelected(surveyId);
    }
  } catch (e) {
    showToast('加载失败: ' + e.message, 'error');
  }
}

function showNewPlanFormForSurvey(surveyId) {
  showNewPlanForm(surveyId);
}

function onSurveySelected(surveyId) {
  if (!surveyId) return;
  
  api('/surveys').then(res => {
    const survey = res.data.find(s => s.id == surveyId);
    if (survey) {
      document.getElementById('new-plan-code').value = survey.projectCode;
      document.getElementById('new-plan-name').value = survey.projectName;
      document.getElementById('new-plan-cost').value = survey.pointCount * 3500;
      document.getElementById('new-plan-days').value = Math.ceil(survey.pointCount / 10) + 5;
      
      document.getElementById('new-plan-content').value = `一、项目概况\n${survey.projectName}安防系统建设方案，共${survey.pointCount}个监控点位。\n\n二、设计依据\n1. GB50348-2018《安全防范工程技术标准》\n2. 现场勘察记录及业主要求\n\n三、系统架构\n采用高清网络视频监控系统。\n\n四、施工方案\n1. 管路敷设：采用镀锌钢管暗敷\n2. 设备安装：摄像头离地2.8米\n3. 系统调试：逐点测试图像质量`;
      
      const count = survey.pointCount;
      document.getElementById('new-plan-equipment').value = `主要设备清单：\n1. 400万像素红外球机：${Math.floor(count / 4)}台\n2. 400万像素红外枪机：${Math.floor(count / 2)}台\n3. 电梯半球：${Math.floor(count / 5)}台\n4. NVR录像机：${Math.floor(count / 60) + 1}台\n5. 4T监控硬盘：${(Math.floor(count / 60) + 1) * 8}块\n6. 交换机：${Math.floor(count / 24) + 1}台`;
    }
  });
}

async function createSurvey() {
  const code = document.getElementById('new-survey-code').value.trim();
  const name = document.getElementById('new-survey-name').value.trim();
  
  if (!code || !name) {
    showToast('项目编号和名称不能为空', 'error');
    return;
  }
  
  try {
    await api('/surveys', {
      method: 'POST',
      body: JSON.stringify({
        projectCode: code,
        projectName: name,
        customerName: document.getElementById('new-survey-customer').value.trim(),
        address: document.getElementById('new-survey-address').value.trim(),
        pointDescription: document.getElementById('new-survey-desc').value.trim(),
        pointCount: parseInt(document.getElementById('new-survey-points').value) || 0,
        assignedToId: parseInt(document.getElementById('new-survey-assignee').value) || null,
        remarkContent: document.getElementById('new-survey-remark').value.trim()
      })
    });
    
    showToast('勘察单创建成功');
    showView('surveys');
  } catch (e) {
    showToast('创建失败: ' + e.message, 'error');
  }
}

async function createPlan() {
  const surveyId = parseInt(document.getElementById('new-plan-survey').value);
  const code = document.getElementById('new-plan-code').value.trim();
  const name = document.getElementById('new-plan-name').value.trim();
  
  if (!surveyId || !code || !name) {
    showToast('请选择关联勘察单，并填写项目编号和名称', 'error');
    return;
  }
  
  try {
    const res = await api('/plans', {
      method: 'POST',
      body: JSON.stringify({
        surveyId,
        projectCode: code,
        projectName: name,
        planContent: document.getElementById('new-plan-content').value.trim(),
        equipmentList: document.getElementById('new-plan-equipment').value.trim(),
        estimatedCost: parseInt(document.getElementById('new-plan-cost').value) || 0,
        constructionDays: parseInt(document.getElementById('new-plan-days').value) || 0,
        assignedToId: parseInt(document.getElementById('new-plan-assignee').value) || null,
        inheritRemarks: document.getElementById('new-plan-inherit').checked,
        remarkContent: document.getElementById('new-plan-remark').value.trim()
      })
    });
    
    showToast('方案确认单创建成功，备注已自动继承');
    showPlanDetail(res.data.id);
  } catch (e) {
    showToast('创建失败: ' + e.message, 'error');
  }
}

async function submitSurvey(id) {
  showModal('提交审核', 
    '<p>确认提交此勘察单进入审核流程吗？</p>' +
    '<div class="input-group mt-3"><label>备注（可选）</label><textarea id="modal-remark" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea></div>',
    async () => {
      const remark = document.getElementById('modal-remark')?.value.trim();
      await api(`/surveys/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ remark })
      });
      showToast('提交成功');
      currentView === 'survey-detail' ? showSurveyDetail(id) : renderSurveys();
    }, '提交审核');
}

async function approveSurvey(id) {
  showModal('审核通过', 
    '<p>确认通过此勘察单吗？通过后可创建方案确认单。</p>' +
    '<div class="input-group mt-3"><label>备注（可选）</label><textarea id="modal-remark" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea></div>',
    async () => {
      const remark = document.getElementById('modal-remark')?.value.trim();
      await api(`/surveys/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ remark })
      });
      showToast('审核通过');
      currentView === 'survey-detail' ? showSurveyDetail(id) : renderSurveys();
    }, '确认通过');
}

async function rejectSurvey(id) {
  showModal('拒绝勘察单', 
    '<p>请说明拒绝原因：</p>' +
    '<div class="input-group"><label>拒绝原因 *</label><textarea id="modal-reason" rows="2" class="w-full px-3 py-2 border rounded-lg" placeholder="请说明拒绝原因"></textarea></div>' +
    '<div class="input-group"><label>备注（可选）</label><textarea id="modal-remark" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea></div>',
    async () => {
      const reason = document.getElementById('modal-reason').value.trim();
      const remark = document.getElementById('modal-remark')?.value.trim();
      if (!reason) { showToast('请填写拒绝原因', 'error'); return; }
      await api(`/surveys/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason, remark })
      });
      showToast('已拒绝');
      currentView === 'survey-detail' ? showSurveyDetail(id) : renderSurveys();
    }, '确认拒绝');
}

async function markSurveyStuck(id) {
  showModal('标记为卡住', 
    '<p>请说明卡住原因：</p>' +
    '<div class="input-group"><label>卡住原因 *</label><textarea id="modal-reason" rows="2" class="w-full px-3 py-2 border rounded-lg" placeholder="请说明卡住原因"></textarea></div>',
    async () => {
      const reason = document.getElementById('modal-reason').value.trim();
      if (!reason) { showToast('请填写卡住原因', 'error'); return; }
      await api(`/surveys/${id}/stuck`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      showToast('已标记为卡住');
      currentView === 'survey-detail' ? showSurveyDetail(id) : renderSurveys();
    }, '标记卡住');
}

async function unstickSurvey(id) {
  showModal('解除卡住状态', 
    '<p>确认解除此勘察单的卡住状态吗？</p>' +
    '<div class="input-group mt-3"><label>备注（可选）</label><textarea id="modal-remark" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea></div>',
    async () => {
      const remark = document.getElementById('modal-remark')?.value.trim();
      await api(`/surveys/${id}/unstick`, {
        method: 'POST',
        body: JSON.stringify({ remark })
      });
      showToast('已解除卡住状态');
      currentView === 'survey-detail' ? showSurveyDetail(id) : renderSurveys();
    }, '确认解除');
}

async function addSurveyRemark(id) {
  const remark = document.getElementById('survey-new-remark').value.trim();
  if (!remark) { showToast('请输入备注内容', 'error'); return; }
  
  try {
    await api(`/surveys/${id}/remarks`, {
      method: 'POST',
      body: JSON.stringify({ remark })
    });
    showSurveyDetail(id);
  } catch (e) {
    showToast('添加备注失败: ' + e.message, 'error');
  }
}

async function assignSurvey(id) {
  const selectEl = document.getElementById('survey-assignee');
  if (!selectEl) return;
  
  const assignedToId = selectEl.value ? parseInt(selectEl.value) : null;
  
  try {
    await api(`/surveys/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedToId })
    });
    showToast('分配成功');
    showSurveyDetail(id);
  } catch (e) {
    showToast('分配失败: ' + e.message, 'error');
  }
}

async function submitPlan(id) {
  showModal('提交客户确认', 
    '<p>确认提交此方案给客户确认吗？</p>' +
    '<div class="input-group mt-3"><label>备注（可选）</label><textarea id="modal-remark" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea></div>',
    async () => {
      const remark = document.getElementById('modal-remark')?.value.trim();
      await api(`/plans/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ remark })
      });
      showToast('已提交客户确认');
      currentView === 'plan-detail' ? showPlanDetail(id) : renderPlans();
    }, '提交');
}

async function confirmPlan(id) {
  showModal('客户确认方案', 
    '<p>确认客户已同意此方案吗？</p>' +
    '<div class="input-group mt-3"><label>备注（可选）</label><textarea id="modal-remark" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea></div>',
    async () => {
      const remark = document.getElementById('modal-remark')?.value.trim();
      await api(`/plans/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ remark })
      });
      showToast('客户已确认方案');
      currentView === 'plan-detail' ? showPlanDetail(id) : renderPlans();
    }, '确认方案');
}

async function rejectPlan(id) {
  showModal('客户拒绝方案', 
    '<p>请说明客户拒绝的原因：</p>' +
    '<div class="input-group"><label>拒绝原因 *</label><textarea id="modal-reason" rows="2" class="w-full px-3 py-2 border rounded-lg" placeholder="请说明拒绝原因"></textarea></div>' +
    '<div class="input-group"><label>备注（可选）</label><textarea id="modal-remark" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea></div>',
    async () => {
      const reason = document.getElementById('modal-reason').value.trim();
      const remark = document.getElementById('modal-remark')?.value.trim();
      if (!reason) { showToast('请填写拒绝原因', 'error'); return; }
      await api(`/plans/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason, remark })
      });
      showToast('客户已拒绝方案');
      currentView === 'plan-detail' ? showPlanDetail(id) : renderPlans();
    }, '确认拒绝');
}

async function revisePlan(id) {
  showModal('修改后重新提交', 
    '<p>确认修改后重新提交此方案吗？</p>' +
    '<div class="input-group mt-3"><label>备注（可选）</label><textarea id="modal-remark" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea></div>',
    async () => {
      const remark = document.getElementById('modal-remark')?.value.trim();
      await api(`/plans/${id}/revise`, {
        method: 'POST',
        body: JSON.stringify({ remark })
      });
      showToast('已修改并重新提交');
      currentView === 'plan-detail' ? showPlanDetail(id) : renderPlans();
    }, '重新提交');
}

async function markPlanStuck(id) {
  showModal('标记为卡住', 
    '<p>请说明卡住原因：</p>' +
    '<div class="input-group"><label>卡住原因 *</label><textarea id="modal-reason" rows="2" class="w-full px-3 py-2 border rounded-lg" placeholder="请说明卡住原因"></textarea></div>',
    async () => {
      const reason = document.getElementById('modal-reason').value.trim();
      if (!reason) { showToast('请填写卡住原因', 'error'); return; }
      await api(`/plans/${id}/stuck`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      showToast('已标记为卡住');
      currentView === 'plan-detail' ? showPlanDetail(id) : renderPlans();
    }, '标记卡住');
}

async function unstickPlan(id) {
  showModal('解除卡住状态', 
    '<p>确认解除此方案的卡住状态吗？</p>' +
    '<div class="input-group mt-3"><label>备注（可选）</label><textarea id="modal-remark" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea></div>',
    async () => {
      const remark = document.getElementById('modal-remark')?.value.trim();
      await api(`/plans/${id}/unstick`, {
        method: 'POST',
        body: JSON.stringify({ remark })
      });
      showToast('已解除卡住状态');
      currentView === 'plan-detail' ? showPlanDetail(id) : renderPlans();
    }, '确认解除');
}

async function addPlanRemark(id) {
  const remark = document.getElementById('plan-new-remark').value.trim();
  if (!remark) { showToast('请输入备注内容', 'error'); return; }
  
  try {
    await api(`/plans/${id}/remarks`, {
      method: 'POST',
      body: JSON.stringify({ remark })
    });
    showPlanDetail(id);
  } catch (e) {
    showToast('添加备注失败: ' + e.message, 'error');
  }
}

async function assignPlan(id) {
  const selectEl = document.getElementById('plan-assignee');
  if (!selectEl) return;
  
  const assignedToId = selectEl.value ? parseInt(selectEl.value) : null;
  
  try {
    await api(`/plans/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedToId })
    });
    showToast('分配成功');
    showPlanDetail(id);
  } catch (e) {
    showToast('分配失败: ' + e.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      document.getElementById('login-view').classList.add('hidden');
      document.getElementById('main-view').classList.remove('hidden');
      document.getElementById('user-info').textContent = `欢迎，${currentUser.realName}（${getRoleLabel(currentUser.role)}）`;
      showView('dashboard');
    } catch (e) {
      localStorage.removeItem('currentUser');
    }
  }
  
  document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
  });
  document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('password').focus();
  });
});
