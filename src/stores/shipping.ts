import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ShippingRecord, ShippingStatus } from '@/types'

const now = new Date()
const fmt = (d: Date) => d.toISOString()
const hoursAgo = (h: number) => {
  const d = new Date(now.getTime() - h * 3600000)
  return fmt(d)
}

const mockShipping: ShippingRecord[] = [
  {
    id: 'SH-001',
    orderId: 'WO-20260601-005',
    trackingNo: '',
    carrier: '顺丰速运',
    status: 'pending',
    assignedCs: 'staff-2',
    reason: '等待包装完成',
  },
  {
    id: 'SH-002',
    orderId: 'WO-20260601-006',
    trackingNo: 'SF1234567890',
    carrier: '顺丰速运',
    status: 'shipped',
    shippedAt: hoursAgo(24),
    assignedCs: 'staff-1',
    reason: '客户催单，需优先处理',
  },
  {
    id: 'SH-003',
    orderId: 'WO-20260601-007',
    trackingNo: 'SF9876543210',
    carrier: '顺丰速运',
    status: 'shipped',
    shippedAt: hoursAgo(48),
    assignedCs: 'staff-2',
  },
  {
    id: 'SH-004',
    orderId: 'WO-20260601-008',
    trackingNo: 'SF5555666677',
    carrier: '中通快递',
    status: 'delivered',
    shippedAt: hoursAgo(72),
    deliveredAt: hoursAgo(48),
    assignedCs: 'staff-1',
  },
  {
    id: 'SH-005',
    orderId: 'WO-20260601-012',
    trackingNo: '',
    carrier: '顺丰速运',
    status: 'pending',
    assignedCs: 'staff-1',
    reason: '等待质检放行完成',
  },
  {
    id: 'SH-006',
    orderId: 'WO-20260601-002',
    trackingNo: '',
    carrier: '圆通速递',
    status: 'pending',
    assignedCs: 'staff-2',
  },
]

export const useShippingStore = defineStore('shipping', () => {
  const records = ref<ShippingRecord[]>([...mockShipping])

  const pendingShipments = computed(() =>
    records.value.filter((r) => r.status === 'pending')
  )

  const shippedRecords = computed(() =>
    records.value.filter((r) => r.status === 'shipped')
  )

  const deliveredRecords = computed(() =>
    records.value.filter((r) => r.status === 'delivered')
  )

  function initShipping(orderId: string, carrier: string, assignedCs: string) {
    const existing = records.value.find((r) => r.orderId === orderId)
    if (existing) {
      existing.status = 'shipped' as ShippingStatus
      existing.carrier = carrier
      existing.trackingNo = `SF${Date.now().toString().slice(-10)}`
      existing.shippedAt = fmt(new Date())
      return existing
    }
    const rec: ShippingRecord = {
      id: `SH-${String(records.value.length + 1).padStart(3, '0')}`,
      orderId,
      trackingNo: `SF${Date.now().toString().slice(-10)}`,
      carrier,
      status: 'shipped' as ShippingStatus,
      shippedAt: fmt(new Date()),
      assignedCs,
    }
    records.value.unshift(rec)
    return rec
  }

  function markDelivered(recordId: string) {
    const rec = records.value.find((r) => r.id === recordId)
    if (rec) {
      rec.status = 'delivered' as ShippingStatus
      rec.deliveredAt = fmt(new Date())
    }
  }

  function ensurePendingRecord(orderId: string, assignedCs: string) {
    const existing = records.value.find((r) => r.orderId === orderId)
    if (existing) {
      if (existing.status === 'delivered') return existing
      existing.status = 'pending' as ShippingStatus
      existing.assignedCs = assignedCs
      existing.trackingNo = ''
      existing.shippedAt = undefined
      existing.deliveredAt = undefined
      return existing
    }
    const rec: ShippingRecord = {
      id: `SH-${String(records.value.length + 1).padStart(3, '0')}`,
      orderId,
      trackingNo: '',
      carrier: '顺丰速运',
      status: 'pending' as ShippingStatus,
      assignedCs,
    }
    records.value.unshift(rec)
    return rec
  }

  function getRecordByOrderId(orderId: string): ShippingRecord | undefined {
    return records.value.find((r) => r.orderId === orderId)
  }

  return {
    records,
    pendingShipments,
    shippedRecords,
    deliveredRecords,
    initShipping,
    markDelivered,
    ensurePendingRecord,
    getRecordByOrderId,
  }
})
