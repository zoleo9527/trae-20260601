<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Check, ChevronRight, CheckSquare, Square, Loader2 } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useReconciliations } from '@/composables/useApi'
import type { Reconciliation, ReconciliationItem } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const { getReconciliations, batchConfirm } = useReconciliations()

const reconciliations = ref<Reconciliation[]>([])
const loading = ref(true)
const searchQuery = ref('')
const activeTab = ref('pending')
const selectedItems = ref<Set<string>>(new Set())
const batchLoading = ref(false)

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待核对' },
  { key: 'confirmed', label: '已完成' },
]

const filteredReconciliations = computed(() => {
  let result = reconciliations.value

  if (activeTab.value === 'pending') {
    result = result.filter((r) => !r.all_confirmed)
  } else if (activeTab.value === 'confirmed') {
    result = result.filter((r) => r.all_confirmed)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (r) =>
        r.event_name?.toLowerCase().includes(q) ||
        r.client_name?.toLowerCase().includes(q)
    )
  }

  return result
})

const selectedItemsForCurrentRole = computed(() => {
  const items: { itemId: string; reconciliationId: string }[] = []
  for (const r of reconciliations.value) {
    if (r.items) {
      for (const item of r.items) {
        if (selectedItems.value.has(item.id) && !isItemConfirmedByCurrentRole(item)) {
          items.push({ itemId: item.id, reconciliationId: r.id })
        }
      }
    }
  }
  return items
})

function isItemConfirmedByCurrentRole(item: ReconciliationItem) {
  if (!item.confirmations || !userStore.user) return false
  const conf = item.confirmations.find((c) => c.role === userStore.user?.role)
  return conf?.confirmed === 1
}

function getStatusLabel(reconciliation: Reconciliation) {
  if (reconciliation.all_confirmed) return { text: '已完成', class: 'bg-emerald-100 text-emerald-700' }
  return { text: '核对中', class: 'bg-amber-100 text-amber-700' }
}

function getItemStatusInfo(item: ReconciliationItem) {
  if (item.status === 'confirmed') return { text: '已确认', class: 'text-emerald-600' }
  if (item.status === 'difference_confirmed') return { text: '差异已确认', class: 'text-amber-600' }
  if (item.status === 'difference') return { text: '有差异', class: 'text-red-600' }
  if (isItemConfirmedByCurrentRole(item)) return { text: '我已确认', class: 'text-blue-600' }
  return { text: '待确认', class: 'text-slate-500' }
}

function getConfirmationProgress(item: ReconciliationItem) {
  if (!item.confirmations) return { confirmed: 0, total: 3 }
  const confirmed = item.confirmations.filter((c) => c.confirmed === 1).length
  return { confirmed, total: item.confirmations.length }
}

function toggleItem(item: ReconciliationItem) {
  if (isItemConfirmedByCurrentRole(item)) return
  if (selectedItems.value.has(item.id)) {
    selectedItems.value.delete(item.id)
  } else {
    selectedItems.value.add(item.id)
  }
  selectedItems.value = new Set(selectedItems.value)
}

function selectAllVisible() {
  for (const r of filteredReconciliations.value) {
    if (r.items) {
      for (const item of r.items) {
        if (!isItemConfirmedByCurrentRole(item)) {
          selectedItems.value.add(item.id)
        }
      }
    }
  }
  selectedItems.value = new Set(selectedItems.value)
}

function clearSelection() {
  selectedItems.value.clear()
  selectedItems.value = new Set(selectedItems.value)
}

