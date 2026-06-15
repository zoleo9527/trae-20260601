const BASE_URL = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log('  OK ' + message);
}

const results = {
  testA: { passed: false, details: [] },
  testB: { passed: false, details: [] },
  testC: { passed: false, details: [] },
};

async function testA() {
  console.log('\n=== Test A: Order Details ===');
  try {
    const listRes = await request('/orders?pageSize=5');
    assert(listRes.status === 200, 'Order list returns 200');
    assert(Array.isArray(listRes.data.list), 'Order list has list array');
    assert(listRes.data.list.length > 0, 'Order list is not empty');

    const firstOrder = listRes.data.list[0];
    const orderId = firstOrder.id;
    assert(!!orderId, 'Got first order ID');

    const detailRes = await request('/orders/' + orderId);
    assert(detailRes.status === 200, 'Order detail returns 200');
    assert(Array.isArray(detailRes.data.items), 'Order detail has items array');
    console.log('  OK Item count: ' + detailRes.data.items.length);

    results.testA.passed = true;
    console.log('\n[PASS] Test A');
  } catch (e) {
    console.log('\n[FAIL] Test A: ' + e.message);
    results.testA.details.push(e.message);
  }
}

async function testB() {
  console.log('\n=== Test B: Return Complete ===');
  try {
    const listRes = await request('/returns?status=warehouse_confirmed&type=return&pageSize=10');
    assert(listRes.status === 200, 'Returns list returns 200');

    let targetRequest = null;
    if (listRes.data.list && listRes.data.list.length > 0) {
      for (const r of listRes.data.list) {
        if (r.status === 'warehouse_confirmed' && r.type === 'return') {
          targetRequest = r;
          break;
        }
      }
    }

    if (!targetRequest) {
      console.log('  INFO Creating test return request...');
      const ordersRes = await request('/orders?pageSize=1');
      const order = ordersRes.data.list ? ordersRes.data.list[0] : null;
      if (!order) throw new Error('No order available');

      const createRes = await request('/returns', {
        method: 'POST',
        body: {
          order_id: order.id,
          type: 'return',
          reason: 'Test return',
          reason_category: 'quality',
          applicant: 'Tester',
          applicant_role: 'customer_service',
          remarks: 'E2E test',
          items: [{ product_name: 'Test Item', product_code: 'TEST001', quantity: 1, unit: 'pc' }],
        },
      });
      assert(createRes.status === 201, 'Create return draft');
      const draftId = createRes.data.id;

      const submitRes = await request('/returns/' + draftId + '/submit', {
        method: 'PUT',
        body: { operator: 'Tester', operator_role: 'customer_service' },
      });
      assert(submitRes.status === 200, 'Submit return');

      const confirmRes = await request('/returns/' + draftId + '/warehouse-confirm', {
        method: 'PUT',
        body: { operator: 'Warehouse', operator_role: 'warehouse' },
      });
      assert(confirmRes.status === 200, 'Warehouse confirm');
      targetRequest = confirmRes.data;
    }

    assert(!!targetRequest, 'Got warehouse_confirmed return request');
    const requestId = targetRequest.id;

    const completeRes = await request('/returns/' + requestId + '/complete', {
      method: 'PUT',
      body: { operator: 'Tester', operator_role: 'customer_service', remark: 'E2E complete' },
    });
    assert(completeRes.status === 200, 'Complete return API 200');
    assert(completeRes.data.status === 'completed', 'Status is completed');
    assert(!!completeRes.data.completer, 'completer is set');
    assert(!!completeRes.data.complete_time, 'complete_time is set');

    const detailRes = await request('/returns/' + requestId);
    assert(detailRes.status === 200, 'Get detail after complete');
    assert(Array.isArray(detailRes.data.logs), 'Logs array exists');
    let hasLog = false;
    for (const log of detailRes.data.logs) {
      if (log.action === '完成退货') { hasLog = true; break; }
    }
    assert(hasLog, 'Log contains complete action');

    results.testB.passed = true;
    console.log('\n[PASS] Test B');
  } catch (e) {
    console.log('\n[FAIL] Test B: ' + e.message);
    results.testB.details.push(e.message);
  }
}

