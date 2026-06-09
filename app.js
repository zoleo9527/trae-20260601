(function() {
  'use strict';

  var DB_NAME = 'DentalExpiryDB';
  var DB_VERSION = 1;
  var db = null;

  var ROLE_MAP = { sales_admin: '销售内勤', warehouse: '仓库员', after_sales: '售后专员' };
  var WS_MAP = { pending_confirmation: '待确认', confirmed: '已确认', rejected: '已驳回', exchange_initiated: '已发起换货' };
  var WS_CLS = { pending_confirmation: 'pending', confirmed: 'confirmed', rejected: 'rejected', exchange_initiated: 'exchanged' };
  var ES_MAP = { pending_process: '待处理', processing: '处理中', rejected: '已驳回', completed: '已完成' };
  var ES_CLS = { pending_process: 'pending', processing: 'processing', rejected: 'rejected', completed: 'completed' };
  var LV_MAP = { '30': '30天紧急', '60': '60天预警', '90': '90天提醒' };
  var LV_CLS = { '30': 'level-30', '60': 'level-60', '90': 'level-90' };

  var S = { currentRole: 'sales_admin', currentView: 'dashboard', warnings: [], exchanges: [], logs: [], recentOpens: [] };

  function uid() { return 'xxxx-xxxx-xxxx'.replace(/x/g, function() { return (Math.random()*16|0).toString(16); }); }
  function now() { return new Date().toISOString(); }
  function fmtDt(iso) { if(!iso)return'-';var d=new Date(iso);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  function fmtDs(iso) { if(!iso)return'-';var d=new Date(iso);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function daysDiff(d1,d2){var a=new Date(d1);a.setHours(0,0,0,0);var b=new Date(d2);b.setHours(0,0,0,0);return Math.ceil((b-a)/86400000);}
  function calcLv(ed){var d=daysDiff(new Date(),ed);if(d<=30)return'30';if(d<=60)return'60';return'90';}
  function esc(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function initDB(){return new Promise(function(res,rej){var r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=function(e){var d=e.target.result;if(!d.objectStoreNames.contains('warnings'))d.createObjectStore('warnings',{keyPath:'id'});if(!d.objectStoreNames.contains('exchanges'))d.createObjectStore('exchanges',{keyPath:'id'});if(!d.objectStoreNames.contains('logs'))d.createObjectStore('logs',{keyPath:'id'});if(!d.objectStoreNames.contains('recentOpens'))d.createObjectStore('recentOpens',{keyPath:'id'});};r.onsuccess=function(e){db=e.target.result;res(db);};r.onerror=function(e){rej(e);};});}
  function dbAll(sn){return new Promise(function(res,rej){var tx=db.transaction(sn,'readonly');var st=tx.objectStore(sn);var r=st.getAll();r.onsuccess=function(){res(r.result);};r.onerror=function(e){rej(e);};});}
  function dbPut(sn,d){return new Promise(function(res,rej){var tx=db.transaction(sn,'readwrite');var st=tx.objectStore(sn);var r=st.put(d);r.onsuccess=function(){res(r.result);};r.onerror=function(e){rej(e);};});}

  function svLS(k,d){try{localStorage.setItem('dt_'+k,JSON.stringify(d));}catch(e){}}
  function ldLS(k){try{var d=localStorage.getItem('dt_'+k);return d?JSON.parse(d):null;}catch(e){return null;}}
  function bkLS(){svLS('w',S.warnings);svLS('e',S.exchanges);svLS('l',S.logs);svLS('r',S.recentOpens);svLS('role',S.currentRole);}

  function addLog(et,eid,act,det){var l={id:uid(),entityType:et,entityId:eid,action:act,operator:ROLE_MAP[S.currentRole],role:S.currentRole,timestamp:now(),details:det||''};S.logs.unshift(l);dbPut('logs',l);bkLS();}
  function addRecent(et,eid,title){S.recentOpens=S.recentOpens.filter(function(r){return!(r.entityType===et&&r.entityId===eid);});S.recentOpens.unshift({id:uid(),entityType:et,entityId:eid,title:title,openedAt:now(),operator:ROLE_MAP[S.currentRole]});if(S.recentOpens.length>20)S.recentOpens=S.recentOpens.slice(0,20);bkLS();}

  function toast(msg,type){type=type||'info';var c=document.getElementById('toastContainer');var t=document.createElement('div');t.className='toast '+type;t.textContent=msg;c.appendChild(t);setTimeout(function(){t.remove();},3000);}

  function modal(title,body,foot){var o=document.getElementById('modalOverlay');var m=document.getElementById('modalContent');m.innerHTML='<div class="modal-header"><h3>'+title+'</h3><button class="modal-close" id="mClose">&times;</button></div><div class="modal-body">'+body+'</div>'+(foot?'<div class="modal-footer">'+foot+'</div>':'');o.style.display='flex';document.getElementById('mClose').onclick=cmodal;o.onclick=function(e){if(e.target===o)cmodal();};}
  function cmodal(){document.getElementById('modalOverlay').style.display='none';}

  function nav(v){S.currentView=v;document.querySelectorAll('.nav-item').forEach(function(el){el.classList.toggle('active',el.dataset.view===v);});render();}
  function role(r){S.currentRole=r;svLS('role',r);document.querySelectorAll('.role-btn').forEach(function(el){el.classList.toggle('active',el.dataset.role===r);});render();}

  function badges(){var pw=S.warnings.filter(function(w){return S.currentRole==='warehouse'&&w.status==='pending_confirmation';}).length;var pe=S.exchanges.filter(function(e){return S.currentRole==='after_sales'&&(e.status==='pending_process'||e.status==='processing');}).length;var wb=document.getElementById('warningBadge');if(pw>0){wb.textContent=pw;wb.style.display='';}else{wb.style.display='none';}var eb=document.getElementById('exchangeBadge');if(pe>0){eb.textContent=pe;eb.style.display='';}else{eb.style.display='none';}}

  function render(){badges();var c=document.getElementById('viewContainer');switch(S.currentView){case'dashboard':c.innerHTML=vDash();break;case'warnings':c.innerHTML=vWarn();break;case'exchanges':c.innerHTML=vExch();break;case'history':c.innerHTML=vHist();break;case'recent':c.innerHTML=vRecent();break;default:c.innerHTML=vDash();}bindVE();}

  function vDash(){
    var t=S.warnings.length,p=S.warnings.filter(function(w){return w.status==='pending_confirmation';}).length,c2=S.warnings.filter(function(w){return w.status==='confirmed';}).length,ep=S.exchanges.filter(function(e){return e.status==='pending_process';}).length,epr=S.exchanges.filter(function(e){return e.status==='processing';}).length,ec=S.exchanges.filter(function(e){return e.status==='completed';}).length;
    var uw=S.warnings.filter(function(w){return w.status==='pending_confirmation'||w.status==='confirmed';}).slice(0,5);
    var rl=S.logs.slice(0,8);
    var h='<div class="page-header"><div><div class="page-title">工作台</div><div class="page-subtitle">当前角色：'+ROLE_MAP[S.currentRole]+'</div></div>';
    if(S.currentRole==='sales_admin')h+='<button class="btn btn-primary" id="btnNew">+ 提交临期预警</button>';
    h+='</div><div class="stats-grid">';
    h+='<div class="stat-card warning"><div class="stat-label">临期预警总数</div><div class="stat-value">'+t+'</div><div class="stat-sub">待确认 '+p+' 项</div></div>';
    h+='<div class="stat-card info"><div class="stat-label">已确认待换货</div><div class="stat-value">'+c2+'</div><div class="stat-sub">需发起换货处理</div></div>';
    h+='<div class="stat-card danger"><div class="stat-label">换货处理中</div><div class="stat-value">'+epr+'</div><div class="stat-sub">待处理 '+ep+' 项</div></div>';
    h+='<div class="stat-card success"><div class="stat-label">换货已完成</div><div class="stat-value">'+ec+'</div><div class="stat-sub">累计完成</div></div></div>';
    if(uw.length>0){h+='<div class="card"><div class="card-header"><h3>待处理预警</h3><button class="link-btn" data-nav="warnings">查看全部</button></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>耗材名称</th><th>批号</th><th>有效期</th><th>预警级别</th><th>状态</th><th>操作</th></tr></thead><tbody>';uw.forEach(function(w){h+='<tr><td>'+esc(w.productName)+'</td><td>'+esc(w.batchNo)+'</td><td>'+fmtDs(w.expiryDate)+'</td><td><span class="level-tag '+LV_CLS[w.warningLevel]+'">'+LV_MAP[w.warningLevel]+'</span></td><td><span class="status-tag '+WS_CLS[w.status]+'">'+WS_MAP[w.status]+'</span></td><td><button class="link-btn" data-action="viewW" data-id="'+w.id+'">详情</button></td></tr>';});h+='</tbody></table></div></div></div>';}
    if(rl.length>0){h+='<div class="card"><div class="card-header"><h3>最近操作</h3><button class="link-btn" data-nav="history">查看全部</button></div><div class="card-body" style="padding:14px 18px"><div class="timeline">';rl.forEach(function(l){h+='<div class="timeline-item"><div class="timeline-dot '+logDot(l.action)+'">'+logIco(l.action)+'</div><div class="timeline-content"><div class="timeline-title">'+esc(l.operator)+' · '+actLbl(l.action)+'</div><div class="timeline-meta">'+fmtDt(l.timestamp)+'</div>'+(l.details?'<div class="timeline-detail">'+esc(l.details)+'</div>':'')+'</div></div>';});h+='</div></div></div>';}
    h+=disclaimer();return h;
  }

  function vWarn(){
    var h='<div class="page-header"><div><div class="page-title">临期预警</div><div class="page-subtitle">管理口腔耗材临期预警信息</div></div>';
    if(S.currentRole==='sales_admin')h+='<button class="btn btn-primary" id="btnNew">+ 提交预警</button>';
    h+='</div><div class="card"><div class="card-body"><div class="table-wrap"><table><thead><tr><th>耗材名称</th><th>规格</th><th>厂家</th><th>批号</th><th>有效期</th><th>库存</th><th>预警级别</th><th>提交人</th><th>状态</th><th>操作</th></tr></thead><tbody>';
    if(S.warnings.length===0){h+='<tr><td colspan="10"><div class="empty-state"><p>暂无临期预警记录</p></div></td></tr>';}
    else{S.warnings.forEach(function(w){h+='<tr><td>'+esc(w.productName)+'</td><td>'+esc(w.specification||'-')+'</td><td>'+esc(w.manufacturer||'-')+'</td><td>'+esc(w.batchNo)+'</td><td>'+fmtDs(w.expiryDate)+'</td><td>'+w.stockQuantity+'</td><td><span class="level-tag '+LV_CLS[w.warningLevel]+'">'+LV_MAP[w.warningLevel]+'</span></td><td>'+esc(w.submittedBy)+'</td><td><span class="status-tag '+WS_CLS[w.status]+'">'+WS_MAP[w.status]+'</span></td><td>';
    h+='<button class="link-btn" data-action="viewW" data-id="'+w.id+'">详情</button> ';
    if(S.currentRole==='warehouse'&&w.status==='pending_confirmation'){h+='<button class="link-btn" data-action="confirmW" data-id="'+w.id+'">确认</button> <button class="link-btn" style="color:var(--red-500)" data-action="rejectW" data-id="'+w.id+'">驳回</button>';}
    if(S.currentRole==='sales_admin'&&w.status==='rejected'){h+='<button class="link-btn" data-action="suppW" data-id="'+w.id+'">补录</button>';}
    if(S.currentRole==='warehouse'&&w.status==='confirmed'){h+='<button class="link-btn" data-action="initEx" data-id="'+w.id+'">发起换货</button>';}
    h+='</td></tr>';});}
    h+='</tbody></table></div></div></div>';return h;
  }

  function vExch(){
    var h='<div class="page-header"><div><div class="page-title">换货处理</div><div class="page-subtitle">处理临期耗材换货流程</div></div></div>';
    h+='<div class="card"><div class="card-body"><div class="table-wrap"><table><thead><tr><th>换货单号</th><th>耗材名称</th><th>批号</th><th>数量</th><th>发起人</th><th>供应商</th><th>状态</th><th>操作</th></tr></thead><tbody>';
    if(S.exchanges.length===0){h+='<tr><td colspan="8"><div class="empty-state"><p>暂无换货处理记录</p></div></td></tr>';}
    else{S.exchanges.forEach(function(e){h+='<tr><td>'+esc(e.id)+'</td><td>'+esc(e.productName)+'</td><td>'+esc(e.batchNo)+'</td><td>'+e.quantity+'</td><td>'+esc(e.initiatedBy)+'</td><td>'+esc(e.supplierName||'-')+'</td><td><span class="status-tag '+ES_CLS[e.status]+'">'+ES_MAP[e.status]+'</span></td><td>';
    h+='<button class="link-btn" data-action="viewE" data-id="'+e.id+'">详情</button> ';
    if(S.currentRole==='after_sales'&&e.status==='pending_process'){h+='<button class="link-btn" data-action="procE" data-id="'+e.id+'">处理</button> <button class="link-btn" style="color:var(--red-500)" data-action="rejE" data-id="'+e.id+'">驳回</button>';}
    if(S.currentRole==='after_sales'&&e.status==='processing'){h+='<button class="btn btn-success btn-sm" data-action="compE" data-id="'+e.id+'">完成换货</button>';}
    h+='</td></tr>';});}
    h+='</tbody></table></div></div></div>';return h;
  }

  function vHist(){
    var h='<div class="page-header"><div><div class="page-title">操作历史</div><div class="page-subtitle">全部操作留痕记录</div></div></div>';
    h+='<div class="card"><div class="card-body" style="padding:18px">';
    if(S.logs.length===0){h+='<div class="empty-state"><p>暂无操作记录</p></div>';}
    else{h+='<div class="timeline">';S.logs.forEach(function(l){h+='<div class="timeline-item"><div class="timeline-dot '+logDot(l.action)+'">'+logIco(l.action)+'</div><div class="timeline-content"><div class="timeline-title">'+esc(l.operator)+' · '+actLbl(l.action)+'</div><div class="timeline-meta">'+fmtDt(l.timestamp)+' · '+(l.entityType==='warning'?'临期预警':'换货处理')+' · ID: '+esc(l.entityId)+'</div>'+(l.details?'<div class="timeline-detail">'+esc(l.details)+'</div>':'')+'</div></div>';});h+='</div>';}
    h+='</div></div>';return h;
  }

  function vRecent(){
    var h='<div class="page-header"><div><div class="page-title">最近打开</div><div class="page-subtitle">快速访问最近查看的记录</div></div></div>';
    if(S.recentOpens.length===0){h+='<div class="card"><div class="card-body"><div class="empty-state"><p>暂无最近打开记录</p></div></div></div>';}
    else{S.recentOpens.forEach(function(r){var ic=r.entityType==='warning'?'warning-icon':'exchange-icon';var lb=r.entityType==='warning'?'临期预警':'换货处理';h+='<div class="recent-item" data-action="openR" data-id="'+r.entityId+'"><div class="recent-icon '+ic+'">'+(r.entityType==='warning'?'⚠️':'🔄')+'</div><div class="recent-info"><div class="recent-name">'+esc(r.title)+'</div><div class="recent-meta">'+lb+' · '+esc(r.operator)+' · '+fmtDt(r.openedAt)+'</div></div></div>';});}
    return h;
  }

  function wDetail(w){
    var h='<div class="handover-flow">';
    var steps=[{l:'销售内勤提交',d:!!w.submittedAt,c:w.status==='pending_confirmation'},{l:'仓库员确认',d:w.status==='confirmed'||w.status==='exchange_initiated',c:w.status==='pending_confirmation'},{l:'发起换货',d:w.status==='exchange_initiated',c:w.status==='confirmed'}];
    steps.forEach(function(s,i){var cl=s.d?'done':(s.c?'current':'pending');h+='<span class="handover-step '+cl+'">'+(s.d?'✓ ':'')+s.l+'</span>';if(i<steps.length-1)h+='<span class="handover-arrow">→</span>';});
    h+='</div><div class="detail-section"><div class="detail-section-title">基本信息</div><div class="detail-grid">';
    h+=di('耗材名称',esc(w.productName))+di('规格',esc(w.specification||'-'))+di('厂家',esc(w.manufacturer||'-'))+di('批号',esc(w.batchNo));
    h+=di('有效期至',fmtDs(w.expiryDate))+di('库存数量',w.stockQuantity)+di('预警级别','<span class="level-tag '+LV_CLS[w.warningLevel]+'">'+LV_MAP[w.warningLevel]+'</span>')+di('存放位置',esc(w.storeLocation||'-'));
    h+=di('状态','<span class="status-tag '+WS_CLS[w.status]+'">'+WS_MAP[w.status]+'</span>')+di('备注',esc(w.remark||'-'))+di('提交人',esc(w.submittedBy))+di('提交时间',fmtDt(w.submittedAt));
    if(w.confirmedBy){h+=di('确认人',esc(w.confirmedBy))+di('确认时间',fmtDt(w.confirmedAt));}
    if(w.rejectedBy){h+=di('驳回人',esc(w.rejectedBy))+di('驳回时间',fmtDt(w.rejectedAt))+'<div class="detail-item" style="grid-column:span 2"><div class="detail-label">驳回原因</div><div class="detail-value" style="color:var(--red-600)">'+esc(w.rejectReason)+'</div></div>';}
    h+='</div></div>';
    if(w.supplementRecords&&w.supplementRecords.length>0){h+='<div class="detail-section"><div class="detail-section-title">补录记录</div>';w.supplementRecords.forEach(function(s){h+='<div class="supplement-item"><div class="supp-header">'+esc(s.operator)+' · '+fmtDt(s.timestamp)+'</div><div class="supp-body">'+esc(s.content)+'</div></div>';});h+='</div>';}
    if(w.exchangeId){var ex=S.exchanges.find(function(e){return e.id===w.exchangeId;});if(ex){h+='<div class="detail-section"><div class="detail-section-title">关联换货单</div><div class="detail-grid">'+di('换货单号',esc(ex.id))+di('状态','<span class="status-tag '+ES_CLS[ex.status]+'">'+ES_MAP[ex.status]+'</span>')+'</div></div>';}}
    h+=entLogs('warning',w.id);
    h+='<div class="actions-bar" style="margin-top:16px">';
    if(S.currentRole==='warehouse'&&w.status==='pending_confirmation'){h+='<button class="btn btn-success" data-action="confirmW" data-id="'+w.id+'">确认预警</button><button class="btn btn-danger" data-action="rejectW" data-id="'+w.id+'">驳回</button>';}
    if(S.currentRole==='sales_admin'&&w.status==='rejected'){h+='<button class="btn btn-warning" data-action="suppW" data-id="'+w.id+'">补录信息</button>';}
    if(S.currentRole==='warehouse'&&w.status==='confirmed'){h+='<button class="btn btn-primary" data-action="initEx" data-id="'+w.id+'">发起换货</button>';}
    h+='<button class="btn btn-secondary" data-action="closeM">关闭</button></div>';return h;
  }

  function eDetail(e){
    var h='<div class="handover-flow">';
    var steps=[{l:'仓库员发起',d:true,c:false},{l:'售后专员处理',d:e.status==='completed'||e.status==='processing',c:e.status==='pending_process'},{l:'换货完成',d:e.status==='completed',c:e.status==='processing'}];
    steps.forEach(function(s,i){var cl=s.d?'done':(s.c?'current':'pending');h+='<span class="handover-step '+cl+'">'+(s.d?'✓ ':'')+s.l+'</span>';if(i<steps.length-1)h+='<span class="handover-arrow">→</span>';});
    h+='</div><div class="detail-section"><div class="detail-section-title">换货信息</div><div class="detail-grid">';
    h+=di('换货单号',esc(e.id))+di('关联预警',esc(e.warningId))+di('耗材名称',esc(e.productName))+di('批号',esc(e.batchNo));
    h+=di('数量',e.quantity)+di('状态','<span class="status-tag '+ES_CLS[e.status]+'">'+ES_MAP[e.status]+'</span>')+di('发起人',esc(e.initiatedBy))+di('发起时间',fmtDt(e.initiatedAt));
    h+=di('供应商名称',esc(e.supplierName||'-'))+di('供应商联系方式',esc(e.supplierContact||'-'));
    if(e.handler)h+=di('处理人',esc(e.handler));
    if(e.exchangeMethod)h+=di('换货方式',esc(e.exchangeMethod));
    if(e.trackingNo)h+=di('物流单号',esc(e.trackingNo));
    if(e.completedAt)h+=di('完成时间',fmtDt(e.completedAt));
    if(e.rejectReason)h+='<div class="detail-item" style="grid-column:span 2"><div class="detail-label">驳回原因</div><div class="detail-value" style="color:var(--red-600)">'+esc(e.rejectReason)+'</div></div>';
    h+='</div></div>';
    if(e.processRecords&&e.processRecords.length>0){h+='<div class="detail-section"><div class="detail-section-title">处理过程</div>';e.processRecords.forEach(function(p){h+='<div class="process-record"><div class="pr-header">'+esc(p.operator)+' · '+fmtDt(p.timestamp)+'</div><div class="pr-body">'+esc(p.content)+'</div></div>';});h+='</div>';}
    h+=entLogs('exchange',e.id);
    h+='<div class="actions-bar" style="margin-top:16px">';
    if(S.currentRole==='after_sales'&&e.status==='pending_process'){h+='<button class="btn btn-primary" data-action="procE" data-id="'+e.id+'">开始处理</button><button class="btn btn-danger" data-action="rejE" data-id="'+e.id+'">驳回</button>';}
    if(S.currentRole==='after_sales'&&e.status==='processing'){h+='<button class="btn btn-success" data-action="compE" data-id="'+e.id+'">完成换货</button><button class="btn btn-secondary" data-action="addPR" data-id="'+e.id+'">添加处理记录</button>';}
    h+='<button class="btn btn-secondary" data-action="closeM">关闭</button></div>';return h;
  }

  function di(l,v){return'<div class="detail-item"><div class="detail-label">'+l+'</div><div class="detail-value">'+v+'</div></div>';}
  function entLogs(et,eid){var ls=S.logs.filter(function(l){return l.entityType===et&&l.entityId===eid;});if(!ls.length)return'';var h='<div class="detail-section"><div class="detail-section-title">操作留痕</div><div class="timeline">';ls.forEach(function(l){h+='<div class="timeline-item"><div class="timeline-dot '+logDot(l.action)+'">'+logIco(l.action)+'</div><div class="timeline-content"><div class="timeline-title">'+esc(l.operator)+' · '+actLbl(l.action)+'</div><div class="timeline-meta">'+fmtDt(l.timestamp)+'</div>'+(l.details?'<div class="timeline-detail">'+esc(l.details)+'</div>':'')+'</div></div>';});h+='</div></div>';return h;}

  function disclaimer(){return'<div class="disclaimer-box"><h4>轻量化说明</h4><ul><li>第三方通知：当前为模拟通知（Toast提示），未接入真实短信/邮件推送</li><li>附件上传：当前为本地记录文件名，未接入真实文件存储服务</li><li>账号体系：当前为角色切换模拟，未接入真实账号登录系统</li><li>数据存储：全部数据存储在浏览器本地（IndexedDB + localStorage），断网或重开后数据不丢失</li></ul></div>';}

  function logDot(a){switch(a){case'create':return'create';case'confirm':return'confirm';case'reject':return'reject';case'supplement':return'supplement';case'initiate_exchange':return'exchange';case'process':return'process';case'complete':return'complete';default:return'create';}}
  function logIco(a){switch(a){case'create':return'📝';case'confirm':return'✅';case'reject':return'❌';case'supplement':return'📋';case'initiate_exchange':return'🔄';case'process':return'🔧';case'complete':return'🎉';default:return'📝';}}
  function actLbl(a){switch(a){case'create':return'提交预警';case'confirm':return'确认预警';case'reject':return'驳回';case'supplement':return'补录信息';case'initiate_exchange':return'发起换货';case'process':return'处理换货';case'complete':return'完成换货';default:return a;}}

  function act(a,id){switch(a){case'viewW':viewW(id);break;case'confirmW':confirmW(id);break;case'rejectW':rejW(id);break;case'suppW':suppW(id);break;case'initEx':initEx(id);break;case'viewE':viewE(id);break;case'procE':procE(id);break;case'rejE':rejE(id);break;case'compE':compE(id);break;case'addPR':addPR(id);break;case'openR':openR(id);break;case'closeM':cmodal();break;}}

  function viewW(id){var w=S.warnings.find(function(w){return w.id===id;});if(!w){toast('预警记录不存在','error');return;}addRecent('warning',w.id,w.productName+' ('+w.batchNo+')');modal('临期预警详情 - '+esc(w.productName),wDetail(w),'');bindMA();}
  function viewE(id){var e=S.exchanges.find(function(e){return e.id===id;});if(!e){toast('换货记录不存在','error');return;}addRecent('exchange',e.id,e.productName+' ('+e.batchNo+')');modal('换货处理详情 - '+esc(e.id),eDetail(e),'');bindMA();}

  function confirmW(id){var w=S.warnings.find(function(w){return w.id===id;});if(!w)return;if(S.currentRole!=='warehouse'){toast('仅仓库员可确认预警','error');return;}if(w.status!=='pending_confirmation'){toast('当前状态不可确认','error');return;}w.status='confirmed';w.confirmedBy=ROLE_MAP[S.currentRole];w.confirmedAt=now();w.updatedAt=now();dbPut('warnings',w);bkLS();addLog('warning',w.id,'confirm','仓库员确认预警，耗材：'+w.productName+'，批号：'+w.batchNo);toast('预警已确认，可发起换货处理','success');cmodal();render();}

  function rejW(id){var w=S.warnings.find(function(w){return w.id===id;});if(!w)return;modal('驳回临期预警 - '+esc(w.productName),'<div class="form-group"><label class="form-label">驳回原因<span class="required">*</span></label><textarea class="form-textarea" id="fRR" placeholder="请填写驳回原因，将通知提交人" required></textarea></div>','<button class="btn btn-danger" id="bSR">确认驳回</button><button class="btn btn-secondary" id="bCR">取消</button>');document.getElementById('bSR').onclick=function(){var r=document.getElementById('fRR').value.trim();if(!r){toast('请填写驳回原因','warning');return;}w.status='rejected';w.rejectedBy=ROLE_MAP[S.currentRole];w.rejectedAt=now();w.rejectReason=r;w.updatedAt=now();dbPut('warnings',w);bkLS();addLog('warning',w.id,'reject','仓库员驳回预警，原因：'+r);toast('预警已驳回，已通知提交人','success');cmodal();render();};document.getElementById('bCR').onclick=cmodal;}

  function suppW(id){var w=S.warnings.find(function(w){return w.id===id;});if(!w)return;modal('补录信息 - '+esc(w.productName),'<div class="form-group"><label class="form-label">补录内容<span class="required">*</span></label><textarea class="form-textarea" id="fSC" placeholder="补充旧台账信息、沟通截图要点、现场核实情况等" required></textarea></div>','<button class="btn btn-warning" id="bSS">提交补录</button><button class="btn btn-secondary" id="bCS">取消</button>');document.getElementById('bSS').onclick=function(){var c=document.getElementById('fSC').value.trim();if(!c){toast('请填写补录内容','warning');return;}if(!w.supplementRecords)w.supplementRecords=[];w.supplementRecords.push({operator:ROLE_MAP[S.currentRole],role:S.currentRole,content:c,timestamp:now()});w.status='pending_confirmation';w.rejectedBy=null;w.rejectedAt=null;w.rejectReason='';w.updatedAt=now();dbPut('warnings',w);bkLS();addLog('warning',w.id,'supplement','补录信息并重新提交：'+c);toast('补录已提交，预警重新进入待确认','success');cmodal();render();};document.getElementById('bCS').onclick=cmodal;}

  function initEx(id){var w=S.warnings.find(function(w){return w.id===id;});if(!w)return;var hf='<div class="detail-grid" style="margin-bottom:12px">'+di('耗材名称',esc(w.productName))+di('批号',esc(w.batchNo))+di('库存数量',w.stockQuantity)+di('有效期',fmtDs(w.expiryDate))+'</div>';
    hf+='<div class="form-row"><div class="form-group"><label class="form-label">换货数量<span class="required">*</span></label><input class="form-input" id="fEQ" type="number" min="1" max="'+w.stockQuantity+'" value="'+w.stockQuantity+'" required></div><div class="form-group"><label class="form-label">供应商名称<span class="required">*</span></label><input class="form-input" id="fSN" required></div></div><div class="form-group"><label class="form-label">供应商联系方式</label><input class="form-input" id="fSC2" placeholder="电话或其他联系方式"></div>';
    modal('发起换货 - '+esc(w.productName),hf,'<button class="btn btn-primary" id="bSE">发起换货</button><button class="btn btn-secondary" id="bCE">取消</button>');
    document.getElementById('bSE').onclick=function(){var q=parseInt(document.getElementById('fEQ').value);var sn=document.getElementById('fSN').value.trim();if(!q||q<1){toast('请填写换货数量','warning');return;}if(!sn){toast('请填写供应商名称','warning');return;}
    var ex={id:'EX-'+Date.now().toString(36).toUpperCase(),warningId:w.id,productName:w.productName,specification:w.specification,manufacturer:w.manufacturer,batchNo:w.batchNo,expiryDate:w.expiryDate,quantity:q,initiatedBy:ROLE_MAP[S.currentRole],initiatedRole:S.currentRole,initiatedAt:now(),handler:null,status:'pending_process',supplierName:sn,supplierContact:document.getElementById('fSC2').value.trim()||'',exchangeMethod:'',trackingNo:'',rejectReason:'',completedAt:null,processRecords:[],createdAt:now(),updatedAt:now()};
    S.exchanges.unshift(ex);dbPut('exchanges',ex);w.status='exchange_initiated';w.exchangeId=ex.id;w.updatedAt=now();dbPut('warnings',w);bkLS();addLog('exchange',ex.id,'initiate_exchange','仓库员发起换货，耗材：'+w.productName+'，数量：'+q+'，供应商：'+sn);addLog('warning',w.id,'initiate_exchange','预警已关联换货单 '+ex.id);toast('换货单已创建，等待售后专员处理','success');cmodal();render();};document.getElementById('bCE').onclick=cmodal;}

  function procE(id){var e=S.exchanges.find(function(e){return e.id===id;});if(!e)return;var hf='<div class="form-row"><div class="form-group"><label class="form-label">换货方式<span class="required">*</span></label><select class="form-select" id="fEM"><option value="">请选择</option><option value="供应商换新">供应商换新</option><option value="退货退款">退货退款</option><option value="调拨其他门店">调拨其他门店</option><option value="其他">其他</option></select></div><div class="form-group"><label class="form-label">物流单号</label><input class="form-input" id="fTN" placeholder="退货物流单号"></div></div><div class="form-group"><label class="form-label">处理说明<span class="required">*</span></label><textarea class="form-textarea" id="fPN" placeholder="记录与供应商沟通情况、处理方案等" required></textarea></div>';
    modal('处理换货 - '+esc(e.id),hf,'<button class="btn btn-primary" id="bSP">开始处理</button><button class="btn btn-secondary" id="bCP">取消</button>');
    document.getElementById('bSP').onclick=function(){var m=document.getElementById('fEM').value;var n=document.getElementById('fPN').value.trim();if(!m){toast('请选择换货方式','warning');return;}if(!n){toast('请填写处理说明','warning');return;}e.status='processing';e.handler=ROLE_MAP[S.currentRole];e.exchangeMethod=m;e.trackingNo=document.getElementById('fTN').value.trim()||'';e.updatedAt=now();if(!e.processRecords)e.processRecords=[];e.processRecords.push({operator:ROLE_MAP[S.currentRole],role:S.currentRole,content:'开始处理 - 方式：'+m+'，说明：'+n,timestamp:now()});dbPut('exchanges',e);bkLS();addLog('exchange',e.id,'process','售后专员开始处理，方式：'+m+'，说明：'+n);toast('换货处理已开始','success');cmodal();render();};document.getElementById('bCP').onclick=cmodal;}

  function rejE(id){var e=S.exchanges.find(function(e){return e.id===id;});if(!e)return;modal('驳回换货 - '+esc(e.id),'<div class="form-group"><label class="form-label">驳回原因<span class="required">*</span></label><textarea class="form-textarea" id="fRR2" placeholder="请填写驳回原因" required></textarea></div>','<button class="btn btn-danger" id="bSRE">确认驳回</button><button class="btn btn-secondary" id="bCRE">取消</button>');document.getElementById('bSRE').onclick=function(){var r=document.getElementById('fRR2').value.trim();if(!r){toast('请填写驳回原因','warning');return;}e.status='rejected';e.rejectReason=r;e.updatedAt=now();if(!e.processRecords)e.processRecords=[];e.processRecords.push({operator:ROLE_MAP[S.currentRole],role:S.currentRole,content:'驳回换货，原因：'+r,timestamp:now()});dbPut('exchanges',e);var w=S.warnings.find(function(w){return w.id===e.warningId;});if(w){w.status='confirmed';w.exchangeId=null;w.updatedAt=now();dbPut('warnings',w);addLog('warning',w.id,'reject','关联换货单被驳回，预警恢复为已确认状态');}bkLS();addLog('exchange',e.id,'reject','售后专员驳回换货，原因：'+r);toast('换货已驳回','success');cmodal();render();};document.getElementById('bCRE').onclick=cmodal;}

  function compE(id){var e=S.exchanges.find(function(e){return e.id===id;});if(!e)return;if(S.currentRole!=='after_sales'){toast('仅售后专员可完成换货','error');return;}if(e.status!=='processing'){toast('当前状态不可完成','error');return;}e.status='completed';e.completedAt=now();e.updatedAt=now();if(!e.processRecords)e.processRecords=[];e.processRecords.push({operator:ROLE_MAP[S.currentRole],role:S.currentRole,content:'换货完成',timestamp:now()});dbPut('exchanges',e);bkLS();addLog('exchange',e.id,'complete','售后专员完成换货处理');toast('换货已完成','success');cmodal();render();}

  function addPR(id){var e=S.exchanges.find(function(e){return e.id===id;});if(!e)return;modal('添加处理记录 - '+esc(e.id),'<div class="form-group"><label class="form-label">处理记录<span class="required">*</span></label><textarea class="form-textarea" id="fPRC" placeholder="记录处理进展、供应商反馈等" required></textarea></div>','<button class="btn btn-primary" id="bSPR">添加记录</button><button class="btn btn-secondary" id="bCPR">取消</button>');document.getElementById('bSPR').onclick=function(){var c=document.getElementById('fPRC').value.trim();if(!c){toast('请填写处理记录','warning');return;}if(!e.processRecords)e.processRecords=[];e.processRecords.push({operator:ROLE_MAP[S.currentRole],role:S.currentRole,content:c,timestamp:now()});e.updatedAt=now();dbPut('exchanges',e);bkLS();addLog('exchange',e.id,'process','添加处理记录：'+c);toast('处理记录已添加','success');cmodal();viewE(id);};document.getElementById('bCPR').onclick=cmodal;}

  function openR(id){var r=S.recentOpens.find(function(r){return r.entityId===id;});if(!r)return;if(r.entityType==='warning')viewW(id);else viewE(id);}

  function bindVE(){
    var el=document.getElementById('btnNew');
    if(el){el.onclick=function(){var hf='<div class="form-row"><div class="form-group"><label class="form-label">耗材名称<span class="required">*</span></label><input class="form-input" id="fPN2" required></div><div class="form-group"><label class="form-label">规格</label><input class="form-input" id="fSP"></div></div><div class="form-row"><div class="form-group"><label class="form-label">厂家</label><input class="form-input" id="fMF"></div><div class="form-group"><label class="form-label">批号<span class="required">*</span></label><input class="form-input" id="fBN" required></div></div><div class="form-row"><div class="form-group"><label class="form-label">有效期至<span class="required">*</span></label><input class="form-input" id="fED" type="date" required></div><div class="form-group"><label class="form-label">库存数量<span class="required">*</span></label><input class="form-input" id="fSQ" type="number" min="1" required></div></div><div class="form-row"><div class="form-group"><label class="form-label">存放位置</label><input class="form-input" id="fSL" placeholder="如：A区-3号架"></div><div class="form-group"><label class="form-label">预警级别</label><select class="form-select" id="fWL"><option value="">自动计算</option><option value="30">30天紧急</option><option value="60">60天预警</option><option value="90">90天提醒</option></select></div></div><div class="form-group"><label class="form-label">备注</label><textarea class="form-textarea" id="fRM" placeholder="可填写旧台账信息、现场记录要点等"></textarea></div><div class="form-group"><label class="form-label">附件（文件名）</label><input class="form-input" id="fAT" placeholder="仅记录文件名，未接入真实文件存储"></div>';
    modal('提交临期预警',hf,'<button class="btn btn-primary" id="bSW">提交预警</button><button class="btn btn-secondary" id="bCW">取消</button>');
    document.getElementById('bSW').onclick=submitW;document.getElementById('bCW').onclick=cmodal;};}
    document.querySelectorAll('[data-action]').forEach(function(el){el.onclick=function(){act(el.dataset.action,el.dataset.id);};});
    document.querySelectorAll('[data-nav]').forEach(function(el){el.onclick=function(){nav(el.dataset.nav);};});
  }

  function bindMA(){document.querySelectorAll('#modalContent [data-action]').forEach(function(el){el.onclick=function(){act(el.dataset.action,el.dataset.id);};});}

  function submitW(){
    var pn=document.getElementById('fPN2').value.trim(),bn=document.getElementById('fBN').value.trim(),ed=document.getElementById('fED').value,sq=parseInt(document.getElementById('fSQ').value);
    if(!pn){toast('请填写耗材名称','warning');return;}if(!bn){toast('请填写批号','warning');return;}if(!ed){toast('请填写有效期','warning');return;}if(!sq||sq<1){toast('请填写库存数量','warning');return;}
    var lv=document.getElementById('fWL').value||calcLv(ed);
    var w={id:'WN-'+Date.now().toString(36).toUpperCase(),productName:pn,specification:document.getElementById('fSP').value.trim(),manufacturer:document.getElementById('fMF').value.trim(),batchNo:bn,expiryDate:ed,stockQuantity:sq,warningLevel:lv,storeLocation:document.getElementById('fSL').value.trim(),remark:document.getElementById('fRM').value.trim(),attachment:document.getElementById('fAT').value.trim(),submittedBy:ROLE_MAP[S.currentRole],submittedRole:S.currentRole,submittedAt:now(),status:'pending_confirmation',confirmedBy:null,confirmedAt:null,rejectedBy:null,rejectedAt:null,rejectReason:'',exchangeId:null,supplementRecords:[],createdAt:now(),updatedAt:now()};
    S.warnings.unshift(w);dbPut('warnings',w);bkLS();addLog('warning',w.id,'create','提交临期预警，耗材：'+pn+'，批号：'+bn+'，级别：'+LV_MAP[lv]);toast('临期预警已提交，等待仓库员确认','success');cmodal();render();
  }

  function seed(){
    if(S.warnings.length>0)return;var today=new Date();
    var demos=[
      {pn:'光固化树脂',sp:'3g/支',mf:'3M ESPE',bn:'B20250101',d:25,q:48,sl:'A区-1号架'},
      {pn:'根管锉套装',sp:'25mm',mf:'VDW',bn:'B20241215',d:55,q:12,sl:'B区-3号架'},
      {pn:'藻酸盐印模材',sp:'453g/袋',mf:'贺利氏',bn:'B20250220',d:85,q:30,sl:'C区-2号架'},
      {pn:'牙科缝合线',sp:'3-0',mf:'曼吉森',bn:'B20241101',d:15,q:20,sl:'A区-4号架'},
      {pn:'玻璃离子水门汀',sp:'15g/瓶',mf:'GC',bn:'B20250310',d:70,q:8,sl:'B区-1号架'}
    ];
    demos.forEach(function(dm){
      var exp=new Date(today);exp.setDate(exp.getDate()+dm.d);
      var es=exp.getFullYear()+'-'+String(exp.getMonth()+1).padStart(2,'0')+'-'+String(exp.getDate()).padStart(2,'0');
      var lv=calcLv(es);
      var w={id:'WN-'+(Date.now()+dm.d).toString(36).toUpperCase(),productName:dm.pn,specification:dm.sp,manufacturer:dm.mf,batchNo:dm.bn,expiryDate:es,stockQuantity:dm.q,warningLevel:lv,storeLocation:dm.sl,remark:'',attachment:'',submittedBy:'销售内勤',submittedRole:'sales_admin',submittedAt:now(),status:'pending_confirmation',confirmedBy:null,confirmedAt:null,rejectedBy:null,rejectedAt:null,rejectReason:'',exchangeId:null,supplementRecords:[],createdAt:now(),updatedAt:now()};
      S.warnings.push(w);dbPut('warnings',w);addLog('warning',w.id,'create','提交临期预警（演示数据），耗材：'+dm.pn);
    });
    bkLS();
  }

  function detectOff(){var ind=document.getElementById('offlineIndicator');function up(){ind.style.display=navigator.onLine?'none':'flex';}window.addEventListener('online',up);window.addEventListener('offline',up);up();}

  async function init(){
    try{await initDB();}catch(e){console.warn('IndexedDB初始化失败，使用localStorage',e);}
    try{if(db){S.warnings=await dbAll('warnings')||[];S.exchanges=await dbAll('exchanges')||[];S.logs=await dbAll('logs')||[];S.recentOpens=await dbAll('recentOpens')||[];}}catch(e){console.warn('IndexedDB读取失败',e);}
    if(!S.warnings.length){var lw=ldLS('w');if(lw)S.warnings=lw;var le=ldLS('e');if(le)S.exchanges=le;var ll=ldLS('l');if(ll)S.logs=ll;var lr=ldLS('r');if(lr)S.recentOpens=lr;}
    var sr=ldLS('role');if(sr&&ROLE_MAP[sr])S.currentRole=sr;
    document.querySelectorAll('.role-btn').forEach(function(el){el.classList.toggle('active',el.dataset.role===S.currentRole);});
    document.querySelectorAll('.nav-item').forEach(function(el){el.onclick=function(){nav(el.dataset.view);};});
    document.querySelectorAll('.role-btn').forEach(function(el){el.onclick=function(){role(el.dataset.role);};});
    seed();detectOff();render();
  }

  init();
})();
