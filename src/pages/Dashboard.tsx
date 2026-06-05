import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'

export default function Dashboard() {
  const { dashboard, loadingDashboard, fetchDashboard, fetchBookings, fetchEquipmentIssuances, fetchAnomalies, fetchShiftTodos } = useStore()

  useEffect(() => {
    fetchDashboard()
    fetchBookings()
    fetchEquipmentIssuances()
    fetchAnomalies()
    fetchShiftTodos()
  }, [fetchDashboard, fetchBookings, fetchEquipmentIssuances, fetchAnomalies, fetchShiftTodos])

  if (loadingDashboard && !dashboard) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  const d = dashboard

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <Link to="/bookings" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-climbing-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理预约</p>
              <p className="text-3xl font-bold text-rock-gray mt-1">{d?.pending_bookings ?? 0}</p>
            </div>
            <Calendar className="w-10 h-10 text-climbing-orange opacity-60" />
          </div>
        </Link>

        <Link to="/equipment" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-info-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待回收装备</p>
              <p className="text-3xl font-bold text-rock-gray mt-1">{d?.unreturned_equipment ?? 0}</p>
            </div>
            <Package className="w-10 h-10 text-info-blue opacity-60" />
          </div>
        </Link>

        <Link to="/anomalies" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-warning-red">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">未关闭异常</p>
              <p className="text-3xl font-bold text-rock-gray mt-1">{d?.open_anomalies ?? 0}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-warning-red opacity-60" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-rock-gray">异常提醒</h3>
            <Link to="/anomalies" className="text-sm text-climbing-orange hover:underline">查看全部</Link>
          </div>
          {(d?.open_anomaly_list?.length ?? 0) === 0 ? (
            <p className="text-gray-400 text-sm py-4">暂无未关闭异常</p>
          ) : (
            <ul className="space-y-3">
              {d?.open_anomaly_list?.map((a) => (
                <li key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <StatusBadge type="severity" status={a.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{a.reported_by} · {a.created_at}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-rock-gray">当班待办</h3>
            <Link to="/handover" className="text-sm text-climbing-orange hover:underline">查看全部</Link>
          </div>
          {(d?.pending_todo_list?.length ?? 0) === 0 ? (
            <p className="text-gray-400 text-sm py-4">暂无待办事项</p>
          ) : (
            <ul className="space-y-3">
              {d?.pending_todo_list?.map((t) => (
                <li key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <StatusBadge type="severity" status={t.priority} />
                  <span className="text-sm text-gray-700">{t.content}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-rock-gray mb-4">最近完成</h3>
        {(d?.recent_completed?.length ?? 0) === 0 ? (
          <p className="text-gray-400 text-sm py-4">暂无最近完成记录</p>
        ) : (
          <ul className="space-y-2">
            {d?.recent_completed?.map((item: any, i: number) => {
              const isBooking = item._type === 'booking'
              return (
                <li key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <CheckCircle className="w-4 h-4 text-success-green shrink-0" />
                  <span className="text-sm text-gray-700">
                    {isBooking
                      ? `${item.member_name} - ${item.course_name} 已完成`
                      : `${item.member_name} - ${item.equipment_type} 已归还`}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