async function testC() {
  console.log('\n=== Test C: Attachments ===');
  try {
    const listRes = await request('/returns?pageSize=5');
    assert(listRes.status === 200, 'Returns list returns 200');
    assert(listRes.data.list && listRes.data.list.length > 0, 'Returns exist');
    const requestId = listRes.data.list[0].id;
    assert(!!requestId, 'Got request ID');

    const initRes = await request('/attachments/request/' + requestId);
    const initCount = Array.isArray(initRes.data) ? initRes.data.length : 0;
    console.log('  INFO Initial attachments: ' + initCount);

    const phRes = await request('/attachments/request/' + requestId, {
      method: 'POST',
      body: {
        file_name: 'placeholder_test.txt',
        file_type: 'text/plain',
        file_size: 0,
        placeholder: true,
        uploaded_by: 'Tester',
      },
    });
    assert(phRes.status === 201, 'Placeholder attachment created (201)');
    assert(phRes.data.placeholder === 1, 'Placeholder flag = 1');
    assert(phRes.data.file_path === null, 'Placeholder has no file_path');
    const phId = phRes.data.id;

    const realRes = await request('/attachments/request/' + requestId, {
      method: 'POST',
      body: {
        file_name: 'real_test.jpg',
        file_type: 'image/jpeg',
        file_size: 102400,
        placeholder: false,
        uploaded_by: 'Tester',
      },
    });
    assert(realRes.status === 201, 'Real attachment created (201)');
    assert(realRes.data.placeholder === 0, 'Real flag = 0');
    assert(!!realRes.data.file_path, 'Real has file_path');

    const afterAdd = await request('/attachments/request/' + requestId);
    const afterAddCount = Array.isArray(afterAdd.data) ? afterAdd.data.length : 0;
    assert(afterAddCount === initCount + 2, 'After add count = ' + (initCount + 2) + ' (got ' + afterAddCount + ')');

    const delRes = await request('/attachments/' + phId, { method: 'DELETE' });
    assert(delRes.status === 200, 'Delete attachment 200');
    assert(delRes.data.success === true, 'Delete success = true');

    const afterDel = await request('/attachments/request/' + requestId);
    const afterDelCount = Array.isArray(afterDel.data) ? afterDel.data.length : 0;
    assert(afterDelCount === initCount + 1, 'After delete count = ' + (initCount + 1) + ' (got ' + afterDelCount + ')');

    let stillExists = false;
    if (Array.isArray(afterDel.data)) {
      for (const a of afterDel.data) {
        if (a.id === phId) { stillExists = true; break; }
      }
    }
    assert(!stillExists, 'Deleted attachment not in list');

    results.testC.passed = true;
    console.log('\n[PASS] Test C');
  } catch (e) {
    console.log('\n[FAIL] Test C: ' + e.message);
    results.testC.details.push(e.message);
  }
}

async function main() {
  console.log('========================================');
  console.log('  E2E API Test Suite');
  console.log('========================================');

  let healthOk = false;
  let healthMsg = 'N/A';
  try {
    const health = await request('/health');
    healthOk = health.data.status === 'ok';
    healthMsg = health.data.status + ' - ' + (health.data.message || '');
    console.log('\nHealth Check: ' + healthMsg);
  } catch (e) {
    console.log('\nHealth Check FAILED: ' + e.message);
  }

  await testA();
  await testB();
  await testC();

  console.log('\n========================================');
  console.log('  RESULT SUMMARY');
  console.log('========================================');
  console.log('Health Check : ' + (healthOk ? 'OK' : 'FAIL'));
  console.log('Test A       : ' + (results.testA.passed ? 'PASS' : 'FAIL'));
  console.log('Test B       : ' + (results.testB.passed ? 'PASS' : 'FAIL'));
  console.log('Test C       : ' + (results.testC.passed ? 'PASS' : 'FAIL'));

  const allPassed = healthOk && results.testA.passed && results.testB.passed && results.testC.passed;
  console.log('\nOVERALL      : ' + (allPassed ? 'ALL PASSED' : 'SOME FAILED'));
  console.log('========================================');

  process.exit(allPassed ? 0 : 1);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
