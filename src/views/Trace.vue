<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { APPOINTMENT_STATUS, SCHEDULE_STATUS, EXAM_STATUS, ROLE_LABELS } from '@/data/mock.js'
import StatusTag from '@/components/StatusTag.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const aptId = computed(() => route.params.id)

const appointment = computed(() => store.appointments.find(a => a.id === aptId.value))
const student = computed(() => appointment.value ? store.getStudentById(appointment.value.studentId) : null)
const relatedSchedules = computed(() => {
  if (!appointment.value) return []
  return store.getSchedulesByAppointment(appointment.value.id).map(s => ({
    ...s,
    coach: s.coachId ? store.getCoachById(s.coachId) : null,
    assigner: s.assignedBy ? (store.staffMap[s.assignedBy]?.name || '') : '系统'
  }))
})

const relatedExams = computed(() => {
  if (!appointment.value) return []
  return store.getExamsByAppointment(appointment.value.id).map(e => ({
    ...e,
    coach: e.coachId ? store.getCoachById(e.coachId) : null
  }))
})

const latestExam = computed(() => [...relatedExams.value].reverse()[0] || null)

const handlerInfo = computed(() => {
  const a = appointment.value
  if (!a) return null
  // 找到当前责任人
  if (a.status === APPOINTMENT_STATUS.PENDING_REVIEW || a.status === APPOINTMENT_STATUS.INFO_INCOMPLETE) {
    if (a.handler) {
      const person = store.staffMap[a.handler]
      return { role: 'advisor', roleLabel: ROLE_LABELS.advisor, name: person?.name || '未分配', id: a.handler, action: '审核预约资料' }
    }
    return { role: 'advisor', roleLabel: ROLE_LABELS.advisor, name: '暂未认领', id: null, action: '等待顾问认领处理' }
  }
  if (a.status === APPOINTMENT_STATUS.REVIEWED) {
    return { role: 'advisor', roleLabel: ROLE_LABELS.advisor, name: store.staffMap[a.handler]?.name || '招生顾问', id: a.handler, action: '分配教练并生成排班' }
  }
  if (a.status === APPOINTMENT_STATUS.SCHEDULED) {
    const latestSch = [...relatedSchedules.value].reverse()[0]
    if (latestSch) {
      if (latestSch.status === SCHEDULE_STATUS.REJECTED) {
        return { role: 'advisor', roleLabel: ROLE_LABELS.advisor, name: store.staffMap[latestSch.assignedBy]?.name || '招生顾问', action: '重新安排教练或日期' }
      }
      if (latestSch.status === SCHEDULE_STATUS.ASSIGNED && latestSch.coachId) {
        return { role: 'coach', roleLabel: ROLE_LABELS.coach, name: latestSch.coach?.name || '教练', id: latestSch.coachId, action: '确认排班并安排学员' }
      }
      if (latestSch.status === SCHEDULE_STATUS.UNASSIGNED) {
        return { role: 'advisor', roleLabel: ROLE_LABELS.advisor, name: '招生顾问', action: '分配教练' }
      }
      if (latestSch.status === SCHEDULE_STATUS.COACH_CONFIRMED) {
        return { role: 'student', roleLabel: '学员', name: student.value?.name, action: '确认是否可按时到场' }
      }
      if (latestSch.status === SCHEDULE_STATUS.STUDENT_CONFIRMED) {
        return { role: 'coach', roleLabel: ROLE_LABELS.coach, name: latestSch.coach?.name || '教练', id: latestSch.coachId, action: '执行练车教学并记录' }
      }
    }
    return { role: 'advisor', roleLabel: ROLE_LABELS.advisor, name: '招生顾问', action: '处理排班相关事项' }
  }
  if (a.status === APPOINTMENT_STATUS.COMPLETED) {
    const exam = latestExam.value
    if (exam) {
      if (exam.status === EXAM_STATUS.PENDING_REVIEW) {
        return {
          role: 'examiner',
          roleLabel: ROLE_LABELS.examiner,
          name: exam.handlerName || '暂未认领',
          id: exam.handler,
          action: '认领并复核教练评估'
        }
      }
      if (exam.status === EXAM_STATUS.READY_TO_BOOK || exam.status === EXAM_STATUS.BOOKED || exam.status === EXAM_STATUS.STUDENT_CONFIRMED) {
        return {
          role: 'examiner',
          roleLabel: ROLE_LABELS.examiner,
          name: exam.handlerName || '孙伟峰',
          id: exam.handler,
          action: exam.status === EXAM_STATUS.READY_TO_BOOK ? '安排约考' : (exam.status === EXAM_STATUS.BOOKED ? '等待学员确认约考' : '等待考试并记录成绩')
        }
      }
      if (exam.status === EXAM_STATUS.EXAM_FAILED) {
        return {
          role: 'examiner',
          roleLabel: ROLE_LABELS.examiner,
          name: exam.handlerName || '—',
          id: exam.handler,
          action: '安排补训并重新约考'
        }
      }
      if (exam.status === EXAM_STATUS.EXAM_PASSED || exam.status === EXAM_STATUS.CLOSED) {
        return null
      }
    }
    return {
      role: 'examiner',
      roleLabel: ROLE_LABELS.examiner,
      name: '等待生成考试跟进卡',
      id: null,
      action: '教练完成练车后自动生成'
    }
  }
  return null
})

