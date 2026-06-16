const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

const testResults = {
  healthCheck: { passed: false, details: [] },
  createDrafts: { passed: false, details: [], ids: [] },
  submitDrafts: { passed: false, details: [], ids: [] },
  batchWarehouseConfirm: { passed: false, details: [], response: null },
  createMoreDrafts: { passed: false, details: [], ids: [] },
  submitMoreDrafts: { passed: false, details: [], ids: [] },
  batchCancel: { passed: false, details: [], response: null },
  filteredList: { passed: false, details: [], response: null },
};

function logStep(step, message) {
  console.log(`\n[${step}] ${message}`);
}

function logSuccess(message) {
  console.log(`  ✓ ${message}`);
}

function logFail(message) {
  console.log(`  ✗ ${message}`);
}

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: {} });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function checkHealth() {
  logStep('1', '检查服务状态');
  try {
    const backendRes = await request('/health');
    testResults.healthCheck.details.push(`后端状态码: ${backendRes.status}`);
    testResults.healthCheck.details.push(`后端响应: ${JSON.stringify(backendRes.data)}`);
    
    if (backendRes.status === 200 && backendRes.data.status === 'ok') {
      logSuccess('后端服务正常');
      testResults.healthCheck.passed = true;
    } else {
      logFail('后端服务异常');
    }

    const frontendRes = await new Promise((resolve) => {
      http.get('http://localhost:5173/', (res) => {
        resolve({ status: res.statusCode });
      }).on('error', () => resolve({ status: 0 }));
    });
    
    testResults.healthCheck.details.push(`前端状态码: ${frontendRes.status}`);
    if (frontendRes.status === 200) {
      logSuccess('前端服务正常');
    } else {
      logFail(`前端服务状态: ${frontendRes.status} (非阻断，继续测试)`);
    }
  } catch (e) {
    logFail(`健康检查失败: ${e.message}`);
    testResults.healthCheck.details.push(e.message);
  }
}

async function createTestReturn(index) {
  const orderRes = await request('/orders?pageSize=1');
  if (!orderRes.data.list || orderRes.data.list.length === 0) {
    throw new Error('没有可用的订单');
  }
  
  const order = orderRes.data.list[0];
  
  const data = {
    order_id: order.id,
    type: 'return',
    reason: '批量测试',
    reason_category: 'other',
    applicant: '批量测试员',
    applicant_role: 'customer_service',
    items: [{
      product_name: `测试商品-${index}`,
      product_code: `BATCH-TEST-${index}`,
      quantity: 1,
      unit: '件'
    }]
  };
  
  const res = await request('/returns', {
    method: 'POST',
    body: data,
  });
  
  return res;
}

async function submitReturn(id) {
  const data = {
    operator: '批量测试员',
    operator_role: 'customer_service'
  };
  
  return await request(`/returns/${id}/submit`, {
    method: 'PUT',
    body: data,
  });
}

async function createDrafts() {
  logStep('2', '创建 3 个草稿状态的退货申请');
  const ids = [];
  
  try {
    for (let i = 0; i < 3; i++) {
      const res = await createTestReturn(i + 1);
      if (res.status === 201 && res.data.id) {
        ids.push(res.data.id);
        logSuccess(`创建申请 ${i + 1}: ${res.data.id}, 状态: ${res.data.status}`);
      } else {
        logFail(`创建申请 ${i + 1} 失败: ${res.status} - ${JSON.stringify(res.data)}`);
        testResults.createDrafts.details.push(`申请${i + 1}失败: ${res.status}`);
      }
    }
    
    testResults.createDrafts.ids = ids;
    testResults.createDrafts.details.push(`成功创建 ${ids.length}/3 个草稿`);
    
    if (ids.length === 3) {
      testResults.createDrafts.passed = true;
    }
  } catch (e) {
    logFail(`创建草稿失败: ${e.message}`);
    testResults.createDrafts.details.push(e.message);
  }
  
  return ids;
}

