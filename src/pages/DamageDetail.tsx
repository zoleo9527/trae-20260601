import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Camera, MessageSquare, Monitor, BookOpen, ClipboardList, AlertCircle, Link2 } from 'lucide-react'
import clsx from 'clsx'
import { damageRecords, evidenceData } from '@/data/mock'
import { SeverityBadge, StatusBadge, CategoryBadge } from '@/components/Badges'
import type { EvidenceSource } from '@/types'

const evidenceIcons: Record<EvidenceSource['type'], React.ReactNode> = {
  '台账记录': <BookOpen className="w-4 h-4" />,
  '现场记录': <ClipboardList className="w-4 h-4" />,
  '沟通截图': <MessageSquare className="w-4 h-4" />,
  '监控记录': <Monitor className="w-4 h-4" />,
  '照片': <Camera className="w-4 h-4" />,
  '运单信息': <FileText className="w-4 h-4" />,
}

const evidenceColor: Record<EvidenceSource['type'], { bg: string; text: string; border: string }> = {
  '台账记录': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '现场记录': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '沟通截图': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  '监控记录': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  '照片': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  '运单信息': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
}

export default function DamageDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const record = damageRecords.find(r => r.id === id)

  if (!record) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-surface-500">未找到该货损记录</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/damage')}>返回列表</button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-surface-900">{record.id}</h1>
            <CategoryBadge category={record.category} />
            <SeverityBadge severity={record.severity} />
            <StatusBadge status={record.status} />
          </div>
          <p className="text-sm text-surface-500 mt-0.5">
            运单 {record.awb} · {record.flightNo} · {record.route}
          </p>
        </div>
        {record.liabilityId && (
          <button
            className="btn-secondary"
            onClick={() => navigate(`/liability/${record.liabilityId}`)}
          >
            查看责任认定 →
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">货损信息</h2>
            </div>
            <div className="card-body">
              <p className="text-sm text-surface-700 leading-relaxed mb-4">{record.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-surface-400">发现时间</span>
                  <p className="text-surface-800 font-medium mt-0.5">{record.discoveryTime}</p>
                </div>
                <div>
                  <span className="text-surface-400">发现地点</span>
                  <p className="text-surface-800 font-medium mt-0.5">{record.discoveryLocation}</p>
                </div>
                <div>
                  <span className="text-surface-400">报告人</span>
                  <p className="text-surface-800 font-medium mt-0.5">{record.reporter}</p>
                </div>
                <div>
                  <span className="text-surface-400">处理人</span>
                  <p className="text-surface-800 font-medium mt-0.5">{record.handler || '未分配'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">证据链</h2>
              <span className="text-xs text-surface-400">{record.evidenceChain.length} 条证据</span>
            </div>
            {record.evidenceChain.length === 0 ? (
              <div className="py-12 text-center text-sm text-surface-400">暂无证据记录</div>
            ) : (
              <div className="divide-y divide-surface-100">
                {record.evidenceChain.map((ev, i) => {
                  const color = evidenceColor[ev.type]
                  return (
                    <div key={ev.id} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', color.bg, color.text)}>
                            {evidenceIcons[ev.type]}
                          </div>
                          {i < record.evidenceChain.length - 1 && (
                            <div className="w-px h-full bg-surface-200 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border', color.bg, color.text, color.border)}>
                              {ev.type}
                            </span>
                            <span className="text-sm font-medium text-surface-800">{ev.title}</span>
                          </div>
                          <p className="text-sm text-surface-600 leading-relaxed">{ev.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                            <span>{ev.timestamp}</span>
                            <span>操作人：{ev.operator}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">异常说明</h2>
              {record.abnormalNote && (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div className="card-body">
              {record.abnormalNote ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 leading-relaxed">{record.abnormalNote}</p>
                </div>
              ) : (
                <p className="text-sm text-surface-400">无异常说明</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">判断依据</h2>
              <Link2 className="w-4 h-4 text-brand-500" />
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-blue-800 mb-1">台账 → 现场记录</div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {record.evidenceChain.find(e => e.type === '台账记录')
                      ? '台账记录入库状态，与现场记录对比可确定异常发生时段'
                      : '暂无台账记录，无法对比'}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-purple-800 mb-1">现场记录 → 沟通截图</div>
                  <p className="text-xs text-purple-700 leading-relaxed">
                    {record.evidenceChain.find(e => e.type === '沟通截图')
                      ? '沟通截图可印证现场记录中各方陈述，识别信息断层'
                      : '暂无沟通记录，各方陈述无法交叉验证'}
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-emerald-800 mb-1">责任认定指向</div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    {record.abnormalNote
                      ? '存在争议点，需结合证据链进一步认定责任归属'
                      : record.liabilityId
                        ? '已关联责任认定记录'
                        : '尚待进行责任认定'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">处理操作</h2>
            </div>
            <div className="card-body space-y-2">
              <button className="btn-primary w-full justify-center">更新处理状态</button>
              {!record.liabilityId && (
                <button className="btn-secondary w-full justify-center">发起责任认定</button>
              )}
              <button className="btn-secondary w-full justify-center">补充证据</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">时间线</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-surface-800 font-medium">创建记录</div>
                    <div className="text-xs text-surface-400">{record.createdAt}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-surface-800 font-medium">最后更新</div>
                    <div className="text-xs text-surface-400">{record.updatedAt}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