const blockedInfo = computed(() => {
  const a = appointment.value
  if (!a) return null
  if (a.status === APPOINTMENT_STATUS.INFO_INCOMPLETE) {
    return { level: 'danger', label: '资料异常待补', detail: a.exception?.message || '资料不全，学员补充后重新审核' }
  }
  if (a.status === APPOINTMENT_STATUS.PENDING_REVIEW) {
    const hours = dayjs().diff(dayjs(a.createdAt), 'hour')
    if (hours > 2) return { level: 'warning', label: '待审核超过 ' + hours + ' 小时', detail: '请尽快审核，超时会升级通知主管' }
    return { level: 'info', label: '等待顾问审核', detail: '已进入审核队列' }
  }
  if (a.status === APPOINTMENT_STATUS.REVIEWED) {
    const reviewedSchedules = relatedSchedules.value.filter(s => s.status !== SCHEDULE_STATUS.COMPLETED)
    if (reviewedSchedules.length === 0) return { level: 'warning', label: '尚未创建排班', detail: '审核通过后请尽快分配教练生成排班' }
    const un = relatedSchedules.value.find(s => s.status === SCHEDULE_STATUS.UNASSIGNED)
    if (un) return { level: 'warning', label: '排班未分配教练', detail: '请在排班页补充分配' }
    const rej = relatedSchedules.value.find(s => s.status === SCHEDULE_STATUS.REJECTED)
    if (rej) return { level: 'danger', label: '教练已退回排班', detail: rej.rejectReason || '教练未说明原因' }
  }
  if (a.status === APPOINTMENT_STATUS.SCHEDULED) {
    const latest = [...relatedSchedules.value].reverse()[0]
    if (latest?.status === SCHEDULE_STATUS.REJECTED) return { level: 'danger', label: '排班被教练退回', detail: latest.rejectReason || '无原因' }
    if (latest?.status === SCHEDULE_STATUS.ASSIGNED) {
      const hours = dayjs().diff(dayjs(latest.assignedAt), 'hour')
      if (hours > 12) return { level: 'warning', label: '教练未确认超过 ' + hours + ' 小时', detail: '请催促教练或调整' }
    }
    if (latest?.status === SCHEDULE_STATUS.UNASSIGNED) return { level: 'warning', label: '尚未分配教练', detail: '请尽快安排' }
  }
  if (a.status === APPOINTMENT_STATUS.COMPLETED) {
    const exam = latestExam.value
    if (!exam) return { level: 'warning', label: '尚未生成考试跟进', detail: '练车完成后应自动生成，检查流程' }
    if (exam.status === EXAM_STATUS.PENDING_REVIEW) {
      const hours = dayjs().diff(dayjs(exam.completedAt), 'hour')
      if (hours > 12) return { level: 'warning', label: '未认领超过 ' + hours + ' 小时', detail: '请考试专员尽快认领并复核教练评估' }
      return { level: 'info', label: '待考试专员认领', detail: '教练评估待审核' }
    }
    if (exam.exception) return { level: exam.exception.severity === 'danger' ? 'danger' : 'warning', label: exam.exception.message, detail: '来自考试跟进的异常' }
    if (exam.status === EXAM_STATUS.BOOKED) {
      const days = dayjs(exam.bookedDate).diff(dayjs(), 'day')
      if (days >= 0 && days <= 3) return { level: 'warning', label: (days <= 0 ? '今日考试' : days + '天后考试') + '，学员未确认约考', detail: '请尽快联系学员确认' }
    }
    if (exam.status === EXAM_STATUS.EXAM_FAILED) return { level: 'danger', label: '考试未通过', detail: '需安排补训后重新约考' }
  }
  return null
})