async function submitDrafts(ids, testKey) {
  logStep('3', '提交草稿，变为待仓库确认状态');
  const submittedIds = [];
  
  try {
    for (let i = 0; i < ids.length; i++) {
      const res = await submitReturn(ids[i]);
      if (res.status === 200 && res.data.status === 'pending_warehouse') {
        submittedIds.push(ids[i]);
        logSuccess(`提交申请 ${i + 1}: ${ids[i]}, 新状态: ${res.data.status}`);
      } else {
        logFail(`提交申请 ${i + 1} 失败: ${res.status} - ${JSON.stringify(res.data)}`);
        testResults[testKey].details.push(`提交${ids[i]}失败: ${res.status}`);
      }
    }
    
    testResults[testKey].ids = submittedIds;
    testResults[testKey].details.push(`成功提交 ${submittedIds.length}/${ids.length} 个申请`);
    
    if (submittedIds.length === ids.length) {
      testResults[testKey].passed = true;
    }
  } catch (e) {
    logFail(`提交失败: ${e.message}`);
    testResults[testKey].details.push(e.message);
  }
  
  return submittedIds;
}

async function testBatchWarehouseConfirm(ids) {
  logStep('4', '测试批量仓库确认接口 (POST /batch-warehouse-confirm)');
  
  console.log('  申请IDs:', ids);
  
  const data = {
    ids: ids,
    operator: '仓库测试员',
    operator_role: 'warehouse_manager',
    remark: '批量确认测试'
  };
  
  try {
    const res = await request('/returns/batch-warehouse-confirm', {
      method: 'POST',
      body: data,
    });
    
    testResults.batchWarehouseConfirm.details.push(`请求方法: POST`);
    testResults.batchWarehouseConfirm.details.push(`请求体: ${JSON.stringify(data)}`);
    testResults.batchWarehouseConfirm.details.push(`响应状态码: ${res.status}`);
    testResults.batchWarehouseConfirm.details.push(`响应内容: ${JSON.stringify(res.data)}`);
    testResults.batchWarehouseConfirm.response = res;
    
    console.log('  响应状态码:', res.status);
    console.log('  响应内容:', JSON.stringify(res.data, null, 2));
    
    if (res.status === 200 && res.data.success === true && res.data.count === ids.length) {
      logSuccess(`批量确认成功，处理 ${res.data.count} 条`);
      
      for (const id of ids) {
        const detailRes = await request(`/returns/${id}`);
        if (detailRes.data.status === 'warehouse_confirmed') {
          logSuccess(`验证申请 ${id} 状态: warehouse_confirmed`);
        } else {
          logFail(`申请 ${id} 状态不正确: ${detailRes.data.status}`);
          testResults.batchWarehouseConfirm.details.push(`状态验证失败: ${id} = ${detailRes.data.status}`);
        }
      }
      
      testResults.batchWarehouseConfirm.passed = true;
    } else {
      logFail(`批量确认失败`);
    }
  } catch (e) {
    logFail(`批量确认异常: ${e.message}`);
    testResults.batchWarehouseConfirm.details.push(e.message);
  }
}

async function createMoreDrafts() {
  logStep('5', '再创建 3 个草稿用于批量取消测试');
  const ids = [];
  
  try {
    for (let i = 0; i < 3; i++) {
      const res = await createTestReturn(i + 4);
      if (res.status === 201 && res.data.id) {
        ids.push(res.data.id);
        logSuccess(`创建申请 ${i + 4}: ${res.data.id}, 状态: ${res.data.status}`);
      } else {
        logFail(`创建申请 ${i + 4} 失败`);
        testResults.createMoreDrafts.details.push(`申请${i + 4}失败`);
      }
    }
    
    testResults.createMoreDrafts.ids = ids;
    testResults.createMoreDrafts.details.push(`成功创建 ${ids.length}/3 个草稿`);
    
    if (ids.length === 3) {
      testResults.createMoreDrafts.passed = true;
    }
  } catch (e) {
    logFail(`创建草稿失败: ${e.message}`);
    testResults.createMoreDrafts.details.push(e.message);
  }
  
  return ids;
}

