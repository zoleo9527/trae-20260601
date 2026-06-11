import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LeaseRecord, LeaseStatus, Role } from '~/types/lease'
import { MOCK_RECORDS } from '~/data/mockRecords'
import { USERS } from '~/utils/constants'

export const useLeaseStore = defineStore('lease', () => {
  const records = ref<LeaseRecord[]>(JSON.parse(JSON.stringify(MOCK_RECORDS)))
  const currentUserId = ref<string>('zhaowei')
  const selectedIds = ref<string[]>([])

  const currentUser = computed(() => USERS[currentUserId.value])

  const todoRecords = computed(() => {
    return records.value.filter(r => r.currentHandler?.id === currentUserId.value)
  })

  const recordsByRole = computed(() => {
    const role = currentUser.value.role
    if (role === 'manager') {
      return records.value.filter(r =>
        ['plan_pending', 'plan_rejected', 'contract_pending', 'contract_rejected'].includes(r.currentStatus)
      )
    }
    if (role === 'supervisor') {
      return records.value.filter(r =>
        ['lead_created', 'lead_following', 'plan_rejected', 'contract_rejected'].includes(r.currentStatus)
        || r.createUser.id === currentUserId.value
      )
    }
    if (role === 'property_engineer') {
      return records.value.filter(r =>
        ['decoration_pending', 'decoration_approved'].includes(r.currentStatus)
      )
    }
    return records.value
  })

  function getRecord(id: string) {
    return records.value.find(r => r.id === id)
  }

  function switchUser(userId: string) {
    currentUserId.value = userId
    selectedIds.value = []
  }

  function toggleSelected(id: string) {
    const idx = selectedIds.value.indexOf(id)
    if (idx >= 0) selectedIds.value.splice(idx, 1)
    else selectedIds.value.push(id)
  }

  function clearSelection() {
    selectedIds.value = []
  }

  function selectAll(ids: string[]) {
    selectedIds.value = [...ids]
  }

  function approvePlan(id: string, remark: string) {
    const rec = getRecord(id)
    if (!rec || rec.currentStatus !== 'plan_pending') return
    pushHistory(rec, 'plan_approved', currentUserId.value, remark)
    rec.currentStatus = 'plan_approved'
  }

  function rejectPlan(id: string, remark: string, reason: string) {
    const rec = getRecord(id)
    if (!rec || rec.currentStatus !== 'plan_pending') return
    pushHistory(rec, 'plan_rejected', currentUserId.value, remark, reason)
    rec.currentStatus = 'plan_rejected'
    rec.currentHandler = rec.createUser
    rec.currentHandlerRole = rec.createUser.role
  }

  function resubmitPlan(id: string, remark: string, updates?: Partial<LeaseRecord['plan']>) {
    const rec = getRecord(id)
    if (!rec) return
    if (updates) Object.assign(rec.plan, updates)
    pushHistory(rec, 'plan_pending', currentUserId.value, remark)
    rec.currentStatus = 'plan_pending'
    rec.currentHandler = USERS.zhaowei
    rec.currentHandlerRole = 'manager'
  }

  function submitContract(id: string, remark: string, updates?: Partial<LeaseRecord['contract']>) {
    const rec = getRecord(id)
    if (!rec || rec.currentStatus !== 'plan_approved') return
    if (updates) Object.assign(rec.contract, updates)
    pushHistory(rec, 'contract_pending', currentUserId.value, remark)
    rec.currentStatus = 'contract_pending'
    rec.currentHandler = USERS.zhaowei
    rec.currentHandlerRole = 'manager'
  }

  function approveContract(id: string, remark: string, updates?: Partial<LeaseRecord['contract']>) {
    const rec = getRecord(id)
    if (!rec || rec.currentStatus !== 'contract_pending') return
    if (updates) Object.assign(rec.contract, updates)
    pushHistory(rec, 'contract_approved', currentUserId.value, remark)
    rec.currentStatus = 'contract_approved'
    rec.currentHandler = USERS.wanggang
    rec.currentHandlerRole = 'property_engineer'
  }

  function rejectContract(id: string, remark: string, reason: string) {
    const rec = getRecord(id)
    if (!rec || rec.currentStatus !== 'contract_pending') return
    pushHistory(rec, 'contract_rejected', currentUserId.value, remark, reason)
    rec.currentStatus = 'contract_rejected'
    rec.currentHandler = rec.createUser
    rec.currentHandlerRole = rec.createUser.role
  }

  function resubmitContract(id: string, remark: string) {
    const rec = getRecord(id)
    if (!rec || rec.currentStatus !== 'contract_rejected') return
    pushHistory(rec, 'contract_pending', currentUserId.value, remark)
    rec.currentStatus = 'contract_pending'
    rec.currentHandler = USERS.zhaowei
    rec.currentHandlerRole = 'manager'
  }

  function approveDecoration(id: string, remark: string, updates?: Partial<LeaseRecord['decoration']>) {
    const rec = getRecord(id)
    if (!rec || rec.currentStatus !== 'decoration_pending') return
    if (updates) Object.assign(rec.decoration, updates)
    pushHistory(rec, 'decoration_approved', currentUserId.value, remark)
    rec.currentStatus = 'decoration_approved'
  }

  function addSupplement(id: string, content: string) {
    const rec = getRecord(id)
    if (!rec) return
    rec.supplements.push({
      id: Math.random().toString(36).slice(2),
      content,
      author: currentUser.value,
      authorRole: currentUser.value.role,
      timestamp: new Date().toISOString()
    })
  }

  function pushHistory(
    rec: LeaseRecord,
    toStatus: LeaseStatus,
    userId: string,
    remark: string,
    rejectReason?: string
  ) {
    const user = USERS[userId]
    rec.statusHistory.push({
      id: Math.random().toString(36).slice(2),
      fromStatus: rec.currentStatus,
      toStatus,
      operator: user,
      operatorRole: user.role,
      timestamp: new Date().toISOString(),
      remark,
      rejectReason
    })
    rec.currentHandler = rec.currentHandler
  }

  return {
    records,
    currentUserId,
    currentUser,
    selectedIds,
    todoRecords,
    recordsByRole,
    getRecord,
    switchUser,
    toggleSelected,
    clearSelection,
    selectAll,
    approvePlan,
    rejectPlan,
    resubmitPlan,
    submitContract,
    approveContract,
    rejectContract,
    resubmitContract,
    approveDecoration,
    addSupplement
  }
})
