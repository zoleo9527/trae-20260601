<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoleStore } from '@/stores/role'
import { useApi } from '@/composables/useApi'
import StatusBadge from '@/components/StatusBadge.vue'
import { CheckCircle, Bell, Search, Clock, AlertTriangle, CalendarCheck, Activity } from 'lucide-vue-next'

const roleStore = useRoleStore()
const { get, post } = useApi()

const isCoachSupervisor = computed(() => roleStore.currentRole === 'coach_supervisor')

interface Course {
  id: string
  coachName: string
  date: string
  startTime: string
  endTime: string
  status: string
}

interface StudentCheckin {
  id: string
  studentId: string
  studentName: string
  courseId: string
  courseName?: string
  checkinAt?: string
  status: 'pending' | 'checked_in' | 'no_show'
  equipmentCode?: string
  equipmentName?: string
  rentalAbnormal?: { type: string; note?: string; actualReturner?: string }
}

interface Gap {
  startTime: string
  endTime: string
  afterCourse?: { coachName: string; date: string; startTime: string; endTime: string }
  beforeCourse?: { coachName: string; date: string; startTime: string; endTime: string }
}

const activeTab = ref<'checkin' | 'history' | 'gap'>('checkin')
const courses = ref<Course[]>([])
const selectedCourseId = ref('')
const studentCheckins = ref<StudentCheckin[]>([])
const selectedStudentIds = ref<string[]>([])
const historyRecords = ref<StudentCheckin[]>([])
const gaps = ref<Gap[]>([])
const toast = ref('')
const loading = ref(false)

const historyDate = ref(new Date().toISOString().slice(0, 10))
const historyCourseId = ref('')
const historyStudentId = ref('')

const availableCourses = computed(() =>
  courses.value.filter(c => c.status === 'in_progress')
)

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

async function fetchCourses() {
  try {
    const res = await get<{ success: boolean; data: Course[] }>('/courses')
    courses.value = res.data ?? []
  } catch {
    courses.value = []
  }
}

async function fetchStudents() {
  if (!selectedCourseId.value) {
    studentCheckins.value = []
    return
  }
  try {
    const res = await get<{ success: boolean; data: StudentCheckin[] }>(
      `/checkin/students?courseId=${selectedCourseId.value}`
    )
    studentCheckins.value = res.data ?? []
  } catch {
    studentCheckins.value = []
  }
}

async function fetchHistory() {
  const params = new URLSearchParams()
  if (historyDate.value) params.set('date', historyDate.value)
  if (historyCourseId.value) params.set('courseId', historyCourseId.value)
  if (historyStudentId.value) params.set('studentId', historyStudentId.value)
  try {
    const res = await get<{ success: boolean; data: StudentCheckin[] }>(
      `/checkin/history?${params}`
    )
    historyRecords.value = res.data ?? []
  } catch {
    historyRecords.value = []
  }
}

async function fetchGaps() {
  loading.value = true
  try {
    const res = await get<{ success: boolean; data: Gap[] }>('/checkin/gaps')
    gaps.value = res.data ?? []
  } catch {
    gaps.value = []
  } finally {
    loading.value = false
  }
}

function toggleStudent(id: string) {
  const idx = selectedStudentIds.value.indexOf(id)
  if (idx >= 0) selectedStudentIds.value.splice(idx, 1)
  else selectedStudentIds.value.push(id)
}

function toggleAll() {
  const pendingIds = studentCheckins.value
    .filter(s => s.status === 'pending')
    .map(s => s.studentId)
  if (selectedStudentIds.value.length === pendingIds.length) {
    selectedStudentIds.value = []
  } else {
    selectedStudentIds.value = [...pendingIds]
  }
}

