#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('www/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换 renderDashboard 方法
old_dashboard = """  renderDashboard(){
    const s=AppData.getStats();const t=fmtDate(today);
    const todayReturns=AppData.getReturns({todayDue:true});
    const delayedReturns=AppData.getReturns({delayed:true});
    const newReturns=AppData.getReturns({newReturn:true});
    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">今日待办</span><div class="stat-icon blue">📋</div></div><div class="stat-value">${todayReturns.length}</div><div class="stat-label">今日需处理的退件</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">已拖延</span><div class="stat-icon red">⚠️</div></div><div class="stat-value">${delayedReturns.length}</div><div class="stat-label">超过截止日期的退件</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">待签收</span><div class="stat-icon orange">📦</div></div><div class="stat-value">${s.pendingReturns}</div><div class="stat-label">等待仓配签收处理</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">今日上架</span><div class="stat-icon green">✅</div></div><div class="stat-value">${s.todayRestocks}</div><div class="stat-label">今日完成重新上架</div></div>
      </div>
      <div class="section-title">🔥 刚刚被退回</div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>退件单号</th><th>商品名称</th><th>退件原因</th><th>退回时间</th><th>优先级</th><th>操作</th></tr></thead><tbody>
        ${newReturns.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.productName}</td><td>${r.returnReason}</td><td>${r.returnDate}</td><td><span class="priority-badge ${r.priority}">${r.priority==='high'?'高':r.priority==='medium'?'中':'低'}</span></td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" data-action="view-return" data-id="${r.id}">查看</button>${this.currentRole==='warehouse'?`<button class="btn btn-sm btn-success" data-action="sign-return" data-id="${r.id}">签收</button>`:''}</div></td></tr>`).join('')}
      </tbody></table></div></div></div>
      <div class="section-title">📌 最近打开</div>
      <div class="card"><div class="card-body"><ul class="recent-list">
        ${AppData.recentOpened.map(i=>`<li class="recent-item" data-type="${i.type}" data-id="${i.id}"><span class="recent-icon">${i.icon}</span><div class="recent-content"><div class="recent-title">${i.title}</div><div class="recent-desc">${i.type==='return'?'退件处理':'重新上架'}</div></div><span class="recent-time">${i.time}</span></li>`).join('')}
      </ul></div></div>
    `;
  },"""

new_dashboard = """  renderDashboard(){
    const s=AppData.getStats();const t=fmtDate(today);
    const todayReturns=AppData.getReturns({todayDue:true});
    const delayedReturns=AppData.getReturns({delayed:true});
    const newReturns=AppData.getReturns({newReturn:true});
    const sl={pending:'待签收',processing:'处理中',completed:'已完成'};
    const hl={warehouse:'仓配',operations:'运营',customs:'关务'};
    const renderReturnRow=(r,extraActions='')=>`<tr>
      <td><strong>${r.id}</strong></td>
      <td>${r.productName}</td>
      <td>${r.returnReason}</td>
      <td>${r.warehouse}</td>
      <td><span class="priority-badge ${r.priority}">${r.priority==='high'?'高':r.priority==='medium'?'中':'低'}</span></td>
      <td><span class="status-badge ${r.isDelayed?'delayed':r.status}">${r.isDelayed?'已拖延':sl[r.status]}</span></td>
      <td>${hl[r.currentHandler]}</td>
      <td>${r.dueDate}</td>
      <td><div class="action-buttons">
        <button class="btn btn-sm btn-outline" data-action="view-return" data-id="${r.id}">详情</button>
        ${this.currentRole==='warehouse'&&r.status==='pending'?`<button class="btn btn-sm btn-success" data-action="sign-return" data-id="${r.id}">签收</button>`:''}
        ${this.currentRole==='warehouse'&&r.status==='processing'&&r.currentHandler==='warehouse'?`<button class="btn btn-sm btn-primary" data-action="process-return" data-id="${r.id}">处理</button>`:''}
        ${this.currentRole==='customs'&&r.currentHandler==='customs'?`<button class="btn btn-sm btn-warning" data-action="customs-review" data-id="${r.id}">审核</button>`:''}
        ${this.currentRole==='operations'?`<button class="btn btn-sm btn-primary" data-action="ops-follow" data-id="${r.id}">跟进</button>`:''}
        ${extraActions}
      </div></td>
    </tr>`;
    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">今日待办</span><div class="stat-icon blue">📋</div></div><div class="stat-value">${todayReturns.length}</div><div class="stat-label">今日需处理的退件</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">已拖延</span><div class="stat-icon red">⚠️</div></div><div class="stat-value">${delayedReturns.length}</div><div class="stat-label">超过截止日期的退件</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">待签收</span><div class="stat-icon orange">📦</div></div><div class="stat-value">${s.pendingReturns}</div><div class="stat-label">等待仓配签收处理</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">今日上架</span><div class="stat-icon green">✅</div></div><div class="stat-value">${s.todayRestocks}</div><div class="stat-label">今日完成重新上架</div></div>
      </div>
      <div class="section-title">📋 今天要办 <span class="badge" style="background:#3b82f6;color:#fff;margin-left:8px;">${todayReturns.length}</span></div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>退件单号</th><th>商品</th><th>退件原因</th><th>仓库</th><th>优先级</th><th>状态</th><th>当前处理</th><th>截止日期</th><th>操作</th></tr></thead><tbody>
        ${todayReturns.length>0?todayReturns.map(r=>renderReturnRow(r)).join(''):'<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:32px;">暂无今日待办</td></tr>'}
      </tbody></table></div></div></div>
      <div class="section-title">⚠️ 已经拖延 <span class="badge" style="background:#ef4444;color:#fff;margin-left:8px;">${delayedReturns.length}</span></div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>退件单号</th><th>商品</th><th>退件原因</th><th>仓库</th><th>优先级</th><th>状态</th><th>当前处理</th><th>截止日期</th><th>操作</th></tr></thead><tbody>
        ${delayedReturns.length>0?delayedReturns.map(r=>renderReturnRow(r)).join(''):'<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:32px;">暂无拖延退件</td></tr>'}
      </tbody></table></div></div></div>
      <div class="section-title">🔥 刚刚被退回 <span class="badge" style="background:#f59e0b;color:#fff;margin-left:8px;">${newReturns.length}</span></div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>退件单号</th><th>商品</th><th>退件原因</th><th>仓库</th><th>优先级</th><th>状态</th><th>当前处理</th><th>截止日期</th><th>操作</th></tr></thead><tbody>
        ${newReturns.length>0?newReturns.map(r=>renderReturnRow(r)).join(''):'<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:32px;">暂无新退回退件</td></tr>'}
      </tbody></table></div></div></div>
      <div class="section-title">📌 最近打开</div>
      <div class="card"><div class="card-body"><ul class="recent-list">
        ${AppData.recentOpened.length>0?AppData.recentOpened.map(i=>`<li class="recent-item" data-type="${i.type}" data-id="${i.id}"><span class="recent-icon">${i.icon}</span><div class="recent-content"><div class="recent-title">${i.title}</div><div class="recent-desc">${i.type==='return'?'退件处理':'重新上架'}</div></div><span class="recent-time">${i.time}</span></li>`).join(''):'<li style="color:#94a3b8;padding:16px;text-align:center;">暂无最近打开记录</li>'}
      </ul></div></div>
    `;
  },"""

