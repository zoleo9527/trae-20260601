import { useEffect, useState } from 'react'
import { Plus, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'
import EquipmentIssueModal from '@/components/EquipmentIssueModal'
import EquipmentReturnModal from '@/components/EquipmentReturnModal'
import type { EquipmentIssuance } from '@/store/useStore'

const statusFilterOptions = [
  { value: '', label: '全部' },
  { value: 'unreturned', label: '未归还' },
  { value: 'returned', label: '已归还' },
]

export default function Equipment() {
  const { equipmentIssuances, loadingEquipment, fetchEquipmentIssuances, fetchBookings, bookings } = useStore()
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [returnTarget, setReturnTarget] = useState<EquipmentIssuance | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filterStatus) params.status = filterStatus
    if (filterMember) params.member = filterMember
    if (filterDateFrom) params.date_from = filterDateFrom
    if (filterDateTo) params.date_to = filterDateTo
    fetchEquipmentIssuances(params)
  }, [filterStatus, filterMember, filterDateFrom, filterDateTo, fetchEquipmentIssuances])

  const getEquipmentStatus = (e: EquipmentIssuance) =>
    e.returned_at ? 'returned' : 'unreturned'

  const returnedIssuances = equipmentIssuances.filter((e) => e.returned_at)
  const unreturnedIssuances = equipmentIssuances.filter((e) => !e.returned_at)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            placeholder="起始日期"
          />
          <span className="text-sm text-gray-400">至</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
          >
            {statusFilterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            placeholder="搜索会员姓名"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
          />
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center gap-2 bg-climbing-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          发放装备
        </button>
      </div>

      {loadingEquipment ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会员</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">装备类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">装备编号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">关联预约</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">出场状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">回场状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">异常</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">发放人</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">发放时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">归还时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {equipmentIssuances.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{e.member_name}</td>
                    <td className="px-4 py-3 text-sm">{e.equipment_type}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">{e.equipment_id}</td>
                    <td className="px-4 py-3 text-sm">
                      {e.booking_summary ? (
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium text-gray-700">{e.booking_summary.course_name}</div>
                          <div className="text-xs text-gray-400">{e.booking_summary.booking_date} {e.booking_summary.time_slot}</div>
                          <StatusBadge type="booking" status={e.booking_summary.status} />
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{e.condition_out}</td>
                    <td className="px-4 py-3 text-sm">
                      {e.returned_at ? <StatusBadge type="equipment" status="returned" /> : <StatusBadge type="equipment" status="unreturned" />}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {e.related_anomalies.length > 0 ? (
                        <div className="space-y-1">
                          {e.related_anomalies.map((a) => (
                            <div key={a.anomaly_id} className="flex items-center gap-1" title={`${a.source === 'booking' ? '预约级' : '装备级'}: ${a.description}`}>
                              <AlertTriangle className={`w-3 h-3 ${a.severity === 'high' ? 'text-warning-red' : a.severity === 'medium' ? 'text-climbing-orange' : 'text-info-blue'}`} />
                              <span className={`text-xs px-1 rounded ${a.source === 'booking' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                {a.source === 'booking' ? '预' : '装'}
                              </span>
                              <span className="text-xs text-gray-600 truncate max-w-[100px]">#{a.anomaly_id}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{e.issued_by}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{e.issued_at}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{e.returned_at ?? '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {e.returned_at ? (
                        <Check className="w-5 h-5 text-success-green" />
                      ) : (
                        <button
                          onClick={() => setReturnTarget(e)}
                          className="px-3 py-1 rounded text-xs font-medium bg-success-green hover:bg-green-600 text-white"
                        >
                          归还
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {equipmentIssuances.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-gray-400 text-sm">暂无装备发放记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-rock-gray hover:bg-gray-50 rounded-lg"
        >
          <span>发放回看（已归还 {returnedIssuances.length} 条 / 未归还 {unreturnedIssuances.length} 条）</span>
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showHistory && (
          <div className="px-6 pb-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">会员</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">装备</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">编号</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">关联预约</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">出场</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">回场</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">异常</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">发放人</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">发放时间</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">归还时间</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {equipmentIssuances.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs">{e.member_name}</td>
                      <td className="px-4 py-2 text-xs">{e.equipment_type}</td>
                      <td className="px-4 py-2 text-xs font-mono">{e.equipment_id}</td>
                      <td className="px-4 py-2 text-xs">
                        {e.booking_summary ? (
                          <span className="text-gray-600">{e.booking_summary.course_name}</span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2 text-xs">{e.condition_out}</td>
                      <td className="px-4 py-2 text-xs">{e.condition_in ?? '-'}</td>
                      <td className="px-4 py-2 text-xs">
                        {e.related_anomalies.length > 0 ? (
                          <div className="space-y-0.5">
                            {e.related_anomalies.map((a) => (
                              <div key={a.anomaly_id} className="flex items-center gap-1">
                                <AlertTriangle className={`w-3 h-3 ${a.severity === 'high' ? 'text-warning-red' : a.severity === 'medium' ? 'text-climbing-orange' : 'text-info-blue'}`} />
                                <span className={`text-[10px] px-0.5 rounded ${a.source === 'booking' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                  {a.source === 'booking' ? '预' : '装'}
                                </span>
                                <span className="text-gray-500">#{a.anomaly_id}</span>
                              </div>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2 text-xs">{e.issued_by}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{e.issued_at}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{e.returned_at ?? '-'}</td>
                      <td className="px-4 py-2 text-xs">
                        <StatusBadge type="equipment" status={getEquipmentStatus(e)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showIssueModal && <EquipmentIssueModal onClose={() => setShowIssueModal(false)} />}
      {returnTarget && <EquipmentReturnModal issuance={returnTarget} onClose={() => setReturnTarget(null)} />}
    </div>
  )
}
