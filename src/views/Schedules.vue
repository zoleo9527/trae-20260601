<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { SCHEDULE_STATUS, ROLES, COACHES, TIME_SLOTS, SUBJECTS } from '@/data/mock.js'
import StatusTag from '@/components/StatusTag.vue'
import ScheduleModal from '@/components/ScheduleModal.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const activeFilter = ref('all')
const keyword = ref('')
const modalMode = ref('')
const modalSchedule = ref(null)
const activeCoach = ref(COACHES[0].id)

const filterTabs = [
  { key: 'all', label: '全部排班' },
  { key: 'unassigned', label: '未分配教练', badge: () => store.unassignedSchedules.length },
  { key: 'assigned', label: '待教练确认' },
  { key: 'rejected', label: '已退回/异常', badge: () => store.blockedSchedules.filter(s => s.status === 'rejected').length },
  { key: 'upcoming', label: '即将进行' }
]

onMounted(() => {
  if (route.query.filter) activeFilter.value = route.query.filter
})
watch(() => route.query.filter, (v) => { if (v) activeFilter.value = v })

const isCoachView = computed(() => store.currentRole === ROLES.COACH)

const filteredSchedules = computed(() => {
  let list = store.schedules.map(s => ({
    ...s,
    student: store.getStudentById(s.studentId),
    coach: s.coachId ? store.getCoachById(s.coachId) : null,
    assigner: s.assignedBy ? (store.staffMap[s.assignedBy]?.name || '') : ''
  }))

  if (isCoachView.value) {
    list = list.filter(s => s.coachId === activeCoach.value)
  }

  switch (activeFilter.value) {
    case 'unassigned': list = list.filter(s => s.status === SCHEDULE_STATUS.UNASSIGNED); break
    case 'assigned': list = list.filter(s => s.status === SCHEDULE_STATUS.ASSIGNED || s.status === SCHEDULE_STATUS.COACH_CONFIRMED); break
    case 'rejected': list = list.filter(s => s.status === SCHEDULE_STATUS.REJECTED); break
    case 'upcoming': {
      const today = dayjs().format('YYYY-MM-DD')
      list = list.filter(s => s.date && s.date >= today && s.status !== SCHEDULE_STATUS.COMPLETED && s.status !== SCHEDULE_STATUS.REJECTED)
      list.sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot))
      break
    }
  }

  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(s =>
      (s.student?.name || '').toLowerCase().includes(kw) ||
      (s.coach?.name || '').toLowerCase().includes(kw) ||
      s.id.toLowerCase().includes(kw)
    )
  }
  return list
})

const allSelected = computed(() =>
  filteredSchedules.value.length > 0 &&
  filteredSchedules.value.every(s => store.selectedScheduleIds.has(s.id))
)
function toggleAll() {
  if (allSelected.value) store.clearScheduleSelection()
  else filteredSchedules.value.forEach(s => store.selectedScheduleIds.add(s.id))
}

function openModal(mode, sch) {
  modalMode.value = mode
  modalSchedule.value = sch
}
function closeModal() {
  modalMode.value = ''
  modalSchedule.value = null
}

function filterByStatus(s) {
  const map = {
    [SCHEDULE_STATUS.UNASSIGNED]: 'unassigned',
    [SCHEDULE_STATUS.ASSIGNED]: 'assigned',
    [SCHEDULE_STATUS.COACH_CONFIRMED]: 'assigned',
    [SCHEDULE_STATUS.REJECTED]: 'rejected'
  }
  activeFilter.value = map[s] || 'all'
}

function goTrace(id) { router.push('/trace/' + id) }

function whyUncompleted(s) {
  if (s.status === SCHEDULE_STATUS.UNASSIGNED) {
    const hours = dayjs().diff(dayjs(s.assignedAt), 'hour')
    if (hours > 4) return { label: '已滞留 ' + hours + ' 小时未分配', severity: 'danger' }
    return { label: '招生顾问尚未分配教练', severity: 'warning' }
  }
  if (s.status === SCHEDULE_STATUS.REJECTED) return { label: '教练已退回', severity: 'danger' }
  if (s.status === SCHEDULE_STATUS.ASSIGNED) {
    const hours = dayjs().diff(dayjs(s.assignedAt), 'hour')
    if (hours > 12) return { label: '教练已 ' + hours + ' 小时未确认', severity: 'warning' }
    return { label: '教练待确认', severity: 'info' }
  }
  return null
}

