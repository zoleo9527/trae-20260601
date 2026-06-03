import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ShippingRecord } from '@/types'
import { useOrderStore } from '@/stores/order'

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
    assignedCs: 'staff-2',
    reason: '等待包装完成',
  },
  {
    id: 'SH-002',
    orderId: 'WO-20260601-006',
    trackingNo: 'SF1234567890',
    carrier: '顺丰速运',
    shippedAt: hoursAgo(24),
    assignedCs: 'staff-1',
    reason: '客户催单，需优先处理',
  },
  {
    id: 'SH-003',
    orderId: 'WO-20260601-007',
    trackingNo: 'SF9876543210',
    carrier: '顺丰速运',
    shippedAt: hoursAgo(48),
    assignedCs: 'staff-2',
  },
  {
    id: 'SH-004',
    orderId: 'WO-20260601-008',
    trackingNo: 'SF5555666677',
    carrier: '中通快递',
    shippedAt: hoursAgo(72),
    deliveredAt: hoursAgo(48),
    assignedCs: 'staff-1',
  },
  {
    id: 'SH-005',
    orderId: 'WO-20260601-012',
    trackingNo: '',
    carrier: '顺丰速运',
    assignedCs: 'staff-1',
  },
]

export const useShippingStore = defineStore('shipping', () => {
  const records = ref<ShippingRecord[]>([...mockShipping])
  let nextId = records.value.length + 1

  function findOrStubRecord(orderId: string, assignedCs: string): ShippingRecord {
    const existing = records.value.find((r) => r.orderId === orderId)
    if (existing) return existing
    return {
      id: `SH-VIRTUAL-${orderId}`,
      orderId,
      trackingNo: '',
      carrier: '顺丰速运',
      assignedCs,
    }
  }

  const pendingShipments = computed(() => {
    const orderStore = useOrderStore()
    return orderStore.orders
      .filter((o) => o.status === 'pending_shipping')
      .map((o) => findOrStubRecord(o.id, o.assignedCs))
  })

  const shippedRecords = computed(() => {
    const orderStore = useOrderStore()
    return orderStore.orders
      .filter((o) => o.status === 'shipped')
      .map((o) => findOrStubRecord(o.id, o.assignedCs))
  })

  const deliveredRecords = computed(() => {
    const orderStore = useOrderStore()
    return orderStore.orders
      .filter((o) => o.status === 'delivered')
      .map((o) => findOrStubRecord(o.id, o.assignedCs))
  })

  function ensurePersisted(orderId: string, assignedCs: string): ShippingRecord {
    const existing = records.value.find((r) => r.orderId === orderId)
    if (existing) return existing
    const rec: ShippingRecord = {
      id: `SH-${String(nextId++).padStart(3, '0')}`,
      orderId,
      trackingNo: '',
      carrier: '顺丰速运',
      assignedCs,
    }
    records.value.unshift(rec)
    return rec
  }

  function initShipping(orderId: string, carrier: string, assignedCs: string) {
    const orderStore = useOrderStore()
    const rec = ensurePersisted(orderId, assignedCs)
    rec.trackingNo = `SF${Date.now().toString().slice(-10)}`
    rec.carrier = carrier
    rec.shippedAt = fmt(new Date())
    rec.deliveredAt = undefined
    orderStore.shipOrder(orderId)
    return rec
  }

  function markDelivered(recordId: string) {
    const orderStore = useOrderStore()
    const rec = records.value.find((r) => r.id === recordId)
    if (rec) {
      rec.deliveredAt = fmt(new Date())
      orderStore.deliverOrder(rec.orderId)
    }
  }

  function ensurePendingRecord(orderId: string, assignedCs: string) {
    const rec = ensurePersisted(orderId, assignedCs)
    rec.trackingNo = ''
    rec.shippedAt = undefined
    rec.deliveredAt = undefined
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
