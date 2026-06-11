<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800">{{ pageHeaderTitle }}</h2>
        <p class="text-sm text-neutral-500 mt-1">{{ pageHeaderSubtitle }}</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-lg overflow-x-auto scrollbar-thin">
          <button
            v-for="f in filterOptions"
            :key="f.key"
            type="button"
            class="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all"
            :class="activeFilter === f.key ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-50'"
            @click="activeFilter = f.key"
          >
            {{ f.label }}
            <span v-if="f.count" class="ml-1 opacity-80">{{ f.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-4">
        <div
          v-for="rect in filteredRectifications"
          :key="rect.id"
          class="card overflow-hidden hover:shadow-card-hover transition-shadow"
          @click="openDetail(rect)"
        >
          <div class="p-5">
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono text-sm font-bold text-primary-700">{{ rect.id }}</span>
                  <StatusBadge type="rectification" :status="rect.status" />
                  <StatusBadge type="priority" :status="rect.priority" />
                </div>
                <div class="mt-2 flex items-center gap-1 text-sm font-medium text-neutral-800">
                  <AppIcon name="IconMapPin" class="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  {{ rect.elevatorName }}
                </div>
                <div class="mt-0.5 text-xs text-neutral-500 ml-5">{{ rect.location }}</div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-[11px] text-neutral-500 mb-0.5">整改截止</div>
                <div
                  class="text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1"
                  :class="deadlineStyle(rect.deadline, rect.status).class"
                >
                  <AppIcon name="IconClock" class="w-3 h-3" />
                  {{ rect.deadline }}
                </div>
                <div class="text-[10px] mt-1" :class="deadlineStyle(rect.deadline, rect.status).textClass">
                  {{ deadlineLabel(rect.deadline, rect.status) }}
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div class="rounded-lg bg-neutral-50 p-2.5 border border-neutral-100">
                <div class="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">总问题项</div>
                <div class="text-xl font-bold text-neutral-800">{{ rect.failItems.length }}</div>
              </div>
              <div class="rounded-lg bg-success-50 p-2.5 border border-success-100">
                <div class="text-[10px] font-semibold text-success-700 uppercase tracking-wider mb-1">已完成</div>
                <div class="text-xl font-bold text-success-700">{{ getCompletedCount(rect) }}</div>
              </div>
              <div class="rounded-lg bg-warning-50 p-2.5 border border-warning-100">
                <div class="text-[10px] font-semibold text-warning-700 uppercase tracking-wider mb-1">进行中</div>
                <div class="text-xl font-bold text-warning-700">{{ rect.failItems.length - getCompletedCount(rect) }}</div>
              </div>
            </div>

            <div class="mt-4">
              <div class="flex items-center justify-between mb-1.5 text-[11px]">
                <span class="font-medium text-neutral-600">整改进度</span>
                <span class="font-bold text-neutral-800">{{ getProgress(rect) }}%</span>
              </div>
              <div class="h-2 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="progressColorClass(rect)"
                  :style="{ width: getProgress(rect) + '%' }"
                ></div>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-1.5">
              <span
                v-for="(item, i) in rect.failItems"
                :key="i"
                class="text-[10px] px-2 py-0.5 rounded-md"
                :class="measureStatus(rect, i) === 'done' ? 'bg-success-100 text-success-700' : measureStatus(rect, i) === 'doing' ? 'bg-warning-100 text-warning-700' : 'bg-neutral-100 text-neutral-600'"
              >
                <span v-if="measureStatus(rect, i) === 'done'" class="mr-0.5">✓</span>
                {{ item.split(' ').slice(0, 2).join(' ') }}
              </span>
            </div>
          </div>

          <div class="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-4 text-xs text-neutral-600 flex-wrap">
              <span class="flex items-center gap-1">
                <AppIcon name="IconUser" class="w-3.5 h-3.5 text-warning-500" />
                整改人：<span class="font-medium text-neutral-800">{{ rect.assignedTo }}</span>
              </span>
              <span v-if="rect.recheckResults && rect.recheckResults.length" class="flex items-center gap-1">
                <AppIcon name="IconEye" class="w-3.5 h-3.5 text-success-600" />
                复查人：<span class="font-medium text-neutral-800">{{ rect.recheckResults[rect.recheckResults.length - 1].rechecker }}</span>
              </span>
              <span class="flex items-center gap-1">
                <AppIcon name="IconClipboard" class="w-3.5 h-3.5 text-primary-500" />
                来源：<span class="font-medium text-primary-700 hover:underline cursor-pointer" @click.stop="goInspection(rect.inspectionId)">{{ rect.inspectionId }}</span>
              </span>
            </div>
            <div class="flex items-center gap-1" @click.stop>
              <button
                type="button"
                class="btn-secondary text-xs py-1.5"
                @click="openDetail(rect)"
              >
                <AppIcon name="IconEye" class="w-3.5 h-3.5 mr-1" />
                查看详情
              </button>
              <button
                v-if="canRecheck(rect)"
                type="button"
                class="btn-success text-xs py-1.5"
                @click="openDetail(rect)"
              >
                <AppIcon name="IconCheck" class="w-3.5 h-3.5 mr-1" />
                现场复查
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredRectifications.length === 0" class="card p-10 text-center">
          <AppIcon name="IconCheckCircle" class="w-12 h-12 mx-auto text-success-300" />
          <p class="text-sm text-neutral-500 mt-3">暂无相关整改记录</p>
        </div>
      </div>

      <div class="space-y-5">
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-4">整改状态流转说明</h3>
          <div class="space-y-2.5">
            <div v-for="(step, idx) in statusFlow" :key="step.key" class="flex items-start gap-3">
              <div class="flex flex-col items-center">
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2"
                  :class="[
                    idx < currentStatusIndex ? 'bg-success-500 border-success-500 text-white' :
                    idx === currentStatusIndex ? 'bg-primary-600 border-primary-600 text-white animate-pulse' :
                    'bg-white border-neutral-300 text-neutral-400'
                  ]"
                >
                  {{ idx + 1 }}
                </div>
                <div v-if="idx < statusFlow.length - 1" class="w-0.5 flex-1 min-h-[20px]" :class="idx < currentStatusIndex ? 'bg-success-400' : 'bg-neutral-200'"></div>
              </div>
              <div class="flex-1 pb-2">
                <div class="text-xs font-semibold" :class="idx <= currentStatusIndex ? 'text-neutral-800' : 'text-neutral-400'">{{ step.label }}</div>
                <div class="text-[11px] text-neutral-500 mt-0.5">{{ step.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-3">责任角色</h3>
          <div class="space-y-3 text-xs">
            <div class="flex items-start gap-3 p-2 rounded-lg bg-warning-50 border border-warning-100">
              <div class="w-7 h-7 rounded-full bg-warning-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <AppIcon name="IconWrench" class="w-3.5 h-3.5" />
              </div>
              <div>
                <div class="font-semibold text-neutral-800">维保技师</div>
                <div class="text-[11px] text-neutral-600 mt-0.5">执行整改措施、提交整改证据、进行自测</div>
              </div>
            </div>
            <div class="flex items-start gap-3 p-2 rounded-lg bg-primary-50/60 border border-primary-100">
              <div class="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <AppIcon name="IconMessage" class="w-3.5 h-3.5" />
              </div>
              <div>
                <div class="font-semibold text-neutral-800">客服专员</div>
                <div class="text-[11px] text-neutral-600 mt-0.5">同步甲乙方进度、推送期限预警、归档通知</div>
              </div>
            </div>
            <div class="flex items-start gap-3 p-2 rounded-lg bg-success-50 border border-success-100">
              <div class="w-7 h-7 rounded-full bg-success-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <AppIcon name="IconEye" class="w-3.5 h-3.5" />
              </div>
              <div>
                <div class="font-semibold text-neutral-800">项目主管</div>
                <div class="text-[11px] text-neutral-600 mt-0.5">派单、现场复查、闭环签署、质量把关</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RectificationDetailModal
      v-if="detailVisible"
      :record="selectedRectData"
      @close="closeDetail"
      @recheck="handleRecheck"
      @close-loop="handleCloseLoop"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import type { RectificationRecord, UserRole, RectificationStatus } from '~/types'

const appStore = useAppStore()
const route = useRoute()

const activeFilter = ref<string>('all')
const detailVisible = ref(false)
const selectedRectData = ref<RectificationRecord | null>(null)

const pageHeaderTitle = computed(() => {
  const titles: Record<UserRole, string> = {
    technician: '我的整改任务',
    customer_service: '整改进度跟进',
    project_manager: '整改派单与复查'
  }
  return titles[appStore.currentRole]
})
const pageHeaderSubtitle = computed(() => {
  const subs: Record<UserRole, string> = {
    technician: '逐项完成整改措施并提交证据，等待主管复查',
    customer_service: '跟踪整改进度，每日同步甲方物业',
    project_manager: '派单、复查、把关整改质量并最终闭环'
  }
  return subs[appStore.currentRole]
})

const filterOptions = computed(() => {
  const rects = appStore.rectifications
  return [
    { key: 'all', label: '全部', count: rects.length },
    { key: 'pending', label: '待整改', count: rects.filter(r => r.status === 'pending').length },
    { key: 'in_progress', label: '整改中', count: rects.filter(r => r.status === 'in_progress').length },
    { key: 'recheck', label: '待复查', count: rects.filter(r => r.status === 'recheck').length },
    { key: 'closed', label: '已闭环', count: rects.filter(r => r.status === 'closed').length },
    { key: 'passed', label: '复查通过', count: rects.filter(r => r.status === 'passed').length }
  ]
})

const filteredRectifications = computed<RectificationRecord[]>(() => {
  let list = [...appStore.rectifications]
  if (appStore.currentRole === 'technician') {
    list = list.filter(r => r.assigneeRole === 'technician' && r.assignedTo === '张师傅')
  }
  if (activeFilter.value === 'all') return list
  if (activeFilter.value === 'closed') {
    return list.filter(r => r.status === 'closed')
  }
  if (activeFilter.value === 'passed') {
    return list.filter(r => r.status === 'passed')
  }
  return list.filter(r => r.status === activeFilter.value)
})

const statusFlow: { key: RectificationStatus; label: string; desc: string }[] = [
  { key: 'pending', label: '主管派单', desc: '年检不合格，主管创建整改单并指派' },
  { key: 'in_progress', label: '整改执行', desc: '技师按项目逐项落实整改措施' },
  { key: 'recheck', label: '整改完成待复查', desc: '技师自测后提交，等待主管现场复查' },
  { key: 'passed', label: '复查通过', desc: '主管复核确认所有问题已解决' },
  { key: 'closed', label: '闭环归档', desc: '所有文档签字齐全，责任链条完整' }
]

const currentStatusIndex = computed(() => {
  const rect = filteredRectifications.value[0]
  if (!rect) return 0
  const idx = statusFlow.findIndex(s => s.key === rect.status)
  if (idx !== -1) return idx
  if (rect.status === 'failed') return 2
  return 0
})

function getCompletedCount(rect: RectificationRecord) {
  return rect.rectificationMeasures.filter(m => m.measure && m.completedAt).length
}

function getProgress(rect: RectificationRecord) {
  const total = rect.failItems.length
  if (total === 0) return 0
  const done = getCompletedCount(rect)
  if (rect.status === 'closed') return 100
  if (rect.status === 'passed') return 95
  return Math.round((done / total) * 100)
}

function measureStatus(rect: RectificationRecord, idx: number) {
  const m = rect.rectificationMeasures[idx]
  if (!m || !m.measure) return 'todo'
  if (m.measure && m.completedAt) return 'done'
  return 'doing'
}

function progressColorClass(rect: RectificationRecord) {
  const p = getProgress(rect)
  if (rect.status === 'passed') return 'bg-gradient-to-r from-primary-500 to-primary-600'
  if (rect.status === 'closed') return 'bg-gradient-to-r from-success-500 to-success-600'
  if (p >= 100) return 'bg-gradient-to-r from-success-500 to-success-600'
  if (p >= 50) return 'bg-gradient-to-r from-warning-500 to-primary-500'
  return 'bg-gradient-to-r from-warning-400 to-warning-500'
}

function deadlineStyle(deadline: string, status: string) {
  if (status === 'closed') {
    return { class: 'bg-success-100 text-success-700', textClass: 'text-success-600' }
  }
  if (status === 'passed') {
    return { class: 'bg-primary-100 text-primary-700', textClass: 'text-primary-600' }
  }
  const now = new Date()
  const d = new Date(deadline)
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
  if (diff < 0) return { class: 'bg-danger-100 text-danger-700', textClass: 'text-danger-600 font-medium' }
  if (diff <= 2) return { class: 'bg-warning-100 text-warning-700', textClass: 'text-warning-600 font-medium' }
  return { class: 'bg-neutral-100 text-neutral-700', textClass: 'text-neutral-500' }
}

function deadlineLabel(deadline: string, status: string) {
  if (status === 'closed') return '已按期闭环'
  if (status === 'passed') return '待签署闭环'
  const now = new Date()
  const d = new Date(deadline)
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
  if (diff < 0) return `已超期 ${-diff} 天`
  if (diff === 0) return '今日截止'
  return `剩余 ${diff} 天`
}

function canRecheck(rect: RectificationRecord) {
  return appStore.currentRole === 'project_manager' && rect.status === 'recheck'
}

function openDetail(rect: RectificationRecord) {
  selectedRectData.value = rect
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
  selectedRectData.value = null
}

function goInspection(id: string) {
  appStore.setSelectedInspection(id)
  navigateTo('/inspection')
}

function handleRecheck(rect: RectificationRecord, result: 'pass' | 'fail') {
  const recheckResult = {
    id: 'rc' + Date.now(),
    rechecker: appStore.currentUser.name,
    recheckerRole: appStore.currentRole,
    recheckDate: new Date().toISOString().split('T')[0],
    result: result,
    items: rect.failItems.map((name, idx) => ({
      itemId: rect.rectificationMeasures[idx]?.itemId || 'c0' + (idx + 1),
      itemName: name,
      result: result
    })),
    overallConclusion: result === 'pass'
      ? `现场复查通过，${rect.failItems.length}项整改措施全部落实，${rect.priority === 'high' ? '关键项' : '一般项'}功能测试正常。`
      : '复查发现部分整改措施未落实到位，需重新整改后再次申请复查。'
  }
  appStore.addRecheckResult(rect.id, recheckResult)
  appStore.updateRectificationStatus(rect.id, result === 'pass' ? 'passed' : 'in_progress')

  const newAlert = {
    id: 'al' + Date.now(),
    type: result === 'pass' ? 'system' as const : 'rectification' as const,
    title: result === 'pass' ? `整改复查通过：${rect.id}` : `整改复查不通过：${rect.id}`,
    message: `${rect.elevatorName}${result === 'pass' ? '整改复查通过，可进入闭环' : '整改复查不通过，需重新整改'}。`,
    description: `${appStore.currentUser.name}于今日对${rect.elevatorName}进行现场复查，${result === 'pass' ? `${rect.failItems.length}项全部通过，整改质量合格。` : '发现部分项目整改不彻底，已退回维保组重新处理。'}`,
    relatedId: rect.id,
    relatedType: 'rectification',
    linkId: rect.id,
    linkType: 'rectification' as const,
    priority: result === 'pass' ? 'medium' as const : 'high' as const,
    isRead: false,
    createdAt: new Date().toISOString(),
    meta: {
      elevator: rect.elevatorName,
      relatedId: rect.id
    }
  }
  appStore.addAlert(newAlert)
  closeDetail()
}

function handleCloseLoop(rect: RectificationRecord) {
  appStore.updateRectification(rect.id, {
    status: 'closed',
    closedAt: new Date().toISOString(),
    closedBy: appStore.currentUser.name
  })
  const insp = appStore.inspections.find(i => i.id === rect.inspectionId)
  if (insp) {
    appStore.updateInspectionStatus(insp.id, 'closed')
  }
  const newAlert = {
    id: 'al' + Date.now(),
    type: 'system' as const,
    title: `整改已闭环归档：${rect.id}`,
    message: `${rect.elevatorName}整改闭环完成，所有文档已归档。`,
    description: `${appStore.currentUser.name}已签署闭环意见，${rect.elevatorName}的${rect.failItems.length}项问题全部解决，责任链条完整，进入归档状态。`,
    relatedId: rect.id,
    relatedType: 'rectification',
    linkId: rect.id,
    linkType: 'rectification' as const,
    priority: 'medium' as const,
    isRead: false,
    createdAt: new Date().toISOString(),
    meta: {
      elevator: rect.elevatorName,
      relatedId: rect.id
    }
  }
  appStore.addAlert(newAlert)
  closeDetail()
}

onMounted(() => {
  if (appStore.selectedRectificationId) {
    const rect = appStore.rectifications.find(r => r.id === appStore.selectedRectificationId)
    if (rect) {
      openDetail(rect)
      appStore.setSelectedRectification(null)
    }
  }
})

watch(() => route.fullPath, () => {
  if (appStore.selectedRectificationId) {
    const rect = appStore.rectifications.find(r => r.id === appStore.selectedRectificationId)
    if (rect) {
      setTimeout(() => {
        openDetail(rect)
        appStore.setSelectedRectification(null)
      }, 100)
    }
  }
})
</script>
