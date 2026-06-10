<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useReplacementsStore } from '@/stores/replacements'
import StatusBadge from '@/components/StatusBadge.vue'
import StatCard from '@/components/StatCard.vue'
import RoleSwitcher from '@/components/RoleSwitcher.vue'
import { formatMoney, formatDateTime } from '@/utils/format'
import { ROLE_LABEL } from '@/types/enums'
import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Download,
  Send,
  ChevronRight,
  Paperclip,
  FileText,
} from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const replacementsStore = useReplacementsStore()

const role = computed(() => userStore.currentUser?.role || 'technician')
const roleName = computed(() => ROLE_LABEL[role.value])

const todoCount = computed(() => replacementsStore.todoListByRole(role.value).length)

const processedCount = computed(() => {
  const stats = replacementsStore.statsByRole(role.value)
  return stats.closed + stats.confirmed
})

const riskCount = computed(() => replacementsStore.riskList.length)

const todoList = computed(() => replacementsStore.todoListByRole(role.value))

const riskList = computed(() => replacementsStore.riskList)

const todoDescription = computed(() => {
  const descriptions: Record<string, string> = {
    technician: '您需要处理草稿和被退回的更换申请',
    customer_service: '您需要确认待审核的费用申请',
    supervisor: '您需要审批已确认的费用记录',
  }
  return descriptions[role.value] || ''
})

function getLatestRejectReason(r: (typeof riskList.value)[number]): string {
  if (!r.rejectRecords || r.rejectRecords.length === 0) return ''
  return r.rejectRecords[r.rejectRecords.length - 1].reason
}

function getTimeoutDuration(r: (typeof riskList.value)[number]): string {
  const diff = Date.now() - new Date(r.updatedAt).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) {
    return `${days}天${hours % 24}小时`
  }
  return `${hours}小时`
}

function getFirstPartName(r: (typeof riskList.value)[number]): string {
  return r.items && r.items.length > 0 ? r.items[0].partName : '-'
}

function handleRiskClick(id: string) {
  replacementsStore.selectedId = id
  router.push('/replacements')
}

function handleTodoClick(id: string) {
  replacementsStore.selectedId = id
  router.push('/replacements')
}

function handleRoleChange(newRole: typeof role.value) {
  userStore.setRole(newRole)
}

function handleQuickAction(action: string) {
  if (action === 'create') {
    router.push('/replacements')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">工作台</h1>
          <span class="px-3 py-1 bg-blue-900 text-white text-sm font-medium">
            {{ roleName }}
          </span>
        </div>
        <RoleSwitcher :current-role="role" @change="handleRoleChange" />
      </div>

      <div class="grid grid-cols-3 gap-4">
        <StatCard title="我的待办" :value="todoCount" />
        <StatCard title="我已处理" :value="processedCount" />
        <StatCard title="责任风险" :value="riskCount" variant="warning" />
      </div>

      <div class="flex gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white text-sm font-medium border border-blue-900 hover:bg-blue-800 transition-colors"
          @click="handleQuickAction('create')"
        >
          <Plus :size="16" />
          新建更换申请
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <CheckCircle :size="16" />
          批量费用确认
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          @click="replacementsStore.exportToCSV()"
        >
          <Download :size="16" />
          导出报表
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <Send :size="16" />
          发送通知
        </button>
      </div>

      <div class="bg-white border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <AlertTriangle :size="18" class="text-orange-600" />
          <div>
            <h2 class="text-base font-semibold text-gray-900">责任风险预警</h2>
            <p class="text-xs text-orange-600 mt-0.5">以下记录可能产生责任纠纷，请优先处理</p>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-4 py-2.5 text-left font-medium text-gray-600 w-1"></th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">记录编号</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">电梯编号</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">备件名称</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-600">申请金额</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">状态</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">风险原因</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">附件/备注</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">退回原因</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">超时时长</th>
                <th class="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in riskList"
                :key="r.id"
                class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="handleRiskClick(r.id)"
              >
                <td class="px-0 py-0">
                  <div class="w-1 h-full bg-orange-500"></div>
                </td>
                <td class="px-4 py-3 font-mono text-gray-900">{{ r.orderNo }}</td>
                <td class="px-4 py-3 text-gray-700">{{ r.deviceModel }}</td>
                <td class="px-4 py-3 text-gray-700">{{ getFirstPartName(r) }}</td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">
                  {{ formatMoney(r.estimatedAmount) }}
                </td>
                <td class="px-4 py-3">
                  <StatusBadge :status="r.status" />
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="reason in replacementsStore.getRiskReasons(r)"
                      :key="reason"
                      class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 border border-orange-300"
                    >
                      {{ reason }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span
                      v-if="r.attachments.length > 0"
                      class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      <Paperclip :size="10" />
                      {{ r.attachments.length }}
                    </span>
                    <span
                      v-if="r.supplementNotes.length > 0"
                      class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                    >
                      <FileText :size="10" />
                      {{ r.supplementNotes.length }}
                    </span>
                    <span
                      v-if="r.attachments.length === 0 && r.supplementNotes.length === 0"
                      class="text-xs text-gray-400"
                    >
                      -
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span
                    v-if="getLatestRejectReason(r)"
                    class="text-xs text-red-600 truncate max-w-[180px] block"
                    :title="getLatestRejectReason(r)"
                  >
                    {{ getLatestRejectReason(r).length > 20 ? getLatestRejectReason(r).substring(0, 20) + '…' : getLatestRejectReason(r) }}
                  </span>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
                <td class="px-4 py-3 text-orange-600 font-medium">
                  {{ getTimeoutDuration(r) }}
                </td>
                <td class="px-4 py-3">
                  <ChevronRight :size="16" class="text-gray-400" />
                </td>
              </tr>
              <tr v-if="riskList.length === 0">
                <td colspan="11" class="px-4 py-12 text-center text-gray-500">
                  暂无风险预警记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-900">我的待办</h2>
          <p class="text-xs text-gray-500 mt-0.5">{{ todoDescription }}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">记录编号</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">电梯</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">备件</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-600">金额</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">提交时间</th>
                <th class="px-4 py-2.5 text-left font-medium text-gray-600">状态</th>
                <th class="px-4 py-2.5 text-right font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in todoList"
                :key="r.id"
                class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="handleTodoClick(r.id)"
              >
                <td class="px-4 py-3 font-mono text-gray-900">{{ r.orderNo }}</td>
                <td class="px-4 py-3 text-gray-700">{{ r.deviceModel }}</td>
                <td class="px-4 py-3 text-gray-700">{{ getFirstPartName(r) }}</td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">
                  {{ formatMoney(r.estimatedAmount) }}
                </td>
                <td class="px-4 py-3 text-gray-600">
                  {{ formatDateTime(r.submittedAt || r.createdAt) }}
                </td>
                <td class="px-4 py-3">
                  <StatusBadge :status="r.status" />
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-900 border border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
                    @click.stop="handleTodoClick(r.id)"
                  >
                    处理
                    <ChevronRight :size="12" />
                  </button>
                </td>
              </tr>
              <tr v-if="todoList.length === 0">
                <td colspan="7" class="px-4 py-12 text-center text-gray-500">
                  暂无待办记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
