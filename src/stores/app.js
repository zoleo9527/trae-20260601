import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import {
  ROLES, APPOINTMENT_STATUS, SCHEDULE_STATUS, EXAM_STATUS,
  INITIAL_APPOINTMENTS, INITIAL_SCHEDULES, INITIAL_EXAM_FOLLOW_UPS,
  STUDENTS, COACHES, STAFF, genId
} from '@/data/mock.js'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentRole: ROLES.ADVISOR,
    appointments: JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS)),
    schedules: JSON.parse(JSON.stringify(INITIAL_SCHEDULES)),
    examFollowUps: JSON.parse(JSON.stringify(INITIAL_EXAM_FOLLOW_UPS)),
    selectedExamFollowUpIds: new Set(),
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
      const advisorCount = state.appointments.filter(a => a.handler && a.handler.startsWith('A') && a.status !== APPOINTMENT_STATUS.COMPLETED).length
      const coachCount = state.schedules.filter(s => s.coachId && s.status !== SCHEDULE_STATUS.COMPLETED).length
      const examinerCount = state.examFollowUps.filter(e => e.handler && e.handler.startsWith('E') && e.status !== EXAM_STATUS.CLOSED && e.status !== EXAM_STATUS.EXAM_PASSED).length
      return { advisorCount, coachCount, examinerCount }
    },

    getSchedulesByAppointment: (state) => (appointmentId) => {
      return state.schedules.filter(s => s.appointmentId === appointmentId)
    },

    pendingExamFollowUps(state) {
      return state.examFollowUps.filter(e =>
        e.status === EXAM_STATUS.PENDING_REVIEW || e.status === EXAM_STATUS.READY_TO_BOOK
      )
    },
    blockedExamFollowUps(state) {
      return state.examFollowUps.filter(e =>
        (e.status === EXAM_STATUS.PENDING_REVIEW && dayjs(e.completedAt).isBefore(dayjs().subtract(12, 'hour'))) ||
        (e.status === EXAM_STATUS.BOOKED && dayjs(e.bookedDate).diff(dayjs(), 'day') >= 0 && dayjs(e.bookedDate).diff(dayjs(), 'day') <= 3) ||
        e.status === EXAM_STATUS.EXAM_FAILED ||
        e.exception
      ).filter(Boolean)
    },
    getExamBySchedule: (state) => (scheduleId) => {
      return state.examFollowUps.find(e => e.scheduleId === scheduleId)
    },
    getExamsByAppointment: (state) => (appointmentId) => {
      return state.examFollowUps.filter(e => e.appointmentId === appointmentId)
    },
    getExamsByStudent: (state) => (studentId) => {
      return state.examFollowUps.filter(e => e.studentId === studentId)
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

    studentConfirmSchedule(id, note) {
      const s = this.schedules.find(x => x.id === id)
      if (!s) return
      s.status = SCHEDULE_STATUS.STUDENT_CONFIRMED
      if (note) s.studentNote = note
      this.pushToast('学员已确认，等待教练到场完成练车', 'success')
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

      const finalNote = note || s.coachNote || ''
      const exists = this.examFollowUps.find(e => e.scheduleId === s.id)
      if (!exists) {
        const assessment = finalNote.split('\n').slice(-1)[0] || '教练未给出特殊建议，建议考试专员复核。'
        const isReady = !/需加强|推迟|未通过|再练|不建议|加强/i.test(finalNote)
        const examFollowUp = {
          id: genId('EX'),
          scheduleId: s.id,
          appointmentId: s.appointmentId,
          studentId: s.studentId,
          subject: s.subject,
          status: isReady ? EXAM_STATUS.READY_TO_BOOK : EXAM_STATUS.PENDING_REVIEW,
          coachId: s.coachId,
          coachAssessment: assessment,
          coachCompletionNote: finalNote,
          completedAt: s.completedAt,
          handler: isReady ? STAFF.examiners[0].id : null,
          handlerName: isReady ? STAFF.examiners[0].name : null,
          bookedDate: null,
          bookedSite: null,
          bookedSlot: null,
          examinerNote: '',
          exception: isReady ? null : { type: 'coach_not_ready', severity: 'warning', message: '教练认为仍需加强练习，请复核' }
        }
        this.examFollowUps.unshift(examFollowUp)
        this.pushToast(isReady
          ? `已生成考试跟进卡片，分配给 ${STAFF.examiners[0].name}`
          : '教练建议加强练习，已生成待复核的考试跟进卡', 'info')
      } else {
        exists.coachCompletionNote = (exists.coachCompletionNote ? exists.coachCompletionNote + '\n' : '') + finalNote
        this.pushToast('已追加教练备注到考试跟进', 'info')
      }
    },

    reassignSchedule(id, { coachId, date, slot }) {
      const s = this.schedules.find(x => x.id === id)
      if (!s) return
      const wasUnassigned = s.status === SCHEDULE_STATUS.UNASSIGNED
      s.coachId = coachId
      s.date = date
      s.slot = slot
      s.status = SCHEDULE_STATUS.ASSIGNED
      s.rejectReason = ''
      s.assignedAt = dayjs().format('YYYY-MM-DD HH:mm')
      s.assignedBy = STAFF.advisors[0].id
      if (wasUnassigned && s.appointmentId) {
        const a = this.appointments.find(x => x.id === s.appointmentId)
        if (a && a.status === APPOINTMENT_STATUS.REVIEWED) {
          a.status = APPOINTMENT_STATUS.SCHEDULED
        }
      }
      this.pushToast(`已分配 ${this.getCoachById(coachId)?.name || '教练'}，等待教练确认`, 'success')
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
    },

    toggleExamFollowUpSelection(id) {
      if (this.selectedExamFollowUpIds.has(id)) {
        this.selectedExamFollowUpIds.delete(id)
      } else {
        this.selectedExamFollowUpIds.add(id)
      }
    },
    clearExamFollowUpSelection() {
      this.selectedExamFollowUpIds.clear()
    },

    claimExamFollowUp(id) {
      const e = this.examFollowUps.find(x => x.id === id)
      if (!e) return
      e.handler = STAFF.examiners[0].id
      e.handlerName = STAFF.examiners[0].name
      if (e.status === EXAM_STATUS.PENDING_REVIEW) e.status = EXAM_STATUS.READY_TO_BOOK
      this.pushToast(`已认领，责任人：${STAFF.examiners[0].name}`, 'success')
    },

    markExamReady(id, note) {
      const e = this.examFollowUps.find(x => x.id === id)
      if (!e) return
      e.status = EXAM_STATUS.READY_TO_BOOK
      e.handler = STAFF.examiners[0].id
      e.handlerName = STAFF.examiners[0].name
      e.exception = null
      if (note) e.examinerNote = (e.examinerNote ? e.examinerNote + '\n' : '') + note
      this.pushToast('已设为可约考状态', 'success')
    },

    bookExam(id, { date, site, slot, note }) {
      const e = this.examFollowUps.find(x => x.id === id)
      if (!e) return
      e.status = EXAM_STATUS.BOOKED
      e.bookedDate = date
      e.bookedSite = site
      e.bookedSlot = slot
      e.handler = STAFF.examiners[0].id
      e.handlerName = STAFF.examiners[0].name
      if (note) e.examinerNote = (e.examinerNote ? e.examinerNote + '\n' : '') + note
      this.pushToast(`已约考 ${date} ${site || ''}，等待学员确认`, 'success')
    },

    confirmStudentExam(id) {
      const e = this.examFollowUps.find(x => x.id === id)
      if (!e) return
      e.status = EXAM_STATUS.STUDENT_CONFIRMED
      this.pushToast('学员已确认考试安排', 'success')
    },

    finishExam(id, { passed, note }) {
      const e = this.examFollowUps.find(x => x.id === id)
      if (!e) return
      e.status = passed ? EXAM_STATUS.EXAM_PASSED : EXAM_STATUS.EXAM_FAILED
      if (note) e.examinerNote = (e.examinerNote ? e.examinerNote + '\n' : '') + note
      if (passed) {
        this.pushToast('🎉 学员已通过考试，考试跟进结案', 'success')
      } else {
        this.pushToast('考试未通过，建议安排补训后重新约考', 'warning')
      }
    },

    markExamException(id, exception, note) {
      const e = this.examFollowUps.find(x => x.id === id)
      if (!e) return
      e.exception = exception
      if (note) e.examinerNote = (e.examinerNote ? e.examinerNote + '\n' : '') + note
      this.pushToast(`已标记异常：${exception.message}`, 'warning')
    },

    batchClaimExam(ids) {
      let count = 0
      ids.forEach(id => {
        const e = this.examFollowUps.find(x => x.id === id)
        if (e && (!e.handler || e.status === EXAM_STATUS.PENDING_REVIEW)) {
          e.handler = STAFF.examiners[0].id
          e.handlerName = STAFF.examiners[0].name
          if (e.status === EXAM_STATUS.PENDING_REVIEW) e.status = EXAM_STATUS.READY_TO_BOOK
          count++
        }
      })
      this.clearExamFollowUpSelection()
      this.pushToast(`批量认领 ${count} 条考试跟进`, count ? 'success' : 'warning')
    },

    batchNotifyExamStudents(ids) {
      this.clearExamFollowUpSelection()
      this.pushToast(`已向 ${ids.length} 位学员发送约考提醒`, 'info')
    }
  }
})
