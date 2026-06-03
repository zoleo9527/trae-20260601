<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Check, AlertCircle, Users, UtensilsCrossed, ChefHat, Clock, Loader2, X } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useReconciliations, useTimeline } from '@/composables/useApi'
import EventTimeline from '@/components/EventTimeline.vue'
import type { Reconciliation, ReconciliationItem, TimelineEntry } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { getReconciliation, confirmItem, markDifference } = useReconciliations()
const { getTimeline } = useTimeline()

const reconciliation = ref<Reconciliation | null>(null)
const timelineEntries = ref<TimelineEntry[]>([])
const loading = ref(true)
const differenceModalItem = ref<ReconciliationItem | null>(null)
const differenceAmount = ref<number>(0)
const differenceNote = ref('')
const submitting = ref(false)

const categoryLabels: Record<string, string> = {
  venue: '场地费用',
  menu: '餐饮费用',
  extra: '额外服务',
  discount: '折扣优惠',
}

const groupedItems = computed(() => {
  if (!reconciliation.value?.items) return {}
  const groups: Record<string, ReconciliationItem[]> = {}
  for (const item of reconciliation.value.items) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }
  return groups
})

const totalExpected = computed(() => {
  if (!reconciliation.value?.items) return 0
  return reconciliation.value.items.reduce((sum, item) => sum + item.expected_amount, 0)
})

const totalActual = computed(() => {
  if (!reconciliation.value?.items) return 0
  return reconciliation.value.items.reduce((sum, item) => sum + (item.actual_amount ?? item.expected_amount), 0)
})

function isItemConfirmedByCurrentRole(item: ReconciliationItem) {
  if (!item.confirmations || !userStore.user) return false
  const conf = item.confirmations.find((c) => c.role === userStore.user!.role)
  return conf?.confirmed === 1
}

function getRoleConfirmation(item: ReconciliationItem, role: string) {
  return item.confirmations?.find((c) => c.role === role)
}

function openDifferenceModal(item: ReconciliationItem) {
  differenceModalItem.value = item
  differenceAmount.value = item.expected_amount
  differenceNote.value = ''
}

function closeDifferenceModal() {
  differenceModalItem.value = null
}

async function handleConfirm(item: ReconciliationItem) {
  if (!userStore.user || !reconciliation.value) return
  submitting.value = true
  try {
    const res = await confirmItem(reconciliation.value.id, item.id, {
      role: userStore.user.role,
      name: userStore.user.name,
    })
    if (res.success) {
      await loadData()
    }
  } finally {
    submitting.value = false
  }
}

