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
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== 补偿重提待办显示与日志断点测试 ===\n');

  // 1. 找到补偿驳回状态的 TS-20260528-0006
  const list = await api('/api/complaints');
  const complaint = list.find(c => c.complaintNo === 'TS-20260528-0006');
  console.log(`1. 找到投诉: ${complaint.complaintNo} - ${complaint.title}`);
  console.log(`   当前状态: ${complaint.status}`);
  console.log(`   当前处理: ${complaint.currentHandlerRole} - ${complaint.currentHandlerName}`);

  // 2. 验证待办卡片数据一致性
  console.log('\n2. 验证待办列表数据...');
  const receptionTodos = await api('/api/todos/reception');
  const managerTodos = await api('/api/todos/manager');
  const inReceptionTodo = receptionTodos.some(c => c.id === complaint.id);
  const inManagerTodo = managerTodos.some(c => c.id === complaint.id);
  console.log(`   在前台待办: ${inReceptionTodo} (应该是 true)`);
  console.log(`   在店长待办: ${inManagerTodo} (应该是 false)`);
  const todoItem = receptionTodos.find(c => c.id === complaint.id);
  if (todoItem) {
    console.log(`   待办处理人: ${todoItem.currentHandlerRole} - ${todoItem.currentHandlerName}`);
  }

  // 3. 测试补偿提案接口必填校验
  console.log('\n3. 测试补偿提案接口必填校验...');
  const emptyDescResult = await api(`/api/complaints/${complaint.id}/compensations`, 'POST', {
    type: 'refund',
    description: '',
    operatorRole: 'reception',
    operatorName: '李前台',
  });
  console.log(`   空描述返回: ${emptyDescResult.error || '通过 (不对!)'}`);

  // 4. 测试补偿提案接口后端兜底（不传 operator）
  console.log('\n4. 测试补偿提案接口后端兜底（不传 operator）...');
  const fallbackResult = await api(`/api/complaints/${complaint.id}/compensations`, 'POST', {
    type: 'refund',
    description: '测试兜底方案: 退款100元',
  });
  console.log(`   兜底后状态: ${fallbackResult.status}`);
  console.log(`   兜底后处理: ${fallbackResult.currentHandlerRole} - ${fallbackResult.currentHandlerName}`);
  const lastLog = fallbackResult.actionLogs[fallbackResult.actionLogs.length - 1];
  console.log(`   时间线操作人: ${lastLog.operatorRole} - ${lastLog.operatorName}`);
  const lastComp = fallbackResult.compensations[0];
  console.log(`   补偿提出人: ${lastComp.proposedBy}`);

  // 5. 验证店长待办（重提后应该到店长）
  console.log('\n5. 验证重提后的待办归属...');
  const managerTodos2 = await api('/api/todos/manager');
  const receptionTodos2 = await api('/api/todos/reception');
  const inManagerTodo2 = managerTodos2.some(c => c.id === complaint.id);
  const inReceptionTodo2 = receptionTodos2.some(c => c.id === complaint.id);
  console.log(`   在店长待办: ${inManagerTodo2} (应该是 true)`);
  console.log(`   在前台待办: ${inReceptionTodo2} (应该是 false)`);

  // 6. 验证列表页和详情页处理人一致性
  console.log('\n6. 验证列表与详情处理人一致性...');
  const listItem = list.find(c => c.id === complaint.id);
  const detailItem = await api(`/api/complaints/${complaint.id}`);
  console.log(`   列表处理人: ${listItem.currentHandlerName}`);
  console.log(`   详情处理人: ${detailItem.currentHandlerName}`);
  console.log(`   一致: ${listItem.currentHandlerName === detailItem.currentHandlerName}`);

  console.log('\n=== 全部测试完成！===');
}

main().catch(console.error);