async function batchCheckin() {
  if (!selectedCourseId.value || selectedStudentIds.value.length === 0) return
  try {
    const res = await post<{ success: boolean; data: { checkedIn: any[]; blocked: { studentId: string; reason: string }[] } }>('/checkin', {
      courseId: selectedCourseId.value,
      studentIds: selectedStudentIds.value,
    })
    selectedStudentIds.value = []
    const blocked = res.data?.blocked || []
    const checkedIn = res.data?.checkedIn || []
    if (blocked.length > 0 && checkedIn.length === 0) {
      showToast(`签到被阻断：${blocked.map(b => b.reason).join('；')}`)
    } else if (blocked.length > 0) {
      showToast(`${checkedIn.length}人签到成功，${blocked.length}人被阻断：${blocked.map(b => b.reason).join('；')}`)
    } else {
      showToast('签到成功')
    }
    await fetchStudents()
  } catch (e: any) {
    showToast(e.message || '签到失败')
  }
}

watch(selectedCourseId, fetchStudents)

onMounted(async () => {
  await fetchCourses()
  await fetchHistory()
  await fetchGaps()
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="toast" class="fixed top-4 right-4 z-50 bg-sky-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      {{ toast }}
    </div>

    <div class="flex items-center gap-2 text-sm text-slate-500">
      <CalendarCheck class="w-4 h-4" />
      <span v-if="isCoachSupervisor">教练主管 — 管理课程签到、查看签到历史、检测课程空档</span>
      <span v-else>{{ roleStore.roleName }} — 仅可查看签到信息，签到操作需教练主管权限</span>
    </div>

    <div v-if="!isCoachSupervisor" class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-amber-700">
      <AlertTriangle class="w-4 h-4 flex-shrink-0" />
      <span>当前角色为「{{ roleStore.roleName }}」，签到操作仅限教练主管角色。如需操作请切换角色。</span>
    </div>

    <div class="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
      <button
        v-for="tab in ([['checkin', '课程签到'], ['history', '签到回看'], ['gap', '空档检测']] as const)"
        :key="tab[0]"
        @click="activeTab = tab[0]; tab[0] === 'history' && fetchHistory(); tab[0] === 'gap' && fetchGaps()"
        :class="['px-4 py-2 text-sm rounded-md font-medium transition-colors', activeTab === tab[0] ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-800']"
      >
        {{ tab[1] }}
      </button>
    </div>

    <div v-if="activeTab === 'checkin'" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">选择课程</label>
        <select v-model="selectedCourseId" class="input-field max-w-md">
          <option value="">请选择课程</option>
          <option v-for="c in availableCourses" :key="c.id" :value="c.id">
            {{ c.coachName }} - {{ c.date }} {{ c.startTime }}
          </option>
        </select>
        <p v-if="availableCourses.length === 0" class="text-xs text-amber-600 mt-1">
          当前无可签到课程，教练确认开课后课程才会进入可签到状态
        </p>
      </div>

      <div v-if="selectedCourseId" class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span class="text-sm text-slate-500">
            待签到学员（{{ studentCheckins.filter(s => s.status === 'pending').length }}）
          </span>
          <button
            v-if="isCoachSupervisor"
            @click="toggleAll"
            class="text-xs text-sky-600 hover:text-sky-700"
          >
            {{ selectedStudentIds.length === studentCheckins.filter(s => s.status === 'pending').length ? '取消全选' : '全选' }}
          </button>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="s in studentCheckins" :key="s.id" class="flex items-center gap-3 px-4 py-3">
            <input
              v-if="s.status === 'pending' && isCoachSupervisor"
              type="checkbox"
              :checked="selectedStudentIds.includes(s.studentId)"
              @change="toggleStudent(s.studentId)"
              class="rounded border-slate-300"
            />
            <CheckCircle v-else-if="s.status !== 'pending'" class="w-4 h-4 text-green-500" />
            <div v-else class="w-4 h-4 border-2 border-slate-300 rounded-sm opacity-50"></div>
            <span class="flex-1 text-sm">{{ s.studentName }}</span>
            <StatusBadge :status="s.status" type="checkin" />
            <span v-if="s.checkinAt" class="text-xs text-slate-400">{{ new Date(s.checkinAt).toLocaleString('zh-CN') }}</span>
          </div>
          <div v-if="studentCheckins.length === 0" class="px-4 py-8 text-center text-slate-400 text-sm">
            暂无学员，请先在教练排班页面为课程报名学员
          </div>
        </div>
        <div v-if="selectedStudentIds.length > 0 && isCoachSupervisor" class="px-4 py-3 border-t border-slate-100">
          <button @click="batchCheckin" class="btn-primary">
            <CheckCircle class="w-4 h-4 inline mr-1" />批量签到（{{ selectedStudentIds.length }}人）
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'history'" class="space-y-4">
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">日期</label>
          <input type="date" v-model="historyDate" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">课程</label>
          <select v-model="historyCourseId" class="input-field">
            <option value="">全部课程</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.coachName }} - {{ c.date }}</option>
          </select>
        </div>
        <button @click="fetchHistory" class="btn-primary flex items-center gap-1">
          <Search class="w-4 h-4" />查询
        </button>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-slate-600">学员</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600">课程</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600">签到时间</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in historyRecords" :key="r.id" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-4 py-3">
                {{ r.studentName }}
                <div v-if="r.equipmentName" class="text-xs text-slate-400 mt-0.5">
                  {{ r.equipmentCode }} {{ r.equipmentName }}
                </div>
              </td>
              <td class="px-4 py-3">{{ r.courseName || r.courseId }}</td>
              <td class="px-4 py-3">{{ r.checkinAt ? new Date(r.checkinAt).toLocaleString('zh-CN') : '-' }}</td>
              <td class="px-4 py-3">
                <StatusBadge :status="r.status" type="checkin" />
                <span v-if="r.rentalAbnormal" class="ml-1 inline-flex items-center gap-0.5 text-xs text-orange-600">
                  <AlertTriangle class="w-3 h-3" />{{ r.rentalAbnormal.type === 'wrong_person' ? '错拿' : '损坏' }}
                </span>
              </td>
            </tr>
            <tr v-if="historyRecords.length === 0">
              <td colspan="4" class="px-4 py-8 text-center text-slate-400">暂无记录</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'gap'" class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-500">检测课程之间的无人负责空档</span>
        <button @click="fetchGaps" :disabled="loading" class="btn-orange text-sm flex items-center gap-1">
          <Activity class="w-4 h-4" />检测空档
        </button>
      </div>

      <div v-if="loading" class="text-center py-8 text-slate-400 text-sm">
        正在检测空档...
      </div>

      <div v-else-if="gaps.length === 0" class="card p-8 text-center">
        <CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p class="text-base font-medium text-green-700">今日无空档，课程安排完整</p>
        <p class="text-sm text-slate-500 mt-1">所有课程之间均有人负责，未发现空档时段</p>
      </div>

      <div v-else class="space-y-3">
        <div class="flex items-center gap-2 text-sm text-orange-600 font-medium">
          <AlertTriangle class="w-4 h-4" />
          <span>检测到 {{ gaps.length }} 个空档时段</span>
        </div>
        <div v-for="(gap, index) in gaps" :key="index" class="card p-5 border-l-4 border-l-orange-400">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Clock class="w-5 h-5 text-orange-600" />
            </div>
            <div class="flex-1 space-y-3">
              <div>
                <span class="text-sm font-medium text-slate-700">空档时间：</span>
                <span class="text-sm text-orange-700 font-semibold">{{ gap.startTime }} - {{ gap.endTime }}</span>
              </div>
              <div v-if="gap.afterCourse" class="text-sm text-slate-600">
                <span class="text-slate-500">前序课程：</span>
                {{ gap.afterCourse.coachName }} · {{ gap.afterCourse.date }} {{ gap.afterCourse.startTime }}~{{ gap.afterCourse.endTime }}
              </div>
              <div v-else class="text-sm text-slate-400">前序课程：无（当日首节课前空档）</div>
              <div v-if="gap.beforeCourse" class="text-sm text-slate-600">
                <span class="text-slate-500">后续课程：</span>
                {{ gap.beforeCourse.coachName }} · {{ gap.beforeCourse.date }} {{ gap.beforeCourse.startTime }}~{{ gap.beforeCourse.endTime }}
              </div>
              <div v-else class="text-sm text-slate-400">后续课程：无（当日最后一节课后空档）</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
