import http from 'http'

function request(method: string, path: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (data) headers['Content-Length'] = String(data.length)

    const req = http.request({ hostname: 'localhost', port: 3001, path, method, headers }, (res) => {
      let chunks = ''
      res.on('data', (c) => { chunks += c })
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)) } catch { reject(new Error(chunks)) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  console.log('=== 港口堆场全流程测试 ===\n')

  const gateLogin = await request('POST', '/api/auth/login', { username: 'gate01', password: 'gate01' })
  const gateToken = gateLogin.data.token
  console.log('✅ 闸口员登录成功')

  const dispatchLogin = await request('POST', '/api/auth/login', { username: 'dispatch01', password: 'dispatch01' })
  const dispatchToken = dispatchLogin.data.token
  console.log('✅ 调度员登录成功')

  const serviceLogin = await request('POST', '/api/auth/login', { username: 'service01', password: 'service01' })
  const serviceToken = serviceLogin.data.token
  console.log('✅ 客服登录成功')

  console.log('\n=== 正常单流程 ===\n')

  const newContainer = await request('POST', '/api/containers', {
    container_no: 'NORM9999001', vessel: 'NORMAL TEST', voyage: 'V001',
    target_port: 'SHANGHAI', yard_slot: 'A-01-03', free_storage_until: '2026-06-19T10:00:00'
  }, gateToken)
  const cid = newContainer.data.id
  console.log(`1. 闸口登记: 箱号=${newContainer.data.container_no} ID=${cid} 堆位=${newContainer.data.yard_slot} 状态=${newContainer.data.status}`)

  const newInspection = await request('POST', '/api/inspections', {
    container_id: cid, type: 'full', planned_at: '2026-06-10T09:00:00'
  }, dispatchToken)
  const iid = newInspection.data.id
  console.log(`2. 创建查验: ID=${iid} 类型=${newInspection.data.type} 状态=${newInspection.data.status}`)

  const notifyResult = await request('PUT', `/api/inspections/${iid}/notify`, { notify_method: 'sms' }, dispatchToken)
  console.log(`3. 通知客户: 状态=${notifyResult.data.status} 方式=${notifyResult.data.notify_method}`)

  const steps = ['open_box', 'unpack', 'repack']
  for (const step of steps) {
    const stepResult = await request('PUT', `/api/inspections/${iid}/execute`, { step }, dispatchToken)
    console.log(`4.${steps.indexOf(step) + 1} 执行步骤${step}: 当前step=${stepResult.data.step} 状态=${stepResult.data.status}`)
  }

  const releaseResult = await request('PUT', `/api/inspections/${iid}/execute`, { step: 'result', result: 'released' }, dispatchToken)
  console.log(`5. 查验结果: 结果=${releaseResult.data.result} 状态=${releaseResult.data.status}`)

  const moveTasks = await request('GET', '/api/move-tasks?status=pending', undefined, dispatchToken)
  const autoTask = moveTasks.data.find((t: any) => t.source_inspection_id === iid)
  if (autoTask) {
    console.log(`6. 自动创建移箱: ID=${autoTask.id} ${autoTask.from_slot}→${autoTask.to_slot} 来源查验=${autoTask.source_inspection_id}`)

    const startResult = await request('PUT', `/api/move-tasks/${autoTask.id}/execute`, { action: 'start' }, dispatchToken)
    console.log(`7. 开始移箱: 状态=${startResult.data.status}`)

    const completeResult = await request('PUT', `/api/move-tasks/${autoTask.id}/execute`, { action: 'complete' }, dispatchToken)
    console.log(`8. 完成移箱: 状态=${completeResult.data.status}`)

    const containerDetail = await request('GET', `/api/containers/${cid}`, undefined, gateToken)
    console.log(`9. 箱子最新状态: 堆位=${containerDetail.data.container.yard_slot} 状态=${containerDetail.data.container.status}`)
  } else {
    console.log('❌ 未找到自动创建的移箱任务!')
  }

  console.log('\n=== 问题单流程 ===\n')

  const problems = await request('POST', '/api/problems/detect', {}, serviceToken)
  const newProblems = problems.data || []
  console.log(`1. 问题检测: 发现${problems.meta?.newCount || 0}个新问题，共${problems.meta?.totalDetected || 0}个`)

  const problemList = await request('GET', '/api/problems?status=open', undefined, serviceToken)
  console.log(`2. 当前问题单: ${problemList.data.length}条待处理`)
  for (const p of problemList.data.slice(0, 5)) {
    console.log(`   - [${p.type}] ${p.container_no}: ${p.description}`)
  }

  if (problemList.data.length > 0) {
    const targetProblem = problemList.data.find((p: any) => p.type === 'missed_notify') || problemList.data[0]
    console.log(`\n3. 处理问题单 #${targetProblem.id}: 类型=${targetProblem.type}`)

    const rescheduleResult = await request('PUT', `/api/problems/${targetProblem.id}/action`, {
      action: 'reschedule', data: { planned_at: '2026-06-12T09:00:00' }, remark: '测试改期操作'
    }, serviceToken)
    console.log(`   改期结果: 状态=${rescheduleResult.data.status}`)

    if (rescheduleResult.data.status === 'rescheduled') {
      const resolveResult = await request('PUT', `/api/problems/${targetProblem.id}/resolve`, {}, serviceToken)
      console.log(`   标记解决: 状态=${resolveResult.data.status}`)
    }
  }

  if (problemList.data.length > 1) {
    const targetProblem2 = problemList.data.find((p: any) => p.type !== 'missed_notify' && p.status === 'open') || problemList.data[1]
    if (targetProblem2 && targetProblem2.id !== problemList.data[0]?.id) {
      console.log(`\n4. 处理问题单 #${targetProblem2.id}: 类型=${targetProblem2.type}`)
      const supplementResult = await request('PUT', `/api/problems/${targetProblem2.id}/action`, {
        action: 'supplement', data: { note: '补录操作测试' }, remark: '测试补录'
      }, serviceToken)
      console.log(`   补录结果: 状态=${supplementResult.data.status}`)
    }
  }

  if (problemList.data.length > 2) {
    const targetProblem3 = problemList.data.find((p: any) => p.status === 'open')
    if (targetProblem3) {
      console.log(`\n5. 驳回问题单 #${targetProblem3.id}: 类型=${targetProblem3.type}`)
      const rejectResult = await request('PUT', `/api/problems/${targetProblem3.id}/action`, {
        action: 'reject', data: {}, remark: '测试驳回'
      }, serviceToken)
      console.log(`   驳回结果: 状态=${rejectResult.data.status}`)
    }
  }

  console.log('\n=== 操作日志验证 ===\n')

  const logs = await request('GET', '/api/logs?size=5', undefined, gateToken)
  console.log(`日志总数: ${logs.data.total}条`)
  for (const log of logs.data.list.slice(0, 5)) {
    console.log(`   - ${log.created_at?.slice(0, 16)} [${log.role}] ${log.action}: ${log.detail?.slice(0, 40)}`)
  }

  console.log('\n=== 移箱任务回看 ===\n')

  const allTasks = await request('GET', '/api/move-tasks', undefined, dispatchToken)
  const completedTask = allTasks.data.find((t: any) => t.status === 'completed')
  if (completedTask) {
    const history = await request('GET', `/api/move-tasks/${completedTask.id}/history`, undefined, dispatchToken)
    console.log(`移箱回看 #${completedTask.id}: ${completedTask.from_slot}→${completedTask.to_slot}`)
    console.log(`  操作日志: ${(history.data.logs || []).length}条`)
    for (const log of (history.data.logs || []).slice(0, 3)) {
      console.log(`  - ${log.created_at?.slice(0, 16)} ${log.detail}`)
    }
  }

  console.log('\n✅ 全流程测试完成！')
}

main().catch((err) => {
  console.error('测试失败:', err.message)
  process.exit(1)
})
