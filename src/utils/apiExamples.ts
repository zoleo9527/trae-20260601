import {
    changeStatus,
    completeFollowUp,
    createFollowUp,
    createReport,
    followUpStatusMap,
    followUpTypeMap,
    getAuditLogsByFollowUpId,
    getAuditLogsByReportId,
    getComplicationTypes,
    getDashboardStats,
    getFollowUpDashboardStats,
    getFollowUpsByReportId,
    getOverdueFollowUps,
    getOverdueReports,
    getPatientList,
    getRecentlyRejected,
    getRecentlyReturnedFollowUps,
    getReportById,
    getSurgeryList,
    getTodayPending,
    getTodayPendingFollowUps,
    queryReports,
    returnFollowUp,
    severityMap,
    statusMap
} from '@/store'
import { ErrorCodes } from '@/types'

declare global {
  interface Window {
    __testAPI: Record<string, Function>
  }
}

async function testGetDashboardStats() {
  console.log('=== 1. 获取Dashboard统计（含回访跟踪维度） ===')
  const res = await getDashboardStats()
  console.log('响应码:', res.code)
  console.log('响应消息:', res.message)
  if (res.data) {
    console.log('--- 并发症上报 ---')
    console.log('今日待处理:', res.data.todayPending)
    console.log('上报超时:', res.data.todayOverdue)
    console.log('上报退回:', res.data.recentlyRejected)
    console.log('--- 回访跟踪 ---')
    console.log('回访待处理:', res.data.followUpTodayPending)
    console.log('回访超时:', res.data.followUpOverdue)
    console.log('回访退回:', res.data.followUpRecentlyReturned)
    console.log('--- 通用 ---')
    console.log('处理中:', res.data.totalProcessing)
    console.log('本周已解决:', res.data.resolvedThisWeek)
    console.log('平均解决时长:', res.data.averageResolutionHours + 'h')
  }
  return res
}

async function testGetTodayPending() {
  console.log('\n=== 2. 获取今日待处理列表（上报） ===')
  const res = await getTodayPending()
  console.log('响应码:', res.code)
  console.log('待处理数量:', res.data?.length)
  res.data?.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.reportNo} - ${r.patient.name} - ${r.complicationType}`)
  })
  return res
}

async function testGetOverdueReports() {
  console.log('\n=== 3. 获取超时预警列表（上报） ===')
  const res = await getOverdueReports()
  console.log('响应码:', res.code)
  console.log('超时数量:', res.data?.length)
  res.data?.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.reportNo} - ${r.patient.name} - 严重程度: ${severityMap[r.severity].label}`)
  })
  return res
}

