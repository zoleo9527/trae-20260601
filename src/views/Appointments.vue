<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { APPOINTMENT_STATUS, APPOINTMENT_STATUS_LABELS } from '@/data/mock.js'
import StatusTag from '@/components/StatusTag.vue'
import AppointmentModal from '@/components/AppointmentModal.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const activeFilter = ref('all')
const keyword = ref('')
const modalMode = ref('')
const modalAppointment = ref(null)

const filterTabs = [
  { key: 'all', label: '全部预约' },
  { key: 'pending', label: '待审核' },
  { key: 'exception', label: '异常/资料待补' },
  { key: 'reviewed', label: '已审核待排班' },
  { key: 'scheduled', label: '排班中/已完成' }
]

onMounted(() => {
  if (route.query.filter) activeFilter.value = route.query.filter
})

watch(() => route.query.filter, (v) => {
  if (v) activeFilter.value = v
})

const filteredAppointments = computed(() => {
  let list = store.appointments.map(a => ({
    ...a,
    student: store.getStudentById(a.studentId),
    schedules: store.getSchedulesByAppointment(a.id)
  }))
  switch (activeFilter.value) {
    case 'pending':
      list = list.filter(a => a.status === APPOINTMENT_STATUS.PENDING_REVIEW)
      break
    case 'exception':
      list = list.filter(a => a.status === APPOINTMENT_STATUS.INFO_INCOMPLETE || a.exception)
      break
    case 'reviewed':
      list = list.filter(a => a.status === APPOINTMENT_STATUS.REVIEWED)
      break
    case 'scheduled':
      list = list.filter(a => [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.IN_PROGRESS, APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED].includes(a.status))
      break
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(a =>
      (a.student?.name || '').toLowerCase().includes(kw) ||
      a.id.toLowerCase().includes(kw) ||
      (a.student?.phone || '').includes(kw)
    )
  }
  return list
})

const allSelected = computed(() =>
  filteredAppointments.value.length > 0 &&
  filteredAppointments.value.every(a => store.selectedAppointmentIds.has(a.id))
)

function toggleAll() {
  if (allSelected.value) {
    store.clearAppointmentSelection()
  } else {
    filteredAppointments.value.forEach(a => store.selectedAppointmentIds.add(a.id))
  }
}

function openModal(mode, apt) {
  modalMode.value = mode
  modalAppointment.value = apt
}
function closeModal() {
  modalMode.value = ''
  modalAppointment.value = null
}

function filterByStatus(s) {
  if (s === APPOINTMENT_STATUS.PENDING_REVIEW) activeFilter.value = 'pending'
  else if (s === APPOINTMENT_STATUS.INFO_INCOMPLETE) activeFilter.value = 'exception'
  else if (s === APPOINTMENT_STATUS.REVIEWED) activeFilter.value = 'reviewed'
  else activeFilter.value = 'scheduled'
}

function goTrace(id) { router.push(`/trace/${id}`) }

function handleBatchApprove() {
  const ids = Array.from(store.selectedAppointmentIds)
  if (!ids.length) return store.pushToast('请先勾选预约记录', 'warning')
  store.batchApprove(ids)
}
function handleBatchException() {
  const ids = Array.from(store.selectedAppointmentIds)
  if (!ids.length) return store.pushToast('请先勾选预约记录', 'warning')
  store.batchMarkException(ids, { type: 'manual', severity: 'warning', message: '批量标记：资料需复核' })
}
function handleBatchNotify() {
  const ids = Array.from(store.selectedAppointmentIds)
  if (!ids.length) return store.pushToast('请先勾选预约记录', 'warning')
  store.batchNotify(ids)
}
</script>

