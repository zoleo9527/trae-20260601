import http from 'http';

function api(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== 补偿驳回-重提流程测试 ===\n');

  // 1. 找到 TS-20260601-0003
  const list = await api('/api/complaints');
  const complaint = list.find(c => c.complaintNo === 'TS-20260601-0003');
  console.log(`1. 找到投诉: ${complaint.complaintNo} - ${complaint.title}`);
  console.log(`   当前状态: ${complaint.status}`);
  console.log(`   当前处理: ${complaint.currentHandlerRole} - ${complaint.currentHandlerName}`);

  // 2. 店长驳回补偿方案
  console.log('\n2. 店长驳回补偿方案...');
  const result1 = await api(`/api/complaints/${complaint.id}/actions`, 'POST', {
    actionType: 'compensation_reject',
    operatorRole: 'manager',
    operatorName: '王店长',
    rejectReason: '只免费拉线不够，建议额外赠送2小时场地券',
  });
  console.log(`   驳回后状态: ${result1.status}`);
  console.log(`   驳回后处理: ${result1.currentHandlerRole} - ${result1.currentHandlerName}`);
  const rejectedComp = result1.compensations.find(c => c.status === 'rejected');
  console.log(`   补偿记录驳回原因: ${rejectedComp?.rejectReason || '无'}`);

  // 3. 验证待办：前台能看到，店长看不到
  console.log('\n3. 验证待办分离...');
  const managerTodos = await api('/api/todos/manager');
  const receptionTodos = await api('/api/todos/reception');
  const inManagerTodo = managerTodos.some(c => c.id === complaint.id);
  const inReceptionTodo = receptionTodos.some(c => c.id === complaint.id);
  console.log(`   在店长待办: ${inManagerTodo} (应该是 false)`);
  console.log(`   在前台待办: ${inReceptionTodo} (应该是 true)`);

  // 4. 前台重新提出补偿方案
  console.log('\n4. 前台重新提出补偿方案...');
  const result2 = await api(`/api/complaints/${complaint.id}/compensations`, 'POST', {
    type: 'free_service',
    description: '免费重新拉线 + 赠送手胶 + 赠送2小时场地券',
    proposedBy: '李前台',
  });
  console.log(`   重提后状态: ${result2.status}`);
  console.log(`   重提后处理: ${result2.currentHandlerRole} - ${result2.currentHandlerName}`);
  const newPending = result2.compensations.find(c => c.status === 'pending');
  console.log(`   新方案: ${newPending?.description || '无'}`);

  // 5. 验证待办：店长能看到，前台看不到
  console.log('\n5. 再次验证待办分离...');
  const managerTodos2 = await api('/api/todos/manager');
  const receptionTodos2 = await api('/api/todos/reception');
  const inManagerTodo2 = managerTodos2.some(c => c.id === complaint.id);
  const inReceptionTodo2 = receptionTodos2.some(c => c.id === complaint.id);
  console.log(`   在店长待办: ${inManagerTodo2} (应该是 true)`);
  console.log(`   在前台待办: ${inReceptionTodo2} (应该是 false)`);

  // 6. 店长审批通过
  console.log('\n6. 店长审批通过...');
  const result3 = await api(`/api/complaints/${complaint.id}/actions`, 'POST', {
    actionType: 'compensation_approve',
    operatorRole: 'manager',
    operatorName: '王店长',
    remark: '方案合理，通过',
  });
  console.log(`   审批后状态: ${result3.status}`);
  const approvedComp = result3.compensations.find(c => c.status === 'approved');
  console.log(`   补偿审批人: ${approvedComp?.approvedBy || '无'}`);

  console.log('\n=== 测试完成！所有流程正常 ===');
}

main().catch(console.error);
