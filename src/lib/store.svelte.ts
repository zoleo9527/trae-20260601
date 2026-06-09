import type { UserRole, DamageStatus, CompensationStatus } from '$lib/types'
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
      if (d) {
        d.currentResponsible = { name, role }
        if (d.status === 'pending') d.status = 'processing'
        d.updatedAt = new Date().toISOString()
      }
    },
    submitCompensationMaterial(compId: string, materialId: string) {
      const c = compensations.find(c => c.id === compId)
      if (c) {
        const m = c.materials.find(m => m.id === materialId)
        if (m) {
          m.status = 'submitted'
          m.submittedAt = new Date().toISOString()
          m.submittedBy = '当分用户'
          c.updatedAt = new Date().toISOString()
        }
      }
    }
  }
}
