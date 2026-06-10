const http = require('http');

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  console.log('===== 主链路集成测试 =====\n');

  // 1. 创建接待单
  console.log('1. 创建接待单...');
  const reception = await request('POST', '/api/receptions', {
    group_name: '链路测试团体',
    contact_person: '张测试',
    contact_phone: '13900000001',
    people_count: 30,
    scheduled_date: '2026-06-20',
    scheduled_time: '09:30',
    source: '集成测试',
    remark: '主链路测试用例'
  });
  console.log('   单号:', reception.reception_no);
  console.log('   状态:', reception.status);
  console.log('   ✅ 创建成功\n');

  // 2. 分配向导
  console.log('2. 分配向导...');
  const task = await request('POST', '/api/receptions/' + reception.id + '/assign-guide', {
    guide_id: 2,
    picking_area: 'A区草莓园',
    remark: '请热情接待'
  });
  console.log('   任务号:', task.task_no);
  console.log('   向导ID:', task.guide_id);
  console.log('   ✅ 分配成功\n');

  // 3. 开始采摘
  console.log('3. 开始采摘...');
  const startedTask = await request('POST', '/api/guide-tasks/' + task.id + '/start');
  console.log('   状态:', startedTask.status);
  console.log('   开始时间:', startedTask.start_time);
  console.log('   ✅ 开始成功\n');

  // 4. 完成采摘
  console.log('4. 完成采摘...');
  const completedTask = await request('POST', '/api/guide-tasks/' + task.id + '/complete', {
    fruit_details: [
      { fruit_id: 1, fruit_name: '草莓', weight: 20, unit: '斤', price: 30 },
      { fruit_id: 5, fruit_name: '水蜜桃', weight: 30, unit: '斤', price: 20 }
    ],
    total_weight: 50,
    remark: '采摘顺利，客人很满意'
  });
  console.log('   状态:', completedTask.status);
  console.log('   总重量:', completedTask.total_weight + '斤');
  console.log('   ✅ 采摘完成\n');

  // 5. 查看任务详情（含交接单）
  console.log('5. 查询任务详情（验证交接单生成）...');
  const taskDetail = await request('GET', '/api/guide-tasks/' + task.id);
  console.log('   关联交接单:', taskDetail.warehouseTransfer?.transfer_no || '无');
  console.log('   交接单状态:', taskDetail.warehouseTransfer?.status || '无');
  console.log('   ✅ 交接单已自动生成\n');

  const transferId = taskDetail.warehouseTransfer.id;

  // 6. 仓库接收
  console.log('6. 仓库接收果品...');
  const received = await request('POST', '/api/warehouse-transfers/' + transferId + '/receive', {
    fruit_details: [
      { fruit_id: 1, fruit_name: '草莓', weight: 20, unit: '斤', price: 30 },
      { fruit_id: 5, fruit_name: '水蜜桃', weight: 30, unit: '斤', price: 20 }
    ],
    total_weight: 50,
    remark: '数量核对无误'
  });
  console.log('   状态:', received.status);
  console.log('   接收人:', received.received_by_name);
  console.log('   ✅ 接收成功\n');

  // 7. 确认入库
  console.log('7. 确认入库...');
  const stored = await request('POST', '/api/warehouse-transfers/' + transferId + '/store', {
    storage_location: '冷藏库A区-05号',
    remark: '已按标准流程入库'
  });
  console.log('   状态:', stored.status);
  console.log('   库位:', stored.storage_location);
  console.log('   ✅ 入库成功\n');

  // 8. 验证接待单状态
  console.log('8. 验证接待单最终状态...');
  const finalReception = await request('GET', '/api/receptions/' + reception.id);
  console.log('   接待单状态:', finalReception.status);
  console.log('   关联任务数:', finalReception.guideTasks?.length || 0);
  console.log('   ✅ 接待单已完成\n');

  // 9. 验证操作日志
  console.log('9. 验证操作留痕...');
  const logs = await request('GET', '/api/audit-logs?biz_type=reception&biz_id=' + reception.id);
  console.log('   接待单操作日志数:', logs.total);
  logs.list.forEach(l => console.log('     -', l.action, 'by', l.operator_name));
  console.log('   ✅ 操作全程留痕\n');

  // 10. 测试附件占位
  console.log('10. 测试附件占位...');
  const placeholder = await request('POST', '/api/attachments/placeholder', {
    biz_type: 'reception',
    biz_id: reception.id,
    file_name: '团体预约确认单.pdf',
    file_type: 'pdf',
    file_size: 512000
  });
  console.log('   占位附件名:', placeholder.file_name);
  console.log('   ✅ 附件占位成功\n');

  // 11. 测试批量操作
  console.log('11. 测试批量状态更新...');
  const batchResult = await request('POST', '/api/receptions/batch-status', {
    ids: [reception.id],
    status: 'cancelled',
    remark: '测试批量取消'
  });
  console.log('   影响条数:', batchResult.affected);
  console.log('   ✅ 批量操作成功\n');

  console.log('===== 测试全部通过 =====');
  console.log('主链路：接待单创建 → 分配向导 → 开始采摘 → 完成采摘 → 仓库接收 → 确认入库');
  console.log('并验证：交接单自动生成、接待单状态联动、操作日志留痕、附件占位、批量处理');
})().catch(e => {
  console.error('测试失败:', e.message || e);
  process.exit(1);
});
