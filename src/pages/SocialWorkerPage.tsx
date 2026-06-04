import { ReportDetailDrawer } from '@/components/ReportDetailDrawer'
import { Sidebar } from '@/components/Sidebar'
import { StatusTag } from '@/components/StatusTag'
import { useAppStore } from '@/store'
import { ANOMALY_TYPE_LABELS } from '@/types'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'

export default function SocialWorkerPage() {
  const reports = useAppStore((s) => s.reports)
  const markFamilyNotified = useAppStore((s) => s.markFamilyNotified)
  const markFamilyConfirmed = useAppStore((s) => s.markFamilyConfirmed)

  const [drawerReportId, setDrawerReportId] = useState<string | null>(null)

  const familyReports = reports.filter((r) => r.involvesFamily)

  return (
    <div className="flex h-full">
      <Sidebar role="social_worker" />
      <div className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">家属沟通</h2>

        {familyReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MessageSquare className="w-12 h-12 mb-3" />
            <p className="text-sm">暂无涉及家属的异常上报</p>
          </div>
        ) : (
          <div className="space-y-4">
            {familyReports.map((report) => (
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
                      <span className="text-sm text-amber-700 font-medium">
                        {ANOMALY_TYPE_LABELS[report.anomalyType]}
                      </span>
                      <StatusTag
                        status={report.status}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDrawerReportId(report.id)
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">家属通知状态</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => markFamilyNotified(report.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        report.familyNotified
                          ? 'bg-green-50 text-green-700 border border-green-300'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          report.familyNotified ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      已通知家属
                    </button>
                    <button
                      onClick={() => markFamilyConfirmed(report.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        report.familyConfirmed
                          ? 'bg-green-50 text-green-700 border border-green-300'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          report.familyConfirmed ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      家属已确认
                    </button>
                  </div>
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
    </div>
  )
}
