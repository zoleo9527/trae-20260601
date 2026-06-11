<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800">整改完成 · 待复查与待签署</h2>
        <p class="text-sm text-neutral-500 mt-1">含现场复查通过后等待主管签署闭环的记录</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="text-xs px-3 py-1.5 rounded-lg bg-warning-100 text-warning-700 font-medium">
          {{ recheckPendingCount }} 份待复查
        </div>
        <div class="text-xs px-3 py-1.5 rounded-lg bg-primary-100 text-primary-700 font-medium">
          {{ signLoopCount }} 份待签署闭环
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="card p-4 hover:shadow-card-hover transition-shadow cursor-pointer"
        @click="activeTimeFilter = card.key"
        :class="activeTimeFilter === card.key ? 'ring-2 ring-primary-500 border-primary-300' : ''"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-medium text-neutral-500">{{ card.label }}</div>
            <div class="text-2xl font-bold mt-1" :class="card.colorClass">{{ card.value }}</div>
            <div class="text-[11px] text-neutral-500 mt-0.5">{{ card.sub }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="card.bgClass">
            <AppIcon :name="card.icon" :class="['w-5 h-5', card.iconClass]" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2">
        <div class="card overflow-hidden">
          <div class="px-5 py-3 border-b border-neutral-200 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-neutral-800">待复查与待签署闭环清单</h3>
            <div class="flex items-center gap-2 text-xs">
              <button
                type="button"
                class="px-2.5 py-1 rounded-md transition-colors"
                :class="onlyCritical ? 'bg-danger-100 text-danger-700 font-medium' : 'text-neutral-500 hover:bg-neutral-100'"
                @click="onlyCritical = !onlyCritical"
              >
                <AppIcon name="IconAlertTriangle" class="w-3.5 h-3.5 inline mr-1" />
                仅关键项
              </button>
            </div>
          </div>
          <div class="divide-y divide-neutral-100">
            <div
              v-for="rect in recheckList"
              :key="rect.id"
              class="p-5 hover:bg-neutral-50 transition-colors cursor-pointer"
              @click="openDetail(rect)"
            >
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
                  <div class="text-xs text-neutral-500 ml-5">{{ rect.location }}</div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-[11px] text-neutral-500 mb-0.5">整改人自测提交</div>
                  <div class="text-xs font-semibold text-neutral-700">{{ rect.updatedAt?.split('T')[0] }}</div>
                </div>
              </div>

              <div class="mt-4 space-y-2">
                <div
                  v-for="(item, idx) in rect.failItems"
                  :key="idx"
                  class="flex items-start gap-3 text-xs p-3 rounded-lg bg-neutral-50 border border-neutral-100"
                >
                  <div class="w-5 h-5 rounded-full bg-success-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AppIcon name="IconCheck" class="w-3 h-3" />
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-neutral-800">{{ item }}</div>
                    <div class="mt-1 text-neutral-600">{{ rect.rectificationMeasures[idx]?.measure || '已完成整改，详见附件照片' }}</div>
                    <div v-if="rect.rectificationMeasures[idx]?.completedAt" class="mt-1 text-[11px] text-success-600">
                      完成时间：{{ rect.rectificationMeasures[idx].completedAt?.split('T')[0] }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-4 text-xs text-neutral-600 flex-wrap">
                  <span class="flex items-center gap-1">
                    <AppIcon name="IconUser" class="w-3.5 h-3.5 text-warning-500" />
                    整改人：<span class="font-medium text-neutral-800">{{ rect.assignedTo }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <AppIcon name="IconPaperclip" class="w-3.5 h-3.5 text-primary-500" />
                    {{ rect.rectificationMeasures.filter(m => m.photos && m.photos.length > 0).length }} 张整改照片
                  </span>
                </div>
                <div class="flex items-center gap-2" @click.stop>
                  <button type="button" class="btn-secondary text-xs py-1.5" @click="openDetail(rect)">
                    <AppIcon name="IconEye" class="w-3.5 h-3.5 mr-1" />
                    查看整改证据
                  </button>
                  <button
                    v-if="appStore.currentRole === 'project_manager'"
                    type="button"
                    class="btn-success text-xs py-1.5"
                    @click="openDetail(rect)"
                  >
                    <AppIcon name="IconCheckCircle" class="w-3.5 h-3.5 mr-1" />
                    去现场复查
                  </button>
                </div>
              </div>
            </div>

            <div v-if="recheckList.length === 0" class="p-10 text-center">
              <AppIcon name="IconCheckCircle" class="w-12 h-12 mx-auto text-success-300" />
              <p class="text-sm text-neutral-500 mt-3">暂无需复查的整改记录</p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-4">复查要点清单</h3>
          <div class="space-y-3 text-xs">
            <div v-for="(tip, i) in recheckTips" :key="i" class="flex items-start gap-2.5 p-2.5 rounded-lg" :class="tip.bgClass">
              <AppIcon :name="tip.icon" :class="['w-4 h-4 flex-shrink-0 mt-0.5', tip.iconClass]" />
              <div>
                <div class="font-medium" :class="tip.textClass">{{ tip.title }}</div>
                <div class="text-neutral-600 mt-0.5">{{ tip.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-3">复查流程</h3>
          <div class="space-y-2.5">
            <div v-for="(step, i) in recheckSteps" :key="i" class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {{ i + 1 }}
              </div>
              <div class="flex-1">
                <div class="text-xs font-semibold text-neutral-800">{{ step.title }}</div>
                <div class="text-[11px] text-neutral-500 mt-0.5">{{ step.desc }}</div>
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
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import type { RectificationRecord } from '~/types'

const appStore = useAppStore()
const detailVisible = ref(false)
const selectedRectData = ref<RectificationRecord | null>(null)
const onlyCritical = ref(false)
const activeTimeFilter = ref('week')

const recheckPendingCount = computed(() =>
  appStore.rectifications.filter(r => r.status === 'recheck').length
)

const signLoopCount = computed(() =>
  appStore.rectifications.filter(r => r.status === 'passed').length
)

const recheckList = computed(() => {
  let list = appStore.rectifications.filter(r => r.status === 'recheck' || r.status === 'passed')
  if (onlyCritical.value) {
    list = list.filter(r => r.priority === 'high')
  }
  return list
})

const statCards = computed(() => [
  { key: 'week', label: '本周待复查', value: recheckPendingCount.value, sub: '占全部整改 33%', icon: 'IconCalendar', colorClass: 'text-warning-600', bgClass: 'bg-warning-100', iconClass: 'text-warning-600' },
  { key: 'critical', label: '含关键项', value: appStore.rectifications.filter(r => r.status === 'recheck' && r.priority === 'high').length, sub: '需当日安排', icon: 'IconAlertTriangle', colorClass: 'text-danger-600', bgClass: 'bg-danger-100', iconClass: 'text-danger-600' },
  { key: 'passed', label: '复查通过', value: appStore.rectifications.filter(r => r.status === 'passed').length, sub: '待签署闭环', icon: 'IconCheckCircle', colorClass: 'text-success-600', bgClass: 'bg-success-100', iconClass: 'text-success-600' },
  { key: 'returned', label: '退回重改', value: 1, sub: '本月累计', icon: 'IconRefreshCw', colorClass: 'text-primary-600', bgClass: 'bg-primary-100', iconClass: 'text-primary-600' }
])

const recheckTips = [
  { icon: 'IconZap', iconClass: 'text-danger-600', bgClass: 'bg-danger-50 border border-danger-100', textClass: 'text-danger-800', title: '关键项必查', desc: '涉及安全保护、紧急救援的项目，必须逐项测试验证' },
  { icon: 'IconCamera', iconClass: 'text-primary-600', bgClass: 'bg-primary-50 border border-primary-100', textClass: 'text-primary-800', title: '现场留痕', desc: '复查时需拍摄对比照片，附在复查结论后归档' },
  { icon: 'IconFileText', iconClass: 'text-success-600', bgClass: 'bg-success-50 border border-success-100', textClass: 'text-success-800', title: '签字确认', desc: '复查结论需甲乙双方现场签字确认' }
]

const recheckSteps = [
  { title: '预约甲方', desc: '提前1天通知甲方物业到场见证' },
  { title: '现场逐项测试', desc: '对照整改清单逐项验证，功能项必须试跑' },
  { title: '出具复查结论', desc: '全部通过/部分通过/不通过' },
  { title: '签字归档', desc: '双方签字后进入闭环或退回重改' }
]

function openDetail(rect: RectificationRecord) {
  selectedRectData.value = rect
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
  selectedRectData.value = null
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
</script>
