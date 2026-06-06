#!/usr/bin/env python3
# -*- coding: utf-8 -*-

app_js_content = r"""
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
"""

with open('www/js/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js_content.strip())

print("Part 1 written successfully")
