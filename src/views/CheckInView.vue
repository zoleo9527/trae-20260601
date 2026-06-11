<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import {
  MapPin, CheckCircle, Cloud, Users, ClipboardList, AlertTriangle,
  Plus, Send, Clock, Map, FileText, Camera, X, ChevronDown, ChevronRight,
  Building2, UserCheck, Box, Zap, Flame
} from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiPhoto from '@/components/ui/UiPhoto.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiModal from '@/components/ui/UiModal.vue'
import type { CheckIn, CablePoint, Shortage, TestResult, ShortagePriority } from '@shared/types'

const router = useRouter()
const store = useDataStore()

type TabKey = 'checkin' | 'points' | 'shortage'
const activeTab = ref<TabKey>('checkin')
const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: 'checkin', label: '签到打卡', icon: UserCheck },
  { key: 'points', label: '点位记录', icon: MapPin },
  { key: 'shortage', label: '缺料上报', icon: AlertTriangle }
]

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  const el = document.createElement('div')
  el.className = `fixed top-6 right-6 z-[9999] px-5 py-3 rounded-[4px] shadow-lg text-sm font-medium flex items-center gap-2 ${
    type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
  }`
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><${type === 'success' ? 'polyline points="20 6 9 17 4 12"' : 'line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"'}/></svg><span>${msg}</span>`
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transition = 'opacity 0.3s'
    setTimeout(() => el.remove(), 300)
  }, 2400)
}

const projectOptions = computed(() => store.projects.map(p => ({ value: p.id, label: p.name })))
const teamOptions = computed(() => store.teams.map(t => ({ value: t.id, label: t.name })))
const cableOptions = computed(() => store.cables.map(c => ({ value: c.id, label: `${c.model} - ${c.name}` })))
const weatherOptions = [
  { value: '晴', label: '☀️ 晴' }, { value: '多云', label: '⛅ 多云' },
  { value: '阴', label: '☁️ 阴' }, { value: '小雨', label: '🌧️ 小雨' },
  { value: '中雨', label: '🌧️ 中雨' }, { value: '雷阵雨', label: '⛈️ 雷阵雨' }
]
const testResultOptions = [
  { value: 'pass', label: '✓ 通过' }, { value: 'fail', label: '✗ 未通过' }, { value: 'pending', label: '⏳ 待复测' }
]
const priorityOptions: { value: ShortagePriority; label: string; icon: any; color: string }[] = [
  { value: 'normal', label: '普通', icon: Box, color: 'gray' },
  { value: 'urgent', label: '紧急', icon: Zap, color: 'orange' },
  { value: 'critical', label: '特急', icon: Flame, color: 'red' }
]

function getTeamMembers(teamId: string): string[] {
  return store.teams.find(t => t.id === teamId)?.members || []
}

// ============== Tab 1: 签到打卡 ==============
const checkinForm = reactive({
  projectId: '',
  teamId: '',
  weather: '晴',
  selectedWorkers: [] as string[]
})
const isCheckedIn = ref(false)
const rippleActive = ref(false)
const submittingCheckin = ref(false)

const mockLocation = reactive({
  address: '张江博云路2号A栋',
  lat: 31.2099,
  lng: 121.5978
})
const todayCheckins = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return store.checkins.filter(c => c.checkInTime.startsWith(today))
})
const currentTeam = computed(() => store.teams.find(t => t.id === checkinForm.teamId))

async function doCheckIn() {
  if (!checkinForm.projectId || !checkinForm.teamId || checkinForm.selectedWorkers.length === 0) {
    showToast('请选择项目、班组并勾选到场工人', 'error')
    return
  }
  submittingCheckin.value = true
  rippleActive.value = true
  setTimeout(() => { rippleActive.value = false }, 800)
  try {
    await store.createCheckin({
      projectId: checkinForm.projectId,
      teamId: checkinForm.teamId,
      checkInTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      location: { ...mockLocation },
      workers: [...checkinForm.selectedWorkers],
      weather: checkinForm.weather
    })
    isCheckedIn.value = true
    showToast('签到成功！已记录到场信息')
  } catch {
    showToast('签到失败，请重试', 'error')
  } finally {
    submittingCheckin.value = false
  }
}

async function doCheckOut(id: string) {
  try {
    const c = store.checkins.find(x => x.id === id)
    if (c) {
      c.checkOutTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
    }
    showToast('签退成功')
  } catch {
    showToast('签退失败', 'error')
  }
}

function toggleWorker(name: string) {
  const i = checkinForm.selectedWorkers.indexOf(name)
  if (i >= 0) checkinForm.selectedWorkers.splice(i, 1)
  else checkinForm.selectedWorkers.push(name)
}

// ============== Tab 2: 点位记录 ==============
const pointFilter = reactive({
  requisitionId: '',
  checkInId: '',
  projectId: ''
})
const pointForm = reactive({
  pointCode: '',
  cableId: '',
  usedMeters: 0,
  startPoint: '',
  endPoint: '',
  tester: '',
  testResult: 'pass' as TestResult,
  photos: [] as string[],
  remark: ''
})
const submittingPoint = ref(false)
const expandedRowId = ref<string | null>(null)

const requisitionOptions = computed(() =>
  [{ value: '', label: '请选择关联领料单（必填）' },
    ...store.requisitions.map(r => ({ value: r.id, label: `${r.code} - ${store.projectName(r.projectId)}` }))]
)
const checkinOptions = computed(() =>
  [{ value: '', label: '请选择打卡记录' },
    ...store.checkins.map(c => ({
      value: c.id,
      label: `${c.checkInTime.slice(5, 16)} - ${store.teamName(c.teamId)} - ${c.workers.length}人`
    }))]
)
const selectedCable = computed(() => store.cables.find(c => c.id === pointForm.cableId))
const sortedPoints = computed(() => [...store.points].sort((a, b) => b.createTime.localeCompare(a.createTime)))
const filteredPoints = computed(() => {
  return sortedPoints.value.filter(p => {
    if (pointFilter.requisitionId && p.requisitionId !== pointFilter.requisitionId) return false
    if (pointFilter.checkInId && p.checkInId !== pointFilter.checkInId) return false
    if (pointFilter.projectId && p.projectId !== pointFilter.projectId) return false
    return true
  })
})
const pointCodeError = computed(() => {
  if (!pointForm.pointCode) return ''
  return /^[A-Z]-\d{2}-\d{3}$/.test(pointForm.pointCode) ? '' : '格式错误，如 A-01-001'
})

function handlePointPhotoUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  if (pointForm.photos.length + input.files.length > 6) {
    showToast('最多上传6张照片', 'error')
    return
  }
  Array.from(input.files).forEach(f => {
    const reader = new FileReader()
    reader.onload = () => { pointForm.photos.push(reader.result as string) }
    reader.readAsDataURL(f)
  })
  input.value = ''
}
function removePointPhoto(idx: number) { pointForm.photos.splice(idx, 1) }

async function submitPoint() {
  if (!pointFilter.requisitionId) { showToast('请选择关联领料单', 'error'); return }
  if (pointCodeError.value) { showToast('点位编号格式错误', 'error'); return }
  if (!pointForm.cableId || pointForm.usedMeters <= 0) { showToast('请选择线缆并填写使用米数', 'error'); return }
  if (!pointForm.startPoint || !pointForm.endPoint) { showToast('请填写起止端位置', 'error'); return }
  if (!pointForm.tester) { showToast('请填写测试人', 'error'); return }
  submittingPoint.value = true
  try {
    const req = store.requisitions.find(r => r.id === pointFilter.requisitionId)
    const cable = store.cables.find(c => c.id === pointForm.cableId)!
    await store.createPoint({
      checkInId: pointFilter.checkInId || store.checkins[0]?.id || '',
      requisitionId: pointFilter.requisitionId,
      projectId: req?.projectId || pointFilter.projectId || store.projects[0]?.id || '',
      pointCode: pointForm.pointCode,
      cableId: pointForm.cableId,
      cableModel: cable.model,
      usedMeters: pointForm.usedMeters,
      startPoint: pointForm.startPoint,
      endPoint: pointForm.endPoint,
      photos: [...pointForm.photos],
      tester: pointForm.tester,
      testResult: pointForm.testResult,
      remark: pointForm.remark,
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    })
    showToast('点位记录已提交')
    pointForm.pointCode = ''; pointForm.cableId = ''; pointForm.usedMeters = 0
    pointForm.startPoint = ''; pointForm.endPoint = ''; pointForm.tester = ''
    pointForm.testResult = 'pass'; pointForm.photos = []; pointForm.remark = ''
  } catch {
    showToast('提交失败，请重试', 'error')
  } finally {
    submittingPoint.value = false
  }
}

function testBadge(r: TestResult) {
  if (r === 'pass') return { variant: 'green' as const, label: '通过' }
  if (r === 'fail') return { variant: 'red' as const, label: '未通过' }
  return { variant: 'orange' as const, label: '待复测' }
}

const viewerModalOpen = ref(false)
const viewerPhotos = ref<string[]>([])
function openPhotoViewer(photos: string[]) {
  viewerPhotos.value = photos
  viewerModalOpen.value = true
}

// ============== Tab 3: 缺料上报 ==============
const shortageForm = reactive({
  projectId: '',
  checkInId: '',
  cableId: '',
  shortageQty: 0,
  priority: 'normal' as ShortagePriority,
  photos: [] as string[],
  reporter: '',
  remark: ''
})
const submittingShortage = ref(false)

const shortageCable = computed(() => store.cables.find(c => c.id === shortageForm.cableId))
const shortageCanSubmit = computed(() => {
  return shortageForm.projectId && shortageForm.cableId && shortageForm.shortageQty > 0
    && shortageForm.photos.length >= 1 && shortageForm.reporter && shortageForm.remark.trim()
})

function handleShortagePhotoUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  Array.from(input.files).forEach(f => {
    const reader = new FileReader()
    reader.onload = () => { shortageForm.photos.push(reader.result as string) }
    reader.readAsDataURL(f)
  })
  input.value = ''
}
function removeShortagePhoto(idx: number) { shortageForm.photos.splice(idx, 1) }

async function submitShortage() {
  if (!shortageCanSubmit.value) { showToast('请完整填写所有必填项并至少上传1张照片', 'error'); return }
  submittingShortage.value = true
  try {
    const cable = store.cables.find(c => c.id === shortageForm.cableId)!
    const code = `QL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100)}`
    await store.createShortage({
      code,
      projectId: shortageForm.projectId,
      checkInId: shortageForm.checkInId,
      cableId: shortageForm.cableId,
      cableModel: cable.model,
      shortageQty: shortageForm.shortageQty,
      priority: shortageForm.priority,
      photos: [...shortageForm.photos],
      reporter: shortageForm.reporter,
      reportTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'reported',
      remark: shortageForm.remark
    })
    showToast('缺料已上报，请等待仓库响应')
    shortageForm.cableId = ''; shortageForm.shortageQty = 0; shortageForm.priority = 'normal'
    shortageForm.photos = []; shortageForm.remark = ''
  } catch {
    showToast('上报失败，请重试', 'error')
  } finally {
    submittingShortage.value = false
  }
}

const sortedShortages = computed(() => {
  const order: Record<ShortagePriority, number> = { critical: 0, urgent: 1, normal: 2 }
  return [...store.shortages].sort((a, b) => {
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority]
    return b.reportTime.localeCompare(a.reportTime)
  })
})

function priorityBadge(p: ShortagePriority) {
  if (p === 'critical') return { variant: 'red' as const, label: '特急' }
  if (p === 'urgent') return { variant: 'orange' as const, label: '紧急' }
  return { variant: 'default' as const, label: '普通' }
}
function statusBadge(s: Shortage['status']) {
  if (s === 'reported') return { variant: 'blue' as const, label: '已上报' }
  if (s === 'approved') return { variant: 'teal' as const, label: '已批准' }
  if (s === 'supplied') return { variant: 'green' as const, label: '已补供' }
  return { variant: 'default' as const, label: '已关闭' }
}

function goSupplement(s: Shortage) {
  router.push({ path: '/requisitions/new', query: { shortageId: s.id, projectId: s.projectId } })
}

function isHighlighted(code: string) {
  return code === 'QL-20260603-001'
}

onMounted(() => {
  if (store.cables.length === 0) store.loadAll()
})
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <ClipboardList class="w-7 h-7 text-[#1E40AF]" />
          现场打卡管理
        </h1>
        <p class="text-sm text-gray-500 mt-1 ml-9.5">签到打卡 · 点位布线记录 · 缺料紧急上报</p>
      </div>
      <div class="text-xs text-gray-400 flex items-center gap-1.5">
        <Clock class="w-3.5 h-3.5" />
        {{ new Date().toLocaleString('zh-CN') }}
      </div>
    </div>

    <div class="flex gap-5">
      <!-- 竖向 Tab -->
      <nav class="w-48 shrink-0 bg-white rounded-[4px] border border-gray-200 overflow-hidden h-fit sticky top-4">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="activeTab = t.key"
          class="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all border-l-4 text-left"
          :class="activeTab === t.key
            ? 'bg-blue-50/60 border-[#1E40AF] text-[#1E40AF]'
            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
        >
          <component :is="t.icon" class="w-4.5 h-4.5" />
          {{ t.label }}
        </button>
      </nav>

      <!-- 内容区 -->
      <div class="flex-1 min-w-0">
        <!-- ============== Tab 1: 签到打卡 ============== -->
        <div v-show="activeTab === 'checkin'" class="space-y-5">
          <UiCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-semibold text-gray-900 flex items-center gap-2">
                  <UserCheck class="w-5 h-5 text-[#1E40AF]" />
                  今日到场签到
                </h2>
                <UiBadge variant="blue" size="sm">{{ todayCheckins.length }} 条签到记录</UiBadge>
              </div>
            </template>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <!-- 顶部表单 -->
              <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <UiInput v-model="checkinForm.projectId" type="select" label="所属项目"
                  placeholder="请选择项目" :options="projectOptions" required />
                <UiInput v-model="checkinForm.teamId" type="select" label="施工班组"
                  placeholder="请选择班组" :options="teamOptions" required />
                <UiInput v-model="checkinForm.weather" type="select" label="今日天气"
                  :options="weatherOptions" />
              </div>

              <!-- 工人勾选 -->
              <div class="lg:col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Users class="w-3.5 h-3.5 text-gray-400" />
                  到场工人
                  <span class="text-red-500">*</span>
                  <span v-if="currentTeam" class="ml-auto text-xs text-gray-400">
                    已选 {{ checkinForm.selectedWorkers.length }}/{{ currentTeam.members.length }}
                  </span>
                </label>
                <div class="border border-gray-200 rounded-[4px] p-3 bg-gray-50/50 max-h-[260px] overflow-y-auto">
                  <template v-if="currentTeam && currentTeam.members.length">
                    <label v-for="name in currentTeam.members" :key="name"
                      class="flex items-center gap-2.5 py-2 px-2 rounded-[4px] cursor-pointer hover:bg-white transition-colors"
                    >
                      <input type="checkbox" :checked="checkinForm.selectedWorkers.includes(name)"
                        class="w-4 h-4 text-[#1E40AF] rounded border-gray-300 focus:ring-[#1E40AF]"
                        @change="toggleWorker(name)" />
                      <span class="text-sm text-gray-700">{{ name }}</span>
                      <span v-if="name === currentTeam.leader"
                        class="ml-auto text-[10px] px-1.5 py-0.5 bg-blue-100 text-[#1E40AF] rounded-[2px] font-medium">
                        班长
                      </span>
                    </label>
                  </template>
                  <p v-else class="text-xs text-gray-400 py-4 text-center">请先选择班组</p>
                </div>
              </div>

              <!-- 打卡按钮 -->
              <div class="lg:col-span-1 flex flex-col items-center justify-center py-4">
                <button
                  @click="doCheckIn"
                  :disabled="isCheckedIn || submittingCheckin"
                  class="relative w-[180px] h-[180px] rounded-full flex flex-col items-center justify-center gap-2 text-white shadow-2xl transition-all duration-300 disabled:cursor-not-allowed"
                  :class="isCheckedIn
                    ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                    : 'bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#10B981] hover:shadow-[0_0_40px_rgba(30,64,175,0.4)] active:scale-95'"
                >
                  <span v-if="rippleActive" class="absolute inset-0 rounded-full animate-ping bg-white/30" />
                  <MapPin class="w-14 h-14 shrink-0" />
                  <span class="text-lg font-bold">{{ isCheckedIn ? '已签到' : '点击签到' }}</span>
                  <span v-if="isCheckedIn" class="text-xs opacity-90">
                    {{ store.checkins[0]?.checkInTime.slice(11, 16) }}
                  </span>
                </button>
                <p v-if="isCheckedIn" class="mt-3 text-sm text-green-600 flex items-center gap-1.5 font-medium">
                  <CheckCircle class="w-4 h-4" /> 今日已完成签到
                </p>
                <!-- 模拟定位 -->
                <div class="mt-4 w-full border border-gray-200 rounded-[4px] p-3 bg-white">
                  <div class="flex items-start gap-2.5">
                    <Map class="w-4 h-4 text-[#1E40AF] shrink-0 mt-0.5" />
                    <div class="min-w-0">
                      <div class="text-sm font-medium text-gray-800 truncate">{{ mockLocation.address }}</div>
                      <div class="text-[11px] text-gray-400 font-mono mt-0.5">
                        lat: {{ mockLocation.lat.toFixed(4) }}, lng: {{ mockLocation.lng.toFixed(4) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 天气/备注 -->
              <div class="lg:col-span-1">
                <div class="border border-gray-200 rounded-[4px] p-4 bg-gradient-to-br from-blue-50 to-white h-full">
                  <div class="flex items-center gap-2 mb-3">
                    <Cloud class="w-5 h-5 text-[#1E40AF]" />
                    <span class="text-sm font-semibold text-gray-700">施工环境</span>
                  </div>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-500">天气状况</span>
                      <span class="font-medium text-gray-800">{{ checkinForm.weather }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">到场人数</span>
                      <span class="font-medium text-[#1E40AF]">{{ checkinForm.selectedWorkers.length }} 人</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">所在项目</span>
                      <span class="font-medium text-gray-800 truncate max-w-[140px]" :title="store.projectName(checkinForm.projectId)">
                        {{ store.projectName(checkinForm.projectId) || '未选' }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">施工班组</span>
                      <span class="font-medium text-gray-800">{{ store.teamName(checkinForm.teamId) || '未选' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UiCard>

          <!-- 签到历史 -->
          <UiCard>
            <template #header>
              <h2 class="font-semibold text-gray-900 flex items-center gap-2">
                <FileText class="w-5 h-5 text-[#1E40AF]" />
                今日签到历史
              </h2>
            </template>
            <UiTable :data="todayCheckins">
              <template #headers>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">时间</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">班组</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">人数</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">签到地址</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">天气</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">状态</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">操作</th>
              </template>
              <template #row="{ item }: { item: CheckIn }">
                <td class="px-4 py-3 text-sm font-mono-num text-gray-700 whitespace-nowrap">{{ item.checkInTime.slice(11, 19) }}</td>
                <td class="px-4 py-3 text-sm text-gray-800 font-medium">{{ store.teamName(item.teamId) }}</td>
                <td class="px-4 py-3 text-sm">
                  <UiBadge variant="blue" size="sm">{{ item.workers.length }} 人</UiBadge>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{{ item.location.address }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.weather || '—' }}</td>
                <td class="px-4 py-3 text-sm">
                  <UiBadge v-if="item.checkOutTime" variant="default" size="sm">已签退</UiBadge>
                  <UiBadge v-else variant="green" size="sm">工作中</UiBadge>
                </td>
                <td class="px-4 py-3 text-center">
                  <UiButton v-if="!item.checkOutTime" size="sm" variant="secondary" @click="doCheckOut(item.id)">
                    签退
                  </UiButton>
                  <span v-else class="text-xs text-gray-400 font-mono-num">{{ item.checkOutTime.slice(11, 19) }}</span>
                </td>
              </template>
            </UiTable>
          </UiCard>
        </div>

        <!-- ============== Tab 2: 点位记录 ============== -->
        <div v-show="activeTab === 'points'" class="space-y-5">
          <UiCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin class="w-5 h-5 text-[#1E40AF]" />
                  新增点位记录
                </h2>
                <UiBadge variant="blue" size="sm">按施工顺序记录</UiBadge>
              </div>
            </template>

            <!-- 筛选 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 pb-5 border-b border-gray-200">
              <UiInput v-model="pointFilter.requisitionId" type="select" label="关联领料单"
                :options="requisitionOptions" required />
              <UiInput v-model="pointFilter.checkInId" type="select" label="打卡记录"
                :options="checkinOptions" placeholder="请选择打卡记录" />
              <UiInput v-model="pointFilter.projectId" type="select" label="所属项目"
                :options="projectOptions" placeholder="请选择项目" />
            </div>

            <!-- 表单 Fieldset 1 -->
            <fieldset class="border-2 border-gray-300 rounded-[6px] p-5 bg-white relative mb-5">
              <legend class="px-3 text-sm font-semibold text-gray-700 bg-[#FAFAFA] mx-1 flex items-center gap-1.5">
                <Box class="w-4 h-4 text-[#1E40AF]" />
                点位与线缆信息
              </legend>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <UiInput v-model="pointForm.pointCode" type="text" label="点位编号"
                  placeholder="如 A-01-001" required :error="pointCodeError" />
                <div>
                  <UiInput v-model="pointForm.cableId" type="select" label="线缆型号"
                    :options="cableOptions" placeholder="请选择线缆型号" required />
                  <p v-if="selectedCable" class="mt-1.5 text-xs text-gray-500">
                    库存: <span class="font-semibold text-[#1E40AF]">{{ selectedCable.stock }}</span>{{ selectedCable.name.includes('米') ? ' 米' : ' 卷' }}
                    <span v-if="selectedCable.spec" class="ml-2 text-gray-400">规格：{{ selectedCable.spec }}</span>
                  </p>
                </div>
                <UiInput v-model="pointForm.usedMeters" type="number" label="使用米数"
                  placeholder="请输入使用米数" :required="true" />
              </div>
            </fieldset>

            <!-- 表单 Fieldset 2 -->
            <fieldset class="border-2 border-gray-300 rounded-[6px] p-5 bg-white relative mb-5">
              <legend class="px-3 text-sm font-semibold text-gray-700 bg-[#FAFAFA] mx-1 flex items-center gap-1.5">
                <MapPin class="w-4 h-4 text-[#1E40AF]" />
                布线路由与测试
              </legend>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <UiInput v-model="pointForm.startPoint" type="text" label="起始端位置"
                  placeholder="如 4FD-MDF-01" required />
                <UiInput v-model="pointForm.endPoint" type="text" label="终止端位置"
                  placeholder="如 4F-办公区-R32" required />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UiInput v-model="pointForm.tester" type="text" label="测试人"
                  placeholder="请输入测试人姓名" required />
                <UiInput :model-value="pointForm.testResult" type="select" label="测试结果"
                  :options="testResultOptions" required
                  @update:model-value="(v) => pointForm.testResult = String(v) as TestResult" />
              </div>
            </fieldset>

            <!-- 照片 + 备注 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Camera class="w-3.5 h-3.5 text-gray-400" />
                  现场照片
                  <span class="text-xs text-gray-400 font-normal">（最多6张）</span>
                </label>
                <div class="grid grid-cols-3 md:grid-cols-6 gap-2">
                  <div v-for="(p, i) in pointForm.photos" :key="i"
                    class="relative aspect-square rounded-[4px] overflow-hidden border border-gray-200 group">
                    <img :src="p" class="w-full h-full object-cover" />
                    <button @click="removePointPhoto(i)"
                      class="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <X class="w-3 h-3" />
                    </button>
                  </div>
                  <label v-if="pointForm.photos.length < 6"
                    class="aspect-square rounded-[4px] border-2 border-dashed border-gray-300 hover:border-[#1E40AF] hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all bg-gray-50">
                    <Plus class="w-5 h-5 text-gray-400" />
                    <span class="text-[10px] text-gray-500">上传</span>
                    <input type="file" accept="image/*" multiple class="hidden" @change="handlePointPhotoUpload" />
                  </label>
                </div>
              </div>
              <UiInput v-model="pointForm.remark" type="textarea" label="备注说明"
                placeholder="路由说明、现场情况、特殊要求等（选填）" :rows="5" />
            </div>

            <div class="flex justify-end">
              <UiButton size="lg" type="button" :loading="submittingPoint" @click="submitPoint">
                <template #icon><Plus class="w-4 h-4" /></template>
                提交点位记录
              </UiButton>
            </div>
          </UiCard>

          <!-- 点位列表 -->
          <UiCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText class="w-5 h-5 text-[#1E40AF]" />
                  点位记录列表
                </h2>
                <UiBadge variant="blue" size="sm">共 {{ filteredPoints.length }} 条</UiBadge>
              </div>
            </template>
            <UiTable :data="filteredPoints">
              <template #headers>
                <th class="w-8 px-2 py-3" />
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">点位编号</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">关联领料单</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">线缆/米数</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">起止端</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">测试结果</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">照片</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">测试人/时间</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">备注</th>
              </template>
              <template #row="{ item, index }: { item: CablePoint; index: number }">
                <td class="w-8 px-2 py-3">
                  <button @click="expandedRowId = expandedRowId === item.id ? null : item.id"
                    class="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                    <ChevronDown v-if="expandedRowId === item.id" class="w-4 h-4" />
                    <ChevronRight v-else class="w-4 h-4" />
                  </button>
                </td>
                <td class="px-4 py-3 text-sm font-mono-num font-semibold text-[#1E40AF]">{{ item.pointCode }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 font-mono-num">
                  {{ store.requisitions.find(r => r.id === item.requisitionId)?.code || '—' }}
                </td>
                <td class="px-4 py-3 text-sm">
                  <div class="font-medium text-gray-800">{{ item.cableModel }}</div>
                  <div class="text-xs text-gray-500">{{ item.usedMeters }} m</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  <div class="font-mono-num">{{ item.startPoint }}</div>
                  <div class="text-gray-300">→</div>
                  <div class="font-mono-num">{{ item.endPoint }}</div>
                </td>
                <td class="px-4 py-3 text-sm">
                  <UiBadge :variant="testBadge(item.testResult).variant" size="sm">
                    {{ testBadge(item.testResult).label }}
                  </UiBadge>
                </td>
                <td class="px-4 py-3">
                  <div v-if="item.photos.length > 0" class="relative w-12 h-12 rounded-[4px] overflow-hidden border border-gray-200 cursor-pointer group"
                    @click="openPhotoViewer(item.photos)">
                    <img :src="item.photos[0]" class="w-full h-full object-cover" />
                    <div v-if="item.photos.length > 1"
                      class="absolute -top-1 -right-1 bg-[#1E40AF] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                      {{ item.photos.length }}
                    </div>
                  </div>
                  <span v-else class="text-xs text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-sm">
                  <div class="font-medium text-gray-800">{{ item.tester }}</div>
                  <div class="text-xs text-gray-400 font-mono-num">{{ item.createTime.slice(5, 16) }}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate" :title="item.remark">
                  {{ item.remark || '—' }}
                </td>
              </template>
            </UiTable>
            <!-- 展开行 -->
            <div v-for="(item, i) in filteredPoints" :key="item.id + '-exp'"
              v-show="expandedRowId === item.id"
              class="px-4 py-4 bg-blue-50/30 border-t border-b border-blue-100 -mt-px">
              <div v-if="item.photos.length > 0" class="max-w-xl">
                <div class="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <Camera class="w-3.5 h-3.5" /> 完整现场照片（{{ item.photos.length }}张）
                </div>
                <UiPhoto :src="item.photos" />
              </div>
              <p v-else class="text-xs text-gray-400">暂无照片</p>
            </div>
          </UiCard>
        </div>

        <!-- ============== Tab 3: 缺料上报 ============== -->
        <div v-show="activeTab === 'shortage'" class="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <!-- 左侧表单 -->
          <div class="lg:col-span-3 space-y-5">
            <UiCard>
              <template #header>
                <h2 class="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle class="w-5 h-5 text-orange-500" />
                  缺料上报
                </h2>
              </template>
              <div
                class="rounded-[4px] p-5 transition-all duration-500"
                :class="shortageForm.priority === 'critical'
                  ? 'border-2 border-red-400 bg-red-50/40 animate-pulse-slow'
                  : 'border-2 border-transparent bg-white'"
              >
                <fieldset class="border-2 border-gray-300 rounded-[6px] p-5 bg-white relative mb-5">
                  <legend class="px-3 text-sm font-semibold text-gray-700 bg-[#FAFAFA] mx-1 flex items-center gap-1.5">
                    <Building2 class="w-4 h-4 text-[#1E40AF]" />
                    基础信息
                  </legend>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UiInput v-model="shortageForm.projectId" type="select" label="所属项目"
                      :options="projectOptions" placeholder="请选择项目" required />
                    <UiInput v-model="shortageForm.checkInId" type="select" label="关联打卡记录"
                      :options="checkinOptions" placeholder="请选择打卡记录（可选）" />
                  </div>
                </fieldset>

                <fieldset class="border-2 border-gray-300 rounded-[6px] p-5 bg-white relative mb-5">
                  <legend class="px-3 text-sm font-semibold text-gray-700 bg-[#FAFAFA] mx-1 flex items-center gap-1.5">
                    <Box class="w-4 h-4 text-[#1E40AF]" />
                    缺料详情
                  </legend>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div>
                      <UiInput v-model="shortageForm.cableId" type="select" label="线缆型号"
                        :options="cableOptions" placeholder="请选择线缆型号" required />
                      <p v-if="shortageCable" class="mt-1.5 text-xs text-gray-500">
                        当前库存: <span class="font-semibold text-red-600">{{ shortageCable.stock }}</span>
                        {{ shortageCable.name.includes('米') ? ' 米' : ' 卷' }}
                      </p>
                    </div>
                    <UiInput v-model="shortageForm.shortageQty" type="number" label="缺料数量"
                      placeholder="请输入缺料数量" :required="true" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      紧急程度 <span class="text-red-500">*</span>
                    </label>
                    <div class="grid grid-cols-3 gap-3">
                      <label v-for="opt in priorityOptions" :key="opt.value"
                        class="flex items-center gap-2.5 p-3 border-2 rounded-[4px] cursor-pointer transition-all"
                        :class="shortageForm.priority === opt.value
                          ? opt.color === 'red'
                            ? 'border-red-500 bg-red-50/60'
                            : opt.color === 'orange'
                              ? 'border-orange-500 bg-orange-50/60'
                              : 'border-gray-500 bg-gray-50/60'
                          : 'border-gray-200 hover:border-gray-300 bg-white'"
                      >
                        <input type="radio" v-model="shortageForm.priority" :value="opt.value" class="sr-only" />
                        <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                          :class="shortageForm.priority === opt.value
                            ? opt.color === 'red' ? 'border-red-500'
                              : opt.color === 'orange' ? 'border-orange-500' : 'border-gray-500'
                            : 'border-gray-300'">
                          <div v-if="shortageForm.priority === opt.value" class="w-2.5 h-2.5 rounded-full"
                            :class="opt.color === 'red' ? 'bg-red-500'
                              : opt.color === 'orange' ? 'bg-orange-500' : 'bg-gray-500'" />
                        </div>
                        <component :is="opt.icon" class="w-4 h-4"
                          :class="opt.color === 'red' ? 'text-red-500'
                            : opt.color === 'orange' ? 'text-orange-500' : 'text-gray-500'" />
                        <span class="text-sm font-medium">{{ opt.label }}</span>
                      </label>
                    </div>
                  </div>
                </fieldset>

                <fieldset class="border-2 border-gray-300 rounded-[6px] p-5 bg-white relative mb-5">
                  <legend class="px-3 text-sm font-semibold text-gray-700 bg-[#FAFAFA] mx-1 flex items-center gap-1.5">
                    <FileText class="w-4 h-4 text-[#1E40AF]" />
                    附件与说明
                  </legend>
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Camera class="w-3.5 h-3.5 text-gray-400" />
                      现场照片
                      <span class="text-red-500">*</span>
                      <span class="text-xs text-gray-400 font-normal ml-1">（至少1张，必填）</span>
                    </label>
                    <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
                      <div v-for="(p, i) in shortageForm.photos" :key="i"
                        class="relative aspect-square rounded-[4px] overflow-hidden border border-gray-200 group">
                        <img :src="p" class="w-full h-full object-cover" />
                        <button @click="removeShortagePhoto(i)"
                          class="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <X class="w-3 h-3" />
                        </button>
                      </div>
                      <label
                        class="aspect-square rounded-[4px] border-2 border-dashed border-gray-300 hover:border-[#1E40AF] hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all bg-gray-50">
                        <Plus class="w-5 h-5 text-gray-400" />
                        <span class="text-[10px] text-gray-500">上传</span>
                        <input type="file" accept="image/*" multiple class="hidden" @change="handleShortagePhotoUpload" />
                      </label>
                    </div>
                    <p v-if="shortageForm.photos.length === 0" class="mt-1.5 text-xs text-red-500">请至少上传1张现场照片</p>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UiInput v-model="shortageForm.reporter" type="text" label="上报人"
                      placeholder="请输入上报人姓名" required />
                    <div class="md:col-span-2">
                      <UiInput v-model="shortageForm.remark" type="textarea" label="备注说明"
                        placeholder="必填：请填写缺料原因（如设计变更、路由变更）、影响范围、期望到货时间等"
                        :rows="4" required />
                    </div>
                  </div>
                </fieldset>

                <div class="flex justify-end">
                  <UiButton size="lg" variant="danger" type="button" :loading="submittingShortage"
                    :disabled="!shortageCanSubmit" @click="submitShortage">
                    <template #icon><Send class="w-4 h-4" /></template>
                    立即上报缺料
                  </UiButton>
                </div>
              </div>
            </UiCard>
          </div>

          <!-- 右侧清单 -->
          <div class="lg:col-span-2 space-y-3">
            <UiCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="font-semibold text-gray-900 flex items-center gap-2">
                    <ClipboardList class="w-5 h-5 text-[#1E40AF]" />
                    缺料清单
                  </h2>
                  <UiBadge variant="blue" size="sm">{{ sortedShortages.length }} 条</UiBadge>
                </div>
              </template>
            </UiCard>
            <div class="space-y-3">
              <div
                v-for="s in sortedShortages"
                :key="s.id"
                class="border rounded-[4px] p-4 bg-white transition-all hover:shadow-md"
                :class="isHighlighted(s.code)
                  ? 'border-red-400 shadow-lg shadow-red-100 bg-gradient-to-br from-red-50/80 to-white ring-2 ring-red-200'
                  : s.priority === 'critical' ? 'border-red-300'
                    : s.priority === 'urgent' ? 'border-orange-300' : 'border-gray-200'"
              >
                <div v-if="isHighlighted(s.code)"
                  class="-mt-4 -mx-4 mb-3 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold rounded-t-[2px] flex items-center gap-1.5">
                  <Flame class="w-3.5 h-3.5" />
                  重点关注：李强班缺料紧急
                </div>
                <div class="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div class="font-mono-num font-bold text-gray-900 text-sm">{{ s.code }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ store.projectName(s.projectId) }}</div>
                  </div>
                  <div class="flex gap-1.5 shrink-0">
                    <UiBadge :variant="priorityBadge(s.priority).variant" size="sm">
                      <span class="flex items-center gap-1">{{ priorityBadge(s.priority).label }}</span>
                    </UiBadge>
                    <UiBadge :variant="statusBadge(s.status).variant" size="sm">
                      {{ statusBadge(s.status).label }}
                    </UiBadge>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <div class="text-[11px] text-gray-400">线缆型号</div>
                    <div class="font-medium text-gray-800">{{ s.cableModel }}</div>
                  </div>
                  <div>
                    <div class="text-[11px] text-gray-400">缺料数量</div>
                    <div class="font-semibold text-red-600">{{ s.shortageQty }} {{ store.cables.find(c => c.id === s.cableId)?.name.includes('米') ? '米' : '卷' }}</div>
                  </div>
                  <div>
                    <div class="text-[11px] text-gray-400">上报人</div>
                    <div class="text-gray-700">{{ s.reporter }}</div>
                  </div>
                  <div>
                    <div class="text-[11px] text-gray-400">上报时间</div>
                    <div class="text-gray-600 font-mono-num text-xs">{{ s.reportTime.slice(5, 16) }}</div>
                  </div>
                </div>
                <div v-if="s.remark" class="text-xs text-gray-500 bg-gray-50 rounded-[4px] px-3 py-2 mb-3 line-clamp-2">
                  {{ s.remark }}
                </div>
                <div v-if="s.photos.length > 0" class="mb-3">
                  <UiPhoto :src="s.photos" />
                </div>
                <div v-if="s.status === 'reported'" class="pt-3 border-t border-gray-100">
                  <UiButton size="sm" variant="primary" class="w-full" @click="goSupplement(s)">
                    <template #icon><Plus class="w-4 h-4" /></template>
                    发起补领
                  </UiButton>
                </div>
              </div>
              <div v-if="sortedShortages.length === 0"
                class="border border-dashed border-gray-300 rounded-[4px] p-10 text-center text-sm text-gray-400">
                暂无缺料记录
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UiModal :open="viewerModalOpen" @update:open="viewerModalOpen = $event">
      <template #title>
        <span class="flex items-center gap-2">
          <Camera class="w-4 h-4" />
          现场照片（{{ viewerPhotos.length }}张）
        </span>
      </template>
      <UiPhoto v-if="viewerPhotos.length > 0" :src="viewerPhotos" />
    </UiModal>
  </div>
</template>

<style>
@keyframes pulse-slow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
}
.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}
</style>
