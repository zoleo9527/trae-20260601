<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import {
  Search, Plus, Eye, Check, X, Package, Filter, ChevronDown,
  User, Clock, Building2, Users, FileText, MessageSquare,
  Warehouse, ArrowRight
} from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import UiInput from '@/components/ui/UiInput.vue'
import type { Requisition, RequisitionStatus, RequisitionTag } from '@shared/types'
import type { TimelineItem } from '@/components/ui/UiTimeline.vue'

const router = useRouter()
const store = useDataStore()

const statusFilter = ref<string>('all')
const projectFilter = ref<string>('')
const teamFilter = ref<string>('')
const searchKeyword = ref<string>('')

const detailModalOpen = ref(false)
const approveModalOpen = ref(false)
const approveType = ref<'approve' | 'reject'>('approve')
const currentReq = ref<Requisition | null>(null)
const approveRemark = ref('')

const statusOptions: { key: string; label: string; variant: RequisitionStatus | 'all' }[] = [
  { key: 'all', label: '全部', variant: 'all' },
  { key: 'pending', label: '待审批', variant: 'pending' },
  { key: 'approved', label: '已通过', variant: 'approved' },
  { key: 'issued', label: '已发料', variant: 'issued' },
  { key: 'completed', label: '已完成', variant: 'completed' },
  { key: 'rejected', label: '已驳回', variant: 'rejected' }
]

const statusBadgeMap: Record<RequisitionStatus, { variant: any; label: string }> = {
  pending: { variant: 'orange', label: '待审批' },
  approved: { variant: 'blue', label: '已通过' },
  issued: { variant: 'purple', label: '已发料' },
  completed: { variant: 'green', label: '已完成' },
  rejected: { variant: 'red', label: '已驳回' }
}

const tagStyleMap: Record<RequisitionTag, { variant: any; label: (r: Requisition) => string; class?: string }> = {
  over: {
    variant: 'orange',
    label: (r) => `超领${calcOverPercent(r)}%`,
    class: 'font-semibold'
  },
  wrong: {
    variant: 'default',
    label: () => '错领·已调换',
    class: 'italic line-through decoration-2'
  },
  supplement: {
    variant: 'yellow' as any,
    label: () => '补领领料'
  },
  normal: {
    variant: 'green',
    label: () => '正常领料'
  }
}

function calcOverPercent(r: Requisition): string {
  let totalDesign = 0, totalQty = 0
  r.items.forEach(it => {
    totalDesign += it.designQty || 0
    totalQty += it.quantity
  })
  if (totalDesign <= 0) return '0'
  return Math.round(((totalQty - totalDesign) / totalDesign) * 100).toString()
}

function isOver(r: Requisition): boolean {
  return r.tags.includes('over')
}

function isWrong(r: Requisition): boolean {
  return r.tags.includes('wrong')
}

const filteredRequisitions = computed(() => {
  return store.requisitions.filter(r => {
    if (statusFilter.value !== 'all' && r.status !== statusFilter.value) return false
    if (projectFilter.value && r.projectId !== projectFilter.value) return false
    if (teamFilter.value && r.teamId !== teamFilter.value) return false
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      const match = r.code.toLowerCase().includes(kw) ||
        r.applicant.toLowerCase().includes(kw) ||
        r.items.some(it => it.cableModel.toLowerCase().includes(kw))
      if (!match) return false
    }
    return true
  })
})

function openDetail(r: Requisition) {
  currentReq.value = r
  detailModalOpen.value = true
}

function openApprove(r: Requisition, type: 'approve' | 'reject') {
  currentReq.value = r
  approveType.value = type
  approveRemark.value = ''
  approveModalOpen.value = true
}

async function submitApprove() {
  if (!currentReq.value) return
  await store.approveRequisition(
    currentReq.value.id,
    approveType.value === 'approve',
    approveRemark.value || undefined
  )
  approveModalOpen.value = false
  currentReq.value = null
}

async function handleIssue(r: Requisition) {
  await store.issueRequisition(r.id)
}

const timelineEvents = computed<TimelineItem[]>(() => {
  if (!currentReq.value) return []
  const r = currentReq.value
  const events: TimelineItem[] = []
  events.push({
    id: 'apply',
    title: '提交领料申请',
    description: r.remark || '提交领料单申请，等待审批',
    time: r.applyTime,
    operator: r.applicant,
    color: 'blue'
  })
  if (r.approver && r.approveTime) {
    events.push({
      id: 'approve',
      title: r.status === 'rejected' ? '审批驳回' : '审批通过',
      description: r.approverRemark || (r.status === 'rejected' ? '申请被驳回' : '审批通过，等待仓库发料'),
      time: r.approveTime,
      operator: r.approver,
      color: r.status === 'rejected' ? 'red' : 'green'
    })
  }
  if (r.issuer && r.issueTime) {
    events.push({
      id: 'issue',
      title: '仓库发料',
      description: '仓库已按单发料，施工队可领取',
      time: r.issueTime,
      operator: r.issuer,
      color: 'purple'
    })
  }
  if (r.status === 'completed') {
    events.push({
      id: 'complete',
      title: '领料完成归档',
      description: '领料流程完成，记录归档',
      time: r.issueTime ? addHours(r.issueTime, 48) : r.applyTime,
      operator: '系统',
      color: 'gray'
    })
  }
  return events
})

