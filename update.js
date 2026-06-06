const fs = require('fs');

// 1. 修改 app.js
let appJS = fs.readFileSync('app.js', 'utf8');

// 添加全局变量和初始化
appJS = appJS.replace(
    `let currentView = 'dashboard';
let selectedScript = null;
let selectedProject = null;
let approvalModalContext = null;

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initSearch();
    renderDashboard();
    updateStats();
});`,
    `let currentView = 'dashboard';
let selectedScript = null;
let selectedProject = null;
let approvalModalContext = null;
let scriptStatusFilter = 'all';
let scriptAssigneeFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initSearch();
    initScriptFilters();
    renderDashboard();
    updateStats();
});`
);

// 替换 renderScriptList 函数
const oldRenderScriptList = `function renderScriptList() {
    const container = document.getElementById('scriptList');
    const scriptProjects = projects.filter(p => p.scripts && p.scripts.length > 0);
    
    if (scriptProjects.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #8c8c8c;">暂无脚本数据</div>';
        return;
    }
    
    let html = '';
    scriptProjects.forEach(p => {
        p.scripts.forEach(s => {
            html += \`
                <div class="script-item \${selectedScript === s.id ? 'active' : ''}" onclick="selectScript('\${p.id}', '\${s.id}')">
                    <div class="script-project">\${p.brand} - \${p.name}</div>
                    <div>
                        <span class="script-version">\${s.version}</span>
                        <span class="status-tag \${s.status}" style="font-size: 11px;">\${getStatusName(s.status)}</span>
                    </div>
                    <div class="script-meta">
                        <span>\${getUserAvatar(p.assignee)} \${getUserName(p.assignee)}</span>
                        <span>\${s.createdAt}</span>
                    </div>
                </div>
            \`;
        });
    });
    
    container.innerHTML = html;
}`;

const newRenderScriptList = `function initScriptFilters() {
    const statusTabs = document.querySelectorAll('#statusFilterTabs .filter-tab');
    if (statusTabs) {
        statusTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                statusTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                scriptStatusFilter = this.getAttribute('data-status');
                renderScriptList();
                updateScriptStats();
            });
        });
    }
    
    const assigneeFilter = document.getElementById('scriptAssigneeFilter');
    if (assigneeFilter) {
        assigneeFilter.addEventListener('change', function() {
            scriptAssigneeFilter = this.value;
            renderScriptList();
            updateScriptStats();
        });
    }
}

function updateScriptStats() {
    const allScripts = [];
    projects.forEach(p => {
        if (p.scripts) {
            p.scripts.forEach(s => allScripts.push({ ...s, project: p }));
        }
    });
    
    const pendingCount = allScripts.filter(s => s.status === 'pending' || s.status === 'processing').length;
    const blockedCount = allScripts.filter(s => s.status === 'rejected' || s.project.status === 'blocked').length;
    const approvedCount = allScripts.filter(s => s.status === 'approved').length;
    
    if (document.getElementById('statPending')) {
        document.getElementById('statPending').textContent = pendingCount;
    }
    if (document.getElementById('statBlocked')) {
        document.getElementById('statBlocked').textContent = blockedCount;
    }
    if (document.getElementById('statApproved')) {
        document.getElementById('statApproved').textContent = approvedCount;
    }
}

function renderScriptList() {
    const container = document.getElementById('scriptList');
    let allScripts = [];
    
    projects.forEach(p => {
        if (p.scripts) {
            p.scripts.forEach(s => {
                allScripts.push({
                    ...s,
                    project: p,
                    projectId: p.id,
                    brand: p.brand,
                    projectName: p.name,
                    assignee: p.assignee,
                    updatedBy: p.updatedBy,
                    updatedAt: p.updatedAt,
                    projectStatus: p.status,
                    blockedReason: p.blockedReason
                });
            });
        }
    });
    
    if (scriptStatusFilter !== 'all') {
        if (scriptStatusFilter === 'pending') {
            allScripts = allScripts.filter(s => s.status === 'pending' || s.status === 'processing');
        } else if (scriptStatusFilter === 'blocked') {
            allScripts = allScripts.filter(s => s.status === 'rejected' || s.projectStatus === 'blocked');
        } else if (scriptStatusFilter === 'approved') {
            allScripts = allScripts.filter(s => s.status === 'approved');
        }
    }
    
    if (scriptAssigneeFilter !== 'all') {
        allScripts = allScripts.filter(s => {
            const role = getUserRole(s.assignee);
            return role === scriptAssigneeFilter;
        });
    }
    
    if (allScripts.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #8c8c8c;">暂无符合条件的脚本</div>';
        return;
    }
    
    let html = '';
    allScripts.forEach(s => {
        const isBlocked = s.status === 'rejected' || s.projectStatus === 'blocked';
        const rejectReason = s.feedback || (isBlocked ? s.blockedReason : '');
        
        html += \`
            <div class="script-item \${selectedScript === s.id ? 'active' : ''}" onclick="selectScript('\${s.projectId}', '\${s.id}')">
                <div class="script-project">\${s.brand} - \${s.projectName}</div>
                <div>
                    <span class="script-version">\${s.version}</span>
                    <span class="status-tag \${s.status}" style="font-size: 11px;">\${getStatusName(s.status)}</span>
                </div>
                <div class="script-item-meta">
                    <span class="script-item-updater">\${getUserAvatar(s.updatedBy)} \${getUserName(s.updatedBy)}</span>
                    <span>\${formatTime(s.updatedAt)}</span>
                </div>
                \${rejectReason ? \`<div class="script-item-reject">⚠️ \${rejectReason.substring(0, 50)}\${rejectReason.length > 50 ? '...' : ''}</div>\` : ''}
            </div>
        \`;
    });
    
    container.innerHTML = html;
}`;