async function testBatchCancel(ids) {
  logStep('6', '测试批量取消接口 (POST /batch-cancel)');
  
  console.log('  申请IDs:', ids);
  
  const data = {
    ids: ids,
    operator: '客服测试员',
    operator_role: 'customer_service',
    reason: '批量取消测试'
  };
  
  try {
    const res = await request('/returns/batch-cancel', {
      method: 'POST',
      body: data,
    });
    
    testResults.batchCancel.details.push(`请求方法: POST`);
    testResults.batchCancel.details.push(`请求体: ${JSON.stringify(data)}`);
    testResults.batchCancel.details.push(`响应状态码: ${res.status}`);
    testResults.batchCancel.details.push(`响应内容: ${JSON.stringify(res.data)}`);
    testResults.batchCancel.response = res;
    
    console.log('  响应状态码:', res.status);
    console.log('  响应内容:', JSON.stringify(res.data, null, 2));
    
    if (res.status === 200 && res.data.success === true && res.data.count === ids.length) {
      logSuccess(`批量取消成功，处理 ${res.data.count} 条`);
      
      for (const id of ids) {
        const detailRes = await request(`/returns/${id}`);
        if (detailRes.data.status === 'cancelled') {
          logSuccess(`验证申请 ${id} 状态: cancelled`);
        } else {
          logFail(`申请 ${id} 状态不正确: ${detailRes.data.status}`);
          testResults.batchCancel.details.push(`状态验证失败: ${id} = ${detailRes.data.status}`);
        }
      }
      
      testResults.batchCancel.passed = true;
    } else {
      logFail(`批量取消失败`);
    }
  } catch (e) {
    logFail(`批量取消异常: ${e.message}`);
    testResults.batchCancel.details.push(e.message);
  }
}

async function testFilteredList() {
  logStep('7', '验证带筛选和分页的列表刷新');
  
  try {
    console.log('  筛选条件: status=pending_warehouse, page=1, pageSize=2');
    const res = await request('/returns?status=pending_warehouse&page=1&pageSize=2');
    
    testResults.filteredList.details.push(`筛选条件: status=pending_warehouse, page=1, pageSize=2`);
    testResults.filteredList.details.push(`响应状态码: ${res.status}`);
    testResults.filteredList.details.push(`响应内容: ${JSON.stringify(res.data)}`);
    testResults.filteredList.response = res;
    
    if (res.status === 200) {
      console.log('  总数:', res.data.total);
      console.log('  当前页条数:', res.data.list ? res.data.list.length : 0);
      
      const hasPagination = res.data.page !== undefined && res.data.pageSize !== undefined;
      const hasList = Array.isArray(res.data.list);
      const hasTotal = typeof res.data.total === 'number';
      
      if (hasPagination && hasList && hasTotal) {
        logSuccess('列表刷新参数正确，包含分页信息');
        logSuccess(`page=${res.data.page}, pageSize=${res.data.pageSize}, total=${res.data.total}`);
        if (res.data.list.length <= res.data.pageSize) {
          logSuccess(`当前页条数 ${res.data.list.length} <= pageSize ${res.data.pageSize}`);
          testResults.filteredList.passed = true;
        }
      } else {
        logFail('列表刷新参数不完整');
      }
    } else {
      logFail(`列表请求失败: ${res.status}`);
    }
  } catch (e) {
    logFail(`列表刷新异常: ${e.message}`);
    testResults.filteredList.details.push(e.message);
  }
}