function handleBatchNotify() {
  const ids = Array.from(store.selectedScheduleIds)
  if (!ids.length) return store.pushToast('请先勾选排班记录', 'warning')
  store.batchNotify(ids)
}
</script>

<template>
  <div class="schedules-page">
    <div v-if="isCoachView" class="card p-3 mb-3 flex-between" style="background: linear-gradient(90deg, #ecfdf5, #f0fdfa); border-color: #a7f3d0;">
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray">教练视图 · 切换身份：</span>
        <select v-model="activeCoach" class="select" style="width:180px;">
          <option v-for="c in COACHES" :key="c.id" :value="c.id">{{ c.name }}（{{ c.carType }}）</option>
        </select>
        <span class="text-sm text-gray">
          今日待确认 <b style="color:#047857;">{{ store.upcomingCoachSchedules(activeCoach).length }}</b> 节
        </span>
      </div>
      <button class="btn btn-success btn-sm" @click="activeFilter = 'upcoming'">查看近期排班</button>
    </div>

    <div class="card p-3 mb-3 filter-bar flex-between">
      <div class="filter-tabs flex gap-1">
        <button v-for="t in filterTabs" :key="t.key"
                class="ftab clickable"
                :class="{ active: activeFilter === t.key }"
                @click="activeFilter = t.key">
          {{ t.label }}
          <span v-if="t.badge && t.badge()" class="badge" style="margin-left:6px;">{{ t.badge() }}</span>
        </button>
      </div>
      <div class="flex gap-2 items-center">
        <input v-model="keyword" class="input" placeholder="🔍 搜索学员/教练/编号" style="width:240px;" />
      </div>
    </div>

    <div v-if="store.selectedScheduleIds.size > 0" class="card p-3 mb-3 batch-bar flex-between">
      <div class="text-sm">已选中 <b style="color:var(--primary)">{{ store.selectedScheduleIds.size }}</b> 条排班</div>
      <div class="flex gap-2">
        <button class="btn btn-default btn-sm" @click="handleBatchNotify">✉ 批量通知学员</button>
        <button class="btn btn-ghost btn-sm" @click="store.clearScheduleSelection()">取消勾选</button>
      </div>
    </div>

    <div class="card list-card">
      <div class="list-head flex items-center gap-3 p-3" style="border-bottom:1px solid var(--gray-200);">
        <input type="checkbox" :checked="allSelected" @change="toggleAll" style="width:16px;height:16px;cursor:pointer;" />
        <div class="col-chk"></div>
        <div class="col-whom"><span class="text-sm text-gray font-medium">学员/教练</span></div>
        <div class="col-time"><span class="text-sm text-gray font-medium">时间</span></div>
        <div class="col-st"><span class="text-sm text-gray font-medium">状态</span></div>
        <div class="col-why"><span class="text-sm text-gray font-medium">为什么没完成</span></div>
        <div class="col-note"><span class="text-sm text-gray font-medium">来自预约的备注</span></div>
        <div class="col-act text-right"><span class="text-sm text-gray font-medium">动作</span></div>
      </div>

      <div v-if="filteredSchedules.length === 0" class="empty">
        <template v-if="isCoachView && activeFilter === 'upcoming'">这位教练近期暂无排班安排</template>
        <template v-else>没有符合条件的排班记录</template>
      </div>

      <div v-for="s in filteredSchedules" :key="s.id"
           class="list-row flex items-center gap-3 p-3 clickable"
           :class="{ selected: store.selectedScheduleIds.has(s.id), 'row-warn': whyUncompleted(s)?.severity === 'warning', 'row-danger': whyUncompleted(s)?.severity === 'danger' }"
           @click="openModal('view', s)">
        <input type="checkbox"
               :checked="store.selectedScheduleIds.has(s.id)"
               @change.stop="store.toggleScheduleSelection(s.id)"
               style="width:16px;height:16px;cursor:pointer;" />
        <div class="col-chk">
          <div class="sch-id" @click.stop="s.appointmentId && s.appointmentId.startsWith('AP') && goTrace(s.appointmentId)" title="预约编号可追溯">
            {{ s.id }}
          </div>
          <div class="text-xs text-muted mt-0.5">派单：{{ s.assigner || '系统' }} {{ s.assignedAt }}</div>
        </div>
        <div class="col-whom">
          <div class="flex items-center gap-2">
            <div class="avatar-stu" :style="{ background: '#dbeafe', color: '#1e40af' }">{{ (s.student?.name || '?').charAt(0) }}</div>
            <div class="flex-1 min-w-0">
              <div class="font-medium">{{ s.student?.name }} <span class="tag tag-blue ml-1" style="font-size:10.5px;">{{ s.subject }}</span></div>
              <div class="text-xs text-gray mt-0.5">📞 {{ s.student?.phone }}</div>
            </div>
          </div>
          <div class="divider-soft"></div>
          <div class="flex items-center gap-2 mt-1">
            <div class="avatar-coa" :style="{ background: '#d1fae5', color: '#047857' }">{{ (s.coach?.name || '?').charAt(0) }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium">{{ s.coach?.name || '待分配' }}</div>
              <div class="text-xs text-gray">{{ s.coach?.carType || '—' }}</div>
            </div>
          </div>
        </div>
        <div class="col-time">
          <template v-if="s.date">
            <div class="date-pill">
              <span class="date-day">{{ dayjs(s.date).date() }}</span>
              <span class="date-mon">{{ dayjs(s.date).format('MM') }}月</span>
            </div>
            <div class="text-xs text-gray mt-1">{{ s.slot }}</div>
            <div class="text-xs text-muted mt-0.5">周{{ '日一二三四五六'[dayjs(s.date).day()] }}</div>
          </template>
          <template v-else>
            <span class="tag tag-yellow">日期待定</span>
          </template>
        </div>
        <div class="col-st" @click.stop="filterByStatus(s.status)">
          <StatusTag :kind="s.status" type="schedule" />
          <div v-if="s.completedAt" class="text-xs text-muted mt-1">完成 {{ s.completedAt }}</div>
        </div>
        <div class="col-why">
          <template v-if="whyUncompleted(s)">
            <div class="why-tag" :class="whyUncompleted(s).severity">
              <span class="why-ico">{{ whyUncompleted(s).severity === 'danger' ? '!' : whyUncompleted(s).severity === 'warning' ? '⏳' : 'i' }}</span>
              {{ whyUncompleted(s).label }}
            </div>
            <div v-if="s.status === 'rejected'" class="text-xs text-gray mt-1 truncate" :title="s.rejectReason">
              原因：{{ s.rejectReason || '未说明' }}
            </div>
          </template>
          <div v-else class="text-xs text-muted">正常推进 ✓</div>
        </div>
        <div class="col-note">
          <div v-if="s.passedAppointmentNote" class="note-bubble" @click.stop="openModal('view', s)">
            {{ s.passedAppointmentNote }}
          </div>
          <div v-if="s.coachNote" class="text-xs text-gray mt-1 truncate" :title="s.coachNote">
            教练：{{ s.coachNote }}
          </div>
          <div v-if="!s.passedAppointmentNote && !s.coachNote" class="text-xs text-muted">—</div>
        </div>
        <div class="col-act flex gap-2 justify-end flex-wrap" @click.stop>
          <template v-if="s.status === 'unassigned'">
            <button class="btn btn-primary btn-sm" @click="openModal('assign', s)">分配教练</button>
          </template>
          <template v-else-if="s.status === 'assigned'">
            <template v-if="isCoachView">
              <button class="btn btn-success btn-sm" @click="openModal('confirm', s)">确认排班</button>
              <button class="btn btn-danger btn-sm" @click="openModal('reject', s)">退回</button>
            </template>
            <template v-else>
              <button class="btn btn-default btn-sm" @click="openModal('reassign', s)">改派</button>
              <button class="btn btn-warning btn-sm" @click="openModal('remind', s)">催教练</button>
            </template>
          </template>
          <template v-else-if="s.status === 'coach_confirmed'">
            <button class="btn btn-success btn-sm" @click="openModal('studentConfirm', s)">学员确认</button>
            <button class="btn btn-default btn-sm" @click="openModal('view', s)">查看</button>
          </template>
          <template v-else-if="s.status === 'student_confirmed'">
            <button class="btn btn-success btn-sm" @click="openModal('complete', s)">练车完成</button>
            <button class="btn btn-ghost btn-sm" @click="openModal('view', s)">查看</button>
          </template>
          <template v-else-if="s.status === 'rejected'">
            <button class="btn btn-primary btn-sm" @click="openModal('reassign', s)">重新分配</button>
          </template>
          <template v-else>
            <button class="btn btn-ghost btn-sm" @click="openModal('view', s)">回看</button>
          </template>
        </div>
      </div>
    </div>

    <ScheduleModal
      v-if="modalMode"
      :mode="modalMode"
      :schedule="modalSchedule"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
.filter-tabs { }
.ftab {
  padding: 7px 14px; border-radius: 7px;
  font-size: 13px; font-weight: 500; color: var(--gray-600);
  display: inline-flex; align-items: center;
}
.ftab:hover { background: var(--gray-100); color: var(--gray-800); }
.ftab.active { background: var(--success); color: #fff; box-shadow: 0 2px 6px rgba(16,185,129,.35); }
.ftab.active .badge { background: rgba(255,255,255,.25); color: #fff; }

.batch-bar { background: linear-gradient(90deg, #f0fdf4, #eff6ff); border-color: #bbf7d0; }

.list-card { overflow: hidden; }
.list-row { border-bottom: 1px solid var(--gray-100); transition: background .15s; }
.list-row:last-child { border-bottom: none; }
.list-row:hover { background: var(--gray-50); }
.list-row.selected { background: #eff6ff; }
.list-row.row-warn { background: linear-gradient(90deg, #fffbeb 0%, #fff 30%); }
.list-row.row-danger { background: linear-gradient(90deg, #fef2f2 0%, #fff 30%); }

.col-chk { flex: 0 0 140px; min-width: 140px; }
.col-whom { flex: 0 0 210px; min-width: 200px; }
.col-time { flex: 0 0 100px; min-width: 90px; text-align: center; }
.col-st { flex: 0 0 130px; min-width: 120px; cursor: pointer; }
.col-why { flex: 0 0 170px; min-width: 150px; }
.col-note { flex: 1; min-width: 160px; }
.col-act { flex: 0 0 220px; min-width: 180px; }

.sch-id { font-family: Menlo, monospace; font-size: 12px; font-weight: 600; color: var(--gray-700); cursor: pointer; }
.sch-id:hover { color: var(--primary); }

.avatar-stu, .avatar-coa {
  width: 28px; height: 28px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 12px; flex-shrink: 0;
}
.divider-soft { height: 1px; background: var(--gray-100); margin: 6px 0; }

.date-pill {
  display: inline-flex; align-items: baseline; gap: 2px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff; border-radius: 8px;
  padding: 3px 8px;
}
.date-day { font-size: 18px; font-weight: 700; line-height: 1; }
.date-mon { font-size: 10px; opacity: .9; }

.why-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 6px;
  font-size: 11.5px; font-weight: 500;
}
.why-tag.danger { background: #fee2e2; color: #b91c1c; }
.why-tag.warning { background: #fef3c7; color: #92400e; }
.why-tag.info { background: #cffafe; color: #0e7490; }
.why-ico { font-weight: 700; }

.note-bubble {
  background: #f0f9ff; border: 1px solid #bae6fd;
  border-radius: 8px; padding: 6px 8px;
  font-size: 11.5px; color: #0c4a6e;
  cursor: pointer; line-height: 1.4;
  max-height: 52px; overflow: hidden;
}
.note-bubble:hover { background: #e0f2fe; }
</style>