async function testGetRecentlyRejected() {
  console.log('\n=== 4. 获取刚被退回列表（上报） ===')
  const res = await getRecentlyRejected()
  console.log('响应码:', res.code)
  console.log('退回数量:', res.data?.length)
  res.data?.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.reportNo} - ${r.patient.name}`)
    console.log(`     驳回原因: ${r.rejectReason}`)
  })
  return res
}

async function testGetTodayPendingFollowUps() {
  console.log('\n=== 5. 获取今日待回访列表 ===')
  const res = await getTodayPendingFollowUps()
  console.log('响应码:', res.code)
  console.log('今日待回访数量:', res.data?.length)
  res.data?.forEach((f, i) => {
    console.log(`  ${i+1}. ${f.report.patient.name} - ${f.report.complicationType} - ${followUpTypeMap[f.followUpType].label} - ${f.status === 'returned' ? '(已退回，需重新处理)' : ''}`)
  })
  return res
}

async function testGetOverdueFollowUps() {
  console.log('\n=== 6. 获取回访超时列表 ===')
  const res = await getOverdueFollowUps()
  console.log('响应码:', res.code)
  console.log('回访超时数量:', res.data?.length)
  res.data?.forEach((f, i) => {
    const overdueHours = Math.round((Date.now() - new Date(f.plannedTime).getTime()) / (1000 * 60 * 60))
    console.log(`  ${i+1}. ${f.report.patient.name} - 计划时间: ${f.plannedTime} - 已超时 ${overdueHours} 小时`)
  })
  return res
}

async function testGetRecentlyReturnedFollowUps() {
  console.log('\n=== 7. 获取刚被退回的回访列表 ===')
  const res = await getRecentlyReturnedFollowUps()
  console.log('响应码:', res.code)
  console.log('退回回访数量:', res.data?.length)
  res.data?.forEach((f, i) => {
    console.log(`  ${i+1}. ${f.report.patient.name} - ${followUpTypeMap[f.followUpType].label}`)
    console.log(`     退回原因: ${f.returnReason}`)
    console.log(`     退回人: ${f.returnedBy?.name}`)
    console.log(`     退回时间: ${f.returnedTime}`)
  })
  return res
}

async function testGetFollowUpDashboardStats() {
  console.log('\n=== 8. 获取回访跟踪统计 ===')
  const res = await getFollowUpDashboardStats()
  console.log('响应码:', res.code)
  if (res.data) {
    console.log('今日待处理:', res.data.todayPending)
    console.log('超时:', res.data.overdue)
    console.log('刚退回:', res.data.recentlyReturned)
  }
  return res
}

async function testCreateReport() {
  console.log('\n=== 9. 创建并发症上报 ===')
  
  const [patientsRes, surgeriesRes, typesRes] = await Promise.all([
    getPatientList(),
    getSurgeryList(),
    getComplicationTypes()
  ])
  
  const patient = patientsRes.data![0]
  const surgery = surgeriesRes.data!.find(s => s.patientId === patient.id && s.surgeryStatus === 'completed')
  const complicationType = typesRes.data![2]
  
  const params = {
    patientId: patient.id,
    surgeryId: surgery?.id,
    complicationType: complicationType.name,
    complicationCode: complicationType.code,
    severity: 'severe' as const,
    onsetTime: '2026-06-04T08:00:00',
    description: '患者术后第一天出现眼痛加剧、视力下降、畏光流泪等症状',
    clinicalManifestation: '左眼视力光感，结膜混合充血，角膜水肿，前房积脓约1mm，玻璃体混浊明显，眼压38mmHg',
    treatmentMeasures: '1. 急诊行玻璃体腔穿刺注药术（万古霉素1mg+头孢他啶2mg）\n2. 局部频点抗生素滴眼液\n3. 全身应用广谱抗生素\n4. 密切观察病情变化',
    currentStatus: '已行急诊处理，患者自觉眼痛略有缓解，等待细菌培养结果',
    isUrgent: true,
    department: '眼科'
  }
  
  console.log('请求参数:', params)
  const res = await createReport(params)
  console.log('响应码:', res.code)
  console.log('响应消息:', res.message)
  console.log('上报编号:', res.data?.reportNo)
  console.log('上报ID:', res.data?.id)
  return res
}

async function testQueryReports() {
  console.log('\n=== 10. 查询上报列表 ===')
  
  const params = {
    page: 1,
    pageSize: 10,
    status: 'pending' as const,
  }
  
  console.log('查询参数:', params)
  const res = await queryReports(params)
  console.log('响应码:', res.code)
  console.log('总记录数:', res.data?.total)
  console.log('当前页数据:')
  res.data?.list.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.reportNo} | ${r.patient.name} | ${r.complicationType} | ${statusMap[r.status].label}`)
  })
  return res
}

async function testGetReportDetail(reportId: string) {
  console.log('\n=== 11. 获取上报详情 ===')
  const res = await getReportById(reportId)
  console.log('响应码:', res.code)
  if (res.data) {
    console.log('上报编号:', res.data.reportNo)
    console.log('患者:', res.data.patient.name)
    console.log('并发症:', res.data.complicationType)
    console.log('严重程度:', severityMap[res.data.severity].label)
    console.log('当前状态:', statusMap[res.data.status].label)
  }
  return res
}

async function testAcceptReport(reportId: string) {
  console.log('\n=== 12. 受理上报（待处理→处理中） ===')
  const params = { id: reportId, status: 'processing' as const, handlerId: 's1' }
  console.log('请求参数:', params)
  const res = await changeStatus(params)
  console.log('响应码:', res.code)
  console.log('响应消息:', res.message)
  console.log('新状态:', res.data ? statusMap[res.data.status].label : 'N/A')
  return res
}