function printReport() {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('                    退换货批量操作端到端测试报告');
  console.log('═'.repeat(70));
  
  const testNames = {
    healthCheck: '1. 服务健康检查',
    createDrafts: '2. 创建草稿申请',
    submitDrafts: '3. 提交草稿到待仓库确认',
    batchWarehouseConfirm: '4. 批量仓库确认 (POST)',
    createMoreDrafts: '5. 创建更多草稿（用于取消测试）',
    submitMoreDrafts: '6. 提交草稿到待仓库确认（取消测试用）',
    batchCancel: '7. 批量取消 (POST)',
    filteredList: '8. 带筛选的列表刷新',
  };
  
  console.log('\n┌────────────────────────────────────────────────────────────────────┐');
  console.log('│  测试项                          │  结果  │  详情                │');
  console.log('├──────────────────────────────────┼────────┼──────────────────────┤');
  
  for (const [key, name] of Object.entries(testNames)) {
    const result = testResults[key];
    const status = result.passed ? '  PASS  ' : '  FAIL  ';
    const detail = result.details && result.details.length > 0 
      ? result.details[0].substring(0, 20) 
      : '无';
    console.log(`│  ${name.padEnd(30)} │ ${status} │ ${detail.padEnd(20)} │`);
  }
  
  console.log('└──────────────────────────────────┴────────┴──────────────────────┘');
  
  console.log('\n───────────────────────────── 详细结果 ─────────────────────────────');
  
  console.log('\n【4. 批量仓库确认接口响应】');
  if (testResults.batchWarehouseConfirm.response) {
    const r = testResults.batchWarehouseConfirm.response;
    console.log(`  状态码: ${r.status}`);
    console.log(`  响应: ${JSON.stringify(r.data, null, 4)}`);
  }
  
  console.log('\n【7. 批量取消接口响应】');
  if (testResults.batchCancel.response) {
    const r = testResults.batchCancel.response;
    console.log(`  状态码: ${r.status}`);
    console.log(`  响应: ${JSON.stringify(r.data, null, 4)}`);
  }
  
  console.log('\n【8. 列表刷新验证结果】');
  if (testResults.filteredList.response) {
    const r = testResults.filteredList.response;
    console.log(`  状态码: ${r.status}`);
    console.log(`  总数: ${r.data.total}`);
    console.log(`  页码: ${r.data.page}`);
    console.log(`  每页条数: ${r.data.pageSize}`);
    console.log(`  当前页数据: ${r.data.list ? r.data.list.length : 0} 条`);
  }
  
  const allPassed = Object.values(testResults).every(r => r.passed);
  const passedCount = Object.values(testResults).filter(r => r.passed).length;
  const totalCount = Object.keys(testResults).length;
  
  console.log('\n───────────────────────────── 最终结论 ─────────────────────────────');
  console.log(`\n  测试通过: ${passedCount}/${totalCount}`);
  
  if (allPassed) {
    console.log('\n  🎉  所有测试通过！批量处理功能可用。');
    console.log('  ✅  批量仓库确认接口 (POST /batch-warehouse-confirm) 正常');
    console.log('  ✅  批量取消接口 (POST /batch-cancel) 正常');
    console.log('  ✅  列表刷新带筛选和分页参数正常');
  } else {
    console.log('\n  ⚠️  部分测试未通过，请检查详细信息。');
    
    const failedTests = Object.entries(testResults)
      .filter(([_, r]) => !r.passed)
      .map(([k, _]) => testNames[k]);
    
    console.log(`  失败项: ${failedTests.join(', ')}`);
  }
  
  console.log('\n' + '═'.repeat(70));
  
  return allPassed;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           退换货批量操作端到端测试开始执行                        ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  
  await checkHealth();
  
  if (!testResults.healthCheck.passed) {
    console.log('\n❌ 后端服务不可用，请先启动后端服务');
    console.log('  启动命令: cd server && npm run dev');
    process.exit(1);
  }
  
  const draftIds = await createDrafts();
  const submittedIds = await submitDrafts(draftIds, 'submitDrafts');
  
  if (submittedIds.length > 0) {
    await testBatchWarehouseConfirm(submittedIds);
  }
  
  const moreDraftIds = await createMoreDrafts();
  const moreSubmittedIds = await submitDrafts(moreDraftIds, 'submitMoreDrafts');
  
  if (moreSubmittedIds.length > 0) {
    await testBatchCancel(moreSubmittedIds);
  }
  
  await testFilteredList();
  
  const allPassed = printReport();
  process.exit(allPassed ? 0 : 1);
}

main().catch(e => {
  console.error('测试执行异常:', e);
  process.exit(1);
});
