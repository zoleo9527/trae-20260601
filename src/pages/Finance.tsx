import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, AlertCircle, CheckCircle2, Shield, DollarSign, X, Edit2, Check, AlertTriangle, CreditCard, UserCheck, ExternalLink } from 'lucide-react'
import { useDeviceStore } from '@/store/deviceStore'
import StatusBadge from '@/components/StatusBadge'
import GradeBadge from '@/components/GradeBadge'
import { RiskTypeBadge, RiskSeverityDot } from '@/components/RiskBadge'
import { cn } from '@/lib/utils'
import type { Device } from '@/types'
import StatCard from '@/components/StatCard'

type TabKey = 'pending' | 'completed'

function hasPaymentError(deviceId: string, riskFlags: { deviceId: string; type: string; status: string }[]) {
  return riskFlags.some((r) => r.deviceId === deviceId && r.type === 'payment_error' && r.status !== 'resolved')
}

function getDeviceRisks(deviceId: string, riskFlags: { deviceId: string; type: string; status: string; severity: string; description: string }[]) {
  return riskFlags.filter((r) => r.deviceId === deviceId && r.status !== 'resolved')
}

export default function Finance() {
  const navigate = useNavigate()
  const { devices, riskFlags, selectedDeviceIds, toggleDeviceSelection, setSelectedDeviceIds, clearSelection, executePayment, updatePaymentAccount, verifyPayment, flagRisk, currentDeviceId, setCurrentDevice } = useDeviceStore()
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAccount, setEditAccount] = useState({ account: '', bank: '' })
  const [verifyDialog, setVerifyDialog] = useState<string | null>(null)

  useEffect(() => {
    if (!currentDeviceId) return
    const d = devices.find(x => x.id === currentDeviceId)
    if (!d) return
    if (d.status === 'confirmed' || d.status === 'paying') {
      setActiveTab('pending')
      if (!selectedDeviceIds.includes(currentDeviceId)) {
        toggleDeviceSelection(currentDeviceId)
      }
      const hasError = riskFlags.some(r => r.deviceId === currentDeviceId && r.type === 'payment_error' && r.status !== 'resolved')
      if (hasError) {
        setEditingId(currentDeviceId)
        setEditAccount({ account: d.paymentAccount, bank: d.paymentBank })
      }
    } else if (d.status === 'completed') {
      setActiveTab('completed')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDeviceId])

  const pendingDevices = useMemo(
    () => devices.filter((d) => d.status === 'confirmed' || d.status === 'paying'),
    [devices]
  )

  const completedDevices = useMemo(
    () => devices.filter((d) => d.status === 'completed'),
    [devices]
  )

  const pendingCount = pendingDevices.length
  const pendingTotal = pendingDevices.reduce((sum, d) => sum + (d.finalPrice ?? 0), 0)
  const errorAccountCount = pendingDevices.filter((d) => hasPaymentError(d.id, riskFlags)).length
  const verifiedCount = pendingDevices.filter((d) => d.status === 'paying' && !hasPaymentError(d.id, riskFlags)).length

  const selectedInTab = useMemo(() => {
    const tabIds = new Set(pendingDevices.map((d) => d.id))
    return selectedDeviceIds.filter((id) => tabIds.has(id))
  }, [selectedDeviceIds, pendingDevices])

  const selectedTotal = useMemo(
    () => pendingDevices.filter((d) => selectedInTab.includes(d.id)).reduce((sum, d) => sum + (d.finalPrice ?? 0), 0),
    [pendingDevices, selectedInTab]
  )

  const selectedWithError = useMemo(
    () => selectedInTab.filter((id) => hasPaymentError(id, riskFlags)),
    [selectedInTab, riskFlags]
  )

  const payableSelected = useMemo(
    () => selectedInTab.filter((id) => !hasPaymentError(id, riskFlags) && devices.find((d) => d.id === id)?.status === 'paying'),
    [selectedInTab, riskFlags, devices]
  )

  const allPendingSelected = pendingDevices.length > 0 && selectedInTab.length === pendingDevices.length

  function handleToggleAll() {
    if (allPendingSelected) {
      setSelectedDeviceIds([])
    } else {
      setSelectedDeviceIds(pendingDevices.map((d) => d.id))
    }
  }

  function handleVerify(id: string) {
    setVerifyDialog(id)
  }

  function confirmVerify(id: string) {
    verifyPayment(id)
    setVerifyDialog(null)
    if (id === currentDeviceId) {
      setTimeout(() => navigate(`/device/${id}`), 600)
    }
  }

  function handleOpenEdit(device: Device) {
    setEditingId(device.id)
    setEditAccount({ account: device.paymentAccount, bank: device.paymentBank })
  }

  function handleSaveEdit() {
    if (!editingId || !editAccount.account.trim() || !editAccount.bank.trim()) return
    updatePaymentAccount(editingId, editAccount.account.trim(), editAccount.bank.trim())
    setEditingId(null)
    if (editingId === currentDeviceId) {
      setTimeout(() => navigate(`/device/${editingId}`), 600)
    }
  }

  function handleConfirmPayment(id: string) {
    executePayment([id])
    if (id === currentDeviceId) {
      setTimeout(() => navigate(`/device/${id}`), 600)
    }
  }

  function handleBatchPayment() {
    if (payableSelected.length === 0) return
    const hadCurrent = currentDeviceId && payableSelected.includes(currentDeviceId)
    executePayment(payableSelected)
    clearSelection()
    if (hadCurrent) {
      setTimeout(() => navigate(`/device/${currentDeviceId}`), 600)
    }
  }

  function handleMarkAbnormal(id: string, reason: string) {
    flagRisk(id, 'payment_error', reason, 'high')
  }

  const currentDevice = useMemo(() => {
    if (!currentDeviceId) return null
    const d = devices.find(x => x.id === currentDeviceId)
    if (!d) return null
    if (d.status === 'confirmed' || d.status === 'paying' || d.status === 'completed') return d
    return null
  }, [currentDeviceId, devices])

  return (
    <div className="p-6 space-y-6">
      {currentDevice && (
        <div className="bg-gradient-to-r from-cyan-500/15 via-cyan-500/8 to-transparent border-2 border-cyan-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-[10px] font-bold tracking-wide">
                    · 当前处理设备 ·
                  </span>
                  <StatusBadge status={currentDevice.status} size="sm" />
                  {currentDevice.grade && <GradeBadge grade={currentDevice.grade} size="sm" />}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-bold text-gray-100 truncate">{currentDevice.brand} {currentDevice.model}</span>
                  <span className="text-xs text-gray-500 font-mono">{currentDevice.id}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>客户: <span className="text-gray-200">{currentDevice.customerName}</span></span>
                  <span>金额: <span className="text-green-300 font-mono font-bold">¥{(currentDevice.finalPrice ?? 0).toLocaleString()}</span></span>
                </div>
              </div>
            </div>
            <Link
              to={`/device/${currentDevice.id}`}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-xs text-gray-200 font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              返回详情
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">财务工作台</h1>
          <p className="text-sm text-gray-400 mt-1">核验账号 → 确认打款 → 完成结算</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="待核验"
          value={pendingCount - verifiedCount}
          icon={<UserCheck className="w-5 h-5 text-yellow-300" />}
          color="bg-yellow-500/20"
        />
        <StatCard
          label="核验通过待打款"
          value={verifiedCount}
          icon={<Wallet className="w-5 h-5 text-cyan-300" />}
          color="bg-cyan-500/20"
        />
        <StatCard
          label="待打款总额"
          value={`¥${pendingTotal.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-green-300" />}
          color="bg-green-500/20"
        />
        <StatCard
          label="账号异常"
          value={errorAccountCount}
          icon={<AlertCircle className="w-5 h-5 text-red-300" />}
          color="bg-red-500/20"
        />
      </div>

      <div className="flex gap-1 bg-brand-surface rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'pending'
              ? 'bg-brand-info text-white'
              : 'text-gray-400 hover:text-gray-200'
          )}
        >
          待打款
          {pendingCount > 0 && (
            <span className={cn(
              'ml-2 text-xs px-1.5 py-0.5 rounded-full font-mono',
              activeTab === 'pending' ? 'bg-white/20' : 'bg-brand-card text-gray-300'
            )}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'completed'
              ? 'bg-brand-info text-white'
              : 'text-gray-400 hover:text-gray-200'
          )}
        >
          已打款
          {completedDevices.length > 0 && (
            <span className={cn(
              'ml-2 text-xs px-1.5 py-0.5 rounded-full font-mono',
              activeTab === 'completed' ? 'bg-white/20' : 'bg-brand-card text-gray-300'
            )}>
              {completedDevices.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="bg-brand-card border border-brand-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-gray-400">
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={handleToggleAll}
                      className="rounded border-gray-500 bg-brand-surface text-brand-accent focus:ring-brand-accent focus:ring-offset-0"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">设备</th>
                  <th className="px-4 py-3 text-left font-medium">等级</th>
                  <th className="px-4 py-3 text-left font-medium">最终估价</th>
                  <th className="px-4 py-3 text-left font-medium">客户</th>
                  <th className="px-4 py-3 text-left font-medium">收款账号</th>
                  <th className="px-4 py-3 text-left font-medium">风险</th>
                  <th className="px-4 py-3 text-left font-medium">流程状态</th>
                  <th className="px-4 py-3 text-left font-medium w-56">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {pendingDevices.map((device) => {
                  const hasError = hasPaymentError(device.id, riskFlags)
                  const deviceRiskList = getDeviceRisks(device.id, riskFlags)
                  const isSelected = selectedDeviceIds.includes(device.id)
                  const isVerified = device.status === 'paying' && !hasError
                  return (
                    <tr
                      key={device.id}
                      className={cn(
                        'transition-colors',
                        hasError
                          ? 'bg-red-500/5'
                          : isSelected
                            ? 'bg-brand-info/30'
                            : 'hover:bg-brand-surface/50'
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDeviceSelection(device.id)}
                          className="rounded border-gray-500 bg-brand-surface text-brand-accent focus:ring-brand-accent focus:ring-offset-0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <Link to={`/device/${device.id}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-xs">
                            {device.id}
                          </Link>
                          <div className="text-gray-200 mt-0.5">{device.brand} {device.model}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {device.grade && <GradeBadge grade={device.grade} />}
                      </td>
                      <td className="px-4 py-3 text-green-300 font-mono font-semibold">
                        ¥{(device.finalPrice ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-200">{device.customerName}</div>
                        <div className="text-xs text-gray-500 font-mono">{device.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('font-mono text-xs', hasError ? 'text-red-400' : 'text-gray-300')}>
                          {device.paymentBank}
                        </div>
                        <div className={cn('font-mono text-xs mt-0.5', hasError ? 'text-red-400 font-bold' : 'text-gray-400')}>
                          {device.paymentAccount}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {deviceRiskList.length > 0 ? (
                          <div className="space-y-1">
                            {deviceRiskList.map((r) => (
                              <div key={(r as any).id} className="flex items-center gap-1">
                                <RiskTypeBadge type={(r as any).type} />
                                <RiskSeverityDot severity={(r as any).severity} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">无</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasError ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                            <AlertCircle className="w-3 h-3" />
                            账号异常
                          </span>
                        ) : isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            核验通过
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            <Shield className="w-3 h-3" />
                            待核验
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hasError ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(device)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                修复账号
                              </button>
                              <Link
                                to={`/device/${device.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-brand-info/50 text-cyan-300 border border-cyan-500/30 hover:bg-brand-info transition-colors"
                              >
                                查看
                              </Link>
                            </>
                          ) : isVerified ? (
                            <>
                              <button
                                onClick={() => handleConfirmPayment(device.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-brand-accent/20 text-brand-accent border border-brand-accent/30 hover:bg-brand-accent/30 transition-colors"
                              >
                                <Wallet className="w-3 h-3" />
                                打款
                              </button>
                              <button
                                onClick={() => handleMarkAbnormal(device.id, `财务手动标记账号异常，请联系客户${device.customerName}核实`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25 transition-colors"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                标记异常
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleVerify(device.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                              >
                                <CreditCard className="w-3 h-3" />
                                核验账号
                              </button>
                              <button
                                onClick={() => handleOpenEdit(device)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-brand-card/80 text-gray-400 border border-brand-border hover:text-gray-200 hover:bg-brand-card transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                编辑
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {pendingDevices.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      暂无待打款设备
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="bg-brand-card border border-brand-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-gray-400">
                  <th className="px-4 py-3 text-left font-medium">设备</th>
                  <th className="px-4 py-3 text-left font-medium">等级</th>
                  <th className="px-4 py-3 text-left font-medium">最终估价</th>
                  <th className="px-4 py-3 text-left font-medium">客户</th>
                  <th className="px-4 py-3 text-left font-medium">收款账号</th>
                  <th className="px-4 py-3 text-left font-medium">打款时间</th>
                  <th className="px-4 py-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {completedDevices.map((device) => (
                  <tr
                    key={device.id}
                    className="hover:bg-brand-surface/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <Link to={`/device/${device.id}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-xs">
                          {device.id}
                        </Link>
                        <div className="text-gray-200 mt-0.5">{device.brand} {device.model}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {device.grade && <GradeBadge grade={device.grade} />}
                    </td>
                    <td className="px-4 py-3 text-green-300 font-mono font-semibold">
                      ¥{(device.finalPrice ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-200">{device.customerName}</div>
                      <div className="text-xs text-gray-500 font-mono">{device.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">{device.paymentBank}</div>
                      <div className="font-mono text-xs text-gray-500 mt-0.5">{device.paymentAccount}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {device.paidAt ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/device/${device.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-brand-info/50 text-cyan-300 border border-cyan-500/30 hover:bg-brand-info transition-colors"
                      >
                        <Shield className="w-3 h-3" />
                        详情
                      </Link>
                    </td>
                  </tr>
                ))}
                {completedDevices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      暂无已打款设备
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pending' && selectedInTab.length > 0 && (
        <div className="fixed bottom-0 left-56 right-0 bg-brand-surface/98 backdrop-blur-sm border-t border-brand-border px-6 py-3 flex items-center justify-between z-50">
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-300">
              已选择 <span className="text-white font-mono font-bold">{selectedInTab.length}</span> 台
            </span>
            <span className="text-sm text-gray-300">
              合计 <span className="text-green-300 font-mono font-bold">¥{selectedTotal.toLocaleString()}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {selectedWithError.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded">
                <AlertCircle className="w-3.5 h-3.5" />
                {selectedWithError.length} 台账号异常，已跳过
              </span>
            )}
            {payableSelected.length < selectedInTab.length && selectedWithError.length === 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded">
                <Shield className="w-3.5 h-3.5" />
                {selectedInTab.length - payableSelected.length} 台未完成账号核验
              </span>
            )}
            <button
              onClick={handleBatchPayment}
              disabled={payableSelected.length === 0}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors',
                payableSelected.length > 0
                  ? 'bg-brand-accent text-white hover:bg-brand-accent/90 shadow-lg shadow-brand-accent/20'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              )}
            >
              <Wallet className="w-4 h-4" />
              批量打款
              {payableSelected.length > 0 && (
                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs font-mono">
                  {payableSelected.length}
                </span>
              )}
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-brand-card transition-colors"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {editingId && (() => {
        const device = devices.find((d) => d.id === editingId)
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingId(null)} />
            <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                <div>
                  <h2 className="text-base font-bold text-gray-100">修复收款账号</h2>
                  {device && <p className="text-xs text-gray-500 mt-0.5">{device.id} · {device.brand} {device.model} · {device.customerName}</p>}
                </div>
                <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                  <div className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-orange-300 font-medium mb-0.5">当前账号与客户信息不匹配</div>
                      <div className="text-gray-400">
                        <span className="text-gray-500">户名：</span>{device?.paymentBank} <span className="font-mono">{device?.paymentAccount}</span>
                      </div>
                      <div className="text-gray-400">
                        <span className="text-gray-500">客户：</span>{device?.customerName}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">开户银行 *</label>
                  <input
                    type="text"
                    value={editAccount.bank}
                    onChange={(e) => setEditAccount((p) => ({ ...p, bank: e.target.value }))}
                    placeholder="如：招商银行"
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-brand-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">收款账号 *</label>
                  <input
                    type="text"
                    value={editAccount.account}
                    onChange={(e) => setEditAccount((p) => ({ ...p, account: e.target.value }))}
                    placeholder="银行卡号"
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-brand-accent/50 font-mono"
                  />
                </div>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editAccount.account.trim() || !editAccount.bank.trim()}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors',
                      editAccount.account.trim() && editAccount.bank.trim()
                        ? 'bg-brand-accent text-white hover:bg-brand-accent/90'
                        : 'bg-brand-card text-gray-500 cursor-not-allowed border border-brand-border'
                    )}
                  >
                    <Check className="w-4 h-4" />
                    保存并解除异常
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 border border-brand-border transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {verifyDialog && (() => {
        const device = devices.find((d) => d.id === verifyDialog)
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setVerifyDialog(null)} />
            <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                <div>
                  <h2 className="text-base font-bold text-gray-100">账号核验确认</h2>
                  {device && <p className="text-xs text-gray-500 mt-0.5">请仔细核对后再确认</p>}
                </div>
                <button onClick={() => setVerifyDialog(null)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-brand-card rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">客户姓名</div>
                    <div className="text-gray-100 font-medium">{device?.customerName}</div>
                  </div>
                  <div className="p-3 bg-brand-card rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">联系电话</div>
                    <div className="text-gray-100 font-mono">{device?.customerPhone}</div>
                  </div>
                  <div className="p-3 bg-brand-card rounded-lg col-span-2">
                    <div className="text-xs text-gray-500 mb-1">收款账号</div>
                    <div className="text-gray-100 font-mono">{device?.paymentBank} · {device?.paymentAccount}</div>
                  </div>
                  <div className="p-3 bg-brand-card rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">打款金额</div>
                    <div className="text-green-300 font-mono font-bold text-lg">¥{(device?.finalPrice ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-brand-card rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">设备编号</div>
                    <div className="text-cyan-300 font-mono">{device?.id}</div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2 text-xs text-yellow-200/80">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-yellow-300 font-medium mb-0.5">核验确认</div>
                      <div>确认以上收款账号与客户姓名一致，可用于本次打款。账号核验通过后将进入待打款列表。</div>
                    </div>
                  </div>
                </div>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    onClick={() => confirmVerify(verifyDialog)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    确认核验通过
                  </button>
                  <button
                    onClick={() => setVerifyDialog(null)}
                    className="px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 border border-brand-border transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
