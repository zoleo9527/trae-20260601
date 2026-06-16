<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'
import { ref, computed } from 'vue'

const store = useInspectionStore()

const roleOptions = [
  { value: 'regional_supervisor', label: '区域督导', icon: '📋' },
  { value: 'store_manager', label: '店长', icon: '🏪' },
  { value: 'purchaser', label: '采购', icon: '📦' },
]

const quickStats = computed(() => [
  { label: '待处理任务', value: store.pendingTasks.length, color: 'bg-danger-100 text-danger-600', icon: '⚠️' },
  { label: '进行中任务', value: store.processingTasks.length, color: 'bg-warning-100 text-warning-600', icon: '🔄' },
  { label: '待巡店', value: store.pendingInspections.length, color: 'bg-primary-100 text-primary-600', icon: '🏃' },
  { label: '预警数量', value: store.activeWarnings.length, color: 'bg-danger-100 text-danger-600', icon: '🚨' },
])
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span class="text-white text-xl">🍽️</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">餐饮连锁门店管理系统</h1>
              <p class="text-sm text-gray-500">巡店检查与整改复盘</p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                v-for="role in roleOptions"
                :key="role.value"
                @click="store.setRole(role.value as any)"
                :class="[
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  store.currentRole === role.value
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <span class="mr-1">{{ role.icon }}</span>
                {{ role.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-1">
          <a href="/" class="px-4 py-3 text-primary-600 font-medium border-b-2 border-primary-500">首页</a>
          <a href="/inspections" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">巡店检查</a>
          <a href="/rectification" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">整改复盘</a>
          <a href="/workspace" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">工作台</a>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          v-for="stat in quickStats"
          :key="stat.label"
          class="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">{{ stat.label }}</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stat.value }}</p>
            </div>
            <div :class="['w-12 h-12 rounded-full flex items-center justify-center', stat.color]">
              <span class="text-xl">{{ stat.icon }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">预警信息</h2>
            <a href="/inspections/warnings" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
          </div>
          <div class="space-y-3">
            <div
              v-for="warning in store.activeWarnings.slice(0, 5)"
              :key="warning.id"
              class="p-4 rounded-lg border transition-colors hover:bg-gray-50"
              :class="{
                'border-danger-200 bg-danger-50': warning.severity === 'high',
                'border-warning-200 bg-warning-50': warning.severity === 'medium',
                'border-gray-200': warning.severity === 'low',
              }"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <span v-if="warning.type === 'stock_shortage'" class="text-lg">🥬</span>
                    <span v-else-if="warning.type === 'bad_review'" class="text-lg">📝</span>
                    <span v-else class="text-lg">📊</span>
                    <span class="font-medium text-gray-900">{{ warning.title }}</span>
                    <span
                      :class="[
                        'px-2 py-0.5 rounded text-xs font-medium',
                        warning.severity === 'high' ? 'bg-danger-100 text-danger-600' :
                        warning.severity === 'medium' ? 'bg-warning-100 text-warning-600' :
                        'bg-gray-100 text-gray-600'
                      ]"
                    >
                      {{ warning.severity === 'high' ? '紧急' : warning.severity === 'medium' ? '中等' : '一般' }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">{{ warning.storeName }} - {{ warning.description }}</p>
                  <p class="text-xs text-gray-400 mt-2">{{ new Date(warning.createdAt).toLocaleString() }}</p>
                </div>
              </div>
            </div>
            <div v-if="store.activeWarnings.length === 0" class="text-center py-8 text-gray-400">
              <span class="text-4xl">✅</span>
              <p class="mt-2">暂无预警信息</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">门店日报</h2>
            <a href="/inspections/reports" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
          </div>
          <div class="space-y-4">
            <div
              v-for="report in store.dailyReports.slice(0, 3)"
              :key="report.id"
              class="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-900">{{ report.storeName }}</span>
                <span class="text-xs text-gray-400">{{ report.reportDate }}</span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p class="text-sm font-semibold text-gray-900">¥{{ report.sales.toLocaleString() }}</p>
                  <p class="text-xs text-gray-400">销售额</p>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900">{{ report.customers }}</p>
                  <p class="text-xs text-gray-400">顾客数</p>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900">¥{{ report.avgCheck.toFixed(1) }}</p>
                  <p class="text-xs text-gray-400">客单价</p>
                </div>
              </div>
              <p v-if="report.notes" class="text-xs text-gray-500 mt-2">{{ report.notes }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">采购申请</h2>
            <a href="/inspections/purchases" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
          </div>
          <div class="space-y-3">
            <div
              v-for="request in store.purchaseRequests.slice(0, 3)"
              :key="request.id"
              class="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-900">{{ request.storeName }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-xs font-medium',
                    request.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                    request.status === 'approved' ? 'bg-success-100 text-success-600' :
                    request.status === 'completed' ? 'bg-primary-100 text-primary-600' :
                    'bg-danger-100 text-danger-600'
                  ]"
                >
                  {{ request.status === 'pending' ? '待审批' : request.status === 'approved' ? '已批准' : request.status === 'completed' ? '已完成' : '已拒绝' }}
                </span>
              </div>
              <div class="space-y-1">
                <div
                  v-for="item in request.items"
                  :key="item.id"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-gray-700">{{ item.name }}</span>
                  <span class="text-gray-500">{{ item.quantity }}{{ item.unit }}</span>
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-2">申请人: {{ request.requester }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">外卖差评</h2>
            <a href="/inspections/reviews" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
          </div>
          <div class="space-y-3">
            <div
              v-for="review in store.badReviews.slice(0, 3)"
              :key="review.id"
              class="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900">{{ review.storeName }}</span>
                  <span class="text-xs text-gray-400">{{ review.platform }}</span>
                </div>
                <div class="flex items-center space-x-0.5">
                  <span v-for="i in 5" :key="i" class="text-sm">
                    {{ i <= review.rating ? '⭐' : '☆' }}
                  </span>
                </div>
              </div>
              <p class="text-sm text-gray-600">{{ review.content }}</p>
              <div v-if="review.response" class="mt-2 p-2 bg-success-50 rounded text-sm text-success-700">
                💬 {{ review.response }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
