let currentView = 'dashboard';
let selectedScript = null;
let selectedProject = null;
let approvalModalContext = null;

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initSearch();
    renderDashboard();
    updateStats();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });
}

function switchView(view) {
    currentView = view;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === view) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.view').forEach(v => {
        v.classList.add('hidden');
    });
    document.getElementById('view-' + view).classList.remove('hidden');
    
    switch(view) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'brief':
            renderBriefList();
            break;
        case 'script':
            renderScriptList();
            break;
        case 'flow':
            renderFlowTimeline();
            break;
        case 'archive':
            renderArchiveList();
            break;
    }
}

function updateStats() {
    const urgentProjects = getUrgentProjects();
    const blockedProjects = getBlockedProjects();
    const activeProjects = projects.filter(p => p.status !== 'approved');
    
    document.getElementById('pendingBadge').textContent = urgentProjects.length;
    document.getElementById('totalProjects').textContent = activeProjects.length;
    document.getElementById('blockedCount').textContent = blockedProjects.length;
    document.getElementById('urgentCount').textContent = urgentProjects.length;
    document.getElementById('blockedCardCount').textContent = blockedProjects.length;
    
    const briefs = projects;
    document.getElementById('briefTotal').textContent = briefs.length;
    document.getElementById('briefPending').textContent = briefs.filter(p => p.briefStatus === 'pending').length;
    document.getElementById('briefProgress').textContent = briefs.filter(p => p.briefStatus === 'approved' && p.status !== 'approved').length;
    document.getElementById('briefDone').textContent = briefs.filter(p => p.status === 'approved').length;
}

function renderDashboard() {
    renderUrgentList();
    renderBlockedList();
    renderRecentList();
    renderProjectTable();
}

function renderUrgentList() {
    const urgentProjects = getUrgentProjects();
    const container = document.getElementById('urgentList');
    
    if (urgentProjects.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #8c8c8c;">暂无紧急项目</div>';
        return;
    }
    
    container.innerHTML = urgentProjects.map(p => `
        <div class="list-item" onclick="openProjectDetail('${p.id}')">
            <div class="item-avatar">${getUserAvatar(p.assignee)}</div>
            <div class="item-content">
                <div class="item-title">${p.brand} - ${p.name}</div>
                <div class="item-subtitle">${getUserName(p.assignee)} · ${getRoleName(getUserRole(p.assignee))}</div>
                <span class="item-badge urgent">截止 ${p.deadline}</span>
            </div>
        </div>
    `).join('');
}

function renderBlockedList() {
    const blockedProjects = getBlockedProjects();
    const container = document.getElementById('blockedList');
    
    if (blockedProjects.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #8c8c8c;">暂无卡点项目</div>';
        return;
    }
    
    container.innerHTML = blockedProjects.map(p => `
        <div class="list-item" onclick="openProjectDetail('${p.id}')">
            <div class="item-avatar">${getUserAvatar(p.assignee)}</div>
            <div class="item-content">
                <div class="item-title">${p.brand} - ${p.name}</div>
                <div class="item-subtitle">${getUserName(p.assignee)} · 已卡点 ${p.blockDays} 天</div>
                <div style="font-size: 11px; color: #ff4d4f; margin-top: 4px;">${p.blockedReason}</div>
            </div>
        </div>
    `).join('');
}

function renderRecentList() {
    const recentProjects = getRecentUpdated(8);
    const container = document.getElementById('recentList');
    
    container.innerHTML = recentProjects.map(p => `
        <div class="list-item" onclick="openProjectDetail('${p.id}')">
            <div class="item-avatar">${getUserAvatar(p.updatedBy)}</div>
            <div class="item-content">
                <div class="item-title">${p.brand} - ${p.name}</div>
                <div class="item-subtitle">${getUserName(p.updatedBy)} 刚刚更新</div>
                <div class="item-meta">${p.updatedAt}</div>
            </div>
        </div>
    `).join('');
}

