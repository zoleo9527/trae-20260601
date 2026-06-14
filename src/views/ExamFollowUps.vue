<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { EXAM_STATUS, ROLES, EXAM_SITES } from '@/data/mock.js'
import StatusTag from '@/components/StatusTag.vue'
import ExamFollowUpModal from '@/components/ExamFollowUpModal.vue'
import dayjs from 'dayjs'

const route = useRoute()
const store = useAppStore()

const activeFilter = ref('all')
const keyword = ref('')
const modalMode = ref('')
const modalExam = ref(null)

const filterTabs = [
  { key: 'all', label: '全部考试跟进' },
  { key: 'pending', label: '待我认领/复核', badge: () => store.pendingExamFollowUps.length },
  { key: 'ready', label: '可约考' },
  { key: 'booked', label: '已约考' },
  { key: 'blocked', label: '卡点异常', badge: () => store.blockedExamFollowUps.length },
  { key: 'finished', label: '已完成/关闭' }
]

onMounted(() => { if (route.query.filter) activeFilter.value = route.query.filter })
watch(() => route.query.filter, v => { if (v) activeFilter.value = v })

const isExaminer = computed(() => store.currentRole === ROLES.EXAMINER)

const filteredExams = computed(() => {
  let list = store.examFollowUps.map(e => ({
    ...e,
    student: store.getStudentById(e.studentId),
    coach: e.coachId ? store.getCoachById(e.coachId) : null
  }))
  switch (activeFilter.value) {
    case 'pending':
      list = list.filter(e => e.status === EXAM_STATUS.PENDING_REVIEW)
      break
    case 'ready':
      list = list.filter(e => e.status === EXAM_STATUS.READY_TO_BOOK)
      break
    case 'booked':
      list = list.filter(e => e.status === EXAM_STATUS.BOOKED || e.status === EXAM_STATUS.STUDENT_CONFIRMED)
      break
    case 'blocked':
      list = store.blockedExamFollowUps.map(id => typeof id === 'string' ? list.find(x => x.id === id) : id).filter(Boolean)
      break
    case 'finished':
      list = list.filter(e => e.status === EXAM_STATUS.EXAM_PASSED || e.status === EXAM_STATUS.EXAM_FAILED || e.status === EXAM_STATUS.CLOSED)
      break
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(e =>
      (e.student?.name || '').toLowerCase().includes(kw) ||
      e.id.toLowerCase().includes(kw)
    )
  }
  return list
})

const allSelected = computed(() =>
  filteredExams.value.length > 0 &&
  filteredExams.value.every(e => store.selectedExamFollowUpIds.has(e.id))
)
function toggleAll() {
  if (allSelected.value) store.clearExamFollowUpSelection()
  else filteredExams.value.forEach(e => store.selectedExamFollowUpIds.add(e.id))
}

function openModal(mode, exam) { modalMode.value = mode; modalExam.value = exam }
function closeModal() { modalMode.value = ''; modalExam.value = null }

function whyBlocked(e) {
  if (e.status === EXAM_STATUS.PENDING_REVIEW) {
    const hours = dayjs().diff(dayjs(e.completedAt), 'hour')
    if (hours > 12) return { label: `滞留 ${hours} 小时未认领`, severity: 'danger' }
    return { label: '待考试专员认领复核', severity: 'warning' }
  }
  if (e.exception) return { label: e.exception.message, severity: e.exception.severity || 'warning' }
  if (e.status === EXAM_STATUS.BOOKED) {
    const days = dayjs(e.bookedDate).diff(dayjs(), 'day')
    if (days >= 0 && days <= 3) return { label: `${days <= 0 ? '今天' : days + '天后'}考试，学员未确认`, severity: 'warning' }
  }
  if (e.status === EXAM_STATUS.EXAM_FAILED) return { label: '考试未通过，需补训重约', severity: 'danger' }
  if (!e.handler) return { label: '未分配责任人', severity: 'warning' }
  return null
}

function batchClaim() {
  const ids = Array.from(store.selectedExamFollowUpIds)
  if (!ids.length) return store.pushToast('请先勾选考试跟进记录', 'warning')
  store.batchClaimExam(ids)
}
function batchNotify() {
  const ids = Array.from(store.selectedExamFollowUpIds)
  if (!ids.length) return store.pushToast('请先勾选考试跟进记录', 'warning')
  store.batchNotifyExamStudents(ids)
}
</script>

