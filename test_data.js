// 测试数据筛选逻辑
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
  getReturns(f={}){let r=[...this.returns];if(f.status)r=r.filter(x=>x.status===f.status);if(f.handler)r=r.filter(x=>x.currentHandler===f.handler);if(f.delayed)r=r.filter(x=>x.isDelayed&&x.status!=='completed');if(f.newReturn)r=r.filter(x=>x.isNewReturn);if(f.todayDue)r=r.filter(x=>x.dueDate===fmtDate(today)&&x.status!=='completed');if(f.excludeCompleted)r=r.filter(x=>x.status!=='completed');return r;},
  recentOpened: [
    {type:'return',id:'RT20260606002',title:'智能空气加湿器 - 破损处理',time:fmtDate(addDays(today,-1))+' 16:30',icon:'📦'},
    {type:'return',id:'RT20260606004',title:'不锈钢料理锅 - 质量检测',time:fmtDate(addDays(today,-1))+' 14:20',icon:'📦'},
    {type:'restock',id:'RS20260606001',title:'USB-C快充充电器 - 重新上架',time:fmtDate(today)+' 09:50',icon:'📥'},
    {type:'return',id:'RT20260606003',title:'面部精华液套装 - 签收处理',time:fmtDate(today)+' 08:35',icon:'📦'}
  ]
};

// 测试筛选
console.log('='.repeat(60));
console.log('🧪 数据筛选测试');
console.log('='.repeat(60));

const todayReturns = AppData.getReturns({todayDue:true});
console.log(`\n📋 今天要办: ${todayReturns.length} 条`);
todayReturns.forEach(r => console.log(`   - ${r.id}: ${r.productName} (status: ${r.status}, due: ${r.dueDate})`));

const delayedReturns = AppData.getReturns({delayed:true});
console.log(`\n⚠️  已经拖延: ${delayedReturns.length} 条`);
delayedReturns.forEach(r => console.log(`   - ${r.id}: ${r.productName} (status: ${r.status}, delayed: ${r.isDelayed})`));

const newReturns = AppData.getReturns({newReturn:true});
console.log(`\n🔥 刚刚被退回: ${newReturns.length} 条`);
newReturns.forEach(r => console.log(`   - ${r.id}: ${r.productName} (status: ${r.status})`));

console.log(`\n📌 最近打开: ${AppData.recentOpened.length} 条`);
AppData.recentOpened.forEach(r => console.log(`   - ${r.id}: ${r.title}`));

// 测试已完成的退件是否被正确排除
console.log('\n' + '='.repeat(60));
console.log('🧪 已完成退件排除测试');
console.log('='.repeat(60));

// 添加一个已完成的测试退件
AppData.returns.push({
  id:'RT20260601000',
  productName:'测试已完成商品',
  status:'completed',
  dueDate:fmtDate(today),
  isDelayed:true,
  isNewReturn:false
});

const todayReturns2 = AppData.getReturns({todayDue:true});
console.log(`\n📋 今天要办（添加已完成后）: ${todayReturns2.length} 条（应该还是 3 条）`);

const delayedReturns2 = AppData.getReturns({delayed:true});
console.log(`⚠️  已经拖延（添加已完成后）: ${delayedReturns2.length} 条（应该还是 2 条）`);

console.log('\n' + '='.repeat(60));
console.log('✅ 测试完成');
console.log('='.repeat(60));
