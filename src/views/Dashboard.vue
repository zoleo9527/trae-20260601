<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import {
  ROLES, ROLE_LABELS, APPOINTMENT_STATUS, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS,
  SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_COLORS, STAFF
} from '@/data/mock.js'
import StatusTag from '@/components/StatusTag.vue'
import dayjs from 'dayjs'

const router = useRouter()
const store = useAppStore()

const stats = computed(() => {
  const apt = store.appointments
  const sch = store.schedules
  const today = dayjs().format('YYYY-MM-DD')
  return [
    {
      label: '待处理预约', value: apt.filter(a => a.status === APPOINTMENT_STATUS.PENDING_REVIEW).length,
      hint: '超过 2 小时未处理会标红', color: '#f59e0b', icon: '◫',
      target: () => router.push('/appointments?filter=pending')
    },
    {
      label: '资料异常', value: store.blockedAppointments.length,
      hint: '含证件缺失/欠费等', color: '#ef4444', icon: '⚠',
      target: () => router.push('/appointments?filter=exception')
    },
    {
      label: '待排班', value: apt.filter(a => a.status === APPOINTMENT_STATUS.REVIEWED).length + sch.filter(s => s.status === SCHEDULE_STATUS.UNASSIGNED).length,
      hint: '审核通过但未分配教练', color: '#2563eb', icon: '▤',
      target: () => router.push('/schedules?filter=unassigned')
    },
    {
      label: '排班异常', value: sch.filter(s => s.status === SCHEDULE_STATUS.REJECTED).length,
      hint: '教练退回需重新安排', color: '#dc2626', icon: '↩',
      target: () => router.push('/schedules?filter=rejected')
    },
    {
      label: '考试跟进待办', value: store.pendingExamFollowUps.length,
      hint: '认领/复核教练评估', color: '#8b5cf6', icon: '✎',
      target: () => router.push('/exams?filter=pending')
    }
  ]
})

const whoIsHandling = computed(() => {
  const items = []
  STAFF.advisors.forEach(a => {
    const c = store.appointments.filter(x => x.handler === a.id).length
    items.push({ role: ROLES.ADVISOR, id: a.id, name: a.name, count: c, type: '预约处理' })
  })
  const coachCountMap = {}
  store.schedules.forEach(s => {
    if (s.coachId && s.status !== SCHEDULE_STATUS.COMPLETED) {
      coachCountMap[s.coachId] = (coachCountMap[s.coachId] || 0) + 1
    }
  })
  Object.keys(coachCountMap).forEach(cid => {
    const coach = store.getCoachById(cid)
    if (coach) items.push({ role: ROLES.COACH, id: cid, name: coach.name, count: coachCountMap[cid], type: '排班待完成' })
  })
  STAFF.examiners.forEach(e => {
    const c = store.examFollowUps.filter(x => x.handler === e.id).length
    if (c > 0) items.push({ role: ROLES.EXAMINER, id: e.id, name: e.name, count: c, type: '考试跟进处理' })
  })
  const unclaimedExam = store.examFollowUps.filter(e => !e.handler && e.status !== 'exam_passed' && e.status !== 'closed').length
  if (unclaimedExam > 0) {
    items.push({ role: ROLES.EXAMINER, id: 'unclaimed', name: '未分配', count: unclaimedExam, type: '考试跟进待认领' })
  }
  return items.sort((a, b) => b.count - a.count)
})

const blockedAppointmentsList = computed(() =>
  store.blockedAppointments.slice(0, 5).map(a => ({
    ...a,
    student: store.getStudentById(a.studentId)
  }))
)

const blockedSchedulesList = computed(() =>
  store.blockedSchedules.slice(0, 5).map(s => ({
    ...s,
    student: store.getStudentById(s.studentId),
    coach: s.coachId ? store.getCoachById(s.coachId) : null
  }))
)

const blockedExamList = computed(() =>
  store.blockedExamFollowUps.slice(0, 5).map(e => ({
    ...e,
    student: store.getStudentById(e.studentId)
  }))
)

const recentSchedules = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return store.schedules
    .filter(s => s.date && s.date >= today && s.status !== SCHEDULE_STATUS.COMPLETED)
    .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot))
    .slice(0, 6)
    .map(s => ({
      ...s,
      student: store.getStudentById(s.studentId),
      coach: s.coachId ? store.getCoachById(s.coachId) : null
    }))
})

