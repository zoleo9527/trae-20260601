#!/usr/bin/env python3
# -*- coding: utf-8 -*-

app_js_part3 = r"""
  renderWarehouseDesk(){
    const st=AppData.getRoleStats('warehouse');
    const toSign=AppData.getReturns({status:'pending'});
    const toProcess=AppData.getReturns({handler:'warehouse',status:'processing'});
    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">待签收</span><div class="stat-icon orange">📦</div></div><div class="stat-value">${st.toSign||0}</div><div class="stat-label">等待海外仓签收</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">待处理</span><div class="stat-icon blue">🔧</div></div><div class="stat-value">${st.toProcess||0}</div><div class="stat-label">需要仓配处理</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">已拖延</span><div class="stat-icon red">⚠️</div></div><div class="stat-value">${st.myDelayed||0}</div><div class="stat-label">超期未处理</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">待上架</span><div class="stat-icon green">📥</div></div><div class="stat-value">${st.toRestock||0}</div><div class="stat-label">待上架的商品</div></div>
      </div>
      <div class="section-title">🏭 常用动作</div>
      <div class="card"><div class="card-body"><div style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-success" id="wh-batch-sign">✅ 批量签收</button>
        <button class="btn btn-primary" id="wh-batch-inspect">🔍 批量质检</button>
        <button class="btn btn-warning" id="wh-to-customs">📑 批量移交关务</button>
        <button class="btn btn-outline" id="wh-print">🖨️ 打印上架标签</button>
      </div></div></div>
      <div class="section-title">📦 待签收 (${toSign.length})</div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>退件单号</th><th>商品</th><th>仓库</th><th>数量</th><th>退回日期</th><th>优先级</th><th>操作</th></tr></thead><tbody>
        ${toSign.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.productName}</td><td>${r.warehouse}</td><td>${r.quantity}</td><td>${r.returnDate}</td><td><span class="priority-badge ${r.priority}">${r.priority==='high'?'高':r.priority==='medium'?'中':'低'}</span></td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-return" data-id="${r.id}">详情</button><button class="btn btn-sm btn-success" data-action="sign-return" data-id="${r.id}">签收</button></div></td></tr>`).join('')}
      </tbody></table></div></div></div>
      <div class="section-title">🔧 待处理 (${toProcess.length})</div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>退件单号</th><th>商品</th><th>退件原因</th><th>是否拖延</th><th>截止日期</th><th>操作</th></tr></thead><tbody>
        ${toProcess.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.productName}</td><td>${r.returnReason}</td><td>${r.isDelayed?'<span style="color:#ef4444;font-weight:600;">是</span>':'<span style="color:#10b981">否</span>'}</td><td>${r.dueDate}</td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-return" data-id="${r.id}">详情</button><button class="btn btn-sm btn-primary" data-action="process-return" data-id="${r.id}">处理</button></div></td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  },
  bindWarehouseDeskEvents(){
    document.querySelectorAll('[data-action="view-return"]').forEach(b=>b.addEventListener('click',()=>this.showReturnDetail(b.dataset.id)));
    document.querySelectorAll('[data-action="sign-return"]').forEach(b=>b.addEventListener('click',()=>this.signReturn(b.dataset.id)));
    document.querySelectorAll('[data-action="process-return"]').forEach(b=>b.addEventListener('click',()=>this.showProcessModal(b.dataset.id)));
    document.getElementById('wh-batch-sign').addEventListener('click',()=>this.showToast('已批量签收 3 个退件','success'));
    document.getElementById('wh-batch-inspect').addEventListener('click',()=>this.showToast('已标记 2 个退件为质检通过','success'));
    document.getElementById('wh-to-customs').addEventListener('click',()=>this.showToast('已移交 1 个退件至关务','success'));
    document.getElementById('wh-print').addEventListener('click',()=>this.showToast('标签打印任务已发送','success'));
  },
  renderCustomsDesk(){
    const st=AppData.getRoleStats('customs');
    const toReview=AppData.getReturns({handler:'customs'});
    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">待审核</span><div class="stat-icon orange">📑</div></div><div class="stat-value">${st.toReview||0}</div><div class="stat-label">等待关务审核</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">已拖延</span><div class="stat-icon red">⚠️</div></div><div class="stat-value">${st.myDelayed||0}</div><div class="stat-label">超期未审核</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">累计审核</span><div class="stat-icon blue">📊</div></div><div class="stat-value">${st.totalReviewed||0}</div><div class="stat-label">历史审核总数</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">今日审核</span><div class="stat-icon green">✅</div></div><div class="stat-value">${AppData.history.filter(h=>h.role==='customs'&&h.time.startsWith(fmtDate(today))).length}</div><div class="stat-label">今日处理审核</div></div>
      </div>
      <div class="section-title">📑 常用动作</div>
      <div class="card"><div class="card-body"><div style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-success" id="cus-batch-pass">✅ 批量通过</button>
        <button class="btn btn-warning" id="cus-batch-need">📋 批量补充资料</button>
        <button class="btn btn-outline" id="cus-export">📤 导出报关清单</button>
      </div></div></div>
      <div class="section-title">📋 待我审核 (${toReview.length})</div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>退件单号</th><th>报关单号</th><th>商品</th><th>退件原因</th><th>是否拖延</th><th>截止日期</th><th>操作</th></tr></thead><tbody>
        ${toReview.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.customsNo}</td><td>${r.productName}</td><td>${r.returnReason}</td><td>${r.isDelayed?'<span style="color:#ef4444;font-weight:600;">是</span>':'<span style="color:#10b981">否</span>'}</td><td>${r.dueDate}</td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-return" data-id="${r.id}">详情</button><button class="btn btn-sm btn-warning" data-action="customs-review" data-id="${r.id}">审核</button></div></td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  },
  bindCustomsDeskEvents(){
    document.querySelectorAll('[data-action="view-return"]').forEach(b=>b.addEventListener('click',()=>this.showReturnDetail(b.dataset.id)));
    document.querySelectorAll('[data-action="customs-review"]').forEach(b=>b.addEventListener('click',()=>this.showCustomsModal(b.dataset.id)));
    document.getElementById('cus-batch-pass').addEventListener('click',()=>this.showToast('已批量通过 0 个审核','success'));
    document.getElementById('cus-batch-need').addEventListener('click',()=>this.showToast('已标记 1 个需补充资料','warning'));
    document.getElementById('cus-export').addEventListener('click',()=>this.showToast('报关清单导出中...','info'));
  },
  renderRestockDesk(){
    const pending=AppData.getRestocks({status:'processing'});
    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">待上架</span><div class="stat-icon orange">📥</div></div><div class="stat-value">${pending.length}</div><div class="stat-label">等待上架商品</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">今日待办</span><div class="stat-icon blue">📋</div></div><div class="stat-value">${pending.length}</div><div class="stat-label">今日需完成上架</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">今日已上架</span><div class="stat-icon green">✅</div></div><div class="stat-value">${AppData.restocks.filter(r=>r.restockDate===fmtDate(today)&&r.status==='completed').length}</div><div class="stat-label">今日完成上架</div></div>
        <div class="stat-card"><div class="stat-card-header"><span class="stat-label">累计上架</span><div class="stat-icon blue">📊</div></div><div class="stat-value">${AppData.restocks.filter(r=>r.status==='completed').length}</div><div class="stat-label">历史上架总数</div></div>
      </div>
      <div class="section-title">📥 常用动作</div>
      <div class="card"><div class="card-body"><div style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-success" id="rs-batch-restock">✅ 批量上架</button>
        <button class="btn btn-primary" id="rs-new">➕ 新建上架单</button>
        <button class="btn btn-outline" id="rs-print-labels">🖨️ 打印库位标签</button>
      </div></div></div>
      <div class="section-title">📥 待上架清单 (${pending.length})</div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>上架单号</th><th>关联退件</th><th>商品名称</th><th>SKU</th><th>数量</th><th>仓库</th><th>创建人</th><th>操作</th></tr></thead><tbody>
        ${pending.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.returnId||'-'}</td><td>${r.productName}</td><td>${r.sku}</td><td>${r.quantity}</td><td>${r.warehouse}</td><td>${r.processedBy}</td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-restock" data-id="${r.id}">回看</button><button class="btn btn-sm btn-success" data-action="restock-confirm" data-id="${r.id}">确认上架</button></div></td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  },
  bindRestockDeskEvents(){
    document.querySelectorAll('[data-action="view-restock"]').forEach(b=>b.addEventListener('click',()=>this.showRestockDetail(b.dataset.id)));
    document.querySelectorAll('[data-action="restock-confirm"]').forEach(b=>b.addEventListener('click',()=>this.confirmRestock(b.dataset.id)));
    document.getElementById('rs-batch-restock').addEventListener('click',()=>this.showToast('已批量确认上架','success'));
    document.getElementById('rs-new').addEventListener('click',()=>this.showNewRestockModal());
    document.getElementById('rs-print-labels').addEventListener('click',()=>this.showToast('库位标签打印中...','info'));
  },
  confirmRestock(id){
    const r=AppData.getRestockById(id);
    if(r){
      r.status='completed';
      r.location=r.location||'A-01-01';
      r.restockDate=fmtDate(today);
      AppData.addRestockHistory(id,'确认上架',this.roleNames[this.currentRole],'warehouse','已确认上架至库位 '+r.location);
      AppData.addHistory('确认上架',id,this.roleNames[this.currentRole],'warehouse',r.productName+' 已确认上架');
      AppData.addToRecent('restock',id,r.productName+' - 已上架','✅');
      this.showToast('上架确认成功','success');
      this.renderPage('restock-desk');
    }
  },
  showNewRestockModal(){
    document.getElementById('modal-title').textContent='新建上架单';
    document.getElementById('modal-body').innerHTML=`
      <div class="form-row"><div class="form-group"><label>关联退件单号</label><input type="text" id="new-rs-return" placeholder="如：RT2026xxxxxxx"></div><div class="form-group"><label>SKU *</label><input type="text" id="new-rs-sku" placeholder="商品SKU"></div></div>
      <div class="form-group"><label>商品名称 *</label><input type="text" id="new-rs-product" placeholder="商品名称"></div>
      <div class="form-row"><div class="form-group"><label>数量 *</label><input type="number" id="new-rs-qty" value="1" min="1"></div><div class="form-group"><label>仓库</label><select id="new-rs-warehouse"><option value="洛杉矶仓">洛杉矶仓</option><option value="新加坡仓">新加坡仓</option><option value="马尼拉仓">马尼拉仓</option></select></div></div>
      <div class="form-group"><label>备注</label><textarea id="new-rs-remark" placeholder="上架备注..."></textarea></div>
      <div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">取消</button><button class="btn btn-primary" onclick="App.submitNewRestock()">创建上架单</button></div>
    `;
    this.openModal();
  },
  submitNewRestock(){
    const returnId=document.getElementById('new-rs-return').value;
    const sku=document.getElementById('new-rs-sku').value;
    const product=document.getElementById('new-rs-product').value;
    const qty=parseInt(document.getElementById('new-rs-qty').value);
    const wh=document.getElementById('new-rs-warehouse').value;
    const rm=document.getElementById('new-rs-remark').value;
    if(!sku||!product){this.showToast('请填写必填项','error');return;}
    AppData.createRestock(returnId,sku,product,qty,wh,rm);
    this.showToast('上架单创建成功','success');
    this.closeModal();
    this.renderPage('restock-desk');
  },
"""

with open('www/js/app.js', 'a', encoding='utf-8') as f:
    f.write(app_js_part3)

print("Part 3 written successfully")
