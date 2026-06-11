import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, CheckSquare, Clock, AlertTriangle } from 'lucide-react'
import { useMallStore } from '../store'

export default function HomePage() {
  const applications = useMallStore((s) => s.applications)
  const approvals = useMallStore((s) => s.approvals)
  const fetchApplications = useMallStore((s) => s.fetchApplications)
  const fetchApprovals = useMallStore((s) => s.fetchApprovals)

  useEffect(() => {
    fetchApplications()
    fetchApprovals()
  }, [fetchApplications, fetchApprovals])

  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const processingCount = applications.filter((a) => a.status === 'processing').length
  const returnedCount = applications.filter((a) => a.status === 'returned').length
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
          商场运营总览
        </h1>
        <p className="text-sm text-slate-500 mt-1">活动申请与场地审批状态概览</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-500" />
            </div>
            <span className="text-sm text-slate-500">待处理申请</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{pendingCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText size={20} className="text-blue-500" />
            </div>
            <span className="text-sm text-slate-500">处理中</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{processingCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <span className="text-sm text-slate-500">已退回</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{returnedCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckSquare size={20} className="text-emerald-500" />
            </div>
            <span className="text-sm text-slate-500">待审批</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{pendingApprovals}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-base font-semibold text-slate-800">最新活动申请</h2>
            <Link to="/applications" className="text-sm text-amber-600 hover:text-amber-700 transition-colors">
              查看全部 →
            </Link>
          </div>
          <div className="p-6">
            {applications.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">暂无申请记录</p>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}`}
                    className="flex items-center justify-between py-2 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{app.activityName}</p>
                      <p className="text-xs text-slate-400">{app.tenantName} · {app.createdAt}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      app.status === 'pending' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                      app.status === 'processing' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                      app.status === 'returned' ? 'text-red-700 bg-red-50 border-red-200' :
                      app.status === 'supplemented' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      'text-zinc-500 bg-zinc-50 border-zinc-200'
                    }`}>
                      {app.status === 'pending' ? '待处理' :
                       app.status === 'processing' ? '处理中' :
                       app.status === 'returned' ? '已退回' :
                       app.status === 'supplemented' ? '已补充' : '已关闭'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-base font-semibold text-slate-800">最新场地审批</h2>
            <Link to="/approvals" className="text-sm text-amber-600 hover:text-amber-700 transition-colors">
              查看全部 →
            </Link>
          </div>
          <div className="p-6">
            {approvals.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">暂无审批记录</p>
            ) : (
              <div className="space-y-3">
                {approvals.slice(0, 5).map((approval) => (
                  <Link
                    key={approval.id}
                    to={`/approvals/${approval.id}`}
                    className="flex items-center justify-between py-2 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{approval.venueName}</p>
                      <p className="text-xs text-slate-400">{approval.tenantName} · {approval.createdAt}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      approval.status === 'pending' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                      approval.status === 'approved' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      'text-red-700 bg-red-50 border-red-200'
                    }`}>
                      {approval.status === 'pending' ? '待审批' :
                       approval.status === 'approved' ? '已通过' : '已退回'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
