import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react'
import { useRoleStore } from '@/store/useRoleStore'
import { useWarningStore } from '@/store/useWarningStore'
import { useFollowUpStore } from '@/store/useFollowUpStore'
import RoleSwitcher from '@/components/RoleSwitcher'
import WarningCard from '@/components/WarningCard'
import BatchActionBar from '@/components/BatchActionBar'
import Toast from '@/components/Toast'
import { WARNING_LEVEL_LABELS, WARNING_STATUS_LABELS, STATUS_LABELS } from '@/types'
import type { WarningLevel, WarningActionType } from '@/types'
import { useResponsibilityEngine } from '@/hooks/useResponsibilityEngine'

const LEVEL_ORDER: WarningLevel[] = ['red', 'orange', 'yellow']

export default function WarningCenter() {
  const navigate = useNavigate()
  const currentRole = useRoleStore((s) => s.currentRole)
  const addToast = useRoleStore((s) => s.addToast)
  const warnings = useWarningStore((s) => s.warnings)
  const selectedWarningIds = useWarningStore((s) => s.selectedWarningIds)
  const toggleSelectWarning = useWarningStore((s) => s.toggleSelectWarning)
  const selectAllWarnings = useWarningStore((s) => s.selectAllWarnings)
  const clearSelection = useWarningStore((s) => s.clearSelection)
  const executeAction = useWarningStore((s) => s.executeAction)
  const batchAction = useWarningStore((s) => s.batchAction)
  const selectFollowUp = useFollowUpStore((s) => s.selectFollowUp)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [levelFilter, setLevelFilter] = useState<WarningLevel | 'all'>('all')
  const { detectGaps } = useResponsibilityEngine()
  const gaps = detectGaps()

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredWarnings = useMemo(() => {
    if (levelFilter === 'all') return warnings
    return warnings.filter((w) => w.level === levelFilter)
  }, [warnings, levelFilter])

  const groupedWarnings = useMemo(() => {
    const groups: Record<WarningLevel, typeof warnings> = {
      red: [],
      orange: [],
      yellow: [],
    }
    for (const w of filteredWarnings) {
      groups[w.level].push(w)
    }
    return groups
  }, [filteredWarnings])

  const stats = useMemo(() => {
    const active = warnings.filter((w) => w.status === 'active').length
    const processing = warnings.filter((w) => w.status === 'processing').length
    const resolved = warnings.filter((w) => w.status === 'resolved').length
    const returned = warnings.filter((w) => w.status === 'returned').length
    return { active, processing, resolved, returned }
  }, [warnings])

  const handleAction = (warningId: string, actionType: WarningActionType) => {
    const ok = executeAction(warningId, actionType, currentRole)
    if (ok) {
      const labels: Record<WarningActionType, string> = {
        remind: '已触发提醒',
        confirm: '已确认处理',
        return: '已退回上一环节',
        assign: '已派单',
        batch_confirm: '已批量确认',
        batch_assign: '已批量派单',
        batch_return: '已批量退回',
      }
      addToast('success', labels[actionType])
    }
  }

  const handleBatchAction = (actionType: WarningActionType) => {
    const count = batchAction(actionType, currentRole)
    const labels: Record<string, string> = {
      remind: '提醒',
      confirm: '确认',
      return: '退回',
    }
    addToast('success', `已批量${labels[actionType] || '处理'}${count}条预警`)
  }

  const handleNavigateToFollowUp = (followUpId: string) => {
    selectFollowUp(followUpId)
    navigate('/followup')
  }

  const levelColors: Record<WarningLevel, { bg: string; border: string; dot: string; text: string }> = {
    red: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500', text: 'text-orange-700' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500', text: 'text-yellow-700' },
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/followup')}
                className="flex items-center gap-1 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回工作台
              </button>
              <div className="w-px h-5 bg-slate-700" />
              <h1 className="text-lg font-bold">指标预警中心</h1>
              <RoleSwitcher />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border bg-white p-3">
            <div className="text-xs text-gray-500">待处理</div>
            <div className="text-2xl font-bold text-red-600">{stats.active}</div>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <div className="text-xs text-gray-500">处理中</div>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <div className="text-xs text-gray-500">已解决</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.resolved}</div>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <div className="text-xs text-gray-500">已退回</div>
            <div className="text-2xl font-bold text-orange-600">{stats.returned}</div>
          </div>
        </div>

        {gaps.filter((g) => g.type === 'warning_overtime' || g.type === 'warning_unassigned').length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">预警责任空档</p>
              <ul className="mt-1 space-y-0.5">
                {gaps.filter((g) => g.type === 'warning_overtime' || g.type === 'warning_unassigned').slice(0, 3).map((gap) => (
                  <li key={gap.id} className="text-xs text-red-600">
                    {gap.label} — {gap.detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500 mr-2">预警级别</span>
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              levelFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部
          </button>
          {LEVEL_ORDER.map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                levelFilter === l ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {WARNING_LEVEL_LABELS[l]}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {LEVEL_ORDER.map((level) => {
            const group = groupedWarnings[level]
            if (group.length === 0) return null
            const colors = levelColors[level]
            return (
              <div key={level}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <h3 className={`text-sm font-semibold ${colors.text}`}>
                      {WARNING_LEVEL_LABELS[level]}
                    </h3>
                    <span className="text-xs text-slate-400">({group.length})</span>
                  </div>
                  <button
                    onClick={() => selectAllWarnings(group.map((w) => w.id))}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    全选
                  </button>
                </div>
                <div className="space-y-2">
                  {group.map((w) => (
                    <WarningCard
                      key={w.id}
                      warning={w}
                      isSelected={selectedWarningIds.includes(w.id)}
                      onToggleSelect={() => toggleSelectWarning(w.id)}
                      onAction={(actionType) => handleAction(w.id, actionType)}
                      expanded={expandedIds.has(w.id)}
                      onToggleExpand={() => toggleExpand(w.id)}
                      onNavigateToFollowUp={handleNavigateToFollowUp}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedWarningIds.length}
        onBatchAction={handleBatchAction}
        onClearSelection={clearSelection}
      />

      <Toast />
    </div>
  )
}
