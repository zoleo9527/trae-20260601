import { createContext, useContext, useState, useMemo } from 'react'
import dayjs from 'dayjs'
import {
  routeOpenings as initialOpenings,
  maintenanceRecords as initialMaintenance,
  auditLogs as initialAuditLogs,
  ROUTE_OPEN_STATUS,
  MAINTENANCE_STATUS,
  getRouteById,
  getUserById,
} from '../mock/data'

const StoreContext = createContext(null)

const STAGE = {
  SUBMIT: 'submit',
  BELAYER_CONFIRM: 'belayer_confirm',
  ADMIN_APPROVE: 'admin_approve',
  ADMIN_REJECT: 'admin_reject',
  MAINT_CONFIRM: 'maint_confirm',
  MAINT_CLOSE: 'maint_close',
}

function buildRouteOpeningTrail(opening) {
  const trail = []
  const route = getRouteById(opening.routeId)

  trail.push({
    id: `${opening.id}-${STAGE.SUBMIT}`,
    stage: STAGE.SUBMIT,
    type: 'route_open',
    refId: opening.id,
    action: '提交线路开放申请',
    operatorId: opening.submittedBy,
    timestamp: opening.submittedAt,
    detail: `线路：${route?.name}（${route?.grade} · ${route?.zone}）`,
  })

  if (opening.belayerId && opening.belayerConfirmedAt) {
    trail.push({
      id: `${opening.id}-${STAGE.BELAYER_CONFIRM}`,
      stage: STAGE.BELAYER_CONFIRM,
      type: 'route_open',
      refId: opening.id,
      action: '保护员确认',
      operatorId: opening.belayerId,
      timestamp: opening.belayerConfirmedAt,
      detail: '已确认安全检查通过',
    })
  }

  if (opening.adminId && opening.adminApprovedAt) {
    const isApproved = opening.status === ROUTE_OPEN_STATUS.APPROVED
    trail.push({
      id: `${opening.id}-${isApproved ? STAGE.ADMIN_APPROVE : STAGE.ADMIN_REJECT}`,
      stage: isApproved ? STAGE.ADMIN_APPROVE : STAGE.ADMIN_REJECT,
      type: 'route_open',
      refId: opening.id,
      action: isApproved ? '线路管理员审核通过' : '线路管理员驳回',
      operatorId: opening.adminId,
      timestamp: opening.adminApprovedAt,
      detail: isApproved ? '线路正式开放' : (opening.remark || '驳回，未说明原因'),
    })
  }

  return trail.sort((a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf())
}

function buildMaintenanceTrail(record) {
  const trail = []
  const route = getRouteById(record.routeId)

  trail.push({
    id: `${record.id}-${STAGE.SUBMIT}`,
    stage: STAGE.SUBMIT,
    type: 'maintenance',
    refId: record.id,
    action: '提交维护记录',
    operatorId: record.submittedBy,
    timestamp: record.submittedAt,
    detail: `${record.type} - ${route?.name}（${route?.grade}）：${record.description}`,
  })

  if (record.confirmedBy && record.confirmedAt) {
    trail.push({
      id: `${record.id}-${STAGE.MAINT_CONFIRM}`,
      stage: STAGE.MAINT_CONFIRM,
      type: 'maintenance',
      refId: record.id,
      action: '保护员确认维护',
      operatorId: record.confirmedBy,
      timestamp: record.confirmedAt,
      detail: `已确认${record.type}完成，安全检查通过`,
    })
  }

  if (record.closedAt) {
    trail.push({
      id: `${record.id}-${STAGE.MAINT_CLOSE}`,
      stage: STAGE.MAINT_CLOSE,
      type: 'maintenance',
      refId: record.id,
      action: '关闭维护记录',
      operatorId: record.submittedBy,
      timestamp: record.closedAt,
      detail: '维护完成，线路恢复正常使用',
    })
  }

  return trail.sort((a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf())
}

export function StoreProvider({ children }) {
  const [routeOpenings, setRouteOpenings] = useState(initialOpenings)
  const [maintenanceRecords, setMaintenanceRecords] = useState(initialMaintenance)
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs)

  function addAuditLog(log) {
    setAuditLogs(prev => [{
      id: `a${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
      ...log,
    }, ...prev])
  }

  const actions = useMemo(() => ({
    submitRouteOpening({ routeId, remark, submittedBy }) {
      const newId = `ro${Date.now()}`
      const newItem = {
        id: newId,
        routeId,
        submittedBy,
        submittedAt: dayjs().format('YYYY-MM-DD HH:mm'),
        status: ROUTE_OPEN_STATUS.PENDING_BELAYER,
        belayerId: null,
        belayerConfirmedAt: null,
        adminId: null,
        adminApprovedAt: null,
        openDate: null,
        remark,
      }
      setRouteOpenings(prev => [newItem, ...prev])
      addAuditLog({
        type: 'route_open',
        refId: newId,
        action: '提交线路开放申请',
        operatorId: submittedBy,
        detail: `线路ID：${routeId}`,
      })
      return newId
    },

    confirmRouteOpeningByBelayer({ id, belayerId }) {
      setRouteOpenings(prev => prev.map(o => o.id === id ? {
        ...o,
        status: ROUTE_OPEN_STATUS.BELAYER_CONFIRMED,
        belayerId,
        belayerConfirmedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      } : o))
      addAuditLog({
        type: 'route_open',
        refId: id,
        action: '保护员确认',
        operatorId: belayerId,
        detail: '确认安全检查通过',
      })
    },

    approveRouteOpening({ id, adminId }) {
      setRouteOpenings(prev => prev.map(o => o.id === id ? {
        ...o,
        status: ROUTE_OPEN_STATUS.APPROVED,
        adminId,
        adminApprovedAt: dayjs().format('YYYY-MM-DD HH:mm'),
        openDate: dayjs().format('YYYY-MM-DD'),
      } : o))
      addAuditLog({
        type: 'route_open',
        refId: id,
        action: '线路管理员审核通过',
        operatorId: adminId,
        detail: '线路正式开放',
      })
    },

    rejectRouteOpening({ id, adminId, remark }) {
      setRouteOpenings(prev => prev.map(o => o.id === id ? {
        ...o,
        status: ROUTE_OPEN_STATUS.REJECTED,
        adminId,
        adminApprovedAt: dayjs().format('YYYY-MM-DD HH:mm'),
        remark: remark || o.remark,
      } : o))
      addAuditLog({
        type: 'route_open',
        refId: id,
        action: '线路管理员驳回',
        operatorId: adminId,
        detail: remark || '驳回，未说明原因',
      })
    },

    submitMaintenance({ routeId, type, description, submittedBy, attachments = [] }) {
      const newId = `m${Date.now()}`
      const newItem = {
        id: newId,
        routeId,
        type,
        description,
        submittedBy,
        submittedAt: dayjs().format('YYYY-MM-DD HH:mm'),
        status: MAINTENANCE_STATUS.PENDING_CONFIRM,
        confirmedBy: null,
        confirmedAt: null,
        closedAt: null,
        attachments,
      }
      setMaintenanceRecords(prev => [newItem, ...prev])
      addAuditLog({
        type: 'maintenance',
        refId: newId,
        action: '提交维护记录',
        operatorId: submittedBy,
        detail: `${type} - 线路ID：${routeId}`,
      })
      return newId
    },

    confirmMaintenance({ id, confirmedBy }) {
      setMaintenanceRecords(prev => prev.map(m => m.id === id ? {
        ...m,
        status: MAINTENANCE_STATUS.CONFIRMED,
        confirmedBy,
        confirmedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      } : m))
      addAuditLog({
        type: 'maintenance',
        refId: id,
        action: '保护员确认维护',
        operatorId: confirmedBy,
        detail: '已确认维护完成',
      })
    },

    closeMaintenance({ id, operatorId }) {
      setMaintenanceRecords(prev => prev.map(m => m.id === id ? {
        ...m,
        status: MAINTENANCE_STATUS.CLOSED,
        closedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      } : m))
      addAuditLog({
        type: 'maintenance',
        refId: id,
        action: '关闭维护记录',
        operatorId,
        detail: '维护完成，线路恢复',
      })
    },

    buildRouteOpeningAuditLogs(opening) {
      return buildRouteOpeningTrail(opening)
    },

    buildMaintenanceAuditLogs(record) {
      return buildMaintenanceTrail(record)
    },

    buildAuditLogsForRef(refId) {
      const opening = routeOpenings.find(o => o.id === refId)
      if (opening) return buildRouteOpeningTrail(opening)
      const record = maintenanceRecords.find(m => m.id === refId)
      if (record) return buildMaintenanceTrail(record)
      return []
    },

    getRecentGlobalAuditLogs(limit = 10) {
      const all = []
      routeOpenings.forEach(o => {
        all.push(...buildRouteOpeningTrail(o))
      })
      maintenanceRecords.forEach(m => {
        all.push(...buildMaintenanceTrail(m))
      })
      return all
        .sort((a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf())
        .slice(0, limit)
    },
  }), [auditLogs, routeOpenings, maintenanceRecords])

  const value = useMemo(() => ({
    routeOpenings,
    maintenanceRecords,
    auditLogs,
    actions,
  }), [routeOpenings, maintenanceRecords, auditLogs, actions])

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