async function testRejectReport(reportId: string) {
  console.log('\n=== 13. 驳回上报（待处理→已驳回） ===')
  const params = {
    id: reportId,
    status: 'rejected' as const,
    rejectReason: '描述不够详细，请补充：1. 具体体温变化 2. 血常规结果 3. 眼底检查详情'
  }
  console.log('请求参数:', params)
  const res = await changeStatus(params)
  console.log('响应码:', res.code)
  console.log('响应消息:', res.message)
  return res
}

async function testMarkPendingFollowUp(reportId: string) {
  console.log('\n=== 14. 标记为待回访（处理中→待回访） ===')
  const params = { id: reportId, status: 'pending_followup' as const }
  console.log('请求参数:', params)
  const res = await changeStatus(params)
  console.log('响应码:', res.code)
  console.log('响应消息:', res.message)
  return res
}

async function testResolveReport(reportId: string) {
  console.log('\n=== 15. 解决上报（处理中→已解决） ===')
  const params = {
    id: reportId,
    status: 'resolved' as const,
    resolution: '患者经过积极抗感染治疗，感染已得到控制。视力恢复至0.3，眼压正常。'
  }
  console.log('请求参数:', params)
  const res = await changeStatus(params)
  console.log('响应码:', res.code)
  console.log('解决时间:', res.data?.resolvedTime)
  return res
}

async function testCloseReport(reportId: string) {
  console.log('\n=== 16. 结案（已解决→已结案） ===')
  const params = {
    id: reportId,
    status: 'closed' as const,
    resolution: '患者恢复良好，定期复查中，予以结案。'
  }
  console.log('请求参数:', params)
  const res = await changeStatus(params)
  console.log('响应码:', res.code)
  console.log('结案时间:', res.data?.closedTime)
  return res
}

async function testInvalidStatusTransition(reportId: string) {
  console.log('\n=== 17. 测试无效状态流转 ===')
  const params = { id: reportId, status: 'processing' as const }
  const res = await changeStatus(params)
  console.log('响应码:', res.code)
  console.log('错误消息:', res.message)
  console.log('期望错误码:', ErrorCodes.INVALID_STATUS_TRANSITION.code)
  console.log('是否匹配错误码:', res.code === ErrorCodes.INVALID_STATUS_TRANSITION.code)
  return res
}

async function testCreateFollowUp(reportId: string) {
  console.log('\n=== 18. 创建回访计划 ===')
  const params = {
    reportId: reportId,
    followUpType: 'outpatient' as const,
    plannedTime: '2026-06-11T09:00:00'
  }
  console.log('请求参数:', params)
  const res = await createFollowUp(params)
  console.log('响应码:', res.code)
  console.log('响应消息:', res.message)
  console.log('回访ID:', res.data?.id)
  return res
}

async function testCompleteFollowUp(followUpId: string) {
  console.log('\n=== 19. 完成回访记录 ===')
  const params = {
    id: followUpId,
    patientCondition: '患者一般情况良好，无眼痛、头痛，饮食睡眠正常',
    vitalSigns: 'BP 125/75mmHg, P 72次/分, T 36.5\u2103',
    woundCondition: '左眼结膜无充血，角膜透明，切口愈合良好，缝线在位',
    medicationCompliance: '患者遵医嘱用药，无漏服，用药方法正确',
    guidanceGiven: '1. 继续按医嘱用药，逐渐减量\n2. 注意眼部卫生，避免揉眼\n3. 避免剧烈运动和重体力劳动\n4. 饮食清淡，避免辛辣刺激食物\n5. 定期复查，如有不适及时就诊',
    nextFollowUpTime: '2026-06-18T09:00:00',
    notes: '患者恢复良好，家属对治疗效果满意'
  }
  console.log('请求参数:', params)
  const res = await completeFollowUp(params)
  console.log('响应码:', res.code)
  console.log('响应消息:', res.message)
  console.log('实际回访时间:', res.data?.actualTime)
  return res
}

async function testReturnFollowUp(followUpId: string) {
  console.log('\n=== 20. 退回回访记录（已完成→已退回） ===')
  const params = {
    id: followUpId,
    reason: '回访内容不完整：1. 伤口情况未实际检查 2. 用药依从性记录模糊，需明确漏服次数 3. 指导意见过于笼统'
  }
  console.log('请求参数:', params)
  const res = await returnFollowUp(params)
  console.log('响应码:', res.code)
  console.log('响应消息:', res.message)
  if (res.data) {
    console.log('新状态:', followUpStatusMap[res.data.status].label)
    console.log('退回原因:', res.data.returnReason)
    console.log('退回时间:', res.data.returnedTime)
  }
  return res
}

