import { RejectModal } from '@/components/RejectModal'
import { ReportDetailDrawer } from '@/components/ReportDetailDrawer'
import { Sidebar } from '@/components/Sidebar'
import { StatusTag } from '@/components/StatusTag'
import { useAppStore } from '@/store'
import { ANOMALY_TYPE_LABELS } from '@/types'
import { ClipboardCheck } from 'lucide-react'
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

export default function ApprovalPage() {
  const reports = useAppStore((s) => s.reports)
  const approveReport = useAppStore((s) => s.approveReport)
  const rejectReport = useAppStore((s) => s.rejectReport)

  const [drawerReportId, setDrawerReportId] = useState<string | null>(null)
  const [rejectReportId, setRejectReportId] = useState<string | null>(null)

  const submittedReports = reports.filter((r) => r.status === 'submitted')
  const allReports = reports.filter((r) => r.status !== 'draft')

  return (
    <div className="flex h-full">
      <Sidebar role="supervisor" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">审批台</h2>
          <button
            onClick={() => exportReportsToCSV(allReports)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出上报记录
          </button>
        </div>

        {submittedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ClipboardCheck className="w-12 h-12 mb-3" />
            <p className="text-sm">暂无待审批的上报</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submittedReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => setDrawerReportId(report.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base font-semibold text-gray-900">
                        {report.elderName}
                      </span>
                      <span className="text-sm text-gray-500">{report.bedNo}</span>
                      <StatusTag
                        status={report.status}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDrawerReportId(report.id)
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                      <span className="text-amber-700 font-medium">
                        {ANOMALY_TYPE_LABELS[report.anomalyType]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {report.description}
                    </p>
                    <span className="text-xs text-gray-400">
                      提交时间：{formatTime(report.submittedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => approveReport(report.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => setRejectReportId(report.id)}
                    className="px-4 py-2 text-sm font-medium text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    驳回
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReportDetailDrawer
        reportId={drawerReportId || ''}
        isOpen={!!drawerReportId}
        onClose={() => setDrawerReportId(null)}
      />

      <RejectModal
        isOpen={!!rejectReportId}
        onClose={() => setRejectReportId(null)}
        onSubmit={(reason) => {
          if (rejectReportId) {
            rejectReport(rejectReportId, reason)
            setRejectReportId(null)
          }
        }}
      />
    </div>
  )
}
