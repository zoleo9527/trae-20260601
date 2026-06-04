import type { AnomalyReport, OperationLog } from '@/types'

function formatCSVValue(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"
  }
  return str
}

function formatTime(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function exportReportsToCSV(reports: AnomalyReport[]): void {
  const headers = [
    '上报ID', '老人姓名', '床位号', '异常类型', '严重程度', '状态',
    '上报人', '提交时间', '审批人', '审批时间', '驳回原因',
    '是否涉及家属', '已通知家属', '家属已确认', '异常描述'
  ]

  const ANOMALY_TYPE_LABELS: Record<string, string> = {
    medication_refused: '拒服药物',
    adverse_reaction: '不良反应',
    timeout: '超时未处理',
    other: '其他异常',
  }

  const SEVERITY_LABELS: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  }

  const REPORT_STATUS_LABELS: Record<string, string> = {
    draft: '草稿',
    submitted: '审批中',
    approved: '已通过',
    rejected: '已驳回',
    supplemented: '已补录',
  }

  const rows = reports.map((r) => [
    r.id,
    r.elderName,
    r.bedNo,
    ANOMALY_TYPE_LABELS[r.anomalyType] || r.anomalyType,
    SEVERITY_LABELS[r.severity] || r.severity,
    REPORT_STATUS_LABELS[r.status] || r.status,
    r.reporterName,
    formatTime(r.submittedAt),
    r.reviewedBy || '',
    formatTime(r.reviewedAt),
    r.rejectionReason || '',
    r.involvesFamily ? '是' : '否',
    r.familyNotified ? '是' : '否',
    r.familyConfirmed ? '是' : '否',
    r.description,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(formatCSVValue).join(',')),
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `异常上报记录_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportLogsToCSV(logs: OperationLog[]): void {
  const headers = ['日志ID', '实体类型', '实体ID', '操作类型', '操作人', '操作角色', '操作时间', '详情']

  const ROLE_LABELS: Record<string, string> = {
    supervisor: '护理主管',
    caregiver: '护工',
    social_worker: '社工',
  }

  const rows = logs.map((l) => [
    l.id,
    l.entityType === 'reminder' ? '服药提醒' : '异常上报',
    l.entityId,
    l.action,
    l.operatorName,
    ROLE_LABELS[l.operatorRole] || l.operatorRole,
    formatTime(l.timestamp),
    l.detail,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(formatCSVValue).join(',')),
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `操作日志_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