function goTraceAppt(id) { router.push(`/trace/${id}`) }
function goScheduleFilter(f) { router.push(`/schedules?filter=${f}`) }
function goAppointmentFilter(f) { router.push(`/appointments?filter=${f}`) }
function goExamFilter(f) { router.push(`/exams?filter=${f}`) }
</script>

<template>
  <div class="dashboard">
    <div class="stat-grid">
      <div v-for="s in stats" :key="s.label" class="stat-card card clickable" @click="s.target()">
        <div class="stat-head flex-between">
          <span class="stat-label">{{ s.label }}</span>
          <span class="stat-icon" :style="{ background: s.color + '18', color: s.color }">{{ s.icon }}</span>
        </div>
        <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
        <div class="stat-hint text-xs text-gray">{{ s.hint }} →</div>
      </div>
    </div>

    <div class="mt-4 grid-2col">
      <section class="card p-4">
        <div class="flex-between mb-3">
          <h3 class="font-semibold">谁在处理 · 责任到人</h3>
          <button class="btn btn-ghost btn-sm" @click="goAppointmentFilter('all')">查看全部 →</button>
        </div>
        <div v-if="whoIsHandling.length === 0" class="empty text-sm">暂无处理中的任务</div>
        <div v-else class="handler-list">
          <div v-for="h in whoIsHandling" :key="h.role + h.id" class="handler-row clickable"
               @click="h.role === 'advisor' ? goAppointmentFilter('all') : (h.role === 'examiner' ? goExamFilter('all') : goScheduleFilter('all'))">
            <div class="flex gap-3 items-center flex-1">
              <span class="avatar" :style="h.role === 'advisor' ? { background: '#dbeafe', color: '#1e40af' } : (h.role === 'examiner' ? { background: '#ede9fe', color: '#6d28d9' } : { background: '#d1fae5', color: '#047857' })">
                {{ h.name.charAt(0) }}
              </span>
              <div>
                <div class="font-medium">{{ h.name }}</div>
                <div class="text-xs text-gray">{{ ROLE_LABELS[h.role] }} · {{ h.type }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="count-pill" :class="h.role === 'advisor' ? 'count-blue' : (h.role === 'examiner' ? 'count-purple' : 'count-green')">{{ h.count }}</div>
              <div class="text-xs text-muted mt-1">条任务</div>
            </div>
          </div>
        </div>
      </section>

      <section class="card p-4">
        <div class="flex-between mb-3">
          <h3 class="font-semibold">练车预约卡住的地方</h3>
          <button class="btn btn-ghost btn-sm" @click="goAppointmentFilter('exception')">异常清单 →</button>
        </div>
        <div v-if="blockedAppointmentsList.length === 0" class="empty text-sm">暂无卡住的预约 ✓</div>
        <div v-else class="block-list">
          <div v-for="a in blockedAppointmentsList" :key="a.id" class="block-row clickable" @click="goTraceAppt(a.id)">
            <div class="flex gap-3 items-start flex-1">
              <span class="block-ico" :class="a.exception?.severity === 'danger' ? 'danger' : 'warn'">!</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium truncate">{{ a.student?.name || '-' }}</span>
                  <StatusTag :kind="a.status" :type="'appointment'" />
                </div>
                <div class="text-sm text-gray mt-0.5">{{ a.exception?.message || '异常待处理' }}</div>
                <div class="text-xs text-muted mt-1">提交 {{ a.createdAt }} · 备注：{{ a.advisorNote || '无' }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="mt-4 grid-2col">
      <section class="card p-4">
        <div class="flex-between mb-3">
          <h3 class="font-semibold">教练排班为什么没完成</h3>
          <button class="btn btn-ghost btn-sm" @click="goScheduleFilter('rejected')">排班详情 →</button>
        </div>
        <div v-if="blockedSchedulesList.length === 0" class="empty text-sm">所有排班正常推进中 ✓</div>
        <div v-else class="block-list">
          <div v-for="s in blockedSchedulesList" :key="s.id" class="block-row clickable" @click="goScheduleFilter('rejected')">
            <div class="flex gap-3 items-start flex-1">
              <span v-if="s.status === 'rejected'" class="block-ico danger">↩</span>
              <span v-else class="block-ico warn">⏳</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium truncate">{{ s.student?.name || '-' }}</span>
                  <StatusTag :kind="s.status" :type="'schedule'" />
                </div>
                <div class="text-sm text-gray mt-0.5">
                  <template v-if="s.status === 'rejected'">{{ s.coach?.name || '教练' }} 已退回：{{ s.rejectReason || '无原因' }}</template>
                  <template v-else>未分配教练，已滞留 {{ dayjs().diff(dayjs(s.assignedAt), 'hour') }} 小时</template>
                </div>
                <div class="text-xs text-muted mt-1">
                  <template v-if="s.passedAppointmentNote">来自预约备注：{{ s.passedAppointmentNote }}</template>
                  <template v-else>无备注</template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="card p-4">
        <div class="flex-between mb-3">
          <h3 class="font-semibold">即将进行的练车 · 未来 3 天</h3>
          <button class="btn btn-ghost btn-sm" @click="goScheduleFilter('all')">完整日历 →</button>
        </div>
        <div v-if="recentSchedules.length === 0" class="empty text-sm">暂无即将到来的排班</div>
        <div v-else class="upcoming-list">
          <div v-for="s in recentSchedules" :key="s.id" class="upcoming-row clickable" @click="goScheduleFilter('all')">
            <div class="upcoming-date">
              <div class="up-day">{{ dayjs(s.date).date() }}</div>
              <div class="up-mon">{{ dayjs(s.date).format('MM月') }}</div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ s.student?.name }}</span>
                <span class="tag tag-gray">{{ s.subject }}</span>
              </div>
              <div class="text-sm text-gray mt-0.5">{{ s.slot }} · {{ s.coach?.name || '未分配' }}</div>
              <StatusTag :kind="s.status" type="schedule" :small="true" />
            </div>
          </div>
        </div>
      </section>

      <section class="card p-4">
        <div class="flex-between mb-3">
          <h3 class="font-semibold">考试跟进卡点</h3>
          <button class="btn btn-ghost btn-sm" @click="goExamFilter('blocked')">全部卡点 →</button>
        </div>
        <div v-if="blockedExamList.length === 0" class="empty text-sm">考试跟进全部正常 ✓</div>
        <div v-else class="block-list">
          <div v-for="e in blockedExamList" :key="e.id" class="block-row clickable" @click="goExamFilter('blocked')">
            <div class="flex gap-3 items-start flex-1">
              <span class="block-ico purple">✎</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium truncate">{{ e.student?.name || '-' }}</span>
                  <StatusTag :kind="e.status" type="exam" />
                </div>
                <div class="text-sm text-gray mt-0.5">
                  {{ e.exception?.message || (e.handlerName ? '待 ' + e.handlerName + ' 约考' : '未分配考试专员') }}
                </div>
                <div class="text-xs text-muted mt-1 truncate" :title="e.coachAssessment">
                  教练评估：{{ e.coachAssessment || '—' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.stat-card { padding: 16px 18px; }
.stat-head { margin-bottom: 10px; }
.stat-label { font-size: 13px; color: var(--gray-600); font-weight: 500; }
.stat-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; }
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.2; margin-bottom: 4px; }
.stat-hint { font-size: 12px; }

.grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.handler-list, .block-list { display: flex; flex-direction: column; gap: 2px; }
.handler-row, .block-row, .upcoming-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 8px;
}
.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 14px; flex-shrink: 0;
}
.count-pill { padding: 3px 10px; border-radius: 999px; font-weight: 600; font-size: 13px; }
.count-blue { background: #dbeafe; color: #1e40af; }
.count-green { background: #d1fae5; color: #047857; }
.count-purple { background: #ede9fe; color: #6d28d9; }

.block-ico {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; flex-shrink: 0;
}
.block-ico.danger { background: #fee2e2; color: #b91c1c; }
.block-ico.warn { background: #fef3c7; color: #92400e; }
.block-ico.purple { background: #ede9fe; color: #6d28d9; }

.upcoming-date {
  width: 52px; text-align: center;
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: 10px; padding: 6px 4px; flex-shrink: 0;
}
.up-day { font-size: 20px; font-weight: 700; color: #1e40af; line-height: 1; }
.up-mon { font-size: 11px; color: #3b82f6; margin-top: 3px; }
.upcoming-list { display: flex; flex-direction: column; gap: 2px; }
</style>
