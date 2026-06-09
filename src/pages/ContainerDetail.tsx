import StatusBadge from '@/components/StatusBadge'
import { api } from '@/lib/api'
import type { Attachment, Container, TimelineEvent } from '@/shared/types'
import { AlertTriangle, ArrowLeft, Bell, DollarSign, DoorOpen, FileText, Flag, LogOut, MapPin, Receipt, RefreshCw, ShieldCheck, Upload, Zap } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const eventIconMap: Record<string, any> = {
  gate_in: DoorOpen,
  gate_out: LogOut,
  position_assigned: MapPin,
  relocate: RefreshCw,
  overstay_detected: AlertTriangle,
  overstay_notified: Bell,
  overstay_status_change: AlertTriangle,
  inspection_planned: ShieldCheck,
  inspection_notified: Bell,
  inspection_status_change: ShieldCheck,
  fee_generated: DollarSign,
  fee_review: Receipt,
  fee_dispute: Zap,
  status_change: RefreshCw,
  anomaly_marked: Flag,
  misplace_relocate: MapPin,
}

const eventColorMap: Record<string, string> = {
  gate_in: 'bg-blue-500 text-white',
  gate_out: 'bg-emerald-500 text-white',
  position_assigned: 'bg-blue-400 text-white',
  relocate: 'bg-blue-400 text-white',
  overstay_detected: 'bg-red-500 text-white',
  overstay_notified: 'bg-amber-500 text-white',
  overstay_status_change: 'bg-amber-400 text-white',
  inspection_planned: 'bg-purple-500 text-white',
  inspection_notified: 'bg-purple-400 text-white',
  inspection_status_change: 'bg-purple-400 text-white',
  fee_generated: 'bg-port-orange text-white',
  fee_review: 'bg-emerald-500 text-white',
  fee_dispute: 'bg-red-400 text-white',
  status_change: 'bg-gray-500 text-white',
  anomaly_marked: 'bg-red-500 text-white',
  misplace_relocate: 'bg-emerald-500 text-white',
}

export default function ContainerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [container, setContainer] = useState<Container | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [c, t, a] = await Promise.all([
        api.containers.get(id),
        api.timeline.getByContainer(id),
        api.attachments.list(id),
      ])
      setContainer(c as Container)
      setEvents(t as TimelineEvent[])
      setAttachments(a as Attachment[])
    } catch (e: any) {
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        await api.attachments.upload(id, {
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          base64_data: base64,
        })
        const a = await api.attachments.list(id)
        setAttachments(a as Attachment[])
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
    e.target.value = ''
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-40 mb-4" /><div className="h-4 bg-gray-200 rounded w-60" /></div>
        <div className="card p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-32 mb-4" /><div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}</div></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-500 mb-3">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">返回</button>
      </div>
    )
  }

  if (!container) return null

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-port-navy">
        <ArrowLeft className="w-4 h-4" />返回
      </button>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-port-navy">{container.container_no}</h2>
          <StatusBadge status={container.status} type="container" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-400">类型</span><p className="font-medium text-port-navy">{container.type}</p></div>
          <div><span className="text-gray-400">客户</span><p className="font-medium text-port-navy">{container.customer_name}</p></div>
          <div><span className="text-gray-400">进闸时间</span><p className="font-medium text-port-navy">{new Date(container.gate_in_time).toLocaleString('zh-CN')}</p></div>
          <div><span className="text-gray-400">堆位</span><p className="font-medium text-port-navy">{container.yard_position || '-'}</p></div>
          <div><span className="text-gray-400">超期天数</span><p className="font-medium text-port-navy">{container.overstay_days > 0 ? `${container.overstay_days} 天` : '-'}</p></div>
          <div><span className="text-gray-400">免堆天数</span><p className="font-medium text-port-navy">{container.free_days} 天</p></div>
          {container.gate_out_time && (
            <div><span className="text-gray-400">出闸时间</span><p className="font-medium text-port-navy">{new Date(container.gate_out_time).toLocaleString('zh-CN')}</p></div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-bold text-port-navy mb-6">生命周期</h3>
        <div className="relative">
          {events.map((evt, idx) => {
            const Icon = eventIconMap[evt.event_type] || FileText
            const colorClass = eventColorMap[evt.event_type] || 'bg-gray-400 text-white'
            const isLatest = idx === events.length - 1
            return (
              <div key={evt.id} className="flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isLatest ? colorClass : 'bg-gray-100 text-gray-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {idx < events.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isLatest ? 'text-port-orange' : 'text-port-navy'}`}>{evt.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{new Date(evt.created_at).toLocaleString('zh-CN')}</span>
                    {evt.operator_name && evt.operator_name !== 'system' && <span>{evt.operator_name}</span>}
                    {evt.role && evt.role !== 'system' && (
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">
                        {evt.role === 'gate_operator' ? '闸口' : evt.role === 'dispatcher' ? '调度' : evt.role === 'customer_service' ? '客服' : evt.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {events.length === 0 && <p className="text-sm text-gray-400">暂无事件记录</p>}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-port-navy">附件</h3>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary text-sm flex items-center gap-1">
            <Upload className="w-4 h-4" />{uploading ? '上传中...' : '上传'}
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-400">暂无附件</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-port-navy flex-1">{a.file_name}</span>
                <span className="text-xs text-gray-400">{formatSize(a.file_size)}</span>
                <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