const reasonUncompleted = computed(() => {
  const a = appointment.value
  if (!a) return []
  const reasons = []

  if (a.exception) reasons.push({ type: 'exception', text: '资料异常：' + a.exception.message, level: a.exception.severity })
  if (a.status === APPOINTMENT_STATUS.INFO_INCOMPLETE) reasons.push({ type: 'student', text: '等待学员补充资料', level: 'info' })

  if (a.status === APPOINTMENT_STATUS.COMPLETED) {
    const exam = latestExam.value
    if (!exam) reasons.push({ type: 'examiner', text: '练车已完成，但未生成考试跟进卡片', level: 'warning' })
    else {
      if (!exam.handler) reasons.push({ type: 'examiner', text: '考试跟进尚未分配责任人', level: 'warning' })
      if (exam.exception) reasons.push({ type: 'examiner', text: '考试异常：' + exam.exception.message, level: exam.exception.severity })
      if (exam.status === EXAM_STATUS.PENDING_REVIEW) reasons.push({ type: 'examiner', text: '等待考试专员复核教练评估', level: 'info' })
      if (exam.status === EXAM_STATUS.EXAM_FAILED) reasons.push({ type: 'examiner', text: '考试未通过，需安排补训后重新约考', level: 'danger' })
    }
    return reasons
  }

  const latestSch = [...relatedSchedules.value].reverse()[0]
  if (a.status === APPOINTMENT_STATUS.REVIEWED && relatedSchedules.value.length === 0) {
    reasons.push({ type: 'advisor', text: '顾问审核完成，但未创建排班', level: 'warning' })
  }
  if (latestSch) {
    if (latestSch.status === SCHEDULE_STATUS.UNASSIGNED) reasons.push({ type: 'advisor', text: '排班未分配教练', level: 'warning' })
    if (latestSch.status === SCHEDULE_STATUS.REJECTED) reasons.push({ type: 'coach', text: '教练' + (latestSch.coach?.name || '') + '退回：' + (latestSch.rejectReason || '无原因'), level: 'danger' })
    if (latestSch.status === SCHEDULE_STATUS.ASSIGNED) {
      const hours = dayjs().diff(dayjs(latestSch.assignedAt), 'hour')
      reasons.push({ type: 'coach', text: '教练' + (latestSch.coach?.name || '') + '待确认（已 ' + hours + ' 小时）', level: hours > 12 ? 'warning' : 'info' })
    }
  }
  return reasons
})

