import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Exception, ExceptionType, ExceptionSeverity } from '@/types'

const now = new Date()
const fmt = (d: Date) => d.toISOString()
const hoursAgo = (h: number) => {
  const d = new Date(now.getTime() - h * 3600000)
  return fmt(d)
}

const mockExceptions: Exception[] = [
  {
    id: 'EX-001',
    orderId: 'WO-20260601-003',
    type: 'bite_issue',
    severity: 'high',
    description: '咬合偏高0.5mm，患者佩戴后不适',
    triggeredBy: 'staff-5',
    triggeredAt: hoursAgo(6),
    notified: true,
    resolved: false,
  },
  {
    id: 'EX-002',
    orderId: 'WO-20260601-001',
    type: 'color_mismatch',
    severity: 'medium',
    description: '比色与设计图有色差，A2偏黄',
    triggeredBy: 'staff-6',
    triggeredAt: hoursAgo(4),
    notified: false,
    resolved: false,
  },
  {
    id: 'EX-003',
    orderId: 'WO-20260601-004',
    type: 'shape_issue',
    severity: 'high',
    description: '形态与口扫数据偏差，远中邻接过紧',
    triggeredBy: 'staff-5',
    triggeredAt: hoursAgo(2),
    notified: true,
    resolved: false,
  },
  {
    id: 'EX-004',
    orderId: 'WO-20260601-009',
    type: 'material_defect',
    severity: 'low',
    description: '内冠表面微裂纹，需确认是否影响强度',
    triggeredBy: 'staff-6',
    triggeredAt: hoursAgo(3),
    notified: false,
    resolved: false,
  },
  {
    id: 'EX-005',
    orderId: 'WO-20260601-006',
    type: 'other',
    severity: 'medium',
    description: '患者临时更改回寄地址，原快递需拦截',
    triggeredBy: 'staff-1',
    triggeredAt: hoursAgo(1),
    notified: true,
    resolved: false,
  },
]

export const useExceptionStore = defineStore('exception', () => {
  const exceptions = ref<Exception[]>([...mockExceptions])

  const unresolvedExceptions = computed(() =>
    exceptions.value.filter((e) => !e.resolved)
  )

  const highSeverityExceptions = computed(() =>
    unresolvedExceptions.value.filter((e) => e.severity === 'high')
  )

  function addException(payload: {
    orderId: string
    type: ExceptionType
    severity: ExceptionSeverity
    description: string
    triggeredBy: string
  }) {
    const ex: Exception = {
      id: `EX-${String(exceptions.value.length + 1).padStart(3, '0')}`,
      orderId: payload.orderId,
      type: payload.type,
      severity: payload.severity,
      description: payload.description,
      triggeredBy: payload.triggeredBy,
      triggeredAt: fmt(new Date()),
      notified: false,
      resolved: false,
    }
    exceptions.value.unshift(ex)
    return ex
  }

  function sendNotification(exceptionId: string) {
    const ex = exceptions.value.find((e) => e.id === exceptionId)
    if (ex) {
      ex.notified = true
    }
  }

  function resolveException(exceptionId: string) {
    const ex = exceptions.value.find((e) => e.id === exceptionId)
    if (ex) {
      ex.resolved = true
    }
  }

  return {
    exceptions,
    unresolvedExceptions,
    highSeverityExceptions,
    addException,
    sendNotification,
    resolveException,
  }
})
