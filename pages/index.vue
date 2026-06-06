<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">工作台</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        class="bg-red-50 border border-red-200 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
        @click="navigateTo('/orders?status=exception')"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-red-600 text-sm font-medium">异常订单数</p>
            <p class="text-3xl font-bold text-red-700 mt-2">{{ stats?.exceptionOrders || 0 }}</p>
          </div>
          <AlertTriangle class="w-12 h-12 text-red-400" />
        </div>
        <p class="text-red-500 text-sm mt-3">点击查看详情 →</p>
      </div>

      <div
        class="bg-orange-50 border border-orange-200 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
        @click="navigateTo('/orders?responsibility=pending_confirm')"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-600 text-sm font-medium">待确认责任单数</p>
            <p class="text-3xl font-bold text-orange-700 mt-2">{{ stats?.pendingResponsibility || 0 }}</p>
          </div>
          <Clock class="w-12 h-12 text-orange-400" />
        </div>
        <p class="text-orange-500 text-sm mt-3">点击查看详情 →</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">今日同步数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.todaySynced || 0 }}</p>
          </div>
          <RefreshCw class="w-10 h-10 text-blue-500" />
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">待报关数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.pendingCustoms || 0 }}</p>
          </div>
          <FileText class="w-10 h-10 text-yellow-500" />
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">报关通过率</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ (stats?.customsPassRate || 0).toFixed(1) }}%</p>
          </div>
          <CheckCircle class="w-10 h-10 text-green-500" />
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">库存预警</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.inventoryWarnings || 0 }}</p>
          </div>
          <Package class="w-10 h-10 text-red-500" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-gray-200">
      <div class="px-5 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">待办任务</h2>
      </div>
      <div class="divide-y divide-gray-100">
        <div
          v-for="task in todoTasks"
          :key="task.id"
          class="px-5 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-red-500': task.priority === 'high',
                'bg-yellow-500': task.priority === 'medium',
                'bg-gray-400': task.priority === 'low'
              }"
            ></div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ task.title }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ task.description }}</p>
            </div>
          </div>
          <span class="text-xs text-gray-400">{{ formatDate(task.createdAt) }}</span>
        </div>
        <div v-if="todoTasks.length === 0" class="px-5 py-8 text-center text-gray-500">
          暂无待办任务
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, Clock, RefreshCw, FileText, CheckCircle, Package } from 'lucide-vue-next'
import { useAppStore } from '~/stores/app'
import { useFormat } from '~/composables/useFormat'
import type { DashboardStats } from '~/types'

const appStore = useAppStore()
const { formatDate } = useFormat()

const { data: statsRaw } = await useFetch<{ success: boolean; data: DashboardStats }>('/api/dashboard/stats')
const stats = computed(() => statsRaw.value?.data)

const todoTasks = computed(() => {
  const tasks: Array<{ id: string; title: string; description: string; priority: 'high' | 'medium' | 'low'; createdAt: string }> = []

  if (stats.value?.exceptionOrders && stats.value.exceptionOrders > 0) {
    tasks.push({
      id: 'exception',
      title: `处理 ${stats.value.exceptionOrders} 个异常订单`,
      description: '同步失败或报关异常的订单需要处理',
      priority: 'high',
      createdAt: new Date().toISOString()
    })
  }

  if (stats.value?.pendingResponsibility && stats.value.pendingResponsibility > 0) {
    tasks.push({
      id: 'responsibility',
      title: `确认 ${stats.value.pendingResponsibility} 个订单责任`,
      description: '订单超时未处理，需要确认责任归属',
      priority: 'high',
      createdAt: new Date().toISOString()
    })
  }

  if (stats.value?.pendingCustoms && stats.value.pendingCustoms > 0) {
    tasks.push({
      id: 'customs',
      title: `处理 ${stats.value.pendingCustoms} 个待报关订单`,
      description: '准备报关资料并提交审核',
      priority: 'medium',
      createdAt: new Date().toISOString()
    })
  }

  if (stats.value?.inventoryWarnings && stats.value.inventoryWarnings > 0) {
    tasks.push({
      id: 'inventory',
      title: `处理 ${stats.value.inventoryWarnings} 个库存预警`,
      description: '部分商品库存低于预警阈值',
      priority: 'medium',
      createdAt: new Date().toISOString()
    })
  }

  return tasks
})
</script>
