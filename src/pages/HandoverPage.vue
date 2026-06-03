<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FileCheck, MessageSquare, AlertTriangle, Clock, Users, UtensilsCrossed, ChefHat, Download } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useHandover } from '@/composables/useApi'
import type { HandoverItem } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const { getHandover } = useHandover()

const handoverItems = ref<HandoverItem[]>([])
const loading = ref(true)
const filterRole = ref<string>('all')

const roleLabels: Record<string, string> = {
  all: '全部角色',
  sales: '宴会销售',
  hall: '厅面主管',
  kitchen: '后厨统筹',
}

const roleIcons: Record<string, any> = {
  sales: Users,
  hall: UtensilsCrossed,
  kitchen: ChefHat,
}

const typeConfig: Record<string, { label: string; icon: any; bgClass: string; textClass: string }> = {
  reconciliation: {
    label: '待核对',
    icon: FileCheck,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
  },
  reconciliation_difference: {
    label: '待处理差异',
    icon: AlertTriangle,
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
  },
  feedback: {
    label: '待填反馈',
    icon: MessageSquare,
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
  },
}

const filteredItems = computed(() => {
  if (filterRole.value === 'all') return handoverItems.value
  return handoverItems.value.filter((item) => item.role === filterRole.value)
})

const groupedByRole = computed(() => {
  const groups: Record<string, HandoverItem[]> = {
    sales: [],
    hall: [],
    kitchen: [],
  }
  for (const item of filteredItems.value) {
    if (!groups[item.role]) groups[item.role] = []
    groups[item.role].push(item)
  }
  return groups
})

const roleStats = computed(() => {
  const stats: Record<string, { total: number; overdue: number }> = {}
  for (const role of ['sales', 'hall', 'kitchen']) {
    const items = handoverItems.value.filter((i) => i.role === role)
    stats[role] = {
      total: items.length,
      overdue: items.filter((i) => i.remainingHours !== null && i.remainingHours < 0).length,
    }
  }
  return stats
})

function formatRemainingHours(hours: number | null) {
  if (hours === null) return '无时效'
  if (hours < 0) return `已超时 ${Math.abs(hours).toFixed(1)} 小时`
  return `剩余 ${hours.toFixed(1)} 小时`
}

function getStatusColor(hours: number | null) {
  if (hours === null) return 'text-slate-500'
  if (hours < 0) return 'text-red-600'
  if (hours < 12) return 'text-amber-600'
  return 'text-emerald-600'
}

function handleItemClick(item: HandoverItem) {
  if (item.type === 'feedback' && item.feedbackId) {
    router.push({ path: `/feedbacks/${item.feedbackId}`, query: { role: item.role } })
  } else if (item.reconciliationId) {
    router.push({ path: `/reconciliations/${item.reconciliationId}`, query: { itemId: item.itemId } })
  }
}

