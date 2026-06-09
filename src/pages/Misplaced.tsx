import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAppStore } from '@/hooks/useStore'
import StatusBadge from '@/components/StatusBadge'
import { AlertTriangle, MapPin, Camera, ArrowRight, CheckCircle, Eye, FileText, X } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  gate_operator: '闸口操作员',
  dispatcher: '调度员',
  customer_service: '客服专员',
}

export default function Misplaced() {
  const { currentRole } = useAppStore()
  const [containers, setContainers] = useState<any[]>([])
  const [emptySlots, setEmptySlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showRelocate, setShowRelocate] = useState(false)
  const [targetSlotId, setTargetSlotId] = useState('')
  const [note, setNote] = useState('')
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [misplacedData, slotsData] = await Promise.all([
        api.containers.misplacedList(),
        api.yardSlots.list(),
      ])
      setContainers(misplacedData)
      setEmptySlots(slotsData.filter((s: any) => s.status === 'empty'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const selected = useMemo(
    () => containers.find((c) => c.id === selectedId) || null,
    [containers, selectedId],
  )

  const handleRelocate = async () => {
    if (!selectedId || !targetSlotId || submitting) return
    setSubmitting(true)
    try {
      await api.containers.relocateMisplaced(selectedId, {
        target_slot_id: targetSlotId,
        operator_name: ROLE_LABELS[currentRole],
        role: currentRole,
        note,
        photo_base64: photoBase64,
      })
      setSelectedId(null)
      setShowRelocate(false)
      setTargetSlotId('')
      setNote('')
      setPhotoBase64(null)
      setPhotoName('')
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPhotoBase64(result.split(',')[1] || result)
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="w-8 h-8 text-port-navy animate-pulse" />
        <span className="ml-2 text-gray-500">加载错放箱数据...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h1 className="text-xl font-bold text-port-navy">错放箱处理</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3 border-l-4 border-red-500">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">待处理错放箱</p>
            <p className="text-xl font-bold text-port-navy">{containers.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border-l-4 border-orange-500">
          <MapPin className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-sm text-gray-500">可分配槽位</p>
            <p className="text-xl font-bold text-port-navy">{emptySlots.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border-l-4 border-blue-500">
          <Eye className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">当前角色</p>
            <p className="text-xl font-bold text-port-navy">{ROLE_LABELS[currentRole]}</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold">1</div>
            <span className="text-xs mt-1 text-red-500 font-medium">发现错放</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300" />
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-xs mt-1 text-orange-500 font-medium">调度员确认</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300" />
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-port-orange text-white flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-xs mt-1 text-port-orange font-medium">复位处理</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300" />
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">4</div>
            <span className="text-xs mt-1 text-emerald-500 font-medium">完成</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-22rem)]">
        <div className="w-[55%] card overflow-hidden flex flex-col">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-gray-600">
                <th className="px-4 py-3 text-left font-medium">箱号</th>
                <th className="px-4 py-3 text-left font-medium">客户</th>
                <th className="px-4 py-3 text-left font-medium">类型</th>
                <th className="px-4 py-3 text-left font-medium">进闸时间</th>
                <th className="px-4 py-3 text-left font-medium">当前堆位</th>
                <th className="px-4 py-3 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {containers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); setShowRelocate(false) }}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedId === c.id ? 'bg-port-orange/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/containers/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-xs text-blue-600 hover:underline"
                    >
                      {c.container_no}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.customer_name}</td>
                  <td className="px-4 py-3"><span className="status-badge bg-gray-100 text-gray-600">{c.type}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.gate_in_time).toLocaleDateString('zh-CN')}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                      {c.current_slot_position || c.yard_position || '未知'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {currentRole === 'dispatcher' ? (
                      <button
                        className="btn-primary text-xs px-2.5 py-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(c.id)
                          setShowRelocate(true)
                        }}
                      >
                        复位处理
                      </button>
                    ) : currentRole === 'customer_service' ? (
                      <button
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2.5 py-1 rounded-lg font-medium"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(c.id)
                          setShowRelocate(true)
                        }}
                      >
                        发起工单
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">仅查看</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {containers.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>暂无错放箱记录</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-[45%] flex flex-col gap-4 overflow-y-auto">
          {!selected ? (
            <div className="card flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>选择错放箱进行查看或处理</p>
              </div>
            </div>
          ) : (
            <>
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-mono text-sm text-gray-500">{selected.container_no}</span>
                    <h3 className="font-medium">{selected.customer_name}</h3>
                  </div>
                  <StatusBadge status="misplaced" type="container" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">箱型</div>
                    <div className="font-medium">{selected.type}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">免堆天数</div>
                    <div className="font-medium">{selected.free_days} 天</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-500 mb-1">当前堆位</div>
                    <div className="font-medium text-red-600">{selected.current_slot_position || selected.yard_position || '未知'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">进闸时间</div>
                    <div className="font-medium text-xs">{new Date(selected.gate_in_time).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
              </div>

              {showRelocate && (currentRole === 'dispatcher' || currentRole === 'customer_service') && (
                <div className="card p-4 border-l-4 border-port-orange">
                  <h4 className="font-medium mb-3">
                    {currentRole === 'dispatcher' ? '复位处理' : '发起工单'}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">目标槽位 <span className="text-red-500">*</span></label>
                      <select
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange/30 focus:border-port-orange"
                        value={targetSlotId}
                        onChange={(e) => setTargetSlotId(e.target.value)}
                      >
                        <option value="">请选择目标槽位</option>
                        {emptySlots.map((s) => (
                          <option key={s.id} value={s.id}>{s.position}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">备注</label>
                      <textarea
                        rows={2}
                        placeholder="输入备注说明..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-port-orange/30 focus:border-port-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        <Camera className="w-3.5 h-3.5 inline mr-1" />现场照片
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="w-full text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-port-orange/10 file:text-port-orange hover:file:bg-port-orange/20"
                      />
                      {photoName && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <FileText className="w-3 h-3" />
                          <span>{photoName}</span>
                          <button onClick={() => { setPhotoBase64(null); setPhotoName('') }}>
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        className="btn-secondary text-sm flex-1"
                        onClick={() => {
                          setShowRelocate(false)
                          setTargetSlotId('')
                          setNote('')
                          setPhotoBase64(null)
                          setPhotoName('')
                        }}
                      >
                        取消
                      </button>
                      <button
                        className="btn-primary text-sm flex-1"
                        disabled={!targetSlotId || submitting}
                        onClick={handleRelocate}
                      >
                        {submitting ? '处理中...' : currentRole === 'dispatcher' ? '确认复位' : '提交工单'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!showRelocate && (currentRole === 'dispatcher' || currentRole === 'customer_service') && (
                <button
                  className="btn-primary text-sm w-full"
                  onClick={() => setShowRelocate(true)}
                >
                  {currentRole === 'dispatcher' ? '开始复位处理' : '发起复位工单'}
                </button>
              )}

              <Link
                to={`/containers/${selected.id}`}
                className="card p-3 flex items-center justify-between hover:bg-gray-50 transition-colors group"
              >
                <span className="text-sm text-gray-600">查看箱号详情与时间线</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-port-orange transition-colors" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