function renderProjectTable() {
    const container = document.getElementById('projectTable');
    const filteredProjects = filterProjects();
    
    let html = `
        <div class="table-row header">
            <div>编号</div>
            <div>品牌</div>
            <div>项目名称</div>
            <div>负责人</div>
            <div>状态</div>
            <div>优先级</div>
            <div>截止日期</div>
            <div>更新时间</div>
        </div>
    `;
    
    html += filteredProjects.map(p => {
        const deadlineClass = getDeadlineClass(p.deadline);
        const role = getUserRole(p.assignee);
        return `
        <div class="table-row" onclick="openProjectDetail('${p.id}')">
            <div class="project-id">${p.id}</div>
            <div class="project-brand">${p.brand}</div>
            <div>
                <div class="project-name">${p.name}</div>
                <div class="project-desc">${p.description}</div>
                ${p.status === 'blocked' ? `<div class="blocked-reason">⚠️ ${p.blockedReason}</div>` : ''}
            </div>
            <div class="assignee-info">
                <span class="assignee-avatar">${getUserAvatar(p.assignee)}</span>
                <div>
                    <div class="assignee-name">${getUserName(p.assignee)}</div>
                    <div class="assignee-role" style="color: ${getRoleColor(role)}">${getRoleName(role)}</div>
                </div>
            </div>
            <div><span class="status-tag ${p.status}">${getStatusName(p.status)}</span></div>
            <div><span class="priority-tag ${p.priority}">${getPriorityName(p.priority)}</span></div>
            <div class="deadline ${deadlineClass}">${p.deadline}</div>
            <div class="updated-time">${formatTime(p.updatedAt)}</div>
        </div>
    `}).join('');
    
    container.innerHTML = html;
}

function getPriorityName(priority) {
    const map = { urgent: '紧急', high: '高', medium: '中', low: '低' };
    return map[priority] || priority;
}

function getDeadlineClass(deadline) {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'danger';
    if (diffDays <= 3) return 'warning';
    return '';
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(' ');
    if (parts.length > 1) {
        return parts[0] + ' ' + parts[1].substring(0, 5);
    }
    return timeStr;
}

function initFilters() {
    document.getElementById('roleFilter').addEventListener('change', renderProjectTable);
    document.getElementById('statusFilter').addEventListener('change', renderProjectTable);
    document.getElementById('timeFilter').addEventListener('change', renderProjectTable);
}

function filterProjects() {
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    const searchText = document.getElementById('globalSearch').value.toLowerCase();
    
    return projects.filter(p => {
        if (roleFilter !== 'all') {
            const role = getUserRole(p.assignee);
            if (role !== roleFilter) return false;
        }
        
        if (statusFilter !== 'all') {
            if (p.status !== statusFilter) return false;
        }
        
        if (timeFilter !== 'all') {
            const days = timeFilter === 'week' ? 7 : 30;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            if (new Date(p.createdAt) < cutoff) return false;
        }
        
        if (searchText) {
            const searchStr = `${p.id} ${p.brand} ${p.name} ${p.description} ${getUserName(p.assignee)}`.toLowerCase();
            if (!searchStr.includes(searchText)) return false;
        }
        
        return true;
    });
}

