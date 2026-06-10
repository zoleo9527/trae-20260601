<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOperationsStore } from '@/stores/operations'
import { useUserStore } from '@/stores/user'
import { formatDateTime, formatMoney } from '@/utils/format'
import { ROLE_LABEL, ACTION_LABEL, STATUS_LABEL } from '@/types/enums'
import {
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-vue-next'
import type { OperationLog, UserRole, OperationAction } from '@/types'

const operationsStore = useOperationsStore()
const userStore = useUserStore()

const filters = ref({
  operatorName: '',
  operatorRole: '',
  action: '',
  dateStart: '',
  dateEnd: '',
})

const expandedIds = ref<Set<string>>(new Set())
const pageSize = 10
const currentPage = ref(1)

const operators = computed(() => {
  const list = new Set<string>()
  operationsStore.logs.forEach((l) => list.add(l.operatorName))
  return Array.from(list)
})

const roles: { value: UserRole; label: string }[] = [
  { value: 'technician', label: '维保技师' },
  { value: 'customer_service', label: '客服人员' },
  { value: 'supervisor', label: '主管' },
]

const actions: { value: OperationAction; label: string }[] = [
  { value: 'create', label: '创建' },
  { value: 'submit', label: '提交' },
  { value: 'confirm_cost', label: '费用确认' },
  { value: 'reject', label: '退回' },
  { value: 'resubmit', label: '重新提交' },
  { value: 'add_supplement_note', label: '添加备注' },
  { value: 'close', label: '关闭' },
]

const filteredLogs = computed(() => {
  let result = [...operationsStore.logs]

  if (filters.value.operatorName) {
    result = result.filter((l) => l.operatorName === filters.value.operatorName)
  }
  if (filters.value.operatorRole) {
    result = result.filter((l) => l.operatorRole === filters.value.operatorRole)
  }
  if (filters.value.action) {
    result = result.filter((l) => l.action === filters.value.action)
  }
  if (filters.value.dateStart) {
    result = result.filter((l) => {
      const date = new Date(l.timestamp || l.operateTime || '')
      return date >= new Date(filters.value.dateStart)
    })
  }
  if (filters.value.dateEnd) {
    result = result.filter((l) => {
      const date = new Date(l.timestamp || l.operateTime || '')
      return date <= new Date(filters.value.dateEnd + 'T23:59:59')
    })
  }

  return result
})

const pagedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredLogs.value.slice(start, start + pageSize)
})

const totalPages = computed(() => {
  return Math.ceil(filteredLogs.value.length / pageSize)
})

function getChangeSummary(log: OperationLog): string {
  const details = log.details || {}
  const action = log.action

  switch (action) {
    case 'create':
      return `创建记录，申请金额：${formatMoney(Number(details.estimatedAmount) || 0)}`
    case 'submit':
      return '状态：草稿 → 待确认'
    case 'confirm_cost': {
      const amount = Number(details.confirmedAmount) || 0
      if (details.comment) {
        return `确认金额：${formatMoney(amount)}，备注：${details.comment}`
      }
      return `确认金额：${formatMoney(amount)}`
    }
    case 'reject':
      return `退回申请，原因：${details.reason || '未填写'}`
    case 'resubmit':
      return '状态：已退回 → 已重新提交'
    case 'add_supplement_note':
      return `补充说明：${details.content || '未填写内容'}`
    case 'close':
      return `关闭记录${details.remark ? `，备注：${details.remark}` : ''}`
    default:
      return log.detail || ACTION_LABEL[action] || action
  }
}

