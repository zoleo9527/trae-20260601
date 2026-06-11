import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye } from 'lucide-react'
import { useMallStore } from '../store'
import { APPROVAL_STATUS_MAP, type ApprovalStatus } from '../types'

const STATUS_TABS: { value: ApprovalStatus | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已退回' },
]

export default function ApprovalsPage() {
  const approvals = useMallStore((s) => s.approvals)
  const fetchApprovals = useMallStore((s) => s.fetchApprovals)
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | ''>('')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchApprovals(statusFilter || undefined)
  }, [statusFilter, fetchApprovals])

  const filteredApprovals = searchText
    ? approvals.filter(
        (a) =>
          a.venueName?.includes(searchText) ||
          a.tenantName?.includes(searchText) ||
          String(a.id).includes(searchText) ||
          String(a.applicationId).includes(searchText)
      )
    : approvals

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            场地审批
          </h1>
          <p className="text-sm text-slate-500 mt-1">审批活动场地申请、查看审批历史</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索场地/编号"
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 w-48"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredApprovals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400">暂无场地审批记录</p>
              <Link
                to="/applications"
                className="mt-3 text-sm text-amber-600 hover:text-amber-700 transition-colors inline-block"
              >
                创建活动申请 →
              </Link>
            </div>
          ) : (
            filteredApprovals.map((approval) => {
              const statusInfo = APPROVAL_STATUS_MAP[approval.status]
              return (
                <div key={approval.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-1 self-stretch rounded-full ${
                    approval.status === 'pending' ? 'bg-amber-400' :
                    approval.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{approval.venueName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Link
                        to={`/applications/${approval.applicationId}`}
                        className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        关联申请 #{approval.applicationId}
                      </Link>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-500">{approval.tenantName}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{approval.applicationName}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mr-4">{approval.createdAt}</div>
                  <Link
                    to={`/approvals/${approval.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Eye size={14} />
                    查看
                  </Link>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