async function handleMarkDifference() {
  if (!userStore.user || !reconciliation.value || !differenceModalItem.value) return
  submitting.value = true
  try {
    const res = await markDifference(
      reconciliation.value.id,
      differenceModalItem.value.id,
      {
        actualAmount: differenceAmount.value,
        differenceNote: differenceNote.value,
        role: userStore.user.role,
        name: userStore.user.name,
      }
    )
    if (res.success) {
      closeDifferenceModal()
      await loadData()
    }
  } finally {
    submitting.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const id = route.params.id as string
    const [recRes, tlRes] = await Promise.all([
      getReconciliation(id),
      getTimeline(id),
    ])
    if (recRes.success) {
      reconciliation.value = recRes.data
    }
    if (tlRes.success) {
      timelineEntries.value = tlRes.data
    }
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <button
      @click="router.push('/reconciliations')"
      class="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
    >
      <ArrowLeft class="w-5 h-5" />
      返回核对列表
    </button>

    <div v-if="loading" class="text-center py-16 text-slate-500">
      加载中...
    </div>

    <div v-else-if="!reconciliation" class="text-center py-16 text-slate-500">
      未找到核对记录
    </div>

    <div v-else>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div class="p-6 border-b border-slate-100">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-2xl font-semibold text-slate-800 mb-1">
                {{ reconciliation.event_name }}
              </h2>
              <p class="text-slate-500">
                  {{ reconciliation.client_name }} · {{ formatDate(reconciliation.event_date!) }} · {{ reconciliation.venue }}
                </p>
            </div>
            <div class="text-right">
              <span
              :class="[
                'px-4 py-2 rounded-full text-sm font-medium',
                reconciliation.all_confirmed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700',
              ]"
            >
              {{ reconciliation.all_confirmed ? '已完成' : '核对进行中' }}
            </span>
            </div>
          </div>
        </div>

        <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100">
          <div class="text-center p-4 bg-slate-50 rounded-xl">
            <p class="text-slate-500 text-sm mb-1">应收金额</p>
            <p class="text-3xl font-bold text-slate-800">
              ¥{{ totalExpected.toLocaleString() }}
            </p>
          </div>
          <div class="text-center p-4 bg-slate-50 rounded-xl">
            <p class="text-slate-500 text-sm mb-1">实收金额</p>
            <p class="text-3xl font-bold text-slate-800">
              ¥{{ totalActual.toLocaleString() }}
            </p>
          </div>
          <div class="text-center p-4 rounded-xl" :class="totalActual === totalExpected ? 'bg-emerald-50' : 'bg-amber-50'">
            <p class="text-slate-500 text-sm mb-1">差额</p>
            <p :class="['text-3xl font-bold', totalActual === totalExpected ? 'text-emerald-600' : 'text-amber-600']">
              ¥{{ (totalActual - totalExpected).toLocaleString() }}
            </p>
          </div>
        </div>

        <div class="p-6">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">分项核对</h3>
          <div class="space-y-6">
            <div v-for="(items, category) in groupedItems" :key="category">
              <h4 class="text-slate-700 font-medium mb-3 flex items-center gap-2">
                <span class="w-1 h-4 bg-amber-500 rounded-full"></span>
                {{ categoryLabels[category as string] }}
              </h4>
              <div class="space-y-3">
                <div
                  v-for="item in items"
                  :key="item.id"
                  class="border border-slate-200 rounded-xl p-4"
                  :class="{
                    'border-emerald-200 bg-emerald-50': item.status === 'confirmed',
                    'border-red-200 bg-red-50': item.status === 'difference',
                  }"
                >
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <h5 class="text-slate-800 font-medium">{{ item.description }}</h5>
                        <span
                          v-if="item.status === 'confirmed'"
                          class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium"
                        >
                          已确认
                        </span>
                        <span
                          v-else-if="item.status === 'difference'"
                          class="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium"
                        >
                          有差异
                        </span>
                      </div>
                      <div class="flex items-center gap-6 text-sm">
                        <span class="text-slate-500">
                          应收：<span class="text-slate-700 font-medium">¥{{ item.expected_amount.toLocaleString() }}</span>
                        </span>
                        <span v-if="item.actual_amount !== null" class="text-slate-500">
                          实收：<span class="text-slate-700 font-medium">¥{{ item.actual_amount.toLocaleString() }}</span>
                        </span>
                        <span v-if="item.difference !== null && item.difference !== 0" class="text-red-600 font-medium">
                          差额：¥{{ item.difference.toLocaleString() }}
                        </span>
                      </div>
                      <p v-if="item.difference_note" class="text-slate-500 text-sm mt-2">
                        备注：{{ item.difference_note }}
                      </p>
                    </div>

                    <div class="flex items-center gap-4">
                      <div class="flex items-center gap-2">
                        <div class="flex flex-col items-center">
                          <div
                            class="w-10 h-10 rounded-lg flex items-center justify-center"
                            :class="[getRoleConfirmation(item, 'sales')?.confirmed ? 'bg-emerald-100' : 'bg-slate-100']"
                          >
                            <Users
                              class="w-5 h-5"
                              :class="[getRoleConfirmation(item, 'sales')?.confirmed ? 'text-emerald-600' : 'text-slate-400']"
                            />
                          </div>
                          <span class="text-xs text-slate-500 mt-1">销售</span>
                        </div>
                        <div class="flex flex-col items-center">
                          <div
                            class="w-10 h-10 rounded-lg flex items-center justify-center"
                            :class="[getRoleConfirmation(item, 'hall')?.confirmed ? 'bg-emerald-100' : 'bg-slate-100']"
                          >
                            <UtensilsCrossed
                              class="w-5 h-5"
                              :class="[getRoleConfirmation(item, 'hall')?.confirmed ? 'text-emerald-600' : 'text-slate-400']"
                            />
                          </div>
                          <span class="text-xs text-slate-500 mt-1">厅面</span>
                        </div>
                        <div class="flex flex-col items-center">
                          <div
                            class="w-10 h-10 rounded-lg flex items-center justify-center"
                            :class="[getRoleConfirmation(item, 'kitchen')?.confirmed ? 'bg-emerald-100' : 'bg-slate-100']"
                          >
                            <ChefHat
                              class="w-5 h-5"
                              :class="[getRoleConfirmation(item, 'kitchen')?.confirmed ? 'text-emerald-600' : 'text-slate-400']"
                            />
                          </div>
                          <span class="text-xs text-slate-500 mt-1">后厨</span>
                        </div>
                      </div>

                      <div v-if="!reconciliation.all_confirmed && userStore.user">
                        <template v-if="!isItemConfirmedByCurrentRole(item)">
                          <div class="flex flex-col gap-2">
                            <button
                              @click="handleConfirm(item)"
                              :disabled="submitting"
                              class="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                              <Check v-else class="w-4 h-4" />
                              确认无误
                            </button>
                            <button
                              @click="openDifferenceModal(item)"
                              class="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                            >
                              <AlertCircle class="w-4 h-4" />
                              标记差异
                            </button>
                          </div>
                        </template>
                        <span v-else class="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                          我已确认
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div class="p-6 border-b border-slate-100">
          <h3 class="text-lg font-semibold text-slate-800">处理时间线</h3>
        </div>
        <div class="p-6">
          <EventTimeline :entries="timelineEntries" />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="differenceModalItem"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="closeDifferenceModal"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-800">标记差异</h3>
            <button @click="closeDifferenceModal" class="text-slate-400 hover:text-slate-600">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <div class="mb-4">
              <p class="text-slate-800 font-medium mb-1">{{ differenceModalItem.description }}</p>
              <p class="text-slate-500 text-sm">应收金额：¥{{ differenceModalItem.expected_amount.toLocaleString() }}</p>
            </div>
            <div class="mb-4">
              <label class="block text-slate-700 text-sm font-medium mb-2">实收金额</label>
              <input
                v-model.number="differenceAmount"
                type="number"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div class="mb-6">
              <label class="block text-slate-700 text-sm font-medium mb-2">差异说明</label>
              <textarea
                v-model="differenceNote"
                rows="3"
                placeholder="请说明差异原因..."
                class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
              ></textarea>
            </div>
            <div class="flex gap-3">
              <button
                @click="closeDifferenceModal"
                class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                @click="handleMarkDifference"
                :disabled="submitting"
                class="flex-1 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                确认提交
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