const eventLog = computed(() => {
  const a = appointment.value
  if (!a) return []
  const log = []
  log.push({ time: a.createdAt, actor: student.value?.name || '学员', action: '提交练车预约', detail: '意向：' + a.subject + '，日期 ' + a.preferredDates?.join('/') + '，时段 ' + a.preferredSlots?.join('、') })
  if (a.handler && a.status !== APPOINTMENT_STATUS.PENDING_REVIEW) {
    log.push({ time: a.createdAt, actor: store.staffMap[a.handler]?.name || '招生顾问', action: '认领预约', detail: '进入处理流程' })
  }
  if (a.reviewNote || a.status !== APPOINTMENT_STATUS.PENDING_REVIEW) {
    const statusMap = {
      [APPOINTMENT_STATUS.REVIEWED]: '审核通过',
      [APPOINTMENT_STATUS.INFO_INCOMPLETE]: '标记资料异常',
      [APPOINTMENT_STATUS.SCHEDULED]: '审核通过'
    }
    if (statusMap[a.status]) {
      log.push({
        time: a.createdAt,
        actor: store.staffMap[a.handler]?.name || '招生顾问',
        action: statusMap[a.status],
        detail: [a.reviewNote, a.advisorNote].filter(Boolean).join(' | ') || '—'
      })
    }
  }
  relatedSchedules.value.forEach(s => {
    log.push({ time: s.assignedAt, actor: s.assigner, action: '生成排班' + (s.status === SCHEDULE_STATUS.REJECTED ? '（后被退回）' : ''), detail: (s.coach?.name || '待分配') + ' · ' + (s.date || '待定') + ' ' + s.slot + (s.passedAppointmentNote ? '；备注：' + s.passedAppointmentNote : '') })
    if (s.status === SCHEDULE_STATUS.REJECTED) {
      log.push({ time: s.assignedAt, actor: s.coach?.name || '教练', action: '退回排班', detail: s.rejectReason || '无原因', warn: true })
    }
    if (s.coachNote && s.status !== SCHEDULE_STATUS.REJECTED) {
      log.push({ time: s.assignedAt, actor: s.coach?.name || '教练', action: '教练确认/反馈', detail: s.coachNote })
    }
    if (s.completedAt) {
      log.push({ time: s.completedAt, actor: s.coach?.name || '教练', action: '练车完成并记录', detail: s.coachNote ? s.coachNote : '已写入学员档案', coachCompletion: true })
    }
  })
  relatedExams.value.forEach(e => {
    log.push({ time: e.completedAt, actor: '系统', action: '自动生成考试跟进卡片', detail: e.subject + ' · 教练评估：' + (e.coachAssessment || '—'), exam: true })
    if (e.handler) {
      log.push({ time: e.completedAt, actor: e.handlerName || '考试专员', action: '考试专员认领跟进', detail: e.examinerNote || '—', exam: true })
    }
    if (e.bookedDate) {
      log.push({ time: e.completedAt, actor: e.handlerName || '考试专员', action: '已约考 ' + e.bookedDate, detail: e.bookedSite + ' ' + (e.bookedSlot || '') + (e.examinerNote ? '；备注：' + e.examinerNote : ''), exam: true })
    }
    if (e.status === EXAM_STATUS.EXAM_PASSED) {
      log.push({ time: e.completedAt, actor: e.handlerName || '考试专员', action: '🎉 考试通过，跟进结案', detail: '流程已闭环', exam: true })
    }
    if (e.status === EXAM_STATUS.EXAM_FAILED) {
      log.push({ time: e.completedAt, actor: e.handlerName || '考试专员', action: '考试未通过', detail: '等待安排补训后重考', warn: true, exam: true })
    }
  })
  return log
})

function back() { router.back() }
</script>