<template>
  <div class="appointments-page">
    <div class="card p-3 mb-3 filter-bar flex-between">
      <div class="filter-tabs flex gap-1">
        <button
          v-for="t in filterTabs" :key="t.key"
          class="ftab clickable"
          :class="{ active: activeFilter === t.key }"
          @click="activeFilter = t.key"
        >
          {{ t.label }}
          <span
            v-if="t.key === 'pending'"
            class="badge"
            style="margin-left:6px;background:#f59e0b;"
          >{{ store.pendingReviewAppointments.length }}</span>
          <span
            v-if="t.key === 'exception'"
            class="badge"
            style="margin-left:6px;"
          >{{ store.blockedAppointments.length }}</span>
        </button>
      </div>
      <div class="flex gap-2 items-center">
        <input v-model="keyword" class="input" placeholder="🔍 搜索姓名/编号" style="width:220px;" />
      </div>
    </div>

    <div v-if="store.selectedAppointmentIds.size > 0" class="card p-3 mb-3 batch-bar flex-between">
      <div class="text-sm">
        已选中 <b style="color:var(--primary)">{{ store.selectedAppointmentIds.size }}</b> 条预约
      </div>
      <div class="flex gap-2">
        <button class="btn btn-success btn-sm" @click="handleBatchApprove">✓ 批量通过</button>
        <button class="btn btn-warning btn-sm" @click="handleBatchException">⚠ 批量标异常</button>
        <button class="btn btn-default btn-sm" @click="handleBatchNotify">✉ 批量通知</button>
        <button class="btn btn-ghost btn-sm" @click="store.clearAppointmentSelection()">取消勾选</button>
      </div>
    </div>

    <div class="card list-card">
      <div class="list-head flex items-center gap-3 p-3" style="border-bottom:1px solid var(--gray-200);">
        <input type="checkbox" :checked="allSelected" @change="toggleAll" style="width:16px;height:16px;cursor:pointer;" />
        <div class="col-checkbox"></div>
        <div class="col-student"><span class="text-sm text-gray font-medium">学员</span></div>
        <div class="col-info"><span class="text-sm text-gray font-medium">意向与资料</span></div>
        <div class="col-status"><span class="text-sm text-gray font-medium">状态</span></div>
        <div class="col-remark"><span class="text-sm text-gray font-medium">备注/异常</span></div>
        <div class="col-actions"><span class="text-sm text-gray font-medium text-right w-full block">处理动作</span></div>
      </div>

      <div v-if="filteredAppointments.length === 0" class="empty">没有符合条件的预约记录</div>

      <div v-for="a in filteredAppointments" :key="a.id" class="list-row flex items-center gap-3 p-3 clickable"
           :class="{ selected: store.selectedAppointmentIds.has(a.id), 'row-warn': a.exception?.severity === 'warning', 'row-danger': a.exception?.severity === 'danger' }">
        <input type="checkbox" :checked="store.selectedAppointmentIds.has(a.id)"
               @change.stop="store.toggleAppointmentSelection(a.id)" style="width:16px;height:16px;cursor:pointer;" />
        <div class="col-checkbox" @click.stop="goTrace(a.id)" title="点我查看完整流转线">
          <div class="apt-id">{{ a.id }}</div>
          <div class="text-xs text-muted">{{ a.createdAt }}</div>
        </div>
        <div class="col-student">
          <div class="flex items-center gap-2">
            <div class="avatar-sm" :style="{ background: studentColor(a.student?.name) }">{{ (a.student?.name || '?').charAt(0) }}</div>
            <div>
              <div class="font-medium">{{ a.student?.name || '未知' }}
                <span v-if="a.handler" class="text-xs text-muted ml-2">责任人：{{ store.staffMap[a.handler]?.name || store.getCoachById(a.handler)?.name || '—' }}</span>
              </div>
              <div class="text-xs text-gray mt-0.5">{{ a.student?.phone }} · {{ a.student?.carType }}</div>
            </div>
          </div>
        </div>
        <div class="col-info">
          <div class="text-sm">
            <span class="tag tag-blue mr-1" style="margin-right:4px;">{{ a.subject }}</span>
            <span v-for="d in a.preferredDates" :key="d" class="text-xs">{{ d }}</span>
          </div>
          <div class="text-xs text-gray mt-1">
            <span v-for="(s, i) in a.preferredSlots" :key="s">{{ s }}{{ i < a.preferredSlots.length - 1 ? '、' : '' }}</span>
          </div>
          <div class="doc-check mt-1 flex gap-1 flex-wrap">
            <span :class="['doc-item', a.student?.idCardReady ? 'ok' : 'miss']">身份证</span>
            <span :class="['doc-item', a.student?.medicalDone ? 'ok' : 'miss']">体检表</span>
            <span :class="['doc-item', a.student?.paymentDone ? 'ok' : 'miss']">缴费</span>
            <span :class="['doc-item', a.student?.photoDone ? 'ok' : 'miss']">照片</span>
          </div>
        </div>
        <div class="col-status" @click.stop="filterByStatus(a.status)">
          <StatusTag :kind="a.status" type="appointment" />
          <div v-if="a.schedules.length" class="text-xs text-muted mt-1">
            已有排班 {{ a.schedules.length }} 条 →
          </div>
        </div>
        <div class="col-remark">
          <div v-if="a.exception" class="ex-tag" :class="a.exception.severity">
            {{ a.exception.message }}
          </div>
          <div class="text-xs text-gray mt-1 truncate" :title="a.advisorNote || a.reviewNote">
            {{ a.advisorNote || a.reviewNote || '—' }}
          </div>
        </div>
        <div class="col-actions flex gap-2 justify-end flex-wrap">
          <template v-if="a.status === 'pending_review'">
            <button class="btn btn-success btn-sm" @click.stop="openModal('approve', a)">审核通过</button>
            <button class="btn btn-warning btn-sm" @click.stop="openModal('reject', a)">标记异常</button>
          </template>
          <template v-else-if="a.status === 'info_incomplete'">
            <button class="btn btn-primary btn-sm" @click.stop="openModal('approve', a)">解除异常</button>
            <button class="btn btn-danger btn-sm" @click.stop="openModal('remind', a)">🔔 催办</button>
          </template>
          <template v-else-if="a.status === 'reviewed'">
            <button class="btn btn-primary btn-sm" @click.stop="openModal('assign', a)">去排班</button>
            <button class="btn btn-ghost btn-sm" @click.stop="openModal('edit', a)">改备注</button>
          </template>
          <template v-else>
            <button class="btn btn-default btn-sm" @click.stop="goTrace(a.id)">查看流转</button>
          </template>
        </div>
      </div>
    </div>

    <AppointmentModal
      v-if="modalMode"
      :mode="modalMode"
      :appointment="modalAppointment"
      @close="closeModal"
    />
  </div>
