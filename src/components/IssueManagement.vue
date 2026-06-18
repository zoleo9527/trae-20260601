<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">问题处理</h2>
        <p class="text-gray-500 mt-1">处理重点对象回访中上报的问题</p>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex gap-2 mb-4">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              @click="activeTab = tab.value"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition',
                activeTab === tab.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              {{ tab.label }}
              <span
                v-if="tab.count > 0"
                class="ml-2 text-xs px-2 py-0.5 rounded-full"
                :class="activeTab === tab.value ? 'bg-white/20' : 'bg-white'"
              >
                {{ tab.count }}
              </span>
            </button>
          </div>
          
          <div class="space-y-3">
            <div
              v-for="issue in filteredIssues"
              :key="issue.id"
              @click="selectIssue(issue)"
              :class="[
                'p-4 rounded-lg border cursor-pointer transition',
                selectedIssue?.id === issue.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <h4 class="font-medium text-gray-900">{{ issue.title }}</h4>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full"
                      :class="getIssueStatusClass(issue.status)"
                    >
                      {{ getIssueStatusLabel(issue.status) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ issue.description }}</p>
                  <div class="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span class="flex items-center gap-1">
                      <Tag class="w-3 h-3" />
                      {{ issue.category }}
                    </span>
                    <span class="flex items-center gap-1">
                      <User class="w-3 h-3" />
                      {{ issue.reporterName }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      {{ formatDate(issue.createdAt) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="filteredIssues.length === 0" class="text-center py-12">
              <ClipboardList class="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p class="text-gray-500">暂无数据</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-6">
          <div class="px-4 py-3 border-b border-gray-200">
            <h3 class="font-semibold text-gray-900">问题详情</h3>
          </div>
          
          <div v-if="selectedIssue" class="p-4">
            <div class="mb-4">
              <h4 class="font-medium text-gray-900">{{ selectedIssue.title }}</h4>
              <span
                class="text-xs px-2 py-0.5 rounded-full mt-2 inline-block"
                :class="getIssueStatusClass(selectedIssue.status)"
              >
                {{ getIssueStatusLabel(selectedIssue.status) }}
              </span>
            </div>
            
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">分类</span>
                <span class="text-gray-900">{{ selectedIssue.category }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">上报人</span>
                <span class="text-gray-900">{{ selectedIssue.reporterName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">上报时间</span>
                <span class="text-gray-900">{{ formatDateTime(selectedIssue.createdAt) }}</span>
              </div>
              <div v-if="selectedIssue.assignedName" class="flex justify-between">
                <span class="text-gray-500">处理人</span>
                <span class="text-gray-900">{{ selectedIssue.assignedName }}</span>
              </div>
            </div>
            
            <div class="mt-4">
              <span class="text-sm text-gray-500 block mb-2">问题描述</span>
              <p class="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{{ selectedIssue.description }}</p>
            </div>
            
            <div v-if="selectedIssue.visitRecord" class="mt-4">
              <span class="text-sm text-gray-500 block mb-2">关联回访</span>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-sm text-gray-900">{{ selectedIssue.visitRecord.keyPerson.name }}</p>
                <p class="text-xs text-gray-500">{{ selectedIssue.visitRecord.keyPerson.address }}</p>
              </div>
            </div>
            
            <div class="mt-6 space-y-2">
              <button
                v-if="selectedIssue.status === 'pending'"
                @click="handleIssue('processing')"
                class="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
              >
                开始处理
              </button>
              <button
                v-if="selectedIssue.status === 'processing'"
                @click="handleIssue('resolved')"
                class="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                完成处理
              </button>
              <button
                v-if="selectedIssue.status === 'pending' || selectedIssue.status === 'processing'"
                @click="handleIssue('escalated')"
                class="w-full py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
              >
                升级上报
              </button>
            </div>
          </div>
          
          <div v-else class="p-8 text-center">
            <MousePointerClick class="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p class="text-gray-500">请选择一个问题</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ClipboardList, Tag, User, Calendar, MousePointerClick } from 'lucide-vue-next'
import { useStore } from '@/store'
import type { Issue, IssueStatus } from '@/types'

const store = useStore()

const activeTab = ref<IssueStatus | 'all'>('all')
const selectedIssue = ref<Issue | null>(null)

const tabs = computed(() => [
  { value: 'all' as const, label: '全部', count: store.state.issues.length },
  { value: 'pending' as const, label: '待处理', count: store.state.issues.filter(i => i.status === 'pending').length },
  { value: 'processing' as const, label: '处理中', count: store.state.issues.filter(i => i.status === 'processing').length },
  { value: 'resolved' as const, label: '已解决', count: store.state.issues.filter(i => i.status === 'resolved').length },
  { value: 'escalated' as const, label: '已升级', count: store.state.issues.filter(i => i.status === 'escalated').length }
])

const filteredIssues = computed(() => {
  if (activeTab.value === 'all') {
    return store.state.issues
  }
  return store.state.issues.filter(i => i.status === activeTab.value)
})

function getIssueStatusLabel(status: IssueStatus): string {
  const map: Record<IssueStatus, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    escalated: '已升级'
  }
  return map[status]
}

function getIssueStatusClass(status: IssueStatus): string {
  const map: Record<IssueStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    escalated: 'bg-red-100 text-red-700'
  }
  return map[status]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function selectIssue(issue: Issue) {
  selectedIssue.value = issue
}

async function handleIssue(status: IssueStatus) {
  if (!selectedIssue.value) return
  
  const updates: Partial<Issue> = {
    status,
    assignedTo: store.state.currentUser?.id,
    assignedName: store.state.currentUser?.name
  }
  
  if (status === 'escalated') {
    updates.escalationReason = '志愿队长处理困难，需要社区干部介入'
  }
  
  await store.updateIssue(selectedIssue.value.id, updates)
}
</script>
