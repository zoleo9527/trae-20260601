#!/usr/bin/env python3
# -*- coding: utf-8 -*-

app_js_part2 = r"""

const App = {
  currentPage:'dashboard',currentRole:'warehouse',
  roleNames:{warehouse:'仓配专员',operations:'运营',customs:'关务'},
  init(){this.bindEvents();this.renderPage('dashboard');this.updateAllBadges();},
  bindEvents(){
    document.querySelectorAll('.nav-item').forEach(i=>{i.addEventListener('click',()=>this.renderPage(i.dataset.page));});
    document.getElementById('modal-close').addEventListener('click',()=>this.closeModal());
    document.getElementById('modal-overlay').addEventListener('click',e=>{if(e.target.id==='modal-overlay')this.closeModal();});
    document.getElementById('role-select').addEventListener('change',e=>{this.currentRole=e.target.value;document.getElementById('current-user').textContent=this.roleNames[this.currentRole];this.renderPage(this.currentPage);this.showToast('已切换角色：'+this.roleNames[this.currentRole],'success');});
    document.getElementById('btn-refresh').addEventListener('click',()=>{this.renderPage(this.currentPage);this.showToast('数据已刷新','success');});
  },
  renderPage(page){
    this.currentPage=page;
    document.querySelectorAll('.nav-item').forEach(i=>{i.classList.toggle('active',i.dataset.page===page);});
    const titles={dashboard:'最近打开','operations-desk':'运营登记工作台','warehouse-desk':'仓配处理工作台','customs-desk':'关务审核工作台','restock-desk':'待上架单工作台',restock:'上架记录',history:'操作历史'};
    document.getElementById('breadcrumb').textContent=titles[page]||page;
    const c=document.getElementById('page-container');
    switch(page){
      case'dashboard':c.innerHTML=this.renderDashboard();this.bindDashboardEvents();break;
      case'operations-desk':c.innerHTML=this.renderOperationsDesk();this.bindOperationsDeskEvents();break;
      case'warehouse-desk':c.innerHTML=this.renderWarehouseDesk();this.bindWarehouseDeskEvents();break;
      case'customs-desk':c.innerHTML=this.renderCustomsDesk();this.bindCustomsDeskEvents();break;
      case'restock-desk':c.innerHTML=this.renderRestockDesk();this.bindRestockDeskEvents();break;
      case'restock':c.innerHTML=this.renderRestock();this.bindRestockEvents();break;
      case'history':c.innerHTML=this.renderHistory();break;
    }
    this.updateAllBadges();
  },
  renderDashboard(){
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
  },
  bindDashboardEvents(){
    document.querySelectorAll('[data-action="view-return"]').forEach(b=>b.addEventListener('click',()=>this.showReturnDetail(b.dataset.id)));
    document.querySelectorAll('[data-action="sign-return"]').forEach(b=>b.addEventListener('click',()=>this.signReturn(b.dataset.id)));
    document.querySelectorAll('.recent-item').forEach(i=>i.addEventListener('click',()=>{if(i.dataset.type==='return')this.showReturnDetail(i.dataset.id);else this.showRestockDetail(i.dataset.id);}));
  },
  renderOperationsDesk(){
    const st=AppData.getRoleStats('operations');
    const myReturns=AppData.returns.filter(r=>r.currentHandler==='operations'||r.registeredBy.includes('运营'));
    const sl={pending:'待签收',processing:'处理中',completed:'已完成'};
    const hl={warehouse:'仓配',operations:'运营',customs:'关务'};
    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">待我跟进</span><div class="stat-icon orange">📝</div></div><div class="stat-value">${st.myPending||0}</div><div class="stat-label">需要运营跟进的退件</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">已拖延</span><div class="stat-icon red">⚠️</div></div><div class="stat-value">${st.myDelayed||0}</div><div class="stat-label">我负责的拖延单</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">累计登记</span><div class="stat-icon blue">📊</div></div><div class="stat-value">${st.totalRegistered||0}</div><div class="stat-label">我登记的退件总数</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">今日登记</span><div class="stat-icon green">✅</div></div><div class="stat-value">${AppData.returns.filter(r=>r.returnDate===fmtDate(today)&&r.registeredBy.includes('运营')).length}</div><div class="stat-label">今日新增退件登记</div></div>
      </div>
      <div class="section-title">📝 常用动作</div>
      <div class="card"><div class="card-body"><div style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-primary" id="ops-new-return">➕ 新建退件登记</button>
        <button class="btn btn-outline" id="ops-followup">📞 批量跟进超期单</button>
        <button class="btn btn-outline" id="ops-export">📤 导出退件报表</button>
      </div></div></div>
      <div class="section-title">📋 待我跟进</div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>退件单号</th><th>商品</th><th>退件原因</th><th>状态</th><th>当前处理</th><th>截止日期</th><th>是否拖延</th><th>操作</th></tr></thead><tbody>
        ${myReturns.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.productName}</td><td>${r.returnReason}</td><td><span class="status-badge ${r.isDelayed?'delayed':r.status}">${r.isDelayed?'已拖延':sl[r.status]}</span></td><td>${hl[r.currentHandler]}</td><td>${r.dueDate}</td><td>${r.isDelayed?'<span style="color:#ef4444">是</span>':'<span style="color:#10b981">否</span>'}</td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-return" data-id="${r.id}">详情</button><button class="btn btn-sm btn-primary" data-action="ops-follow" data-id="${r.id}">跟进</button></div></td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  },
  bindOperationsDeskEvents(){
    document.getElementById('ops-new-return').addEventListener('click',()=>this.showNewReturnModal());
    document.getElementById('ops-followup').addEventListener('click',()=>this.showToast('已标记 2 个超期单为跟进中','success'));
    document.getElementById('ops-export').addEventListener('click',()=>this.showToast('退件报表导出中...','info'));
    document.querySelectorAll('[data-action="view-return"]').forEach(b=>b.addEventListener('click',()=>this.showReturnDetail(b.dataset.id)));
    document.querySelectorAll('[data-action="ops-follow"]').forEach(b=>b.addEventListener('click',()=>this.opsFollowUp(b.dataset.id)));
  },
  opsFollowUp(id){
    const r=AppData.getReturnById(id);
    AppData.addReturnHistory(id,'运营跟进',this.roleNames[this.currentRole],'operations','运营主动跟进处理进度');
    AppData.addHistory('运营跟进',id,this.roleNames[this.currentRole],'operations','跟进：'+r.productName);
    AppData.addToRecent('return',id,r.productName+' - 运营跟进','📝');
    this.showToast('已记录跟进动作','success');
    this.renderPage('operations-desk');
  },
"""

with open('www/js/app.js', 'a', encoding='utf-8') as f:
    f.write(app_js_part2)

print("Part 2 written successfully")
