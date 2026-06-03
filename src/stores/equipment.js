import { defineStore } from 'pinia'
import { mockRentals, STATUS_FLOW, STATUS_LABELS, INTEGRATION_POINTS } from '@/data/mockData'

export const useEquipmentStore = defineStore('equipment', {
  state: () => ({
    rentals: [...mockRentals],
    integrationPoints: [...INTEGRATION_POINTS]
  }),

  getters: {
    getById: (state) => (id) => state.rentals.find(r => r.id === id),

    pendingOutbound: (state) => state.rentals.filter(r =>
      r.status === STATUS_FLOW.PENDING_OUTBOUND || r.status === STATUS_FLOW.OUTBOUND_INSPECTING
    ),

    completedOutbound: (state) => state.rentals.filter(r =>
      r.status === STATUS_FLOW.OUTBOUND_COMPLETED || r.status === STATUS_FLOW.RENTING
    ),

    pendingReturn: (state) => state.rentals.filter(r =>
      r.status === STATUS_FLOW.PENDING_RETURN || r.status === STATUS_FLOW.RETURN_INSPECTING
    ),

    completedReturn: (state) => state.rentals.filter(r =>
      r.status === STATUS_FLOW.RETURN_COMPLETED ||
      r.status === STATUS_FLOW.ABNORMAL ||
      r.status === STATUS_FLOW.IN_REPAIR ||
      r.status === STATUS_FLOW.CLOSED
    ),

    allRentals: (state) => state.rentals,

    stats: (state) => ({
      pendingOutboundCount: state.rentals.filter(r => r.status === STATUS_FLOW.PENDING_OUTBOUND).length,
      rentingCount: state.rentals.filter(r => r.status === STATUS_FLOW.RENTING).length,
      pendingReturnCount: state.rentals.filter(r => r.status === STATUS_FLOW.PENDING_RETURN).length,
      abnormalCount: state.rentals.filter(r =>
        r.status === STATUS_FLOW.ABNORMAL || r.status === STATUS_FLOW.IN_REPAIR
      ).length,
      todayCompleted: state.rentals.filter(r => {
        const today = new Date()
        const completed = r.returnInspection?.inspectedAt
        if (!completed) return false
        const completedDate = new Date(completed)
        return completedDate.toDateString() === today.toDateString()
      }).length
    }),

    getStatusInfo: () => (status) => STATUS_LABELS[status] || { label: '未知状态', type: 'info' },

    getOutboundKeyPoints: () => (rental) => {
      if (!rental.outboundInspection) return []
      const items = rental.outboundInspection.items
      return Object.entries(items)
        .filter(([_, item]) => item.keyPoint)
        .map(([key, item]) => ({ key, ...item }))
    }
  },

  actions: {
    changeStatus(rentalId, newStatus, remark, attachments = []) {
      const rental = this.rentals.find(r => r.id === rentalId)
      if (!rental) return

      rental.statusHistory.push({
        status: newStatus,
        operator: '当前用户',
        operatorRole: 'frontline',
        timestamp: Date.now(),
        remark,
        attachments
      })

      rental.status = newStatus
    },

    startOutboundInspection(rentalId) {
      this.changeStatus(
        rentalId,
        STATUS_FLOW.OUTBOUND_INSPECTING,
        '开始出库验机'
      )
    },

    completeOutboundInspection(rentalId, inspectionData) {
      const rental = this.rentals.find(r => r.id === rentalId)
      if (!rental) return

      rental.outboundInspection = {
        inspector: '当前用户',
        inspectedAt: Date.now(),
        items: inspectionData.items,
        overallResult: inspectionData.overallResult,
        summary: inspectionData.summary,
        customerConfirmed: inspectionData.customerConfirmed,
        signature: inspectionData.signature || '#mock-signature'
      }

      this.changeStatus(
        rentalId,
        STATUS_FLOW.OUTBOUND_COMPLETED,
        '出库验机完成，客户确认'
      )

      this.changeStatus(
        rentalId,
        STATUS_FLOW.RENTING,
        '设备已出库，租赁开始'
      )
    },

    startReturnInspection(rentalId) {
      this.changeStatus(
        rentalId,
        STATUS_FLOW.RETURN_INSPECTING,
        '开始归还复核'
      )
    },

    completeReturnInspection(rentalId, inspectionData) {
      const rental = this.rentals.find(r => r.id === rentalId)
      if (!rental) return

      rental.returnInspection = {
        inspector: '当前用户',
        inspectedAt: Date.now(),
        items: inspectionData.items,
        overallResult: inspectionData.overallResult,
        summary: inspectionData.summary,
        anomalyReport: inspectionData.anomalyReport || null,
        customerConfirmed: inspectionData.customerConfirmed
      }

      if (inspectionData.overallResult === 'abnormal') {
        this.changeStatus(
          rentalId,
          STATUS_FLOW.ABNORMAL,
          inspectionData.anomalyReport?.pendingAction || '发现异常，待处理',
          inspectionData.attachments || []
        )
      } else {
        this.changeStatus(
          rentalId,
          STATUS_FLOW.RETURN_COMPLETED,
          '归还复核完成，无异常'
        )
      }
    },

    handleAnomaly(rentalId, actionData) {
      const rental = this.rentals.find(r => r.id === rentalId)
      if (!rental) return

      if (actionData.action === 'send_repair') {
        rental.repairRecord = {
          repairOrderNo: `RP${Date.now()}`,
          repairShop: actionData.repairShop,
          sendDate: new Date().toISOString().split('T')[0],
          estimatedCompletion: actionData.estimatedCompletion,
          estimatedCost: actionData.estimatedCost,
          status: 'repairing',
          notes: actionData.notes
        }

        this.changeStatus(
          rentalId,
          STATUS_FLOW.IN_REPAIR,
          `已送修：${actionData.notes}`,
          [{ type: 'repair', name: '维修工单', url: '#', uploadedAt: Date.now() }]
        )
      } else if (actionData.action === 'close') {
        this.changeStatus(
          rentalId,
          STATUS_FLOW.RETURN_COMPLETED,
          `异常已处理：${actionData.notes}`
        )
      }
    },

    completeRepair(rentalId, actualCost) {
      const rental = this.rentals.find(r => r.id === rentalId)
      if (!rental || !rental.repairRecord) return

      rental.repairRecord.actualCost = actualCost
      rental.repairRecord.status = 'completed'
      rental.repairRecord.completedAt = Date.now()

      this.changeStatus(
        rentalId,
        STATUS_FLOW.RETURN_COMPLETED,
        `维修完成，实际费用：${actualCost}元`
      )
    },

    closeRental(rentalId, remark) {
      this.changeStatus(
        rentalId,
        STATUS_FLOW.CLOSED,
        remark || '订单结案'
      )
    },

    batchAction(action, rentalIds, data) {
      const results = { success: [], failed: [] }

      rentalIds.forEach(id => {
        try {
          switch (action) {
            case 'batch_start_outbound':
              this.startOutboundInspection(id)
              results.success.push(id)
              break
            case 'batch_start_return':
              this.startReturnInspection(id)
              results.success.push(id)
              break
            case 'batch_close':
              this.closeRental(id, data?.remark || '批量结案')
              results.success.push(id)
              break
            default:
              results.failed.push({ id, reason: '不支持的操作' })
          }
        } catch (e) {
          results.failed.push({ id, reason: e.message })
        }
      })

      return results
    },

    compareInspections(rentalId) {
      const rental = this.rentals.find(r => r.id === rentalId)
      if (!rental || !rental.outboundInspection || !rental.returnInspection) {
        return null
      }

      const outbound = rental.outboundInspection.items
      const return_ = rental.returnInspection.items
      const differences = []

      Object.keys(outbound).forEach(key => {
        const outItem = outbound[key]
        const retItem = return_[key]

        if (outItem.result === 'not_applicable' || retItem.result === 'not_applicable') {
          return
        }

        if (outItem.result !== retItem.result) {
          differences.push({
            item: key,
            outbound: outItem,
            return: retItem,
            isAbnormal: retItem.result === 'abnormal'
          })
        }
      })

      return differences
    }
  }
})