</template>

<script>
function studentColor(name) {
  const palette = ['#dbeafe', '#fce7f3', '#d1fae5', '#fef3c7', '#ede9fe', '#cffafe']
  if (!name) return palette[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}
export default { methods: { studentColor } }
</script>

<style scoped>
.filter-tabs { }
.ftab {
  padding: 7px 14px; border-radius: 7px;
  font-size: 13px; font-weight: 500;
  color: var(--gray-600);
  display: inline-flex; align-items: center;
}
.ftab:hover { background: var(--gray-100); color: var(--gray-800); }
.ftab.active { background: var(--primary); color: #fff; box-shadow: 0 2px 6px rgba(37,99,235,.35); }
.ftab.active .badge { background: rgba(255,255,255,.25); color: #fff; }

.batch-bar { background: linear-gradient(90deg, #eff6ff, #f0fdf4); border-color: #bfdbfe; }

.list-card { overflow: hidden; }
.list-row {
  border-bottom: 1px solid var(--gray-100);
  transition: background .15s;
}
.list-row:last-child { border-bottom: none; }
.list-row:hover { background: var(--gray-50); }
.list-row.selected { background: #eff6ff; }
.list-row.row-warn { background: linear-gradient(90deg, #fffbeb 0%, #fff 30%); }
.list-row.row-danger { background: linear-gradient(90deg, #fef2f2 0%, #fff 30%); }

.col-checkbox { flex: 0 0 110px; min-width: 110px; }
.col-student { flex: 0 0 200px; min-width: 200px; }
.col-info { flex: 1; min-width: 230px; }
.col-status { flex: 0 0 140px; min-width: 140px; cursor: pointer; }
.col-remark { flex: 0 0 200px; min-width: 180px; }
.col-actions { flex: 0 0 240px; min-width: 200px; }

.apt-id { font-family: 'SFMono-Regular', Menlo, monospace; font-size: 12px; font-weight: 600; color: var(--gray-700); cursor: pointer; }
.apt-id:hover { color: var(--primary); }

.avatar-sm {
  width: 34px; height: 34px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 13px; flex-shrink: 0;
}

.doc-item {
  font-size: 10.5px; padding: 1px 6px; border-radius: 4px;
  border: 1px solid var(--gray-200);
}
.doc-item.ok { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.doc-item.miss { background: #fef2f2; border-color: #fecaca; color: #991b1b; }

.ex-tag {
  display: inline-block;
  font-size: 12px; padding: 2px 8px; border-radius: 6px;
  font-weight: 500;
}
.ex-tag.warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.ex-tag.danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
</style>
