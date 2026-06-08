import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, CheckSquare, Square, Save } from 'lucide-react'
import { useAppStore } from '@/store/index'
import type { InspectionDraft } from '@/types'

const DEFAULT_LINEN = [
  { itemType: '床单', expectedCount: 2 },
  { itemType: '被套', expectedCount: 1 },
  { itemType: '枕套', expectedCount: 4 },
  { itemType: '浴巾', expectedCount: 3 },
  { itemType: '面巾', expectedCount: 2 },
  { itemType: '地巾', expectedCount: 1 },
]

const QUICK_ISSUES = ['花洒问题', '空调问题', '电视问题', '门锁问题', '灯具问题']

interface LinenItem {
  itemType: string
  expectedCount: number
  actualCount: number
  action: 'none' | 'replace' | 'replenish'
}

export default function Inspection() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const {
    inspectionTasks,
    rooms,
    startInspection,
    completeInspection,
    updateLinenRecords,
    saveInspectionDraft,
    inspectionDrafts,
  } = useAppStore()

  const task = inspectionTasks.find((t) => t.id === taskId)
  const room = task ? rooms.find((r) => r.id === task.roomId) : undefined

  const existingDraft = taskId ? inspectionDrafts[taskId] : undefined

  const [facilityOk, setFacilityOk] = useState(existingDraft?.facilityOk ?? true)
  const [cleanlinessOk, setCleanlinessOk] = useState(existingDraft?.cleanlinessOk ?? true)
  const [issues, setIssues] = useState(existingDraft?.issues ?? '')
  const [linenItems, setLinenItems] = useState<LinenItem[]>(
    existingDraft?.linenItems ?? DEFAULT_LINEN.map((l) => ({ ...l, actualCount: l.expectedCount, action: 'none' as const }))
  )
  const [minibarInitialStatus, setMinibarInitialStatus] = useState<'ok' | 'partial' | 'empty'>(
    existingDraft?.minibarInitialStatus ?? 'ok'
  )

  const [expanded, setExpanded] = useState({
    facility: true,
    cleanliness: true,
    linen: true,
    minibar: true,
  })

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(existingDraft?.savedAt ?? null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (task?.status === 'assigned' && taskId) {
      startInspection(taskId)
    }
  }, [task?.status, taskId, startInspection])

  const handleSaveDraft = useCallback(() => {
    if (!taskId || !task) return
    const draft: InspectionDraft = {
      taskId,
      roomId: task.roomId,
      facilityOk,
      cleanlinessOk,
      issues,
      minibarInitialStatus,
      linenItems,
      savedAt: new Date().toISOString(),
    }
    saveInspectionDraft(draft)
    setLastSavedAt(draft.savedAt)
  }, [taskId, task, facilityOk, cleanlinessOk, issues, minibarInitialStatus, linenItems, saveInspectionDraft])

  useEffect(() => {
    if (!taskId || !task) return
    const timer = setInterval(() => {
      handleSaveDraft()
    }, 30000)
    return () => clearInterval(timer)
  }, [taskId, task, handleSaveDraft])

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleLinenActualChange = (index: number, value: number) => {
    setLinenItems((prev) => {
      const next = [...prev]
      const item = { ...next[index], actualCount: value }
      item.action = value < item.expectedCount ? 'replenish' : 'none'
      next[index] = item
      return next
    })
  }

  const handleLinenActionChange = (index: number, action: 'none' | 'replace' | 'replenish') => {
    setLinenItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], action }
      return next
    })
  }

  const linenStatus: 'ok' | 'missing' | 'extra' = (() => {
    const allMatch = linenItems.every((l) => l.actualCount === l.expectedCount)
    if (allMatch) return 'ok'
    const anyMissing = linenItems.some((l) => l.actualCount < l.expectedCount)
    if (anyMissing) return 'missing'
    return 'extra'
  })()

  const handleQuickIssue = (label: string) => {
    setIssues((prev) => (prev ? `${prev}、${label}` : label))
  }

  const handleSubmit = () => {
    if (!taskId || !task) return
    setSubmitting(true)

    try {
      completeInspection(taskId, {
        taskId,
        roomId: task.roomId,
        facilityOk,
        cleanlinessOk,
        linenStatus,
        minibarInitialStatus,
        issues: facilityOk && cleanlinessOk ? '' : issues,
      })

      updateLinenRecords(
        taskId,
        linenItems.map((l) => ({
          taskId,
          roomId: task.roomId,
          itemType: l.itemType,
          expectedCount: l.expectedCount,
          actualCount: l.actualCount,
          action: l.action,
        }))
      )

      navigate(`/attendant/minibar/${taskId}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!task || !room) {
    return (
      <div className="py-12 text-center text-gray-400">任务不存在</div>
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-2 text-sm text-gray-500">
        <span
          className="cursor-pointer text-[#1E3A5F] hover:underline"
          onClick={() => navigate('/attendant')}
        >
          工作台
        </span>
        <span className="mx-1">&gt;</span>
        <span>{room.number} 查房</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">{room.number} 退房查房</h1>
        {lastSavedAt && (
          <span className="text-xs text-gray-400">
            草稿已保存于 {new Date(lastSavedAt).toLocaleTimeString('zh-CN')}
          </span>
        )}
      </div>

      {existingDraft && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Save size={16} />
          已恢复上次保存的草稿
        </div>
      )}

      <Section
        title="设施检查"
        expanded={expanded.facility}
        onToggle={() => toggleSection('facility')}
      >
        <label className="flex cursor-pointer items-center gap-2" onClick={() => setFacilityOk(!facilityOk)}>
          {facilityOk ? (
            <CheckSquare size={20} className="text-[#1E3A5F]" />
          ) : (
            <Square size={20} className="text-gray-400" />
          )}
          <span className="text-sm font-medium">设施完好</span>
        </label>
        {!facilityOk && (
          <div className="mt-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_ISSUES.map((label) => (
                <button
                  key={label}
                  onClick={() => handleQuickIssue(label)}
                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700 transition-colors hover:bg-amber-100"
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder="请描述设施问题..."
              className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-[#1E3A5F] focus:outline-none"
              rows={3}
            />
          </div>
        )}
      </Section>

      <Section
        title="卫生检查"
        expanded={expanded.cleanliness}
        onToggle={() => toggleSection('cleanliness')}
      >
        <label className="flex cursor-pointer items-center gap-2" onClick={() => setCleanlinessOk(!cleanlinessOk)}>
          {cleanlinessOk ? (
            <CheckSquare size={20} className="text-[#1E3A5F]" />
          ) : (
            <Square size={20} className="text-gray-400" />
          )}
          <span className="text-sm font-medium">卫生达标</span>
        </label>
        {!cleanlinessOk && (
          <div className="mt-3">
            <textarea
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder="请描述卫生问题..."
              className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-[#1E3A5F] focus:outline-none"
              rows={3}
            />
          </div>
        )}
      </Section>

      <Section
        title="布草清点"
        expanded={expanded.linen}
        onToggle={() => toggleSection('linen')}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-gray-500">
              <th className="pb-2 text-left font-medium">物品</th>
              <th className="pb-2 text-center font-medium">应有</th>
              <th className="pb-2 text-center font-medium">实有</th>
              <th className="pb-2 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {linenItems.map((item, i) => (
              <tr key={item.itemType} className="border-b border-gray-100 last:border-0">
                <td className="py-2 font-medium">{item.itemType}</td>
                <td className="py-2 text-center text-gray-600">{item.expectedCount}</td>
                <td className="py-2 text-center">
                  <input
                    type="number"
                    min={0}
                    value={item.actualCount}
                    onChange={(e) => handleLinenActualChange(i, parseInt(e.target.value) || 0)}
                    className="w-16 rounded border border-gray-200 px-2 py-1 text-center text-sm focus:border-[#1E3A5F] focus:outline-none"
                  />
                </td>
                <td className="py-2 text-center">
                  <select
                    value={item.action}
                    onChange={(e) =>
                      handleLinenActionChange(i, e.target.value as 'none' | 'replace' | 'replenish')
                    }
                    className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-[#1E3A5F] focus:outline-none"
                  >
                    <option value="none">无</option>
                    <option value="replace">更换</option>
                    <option value="replenish">补充</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-gray-500">布草状态：</span>
          <span
            className={
              linenStatus === 'ok'
                ? 'font-medium text-emerald-600'
                : linenStatus === 'missing'
                  ? 'font-medium text-amber-600'
                  : 'font-medium text-blue-600'
            }
          >
            {linenStatus === 'ok' ? '✓ 正常' : linenStatus === 'missing' ? '缺少' : '多余'}
          </span>
        </div>
      </Section>

      <Section
        title="迷你吧初查"
        expanded={expanded.minibar}
        onToggle={() => toggleSection('minibar')}
      >
        <div className="space-y-3">
          {([
            { value: 'ok', label: '完整' },
            { value: 'partial', label: '部分消耗' },
            { value: 'empty', label: '已清空' },
          ] as const).map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
            >
              <input
                type="radio"
                name="minibarInitialStatus"
                value={opt.value}
                checked={minibarInitialStatus === opt.value}
                onChange={() => setMinibarInitialStatus(opt.value)}
                className="h-4 w-4 accent-[#1E3A5F]"
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </Section>

      <div className="fixed bottom-0 right-0 left-64 border-t border-gray-200 bg-white px-6 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Save size={14} />
            保存草稿
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-[#1E3A5F] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#16304f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交查房结果'}
          </button>
          <span className="ml-auto text-xs text-gray-400">提交后自动进入迷你吧核对</span>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-[#1E3A5F]"
      >
        <span>{title}</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && <div className="border-t border-gray-100 px-4 py-4">{children}</div>}
    </div>
  )
}
