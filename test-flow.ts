const API = 'http://localhost:3001/api'

async function post(url: string, body: any, token?: string) {
  const headers: any = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  return res.json()
}

async function put(url: string, body: any, token: string) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body)
  })
  return res.json()
}

async function get(url: string, token: string) {
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
  return res.json()
}

async function waitForServer(maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${API}/health`)
      if (res.ok) return
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error('Server not ready')
}

async function main() {
  console.log('Waiting for server...')
  await waitForServer()
  console.log('Server ready!')

  console.log('\n=== 正常单流程测试 ===')

  console.log('\n--- 1. Login dispatch01 ---')
  const login = await post(`${API}/auth/login`, { username: 'dispatch01', password: 'dispatch01' })
  if (!login.success) { console.log('  Login failed:', JSON.stringify(login)); return }
  const TK = login.data.token
  console.log('  OK, role=' + login.data.role)

  console.log('\n--- 2. Notify inspection 1 (container MSKU1234567) ---')
  const notify = await put(`${API}/inspections/1/notify`, { notify_method: 'sms' }, TK)
  if (!notify.success) { console.log('  ERROR:', notify.error); return }
  console.log('  status=' + notify.data.status + ' notified=' + notify.data.notified_at)

  console.log('\n--- 3. Execute steps: repack -> result=released ---')
  const repack = await put(`${API}/inspections/1/execute`, { step: 'repack' }, TK)
  if (!repack.success) { console.log('  ERROR repack:', repack.error); return }
  console.log('  repack step=' + repack.data.step)

  const released = await put(`${API}/inspections/1/execute`, { step: 'result', result: 'released' }, TK)
  if (!released.success) { console.log('  ERROR released:', released.error); return }
  console.log('  status=' + released.data.status + ' result=' + released.data.result)

  console.log('\n--- 4. Verify auto-created move task ---')
  const tasks = await get(`${API}/move-tasks`, TK)
  if (!tasks.success) { console.log('  ERROR:', tasks.error); return }
  const autoTask = tasks.data.find((t: any) => t.source_inspection_id === 1)
  if (!autoTask) { console.log('  ERROR: No auto-created move task found!'); return }
  console.log('  move#' + autoTask.id + ' ' + autoTask.from_slot + '->' + autoTask.to_slot + ' status=' + autoTask.status + ' reason=' + autoTask.reason)

  console.log('\n--- 5. Execute move task (start) ---')
  const execTask = await put(`${API}/move-tasks/${autoTask.id}/execute`, { action: 'start' }, TK)
  if (!execTask.success) { console.log('  ERROR:', execTask.error); return }
  console.log('  status=' + execTask.data.status)

  console.log('\n--- 6. Complete move task ---')
  const compTask = await put(`${API}/move-tasks/${autoTask.id}/execute`, { action: 'complete' }, TK)
  if (!compTask.success) { console.log('  ERROR:', compTask.error); return }
  console.log('  status=' + compTask.data.status + ' completed=' + compTask.data.completed_at)

  console.log('\n=== 正常单流程测试完成! ===')
  console.log('\n=== 问题单流程测试 ===')

  console.log('\n--- 7. Login service01 ---')
  const loginSvc = await post(`${API}/auth/login`, { username: 'service01', password: 'service01' })
  const SVTK = loginSvc.data.token
  console.log('  OK, role=' + loginSvc.data.role)

  console.log('\n--- 8. Get problem orders ---')
  const problems = await get(`${API}/problems`, SVTK)
  if (!problems.success) { console.log('  ERROR:', problems.error); return }
  console.log('  Total problems: ' + problems.data.length)
  for (const p of problems.data) {
    console.log('  #' + p.id + ' ' + p.type + ' severity=' + p.severity + ' status=' + p.status + ' box=' + (p.container_no || '?'))
  }

  console.log('\n--- 9. Test reschedule on problem #4 (detained) ---')
  const reschedule = await put(`${API}/problems/4/action`, {
    action: 'reschedule',
    data: { planned_at: '2026-06-15T09:00:00' }
  }, SVTK)
  if (!reschedule.success) { console.log('  ERROR:', reschedule.error); return }
  console.log('  status=' + reschedule.data.status)

  console.log('\n--- 10. Test supplement on problem #2 (misplaced) ---')
  const supplement = await put(`${API}/problems/2/action`, {
    action: 'supplement',
    data: { note: '吊装错位已确认，安排重新移箱' }
  }, SVTK)
  if (!supplement.success) { console.log('  ERROR:', supplement.error); return }
  console.log('  status=' + supplement.data.status)

  console.log('\n--- 11. Test reject on problem #3 (missed_notify) ---')
  const reject = await put(`${API}/problems/3/action`, {
    action: 'reject',
    data: { reason: '查验已取消，无需通知' }
  }, SVTK)
  if (!reject.success) { console.log('  ERROR:', reject.error); return }
  console.log('  status=' + reject.data.status)

  console.log('\n--- 12. Get problem #4 detail (check cause chain) ---')
  const detail = await get(`${API}/problems/4`, SVTK)
  if (!detail.success) { console.log('  ERROR:', detail.error); return }
  const prob = detail.data.problem
  console.log('  type=' + prob.type + ' cause=' + prob.cause)
  const chain = JSON.parse(prob.cause_chain)
  for (const c of chain) {
    console.log('  [' + c.time + '] ' + c.event + ': ' + c.detail)
  }

  console.log('\n=== 问题单流程测试完成! ===')

  console.log('\n--- 13. Verify operation logs ---')
  const logs = await get(`${API}/logs?size=10`, SVTK)
  if (!logs.success) { console.log('  ERROR:', logs.error); return }
  console.log('  Recent logs:')
  for (const l of logs.data.list.slice(0, 5)) {
    console.log('  [' + l.created_at + '] ' + l.action + ' by ' + l.username + ': ' + l.detail)
  }

  console.log('\n=== 全部测试完成! ===')
}

main().catch(err => console.error('Test failed:', err))
