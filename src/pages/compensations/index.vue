<script setup lang="ts">
import CompensationList from '@/components/CompensationList.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">补偿处理</h1>
            <p class="text-sm text-gray-500">差评补偿申请审批与执行</p>
          </div>
          <nav class="flex items-center gap-4">
            <a href="/reviews" class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">差评列表</a>
            <a href="/compensations" class="px-4 py-2 bg-blue-500 text-white rounded">补偿处理</a>
          </nav>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="mb-4">
        <h2 class="text-lg font-medium text-gray-900">补偿申请列表</h2>
        <p class="text-sm text-gray-500">查看和处理所有补偿申请</p>
      </div>
      
      <CompensationList />
    </main>
  </div>
</template>
