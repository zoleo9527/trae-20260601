<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
      statusClass
    ]"
  >
    <component :is="statusIcon" class="w-4 h-4" />
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Clock, 
  UserCheck, 
  Loader, 
  Eye, 
  XCircle, 
  CheckCircle,
  AlertCircle,
  FileCheck
} from 'lucide-vue-next'
import type { AssignmentStatus, TerminologyStatus } from '@/types'

const props = defineProps<{
  status: AssignmentStatus | TerminologyStatus
  type?: 'assignment' | 'terminology'
}>()

const statusConfig = computed(() => {
  if (props.type === 'terminology') {
    const config: Record<TerminologyStatus, { text: string; class: string; icon: any }> = {
      pending: { text: '待审核', class: 'bg-gray-100 text-gray-700', icon: Clock },
      approved: { text: '已确认', class: 'bg-success-100 text-success-700', icon: CheckCircle },
      rejected: { text: '已驳回', class: 'bg-red-100 text-red-700', icon: XCircle },
    }
    return config[props.status as TerminologyStatus]
  }

  const config: Record<AssignmentStatus, { text: string; class: string; icon: any }> = {
    pending: { text: '待分配', class: 'bg-gray-100 text-gray-700', icon: Clock },
    assigned: { text: '已分配', class: 'bg-blue-100 text-blue-700', icon: UserCheck },
    in_progress: { text: '进行中', class: 'bg-warning-100 text-warning-700', icon: Loader },
    reviewing: { text: '待审核', class: 'bg-purple-100 text-purple-700', icon: Eye },
    rejected: { text: '已驳回', class: 'bg-red-100 text-red-700', icon: XCircle },
    completed: { text: '已完成', class: 'bg-success-100 text-success-700', icon: CheckCircle },
  }
  return config[props.status as AssignmentStatus]
})

const statusText = computed(() => statusConfig.value?.text || props.status)
const statusClass = computed(() => statusConfig.value?.class || 'bg-gray-100 text-gray-700')
const statusIcon = computed(() => statusConfig.value?.icon || AlertCircle)
</script>