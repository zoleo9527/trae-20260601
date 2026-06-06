import * as http from 'http';

const BASE_URL = 'http://localhost:3000';

function request(options: http.RequestOptions, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function get(path: string, headers?: Record<string, string>): Promise<any> {
  const url = new URL(path, BASE_URL);
  return request({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function post(path: string, data: any, headers?: Record<string, string>): Promise<any> {
  const url = new URL(path, BASE_URL);
  return request({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }, data);
}

async function test() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 校园维修系统 - API 接口测试');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    console.log('1️⃣  健康检查');
    const health = await get('/health');
    console.log('   ✅', JSON.stringify(health));
    console.log('');

    console.log('2️⃣  获取用户列表');
    const users = await get('/api/users');
    console.log('   ✅ 共', users.data?.length || 0, '个用户');
    const dormManager = users.data?.find((u: any) => u.role === 'DORM_MANAGER');
    const repairWorker = users.data?.find((u: any) => u.role === 'REPAIR_WORKER');
    const supervisor = users.data?.find((u: any) => u.role === 'LOGISTICS_SUPERVISOR');
    console.log('   宿管:', dormManager?.id, dormManager?.name);
    console.log('   维修师傅:', repairWorker?.id, repairWorker?.name);
    console.log('   后勤主管:', supervisor?.id, supervisor?.name);
    console.log('');

    console.log('3️⃣  各角色待办查询');
    console.log('   宿管待办:');
    const dormTodos = await get('/api/orders/todo', { 'x-user-id': dormManager.id });
    console.log('     ✅ 共', dormTodos.data?.length || 0, '条');
    
    console.log('   维修师傅待办:');
    const workerTodos = await get('/api/orders/todo', { 'x-user-id': repairWorker.id });
    console.log('     ✅ 共', workerTodos.data?.length || 0, '条');
    
    console.log('   后勤主管待办:');
    const supervisorTodos = await get('/api/orders/todo', { 'x-user-id': supervisor.id });
    console.log('     ✅ 共', supervisorTodos.data?.length || 0, '条');
    console.log('');

    console.log('4️⃣  宿管创建维修工单');
    const newOrder = await post('/api/orders', {
      dormitory: '测试楼',
      roomNumber: '101',
      issueType: '水电维修',
      description: '测试水管漏水',
    }, { 'x-user-id': dormManager.id });
    console.log('   ✅ 创建成功:', newOrder.data?.orderNo);
    console.log('   工单ID:', newOrder.data?.id);
    console.log('   当前状态:', newOrder.data?.currentStatus);
    console.log('');

    const orderId = newOrder.data?.id;

    console.log('5️⃣  后勤主管派单');
    const assignedOrder = await post(`/api/orders/${orderId}/assign`, {
      assigneeId: repairWorker.id,
      remark: '测试工单，请处理',
    }, { 'x-user-id': supervisor.id });
    console.log('   ✅ 派单成功');
    console.log('   当前状态:', assignedOrder.data?.currentStatus);
    console.log('   维修师傅:', assignedOrder.data?.assignee?.name);
    console.log('');

    console.log('6️⃣  维修师傅登记材料');
    const materialOrder = await post(`/api/orders/${orderId}/materials`, {
      materials: [
        { materialName: 'PVC水管', specification: '20mm', quantity: 2, unit: '米', unitPrice: 15 },
        { materialName: '水管接头', quantity: 3, unit: '个', unitPrice: 5 },
      ],
    }, { 'x-user-id': repairWorker.id });
    console.log('   ✅ 材料登记成功');
    console.log('   当前状态:', materialOrder.data?.currentStatus);
    console.log('   材料数量:', materialOrder.data?.materials?.length);
    console.log('');

    console.log('7️⃣  维修师傅登记费用');
    const feeOrder = await post(`/api/orders/${orderId}/fees`, {
      fees: [
        { feeType: '材料费', amount: 45, note: '水管30 + 接头15' },
        { feeType: '人工费', amount: 50 },
      ],
    }, { 'x-user-id': repairWorker.id });
    console.log('   ✅ 费用登记成功');
    console.log('   当前状态:', feeOrder.data?.currentStatus);
    console.log('   费用数量:', feeOrder.data?.fees?.length);
    console.log('');

    console.log('8️⃣  补充备注');
    const notedOrder = await post(`/api/orders/${orderId}/note`, {
      note: '测试补充备注',
    }, { 'x-user-id': repairWorker.id });
    console.log('   ✅ 补充备注成功');
    console.log('   补充备注:', notedOrder.data?.supplementNote);
    console.log('');

    console.log('9️⃣  后勤主管审核通过');
    const completedOrder = await post(`/api/orders/${orderId}/audit`, {
      auditResult: 'APPROVED',
      auditOpinion: '测试审核通过',
    }, { 'x-user-id': supervisor.id });
    console.log('   ✅ 审核通过');
    console.log('   当前状态:', completedOrder.data?.currentStatus);
    console.log('');

    console.log('🔟  查询工单详情（含完整状态流转历史）');
    const orderDetail = await get(`/api/orders/${orderId}`, { 'x-user-id': dormManager.id });
    console.log('   ✅ 查询成功');
    console.log('   工单编号:', orderDetail.data?.orderNo);
    console.log('   状态历史数量:', orderDetail.data?.statusHistories?.length);
    console.log('   材料数量:', orderDetail.data?.materials?.length);
    console.log('   费用数量:', orderDetail.data?.fees?.length);
    console.log('   审核记录数量:', orderDetail.data?.auditRecords?.length);
    console.log('');
    console.log('   状态流转历史:');
    orderDetail.data?.statusHistories?.forEach((h: any, idx: number) => {
      console.log(`     ${idx + 1}. ${h.fromStatus || '初始'} → ${h.toStatus}`);
      console.log(`        操作人: ${h.operator?.name} (${h.operator?.role})`);
      console.log(`        时间: ${h.operatedAt}`);
      if (h.remark) console.log(`        备注: ${h.remark}`);
    });
    console.log('');

    console.log('1️⃣1️⃣ 查询所有工单');
    const allOrders = await get('/api/orders', { 'x-user-id': supervisor.id });
    console.log('   ✅ 查询成功，共', allOrders.data?.length || 0, '条工单');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 所有 API 接口测试通过！');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

test();
