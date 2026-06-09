import { useEffect, useRef, useCallback } from 'react'
import { useFollowUpStore } from '@/store/useFollowUpStore'
import { useWarningStore } from '@/store/useWarningStore'
import { useRoleStore } from '@/store/useRoleStore'
import type { Warning } from '@/types'

interface GapItem {
  id: string
  type: 'followup_overtime' | 'warning_unassigned' | 'warning_overtime'
  label: string
  detail: string
}

export function useResponsibilityEngine() {
  const addToast = useRoleStore((s) => s.addToast)
  const lastEscalationRef = useRef<Set<string>>(new Set())

  const detectGaps = useCallback((): GapItem[] => {
    const followUps = useFollowUpStore.getState().followUps
    const warnings = useWarningStore.getState().warnings
    const gaps: GapItem[] = []
    const now = Date.now()

    for (const fu of followUps) {
      if (fu.status === 'completed' || fu.status === 'confirmed') continue
      const created = new Date(fu.createdAt).getTime()
      const deadlineMs = fu.deadlineHours * 60 * 60 * 1000
      if (now - created > deadlineMs && (fu.status === 'pending' || fu.status === 'in_progress' || fu.status === 'pending_review')) {
        gaps.push({
          id: `fu-ot-${fu.id}`,
          type: 'followup_overtime',
          label: `随访超时`,
          detail: `${fu.id} 已超过${fu.deadlineHours}小时未处理`,
        })
      }
    }

    for (const w of warnings) {
      if (w.status !== 'active' && w.status !== 'processing') continue

      if (!w.assigneeRole || !w.assigneeName) {
        gaps.push({
          id: `w-ua-${w.id}`,
          type: 'warning_unassigned',
          label: `预警无人负责`,
          detail: `${w.ruleName} 无负责人`,
        })
      }

      const triggered = new Date(w.triggeredAt).getTime()
      const overtimeMs = 24 * 60 * 60 * 1000
      if (now - triggered > overtimeMs && w.status === 'active') {
        gaps.push({
          id: `w-ot-${w.id}`,
          type: 'warning_overtime',
          label: `预警超时未处理`,
          detail: `${w.ruleName} 已超过24小时未处理`,
        })
      }
    }

    return gaps
  }, [])

  const escalate = useCallback(() => {
    const gaps = detectGaps()
    const newEscalations = new Set<string>()

    for (const gap of gaps) {
      newEscalations.add(gap.id)
      if (!lastEscalationRef.current.has(gap.id)) {
        addToast('error', `${gap.label}：${gap.detail}`)
      }
    }

    lastEscalationRef.current = newEscalations
  }, [detectGaps, addToast])

  return { detectGaps, escalate }
}

export function getFollowUpWarningLink(followUpId: string): Warning | null {
  const warnings = useWarningStore.getState().warnings
  return warnings.find((w) => w.followUpId === followUpId && (w.status === 'active' || w.status === 'processing')) ?? null
}

export function getWarningFollowUpLink(warningId: string): string | null {
  const warning = useWarningStore.getState().warnings.find((w) => w.id === warningId)
  if (!warning) return null
  const followUp = useFollowUpStore.getState().followUps.find((fu) => fu.id === warning.followUpId)
  return followUp ? followUp.id : null
}
