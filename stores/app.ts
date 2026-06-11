import { defineStore } from 'pinia'
import type {
  UserRole, User, InspectionRecord, RectificationRecord,
  TodoItem, Alert, InspectionCriterion, TimelineEvent
} from '~/types'
import {
  users, inspectionCriteria, mockInspections, mockRectifications,
  mockTodos, mockAlerts, getTimelineByInspection
} from '~/data/mockData'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentRole: 'project_manager' as UserRole,
    users: users as Record<UserRole, User>,
    inspections: [...mockInspections] as InspectionRecord[],
    rectifications: [...mockRectifications] as RectificationRecord[],
    alerts: [...mockAlerts] as Alert[],
    criteria: [...inspectionCriteria] as InspectionCriterion[],
    showAlertPanel: false,
    selectedInspectionId: null as string | null,
    selectedRectificationId: null as string | null
  }),
  getters: {
    currentUser: (state): User => state.users[state.currentRole],
    todos: (state): TodoItem[] => mockTodos[state.currentRole],
    unreadAlerts: (state): Alert[] => state.alerts.filter(a => !a.isRead),
    unreadCount: (state): number => state.alerts.filter(a => !a.isRead).length,
    pendingTodoCount: (state): number => mockTodos[state.currentRole].length,
    statsByRole: (state) => {
      const role = state.currentRole
      if (role === 'technician') {
        return {
          pendingRectification: state.rectifications.filter(r =>
            r.assigneeRole === 'technician' && ['pending', 'in_progress'].includes(r.status)
          ).length,
          pendingInspection: state.inspections.filter(i =>
            i.status === 'pending' && i.inspector === state.users[role].name
          ).length,
          completedThisMonth: 4,
          totalElevators: 12
        }
      } else if (role === 'customer_service') {
        return {
          underReview: state.inspections.filter(i => i.status === 'under_review').length,
          rectificationInProgress: state.rectifications.filter(r =>
            ['pending', 'in_progress', 'recheck'].includes(r.status)
          ).length,
          pendingNotification: 3,
          followUpsThisWeek: 8
        }
      } else {
        const nonClosedRects = state.rectifications.filter(r =>
          ['pending', 'in_progress', 'recheck', 'passed'].includes(r.status)
        )
        return {
          toReview: state.inspections.filter(i => i.status === 'under_review').length,
          toRecheck: state.rectifications.filter(r => r.status === 'recheck').length,
          toSignLoop: state.rectifications.filter(r => r.status === 'passed').length,
          nonCompliant: state.inspections.filter(i => i.status === 'non_compliant').length,
          nonClosedRectifications: nonClosedRects.length,
          closedThisMonth: state.rectifications.filter(r => r.status === 'closed').length,
          onTimeRate: 94.5
        }
      }
    },
    selectedInspection: (state): InspectionRecord | undefined =>
      state.inspections.find(i => i.id === state.selectedInspectionId),
    selectedRectification: (state): RectificationRecord | undefined =>
      state.rectifications.find(r => r.id === state.selectedRectificationId)
  },
  actions: {
    switchRole(role: UserRole) {
      this.currentRole = role
      this.showAlertPanel = false
    },
    toggleAlertPanel() {
      this.showAlertPanel = !this.showAlertPanel
    },
    closeAlertPanel() {
      this.showAlertPanel = false
    },
    markAlertRead(id: string) {
      const alert = this.alerts.find(a => a.id === id)
      if (alert) alert.isRead = true
    },
    markAllAlertsRead() {
      this.alerts.forEach(a => a.isRead = true)
    },
    setSelectedInspection(id: string | null) {
      this.selectedInspectionId = id
    },
    setSelectedRectification(id: string | null) {
      this.selectedRectificationId = id
    },
    getCriterion(criterionId: string): InspectionCriterion | undefined {
      return this.criteria.find(c => c.id === criterionId)
    },
    getRectificationByInspection(inspectionId: string): RectificationRecord | undefined {
      return this.rectifications.find(r => r.inspectionId === inspectionId)
    },
    getTimeline(inspectionId: string): TimelineEvent[] {
      return getTimelineByInspection(inspectionId)
    },
    updateInspectionStatus(id: string, status: InspectionRecord['status']) {
      const insp = this.inspections.find(i => i.id === id)
      if (insp) {
        insp.status = status
        insp.updatedAt = new Date().toISOString()
      }
    },
    updateRectificationStatus(id: string, status: RectificationRecord['status']) {
      const rect = this.rectifications.find(r => r.id === id)
      if (rect) {
        rect.status = status
        rect.updatedAt = new Date().toISOString()
      }
    },
    addInspection(inspection: InspectionRecord) {
      this.inspections.unshift(inspection)
    },
    addRectification(rectification: RectificationRecord) {
      this.rectifications.unshift(rectification)
    },
    addAlert(alert: Alert) {
      this.alerts.unshift(alert)
    },
    updateRectification(rectId: string, updates: Partial<RectificationRecord>) {
      const rect = this.rectifications.find(r => r.id === rectId)
      if (rect) {
        Object.assign(rect, updates, { updatedAt: new Date().toISOString() })
      }
    },
    addRecheckResult(rectId: string, result: any) {
      const rect = this.rectifications.find(r => r.id === rectId)
      if (rect) {
        if (!rect.recheckResults) rect.recheckResults = []
        rect.recheckResults.push(result)
        rect.updatedAt = new Date().toISOString()
      }
    }
  }
})
