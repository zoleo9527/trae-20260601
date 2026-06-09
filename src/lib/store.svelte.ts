import type { UserRole, DamageStatus, CompensationStatus } from '$lib/types'
import { ROLE_LABELS } from '$lib/types'
import { damageRecords, compensationRecords } from '$lib/mock-data'

let currentRole = $state<UserRole>('freight_clerk')
let damageFilter = $state<DamageStatus | 'all'>('all')
let compensationFilter = $state<CompensationStatus | 'all'>('all')
let sidebarOpen = $state(true)
let selectedDamageId = $state<string | null>(null)
let selectedCompensationId = $state<string | null>(null)

let damages = $state(damageRecords.map(d => ({ ...d })))
let compensations = $state(compensationRecords.map(c => ({ ...c })))

let filteredDamages = $derived(
  damageFilter === 'all' ? damages : damages.filter(d => d.status === damageFilter)
)

let filteredCompensations = $derived(
  compensationFilter === 'all' ? compensations : compensations.filter(c => c.status === compensationFilter)
)

let pendingDamages = $derived(damages.filter(d => d.status === 'pending'))
let anomalyDamages = $derived(damages.filter(d => d.status === 'anomaly'))
let completedDamages = $derived(damages.filter(d => d.status === 'completed'))
let gapDamages = $derived(damages.filter(d => d.hasGap))

let pendingCompensations = $derived(compensations.filter(c => c.status === 'pending' || c.status === 'material_incomplete'))
let acceptedCompensations = $derived(compensations.filter(c => c.status === 'accepted' || c.status === 'reviewing'))
let completedCompensations = $derived(compensations.filter(c => c.status === 'completed'))

let selectedDamage = $derived(
  selectedDamageId ? damages.find(d => d.id === selectedDamageId) ?? null : null
)

let selectedCompensation = $derived(
  selectedCompensationId ? compensations.find(c => c.id === selectedCompensationId) ?? null : null
)

let linkedDamageForCompensation = $derived(
  selectedCompensation ? damages.find(d => d.id === selectedCompensation.damageRecordId) ?? null : null
)

function recalcDamageHasGap(damageId: string) {
  const d = damages.find(d => d.id === damageId)
  if (!d) return
  const chainHasGap = d.responsibilityChain.some(n => n.isGap)
  const timelineHasGap = d.timeline.some(n => n.isGap)
  d.hasGap = chainHasGap || timelineHasGap
}

function recalcCompensationHasGap(compId: string) {
  const c = compensations.find(c => c.id === compId)
  if (!c) return
  c.hasGap = c.responsibilityLinks.some(l => l.isGap)
}

function syncCompensationFromDamage(damageId: string) {
  const d = damages.find(d => d.id === damageId)
  if (!d) return
  const comp = compensations.find(c => c.damageRecordId === damageId)
  if (!comp) return

  comp.responsibilityLinks = d.responsibilityChain.slice(0, -1).map((node, i) => {
    const next = d.responsibilityChain[i + 1]
    return {
      from: { name: node.name, role: node.role, segment: node.segment },
      to: { name: next.name, role: next.role, segment: next.segment },
      isGap: node.isGap || next.isGap
    }
  })

  recalcCompensationHasGap(comp.id)
  comp.updatedAt = new Date().toISOString()
}

function clearTimelineGapsForSegment(d: typeof damages[0], segment: string, name: string, role: UserRole) {
  for (const node of d.timeline) {
    if (node.isGap && node.event.includes(segment)) {
      node.responsible = { name, role }
      node.isGap = false
    }
  }
}

function clearOrphanTimelineGaps(d: typeof damages[0], name: string, role: UserRole) {
  const chainHasGap = d.responsibilityChain.some(n => n.isGap)
  if (!chainHasGap) {
    for (const node of d.timeline) {
      if (node.isGap && !node.responsible) {
        node.responsible = { name, role }
        node.isGap = false
      }
    }
  }
}

