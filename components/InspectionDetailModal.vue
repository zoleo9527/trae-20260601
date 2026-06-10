<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div class="px-6 py-4 border-b border-neutral-200 flex items-start justify-between gap-4 bg-gradient-to-r from-neutral-50 to-white">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h2 class="text-lg font-bold text-neutral-800">{{ inspection?.id }} · 年检详情</h2>
            <StatusBadge v-if="inspection" type="inspection" :status="inspection.status" />
            <span v-if="inspection && inspection.failItems.length > 0" class="badge-danger">
              {{ inspection.failItems.length }}项不合格
            </span>
            <span v-else-if="inspection" class="badge-success">全部合格</span>
          </div>
          <div class="mt-1.5 flex items-center gap-4 flex-wrap text-xs text-neutral-500">
            <span class="flex items-center gap-1">
              <AppIcon name="IconMapPin" class="w-3.5 h-3.5" />
              {{ inspection?.elevatorName }} · {{ inspection?.location }}
            </span>
            <span class="flex items-center gap-1">
              <AppIcon name="IconUser" class="w-3.5 h-3.5" />
              检测人：{{ inspection?.inspector }}
            </span>
            <span class="flex items-center gap-1">
              <AppIcon name="IconCalendar" class="w-3.5 h-3.5" />
              检测日期：{{ inspection?.inspectionDate }}
            </span>
          </div>
        </div>
        <button
          type="button"
          class="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors flex-shrink-0"
          @click="$emit('close')"
        >
          <AppIcon name="IconX" class="w-5 h-5" />
        </button>
      </div>

      <div class="px-6 py-3 border-b border-neutral-200 bg-white flex gap-1 overflow-x-auto scrollbar-thin">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5"
          :class="activeTab === tab.key
            ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
            : 'text-neutral-600 hover:bg-neutral-100'"
          @click="activeTab = tab.key"
        >
          <AppIcon v-if="tab.icon" :name="tab.icon" class="w-3.5 h-3.5" />
          {{ tab.label }}
          <span v-if="tab.badge" class="text-[10px] px-1.5 py-0.5 rounded-full bg-danger-100 text-danger-700 ml-0.5">
            {{ tab.badge }}
          </span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div v-if="activeTab === 'items'" class="space-y-5">
          <div v-for="group in groupedCriteria" :key="group.category" class="space-y-3">
            <div class="flex items-center gap-3 pb-1 border-b border-neutral-200">
              <h3 class="text-sm font-semibold text-neutral-700">{{ group.category }}</h3>
              <div class="flex items-center gap-3 text-xs">
                <span class="flex items-center gap-1 text-success-600">
                  <span class="w-1.5 h-1.5 rounded-full bg-success-500"></span>
                  {{ group.stats.pass }} 通过
                </span>
                <span v-if="group.stats.fail > 0" class="flex items-center gap-1 text-danger-600">
                  <span class="w-1.5 h-1.5 rounded-full bg-danger-500"></span>
                  {{ group.stats.fail }} 不合格
                </span>
                <span v-if="group.stats.na > 0" class="flex items-center gap-1 text-neutral-500">
                  <span class="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                  {{ group.stats.na }} 不适用
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <div
                v-for="item in group.items"
                :key="item.criterion.id"
                class="rounded-lg border transition-all overflow-hidden"
                :class="{
                  'border-success-200 bg-green-50 hover:bg-green-100': item.result.result === 'pass',
                  'border-danger-200 bg-danger-50 hover:bg-red-50': item.result.result === 'fail',
                  'border-neutral-200 bg-gray-50 hover:bg-gray-100': item.result.result === 'na'
                }"
              >
                <div class="flex items-start gap-3 p-3">
                  <div
                    class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    :class="{
                      'bg-success-100 text-success-600': item.result.result === 'pass',
                      'bg-danger-100 text-danger-600': item.result.result === 'fail',
                      'bg-neutral-100 text-neutral-500': item.result.result === 'na'
                    }"
                  >
                    <AppIcon v-if="item.result.result === 'pass'" name="IconCheck" class="w-3.5 h-3.5" />
                    <AppIcon v-else-if="item.result.result === 'fail'" name="IconXCircle" class="w-3.5 h-3.5" />
                    <span v-else class="text-[10px] font-bold">NA</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-mono text-neutral-500">{{ item.criterion.code }}</span>
                      <h4 class="text-sm font-medium text-neutral-800">{{ item.criterion.name }}</h4>
                      <span v-if="item.criterion.isRequired" class="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 font-medium">
                        必检项
                      </span>
                    </div>

                    <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div class="rounded-md bg-white/80 p-2.5 border border-neutral-200/70">
                        <div class="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">📋 判断标准（依据）</div>
                        <div class="text-neutral-700 leading-relaxed">{{ item.criterion.standard }}</div>
                      </div>
                      <div class="rounded-md bg-white/80 p-2.5 border border-neutral-200/70">
                        <div class="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">🔍 检测方法</div>
                        <div class="text-neutral-700 leading-relaxed">{{ item.criterion.method }}</div>
                      </div>
                    </div>

                    <div v-if="item.result.result === 'fail'" class="mt-3 space-y-2">
                      <div class="rounded-md border-l-4 border-danger-500 bg-white p-3 shadow-sm">
                        <div class="text-[10px] font-bold text-danger-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <AppIcon name="IconAlertTriangle" class="w-3 h-3" />
                          不合格原因 / 现场证据
                        </div>
                        <div v-if="item.result.evidence" class="text-xs text-neutral-700 mb-1.5">
                          <span class="font-medium">证据：</span>{{ item.result.evidence }}
                        </div>
                        <div v-if="item.result.note" class="text-xs text-neutral-700">
                          <span class="font-medium">备注：</span>{{ item.result.note }}
                        </div>
                      </div>
                    </div>

                    <div v-else-if="item.result.result === 'na' && item.result.note" class="mt-2">
                      <div class="rounded-md bg-white/80 p-2 border border-neutral-200 text-xs text-neutral-600">
                        <span class="font-medium">不适用说明：</span>{{ item.result.note }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'conclusion'" class="space-y-5">
          <div class="card p-5">
            <h3 class="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <AppIcon name="IconFileText" class="w-4 h-4 text-primary-600" />
              年检结论与整改要求
            </h3>
            <div v-if="inspection?.failItems.length" class="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-200">
              <div class="text-xs font-bold text-danger-700 mb-2">不合格项目清单（{{ inspection.failItems.length }}项）</div>
              <ul class="space-y-1.5">
                <li v-for="(item, i) in inspection.failItems" :key="i" class="text-xs text-danger-800 flex items-start gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-danger-500 mt-1.5 flex-shrink-0"></span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
            <div v-if="inspection?.failReasons.length" class="mb-4 p-3 rounded-lg bg-warning-50 border border-warning-200">
              <div class="text-xs font-bold text-warning-700 mb-2 flex items-center gap-1">
                <AppIcon name="IconAlertTriangle" class="w-3.5 h-3.5" />
                违反依据 / 判定理由（为什么不合格）
              </div>
              <ul class="space-y-1.5">
                <li v-for="(r, i) in inspection.failReasons" :key="i" class="text-xs text-warning-800 flex items-start gap-2 leading-relaxed">
                  <span class="font-bold text-warning-600 flex-shrink-0">{{ i + 1 }}.</span>
                  <span>{{ r }}</span>
                </li>
              </ul>
            </div>
            <div v-if="inspection?.conclusion" class="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <div class="text-xs font-bold text-neutral-700 mb-1.5">综合结论</div>
              <div class="text-sm text-neutral-800 leading-relaxed">{{ inspection.conclusion }}</div>
            </div>
            <div v-if="inspection?.rectificationDeadline" class="mt-3 flex items-center gap-2 text-xs">
              <span class="text-neutral-500">整改期限：</span>
              <span class="font-semibold px-2 py-0.5 rounded bg-danger-100 text-danger-700 flex items-center gap-1">
                <AppIcon name="IconClock" class="w-3 h-3" />
                {{ inspection.rectificationDeadline }}
              </span>
            </div>
          </div>

          <div class="card p-5">
            <h3 class="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <AppIcon name="IconUsers" class="w-4 h-4 text-primary-600" />
              责任链条（谁说了什么、做了什么）
            </h3>
            <div class="relative pl-6 space-y-5">
              <div class="absolute left-2.5 top-1 bottom-1 w-0.5 bg-neutral-200"></div>
              <div
                v-for="(event, i) in timelineEvents"
                :key="event.id"
                class="relative"
              >
                <div
                  class="absolute -left-6 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center mt-0.5"
                  :class="eventDotStyle(event.actorRole)"
                >
                  <AppIcon :name="eventIcon(event)" class="w-2.5 h-2.5 text-white" />
                </div>
                <div class="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                  <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div class="text-xs font-semibold text-neutral-800">{{ event.action }}</div>
                      <div v-if="event.detail" class="text-xs text-neutral-600 mt-0.5">{{ event.detail }}</div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <span :class="roleBadgeStyle(event.actorRole)">{{ roleLabel(event.actorRole) }}</span>
                      <span class="text-[11px] text-neutral-500 font-mono">{{ formatTime(event.timestamp) }}</span>
                    </div>
                  </div>
                  <div class="mt-1 text-[11px] text-neutral-500">操作人：<span class="font-medium text-neutral-700">{{ event.actor }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'evidence'" class="space-y-4">
          <div class="card p-5">
            <h3 class="text-sm font-semibold text-neutral-800 mb-3">现场资料</h3>
            <p class="text-xs text-neutral-500 mb-4">以下为本次年检关联的签字记录、照片和附件（示例）</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="aspect-square rounded-lg bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer group">
                <div class="text-center">
                  <AppIcon name="IconUpload" class="w-6 h-6 mx-auto mb-1 group-hover:text-primary-500" />
                  <span class="text-xs">上传照片</span>
                </div>
              </div>
              <div v-for="n in 3" :key="n" class="aspect-square rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-neutral-500 overflow-hidden relative">
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]"></div>
                <span class="text-xs font-medium relative z-10 bg-white/90 px-2 py-1 rounded">现场照片 {{ n }}</span>
              </div>
            </div>
            <div class="mt-4 space-y-2">
              <div class="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
                <div class="w-9 h-9 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <AppIcon name="IconFileText" class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-neutral-800 truncate">{{ inspection?.id }}-年检记录表.pdf</div>
                  <div class="text-[11px] text-neutral-500">签字扫描件 · 2.4MB · 张师傅</div>
                </div>
                <button class="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50">
                  <AppIcon name="IconDownload" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showActions" class="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <button type="button" class="btn-secondary text-xs">
            <AppIcon name="IconDownload" class="w-4 h-4 mr-1.5" />
            导出报告
          </button>
          <button
            v-if="relatedRectification"
            type="button"
            class="btn-secondary text-xs"
            @click="$emit('create-rectification', inspection); goToRect()"
          >
            <AppIcon name="IconWrench" class="w-4 h-4 mr-1.5" />
            查看整改单
          </button>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button v-if="canApprove" type="button" class="btn-success text-xs" @click="$emit('review', inspection, 'approve')">
            <AppIcon name="IconCheck" class="w-4 h-4 mr-1.5" />
            审核通过
          </button>
          <button
            v-if="canCreateRect && inspection && inspection.failItems.length > 0"
            type="button"
            class="btn-primary text-xs"
            @click="$emit('review', inspection, 'to_rect')"
          >
            <AppIcon name="IconWrench" class="w-4 h-4 mr-1.5" />
            派发整改单
          </button>
          <button v-if="canReview" type="button" class="btn-warning text-xs">
            <AppIcon name="IconEdit" class="w-4 h-4 mr-1.5" />
            退回补充
          </button>
          <button type="button" class="btn-ghost text-xs" @click="$emit('close')">
            关闭
          </button>
        </div>
      </div>
      <div v-else class="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
        <button type="button" class="btn-secondary text-xs">
          <AppIcon name="IconDownload" class="w-4 h-4 mr-1.5" />
          导出报告
        </button>
        <button type="button" class="btn-primary text-xs" @click="$emit('close')">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '~/stores/app'
import type { InspectionRecord, UserRole, TimelineEvent } from '~/types'

interface Props {
  inspection: InspectionRecord | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'review', insp: InspectionRecord, action: 'approve' | 'reject' | 'to_rect'): void
  (e: 'create-rectification', insp: InspectionRecord): void
}>()

