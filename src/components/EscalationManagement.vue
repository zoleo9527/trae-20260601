<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">异常处理</h2>
        <p class="text-gray-500 mt-1">处理卡住的回访和升级的问题</p>
      </div>
    </div>
    
    <div class="flex gap-2 mb-4">
      <button
        @click="activeTab = 'blocked'"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2',
          activeTab === 'blocked'
            ? 'bg-red-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        <XCircle class="w-4 h-4" />
        卡住的回访
        <span
          v-if="store.blockedVisits.value.length > 0"
          class="text-xs px-2 py-0.5 rounded-full"
          :class="activeTab === 'blocked' ? 'bg-white/20' : 'bg-white'"
        >
          {{ store.blockedVisits.value.length }}
        </span>
      </button>
      <button
        @click="activeTab = 'escalated'"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2',
          activeTab === 'escalated'
            ? 'bg-orange-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        <AlertTriangle class="w-4 h-4" />
        升级的问题
        <span
          v-if="store.escalatedIssues.value.length > 0"
          class="text-xs px-2 py-0.5 rounded-full"
          :class="activeTab === 'escalated' ? 'bg-white/20' : 'bg-white'"
        >
          {{ store.escalatedIssues.value.length }}
        </span>
      </button>
    </div>
    
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">标题/姓名</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">分类/类型</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">负责人</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">时间</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="activeTab === 'blocked'">
              <tr v-for="visit in store.blockedVisits.value" :key="visit.id" class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-5 py-4">
                  <div>
                    <p class="font-medium text-gray-900">{{ visit.keyPerson.name }}</p>
                    <p class="text-sm text-gray-500">{{ visit.keyPerson.address }}</p>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                    {{ visit.keyPerson.type }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-600">{{ visit.socialWorkerName }}</span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-600">{{ formatDate(visit.updatedAt) }}</span>
                </td>
                <td class="px-5 py-4">
                  <button
                    @click="handleVisitItem(visit)"
                    class="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Eye class="w-4 h-4" />
                    处理
                  </button>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="issue in store.escalatedIssues.value" :key="issue.id" class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-5 py-4">
                  <div>
                    <p class="font-medium text-gray-900">{{ issue.title }}</p>
                    <p class="text-sm text-gray-500">{{ truncateText(issue.description, 30) }}</p>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span class="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                    {{ issue.category }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-600">{{ issue.reporterName }}</span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-600">{{ formatDate(issue.updatedAt) }}</span>
                </td>
                <td class="px-5 py-4">
                  <button
                    @click="handleIssueItem(issue)"
                    class="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Eye class="w-4 h-4" />
                    处理
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div v-if="displayedItems.length === 0" class="text-center py-12">
        <CheckCircle class="w-12 h-12 mx-auto text-green-500 mb-2" />
        <p class="text-gray-500">暂无异常记录</p>
      </div>
    </div>
    
    <div
      v-if="showDrawer"
      class="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col"
    >
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">{{ drawerTitle }}</h3>
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
          <template v-if="activeTab === 'blocked' && selectedVisit">
            <div class="space-y-4">
              <div class="bg-red-50 rounded-xl p-4">
                <div class="flex items-center gap-2">
                  <h4 class="font-medium text-gray-900">{{ selectedVisit.keyPerson.name }}</h4>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">回访卡住</span>
                </div>
              </div>
              
              <div class="bg-gray-50 rounded-xl p-4">
                <h4 class="font-medium text-gray-900 mb-3">重点对象信息</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">类型</span>
                    <span class="text-gray-900">{{ selectedVisit.keyPerson.type }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">关怀等级</span>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full"
                      :class="getCareLevelClass(selectedVisit.keyPerson.careLevel)"
                    >
                      {{ getCareLevelLabel(selectedVisit.keyPerson.careLevel) }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">地址</span>
                    <span class="text-gray-900">{{ selectedVisit.keyPerson.address }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">电话</span>
                    <span class="text-gray-900">{{ selectedVisit.keyPerson.phone }}</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-gray-50 rounded-xl p-4">
                <h4 class="font-medium text-gray-900 mb-3">回访信息</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">计划日期</span>
                    <span class="text-gray-900">{{ selectedVisit.scheduledDate }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">社工</span>
                    <span class="text-gray-900">{{ selectedVisit.socialWorkerName }}</span>
                  </div>
                </div>
              </div>
              
              <div v-if="selectedVisit.notes" class="bg-red-50 rounded-xl p-4">
                <h4 class="font-medium text-gray-900 mb-2">卡住原因</h4>
                <p class="text-sm text-gray-900">{{ selectedVisit.notes }}</p>
              </div>
              
              <div v-if="canResolve" class="space-y-2">
                <textarea
                  v-model="resolveNote"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  rows="3"
                  placeholder="请输入处理备注..."
                ></textarea>
                <button
                  @click="resolveBlockedVisit"
                  class="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle class="w-4 h-4" />
                  已协调解决
                </button>
              </div>
            </div>
          </template>
          
          <template v-else-if="activeTab === 'escalated' && selectedIssue">
            <div class="space-y-4">
              <div class="bg-orange-50 rounded-xl p-4">
                <div class="flex items-center gap-2">
                  <h4 class="font-medium text-gray-900">{{ selectedIssue.title }}</h4>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">问题升级</span>
                </div>
              </div>
              
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
                    <span class="text-gray-500">升级原因</span>
                    <span class="text-gray-900">{{ selectedIssue.escalationReason || '未填写' }}</span>
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
              
              <div v-if="canResolve" class="space-y-2">
                <textarea
                  v-model="resolveNote"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  rows="3"
                  placeholder="请输入处理备注..."
                ></textarea>
                <button
                  @click="resolveEscalatedIssue"
                  class="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle class="w-4 h-4" />
                  已处理完成
                </button>
              </div>
            </div>
          </template>
        </div>
        
        <div v-if="drawerStep === 'history'" v-show="drawerStep === 'history'">
          <template v-if="activeTab === 'blocked' && selectedVisit">
            <div class="space-y-4">
              <div class="bg-gray-50 rounded-xl p-4">
                <h4 class="font-medium text-gray-900 mb-3">责任流转记录</h4>
                <div class="space-y-3">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon class="w-4 h-4 text-blue-600" />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">{{ selectedVisit.socialWorkerName }}</span>
                        <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">创建任务</span>
                      </div>
                      <p class="text-sm text-gray-500 mt-1">{{ formatDateTime(selectedVisit.createdAt) }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <XCircle class="w-4 h-4 text-red-600" />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">{{ selectedVisit.socialWorkerName }}</span>
                        <span class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">标记卡住</span>
                      </div>
                      <p class="text-sm text-gray-500 mt-1">{{ formatDateTime(selectedVisit.updatedAt) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          
          <template v-else-if="activeTab === 'escalated' && selectedIssue">
            <div class="space-y-4">
              <div class="bg-gray-50 rounded-xl p-4">
                <h4 class="font-medium text-gray-900 mb-3">责任流转记录</h4>
                <div class="space-y-3">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle class="w-4 h-4 text-yellow-600" />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">{{ selectedIssue.reporterName }}</span>
                        <span class="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">上报问题</span>
                      </div>
                      <p class="text-sm text-gray-700 mt-1">{{ selectedIssue.title }}</p>
                      <p class="text-sm text-gray-500">{{ formatDateTime(selectedIssue.createdAt) }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-3 ml-11">
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ArrowUpCircle class="w-4 h-4 text-red-600" />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">{{ selectedIssue.assignedName || selectedIssue.reporterName }}</span>
                        <span class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">升级上报</span>
                      </div>
                      <p class="text-sm text-gray-500">{{ formatDateTime(selectedIssue.updatedAt) }}</p>
                      <p v-if="selectedIssue.escalationReason" class="text-sm text-gray-600 mt-1">原因: {{ selectedIssue.escalationReason }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { XCircle, AlertTriangle, User as UserIcon, CheckCircle, X, Eye, ArrowUpCircle } from 'lucide-vue-next'
import { useStore } from '@/store'
import type { VisitRecord, Issue } from '@/types'

const store = useStore()

const activeTab = ref<'blocked' | 'escalated'>('blocked')
const selectedVisit = ref<VisitRecord | null>(null)
const selectedIssue = ref<Issue | null>(null)
const showDrawer = ref(false)
const drawerStep = ref<'detail' | 'history'>('detail')
const resolveNote = ref('')

const currentRole = computed(() => store.state.currentUser?.role)
const canResolve = computed(() => currentRole.value === 'communityLeader')

const displayedItems = computed(() => {
  if (activeTab.value === 'blocked') {
    return store.blockedVisits.value
  }
  return store.escalatedIssues.value
})

const drawerTitle = computed(() => {
  if (activeTab.value === 'blocked' && selectedVisit.value) {
    return `${selectedVisit.value.keyPerson.name} - 异常详情`
  }
  if (activeTab.value === 'escalated' && selectedIssue.value) {
    return `${selectedIssue.value.title} - 异常详情`
  }
  return '异常详情'
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function getCareLevelLabel(level: 'high' | 'medium' | 'low'): string {
  const map: Record<string, string> = {
    high: '重点关注',
    medium: '一般关注',
    low: '常规关注'
  }
  return map[level]
}

function getCareLevelClass(level: 'high' | 'medium' | 'low'): string {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  }
  return map[level]
}

function handleVisitItem(visit: VisitRecord) {
  selectedVisit.value = visit
  selectedIssue.value = null
  drawerStep.value = 'detail'
  resolveNote.value = ''
  showDrawer.value = true
}

function handleIssueItem(issue: Issue) {
  selectedIssue.value = issue
  selectedVisit.value = null
  drawerStep.value = 'detail'
  resolveNote.value = ''
  showDrawer.value = true
}

function closeDrawer() {
  showDrawer.value = false
  selectedVisit.value = null
  selectedIssue.value = null
  resolveNote.value = ''
}

async function resolveBlockedVisit() {
  if (!selectedVisit.value) return
  
  await store.updateVisitRecord(selectedVisit.value.id, {
    status: 'pending',
    notes: resolveNote.value || '社区干部已协调解决'
  })
  
  closeDrawer()
}

async function resolveEscalatedIssue() {
  if (!selectedIssue.value) return
  
  await store.updateIssue(selectedIssue.value.id, {
    status: 'resolved',
    assignedTo: store.state.currentUser?.id,
    assignedName: store.state.currentUser?.name,
    escalationReason: resolveNote.value || selectedIssue.value.escalationReason
  })
  
  closeDrawer()
}
</script>
