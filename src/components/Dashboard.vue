<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">工作台</h2>
      <p class="text-gray-500 mt-1">欢迎回来，{{ store.state.currentUser?.name }}</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待回访</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.pendingVisits }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已超期</p>
            <p class="text-2xl font-bold text-orange-600 mt-1">{{ stats.overdueVisits }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <AlertCircle class="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已卡住</p>
            <p class="text-2xl font-bold text-red-600 mt-1">{{ stats.blockedVisits }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <XCircle class="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待处理问题</p>
            <p class="text-2xl font-bold text-yellow-600 mt-1">{{ stats.pendingIssues + stats.escalatedIssues }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-red-500" />
            卡住的单子
          </h3>
        </div>
        <div class="p-4">
          <div v-if="blockedVisits.length + escalatedIssues.length === 0" class="text-center py-8 text-gray-500">
            <CheckCircle class="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>暂无卡住的单子</p>
          </div>
          <div v-else class="space-y-3">
            <template v-for="visit in blockedVisits" :key="'v-' + visit.id">
              <div class="p-4 bg-red-50 rounded-lg border border-red-100">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ visit.keyPerson.name }}</p>
                    <p class="text-sm text-gray-500">{{ visit.keyPerson.address }}</p>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">回访卡住</span>
                    <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">社工执行</span>
                  </div>
                </div>
                <div class="bg-white rounded-lg p-3 mb-3">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span class="text-xs font-medium text-gray-900">处理环节：社工回访</span>
                  </div>
                  <p class="text-xs text-gray-600">
                    <span class="font-medium text-red-600">卡点：</span>{{ visit.notes || '多次上门无人应答' }}
                  </p>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">负责人：{{ visit.socialWorkerName }}</span>
                  <span class="text-xs text-gray-400">需协调解决</span>
                </div>
              </div>
            </template>
            <template v-for="issue in escalatedIssues" :key="'i-' + issue.id">
              <div class="p-4 bg-red-50 rounded-lg border border-red-100">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ issue.title }}</p>
                    <p class="text-sm text-gray-500">{{ truncateText(issue.description, 40) }}</p>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">问题升级</span>
                    <span class="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">需社区干部</span>
                  </div>
                </div>
                <div class="bg-white rounded-lg p-3 mb-3">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span class="text-xs font-medium text-gray-900">处理环节：问题升级</span>
                  </div>
                  <p class="text-xs text-gray-600 mb-2">
                    <span class="font-medium text-orange-600">卡点：</span>{{ issue.escalationReason || '志愿队长无法处理' }}
                  </p>
                  <div class="flex items-center gap-4">
                    <span class="text-xs text-gray-500">上报人：{{ issue.reporterName }}</span>
                    <span class="text-xs text-gray-500">→ 处理人：{{ issue.assignedName || '待定' }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">责任归属：志愿队长</span>
                  <span class="text-xs text-orange-600 font-medium">需社区干部协调</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-500" />
            近期回访记录
          </h3>
        </div>
        <div class="p-4">
          <div v-if="recentVisits.length === 0" class="text-center py-8 text-gray-500">
            <ClipboardList class="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无回访记录</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="visit in recentVisits"
              :key="visit.id"
              class="p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ visit.keyPerson.name }}</p>
                  <p class="text-sm text-gray-500">{{ visit.scheduledDate }} · {{ getStatusLabel(visit.status) }}</p>
                </div>
                <span
                  class="text-xs px-2 py-1 rounded-full"
                  :class="getStatusClass(visit.status)"
                >
                  {{ getStatusLabel(visit.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Clock, AlertCircle, XCircle, AlertTriangle, ClipboardList, CheckCircle } from 'lucide-vue-next'
import { useStore } from '@/store'
import { getSystemStats } from '@/api'
import type { VisitStatus } from '@/types'

const store = useStore()
const stats = ref({
  pendingVisits: 0,
  overdueVisits: 0,
  blockedVisits: 0,
  pendingIssues: 0,
  escalatedIssues: 0
})

const blockedVisits = computed(() => store.blockedVisits.value.slice(0, 3))
const escalatedIssues = computed(() => store.escalatedIssues.value.slice(0, 3))

const recentVisits = computed(() => {
  return [...store.state.visitRecords]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
})

function getStatusLabel(status: VisitStatus): string {
  const map: Record<VisitStatus, string> = {
    pending: '待回访',
    completed: '已完成',
    overdue: '已超期',
    blocked: '已卡住'
  }
  return map[status]
}

function getStatusClass(status: VisitStatus): string {
  const map: Record<VisitStatus, string> = {
    pending: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    overdue: 'bg-orange-100 text-orange-700',
    blocked: 'bg-red-100 text-red-700'
  }
  return map[status]
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

onMounted(async () => {
  const systemStats = await getSystemStats()
  stats.value = {
    pendingVisits: systemStats.pendingVisits,
    overdueVisits: systemStats.overdueVisits,
    blockedVisits: systemStats.blockedVisits,
    pendingIssues: systemStats.pendingIssues,
    escalatedIssues: systemStats.escalatedIssues
  }
})
</script>