const appStore = useAppStore()
const router = useRouter()

const activeTab = ref<'items' | 'conclusion' | 'evidence'>('items')

watch(() => props.inspection, (n) => {
  if (n) activeTab.value = n.failItems.length > 0 ? 'conclusion' : 'items'
}, { immediate: true })

const groupedCriteria = computed(() => {
  if (!props.inspection) return []
  const groupsMap = new Map<string, any[]>()
  props.inspection.items.forEach(item => {
    const c = appStore.getCriterion(item.criterionId)
    if (!c) return
    if (!groupsMap.has(c.category)) groupsMap.set(c.category, [])
    groupsMap.get(c.category)!.push({ criterion: c, result: item })
  })
  return Array.from(groupsMap.entries()).map(([category, items]) => ({
    category,
    items,
    stats: {
      pass: items.filter((i: any) => i.result.result === 'pass').length,
      fail: items.filter((i: any) => i.result.result === 'fail').length,
      na: items.filter((i: any) => i.result.result === 'na').length
    }
  }))
})

const timelineEvents = computed<TimelineEvent[]>(() =>
  props.inspection ? appStore.getTimeline(props.inspection.id) : []
)

const relatedRectification = computed(() =>
  props.inspection ? appStore.getRectificationByInspection(props.inspection.id) : null
)

