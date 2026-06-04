import { StatusTag } from '@/components/StatusTag'
import { SupplementModal } from '@/components/SupplementModal'
import { useAppStore } from '@/store'
import { ANOMALY_TYPE_LABELS, SEVERITY_LABELS, type Attachment } from '@/types'
import { formatFileSize } from '@/utils/attachment'
import { AlertTriangle, Clock, FileText, Paperclip, RotateCcw, Trash2, User, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface ReportDetailDrawerProps {
  reportId: string
  isOpen: boolean
  onClose: () => void
}

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

export function ReportDetailDrawer({ reportId, isOpen, onClose }: ReportDetailDrawerProps) {
  const report = useAppStore((s) => s.reports.find((r) => r.id === reportId))
  const allLogs = useAppStore((s) => s.logs)
  const supplementReport = useAppStore((s) => s.supplementReport)
  const resubmitReport = useAppStore((s) => s.resubmitReport)
  const addAttachment = useAppStore((s) => s.addAttachment)
  const removeAttachment = useAppStore((s) => s.removeAttachment)
  const currentRole = useAppStore((s) => s.currentRole)

  const logs = allLogs.filter((l) => l.entityId === reportId)

  const [supplementOpen, setSupplementOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !report) return

    const operatorName = currentRole === 'supervisor' ? '陈主管' :
                        currentRole === 'caregiver' ? '李小燕' : '赵社工'

    Array.from(files).forEach((file) => {
      const attachment: Attachment = {
        id: `A${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        uploadedBy: operatorName,
      }
      addAttachment(reportId, attachment)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen || !report) return null

  const handleSupplement = (content: string) => {
    supplementReport(reportId, content)
    resubmitReport(reportId)
    setSupplementOpen(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[480px] max-w-full bg-white shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">异常上报详情</h2>
            <StatusTag status={report.status} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {report.status === 'rejected' && report.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                驳回原因
              </div>
              <p className="text-sm text-red-600">{report.rejectionReason}</p>
              <button
                onClick={() => setSupplementOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                补录
              </button>
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">基本信息</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-20 shrink-0">老人姓名</span>
                <span className="text-gray-900 font-medium">{report.elderName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-20 shrink-0">床位号</span>
                <span className="text-gray-900">{report.bedNo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-20 shrink-0">异常类型</span>
                <span className="text-gray-900">{ANOMALY_TYPE_LABELS[report.anomalyType]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  report.severity === 'high' ? 'bg-red-500' :
                  report.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                <span className="text-gray-500 w-20 shrink-0">严重程度</span>
                <span className="text-gray-900">{SEVERITY_LABELS[report.severity]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-20 shrink-0">上报人</span>
                <span className="text-gray-900">{report.reporterName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-20 shrink-0">提交时间</span>
                <span className="text-gray-900">{formatTime(report.submittedAt)}</span>
              </div>
              {report.reviewedBy && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-20 shrink-0">审批人</span>
                  <span className="text-gray-900">{report.reviewedBy}</span>
                </div>
              )}
              {report.reviewedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-20 shrink-0">审批时间</span>
                  <span className="text-gray-900">{formatTime(report.reviewedAt)}</span>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">异常描述</h3>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
              {report.description}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">家属沟通</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className={`inline-flex items-center gap-1.5 ${report.involvesFamily ? 'text-amber-600' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full ${report.involvesFamily ? 'bg-amber-500' : 'bg-gray-300'}`} />
                涉及家属
              </span>
              <span className={`inline-flex items-center gap-1.5 ${report.familyNotified ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full ${report.familyNotified ? 'bg-blue-500' : 'bg-gray-300'}`} />
                已通知家属
              </span>
              <span className={`inline-flex items-center gap-1.5 ${report.familyConfirmed ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full ${report.familyConfirmed ? 'bg-green-500' : 'bg-gray-300'}`} />
                家属已确认
              </span>
            </div>
          </section>

          {report.supplementHistory.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">补录记录</h3>
              <div className="space-y-3">
                {report.supplementHistory.map((supplement, index) => (
                  <div key={supplement.id} className="relative pl-6 pb-3">
                    {index < report.supplementHistory.length - 1 && (
                      <div className="absolute left-[7px] top-3 bottom-0 w-px bg-gray-200" />
                    )}
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-primary-100 border-2 border-primary-500" />
                    <div className="bg-primary-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{supplement.supplementContent}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{formatTime(supplement.supplementedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500">附件资料</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
                上传附件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            {report.attachments.length === 0 ? (
              <p className="text-sm text-gray-400">暂无附件</p>
            ) : (
              <div className="space-y-2">
                {report.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{att.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(att.size)} · {att.uploadedBy} · {formatTime(att.uploadedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAttachment(reportId, att.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {logs.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">操作日志</h3>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm py-2">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{log.operatorName}</span>
                        <span className="text-gray-400">{log.detail}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <SupplementModal
          isOpen={supplementOpen}
          onClose={() => setSupplementOpen(false)}
          onSubmit={handleSupplement}
        />
      </div>
    </div>
  )
}