async function testReturnFollowUpInvalidStatus(followUpId: string) {
  console.log('\n=== 21. 测试对非已完成回访执行退回（应报错） ===')
  const params = {
    id: followUpId,
    reason: '尝试退回非已完成的回访'
  }
  const res = await returnFollowUp(params)
  console.log('响应码:', res.code)
  console.log('错误消息:', res.message)
  console.log('期望错误码:', ErrorCodes.FOLLOWUP_CANNOT_RETURN.code)
  console.log('是否匹配错误码:', res.code === ErrorCodes.FOLLOWUP_CANNOT_RETURN.code)
  return res
}

async function testRecompleteReturnedFollowUp(followUpId: string) {
  console.log('\n=== 22. 重新完成已退回的回访记录（已退回→已完成） ===')
  const params = {
    id: followUpId,
    patientCondition: '患者一般情况良好，右眼胀痛较前缓解',
    vitalSigns: 'BP 135/82mmHg, P 76次/分, T 36.4\u2103',
    woundCondition: '右眼结膜轻度充血，滤过泡弥散，前房深度正常，无出血',
    medicationCompliance: '患者遵医嘱用药，过去3天漏服1次乙酰唑胺（6月3日晚间），已提醒补服并设置闹钟',
    guidanceGiven: '1. 继续布林佐胺滴眼液tid，乙酰唑胺片bid不可漏服\n2. 术后2周内避免低头、用力\n3. 1周后门诊复查，测眼压和前房情况\n4. 如出现眼痛加剧或视力骤降，立即急诊',
    nextFollowUpTime: '2026-06-11T09:00:00',
    notes: '患者已理解用药重要性，家属协助监督'
  }
  console.log('请求参数:', params)
  const res = await completeFollowUp(params)
  console.log('响应码:', res.code)
  console.log('响应消息:', res.message)
  console.log('实际回访时间:', res.data?.actualTime)
  return res
}

async function testGetFollowUps(reportId: string) {
  console.log('\n=== 23. 获取上报的回访记录 ===')
  const res = await getFollowUpsByReportId(reportId)
  console.log('响应码:', res.code)
  console.log('回访数量:', res.data?.length)
  res.data?.forEach((f, i) => {
    console.log(`  ${i+1}. ${followUpTypeMap[f.followUpType].label} | ${followUpStatusMap[f.status].label} | 计划: ${f.plannedTime}`)
    if (f.returnReason) {
      console.log(`     退回原因: ${f.returnReason}`)
    }
  })
  return res
}

async function testGetAuditLogs(reportId: string) {
  console.log('\n=== 24. 获取上报操作历史（完整追溯） ===')
  const res = await getAuditLogsByReportId(reportId)
  console.log('响应码:', res.code)
  console.log('操作记录数量:', res.data?.length)
  res.data?.forEach((log, i) => {
    console.log(`  ${i+1}. [${log.timestamp}] ${log.operatorName}(${log.operatorRole}) - ${log.description}`)
    if (log.oldValue && log.newValue) {
      console.log(`     ${log.oldValue} \u2192 ${log.newValue}`)
    }
  })
  return res
}

async function testGetFollowUpAuditLogs(followUpId: string) {
  console.log('\n=== 25. 获取回访操作历史（回访级追溯） ===')
  const res = await getAuditLogsByFollowUpId(followUpId)
  console.log('响应码:', res.code)
  console.log('操作记录数量:', res.data?.length)
  res.data?.forEach((log, i) => {
    console.log(`  ${i+1}. [${log.timestamp}] ${log.operatorName}(${log.operatorRole}) - ${log.description}`)
    if (log.oldValue && log.newValue) {
      console.log(`     ${log.oldValue} \u2192 ${log.newValue}`)
    }
  })
  return res
}

