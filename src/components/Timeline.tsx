import { MessageSquare, ArrowRightCircle, Activity, Link2 } from 'lucide-react'
import type { TimelineItem as TimelineItemType, IncidentNote, StatusTransition, OperationLog } from '@/shared/types'
import { NOTE_CATEGORY_LABELS } from '@/shared/types'

const typeStyles = {
  note: { dot: 'bg-ice-500', icon: MessageSquare, label: '备注' },
  status: { dot: 'bg-purple-500', icon: ArrowRightCircle, label: '状态变更' },
  log: { dot: 'bg-slate-400', icon: Activity, label: '操作日志' },
}

const categoryStyles = {
  rescue: 'bg-blue-100 text-blue-700',
  medical: 'bg-red-100 text-red-700',
  insurance: 'bg-green-100 text-green-700',
  anomaly: 'bg-orange-100 text-orange-700',
}

interface TimelineProps {
  items: TimelineItemType[]
  noteReferenceCount?: Map<string, number>
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN')
}

export default function Timeline({ items, noteReferenceCount }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
        暂无时间线数据
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) => {
        const style = typeStyles[item.type]
        const isLast = index === items.length - 1

        return (
          <div key={index} className="relative flex gap-4 timeline-item">
            {!isLast && (
              <div className="absolute left-[11px] top-6 w-0.5 h-[calc(100%+8px)] bg-slate-200" />
            )}
            <div className="relative z-10 mt-0.5">
              <div className={`w-6 h-6 rounded-full ${style.dot} flex items-center justify-center shrink-0`}>
                <style.icon className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-500">{style.label}</span>
                <span className="text-xs text-slate-400">{formatTime(item.created_at)}</span>
              </div>

              {item.type === 'note' && (
                <NoteContent data={item.data as IncidentNote} referenceCount={noteReferenceCount?.get((item.data as IncidentNote).id) || 0} />
              )}
              {item.type === 'status' && (
                <StatusContent data={item.data as StatusTransition} />
              )}
              {item.type === 'log' && (
                <LogContent data={item.data as OperationLog} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NoteContent({ data, referenceCount }: { data: IncidentNote; referenceCount: number }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-slate-700">{data.author}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${categoryStyles[data.category]}`}>
          {NOTE_CATEGORY_LABELS[data.category]}
        </span>
        {referenceCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-ice-100 text-ice-700 flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            已被 {referenceCount} 份保险材料引用
          </span>
        )}
      </div>
      <p className="text-sm text-slate-600 whitespace-pre-wrap">{data.content}</p>
      {data.referenced_note_id && (
        <p className="text-xs text-ice-600 mt-2">
          引用自备注: #{data.referenced_note_id.slice(0, 8)}
        </p>
      )}
    </div>
  )
}

function StatusContent({ data }: { data: StatusTransition }) {
  const statusLabels = {
    pending: '待处理',
    processing: '处置中',
    review: '审核中',
    completed: '已完成',
    archived: '已归档',
  }
  return (
    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-slate-700">{data.operator}</span>
      </div>
      <p className="text-sm text-slate-600">
        状态从 <span className="font-medium">{statusLabels[data.from_status]}</span> 变更为{' '}
        <span className="font-medium text-purple-700">{statusLabels[data.to_status]}</span>
      </p>
      {data.remark && (
        <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-purple-100">
          备注: {data.remark}
        </p>
      )}
    </div>
  )
}

function LogContent({ data }: { data: OperationLog }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-slate-700">{data.operator}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {data.action}
        </span>
      </div>
      <p className="text-sm text-slate-600">{data.detail}</p>
    </div>
  )
}
