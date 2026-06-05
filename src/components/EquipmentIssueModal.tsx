import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '@/store/useStore'

const equipmentOptions = ['安全带', '攀岩鞋', '头盔', '保护器', '镁粉袋']

interface Props {
  onClose: () => void
}

export default function EquipmentIssueModal({ onClose }: Props) {
  const { bookings, createEquipmentIssuance, fetchEquipmentIssuances } = useStore()
  const [form, setForm] = useState({
    booking_id: '',
    member_name: '',
    equipment_type: '',
    equipment_id: '',
    condition_out: '良好',
    issued_by: '',
  })

  const handleSubmit = async () => {
    if (!form.member_name || !form.equipment_type || !form.equipment_id || !form.issued_by) return
    await createEquipmentIssuance({
      booking_id: form.booking_id ? Number(form.booking_id) : null,
      member_name: form.member_name,
      equipment_type: form.equipment_type,
      equipment_id: form.equipment_id,
      condition_out: form.condition_out,
      issued_by: form.issued_by,
      idempotency_key: crypto.randomUUID(),
    })
    await fetchEquipmentIssuances()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-rock-gray">发放装备</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联预约</label>
            <select
              value={form.booking_id}
              onChange={(e) => {
                const bookingId = e.target.value
                const booking = bookings.find((b) => b.id === Number(bookingId))
                setForm({
                  ...form,
                  booking_id: bookingId,
                  member_name: booking ? booking.member_name : form.member_name,
                })
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            >
              <option value="">不关联预约</option>
              {bookings.filter((b) => b.status !== 'cancelled').map((b) => (
                <option key={b.id} value={b.id}>{b.member_name} - {b.course_name} ({b.booking_date})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会员姓名</label>
            <input
              value={form.member_name}
              onChange={(e) => setForm({ ...form, member_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">装备类型</label>
            <select
              value={form.equipment_type}
              onChange={(e) => setForm({ ...form, equipment_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            >
              <option value="">请选择装备类型</option>
              {equipmentOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">装备编号</label>
            <input
              value={form.equipment_id}
              onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
              placeholder="如: HB-001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">出场状态</label>
            <select
              value={form.condition_out}
              onChange={(e) => setForm({ ...form, condition_out: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            >
              <option value="良好">良好</option>
              <option value="磨损">磨损</option>
              <option value="需检修">需检修</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">发放人</label>
            <input
              value={form.issued_by}
              onChange={(e) => setForm({ ...form, issued_by: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm text-white bg-climbing-orange rounded-lg hover:bg-orange-600">确认发放</button>
        </div>
      </div>
    </div>
  )
}
