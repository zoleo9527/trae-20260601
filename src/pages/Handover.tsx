import { useEffect, useState } from 'react'
import { Calendar, Package, AlertTriangle, Plus, X, ChevronDown, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'

export default function Handover() {
  const {
    bookings, equipmentIssuances, anomalies, shiftTodos, handoverSnapshots, snapshotDetails,
    loadingHandover, loadingSnapshotDetails, fetchBookings, fetchEquipmentIssuances, fetchAnomalies,
    fetchShiftTodos, fetchHandoverSnapshots, createHandoverSnapshot,
    addShiftTodo, completeShiftTodo, fetchSnapshotDetails, clearSnapshotDetails,
  } = useStore()

  const [showSnapshotModal, setShowSnapshotModal] = useState(false)
  const [snapshotForm, setSnapshotForm] = useState({ operator_out: '', operator_in: '', notes: '' })
  const [todoForm, setTodoForm] = useState({ content: '', priority: 'medium', created_by: '' })
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<number | null>(null)

  useEffect(() => {
    fetchBookings()
    fetchEquipmentIssuances()
    fetchAnomalies()
    fetchShiftTodos()
    fetchHandoverSnapshots()
  }, [fetchBookings, fetchEquipmentIssuances, fetchAnomalies, fetchShiftTodos, fetchHandoverSnapshots])

  const pendingBookings = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length
  const unreturnedEquipment = equipmentIssuances.filter((e) => !e.returned_at).length
  const openAnomalies = anomalies.filter((a) => a.status === 'open').length

  const handleCreateSnapshot = async () => {
    if (!snapshotForm.operator_out || !snapshotForm.operator_in) return
    await createHandoverSnapshot(snapshotForm)
    setShowSnapshotModal(false)
    setSnapshotForm({ operator_out: '', operator_in: '', notes: '' })
    fetchHandoverSnapshots()
  }

  const handleAddTodo = async () => {
    if (!todoForm.content || !todoForm.created_by) return
    await addShiftTodo({
      content: todoForm.content,
      priority: todoForm.priority as 'low' | 'medium' | 'high',
      created_by: todoForm.created_by,
    })
    setTodoForm({ content: '', priority: 'medium', created_by: '' })
    fetchShiftTodos()
  }

  const handleCompleteTodo = async (id: number) => {
    await completeShiftTodo(id, '值班员')
    fetchShiftTodos()
  }

  const handleToggleSnapshot = async (id: number) => {
    if (expandedSnapshotId === id) {
      setExpandedSnapshotId(null)
      clearSnapshotDetails()
      return
    }
    setExpandedSnapshotId(id)
    await fetchSnapshotDetails(id)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-rock-gray">当前班次</h3>
          <button
            onClick={() => setShowSnapshotModal(true)}
            className="flex items-center gap-2 bg-climbing-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            生成交班快照
          </button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-climbing-orange" />
              <div>
                <p className="text-sm text-gray-500">待处理预约</p>
                <p className="text-2xl font-bold text-rock-gray">{pendingBookings}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-info-blue" />
              <div>
                <p className="text-sm text-gray-500">待回收装备</p>
                <p className="text-2xl font-bold text-rock-gray">{unreturnedEquipment}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-warning-red" />
              <div>
                <p className="text-sm text-gray-500">未关闭异常</p>
                <p className="text-2xl font-bold text-rock-gray">{openAnomalies}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-rock-gray mb-4">交班待办</h3>
        <div className="space-y-2 mb-4">
          {shiftTodos.length === 0 ? (
            <p className="text-gray-400 text-sm py-2">暂无待办事项</p>
          ) : (
            shiftTodos.map((t) => (
              <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg ${t.status === 'done' ? 'bg-gray-50' : 'bg-white border border-gray-200'}`}>
                <input
                  type="checkbox"
                  checked={t.status === 'done'}
                  onChange={() => t.status === 'pending' && handleCompleteTodo(t.id)}
                  className="w-4 h-4 text-climbing-orange rounded focus:ring-climbing-orange"
                />
                <span className={`text-sm flex-1 ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {t.content}
                </span>
                <StatusBadge type="severity" status={t.priority} />
                {t.status === 'done' && t.completed_by && (
                  <span className="text-xs text-gray-400">{t.completed_by}</span>
                )}
              </div>
            ))
          )}
        </div>
        <div className="flex items-end gap-3 border-t border-gray-100 pt-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">待办内容</label>
            <input
              value={todoForm.content}
              onChange={(e) => setTodoForm({ ...todoForm, content: e.target.value })}
              placeholder="输入待办事项"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">优先级</label>
            <select
              value={todoForm.priority}
              onChange={(e) => setTodoForm({ ...todoForm, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">添加人</label>
            <input
              value={todoForm.created_by}
              onChange={(e) => setTodoForm({ ...todoForm, created_by: e.target.value })}
              placeholder="姓名"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            />
          </div>
          <button
            onClick={handleAddTodo}
            className="px-4 py-2 text-sm text-white bg-climbing-orange rounded-lg hover:bg-orange-600 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-rock-gray mb-4">历史交班记录</h3>
        {loadingHandover ? (
          <div className="text-center py-6 text-gray-500">加载中...</div>
        ) : handoverSnapshots.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">暂无历史交班记录</p>
        ) : (
          <div className="space-y-3">
            {handoverSnapshots.map((s) => (
              <div key={s.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleToggleSnapshot(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  {expandedSnapshotId === s.id ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span className="text-sm text-gray-700 w-36 shrink-0">{s.created_at}</span>
                  <span className="text-sm">{s.operator_out} → {s.operator_in}</span>
                  <span className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.pending_bookings} 预约</span>
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" />{s.unreturned_equipment} 装备</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{s.open_anomalies} 异常</span>
                  </span>
                </button>

                {expandedSnapshotId === s.id && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/50">
                    {loadingSnapshotDetails ? (
                      <div className="text-center py-4 text-gray-400 text-sm">加载明细...</div>
                    ) : snapshotDetails && snapshotDetails.snapshot.id === s.id ? (
                      <div className="space-y-4">
                        {s.notes && (
                          <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                            备注：{s.notes}
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-climbing-orange" />
                            未完成预约（{snapshotDetails.bookings.length}）
                          </h4>
                          {snapshotDetails.bookings.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 text-xs">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">会员</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">课程</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">日期</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">时段</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">状态</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {snapshotDetails.bookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-white">
                                      <td className="px-3 py-2">{b.member_name}</td>
                                      <td className="px-3 py-2">{b.course_name}</td>
                                      <td className="px-3 py-2">{b.booking_date}</td>
                                      <td className="px-3 py-2">{b.time_slot}</td>
                                      <td className="px-3 py-2"><StatusBadge type="booking" status={b.status} /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 py-2">无待处理预约</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Package className="w-4 h-4 text-info-blue" />
                            未归还装备（{snapshotDetails.equipment.length}）
                          </h4>
                          {snapshotDetails.equipment.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 text-xs">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">会员</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">装备类型</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">编号</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">关联预约</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">出场状态</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">发放人</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">异常</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {snapshotDetails.equipment.map((e) => (
                                    <tr key={e.id} className="hover:bg-white">
                                      <td className="px-3 py-2">{e.member_name}</td>
                                      <td className="px-3 py-2">{e.equipment_type}</td>
                                      <td className="px-3 py-2 font-mono">{e.equipment_id}</td>
                                      <td className="px-3 py-2">
                                        {e.booking_id && e.booking_course_name ? (
                                          <div>
                                            <div className="text-gray-700">{e.booking_course_name}</div>
                                            <div className="text-gray-400">{e.booking_date} {e.booking_time_slot}</div>
                                            {e.booking_status && <StatusBadge type="booking" status={e.booking_status} />}
                                          </div>
                                        ) : (
                                          <span className="text-gray-300">-</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2">{e.condition_out}</td>
                                      <td className="px-3 py-2">{e.issued_by}</td>
                                      <td className="px-3 py-2">
                                        {e.related_anomalies && e.related_anomalies.length > 0 ? (
                                          <div className="space-y-1">
                                            {e.related_anomalies.map((a) => (
                                              <div key={a.anomaly_id} className="flex items-center gap-1" title={`${a.source === 'booking' ? '预约级' : '装备级'}: ${a.description}`}>
                                                <AlertTriangle className={`w-3 h-3 ${a.severity === 'high' ? 'text-warning-red' : a.severity === 'medium' ? 'text-climbing-orange' : 'text-info-blue'}`} />
                                                <span className={`text-xs px-1 rounded ${a.source === 'booking' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                                  {a.source === 'booking' ? '预' : '装'}
                                                </span>
                                                <span className="text-xs text-gray-600 truncate max-w-[100px]">{a.description}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-gray-300">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 py-2">无未归还装备</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-warning-red" />
                            未关闭异常（{snapshotDetails.anomalies.length}）
                          </h4>
                          {snapshotDetails.anomalies.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 text-xs">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">描述</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">严重度</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">报告人</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">报告时间</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {snapshotDetails.anomalies.map((a) => (
                                    <tr key={a.id} className="hover:bg-white">
                                      <td className="px-3 py-2">{a.description}</td>
                                      <td className="px-3 py-2"><StatusBadge type="severity" status={a.severity} /></td>
                                      <td className="px-3 py-2">{a.reported_by}</td>
                                      <td className="px-3 py-2 text-gray-400">{a.created_at}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 py-2">无未关闭异常</p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSnapshotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-rock-gray">生成交班快照</h3>
              <button onClick={() => setShowSnapshotModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交班人</label>
                <input
                  value={snapshotForm.operator_out}
                  onChange={(e) => setSnapshotForm({ ...snapshotForm, operator_out: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">接班人</label>
                <input
                  value={snapshotForm.operator_in}
                  onChange={(e) => setSnapshotForm({ ...snapshotForm, operator_in: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={snapshotForm.notes}
                  onChange={(e) => setSnapshotForm({ ...snapshotForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowSnapshotModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={handleCreateSnapshot} className="px-4 py-2 text-sm text-white bg-climbing-orange rounded-lg hover:bg-orange-600">生成快照</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