function resetFilters() {
    document.getElementById('roleFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('timeFilter').value = 'week';
    document.getElementById('globalSearch').value = '';
    renderProjectTable();
}

function initSearch() {
    document.getElementById('globalSearch').addEventListener('input', function() {
        if (currentView === 'dashboard') {
            renderProjectTable();
        }
    });
}

function openProjectDetail(projectId) {
    const project = getProjectById(projectId);
    if (!project) return;
    
    selectedProject = project;
    const panel = document.getElementById('projectDetailPanel');
    const body = document.getElementById('projectDetailBody');
    
    const role = getUserRole(project.assignee);
    
    body.innerHTML = `
        <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
                <div class="detail-label">项目编号</div>
                <div class="detail-value">${project.id}</div>
                <div class="detail-label">品牌</div>
                <div class="detail-value">${project.brand}</div>
                <div class="detail-label">项目名称</div>
                <div class="detail-value">${project.name}</div>
                <div class="detail-label">负责人</div>
                <div class="detail-value">${getUserAvatar(project.assignee)} ${getUserName(project.assignee)} <span style="color: ${getRoleColor(role)}">(${getRoleName(role)})</span></div>
                <div class="detail-label">状态</div>
                <div class="detail-value"><span class="status-tag ${project.status}">${getStatusName(project.status)}</span></div>
                <div class="detail-label">优先级</div>
                <div class="detail-value"><span class="priority-tag ${project.priority}">${getPriorityName(project.priority)}</span></div>
                <div class="detail-label">截止日期</div>
                <div class="detail-value">${project.deadline}</div>
                <div class="detail-label">预算范围</div>
                <div class="detail-value">${project.budget || '未设置'}</div>
                <div class="detail-label">达人类型</div>
                <div class="detail-value">${project.talentType || '未设置'}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Brief需求</h4>
            <div style="padding: 12px; background: #fafafa; border-radius: 6px; font-size: 13px; line-height: 1.6;">
                ${project.description}
            </div>
        </div>
        
        ${project.status === 'blocked' ? `
        <div class="detail-section">
            <h4>卡点信息</h4>
            <div style="padding: 12px; background: #fff1f0; border-radius: 6px; font-size: 13px; color: #ff4d4f;">
                <strong>卡点原因：</strong>${project.blockedReason}<br>
                <strong>已卡时长：</strong>${project.blockDays} 天
            </div>
        </div>
        ` : ''}
        
        ${project.scripts && project.scripts.length > 0 ? `
        <div class="detail-section">
            <h4>脚本版本</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${project.scripts.map(s => `
                    <div style="padding: 10px; background: #fafafa; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${s.version}</strong>
                            <span style="margin-left: 8px; font-size: 12px; color: #8c8c8c;">${s.createdAt}</span>
                        </div>
                        <span class="status-tag ${s.status}">${getStatusName(s.status)}</span>
                    </div>
                    ${s.feedback ? `<div style="padding: 8px 12px; background: #fff1f0; color: #ff4d4f; border-radius: 4px; font-size: 12px; margin-left: 16px;">驳回原因：${s.feedback}</div>` : ''}
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="detail-section">
            <h4>操作记录</h4>
            <div class="history-list">
                ${project.history.map(h => `
                    <div class="history-item">
                        <div class="history-avatar">${getUserAvatar(h.user)}</div>
                        <div class="history-content">
                            <div class="history-action">${getUserName(h.user)} - ${h.action}</div>
                            <div class="history-time">${h.time}</div>
                            ${h.note ? `<div class="history-note">${h.note}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: 24px;">
            <button class="btn btn-primary" onclick="showTransferModalFromProject('${project.id}')">发起流转</button>
            ${project.scripts && project.scripts.length > 0 ? `<button class="btn btn-outline" onclick="viewScriptApprovalFromProject('${project.id}')">查看脚本审批</button>` : ''}
        </div>
    `;
    
    panel.classList.remove('hidden');
}

function viewScriptApprovalFromProject(projectId) {
    const project = getProjectById(projectId);
    if (!project || !project.scripts || project.scripts.length === 0) return;
    
    const latestScriptId = project.scripts[project.scripts.length - 1].id;
    viewScriptApproval(projectId, latestScriptId);
}

function closeProjectDetail() {
    document.getElementById('projectDetailPanel').classList.add('hidden');
    selectedProject = null;
}

function showNewBriefModal() {
    document.getElementById('newBriefModal').classList.remove('hidden');
}

function showTransferModal() {
    const select = document.getElementById('transferProject');
    select.innerHTML = '<option value="">请选择项目</option>' + 
        projects.filter(p => p.status !== 'approved').map(p => 
            `<option value="${p.id}">${p.id} - ${p.brand} ${p.name}</option>`
        ).join('');
    
    document.getElementById('transferModal').classList.remove('hidden');
}

function showTransferModalFromProject(projectId) {
    closeProjectDetail();
    showTransferModal();
    document.getElementById('transferProject').value = projectId;
    onProjectSelectForTransfer();
}

function onProjectSelectForTransfer() {
    const projectId = document.getElementById('transferProject').value;
    if (projectId) {
        const project = getProjectById(projectId);
        if (project) {
            document.getElementById('transferFrom').value = getUserName(project.assignee);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const transferProjectSelect = document.getElementById('transferProject');
    if (transferProjectSelect) {
        transferProjectSelect.addEventListener('change', onProjectSelectForTransfer);
    }
});

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function createNewBrief() {
    const brandName = document.getElementById('newBrandName').value;
    const projectName = document.getElementById('newProjectName').value;
    const assignee = document.getElementById('newAssignee').value;
    const deadline = document.getElementById('newDeadline').value;
    const desc = document.getElementById('newBriefDesc').value;
    const budget = document.getElementById('newBudget').value;
    const talentType = document.getElementById('newTalentType').value;
    
    if (!brandName || !projectName || !assignee) {
        alert('请填写必填项');
        return;
    }
    
    const newId = 'P' + String(projects.length + 1).padStart(3, '0');
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);
    
    const newProject = {
        id: newId,
        brand: brandName,
        name: projectName,
        assignee: assignee,
        status: 'pending',
        priority: 'medium',
        deadline: deadline || '2026-06-30',
        createdAt: now.toISOString().split('T')[0],
        updatedAt: nowStr,
        updatedBy: assignee,
        briefStatus: 'pending',
        scriptStatus: 'pending',
        blockedReason: '',
        blockDays: 0,
        budget: budget,
        talentType: talentType,
        description: desc || '暂无描述',
        history: [
            { time: nowStr, user: assignee, action: '创建Brief', note: '新建项目' }
        ]
    };
    
    projects.unshift(newProject);
    
    closeModal('newBriefModal');
    alert('Brief创建成功！');
    
    document.getElementById('newBrandName').value = '';
    document.getElementById('newProjectName').value = '';
    document.getElementById('newAssignee').value = '';
    document.getElementById('newDeadline').value = '';
    document.getElementById('newBriefDesc').value = '';
    document.getElementById('newBudget').value = '';
    document.getElementById('newTalentType').value = '';
    
    updateStats();
    if (currentView === 'dashboard') {
        renderDashboard();
    } else if (currentView === 'brief') {
        renderBriefList();
    }
}

function submitTransfer() {
    const projectId = document.getElementById('transferProject').value;
    const toUser = document.getElementById('transferTo').value;
    const note = document.getElementById('transferNote').value;
    
    if (!projectId || !toUser) {
        alert('请选择项目和接收人');
        return;
    }
    
    const project = getProjectById(projectId);
    if (!project) return;
    
    const fromUser = project.assignee;
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);
    
    project.assignee = toUser;
    project.updatedAt = nowStr;
    project.updatedBy = toUser;
    project.history.push({
        time: nowStr,
        user: fromUser,
        action: '流转给' + getUserName(toUser),
        note: note
    });
    
    flowRecords.unshift({
        id: 'F' + String(flowRecords.length + 1).padStart(3, '0'),
        projectId: projectId,
        fromUser: fromUser,
        toUser: toUser,
        time: nowStr,
        action: '项目流转',
        note: note
    });
    
    closeModal('transferModal');
    alert('流转成功！');
    
    document.getElementById('transferProject').value = '';
    document.getElementById('transferTo').value = '';
    document.getElementById('transferNote').value = '';
    document.getElementById('transferFrom').value = '';
    
    updateStats();
    if (currentView === 'dashboard') renderDashboard();
    else if (currentView === 'flow') renderFlowTimeline();
}

function renderBriefList() {
    const container = document.getElementById('briefList');
    const filteredProjects = projects;
    
    container.innerHTML = filteredProjects.map(p => {
        const role = getUserRole(p.assignee);
        const steps = getBriefSteps(p);
        
        return `
        <div class="brief-card">
            <div class="brief-card-header">
                <div class="brief-brand">
                    <div>
                        <div class="brief-brand-name">${p.brand}</div>
                        <div class="brief-project-name">${p.id} · ${p.name}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <span class="status-tag ${p.status}">${getStatusName(p.status)}</span>
                    <span class="priority-tag ${p.priority}">${getPriorityName(p.priority)}</span>
                </div>
            </div>
            <div class="brief-card-body">
                <div class="brief-info-grid">
                    <div class="brief-info-item">
                        <span class="brief-info-label">负责人</span>
                        <span class="brief-info-value">${getUserAvatar(p.assignee)} ${getUserName(p.assignee)}</span>
                    </div>
                    <div class="brief-info-item">
                        <span class="brief-info-label">角色</span>
                        <span class="brief-info-value" style="color: ${getRoleColor(role)}">${getRoleName(role)}</span>
                    </div>
                    <div class="brief-info-item">
                        <span class="brief-info-label">截止日期</span>
                        <span class="brief-info-value ${getDeadlineClass(p.deadline)}">${p.deadline}</span>
                    </div>
                    <div class="brief-info-item">
                        <span class="brief-info-label">预算</span>
                        <span class="brief-info-value">${p.budget || '未设置'}</span>
                    </div>
                </div>
                <div class="brief-desc">${p.description}</div>
                ${p.status === 'blocked' ? `<div style="margin-top: 12px; padding: 10px; background: #fff1f0; color: #ff4d4f; border-radius: 4px; font-size: 13px;">⚠️ 卡点：${p.blockedReason}</div>` : ''}
            </div>
            <div class="brief-card-footer">
                <div class="brief-progress">
                    <div class="progress-steps">
                        ${steps.map((s, i) => `
                            <div class="progress-step ${s.status}">${s.icon}</div>
                            ${i < steps.length - 1 ? `<div class="progress-line ${s.status === 'done' ? 'done' : ''}"></div>` : ''}
                        `).join('')}
                    </div>
                </div>
                <div class="brief-actions">
                    <button class="btn btn-outline" onclick="openProjectDetail('${p.id}')">查看详情</button>
                    ${p.briefStatus === 'pending' ? `<button class="btn btn-primary" onclick="approveBrief('${p.id}')">通过Brief</button>` : ''}
                </div>
            </div>
        </div>
    `}).join('');
}

function getBriefSteps(project) {
    const steps = [
        { icon: '📋', status: project.briefStatus === 'pending' ? 'active' : 'done' },
        { icon: '✍️', status: project.scriptStatus !== 'pending' ? 'done' : (project.briefStatus === 'approved' ? 'active' : '') },
        { icon: '👥', status: project.status === 'approved' ? 'done' : (project.scriptStatus === 'approved' ? 'active' : '') },
        { icon: '✅', status: project.status === 'approved' ? 'done' : '' }
    ];
    return steps;
}

function approveBrief(projectId) {
    const project = getProjectById(projectId);
    if (!project) return;
    
    project.briefStatus = 'approved';
    project.status = 'processing';
    
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);
    project.updatedAt = nowStr;
    project.updatedBy = project.assignee;
    project.history.push({
        time: nowStr,
        user: project.assignee,
        action: 'Brief通过',
        note: 'Brief评估通过，开始脚本创作'
    });
    
    alert('Brief已通过！');
    renderBriefList();
    updateStats();
}

function renderScriptList() {
    const container = document.getElementById('scriptList');
    const scriptProjects = projects.filter(p => p.scripts && p.scripts.length > 0);
    
    if (scriptProjects.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #8c8c8c;">暂无脚本数据</div>';
        return;
    }
    
    let html = '';
    scriptProjects.forEach(p => {
        p.scripts.forEach(s => {
            html += `
                <div class="script-item ${selectedScript === s.id ? 'active' : ''}" onclick="selectScript('${p.id}', '${s.id}')">
                    <div class="script-project">${p.brand} - ${p.name}</div>
                    <div>
                        <span class="script-version">${s.version}</span>
                        <span class="status-tag ${s.status}" style="font-size: 11px;">${getStatusName(s.status)}</span>
                    </div>
                    <div class="script-meta">
                        <span>${getUserAvatar(p.assignee)} ${getUserName(p.assignee)}</span>
                        <span>${s.createdAt}</span>
                    </div>
                </div>
            `;
        });
    });
    
    container.innerHTML = html;
}

function selectScript(projectId, scriptId) {
    selectedScript = scriptId;
    renderScriptList();
    renderScriptDetail(projectId, scriptId);
}

function renderScriptDetail(projectId, scriptId) {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const script = project.scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    const container = document.getElementById('scriptDetail');
    const role = getUserRole(project.assignee);
    
    container.innerHTML = `
        <div class="script-detail-header">
            <div class="script-detail-title">${project.brand} - ${project.name}</div>
            <div class="script-detail-meta">
                <span>脚本版本：${script.version}</span>
                <span>状态：<span class="status-tag ${script.status}">${getStatusName(script.status)}</span></span>
                <span>负责人：${getUserName(project.assignee)} (${getRoleName(role)})</span>
                <span>创建时间：${script.createdAt}</span>
            </div>
        </div>
        
        <div class="script-version-history">
            <h4>版本历史</h4>
            ${project.scripts.map(s => `
                <div class="version-item">
                    <span class="version-tag">${s.version}</span>
                    <div class="version-info">
                        <div class="version-time">${s.createdAt} · <span class="status-tag ${s.status}" style="font-size: 11px;">${getStatusName(s.status)}</span></div>
                        ${s.feedback ? `<div class="version-feedback">驳回意见：${s.feedback}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="script-version-history">
            <h4>脚本内容</h4>
            <div class="script-content">
                ${script.content || '脚本内容待完善...'}
            </div>
        </div>
        
        <div style="margin-top: 24px; display: flex; gap: 12px;">
            ${script.status === 'pending' || script.status === 'processing' ? `
                <button class="btn btn-success" onclick="approveScriptAction('${projectId}', '${scriptId}')">审批通过</button>
                <button class="btn btn-danger" onclick="showRejectModal('${projectId}', '${scriptId}')">驳回修改</button>
            ` : ''}
            <button class="btn btn-primary" onclick="viewScriptApproval('${projectId}', '${scriptId}')">完整审批流程</button>
        </div>
    `;
}

function viewScriptApproval(projectId, scriptId) {
    const project = getProjectById(projectId);
    if (!project) return;
    
    let targetScript = null;
    if (scriptId && project.scripts) {
        targetScript = project.scripts.find(s => s.id === scriptId);
    }
    if (!targetScript && project.scripts && project.scripts.length > 0) {
        targetScript = project.scripts[project.scripts.length - 1];
    }
    
    approvalModalContext = {
        projectId: projectId,
        scriptId: targetScript ? targetScript.id : null,
        scriptVersion: targetScript ? targetScript.version : null,
        scriptStatus: targetScript ? targetScript.status : null
    };
    
    const body = document.getElementById('scriptApprovalBody');
    const role = getUserRole(project.assignee);
    
    body.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 12px;">${project.brand} - ${project.name}</h3>
            <div style="color: #8c8c8c;">
                负责人：${getUserName(project.assignee)} (${getRoleName(role)}) · 
                截止日期：${project.deadline}
                ${targetScript ? ` · 当前操作：${targetScript.version} (${getStatusName(targetScript.status)})` : ''}
            </div>
        </div>
        
        <h4 style="margin-bottom: 16px;">审批流程</h4>
        <div class="history-list">
            ${project.history.map(h => `
                <div class="history-item">
                    <div class="history-avatar">${getUserAvatar(h.user)}</div>
                    <div class="history-content">
                        <div class="history-action">${getUserName(h.user)} - ${h.action}</div>
                        <div class="history-time">${h.time}</div>
                        ${h.note ? `<div class="history-note">${h.note}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${project.scripts && project.scripts.length > 0 ? `
            <h4 style="margin: 24px 0 16px;">脚本版本</h4>
            ${project.scripts.map(s => `
                <div style="padding: 16px; background: ${s.id === (targetScript ? targetScript.id : null) ? '#e6f7ff' : '#fafafa'}; border-radius: 6px; margin-bottom: 12px; border: ${s.id === (targetScript ? targetScript.id : null) ? '2px solid #1890ff' : 'none'};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <div>
                            <strong>${s.version}</strong>
                            ${s.id === (targetScript ? targetScript.id : null) ? '<span style="margin-left: 8px; color: #1890ff; font-size: 12px;">← 当前操作</span>' : ''}
                        </div>
                        <span class="status-tag ${s.status}">${getStatusName(s.status)}</span>
                    </div>
                    <div style="font-size: 13px; color: #8c8c8c; margin-bottom: 8px;">${s.createdAt}</div>
                    ${s.feedback ? `<div style="padding: 8px 12px; background: #fff1f0; color: #ff4d4f; border-radius: 4px; font-size: 13px;">驳回意见：${s.feedback}</div>` : ''}
                </div>
            `).join('')}
        ` : ''}
    `;
    
    document.getElementById('scriptApprovalModal').classList.remove('hidden');
}

function approveScriptAction(projectId, scriptId) {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const script = project.scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    script.status = 'approved';
    if (script.feedback) {
        delete script.feedback;
    }
    project.scriptStatus = 'approved';
    project.status = 'processing';
    project.blockedReason = '';
    project.blockDays = 0;
    
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);
    project.updatedAt = nowStr;
    project.updatedBy = project.assignee;
    project.history.push({
        time: nowStr,
        user: project.assignee,
        action: '脚本' + script.version + '通过',
        note: '脚本审批通过，可以开始拍摄执行'
    });
    
    flowRecords.unshift({
        id: 'F' + String(flowRecords.length + 1).padStart(3, '0'),
        projectId: projectId,
        fromUser: project.assignee,
        toUser: project.assignee,
        time: nowStr,
        action: '脚本审批通过',
        note: script.version + ' 脚本通过，进入拍摄执行阶段'
    });
    
    alert('脚本已通过！项目已进入拍摄执行阶段。');
    renderScriptDetail(projectId, scriptId);
    renderScriptList();
    updateStats();
    refreshAllViews();
}

function showRejectModal(projectId, scriptId) {
    const feedback = prompt('请输入驳回意见：');
    if (feedback) {
        rejectScriptAction(projectId, scriptId, feedback);
    }
}

function rejectScriptAction(projectId, scriptId, feedback) {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const script = project.scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    script.status = 'rejected';
    script.feedback = feedback;
    project.scriptStatus = 'blocked';
    project.status = 'blocked';
    project.blockedReason = '脚本' + script.version + '被驳回：' + feedback;
    project.blockDays = 1;
    
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);
    project.updatedAt = nowStr;
    project.updatedBy = project.assignee;
    project.history.push({
        time: nowStr,
        user: project.assignee,
        action: '脚本' + script.version + '驳回',
        note: feedback
    });
    
    flowRecords.unshift({
        id: 'F' + String(flowRecords.length + 1).padStart(3, '0'),
        projectId: projectId,
        fromUser: project.assignee,
        toUser: project.assignee,
        time: nowStr,
        action: '脚本驳回卡点',
        note: script.version + ' 脚本被驳回：' + feedback
    });
    
    alert('脚本已驳回！项目已标记为卡点状态。');
    renderScriptDetail(projectId, scriptId);
    renderScriptList();
    updateStats();
    refreshAllViews();
}

function approveScript() {
    if (!approvalModalContext || !approvalModalContext.projectId) {
        alert('无法获取项目信息，请关闭弹窗后重试');
        return;
    }
    
    const projectId = approvalModalContext.projectId;
    const scriptId = approvalModalContext.scriptId;
    
    const project = getProjectById(projectId);
    if (!project) return;
    
    const script = scriptId ? project.scripts.find(s => s.id === scriptId) : null;
    const scriptVersion = script ? script.version : (approvalModalContext.scriptVersion || '脚本');
    
    if (script) {
        script.status = 'approved';
        if (script.feedback) {
            delete script.feedback;
        }
    }
    project.scriptStatus = 'approved';
    project.status = 'processing';
    project.blockedReason = '';
    project.blockDays = 0;
    
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);
    project.updatedAt = nowStr;
    project.updatedBy = project.assignee;
    project.history.push({
        time: nowStr,
        user: project.assignee,
        action: scriptVersion + '审批通过',
        note: '脚本审批通过，可以开始拍摄执行'
    });
    
    flowRecords.unshift({
        id: 'F' + String(flowRecords.length + 1).padStart(3, '0'),
        projectId: projectId,
        fromUser: project.assignee,
        toUser: project.assignee,
        time: nowStr,
        action: '脚本审批通过',
        note: scriptVersion + ' 通过，项目进入拍摄执行阶段'
    });
    
    closeModal('scriptApprovalModal');
    approvalModalContext = null;
    
    alert(scriptVersion + ' 已通过审批！项目已进入拍摄执行阶段。');
    updateStats();
    refreshAllViews();
}

function rejectScript() {
    if (!approvalModalContext || !approvalModalContext.projectId) {
        alert('无法获取项目信息，请关闭弹窗后重试');
        return;
    }
    
    const feedback = prompt('请输入驳回意见：');
    if (!feedback) return;
    
    const projectId = approvalModalContext.projectId;
    const scriptId = approvalModalContext.scriptId;
    
    const project = getProjectById(projectId);
    if (!project) return;
    
    const script = scriptId ? project.scripts.find(s => s.id === scriptId) : null;
    const scriptVersion = script ? script.version : (approvalModalContext.scriptVersion || '脚本');
    
    if (script) {
        script.status = 'rejected';
        script.feedback = feedback;
    }
    project.scriptStatus = 'blocked';
    project.status = 'blocked';
    project.blockedReason = scriptVersion + '被驳回：' + feedback;
    project.blockDays = 1;
    
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);
    project.updatedAt = nowStr;
    project.updatedBy = project.assignee;
    project.history.push({
        time: nowStr,
        user: project.assignee,
        action: scriptVersion + '驳回',
        note: feedback
    });
    
    flowRecords.unshift({
        id: 'F' + String(flowRecords.length + 1).padStart(3, '0'),
        projectId: projectId,
        fromUser: project.assignee,
        toUser: project.assignee,
        time: nowStr,
        action: '脚本驳回卡点',
        note: scriptVersion + ' 被驳回：' + feedback
    });
    
    closeModal('scriptApprovalModal');
    approvalModalContext = null;
    
    alert(scriptVersion + ' 已驳回！项目已标记为卡点状态，请及时处理。');
    updateStats();
    refreshAllViews();
}

function refreshAllViews() {
    if (currentView === 'dashboard') {
        renderDashboard();
    } else if (currentView === 'brief') {
        renderBriefList();
    } else if (currentView === 'script') {
        renderScriptList();
        if (selectedScript) {
            const project = projects.find(p => p.scripts && p.scripts.some(s => s.id === selectedScript));
            if (project) {
                renderScriptDetail(project.id, selectedScript);
            }
        }
    } else if (currentView === 'flow') {
        renderFlowTimeline();
    } else if (currentView === 'archive') {
        renderArchiveList();
    }
    
    if (selectedProject) {
        const updatedProject = getProjectById(selectedProject.id);
        if (updatedProject) {
            openProjectDetail(updatedProject.id);
        }
    }
}

function renderFlowTimeline() {
    const container = document.getElementById('flowTimeline');
    
    if (flowRecords.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #8c8c8c;">暂无流转记录</div>';
        return;
    }
    
    container.innerHTML = flowRecords.map(f => {
        const project = getProjectById(f.projectId);
        const fromRole = getUserRole(f.fromUser);
        const toRole = getUserRole(f.toUser);
        
        return `
        <div class="timeline-item">
            <div class="timeline-dot">🔄</div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <span class="timeline-project">${project ? project.brand + ' - ' + project.name : '未知项目'}</span>
                    <span class="timeline-time">${f.time}</span>
                </div>
                <div class="timeline-action">${f.action}</div>
                <div class="timeline-transfer">
                    <span>${getUserAvatar(f.fromUser)} ${getUserName(f.fromUser)} <span style="color: ${getRoleColor(fromRole)}">(${getRoleName(fromRole)})</span></span>
                    <span class="transfer-arrow">→</span>
                    <span>${getUserAvatar(f.toUser)} ${getUserName(f.toUser)} <span style="color: ${getRoleColor(toRole)}">(${getRoleName(toRole)})</span></span>
                </div>
                ${f.note ? `<div class="timeline-note">${f.note}</div>` : ''}
            </div>
        </div>
    `}).join('');
}

function renderArchiveList() {
    const container = document.getElementById('archiveList');
    const archived = projects.filter(p => p.status === 'approved' || p.scriptStatus === 'approved');
    
    if (archived.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #8c8c8c;">暂无已完成项目</div>';
        return;
    }
    
    container.innerHTML = archived.map(p => `
        <div class="archive-card" onclick="openProjectDetail('${p.id}')">
            <div class="archive-brand">${p.brand}</div>
            <div class="archive-project">${p.id} · ${p.name}</div>
            <div class="archive-stats">
                <span>📝 ${p.scripts ? p.scripts.length : 0} 个脚本</span>
                <span>📅 ${p.deadline}</span>
            </div>
        </div>
    `).join('');
}

document.addEventListener('click', function(e) {
    const panel = document.getElementById('projectDetailPanel');
    if (!panel.classList.contains('hidden')) {
        if (!panel.contains(e.target) && !e.target.closest('.table-row') && !e.target.closest('.list-item') && !e.target.closest('.brief-card') && !e.target.closest('.archive-card')) {
            if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                closeProjectDetail();
            }
        }
    }
});
