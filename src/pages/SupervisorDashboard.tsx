import { ReportDetailDrawer } from '@/components/ReportDetailDrawer'
import { Sidebar } from '@/components/Sidebar'
import { StatusTag } from '@/components/StatusTag'
import { useAppStore } from '@/store'
import { ANOMALY_TYPE_LABELS } from '@/types'
import { AlertTriangle, CheckCircle, Clock, FileWarning } from 'lucide-react'
import { useState } from 'react'

function formatTime(iso: string | undefined) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SupervisorDashboard() {
  const reminders = useAppStore((s) => s.reminders)
  const reports = useAppStore((s) => s.reports)
  const logs = useAppStore((s) => s.logs)

  const [drawerReportId, setDrawerReportId] = useState<string | null>(null)

  const confirmedCount = reminders.filter((r) => r.status === 'confirmed').length
  const totalCount = reminders.length
  const completionRate = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0

  const anomalyCount = reports.filter((r) => r.status === 'submitted' || r.status === 'draft').length
  const pendingApprovalCount = reports.filter((r) => r.status === 'submitted').length
  const timeoutCount = reminders.filter((r) => r.status === 'timeout').length

  const recentReports = [...reports]
    .sort((a, b) => {
      const ta = a.submittedAt || a.id
      const tb = b.submittedAt || b.id
      return tb.localeCompare(ta)
    })
    .slice(0, 5)

  return (
    <div className="flex h-full">
      <Sidebar role="supervisor" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">护理主管概览</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportReportsToCSV(reports)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出上报
            </button>
            <button
              onClick={() => exportLogsToCSV(logs)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出日志
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50">
                <CheckCircle className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm text-gray-500">今日服药完成率</span>
            </div>
            <div className="text-3xl font-bold text-primary-600">{completionRate}%</div>
            <div className="text-xs text-gray-400 mt-1">{confirmedCount}/{totalCount} 已确认</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-gray-500">异常上报数</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">{anomalyCount}</div>
            <div className="text-xs text-gray-400 mt-1">待处理异常</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                <FileWarning className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">待审批数</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{pendingApprovalCount}</div>
            <div className="text-xs text-gray-400 mt-1">等待审批</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">超时未处理数</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {timeoutCount > 0 ? (
                <span className="animate-pulse">{timeoutCount}</span>
              ) : (
                timeoutCount
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">超时提醒</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">近期异常上报</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setDrawerReportId(report.id)}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 w-20 shrink-0">
                  {report.elderName}
                </span>
                <span className="text-sm text-gray-500 w-16 shrink-0">{report.bedNo}</span>
                <span className="text-sm text-gray-700 flex-1">
                  {ANOMALY_TYPE_LABELS[report.anomalyType]}
                </span>
                <span className="text-xs text-gray-400 w-28 shrink-0 text-right">
                  {formatTime(report.submittedAt)}
                </span>
                <StatusTag
                  status={report.status}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDrawerReportId(report.id)
                  }}
                />
              </div>
            ))}
            {recentReports.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">暂无异常上报</div>
            )}
          </div>
        </div>
      </div>

      <ReportDetailDrawer
        reportId={drawerReportId || ''}
        isOpen={!!drawerReportId}
        onClose={() => setDrawerReportId(null)}
      />
    </div>
  )
}