async function handleBatchConfirm() {
  if (selectedItemsForCurrentRole.value.length === 0 || !userStore.user) return

  const itemsByReconciliation = new Map<string, string[]>()
  for (const item of selectedItemsForCurrentRole.value) {
    if (!itemsByReconciliation.has(item.reconciliationId)) {
      itemsByReconciliation.set(item.reconciliationId, [])
    }
    itemsByReconciliation.get(item.reconciliationId)!.push(item.itemId)
  }

  batchLoading.value = true
  try {
    for (const [reconciliationId, itemIds] of itemsByReconciliation) {
      await batchConfirm({
        itemIds,
        reconciliationId,
        role: userStore.user.role,
        name: userStore.user.name,
      })
    }
    clearSelection()
    await loadData()
  } finally {
    batchLoading.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await getReconciliations()
    if (res.success) {
      reconciliations.value = res.data
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
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-slate-800 mb-1">尾款核对</h2>
      <p class="text-slate-500">逐项核对活动款项，三角色确认后自动激活客户反馈</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
      <div class="p-6 border-b border-slate-100">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              :class="activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="relative">
            <Search class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索活动名称、客户名..."
              class="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-72 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        <div
          v-if="activeTab === 'pending' && selectedItemsForCurrentRole.length > 0"
          class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <CheckSquare class="w-5 h-5 text-amber-600" />
            <span class="text-amber-800 font-medium">
              已选择 {{ selectedItemsForCurrentRole.length }} 项待确认
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="clearSelection"
              class="text-amber-700 text-sm font-medium hover:text-amber-800"
            >
              取消选择
            </button>
            <button
              @click="selectAllVisible"
              class="text-amber-700 text-sm font-medium hover:text-amber-800"
            >
              全选可见
            </button>
            <button
              @click="handleBatchConfirm"
              :disabled="batchLoading"
              class="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Loader2 v-if="batchLoading" class="w-4 h-4 animate-spin" />
              <Check v-else class="w-4 h-4" />
              批量确认
            </button>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div v-if="loading" class="text-center py-16 text-slate-500">
          加载中...
        </div>
        <div v-else-if="filteredReconciliations.length === 0" class="text-center py-16">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search class="w-8 h-8 text-slate-400" />
          </div>
          <p class="text-slate-600 font-medium">暂无核对记录</p>
          <p class="text-slate-400 text-sm mt-1">切换标签或调整搜索条件</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="reconciliation in filteredReconciliations"
            :key="reconciliation.id"
            class="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors"
          >
            <div
              class="p-5 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
              @click="router.push(`/reconciliations/${reconciliation.id}`)"
            >
              <div class="flex items-center gap-4">
                <div>
                  <h4 class="text-slate-800 font-semibold text-lg">{{ reconciliation.event_name }}</h4>
                  <p class="text-slate-500 text-sm mt-0.5">
                    {{ reconciliation.client_name }} · {{ formatDate(reconciliation.event_date!) }} · {{ reconciliation.venue }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <span :class="['px-3 py-1 rounded-full text-xs font-medium', getStatusLabel(reconciliation).class]">
                  {{ getStatusLabel(reconciliation).text }}
                </span>
                <ChevronRight class="w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div v-if="reconciliation.items" class="px-5 py-3 border-t border-slate-100">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="item in reconciliation.items"
                  :key="item.id"
                  class="flex items-center justify-between p-3 rounded-lg"
                  :class="isItemConfirmedByCurrentRole(item) ? 'bg-slate-50' : 'bg-white border border-slate-100 hover:border-amber-300 cursor-pointer'"
                  @click.stop="!isItemConfirmedByCurrentRole(item) && toggleItem(item)"
                >
                  <div class="flex items-center gap-3">
                    <div v-if="!isItemConfirmedByCurrentRole(item)" class="text-slate-300">
                      <CheckSquare
                        v-if="selectedItems.has(item.id)"
                        class="w-5 h-5 text-amber-500"
                      />
                      <Square v-else class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-slate-700 font-medium">{{ item.description }}</p>
                      <p class="text-slate-400 text-xs mt-0.5">
                        {{ getConfirmationProgress(item).confirmed }}/{{ getConfirmationProgress(item).total }} 方已确认
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-slate-800 font-semibold">¥{{ item.expected_amount.toLocaleString() }}</p>
                    <p :class="['text-xs mt-0.5', getItemStatusInfo(item).class]">
                      {{ getItemStatusInfo(item).text }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
