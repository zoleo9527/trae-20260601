<template>
  <MainLayout title="工作台" subtitle="翻译任务管理概览">
    <div class="space-y-6">
      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="stat in statusStats"
          :key="stat.status"
          :class="[
            'bg-white rounded-lg p-6 border border-gray-200 cursor-pointer transition-all hover:shadow-md',
            { 'ring-2 ring-primary-500': selectedStatus === stat.status }
          ]"
          @click="toggleStatusFilter(stat.status)"
        >
          <div class="flex items-center justify-between mb-4">
            <component
              :is="stat.icon"
              :class="['w-6 h-6', stat.iconColor]"
            />
            <StatusBadge :status="stat.status" />
          </div>
          <div class="text-3xl font-bold text-gray-900 mb-1">
            {{ stat.count }}
          </div>
          <div class="text-sm text-gray-500">
            {{ stat.label }}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">待办任务</h3>
          <div class="flex items-center gap-2">
            <span
              v-if="selectedStatus"
              class="text-sm text-gray-500"
            >
              筛选: {{ getStatusText(selectedStatus) }}
            </span>
            <button
              v-if="selectedStatus"
              class="text-sm text-primary-600 hover:text-primary-700"
              @click="clearFilter"
            >
              清除筛选
            </button>
          </div>
        </div>

        <div class="divide-y divide-gray-200">
          <div
            v-for="assignment in filteredAssignments"
            :key="assignment.id"
            class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
            @click="goToDetail(assignment.id)"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h4 class="font-medium text-gray-900">{{ assignment.projectName }}</h4>
                  <StatusBadge :status="assignment.status" />
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <span>{{ assignment.sourceLanguage }} → {{ assignment.targetLanguage }}</span>
                  <span v-if="assignment.translatorName">译员: {{ assignment.translatorName }}</span>
                  <span v-if="assignment.wordCount">{{ assignment.wordCount }} 字</span>
                </div>
              </div>
              
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="text-sm text-gray-500">截止日期</div>
                  <div :class="['text-sm font-medium', getDeadlineClass(assignment.deadline)]">
                    {{ formatDate(assignment.deadline) }}
                  </div>
                </div>
                <ChevronRight class="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div
            v-if="filteredAssignments.length === 0"
            class="px-6 py-12 text-center text-gray-500"
          >
            <Inbox class="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无待办任务</p>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Clock, 
  UserCheck, 
  Loader, 
  Eye, 
  XCircle, 
  CheckCircle,
  ChevronRight,
  Inbox
} from 'lucide-vue-next'
import MainLayout from '@/components/layout/MainLayout.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAssignmentStore } from '@/stores/assignment'
import type { AssignmentStatus } from '@/types'

const router = useRouter()
const assignmentStore = useAssignmentStore()

const selectedStatus = ref<AssignmentStatus | null>(null)

const statusStats = computed(() => {
  const counts = assignmentStore.statusCounts
  return [
    {
      status: 'pending' as AssignmentStatus,
      count: counts.pending,
      label: '待分配任务',
      icon: Clock,
      iconColor: 'text-gray-500',
    },
    {
      status: 'in_progress' as AssignmentStatus,
      count: counts.in_progress,
      label: '进行中任务',
      icon: Loader,
      iconColor: 'text-warning-500',
    },
    {
      status: 'reviewing' as AssignmentStatus,
      count: counts.reviewing,
      label: '待审核任务',
      icon: Eye,
      iconColor: 'text-purple-500',
    },
    {
      status: 'rejected' as AssignmentStatus,
      count: counts.rejected,
      label: '已驳回任务',
      icon: XCircle,
      iconColor: 'text-red-500',
    },
  ]
})

const filteredAssignments = computed(() => {
  let assignments = assignmentStore.assignments
  
  if (selectedStatus.value) {
    assignments = assignments.filter(a => a.status === selectedStatus.value)
  }
  
  return assignments.sort((a, b) => {
    const dateA = new Date(a.deadline).getTime()
    const dateB = new Date(b.deadline).getTime()
    return dateA - dateB
  })
})

const toggleStatusFilter = (status: AssignmentStatus) => {
  if (selectedStatus.value === status) {
    selectedStatus.value = null
  } else {
    selectedStatus.value = status
  }
}

const clearFilter = () => {
  selectedStatus.value = null
}

const getStatusText = (status: AssignmentStatus) => {
  const texts: Record<AssignmentStatus, string> = {
    pending: '待分配',
    assigned: '已分配',
    in_progress: '进行中',
    reviewing: '待审核',
    rejected: '已驳回',
    completed: '已完成',
  }
  return texts[status]
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

const getDeadlineClass = (deadline: string) => {
  const date = new Date(deadline)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  
  if (days < 0) return 'text-red-600'
  if (days <= 3) return 'text-warning-600'
  return 'text-gray-900'
}

const goToDetail = (id: string) => {
  router.push(`/assignments/${id}`)
}
</script>