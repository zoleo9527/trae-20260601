import React, { useMemo, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../store/useAppStore'
import {
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  MACHINE_STATUS_LABELS, MACHINE_STATUS_COLORS,
  URGENCY_LABELS, URGENCY_COLORS,
  MachineStatus, ScheduleStatus, Order,
  WORKSPACE_VIEWS
} from '../types'

export const ProductionView: React.FC = () => {
  const {
    orders, machines, schedules, workspace, selectedOrder, setSelectedOrder,
    loadSchedules, createSchedule, updateSchedule, updateMachineStatus,
    loadMachines, currentUser, saveWorkspace
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'dashboard' | 'machines' | 'schedule'>('dashboard')

  useEffect(() => {
    const view = workspace?.current_view
    if (view === WORKSPACE_VIEWS.PRODUCTION_MACHINES) setActiveTab('machines')
    else if (view === WORKSPACE_VIEWS.PRODUCTION_NEW_SCHEDULE) setActiveTab('schedule')
    else setActiveTab('dashboard')
  }, [workspace?.current_view])
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [schedulingOrder, setSchedulingOrder] = useState<Order | null>(null)

  const [newSchedule, setNewSchedule] = useState({
    machine_id: 0,
    start_time: '',
    end_time: '',
    priority: 0,
    notes: ''
  })

  const handleDateChange = async (date: string) => {
    setSelectedDate(date)
    await loadSchedules(date)
  }

  const pendingScheduleOrders = useMemo(() => {
    return orders.filter(o => 
      o.status === 'pending_schedule' || o.status === 'proof_approved'
    )
  }, [orders])

  const stats = useMemo(() => {
    const todaySchedules = schedules.filter(s => 
      dayjs(s.start_time).isSame(selectedDate, 'day')
    )
    return {
      pending: pendingScheduleOrders.length,
      scheduled: todaySchedules.filter(s => s.status === 'scheduled').length,
      in_progress: todaySchedules.filter(s => s.status === 'in_progress').length,
      completed: todaySchedules.filter(s => s.status === 'completed').length,
      total: todaySchedules.length
    }
  }, [schedules, selectedDate, pendingScheduleOrders])

  const schedulesByMachine = useMemo(() => {
    const grouped: Record<number, typeof schedules> = {}
    machines.forEach(m => { grouped[m.id] = [] })
    schedules
      .filter(s => dayjs(s.start_time).isSame(selectedDate, 'day'))
      .forEach(s => {
        if (grouped[s.machine_id]) {
          grouped[s.machine_id].push(s)
        }
      })
    Object.values(grouped).forEach(arr => 
      arr.sort((a, b) => {
        const pa = (a.priority || 0) - (b.priority || 0)
        if (pa !== 0) return pa
        return dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
      })
    )
    return grouped
  }, [schedules, selectedDate, machines])

  const handleCreateSchedule = async () => {
    if (!currentUser || !schedulingOrder || newSchedule.machine_id === 0) {
      alert('请选择机台和时间')
      return
    }

    const success = await createSchedule({
      order_id: schedulingOrder.id,
      machine_id: newSchedule.machine_id,
      start_time: newSchedule.start_time,
      end_time: newSchedule.end_time,
      status: 'scheduled',
      priority: newSchedule.priority,
      notes: newSchedule.notes,
      created_by: currentUser.id
    })

    if (success) {
      setShowScheduleModal(false)
      setSchedulingOrder(null)
      setNewSchedule({
        machine_id: 0,
        start_time: '',
        end_time: '',
        priority: 0,
        notes: ''
      })
    }
  }

  const handleScheduleStatus = async (scheduleId: number, status: ScheduleStatus) => {
    const updates: Partial<any> = { status }
    if (status === 'in_progress') {
      updates.actual_start = dayjs().format('YYYY-MM-DD HH:mm:ss')
    } else if (status === 'completed') {
      updates.actual_end = dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    await updateSchedule(scheduleId, updates)
  }

  const handleMachineStatus = async (id: number, status: MachineStatus) => {
    const note = status === 'maintenance' ? prompt('请输入维修/保养说明：') ?? undefined : undefined
    await updateMachineStatus(id, status, note)
  }

  const getTimeBlockWidth = (start: string, end: string) => {
    const startMin = dayjs(start).hour() * 60 + dayjs(start).minute()
    const endMin = dayjs(end).hour() * 60 + dayjs(end).minute()
    const totalMin = 24 * 60
    return ((endMin - startMin) / totalMin) * 100
  }

  const getTimeBlockLeft = (start: string) => {
    const startMin = dayjs(start).hour() * 60 + dayjs(start).minute()
    const totalMin = 24 * 60
    return (startMin / totalMin) * 100
  }

  if (activeTab === 'machines') {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-factory-text">🖨️ 机台状态</h2>
          <button onClick={loadMachines} className="factory-btn text-xs">
            🔄 刷新
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {machines.map(machine => (
            <div key={machine.id} className="factory-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-base font-bold text-factory-text">
                    {machine.name}
                  </div>
                  <div className="text-xs text-factory-muted">
                    {machine.model} · {machine.type}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${MACHINE_STATUS_COLORS[machine.status]}`}>
                  {MACHINE_STATUS_LABELS[machine.status]}
                </span>
              </div>

              {machine.status_note && (
                <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded mb-3">
                  ⚠️ {machine.status_note}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="text-factory-muted">最高速度：</span>
                  <span className="text-factory-text font-mono">{machine.max_speed?.toLocaleString()} 张/时</span>
                </div>
                {machine.next_maintenance && (
                  <div>
                    <span className="text-factory-muted">下次保养：</span>
                    <span className={`font-mono ${
                      dayjs(machine.next_maintenance).isBefore(dayjs(), 'day')
                        ? 'text-red-400' : 'text-factory-text'
                    }`}>
                      {dayjs(machine.next_maintenance).format('MM-DD')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => handleMachineStatus(machine.id, 'idle')}
                  className={`px-2 py-1 text-xs rounded ${
                    machine.status === 'idle' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-factory-border text-factory-muted hover:bg-green-600/30 hover:text-green-400'
                  }`}
                >
                  空闲
                </button>
                <button
                  onClick={() => handleMachineStatus(machine.id, 'running')}
                  className={`px-2 py-1 text-xs rounded ${
                    machine.status === 'running' 
                      ? 'bg-factory-accent text-white' 
                      : 'bg-factory-border text-factory-muted hover:bg-factory-accent/30 hover:text-factory-accent'
                  }`}
                >
                  运行中
                </button>
                <button
                  onClick={() => handleMachineStatus(machine.id, 'maintenance')}
                  className={`px-2 py-1 text-xs rounded ${
                    machine.status === 'maintenance' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-factory-border text-factory-muted hover:bg-yellow-600/30 hover:text-yellow-400'
                  }`}
                >
                  维修中
                </button>
                <button
                  onClick={() => handleMachineStatus(machine.id, 'offline')}
                  className={`px-2 py-1 text-xs rounded ${
                    machine.status === 'offline' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-factory-border text-factory-muted hover:bg-gray-600/30 hover:text-gray-400'
                  }`}
                >
                  离线
                </button>
              </div>

              {schedulesByMachine[machine.id]?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-factory-border">
                  <div className="text-xs text-factory-muted mb-2">今日排产</div>
                  <div className="space-y-1">
                    {schedulesByMachine[machine.id].slice(0, 3).map(s => (
                      <div key={s.id} className="text-xs flex justify-between items-center bg-factory-bg p-1.5 rounded">
                        <span className="font-mono text-factory-accent">{s.order_no}</span>
                        <span className="text-factory-muted">
                          {dayjs(s.start_time).format('HH:mm')}-{dayjs(s.end_time).format('HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activeTab === 'schedule' || showScheduleModal) {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-factory-text">📅 新建排产</h2>
          <button 
            onClick={() => { setShowScheduleModal(false); setActiveTab('dashboard'); saveWorkspace({ current_view: WORKSPACE_VIEWS.PRODUCTION_DASHBOARD }) }} 
            className="factory-btn text-xs"
          >
            返回
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
          <div className="factory-panel overflow-hidden flex flex-col">
            <div className="p-3 border-b border-factory-border text-xs font-medium text-factory-muted">
              待排产订单 ({pendingScheduleOrders.length})
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {pendingScheduleOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSchedulingOrder(order)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    schedulingOrder?.id === order.id
                      ? 'border-factory-accent bg-factory-accent/10'
                      : 'border-factory-border hover:border-factory-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono text-sm font-bold text-factory-accent">{order.order_no}</span>
                    <span className={`urgency-badge ${URGENCY_COLORS[order.urgency]}`}>
                      {URGENCY_LABELS[order.urgency]}
                    </span>
                  </div>
                  <div className="text-sm text-factory-text mb-1">{order.product_name}</div>
                  <div className="text-xs text-factory-muted">{order.customer_name}</div>
                  <div className="text-xs text-factory-muted mt-1">
                    {order.quantity.toLocaleString()}份 · {order.paper_type}{order.paper_gsm}g
                  </div>
                  <div className="text-xs text-factory-muted font-mono mt-1">
                    交货: {dayjs(order.deadline).format('MM-DD')}
                  </div>
                </div>
              ))}
              {pendingScheduleOrders.length === 0 && (
                <div className="p-8 text-center text-factory-muted text-sm">
                  🎉 没有待排产的订单
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2 factory-panel overflow-hidden flex flex-col">
            {schedulingOrder ? (
              <>
                <div className="p-3 border-b border-factory-border">
                  <div className="text-xs text-factory-muted mb-2">排产设置</div>
                  <div className="font-mono text-lg font-bold text-factory-accent mb-1">
                    {schedulingOrder.order_no}
                  </div>
                  <div className="text-sm text-factory-text">{schedulingOrder.product_name}</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="factory-card">
                      <label className="factory-label">机台 *</label>
                      <select
                        value={newSchedule.machine_id}
                        onChange={e => setNewSchedule({ ...newSchedule, machine_id: parseInt(e.target.value) })}
                        className="factory-input"
                      >
                        <option value={0}>-- 选择机台 --</option>
                        {machines.filter(m => m.status !== 'maintenance' && m.status !== 'offline').map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({MACHINE_STATUS_LABELS[m.status]})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="factory-card">
                      <label className="factory-label">优先级</label>
                      <select
                        value={newSchedule.priority}
                        onChange={e => setNewSchedule({ ...newSchedule, priority: parseInt(e.target.value) })}
                        className="factory-input"
                      >
                        <option value={0}>普通 (0)</option>
                        <option value={50}>优先 (50)</option>
                        <option value={100}>紧急插单 (100)</option>
                        <option value={200}>特急 (200)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="factory-card">
                      <label className="factory-label">开始时间 *</label>
                      <input
                        type="datetime-local"
                        value={newSchedule.start_time}
                        onChange={e => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                        className="factory-input"
                      />
                    </div>
                    <div className="factory-card">
                      <label className="factory-label">结束时间 *</label>
                      <input
                        type="datetime-local"
                        value={newSchedule.end_time}
                        onChange={e => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                        className="factory-input"
                      />
                    </div>
                  </div>

                  <div className="factory-card">
                    <label className="factory-label">备注</label>
                    <textarea
                      value={newSchedule.notes}
                      onChange={e => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                      className="factory-input"
                      rows={3}
                      placeholder="排产注意事项..."
                    />
                  </div>

                  <div className="factory-card bg-factory-bg">
                    <div className="text-xs text-factory-muted mb-2">订单预览</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-factory-muted">客户：</span>
                        <span className="text-factory-text">{schedulingOrder.customer_name}</span>
                      </div>
                      <div>
                        <span className="text-factory-muted">数量：</span>
                        <span className="text-factory-text font-mono">{schedulingOrder.quantity.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-factory-muted">尺寸：</span>
                        <span className="text-factory-text font-mono">{schedulingOrder.size}</span>
                      </div>
                      <div>
                        <span className="text-factory-muted">颜色：</span>
                        <span className="text-factory-text">{schedulingOrder.color}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-factory-muted">纸张：</span>
                        <span className="text-factory-text">{schedulingOrder.paper_type} {schedulingOrder.paper_gsm}g</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-factory-muted">后加工：</span>
                        <span className="text-factory-text">{schedulingOrder.finish || '无'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-factory-border flex justify-end gap-2">
                  <button 
                    onClick={() => setSchedulingOrder(null)}
                    className="factory-btn text-xs"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleCreateSchedule}
                    className="factory-btn-primary text-xs"
                  >
                    💾 保存排产
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-factory-muted">
                <div className="text-center">
                  <div className="text-4xl mb-4">📅</div>
                  <div className="text-sm">从左侧选择订单开始排产</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-factory-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-factory-text">⚙️ 排产总览</h2>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                className="factory-input text-xs w-auto"
              />
            </div>
            <div className="text-xs text-factory-muted">
              共 {stats.total} 个排产任务
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setActiveTab('machines'); saveWorkspace({ current_view: WORKSPACE_VIEWS.PRODUCTION_MACHINES }) }}
              className="factory-btn text-xs"
            >
              🖨️ 机台状态
            </button>
            <button 
              onClick={() => { setActiveTab('schedule'); setShowScheduleModal(true); saveWorkspace({ current_view: WORKSPACE_VIEWS.PRODUCTION_NEW_SCHEDULE }) }}
              className="factory-btn-primary text-xs"
            >
              + 新建排产
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="factory-card bg-amber-500/5 border-amber-500/30">
            <div className="text-xs text-amber-400">待排产</div>
            <div className="text-xl font-bold text-amber-400 font-mono">{stats.pending}</div>
          </div>
          <div className="factory-card bg-cyan-500/5 border-cyan-500/30">
            <div className="text-xs text-cyan-400">已排产</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">{stats.scheduled}</div>
          </div>
          <div className="factory-card bg-factory-accent/5 border-factory-accent/30">
            <div className="text-xs text-factory-accent">生产中</div>
            <div className="text-xl font-bold text-factory-accent font-mono">{stats.in_progress}</div>
          </div>
          <div className="factory-card bg-green-500/5 border-green-500/30">
            <div className="text-xs text-green-400">今日完成</div>
            <div className="text-xl font-bold text-green-400 font-mono">{stats.completed}</div>
          </div>
          <div className="factory-card bg-purple-500/5 border-purple-500/30">
            <div className="text-xs text-purple-400">机台总数</div>
            <div className="text-xl font-bold text-purple-400 font-mono">{machines.length}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[300px] border-r border-factory-border overflow-y-auto p-3 space-y-2">
          <div className="text-xs text-factory-muted mb-2">待排产订单</div>
          {pendingScheduleOrders.map(order => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`factory-card cursor-pointer hover:border-factory-accent transition-all ${
                selectedOrder?.id === order.id ? 'border-factory-accent' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="font-mono text-xs font-bold text-factory-accent">{order.order_no}</span>
                <span className={`urgency-badge text-[10px] ${URGENCY_COLORS[order.urgency]}`}>
                  {URGENCY_LABELS[order.urgency]}
                </span>
              </div>
              <div className="text-xs text-factory-text truncate">{order.product_name}</div>
              <div className="text-xs text-factory-muted truncate">{order.customer_name}</div>
              <div className="text-xs text-factory-muted mt-1 font-mono">
                {order.quantity.toLocaleString()}份 · {dayjs(order.deadline).format('MM-DD')}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSchedulingOrder(order)
                  setShowScheduleModal(true)
                  setActiveTab('schedule')
                  saveWorkspace({ current_view: WORKSPACE_VIEWS.PRODUCTION_NEW_SCHEDULE })
                }}
                className="factory-btn-primary text-xs w-full mt-2 py-0.5"
              >
                📅 安排生产
              </button>
            </div>
          ))}
          {pendingScheduleOrders.length === 0 && (
            <div className="p-4 text-center text-factory-muted text-xs">
              🎉 全部已排产
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="h-8 flex items-center bg-factory-panel border-b border-factory-border">
            <div className="w-40 px-3 text-xs font-medium text-factory-muted border-r border-factory-border flex-shrink-0">
              机台
            </div>
            <div className="flex-1 relative h-full">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-factory-border/50 text-[10px] text-factory-muted pl-1"
                  style={{ left: `${(i / 24) * 100}%`, width: `${(1 / 24) * 100}%` }}
                >
                  {String(i).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {machines.map(machine => (
              <div key={machine.id} className="flex border-b border-factory-border/50 min-h-[60px]">
                <div className="w-40 px-3 py-2 border-r border-factory-border flex-shrink-0 bg-factory-panel/50">
                  <div className="text-xs font-medium text-factory-text">{machine.name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`w-2 h-2 rounded-full ${
                      machine.status === 'running' ? 'bg-factory-accent' :
                      machine.status === 'idle' ? 'bg-green-500' :
                      machine.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-[10px] text-factory-muted">
                      {MACHINE_STATUS_LABELS[machine.status]}
                    </span>
                  </div>
                  {machine.status_note && (
                    <div className="text-[10px] text-yellow-400 mt-1 truncate">
                      {machine.status_note}
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  {schedulesByMachine[machine.id]?.map(schedule => {
                    const width = getTimeBlockWidth(schedule.start_time, schedule.end_time)
                    const left = getTimeBlockLeft(schedule.start_time)
                    const isUrgent = schedule.urgency !== 'normal'
                    
                    return (
                      <div
                        key={schedule.id}
                        className={`absolute top-1 bottom-1 rounded px-2 py-1 text-xs overflow-hidden cursor-pointer transition-all hover:z-10 hover:scale-[1.02] ${
                          schedule.status === 'in_progress' 
                            ? 'bg-factory-accent text-white' 
                            : schedule.status === 'completed'
                            ? 'bg-green-600/80 text-white'
                            : isUrgent
                            ? 'bg-red-500/80 text-white'
                            : 'bg-cyan-600/70 text-white'
                        }`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <div className="font-mono text-[10px] font-bold truncate">
                          {schedule.order_no}
                        </div>
                        <div className="text-[10px] truncate opacity-90">
                          {schedule.customer_name}
                        </div>
                        {schedule.priority > 0 && (
                          <div className="text-[10px] opacity-80">
                            ⚡ P{schedule.priority}
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          {schedule.status === 'scheduled' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleScheduleStatus(schedule.id, 'in_progress')
                              }}
                              className="factory-btn-primary text-[10px] px-2 py-0.5"
                            >
                              开始生产
                            </button>
                          )}
                          {schedule.status === 'in_progress' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleScheduleStatus(schedule.id, 'completed')
                              }}
                              className="factory-btn-success text-[10px] px-2 py-0.5"
                            >
                              完成
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="factory-card w-[900px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-factory-border flex items-center justify-between">
              <h3 className="text-base font-bold text-factory-text">📅 新建排产</h3>
              <button onClick={() => setShowScheduleModal(false)} className="factory-btn text-xs">
                关闭
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProductionView />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
