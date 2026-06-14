
import { Search, Plus } from 'lucide-react'
import { useTicketStore } from '../store/ticketStore'
import { TicketStatus } from '../types'

const statusOptions: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已派工' },
  { value: 'repairing', label: '维修中' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已退回' },
]

interface FilterBarProps {
  onCreateClick: () => void
}

export function FilterBar({ onCreateClick }: FilterBarProps) {
  const { filterStatus, setFilterStatus, searchKeyword, setSearchKeyword, currentUser } = useTicketStore()

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索设备号、设备名称或描述..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TicketStatus | 'all')}
          className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {(currentUser.role === 'clerk' || currentUser.role === 'manager') && (
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          提交故障单
        </button>
      )}
    </div>
  )
}
