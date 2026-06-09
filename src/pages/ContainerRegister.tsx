import { useState } from 'react'
import { useContainersStore } from '@/stores/containers'
import { ClipboardPlus, CheckCircle } from 'lucide-react'

const YARD_SLOTS = [
  'A-01-01', 'A-01-02', 'A-01-03', 'A-02-01', 'A-02-02', 'A-02-03',
  'B-01-01', 'B-01-02', 'B-01-03', 'B-02-01', 'B-02-02', 'B-02-03',
  'C-01-01', 'C-01-02', 'C-01-03', 'C-02-01', 'C-02-02', 'C-02-03',
  'D-01-01', 'D-01-02', 'D-01-03', 'D-02-01', 'D-02-02', 'D-02-03',
]

export default function ContainerRegister() {
  const createContainer = useContainersStore((s) => s.createContainer)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    containerNo: '',
    vessel: '',
    voyage: '',
    targetPort: '',
    yardSlot: '',
    freeStorageUntil: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createContainer({
        container_no: form.containerNo,
        vessel: form.vessel,
        voyage: form.voyage,
        target_port: form.targetPort,
        yard_slot: form.yardSlot || undefined,
        free_storage_until: form.freeStorageUntil || undefined,
      })
      setForm({ containerNo: '', vessel: '', voyage: '', targetPort: '', yardSlot: '', freeStorageUntil: '' })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      alert('登记失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-portNavy mb-6">进场登记</h1>

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3">
          <CheckCircle size={18} />
          <span>集装箱登记成功！</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-100 p-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">箱号</label>
            <input
              required
              value={form.containerNo}
              onChange={(e) => setForm({ ...form, containerNo: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30 focus:border-portBlue"
              placeholder="如 MSKU1234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">船名</label>
            <input
              required
              value={form.vessel}
              onChange={(e) => setForm({ ...form, vessel: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30 focus:border-portBlue"
              placeholder="如 COSCO SHIPPING"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">航次</label>
            <input
              required
              value={form.voyage}
              onChange={(e) => setForm({ ...form, voyage: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30 focus:border-portBlue"
              placeholder="如 V023E"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">目的港</label>
            <input
              required
              value={form.targetPort}
              onChange={(e) => setForm({ ...form, targetPort: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30 focus:border-portBlue"
              placeholder="如 SHANGHAI"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">预计堆位</label>
            <select
              value={form.yardSlot}
              onChange={(e) => setForm({ ...form, yardSlot: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30 focus:border-portBlue"
            >
              <option value="">系统自动分配</option>
              {YARD_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">免堆期至</label>
            <input
              type="datetime-local"
              value={form.freeStorageUntil}
              onChange={(e) => setForm({ ...form, freeStorageUntil: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30 focus:border-portBlue"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-6 flex items-center gap-2 bg-portOrange text-white px-6 py-2.5 rounded-lg font-medium hover:bg-portOrange/90 transition-colors"
        >
          <ClipboardPlus size={18} />
          登记进场
        </button>
      </form>
    </div>
  )
}
