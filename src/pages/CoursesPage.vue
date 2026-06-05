<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoleStore } from '@/stores/role'
import { useApi } from '@/composables/useApi'
import StatusBadge from '@/components/StatusBadge.vue'
import { Plus, CheckCircle, XCircle, UserCheck, Filter, Users, UserPlus } from 'lucide-vue-next'

const roleStore = useRoleStore()
const { get, post, patch } = useApi()

const isSupervisor = computed(() => roleStore.currentRole === 'coach_supervisor')

interface Course {
  id: string
  coachId: string
  coachName: string
  date: string
  startTime: string
  endTime: string
  maxStudents: number
  currentStudents: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  cancelReason?: string
  confirmedByCoachAt?: string
}

interface Coach {
  id: string
  name: string
  qualification: string
  status: 'on_duty' | 'off_duty' | 'on_course'
}

interface Student {
  id: string
  name: string
  level: string
}

const courses = ref<Course[]>([])
const coaches = ref<Coach[]>([])
const students = ref<Student[]>([])
const showCreateModal = ref(false)
const showCancelModal = ref(false)
const showEnrollModal = ref(false)
const selectedCourse = ref<Course | null>(null)
const cancelReason = ref('')
const enrollStudentIds = ref<string[]>([])
const toast = ref('')
const loading = ref(false)
const statusFilter = ref<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all')

const createForm = ref({
  coachId: '',
  date: new Date().toISOString().slice(0, 10),
  startTime: '09:00',
  endTime: '11:00',
  maxStudents: 10,
})

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

async function fetchData() {
  loading.value = true
  try {
    const [cRes, chRes, stRes] = await Promise.all([
      get<{ success: boolean; data: Course[] }>('/courses').catch(() => ({ success: true, data: [] })),
      get<{ success: boolean; data: Coach[] }>('/coaches').catch(() => ({ success: true, data: [] })),
      get<{ success: boolean; data: Student[] }>('/students').catch(() => ({ success: true, data: [] })),
    ])
    courses.value = cRes.data ?? []
    coaches.value = chRes.data ?? []
    students.value = stRes.data ?? []
  } finally {
    loading.value = false
  }
}

const filteredCourses = computed(() => {
  if (statusFilter.value === 'all') return courses.value
  return courses.value.filter(c => c.status === statusFilter.value)
})

const today = new Date().toISOString().slice(0, 10)

const coachesWithComputedStatus = computed(() => {
  const todayCourses = courses.value.filter(c => c.date === today)
  return coaches.value.map(coach => {
    const coachCourses = todayCourses.filter(c => c.coachId === coach.id)
    let status: Coach['status'] = 'off_duty'
    if (coachCourses.some(c => c.status === 'in_progress')) {
      status = 'on_course'
    } else if (coachCourses.length > 0) {
      status = 'on_duty'
    }
    return { ...coach, status }
  })
})

const coachStatusConfig: Record<string, { label: string; color: string }> = {
  on_duty: { label: '在岗', color: 'bg-green-100 text-green-700' },
  off_duty: { label: '休息', color: 'bg-slate-100 text-slate-600' },
  on_course: { label: '上课中', color: 'bg-blue-100 text-blue-700' },
}

async function createCourse() {
  try {
    await post('/courses', createForm.value)
    showCreateModal.value = false
    createForm.value = { coachId: '', date: new Date().toISOString().slice(0, 10), startTime: '09:00', endTime: '11:00', maxStudents: 10 }
    showToast('课程创建成功')
    await fetchData()
  } catch (e: any) {
    showToast(e.message || '创建失败')
  }
}

async function confirmAttendance(course: Course) {
  try {
    await post(`/courses/${course.id}/confirm`)
    showToast('教练确认到场')
    await fetchData()
  } catch (e: any) {
    showToast(e.message || '确认失败')
  }
}

async function completeCourse(course: Course) {
  try {
    await patch(`/courses/${course.id}`, { status: 'completed' })
    showToast('课程已结束，未签到学员已标记爽约')
    await fetchData()
  } catch (e: any) {
    showToast(e.message || '操作失败')
  }
}

function openCancelModal(course: Course) {
  selectedCourse.value = course
  cancelReason.value = ''
  showCancelModal.value = true
}

async function submitCancel() {
  if (!selectedCourse.value || !cancelReason.value) return
  try {
    await patch(`/courses/${selectedCourse.value.id}`, { status: 'cancelled', cancelReason: cancelReason.value })
    showCancelModal.value = false
    showToast('课程已取消')
    await fetchData()
  } catch (e: any) {
    showToast(e.message || '取消失败')
  }
}

function openEnrollModal(course: Course) {
  selectedCourse.value = course
  enrollStudentIds.value = []
  showEnrollModal.value = true
}

function toggleEnrollStudent(id: string) {
  const idx = enrollStudentIds.value.indexOf(id)
  if (idx >= 0) enrollStudentIds.value.splice(idx, 1)
  else enrollStudentIds.value.push(id)
}

