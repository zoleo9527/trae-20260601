import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { StatusBadge } from '@/components/Badges'
import { RemarkPanel, AttachmentPanel } from '@/components/RemarkPanel'
import { canPerformAction } from '@/services/permissions'
import type { ScreeningStatus } from '@/types'
import {
  Film,
  Search,
  Clock,
  Users,
  Ticket,
  X,
  ChevronRight,
  Package,
  ArrowRightLeft,
  Monitor,
  Undo2,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Link } from 'react-router-dom'

export default function Screenings() {
  const screenings = useStore((state) => state.screenings)
  const inventoryItems = useStore((state) => state.inventoryItems)
  const currentUser = useStore((state) => state.currentUser)
  const changeHall = useStore((state) => state.changeHall)
  const recordEquipmentFailure = useStore((state) => state.recordEquipmentFailure)
  const processRefund = useStore((state) => state.processRefund)
  const redeemGroupTicket = useStore((state) => state.redeemGroupTicket)
  const completeScreeningReconciliation = useStore((state) => state.completeScreeningReconciliation)
  const refreshAll = useStore((state) => state.refreshAll)
  const getScreeningById = useStore((state) => state.getScreeningById)

  const [filter, setFilter] = useState<ScreeningStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedScreeningId, setSelectedScreeningId] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  
  const [hallModalOpen, setHallModalOpen] = useState(false)
  const [newHall, setNewHall] = useState('')
  const [hallReason, setHallReason] = useState('')
  
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false)
  const [equipmentDesc, setEquipmentDesc] = useState('')
  
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [refundCount, setRefundCount] = useState(1)
  const [refundReason, setRefundReason] = useState('')
  
  const [redeemModalOpen, setRedeemModalOpen] = useState(false)
  const [redeemCount, setRedeemCount] = useState(1)

  const selectedScreening = useMemo(
    () => (selectedScreeningId ? getScreeningById(selectedScreeningId) : null),
    [selectedScreeningId, screenings, getScreeningById]
  )

  const canChangeHall = canPerformAction('screening', 'change_hall', currentUser.role)
  const canRecordEquipment = canPerformAction('screening', 'record_equipment_failure', currentUser.role)
  const canProcessRefund = canPerformAction('screening', 'process_refund', currentUser.role)
  const canRedeem = canPerformAction('screening', 'redeem_group_ticket', currentUser.role)
  const canComplete = canPerformAction('screening', 'complete_reconciliation', currentUser.role)
  const canAddRemark = canPerformAction('screening', 'add_remark', currentUser.role)
  const canAddAttachment = canPerformAction('screening', 'add_attachment', currentUser.role)

  const filteredScreenings = useMemo(() => {
    return screenings.filter((s) => {
      const matchesFilter = filter === 'all' || s.status === filter
      const matchesSearch = s.movieName.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [screenings, filter, searchTerm])

  const handleChangeHall = () => {
    if (selectedScreening && newHall && hallReason) {
      changeHall(selectedScreening.id, newHall, currentUser.id, currentUser.name, hallReason)
      setHallModalOpen(false)
      setNewHall('')
      setHallReason('')
    }
  }

  const handleEquipmentFailure = () => {
    if (selectedScreening && equipmentDesc) {
      recordEquipmentFailure(selectedScreening.id, equipmentDesc, currentUser.id, currentUser.name)
      setEquipmentModalOpen(false)
      setEquipmentDesc('')
    }
  }

  const handleRefund = () => {
    if (selectedScreening && refundReason) {
      processRefund(selectedScreening.id, refundCount, refundReason, currentUser.id, currentUser.name)
      setRefundModalOpen(false)
      setRefundCount(1)
      setRefundReason('')
    }
  }

  const handleRedeem = () => {
    if (selectedScreening) {
      redeemGroupTicket(selectedScreening.id, redeemCount, currentUser.id, currentUser.name)
      setRedeemModalOpen(false)
      setRedeemCount(1)
    }
  }

  const handleCompleteReconciliation = async () => {
    if (!selectedScreening || !canComplete) return
    setCompleting(true)
    await completeScreeningReconciliation(selectedScreening.id, currentUser.id, currentUser.name)
    setCompleting(false)
  }

  const halls = ['1号厅', '2号厅', '3号厅', '4号厅', 'IMAX厅', 'VIP厅']

  const ActionButton = ({
    onClick,
    disabled,
    canPerform,
    children,
    className = '',
  }: {
    onClick?: () => void
    disabled?: boolean
    canPerform: boolean
    children: React.ReactNode
    className?: string
  }) => {
    if (!canPerform) {
      return (
        <button
          disabled
          className={`flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium ${className}`}
        >
          <Lock className="w-4 h-4" />
          {children}
        </button>
      )
    }
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {children}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">场次对账</h1>
          <p className="text-gray-500 mt-1">处理场次换厅、团体票核销、设备故障退票，替代排片表反复确认</p>
        </div>
        <button
          onClick={() => refreshAll()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {(['normal', 'hall_changed', 'equipment_failure', 'refund_issue', 'completed'] as ScreeningStatus[]).map((status) => {
          const count = screenings.filter((s) => s.status === status).length
          const labels = {
            normal: '正常',
            hall_changed: '已换厅',
            equipment_failure: '设备故障',
            refund_issue: '退票问题',
            completed: '已完成',
          }
          const colors = {
            normal: 'bg-success-50 border-success-200',
            hall_changed: 'bg-warning-50 border-warning-200',
            equipment_failure: 'bg-danger-50 border-danger-200',
            refund_issue: 'bg-warning-50 border-warning-200',
            completed: 'bg-gray-50 border-gray-200',
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
                  placeholder="搜索影片名称..."
                  className="input pl-9"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as ScreeningStatus | 'all')}
                className="input w-40"
              >
                <option value="all">全部状态</option>
                <option value="normal">正常</option>
                <option value="hall_changed">已换厅</option>
                <option value="equipment_failure">设备故障</option>
                <option value="refund_issue">退票问题</option>
                <option value="completed">已完成</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredScreenings.map((screening) => (
                <div
                  key={screening.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    selectedScreening?.id === screening.id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedScreeningId(screening.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Film className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{screening.movieName}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(screening.startTime), 'HH:mm', { locale: zhCN })} -
                            {format(new Date(screening.endTime), 'HH:mm', { locale: zhCN })}
                          </span>
                          {screening.isHallChanged ? (
                            <span className="flex items-center gap-1 text-warning-600">
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              {screening.originalHall} → {screening.currentHall}
                            </span>
                          ) : (
                            <span>{screening.currentHall}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Ticket className="w-3.5 h-3.5" />
                            {screening.soldTickets}/{screening.totalTickets} 张
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Users className="w-3.5 h-3.5" />
                            团体票 {screening.groupRedeemed}/{screening.groupTickets}
                          </span>
                          {screening.refundCount > 0 && (
                            <span className="flex items-center gap-1 text-danger-600">
                              <Undo2 className="w-3.5 h-3.5" />
                              已退票 {screening.refundCount}
                            </span>
                          )}
                          {screening.hasEquipmentFailure && (
                            <span className="flex items-center gap-1 text-danger-600">
                              <Monitor className="w-3.5 h-3.5" />
                              设备故障
                            </span>
                          )}
                          {screening.syncedRemarks.length > 0 && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <Package className="w-3.5 h-3.5" />
                              已同步 {screening.syncedRemarks.length} 条备注
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={screening.status} />
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedScreening && (
          <div className="w-[420px]">
            <div className="card space-y-6 max-h-[calc(100vh-160px)] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedScreening.movieName}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <StatusBadge status={selectedScreening.status} />
                    {selectedScreening.hasEquipmentFailure && (
                      <span className="badge bg-danger-100 text-danger-600">设备故障</span>
                    )}
                    {selectedScreening.syncedRemarks.length > 0 && (
                      <span className="badge bg-purple-100 text-purple-600">
                        已同步 {selectedScreening.syncedRemarks.length} 条库存备注
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedScreeningId(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">开始时间</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {format(new Date(selectedScreening.startTime), 'HH:mm', { locale: zhCN })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">影厅</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedScreening.isHallChanged ? (
                      <span className="text-warning-600">{selectedScreening.currentHall}</span>
                    ) : (
                      selectedScreening.currentHall
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">已售票</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedScreening.soldTickets} / {selectedScreening.totalTickets}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">退票</p>
                  <p className={`font-semibold mt-1 ${selectedScreening.refundCount > 0 ? 'text-danger-600' : 'text-gray-900'}`}>
                    {selectedScreening.refundCount} 张
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">团体票核销</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedScreening.groupRedeemed}
                      <span className="text-base text-gray-400 font-normal"> / {selectedScreening.groupTickets}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">已核销 / 总团体票</p>
                  </div>
                  <ActionButton
                    onClick={() => setRedeemModalOpen(true)}
                    disabled={selectedScreening.groupRedeemed >= selectedScreening.groupTickets || selectedScreening.status === 'completed'}
                    canPerform={canRedeem}
                    className="bg-primary-50 text-primary-700 hover:bg-primary-100"
                  >
                    核销
                  </ActionButton>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">推进动作</p>
                <div className="grid grid-cols-2 gap-2">
                  <ActionButton
                    onClick={() => setHallModalOpen(true)}
                    disabled={selectedScreening.status === 'completed'}
                    canPerform={canChangeHall}
                    className="bg-warning-50 text-warning-700 hover:bg-warning-100"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    临时换厅
                  </ActionButton>
                  <ActionButton
                    onClick={() => setEquipmentModalOpen(true)}
                    disabled={selectedScreening.status === 'completed'}
                    canPerform={canRecordEquipment}
                    className="bg-danger-50 text-danger-700 hover:bg-danger-100"
                  >
                    <Monitor className="w-4 h-4" />
                    设备故障
                  </ActionButton>
                  <ActionButton
                    onClick={() => setRefundModalOpen(true)}
                    disabled={selectedScreening.status === 'completed'}
                    canPerform={canProcessRefund}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <Undo2 className="w-4 h-4" />
                    处理退票
                  </ActionButton>
                  <ActionButton
                    onClick={handleCompleteReconciliation}
                    disabled={selectedScreening.status === 'completed' || completing}
                    canPerform={canComplete}
                    className="bg-success-50 text-success-700 hover:bg-success-100"
                  >
                    {completing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {selectedScreening.status === 'completed' ? '已完成对账' : '完成对账'}
                  </ActionButton>
                </div>
                {selectedScreening.status === 'completed' && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    本场次已完成对账，关联异常和待办已自动收口
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">关联卖品库存</p>
                <div className="space-y-2">
                  {selectedScreening.inventoryIds.map((iid) => {
                    const inv = inventoryItems.find((i) => i.id === iid)
                    if (!inv) return null
                    const hasSynced = selectedScreening.syncedRemarks.some((r) =>
                      inv.remarks.some((ir) => ir.id === r)
                    )
                    return (
                      <Link
                        key={iid}
                        to="/inventory"
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Package className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{inv.productName}</p>
                          <p className="text-xs text-gray-500">
                            差异 {inv.discrepancy > 0 ? '+' : ''}{inv.discrepancy}
                            {inv.remarks.length > 0 && ` · ${inv.remarks.length}条备注`}
                            {hasSynced && <span className="text-purple-600 ml-1">· 已同步</span>}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    )
                  })}
                  {selectedScreening.inventoryIds.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">暂未关联库存</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">备注</p>
                  {!canAddRemark && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 无权限添加
                    </span>
                  )}
                </div>
                <RemarkPanel sourceType="screening" sourceId={selectedScreening.id} readOnly={!canAddRemark} />
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
                <AttachmentPanel sourceType="screening" sourceId={selectedScreening.id} readOnly={!canAddAttachment} />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400">
                  操作人: {selectedScreening.operatorName || '-'} ·
                  最后更新: {format(new Date(selectedScreening.updatedAt), 'MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {hallModalOpen && selectedScreening && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">临时换厅</h3>
            <p className="text-sm text-gray-500 mb-4">
              当前场次: {selectedScreening.movieName} ({selectedScreening.currentHall})
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">更换至</label>
                <select value={newHall} onChange={(e) => setNewHall(e.target.value)} className="input">
                  <option value="">选择影厅...</option>
                  {halls.filter((h) => h !== selectedScreening.currentHall).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">换厅原因</label>
                <textarea
                  value={hallReason}
                  onChange={(e) => setHallReason(e.target.value)}
                  placeholder="请输入换厅原因，将记录到备注中并同步到对账追溯"
                  className="input min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setHallModalOpen(false)} className="btn-secondary flex-1">
                取消
              </button>
              <button
                onClick={handleChangeHall}
                disabled={!newHall || !hallReason}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                确认换厅
              </button>
            </div>
          </div>
        </div>
      )}

      {equipmentModalOpen && selectedScreening && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">记录设备故障</h3>
            <p className="text-sm text-gray-500 mb-4">
              场次: {selectedScreening.movieName} ({selectedScreening.currentHall})
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">故障描述</label>
              <textarea
                value={equipmentDesc}
                onChange={(e) => setEquipmentDesc(e.target.value)}
                placeholder="请详细描述故障情况，将自动创建异常记录并关联到本场次"
                className="input min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEquipmentModalOpen(false)} className="btn-secondary flex-1">
                取消
              </button>
              <button
                onClick={handleEquipmentFailure}
                disabled={!equipmentDesc}
                className="btn-danger flex-1 disabled:opacity-50"
              >
                确认记录
              </button>
            </div>
          </div>
        </div>
      )}

      {refundModalOpen && selectedScreening && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">处理退票</h3>
            <p className="text-sm text-gray-500 mb-4">
              场次: {selectedScreening.movieName} · 当前已退票: {selectedScreening.refundCount} 张
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退票数量</label>
                <input
                  type="number"
                  min="1"
                  value={refundCount}
                  onChange={(e) => setRefundCount(parseInt(e.target.value) || 1)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退票原因</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="请输入退票原因，将记录到备注中"
                  className="input min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRefundModalOpen(false)} className="btn-secondary flex-1">
                取消
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                确认退票
              </button>
            </div>
          </div>
        </div>
      )}

      {redeemModalOpen && selectedScreening && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">团体票核销</h3>
            <p className="text-sm text-gray-500 mb-4">
              场次: {selectedScreening.movieName} · 待核销: {selectedScreening.groupTickets - selectedScreening.groupRedeemed} 张
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">核销数量</label>
              <input
                type="number"
                min="1"
                max={selectedScreening.groupTickets - selectedScreening.groupRedeemed}
                value={redeemCount}
                onChange={(e) => setRedeemCount(parseInt(e.target.value) || 1)}
                className="input"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRedeemModalOpen(false)} className="btn-secondary flex-1">
                取消
              </button>
              <button onClick={handleRedeem} className="btn-primary flex-1">
                确认核销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
