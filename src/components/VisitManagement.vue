<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">重点对象回访</h2>
        <p class="text-gray-500 mt-1">管理重点对象的回访任务</p>
      </div>
      <button
        v-if="canCreateVisit"
        @click="showAddModal = true"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
      >
        <Plus class="w-5 h-5" />
        新建回访任务
      </button>
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
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">重点对象</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">类型</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">关怀等级</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">计划日期</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">状态</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="visit in filteredVisits" :key="visit.id" class="border-t border-gray-100 hover:bg-gray-50">
              <td class="px-5 py-4">
                <div>
                  <p class="font-medium text-gray-900">{{ visit.keyPerson.name }}</p>
                  <p class="text-sm text-gray-500">{{ visit.keyPerson.address }}</p>
                </div>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-gray-600">{{ visit.keyPerson.type }}</span>
              </td>
              <td class="px-5 py-4">
                <span
                  class="text-xs px-2 py-1 rounded-full"
                  :class="getCareLevelClass(visit.keyPerson.careLevel)"
                >
                  {{ getCareLevelLabel(visit.keyPerson.careLevel) }}
                </span>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-gray-600">{{ visit.scheduledDate }}</span>
              </td>
              <td class="px-5 py-4">
                <span
                  class="text-xs px-2 py-1 rounded-full"
                  :class="getStatusClass(visit.status)"
                >
                  {{ getStatusLabel(visit.status) }}
                </span>
              </td>
              <td class="px-5 py-4">
                <button
                  @click="handleVisit(visit)"
                  class="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <Eye class="w-4 h-4" />
                  查看
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredVisits.length === 0" class="text-center py-12">
        <ClipboardList class="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p class="text-gray-500">暂无数据</p>
      </div>
    </div>
    
    <div
      v-if="showVisitDrawer"
      class="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col"
    >
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">{{ drawerTitle }}</h3>
        <button @click="closeVisitDrawer" class="p-1 hover:bg-gray-100 rounded-lg">
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      <div class="flex border-b border-gray-200">
        <button
          @click="drawerStep = 'visit'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition relative',
            drawerStep === 'visit' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          回访处理
          <div
            v-if="drawerStep === 'visit'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
          ></div>
        </button>
        <button
          @click="drawerStep = 'issue'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition relative',
            drawerStep === 'issue' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          问题上报
          <span
            v-if="hasRelatedIssues"
            class="ml-1 text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full"
          >
            {{ relatedIssues.length }}
          </span>
          <div
            v-if="drawerStep === 'issue'"
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
      
      <div class="flex-1 overflow-y-auto">
        <div v-if="drawerStep === 'visit'" v-show="drawerStep === 'visit'" class="p-4">
          <div v-if="selectedVisit" class="space-y-4">
            <div class="bg-gray-50 rounded-xl p-4">
              <h4 class="font-medium text-gray-900 mb-3">重点对象信息</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">姓名</span>
                  <span class="text-sm text-gray-900">{{ selectedVisit.keyPerson.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">年龄</span>
                  <span class="text-sm text-gray-900">{{ selectedVisit.keyPerson.age }}岁</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">地址</span>
                  <span class="text-sm text-gray-900">{{ selectedVisit.keyPerson.address }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">电话</span>
                  <span class="text-sm text-gray-900">{{ selectedVisit.keyPerson.phone }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">类型</span>
                  <span class="text-sm text-gray-900">{{ selectedVisit.keyPerson.type }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">关怀等级</span>
                  <span
                    class="text-xs px-2 py-1 rounded-full"
                    :class="getCareLevelClass(selectedVisit.keyPerson.careLevel)"
                  >
                    {{ getCareLevelLabel(selectedVisit.keyPerson.careLevel) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 rounded-xl p-4">
              <h4 class="font-medium text-gray-900 mb-3">回访信息</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">计划日期</span>
                  <span class="text-sm text-gray-900">{{ selectedVisit.scheduledDate }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">状态</span>
                  <span
                    class="text-xs px-2 py-1 rounded-full"
                    :class="getStatusClass(selectedVisit.status)"
                  >
                    {{ getStatusLabel(selectedVisit.status) }}
                  </span>
                </div>
                <div v-if="selectedVisit.actualDate" class="flex justify-between">
                  <span class="text-sm text-gray-500">实际回访日期</span>
                  <span class="text-sm text-gray-900">{{ selectedVisit.actualDate }}</span>
                </div>
                <div v-if="selectedVisit.notes" class="mt-4">
                  <span class="text-sm text-gray-500 block mb-1">回访记录</span>
                  <p class="text-sm text-gray-900 bg-white p-3 rounded-lg">{{ selectedVisit.notes }}</p>
                </div>
              </div>
            </div>
            
            <div v-if="selectedVisit.status !== 'completed'" class="space-y-3">
              <textarea
                v-model="visitNotes"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                rows="4"
                placeholder="请输入回访记录..."
              ></textarea>
              
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-if="selectedVisit.status === 'pending' && canCompleteVisit"
                  @click="completeVisit"
                  class="py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  完成回访
                </button>
                <button
                  v-if="canBlockVisit"
                  @click="blockVisit"
                  class="py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  标记卡住
                </button>
              </div>
            </div>
            
            <div v-if="selectedVisit.status === 'completed'" class="space-y-3">
              <button
                v-if="canReportIssue"
                @click="drawerStep = 'issue'"
                class="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium flex items-center justify-center gap-2"
              >
                <AlertTriangle class="w-5 h-5" />
                上报问题
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="drawerStep === 'issue'" v-show="drawerStep === 'issue'" class="p-4">
          <div v-if="selectedVisit" class="space-y-4">
            <div v-if="!isCreatingIssue && hasRelatedIssues" class="space-y-3">
              <div
                v-for="issue in relatedIssues"
                :key="issue.id"
                class="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900">{{ issue.title }}</h4>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="getIssueStatusClass(issue.status)"
                  >
                    {{ getIssueStatusLabel(issue.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600">{{ issue.description }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>分类: {{ issue.category }}</span>
                  <span>上报人: {{ issue.reporterName }}</span>
                  <span>{{ formatDate(issue.createdAt) }}</span>
                </div>
                <div v-if="issue.assignedName" class="mt-2 text-xs text-gray-500">
                  处理人: {{ issue.assignedName }}
                </div>
              </div>
            </div>
            
            <div v-if="!isCreatingIssue && !hasRelatedIssues" class="text-center py-8">
              <AlertTriangle class="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p class="text-gray-500">暂无相关问题</p>
            </div>
            
            <div v-if="isCreatingIssue" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">问题标题</label>
                <input
                  v-model="issueForm.title"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  placeholder="请输入问题标题"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">问题分类</label>
                <select
                  v-model="issueForm.category"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                >
                  <option value="">请选择分类</option>
                  <option value="生活物资">生活物资</option>
                  <option value="紧急情况">紧急情况</option>
                  <option value="沟通协调">沟通协调</option>
                  <option value="就业帮扶">就业帮扶</option>
                  <option value="医疗健康">医疗健康</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
                <textarea
                  v-model="issueForm.description"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  rows="5"
                  placeholder="请详细描述问题..."
                ></textarea>
              </div>
              
              <div class="flex gap-3">
                <button
                  @click="cancelCreateIssue"
                  class="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  取消
                </button>
                <button
                  @click="submitIssue"
                  :disabled="!issueForm.title || !issueForm.category || !issueForm.description"
                  class="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  提交问题
                </button>
              </div>
            </div>
            
            <button
              v-if="!isCreatingIssue && canReportIssue"
              @click="startCreateIssue"
              class="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition font-medium text-gray-600"
            >
              + 新增问题
            </button>
          </div>
        </div>
        
        <div v-if="drawerStep === 'history'" v-show="drawerStep === 'history'" class="p-4">
          <div v-if="selectedVisit" class="space-y-4">
            <div class="bg-gray-50 rounded-xl p-4">
              <h4 class="font-medium text-gray-900 mb-3">回访责任流转</h4>
              <div v-if="visitFlowRecords.length === 0" class="text-center py-4 text-gray-500">
                <History class="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>暂无流转记录</p>
              </div>
              <div v-else class="space-y-3">
                <div v-for="flow in visitFlowRecords" :key="flow.id" class="flex items-start gap-3">
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
            
            <div v-if="hasRelatedIssues" class="bg-gray-50 rounded-xl p-4">
              <h4 class="font-medium text-gray-900 mb-3">问题责任流转</h4>
              <div class="space-y-4">
                <div v-for="issue in relatedIssues" :key="issue.id">
                  <div v-if="issueFlowRecords[issue.id]" class="space-y-3">
                    <div v-for="flow in issueFlowRecords[issue.id]" :key="flow.id" class="flex items-start gap-3">
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
            
            <div v-if="!hasRelatedIssues" class="text-center py-8">
              <History class="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p class="text-gray-500">暂无问题责任流转记录</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">新建回访任务</h3>
          <button @click="showAddModal = false" class="p-1 hover:bg-gray-100 rounded-lg">
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择重点对象</label>
            <select
              v-model="newVisitForm.keyPersonId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            >
              <option value="">请选择</option>
              <option v-for="kp in keyPersons" :key="kp.id" :value="kp.id">
                {{ kp.name }} - {{ kp.type }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">计划日期</label>
            <input
              v-model="newVisitForm.scheduledDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          
          <button
            @click="submitNewVisit"
            :disabled="!newVisitForm.keyPersonId || !newVisitForm.scheduledDate"
            class="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            创建任务
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Eye, X, ClipboardList, AlertTriangle, User, CheckCircle, XCircle, UserCheck, CheckCircle2, ArrowUpCircle, History } from 'lucide-vue-next'
import { useStore } from '@/store'
import { getKeyPersons, createVisitRecord, getIssuesByVisitId } from '@/api'
import type { VisitRecord, KeyPerson, VisitStatus, IssueStatus, Issue, FlowRecord } from '@/types'

const store = useStore()

const activeTab = ref<VisitStatus | 'all'>('all')
const showVisitDrawer = ref(false)
const showAddModal = ref(false)
const selectedVisit = ref<VisitRecord | null>(null)
const visitNotes = ref('')
const keyPersons = ref<KeyPerson[]>([])
const relatedIssues = ref<Issue[]>([])
const visitFlowRecords = ref<FlowRecord[]>([])
const issueFlowRecords = ref<Record<string, FlowRecord[]>>({})

const drawerStep = ref<'visit' | 'issue' | 'history'>('visit')
const isCreatingIssue = ref(false)

const issueForm = ref({
  title: '',
  category: '',
  description: ''
})

const newVisitForm = ref({
  keyPersonId: '',
  scheduledDate: ''
})

const currentRole = computed(() => store.state.currentUser?.role)

const canCreateVisit = computed(() => currentRole.value === 'socialWorker')
const canCompleteVisit = computed(() => currentRole.value === 'socialWorker')
const canBlockVisit = computed(() => ['socialWorker', 'volunteerLeader'].includes(currentRole.value || ''))
const canReportIssue = computed(() => currentRole.value === 'socialWorker')

const hasRelatedIssues = computed(() => relatedIssues.value.length > 0)

const drawerTitle = computed(() => {
  if (!selectedVisit.value) return '回访详情'
  return `${selectedVisit.value.keyPerson.name} - 回访详情`
})

const tabs = computed(() => [
  { value: 'all' as const, label: '全部', count: store.state.visitRecords.length },
  { value: 'pending' as const, label: '待回访', count: store.state.visitRecords.filter(v => v.status === 'pending').length },
  { value: 'completed' as const, label: '已完成', count: store.state.visitRecords.filter(v => v.status === 'completed').length },
  { value: 'overdue' as const, label: '已超期', count: store.state.visitRecords.filter(v => v.status === 'overdue').length },
  { value: 'blocked' as const, label: '已卡住', count: store.state.visitRecords.filter(v => v.status === 'blocked').length }
])

const filteredVisits = computed(() => {
  if (activeTab.value === 'all') {
    return store.state.visitRecords
  }
  return store.state.visitRecords.filter(v => v.status === activeTab.value)
})

watch(selectedVisit, async (visit) => {
  if (visit) {
    relatedIssues.value = await getIssuesByVisitId(visit.id)
    visitFlowRecords.value = await store.loadFlowRecords('visit', visit.id)
    for (const issue of relatedIssues.value) {
      issueFlowRecords.value[issue.id] = await store.loadFlowRecords('issue', issue.id)
    }
  }
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getFlowActionIcon(action: string) {
  const map: Record<string, typeof User> = {
    '创建任务': User,
    '完成回访': CheckCircle,
    '标记卡住': XCircle,
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

function handleVisit(visit: VisitRecord) {
  selectedVisit.value = visit
  visitNotes.value = visit.notes || ''
  drawerStep.value = 'visit'
  isCreatingIssue.value = false
  showVisitDrawer.value = true
}

function closeVisitDrawer() {
  showVisitDrawer.value = false
  selectedVisit.value = null
  visitNotes.value = ''
  isCreatingIssue.value = false
  issueForm.value = { title: '', category: '', description: '' }
}

async function completeVisit() {
  if (!selectedVisit.value) return
  
  await store.updateVisitRecord(selectedVisit.value.id, {
    status: 'completed',
    actualDate: new Date().toISOString().split('T')[0],
    notes: visitNotes.value
  })
  
  selectedVisit.value = {
    ...selectedVisit.value,
    status: 'completed',
    actualDate: new Date().toISOString().split('T')[0],
    notes: visitNotes.value
  }
}

async function blockVisit() {
  if (!selectedVisit.value) return
  
  await store.updateVisitRecord(selectedVisit.value.id, {
    status: 'blocked',
    notes: visitNotes.value || '回访受阻，需要社区干部介入'
  })
  
  selectedVisit.value = {
    ...selectedVisit.value,
    status: 'blocked',
    notes: visitNotes.value || '回访受阻，需要社区干部介入'
  }
}

function startCreateIssue() {
  isCreatingIssue.value = true
}

function cancelCreateIssue() {
  isCreatingIssue.value = false
  issueForm.value = { title: '', category: '', description: '' }
}

async function submitIssue() {
  if (!selectedVisit.value) return
  
  const newIssue = await store.createIssue({
    visitId: selectedVisit.value.id,
    reporterId: store.state.currentUser?.id || '',
    reporterName: store.state.currentUser?.name || '',
    title: issueForm.value.title,
    description: issueForm.value.description,
    category: issueForm.value.category,
    status: 'pending' as IssueStatus
  })
  
  relatedIssues.value.push(newIssue)
  isCreatingIssue.value = false
  issueForm.value = { title: '', category: '', description: '' }
}

async function submitNewVisit() {
  const kp = keyPersons.value.find(k => k.id === newVisitForm.value.keyPersonId)
  if (!kp) return
  
  await createVisitRecord({
    keyPersonId: newVisitForm.value.keyPersonId,
    keyPerson: kp,
    socialWorkerId: store.state.currentUser?.id || '',
    socialWorkerName: store.state.currentUser?.name || '',
    scheduledDate: newVisitForm.value.scheduledDate,
    status: 'pending'
  })
  
  await store.loadData()
  showAddModal.value = false
  newVisitForm.value = { keyPersonId: '', scheduledDate: '' }
}

onMounted(async () => {
  keyPersons.value = await getKeyPersons()
})
</script>
