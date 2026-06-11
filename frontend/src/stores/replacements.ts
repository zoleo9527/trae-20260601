import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Replacement,
  ReplacementFilters,
  ReplacementStatus,
  UserRole,
  CostConfirmation,
  RejectRecord,
  Attachment,
} from '../types'
import { mockReplacements } from '../mock'
import { useOperationsStore } from './operations'
import { useUserStore } from './user'

const STORAGE_KEY = 'pinia_replacements_store'

function generateId(): string {
  return 'r' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function generateOrderNo(): string {
  const now = new Date()
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return 'BJ' + dateStr + random
}

export const useReplacementsStore = defineStore('replacements', () => {
  const replacements = ref<Replacement[]>([])
  const selectedId = ref<string | null>(null)
  const filters = ref<ReplacementFilters>({})

  function saveToStorage() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        replacements: replacements.value,
        selectedId: selectedId.value,
        filters: filters.value,
      })
    )
  }

  function loadFromStorage(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        let migrated = false
        replacements.value = (parsed.replacements || []).map((r: Replacement) => {
          let deviceModel = r.deviceModel
          let elevatorNo = r.elevatorNo || ''
          // 存量数据迁移：legacy deviceModel 形如 "迅达 Schindler 7000 / DT-A-001"
          //   如果包含 " / " 且 elevatorNo 为空，则自动拆分并持久化
          if (
            typeof deviceModel === 'string' &&
            deviceModel.includes(' / ') &&
            !elevatorNo
          ) {
            const parts = deviceModel.split(' / ')
            elevatorNo = parts[parts.length - 1]
            deviceModel = parts.slice(0, -1).join(' / ')
            migrated = true
          }
          return {
            ...r,
            elevatorNo,
            deviceModel,
            replaceReason: r.replaceReason || '',
            sceneDescription: r.sceneDescription || '',
            supplementNotes: r.supplementNotes || [],
            costConfirmations: r.costConfirmations || [],
            rejectRecords: r.rejectRecords || [],
            attachments: r.attachments || [],
          }
        })
        selectedId.value = parsed.selectedId
        filters.value = parsed.filters || {}
        if (migrated) {
          saveToStorage()
        }
        return true
      } catch {
        return false
      }
    }
    return false
  }

  function initReplacements() {
    if (!loadFromStorage()) {
      replacements.value = [...mockReplacements]
      saveToStorage()
    }
  }

  function getById(id: string): Replacement | undefined {
    return replacements.value.find((r) => r.id === id)
  }

  function createReplacement(data: Partial<Replacement>) {
    const userStore = useUserStore()
    const operationsStore = useOperationsStore()

    const now = new Date().toISOString()
    const newReplacement: Replacement = {
      id: generateId(),
      orderNo: generateOrderNo(),
      customerName: data.customerName || '',
      phone: data.phone || '',
      elevatorNo: data.elevatorNo || '',
      deviceModel: data.deviceModel || '',
      faultDescription: data.faultDescription || '',
      replaceReason: data.replaceReason || '',
      sceneDescription: data.sceneDescription || '',
      items: data.items || [],
      estimatedAmount: data.estimatedAmount || 0,
      status: 'draft',
      technicianId: userStore.currentUser?.id || '',
      technicianName: userStore.currentUser?.name || '',
      supplementNotes: data.supplementNotes || [],
      costConfirmations: [],
      rejectRecords: [],
      attachments: data.attachments || [],
      createdAt: now,
      updatedAt: now,
    }

    replacements.value.unshift(newReplacement)
    saveToStorage()

    operationsStore.addLog({
      replacementId: newReplacement.id,
      action: 'create',
      details: {
        orderNo: newReplacement.orderNo,
        estimatedAmount: newReplacement.estimatedAmount,
      },
    })

    return newReplacement
  }

  function updateReplacement(id: string, data: Partial<Replacement>) {
    const operationsStore = useOperationsStore()
    const replacement = replacements.value.find((r) => r.id === id)
    if (!replacement) return

    const allowedFields: (keyof Replacement)[] = [
      'customerName',
      'phone',
      'elevatorNo',
      'deviceModel',
      'faultDescription',
      'replaceReason',
      'sceneDescription',
      'items',
      'estimatedAmount',
      'supplementNotes',
      'attachments',
    ]

    const changes: Record<string, unknown> = {}
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        const oldValue = (replacement as Record<string, unknown>)[field]
        const newValue = (data as Record<string, unknown>)[field]
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          ;(replacement as Record<string, unknown>)[field] = newValue
          changes[field] = newValue
        }
      }
    })

    replacement.updatedAt = new Date().toISOString()
    saveToStorage()

    if (Object.keys(changes).length > 0) {
      operationsStore.addLog({
        replacementId: id,
        action: 'update',
        details: { changedFields: Object.keys(changes) },
      })
    }

    return replacement
  }

  function submitReplacement(id: string) {
    const operationsStore = useOperationsStore()
    const replacement = replacements.value.find((r) => r.id === id)
    if (!replacement) return

    replacement.status = 'pending_confirm'
    replacement.submittedAt = new Date().toISOString()
    replacement.updatedAt = replacement.submittedAt
    saveToStorage()

    operationsStore.addLog({
      replacementId: id,
      action: 'submit',
    })
  }

  function confirmCost(
    id: string,
    confirmedAmount: number,
    customerFeedback?: string,
    remark?: string
  ) {
    const operationsStore = useOperationsStore()
    const userStore = useUserStore()
    const replacement = replacements.value.find((r) => r.id === id)
    if (!replacement) return

    const confirmation: CostConfirmation = {
      id: 'cc' + Date.now().toString(36),
      role: userStore.currentUser?.role || 'customer_service',
      confirmerId: userStore.currentUser?.id || '',
      confirmerName: userStore.currentUser?.name || '',
      confirmedAmount,
      comment: remark,
      confirmTime: new Date().toISOString(),
    }

    replacement.costConfirmations.push(confirmation)
    replacement.status = 'confirmed'
    replacement.confirmedAmount = confirmedAmount
    replacement.customerFeedback = customerFeedback
    replacement.remark = remark
    replacement.confirmedAt = new Date().toISOString()
    replacement.updatedAt = replacement.confirmedAt
    saveToStorage()

    operationsStore.addLog({
      replacementId: id,
      action: 'confirm_cost',
      details: { confirmedAmount, customerFeedback, remark },
    })
  }

  function rejectReplacement(id: string, reason: string) {
    const operationsStore = useOperationsStore()
    const userStore = useUserStore()
    const replacement = replacements.value.find((r) => r.id === id)
    if (!replacement) return

    const record: RejectRecord = {
      id: 'rr' + Date.now().toString(36),
      role: userStore.currentUser?.role || 'customer_service',
      rejecterId: userStore.currentUser?.id || '',
      rejecterName: userStore.currentUser?.name || '',
      reason,
      rejectTime: new Date().toISOString(),
    }

    replacement.rejectRecords.push(record)
    replacement.status = 'rejected'
    replacement.rejectReason = reason
    replacement.updatedAt = new Date().toISOString()
    saveToStorage()

    operationsStore.addLog({
      replacementId: id,
      action: 'reject',
      details: { reason },
    })
  }

  function resubmitReplacement(id: string) {
    const operationsStore = useOperationsStore()
    const replacement = replacements.value.find((r) => r.id === id)
    if (!replacement) return

    replacement.status = 'resubmitted'
    replacement.updatedAt = new Date().toISOString()
    saveToStorage()

    operationsStore.addLog({
      replacementId: id,
      action: 'resubmit',
    })
  }

  function closeReplacement(id: string) {
    const operationsStore = useOperationsStore()
    const replacement = replacements.value.find((r) => r.id === id)
    if (!replacement) return

    replacement.status = 'closed'
    replacement.closedAt = new Date().toISOString()
    replacement.updatedAt = replacement.closedAt
    saveToStorage()

    operationsStore.addLog({
      replacementId: id,
      action: 'close',
      details: { remark: replacement.remark },
    })
  }

  function addSupplementNote(id: string, content: string) {
    const operationsStore = useOperationsStore()
    const replacement = replacements.value.find((r) => r.id === id)
    if (!replacement) return

    replacement.supplementNotes.push(content)
    replacement.updatedAt = new Date().toISOString()
    saveToStorage()

    operationsStore.addLog({
      replacementId: id,
      action: 'add_supplement_note',
      details: { content },
    })
  }

  function setFilters(newFilters: ReplacementFilters) {
    filters.value = { ...filters.value, ...newFilters }
    saveToStorage()
  }

  function exportToCSV(): string {
    const headers = [
      '工单号',
      '客户姓名',
      '电话',
      '电梯编号',
      '设备型号',
      '故障描述',
      '预估金额',
      '确认金额',
      '状态',
      '技术员',
      '创建时间',
      '更新时间',
    ]

    const statusMap: Record<ReplacementStatus, string> = {
      draft: '草稿',
      pending_confirm: '待确认',
      confirmed: '已确认',
      rejected: '已退回',
      resubmitted: '已重新提交',
      completed: '已完成',
      closed: '已关闭',
    }

    const rows = filteredList.value.map((r) => [
      r.orderNo,
      r.customerName,
      r.phone,
      r.elevatorNo,
      r.deviceModel,
      r.faultDescription,
      r.estimatedAmount,
      r.confirmedAmount ?? '',
      statusMap[r.status],
      r.technicianName,
      r.createdAt,
      r.updatedAt,
    ])

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
        '\n'
      )

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `备件更换记录_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return csvContent
  }

  const filteredList = computed(() => {
    let result = [...replacements.value]

    if (filters.value.status) {
      result = result.filter((r) => r.status === filters.value?.status)
    }

    if (filters.value.keyword) {
      const keyword = filters.value.keyword.toLowerCase()
      result = result.filter(
        (r) =>
          r.orderNo.toLowerCase().includes(keyword) ||
          r.customerName.toLowerCase().includes(keyword) ||
          r.elevatorNo.toLowerCase().includes(keyword) ||
          r.deviceModel.toLowerCase().includes(keyword) ||
          r.phone.includes(keyword)
      )
    }

    if (filters.value.dateRange) {
      const { start, end } = filters.value.dateRange
      result = result.filter((r) => {
        const date = new Date(r.createdAt)
        return date >= new Date(start) && date <= new Date(end + 'T23:59:59')
      })
    }

    return result
  })

  function todoListByRole(role: UserRole) {
    const userStore = useUserStore()

    if (role === 'technician') {
      return replacements.value.filter(
        (r) =>
          (r.status === 'draft' || r.status === 'rejected') &&
          r.technicianId === userStore.currentUser?.id
      )
    }

    if (role === 'customer_service') {
      return replacements.value.filter(
        (r) => r.status === 'pending_confirm' || r.status === 'resubmitted'
      )
    }

    if (role === 'supervisor') {
      return replacements.value.filter((r) => r.status === 'confirmed')
    }

    return []
  }

  function statsByRole(role: UserRole) {
    const userStore = useUserStore()
    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      closed: 0,
    }

    let list = replacements.value
    if (role === 'technician') {
      list = replacements.value.filter((r) => r.technicianId === userStore.currentUser?.id)
    }

    stats.total = list.length
    stats.pending = list.filter((r) => r.status === 'pending_confirm' || r.status === 'resubmitted').length
    stats.confirmed = list.filter((r) => r.status === 'confirmed').length
    stats.rejected = list.filter((r) => r.status === 'rejected').length
    stats.closed = list.filter((r) => r.status === 'closed').length

    return stats
  }

  const riskList = computed(() => {
    return replacements.value.filter((r) => {
      if (r.status === 'closed' || r.status === 'completed') return false

      const hoursSinceUpdate =
        (Date.now() - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60)
      if (hoursSinceUpdate > 24) return true

      if (r.confirmedAmount && r.estimatedAmount) {
        const diff = Math.abs(r.confirmedAmount - r.estimatedAmount) / r.estimatedAmount
        if (diff > 0.3) return true
      }

      if ((r.rejectRecords || []).length > 0) return true

      if ((r.attachments || []).length === 0 && r.status !== 'draft') return true

      return false
    })
  })

  function getRiskReasons(r: Replacement): string[] {
    const reasons: string[] = []
    const rejectRecords = r.rejectRecords || []
    const attachments = r.attachments || []
    const supplementNotes = r.supplementNotes || []

    const hoursSinceUpdate =
      (Date.now() - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60)
    if (hoursSinceUpdate > 24) {
      reasons.push('超24小时未处理')
    }

    if (r.confirmedAmount && r.estimatedAmount) {
      const diff = Math.abs(r.confirmedAmount - r.estimatedAmount) / r.estimatedAmount
      if (diff > 0.3) {
        reasons.push('金额差异超30%')
      }
    }

    if (rejectRecords.length >= 2) {
      reasons.push('被退回' + rejectRecords.length + '次')
    } else if (rejectRecords.length === 1) {
      reasons.push('被退回需处理')
    }

    if (attachments.length === 0 && r.status !== 'draft') {
      reasons.push('缺少附件凭证')
    }

    if (supplementNotes.length === 0 && r.status === 'resubmitted') {
      reasons.push('重新提交未补充说明')
    }

    return reasons.length > 0 ? reasons : ['待关注']
  }

  function isDisputeProne(r: Replacement): boolean {
    if (r.status === 'closed' || r.status === 'completed') return false
    if ((r.rejectRecords || []).length > 0) return true
    if (r.confirmedAmount && r.estimatedAmount) {
      const diff = Math.abs(r.confirmedAmount - r.estimatedAmount) / r.estimatedAmount
      if (diff > 0.1) return true
    }
    const hoursSinceUpdate =
      (Date.now() - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60)
    if (hoursSinceUpdate > 24) return true
    if ((r.attachments || []).length === 0 && r.status !== 'draft') return true
    return false
  }

  const costReviewSummary = computed(() => {
    const confirmed = replacements.value.filter((r) => r.status === 'confirmed' || r.status === 'closed')
    const totalEstimated = confirmed.reduce((sum, r) => sum + r.estimatedAmount, 0)
    const totalConfirmed = confirmed.reduce((sum, r) => sum + (r.confirmedAmount || 0), 0)

    return {
      count: confirmed.length,
      totalEstimated,
      totalConfirmed,
      diff: totalConfirmed - totalEstimated,
      avgDiscount:
        confirmed.length > 0
          ? Math.round(((totalEstimated - totalConfirmed) / totalEstimated) * 100 * 100) / 100
          : 0,
    }
  })

  return {
    replacements,
    selectedId,
    filters,
    initReplacements,
    getById,
    createReplacement,
    updateReplacement,
    submitReplacement,
    confirmCost,
    rejectReplacement,
    resubmitReplacement,
    closeReplacement,
    addSupplementNote,
    setFilters,
    exportToCSV,
    filteredList,
    todoListByRole,
    statsByRole,
    riskList,
    getRiskReasons,
    isDisputeProne,
    costReviewSummary,
  }
})
