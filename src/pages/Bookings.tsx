import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'
import type { Booking } from '@/store/useStore'

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const statusTransitions: Record<string, { label: string; next: string; btnClass: string }[]> = {
  pending: [{ label: '确认', next: 'confirmed', btnClass: 'bg-blue-500 hover:bg-blue-600 text-white' }],
  confirmed: [{ label: '开始', next: 'in_progress', btnClass: 'bg-climbing-orange hover:bg-orange-600 text-white' }],
  in_progress: [{ label: '完成', next: 'completed', btnClass: 'bg-success-green hover:bg-green-600 text-white' }],
  cancelled: [],
  completed: [],
}

export default function Bookings() {
  const { bookings, loadingBookings, courses, belayers, fetchBookings, createBooking, updateBookingStatus, fetchCourses, fetchBelayers } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterId, setFilterId] = useState(() => searchParams.get('id') || '')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    member_name: '',
    member_phone: '',
    course_id: '',
    belayer_id: '',
    booking_date: '',
    time_slot: '',
  })

  useEffect(() => {
    fetchCourses()
    fetchBelayers()
  }, [fetchCourses, fetchBelayers])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filterDate) params.date = filterDate
    if (filterStatus) params.status = filterStatus
    fetchBookings(params)
  }, [filterDate, filterStatus, fetchBookings])

  useEffect(() => {
    const idFromUrl = searchParams.get('id')
    if (idFromUrl && !filterId) {
      setFilterId(idFromUrl)
    }
  }, [searchParams])

  const filteredBookings = filterId
    ? bookings.filter((b) => String(b.id).includes(filterId))
    : bookings

  const handleCreate = async () => {
    if (!form.member_name || !form.member_phone || !form.course_id || !form.booking_date || !form.time_slot) return
    await createBooking({
      member_name: form.member_name,
      member_phone: form.member_phone,
      course_id: Number(form.course_id),
      belayer_id: form.belayer_id ? Number(form.belayer_id) : null,
      booking_date: form.booking_date,
      time_slot: form.time_slot,
      idempotency_key: crypto.randomUUID(),
    })
    setShowModal(false)
    setForm({ member_name: '', member_phone: '', course_id: '', belayer_id: '', booking_date: '', time_slot: '' })
  }

  const handleStatusChange = async (booking: Booking, nextStatus: string) => {
    await updateBookingStatus(booking.id, nextStatus, '值班员')
  }

  const handleFilterIdChange = (value: string) => {
    setFilterId(value)
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('id', value)
    } else {
      params.delete('id')
    }
    setSearchParams(params, { replace: true })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            value={filterId}
            onChange={(e) => handleFilterIdChange(e.target.value)}
            placeholder="预约编号"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-climbing-orange"
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-climbing-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建预约
        </button>
      </div>

      {loadingBookings ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">编号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会员姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">课程</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">保护员</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时段</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">#{b.id}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{b.member_name}</div>
                    <div className="text-xs text-gray-400">{b.member_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{b.course_name}</td>
                  <td className="px-4 py-3 text-sm">{b.belayer_name ?? '-'}</td>
                  <td className="px-4 py-3 text-sm">{b.booking_date}</td>
                  <td className="px-4 py-3 text-sm">{b.time_slot}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge type="booking" status={b.status} /></td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {statusTransitions[b.status]?.map((t) => (
                        <button
                          key={t.next}
                          onClick={() => handleStatusChange(b, t.next)}
                          className={`px-3 py-1 rounded text-xs font-medium ${t.btnClass}`}
                        >
                          {t.label}
                        </button>
                      ))}
                      {b.status !== 'cancelled' && b.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(b, 'cancelled')}
                          className="px-3 py-1 rounded text-xs font-medium bg-gray-200 hover:bg-gray-300 text-gray-600"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">暂无预约记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-rock-gray">新建预约</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会员姓名</label>
                <input
                  value={form.member_name}
                  onChange={(e) => setForm({ ...form, member_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  value={form.member_phone}
                  onChange={(e) => setForm({ ...form, member_phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程</label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                >
                  <option value="">请选择课程</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保护员</label>
                <select
                  value={form.belayer_id}
                  onChange={(e) => setForm({ ...form, belayer_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                >
                  <option value="">请选择保护员</option>
                  {belayers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预约日期</label>
                <input
                  type="date"
                  value={form.booking_date}
                  onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">时段</label>
                <input
                  value={form.time_slot}
                  onChange={(e) => setForm({ ...form, time_slot: e.target.value })}
                  placeholder="如: 09:00-10:30"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 text-sm text-white bg-climbing-orange rounded-lg hover:bg-orange-600"
              >
                提交预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
