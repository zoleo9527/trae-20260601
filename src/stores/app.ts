import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Registration, Seat, SeatAllocation, HandoverLog, Role, DashboardStats, SeatAvailability } from '@/types'

export const useAppStore = defineStore('app', () => {
  const currentRole = ref<Role>('网管')
  const currentName = ref('操作员')
  const registrations = ref<Registration[]>([])
  const seats = ref<Seat[]>([])
  const allocations = ref<SeatAllocation[]>([])
  const stats = ref<DashboardStats>({ pending: 0, overdue: 0, conflicts: 0, my_pending: 0, escalated: 0 })
  const recentLogs = ref<HandoverLog[]>([])
  const alertTimeline = ref<HandoverLog[]>([])
  const rolePressure = ref<Record<string, { pending_count: number; avg_handover_minutes: number | null; longest_stall: { registration_id: string; event_name: string; team_name: string; stall_minutes: number } | null; today_reminder_count: number }>>({})
  const overdueTop = ref<Registration[]>([])
  const reminderFeedback = ref<Record<string, unknown>[]>([])
  const lastRefreshAt = ref<Date | null>(null)
  const refreshCooldown = ref(false)
  const loading = ref(false)

  function setRole(role: Role) {
    currentRole.value = role
  }

  function setName(name: string) {
    currentName.value = name
  }

  async function fetchRegistrations() {
    try {
      const res = await fetch('/api/registrations')
      const data = await res.json()
      if (data.success) {
        registrations.value = data.data
      }
    } catch (e) {
      console.error('Failed to fetch registrations:', e)
    }
  }

  async function fetchRegistration(id: string): Promise<Registration | null> {
    try {
      const res = await fetch(`/api/registrations/${id}`)
      const data = await res.json()
      if (data.success) {
        return data.data
      }
    } catch (e) {
      console.error('Failed to fetch registration:', e)
    }
    return null
  }

  async function updateRegistration(id: string, payload: { status: Registration['status']; confirmed_by?: string; note?: string; note_type?: string; conflict_acknowledged?: boolean }) {
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: payload.status,
          operator_role: currentRole.value,
          operator_name: currentName.value,
          note_type: payload.note_type || (payload.status === 'rejected' ? 'dispute' : 'normal'),
          note: payload.note || `${currentRole.value}/${currentName.value} 执行了 ${payload.status} 操作`,
          confirmed_by: payload.confirmed_by,
          conflict_acknowledged: payload.conflict_acknowledged,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchRegistrations()
        await fetchStats()
        return { success: true, data: data.data }
      } else {
        return { success: false, error: data.error, data: data.data }
      }
    } catch (e) {
      console.error('Failed to update registration:', e)
    }
    return { success: false, error: '网络错误' }
  }

  async function escalateRegistration(id: string, reason: string) {
    try {
      const res = await fetch(`/api/registrations/${id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_role: currentRole.value,
          operator_name: currentName.value,
          reason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchRegistrations()
        await fetchStats()
        return true
      }
    } catch (e) {
      console.error('Failed to escalate registration:', e)
    }
    return false
  }

  async function addNote(registrationId: string, noteType: string, note: string) {
    try {
      const res = await fetch(`/api/registrations/${registrationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_role: currentRole.value,
          operator_name: currentName.value,
          note_type: noteType,
          note,
        }),
      })
      const data = await res.json()
      return data.success
    } catch (e) {
      console.error('Failed to add note:', e)
    }
    return false
  }

  async function fetchSeats() {
    try {
      const res = await fetch('/api/seats')
      const data = await res.json()
      if (data.success) {
        seats.value = data.data
      }
    } catch (e) {
      console.error('Failed to fetch seats:', e)
    }
  }

  async function fetchSeatAvailability(): Promise<SeatAvailability | null> {
    try {
      const res = await fetch('/api/seats/availability')
      const data = await res.json()
      if (data.success) {
        return data.data
      }
    } catch (e) {
      console.error('Failed to fetch seat availability:', e)
    }
    return null
  }

  async function fetchAllocations() {
    try {
      const res = await fetch('/api/seats/allocations')
      const data = await res.json()
      if (data.success) {
        allocations.value = data.data
      }
    } catch (e) {
      console.error('Failed to fetch allocations:', e)
    }
  }

  async function fetchAllocation(id: string): Promise<SeatAllocation | null> {
    try {
      const res = await fetch(`/api/seats/allocations/${id}`)
      const data = await res.json()
      if (data.success) {
        return data.data
      }
    } catch (e) {
      console.error('Failed to fetch allocation:', e)
    }
    return null
  }

  async function createAllocation(registrationId: string, seatIds: string[], conflictReason?: string) {
    try {
      const res = await fetch('/api/seats/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          seat_ids: seatIds,
          allocated_by: `${currentRole.value}/${currentName.value}`,
          conflict_reason: conflictReason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchSeats()
        await fetchAllocations()
        await fetchStats()
        return { success: true, has_conflict: data.has_conflict, conflict_description: data.conflict_description }
      }
    } catch (e) {
      console.error('Failed to create allocation:', e)
    }
    return { success: false }
  }

  async function updateAllocation(id: string, payload: Partial<SeatAllocation> & { note?: string }) {
    try {
      const res = await fetch(`/api/seats/allocations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: payload.status,
          operator_role: currentRole.value,
          operator_name: currentName.value,
          note: payload.note || `${currentRole.value}/${currentName.value} 执行了 ${payload.status} 操作`,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchAllocations()
        await fetchStats()
        return true
      }
    } catch (e) {
      console.error('Failed to update allocation:', e)
    }
    return false
  }

  async function updateAttachment(id: string, status: 'placeholder' | 'uploaded') {
    try {
      const res = await fetch(`/api/attachments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          uploaded_by: status === 'uploaded' ? `${currentRole.value}/${currentName.value}` : undefined,
        }),
      })
      const data = await res.json()
      return data.success
    } catch (e) {
      console.error('Failed to update attachment:', e)
    }
    return false
  }

  async function fetchStats() {
    try {
      const res = await fetch(`/api/admin/stats?role=${encodeURIComponent(currentRole.value)}`)
      const data = await res.json()
      if (data.success) {
        stats.value = {
          pending: data.data.pending,
          overdue: data.data.overdue,
          conflicts: data.data.conflicts,
          my_pending: data.data.my_pending,
          escalated: data.data.escalated,
        }
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    }
  }

  async function fetchRecentLogs() {
    try {
      const res = await fetch('/api/handover-logs/recent/all')
      const data = await res.json()
      if (data.success) {
        recentLogs.value = data.data
      }
    } catch (e) {
      console.error('Failed to fetch recent logs:', e)
      recentLogs.value = []
    }
  }

  async function resetData(confirmText: string) {
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchRegistrations()
        await fetchSeats()
        await fetchAllocations()
        await fetchStats()
        await fetchRecentLogs()
        return true
      }
    } catch (e) {
      console.error('Failed to reset data:', e)
    }
    return false
  }

  async function fetchSiblings(eventName: string) {
    try {
      const res = await fetch(`/api/registrations/siblings/${encodeURIComponent(eventName)}`)
      const data = await res.json()
      if (data.success) return data.data
    } catch (e) {
      console.error('Failed to fetch siblings:', e)
    }
    return null
  }

  async function fetchAllocationTimeline(registrationId: string) {
    try {
      const res = await fetch(`/api/registrations/${registrationId}/allocation-timeline`)
      const data = await res.json()
      if (data.success) return data.data
    } catch (e) {
      console.error('Failed to fetch allocation timeline:', e)
    }
    return []
  }

  async function arbitrateRegistration(registrationId: string, action: 'confirm_ownership' | 'reassign_seats' | 'revoke_allocation' | 'record_ruling', note: string, seatIds?: string[]) {
    try {
      const payload: Record<string, unknown> = {
        action,
        operator_role: currentRole.value,
        operator_name: currentName.value,
        note,
      }
      if (seatIds) payload.seat_ids = seatIds
      const res = await fetch(`/api/registrations/${registrationId}/arbitrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        await fetchRegistrations()
        await fetchStats()
        return data.data
      }
    } catch (e) {
      console.error('Failed to arbitrate:', e)
    }
    return null
  }

  async function createAttachment(registrationId: string, fileName: string, fileSize: string, category: string, description?: string) {
    try {
      const res = await fetch(`/api/registrations/${registrationId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: fileName,
          file_size: fileSize,
          category,
          description: description || null,
        }),
      })
      const data = await res.json()
      if (data.success) return data.data
    } catch (e) {
      console.error('Failed to create attachment:', e)
    }
    return null
  }

  async function updateRegistrationAttachment(registrationId: string, attId: string, payload: { status?: string; description?: string; uploaded_by?: string }) {
    try {
      const res = await fetch(`/api/registrations/${registrationId}/attachments/${attId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) return data.data
    } catch (e) {
      console.error('Failed to update attachment:', e)
    }
    return null
  }

  async function fetchAlertTimeline() {
    try {
      const res = await fetch('/api/admin/alert-timeline')
      const data = await res.json()
      if (data.success) alertTimeline.value = data.data
    } catch (e) {
      console.error('Failed to fetch alert timeline:', e)
    }
  }

  async function fetchRolePressure() {
    try {
      const res = await fetch('/api/admin/role-pressure')
      const data = await res.json()
      if (data.success) rolePressure.value = data.data
    } catch (e) {
      console.error('Failed to fetch role pressure:', e)
    }
  }

  async function fetchOverdueTop() {
    try {
      const res = await fetch('/api/admin/overdue-top')
      const data = await res.json()
      if (data.success) overdueTop.value = data.data
    } catch (e) {
      console.error('Failed to fetch overdue top:', e)
    }
  }

  async function sendReminder(registrationId: string, toRole: string, note: string) {
    try {
      const res = await fetch('/api/admin/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          operator_role: currentRole.value,
          operator_name: currentName.value,
          to_role: toRole,
          note,
        }),
      })
      const data = await res.json()
      if (data.success) {
        return { success: true, data: data.data }
      }
      return { success: false, error: data.error, cooldown_remaining: data.cooldown_remaining }
    } catch (e) {
      console.error('Failed to send reminder:', e)
    }
    return { success: false, error: '网络错误' }
  }

  async function fetchReminderFeedback() {
    try {
      const res = await fetch('/api/admin/reminder-feedback')
      const data = await res.json()
      if (data.success) reminderFeedback.value = data.data
    } catch (e) {
      console.error('Failed to fetch reminder feedback:', e)
    }
  }

  function markRefreshed() {
    lastRefreshAt.value = new Date()
    refreshCooldown.value = true
    setTimeout(() => { refreshCooldown.value = false }, 30000)
  }

  return {
    currentRole,
    currentName,
    registrations,
    seats,
    allocations,
    stats,
    recentLogs,
    alertTimeline,
    rolePressure,
    overdueTop,
    reminderFeedback,
    lastRefreshAt,
    refreshCooldown,
    loading,
    setRole,
    setName,
    fetchRegistrations,
    fetchRegistration,
    updateRegistration,
    escalateRegistration,
    addNote,
    fetchSeats,
    fetchSeatAvailability,
    fetchAllocations,
    fetchAllocation,
    createAllocation,
    updateAllocation,
    updateAttachment,
    fetchStats,
    fetchRecentLogs,
    resetData,
    fetchSiblings,
    fetchAllocationTimeline,
    arbitrateRegistration,
    createAttachment,
    updateRegistrationAttachment,
    fetchAlertTimeline,
    fetchRolePressure,
    fetchOverdueTop,
    sendReminder,
    fetchReminderFeedback,
    markRefreshed,
  }
})
