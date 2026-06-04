import { ReportDetailDrawer } from '@/components/ReportDetailDrawer'
import { Sidebar } from '@/components/Sidebar'
import { StatusTag } from '@/components/StatusTag'
import { SupplementModal } from '@/components/SupplementModal'
import { useAppStore } from '@/store'
import { ANOMALY_TYPE_LABELS, type AnomalyType, type ReportStatus, type Severity } from '@/types'
import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

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

type TabKey = 'all' | 'submitted' | 'rejected' | 'supplemented'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'submitted', label: '已提交' },
  { key: 'rejected', label: '已驳回' },
  { key: 'supplemented', label: '已补录' },
]

const TAB_STATUS_MAP: Record<TabKey, ReportStatus[] | null> = {
  all: null,
  submitted: ['submitted'],
  rejected: ['rejected'],
  supplemented: ['supplemented'],
}

const ANOMALY_OPTIONS: { value: AnomalyType; label: string }[] = [
  { value: 'medication_refused', label: '拒服药物' },
  { value: 'adverse_reaction', label: '不良反应' },
  { value: 'timeout', label: '超时未处理' },
  { value: 'other', label: '其他异常' },
]

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: 'low', label: '低', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'medium', label: '中', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'high', label: '高', color: 'bg-red-100 text-red-700 border-red-300' },
]

export default function CaregiverReports() {
  const reports = useAppStore((s) => s.reports)
  const supplementReport = useAppStore((s) => s.supplementReport)
  const resubmitReport = useAppStore((s) => s.resubmitReport)
  const submitReport = useAppStore((s) => s.submitReport)
  const updateReportField = useAppStore((s) => s.updateReportField)

  const [searchParams] = useSearchParams()
  const draftParam = searchParams.get('draft')

  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [drawerReportId, setDrawerReportId] = useState<string | null>(null)
  const [supplementReportId, setSupplementReportId] = useState<string | null>(null)

  useEffect(() => {
    if (draftParam) {
      setDrawerReportId(null)
    }
  }, [draftParam])

  const caregiverReports = reports

  const filteredReports = activeTab === 'all'
    ? caregiverReports.filter((r) => r.status !== 'draft')
    : caregiverReports.filter((r) => TAB_STATUS_MAP[activeTab]?.includes(r.status))

  const draftReports = caregiverReports.filter((r) => r.status === 'draft')

  const handleSupplement = (content: string) => {
    if (!supplementReportId) return
    supplementReport(supplementReportId, content)
    resubmitReport(supplementReportId)
    setSupplementReportId(null)
  }

  return (
    <div className="flex h-full">
      <Sidebar role="caregiver" />
      <div className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">异常上报中心</h2>

        {draftReports.map((draft) => (
          <div
            key={draft.id}
            className="bg-white rounded-xl shadow-sm border-2 border-amber-400 p-5 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-semibold text-gray-900">异常上报 - 待完成</h3>
                <StatusTag status="draft" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-medium text-amber-700">不可跳过，请完成后提交</span>
              </div>
            </div>
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>责任提醒：</strong>标记异常后必须完成上报并提交，否则将记录为未完成异常，影响护理质量考核。
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-20 shrink-0">异常类型</span>
                <select
                  value={draft.anomalyType}
                  onChange={(e) =>
                    updateReportField(draft.id, { anomalyType: e.target.value as AnomalyType })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {ANOMALY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-20 shrink-0">严重程度</span>
                <div className="flex items-center gap-2">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateReportField(draft.id, { severity: opt.value })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        draft.severity === opt.value
                          ? opt.color
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500">异常描述</span>
                <textarea
                  value={draft.description}
                  onChange={(e) =>
                    updateReportField(draft.id, { description: e.target.value })
                  }
                  className="w-full mt-1 h-24 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.involvesFamily}
                    onChange={(e) =>
                      updateReportField(draft.id, { involvesFamily: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  是否涉及家属
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => submitReport(draft.id)}
                  disabled={!draft.description.trim() || draft.description.length < 10}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  提交上报
                </button>
                {(!draft.description.trim() || draft.description.length < 10) && (
                  <span className="text-xs text-red-500">请填写至少10个字符的异常描述</span>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileText className="w-12 h-12 mb-3" />
            <p className="text-sm">暂无上报记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setDrawerReportId(report.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{report.elderName}</span>
                  <span className="text-xs text-gray-500">{report.bedNo}</span>
                  <span className="text-sm text-amber-700 font-medium">
                    {ANOMALY_TYPE_LABELS[report.anomalyType]}
                  </span>
                  <div className="flex-1" />
                  <span className="text-xs text-gray-400">
                    {formatTime(report.submittedAt || report.reviewedAt)}
                  </span>
                  <StatusTag
                    status={report.status}
                    onClick={(e) => {
                      e.stopPropagation()
                      setDrawerReportId(report.id)
                    }}
                  />
                </div>

                {report.status === 'rejected' && report.rejectionReason && (
                  <div className="mt-3 flex items-start gap-3">
                    <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                      驳回原因：{report.rejectionReason}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSupplementReportId(report.id)
                      }}
                      className="shrink-0 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      补录
                    </button>
                  </div>
                )}
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

      <SupplementModal
        isOpen={!!supplementReportId}
        onClose={() => setSupplementReportId(null)}
        onSubmit={handleSupplement}
      />
    </div>
  )
}
