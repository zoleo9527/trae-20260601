import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye } from 'lucide-react'
import { useMallStore } from '../store'
import { APPLICATION_STATUS_MAP, type ApplicationStatus } from '../types'
import CreateApplicationModal from '../components/CreateApplicationModal'

const STATUS_TABS: { value: ApplicationStatus | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'returned', label: '已退回' },
  { value: 'supplemented', label: '已补充' },
  { value: 'closed', label: '已关闭' },
]

export default function ApplicationsPage() {
  const applications = useMallStore((s) => s.applications)
  const fetchApplications = useMallStore((s) => s.fetchApplications)
  const fetchTenants = useMallStore((s) => s.fetchTenants)
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')
  const [searchText, setSearchText] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  useEffect(() => {
    fetchApplications(statusFilter || undefined, searchText || undefined)
  }, [statusFilter, searchText, fetchApplications])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            活动申请
          </h1>
          <p className="text-sm text-slate-500 mt-1">创建、处理和跟踪活动申请</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          新建申请
        </button>
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
              placeholder="搜索租户名称"
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 w-48"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {applications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400">暂无活动申请记录</p>
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-3 text-sm text-amber-600 hover:text-amber-700 transition-colors"
              >
                创建第一条申请 →
              </button>
            </div>
          ) : (
            applications.map((app) => {
              const statusInfo = APPLICATION_STATUS_MAP[app.status]
              return (
                <div key={app.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-1 self-stretch rounded-full ${statusInfo.bg.replace('border-', 'bg-').replace('50', '400')}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{app.activityName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">{app.tenantName}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-500">{app.venueName}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{app.activityDate}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mr-4">{app.createdAt}</div>
                  <Link
                    to={`/applications/${app.id}`}
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

      <CreateApplicationModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