function addHours(timeStr: string, hours: number): string {
  const d = new Date(timeStr.replace(' ', 'T'))
  d.setHours(d.getHours() + hours)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

const projectOptions = computed(() => [
  { value: '', label: '全部项目' },
  ...store.projects.map(p => ({ value: p.id, label: p.name }))
])

const teamOptions = computed(() => [
  { value: '', label: '全部班组' },
  ...store.teams.map(t => ({ value: t.id, label: t.name }))
])

onMounted(() => {
  if (store.requisitions.length === 0) {
    store.loadAll()
  }
})
</script>

<template>
  <div class="p-6 space-y-5 fade-slide">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 font-serif-sc flex items-center gap-2.5">
          <Package class="w-7 h-7 text-[#1E40AF]" />
          领料管理
        </h1>
        <p class="text-sm text-gray-500 mt-1 ml-9.5">管理施工班组线缆领料申请、审批与发料全流程</p>
      </div>
      <UiButton variant="primary" size="lg" @click="router.push('/requisitions/new')">
        <template #icon><Plus class="w-5 h-5" /></template>
        新建领料单
      </UiButton>
    </div>

    <div class="bg-white border border-gray-200 rounded-[4px] p-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-1.5 mr-2">
          <Filter class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-medium text-gray-600">状态：</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="opt in statusOptions"
            :key="opt.key"
            class="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200"
            :class="statusFilter === opt.key
              ? 'bg-[#1E40AF] text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            @click="statusFilter = opt.key"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="w-px h-6 bg-gray-200 mx-2" />

        <UiInput
          v-model="projectFilter"
          type="select"
          :options="projectOptions"
          class="w-56"
        />
        <UiInput
          v-model="teamFilter"
          type="select"
          :options="teamOptions"
          class="w-48"
        />

        <div class="flex-1 min-w-[240px]">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索单号/申请人/线缆型号..."
              class="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D4D4D8] rounded-[4px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1E40AF] focus:shadow-[0_0_0_3px_rgba(30,64,175,0.15)]"
            />
          </div>
        </div>
      </div>
    </div>

    <UiTable :data="filteredRequisitions">
      <template #headers>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[3px]" />
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">单号</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">项目 / 班组</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">线缆明细</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">标签</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">申请人 / 时间</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">审批人 / 时间</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
      </template>

      <template #row="{ item: r }">
        <td class="relative">
          <div
            v-if="isOver(r)"
            class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 -translate-x-full"
          />
        </td>
        <td
          class="px-4 py-3.5"
          :class="{
            'breath-warn bg-orange-50/60': isOver(r),
            'italic opacity-60': isWrong(r)
          }"
        >
          <a
            href="javascript:void(0)"
            class="font-mono-num text-[#4338CA] hover:text-[#1E40AF] hover:underline font-medium text-sm"
            @click="openDetail(r)"
          >
            {{ r.code }}
          </a>
        </td>
        <td class="px-4 py-3">
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 text-sm text-gray-800">
              <Building2 class="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span class="truncate max-w-[180px]" :title="store.projectName(r.projectId)">{{ store.projectName(r.projectId) }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <Users class="w-3 h-3 text-gray-400 shrink-0" />
              <span>{{ store.teamName(r.teamId) }}</span>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="space-y-1.5">
            <div
              v-for="(it, idx) in r.items"
              :key="idx"
              class="text-sm flex items-center gap-2"
            >
              <span class="font-mono-num text-gray-800">{{ it.cableModel }}</span>
              <span class="text-gray-400">×</span>
              <span
                class="font-medium"
                :class="it.overFlag ? 'text-orange-600' : 'text-gray-700'"
              >
                {{ it.quantity }}{{ it.cableName.includes('米') ? '米' : '卷' }}
              </span>
              <span v-if="it.overFlag" class="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-medium">
                超{{ Math.round(((it.quantity - (it.designQty || 0)) / (it.designQty || 1)) * 100) }}%
              </span>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="flex flex-wrap gap-1.5">
            <UiTag
              v-for="tag in r.tags"
              :key="tag"
              :variant="tagStyleMap[tag].variant as any"
              size="sm"
              :class="tagStyleMap[tag].class"
            >
              {{ tagStyleMap[tag].label(r) }}
            </UiTag>
          </div>
          <p v-if="isWrong(r)" class="text-[11px] text-gray-500 mt-1.5 italic">
            已调换关联 · {{ r.relatedId }}
          </p>
        </td>
        <td class="px-4 py-3">
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 text-sm text-gray-800">
              <User class="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{{ r.applicant }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock class="w-3 h-3 text-gray-400 shrink-0" />
              <span>{{ r.applyTime.slice(5, 16) }}</span>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <template v-if="r.approver">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-sm text-gray-800">
                <User class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{{ r.approver }}</span>
              </div>
              <div class="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock class="w-3 h-3 text-gray-400 shrink-0" />
                <span>{{ r.approveTime?.slice(5, 16) }}</span>
              </div>
            </div>
          </template>
          <span v-else class="text-xs text-gray-400">—</span>
        </td>
        <td class="px-4 py-3">
          <UiBadge :variant="statusBadgeMap[r.status].variant" size="md">
            {{ statusBadgeMap[r.status].label }}
          </UiBadge>
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center justify-center gap-1.5">
            <template v-if="r.status === 'pending'">
              <UiButton size="sm" variant="success" @click="openApprove(r, 'approve')">
                <template #icon><Check class="w-3.5 h-3.5" /></template>
                通过
              </UiButton>
              <UiButton size="sm" variant="danger" @click="openApprove(r, 'reject')">
                <template #icon><X class="w-3.5 h-3.5" /></template>
                驳回
              </UiButton>
              <UiButton size="sm" variant="ghost" @click="openDetail(r)">
                <template #icon><Eye class="w-3.5 h-3.5" /></template>
                查看
              </UiButton>
            </template>
            <template v-else-if="r.status === 'approved'">
              <UiButton size="sm" variant="primary" @click="handleIssue(r)">
                <template #icon><Warehouse class="w-3.5 h-3.5" /></template>
                仓库发料
              </UiButton>
              <UiButton size="sm" variant="ghost" @click="openDetail(r)">
                <template #icon><Eye class="w-3.5 h-3.5" /></template>
                查看
              </UiButton>
            </template>
            <template v-else>
              <UiButton size="sm" variant="secondary" @click="openDetail(r)">
                <template #icon><Eye class="w-3.5 h-3.5" /></template>
                详情
              </UiButton>
            </template>
          </div>
        </td>
      </template>
    </UiTable>

    <UiModal v-model:open="approveModalOpen" class="max-w-md">
      <template #title>
        <div class="flex items-center gap-2">
          <component
            :is="approveType === 'approve' ? Check : X"
            class="w-5 h-5"
            :class="approveType === 'approve' ? 'text-green-600' : 'text-red-600'"
          />
          <span>{{ approveType === 'approve' ? '审批通过' : '审批驳回' }}</span>
          <span v-if="currentReq" class="text-sm font-normal text-gray-500 ml-2">
            · {{ currentReq.code }}
          </span>
        </div>
      </template>

      <div class="space-y-4">
        <div
          class="p-3 rounded-[4px] text-sm"
          :class="approveType === 'approve' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'"
        >
          {{ approveType === 'approve'
            ? '确认通过此领料单？通过后仓库可进行发料操作。'
            : '确认驳回此领料单？驳回后申请人需修改后重新提交。' }}
        </div>
        <UiInput
          v-model="approveRemark"
          type="textarea"
          label="审批意见"
          :placeholder="approveType === 'approve' ? '可选：填写审批通过意见（如用量合理、同意发放等）' : '请填写驳回原因，以便申请人了解问题所在'"
          :rows="3"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="secondary" @click="approveModalOpen = false">取消</UiButton>
          <UiButton
            :variant="approveType === 'approve' ? 'success' : 'danger'"
            @click="submitApprove"
          >
            确认{{ approveType === 'approve' ? '通过' : '驳回' }}
          </UiButton>
        </div>
      </template>
    </UiModal>

    <UiModal v-model:open="detailModalOpen" class="!max-w-4xl">
      <template #title>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2.5">
            <FileText class="w-5 h-5 text-[#1E40AF]" />
            <span class="font-semibold">领料单详情</span>
            <span v-if="currentReq" class="font-mono-num text-sm text-gray-500 ml-1">
              {{ currentReq.code }}
            </span>
          </div>
          <UiBadge
            v-if="currentReq"
            :variant="statusBadgeMap[currentReq.status].variant"
            size="md"
          >
            {{ statusBadgeMap[currentReq.status].label }}
          </UiBadge>
        </div>
      </template>

      <div v-if="currentReq" class="space-y-5">
        <div
          class="rounded-[4px] p-4 border-l-4"
          :class="{
            'bg-orange-50 border-orange-500': isOver(currentReq),
            'bg-blue-50 border-[#1E40AF]': currentReq.status === 'approved',
            'bg-purple-50 border-purple-500': currentReq.status === 'issued',
            'bg-green-50 border-green-500': currentReq.status === 'completed',
            'bg-red-50 border-red-500': currentReq.status === 'rejected',
            'bg-gray-50 border-gray-400': currentReq.status === 'pending' && !isOver(currentReq)
          }"
        >
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div class="text-xs text-gray-500 mb-1">项目名称</div>
              <div class="font-medium text-gray-900 flex items-center gap-1.5">
                <Building2 class="w-3.5 h-3.5 text-gray-400" />
                {{ store.projectName(currentReq.projectId) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">施工班组</div>
              <div class="font-medium text-gray-900 flex items-center gap-1.5">
                <Users class="w-3.5 h-3.5 text-gray-400" />
                {{ store.teamName(currentReq.teamId) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">申请人</div>
              <div class="font-medium text-gray-900 flex items-center gap-1.5">
                <User class="w-3.5 h-3.5 text-gray-400" />
                {{ currentReq.applicant }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">申请时间</div>
              <div class="font-medium text-gray-900 flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-gray-400" />
                {{ currentReq.applyTime }}
              </div>
            </div>
          </div>
        </div>

        <div class="border border-gray-200 rounded-[4px] overflow-hidden">
          <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <Package class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-800">线缆明细</span>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">型号</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">名称</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">设计用量</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">申请数量</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">单位</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">差额</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(it, idx) in currentReq.items"
                :key="idx"
                :class="it.overFlag ? 'bg-orange-50/50' : ''"
              >
                <td class="px-4 py-2.5 font-mono-num text-gray-800">{{ it.cableModel }}</td>
                <td class="px-4 py-2.5 text-gray-700">{{ it.cableName }}</td>
                <td class="px-4 py-2.5 text-right text-gray-600">{{ it.designQty || 0 }}</td>
                <td class="px-4 py-2.5 text-right font-medium" :class="it.overFlag ? 'text-orange-600' : 'text-gray-900'">
                  {{ it.quantity }}
                </td>
                <td class="px-4 py-2.5 text-right text-gray-600">
                  {{ it.cableName.includes('米') ? '米' : '卷' }}
                </td>
                <td class="px-4 py-2.5 text-right font-medium" :class="(it.quantity - (it.designQty || 0)) > 0 ? 'text-orange-600' : 'text-gray-600'">
                  {{ it.quantity - (it.designQty || 0) > 0 ? '+' : '' }}{{ it.quantity - (it.designQty || 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="border border-gray-200 rounded-[4px] p-4">
            <div class="flex items-center gap-2 mb-3">
              <MessageSquare class="w-4 h-4 text-gray-500" />
              <span class="text-sm font-semibold text-gray-800">审批意见</span>
            </div>
            <template v-if="currentReq.approverRemark">
              <div class="text-sm text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-[4px]">
                {{ currentReq.approverRemark }}
              </div>
              <div class="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <User class="w-3 h-3" />
                <span>{{ currentReq.approver }}</span>
                <ArrowRight class="w-3 h-3" />
                <Clock class="w-3 h-3" />
                <span>{{ currentReq.approveTime }}</span>
              </div>
            </template>
            <p v-else class="text-sm text-gray-400 italic">暂无审批意见</p>
          </div>

          <div class="border border-gray-200 rounded-[4px] p-4">
            <div class="flex items-center gap-2 mb-3">
              <Warehouse class="w-4 h-4 text-gray-500" />
              <span class="text-sm font-semibold text-gray-800">发料信息</span>
            </div>
            <template v-if="currentReq.issuer">
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">发料人</span>
                  <span class="font-medium text-gray-800">{{ currentReq.issuer }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">发料时间</span>
                  <span class="font-medium text-gray-800">{{ currentReq.issueTime }}</span>
                </div>
                <div v-if="currentReq.relatedId" class="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span class="text-gray-500">关联单据</span>
                  <span class="font-mono-num text-[#4338CA]">{{ currentReq.relatedId }}</span>
                </div>
              </div>
            </template>
            <p v-else class="text-sm text-gray-400 italic">尚未发料</p>
          </div>
        </div>

        <div v-if="currentReq.remark" class="border border-gray-200 rounded-[4px] p-4">
          <div class="flex items-center gap-2 mb-2">
            <FileText class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-800">备注说明</span>
          </div>
          <p class="text-sm text-gray-700 leading-relaxed">{{ currentReq.remark }}</p>
        </div>

        <div class="border border-gray-200 rounded-[4px] p-4">
          <div class="flex items-center gap-2 mb-4">
            <Clock class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-800">流转时间轴</span>
          </div>
          <UiTimeline :items="timelineEvents" />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UiButton variant="secondary" @click="detailModalOpen = false">关闭</UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>
