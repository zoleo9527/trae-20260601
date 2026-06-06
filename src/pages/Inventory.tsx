import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import type { InventoryStatus } from '@/types'
import { StatusBadge } from '@/components/Badges'
import { RemarkPanel, AttachmentPanel } from '@/components/RemarkPanel'
import { canPerformAction } from '@/services/permissions'
import {
  Package,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  ChevronRight,
  Film,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Link } from 'react-router-dom'

export default function Inventory() {
  const inventoryItems = useStore((state) => state.inventoryItems)
  const screenings = useStore((state) => state.screenings)
  const currentUser = useStore((state) => state.currentUser)
  const updateInventoryStatus = useStore((state) => state.updateInventoryStatus)
  const linkInventoryToScreening = useStore((state) => state.linkInventoryToScreening)
  const syncInventoryToScreenings = useStore((state) => state.syncInventoryToScreenings)
  const getInventoryById = useStore((state) => state.getInventoryById)

  const [filter, setFilter] = useState<InventoryStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [selectedScreening, setSelectedScreening] = useState('')
  const [syncing, setSyncing] = useState(false)

  const selectedItem = useMemo(
    () => (selectedItemId ? getInventoryById(selectedItemId) : null),
    [selectedItemId, inventoryItems, getInventoryById]
  )

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesFilter = filter === 'all' || item.status === filter
      const matchesSearch =
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [inventoryItems, filter, searchTerm])

  const handleStatusUpdate = async (id: string, status: InventoryStatus) => {
    await updateInventoryStatus(id, status, currentUser.id, currentUser.name)
  }

  const handleLinkScreening = async () => {
    if (selectedItem && selectedScreening) {
      await linkInventoryToScreening(selectedItem.id, selectedScreening)
      setLinkModalOpen(false)
      setSelectedScreening('')
    }
  }

  const handleSyncToScreenings = async () => {
    if (!selectedItem) return
    setSyncing(true)
    await syncInventoryToScreenings(selectedItem.id)
    setSyncing(false)
  }

  const getDiscrepancyIcon = (discrepancy: number) => {
    if (discrepancy > 0) return <ArrowUpRight className="w-4 h-4 text-success-600" />
    if (discrepancy < 0) return <ArrowDownRight className="w-4 h-4 text-danger-600" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getDiscrepancyColor = (discrepancy: number) => {
    if (discrepancy > 0) return 'text-success-600'
    if (discrepancy < 0) return 'text-danger-600'
    return 'text-gray-600'
  }

  const statusOptions: { value: InventoryStatus; label: string; color: string; permission: string }[] = [
    { value: 'pending', label: '标记为待处理', color: 'bg-warning-50 text-warning-700 hover:bg-warning-100', permission: 'update_status:pending' },
    { value: 'in_progress', label: '开始处理', color: 'bg-primary-50 text-primary-700 hover:bg-primary-100', permission: 'update_status:in_progress' },
    { value: 'resolved', label: '标记已解决', color: 'bg-success-50 text-success-700 hover:bg-success-100', permission: 'update_status' },
    { value: 'escalated', label: '升级处理', color: 'bg-danger-50 text-danger-700 hover:bg-danger-100', permission: 'update_status' },
  ]

  const canSync = canPerformAction('inventory', 'sync_to_screening', currentUser.role)
  const canLink = canPerformAction('inventory', 'link_screening', currentUser.role)
  const canCreate = canPerformAction('inventory', 'create', currentUser.role)
  const canAddRemark = canPerformAction('inventory', 'add_remark', currentUser.role)
  const canAddAttachment = canPerformAction('inventory', 'add_attachment', currentUser.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">卖品库存</h1>
          <p className="text-gray-500 mt-1">管理卖品库存盘点、差异处理，备注支持同步到关联场次对账</p>
        </div>
        {canCreate ? (
          <button className="btn-primary">新建盘点单</button>
        ) : (
          <button className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2" disabled>
            <Lock className="w-4 h-4" />
            新建盘点单
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {(['pending', 'in_progress', 'resolved', 'escalated'] as InventoryStatus[]).map((status) => {
          const count = inventoryItems.filter((i) => i.status === status).length
          const labels = {
            pending: '待处理',
            in_progress: '处理中',
            resolved: '已解决',
            escalated: '已升级',
          }
          const colors = {
            pending: 'bg-warning-50 border-warning-200',
            in_progress: 'bg-primary-50 border-primary-200',
            resolved: 'bg-success-50 border-success-200',
            escalated: 'bg-danger-50 border-danger-200',
          }
          return (
            <div key={status} className={`p-4 rounded-xl border ${colors[status]}`}>
              <p className="text-sm text-gray-600">{labels[status]}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索商品名称或SKU..."
                  className="input pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as InventoryStatus | 'all')}
                  className="input"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="in_progress">处理中</option>
                  <option value="resolved">已解决</option>
                  <option value="escalated">已升级</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">商品</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">账面库存</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">实际库存</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">差异</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">处理人</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">关联场次</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {item.expectedStock} {item.unit}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          {getDiscrepancyIcon(item.discrepancy)}
                          <span className={`font-medium ${getDiscrepancyColor(item.discrepancy)}`}>
                            {item.discrepancy > 0 ? '+' : ''}
                            {item.discrepancy}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {item.handlerName || '-'}
                      </td>
                      <td className="py-4 px-4">
                        {item.relatedScreeningIds.length > 0 ? (
                          <span className="text-sm text-primary-600">
                            {item.relatedScreeningIds.length} 场
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedItemId(item.id)
                          }}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedItem && (
          <div className="w-96">
            <div className="card space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedItem.productName}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedItem.sku}</p>
                </div>
                <button
                  onClick={() => setSelectedItemId(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">账面库存</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedItem.expectedStock} {selectedItem.unit}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">实际库存</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedItem.currentStock} {selectedItem.unit}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${selectedItem.discrepancy !== 0 ? 'bg-danger-50' : 'bg-success-50'}`}>
                  <p className="text-xs text-gray-500">差异</p>
                  <p className={`text-lg font-semibold ${selectedItem.discrepancy !== 0 ? 'text-danger-600' : 'text-success-600'}`}>
                    {selectedItem.discrepancy > 0 ? '+' : ''}
                    {selectedItem.discrepancy} {selectedItem.unit}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">状态</p>
                  <StatusBadge status={selectedItem.status} />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">推进动作</p>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions
                    .filter((opt) => opt.value !== selectedItem.status)
                    .map((opt) => {
                      const allowed = canPerformAction('inventory', opt.permission, currentUser.role)
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusUpdate(selectedItem.id, opt.value)}
                          disabled={!allowed}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            allowed ? opt.color : 'bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-1'
                          }`}
                        >
                          {!allowed && <Lock className="w-3.5 h-3.5" />}
                          {opt.label}
                        </button>
                      )
                    })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">关联场次对账</p>
                  {canLink ? (
                    <button
                      onClick={() => setLinkModalOpen(true)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      + 关联场次
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      无权限
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedItem.relatedScreeningIds.map((sid) => {
                    const screening = screenings.find((s) => s.id === sid)
                    if (!screening) return null
                    return (
                      <Link
                        key={sid}
                        to={`/screenings`}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Film className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{screening.movieName}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(screening.startTime), 'HH:mm', { locale: zhCN })} · {screening.currentHall}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    )
                  })}
                  {selectedItem.relatedScreeningIds.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">暂未关联场次</p>
                  )}
                </div>
              </div>

              {selectedItem.relatedScreeningIds.length > 0 && (
                <div className="bg-primary-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-primary-900 mb-2">数据同步</p>
                  <p className="text-xs text-primary-700 mb-3">
                    将库存备注和附件同步到关联的场次对账记录中，在场次页可继续处理
                  </p>
                  {canSync ? (
                    <button
                      onClick={handleSyncToScreenings}
                      disabled={syncing}
                      className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? '同步中...' : '同步到关联场次'}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full btn-primary opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      同步到关联场次
                    </button>
                  )}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">备注</p>
                  {!canAddRemark && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 无权限添加
                    </span>
                  )}
                </div>
                <RemarkPanel sourceType="inventory" sourceId={selectedItem.id} readOnly={!canAddRemark} />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">附件</p>
                  {!canAddAttachment && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 无权限上传
                    </span>
                  )}
                </div>
                <AttachmentPanel sourceType="inventory" sourceId={selectedItem.id} readOnly={!canAddAttachment} />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400">
                  最后更新: {format(new Date(selectedItem.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {linkModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">关联到场次对账</h3>
            <p className="text-sm text-gray-500 mb-4">
              选择要关联的场次，库存备注可同步到该场次的对账记录中
            </p>
            <select
              value={selectedScreening}
              onChange={(e) => setSelectedScreening(e.target.value)}
              className="input mb-4"
            >
              <option value="">选择场次...</option>
              {screenings.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.movieName} - {format(new Date(s.startTime), 'HH:mm', { locale: zhCN })} ({s.currentHall})
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setLinkModalOpen(false)
                  setSelectedScreening('')
                }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleLinkScreening}
                disabled={!selectedScreening}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                确认关联
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
