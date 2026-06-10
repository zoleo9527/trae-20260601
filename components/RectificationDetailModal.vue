<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div class="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-lg font-bold text-neutral-800">{{ record?.id }} · 整改详情</h2>
            <StatusBadge v-if="record" type="rectification" :status="record.status" />
            <StatusBadge v-if="record" type="priority" :status="record.priority" />
          </div>
          <div class="mt-1.5 flex items-center gap-4 flex-wrap text-xs text-neutral-500">
            <span class="flex items-center gap-1">
              <AppIcon name="IconMapPin" class="w-3.5 h-3.5" />
              {{ record?.elevatorName }} · {{ record?.location }}
            </span>
            <span class="flex items-center gap-1">
              <AppIcon name="IconWrench" class="w-3.5 h-3.5" />
              整改人：{{ record?.assignedTo }}
            </span>
            <span class="flex items-center gap-1">
              <AppIcon name="IconClipboard" class="w-3.5 h-3.5" />
              来源年检：
              <span
                class="text-primary-700 font-medium hover:underline cursor-pointer"
                @click.stop="goInspection"
              >{{ record?.inspectionId }}</span>
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
        </button>
      </div>

      <div class="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div v-if="activeTab === 'measures'" class="space-y-5">
          <div
            v-for="(measure, idx) in record?.rectificationMeasures"
            :key="measure.id"
            class="rounded-xl border overflow-hidden"
            :class="{
              'border-success-200': isMeasureDone(measure),
              'border-warning-200': isMeasureDoing(measure),
              'border-neutral-200': isMeasureTodo(measure)
            }"
          >
            <div
              class="flex items-start gap-3 p-4"
              :class="{
                'bg-success-50': isMeasureDone(measure),
                'bg-amber-50': isMeasureDoing(measure),
                'bg-gray-50': isMeasureTodo(measure)
              }"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
                :class="{
                  'bg-success-500 text-white': isMeasureDone(measure),
                  'bg-warning-500 text-white animate-pulse': isMeasureDoing(measure),
                  'bg-neutral-300 text-white': isMeasureTodo(measure)
                }"
              >
                {{ isMeasureDone(measure) ? '✓' : idx + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm font-semibold text-neutral-800">{{ measure.itemName }}</h3>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full"
                    :class="{
                      'bg-success-100 text-success-700': isMeasureDone(measure),
                      'bg-warning-100 text-warning-700': isMeasureDoing(measure),
                      'bg-neutral-100 text-neutral-600': isMeasureTodo(measure)
                    }"
                  >
                    {{ isMeasureDone(measure) ? '已完成' : isMeasureDoing(measure) ? '进行中' : '待开始' }}
                  </span>
                </div>
                <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div class="rounded-md bg-white p-3 border border-red-200">
                    <div class="text-[10px] font-bold text-danger-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AppIcon name="IconAlertTriangle" class="w-3 h-3" />
                      原始问题（年检不合格原因）
                    </div>
                    <div class="text-neutral-700 leading-relaxed">{{ measure.originalProblem }}</div>
                  </div>
                  <div class="rounded-md bg-white p-3 border border-blue-200">
                    <div class="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AppIcon name="IconWrench" class="w-3 h-3" />
                      整改措施（怎么做的）
                    </div>
                    <div class="text-neutral-700 leading-relaxed">
                      {{ measure.measure || '— 整改中，稍后更新 —' }}
                    </div>
                  </div>
                </div>

                <div v-if="measure.measure" class="mt-3 flex flex-wrap gap-4 text-xs">
                  <div class="flex items-center gap-1.5 text-neutral-600">
                    <AppIcon name="IconUser" class="w-3.5 h-3.5 text-warning-500" />
                    执行：<span class="font-medium text-neutral-800">{{ measure.operator || '—' }}</span>
                  </div>
                  <div v-if="measure.completedAt" class="flex items-center gap-1.5 text-neutral-600">
                    <AppIcon name="IconCalendar" class="w-3.5 h-3.5 text-success-500" />
                    完成：<span class="font-medium text-neutral-800">{{ formatDateTime(measure.completedAt) }}</span>
                  </div>
                  <div v-if="measure.remark" class="w-full mt-1 rounded-md bg-neutral-50 p-2 border border-neutral-200 text-neutral-700">
                    <span class="font-medium text-neutral-500">备注：</span>{{ measure.remark }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="record && getCompletedCount(record) === record.failItems.length && record.status !== 'closed' && record.status !== 'passed'" class="rounded-xl border-2 border-dashed border-success-300 bg-green-50 p-5 text-center">
            <AppIcon name="IconCheckCircle" class="w-10 h-10 mx-auto text-success-500" />
            <p class="text-sm font-semibold text-success-800 mt-2">所有整改措施已完成</p>
            <p class="text-xs text-success-700 mt-1">请{{ appStore.currentRole === 'technician' ? '先自测再提交主管复查' : '安排现场复查并签署结论' }}</p>
          </div>
        </div>

        <div v-if="activeTab === 'recheck'" class="space-y-5">
          <div v-if="record?.recheckResults && record.recheckResults.length" class="space-y-4">
            <div
              v-for="(recheck, idx) in record.recheckResults"
              :key="recheck.id"
              class="card overflow-hidden"
              :class="recheck.result === 'pass' ? 'border-success-300' : 'border-danger-300'"
            >
              <div
                class="px-5 py-3 flex items-center justify-between gap-3 border-b"
                :class="recheck.result === 'pass' ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center"
                    :class="recheck.result === 'pass' ? 'bg-success-500 text-white' : 'bg-danger-500 text-white'"
                  >
                    <AppIcon :name="recheck.result === 'pass' ? 'IconCheck' : 'IconXCircle'" class="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div class="text-sm font-semibold" :class="recheck.result === 'pass' ? 'text-success-800' : 'text-danger-800'">
                      第 {{ idx + 1 }} 次复查 · {{ recheck.result === 'pass' ? '复查通过' : '复查未通过' }}
                    </div>
                    <div class="text-[11px]" :class="recheck.result === 'pass' ? 'text-success-700' : 'text-danger-700'">
                      复查人：{{ recheck.rechecker }} · {{ formatDateTime(recheck.recheckDate) }}
                    </div>
                  </div>
                </div>
                <span class="badge-success">{{ roleLabel(recheck.recheckerRole) }}</span>
              </div>
              <div class="p-5 space-y-4">
                <div>
                  <h4 class="text-xs font-semibold text-neutral-600 mb-2">逐项复查结论</h4>
                  <div class="space-y-1.5">
                    <div
                      v-for="(item, i) in recheck.items"
                      :key="i"
                      class="flex items-center gap-2 p-2 rounded-md text-xs"
                      :class="item.result === 'pass' ? 'bg-success-50' : 'bg-danger-50'"
                    >
                      <span
                        class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                        :class="item.result === 'pass' ? 'bg-success-500' : 'bg-danger-500'"
                      >
                        {{ item.result === 'pass' ? '✓' : '✗' }}
                      </span>
                      <span class="font-medium text-neutral-800 flex-1">{{ item.itemName }}</span>
                      <span v-if="item.note" class="text-neutral-600 max-w-[50%] truncate" :title="item.note">{{ item.note }}</span>
                    </div>
                  </div>
                </div>
                <div class="rounded-lg bg-neutral-50 p-3 border border-neutral-200">
                  <div class="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">主管综合结论</div>
                  <div class="text-sm text-neutral-800 leading-relaxed">{{ recheck.overallConclusion }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="card p-8 text-center">
            <div class="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto">
              <AppIcon name="IconEye" class="w-6 h-6 text-neutral-400" />
            </div>
            <p class="text-sm font-medium text-neutral-700 mt-3">尚未进行复查</p>
            <p class="text-xs text-neutral-500 mt-1">{{ getCompletedCount(record) === record?.failItems.length ? '整改措施已全部完成，主管可安排现场复查' : '请先完成所有整改措施再提交复查' }}</p>
          </div>
        </div>

        <div v-if="activeTab === 'chain'" class="space-y-5">
          <div class="card p-5">
            <h3 class="text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <AppIcon name="IconUsers" class="w-4 h-4 text-primary-600" />
              完整责任链条（年检 → 整改 → 闭环）
            </h3>
            <div class="relative pl-7 space-y-5">
              <div class="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gradient-to-b from-primary-400 via-warning-400 to-success-500"></div>
              <div
                v-for="(event, i) in fullTimeline"
                :key="event.id + i"
                class="relative"
              >
                <div
                  class="absolute -left-7 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center mt-0.5 shadow"
                  :class="eventColor(event.actorRole)"
                >
                  <AppIcon :name="eventIcon(event)" class="w-3 h-3 text-white" />
                </div>
                <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-semibold text-neutral-800">{{ event.action }}</div>
                      <div v-if="event.detail" class="text-xs text-neutral-600 mt-1 leading-relaxed">{{ event.detail }}</div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <span :class="roleBadge(event.actorRole)">{{ roleLabel(event.actorRole) }}</span>
                      <span class="text-[11px] text-neutral-500 font-mono whitespace-nowrap">{{ formatDateTime(event.timestamp) }}</span>
                    </div>
                  </div>
                  <div class="mt-2 text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
                    责任人：<span class="font-semibold text-neutral-700">{{ event.actor }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <h3 class="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <AppIcon name="IconCheckCircle" class="w-4 h-4 text-success-600" />
              闭环归档条件核对
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div v-for="(c, i) in closureChecklist" :key="i" class="flex items-start gap-2.5 p-2.5 rounded-lg" :class="c.done ? 'bg-success-50' : 'bg-neutral-50'">
                <span
                  class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  :class="c.done ? 'bg-success-500 text-white' : 'bg-neutral-300 text-white'"
                >
                  {{ c.done ? '✓' : '—' }}
                </span>
                <div>
                  <div class="font-medium" :class="c.done ? 'text-success-800' : 'text-neutral-500'">{{ c.label }}</div>
                  <div class="text-[11px] mt-0.5" :class="c.done ? 'text-success-600' : 'text-neutral-400'">{{ c.desc }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <button type="button" class="btn-secondary text-xs">
            <AppIcon name="IconDownload" class="w-4 h-4 mr-1.5" />
            导出整改报告
          </button>
          <button type="button" class="btn-secondary text-xs" @click.stop="goInspection">
            <AppIcon name="IconClipboard" class="w-4 h-4 mr-1.5" />
            查看年检报告
          </button>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            v-if="appStore.currentRole === 'technician' && canSubmitRecheck(record)"
            type="button"
            class="btn-primary text-xs"
            @click="submitRecheckRequest"
          >
            <AppIcon name="IconArrowRight" class="w-4 h-4 mr-1.5" />
            提交主管复查
          </button>
          <button
            v-if="appStore.currentRole === 'project_manager' && record?.status === 'recheck'"
            type="button"
            class="btn-danger text-xs"
            @click="$emit('recheck', record, 'fail')"
          >
            <AppIcon name="IconXCircle" class="w-4 h-4 mr-1.5" />
            复查不通过
          </button>
          <button
            v-if="appStore.currentRole === 'project_manager' && record?.status === 'recheck'"
            type="button"
            class="btn-success text-xs"
            @click="$emit('recheck', record, 'pass')"
          >
            <AppIcon name="IconCheck" class="w-4 h-4 mr-1.5" />
            复查通过
          </button>
          <button
            v-if="appStore.currentRole === 'project_manager' && record?.status === 'passed'"
            type="button"
            class="btn-primary text-xs"
            @click="$emit('close-loop', record)"
          >
            <AppIcon name="IconFolder" class="w-4 h-4 mr-1.5" />
            签署并闭环
          </button>
          <button type="button" class="btn-ghost text-xs" @click="$emit('close')">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import type { RectificationRecord, RectificationMeasure, UserRole, TimelineEvent } from '~/types'

interface Props {
  record: RectificationRecord | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'recheck', record: RectificationRecord, result: 'pass' | 'fail'): void
  (e: 'close-loop', record: RectificationRecord): void
}>()

const appStore = useAppStore()
const router = useRouter()

const activeTab = ref<'measures' | 'recheck' | 'chain'>('measures')

const tabs = computed(() => [
  { key: 'measures' as const, label: '整改措施明细', icon: 'IconWrench' },
  { key: 'recheck' as const, label: '复查结果', icon: 'IconEye' },
  { key: 'chain' as const, label: '责任链条与归档', icon: 'IconUsers' }
])

function isMeasureDone(m: RectificationMeasure) {
  return !!m.measure && !!m.completedAt
}
function isMeasureDoing(m: RectificationMeasure) {
  return !!m.measure && !m.completedAt
}
function isMeasureTodo(m: RectificationMeasure) {
  return !m.measure
}

function getCompletedCount(r: RectificationRecord | null | undefined) {
  if (!r) return 0
  return r.rectificationMeasures.filter(m => isMeasureDone(m)).length
}

function canSubmitRecheck(r: RectificationRecord | null | undefined) {
  return r && getCompletedCount(r) === r.failItems.length && r.status === 'in_progress'
}

function submitRecheckRequest() {
  if (!props.record) return
  appStore.updateRectificationStatus(props.record.id, 'recheck')
  const newAlert = {
    id: 'al' + Date.now(),
    type: 'recheck' as const,
    title: '整改完成待复查',
    message: `${props.record.elevatorName}整改措施已全部完成，请主管安排现场复查。`,
    description: `${props.record.assignedTo}已完成${props.record.id}的全部${props.record.failItems.length}项整改措施并提交自测，请王主管尽快安排现场复查。`,
    relatedId: props.record.id,
    relatedType: 'rectification',
    linkId: props.record.id,
    linkType: 'rectification' as const,
    priority: 'high' as const,
    isRead: false,
    createdAt: new Date().toISOString(),
    meta: {
      elevator: props.record.elevatorName,
      relatedId: props.record.id
    }
  }
  appStore.addAlert(newAlert)
  emit('close')
}

const fullTimeline = computed<TimelineEvent[]>(() => {
  if (!props.record) return []
  const base = appStore.getTimeline(props.record.inspectionId)
  const extra: TimelineEvent[] = []
  props.record.rectificationMeasures.forEach(m => {
    if (m.completedAt) {
      extra.push({
        id: 'rm-' + m.id,
        timestamp: m.completedAt,
        actor: m.operator || props.record!.assignedTo,
        actorRole: props.record!.assigneeRole,
        action: `完成整改：${m.itemName}`,
        detail: m.remark || m.measure?.slice(0, 50)
      })
    }
  })
  props.record.recheckResults?.forEach(r => {
    extra.push({
      id: 'rc-' + r.id,
      timestamp: r.recheckDate,
      actor: r.rechecker,
      actorRole: r.recheckerRole,
      action: r.result === 'pass' ? '现场复查通过' : '现场复查未通过',
      detail: r.overallConclusion?.slice(0, 50)
    })
  })
  if (props.record.closedAt && props.record.closedBy) {
    extra.push({
      id: 'cl-1',
      timestamp: props.record.closedAt,
      actor: props.record.closedBy,
      actorRole: 'project_manager',
      action: '闭环归档签署',
      detail: `责任链条完整，共 ${props.record.failItems.length} 项问题全部解决`
    })
  }
  return [...base, ...extra].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
})

const closureChecklist = computed(() => {
  if (!props.record) return []
  const allMeasuresDone = getCompletedCount(props.record) === props.record.failItems.length
  const hasRecheckPass = props.record.recheckResults?.some(r => r.result === 'pass') || false
  return [
    { done: true, label: '年检判断依据齐全', desc: '所有不合格项均有标准依据和证据' },
    { done: allMeasuresDone, label: '整改措施全部落实', desc: `${getCompletedCount(props.record)}/${props.record.failItems.length} 项有措施、有执行人、有完成时间` },
    { done: !!hasRecheckPass, label: '主管现场复查通过', desc: hasRecheckPass ? '已签署合格结论' : '待主管到现场核查签署' },
    { done: props.record.status === 'closed', label: '文档归档与签字', desc: props.record.status === 'closed' ? '已闭环归档' : '待主管最终签署闭环' }
  ]
})

function eventColor(role: UserRole) {
  return { technician: 'bg-warning-500', customer_service: 'bg-primary-500', project_manager: 'bg-success-600' }[role] || 'bg-neutral-500'
}
function roleBadge(role: UserRole) {
  return 'badge badge-' + ({ technician: 'warning', customer_service: 'primary', project_manager: 'success' }[role] || 'neutral')
}
function roleLabel(role: UserRole) {
  return { technician: '维保技师', customer_service: '客服专员', project_manager: '项目主管' }[role] || role
}
function eventIcon(e: TimelineEvent) {
  if (e.action.includes('年检')) return 'IconClipboard'
  if (e.action.includes('整改') || e.action.includes('完成')) return 'IconWrench'
  if (e.action.includes('复查')) return 'IconEye'
  if (e.action.includes('闭环') || e.action.includes('归档')) return 'IconFolder'
  if (e.action.includes('通知') || e.action.includes('同步') || e.action.includes('派')) return 'IconMessage'
  return 'IconInfo'
}

function formatDateTime(t: string) {
  const d = new Date(t)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function goInspection() {
  if (!props.record) return
  appStore.setSelectedInspection(props.record.inspectionId)
  emit('close')
  router.push('/inspection')
}
</script>