const showActions = computed(() =>
  appStore.currentRole === 'project_manager' || appStore.currentRole === 'customer_service'
)

const canApprove = computed(() =>
  appStore.currentRole === 'project_manager' && props.inspection?.status === 'under_review'
)

const canCreateRect = computed(() =>
  appStore.currentRole === 'project_manager' &&
  (props.inspection?.status === 'non_compliant' || props.inspection?.status === 'under_review') &&
  !relatedRectification.value
)

const canReview = computed(() =>
  appStore.currentRole === 'customer_service' && props.inspection?.status === 'under_review'
)

const tabs = computed(() => {
  const base = [
    { key: 'items' as const, label: '逐项检测明细', icon: 'IconClipboard' },
    { key: 'conclusion' as const, label: '结论与责任追踪', icon: 'IconFileText', badge: props.inspection?.failItems.length || undefined },
    { key: 'evidence' as const, label: '附件与证据', icon: 'IconPaperclip' }
  ]
  return base
})

function eventDotStyle(role: UserRole) {
  return {
    technician: 'bg-warning-500',
    customer_service: 'bg-primary-500',
    project_manager: 'bg-success-600'
  }[role] || 'bg-neutral-500'
}

function roleBadgeStyle(role: UserRole) {
  return 'badge badge-' + ({
    technician: 'warning',
    customer_service: 'primary',
    project_manager: 'success'
  }[role] || 'neutral')
}

function roleLabel(role: UserRole) {
  return { technician: '维保技师', customer_service: '客服专员', project_manager: '项目主管' }[role] || role
}

function eventIcon(e: TimelineEvent) {
  if (e.action.includes('整改')) return 'IconWrench'
  if (e.action.includes('复查') || e.action.includes('闭环')) return 'IconCheckCircle'
  if (e.action.includes('通知') || e.action.includes('同步')) return 'IconMessage'
  if (e.action.includes('派单')) return 'IconUser'
  return 'IconClipboard'
}

function formatTime(t: string) {
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function goToRect() {
  if (relatedRectification.value) {
    appStore.setSelectedRectification(relatedRectification.value.id)
    router.push('/rectification')
  }
}
</script>
