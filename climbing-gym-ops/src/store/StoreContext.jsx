import { createContext, useContext, useState, useMemo } from 'react'
import dayjs from 'dayjs'
import {
  routeOpenings as initialOpenings,
  maintenanceRecords as initialMaintenance,
  auditLogs as initialAuditLogs,
  ROUTE_OPEN_STATUS,
  MAINTENANCE_STATUS,
} from '../mock/data'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [routeOpenings, setRouteOpenings] = useState(initialOpenings)
  const [maintenanceRecords, setMaintenanceRecords] = useState(initialMaintenance)
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs)

  function addAuditLog(log) {
    setAuditLogs(prev => [{
      id: `a${Date.now()}`,
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
        detail: remark || '驳回',
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

    getAuditLogsByRef(refId) {
      return auditLogs
        .filter(l => l.refId === refId)
        .sort((a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf())
    },

    buildRouteOpeningAuditLogs(opening) {
      return actions.getAuditLogsByRef(opening.id)
    },

    buildMaintenanceAuditLogs(record) {
      return actions.getAuditLogsByRef(record.id)
    },
  }), [auditLogs])

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