appJS = appJS.replace(oldRenderScriptList, newRenderScriptList);

// 替换 renderScriptDetail 函数，添加卡点信息
const oldRenderScriptDetail = `function renderScriptDetail(projectId, scriptId) {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const script = project.scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    const container = document.getElementById('scriptDetail');
    const role = getUserRole(project.assignee);
    
    container.innerHTML = \`
        <div class="script-detail-header">
            <div class="script-detail-title">\${project.brand} - \${project.name}</div>
            <div class="script-detail-meta">
                <span>脚本版本：\${script.version}</span>
                <span>状态：<span class="status-tag \${script.status}">\${getStatusName(script.status)}</span></span>
                <span>负责人：\${getUserName(project.assignee)} (\${getRoleName(role)})</span>
                <span>创建时间：\${script.createdAt}</span>
            </div>
        </div>
        
        <div class="script-version-history">
            <h4>版本历史</h4>
            \${project.scripts.map(s => \`
                <div class="version-item">
                    <span class="version-tag">\${s.version}</span>
                    <div class="version-info">
                        <div class="version-time">\${s.createdAt} · <span class="status-tag \${s.status}" style="font-size: 11px;">\${getStatusName(s.status)}</span></div>
                        \${s.feedback ? \`<div class="version-feedback">驳回意见：\${s.feedback}</div>\` : ''}
                    </div>
                </div>
            \`).join('')}
        </div>
        
        <div class="script-version-history">
            <h4>脚本内容</h4>
            <div class="script-content">
                \${script.content || '脚本内容待完善...'}
            </div>
        </div>
        
        <div style="margin-top: 24px; display: flex; gap: 12px;">
            \${script.status === 'pending' || script.status === 'processing' ? \`
                <button class="btn btn-success" onclick="approveScriptAction('\${projectId}', '\${scriptId}')">审批通过</button>
                <button class="btn btn-danger" onclick="showRejectModal('\${projectId}', '\${scriptId}')">驳回修改</button>
            \` : ''}
            <button class="btn btn-primary" onclick="viewScriptApproval('\${projectId}', '\${scriptId}')">完整审批流程</button>
        </div>
    \`;
}`;

const newRenderScriptDetail = `function renderScriptDetail(projectId, scriptId) {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const script = project.scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    const container = document.getElementById('scriptDetail');
    const role = getUserRole(project.assignee);
    const isBlocked = project.status === 'blocked' || script.status === 'rejected';
    
    let blockedHtml = '';
    if (isBlocked) {
        const blockReason = script.feedback || project.blockedReason || '未知原因';
        blockedHtml = \`
            <div class="script-blocked-info">
                <div class="script-blocked-title">⚠️ 当前卡点</div>
                <div class="script-blocked-reason">\${blockReason}</div>
            </div>
        \`;
    }
    
    container.innerHTML = \`
        <div class="script-detail-header">
            <div class="script-detail-title">\${project.brand} - \${project.name}</div>
            <div class="script-detail-meta">
                <span>脚本版本：\${script.version}</span>
                <span>状态：<span class="status-tag \${script.status}">\${getStatusName(script.status)}</span></span>
                <span>负责人：\${getUserName(project.assignee)} (\${getRoleName(role)})</span>
                <span>创建时间：\${script.createdAt}</span>
            </div>
        </div>
        
        \${blockedHtml}
        
        <div class="script-version-history">
            <h4>版本历史</h4>
            \${project.scripts.map(s => \`
                <div class="version-item">
                    <span class="version-tag">\${s.version}</span>
                    <div class="version-info">
                        <div class="version-time">\${s.createdAt} · <span class="status-tag \${s.status}" style="font-size: 11px;">\${getStatusName(s.status)}</span></div>
                        \${s.feedback ? \`<div class="version-feedback">驳回意见：\${s.feedback}</div>\` : ''}
                    </div>
                </div>
            \`).join('')}
        </div>
        
        <div class="script-version-history">
            <h4>脚本内容</h4>
            <div class="script-content">
                \${script.content || '脚本内容待完善...'}
            </div>
        </div>
        
        <div style="margin-top: 24px; display: flex; gap: 12px;">
            \${script.status === 'pending' || script.status === 'processing' ? \`
                <button class="btn btn-success" onclick="approveScriptAction('\${projectId}', '\${scriptId}')">审批通过</button>
                <button class="btn btn-danger" onclick="showRejectModal('\${projectId}', '\${scriptId}')">驳回修改</button>
            \` : ''}
            <button class="btn btn-primary" onclick="viewScriptApproval('\${projectId}', '\${scriptId}')">完整审批流程</button>
        </div>
    \`;
}`;

appJS = appJS.replace(oldRenderScriptDetail, newRenderScriptDetail);

// 在 switchView 中添加 updateScriptStats 调用
appJS = appJS.replace(
    `        case 'script':
            renderScriptList();
            break;`,
    `        case 'script':
            renderScriptList();
            updateScriptStats();
            break;`
);

// 在 refreshAllViews 中添加 updateScriptStats 调用
appJS = appJS.replace(
    `    } else if (currentView === 'script') {
        renderScriptList();
        if (selectedScript) {
            const project = projects.find(p => p.scripts && p.scripts.some(s => s.id === selectedScript));
            if (project) {
                renderScriptDetail(project.id, selectedScript);
            }
        }
    }`,
    `    } else if (currentView === 'script') {
        renderScriptList();
        updateScriptStats();
        if (selectedScript) {
            const project = projects.find(p => p.scripts && p.scripts.some(s => s.id === selectedScript));
            if (project) {
                renderScriptDetail(project.id, selectedScript);
            }
        }
    }`
);

fs.writeFileSync('app.js', appJS);
console.log('✅ app.js 更新成功！');
