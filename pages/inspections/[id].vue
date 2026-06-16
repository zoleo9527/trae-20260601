<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useInspectionStore } from '~/stores/inspection'
import { computed, ref } from 'vue'

const route = useRoute()
const store = useInspectionStore()

const inspectionId = computed(() => route.params.id as string)

const inspection = computed(() => {
  return store.inspections.find(i => i.id === inspectionId.value)
})

const relatedTasks = computed(() => {
  return store.rectificationTasks.filter(t => t.inspectionId === inspectionId.value)
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '进行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-primary-100 text-primary-600',
    completed: 'bg-success-100 text-success-600',
    overdue: 'bg-danger-100 text-danger-600'
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

const getResultLabel = (result: string) => {
  const labels: Record<string, string> = {
    pass: '合格',
    fail: '不合格',
    pending: '待检查'
  }
  return labels[result] || result
}

const getResultColor = (result: string) => {
  const colors: Record<string, string> = {
    pass: 'bg-success-100 text-success-600',
    fail: 'bg-danger-100 text-danger-600',
    pending: 'bg-gray-100 text-gray-600'
  }
  return colors[result] || 'bg-gray-100 text-gray-600'
}

const categories = computed(() => {
  if (!inspection.value) return []
  return [...new Set(inspection.value.items.map(i => i.category))]
})

const showAddTaskModal = ref(false)
const newTask = ref({
  title: '',
  description: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  assigneeRole: 'store_manager' as 'store_manager' | 'regional_supervisor' | 'purchaser',
})

const handleAddTask = () => {
  if (!inspection.value || !newTask.value.title) return
  
  const assignees: Record<string, string> = {
    store_manager: store.stores.find(s => s.id === inspection.value!.storeId)?.manager || '店长',
    regional_supervisor: '区域督导',
    purchaser: '采购专员'
  }
  
  store.addRectificationTask({
    inspectionId: inspection.value.id,
    storeId: inspection.value.storeId,
    storeName: inspection.value.storeName,
    title: newTask.value.title,
    description: newTask.value.description,
    priority: newTask.value.priority,
    status: 'pending',
    assignee: assignees[newTask.value.assigneeRole],
    assigneeRole: newTask.value.assigneeRole,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  
  showAddTaskModal.value = false
  newTask.value = {
    title: '',
    description: '',
    priority: 'medium',
    assigneeRole: 'store_manager'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              @click="navigateTo('/inspections')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">巡店检查详情</h1>
              <p class="text-sm text-gray-500">{{ inspection?.storeName }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span
              v-if="inspection"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium',
                getStatusColor(inspection.status)
              ]"
            >
              {{ getStatusLabel(inspection.status) }}
            </span>
            <button
              @click="showAddTaskModal = true"
              class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              📝 创建整改任务
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div v-if="!inspection" class="text-center py-12">
        <span class="text-4xl">🔍</span>
        <p class="mt-4 text-gray-500">未找到巡店检查记录</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-500">检查日期</p>
                <p class="font-medium text-gray-900">{{ inspection.inspectDate }}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-500">督导</p>
                <p class="font-medium text-gray-900">{{ inspection.inspector }}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-500">检查项目数</p>
                <p class="font-medium text-gray-900">{{ inspection.items.length }} 项</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-500">不合格项</p>
                <p class="font-medium text-danger-600">{{ inspection.items.filter(i => i.result === 'fail').length }} 项</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">检查项目</h2>
            <div class="space-y-4">
              <div
                v-for="category in categories"
                :key="category"
                class="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <span class="font-medium text-gray-900">{{ category }}</span>
                  <span class="ml-2 text-sm text-gray-500">
                    ({{ inspection.items.filter(i => i.category === category && i.result === 'pass').length }}/{{ inspection.items.filter(i => i.category === category).length }} 合格)
                  </span>
                </div>
                <div class="divide-y divide-gray-100">
                  <div
                    v-for="item in inspection.items.filter(i => i.category === category)"
                    :key="item.id"
                    class="px-4 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2">
                          <span class="font-medium text-gray-900">{{ item.name }}</span>
                          <span
                            :class="[
                              'px-2 py-0.5 rounded text-xs font-medium',
                              getResultColor(item.result)
                            ]"
                          >
                            {{ getResultLabel(item.result) }}
                          </span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">标准: {{ item.standard }}</p>
                        <p v-if="item.comment" class="text-sm text-danger-600 mt-2">
                          💬 {{ item.comment }}
                        </p>
                      </div>
                      <span class="text-2xl">
                        {{ item.result === 'pass' ? '✅' : item.result === 'fail' ? '❌' : '⏳' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">检查总结</h2>
            <p class="text-gray-600">{{ inspection.summary }}</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">关联整改任务</h2>
              <span class="text-sm text-gray-500">{{ relatedTasks.length }} 项</span>
            </div>
            <div class="space-y-3">
              <div
                v-for="task in relatedTasks"
                :key="task.id"
                class="p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors cursor-pointer"
                @click="navigateTo(`/rectification/${task.id}`)"
              >
                <div class="flex items-start justify-between mb-2">
                  <span class="font-medium text-gray-900">{{ task.title }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-medium',
                      task.priority === 'high' ? 'bg-danger-100 text-danger-600' :
                      task.priority === 'medium' ? 'bg-warning-100 text-warning-600' :
                      'bg-gray-100 text-gray-600'
                    ]"
                  >
                    {{ task.priority === 'high' ? '紧急' : task.priority === 'medium' ? '中等' : '一般' }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mb-2">{{ task.description }}</p>
                <div class="flex items-center justify-between text-xs text-gray-400">
                  <span>{{ task.assignee }}</span>
                  <span>截止: {{ task.deadline }}</span>
                </div>
              </div>
              <div v-if="relatedTasks.length === 0" class="text-center py-8 text-gray-400">
                <span class="text-2xl">📋</span>
                <p class="mt-2">暂无整改任务</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">门店信息</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">门店名称</span>
                <span class="font-medium text-gray-900">{{ inspection.storeName }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">店长</span>
                <span class="font-medium text-gray-900">{{ store.stores.find(s => s.id === inspection.storeId)?.manager }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">地址</span>
                <span class="font-medium text-gray-900">{{ store.stores.find(s => s.id === inspection.storeId)?.address }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">区域</span>
                <span class="font-medium text-gray-900">{{ store.stores.find(s => s.id === inspection.storeId)?.region }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Teleport to="body">
      <div
        v-if="showAddTaskModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showAddTaskModal = false"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">创建整改任务</h3>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">任务标题 *</label>
              <input
                v-model="newTask.title"
                type="text"
                placeholder="请输入任务标题"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">任务描述</label>
              <textarea
                v-model="newTask.description"
                rows="3"
                placeholder="请输入任务描述"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <select
                  v-model="newTask.priority"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="high">紧急</option>
                  <option value="medium">中等</option>
                  <option value="low">一般</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">负责人角色</label>
                <select
                  v-model="newTask.assigneeRole"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="store_manager">店长</option>
                  <option value="regional_supervisor">区域督导</option>
                  <option value="purchaser">采购</option>
                </select>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              @click="showAddTaskModal = false"
              class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="handleAddTask"
              :disabled="!newTask.title"
              class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              创建任务
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
