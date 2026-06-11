<template>
  <div v-if="record" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="$router.back()" class="w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600">
          ←
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-bold text-gray-900">{{ record.companyName }}</h1>
            <button
              @click="statusTagClicked = !statusTagClicked"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition"
              :class="[statusClass(record.currentStatus), statusTagClicked ? 'ring-2 ring-offset-1 ring-indigo-400' : '']"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="dotClass(record.currentStatus)"></span>
              {{ statusLabel(record.currentStatus) }}
            </button>
          </div>
          <p class="text-sm text-gray-500 mt-0.5">
            {{ record.recordNo }} · 由 {{ record.createUser.name }} 创建于 {{ formatDate(record.createTime) }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
          <span class="text-xs text-gray-500">当前处理人</span>
          <div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
            {{ record.currentHandler?.name?.charAt(0) || '-' }}
          </div>
          <div class="text-xs">
            <p class="font-medium text-gray-800">{{ record.currentHandler?.name || '待分配' }}</p>
            <p class="text-gray-500">{{ record.currentHandler ? roleLabel(record.currentHandlerRole!) : '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      <div class="col-span-3 space-y-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">📋 企业与租赁信息</h3>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">联系人</dt>
              <dd class="font-medium text-gray-800">{{ record.contactName }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">职务</dt>
              <dd class="text-gray-800">{{ record.contactPosition }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">电话</dt>
              <dd class="text-gray-800">{{ record.contactPhone }}</dd>
            </div>
            <div class="h-px bg-gray-100"></div>
            <div class="flex justify-between">
              <dt class="text-gray-500">楼栋</dt>
              <dd class="font-medium text-gray-800">{{ record.building }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">楼层</dt>
              <dd class="text-gray-800">{{ record.floor }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">房间</dt>
              <dd class="text-gray-800">{{ record.room }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">面积</dt>
              <dd class="text-gray-800">{{ record.area }} ㎡</dd>
            </div>
            <div class="h-px bg-gray-100"></div>
            <div class="flex justify-between">
              <dt class="text-gray-500">行业</dt>
              <dd><span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{{ record.industry }}</span></dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">用途</dt>
              <dd class="text-gray-800 text-right max-w-[140px]">{{ record.intendedUse }}</dd>
            </div>
          </dl>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">🔄 状态流转时间线</h3>
            <button @click="reviewMode = !reviewMode" class="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium">
              {{ reviewMode ? '关闭回看' : '合同审批回看' }}
            </button>
          </div>

          <div class="status-timeline">
            <div
              v-for="(h, idx) in timelineDisplay"
              :key="h.id"
              class="timeline-item cursor-pointer"
              :class="{ 'opacity-40': reviewMode && idx > reviewCutoff }"
              @click="jumpHistory = h.id"
            >
              <div
                class="timeline-dot"
                :class="dotBgClass(h.toStatus)"
              ></div>
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-medium" :class="dotTextClass(h.toStatus)">{{ statusLabel(h.toStatus) }}</span>
                    <span v-if="h.rejectReason" class="text-xs text-red-600">· 退回</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ h.operator.name }} · {{ roleLabel(h.operatorRole) }}
                  </p>
                  <p v-if="h.remark" class="text-xs text-gray-700 mt-1.5 leading-relaxed bg-gray-50 rounded p-2 border border-gray-100">
                    {{ h.remark }}
                  </p>
                  <div v-if="h.rejectReason" class="mt-2 text-xs bg-red-50 border border-red-100 rounded p-2.5">
                    <p class="text-red-700 font-medium mb-1">⚠️ 退回原因：</p>
                    <p class="text-red-600 leading-relaxed whitespace-pre-wrap">{{ h.rejectReason }}</p>
                  </div>
                </div>
                <span class="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{{ formatShort(h.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-6 space-y-4">
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="flex items-stretch border-b border-gray-200">
            <button
              @click="activeTab = 'plan'"
              class="flex-1 px-5 py-3.5 text-sm font-medium transition"
              :class="activeTab === 'plan'
                ? 'text-indigo-700 bg-indigo-50/60 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              📄 租赁方案
              <span
                class="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                :class="planBadge.cls"
              >
                {{ planBadge.label }}
              </span>
            </button>
            <button
              @click="activeTab = 'contract'"
              class="flex-1 px-5 py-3.5 text-sm font-medium transition"
              :class="activeTab === 'contract'
                ? 'text-indigo-700 bg-indigo-50/60 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              📑 合同审批
              <span
                class="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                :class="contractBadge.cls"
              >
                {{ contractBadge.label }}
              </span>
            </button>
            <button
              @click="activeTab = 'decoration'"
              class="flex-1 px-5 py-3.5 text-sm font-medium transition"
              :class="activeTab === 'decoration'
                ? 'text-indigo-700 bg-indigo-50/60 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              🏗️ 装修进场
              <span
                class="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                :class="decorationBadge.cls"
              >
                {{ decorationBadge.label }}
              </span>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <template v-if="activeTab === 'plan'">
              <PlanSection :record="record" @action="handlePlanAction" />

              <div v-if="showPlanAction" class="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-4">
                <PlanActionForm
                  :mode="showPlanAction"
                  :record="record"
                  @close="showPlanAction = null"
                />
              </div>
            </template>

            <template v-else-if="activeTab === 'contract'">
              <ContractSection :record="record" @action="showContractAction = $event" />

              <div v-if="showContractAction" class="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-4">
                <ContractActionForm
                  :mode="showContractAction"
                  :record="record"
                  @close="showContractAction = null"
                />
              </div>
            </template>

            <template v-else>
              <DecorationSection :record="record" @action="showDecoAction = $event" />

              <div v-if="showDecoAction" class="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-4">
                <DecorationActionForm
                  :mode="showDecoAction"
                  :record="record"
                  @close="showDecoAction = null"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="col-span-3 space-y-4">
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900">💬 补充备注</h3>
            <span class="text-xs text-gray-400">共 {{ record.supplements.length }} 条</span>
          </div>
          <div class="p-4 space-y-3 max-h-[320px] overflow-y-auto">
            <div
              v-for="s in [...record.supplements].reverse()"
              :key="s.id"
              class="p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <div class="w-5 h-5 rounded-full" :class="avatarBg(s.authorRole)">{{ s.author.name.charAt(0) }}</div>
                  <span class="text-xs font-medium text-gray-700">{{ s.author.name }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{{ roleLabel(s.authorRole) }}</span>
                </div>
                <span class="text-[10px] text-gray-400">{{ formatShort(s.timestamp) }}</span>
              </div>
              <p class="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{{ s.content }}</p>
            </div>
            <div v-if="!record.supplements.length" class="text-center py-6 text-xs text-gray-400">暂无补充备注</div>
          </div>
          <div class="p-3 border-t border-gray-100 space-y-2 bg-white">
            <textarea
              v-model="newSupplement"
              rows="3"
              placeholder="补充备注会沉淀在本记录中，所有关联人可见"
              class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            ></textarea>
            <div class="flex items-center justify-end">
              <button
                @click="submitSupplement"
                :disabled="!newSupplement.trim()"
                class="px-3 py-1.5 text-xs rounded-lg transition"
                :class="newSupplement.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
              >
                添加备注
              </button>
            </div>
          </div>
        </div>

        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 class="text-xs font-semibold text-amber-800 mb-2">⏰ 风险提醒</h3>
          <ul class="space-y-1.5 text-xs text-amber-700">
            <li v-if="record.plan.freeRentMonths >= 3">· 免租期偏长（{{ record.plan.freeRentMonths }}个月），请确认成本测算</li>
            <li v-if="record.currentStatus === 'plan_rejected'">· 方案已退回，尽快与客户沟通后重提</li>
            <li v-if="record.currentStatus === 'contract_rejected'">· 合同已退回，请核对退回原因后修改</li>
            <li v-if="record.decoration.risks?.length">· 装修有 {{ record.decoration.risks.length }} 项风险需关注</li>
            <li v-if="record.currentStatus === 'lead_following' && !record.plan.monthlyRent">· 线索跟进超过7天未提交方案</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="py-20 text-center text-gray-400">
    记录不存在
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useLeaseStore } from '~/stores/lease'
import { getStatusMeta, getRoleLabel, USERS, getStageBadge } from '~/utils/constants'
import type { LeaseRecord, LeaseStatus, StatusHistory } from '~/types/lease'
import PlanSection from '~/components/record/PlanSection.vue'
import PlanActionForm from '~/components/record/PlanActionForm.vue'
import ContractSection from '~/components/record/ContractSection.vue'
import ContractActionForm from '~/components/record/ContractActionForm.vue'
import DecorationSection from '~/components/record/DecorationSection.vue'
import DecorationActionForm from '~/components/record/DecorationActionForm.vue'

const route = useRoute()
const router = useRouter()
const store = useLeaseStore()

const id = computed(() => String(route.params.id))
const record = computed(() => store.getRecord(id.value) as LeaseRecord)

const activeTab = ref<'plan' | 'contract' | 'decoration'>('plan')
const reviewMode = ref(false)
const statusTagClicked = ref(false)
const jumpHistory = ref<string | null>(null)
const showPlanAction = ref<string | null>(null)
const showContractAction = ref<string | null>(null)
const showDecoAction = ref<string | null>(null)
const newSupplement = ref('')

const roleLabel = getRoleLabel

const planBadge = computed(() => getStageBadge('plan', record.value?.currentStatus || 'lead_created'))
const contractBadge = computed(() => getStageBadge('contract', record.value?.currentStatus || 'lead_created'))
const decorationBadge = computed(() => getStageBadge('decoration', record.value?.currentStatus || 'lead_created'))

function handlePlanAction(mode: string) {
  if (mode === 'goto-contract-submit') {
    activeTab.value = 'contract'
    showContractAction.value = 'submit'
  } else {
    showPlanAction.value = mode
  }
}

watch(record, r => {
  if (!r) return
  const s = r.currentStatus
  if (s.includes('plan')) activeTab.value = 'plan'
  else if (s.includes('contract') || s === 'plan_approved') activeTab.value = 'contract'
  else activeTab.value = 'decoration'

  if (route.query.action === '1') {
    if (s === 'plan_pending') showPlanAction.value = 'approve'
    if (s === 'plan_rejected') showPlanAction.value = 'resubmit'
    if (s === 'contract_pending') showContractAction.value = 'approve'
    if (s === 'contract_rejected') showContractAction.value = 'resubmit'
    if (s === 'plan_approved') showContractAction.value = 'submit'
    if (s === 'decoration_pending') showDecoAction.value = 'approve'
    if (s === 'lead_following') showPlanAction.value = 'submit'
  }
}, { immediate: true })

const reviewCutoff = computed(() => {
  const hs = record.value?.statusHistory || []
  const idx = hs.findIndex(h => h.toStatus === 'contract_pending')
  return idx >= 0 ? idx : hs.length - 1
})

const timelineDisplay = computed(() => record.value?.statusHistory || [])

function statusClass(s: LeaseStatus) {
  const map: Record<LeaseStatus, string> = {
    lead_created: 'bg-gray-100 text-gray-700',
    lead_following: 'bg-blue-50 text-blue-700',
    plan_pending: 'bg-amber-50 text-amber-700',
    plan_rejected: 'bg-red-50 text-red-700',
    plan_approved: 'bg-emerald-50 text-emerald-700',
    contract_pending: 'bg-amber-50 text-amber-700',
    contract_rejected: 'bg-red-50 text-red-700',
    contract_approved: 'bg-emerald-50 text-emerald-700',
    decoration_pending: 'bg-amber-50 text-amber-700',
    decoration_approved: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-purple-50 text-purple-700'
  }
  return map[s]
}
function dotClass(s: LeaseStatus) {
  const map: Record<LeaseStatus, string> = {
    lead_created: 'bg-gray-400',
    lead_following: 'bg-blue-500',
    plan_pending: 'bg-amber-500',
    plan_rejected: 'bg-red-500',
    plan_approved: 'bg-emerald-500',
    contract_pending: 'bg-amber-500',
    contract_rejected: 'bg-red-500',
    contract_approved: 'bg-emerald-500',
    decoration_pending: 'bg-amber-500',
    decoration_approved: 'bg-emerald-500',
    completed: 'bg-purple-500'
  }
  return map[s]
}
function dotBgClass(s: LeaseStatus) {
  const map: Record<LeaseStatus, string> = {
    lead_created: 'bg-gray-400',
    lead_following: 'bg-blue-500',
    plan_pending: 'bg-amber-500',
    plan_rejected: 'bg-red-500 border-red-200',
    plan_approved: 'bg-emerald-500',
    contract_pending: 'bg-amber-500',
    contract_rejected: 'bg-red-500 border-red-200',
    contract_approved: 'bg-emerald-500',
    decoration_pending: 'bg-amber-500',
    decoration_approved: 'bg-emerald-500',
    completed: 'bg-purple-500'
  }
  return map[s]
}
function dotTextClass(s: LeaseStatus) {
  const map: Record<LeaseStatus, string> = {
    lead_created: 'text-gray-700',
    lead_following: 'text-blue-700',
    plan_pending: 'text-amber-700',
    plan_rejected: 'text-red-700',
    plan_approved: 'text-emerald-700',
    contract_pending: 'text-amber-700',
    contract_rejected: 'text-red-700',
    contract_approved: 'text-emerald-700',
    decoration_pending: 'text-amber-700',
    decoration_approved: 'text-emerald-700',
    completed: 'text-purple-700'
  }
  return map[s]
}
const statusLabel = (s: LeaseStatus) => getStatusMeta(s).label

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function formatShort(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const sameYear = d.getFullYear() === now.getFullYear()
  return `${sameYear ? '' : d.getFullYear() + '-'}${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function avatarBg(role: string) {
  const map: Record<string, string> = {
    manager: 'bg-indigo-500 text-white text-[10px] font-semibold flex items-center justify-center',
    supervisor: 'bg-sky-500 text-white text-[10px] font-semibold flex items-center justify-center',
    property_engineer: 'bg-emerald-500 text-white text-[10px] font-semibold flex items-center justify-center'
  }
  return map[role] || 'bg-gray-500 text-white text-[10px] font-semibold flex items-center justify-center'
}

function submitSupplement() {
  if (!newSupplement.value.trim()) return
  store.addSupplement(id.value, newSupplement.value.trim())
  newSupplement.value = ''
}
</script>
