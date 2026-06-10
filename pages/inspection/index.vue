<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800">{{ pageHeaderTitle }}</h2>
        <p class="text-sm text-neutral-500 mt-1">{{ pageHeaderSubtitle }}</p>
      </div>
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-lg">
            <button
              v-for="f in filterOptions"
              :key="f.key"
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="activeFilter === f.key ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-50'"
              @click="activeFilter = f.key"
            >
              {{ f.label }}
              <span v-if="f.count" class="ml-1 opacity-80">{{ f.count }}</span>
            </button>
          </div>
          <NuxtLink
            v-if="canCreateNew"
            to="/inspection/new"
            class="btn-primary text-xs"
          >
            <AppIcon name="IconPlus" class="w-4 h-4 mr-1.5" />
            新建年检
          </NuxtLink>
        </div>
      </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th class="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">年检编号</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">电梯信息</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">检测日期 / 检测人</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">结果概览</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">状态</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">关联整改</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr
              v-for="insp in filteredInspections"
              :key="insp.id"
              class="hover:bg-neutral-50 transition-colors cursor-pointer"
              @click="openDetail(insp)"
            >
              <td class="px-5 py-4">
                <div class="font-mono text-sm font-semibold text-primary-700">{{ insp.id }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="font-medium text-neutral-800">{{ insp.elevatorName }}</div>
                <div class="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                  <AppIcon name="IconMapPin" class="w-3 h-3" />
                  {{ insp.location }}
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-2 text-neutral-700">
                  <AppIcon name="IconCalendar" class="w-3.5 h-3.5 text-neutral-400" />
                  {{ insp.inspectionDate }}
                </div>
                <div class="text-xs text-neutral-500 mt-1">{{ insp.inspector }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-success-500"></span>
                    <span class="text-xs text-neutral-600">{{ getPassCount(insp) }} 通过</span>
                  </div>
                  <div v-if="insp.failItems.length > 0" class="flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-danger-500"></span>
                    <span class="text-xs text-danger-600 font-medium">{{ insp.failItems.length }} 不合格</span>
                  </div>
                </div>
                <div v-if="insp.failItems.length > 0" class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="(f, i) in insp.failItems.slice(0, 2)"
                    :key="i"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-danger-50 text-danger-600 max-w-[140px] truncate"
                    :title="f"
                  >
                    {{ f }}
                  </span>
                  <span v-if="insp.failItems.length > 2" class="text-[10px] px-1.5 py-0.5 text-neutral-500">
                    +{{ insp.failItems.length - 2 }}项
                  </span>
                </div>
              </td>
              <td class="px-5 py-4">
                <StatusBadge type="inspection" :status="insp.status" />
              </td>
              <td class="px-5 py-4">
                <div v-if="getRectByInsp(insp.id)">
                  <span
                    class="text-xs font-medium text-primary-600 hover:underline"
                    @click.stop="goRectification(getRectByInsp(insp.id)!.id)"
                  >
                    {{ getRectByInsp(insp.id)!.id }}
                  </span>
                  <div class="mt-1">
                    <StatusBadge type="rectification" :status="getRectByInsp(insp.id)!.status" />
                  </div>
                </div>
                <span v-else class="text-xs text-neutral-400">—</span>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="inline-flex items-center gap-1" @click.stop>
                  <button
                    type="button"
                    class="p-1.5 rounded-md text-neutral-500 hover:text-primary-600 hover:bg-primary-50 transition-all"
                    title="查看详情"
                    @click="openDetail(insp)"
                  >
                    <AppIcon name="IconEye" class="w-4 h-4" />
                  </button>
                  <button
                    v-if="showReviewBtn(insp.status)"
                    type="button"
                    class="p-1.5 rounded-md text-neutral-500 hover:text-primary-600 hover:bg-primary-50 transition-all"
                    title="审核操作"
                    @click="openDetail(insp)"
                  >
                    <AppIcon name="IconEdit" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <InspectionDetailModal
      v-if="detailVisible"
      :inspection="selectedInspectionData"
      @close="closeDetail"
      @review="handleReview"
      @create-rectification="handleCreateRectification"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import type { InspectionRecord, UserRole } from '~/types'

const appStore = useAppStore()
const route = useRoute()

const activeFilter = ref<string>('all')
const detailVisible = ref(false)
const selectedInspectionData = ref<InspectionRecord | null>(null)

const pageHeaderTitle = computed(() => {
  const titles: Record<UserRole, string> = {
    technician: '我的年检记录',
    customer_service: '年检资料登记与核查',
    project_manager: '年检报告审核'
  }
  return titles[appStore.currentRole]
})
const pageHeaderSubtitle = computed(() => {
  const subs: Record<UserRole, string> = {
    technician: '共 ' + appStore.inspections.length + ' 份记录，点击查看判断依据',
    customer_service: '核对资料完整性，对不完整的退回补充',
    project_manager: '审核年检结论，确认是否需要整改'
  }
  return subs[appStore.currentRole]
})

const canCreateNew = computed(() => appStore.currentRole !== 'project_manager')

const filterOptions = computed(() => {
  const base = [
    { key: 'all', label: '全部', count: appStore.inspections.length },
    { key: 'non_compliant', label: '不合格', count: appStore.inspections.filter(i => i.status === 'non_compliant' || i.status === 'rectifying').length },
    { key: 'under_review', label: '审核中', count: appStore.inspections.filter(i => i.status === 'under_review').length },
    { key: 'compliant', label: '合格通过', count: appStore.inspections.filter(i => i.status === 'compliant' || i.status === 'closed').length }
  ]
  return base
})

const filteredInspections = computed<InspectionRecord[]>(() => {
  if (activeFilter.value === 'all') return appStore.inspections
  if (activeFilter.value === 'non_compliant') {
    return appStore.inspections.filter(i => i.status === 'non_compliant' || i.status === 'rectifying')
  }
  return appStore.inspections.filter(i => i.status === activeFilter.value || (activeFilter.value === 'compliant' && (i.status === 'compliant' || i.status === 'closed'))
})

function getPassCount(insp: InspectionRecord) {
  return insp.items.filter(i => i.result === 'pass').length
}

function getRectByInsp(id: string) {
  return appStore.getRectificationByInspection(id)
}

function showReviewBtn(status: string) {
  if (appStore.currentRole === 'project_manager') return status === 'under_review' || status === 'non_compliant'
  return false
}

function openDetail(insp: InspectionRecord) {
  selectedInspectionData.value = insp
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
  selectedInspectionData.value = null
}

function goRectification(id: string) {
  appStore.setSelectedRectification(id)
  navigateTo('/rectification')
}

function handleReview(insp: InspectionRecord, action: 'approve' | 'reject' | 'to_rect') {
  if (!insp) return
  if (action === 'approve') {
    appStore.updateInspectionStatus(insp.id, insp.failItems.length > 0 ? 'non_compliant' : 'compliant')
  }
  if (action === 'to_rect' && insp.failItems.length > 0) {
    appStore.updateInspectionStatus(insp.id, 'rectifying')
  }
  closeDetail()
}

function handleCreateRectification(insp: InspectionRecord) {
  closeDetail()
  navigateTo('/rectification')
}

onMounted(() => {
  if (appStore.selectedInspectionId) {
    const insp = appStore.inspections.find(i => i.id === appStore.selectedInspectionId)
    if (insp) {
      openDetail(insp)
      appStore.setSelectedInspection(null)
    }
  }
})

watch(() => route.fullPath, () => {
  if (appStore.selectedInspectionId) {
    const insp = appStore.inspections.find(i => i.id === appStore.selectedInspectionId)
    if (insp) {
      setTimeout(() => {
        openDetail(insp)
        appStore.setSelectedInspection(null)
      }, 100)
    }
  }
})
</script>
