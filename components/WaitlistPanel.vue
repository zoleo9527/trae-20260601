<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { User } from '../server/data/mockData'

interface WaitlistEntry {
  id: string
  courseId: string
  participantName: string
  phone: string
  email: string
  position: number
  status: string
  courseTitle: string
  createdAt: string
}

const props = defineProps<{
  currentUser: User
  selectedCourseId: string | null
}>()

const waitlist = ref<WaitlistEntry[]>([])
const loading = ref(true)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const filteredWaitlist = computed(() => {
  if (!props.selectedCourseId) return waitlist.value
  return waitlist.value.filter(w => w.courseId === props.selectedCourseId && w.status === 'active')
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchWaitlist = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/waitlist')
    waitlist.value = await res.json()
  } catch (error) {
    console.error('Failed to fetch waitlist:', error)
  } finally {
    loading.value = false
  }
}

const handlePromote = async (entry: WaitlistEntry) => {
  if (props.currentUser.role !== 'manager') {
    showMessage('只有活动主管可以进行候补升级', 'error')
    return
  }

  try {
    const res = await fetch(`/api/courses/${entry.courseId}/promote-waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waitlistId: entry.id })
    })

    const data = await res.json()
    if (res.ok) {
      showMessage(data.message, 'success')
      fetchWaitlist()
    } else {
      showMessage(data.message || '升级失败', 'error')
    }
  } catch (error) {
    showMessage('升级失败', 'error')
  }
}

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

watch(() => props.selectedCourseId, () => {
  fetchWaitlist()
}, { immediate: true })
</script>

<template>
  <div class="w-80">
    <div class="card sticky top-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">候补名单</h3>
        <span class="badge badge-warning">{{ filteredWaitlist.length }}人</span>
      </div>

      <div v-if="message" :class="messageType === 'success' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'" class="p-3 rounded-lg mb-4 text-sm">
        {{ message }}
      </div>

      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>

      <div v-else-if="filteredWaitlist.length === 0" class="text-center py-8 text-gray-500">
        <div class="text-4xl mb-2">📋</div>
        <p>暂无候补记录</p>
      </div>

      <div v-else class="space-y-3 max-h-96 overflow-y-auto">
        <div 
          v-for="entry in filteredWaitlist" 
          :key="entry.id"
          class="bg-gray-50 rounded-lg p-3"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-sm">{{ entry.participantName }}</span>
            <span class="badge badge-info">#{{ entry.position }}</span>
          </div>
          <div class="text-xs text-gray-500 mb-2">{{ entry.phone }}</div>
          <div class="text-xs text-gray-400 mb-2">{{ entry.courseTitle }}</div>
          <div class="text-xs text-gray-400">{{ formatDate(entry.createdAt) }}</div>
          <button 
            v-if="currentUser.role === 'manager'"
            @click="handlePromote(entry)"
            class="btn btn-primary text-xs mt-2 w-full"
          >
            升级为正式报名
          </button>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="text-sm text-gray-500">
          <p class="mb-1">当前角色权限:</p>
          <ul class="text-xs space-y-1">
            <li v-if="currentUser.role === 'teacher'" class="text-gray-400">• 查看候补名单</li>
            <li v-if="currentUser.role === 'volunteer'" class="text-gray-400">• 查看候补名单</li>
            <li v-if="currentUser.role === 'manager'" class="text-success-600">• 升级候补学员</li>
            <li v-if="currentUser.role === 'manager'" class="text-success-600">• 审核课程申请</li>
            <li v-if="currentUser.role === 'manager'" class="text-success-600">• 重置报名数据</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
