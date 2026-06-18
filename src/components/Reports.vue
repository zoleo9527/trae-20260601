<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">统计报表</h2>
      <p class="text-gray-500 mt-1">查看重点对象回访与问题上报的统计数据</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">总回访数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.totalVisits }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <ClipboardList class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已完成回访</p>
            <p class="text-2xl font-bold text-green-600 mt-1">{{ completedVisits }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">总问题数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.totalIssues }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已解决问题</p>
            <p class="text-2xl font-bold text-green-600 mt-1">{{ stats.resolvedIssues }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 mb-4">回访状态分布</h3>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm text-gray-600">待回访</span>
              <span class="text-sm font-medium text-gray-900">{{ stats.pendingVisits }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 rounded-full transition-all"
                :style="{ width: getVisitStatusPercentage('pending') + '%' }"
              ></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm text-gray-600">已完成</span>
              <span class="text-sm font-medium text-gray-900">{{ completedVisits }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-green-500 rounded-full transition-all"
                :style="{ width: getVisitStatusPercentage('completed') + '%' }"
              ></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm text-gray-600">已超期</span>
              <span class="text-sm font-medium text-orange-600">{{ stats.overdueVisits }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-orange-500 rounded-full transition-all"
                :style="{ width: getVisitStatusPercentage('overdue') + '%' }"
              ></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm text-gray-600">已卡住</span>
              <span class="text-sm font-medium text-red-600">{{ stats.blockedVisits }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-red-500 rounded-full transition-all"
                :style="{ width: getVisitStatusPercentage('blocked') + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 mb-4">问题状态分布</h3>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm text-gray-600">待处理</span>
              <span class="text-sm font-medium text-gray-900">{{ stats.pendingIssues }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-yellow-500 rounded-full transition-all"
                :style="{ width: getIssueStatusPercentage('pending') + '%' }"
              ></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm text-gray-600">处理中</span>
              <span class="text-sm font-medium text-gray-900">{{ stats.processingIssues }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 rounded-full transition-all"
                :style="{ width: getIssueStatusPercentage('processing') + '%' }"
              ></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm text-gray-600">已解决</span>
              <span class="text-sm font-medium text-green-600">{{ stats.resolvedIssues }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-green-500 rounded-full transition-all"
                :style="{ width: getIssueStatusPercentage('resolved') + '%' }"
              ></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm text-gray-600">已升级</span>
              <span class="text-sm font-medium text-red-600">{{ stats.escalatedIssues }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-red-500 rounded-full transition-all"
                :style="{ width: getIssueStatusPercentage('escalated') + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-6 bg-white rounded-xl border border-gray-200 p-5">
      <h3 class="font-semibold text-gray-900 mb-4">重点对象关怀等级分布</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center p-4 bg-red-50 rounded-xl">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart class="w-8 h-8 text-red-600" />
          </div>
          <p class="text-3xl font-bold text-red-600">{{ highCareCount }}</p>
          <p class="text-sm text-gray-600 mt-1">重点关注</p>
        </div>
        
        <div class="text-center p-4 bg-yellow-50 rounded-xl">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart class="w-8 h-8 text-yellow-600" />
          </div>
          <p class="text-3xl font-bold text-yellow-600">{{ mediumCareCount }}</p>
          <p class="text-sm text-gray-600 mt-1">一般关注</p>
        </div>
        
        <div class="text-center p-4 bg-green-50 rounded-xl">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart class="w-8 h-8 text-green-600" />
          </div>
          <p class="text-3xl font-bold text-green-600">{{ lowCareCount }}</p>
          <p class="text-sm text-gray-600 mt-1">常规关注</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ClipboardList, CheckCircle, AlertTriangle, CheckCircle2, Heart } from 'lucide-vue-next'
import { getSystemStats, getKeyPersons } from '@/api'
import type { SystemStats, VisitStatus, IssueStatus, KeyPerson } from '@/types'

const stats = ref<SystemStats>({
  totalVisits: 0,
  pendingVisits: 0,
  overdueVisits: 0,
  blockedVisits: 0,
  totalIssues: 0,
  pendingIssues: 0,
  processingIssues: 0,
  resolvedIssues: 0,
  escalatedIssues: 0
})

const keyPersons = ref<KeyPerson[]>([])

const completedVisits = computed(() => {
  return stats.value.totalVisits - stats.value.pendingVisits - stats.value.overdueVisits - stats.value.blockedVisits
})

const highCareCount = computed(() => keyPersons.value.filter(kp => kp.careLevel === 'high').length)
const mediumCareCount = computed(() => keyPersons.value.filter(kp => kp.careLevel === 'medium').length)
const lowCareCount = computed(() => keyPersons.value.filter(kp => kp.careLevel === 'low').length)

function getVisitStatusPercentage(status: VisitStatus): number {
  if (stats.value.totalVisits === 0) return 0
  const map: Record<VisitStatus, number> = {
    pending: stats.value.pendingVisits,
    completed: completedVisits.value,
    overdue: stats.value.overdueVisits,
    blocked: stats.value.blockedVisits
  }
  return Math.round((map[status] / stats.value.totalVisits) * 100)
}

function getIssueStatusPercentage(status: IssueStatus): number {
  if (stats.value.totalIssues === 0) return 0
  const map: Record<IssueStatus, number> = {
    pending: stats.value.pendingIssues,
    processing: stats.value.processingIssues,
    resolved: stats.value.resolvedIssues,
    escalated: stats.value.escalatedIssues
  }
  return Math.round((map[status] / stats.value.totalIssues) * 100)
}

onMounted(async () => {
  const [systemStats, persons] = await Promise.all([
    getSystemStats(),
    getKeyPersons()
  ])
  stats.value = systemStats
  keyPersons.value = persons
})
</script>
