import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useDeviceStore } from '@/store/deviceStore'
import StatusBadge from '@/components/StatusBadge'
import GradeBadge from '@/components/GradeBadge'
import Timeline from '@/components/Timeline'
import { RiskTypeBadge, RiskSeverityDot, RiskStatusLabel } from '@/components/RiskBadge'
import { ArrowLeft, Smartphone, CreditCard, User, FileText, AlertTriangle, Check, X, Send, MessageSquare, ChevronRight, Package, ClipboardCheck, DollarSign, Wallet, RotateCcw, CheckCircle2, Edit2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InspectionItem, DeviceStatus, Role } from '@/types'

const FLOW_STEPS: { key: DeviceStatus | 'registered' | 'graded'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'registered', label: '登记收货', icon: Package },
  { key: 'inspecting', label: '开始检测', icon: ClipboardCheck },
  { key: 'graded', label: '等级判定', icon: ClipboardCheck },
  { key: 'confirmed', label: '价格确认', icon: DollarSign },
  { key: 'paying', label: '核验打款', icon: Shield },
  { key: 'completed', label: '完成结算', icon: CheckCircle2 },
]

function getStepIndex(status: DeviceStatus, hasReport: boolean): number {
  if (status === 'completed') return 5
  if (status === 'paying') return 4
  if (status === 'confirmed') return 3
  if (status === 'graded' || status === 'returned' || hasReport) return 2
  if (status === 'inspecting') return 1
  return 0
}

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    devices, inspectionReports, riskFlags, historyEntries,
    resolveRisk, updateRiskStatus, confirmPrice, markPriceRegret, returnDevice,
    startInspection, verifyPayment, executePayment, addNote, setCurrentDevice
  } = useDeviceStore()
  const [noteContent, setNoteContent] = useState('')
  const [priceRegretOpen, setPriceRegretOpen] = useState(false)
  const [priceRegretReason, setPriceRegretReason] = useState('')
  const [noteRole, setNoteRole] = useState<Role>('receiver')

  const device = devices.find((d) => d.id === id)

  if (!device) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>设备未找到</p>
        <Link to="/receiver" className="text-blue-400 text-sm mt-2 inline-block hover:underline">返回收货工作台</Link>
      </div>
    )
  }

  const report = inspectionReports[device.id]
  const deviceRisks = riskFlags.filter((r) => r.deviceId === device.id)
  const pendingRisks = deviceRisks.filter((r) => r.status !== 'resolved')
  const deviceHistory = historyEntries
    .filter((h) => h.deviceId === device.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const itemsByCategory = report
    ? report.items.reduce<Record<string, InspectionItem[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
      }, {})
    : {}

  const stepIdx = getStepIndex(device.status, !!report)

  const passCount = report?.items.filter((i) => i.result === 'pass').length ?? 0
  const failCount = report?.items.filter((i) => i.result === 'fail').length ?? 0
  const skipCount = report?.items.filter((i) => i.result === 'skip').length ?? 0

  function handleAddNote() {
    const content = noteContent.trim()
    if (!content) return
    const operatorMap: Record<Role, string> = {
      receiver: '小李', inspector: '老王', finance: '赵姐', manager: '小李',
    }
    addNote(device.id, content, operatorMap[noteRole], noteRole)
    setNoteContent('')
  }

  function handleConfirmPrice() {
    confirmPrice(device.id)
  }

  function handleSubmitRegret() {
    const reason = priceRegretReason.trim() || '客户拒绝报价要求退回'
    markPriceRegret(device.id, reason)
    setPriceRegretOpen(false)
    setPriceRegretReason('')
  }

  function handleReturn() {
    if (confirm('确认设备已退回客户？退回后将解除所有未解决的风险标记。')) {
      returnDevice(device.id)
    }
  }

  function handleGoNext() {
    switch (device.status) {
      case 'received':
      case 'inspecting':
        setCurrentDevice(device.id)
        navigate('/inspector')
        break
      case 'graded':
        setPriceRegretOpen(false)
        break
      case 'confirmed':
        verifyPayment(device.id)
        break
      case 'paying':
        executePayment([device.id])
        break
    }
  }

  const nextActionLabel = (() => {
    switch (device.status) {
      case 'received': return '前往检测工作台'
      case 'inspecting': return '继续检测流程'
      case 'graded': return null
      case 'confirmed': return '核验收款账号'
      case 'paying': return '确认执行打款'
      case 'completed': return null
      case 'returned': return null
    }
  })()

  const hasPaymentError = deviceRisks.some((r) => r.type === 'payment_error' && r.status !== 'resolved')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-brand-card border border-brand-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-gray-100 truncate">{device.brand} {device.model}</h1>
            <span className="text-xs text-gray-500 font-mono">{device.id}</span>
            <StatusBadge status={device.status} />
            {device.grade && <GradeBadge grade={device.grade} size="lg" />}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            收货于 {device.receivedAt} · 收货员 {device.receivedBy}
          </p>
        </div>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs text-gray-500 font-medium tracking-wide">流转进度</h3>
          {device.status === 'completed' && (
            <span className="inline-flex items-center gap-1 text-xs text-green-300 bg-green-500/10 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" /> 流程完成
            </span>
          )}
          {device.status === 'returned' && (
            <span className="inline-flex items-center gap-1 text-xs text-red-300 bg-red-500/10 px-2 py-0.5 rounded">
              <RotateCcw className="w-3 h-3" /> 设备已退回
            </span>
          )}
        </div>
        <div className="relative">
          <div className="absolute left-5 right-5 top-4 h-0.5 bg-brand-border" />
          <div
            className={cn(
              'absolute left-5 top-4 h-0.5 transition-all duration-500',
              device.status === 'returned' ? 'bg-red-500/40' : 'bg-brand-accent'
            )}
            style={{ width: `calc(${(Math.min(stepIdx, 5) / 5) * 100}% - ${(Math.min(stepIdx, 5) / 5) * 40}px)` }}
          />
          <div className="relative flex items-start justify-between">
            {FLOW_STEPS.map((step, i) => {
              const done = i <= stepIdx && device.status !== 'returned'
              const active = i === stepIdx && device.status !== 'returned'
              const currentReturned = device.status === 'returned' && i <= stepIdx
              return (
                <div key={step.key} className="flex flex-col items-center w-[16.66%] relative z-10">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                      done && device.status !== 'returned' ? 'bg-brand-accent border-brand-accent text-white' :
                      currentReturned ? 'bg-red-500/20 border-red-500/40 text-red-300' :
                      active ? 'bg-brand-info border-brand-accent text-white ring-4 ring-brand-accent/20' :
                      'bg-brand-card border-brand-border text-gray-500'
                    )}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <div
                    className={cn(
                      'text-xs mt-2 text-center font-medium leading-tight',
                      done ? 'text-gray-200' :
                      active ? 'text-brand-accent' :
                      'text-gray-500'
                    )}
                  >
                    {step.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {pendingRisks.length > 0 && (
        <div className="mb-6 bg-red-500/5 border-2 border-red-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            风险预警 · {pendingRisks.length} 条待处理
          </h3>
          <div className="space-y-2">
            {pendingRisks.map((risk) => (
              <div key={risk.id} className="flex items-start gap-3 bg-brand-card rounded-lg p-3 border border-red-500/10">
                <RiskTypeBadge type={risk.type} />
                <RiskSeverityDot severity={risk.severity} />
                <span className="text-sm text-gray-300 flex-1 pt-0.5">{risk.description}</span>
                <RiskStatusLabel status={risk.status} />
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  {risk.status === 'pending' && (
                    <button
                      onClick={() => updateRiskStatus(risk.id, 'processing')}
                      className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      开始处理
                    </button>
                  )}
                  <button
                    onClick={() => resolveRisk(risk.id)}
                    className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded hover:bg-green-500/30 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    标记解决
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {device.status === 'graded' && (
        <div className="mb-6 bg-brand-card border-2 border-brand-accent/30 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-sm font-semibold text-gray-100">客户报价确认</h3>
                {device.grade && <GradeBadge grade={device.grade} />}
              </div>
              <p className="text-xs text-gray-400">
                检测建议价 <span className="text-cyan-300 font-mono font-bold text-lg">¥{(device.finalPrice ?? 0).toLocaleString()}</span>
                <span className="text-gray-600 mx-2">·</span>
                原预估价 <span className="text-gray-400 line-through font-mono">¥{device.estimatedPrice.toLocaleString()}</span>
                <span className="text-gray-600 mx-2">·</span>
                差额 <span className={cn('font-mono', (device.finalPrice ?? 0) - device.estimatedPrice >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {(device.finalPrice ?? 0) - device.estimatedPrice >= 0 ? '+' : ''}¥{((device.finalPrice ?? 0) - device.estimatedPrice).toLocaleString()}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmPrice}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm font-medium border border-green-500/30 hover:bg-green-500/30 transition-colors"
              >
                <Check className="w-4 h-4" />
                客户确认报价
              </button>
              <button
                onClick={() => setPriceRegretOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-medium border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                <X className="w-4 h-4" />
                客户反悔退回
              </button>
            </div>
          </div>
        </div>
      )}

      {(device.status === 'confirmed' || device.status === 'paying') && (
        <div className={cn(
          'mb-6 rounded-xl p-4 border-2',
          hasPaymentError
            ? 'bg-red-500/5 border-red-500/30'
            : device.status === 'paying'
              ? 'bg-green-500/5 border-green-500/30'
              : 'bg-cyan-500/5 border-cyan-500/30'
        )}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-sm font-semibold text-gray-100">
                  {device.status === 'paying' ? '已核验待打款' : '财务打款流程'}
                </h3>
                {hasPaymentError ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                    <AlertTriangle className="w-3 h-3" />
                    账号异常
                  </span>
                ) : device.status === 'paying' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    核验通过
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    <Shield className="w-3 h-3" />
                    待核验
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                打款金额 <span className="text-green-300 font-mono font-bold text-lg">¥{(device.finalPrice ?? 0).toLocaleString()}</span>
                <span className="text-gray-600 mx-2">·</span>
                收款账号 <span className="text-gray-300 font-mono">{device.paymentBank} {device.paymentAccount}</span>
                <span className="text-gray-600 mx-2">·</span>
                户名 <span className="text-gray-300">{device.customerName}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {device.status === 'confirmed' && !hasPaymentError && (
                <button
                  onClick={() => verifyPayment(device.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm font-medium border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  核验账号
                </button>
              )}
              {device.status === 'paying' && !hasPaymentError && (
                <button
                  onClick={() => executePayment([device.id])}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-accent/90 text-white rounded-lg text-sm font-medium hover:bg-brand-accent transition-colors shadow-lg shadow-brand-accent/20"
                >
                  <Wallet className="w-4 h-4" />
                  立即打款
                </button>
              )}
              {hasPaymentError && (
                <button
                  onClick={() => { setCurrentDevice(device.id); navigate('/finance') }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg text-sm font-medium border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  前往修复账号
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {device.status === 'returned' && (
        <div className="mb-6 bg-gray-500/5 border-2 border-gray-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                设备已退回
              </h3>
              <p className="text-xs text-gray-400">该设备因客户原因已退回，相关风险标记已自动解除</p>
            </div>
            <div className="text-xs text-gray-500">
              查看 <Link to="/risks" className="text-brand-accent hover:underline">风险面板</Link> 了解详情
            </div>
          </div>
        </div>
      )}

      {nextActionLabel && device.status !== 'graded' && (
        <div className="mb-6 bg-brand-accent/5 border-2 border-brand-accent/30 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-accent/20 flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-100">下一步操作</h3>
                <p className="text-xs text-gray-400">点击右侧按钮继续设备流转流程</p>
              </div>
            </div>
            <button
              onClick={handleGoNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white rounded-lg text-sm font-bold hover:bg-brand-accent/90 transition-colors shadow-lg shadow-brand-accent/20"
            >
              <Send className="w-4 h-4" />
              {nextActionLabel}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
          <h3 className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            设备信息
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">IMEI</span><span className="font-mono text-gray-200 text-xs">{device.imei}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">存储</span><span className="text-gray-200">{device.storage}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">颜色</span><span className="text-gray-200">{device.color}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">外观评分</span>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 rounded-full bg-brand-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${device.appearanceScore * 10}%`,
                      backgroundColor: device.appearanceScore >= 8 ? '#27ae60' : device.appearanceScore >= 5 ? '#f39c12' : '#c0392b',
                    }}
                  />
                </div>
                <span className="text-gray-200 font-mono text-xs">{device.appearanceScore}/10</span>
              </div>
            </div>
            <div className="pt-2 border-t border-brand-border/50">
              <div className="flex justify-between"><span className="text-gray-500">预估价</span><span className="font-mono text-gray-200">¥{device.estimatedPrice.toLocaleString()}</span></div>
              {device.finalPrice !== null && (
                <div className="flex justify-between mt-1"><span className="text-gray-500">最终价</span><span className="font-mono text-green-300 font-bold">¥{device.finalPrice.toLocaleString()}</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
          <h3 className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            客户信息
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">姓名</span><span className="text-gray-200 font-medium">{device.customerName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">客户编号</span><span className="font-mono text-gray-400 text-xs">{device.customerId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">电话</span><span className="font-mono text-gray-200 text-xs">{device.customerPhone}</span></div>
            <div className="pt-2 mt-2 border-t border-brand-border/50">
              <div className="flex justify-between"><span className="text-gray-500">收货员</span><span className="text-gray-200">{device.receivedBy}</span></div>
              {device.inspectedBy && (
                <div className="flex justify-between mt-1"><span className="text-gray-500">检测师</span><span className="text-gray-200">{device.inspectedBy}</span></div>
              )}
              {device.paidBy && (
                <div className="flex justify-between mt-1"><span className="text-gray-500">打款人</span><span className="text-gray-200">{device.paidBy}</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
          <h3 className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            打款信息
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">开户银行</span><span className="text-gray-200">{device.paymentBank}</span></div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500 pt-0.5">收款账号</span>
              <span className={cn('font-mono text-xs text-right', hasPaymentError ? 'text-red-400 font-bold' : 'text-gray-200')}>
                {device.paymentAccount}
                {hasPaymentError && <span className="block text-[10px] text-red-400/70 mt-0.5">（与户名不匹配）</span>}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-brand-border/50 space-y-1">
              {device.inspectedAt && (
                <div className="flex justify-between"><span className="text-gray-500">检测时间</span><span className="text-gray-200 text-xs">{device.inspectedAt}</span></div>
              )}
              {device.paidAt && (
                <div className="flex justify-between"><span className="text-gray-500">打款时间</span><span className="text-green-300 text-xs">{device.paidAt}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {report && (
        <div className="mb-6 bg-brand-card border border-brand-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-accent" />
              检测报告
              <span className="text-xs text-gray-500 ml-1 font-normal">· {report.submittedAt}</span>
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-green-400"><Check className="w-3 h-3" /> {passCount}</span>
              <span className="inline-flex items-center gap-1 text-red-400"><X className="w-3 h-3" /> {failCount}</span>
              <span className="inline-flex items-center gap-1 text-gray-500">跳过 {skipCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                  {category}
                  <span className="ml-auto font-normal text-gray-600">
                    {items.filter(i => i.result === 'pass').length}/{items.length}
                  </span>
                </h4>
                <div className="space-y-1.5">
                  {items.map((item, idx) => (
                    <div key={idx} className={cn(
                      'flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs',
                      item.result === 'pass' ? 'bg-green-500/5 border-green-500/20' :
                      item.result === 'fail' ? 'bg-red-500/5 border-red-500/20' :
                      'bg-gray-500/5 border-gray-500/20'
                    )}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0',
                          item.result === 'pass' ? 'bg-green-500/20 text-green-300' :
                          item.result === 'fail' ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-400'
                        )}>
                          {item.result === 'pass' ? '✓' : item.result === 'fail' ? '✗' : '—'}
                        </span>
                        <span className="text-gray-300 truncate">{item.name}</span>
                      </div>
                      {item.note && (
                        <span className="text-[10px] text-gray-500 truncate max-w-[140px]" title={item.note}>{item.note}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {report.hiddenDefects.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <h4 className="text-xs font-medium text-yellow-300 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                暗病/异常记录 ({report.hiddenDefects.length} 条)
              </h4>
              <ul className="space-y-1">
                {report.hiddenDefects.map((defect, idx) => (
                  <li key={idx} className="text-xs text-yellow-200/80 flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    {defect}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 bg-brand-surface rounded-lg border border-brand-border/50">
            <h4 className="text-xs font-medium text-gray-500 mb-1.5">判定依据</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{report.gradeReason}</p>
          </div>
        </div>
      )}

      {deviceRisks.length > 0 && (
        <div className="mb-6 bg-brand-card border border-brand-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">风险记录（含已解决）</h3>
          <div className="space-y-2">
            {deviceRisks.map((risk) => (
              <div key={risk.id} className="flex items-start gap-3 bg-brand-surface rounded-lg p-3 border border-brand-border/50">
                <RiskTypeBadge type={risk.type} />
                <RiskSeverityDot severity={risk.severity} />
                <span className="text-xs text-gray-300 flex-1 pt-0.5">{risk.description}</span>
                <RiskStatusLabel status={risk.status} />
                <div className="text-[10px] text-gray-500 shrink-0 pt-1">
                  <div>{risk.createdAt}</div>
                  {risk.resolvedAt && <div className="text-green-400/70">解决: {risk.resolvedAt}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 bg-brand-card border border-brand-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-accent" />
          添加备注 / 沟通记录
        </h3>
        <div className="flex items-start gap-3">
          <select
            value={noteRole}
            onChange={(e) => setNoteRole(e.target.value as Role)}
            className="shrink-0 bg-brand-surface border border-brand-border rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-brand-accent/50"
          >
            <option value="receiver">收货员 · 小李</option>
            <option value="inspector">检测师 · 老王</option>
            <option value="finance">财务 · 赵姐</option>
            <option value="manager">店长</option>
          </select>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="记录与客户的沟通内容、协商情况、补充说明..."
            rows={2}
            className="flex-1 bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-brand-accent/50 resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteContent.trim()}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              noteContent.trim()
                ? 'bg-brand-accent/90 text-white hover:bg-brand-accent'
                : 'bg-brand-card text-gray-500 cursor-not-allowed border border-brand-border'
            )}
          >
            <Send className="w-4 h-4" />
            记录
          </button>
        </div>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            操作历史 · 时间线回看
          </h3>
          <span className="text-xs text-gray-500">{deviceHistory.length} 条记录</span>
        </div>
        <Timeline entries={deviceHistory} />
      </div>

      {priceRegretOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPriceRegretOpen(false)} />
          <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <div>
                <h2 className="text-base font-bold text-gray-100">客户拒绝报价 / 申请退回</h2>
                <p className="text-xs text-gray-500 mt-0.5">标记后将自动创建「估价反悔」风险</p>
              </div>
              <button onClick={() => setPriceRegretOpen(false)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="text-xs text-gray-400">设备建议价</div>
                <div className="text-2xl font-mono font-bold text-green-300 mt-0.5">¥{(device.finalPrice ?? 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">客户 {device.customerName} · {device.id}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">反悔原因 / 协商记录</label>
                <textarea
                  value={priceRegretReason}
                  onChange={(e) => setPriceRegretReason(e.target.value)}
                  placeholder="详细说明客户拒绝原因、协商情况..."
                  rows={3}
                  className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-brand-accent/50 resize-none"
                />
              </div>
              <div className="pt-1 flex items-center gap-3">
                <button
                  onClick={handleReturn}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  同时退回设备
                </button>
                <button
                  onClick={handleSubmitRegret}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-brand-accent/90 text-white hover:bg-brand-accent transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  仅标记风险
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
