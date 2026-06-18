<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">问题处理</h2>
        <p class="text-gray-500 mt-1">处理重点对象回访中上报的问题</p>
      </div>
    </div>
    
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
    
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">标题</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">分类</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">上报人</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">状态</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">时间</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="issue in filteredIssues" :key="issue.id" class="border-t border-gray-100 hover:bg-gray-50">
              <td class="px-5 py-4">
                <div>
                  <p class="font-medium text-gray-900">{{ issue.title }}</p>
                  <p class="text-sm text-gray-500">{{ truncateText(issue.description, 30) }}</p>
                </div>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-gray-600">{{ issue.category }}</span>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-gray-600">{{ issue.reporterName }}</span>
              </td>
              <td class="px-5 py-4">
                <span
                  class="text-xs px-2 py-1 rounded-full"
                  :class="getIssueStatusClass(issue.status)"
                >
                  {{ getIssueStatusLabel(issue.status) }}
                </span>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-gray-600">{{ formatDate(issue.createdAt) }}</span>
              </td>
              <td class="px-5 py-4">
                <button
                  @click="handleIssue(issue)"
                  class="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <Eye class="w-4 h-4" />
                  处理
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredIssues.length === 0" class="text-center py-12">
        <ClipboardList class="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p class="text-gray-500">暂无数据</p>
      </div>
    </div>
    
    <div
      v-if="showDrawer"
      class="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col"
    >
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">{{ selectedIssue?.title }}</h3>
        <button @click="closeDrawer" class="p-1 hover:bg-gray-100 rounded-lg">
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      <div class="flex border-b border-gray-200">
        <button
          @click="drawerStep = 'detail'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition relative',
            drawerStep === 'detail' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          详情
          <div
            v-if="drawerStep === 'detail'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
          ></div>
        </button>
        <button
          @click="drawerStep = 'history'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition relative',
            drawerStep === 'history' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          责任流转
          <div
            v-if="drawerStep === 'history'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
          ></div>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="drawerStep === 'detail'" v-show="drawerStep === 'detail'">
          <div v-if="selectedIssue" class="space-y-4">
            <div class="bg-gray-50 rounded-xl p-4">
              <h4 class="font-medium text-gray-900 mb-3">问题信息</h4>
              <div class="space-y-2 text-sm">
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
                <div class="flex justify-between">
                  <span class="text-gray-500">状态</span>
                  <span
                    class="text-xs px-2 py-1 rounded-full"
                    :class="getIssueStatusClass(selectedIssue.status)"
                  >
                    {{ getIssueStatusLabel(selectedIssue.status) }}
                  </span>
                </div>
                <div v-if="selectedIssue.assignedName" class="flex justify-between">
                  <span class="text-gray-500">处理人</span>
                  <span class="text-gray-900">{{ selectedIssue.assignedName }}</span>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 rounded-xl p-4">
              <h4 class="font-medium text-gray-900 mb-2">问题描述</h4>
              <p class="text-sm text-gray-900">{{ selectedIssue.description }}</p>
            </div>
            
            <div v-if="selectedIssue.visitRecord" class="bg-gray-50 rounded-xl p-4">
              <h4 class="font-medium text-gray-900 mb-3">关联回访</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">重点对象</span>
                  <span class="text-gray-900">{{ selectedIssue.visitRecord.keyPerson.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">地址</span>
                  <span class="text-gray-900">{{ selectedIssue.visitRecord.keyPerson.address }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">社工</span>
                  <span class="text-gray-900">{{ selectedIssue.visitRecord.socialWorkerName }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="canHandleIssue" class="space-y-2">
              <button
                v-if="selectedIssue.status === 'pending'"
                @click="handleIssueStatus('processing')"
                class="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
              >
                开始处理
              </button>
              <button
                v-if="selectedIssue.status === 'processing'"
                @click="handleIssueStatus('resolved')"
                class="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                完成处理
              </button>
              <button
                v-if="(selectedIssue.status === 'pending' || selectedIssue.status === 'processing') && canEscalate"
                @click="handleIssueStatus('escalated')"
                class="w-full py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
              >
                升级上报
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="drawerStep === 'history'" v-show="drawerStep === 'history'">
          <div v-if="selectedIssue" class="space-y-4">
            <div class="bg-gray-50 rounded-xl p-4">
              <h4 class="font-medium text-gray-900 mb-3">责任流转记录</h4>
              <div v-if="flowRecords.length === 0" class="text-center py-4 text-gray-500">
                <p>暂无流转记录</p>
              </div>
              <div v-else class="space-y-3">
                <div v-for="flow in flowRecords" :key="flow.id" class="flex items-start gap-3">
                  <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    :class="getFlowActionClass(flow.action)"
                  >
                    <component :is="getFlowActionIcon(flow.action)" class="w-4 h-4" :class="getFlowActionIconClass(flow.action)" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900">{{ flow.operatorName }}</span>
                      <span 
                        class="text-xs px-2 py-0.5 rounded-full"
                        :class="getFlowActionBadgeClass(flow.action)"
                      >
                        {{ flow.action }}
                      </span>
                    </div>
                    <p v-if="flow.details" class="text-sm text-gray-600 mt-1">{{ flow.details }}</p>
                    <p class="text-sm text-gray-500 mt-1">{{ formatDateTime(flow.createdAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ClipboardList, X, Eye, AlertTriangle, UserCheck, CheckCircle2, ArrowUpCircle, User } from 'lucide-vue-next'
import { useStore } from '@/store'
import type { Issue, IssueStatus, FlowRecord } from '@/types'

const store = useStore()

const activeTab = ref<IssueStatus | 'all'>('all')
const selectedIssue = ref<Issue | null>(null)
const flowRecords = ref<FlowRecord[]>([])
const showDrawer = ref(false)
const drawerStep = ref<'detail' | 'history'>('detail')

const currentRole = computed(() => store.state.currentUser?.role)
const canHandleIssue = computed(() => currentRole.value === 'volunteerLeader')
const canEscalate = computed(() => currentRole.value === 'volunteerLeader')

const tabs = computed(() => [
  { value: 'all' as const, label: '全部', count: store.state.issues.length },
  { value: 'pending' as const, label: '待处理', count: store.pendingIssues.value.length },
  { value: 'processing' as const, label: '处理中', count: store.state.issues.filter(i => i.status === 'processing').length },
  { value: 'resolved' as const, label: '已解决', count: store.state.issues.filter(i => i.status === 'resolved').length },
  { value: 'escalated' as const, label: '已升级', count: store.escalatedIssues.value.length }
])

const filteredIssues = computed(() => {
  if (activeTab.value === 'all') {
    return store.state.issues
  }
  return store.state.issues.filter(i => i.status === activeTab.value)
})

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

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

function getFlowActionIcon(action: string) {
  const map: Record<string, typeof User> = {
    '创建任务': User,
    '完成回访': CheckCircle2,
    '标记卡住': X,
    '协调解决': CheckCircle2,
    '上报问题': AlertTriangle,
    '开始处理': UserCheck,
    '处理完成': CheckCircle2,
    '升级上报': ArrowUpCircle
  }
  return map[action] || User
}

function getFlowActionIconClass(action: string): string {
  const map: Record<string, string> = {
    '创建任务': 'text-blue-600',
    '完成回访': 'text-green-600',
    '标记卡住': 'text-red-600',
    '协调解决': 'text-green-600',
    '上报问题': 'text-yellow-600',
    '开始处理': 'text-blue-600',
    '处理完成': 'text-green-600',
    '升级上报': 'text-red-600'
  }
  return map[action] || 'text-gray-600'
}

function getFlowActionClass(action: string): string {
  const map: Record<string, string> = {
    '创建任务': 'bg-blue-100',
    '完成回访': 'bg-green-100',
    '标记卡住': 'bg-red-100',
    '协调解决': 'bg-green-100',
    '上报问题': 'bg-yellow-100',
    '开始处理': 'bg-blue-100',
    '处理完成': 'bg-green-100',
    '升级上报': 'bg-red-100'
  }
  return map[action] || 'bg-gray-100'
}

function getFlowActionBadgeClass(action: string): string {
  const map: Record<string, string> = {
    '创建任务': 'bg-blue-100 text-blue-700',
    '完成回访': 'bg-green-100 text-green-700',
    '标记卡住': 'bg-red-100 text-red-700',
    '协调解决': 'bg-green-100 text-green-700',
    '上报问题': 'bg-yellow-100 text-yellow-700',
    '开始处理': 'bg-blue-100 text-blue-700',
    '处理完成': 'bg-green-100 text-green-700',
    '升级上报': 'bg-red-100 text-red-700'
  }
  return map[action] || 'bg-gray-100 text-gray-700'
}

async function handleIssue(issue: Issue) {
  selectedIssue.value = issue
  drawerStep.value = 'detail'
  flowRecords.value = await store.loadFlowRecords('issue', issue.id)
  showDrawer.value = true
}

function closeDrawer() {
  showDrawer.value = false
  selectedIssue.value = null
  flowRecords.value = []
}

async function handleIssueStatus(status: IssueStatus) {
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
  closeDrawer()
}
</script>
