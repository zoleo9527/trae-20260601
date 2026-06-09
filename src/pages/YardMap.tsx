import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/hooks/useStore'
import StatusBadge from '@/components/StatusBadge'
import { MapPin, X, ArrowRight, Warehouse } from 'lucide-react'
import type { YardSlot } from '@/shared/types'

const statusStyles: Record<string, string> = {
  empty: 'border-2 border-dashed border-gray-300 bg-white',
  occupied: 'bg-blue-500 text-white border-2 border-blue-600',
  overstay: 'bg-red-500 text-white border-2 border-red-600',
  inspecting: 'bg-amber-500 text-white border-2 border-amber-600',
  misplaced: 'bg-red-500 text-white border-2 border-red-600 animate-pulse-misplaced',
}

const legendItems = [
  { label: '空闲', style: 'border-2 border-dashed border-gray-300 bg-white' },
  { label: '占用', style: 'bg-blue-500' },
  { label: '超期', style: 'bg-red-500' },
  { label: '查验中', style: 'bg-amber-500' },
  { label: '错放', style: 'bg-red-500 animate-pulse-misplaced' },
]

function abbreviateNo(no: string | null) {
  if (!no) return ''
  return no.length > 10 ? `${no.slice(0, 5)}...${no.slice(-3)}` : no
}

export default function YardMap() {
  const [slots, setSlots] = useState<YardSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<YardSlot | null>(null)
  const [relocating, setRelocating] = useState(false)
  const [targetSlotId, setTargetSlotId] = useState<string | null>(null)
  const [activeZone, setActiveZone] = useState<string>('all')
  const { currentRole } = useAppStore()

  const fetchSlots = async () => {
    setLoading(true)
    try {
      const data = await api.yardSlots.list()
      setSlots(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSlots() }, [])

  const zones = useMemo(() => {
    const zoneMap = new Map<string, YardSlot[]>()
    slots.forEach((s) => {
      if (!zoneMap.has(s.zone)) zoneMap.set(s.zone, [])
      zoneMap.get(s.zone)!.push(s)
    })
    return zoneMap
  }, [slots])

  const zoneKeys = useMemo(() => Array.from(zones.keys()).sort(), [zones])

  const displayZones = activeZone === 'all' ? zoneKeys : zoneKeys.filter((z) => z === activeZone)

  const emptySlots = useMemo(
    () => slots.filter((s) => s.status === 'empty'),
    [slots],
  )

  const overstayCount = slots.filter((s) => s.status === 'overstay').length
  const misplacedCount = slots.filter((s) => s.status === 'misplaced').length
  const occupiedCount = slots.filter((s) => s.status !== 'empty').length

  const handleRelocate = async () => {
    if (!selectedSlot || !targetSlotId || !selectedSlot.container_id) return
    await api.yardSlots.relocate(selectedSlot.container_id, selectedSlot.id, targetSlotId)
    setRelocating(false)
    setTargetSlotId(null)
    setSelectedSlot(null)
    fetchSlots()
  }

  const openDetail = (slot: YardSlot) => {
    if (slot.status === 'empty') return
    setSelectedSlot(slot)
    setRelocating(false)
    setTargetSlotId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Warehouse className="w-8 h-8 text-port-navy animate-pulse" />
        <span className="ml-2 text-gray-500">加载堆位数据...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MapPin className="w-5 h-5 text-port-navy" />
        <h1 className="text-xl font-bold text-port-navy">堆场可视化</h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <Warehouse className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">占用数</p>
            <p className="text-xl font-bold text-port-navy">{occupiedCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <MapPin className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">超期位</p>
            <p className="text-xl font-bold text-port-navy">{overstayCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <X className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-sm text-gray-500">错放箱</p>
            <p className="text-xl font-bold text-port-navy">{misplacedCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-xs text-gray-400">{slots.length}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">总槽位</p>
            <p className="text-xl font-bold text-port-navy">{slots.length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveZone('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeZone === 'all' ? 'bg-port-orange text-white' : 'bg-white text-gray-600 border'}`}
        >
          全部
        </button>
        {zoneKeys.map((z) => (
          <button
            key={z}
            onClick={() => setActiveZone(z)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeZone === z ? 'bg-port-orange text-white' : 'bg-white text-gray-600 border'}`}
          >
            {z} 区
          </button>
        ))}
      </div>

      {displayZones.map((zone) => (
        <div key={zone} className="card p-4">
          <h2 className="text-base font-semibold text-port-navy mb-3">{zone} 区</h2>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }, (_, i) => {
              const row = Math.floor(i / 4) + 1
              const col = (i % 4) + 1
              const slot = zones.get(zone)?.find((s) => s.row_num === row && s.col_num === col)
              if (!slot) return <div key={i} className="w-[120px] h-[80px]" />
              const isMisplaced = slot.status === 'misplaced'
              return (
                <div
                  key={slot.id}
                  onClick={() => openDetail(slot)}
                  className={`w-[120px] h-[80px] rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-transform hover:scale-105 ${statusStyles[slot.status] || 'bg-gray-100 border'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{slot.position}</span>
                    {isMisplaced && (
                      <span className="text-[10px] bg-red-700 text-white px-1 rounded">错放</span>
                    )}
                  </div>
                  {slot.container_no && (
                    <span className="text-[10px] truncate opacity-90" title={slot.container_no}>
                      {abbreviateNo(slot.container_no)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="card p-3 flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-gray-600">图例：</span>
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded ${item.style}`} />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedSlot(null)}>
          <div className="card p-5 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-port-navy">槽位详情</h3>
              <button onClick={() => setSelectedSlot(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">位置：</span>{selectedSlot.position}</p>
              <p><span className="text-gray-500">箱号：</span>{selectedSlot.container_no || '-'}</p>
              <p><span className="text-gray-500">状态：</span><StatusBadge status={selectedSlot.status} /></p>
            </div>
            {currentRole === 'dispatcher' && selectedSlot.status !== 'empty' && (
              <div className="mt-4">
                {!relocating ? (
                  <button className="btn-primary text-sm w-full" onClick={() => setRelocating(true)}>
                    <ArrowRight className="w-4 h-4 inline mr-1" />移位
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">选择目标槽位：</p>
                    <select
                      className="w-full border rounded-lg px-2 py-1.5 text-sm"
                      value={targetSlotId || ''}
                      onChange={(e) => setTargetSlotId(e.target.value)}
                    >
                      <option value="">请选择</option>
                      {emptySlots.map((s) => (
                        <option key={s.id} value={s.id}>{s.position}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-sm flex-1" onClick={() => { setRelocating(false); setTargetSlotId(null) }}>取消</button>
                      <button className="btn-primary text-sm flex-1" disabled={!targetSlotId} onClick={handleRelocate}>确认移位</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
