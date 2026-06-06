#!/usr/bin/env python3
# -*- coding: utf-8 -*-

app_js_part4 = r"""
  renderRestock(){
    const restocks=AppData.getRestocks();
    return `
      <div class="section-title">📥 重新上架回看</div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>上架单号</th><th>关联退件</th><th>商品名称</th><th>SKU</th><th>数量</th><th>仓库</th><th>库位</th><th>上架日期</th><th>操作人</th><th>操作</th></tr></thead><tbody>
        ${restocks.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.returnId||'-'}</td><td>${r.productName}</td><td>${r.sku}</td><td>${r.quantity}</td><td>${r.warehouse}</td><td><span class="badge">${r.location||'-'}</span></td><td>${r.restockDate}</td><td>${r.processedBy}</td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-restock" data-id="${r.id}">回看</button></div></td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  },
  bindRestockEvents(){
    document.querySelectorAll('[data-action="view-restock"]').forEach(b=>b.addEventListener('click',()=>this.showRestockDetail(b.dataset.id)));
  },
  renderHistory(){
    const roleNames={warehouse:'仓配',operations:'运营',customs:'关务'};
    return `
      <div class="section-title">📋 操作历史</div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>时间</th><th>操作</th><th>目标</th><th>操作人</th><th>角色</th><th>说明</th></tr></thead><tbody>
        ${AppData.history.map(h=>`<tr><td>${h.time}</td><td>${h.action}</td><td><strong>${h.target}</strong></td><td>${h.user}</td><td><span class="badge">${roleNames[h.role]||h.role}</span></td><td>${h.desc}</td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  },
  showReturnDetail(id){
    const r=AppData.getReturnById(id);
    if(!r)return;
    AppData.addToRecent('return',id,r.productName+' - 详情','📦');
    const sl={pending:'待签收',processing:'处理中',completed:'已完成'};
    const hl={warehouse:'仓配',operations:'运营',customs:'关务'};
    document.getElementById('modal-title').textContent='退件详情 - '+r.id;
    document.getElementById('modal-body').innerHTML=`
      <div class="detail-grid">
        <div class="detail-card"><div class="detail-card-header">📦 基本信息</div><div class="detail-row"><span class="detail-label">平台订单号</span><span class="detail-value">${r.platformOrderNo}</span></div><div class="detail-row"><span class="detail-label">报关单号</span><span class="detail-value">${r.customsNo}</span></div><div class="detail-row"><span class="detail-label">商品SKU</span><span class="detail-value">${r.sku}</span></div><div class="detail-row"><span class="detail-label">商品名称</span><span class="detail-value">${r.productName}</span></div><div class="detail-row"><span class="detail-label">数量</span><span class="detail-value">${r.quantity}</span></div></div>
        <div class="detail-card"><div class="detail-card-header">📋 处理进度</div><div class="detail-row"><span class="detail-label">退件原因</span><span class="detail-value">${r.returnReason}</span></div><div class="detail-row"><span class="detail-label">退回日期</span><span class="detail-value">${r.returnDate}</span></div><div class="detail-row"><span class="detail-label">当前状态</span><span class="detail-value"><span class="status-badge ${r.isDelayed?'delayed':r.status}">${r.isDelayed?'已拖延':sl[r.status]}</span></span></div><div class="detail-row"><span class="detail-label">当前处理人</span><span class="detail-value">${hl[r.currentHandler]}</span></div><div class="detail-row"><span class="detail-label">截止日期</span><span class="detail-value">${r.dueDate} ${r.isDelayed?'<span style="color:#ef4444;">(已超期)</span>':''}</span></div><div class="detail-row"><span class="detail-label">仓库</span><span class="detail-value">${r.warehouse}</span></div></div>
      </div>
      <div class="section-title" style="margin-top:24px;">📝 操作历史时间线</div>
      <div class="timeline">
        ${r.history.slice().reverse().map((h,i)=>`<div class="timeline-item"><div class="timeline-dot ${i===0?'active':''}"></div><div class="timeline-content"><div class="timeline-header"><span class="timeline-action">${h.action}</span><span class="timeline-time">${h.time}</span></div><div class="timeline-desc">${h.user} · ${hl[h.role]}<br>${h.desc}</div></div></div>`).join('')}
      </div>
      <div class="modal-footer">
        ${this.currentRole==='warehouse'&&r.status==='pending'?`<button class="btn btn-success" onclick="App.signReturn('${r.id}')">签收退件</button>`:''}
        ${this.currentRole==='warehouse'&&r.status==='processing'&&r.currentHandler==='warehouse'?`<button class="btn btn-primary" onclick="App.showProcessModal('${r.id}')">处理退件</button>`:''}
        ${this.currentRole==='customs'&&r.currentHandler==='customs'?`<button class="btn btn-warning" onclick="App.showCustomsModal('${r.id}')">关务审核</button>`:''}
        <button class="btn btn-outline" onclick="App.closeModal()">关闭</button>
      </div>
    `;
    this.openModal();
  },
  showRestockDetail(id){
    const r=AppData.getRestockById(id);
    if(!r)return;
    AppData.addToRecent('restock',id,r.productName+' - 回看','✅');
    const hl={warehouse:'仓配',operations:'运营',customs:'关务'};
    document.getElementById('modal-title').textContent='上架详情 - '+r.id;
    document.getElementById('modal-body').innerHTML=`
      <div class="detail-grid">
        <div class="detail-card"><div class="detail-card-header">📥 上架信息</div><div class="detail-row"><span class="detail-label">上架单号</span><span class="detail-value">${r.id}</span></div><div class="detail-row"><span class="detail-label">关联退件</span><span class="detail-value">${r.returnId||'-'}</span></div><div class="detail-row"><span class="detail-label">商品SKU</span><span class="detail-value">${r.sku}</span></div><div class="detail-row"><span class="detail-label">商品名称</span><span class="detail-value">${r.productName}</span></div><div class="detail-row"><span class="detail-label">数量</span><span class="detail-value">${r.quantity}</span></div></div>
        <div class="detail-card"><div class="detail-card-header">📍 入库信息</div><div class="detail-row"><span class="detail-label">仓库</span><span class="detail-value">${r.warehouse}</span></div><div class="detail-row"><span class="detail-label">库位</span><span class="detail-value"><span class="badge">${r.location||'-'}</span></span></div><div class="detail-row"><span class="detail-label">上架日期</span><span class="detail-value">${r.restockDate}</span></div><div class="detail-row"><span class="detail-label">操作人</span><span class="detail-value">${r.processedBy}</span></div><div class="detail-row"><span class="detail-label">状态</span><span class="detail-value"><span class="status-badge ${r.status}">${r.status==='completed'?'已完成':'处理中'}</span></span></div></div>
      </div>
      ${r.remarks?`<div class="section-title" style="margin-top:16px;">📝 备注</div><div class="card"><div class="card-body">${r.remarks}</div></div>`:''}
      <div class="section-title" style="margin-top:24px;">📝 操作历史时间线</div>
      <div class="timeline">
        ${r.history.slice().reverse().map((h,i)=>`<div class="timeline-item"><div class="timeline-dot ${i===0?'active':''}"></div><div class="timeline-content"><div class="timeline-header"><span class="timeline-action">${h.action}</span><span class="timeline-time">${h.time}</span></div><div class="timeline-desc">${h.user} · ${hl[h.role]}<br>${h.desc}</div></div></div>`).join('')}
      </div>
      <div class="modal-footer">
        ${r.status==='processing'?`<button class="btn btn-success" onclick="App.confirmRestock('${r.id}')">确认上架</button>`:''}
        <button class="btn btn-outline" onclick="App.closeModal()">关闭</button>
      </div>
    `;
    this.openModal();
  },
  signReturn(id){
    const r=AppData.getReturnById(id);
    if(!r)return;
    r.status='processing';
    r.isNewReturn=false;
    AppData.addReturnHistory(id,'签收退件',this.roleNames[this.currentRole],'warehouse','海外仓已签收，商品外观完好');
    AppData.addHistory('签收退件',id,this.roleNames[this.currentRole],'warehouse','签收：'+r.productName);
    AppData.addToRecent('return',id,r.productName+' - 已签收','📦');
    this.showToast('退件签收成功','success');
    this.closeModal();
    this.renderPage(this.currentPage);
  },
  showProcessModal(id){
    document.getElementById('modal-title').textContent='处理退件';
    document.getElementById('modal-body').innerHTML=`
      <input type="hidden" id="process-id" value="${id}">
      <div class="form-group"><label>处理动作</label><select id="process-action"><option value="inspect">质量检测</option><option value="to_customs">移交关务</option><option value="to_restock">创建上架单</option><option value="complete">直接完成</option></select></div>
      <div class="form-group"><label>处理说明</label><textarea id="process-desc" placeholder="请输入处理说明..."></textarea></div>
      <div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">取消</button><button class="btn btn-primary" onclick="App.submitProcess()">提交处理</button></div>
    `;
    this.openModal();
  },
  submitProcess(){
    const id=document.getElementById('process-id').value;
    const action=document.getElementById('process-action').value;
    const desc=document.getElementById('process-desc').value;
    const r=AppData.getReturnById(id);
    const actions={inspect:{act:'质量检测',desc:desc||'质检通过，功能正常'},to_customs:{act:'移交关务',desc:desc||'需关务确认是否可退回',handler:'customs'},to_restock:{act:'创建上架单',desc:desc||'检测合格，可重新上架'},complete:{act:'处理完成',desc:desc||'退件处理完成'}};
    const a=actions[action];
    AppData.addReturnHistory(id,a.act,this.roleNames[this.currentRole],'warehouse',a.desc);
    AppData.addHistory(a.act,id,this.roleNames[this.currentRole],'warehouse',a.desc);
    if(action==='to_customs'){r.currentHandler='customs';}
    if(action==='complete'){r.status='completed';}
    if(action==='to_restock'){AppData.createRestock(id,r.sku,r.productName,r.quantity,r.warehouse,desc||'从退件单创建上架单');r.status='completed';}
    AppData.addToRecent('return',id,r.productName+' - '+a.act,'📦');
    this.showToast(a.act+' 成功','success');
    this.closeModal();
    this.renderPage('warehouse-desk');
  },
  showCustomsModal(id){
    document.getElementById('modal-title').textContent='关务审核';
    document.getElementById('modal-body').innerHTML=`
      <input type="hidden" id="customs-id" value="${id}">
      <div class="form-group"><label>审核结果</label><select id="customs-action"><option value="pass">审核通过</option><option value="reject">需补充资料</option><option value="to_warehouse">退回仓配处理</option></select></div>
      <div class="form-group"><label>审核意见</label><textarea id="customs-desc" placeholder="请输入审核意见..."></textarea></div>
      <div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">取消</button><button class="btn btn-primary" onclick="App.submitCustoms()">提交审核</button></div>
    `;
    this.openModal();
  },
  submitCustoms(){
    const id=document.getElementById('customs-id').value;
    const action=document.getElementById('customs-action').value;
    const desc=document.getElementById('customs-desc').value;
    const r=AppData.getReturnById(id);
    const actions={pass:{act:'审核通过',desc:desc||'关务审核通过，可退回仓配',handler:'warehouse'},reject:{act:'需补充资料',desc:desc||'请补充相关报关资料',handler:'operations'},to_warehouse:{act:'退回仓配',desc:desc||'无需进一步关务处理',handler:'warehouse'}};
    const a=actions[action];
    AppData.addReturnHistory(id,a.act,this.roleNames[this.currentRole],'customs',a.desc);
    AppData.addHistory(a.act,id,this.roleNames[this.currentRole],'customs',a.desc);
    r.currentHandler=a.handler;
    AppData.addToRecent('return',id,r.productName+' - '+a.act,'📑');
    this.showToast(a.act+' 成功','success');
    this.closeModal();
    this.renderPage('customs-desk');
  },
  showNewReturnModal(){
    document.getElementById('modal-title').textContent='新建退件登记';
    document.getElementById('modal-body').innerHTML=`
      <div class="form-row"><div class="form-group"><label>平台订单号 *</label><input type="text" id="new-rt-order" placeholder="平台订单号"></div><div class="form-group"><label>报关单号</label><input type="text" id="new-rt-customs" placeholder="报关单号"></div></div>
      <div class="form-row"><div class="form-group"><label>SKU *</label><input type="text" id="new-rt-sku" placeholder="商品SKU"></div><div class="form-group"><label>商品名称 *</label><input type="text" id="new-rt-product" placeholder="商品名称"></div></div>
      <div class="form-row"><div class="form-group"><label>数量 *</label><input type="number" id="new-rt-qty" value="1" min="1"></div><div class="form-group"><label>仓库</label><select id="new-rt-warehouse"><option value="洛杉矶仓">洛杉矶仓</option><option value="新加坡仓">新加坡仓</option><option value="马尼拉仓">马尼拉仓</option></select></div></div>
      <div class="form-group"><label>退件原因 *</label><select id="new-rt-reason"><option value="客户质量投诉">客户质量投诉</option><option value="物流破损">物流破损</option><option value="客户误购">客户误购-未拆封</option><option value="功能故障">功能故障</option><option value="配件缺失">配件缺失</option></select></div>
      <div class="form-group"><label>优先级</label><select id="new-rt-priority"><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></div>
      <div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">取消</button><button class="btn btn-primary" onclick="App.submitNewReturn()">创建退件</button></div>
    `;
    this.openModal();
  },
  submitNewReturn(){
    const order=document.getElementById('new-rt-order').value;
    const customs=document.getElementById('new-rt-customs').value;
    const sku=document.getElementById('new-rt-sku').value;
    const product=document.getElementById('new-rt-product').value;
    const qty=parseInt(document.getElementById('new-rt-qty').value);
    const wh=document.getElementById('new-rt-warehouse').value;
    const reason=document.getElementById('new-rt-reason').value;
    const priority=document.getElementById('new-rt-priority').value;
    if(!order||!sku||!product){this.showToast('请填写必填项','error');return;}
    const n=new Date();const id='RT'+n.getFullYear()+(n.getMonth()+1).toString().padStart(2,'0')+n.getDate().toString().padStart(2,'0')+Math.floor(Math.random()*1000).toString().padStart(3,'0');
    const t=nowTime();
    const nr={id,platformOrderNo:order,customsNo:customs||'-',sku,productName:product,returnReason:reason,returnDate:fmtDate(today),status:'pending',priority,warehouse:wh,quantity:qty,registeredBy:this.roleNames[this.currentRole],registeredAt:t,currentHandler:'warehouse',dueDate:fmtDate(today),isDelayed:false,isNewReturn:true,history:[{action:'退件登记',user:this.roleNames[this.currentRole],time:t,role:'operations',desc:reason}]};
    AppData.returns.unshift(nr);
    AppData.addHistory('创建退件登记',id,this.roleNames[this.currentRole],'operations','创建退件单：'+product);
    AppData.addToRecent('return',id,product+' - 新登记','📝');
    this.showToast('退件创建成功','success');
    this.closeModal();
    this.renderPage('operations-desk');
  },
  openModal(){document.getElementById('modal-overlay').classList.add('active');},
  closeModal(){document.getElementById('modal-overlay').classList.remove('active');},
  showToast(msg,type='info'){
    const t=document.getElementById('toast');
    t.textContent=msg;t.className='toast '+type;t.style.display='block';
    setTimeout(()=>{t.style.display='none';},3000);
  },
  updateAllBadges(){
    const ops=AppData.returns.filter(r=>r.currentHandler==='operations').length;
    const wh=AppData.returns.filter(r=>r.currentHandler==='warehouse'||r.status==='pending').length;
    const cus=AppData.returns.filter(r=>r.currentHandler==='customs').length;
    const rs=AppData.restocks.filter(r=>r.status==='processing').length;
    const setBadge=(id,n)=>{const el=document.getElementById(id);if(el){el.textContent=n;el.style.display=n>0?'flex':'none';}};
    setBadge('ops-badge',ops);setBadge('wh-badge',wh);setBadge('cus-badge',cus);setBadge('rs-badge',rs);
  }
};

document.addEventListener('DOMContentLoaded',()=>App.init());
"""

with open('www/js/app.js', 'a', encoding='utf-8') as f:
    f.write(app_js_part4)

print("Part 4 written successfully")