async function submitEnroll() {
  if (!selectedCourse.value || enrollStudentIds.value.length === 0) return
  try {
    await post(`/courses/${selectedCourse.value.id}/enroll`, { studentIds: enrollStudentIds.value })
    showEnrollModal.value = false
    showToast(`成功报名 ${enrollStudentIds.value.length} 名学员`)
    await fetchData()
  } catch (e: any) {
    showToast(e.message || '报名失败')
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="space-y-6">
    <div v-if="toast" class="fixed top-4 right-4 z-50 bg-sky-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      {{ toast }}
    </div>

    <div v-if="!isSupervisor" class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
      <Users class="w-4 h-4" />
      当前以{{ roleStore.roleName }}角色查看，操作权限受限
    </div>

    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">课程列表</h3>
      <button v-if="isSupervisor" @click="showCreateModal = true" class="btn-primary flex items-center gap-1">
        <Plus class="w-4 h-4" />创建课程
      </button>
    </div>

    <div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
        <Filter class="w-4 h-4 text-slate-400" />
        <select v-model="statusFilter" class="input-field text-sm py-1 w-auto">
          <option value="all">全部状态</option>
          <option value="pending">待开始</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已结束</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-slate-600">教练</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">日期</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">时间</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">学员数/上限</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">状态</th>
            <th class="text-right px-4 py-3 font-medium text-slate-600">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in filteredCourses" :key="course.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="px-4 py-3">{{ course.coachName }}</td>
            <td class="px-4 py-3">{{ course.date }}</td>
            <td class="px-4 py-3">{{ course.startTime }} - {{ course.endTime }}</td>
            <td class="px-4 py-3">{{ course.currentStudents }}/{{ course.maxStudents }}</td>
            <td class="px-4 py-3"><StatusBadge :status="course.status" type="course" /></td>
            <td class="px-4 py-3 text-right space-x-2">
              <template v-if="isSupervisor">
                <button v-if="course.status === 'pending' || course.status === 'in_progress'" @click="openEnrollModal(course)" class="btn-secondary text-xs px-3 py-1">
                  <UserPlus class="w-3 h-3 inline mr-1" />报名
                </button>
                <button v-if="course.status === 'pending'" @click="confirmAttendance(course)" class="btn-primary text-xs px-3 py-1">
                  <UserCheck class="w-3 h-3 inline mr-1" />确认到场
                </button>
                <button v-if="course.status === 'in_progress'" @click="completeCourse(course)" class="btn-primary text-xs px-3 py-1">
                  <CheckCircle class="w-3 h-3 inline mr-1" />结束课程
                </button>
                <button v-if="course.status === 'pending' || course.status === 'in_progress'" @click="openCancelModal(course)" class="btn-danger text-xs px-3 py-1">
                  <XCircle class="w-3 h-3 inline mr-1" />取消
                </button>
              </template>
              <span v-else class="text-slate-400 text-xs">—</span>
            </td>
          </tr>
          <tr v-if="filteredCourses.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">暂无课程</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h3 class="text-lg font-semibold mb-3">教练列表</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="coach in coachesWithComputedStatus" :key="coach.id" class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
              {{ coach.name.charAt(0) }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">{{ coach.name }}</div>
              <div class="text-xs text-slate-400">{{ coach.qualification }}</div>
            </div>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', coachStatusConfig[coach.status]?.color || 'bg-slate-100 text-slate-600']">
              {{ coachStatusConfig[coach.status]?.label || coach.status }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="coachesWithComputedStatus.length === 0" class="text-center text-slate-400 py-8">
        暂无教练
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold mb-4">创建课程</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">选择教练</label>
            <select v-model="createForm.coachId" class="input-field">
              <option value="">请选择教练</option>
              <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }} - {{ c.qualification }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">日期</label>
              <input type="date" v-model="createForm.date" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">学员上限</label>
              <input type="number" v-model.number="createForm.maxStudents" min="1" class="input-field" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">开始时间</label>
              <input type="time" v-model="createForm.startTime" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">结束时间</label>
              <input type="time" v-model="createForm.endTime" class="input-field" />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showCreateModal = false" class="btn-secondary">取消</button>
          <button @click="createCourse" :disabled="!createForm.coachId" class="btn-primary">创建</button>
        </div>
      </div>
    </div>

    <div v-if="showEnrollModal" class="modal-overlay" @click.self="showEnrollModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold mb-2">课程报名</h3>
        <p class="text-sm text-slate-500 mb-4">
          {{ selectedCourse?.coachName }} · {{ selectedCourse?.date }} {{ selectedCourse?.startTime }}-{{ selectedCourse?.endTime }}
          · 已报名 {{ selectedCourse?.currentStudents }}/{{ selectedCourse?.maxStudents }}
        </p>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <label
            v-for="s in students"
            :key="s.id"
            class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <input
              type="checkbox"
              :checked="enrollStudentIds.includes(s.id)"
              @change="toggleEnrollStudent(s.id)"
              class="rounded border-slate-300"
            />
            <span class="text-sm">{{ s.name }}</span>
            <span class="text-xs text-slate-400 ml-auto">{{ s.level }}</span>
          </label>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showEnrollModal = false" class="btn-secondary">取消</button>
          <button @click="submitEnroll" :disabled="enrollStudentIds.length === 0" class="btn-primary">
            确认报名（{{ enrollStudentIds.length }}人）
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold mb-4">取消课程</h3>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">取消原因</label>
          <textarea v-model="cancelReason" class="input-field" rows="3" placeholder="请输入取消原因" />
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showCancelModal = false" class="btn-secondary">返回</button>
          <button @click="submitCancel" :disabled="!cancelReason" class="btn-danger">确认取消</button>
        </div>
      </div>
    </div>
  </div>
</template>