<template>
  <div class="exam-page">
    <div v-if="isExaminer" class="card p-3 mb-3 flex-between" style="background: linear-gradient(90deg, #f5f3ff, #ede9fe); border-color: #c4b5fd;">
      <div class="text-sm">
        <b style="color:#6d28d9;">考试专员视图</b>
        · 待复核 <b>{{ store.examFollowUps.filter(e => e.status === 'pending_review').length }}</b> 条
        · 待约考 <b>{{ store.examFollowUps.filter(e => e.status === 'ready_to_book').length }}</b> 条
      </div>
      <span class="text-xs text-muted">你好，{{ store.staffMap['E001']?.name || '孙伟峰' }}</span>
    </div>

    <div class="card p-3 mb-3 filter-bar flex-between">
      <div class="filter-tabs flex gap-1">
        <button v-for="t in filterTabs" :key="t.key"
                class="ftab clickable"
                :class="{ active: activeFilter === t.key }"
                @click="activeFilter = t.key">
          {{ t.label }}
          <span v-if="t.badge && t.badge()" class="badge" style="margin-left:6px;background:#8b5cf6;">{{ t.badge() }}</span>
        </button>
      </div>
      <div class="flex gap-2 items-center">
        <input v-model="keyword" class="input" placeholder="🔍 搜索学员姓名/编号" style="width:220px;" />
      </div>
    </div>

    <div v-if="store.selectedExamFollowUpIds.size > 0" class="card p-3 mb-3 batch-bar flex-between">
      <div class="text-sm">已选中 <b style="color:#8b5cf6;">{{ store.selectedExamFollowUpIds.size }}</b> 条考试跟进</div>
      <div class="flex gap-2">
        <button class="btn btn-primary btn-sm" @click="batchClaim">✓ 批量认领</button>
        <button class="btn btn-default btn-sm" @click="batchNotify">✉ 批量通知学员</button>
        <button class="btn btn-ghost btn-sm" @click="store.clearExamFollowUpSelection()">取消勾选</button>
      </div>
    </div>

    <div class="card list-card">
      <div class="list-head flex items-center gap-3 p-3" style="border-bottom:1px solid var(--gray-200);">
        <input type="checkbox" :checked="allSelected" @change="toggleAll" style="width:16px;height:16px;cursor:pointer;" />
        <div class="col-chk"></div>
        <div class="col-whom"><span class="text-sm text-gray font-medium">学员 / 教练评估</span></div>
        <div class="col-subj"><span class="text-sm text-gray font-medium">科目 / 进度</span></div>
        <div class="col-st"><span class="text-sm text-gray font-medium">状态</span></div>
        <div class="col-handler"><span class="text-sm text-gray font-medium">考试专员</span></div>
        <div class="col-why"><span class="text-sm text-gray font-medium">卡点原因</span></div>
        <div class="col-act text-right"><span class="text-sm text-gray font-medium">动作</span></div>
      </div>

      <div v-if="filteredExams.length === 0" class="empty">暂无符合条件的考试跟进</div>

      <div v-for="e in filteredExams" :key="e.id" class="list-row flex items-center gap-3 p-3 clickable"
           :class="{ selected: store.selectedExamFollowUpIds.has(e.id), 'row-warn': whyBlocked(e)?.severity === 'warning', 'row-danger': whyBlocked(e)?.severity === 'danger' }"
           @click="openModal('view', e)">
        <input type="checkbox" :checked="store.selectedExamFollowUpIds.has(e.id)"
               @change.stop="store.toggleExamFollowUpSelection(e.id)" style="width:16px;height:16px;cursor:pointer;" />
        <div class="col-chk">
          <div class="ex-id" @click.stop="openModal('view', e)">{{ e.id }}</div>
          <div class="text-xs text-muted mt-0.5">练车完成 {{ e.completedAt }}</div>
        </div>
        <div class="col-whom">
          <div class="flex items-center gap-2">
            <div class="avatar-stu" style="background:#ede9fe;color:#6d28d9;">{{ (e.student?.name || '?').charAt(0) }}</div>
            <div class="flex-1 min-w-0">
              <div class="font-medium">{{ e.student?.name }} <span class="tag tag-purple ml-1" style="font-size:10.5px;">{{ e.subject }}</span></div>
              <div class="text-xs text-gray mt-0.5">📞 {{ e.student?.phone }}</div>
            </div>
          </div>
          <div class="coach-note mt-1" @click.stop>
            <span class="text-xs text-gray">教练：</span>
            <span class="text-xs">{{ e.coach?.name || '—' }}</span>
            <span class="mx-1 text-muted">·</span>
            <span class="text-xs truncate" :title="e.coachCompletionNote" style="max-width:260px;">{{ e.coachAssessment || e.coachCompletionNote || '无反馈' }}</span>
          </div>
        </div>
        <div class="col-subj">
          <div v-if="e.status === 'booked' || e.status === 'student_confirmed'">
            <div class="date-pill purple">
              <span class="date-day">{{ dayjs(e.bookedDate).date() }}</span>
              <span class="date-mon">{{ dayjs(e.bookedDate).format('MM') }}月</span>
            </div>
            <div class="text-xs text-gray mt-1">{{ e.bookedSlot }}</div>
            <div class="text-xs text-muted mt-0.5 truncate" style="max-width:140px;">{{ e.bookedSite }}</div>
          </div>
          <div v-else class="text-xs text-gray">
            等待考试专员安排
          </div>
        </div>
        <div class="col-st">
          <StatusTag :kind="e.status" type="exam" />
        </div>
        <div class="col-handler">
          <template v-if="e.handler">
            <div class="flex items-center gap-2">
              <div class="handler-avatar-sm">{{ (e.handlerName || '?').charAt(0) }}</div>
              <div>
                <div class="text-sm font-medium">{{ e.handlerName || '—' }}</div>
                <div class="text-xs text-muted">考试专员</div>
              </div>
            </div>
          </template>
          <span v-else class="tag tag-yellow">未认领</span>
        </div>
        <div class="col-why">
          <template v-if="whyBlocked(e)">
            <div class="why-tag" :class="whyBlocked(e).severity">
              <span class="why-ico">{{ whyBlocked(e).severity === 'danger' ? '!' : whyBlocked(e).severity === 'warning' ? '⏳' : 'i' }}</span>
              {{ whyBlocked(e).label }}
            </div>
          </template>
          <div v-else class="text-xs text-muted">正常推进 ✓</div>
        </div>
        <div class="col-act flex gap-2 justify-end flex-wrap" @click.stop>
          <template v-if="e.status === 'pending_review'">
            <button class="btn btn-primary btn-sm" @click="openModal('claim', e)">认领</button>
            <button class="btn btn-default btn-sm" @click="openModal('mark-ready', e)">标记可约考</button>
          </template>
          <template v-else-if="e.status === 'ready_to_book'">
            <button class="btn btn-primary btn-sm" @click="openModal('book', e)">立即约考</button>
            <button class="btn btn-warning btn-sm" @click="openModal('exception', e)">标记异常</button>
          </template>
          <template v-else-if="e.status === 'booked'">
            <button class="btn btn-success btn-sm" @click="store.confirmStudentExam(e.id); store.pushToast('已通知学员确认', 'success')">学员确认</button>
            <button class="btn btn-ghost btn-sm" @click="openModal('book', e)">改期</button>
          </template>
          <template v-else-if="e.status === 'student_confirmed'">
            <button class="btn btn-success btn-sm" @click="openModal('finish', e)">记录成绩</button>
          </template>
          <template v-else-if="e.status === 'exam_failed'">
            <button class="btn btn-warning btn-sm" @click="openModal('rebook', e)">安排重考</button>
          </template>
          <template v-else>
            <button class="btn btn-ghost btn-sm" @click="openModal('view', e)">回看</button>
          </template>
        </div>
      </div>
    </div>

    <ExamFollowUpModal
      v-if="modalMode"
      :mode="modalMode"
      :exam="modalExam"
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
.ftab.active { background: #8b5cf6; color: #fff; box-shadow: 0 2px 6px rgba(139,92,246,.35); }
.ftab.active .badge { background: rgba(255,255,255,.25); color: #fff; }

.batch-bar { background: linear-gradient(90deg, #f5f3ff, #eff6ff); border-color: #ddd6fe; }

.list-card { overflow: hidden; }
.list-row { border-bottom: 1px solid var(--gray-100); transition: background .15s; }
.list-row:last-child { border-bottom: none; }
.list-row:hover { background: var(--gray-50); }
.list-row.selected { background: #f5f3ff; }
.list-row.row-warn { background: linear-gradient(90deg, #fffbeb 0%, #fff 30%); }
.list-row.row-danger { background: linear-gradient(90deg, #fef2f2 0%, #fff 30%); }

.col-chk { flex: 0 0 140px; min-width: 130px; }
.col-whom { flex: 1; min-width: 260px; }
.col-subj { flex: 0 0 150px; min-width: 140px; text-align: center; }
.col-st { flex: 0 0 130px; min-width: 120px; }
.col-handler { flex: 0 0 130px; min-width: 120px; }
.col-why { flex: 0 0 180px; min-width: 160px; }
.col-act { flex: 0 0 220px; min-width: 200px; }

.ex-id { font-family: Menlo, monospace; font-size: 12px; font-weight: 600; color: #6d28d9; cursor: pointer; }
.ex-id:hover { color: #5b21b6; }

.avatar-stu, .handler-avatar-sm {
  width: 28px; height: 28px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 12px; flex-shrink: 0;
}
.handler-avatar-sm { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff; }

.coach-note {
  background: #faf5ff; border: 1px solid #e9d5ff;
  padding: 4px 8px; border-radius: 6px;
  font-size: 11.5px; color: #581c87;
  display: flex; align-items: center; flex-wrap: wrap;
}

.date-pill {
  display: inline-flex; align-items: baseline; gap: 2px;
  color: #fff; border-radius: 8px; padding: 3px 8px;
}
.date-pill.purple { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
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
</style>
