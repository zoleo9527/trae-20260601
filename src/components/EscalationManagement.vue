<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">异常处理</h2>
        <p class="text-gray-500 mt-1">处理卡住的回访和升级的问题</p>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
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
          
          <div class="space-y-3">
            <div
              v-for="item in displayedItems"
              :key="item.id"
              @click="selectItem(item)"
              :class="[
                'p-4 rounded-lg border cursor-pointer transition',
                selectedItem?.id === item.id
                  ? activeTab === 'blocked'
                    ? 'border-red-500 bg-red-50'
                    : 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <h4 class="font-medium text-gray-900">
                      {{ activeTab === 'blocked' ? item.keyPerson.name : item.title }}
                    </h4>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full"
                      :class="activeTab === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'"
                    >
                      {{ activeTab === 'blocked' ? '回访卡住' : '问题升级' }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 mt-1 line-clamp-2">
                    {{ activeTab === 'blocked' ? item.keyPerson.address : item.description }}
                  </p>
                  <div class="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span v-if="activeTab === 'blocked'" class="flex items-center gap-1">
                      <User class="w-3 h-3" />
                      {{ item.socialWorkerName }}
                    </span>
                    <span v-if="activeTab === 'escalated'" class="flex items-center gap-1">
                      <User class="w-3 h-3" />
                      {{ item.reporterName }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      {{ formatDate(item.updatedAt) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="displayedItems.length === 0" class="text-center py-12">
              <CheckCircle class="w-12 h-12 mx-auto text-green-500 mb-2" />
              <p class="text-gray-500">暂无异常记录</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-6">
          <div class="px-4 py-3 border-b border-gray-200">
            <h3 class="font-semibold text-gray-900">异常详情</h3>
          </div>
          
          <div v-if="selectedItem" class="p-4">
            <div v-if="activeTab === 'blocked'" class="space-y-4">
              <div>
                <h4 class="font-medium text-gray-900">{{ selectedItem.keyPerson.name }}</h4>
                <span class="text-xs px-2 py-0.5 rounded-full mt-2 inline-block bg-red-100 text-red-700">
                  回访卡住
                </span>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">类型</span>
                  <span class="text-gray-900">{{ selectedItem.keyPerson.type }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">关怀等级</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="getCareLevelClass(selectedItem.keyPerson.careLevel)"
                  >
                    {{ getCareLevelLabel(selectedItem.keyPerson.careLevel) }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">地址</span>
                  <span class="text-gray-900">{{ selectedItem.keyPerson.address }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">社工</span>
                  <span class="text-gray-900">{{ selectedItem.socialWorkerName }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">计划日期</span>
                  <span class="text-gray-900">{{ selectedItem.scheduledDate }}</span>
                </div>
              </div>
              
              <div v-if="selectedItem.notes" class="mt-4">
                <span class="text-sm text-gray-500 block mb-2">卡住原因</span>
                <p class="text-sm text-gray-900 bg-red-50 p-3 rounded-lg">{{ selectedItem.notes }}</p>
              </div>
              
              <div class="mt-6 space-y-2">
                <button
                  @click="resolveBlockedVisit"
                  class="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle class="w-4 h-4" />
                  已协调解决
                </button>
              </div>
            </div>
            
            <div v-else class="space-y-4">
              <div>
                <h4 class="font-medium text-gray-900">{{ selectedItem.title }}</h4>
                <span class="text-xs px-2 py-0.5 rounded-full mt-2 inline-block bg-orange-100 text-orange-700">
                  问题升级
                </span>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">分类</span>
                  <span class="text-gray-900">{{ selectedItem.category }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">上报人</span>
                  <span class="text-gray-900">{{ selectedItem.reporterName }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">升级原因</span>
                  <span class="text-gray-900">{{ selectedItem.escalationReason || '未填写' }}</span>
                </div>
              </div>
              
              <div class="mt-4">
                <span class="text-sm text-gray-500 block mb-2">问题描述</span>
                <p class="text-sm text-gray-900 bg-orange-50 p-3 rounded-lg">{{ selectedItem.description }}</p>
              </div>
              
              <div v-if="selectedItem.visitRecord" class="mt-4">
                <span class="text-sm text-gray-500 block mb-2">关联回访</span>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-sm text-gray-900">{{ selectedItem.visitRecord.keyPerson.name }}</p>
                  <p class="text-xs text-gray-500">{{ selectedItem.visitRecord.keyPerson.address }}</p>
                </div>
              </div>
              
              <div class="mt-6 space-y-2">
                <button
                  @click="resolveEscalatedIssue"
                  class="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle class="w-4 h-4" />
                  已处理完成
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="p-8 text-center">
            <MousePointerClick class="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p class="text-gray-500">请选择一个异常</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { XCircle, AlertTriangle, User, Calendar, CheckCircle, MousePointerClick } from 'lucide-vue-next'
import { useStore } from '@/store'
import type { VisitRecord, Issue } from '@/types'

const store = useStore()

const activeTab = ref<'blocked' | 'escalated'>('blocked')
const selectedItem = ref<VisitRecord | Issue | null>(null)

const displayedItems = computed(() => {
  if (activeTab.value === 'blocked') {
    return store.blockedVisits.value
  }
  return store.escalatedIssues.value
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
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

function selectItem(item: VisitRecord | Issue) {
  selectedItem.value = item
}

async function resolveBlockedVisit() {
  if (!selectedItem.value || activeTab.value !== 'blocked') return
  
  await store.updateVisitRecord(selectedItem.value.id, {
    status: 'pending'
  })
  
  selectedItem.value = null
}

async function resolveEscalatedIssue() {
  if (!selectedItem.value || activeTab.value !== 'escalated') return
  
  await store.updateIssue(selectedItem.value.id, {
    status: 'resolved',
    assignedTo: store.state.currentUser?.id,
    assignedName: store.state.currentUser?.name
  })
  
  selectedItem.value = null
}
</script>
