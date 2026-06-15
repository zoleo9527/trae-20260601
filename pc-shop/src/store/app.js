import { defineStore } from 'pinia'
import { arrivals as mockArrivals } from '@/data/arrivals'
import { schedules as mockSchedules } from '@/data/schedules'
import { allAnomalies as mockAnomalies, repairs as mockRepairs } from '@/data/anomalies'

export const useAppStore = defineStore('app', {
  state: () => ({
    arrivals: JSON.parse(JSON.stringify(mockArrivals)),
    schedules: JSON.parse(JSON.stringify(mockSchedules)),
    anomalies: JSON.parse(JSON.stringify(mockAnomalies)),
    repairs: JSON.parse(JSON.stringify(mockRepairs)),
    selectedScheduleId: null,
    selectedArrivalId: null,
    showPriceChangeModal: false,
    showArrivalCheckModal: false
  }),
  getters: {
    pendingArrivals: (state) => state.arrivals.filter(a => a.status === 'pending'),
    partialArrivals: (state) => state.arrivals.filter(a => a.status === 'partial'),
    todaySchedules: (state) => state.schedules.filter(s => ['in_progress', 'pending', 'parts_missing'].includes(s.status)),
    urgentSchedules: (state) => state.schedules.filter(s => s.urgent && s.status !== 'completed'),
    anomalyCount: (state) => state.anomalies.filter(a => a.status !== 'resolved').length,
    dangerAnomalies: (state) => state.anomalies.filter(a => a.level === 'danger' && a.status !== 'resolved'),
    warningAnomalies: (state) => state.anomalies.filter(a => a.level === 'warning' && a.status !== 'resolved'),
    pendingAnomalies: (state) => state.anomalies.filter(a => a.status === 'pending'),
    todayTodoCount: (state) => {
      const arr = state.arrivals.filter(a => a.status === 'pending' || a.status === 'partial').length
      const sch = state.schedules.filter(s => ['in_progress', 'parts_missing', 'pending'].includes(s.status)).length
      const an = state.anomalies.filter(a => a.status === 'pending').length
      return arr + sch + an
    },
    getArrivalById: (state) => (id) => state.arrivals.find(a => a.id === id),
    getScheduleById: (state) => (id) => state.schedules.find(s => s.id === id),
    getAnomaliesByRelatedId: (state) => (id) => state.anomalies.filter(a => a.relatedId === id),
    getRepairsByBatchCode: (state) => (code) => state.repairs.filter(r => r.batchCode === code)
  },
  actions: {
    updateArrivalItemReceived(arrivalId, itemIndex, received, note = '') {
      const arr = this.arrivals.find(a => a.id === arrivalId)
      if (arr && arr.items[itemIndex]) {
        arr.items[itemIndex].received = received
        if (note) arr.items[itemIndex].note = note
        arr.checkedItems = arr.items.reduce((sum, it) => sum + (it.received > 0 ? 1 : 0), 0)
        const allFull = arr.items.every(it => it.received === it.qty)
        const anyReceived = arr.items.some(it => it.received > 0)
        if (allFull) arr.status = 'completed'
        else if (anyReceived) arr.status = 'partial'
      }
    },
    confirmArrivalComplete(arrivalId, operator, actualDate) {
      const arr = this.arrivals.find(a => a.id === arrivalId)
      if (arr) {
        arr.status = 'completed'
        arr.receivedBy = operator
        arr.actualDate = actualDate
        arr.history.push({
          time: actualDate,
          operator: operator,
          action: '完成验收',
          detail: `${arr.checkedItems}/${arr.totalItems}件配件入库完成`
        })
      }
    },
    updateAnomalyStatus(anomalyId, status) {
      const an = this.anomalies.find(a => a.id === anomalyId)
      if (an) an.status = status
    },
    updateScheduleStatus(scheduleId, status, operator) {
      const sch = this.schedules.find(s => s.id === scheduleId)
      if (sch) {
        const oldStatus = sch.status
        sch.status = status
        sch.history.push({
          time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          operator: operator,
          action: `状态变更：${this._statusLabel(oldStatus)} → ${this._statusLabel(status)}`,
          detail: ''
        })
        if (status === 'completed') {
          sch.actualComplete = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 10)
        }
      }
    },
    assignTechnician(scheduleId, technician, operator) {
      const sch = this.schedules.find(s => s.id === scheduleId)
      if (sch) {
        sch.technician = technician
        sch.history.push({
          time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          operator: operator,
          action: '指派装机师',
          detail: `装机师: ${technician}`
        })
      }
    },
    confirmPriceChange(scheduleId, confirmed, operator) {
      const sch = this.schedules.find(s => s.id === scheduleId)
      if (sch && sch.anomaly && sch.anomaly.type === 'price_change') {
        if (confirmed) {
          sch.totalAmount += sch.priceChangeDiff === 0 ? 3200 : sch.priceChangeDiff
          sch.priceChangeDiff = 0
          sch.priceChanged = false
          sch.anomaly = null
          sch.history.push({
            time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
            operator: operator,
            action: '确认配置变更价格',
            detail: `更新总价至 ¥${sch.totalAmount.toLocaleString()}`
          })
          const an = this.anomalies.find(a => a.id === 'AN-001')
          if (an) an.status = 'resolved'
        }
      }
    },
    _statusLabel(s) {
      const map = {
        pending: '待排程',
        parts_missing: '待配件',
        in_progress: '装机中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return map[s] || s
    },
    addHistoryEntry(targetType, targetId, entry) {
      if (targetType === 'arrival') {
        const arr = this.arrivals.find(a => a.id === targetId)
        if (arr) arr.history.push(entry)
      } else if (targetType === 'schedule') {
        const sch = this.schedules.find(s => s.id === targetId)
        if (sch) sch.history.push(entry)
      }
    }
  }
})
