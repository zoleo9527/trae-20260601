const today = new Date('2026-06-06');
const fmtDate = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const nd = new Date(d); nd.setDate(nd.getDate()+n); return nd; };
const nowTime = () => { const n=new Date(); return fmtDate(n)+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0'); };

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
  getRoleStats(role){
    if(role==='operations')return{myPending:this.returns.filter(x=>x.currentHandler==='operations').length,myDelayed:this.returns.filter(x=>x.currentHandler==='operations'&&x.isDelayed).length,totalRegistered:this.returns.filter(x=>x.registeredBy.includes('运营')).length};
    if(role==='warehouse')return{toSign:this.returns.filter(x=>x.status==='pending').length,toProcess:this.returns.filter(x=>x.currentHandler==='warehouse'&&x.status==='processing').length,myDelayed:this.returns.filter(x=>x.currentHandler==='warehouse'&&x.isDelayed).length,toRestock:this.restocks.filter(x=>x.status==='processing').length};
    if(role==='customs')return{toReview:this.returns.filter(x=>x.currentHandler==='customs').length,myDelayed:this.returns.filter(x=>x.currentHandler==='customs'&&x.isDelayed).length,totalReviewed:this.history.filter(x=>x.role==='customs').length};
    return{};
  },
  addHistory(action,target,user,role,desc){const n=new Date();const t=fmtDate(n)+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');this.history.unshift({id:'H'+Date.now(),action,target,user,role,desc,time:t});},
  addToRecent(type,id,title,icon){
    const t=nowTime();
    this.recentOpened=this.recentOpened.filter(x=>!(x.type===type&&x.id===id));
    this.recentOpened.unshift({type,id,title,time:t,icon});
    if(this.recentOpened.length>10)this.recentOpened=this.recentOpened.slice(0,10);
  },
  addReturnHistory(id,action,user,role,desc){const r=this.getReturnById(id);if(r){const t=nowTime();r.history.push({action,user,time:t,role,desc});}},
  addRestockHistory(id,action,user,role,desc){const r=this.getRestockById(id);if(r){const t=nowTime();r.history.push({action,user,time:t,role,desc});}},
  updateReturnStatus(id,status,handler,remark){const r=this.getReturnById(id);if(r){r.status=status;r.currentHandler=handler;const t=nowTime();r.history.push({action:'状态更新',user:'当前用户',time:t,role:handler,desc:remark||'状态已更新'});this.addHistory('状态更新',id,'当前用户',handler,remark||'退件单状态更新');}},
  createRestock(returnId,sku,productName,quantity,warehouse,remarks){const n=new Date();const id='RS'+n.getFullYear()+(n.getMonth()+1).toString().padStart(2,'0')+n.getDate().toString().padStart(2,'0')+Math.floor(Math.random()*1000).toString().padStart(3,'0');const t=nowTime();const rs={id,returnId,sku,productName,restockDate:fmtDate(n),quantity,warehouse,location:'',status:'processing',processedBy:'当前用户',remarks,history:[{action:'创建上架单',user:'当前用户',time:t,role:'warehouse',desc:remarks||'创建重新上架单'}]};this.restocks.unshift(rs);this.addHistory('创建上架单',id,'当前用户','warehouse',remarks||'创建重新上架单：'+productName);this.addToRecent('restock',id,productName+' - 待上架','📥');return rs;}
};

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
