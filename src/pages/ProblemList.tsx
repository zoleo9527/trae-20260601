import { useEffect, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { ProblemStatusBadge } from '@/components/StatusBadge'
import { Search, RefreshCw, ArrowRight, Plus } from 'lucide-react'
import { PROBLEM_TYPE_LABELS, type ProblemStatus, type ProblemType } from '../../shared/types'
import { Link } from 'react-router-dom'

export default function ProblemList() {
  const { problems, loadProblems } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<ProblemStatus | ''>('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const params: any = {}
    if (statusFilter) params.status = statusFilter
    if (keyword) params.keyword = keyword
    loadProblems(params)
  }, [statusFilter])

  const handleSearch = () => {
    const params: any = {}
    if (statusFilter) params.status = statusFilter
    if (keyword) params.keyword = keyword
    loadProblems(params)
  }

  const statusTabs: { value: ProblemStatus | ''; label: string }[] = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'contacting', label: '联系中' },
    { value: 'supplementing', label: '补录中' },
    { value: 'reviewing', label: '复核中' },
    { value: 'returned', label: '已退回' },
    { value: 'resolved', label: '已解决' },
    { value: 'closed', label: '已关闭' },
  ]

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">问题件登记</h2>
          <p className="text-sm text-slate-500 mt-1">登记、补录、退回、复核问题件，主流程一体化处理</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/problems/new"
            className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> 新建登记
          </Link>
          <button
            onClick={() => loadProblems(statusFilter ? { status: statusFilter } : undefined)}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded px-3 py-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 刷新
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索单号/描述"
                className="text-sm border-none outline-none w-48 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${statusFilter === tab.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {problems.map((p) => (
            <div key={p.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono font-medium text-slate-800">{p.trackingNumber}</span>
                    <ProblemStatusBadge status={p.status as ProblemStatus} />
                    <span className="text-xs text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                      {PROBLEM_TYPE_LABELS[p.problemType as ProblemType] || p.problemType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1.5">{p.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>报告人：{p.reporterName}</span>
                    <span>责任人：{p.responsiblePersonName}</span>
                    <span>{p.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-4">
                  <Link
                    to={`/problems/${p.id}`}
                    className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                  >
                    处理 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {problems.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  )
}