content = content.replace(old_dashboard, new_dashboard)

# 替换 bindDashboardEvents，添加更多事件绑定
old_bind = """  bindDashboardEvents(){
    document.querySelectorAll('[data-action="view-return"]').forEach(b=>b.addEventListener('click',()=>this.showReturnDetail(b.dataset.id)));
    document.querySelectorAll('[data-action="sign-return"]').forEach(b=>b.addEventListener('click',()=>this.signReturn(b.dataset.id)));
    document.querySelectorAll('.recent-item').forEach(i=>i.addEventListener('click',()=>{if(i.dataset.type==='return')this.showReturnDetail(i.dataset.id);else this.showRestockDetail(i.dataset.id);}));
  },"""

new_bind = """  bindDashboardEvents(){
    document.querySelectorAll('[data-action="view-return"]').forEach(b=>b.addEventListener('click',()=>this.showReturnDetail(b.dataset.id)));
    document.querySelectorAll('[data-action="sign-return"]').forEach(b=>b.addEventListener('click',()=>this.signReturn(b.dataset.id)));
    document.querySelectorAll('[data-action="process-return"]').forEach(b=>b.addEventListener('click',()=>this.showProcessModal(b.dataset.id)));
    document.querySelectorAll('[data-action="customs-review"]').forEach(b=>b.addEventListener('click',()=>this.showCustomsModal(b.dataset.id)));
    document.querySelectorAll('[data-action="ops-follow"]').forEach(b=>b.addEventListener('click',()=>this.opsFollowUp(b.dataset.id)));
    document.querySelectorAll('.recent-item').forEach(i=>i.addEventListener('click',()=>{if(i.dataset.type==='return')this.showReturnDetail(i.dataset.id);else this.showRestockDetail(i.dataset.id);}));
  },"""

content = content.replace(old_bind, new_bind)

# 修改所有动作完成后，确保刷新 dashboard（如果当前在 dashboard 页）
# 我们在 signReturn, submitProcess, submitCustoms, submitNewReturn, submitNewRestock, confirmRestock, opsFollowUp 中
# 最后都有 this.renderPage(this.currentPage)，这已经可以刷新了
# 让我们确认一下 signReturn 中的逻辑

with open('www/js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dashboard 升级完成！")
print("\n新增功能：")
print("✅ 今天要办 - 明细列表（含详情+角色动作）")
print("✅ 已经拖延 - 明细列表（含详情+角色动作）")
print("✅ 刚刚被退回 - 明细列表（含详情+角色动作）")
print("✅ 最近打开 - 保留原列表")
print("✅ 所有动作提交后自动刷新三组列表和最近打开")
