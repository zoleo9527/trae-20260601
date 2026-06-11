import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, MapPin, Calendar, Building2, AlertTriangle, MessageSquare } from 'lucide-react'
import { useMallStore } from '../store'
import { APPLICATION_STATUS_MAP, COMPLAINT_STATUS_MAP, ACTION_LABEL_MAP } from '../types'
import Timeline from '../components/Timeline'
import ActionModal from '../components/ActionModal'
import ComplaintDrawer from '../components/ComplaintDrawer'

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const currentApplication = useMallStore((s) => s.currentApplication)
  const fetchApplicationDetail = useMallStore((s) => s.fetchApplicationDetail)
  const processApplication = useMallStore((s) => s.processApplication)
  const returnApplication = useMallStore((s) => s.returnApplication)
  const supplementApplication = useMallStore((s) => s.supplementApplication)
  const closeApplication = useMallStore((s) => s.closeApplication)

  const [modalConfig, setModalConfig] = useState<{
    open: boolean
    title: string
    fields: { key: string; label: string; type?: 'text' | 'textarea'; placeholder?: string; defaultValue?: string }[]
    onConfirm: (values: Record<string, string>) => void
  }>({ open: false, title: '', fields: [], onConfirm: () => {} })

  const [drawerComplaintId, setDrawerComplaintId] = useState<number | null>(null)

  useEffect(() => {
    if (id) fetchApplicationDetail(Number(id))
  }, [id, fetchApplicationDetail])

  if (!currentApplication) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-400">加载中...</p>
      </div>
    )
  }

  const app = currentApplication
  const statusInfo = APPLICATION_STATUS_MAP[app.status]
  const complaints = app.complaints || []

  const handleProcess = () => {
    setModalConfig({
      open: true,
      title: '受理申请',
      fields: [
        { key: 'operator', label: '操作人', defaultValue: '客服台' },
        { key: 'remark', label: '受理备注', type: 'textarea', placeholder: '已受理，转交工程部审批' },
        { key: 'handover', label: '交接备注', type: 'textarea', placeholder: '转交时需说明的注意事项' },
      ],
      onConfirm: async (values) => {
        await processApplication(app.id, values.operator || '客服台', values.remark || '已受理，转交工程部审批', values.handover)
        await fetchApplicationDetail(app.id)
      },
    })
  }

  const handleReturn = () => {
    setModalConfig({
      open: true,
      title: '退回申请',
      fields: [
        { key: 'operator', label: '操作人', defaultValue: '工程部' },
        { key: 'remark', label: '退回原因', type: 'textarea', placeholder: '请说明退回原因' },
        { key: 'handover', label: '交接备注', type: 'textarea', placeholder: '退回后需营运专员关注的要点' },
      ],
      onConfirm: async (values) => {
        await returnApplication(app.id, values.operator || '工程部', values.remark || '审批退回，需补充资料', values.handover)
        await fetchApplicationDetail(app.id)
      },
    })
  }

  const handleSupplement = () => {
    setModalConfig({
      open: true,
      title: '补充资料',
      fields: [
        { key: 'operator', label: '操作人', defaultValue: '营运专员' },
        { key: 'description', label: '补充说明', type: 'textarea', placeholder: '请补充活动相关资料', defaultValue: app.description },
        { key: 'remark', label: '备注', type: 'textarea', placeholder: '补充资料后重新提交' },
        { key: 'handover', label: '交接备注', type: 'textarea', placeholder: '重新提交后需客服台/工程部关注的事项' },
      ],
      onConfirm: async (values) => {
        await supplementApplication(app.id, values.operator || '营运专员', values.remark || '已补充资料，重新提交', values.description, values.handover)
        await fetchApplicationDetail(app.id)
      },
    })
  }

  const handleClose = () => {
    setModalConfig({
      open: true,
      title: '关闭申请',
      fields: [
        { key: 'operator', label: '操作人', defaultValue: '营运专员' },
        { key: 'remark', label: '关闭原因', type: 'textarea', placeholder: '请说明关闭原因' },
        { key: 'handover', label: '交接备注', type: 'textarea', placeholder: '关闭后相关方需知晓的事项' },
      ],
      onConfirm: async (values) => {
        await closeApplication(app.id, values.operator || '营运专员', values.remark || '关闭申请', values.handover)
        await fetchApplicationDetail(app.id)
      },
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/applications" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            申请详情 #{app.id}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{app.activityName}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">申请信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">租户</p>
                  <p className="text-sm font-medium text-slate-700">{app.tenantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <MapPin size={16} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">活动场地</p>
                  <p className="text-sm font-medium text-slate-700">{app.venueName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Calendar size={16} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">活动日期</p>
                  <p className="text-sm font-medium text-slate-700">{app.activityDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <User size={16} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">当前状态</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>
            {app.description && (
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-400 mb-1">备注说明</p>
                <p className="text-sm text-slate-600">{app.description}</p>
              </div>
            )}
            {app.approvalId && (
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-400 mb-1">关联审批</p>
                <Link
                  to={`/approvals/${app.approvalId}`}
                  className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
                >
                  查看场地审批 #{app.approvalId} →
                </Link>
              </div>
            )}
          </div>

          {complaints.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-700">租户近期投诉</h2>
                <span className="text-xs text-slate-400">（{app.tenantName}）</span>
              </div>
              <div className="space-y-3">
                {complaints.map((c) => {
                  const cs = COMPLAINT_STATUS_MAP[c.status]
                  return (
                    <div key={c.id} className="px-3 py-2.5 bg-slate-50/80 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-700">{c.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${cs.bg} ${cs.color}`}>
                          {cs.label}
                        </span>
                        {c.category && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{c.category}</span>
                        )}
                      </div>
                      {c.content && (
                        <p className="text-xs text-slate-500 line-clamp-2">{c.content}</p>
                      )}
                      {c.result && (
                        <p className="text-xs text-emerald-600 mt-1">处理结果：{c.result}</p>
                      )}
                      {c.latestLogs && c.latestLogs.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {c.latestLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-1.5 px-2 py-1 bg-amber-50/60 rounded border border-amber-100/60">
                              <MessageSquare size={10} className="text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-xs text-amber-800">
                                <span className="font-medium">{log.operator}</span>
                                <span className="text-amber-500 mx-0.5">·</span>
                                {ACTION_LABEL_MAP[log.action] || log.action}
                                <span className="text-amber-500 mx-0.5">:</span>
                                {log.remark}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-300 mt-1">{c.createdAt}</p>
                      <button
                        onClick={() => setDrawerComplaintId(c.id)}
                        className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                      >
                        查看完整投诉历史 →
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">流转记录</h2>
            <Timeline logs={app.logs || []} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">操作</h2>
            <div className="space-y-2">
              {app.status === 'pending' && (
                <>
                  <button
                    onClick={handleProcess}
                    className="w-full px-4 py-2.5 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    受理申请（客服台）
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    关闭申请
                  </button>
                </>
              )}
              {app.status === 'processing' && (
                <>
                  <button
                    onClick={handleReturn}
                    className="w-full px-4 py-2.5 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    退回申请（工程部）
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    关闭申请
                  </button>
                </>
              )}
              {app.status === 'returned' && (
                <button
                  onClick={handleSupplement}
                  className="w-full px-4 py-2.5 text-sm text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  补充资料（营运专员）
                </button>
              )}
              {app.status === 'supplemented' && (
                <button
                  onClick={handleProcess}
                  className="w-full px-4 py-2.5 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  重新受理（客服台）
                </button>
              )}
              {app.status === 'closed' && (
                <p className="text-sm text-slate-400 text-center py-4">此申请已关闭</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">租户信息</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600">{app.tenantName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600">铺位 {app.tenantShopNo}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">时间信息</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">创建时间</span>
                <span className="text-xs text-slate-600">{app.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">更新时间</span>
                <span className="text-xs text-slate-600">{app.updatedAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActionModal
        open={modalConfig.open}
        onClose={() => setModalConfig({ ...modalConfig, open: false })}
        title={modalConfig.title}
        fields={modalConfig.fields}
        onConfirm={modalConfig.onConfirm}
      />

      <ComplaintDrawer
        open={drawerComplaintId !== null}
        complaintId={drawerComplaintId}
        onClose={() => setDrawerComplaintId(null)}
      />
    </div>
  )
}
