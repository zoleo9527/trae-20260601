<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, XCircle, Clock, AlertTriangle, AlertCircle, Info } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

type TestStatus = 'pending' | 'in_progress' | 'passed' | 'failed'
type IssueStatus = 'pending_assign' | 'in_progress' | 'pending_verify' | 'closed'
type Severity = 'critical' | 'major' | 'minor'

type TagType = 'test' | 'issue' | 'severity'

interface Props {
  type: TagType
  status: TestStatus | IssueStatus | Severity
}

const props = defineProps<Props>()

const statusConfig = computed(() => {
  const configs: Record<TagType, Record<string, { icon: any; label: string; class: string }>> = {
    test: {
      pending: {
        icon: Clock,
        label: '待执行',
        class: 'bg-gray-100 text-gray-700 border-gray-200'
      },
      in_progress: {
        icon: Info,
        label: '执行中',
        class: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      passed: {
        icon: CheckCircle,
        label: '已通过',
        class: 'bg-green-100 text-green-700 border-green-200'
      },
      failed: {
        icon: XCircle,
        label: '未通过',
        class: 'bg-red-100 text-red-700 border-red-200'
      }
    },
    issue: {
      pending_assign: {
        icon: Clock,
        label: '待分配',
        class: 'bg-gray-100 text-gray-700 border-gray-200'
      },
      in_progress: {
        icon: Info,
        label: '处理中',
        class: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      pending_verify: {
        icon: AlertTriangle,
        label: '待验证',
        class: 'bg-amber-100 text-amber-700 border-amber-200'
      },
      closed: {
        icon: CheckCircle,
        label: '已关闭',
        class: 'bg-green-100 text-green-700 border-green-200'
      }
    },
    severity: {
      critical: {
        icon: AlertCircle,
        label: '严重',
        class: 'bg-red-100 text-red-700 border-red-200'
      },
      major: {
        icon: AlertTriangle,
        label: '主要',
        class: 'bg-orange-100 text-orange-700 border-orange-200'
      },
      minor: {
        icon: Info,
        label: '次要',
        class: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      }
    }
  }
  return configs[props.type][props.status] || {
    icon: Info,
    label: props.status,
    class: 'bg-gray-100 text-gray-700 border-gray-200'
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border',
      statusConfig.class
    ]"
  >
    <component :is="statusConfig.icon" class="w-3.5 h-3.5" />
    {{ statusConfig.label }}
  </span>
</template>
