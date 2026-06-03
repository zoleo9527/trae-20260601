import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import type { HandoffRecord, Anomaly, HandlerRole } from '@/types'
import { cn } from '@/lib/utils'

const roleColors: Record<HandlerRole, string> = {
  receptionist: 'bg-factory-amber',
  designer: 'bg-factory-blue',
  inspector: 'bg-factory-green',
}

const roleLabels: Record<HandlerRole, string> = {
  receptionist: '接单客服',
  designer: '数字设计师',
  inspector: '质检员',
}

const actionLabels: Record<string, string> = {
  submit: '提交',
  reject: '打回',
  release_material: '补材料',
  schedule: '排产',
}

function TimelineNode({ record }: { record: HandoffRecord }) {
  const isSchedule = record.action === 'schedule'
  const [expanded, setExpanded] = useState(isSchedule)
  const hasDetails =
    record.details.reception || record.details.design || record.details.qc || record.details.production

  return (
    <div className="relative pl-8 pb-6">
      <div
        className={cn(
          'absolute left-[11px] top-1 w-3 h-3 rounded-full',
          roleColors[record.fromRole]
        )}
      />

      <div className="bg-factory-surface border border-factory-border rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-0.5 text-xs rounded-full font-medium text-white',
                roleColors[record.fromRole]
              )}
            >
              {roleLabels[record.fromRole]}
            </span>
            <span className="text-xs text-factory-muted">→</span>
            <span
              className={cn(
                'px-2 py-0.5 text-xs rounded-full font-medium text-white',
                roleColors[record.toRole]
              )}
            >
              {roleLabels[record.toRole]}
            </span>
            <span className="px-1.5 py-0.5 text-xs bg-factory-bg text-gray-300 rounded">
              {actionLabels[record.action] ?? record.action}
            </span>
          </div>
          <span className="text-xs text-factory-muted">
            {new Date(record.createdAt).toLocaleString('zh-CN')}
          </span>
        </div>

        <p className="text-sm text-gray-300 mt-2">{record.reason}</p>

        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-xs text-factory-muted hover:text-factory-amber transition"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            详细信息
          </button>
        )}

        {expanded && hasDetails && (
          <div className="mt-2 p-3 bg-factory-bg rounded-md space-y-3 text-xs">
            {record.details.reception && (
              <div>
                <p className="text-factory-amber font-medium mb-1">接单信息</p>
                <p>扫描文件类型：{record.details.reception.scanFileType}</p>
                <p>模型类型：{record.details.reception.modelType === 'digital' ? '数字化' : '实体'}</p>
                <p>扫描文件数：{record.details.reception.scanFileCount}</p>
                {record.details.reception.notes && <p>备注：{record.details.reception.notes}</p>}
              </div>
            )}
            {record.details.design && (
              <div>
                <p className="text-factory-blue font-medium mb-1">设计信息</p>
                <p>软件版本：{record.details.design.softwareVersion}</p>
                {record.details.design.modifications.length > 0 && (
                  <p>修改项：{record.details.design.modifications.join('、')}</p>
                )}
                {record.details.design.colorChangeReason && (
                  <p>改色原因：{record.details.design.colorChangeReason}</p>
                )}
                {record.details.design.specialProcess && (
                  <p>特殊工艺：{record.details.design.specialProcess}</p>
                )}
              </div>
            )}
            {record.details.qc && (
              <div>
                <p className="text-factory-green font-medium mb-1">质检信息</p>
                <p>结果：<span className={record.details.qc.result === 'pass' ? 'text-factory-green' : 'text-factory-red'}>{record.details.qc.result === 'pass' ? '通过' : '未通过'}</span></p>
                {record.details.qc.checkItems.length > 0 && (
                  <div className="mt-1">
                    {record.details.qc.checkItems.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <span className={item.passed ? 'text-factory-green' : 'text-factory-red'}>{item.passed ? '✓' : '✗'}</span>
                        <span>{item.name}：{item.actual}（标准：{item.standard}）</span>
                      </div>
                    ))}
                  </div>
                )}
                {record.details.qc.failReason && <p>未通过原因：{record.details.qc.failReason}</p>}
                {record.details.qc.reworkTarget && <p>返工目标：{record.details.qc.reworkTarget}</p>}
              </div>
            )}
            {record.details.production && (
              <div className="mt-2 p-3 bg-factory-bg rounded-md space-y-3 text-xs">
                <div>
                  <p className="text-purple-400 font-medium mb-1">排产信息</p>
                  {record.details.production.previousDeliveryDate && record.details.production.deliveryDate && record.details.production.previousDeliveryDate !== record.details.production.deliveryDate && (
                    <p className="mb-2">
                      交付日期：<span className="text-factory-muted line-through">{record.details.production.previousDeliveryDate}</span>
                      <span className="mx-1">→</span>
                      <span className="text-factory-amber font-medium">{record.details.production.deliveryDate}</span>
                    </p>
                  )}
                  {record.details.production.previousDeliveryDate === record.details.production.deliveryDate && record.details.production.deliveryDate && (
                    <p className="mb-2">交付日期：<span className="text-gray-300">{record.details.production.deliveryDate}</span>
                    </p>
                  )}
                  <p>生产线：{record.details.production.productionLine}</p>
                  <p>预计完成：{record.details.production.estimatedCompletion}</p>
                  {record.details.production.splitFrom && <p>拆分自：{record.details.production.splitFrom}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AnomalyNode({ anomaly }: { anomaly: Anomaly }) {
  const typeLabels: Record<string, string> = {
    missing_material: '缺材料',
    timeout: '超时',
    qc_failed: '复核不通过',
  }

  return (
    <div className="relative pl-8 pb-6" id={`anomaly-${anomaly.id}`}>
      <div className="absolute left-[9px] top-1 w-4 h-4 rounded-full bg-factory-red flex items-center justify-center">
        <AlertTriangle className="w-2.5 h-2.5 text-white" />
      </div>
      <div className="bg-factory-red/10 border border-factory-red/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 text-xs bg-factory-red/20 text-factory-red rounded-full font-medium">
            {typeLabels[anomaly.type] ?? anomaly.type}
          </span>
          <span className="text-xs text-factory-muted">
            {new Date(anomaly.detectedAt).toLocaleString('zh-CN')}
          </span>
        </div>
        <p className="text-sm text-factory-red/80 mt-1">{anomaly.description}</p>
        {anomaly.resolvedAt && (
          <p className="text-xs text-factory-green mt-1">
            已解决 · {new Date(anomaly.resolvedAt).toLocaleString('zh-CN')}
          </p>
        )}
      </div>
    </div>
  )
}

export default function Timeline({
  records,
  anomalies,
}: {
  records: HandoffRecord[]
  anomalies: Anomaly[]
}) {
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const allEvents = [
    ...sortedRecords.map((r) => ({ type: 'handoff' as const, data: r, time: new Date(r.createdAt).getTime() })),
    ...anomalies.map((a) => ({ type: 'anomaly' as const, data: a, time: new Date(a.detectedAt).getTime() })),
  ].sort((a, b) => a.time - b.time)

  if (allEvents.length === 0) {
    return (
      <div className="py-8 text-center text-factory-muted text-sm">暂无交接记录</div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-[17px] top-0 bottom-0 w-px bg-factory-border" />
      {allEvents.map((event, i) =>
        event.type === 'handoff' ? (
          <TimelineNode key={`h-${i}`} record={event.data as HandoffRecord} />
        ) : (
          <AnomalyNode key={`a-${i}`} anomaly={event.data as Anomaly} />
        )
      )}
    </div>
  )
}
