import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { EquipmentIssuance } from '@/store/useStore'

interface Props {
  issuance: EquipmentIssuance
  onClose: () => void
}

export default function EquipmentReturnModal({ issuance, onClose }: Props) {
  const { returnEquipment, fetchEquipmentIssuances } = useStore()
  const [form, setForm] = useState({
    condition_in: '良好',
    returned_by: '',
  })

  const handleSubmit = async () => {
    if (!form.returned_by) return
    await returnEquipment(issuance.id, {
      condition_in: form.condition_in,
      returned_by: form.returned_by,
    })
    await fetchEquipmentIssuances()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-rock-gray">装备归还</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <p><span className="text-gray-500">会员：</span>{issuance.member_name}</p>
          <p><span className="text-gray-500">装备：</span>{issuance.equipment_type} ({issuance.equipment_id})</p>
          <p><span className="text-gray-500">出场状态：</span>{issuance.condition_out}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">回场状态</label>
            <select
              value={form.condition_in}
              onChange={(e) => setForm({ ...form, condition_in: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            >
              <option value="良好">良好</option>
              <option value="磨损">磨损</option>
              <option value="需检修">需检修</option>
              <option value="损坏">损坏</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">接收人</label>
            <input
              value={form.returned_by}
              onChange={(e) => setForm({ ...form, returned_by: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm text-white bg-success-green rounded-lg hover:bg-green-600">确认归还</button>
        </div>
      </div>
    </div>
  )
}
