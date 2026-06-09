import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/hooks/useStore'
import StatusBadge from '@/components/StatusBadge'
import { MapPin, X, ArrowRight, Warehouse, Camera, AlertTriangle } from 'lucide-react'
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
  const [misplacedMode, setMisplacedMode] = useState(false)
  const [misplacedNote, setMisplacedNote] = useState('')
  const [misplacedPhoto, setMisplacedPhoto] = useState<string | null>(null)
  const [misplacedPhotoName, setMisplacedPhotoName] = useState('')
  const [misplacedSubmitting, setMisplacedSubmitting] = useState(false)
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

  const handleMisplacedRelocate = async () => {
    if (!selectedSlot?.container_id || !targetSlotId || misplacedSubmitting) return
    setMisplacedSubmitting(true)
    try {
      await api.containers.relocateMisplaced(selectedSlot.container_id, {
        target_slot_id: targetSlotId,
        operator_name: currentRole === 'dispatcher' ? '调度员' : '客服专员',
        role: currentRole,
        note: misplacedNote,
        photo_base64: misplacedPhoto,
      })
      setSelectedSlot(null)
      setMisplacedMode(false)
      setTargetSlotId(null)
      setMisplacedNote('')
      setMisplacedPhoto(null)
      setMisplacedPhotoName('')
      fetchSlots()
    } finally {
      setMisplacedSubmitting(false)
    }
  }

  const handleMisplacedPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMisplacedPhotoName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setMisplacedPhoto(result.split(',')[1] || result)
    }
    reader.readAsDataURL(file)
  }

  const openDetail = (slot: YardSlot) => {
    if (slot.status === 'empty') return
    setSelectedSlot(slot)
    setRelocating(false)
    setTargetSlotId(null)
    setMisplacedMode(slot.status === 'misplaced')
    setMisplacedNote('')
    setMisplacedPhoto(null)
    setMisplacedPhotoName('')
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
          <div className="card p-5 w-96 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-port-navy">槽位详情</h3>
              <button onClick={() => setSelectedSlot(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">位置：</span>{selectedSlot.position}</p>
              <p><span className="text-gray-500">箱号：</span>{selectedSlot.container_no || '-'}</p>
              <p><span className="text-gray-500">状态：</span><StatusBadge status={selectedSlot.status} /></p>
            </div>

            {selectedSlot.status === 'misplaced' && (currentRole === 'dispatcher' || currentRole === 'customer_service') && misplacedMode && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h4 className="font-medium text-sm">错放箱复位</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">目标槽位 *</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange/30 focus:border-port-orange"
                      value={targetSlotId || ''}
                      onChange={(e) => setTargetSlotId(e.target.value)}
                    >
                      <option value="">请选择</option>
                      {emptySlots.map((s) => (
                        <option key={s.id} value={s.id}>{s.position}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">备注</label>
                    <textarea
                      rows={2}
                      placeholder="输入备注..."
                      value={misplacedNote}
                      onChange={(e) => setMisplacedNote(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-port-orange/30 focus:border-port-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      <Camera className="w-3 h-3 inline mr-1" />现场照片
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMisplacedPhoto}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-port-orange/10 file:text-port-orange"
                    />
                    {misplacedPhotoName && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <span>{misplacedPhotoName}</span>
                        <button onClick={() => { setMisplacedPhoto(null); setMisplacedPhotoName('') }}>
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary text-sm flex-1"
                      onClick={() => { setMisplacedMode(false); setTargetSlotId(null); setMisplacedNote(''); setMisplacedPhoto(null); setMisplacedPhotoName('') }}
                    >
                      取消
                    </button>
                    <button
                      className="btn-primary text-sm flex-1"
                      disabled={!targetSlotId || misplacedSubmitting}
                      onClick={handleMisplacedRelocate}
                    >
                      {misplacedSubmitting ? '处理中...' : '确认复位'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedSlot.status === 'misplaced' && !misplacedMode && (currentRole === 'dispatcher' || currentRole === 'customer_service') && (
              <div className="mt-4">
                <button
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1"
                  onClick={() => setMisplacedMode(true)}
                >
                  <AlertTriangle className="w-4 h-4" />错放箱复位处理
                </button>
              </div>
            )}

            {selectedSlot.status === 'misplaced' && currentRole === 'gate_operator' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-400">
                闸口操作员仅可查看，无法执行复位操作
              </div>
            )}

            {selectedSlot.status !== 'misplaced' && currentRole === 'dispatcher' && selectedSlot.status !== 'empty' && (
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
