<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'
import { ref, computed } from 'vue'

const store = useInspectionStore()

const searchQuery = ref('')
const dateFilter = ref('all')

const filteredReports = computed(() => {
  return store.dailyReports.filter(report => {
    const matchesSearch = !searchQuery.value || 
      report.storeName.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    return matchesSearch
  })
})

const formatTime = (time: string) => {
  return new Date(time).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              @click="navigateTo('/')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">门店日报</h1>
              <p class="text-sm text-gray-500">门店经营数据日报汇总</p>
            </div>
          </div>
          <a href="/" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            返回首页
          </a>
        </div>
      </div>
    </header>

    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-1">
          <a href="/" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">首页</a>
          <a href="/inspections" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">巡店检查</a>
          <a href="/rectification" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">整改复盘</a>
          <a href="/workspace" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">工作台</a>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex-1">
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索门店名称..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="report in filteredReports"
          :key="report.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">{{ report.storeName }}</h3>
            <span class="text-sm text-gray-400">{{ report.reportDate }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center mb-4">
            <div>
              <p class="text-xl font-bold text-gray-900">¥{{ report.sales.toLocaleString() }}</p>
              <p class="text-xs text-gray-400">销售额</p>
            </div>
            <div>
              <p class="text-xl font-bold text-gray-900">{{ report.customers }}</p>
              <p class="text-xs text-gray-400">顾客数</p>
            </div>
            <div>
              <p class="text-xl font-bold text-gray-900">¥{{ report.avgCheck.toFixed(1) }}</p>
              <p class="text-xs text-gray-400">客单价</p>
            </div>
          </div>
          <div v-if="report.notes" class="p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600">{{ report.notes }}</p>
          </div>
          <p class="text-xs text-gray-400 mt-3">上报时间: {{ formatTime(report.createdAt) }}</p>
        </div>
      </div>

      <div v-if="filteredReports.length === 0" class="text-center py-12">
        <span class="text-4xl">📊</span>
        <p class="mt-4 text-gray-500">没有找到日报记录</p>
      </div>
    </main>
  </div>
</template>
