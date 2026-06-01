import { cn } from '@/lib/utils'
import { useOrderStore } from '@/store/useOrderStore'
import type { ViewMode } from '@/types'
import { AlertTriangle, Calendar, CalendarClock, Search } from 'lucide-react'

const tabs: { mode: ViewMode; label: string; icon: typeof Calendar }[] = [
  { mode: 'today', label: '今天', icon: Calendar },
  { mode: 'tomorrow', label: '明天', icon: CalendarClock },
  { mode: 'abnormal', label: '异常订单', icon: AlertTriangle },
]

export default function Sidebar() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery, getTodayOrders, getTomorrowOrders, getAbnormalOrders } = useOrderStore()

  const counts = {
    today: getTodayOrders().length,
    tomorrow: getTomorrowOrders().length,
    abnormal: getAbnormalOrders().length,
  }

  return (
    <aside className="w-64 bg-white border-r border-stone-200 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-stone-100">
        <h1 className="text-lg font-bold text-stone-800 tracking-tight">社区食堂</h1>
        <p className="text-xs text-stone-400 mt-0.5">订餐管理系统</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              viewMode === mode
                ? 'bg-orange-50 text-orange-700 shadow-sm'
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
            )}
          >
            <Icon
              size={18}
              className={cn(
                'flex-shrink-0',
                viewMode === mode ? 'text-orange-600' : 'text-stone-400'
              )}
            />
            <span className="flex-1 text-left">{label}</span>
            {counts[mode] > 0 && (
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full min-w-[24px] text-center',
                  mode === 'abnormal' && counts[mode] > 0
                    ? 'bg-red-100 text-red-700'
                    : viewMode === mode
                    ? 'bg-orange-200 text-orange-800'
                    : 'bg-stone-100 text-stone-500'
                )}
              >
                {counts[mode]}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="搜索姓名、地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 placeholder:text-stone-400"
          />
        </div>
      </div>
    </aside>
  )
}