<template>
  <div class="trace-page">
    <div class="mb-3 flex items-center gap-2">
      <button class="btn btn-default btn-sm" @click="back">← 返回</button>
      <span class="text-gray text-sm">完整追溯 · 回答三个问题</span>
    </div>

    <div v-if="!appointment" class="card p-6 text-center text-gray">
      未找到预约 <b>{{ aptId }}</b>，请返回列表重试
    </div>

    <template v-else>
      <div class="three-answers">
        <div class="ans-card card who">
          <div class="ans-head">
            <span class="ans-num">01</span>
            <span class="ans-title">谁在处理</span>
          </div>
          <div v-if="handlerInfo" class="ans-body">
            <div class="handler-big">
              <div class="handler-avatar" :class="handlerInfo.role">{{ (handlerInfo.name || '?').charAt(0) }}</div>
              <div>
                <div class="handler-name">{{ handlerInfo.name }}</div>
                <div class="handler-role">{{ handlerInfo.roleLabel }}</div>
              </div>
            </div>
            <div class="handler-action">当前需完成：<b>{{ handlerInfo.action }}</b></div>
          </div>
          <div v-else class="text-muted text-sm py-4">已完成，无当前处理人 ✓</div>
        </div>

        <div class="ans-card card where">
          <div class="ans-head">
            <span class="ans-num">02</span>
            <span class="ans-title">预约卡在哪里</span>
          </div>
          <div class="ans-body">
            <div v-if="blockedInfo" class="blocked-big" :class="blockedInfo.level">
              <div class="blocked-label">{{ blockedInfo.label }}</div>
              <div class="blocked-detail">{{ blockedInfo.detail }}</div>
            </div>
            <div v-else class="ok-box">
              <div class="ok-ico">✓</div>
              <div>
                <div class="font-semibold">流程顺畅</div>
                <div class="text-xs text-muted">无明显卡点，正常推进中</div>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-xs text-gray mb-1">当前阶段</div>
              <StatusTag :kind="appointment.status" type="appointment" />
            </div>
          </div>
        </div>

        <div class="ans-card card why">
          <div class="ans-head">
            <span class="ans-num">03</span>
            <span class="ans-title">为什么排班没完成</span>
          </div>
          <div class="ans-body" style="max-height: 200px; overflow-y: auto;">
            <div v-if="reasonUncompleted.length === 0" class="ok-box">
              <div class="ok-ico" style="background:#d1fae5;color:#047857;">✓</div>
              <div>
                <div class="font-semibold">不存在阻滞</div>
                <div class="text-xs text-muted">本次练车流程已闭环</div>
              </div>
            </div>
            <div v-else class="reason-list">
              <div v-for="(r, i) in reasonUncompleted" :key="i" class="reason-row" :class="r.level">
                <span class="r-ico">
                  <template v-if="r.level === 'danger'">✕</template>
                  <template v-else-if="r.level === 'warning'">⏳</template>
                  <template v-else>ℹ</template>
                </span>
                <span class="r-text">{{ r.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 grid-2col">
        <section class="card p-4">
          <h3 class="font-semibold mb-3">学员档案摘要</h3>
          <div class="flex items-start gap-3">
            <div class="stu-avatar-big">{{ (student?.name || '?').charAt(0) }}</div>
            <div class="flex-1">
              <div class="font-semibold text-base">{{ student?.name }} <span class="tag tag-blue ml-1" style="font-size:10.5px;">{{ appointment.subject }}</span></div>
              <div class="text-sm text-gray mt-1">📞 {{ student?.phone }} · {{ student?.carType }}</div>
              <div class="text-xs text-muted mt-1">报名 {{ student?.joinDate }} · 顾问：{{ store.staffMap[student?.advisorId]?.name || '—' }}</div>
              <div class="doc-check mt-2 flex gap-1 flex-wrap">
                <span :class="['doc-item', student?.idCardReady ? 'ok' : 'miss']">身份证</span>
                <span :class="['doc-item', student?.medicalDone ? 'ok' : 'miss']">体检</span>
                <span :class="['doc-item', student?.paymentDone ? 'ok' : 'miss']">缴费</span>
                <span :class="['doc-item', student?.photoDone ? 'ok' : 'miss']">照片</span>
              </div>
            </div>
          </div>
          <div v-if="appointment.advisorNote || appointment.reviewNote" class="mt-4 note-pass">
            <div class="text-xs font-medium mb-1" style="color:#1e40af;">📝 预约与审核备注（将传递给排班）</div>
            <div class="text-sm p-2 rounded" style="background:#eff6ff;border:1px solid #bfdbfe;">
              {{ appointment.advisorNote || appointment.reviewNote }}
            </div>
          </div>
          <div v-if="latestExam?.coachCompletionNote || ([...relatedSchedules].reverse()[0]?.coachNote)" class="mt-3 note-pass">
            <div class="text-xs font-medium mb-1" style="color:#581c87;">💬 教练完成备注（自动透传给考试跟进）</div>
            <div class="text-sm p-2 rounded" style="background:#faf5ff;border:1px solid #e9d5ff;">
              {{ latestExam?.coachCompletionNote || [...relatedSchedules].reverse()[0]?.coachNote }}
            </div>
          </div>
        </section>

        <section class="card p-4">
          <h3 class="font-semibold mb-3">相关排班记录（{{ relatedSchedules.length }}）</h3>
          <div v-if="relatedSchedules.length === 0" class="empty text-sm">暂无排班</div>
          <div v-else class="sch-list">
            <div v-for="s in relatedSchedules" :key="s.id" class="sch-row">
              <div class="flex-between items-start">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <StatusTag :kind="s.status" type="schedule" :small="true" />
                    <span class="text-xs text-gray">{{ s.date || '待定' }} {{ s.slot || '' }}</span>
                  </div>
                  <div class="text-sm font-medium">{{ s.coach?.name || '待分配教练' }}</div>
                </div>
                <span class="sch-id">{{ s.id }}</span>
              </div>
              <div v-if="s.passedAppointmentNote" class="text-xs text-gray mt-2 p-2 rounded note-sch">
                💬 {{ s.passedAppointmentNote }}
              </div>
              <div v-if="s.rejectReason" class="text-xs mt-1 p-2 rounded" style="background:#fef2f2;color:#991b1b;">
                ↩ 退回：{{ s.rejectReason }}
              </div>
            </div>
          </div>
        </section>

        <section class="card p-4">
          <h3 class="font-semibold mb-3">考试跟进记录（{{ relatedExams.length }}）</h3>
          <div v-if="relatedExams.length === 0" class="empty text-sm">
            <template v-if="appointment.status === 'completed'">练车已完成但未生成考试跟进，检查流程</template>
            <template v-else>当前阶段尚未进入考试跟进</template>
          </div>
          <div v-else class="sch-list">
            <div v-for="e in relatedExams" :key="e.id" class="sch-row" style="border-color:#e9d5ff;">
              <div class="flex-between items-start">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <StatusTag :kind="e.status" type="exam" :small="true" />
                    <span v-if="e.bookedDate" class="text-xs text-gray">{{ e.bookedDate }} {{ e.bookedSlot || '' }}</span>
                  </div>
                  <div class="text-sm font-medium">
                    责任人：{{ e.handlerName || '未认领' }}
                    <span v-if="e.handlerName" class="text-xs text-gray ml-2">考试专员</span>
                  </div>
                </div>
                <span class="sch-id" style="color:#6d28d9;">{{ e.id }}</span>
              </div>
              <div v-if="e.coachCompletionNote" class="text-xs mt-2 p-2 rounded" style="background:#faf5ff;border:1px solid #e9d5ff;color:#581c87;">
                💬 教练完成备注（自动透传）：{{ e.coachCompletionNote }}
              </div>
              <div v-if="e.exception" class="text-xs mt-1 p-2 rounded" :style="e.exception.severity === 'danger' ? 'background:#fef2f2;color:#991b1b;' : 'background:#fffbeb;color:#92400e;'">
                ⚠ 异常：{{ e.exception.message }}
              </div>
              <div v-if="e.examinerNote" class="text-xs mt-1 p-2 rounded" style="background:#ede9fe;color:#4c1d95;">
                📝 考试专员：{{ e.examinerNote }}
              </div>
              <div v-if="e.bookedSite" class="text-xs text-gray mt-1">
                考场：{{ e.bookedSite }}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="card p-4 mt-4">
        <h3 class="font-semibold mb-3">📜 完整事件时间线</h3>
        <div v-if="eventLog.length === 0" class="empty text-sm">暂无事件</div>
        <div v-else class="timeline-2">
          <div v-for="(e, i) in eventLog" :key="i" class="t2-item" :class="{ 't2-coach': e.coachCompletion, 't2-exam': e.exam }">
            <div class="t2-dot" :class="{ warn: e.warn, coach: e.coachCompletion, exam: e.exam }"></div>
            <div class="t2-content">
              <div class="flex-between">
                <div><b>{{ e.actor }}</b> · {{ e.action }}</div>
                <div class="text-xs text-muted">{{ e.time }}</div>
              </div>
              <div class="text-sm text-gray mt-1">{{ e.detail }}</div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.three-answers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.ans-card { padding: 18px; overflow: hidden; position: relative; }
.ans-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 4px;
}
.ans-card.who::before { background: linear-gradient(90deg, #2563eb, #7c3aed); }
.ans-card.where::before { background: linear-gradient(90deg, #f59e0b, #ef4444); }
.ans-card.why::before { background: linear-gradient(90deg, #10b981, #06b6d4); }
.ans-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.ans-num {
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--gray-900); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px;
}
.ans-title { font-weight: 600; font-size: 15px; color: var(--gray-800); }

.handler-big { display: flex; align-items: center; gap: 14px; }
.handler-avatar {
  width: 54px; height: 54px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 22px; color: #fff;
}
.handler-avatar.advisor { background: linear-gradient(135deg, #2563eb, #7c3aed); }
.handler-avatar.coach { background: linear-gradient(135deg, #10b981, #059669); }
.handler-avatar.student { background: linear-gradient(135deg, #f59e0b, #ef4444); }
.handler-avatar.examiner { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
.handler-name { font-size: 18px; font-weight: 700; color: var(--gray-800); }
.handler-role { font-size: 12.5px; color: var(--gray-500); margin-top: 2px; }
.handler-action { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--gray-200); font-size: 13px; color: var(--gray-600); }

.blocked-big {
  padding: 12px; border-radius: 10px;
}
.blocked-big.danger { background: #fef2f2; border: 1px solid #fecaca; }
.blocked-big.warning { background: #fffbeb; border: 1px solid #fde68a; }
.blocked-big.info { background: #eff6ff; border: 1px solid #bfdbfe; }
.blocked-label { font-weight: 600; font-size: 14px; color: var(--gray-800); }
.blocked-big.danger .blocked-label { color: #b91c1c; }
.blocked-big.warning .blocked-label { color: #92400e; }
.blocked-detail { font-size: 12.5px; margin-top: 4px; color: var(--gray-600); }

.ok-box {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 10px; background: #f0fdf4; border: 1px solid #bbf7d0;
}
.ok-ico {
  width: 40px; height: 40px; border-radius: 50%;
  background: #2563eb; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 18px;
}

.reason-list { display: flex; flex-direction: column; gap: 8px; }
.reason-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px; border-radius: 8px; font-size: 13px;
}
.reason-row.danger { background: #fef2f2; color: #991b1b; }
.reason-row.warning { background: #fffbeb; color: #92400e; }
.reason-row.info { background: var(--gray-50); color: var(--gray-700); }
.r-ico { width: 18px; height: 18px; flex-shrink: 0; font-weight: 700; text-align: center; }

.grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.stu-avatar-big {
  width: 52px; height: 52px; border-radius: 12px;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff);
  color: #1e40af; font-weight: 700; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.doc-item { font-size: 10.5px; padding: 1px 6px; border-radius: 4px; border: 1px solid var(--gray-200); }
.doc-item.ok { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.doc-item.miss { background: #fef2f2; border-color: #fecaca; color: #991b1b; }

.note-pass { }

.sch-list { display: flex; flex-direction: column; gap: 10px; }
.sch-row {
  padding: 12px; border-radius: 10px;
  background: var(--gray-50); border: 1px solid var(--gray-200);
}
.sch-id {
  font-family: Menlo, monospace; font-size: 11px;
  color: var(--gray-400); font-weight: 600;
}
.note-sch { background: #eff6ff; border: 1px solid #dbeafe; color: #1e40af; }

.timeline-2 { }
.t2-item {
  display: flex; gap: 14px; position: relative;
  padding-bottom: 16px;
}
.t2-item:not(:last-child)::before {
  content: ''; position: absolute;
  left: 8px; top: 18px; bottom: 0;
  width: 2px; background: var(--gray-200);
}
.t2-dot {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--primary); border: 3px solid #dbeafe;
  flex-shrink: 0; margin-top: 2px; z-index: 1;
}
.t2-dot.warn { background: #ef4444; border-color: #fee2e2; }
.t2-dot.coach { background: #10b981; border-color: #d1fae5; }
.t2-dot.exam { background: #8b5cf6; border-color: #ede9fe; }
.t2-item.t2-coach .t2-content, .t2-item.t2-exam .t2-content {
  padding: 6px 10px;
  border-radius: 8px;
}
.t2-item.t2-coach .t2-content { background: #ecfdf5; }
.t2-item.t2-exam .t2-content { background: #f5f3ff; }
.t2-content { flex: 1; }
</style>
