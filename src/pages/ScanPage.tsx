import StatusBadge from '@/components/StatusBadge'
import { useParcelStore } from '@/store/parcelStore'
import { PROBLEM_TYPES, ROLE_LABELS } from '@shared/types'
import { AlertTriangle, Check, ChevronDown, ScanLine, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function ScanPage() {
  const { parcels, scanParcel, reportProblem, fetchParcels, scanAndDispatch, couriers, stations, fetchCouriers, fetchStations, loading } = useParcelStore()
  const [inputValue, setInputValue] = useState('')
  const [problemParcel, setProblemParcel] = useState<{ id: number; trackingNo: string } | null>(null)
  const [selectedProblemType, setSelectedProblemType] = useState('')
  const [quickMode, setQuickMode] = useState(false)
  const [assigneeType, setAssigneeType] = useState<'courier' | 'station' | ''>('')
  const [assigneeId, setAssigneeId] = useState<number | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchParcels({ status: 'arrived_pending' })
    fetchCouriers()
    fetchStations()
  }, [fetchParcels, fetchCouriers, fetchStations])

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !inputValue.trim()) return
    const trackingNo = inputValue.trim()
    setInputValue('')

    try {
      if (quickMode && assigneeType && assigneeId) {
        await scanAndDispatch([{ trackingNo }], assigneeId, assigneeType)
      } else {
        await scanParcel(trackingNo)
      }
    } catch {
      setInputValue(trackingNo)
    }
    inputRef.current?.focus()
  }

  const handleReportProblem = async () => {
    if (!problemParcel || !selectedProblemType) return
    await reportProblem(problemParcel.id, selectedProblemType)
    setProblemParcel(null)
    setSelectedProblemType('')
  }

  const handleSelectAssignee = (type: 'courier' | 'station', id: number) => {
    setAssigneeType(type)
    setAssigneeId(id)
    setDropdownOpen(false)
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

  const arrivedParcels = parcels.filter((p: any) => p.status === 'arrived_pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ScanLine className="h-6 w-6 text-orange-500" />
        <h1 className="text-xl font-semibold text-slate-800">到件扫描</h1>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={quickMode ? '快速模式：扫码回车即自动分配' : '扫码或输入运单号，回车提交'}
            className={`flex-1 rounded-lg border px-4 py-3 text-lg focus:outline-none focus:ring-2 ${
              quickMode
                ? 'border-orange-400 bg-orange-50 focus:border-orange-500 focus:ring-orange-100'
                : 'border-slate-300 focus:border-orange-400 focus:ring-orange-100'
            }`}
            autoFocus
          />
          <button
            onClick={() => setQuickMode(!quickMode)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              quickMode
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Zap className="h-4 w-4" />
            {quickMode ? '快速模式' : '普通模式'}
          </button>
        </div>

        {quickMode && (
          <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <span className="text-sm font-medium text-orange-700">分配给：</span>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-orange-400"
              >
                {selectedAssigneeLabel || '选择分配对象'}
                <ChevronDown className="h-4 w-4" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border bg-white py-1 shadow-xl">
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
            {quickMode && !assigneeType && (
              <span className="text-xs text-orange-600">请先选择分配对象，否则将使用普通模式</span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-medium text-slate-700">到件列表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="px-6 py-3 font-medium">运单号</th>
                <th className="px-6 py-3 font-medium">到件时间</th>
                <th className="px-6 py-3 font-medium">状态</th>
                <th className="px-6 py-3 font-medium">责任人</th>
                <th className="px-6 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {arrivedParcels.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    暂无到件记录
                  </td>
                </tr>
              )}
              {arrivedParcels.map((parcel: any) => (
                <tr key={parcel.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-slate-800">{parcel.tracking_no}</td>
                  <td className="px-6 py-3 text-slate-600">{parcel.arrived_at ?? parcel.created_at}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={parcel.status} />
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-slate-800">{parcel.responsible_name ?? '-'}</span>
                    {parcel.responsible_type && (
                      <span className="ml-1 text-xs text-slate-400">({ROLE_LABELS[parcel.responsible_type] ?? parcel.responsible_type})</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => {
                        setProblemParcel({ id: parcel.id, trackingNo: parcel.tracking_no })
                        setSelectedProblemType('')
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      标记问题件
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {problemParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">标记问题件</h3>
              <button onClick={() => setProblemParcel(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-slate-500">
              运单号：<span className="font-mono text-slate-700">{problemParcel.trackingNo}</span>
            </p>
            <div className="space-y-2">
              {PROBLEM_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                    selectedProblemType === type
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="problemType"
                    value={type}
                    checked={selectedProblemType === type}
                    onChange={() => setSelectedProblemType(type)}
                    className="accent-orange-500"
                  />
                  {type}
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setProblemParcel(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                onClick={handleReportProblem}
                disabled={!selectedProblemType || loading}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                确认上报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