function exportHandover() {
  let content = '酒店宴会部交班报告\n'
  content += `生成时间：${new Date().toLocaleString('zh-CN')}\n`
  content += '='.repeat(50) + '\n\n'

  for (const [role, items] of Object.entries(groupedByRole.value)) {
    if (items.length === 0) continue
    content += `【${roleLabels[role]}】待办事项 (${items.length}项)\n`
    content += '-'.repeat(50) + '\n'
    for (const item of items) {
      const typeLabel = typeConfig[item.type]?.label || item.type
      const timeStatus = formatRemainingHours(item.remainingHours)
      content += `• ${item.eventName} - ${item.description || typeLabel}\n`
      content += `  状态：${typeLabel} | ${timeStatus}\n`
      if (item.name) content += `  当前处理人：${item.name}\n`
      content += '\n'
    }
    content += '\n'
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `交班报告_${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

async function loadData() {
  loading.value = true
  try {
    const res = await getHandover()
    if (res.success) {
      handoverItems.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-8">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800 mb-1">交班视图</h2>
        <p class="text-slate-500">未完结事项汇总，明确责任人和时效，确保交班无缝衔接</p>
      </div>
      <button
        @click="exportHandover"
        class="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
      >
        <Download class="w-4 h-4" />
        导出交班报告
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div
        v-for="role in ['sales', 'hall', 'kitchen']"
        :key="role"
        class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 cursor-pointer transition-all hover:border-amber-300"
        @click="filterRole = filterRole === role ? 'all' : role"
        :class="{ 'ring-2 ring-amber-500': filterRole === role }"
      >
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
            <component :is="roleIcons[role]" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-slate-800 font-semibold">{{ roleLabels[role] }}</h3>
            <p class="text-slate-500 text-sm">{{ roleStats[role].total }} 项待办</p>
          </div>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-slate-500">待处理</span>
          <span class="font-semibold text-slate-700">{{ roleStats[role].total - roleStats[role].overdue }}</span>
          <span class="text-slate-300">|</span>
          <span class="text-red-500">已超时</span>
          <span class="font-semibold text-red-600">{{ roleStats[role].overdue }}</span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Clock class="w-5 h-5 text-slate-400" />
          <span class="text-slate-600">当前筛选：</span>
          <select
            v-model="filterRole"
            class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="all">全部角色</option>
            <option value="sales">宴会销售</option>
            <option value="hall">厅面主管</option>
            <option value="kitchen">后厨统筹</option>
          </select>
        </div>
        <span class="text-slate-500 text-sm">
          共 {{ filteredItems.length }} 项待办
        </span>
      </div>

      <div class="p-6">
        <div v-if="loading" class="text-center py-16 text-slate-500">
          加载中...
        </div>
        <div v-else-if="filteredItems.length === 0" class="text-center py-16">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileCheck class="w-8 h-8 text-slate-400" />
          </div>
          <p class="text-slate-600 font-medium">暂无待办事项</p>
          <p class="text-slate-400 text-sm mt-1">所有工作都已完成</p>
        </div>
        <div v-else>
          <div v-for="(items, role) in groupedByRole" :key="role" class="mb-8 last:mb-0">
            <div v-if="items.length > 0" class="flex items-center gap-3 mb-4">
              <component :is="roleIcons[role as string]" class="w-5 h-5 text-slate-500" />
              <h4 class="text-lg font-semibold text-slate-700">
                {{ roleLabels[role as string] }}
                <span class="text-sm font-normal text-slate-400 ml-2">({{ items.length }}项)</span>
              </h4>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-200">
                    <th class="text-left py-3 px-4 text-slate-500 font-medium text-sm">活动名称</th>
                    <th class="text-left py-3 px-4 text-slate-500 font-medium text-sm">事项类型</th>
                    <th class="text-left py-3 px-4 text-slate-500 font-medium text-sm">描述</th>
                    <th class="text-left py-3 px-4 text-slate-500 font-medium text-sm">当前处理人</th>
                    <th class="text-left py-3 px-4 text-slate-500 font-medium text-sm">时效状态</th>
                    <th class="text-left py-3 px-4 text-slate-500 font-medium text-sm">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in items"
                    :key="item.itemId || item.sectionId"
                    class="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    @click="handleItemClick(item)"
                  >
                    <td class="py-4 px-4">
                      <span class="font-medium text-slate-800">{{ item.eventName }}</span>
                    </td>
                    <td class="py-4 px-4">
                      <span
                        :class="['px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1', typeConfig[item.type]?.bgClass, typeConfig[item.type]?.textClass]"
                      >
                        <component :is="typeConfig[item.type]?.icon" class="w-3 h-3" />
                        {{ typeConfig[item.type]?.label }}
                      </span>
                    </td>
                    <td class="py-4 px-4 text-slate-600">
                      {{ item.description || '-' }}
                    </td>
                    <td class="py-4 px-4 text-slate-600">
                      {{ item.name || '待认领' }}
                    </td>
                    <td class="py-4 px-4">
                      <span :class="['font-medium text-sm', getStatusColor(item.remainingHours)]">
                        {{ formatRemainingHours(item.remainingHours) }}
                      </span>
                    </td>
                    <td class="py-4 px-4">
                      <button class="text-amber-600 hover:text-amber-700 text-sm font-medium">
                        前往处理
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