export function getStore() {
  return {
    get currentRole() { return currentRole },
    set currentRole(v: UserRole) { currentRole = v },
    get damageFilter() { return damageFilter },
    set damageFilter(v: DamageStatus | 'all') { damageFilter = v },
    get compensationFilter() { return compensationFilter },
    set compensationFilter(v: CompensationStatus | 'all') { compensationFilter = v },
    get sidebarOpen() { return sidebarOpen },
    set sidebarOpen(v: boolean) { sidebarOpen = v },
    get selectedDamageId() { return selectedDamageId },
    set selectedDamageId(v: string | null) { selectedDamageId = v },
    get selectedCompensationId() { return selectedCompensationId },
    set selectedCompensationId(v: string | null) { selectedCompensationId = v },
    get damages() { return damages },
    get compensations() { return compensations },
    get filteredDamages() { return filteredDamages },
    get filteredCompensations() { return filteredCompensations },
    get pendingDamages() { return pendingDamages },
    get anomalyDamages() { return anomalyDamages },
    get completedDamages() { return completedDamages },
    get gapDamages() { return gapDamages },
    get pendingCompensations() { return pendingCompensations },
    get acceptedCompensations() { return acceptedCompensations },
    get completedCompensations() { return completedCompensations },
    get selectedDamage() { return selectedDamage },
    get selectedCompensation() { return selectedCompensation },
    get linkedDamageForCompensation() { return linkedDamageForCompensation },

    assignResponsible(damageId: string, name: string, role: UserRole) {
      const d = damages.find(d => d.id === damageId)
      if (!d) return

      const now = new Date().toISOString()
      d.currentResponsible = { name, role }
      if (d.status === 'pending') d.status = 'processing'
      if (d.status === 'anomaly') d.status = 'processing'
      d.updatedAt = now

      d.responsibilityChain = d.responsibilityChain.map(node => {
        if (node.isGap) {
          return { ...node, name, role, isGap: false }
        }
        return node
      })

      for (const node of d.timeline) {
        if (node.isGap && !node.responsible) {
          node.responsible = { name, role }
          node.isGap = false
        }
      }

      recalcDamageHasGap(damageId)
      syncCompensationFromDamage(damageId)

      d.timeline.push({
        id: 'tn-assign-' + Date.now(),
        event: '指派责任人',
        timestamp: now,
        responsible: { name, role },
        description: `${ROLE_LABELS[role]} ${name} 被指派为当前责任人，责任链空档已补全`,
        isGap: false
      })
    },

    fillGapNode(damageId: string, chainNodeId: string, name: string, role: UserRole) {
      const d = damages.find(d => d.id === damageId)
      if (!d) return

      const now = new Date().toISOString()
      const chainNode = d.responsibilityChain.find(n => n.id === chainNodeId)
      if (!chainNode || !chainNode.isGap) return

      const segment = chainNode.segment

      chainNode.name = name
      chainNode.role = role
      chainNode.isGap = false

      clearTimelineGapsForSegment(d, segment, name, role)
      clearOrphanTimelineGaps(d, name, role)

      recalcDamageHasGap(damageId)
      syncCompensationFromDamage(damageId)
      d.updatedAt = now

      d.timeline.push({
        id: 'tn-fill-' + Date.now(),
        event: '补全责任链',
        timestamp: now,
        responsible: { name, role },
        description: `${segment} 环节指派 ${ROLE_LABELS[role]} ${name}，空档已补全`,
        isGap: false
      })
    },

    submitCompensationMaterial(compId: string, materialId: string) {
      const c = compensations.find(c => c.id === compId)
      if (!c) return
      const m = c.materials.find(m => m.id === materialId)
      if (!m) return

      const now = new Date().toISOString()
      m.status = 'submitted'
      m.submittedAt = now
      m.submittedBy = ROLE_LABELS[currentRole]
      c.updatedAt = now

      const hasMissing = c.materials.some(m => m.status === 'missing')
      if (!hasMissing && c.status === 'material_incomplete') {
        c.status = 'accepted'
      }
      if (c.status === 'pending' && c.materials.some(m => m.status === 'submitted' || m.status === 'verified')) {
        c.status = 'accepted'
      }
    },

    acceptCompensation(compId: string) {
      const c = compensations.find(c => c.id === compId)
      if (!c) return
      if (c.status !== 'pending' && c.status !== 'material_incomplete') return

      const now = new Date().toISOString()
      const hasMissing = c.materials.some(m => m.status === 'missing')
      if (hasMissing) {
        c.status = 'material_incomplete'
      } else {
        c.status = 'accepted'
      }
      c.updatedAt = now

      const d = damages.find(d => d.id === c.damageRecordId)
      if (d) {
        d.timeline.push({
          id: 'tn-comp-accept-' + Date.now(),
          event: '赔付受理',
          timestamp: now,
          responsible: { name: ROLE_LABELS[currentRole], role: currentRole },
          description: `客服受理赔付申请 ${c.compNo}，赔付金额 ¥${c.amount.toLocaleString()}`,
          isGap: false
        })
        d.updatedAt = now
      }
    },

    submitCompensationForReview(compId: string) {
      const c = compensations.find(c => c.id === compId)
      if (!c || c.status !== 'accepted') return

      const now = new Date().toISOString()
      c.status = 'reviewing'
      c.updatedAt = now

      const d = damages.find(d => d.id === c.damageRecordId)
      if (d) {
        d.timeline.push({
          id: 'tn-comp-review-' + Date.now(),
          event: '提交审核',
          timestamp: now,
          responsible: { name: ROLE_LABELS[currentRole], role: currentRole },
          description: `赔付 ${c.compNo} 材料齐全，提交站段管理员审核`,
          isGap: false
        })
        d.updatedAt = now
      }
    },

    completeCompensation(compId: string) {
      const c = compensations.find(c => c.id === compId)
      if (!c || c.status !== 'reviewing') return

      const now = new Date().toISOString()
      c.status = 'completed'
      c.updatedAt = now

      for (const m of c.materials) {
        if (m.status === 'submitted') {
          m.status = 'verified'
        }
      }

      const d = damages.find(d => d.id === c.damageRecordId)
      if (d) {
        d.timeline.push({
          id: 'tn-comp-done-' + Date.now(),
          event: '赔付完成',
          timestamp: now,
          responsible: { name: ROLE_LABELS[currentRole], role: currentRole },
          description: `站段管理员审核通过，赔付 ${c.compNo} 完成，金额 ¥${c.amount.toLocaleString()}`,
          isGap: false
        })
        d.updatedAt = now
      }
    },

    completeDamage(damageId: string) {
      const d = damages.find(d => d.id === damageId)
      if (!d) return
      if (d.status !== 'processing' && d.status !== 'anomaly') return

      const now = new Date().toISOString()
      d.status = 'completed'
      d.updatedAt = now

      d.timeline.push({
        id: 'tn-close-' + Date.now(),
        event: '结案',
        timestamp: now,
        responsible: { name: ROLE_LABELS[currentRole], role: currentRole },
        description: `货损记录 ${d.ticketNo} 已结案`,
        isGap: false
      })

      const comp = compensations.find(c => c.damageRecordId === damageId)
      if (comp && comp.status === 'reviewing') {
        comp.status = 'completed'
        comp.updatedAt = now
        for (const m of comp.materials) {
          if (m.status === 'submitted') m.status = 'verified'
        }
      }
    }
  }
}