function getChangeDetail(log: OperationLog): string[] {
  const details = log.details || {}
  const lines: string[] = []

  switch (log.action) {
    case 'create':
      lines.push(`创建工单编号：${details.orderNo || '-'}`)
      lines.push(`申请金额：${formatMoney(Number(details.estimatedAmount) || 0)}`)
      break
    case 'submit':
      lines.push('状态变更：草稿 → 待确认')
      lines.push('提交进入费用确认流程')
      break
    case 'confirm_cost':
      lines.push(`确认金额：${formatMoney(Number(details.confirmedAmount) || 0)}`)
      if (details.comment) {
        lines.push(`审批备注：${details.comment}`)
      }
      break
    case 'reject':
      lines.push('状态变更：待确认 → 已退回')
      lines.push(`退回原因：${details.reason || '未填写'}`)
      break
    case 'resubmit':
      lines.push('状态变更：已退回 → 已重新提交')
      lines.push('已补充资料，重新进入审批流程')
      break
    case 'add_supplement_note':
      lines.push(`补充内容：${details.content || '未填写内容'}`)
      break
    case 'close':
      lines.push('状态变更：已确认 → 已关闭')
      if (details.remark) {
        lines.push(`关闭备注：${details.remark}`)
      }
      break
    default:
      if (log.detail) {
        lines.push(log.detail)
      }
  }

  return lines
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

function isExpanded(id: string): boolean {
  return expandedIds.value.has(id)
}

function handleReset() {
  filters.value = {
    operatorName: '',
    operatorRole: '',
    action: '',
    dateStart: '',
    dateEnd: '',
  }
  currentPage.value = 1
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

onMounted(() => {
  operationsStore.initLogs()
  userStore.initUser()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-7xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">操作历史</h1>
        <div class="text-sm text-gray-500">
          共 {{ filteredLogs.length }} 条记录
        </div>
      </div>

      <div class="bg-white border border-gray-200 p-4">
        <div class="flex items-center gap-2 mb-3">
          <Filter :size="16" class="text-gray-500" />
          <span class="text-sm font-medium text-gray-700">筛选条件</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">操作人</label>
            <select
              v-model="filters.operatorName"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">全部</option>
              <option v-for="op in operators" :key="op" :value="op">{{ op }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">角色</label>
            <select
              v-model="filters.operatorRole"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">全部</option>
              <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">操作类型</label>
            <select
              v-model="filters.action"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">全部</option>
              <option v-for="a in actions" :key="a.value" :value="a.value">{{ a.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">开始日期</label>
            <input
              v-model="filters.dateStart"
              type="date"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">结束日期</label>
            <input
              v-model="filters.dateEnd"
              type="date"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-900 text-white text-sm font-medium border border-blue-900 hover:bg-blue-800 transition-colors"
          >
            <Search :size="14" />
            搜索
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-gray-700 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            @click="handleReset"
          >
            <RotateCcw :size="14" />
            重置
          </button>
        </div>
      </div>

      <div class="bg-white border border-gray-200">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-3 py-2.5 text-left font-medium text-gray-600 w-10"></th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">操作时间</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">操作人</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">角色</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">操作类型</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">关联记录编号</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">变更内容摘要</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="log in pagedLogs" :key="log.id">
                <tr
                  class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  @click="toggleExpand(log.id)"
                >
                  <td class="px-3 py-2.5">
                    <ChevronDown
                      v-if="!isExpanded(log.id)"
                      :size="16"
                      class="text-gray-400"
                    />
                    <ChevronUp v-else :size="16" class="text-gray-400" />
                  </td>
                  <td class="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                    {{ formatDateTime(log.timestamp || log.operateTime || '') }}
                  </td>
                  <td class="px-3 py-2.5 text-gray-900">{{ log.operatorName }}</td>
                  <td class="px-3 py-2.5 text-gray-700">
                    {{ ROLE_LABEL[log.operatorRole] || log.operatorRole }}
                  </td>
                  <td class="px-3 py-2.5">
                    <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">
                      {{ ACTION_LABEL[log.action] || log.action }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-gray-700 font-mono">
                    {{ log.replacementId }}
                  </td>
                  <td class="px-3 py-2.5 text-gray-700 max-w-md truncate">
                    {{ getChangeSummary(log) }}
                  </td>
                </tr>
                <tr
                  v-if="isExpanded(log.id)"
                  class="border-b border-gray-100 bg-gray-50"
                >
                  <td></td>
                  <td colspan="6" class="px-6 py-3">
                    <div class="text-xs text-gray-500 mb-2 font-medium">变更详情</div>
                    <ul class="space-y-1">
                      <li
                        v-for="(line, idx) in getChangeDetail(log)"
                        :key="idx"
                        class="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span class="text-gray-400 mt-0.5">•</span>
                        <span>{{ line }}</span>
                      </li>
                    </ul>
                  </td>
                </tr>
              </template>
              <tr v-if="filteredLogs.length === 0">
                <td colspan="7" class="px-4 py-12 text-center text-gray-500">
                  暂无符合条件的操作记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="totalPages > 1"
          class="px-4 py-3 border-t border-gray-200 flex items-center justify-between"
        >
          <div class="text-sm text-gray-600">
            第 {{ currentPage }} / {{ totalPages }} 页
          </div>
          <div class="flex gap-1">
            <button
              type="button"
              class="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              上一页
            </button>
            <button
              v-for="p in totalPages"
              :key="p"
              type="button"
              class="px-3 py-1 text-sm border transition-colors"
              :class="
                p === currentPage
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'border-gray-300 hover:bg-gray-50'
              "
              @click="goToPage(p)"
            >
              {{ p }}
            </button>
            <button
              type="button"
              class="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
