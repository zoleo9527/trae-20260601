import { useSampleStore } from '@/store/sampleStore'
import { useShallow } from 'zustand/shallow'
import type { FilterState, RecordStatus } from '@/types'
import { Search, Filter, X } from 'lucide-react'

const stores = ['南京西路店', '徐家汇店', '五角场店', '静安寺店', '中山公园店', '虹桥店', '陆家嘴店']

export default function FilterBar() {
  const { filters, setFilters } = useSampleStore(
    useShallow((s) => ({ filters: s.filters, setFilters: s.setFilters }))
  )

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="搜索编号、产品、批次、门店..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="h-10 w-full rounded-lg border border-slate-600 bg-slate-800/50 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value as FilterState['status'] | RecordStatus })}
          className="h-10 rounded-lg border border-slate-600 bg-slate-800/50 px-3 text-sm text-slate-200 outline-none transition-colors focus:border-sky-500"
        >
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="sampling">留样中</option>
          <option value="completed">已完成</option>
          <option value="abnormal">异常</option>
        </select>

        <select
          value={filters.store}
          onChange={(e) => setFilters({ store: e.target.value })}
          className="h-10 rounded-lg border border-slate-600 bg-slate-800/50 px-3 text-sm text-slate-200 outline-none transition-colors focus:border-sky-500"
        >
          <option value="">全部门店</option>
          {stores.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.exceptionType}
          onChange={(e) => setFilters({ exceptionType: e.target.value as FilterState['exceptionType'] })}
          className="h-10 rounded-lg border border-slate-600 bg-slate-800/50 px-3 text-sm text-slate-200 outline-none transition-colors focus:border-sky-500"
        >
          <option value="all">全部类型</option>
          <option value="rush">临时加单</option>
          <option value="allergen">过敏原漏标</option>
          <option value="receiving">收货不清</option>
        </select>
      </div>
    </div>
  )
}
