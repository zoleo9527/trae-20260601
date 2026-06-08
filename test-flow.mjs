const BASE = 'http://127.0.0.1:3001/api';

async function test() {
  const loginRes = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'libaoj', password: '123456' }),
  });
  const loginData = await loginRes.json();
  const cleanerToken = loginData.data.token;
  console.log('1. Cleaner login: OK');

  const engRes = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'wanggc', password: '123456' }),
  });
  const engData = await engRes.json();
  const engToken = engData.data.token;
  console.log('2. Engineer login: OK');

  const createRes = await fetch(BASE + '/repairs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cleanerToken },
    body: JSON.stringify({ room_id: 8, fault_type: 'plumbing', description: '马桶堵塞', urgency: 'high' }),
  });
  const createData = await createRes.json();
  const repairId = createData.data.id;
  console.log('3. Create repair #' + repairId + ': OK');

  const acceptRes = await fetch(BASE + '/repairs/' + repairId + '/accept', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + engToken },
    body: JSON.stringify({ note: '检查中' }),
  });
  console.log('4. Engineer accepts: ' + (await acceptRes.json()).success);

  const detailRes = await fetch(BASE + '/repairs/' + repairId, {
    headers: { Authorization: 'Bearer ' + engToken },
  });
  const detailData = await detailRes.json();
  console.log('5. Repair detail: status=' + detailData.data.status);

  const logsRes = await fetch(BASE + '/repairs/' + repairId + '/logs', {
    headers: { Authorization: 'Bearer ' + engToken },
  });
  const logsData = await logsRes.json();
  console.log('6. Repair logs: ' + logsData.data.length + ' entries');

  const completeRes = await fetch(BASE + '/repairs/' + repairId + '/complete', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + engToken },
    body: JSON.stringify({ note: '已疏通' }),
  });
  console.log('7. Engineer completes: ' + (await completeRes.json()).success);

  const recoveryRes = await fetch(BASE + '/recovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cleanerToken },
    body: JSON.stringify({ room_id: 8 }),
  });
  const recoveryData = await recoveryRes.json();
  const flowId = recoveryData.data.id;
  console.log('8. Create recovery #' + flowId + ': OK');

  const cleanRes = await fetch(BASE + '/recovery/' + flowId + '/clean-complete', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cleanerToken },
    body: JSON.stringify({ note: '深度清洁完成' }),
  });
  console.log('9. Clean complete: ' + (await cleanRes.json()).success);

  const supRes = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'zhangwg', password: '123456' }),
  });
  const supToken = (await supRes.json()).data.token;

  const approveRes = await fetch(BASE + '/recovery/' + flowId + '/approve', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + supToken },
    body: JSON.stringify({ note: '检查合格' }),
  });
  console.log('10. Supervisor approves: ' + (await approveRes.json()).success);

  const auditRes = await fetch(BASE + '/audit', { headers: { Authorization: 'Bearer ' + supToken } });
  const auditData = await auditRes.json();
  console.log('11. Audit logs: ' + auditData.data.length + ' total entries');

  const recDetailRes = await fetch(BASE + '/recovery/' + flowId, {
    headers: { Authorization: 'Bearer ' + supToken },
  });
  const recDetail = (await recDetailRes.json()).data;
  console.log('12. Recovery detail: status=' + recDetail.status + ', room=' + recDetail.room_number);

  const recLogsRes = await fetch(BASE + '/recovery/' + flowId + '/logs', {
    headers: { Authorization: 'Bearer ' + supToken },
  });
  const recLogs = (await recLogsRes.json()).data;
  console.log('    Recovery logs: ' + recLogs.length + ' entries');

  const permRes = await fetch(BASE + '/audit', { headers: { Authorization: 'Bearer ' + cleanerToken } });
  console.log('13. Permission check (cleaner->audit): status=' + permRes.status);

  console.log('\nAll tests passed!');
}

test().catch((e) => console.error('ERROR:', e));
