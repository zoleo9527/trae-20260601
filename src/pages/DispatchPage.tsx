import { useParcelStore } from '@/store/parcelStore'
import { ROLE_LABELS } from '@shared/types'
import { Check, ChevronDown, ClipboardList, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DispatchPage() {
  const { parcels, couriers, stations, dispatchParcels, fetchParcels, fetchCouriers, fetchStations, loading } =
    useParcelStore()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [assigneeType, setAssigneeType] = useState<'courier' | 'station' | ''>('')
  const [assigneeId, setAssigneeId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    fetchParcels({ status: 'arrived_pending' })
    fetchCouriers()
    fetchStations()
  }, [fetchParcels, fetchCouriers, fetchStations])

  const arrivedParcels = parcels.filter((p: any) => p.status === 'arrived_pending')

  const allSelected = arrivedParcels.length > 0 && selectedIds.length === arrivedParcels.length

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : arrivedParcels.map((p: any) => p.id))
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const selectedAssigneeLabel = (() => {
    if (assigneeType === 'courier') {
      const c = couriers.find((c: any) => c.id === assigneeId)
      return c ? `派件员：${c.name}` : ''
    }
    if (assigneeType === 'station') {
      const s = stations.find((s: any) => s.id === assigneeId)
      return s ? `驿站：${s.name}` : ''
    }
    return ''
  })()

  const handleSelectAssignee = (type: 'courier' | 'station', id: number) => {
    setAssigneeType(type)
    setAssigneeId(id)
    setDropdownOpen(false)
  }

  const handleConfirm = async () => {
    if (!assigneeType || !assigneeId || selectedIds.length === 0) return

    let targetAssigneeId = assigneeId
    if (assigneeType === 'station') {
      const station = stations.find((s: any) => s.id === assigneeId)
      if (station) {
        targetAssigneeId = station.manager_id
      }
    }

    await dispatchParcels(selectedIds, targetAssigneeId, assigneeType, note || undefined)
    setSelectedIds([])
    setAssigneeType('')
    setAssigneeId(null)
    setNote('')
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6 text-orange-500" />
        <h1 className="text-xl font-semibold text-slate-800">派件分配</h1>
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 accent-orange-500"
                  />
                </th>
                <th className="px-6 py-3 font-medium">运单号</th>
                <th className="px-6 py-3 font-medium">到件时间</th>
                <th className="px-6 py-3 font-medium">当前责任人</th>
              </tr>
            </thead>
            <tbody>
              {arrivedParcels.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    暂无待分配快件
                  </td>
                </tr>
              )}
              {arrivedParcels.map((parcel: any) => (
                <tr key={parcel.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(parcel.id)}
                      onChange={() => toggleOne(parcel.id)}
                      className="h-4 w-4 rounded border-slate-300 accent-orange-500"
                    />
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-800">{parcel.tracking_no}</td>
                  <td className="px-6 py-3 text-slate-600">{parcel.arrived_at ?? parcel.created_at}</td>
                  <td className="px-6 py-3">
                    <span className="text-slate-800">{parcel.responsible_name ?? parcel.scanned_by_name ?? '-'}</span>
                    {parcel.responsible_type && (
                      <span className="ml-1 text-xs text-slate-400">({ROLE_LABELS[parcel.responsible_type] ?? parcel.responsible_type})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-56 right-0 z-40 border-t bg-white px-6 py-4 shadow-lg">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-700">
              已选择 <span className="text-orange-500">{selectedIds.length}</span> 件
            </span>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:border-slate-400"
              >
                {selectedAssigneeLabel || '选择分配对象'}
                <ChevronDown className="h-4 w-4" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-lg border bg-white py-1 shadow-xl">
                    {couriers.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 text-xs font-medium text-slate-400">派件员</div>
                        {couriers.map((courier: any) => (
                          <button
                            key={courier.id}
                            onClick={() => handleSelectAssignee('courier', courier.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {assigneeType === 'courier' && assigneeId === courier.id && (
                              <Check className="h-4 w-4 text-orange-500" />
                            )}
                            <span className={assigneeType === 'courier' && assigneeId === courier.id ? '' : 'ml-6'}>
                              {courier.name}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                    {stations.length > 0 && (
                      <>
                        <div className="my-1 border-t" />
                        <div className="px-3 py-1.5 text-xs font-medium text-slate-400">驿站</div>
                        {stations.map((station: any) => (
                          <button
                            key={station.id}
                            onClick={() => handleSelectAssignee('station', station.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {assigneeType === 'station' && assigneeId === station.id && (
                              <Check className="h-4 w-4 text-orange-500" />
                            )}
                            <span className={assigneeType === 'station' && assigneeId === station.id ? '' : 'ml-6'}>
                              {station.name}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="备注（可选）"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />

            <button
              onClick={handleConfirm}
              disabled={!assigneeType || !assigneeId || loading}
              className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              确认分配
            </button>

            <button
              onClick={() => {
                setSelectedIds([])
                setAssigneeType('')
                setAssigneeId(null)
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
