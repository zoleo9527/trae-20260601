const today = new Date('2026-06-06');
const fmtDate = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const nd = new Date(d); nd.setDate(nd.getDate()+n); return nd; };

const AppData = {
  returns: [
    {id:'RT20260606001',platformOrderNo:'AMZ-20260605-88291',customsNo:'CUS-GZ-2026-05892',sku:'SKU-ELEC-00123',productName:'无线蓝牙耳机 Pro 2代',returnReason:'客户质量投诉-音质异常',returnDate:fmtDate(today),status:'pending',priority:'high',warehouse:'洛杉矶仓',quantity:2,registeredBy:'运营-张敏',registeredAt:fmtDate(today)+' 09:15',currentHandler:'warehouse',dueDate:fmtDate(today),isDelayed:false,isNewReturn:true,history:[{action:'退件登记',user:'运营-张敏',time:fmtDate(today)+' 09:15',role:'operations',desc:'客户反馈音质异常'}]},
    {id:'RT20260606002',platformOrderNo:'AMZ-20260604-77382',customsNo:'CUS-GZ-2026-05781',sku:'SKU-HOME-04562',productName:'智能空气加湿器',returnReason:'物流破损-外壳裂缝',returnDate:fmtDate(addDays(today,-3)),status:'processing',priority:'high',warehouse:'洛杉矶仓',quantity:1,registeredBy:'运营-李明',registeredAt:fmtDate(addDays(today,-3))+' 14:22',currentHandler:'customs',dueDate:fmtDate(addDays(today,-1)),isDelayed:true,isNewReturn:false,history:[{action:'退件登记',user:'运营-李明',time:fmtDate(addDays(today,-3))+' 14:22',role:'operations',desc:'物流运输外壳破损'},{action:'仓配签收',user:'仓配-王强',time:fmtDate(addDays(today,-2))+' 10:30',role:'warehouse',desc:'已收到退件'},{action:'移交关务',user:'仓配-王强',time:fmtDate(addDays(today,-2))+' 11:00',role:'warehouse',desc:'需关务确认'}]},
    {id:'RT20260606003',platformOrderNo:'SHOPEE-MY-20260601-33456',customsNo:'CUS-SZ-2026-11203',sku:'SKU-BEAUTY-08791',productName:'面部精华液套装',returnReason:'客户误购-未拆封',returnDate:fmtDate(addDays(today,-1)),status:'processing',priority:'medium',warehouse:'新加坡仓',quantity:1,registeredBy:'运营-刘芳',registeredAt:fmtDate(addDays(today,-1))+' 16:45',currentHandler:'warehouse',dueDate:fmtDate(today),isDelayed:false,isNewReturn:false,history:[{action:'退件登记',user:'运营-刘芳',time:fmtDate(addDays(today,-1))+' 16:45',role:'operations',desc:'客户误拍未拆封'},{action:'海外仓签收',user:'仓配-陈杰',time:fmtDate(today)+' 08:30',role:'warehouse',desc:'刚刚签收商品完好'}]},
    {id:'RT20260606004',platformOrderNo:'AMZ-20260528-11293',customsNo:'CUS-GZ-2026-05210',sku:'SKU-KITCHEN-02341',productName:'不锈钢料理锅',returnReason:'功能故障-加热不均匀',returnDate:fmtDate(addDays(today,-5)),status:'processing',priority:'medium',warehouse:'洛杉矶仓',quantity:1,registeredBy:'运营-张敏',registeredAt:fmtDate(addDays(today,-5))+' 11:20',currentHandler:'warehouse',dueDate:fmtDate(addDays(today,-2)),isDelayed:true,isNewReturn:false,history:[{action:'退件登记',user:'运营-张敏',time:fmtDate(addDays(today,-5))+' 11:20',role:'operations',desc:'客户反映加热不均'},{action:'仓配签收',user:'仓配-王强',time:fmtDate(addDays(today,-4))+' 09:15',role:'warehouse',desc:'已签收外观完好'},{action:'质量检测',user:'仓配-王强',time:fmtDate(addDays(today,-3))+' 15:40',role:'warehouse',desc:'检测确认加热管故障'}]},
    {id:'RT20260606005',platformOrderNo:'LAZADA-PH-20260603-99821',customsNo:'CUS-HK-2026-07734',sku:'SKU-TOY-05672',productName:'儿童益智积木套装',returnReason:'配件缺失',returnDate:fmtDate(addDays(today,-2)),status:'pending',priority:'low',warehouse:'马尼拉仓',quantity:1,registeredBy:'运营-赵伟',registeredAt:fmtDate(addDays(today,-2))+' 10:08',currentHandler:'warehouse',dueDate:fmtDate(today),isDelayed:false,isNewReturn:false,history:[{action:'退件登记',user:'运营-赵伟',time:fmtDate(addDays(today,-2))+' 10:08',role:'operations',desc:'客户反馈配件缺失'}]}
  ],
  restocks: [
    {id:'RS20260606001',returnId:'RT20260520012',platformOrderNo:'AMZ-20260515-44521',sku:'SKU-ELEC-00089',productName:'USB-C 快充充电器',restockDate:fmtDate(today),quantity:3,warehouse:'洛杉矶仓',location:'A-03-12',status:'completed',processedBy:'仓配-王强',remarks:'退件检测后功能正常，清洁后重新上架',history:[{action:'质检通过',user:'仓配-王强',time:fmtDate(addDays(today,-1))+' 11:30',role:'warehouse',desc:'功能检测正常'},{action:'清洁翻新',user:'仓配-王强',time:fmtDate(addDays(today,-1))+' 14:20',role:'warehouse',desc:'完成清洁包装'},{action:'重新上架',user:'仓配-王强',time:fmtDate(today)+' 09:45',role:'warehouse',desc:'上架至A-03-12'}]},
    {id:'RS20260605002',returnId:'RT20260518008',platformOrderNo:'SHOPEE-SG-20260510-22103',sku:'SKU-HOME-03981',productName:'北欧风格装饰台灯',restockDate:fmtDate(addDays(today,-1)),quantity:1,warehouse:'新加坡仓',location:'B-02-08',status:'completed',processedBy:'仓配-陈杰',remarks:'客户误购全新未使用直接重新上架',history:[{action:'外观检查',user:'仓配-陈杰',time:fmtDate(addDays(today,-1))+' 10:15',role:'warehouse',desc:'全新未拆封'},{action:'重新上架',user:'仓配-陈杰',time:fmtDate(addDays(today,-1))+' 11:00',role:'warehouse',desc:'上架至B-02-08'}]},
    {id:'RS20260603003',returnId:'RT20260515003',platformOrderNo:'AMZ-20260508-77829',sku:'SKU-KITCHEN-01562',productName:'硅胶烘焙工具套装',restockDate:fmtDate(addDays(today,-3)),quantity:2,warehouse:'洛杉矶仓',location:'C-01-15',status:'completed',processedBy:'仓配-王强',remarks:'更换破损配件后重新上架',history:[{action:'配件更换',user:'仓配-王强',time:fmtDate(addDays(today,-4))+' 15:30',role:'warehouse',desc:'更换破损刮刀'},{action:'重新包装',user:'仓配-王强',time:fmtDate(addDays(today,-3))+' 09:20',role:'warehouse',desc:'完成重新包装'},{action:'重新上架',user:'仓配-王强',time:fmtDate(addDays(today,-3))+' 11:10',role:'warehouse',desc:'上架至C-01-15'}]}
  ],
  history: [
    {id:'H001',action:'创建退件登记',target:'RT20260606001',user:'运营-张敏',time:fmtDate(today)+' 09:15',role:'operations',desc:'创建退件单：无线蓝牙耳机 Pro 2代'},
    {id:'H002',action:'签收退件',target:'RT20260606003',user:'仓配-陈杰',time:fmtDate(today)+' 08:30',role:'warehouse',desc:'海外仓签收：面部精华液套装'},
    {id:'H003',action:'重新上架',target:'RS20260606001',user:'仓配-王强',time:fmtDate(today)+' 09:45',role:'warehouse',desc:'USB-C 快充充电器 重新上架'},
    {id:'H004',action:'创建退件登记',target:'RT20260606003',user:'运营-刘芳',time:fmtDate(addDays(today,-1))+' 16:45',role:'operations',desc:'创建退件单：面部精华液套装'},
    {id:'H005',action:'质量检测',target:'RT20260606004',user:'仓配-王强',time:fmtDate(addDays(today,-3))+' 15:40',role:'warehouse',desc:'不锈钢料理锅 检测确认加热管故障'},
    {id:'H006',action:'移交关务',target:'RT20260606002',user:'仓配-王强',time:fmtDate(addDays(today,-2))+' 11:00',role:'warehouse',desc:'智能空气加湿器 移交关务确认'},
    {id:'H007',action:'重新上架',target:'RS20260605002',user:'仓配-陈杰',time:fmtDate(addDays(today,-1))+' 11:00',role:'warehouse',desc:'北欧风格装饰台灯 重新上架'}
  ],
  recentOpened: [
    {type:'return',id:'RT20260606002',title:'智能空气加湿器 - 破损处理',time:fmtDate(addDays(today,-1))+' 16:30',icon:'📦'},
    {type:'return',id:'RT20260606004',title:'不锈钢料理锅 - 质量检测',time:fmtDate(addDays(today,-1))+' 14:20',icon:'📦'},
    {type:'restock',id:'RS20260606001',title:'USB-C快充充电器 - 重新上架',time:fmtDate(today)+' 09:50',icon:'📥'},
    {type:'return',id:'RT20260606003',title:'面部精华液套装 - 签收处理',time:fmtDate(today)+' 08:35',icon:'📦'}
  ],
  getReturns(f={}){let r=[...this.returns];if(f.status)r=r.filter(x=>x.status===f.status);if(f.handler)r=r.filter(x=>x.currentHandler===f.handler);if(f.delayed)r=r.filter(x=>x.isDelayed);if(f.newReturn)r=r.filter(x=>x.isNewReturn);if(f.todayDue)r=r.filter(x=>x.dueDate===fmtDate(today));return r;},
  getReturnById(id){return this.returns.find(x=>x.id===id);},
  getRestocks(f={}){let r=[...this.restocks];if(f.status)r=r.filter(x=>x.status===f.status);return r;},
  getRestockById(id){return this.restocks.find(x=>x.id===id);},
  getStats(){const t=fmtDate(today);return{pendingReturns:this.returns.filter(x=>x.status==='pending').length,delayedReturns:this.returns.filter(x=>x.isDelayed).length,todayReturns:this.returns.filter(x=>x.returnDate===t).length,todayRestocks:this.restocks.filter(x=>x.restockDate===t).length,processingReturns:this.returns.filter(x=>x.status==='processing').length};},
  addHistory(action,target,user,role,desc){const n=new Date();const t=fmtDate(n)+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');this.history.unshift({id:'H'+Date.now(),action,target,user,role,desc,time:t});},
  updateReturnStatus(id,status,handler,remark){const r=this.getReturnById(id);if(r){r.status=status;r.currentHandler=handler;const n=new Date();const t=fmtDate(n)+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');r.history.push({action:'状态更新',user:'当前用户',time:t,role:handler,desc:remark||'状态已更新'});this.addHistory('状态更新',id,'当前用户',handler,remark||'退件单状态更新');}},
  createRestock(returnId,sku,productName,quantity,warehouse,remarks){const n=new Date();const id='RS'+n.getFullYear()+(n.getMonth()+1).toString().padStart(2,'0')+n.getDate().toString().padStart(2,'0')+Math.floor(Math.random()*1000).toString().padStart(3,'0');const t=fmtDate(n)+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');const rs={id,returnId,sku,productName,restockDate:fmtDate(n),quantity,warehouse,location:'',status:'processing',processedBy:'当前用户',remarks,history:[{action:'创建上架单',user:'当前用户',time:t,role:'warehouse',desc:remarks||'创建重新上架单'}]};this.restocks.unshift(rs);this.addHistory('创建上架单',id,'当前用户','warehouse',remarks||'创建重新上架单：'+productName);return rs;}
};

const App = {
  currentPage:'dashboard',currentRole:'warehouse',
  roleNames:{warehouse:'仓配专员',operations:'运营',customs:'关务'},
  init(){this.bindEvents();this.renderPage('dashboard');this.updateBadges();},
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
    const titles={dashboard:'最近打开','return-register':'退件登记处理',restock:'重新上架回看',history:'操作历史'};
    document.getElementById('breadcrumb').textContent=titles[page];
    const c=document.getElementById('page-container');
    switch(page){
      case'dashboard':c.innerHTML=this.renderDashboard();this.bindDashboardEvents();break;
      case'return-register':c.innerHTML=this.renderReturnRegister();this.bindReturnEvents();break;
      case'restock':c.innerHTML=this.renderRestock();this.bindRestockEvents();break;
      case'history':c.innerHTML=this.renderHistory();break;
    }
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
  renderReturnRegister(){
    const returns=AppData.getReturns();
    const sl={pending:'待签收',processing:'处理中',completed:'已完成',returned:'已退回'};
    const hl={warehouse:'仓配',operations:'运营',customs:'关务'};
    return `
      <div class="filter-bar">
        <div class="filter-group"><label>状态:</label><select id="filter-status"><option value="">全部</option><option value="pending">待签收</option><option value="processing">处理中</option></select></div>
        <div class="filter-group"><label>当前处理:</label><select id="filter-handler"><option value="">全部</option><option value="warehouse">仓配</option><option value="operations">运营</option><option value="customs">关务</option></select></div>
        <div class="filter-group"><label>搜索:</label><input type="text" id="search-return" placeholder="输入单号或商品名"></div>
        ${this.currentRole==='operations'?`<button class="btn btn-primary" id="btn-new-return">➕ 新建退件登记</button>`:''}
      </div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>退件单号</th><th>平台订单号</th><th>商品</th><th>退件原因</th><th>状态</th><th>当前处理</th><th>截止日期</th><th>是否拖延</th><th>操作</th></tr></thead><tbody id="return-table-body">
        ${returns.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.platformOrderNo}</td><td>${r.productName}</td><td>${r.returnReason}</td><td><span class="status-badge ${r.isDelayed?'delayed':r.status}">${r.isDelayed?'已拖延':sl[r.status]}</span></td><td>${hl[r.currentHandler]}</td><td>${r.dueDate}</td><td>${r.isDelayed?'<span style=\"color:#ef4444\">是</span>':'<span style=\"color:#10b981\">否</span>'}</td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-return" data-id="${r.id}">详情</button>${this.currentRole==='warehouse'&&r.currentHandler==='warehouse'?`<button class="btn btn-sm btn-success" data-action="process-return" data-id="${r.id}">处理</button>`:''}${this.currentRole==='customs'&&r.currentHandler==='customs'?`<button class="btn btn-sm btn-warning" data-action="customs-review" data-id="${r.id}">关务审核</button>`:''}</div></td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  },
  bindReturnEvents(){
    document.querySelectorAll('[data-action="view-return"]').forEach(b=>b.addEventListener('click',()=>this.showReturnDetail(b.dataset.id)));
    document.querySelectorAll('[data-action="process-return"]').forEach(b=>b.addEventListener('click',()=>this.showProcessModal(b.dataset.id)));
    document.querySelectorAll('[data-action="customs-review"]').forEach(b=>b.addEventListener('click',()=>this.showCustomsModal(b.dataset.id)));
    const bn=document.getElementById('btn-new-return');if(bn)bn.addEventListener('click',()=>this.showNewReturnModal());
    const fs=document.getElementById('filter-status');const fh=document.getElementById('filter-handler');const si=document.getElementById('search-return');
    if(fs)fs.addEventListener('change',()=>this.filterReturns());
    if(fh)fh.addEventListener('change',()=>this.filterReturns());
    if(si)si.addEventListener('input',()=>this.filterReturns());
  },
  filterReturns(){
    const st=document.getElementById('filter-status').value;const hd=document.getElementById('filter-handler').value;const sc=document.getElementById('search-return').value.toLowerCase();
    let rs=AppData.getReturns();
    if(st)rs=rs.filter(r=>r.status===st);
    if(hd)rs=rs.filter(r=>r.currentHandler===hd);
    if(sc)rs=rs.filter(r=>r.id.toLowerCase().includes(sc)||r.productName.toLowerCase().includes(sc)||r.platformOrderNo.toLowerCase().includes(sc));
    const sl={pending:'待签收',processing:'处理中',completed:'已完成'};const hl={warehouse:'仓配',operations:'运营',customs:'关务'};
    document.getElementById('return-table-body').innerHTML=rs.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.platformOrderNo}</td><td>${r.productName}</td><td>${r.returnReason}</td><td><span class="status-badge ${r.isDelayed?'delayed':r.status}">${r.isDelayed?'已拖延':sl[r.status]}</span></td><td>${hl[r.currentHandler]}</td><td>${r.dueDate}</td><td>${r.isDelayed?'<span style=\"color:#ef4444\">是</span>':'<span style=\"color:#10b981\">否</span>'}</td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-return" data-id="${r.id}">详情</button>${this.currentRole==='warehouse'&&r.currentHandler==='warehouse'?`<button class="btn btn-sm btn-success" data-action="process-return" data-id="${r.id}">处理</button>`:''}${this.currentRole==='customs'&&r.currentHandler==='customs'?`<button class="btn btn-sm btn-warning" data-action="customs-review" data-id="${r.id}">关务审核</button>`:''}</div></td></tr>`).join('');
    this.bindReturnEvents();
  },
  renderRestock(){
    const restocks=AppData.getRestocks();
    return `
      <div class="tabs"><div class="tab-item active" data-tab="all">全部记录</div><div class="tab-item" data-tab="today">今日上架</div></div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>上架单号</th><th>关联退件</th><th>商品名称</th><th>SKU</th><th>数量</th><th>仓库</th><th>库位</th><th>上架时间</th><th>操作人</th><th>操作</th></tr></thead><tbody id="restock-table-body">
        ${restocks.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.returnId}</td><td>${r.productName}</td><td>${r.sku}</td><td>${r.quantity}</td><td>${r.warehouse}</td><td>${r.location||'-'}</td><td>${r.restockDate}</td><td>${r.processedBy}</td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-restock" data-id="${r.id}">回看</button></div></td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  },
  bindRestockEvents(){
    document.querySelectorAll('[data-action="view-restock"]').forEach(b=>b.addEventListener('click',()=>this.showRestockDetail(b.dataset.id)));
    document.querySelectorAll('.tab-item').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.tab-item').forEach(x=>x.classList.remove('active'));t.classList.add('active');this.filterRestocks(t.dataset.tab);}));
  },
  filterRestocks(tab){
    const t=fmtDate(today);let rs=AppData.getRestocks();if(tab==='today')rs=rs.filter(r=>r.restockDate===t);
    document.getElementById('restock-table-body').innerHTML=rs.map(r=>`<tr><td><strong>${r.id}</strong></td><td>${r.returnId}</td><td>${r.productName}</td><td>${r.sku}</td><td>${r.quantity}</td><td>${r.warehouse}</td><td>${r.location||'-'}</td><td>${r.restockDate}</td><td>${r.processedBy}</td><td><div class="action-buttons"><button class="btn btn-sm btn-outline" data-action="view-restock" data-id="${r.id}">回看</button></div></td></tr>`).join('');
    this.bindRestockEvents();
  },
  renderHistory(){
    const rl={warehouse:'仓配',operations:'运营',customs:'关务'};
    return `
      <div class="filter-bar"><div class="filter-group"><label>操作角色:</label><select id="filter-history-role"><option value="">全部</option><option value="warehouse">仓配</option><option value="operations">运营</option><option value="customs">关务</option></select></div><div class="filter-group"><label>搜索:</label><input type="text" id="search-history" placeholder="搜索操作内容"></div></div>
      <div class="card"><div class="card-body"><div class="table-container"><table><thead><tr><th>时间</th><th>操作人</th><th>角色</th><th>操作类型</th><th>关联单号</th><th>操作说明</th></tr></thead><tbody id="history-table-body">
        ${AppData.history.map(h=>`<tr><td>${h.time}</td><td>${h.user}</td><td><span class="status-badge processing">${rl[h.role]}</span></td><td>${h.action}</td><td><strong>${h.target}</strong></td><td>${h.desc}</td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  },
  showReturnDetail(id){
    const r=AppData.getReturnById(id);if(!r)return;
    const sl={pending:'待签收',processing:'处理中',completed:'已完成'};const hl={warehouse:'仓配',operations:'运营',customs:'关务'};
    document.getElementById('modal-title').textContent='退件详情 - '+r.id;
    document.getElementById('modal-body').innerHTML=`
      <div class="detail-grid" style="margin-bottom:24px;">
        <div class="detail-item"><span class="detail-label">平台订单号</span><span class="detail-value">${r.platformOrderNo}</span></div>
        <div class="detail-item"><span class="detail-label">报关单号</span><span class="detail-value">${r.customsNo}</span></div>
        <div class="detail-item"><span class="detail-label">商品名称</span><span class="detail-value">${r.productName}</span></div>
        <div class="detail-item"><span class="detail-label">SKU</span><span class="detail-value">${r.sku}</span></div>
        <div class="detail-item"><span class="detail-label">退件数量</span><span class="detail-value">${r.quantity} 件</span></div>
        <div class="detail-item"><span class="detail-label">所在仓库</span><span class="detail-value">${r.warehouse}</span></div>
        <div class="detail-item"><span class="detail-label">当前状态</span><span class="detail-value"><span class="status-badge ${r.isDelayed?'delayed':r.status}">${r.isDelayed?'已拖延':sl[r.status]}</span></span></div>
        <div class="detail-item"><span class="detail-label">当前处理</span><span class="detail-value">${hl[r.currentHandler]}</span></div>
        <div class="detail-item"><span class="detail-label">登记人</span><span class="detail-value">${r.registeredBy}</span></div>
        <div class="detail-item"><span class="detail-label">登记时间</span><span class="detail-value">${r.registeredAt}</span></div>
        <div class="detail-item" style="grid-column:span 2;"><span class="detail-label">退件原因</span><span class="detail-value">${r.returnReason}</span></div>
      </div>
      <div class="section-title">📜 操作历史</div>
      <div class="timeline">
        ${r.history.map(h=>`<div class="timeline-item"><div class="timeline-dot ${h.role==='warehouse'?'success':h.role==='customs'?'warning':''}"></div><div class="timeline-content"><div class="timeline-title">${h.action}</div><div class="timeline-meta"><span>👤 ${h.user}</span><span>🕐 ${h.time}</span><span>🏷️ ${hl[h.role]}</span></div>${h.desc?`<div class="timeline-desc">${h.desc}</div>`:''}</div></div>`).join('')}
      </div>
    `;
    this.openModal();
  },
  showRestockDetail(id){
    const r=AppData.getRestockById(id);if(!r)return;
    const hl={warehouse:'仓配',operations:'运营',customs:'关务'};
    document.getElementById('modal-title').textContent='重新上架回看 - '+r.id;
    document.getElementById('modal-body').innerHTML=`
      <div class="detail-grid" style="margin-bottom:24px;">
        <div class="detail-item"><span class="detail-label">关联退件单号</span><span class="detail-value">${r.returnId}</span></div>
        <div class="detail-item"><span class="detail-label">商品名称</span><span class="detail-value">${r.productName}</span></div>
        <div class="detail-item"><span class="detail-label">SKU</span><span class="detail-value">${r.sku}</span></div>
        <div class="detail-item"><span class="detail-label">上架数量</span><span class="detail-value">${r.quantity} 件</span></div>
        <div class="detail-item"><span class="detail-label">仓库</span><span class="detail-value">${r.warehouse}</span></div>
        <div class="detail-item"><span class="detail-label">库位</span><span class="detail-value">${r.location||'未分配'}</span></div>
        <div class="detail-item"><span class="detail-label">上架时间</span><span class="detail-value">${r.restockDate}</span></div>
        <div class="detail-item"><span class="detail-label">操作人</span><span class="detail-value">${r.processedBy}</span></div>
        <div class="detail-item" style="grid-column:span 2;"><span class="detail-label">备注</span><span class="detail-value">${r.remarks||'-'}</span></div>
      </div>
      <div class="section-title">📜 上架流程历史</div>
      <div class="timeline">
        ${r.history.map(h=>`<div class="timeline-item"><div class="timeline-dot ${h.role==='warehouse'?'success':h.role==='customs'?'warning':''}"></div><div class="timeline-content"><div class="timeline-title">${h.action}</div><div class="timeline-meta"><span>👤 ${h.user}</span><span>🕐 ${h.time}</span><span>🏷️ ${hl[h.role]}</span></div>${h.desc?`<div class="timeline-desc">${h.desc}</div>`:''}</div></div>`).join('')}
      </div>
    `;
    this.openModal();
  },
  showProcessModal(id){
    const r=AppData.getReturnById(id);if(!r)return;
    document.getElementById('modal-title').textContent='处理退件 - '+r.id;
    document.getElementById('modal-body').innerHTML=`
      <div class="form-group"><label>商品：${r.productName}</label></div>
      <div class="form-group"><label>处理动作</label><select id="process-action"><option value="inspect">质量检测</option><option value="to_customs">移交关务审核</option><option value="to_restock">创建重新上架单</option><option value="complete">完成处理</option></select></div>
      <div class="form-group"><label>处理备注</label><textarea id="process-remark" placeholder="请输入处理说明..."></textarea></div>
      <div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">取消</button><button class="btn btn-primary" onclick="App.submitProcess('${id}')">确认提交</button></div>
    `;
    this.openModal();
  },
  submitProcess(id){
    const a=document.getElementById('process-action').value;const rm=document.getElementById('process-remark').value;
    if(a==='to_customs'){AppData.updateReturnStatus(id,'processing','customs',rm||'移交关务审核');this.showToast('已移交关务审核','success');}
    else if(a==='to_restock'){const r=AppData.getReturnById(id);AppData.createRestock(id,r.sku,r.productName,r.quantity,r.warehouse,rm);AppData.updateReturnStatus(id,'completed','warehouse',rm||'已创建重新上架单');this.showToast('已创建重新上架单','success');}
    else{AppData.updateReturnStatus(id,'processing','warehouse',rm||'质量检测完成');this.showToast('处理已提交','success');}
    this.closeModal();this.renderPage('return-register');this.updateBadges();
  },
  showCustomsModal(id){
    const r=AppData.getReturnById(id);if(!r)return;
    document.getElementById('modal-title').textContent='关务审核 - '+r.id;
    document.getElementById('modal-body').innerHTML=`
      <div class="form-group"><label>报关单号：${r.customsNo}</label></div>
      <div class="form-group"><label>商品：${r.productName}</label></div>
      <div class="form-group"><label>审核结果</label><select id="customs-result"><option value="pass">审核通过，可返修入境</option><option value="reject">审核不通过，需销毁或退回</option><option value="need_more">需补充资料</option></select></div>
      <div class="form-group"><label>审核意见</label><textarea id="customs-remark" placeholder="请输入审核意见..."></textarea></div>
      <div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">取消</button><button class="btn btn-primary" onclick="App.submitCustoms('${id}')">提交审核</button></div>
    `;
    this.openModal();
  },
  submitCustoms(id){
    const rs=document.getElementById('customs-result').value;const rm=document.getElementById('customs-remark').value;
    if(rs==='pass'){AppData.updateReturnStatus(id,'processing','warehouse','关务审核通过：'+(rm||''));this.showToast('审核通过，已退回仓配处理','success');}
    else{AppData.updateReturnStatus(id,'processing','operations','关务审核结果：'+rs+' - '+(rm||''));this.showToast('审核意见已提交运营','warning');}
    this.closeModal();this.renderPage('return-register');this.updateBadges();
  },
  showNewReturnModal(){
    document.getElementById('modal-title').textContent='新建退件登记';
    document.getElementById('modal-body').innerHTML=`
      <div class="form-row"><div class="form-group"><label>平台订单号 *</label><input type="text" id="new-order-no" placeholder="如：AMZ-2026xxxx-xxxxx"></div><div class="form-group"><label>报关单号</label><input type="text" id="new-customs-no" placeholder="如：CUS-GZ-2026-xxxxx"></div></div>
      <div class="form-row"><div class="form-group"><label>SKU *</label><input type="text" id="new-sku" placeholder="商品SKU"></div><div class="form-group"><label>商品名称 *</label><input type="text" id="new-product" placeholder="商品名称"></div></div>
      <div class="form-row"><div class="form-group"><label>数量 *</label><input type="number" id="new-qty" value="1" min="1"></div><div class="form-group"><label>仓库</label><select id="new-warehouse"><option value="洛杉矶仓">洛杉矶仓</option><option value="新加坡仓">新加坡仓</option><option value="马尼拉仓">马尼拉仓</option></select></div></div>
      <div class="form-group"><label>退件原因 *</label><select id="new-reason"><option value="客户质量投诉">客户质量投诉</option><option value="物流破损">物流破损</option><option value="客户误购">客户误购</option><option value="配件缺失">配件缺失</option><option value="其他">其他</option></select></div>
      <div class="form-group"><label>详细说明</label><textarea id="new-desc" placeholder="请详细描述退件情况..."></textarea></div>
      <div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">取消</button><button class="btn btn-primary" onclick="App.submitNewReturn()">提交登记</button></div>
    `;
    this.openModal();
  },
  submitNewReturn(){
    const on=document.getElementById('new-order-no').value;const sku=document.getElementById('new-sku').value;const pn=document.getElementById('new-product').value;
    const q=parseInt(document.getElementById('new-qty').value);const rs=document.getElementById('new-reason').value;const ds=document.getElementById('new-desc').value;
    if(!on||!sku||!pn){this.showToast('请填写必填项','error');return;}
    const n=new Date();const ds2=n.getFullYear().toString()+(n.getMonth()+1).toString().padStart(2,'0')+n.getDate().toString().padStart(2,'0');
    const id='RT'+ds2+Math.floor(Math.random()*1000).toString().padStart(3,'0');
    const t=fmtDate(n)+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');
    const nr={id,platformOrderNo:on,customsNo:document.getElementById('new-customs-no').value||'-',sku,productName:pn,returnReason:rs+(ds?'-'+ds:''),returnDate:fmtDate(n),status:'pending',priority:'medium',warehouse:document.getElementById('new-warehouse').value,quantity:q,registeredBy:this.roleNames[this.currentRole],registeredAt:t,currentHandler:'warehouse',dueDate:fmtDate(n),isDelayed:false,isNewReturn:true,history:[{action:'退件登记',user:this.roleNames[this.currentRole],time:t,role:this.currentRole,desc:rs+(ds?'：'+ds:'')}]};
    AppData.returns.unshift(nr);AppData.addHistory('创建退件登记',id,this.roleNames[this.currentRole],this.currentRole,'创建退件单：'+pn);
    this.showToast('退件登记已提交','success');this.closeModal();this.renderPage('return-register');this.updateBadges();
  },
  signReturn(id){const r=AppData.getReturnById(id);if(r){r.status='processing';r.isNewReturn=false;const n=new Date();const t=fmtDate(n)+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');r.history.push({action:'仓配签收',user:this.roleNames[this.currentRole],time:t,role:'warehouse',desc:'海外仓已签收退件'});AppData.addHistory('签收退件',id,this.roleNames[this.currentRole],'warehouse',r.productName+' 已签收');this.showToast('签收成功','success');this.renderPage('dashboard');this.updateBadges();}},
  openModal(){document.getElementById('modal-overlay').style.display='flex';},
  closeModal(){document.getElementById('modal-overlay').style.display='none';},
  showToast(msg,type=''){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+type;setTimeout(()=>{t.className='toast';},2500);},
  updateBadges(){const p=AppData.getReturns({status:'pending'}).length;const b=document.getElementById('return-badge');b.textContent=p;b.style.display=p>0?'inline-block':'none';}
};
document.addEventListener('DOMContentLoaded',()=>{App.init();});
