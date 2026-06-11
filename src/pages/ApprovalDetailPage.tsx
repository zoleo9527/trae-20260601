import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Building2, User, Phone, Calendar } from 'lucide-react'
import { useMallStore } from '../store'
import { APPROVAL_STATUS_MAP } from '../types'
import Timeline from '../components/Timeline'
import ActionModal from '../components/ActionModal'

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const currentApproval = useMallStore((s) => s.currentApproval)
  const fetchApprovalDetail = useMallStore((s) => s.fetchApprovalDetail)
  const approveVenue = useMallStore((s) => s.approveVenue)
  const rejectVenue = useMallStore((s) => s.rejectVenue)
  const supplementApproval = useMallStore((s) => s.supplementApproval)

  const [modalConfig, setModalConfig] = useState<{
    open: boolean
    title: string
    fields: { key: string; label: string; type?: 'text' | 'textarea'; placeholder?: string; defaultValue?: string }[]
    onConfirm: (values: Record<string, string>) => void
  }>({ open: false, title: '', fields: [], onConfirm: () => {} })

  useEffect(() => {
    if (id) fetchApprovalDetail(Number(id))
  }, [id, fetchApprovalDetail])

  if (!currentApproval) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-400">加载中...</p>
      </div>
    )
  }

  const approval = currentApproval
  const statusInfo = APPROVAL_STATUS_MAP[approval.status]

  const handleApprove = () => {
    setModalConfig({
      open: true,
      title: '审批通过',
      fields: [
        { key: 'operator', label: '审批人', defaultValue: '工程部' },
        { key: 'remark', label: '审批意见', type: 'textarea', placeholder: '审批通过' },
      ],
      onConfirm: async (values) => {
        await approveVenue(approval.id, values.operator || '工程部', values.remark || '审批通过')
        await fetchApprovalDetail(approval.id)
      },
    })
  }

  const handleReject = () => {
    setModalConfig({
      open: true,
      title: '审批退回',
      fields: [
        { key: 'operator', label: '审批人', defaultValue: '工程部' },
        { key: 'remark', label: '退回原因', type: 'textarea', placeholder: '请说明退回原因' },
      ],
      onConfirm: async (values) => {
        await rejectVenue(approval.id, values.operator || '工程部', values.remark || '审批退回')
        await fetchApprovalDetail(approval.id)
      },
    })
  }

  const handleSupplement = () => {
    setModalConfig({
      open: true,
      title: '补充意见重新提交',
      fields: [
        { key: 'operator', label: '操作人', defaultValue: '营运专员' },
        { key: 'remark', label: '补充说明', type: 'textarea', placeholder: '补充意见后重新提交审批' },
      ],
      onConfirm: async (values) => {
        await supplementApproval(approval.id, values.operator || '营运专员', values.remark || '补充意见后重新提交审批')
        await fetchApprovalDetail(approval.id)
      },
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/approvals" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            审批详情 #{approval.id}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{approval.venueName}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">审批信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <MapPin size={16} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">场地</p>
                  <p className="text-sm font-medium text-slate-700">{approval.venueName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">申请方</p>
                  <p className="text-sm font-medium text-slate-700">{approval.tenantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Calendar size={16} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">活动日期</p>
                  <p className="text-sm font-medium text-slate-700">{approval.activityDate}</p>
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
            {approval.description && (
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-400 mb-1">活动说明</p>
                <p className="text-sm text-slate-600">{approval.description}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-50">
              <p className="text-xs text-slate-400 mb-1">关联申请</p>
              <Link
                to={`/applications/${approval.applicationId}`}
                className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
              >
                查看活动申请 #{approval.applicationId} →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">审批流转记录</h2>
            <Timeline logs={approval.logs || []} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">审批操作</h2>
            <div className="space-y-2">
              {approval.status === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="w-full px-4 py-2.5 text-sm text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    审批通过（工程部）
                  </button>
                  <button
                    onClick={handleReject}
                    className="w-full px-4 py-2.5 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    审批退回（工程部）
                  </button>
                </>
              )}
              {approval.status === 'rejected' && (
                <button
                  onClick={handleSupplement}
                  className="w-full px-4 py-2.5 text-sm text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  补充意见重新提交（营运专员）
                </button>
              )}
              {approval.status === 'approved' && (
                <p className="text-sm text-slate-400 text-center py-4">此审批已通过</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">租户信息</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600">{approval.tenantName}</span>
              </div>
              {approval.shopNo && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">铺位 {approval.shopNo}</span>
                </div>
              )}
              {approval.contact && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">{approval.contact}</span>
                </div>
              )}
              {approval.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">{approval.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">时间信息</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">创建时间</span>
                <span className="text-xs text-slate-600">{approval.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">更新时间</span>
                <span className="text-xs text-slate-600">{approval.updatedAt}</span>
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
    </div>
  )
}
