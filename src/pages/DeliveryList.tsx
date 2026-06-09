import { useEffect, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { DeliveryStatusBadge } from '@/components/StatusBadge'
import { Search, RefreshCw } from 'lucide-react'
import type { DeliveryStatus } from '../../shared/types'

export default function DeliveryList() {
  const { deliveries, loadDeliveries } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | ''>('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    loadDeliveries({ status: statusFilter || undefined, keyword: keyword || undefined })
  }, [statusFilter])

  const handleSearch = () => {
    loadDeliveries({ status: statusFilter || undefined, keyword: keyword || undefined })
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">派件清单</h2>
          <p className="text-sm text-slate-500 mt-1">查看所有派件记录，标记问题件</p>
        </div>
        <button
          onClick={() => loadDeliveries({ status: statusFilter || undefined, keyword: keyword || undefined })}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded px-3 py-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 刷新
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索单号/收件人/电话"
              className="text-sm border-none outline-none w-48 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-1.5 ml-auto">
            {(['', 'pending', 'delivering', 'delivered', 'problem', 'returned'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {s === '' ? '全部' : s === 'pending' ? '待派送' : s === 'delivering' ? '派送中' : s === 'delivered' ? '已签收' : s === 'problem' ? '问题件' : '已退回'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">快递单号</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">收件人</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">电话</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">地址</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">派件员</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">状态</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">登记时间</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-700">{d.trackingNumber}</td>
                  <td className="px-4 py-2.5 text-slate-700">{d.recipientName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.recipientPhone}</td>
                  <td className="px-4 py-2.5 text-slate-600 max-w-[200px] truncate">{d.deliveryAddress}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.courierName}</td>
                  <td className="px-4 py-2.5"><DeliveryStatusBadge status={d.status as DeliveryStatus} /></td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{d.createdAt}</td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
