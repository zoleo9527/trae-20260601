import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import {
  ROLES, APPOINTMENT_STATUS, SCHEDULE_STATUS,
  INITIAL_APPOINTMENTS, INITIAL_SCHEDULES,
  STUDENTS, COACHES, STAFF, genId
} from '@/data/mock.js'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentRole: ROLES.ADVISOR,
    appointments: JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS)),
    schedules: JSON.parse(JSON.stringify(INITIAL_SCHEDULES)),
    toasts: [],
    _toastId: 0,
    selectedAppointmentIds: new Set(),
    selectedScheduleIds: new Set()
  }),
  getters: {
    studentsMap() {
      const m = {}
      STUDENTS.forEach(s => { m[s.id] = s })
      return m
    },
    coachesMap() {
      const m = {}
      COACHES.forEach(c => { m[c.id] = c })
      return m
    },
    staffMap() {
      const m = {}
      STAFF.advisors.forEach(a => { m[a.id] = a })
      STAFF.examiners.forEach(e => { m[e.id] = e })
      return m
    },
    getStudentById: () => (id) => STUDENTS.find(s => s.id === id),
    getCoachById: () => (id) => COACHES.find(c => c.id === id),

    pendingReviewAppointments(state) {
      return state.appointments.filter(a =>
        a.status === APPOINTMENT_STATUS.PENDING_REVIEW ||
        a.status === APPOINTMENT_STATUS.INFO_INCOMPLETE
      )
    },
    reviewedAppointments(state) {
      return state.appointments.filter(a => a.status === APPOINTMENT_STATUS.REVIEWED)
    },

    unassignedSchedules(state) {
      return state.schedules.filter(s => s.status === SCHEDULE_STATUS.UNASSIGNED)
    },
    assignedSchedules(state) {
      return state.schedules.filter(s =>
        s.status === SCHEDULE_STATUS.ASSIGNED ||
        s.status === SCHEDULE_STATUS.REJECTED
      )
    },
    upcomingCoachSchedules: (state) => (coachId) => {
      const today = dayjs().format('YYYY-MM-DD')
      return state.schedules.filter(s =>
        s.coachId === coachId &&
        (s.status === SCHEDULE_STATUS.ASSIGNED ||
         s.status === SCHEDULE_STATUS.COACH_CONFIRMED ||
         s.status === SCHEDULE_STATUS.STUDENT_CONFIRMED) &&
        s.date && s.date >= today
      ).sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot))
    },

    blockedAppointments(state) {
      return state.appointments.filter(a => a.exception && a.status !== APPOINTMENT_STATUS.COMPLETED)
    },
    blockedSchedules(state) {
      return state.schedules.filter(s =>
        (s.status === SCHEDULE_STATUS.UNASSIGNED && dayjs(s.assignedAt).isBefore(dayjs().subtract(4, 'hour'))) ||
        s.status === SCHEDULE_STATUS.REJECTED
      )
    },

    handlerStats(state) {
      const advisorCount = state.appointments.filter(a => a.handler && a.handler.startsWith('A')).length
      const coachCount = state.schedules.filter(s => s.coachId && s.status !== SCHEDULE_STATUS.COMPLETED).length
      const examinerCount = 0
      return { advisorCount, coachCount, examinerCount }
    },

    getSchedulesByAppointment: (state) => (appointmentId) => {
      return state.schedules.filter(s => s.appointmentId === appointmentId)
    }
  },
  actions: {
    switchRole(role) {
      this.currentRole = role
    },

    pushToast(message, type = 'info') {
      const id = ++this._toastId
      this.toasts.push({ id, message, type })
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id)
      }, 3000)
    },

    reviewAppointment(id, payload) {
      const a = this.appointments.find(x => x.id === id)
      if (!a) return
      if (payload.reviewNote !== undefined) a.reviewNote = payload.reviewNote
      if (payload.advisorNote !== undefined) a.advisorNote = payload.advisorNote
      if (payload.exception !== undefined) a.exception = payload.exception
      if (payload.handler !== undefined) a.handler = payload.handler
      if (payload.status !== undefined) a.status = payload.status
      this.pushToast(`预约 ${a.id} 已更新`, 'success')
    },

    approveAppointment(id, note) {
      const a = this.appointments.find(x => x.id === id)
      if (!a) return
      a.status = APPOINTMENT_STATUS.REVIEWED
      if (note) a.advisorNote = note
      a.handler = STAFF.advisors[0].id
      this.pushToast(`已通过审核，进入排班池`, 'success')
    },

    rejectAppointment(id, { exception, reviewNote }) {
      const a = this.appointments.find(x => x.id === id)
      if (!a) return
      a.status = APPOINTMENT_STATUS.INFO_INCOMPLETE
      if (exception) a.exception = exception
      if (reviewNote) a.reviewNote = reviewNote
      a.handler = STAFF.advisors[0].id
      this.pushToast(`已标记异常并通知学员`, 'warning')
    },

    assignCoach({ appointmentId, studentId, subject, coachId, date, slot, appointmentNote }) {
      const sc = {
        id: genId('SC'),
        appointmentId: appointmentId || 'SC-MANUAL',
        studentId,
        subject,
        coachId,
        date,
        slot,
        status: SCHEDULE_STATUS.ASSIGNED,
        assignedAt: dayjs().format('YYYY-MM-DD HH:mm'),
        assignedBy: STAFF.advisors[0].id,
        passedAppointmentNote: appointmentNote || '',
        coachNote: '',
        rejectReason: '',
        completedAt: null
      }
      this.schedules.unshift(sc)

      if (appointmentId) {
        const a = this.appointments.find(x => x.id === appointmentId)
        if (a) a.status = APPOINTMENT_STATUS.SCHEDULED
      }
      this.pushToast(`已分配 ${this.getCoachById(coachId)?.name || '教练'}，等待教练确认`, 'success')
      return sc
    },

    coachConfirmSchedule(id, note) {
      const s = this.schedules.find(x => x.id === id)
      if (!s) return
      s.status = SCHEDULE_STATUS.COACH_CONFIRMED
      if (note) s.coachNote = note
      this.pushToast('教练已确认排班', 'success')
    },

    coachRejectSchedule(id, reason) {
      const s = this.schedules.find(x => x.id === id)
      if (!s) return
      s.status = SCHEDULE_STATUS.REJECTED
      s.rejectReason = reason
      this.pushToast('已退回，将重新排班', 'error')
    },

    completeSchedule(id, note) {
      const s = this.schedules.find(x => x.id === id)
      if (!s) return
      s.status = SCHEDULE_STATUS.COMPLETED
      if (note) s.coachNote = (s.coachNote ? s.coachNote + '\n' : '') + note
      s.completedAt = dayjs().format('YYYY-MM-DD HH:mm')
      if (s.appointmentId) {
        const a = this.appointments.find(x => x.id === s.appointmentId)
        if (a) a.status = APPOINTMENT_STATUS.COMPLETED
      }
      this.pushToast('已完成本次练车', 'success')
    },

    reassignSchedule(id, { coachId, date, slot }) {
      const s = this.schedules.find(x => x.id === id)
      if (!s) return
      s.coachId = coachId
      s.date = date
      s.slot = slot
      s.status = SCHEDULE_STATUS.ASSIGNED
      s.rejectReason = ''
      s.assignedAt = dayjs().format('YYYY-MM-DD HH:mm')
      this.pushToast('已重新分配教练', 'success')
    },

    batchApprove(ids) {
      let count = 0
      ids.forEach(id => {
        const a = this.appointments.find(x => x.id === id)
        if (a && (a.status === APPOINTMENT_STATUS.PENDING_REVIEW || a.status === APPOINTMENT_STATUS.INFO_INCOMPLETE)) {
          if (!a.exception) {
            a.status = APPOINTMENT_STATUS.REVIEWED
            a.handler = STAFF.advisors[0].id
            count++
          }
        }
      })
      this.selectedAppointmentIds.clear()
      this.pushToast(`批量通过 ${count} 条预约`, count ? 'success' : 'warning')
    },

    batchMarkException(ids, exception) {
      let count = 0
      ids.forEach(id => {
        const a = this.appointments.find(x => x.id === id)
        if (a && a.status !== APPOINTMENT_STATUS.COMPLETED) {
          a.status = APPOINTMENT_STATUS.INFO_INCOMPLETE
          a.exception = exception
          a.handler = STAFF.advisors[0].id
          count++
        }
      })
      this.selectedAppointmentIds.clear()
      this.pushToast(`已标记 ${count} 条异常`, 'warning')
    },

    batchNotify(ids) {
      this.selectedAppointmentIds.clear()
      this.selectedScheduleIds.clear()
      this.pushToast(`已向 ${ids.length} 位学员发送短信通知`, 'info')
    },

    toggleAppointmentSelection(id) {
      if (this.selectedAppointmentIds.has(id)) {
        this.selectedAppointmentIds.delete(id)
      } else {
        this.selectedAppointmentIds.add(id)
      }
    },
    clearAppointmentSelection() {
      this.selectedAppointmentIds.clear()
    },

    toggleScheduleSelection(id) {
      if (this.selectedScheduleIds.has(id)) {
        this.selectedScheduleIds.delete(id)
      } else {
        this.selectedScheduleIds.add(id)
      }
    },
    clearScheduleSelection() {
      this.selectedScheduleIds.clear()
    }
  }
})