function printErrorCodes() {
  console.log('\n=== 错误码说明 ===')
  console.log('0     - 操作成功')
  console.log('40001 - 参数错误')
  console.log('40101 - 未授权')
  console.log('40301 - 无权限操作')
  console.log('40401 - 记录不存在')
  console.log('40402 - 并发症上报记录不存在')
  console.log('40403 - 回访记录不存在')
  console.log('40404 - 患者信息不存在')
  console.log('40405 - 手术记录不存在')
  console.log('40901 - 无效的状态流转')
  console.log('40902 - 该上报已处理，无法重复操作')
  console.log('40903 - 该回访已完成，无法修改')
  console.log('40904 - 该回访已退回，需重新处理')
  console.log('40905 - 只有已完成的回访才能退回')
  console.log('50001 - 服务器内部错误')
  console.log('50002 - 数据库操作失败')
}

async function testRecordNotFound() {
  console.log('\n=== 测试查询不存在的记录 ===')
  const res = await getReportById('non-existent-id')
  console.log('响应码:', res.code)
  console.log('错误消息:', res.message)
  console.log('期望错误码:', ErrorCodes.REPORT_NOT_FOUND.code)
  console.log('是否匹配错误码:', res.code === ErrorCodes.REPORT_NOT_FOUND.code)
  return res
}

async function testCompleteWorkflow() {
  console.log('\n' + '='.repeat(60))
  console.log('完整业务流程演示（含回访退回与追溯）')
  console.log('='.repeat(60))
  
  try {
    console.log('\n【Step 1】护士上报并发症...')
    const createRes = await testCreateReport()
    if (createRes.code !== 0 || !createRes.data) throw new Error('创建上报失败')
    const reportId = createRes.data.id
    
    console.log('\n【Step 2】医生受理上报...')
    await testAcceptReport(reportId)
    
    console.log('\n【Step 3】创建回访计划（自动切到待回访）...')
    const followUpRes = await testCreateFollowUp(reportId)
    if (followUpRes.code !== 0 || !followUpRes.data) throw new Error('创建回访失败')
    const followUpId = followUpRes.data.id
    
    console.log('\n【Step 4】护士完成回访记录...')
    await testCompleteFollowUp(followUpId)
    
    console.log('\n【Step 5】主任退回回访记录（质量审核不通过）...')
    await testReturnFollowUp(followUpId)
    
    console.log('\n【Step 6】护士重新完成回访（补充完整信息）...')
    await testRecompleteReturnedFollowUp(followUpId)
    
    console.log('\n【Step 7】医生确认解决...')
    await testResolveReport(reportId)
    
    console.log('\n【Step 8】主任审核结案...')
    await testCloseReport(reportId)
    
    console.log('\n【Step 9】查看上报操作历史（追溯）...')
    await testGetAuditLogs(reportId)
    
    console.log('\n【Step 10】查看回访操作历史（回访级追溯）...')
    await testGetFollowUpAuditLogs(followUpId)
    
    console.log('\n【Step 11】查看回访记录...')
    await testGetFollowUps(reportId)
    
    console.log('\n' + '='.repeat(60))
    console.log('\u2705 完整流程演示完成！所有操作均可追溯，包括回访退回和重新处理。')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('流程演示失败:', error)
  }
}

window.__testAPI = {
  testGetDashboardStats,
  testGetTodayPending,
  testGetOverdueReports,
  testGetRecentlyRejected,
  testGetTodayPendingFollowUps,
  testGetOverdueFollowUps,
  testGetRecentlyReturnedFollowUps,
  testGetFollowUpDashboardStats,
  testCreateReport,
  testQueryReports,
  testGetReportDetail,
  testAcceptReport,
  testRejectReport,
  testMarkPendingFollowUp,
  testResolveReport,
  testCloseReport,
  testInvalidStatusTransition,
  testCreateFollowUp,
  testCompleteFollowUp,
  testReturnFollowUp,
  testReturnFollowUpInvalidStatus,
  testRecompleteReturnedFollowUp,
  testGetFollowUps,
  testGetAuditLogs,
  testGetFollowUpAuditLogs,
  testRecordNotFound,
  testCompleteWorkflow,
  printErrorCodes
}

console.log('%c眼科手术中心API测试工具已加载', 'color: #2563eb; font-weight: bold; font-size: 16px;')
console.log('%c在控制台输入 __testAPI 查看可用测试函数', 'color: #6b7280;')
console.log('%c示例: __testAPI.testCompleteWorkflow()', 'color: #6b7280;')
console.log('%c新增：回访退回 testReturnFollowUp(id)、超时检测 testGetOverdueFollowUps()、回访追溯 testGetFollowUpAuditLogs(id)', 'color: #dc2626;')
