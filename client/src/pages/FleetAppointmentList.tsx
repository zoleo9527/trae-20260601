import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import type { FleetAppointment, FleetAppointmentListParams } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { Clock, Calendar, MapPin, AlertTriangle, Search, RotateCcw } from 'lucide-react'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type TabKey = 'today' | 'all' | 'exception'

export default function FleetAppointmentList() {
  const [appointments, setAppointments] = useState<FleetAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('today')
  const [searchDate, setSearchDate] = useState(todayStr())
  const [searchStatus, setSearchStatus] = useState('')
  const [searchTruckCompany, setSearchTruckCompany] = useState('')

  const fetchList = useCallback(async (params?: FleetAppointmentListParams) => {
    setLoading(true)
    try {
      const data = await api.fleetAppointments.list(params)
      setAppointments(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'today') {
      fetchList({ appointment_date: todayStr() })
    } else if (activeTab === 'exception') {
      fetchList({ status: '异常' })
    } else {
      fetchList()
    }
  }, [activeTab, fetchList])

  const handleSearch = () => {
    const params: FleetAppointmentListParams = {}
    if (searchDate) params.appointment_date = searchDate
    if (searchStatus) params.status = searchStatus
    if (searchTruckCompany) params.truck_company = searchTruckCompany
    setActiveTab('all')
    fetchList(params)
  }

  const handleReset = () => {
    setSearchDate(todayStr())
    setSearchStatus('')
    setSearchTruckCompany('')
    setActiveTab('today')
    fetchList({ appointment_date: todayStr() })
  }

  const handleQuickAction = async (id: number, action: 'confirm' | 'arrive') => {
    if (action === 'confirm') {
      await api.fleetAppointments.confirm(id, { operator: '操作员' })
    } else {
      await api.fleetAppointments.arrive(id, { operator: '操作员' })
    }
    if (activeTab === 'today') {
      fetchList({ appointment_date: todayStr() })
    } else if (activeTab === 'exception') {
      fetchList({ status: '异常' })
    } else {
      const params: FleetAppointmentListParams = {}
      if (searchDate) params.appointment_date = searchDate
      if (searchStatus) params.status = searchStatus
      if (searchTruckCompany) params.truck_company = searchTruckCompany
      fetchList(params)
    }
  }

  const stats = {
    pending: appointments.filter(a => a.status === '待确认').length,
    today: appointments.filter(a => a.appointment_date === todayStr()).length,
    arrived: appointments.filter(a => a.status === '已到场').length,
    exception: appointments.filter(a => a.status === '异常').length,
  }

  const completedRecent = appointments
    .filter(a => a.status === '已完成')
    .slice(0, 5)

  const tabItems: { key: TabKey; label: string }[] = [
    { key: 'today', label: '今日预约' },
    { key: 'all', label: '全部记录' },
    { key: 'exception', label: '异常记录' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg"><Clock size={20} className="text-yellow-600" /></div>
          <div><p className="text-sm text-yellow-700">待确认</p><p className="text-2xl font-bold text-yellow-800">{stats.pending}</p></div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Calendar size={20} className="text-blue-600" /></div>
          <div><p className="text-sm text-blue-700">今日预约</p><p className="text-2xl font-bold text-blue-800">{stats.today}</p></div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><MapPin size={20} className="text-purple-600" /></div>
          <div><p className="text-sm text-purple-700">已到场</p><p className="text-2xl font-bold text-purple-800">{stats.arrived}</p></div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle size={20} className="text-red-600" /></div>
          <div><p className="text-sm text-red-700">异常</p><p className="text-2xl font-bold text-red-800">{stats.exception}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">预约日期</label>
            <input
              type="date"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">状态</label>
            <select
              value={searchStatus}
              onChange={e => setSearchStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部</option>
              <option value="待确认">待确认</option>
              <option value="已确认">已确认</option>
              <option value="已到场">已到场</option>
              <option value="已完成">已完成</option>
              <option value="已取消">已取消</option>
              <option value="异常">异常</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">车队搜索</label>
            <input
              type="text"
              value={searchTruckCompany}
              onChange={e => setSearchTruckCompany(e.target.value)}
              placeholder="输入车队名称"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Search size={16} /> 搜索
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            <RotateCcw size={16} /> 重置
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabItems.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <p className="text-gray-400 p-8 text-center">加载中...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">箱号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">车队</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">车牌号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">司机/电话</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">预约日期/时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map(a => (
                  <tr key={a.id} className={`hover:bg-gray-50 ${a.status === '异常' ? 'border-l-4 border-l-red-500' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-900">{a.container?.container_no || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.truck_company || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.truck_plate || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {a.driver_name || '-'}{a.driver_phone ? ` / ${a.driver_phone}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {a.appointment_date || '-'}{a.appointment_time ? ` ${a.appointment_time}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {a.gate_release_id ? `闸口#${a.gate_release_id}` : '独立预约'}
                    </td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px] truncate" title={a.notes || ''}>
                      {a.notes ? (a.notes.length > 12 ? a.notes.slice(0, 12) + '…' : a.notes) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {a.status === '待确认' && (
                          <button
                            onClick={() => handleQuickAction(a.id, 'confirm')}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                          >
                            确认
                          </button>
                        )}
                        {a.status === '已确认' && (
                          <button
                            onClick={() => handleQuickAction(a.id, 'arrive')}
                            className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
                          >
                            到场
                          </button>
                        )}
                        <Link to={`/fleet-appointments/${a.id}`} className="text-blue-600 hover:underline text-xs">查看</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {completedRecent.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">最近完成</h3>
          <div className="space-y-3">
            {completedRecent.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900">{a.container?.container_no || '-'}</span>
                  <span className="text-sm text-gray-500">{a.truck_company || '-'}</span>
                  <span className="text-sm text-gray-500">{a.truck_plate || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{a.appointment_date}</span>
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
