import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Category,
  InboundRegistration,
  WeighingReview,
  WeightDispute,
  OperationLog,
  PriceChange,
  RecentItem,
  User,
  MixedCategoryItem
} from '@/types'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

declare global {
  interface Window {
    electronAPI?: {
      readData: (fileName: string) => Promise<any>
      writeData: (fileName: string, data: any) => Promise<boolean>
      exportData: (defaultName: string, data: any) => Promise<boolean>
      importData: () => Promise<any>
    }
  }
}

const STORAGE_KEYS = {
  CATEGORIES: 'categories.json',
  INBOUNDS: 'inbounds.json',
  REVIEWS: 'reviews.json',
  DISPUTES: 'disputes.json',
  LOGS: 'operationLogs.json',
  PRICE_CHANGES: 'priceChanges.json',
  RECENT: 'recentItems.json',
  USERS: 'users.json',
  CURRENT_USER: 'currentUser.json'
}

function generateId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 16)
}

function generateRegistrationNo(): string {
  const date = dayjs().format('YYYYMMDD')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `JC${date}${random}`
}

export const useDataStore = defineStore('data', () => {
  const categories = ref<Category[]>([])
  const inbounds = ref<InboundRegistration[]>([])
  const reviews = ref<WeighingReview[]>([])
  const disputes = ref<WeightDispute[]>([])
  const operationLogs = ref<OperationLog[]>([])
  const priceChanges = ref<PriceChange[]>([])
  const recentItems = ref<RecentItem[]>([])
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const isLoaded = ref(false)

  const pendingInbounds = computed(() =>
    inbounds.value.filter(i => i.status === 'submitted' || i.status === 'reviewing')
  )

  const pendingReviews = computed(() =>
    reviews.value.filter(r => r.status === 'pending' || r.status === 'disputed')
  )

  const toDoCount = computed(() => {
    if (!currentUser.value) return 0
    let count = 0
    if (currentUser.value.role === 'weigher') {
      count += inbounds.value.filter(i => i.status === 'draft').length
    }
    if (currentUser.value.role === 'sortingLeader') {
      count += inbounds.value.filter(i => i.status === 'submitted').length
    }
    if (currentUser.value.role === 'salesClerk') {
      count += reviews.value.filter(r => r.status === 'confirmed').length
    }
    return count
  })

  const canSubmitInbound = computed(() => {
    if (!currentUser.value) return false
    return ['weigher', 'admin'].includes(currentUser.value.role)
  })

  const canConfirmReview = computed(() => {
    if (!currentUser.value) return false
    return ['sortingLeader', 'admin'].includes(currentUser.value.role)
  })

  const canHandleDispute = computed(() => {
    if (!currentUser.value) return false
    return ['salesClerk', 'admin'].includes(currentUser.value.role)
  })

  const canEditInbound = computed(() => {
    if (!currentUser.value) return false
    return ['weigher', 'admin'].includes(currentUser.value.role)
  })

  const canManageSettings = computed(() => {
    if (!currentUser.value) return false
    return ['admin'].includes(currentUser.value.role)
  })

  function addLog(
    targetType: 'inbound' | 'review' | 'dispute',
    targetId: string,
    action: string,
    detail: string,
    oldValue?: any,
    newValue?: any
  ) {
    const log: OperationLog = {
      id: generateId(),
      targetType,
      targetId,
      action,
      operator: currentUser.value?.name || '系统',
      operatorRole: currentUser.value?.roleLabel || '系统',
      timestamp: dayjs().toISOString(),
      detail,
      oldValue,
      newValue
    }
    operationLogs.value.unshift(log)
    if (operationLogs.value.length > 500) {
      operationLogs.value = operationLogs.value.slice(0, 500)
    }
    saveData()
  }

  function addRecentItem(item: RecentItem) {
    const existingIndex = recentItems.value.findIndex(r => r.id === item.id && r.type === item.type)
    if (existingIndex >= 0) {
      recentItems.value.splice(existingIndex, 1)
    }
    recentItems.value.unshift(item)
    if (recentItems.value.length > 20) {
      recentItems.value = recentItems.value.slice(0, 20)
    }
    saveData()
  }

  function createInbound(data: Partial<InboundRegistration>): InboundRegistration {
    const mainCat = categories.value.find(c => c.id === data.mainCategoryId)
    const inbound: InboundRegistration = {
      id: generateId(),
      registrationNo: generateRegistrationNo(),
      supplierName: data.supplierName || '',
      vehicleNo: data.vehicleNo || '',
      driverName: data.driverName || '',
      driverPhone: data.driverPhone || '',
      mainCategoryId: data.mainCategoryId || '',
      mainCategoryName: mainCat?.name || '',
      isMixed: data.isMixed || false,
      mixedItems: data.mixedItems || [],
      grossWeight: data.grossWeight || 0,
      tareWeight: data.tareWeight || 0,
      netWeight: data.netWeight || 0,
      registrationRemark: data.registrationRemark || '',
      status: 'draft',
      submittedBy: '',
      submittedAt: '',
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      priceSnapshot: mainCat?.defaultPrice || 0,
      hasDispute: false
    }
    inbounds.value.unshift(inbound)
    addLog('inbound', inbound.id, '创建', `创建进厂登记单 ${inbound.registrationNo}`)
    saveData()
    return inbound
  }

  function updateInbound(id: string, data: Partial<InboundRegistration>): { ok: boolean; msg: string } {
    if (!currentUser.value || !['weigher', 'admin'].includes(currentUser.value.role)) {
      return { ok: false, msg: `当前角色"${currentUser.value?.roleLabel || '未知'}"无权修改登记单，仅过磅员可操作` }
    }
    const index = inbounds.value.findIndex(i => i.id === id)
    if (index >= 0) {
      if (inbounds.value[index].status !== 'draft') {
        return { ok: false, msg: `登记单当前状态为"${inbounds.value[index].status}"，仅草稿可修改` }
      }
      const old = { ...inbounds.value[index] }
      inbounds.value[index] = { ...inbounds.value[index], ...data, updatedAt: dayjs().toISOString() }
      addLog('inbound', id, '更新', `更新进厂登记单信息`, old, data)
      saveData()
      return { ok: true, msg: '登记单已更新' }
    }
    return { ok: false, msg: '未找到对应登记单' }
  }

  function submitInbound(id: string): { ok: boolean; msg: string } {
    if (!currentUser.value || !['weigher', 'admin'].includes(currentUser.value.role)) {
      return { ok: false, msg: `当前角色"${currentUser.value?.roleLabel || '未知'}"无权提交进厂登记，仅过磅员可操作` }
    }
    const index = inbounds.value.findIndex(i => i.id === id)
    if (index < 0) {
      return { ok: false, msg: '未找到对应登记单' }
    }
    if (inbounds.value[index].status !== 'draft') {
      return { ok: false, msg: `登记单当前状态为"${inbounds.value[index].status}"，仅草稿可提交` }
    }

    const oldStatus = inbounds.value[index].status
    inbounds.value[index].status = 'submitted'
    inbounds.value[index].submittedBy = currentUser.value.name
    inbounds.value[index].submittedAt = dayjs().toISOString()
    inbounds.value[index].updatedAt = dayjs().toISOString()

    const review: WeighingReview = {
      id: generateId(),
      inboundId: id,
      registrationNo: inbounds.value[index].registrationNo,
      reviewer: '',
      reviewedAt: '',
      confirmedGrossWeight: inbounds.value[index].grossWeight,
      confirmedTareWeight: inbounds.value[index].tareWeight,
      confirmedNetWeight: inbounds.value[index].netWeight,
      confirmedMixedItems: inbounds.value[index].mixedItems.map(m => ({ ...m })),
      reviewRemark: '',
      registrationRemarkSnapshot: inbounds.value[index].registrationRemark,
      status: 'pending'
    }
    reviews.value.unshift(review)

    addLog('inbound', id, '提交', `提交进厂登记单，状态从 ${oldStatus} 变为 submitted`)
    saveData()
    return { ok: true, msg: '已提交，等待过磅复核' }
  }

  function confirmReview(reviewId: string, data: Partial<WeighingReview>): { ok: boolean; msg: string } {
    if (!currentUser.value || !['sortingLeader', 'admin'].includes(currentUser.value.role)) {
      return { ok: false, msg: `当前角色"${currentUser.value?.roleLabel || '未知'}"无权确认复核，仅分拣班长可操作` }
    }
    const index = reviews.value.findIndex(r => r.id === reviewId)
    if (index < 0) {
      return { ok: false, msg: '未找到对应复核记录' }
    }
    if (reviews.value[index].status !== 'pending') {
      return { ok: false, msg: `复核记录当前状态为"${reviews.value[index].status}"，仅待复核可确认` }
    }

    const old = { ...reviews.value[index] }
    reviews.value[index] = {
      ...reviews.value[index],
      ...data,
      status: 'confirmed',
      reviewer: currentUser.value.name,
      reviewedAt: dayjs().toISOString()
    }

    const inboundIndex = inbounds.value.findIndex(i => i.id === reviews.value[index].inboundId)
    if (inboundIndex >= 0) {
      inbounds.value[inboundIndex].status = 'confirmed'
      inbounds.value[inboundIndex].updatedAt = dayjs().toISOString()
    }

    addLog('review', reviewId, '确认过磅复核', `过磅复核确认通过`, old, data)
    saveData()
    return { ok: true, msg: '过磅复核已确认' }
  }

  function rejectReview(reviewId: string, reason: string): { ok: boolean; msg: string } {
    if (!currentUser.value || !['sortingLeader', 'admin'].includes(currentUser.value.role)) {
      return { ok: false, msg: `当前角色"${currentUser.value?.roleLabel || '未知'}"无权驳回复核，仅分拣班长可操作` }
    }
    const index = reviews.value.findIndex(r => r.id === reviewId)
    if (index < 0) {
      return { ok: false, msg: '未找到对应复核记录' }
    }
    if (reviews.value[index].status !== 'pending') {
      return { ok: false, msg: `复核记录当前状态为"${reviews.value[index].status}"，仅待复核可驳回` }
    }

    const old = { ...reviews.value[index] }
    reviews.value[index].status = 'rejected'
    reviews.value[index].reviewRemark = reason
    reviews.value[index].reviewer = currentUser.value.name
    reviews.value[index].reviewedAt = dayjs().toISOString()

    const inboundIndex = inbounds.value.findIndex(i => i.id === reviews.value[index].inboundId)
    if (inboundIndex >= 0) {
      inbounds.value[inboundIndex].status = 'submitted'
      inbounds.value[inboundIndex].updatedAt = dayjs().toISOString()
    }

    addLog('review', reviewId, '驳回过磅复核', `驳回原因: ${reason}`, old, { status: 'rejected' })
    saveData()
    return { ok: true, msg: '已驳回' }
  }

  function createDispute(inboundId: string, disputedWeight: number, reason: string): { ok: boolean; msg: string; disputeId?: string } {
    if (!currentUser.value || !['sortingLeader', 'admin'].includes(currentUser.value.role)) {
      return { ok: false, msg: `当前角色"${currentUser.value?.roleLabel || '未知'}"无权发起争议，仅分拣班长可操作` }
    }
    const inbound = inbounds.value.find(i => i.id === inboundId)
    if (!inbound) {
      return { ok: false, msg: '未找到对应登记单' }
    }

    const dispute: WeightDispute = {
      id: generateId(),
      inboundId,
      disputedWeight,
      originalWeight: inbound.netWeight,
      difference: disputedWeight - inbound.netWeight,
      reason,
      handler: '',
      handledAt: '',
      resolution: '',
      status: 'pending'
    }
    disputes.value.unshift(dispute)

    inbound.hasDispute = true
    inbound.status = 'disputed'
    inbound.updatedAt = dayjs().toISOString()

    const review = reviews.value.find(r => r.inboundId === inboundId)
    if (review) {
      review.status = 'disputed'
      review.disputeId = dispute.id
    }

    addLog('dispute', dispute.id, '创建争议', `重量争议: 原重量 ${dispute.originalWeight}kg, 争议重量 ${disputedWeight}kg, 差异 ${dispute.difference}kg`)
    saveData()
    return { ok: true, msg: '争议已提交', disputeId: dispute.id }
  }

  function resolveDispute(disputeId: string, resolution: string, finalWeight: number): { ok: boolean; msg: string } {
    if (!currentUser.value || !['salesClerk', 'admin'].includes(currentUser.value.role)) {
      return { ok: false, msg: `当前角色"${currentUser.value?.roleLabel || '未知'}"无权处理争议，仅销售内勤可操作` }
    }
    const index = disputes.value.findIndex(d => d.id === disputeId)
    if (index < 0) {
      return { ok: false, msg: '未找到对应争议记录' }
    }
    if (disputes.value[index].status !== 'pending') {
      return { ok: false, msg: `争议当前状态为"${disputes.value[index].status}"，仅待处理争议可操作` }
    }

    const old = { ...disputes.value[index] }
    disputes.value[index].status = 'resolved'
    disputes.value[index].resolution = resolution
    disputes.value[index].handler = currentUser.value.name
    disputes.value[index].handledAt = dayjs().toISOString()
    disputes.value[index].disputedWeight = finalWeight
    disputes.value[index].difference = finalWeight - disputes.value[index].originalWeight

    const inboundIndex = inbounds.value.findIndex(i => i.id === disputes.value[index].inboundId)
    if (inboundIndex >= 0) {
      inbounds.value[inboundIndex].netWeight = finalWeight
      inbounds.value[inboundIndex].status = 'confirmed'
      inbounds.value[inboundIndex].hasDispute = false
      inbounds.value[inboundIndex].updatedAt = dayjs().toISOString()
    }

    const review = reviews.value.find(r => r.disputeId === disputeId)
    if (review) {
      review.status = 'confirmed'
      review.confirmedNetWeight = finalWeight
    }

    addLog('dispute', disputeId, '解决争议', `争议处理结果: ${resolution}, 最终重量: ${finalWeight}kg`, old, { status: 'resolved', finalWeight })
    saveData()
    return { ok: true, msg: '争议已处理' }
  }

  function updateCategoryPrice(categoryId: string, newPrice: number, reason: string) {
    const catIndex = categories.value.findIndex(c => c.id === categoryId)
    if (catIndex >= 0) {
      const oldPrice = categories.value[catIndex].defaultPrice
      categories.value[catIndex].defaultPrice = newPrice

      const change: PriceChange = {
        id: generateId(),
        categoryId,
        categoryName: categories.value[catIndex].name,
        oldPrice,
        newPrice,
        changedBy: currentUser.value?.name || '',
        changedAt: dayjs().toISOString(),
        reason
      }
      priceChanges.value.unshift(change)

      addLog('inbound', categoryId, '价格变动', `${categories.value[catIndex].name} 价格从 ${oldPrice} 调整为 ${newPrice}`)
      saveData()
    }
  }

  function setCurrentUser(user: User) {
    currentUser.value = user
    saveData()
  }

  function getInboundById(id: string) {
    return inbounds.value.find(i => i.id === id)
  }

  function getReviewById(id: string) {
    return reviews.value.find(r => r.id === id)
  }

  function getReviewByInboundId(inboundId: string) {
    return reviews.value.find(r => r.inboundId === inboundId)
  }

  function getRecentLogs(targetType?: string, targetId?: string, limit = 10) {
    let logs = operationLogs.value
    if (targetType) {
      logs = logs.filter(l => l.targetType === targetType)
    }
    if (targetId) {
      logs = logs.filter(l => l.targetId === targetId)
    }
    return logs.slice(0, limit)
  }

  function initMockData() {
    if (categories.value.length === 0) {
      categories.value = [
        { id: 'cat001', name: '废纸箱', code: 'FXZ', unit: 'kg', defaultPrice: 1.2, description: '普通废纸箱' },
        { id: 'cat002', name: '废报纸', code: 'FBZ', unit: 'kg', defaultPrice: 1.5, description: '旧报纸' },
        { id: 'cat003', name: '废塑料瓶', code: 'FSL', unit: 'kg', defaultPrice: 2.0, description: 'PET塑料瓶' },
        { id: 'cat004', name: '废铁', code: 'FT', unit: 'kg', defaultPrice: 1.8, description: '废钢铁' },
        { id: 'cat005', name: '废铜', code: 'FTong', unit: 'kg', defaultPrice: 45.0, description: '废紫铜' },
        { id: 'cat006', name: '废铝', code: 'FLv', unit: 'kg', defaultPrice: 12.0, description: '废铝合金' }
      ]
    }

    if (users.value.length === 0) {
      users.value = [
        { id: 'u001', name: '张师傅', role: 'weigher', roleLabel: '过磅员' },
        { id: 'u002', name: '李班长', role: 'sortingLeader', roleLabel: '分拣班长' },
        { id: 'u003', name: '王内勤', role: 'salesClerk', roleLabel: '销售内勤' },
        { id: 'u004', name: '管理员', role: 'admin', roleLabel: '管理员' }
      ]
      currentUser.value = users.value[0]
    }

    if (inbounds.value.length === 0) {
      const sample1 = createInbound({
        supplierName: '宏达回收站',
        vehicleNo: '京A12345',
        driverName: '刘师傅',
        driverPhone: '13800138001',
        mainCategoryId: 'cat001',
        isMixed: true,
        mixedItems: [
          { categoryId: 'cat001', categoryName: '废纸箱', estimatedWeight: 800, estimatedRatio: 80, remark: '主要是纸箱' },
          { categoryId: 'cat002', categoryName: '废报纸', estimatedWeight: 200, estimatedRatio: 20, remark: '夹杂少量报纸' }
        ],
        grossWeight: 3500,
        tareWeight: 2500,
        netWeight: 1000,
        registrationRemark: '货主说纸箱占多数，报纸约两成，需要分拣后确认。'
      })
      sample1.status = 'submitted'
      sample1.submittedBy = '张师傅'
      sample1.submittedAt = dayjs().subtract(2, 'hour').toISOString()

      const review1 = {
        id: generateId(),
        inboundId: sample1.id,
        registrationNo: sample1.registrationNo,
        reviewer: '',
        reviewedAt: '',
        confirmedGrossWeight: 3500,
        confirmedTareWeight: 2500,
        confirmedNetWeight: 1000,
        confirmedMixedItems: sample1.mixedItems.map((m: MixedCategoryItem) => ({ ...m })),
        reviewRemark: '',
        registrationRemarkSnapshot: sample1.registrationRemark,
        status: 'pending' as const
      }
      reviews.value.unshift(review1)

      const sample2 = createInbound({
        supplierName: '顺达废品站',
        vehicleNo: '冀B67890',
        driverName: '赵师傅',
        driverPhone: '13900139002',
        mainCategoryId: 'cat004',
        isMixed: false,
        mixedItems: [],
        grossWeight: 4200,
        tareWeight: 2800,
        netWeight: 1400,
        registrationRemark: '纯废铁，目测质量可以。'
      })
      sample2.status = 'confirmed'
      sample2.submittedBy = '张师傅'
      sample2.submittedAt = dayjs().subtract(1, 'day').toISOString()

      const review2 = {
        id: generateId(),
        inboundId: sample2.id,
        registrationNo: sample2.registrationNo,
        reviewer: '李班长',
        reviewedAt: dayjs().subtract(20, 'hour').toISOString(),
        confirmedGrossWeight: 4200,
        confirmedTareWeight: 2800,
        confirmedNetWeight: 1400,
        confirmedMixedItems: [],
        reviewRemark: '确认无误，纯废铁，质量合格。',
        registrationRemarkSnapshot: sample2.registrationRemark,
        status: 'confirmed' as const
      }
      reviews.value.unshift(review2)

      const sample3 = createInbound({
        supplierName: '永利回收',
        vehicleNo: '津C11111',
        driverName: '孙师傅',
        driverPhone: '13700137003',
        mainCategoryId: 'cat003',
        isMixed: true,
        mixedItems: [
          { categoryId: 'cat003', categoryName: '废塑料瓶', estimatedWeight: 600, estimatedRatio: 75 },
          { categoryId: 'cat001', categoryName: '废纸箱', estimatedWeight: 200, estimatedRatio: 25 }
        ],
        grossWeight: 3200,
        tareWeight: 2400,
        netWeight: 800,
        registrationRemark: '塑料瓶为主，带一些纸箱包装。'
      })
      sample3.status = 'draft'

      operationLogs.value = []
      addLog('inbound', sample1.id, '提交', `提交进厂登记单 ${sample1.registrationNo}`)
      addLog('inbound', sample2.id, '确认', `进厂登记单 ${sample2.registrationNo} 已确认`)
      addLog('review', review2.id, '过磅复核确认', `分拣班长李班长确认过磅`)

      recentItems.value = [
        { id: sample2.id, type: 'inbound', title: sample2.registrationNo, subtitle: '顺达废品站 - 废铁 1400kg', status: 'confirmed', visitedAt: dayjs().subtract(20, 'hour').toISOString() },
        { id: sample1.id, type: 'inbound', title: sample1.registrationNo, subtitle: '宏达回收站 - 废纸箱混装', status: 'submitted', visitedAt: dayjs().subtract(2, 'hour').toISOString() }
      ]
    }

    saveData()
  }

  async function loadData() {
    if (typeof window.electronAPI !== 'undefined') {
      try {
        const [cats, inb, revs, disp, logs, prices, recent, usrs, currUser] = await Promise.all([
          window.electronAPI.readData(STORAGE_KEYS.CATEGORIES),
          window.electronAPI.readData(STORAGE_KEYS.INBOUNDS),
          window.electronAPI.readData(STORAGE_KEYS.REVIEWS),
          window.electronAPI.readData(STORAGE_KEYS.DISPUTES),
          window.electronAPI.readData(STORAGE_KEYS.LOGS),
          window.electronAPI.readData(STORAGE_KEYS.PRICE_CHANGES),
          window.electronAPI.readData(STORAGE_KEYS.RECENT),
          window.electronAPI.readData(STORAGE_KEYS.USERS),
          window.electronAPI.readData(STORAGE_KEYS.CURRENT_USER)
        ])
        if (cats) categories.value = cats
        if (inb) inbounds.value = inb
        if (revs) reviews.value = revs
        if (disp) disputes.value = disp
        if (logs) operationLogs.value = logs
        if (prices) priceChanges.value = prices
        if (recent) recentItems.value = recent
        if (usrs) users.value = usrs
        if (currUser) currentUser.value = currUser
      } catch (e) {
        console.error('加载数据失败', e)
      }
    } else {
      try {
        const keys = Object.values(STORAGE_KEYS)
        for (const key of keys) {
          const raw = localStorage.getItem(key)
          if (raw) {
            const data = JSON.parse(raw)
            if (key === STORAGE_KEYS.CATEGORIES) categories.value = data
            else if (key === STORAGE_KEYS.INBOUNDS) inbounds.value = data
            else if (key === STORAGE_KEYS.REVIEWS) reviews.value = data
            else if (key === STORAGE_KEYS.DISPUTES) disputes.value = data
            else if (key === STORAGE_KEYS.LOGS) operationLogs.value = data
            else if (key === STORAGE_KEYS.PRICE_CHANGES) priceChanges.value = data
            else if (key === STORAGE_KEYS.RECENT) recentItems.value = data
            else if (key === STORAGE_KEYS.USERS) users.value = data
            else if (key === STORAGE_KEYS.CURRENT_USER) currentUser.value = data
          }
        }
      } catch (e) {
        console.error('加载本地存储数据失败', e)
      }
    }

    initMockData()
    isLoaded.value = true
  }

  async function saveData() {
    const dataMap: Record<string, any> = {
      [STORAGE_KEYS.CATEGORIES]: categories.value,
      [STORAGE_KEYS.INBOUNDS]: inbounds.value,
      [STORAGE_KEYS.REVIEWS]: reviews.value,
      [STORAGE_KEYS.DISPUTES]: disputes.value,
      [STORAGE_KEYS.LOGS]: operationLogs.value,
      [STORAGE_KEYS.PRICE_CHANGES]: priceChanges.value,
      [STORAGE_KEYS.RECENT]: recentItems.value,
      [STORAGE_KEYS.USERS]: users.value,
      [STORAGE_KEYS.CURRENT_USER]: currentUser.value
    }

    if (typeof window.electronAPI !== 'undefined') {
      for (const [key, val] of Object.entries(dataMap)) {
        window.electronAPI.writeData(key, val).catch(e => console.error(`保存 ${key} 失败`, e))
      }
    } else {
      for (const [key, val] of Object.entries(dataMap)) {
        try {
          localStorage.setItem(key, JSON.stringify(val))
        } catch (e) {
          console.error(`保存 ${key} 失败`, e)
        }
      }
    }
  }

  async function exportAllData() {
    const allData = {
      exportTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      categories: categories.value,
      inbounds: inbounds.value,
      reviews: reviews.value,
      disputes: disputes.value,
      operationLogs: operationLogs.value,
      priceChanges: priceChanges.value,
      users: users.value
    }
    const fileName = `分拣中心数据_${dayjs().format('YYYYMMDD_HHmmss')}.json`
    if (typeof window.electronAPI !== 'undefined') {
      return window.electronAPI.exportData(fileName, allData)
    } else {
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      return true
    }
  }

  async function importAllData() {
    let data: any
    if (typeof window.electronAPI !== 'undefined') {
      data = await window.electronAPI.importData()
    } else {
      return Promise.reject('浏览器环境请使用文件上传')
    }
    if (!data) return false

    if (data.categories) categories.value = data.categories
    if (data.inbounds) inbounds.value = data.inbounds
    if (data.reviews) reviews.value = data.reviews
    if (data.disputes) disputes.value = data.disputes
    if (data.operationLogs) operationLogs.value = data.operationLogs
    if (data.priceChanges) priceChanges.value = data.priceChanges
    if (data.users) users.value = data.users
    saveData()
    return true
  }

  return {
    categories,
    inbounds,
    reviews,
    disputes,
    operationLogs,
    priceChanges,
    recentItems,
    users,
    currentUser,
    isLoaded,
    pendingInbounds,
    pendingReviews,
    toDoCount,
    canSubmitInbound,
    canConfirmReview,
    canHandleDispute,
    canEditInbound,
    canManageSettings,
    loadData,
    saveData,
    createInbound,
    updateInbound,
    submitInbound,
    confirmReview,
    rejectReview,
    createDispute,
    resolveDispute,
    updateCategoryPrice,
    setCurrentUser,
    getInboundById,
    getReviewById,
    getReviewByInboundId,
    getRecentLogs,
    addRecentItem,
    addLog,
    exportAllData,
    importAllData,
    generateRegistrationNo
  }
})
