<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    @click="goToDetail"
  >
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ vehicle.plate }}</h3>
        <p class="text-sm text-gray-600 mt-1">{{ vehicle.model }}</p>
      </div>
      <StatusBadge :status="vehicle.status" />
    </div>

    <div class="space-y-2 mb-3">
      <div class="flex items-center text-sm text-gray-600">
        <span class="w-16">品牌：</span>
        <span class="font-medium">{{ vehicle.brand }}</span>
      </div>
      <div class="flex items-center text-sm text-gray-600">
        <span class="w-16">收车价：</span>
        <span class="font-medium text-blue-600">¥{{ formatPrice(vehicle.purchasePrice) }}</span>
      </div>
      <div v-if="vehicle.listedPrice" class="flex items-center text-sm text-gray-600">
        <span class="w-16">上架价：</span>
        <span class="font-medium text-green-600">¥{{ formatPrice(vehicle.listedPrice) }}</span>
      </div>
    </div>

    <div class="pt-3 border-t border-gray-100">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{{ vehicle.collector.name }}</span>
        </div>
        <div v-if="vehicle.followupCount > 0" class="flex items-center text-cyan-600">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{{ vehicle.followupCount }} 条跟进</span>
        </div>
      </div>
      <div class="text-xs text-gray-400 mt-2">
        {{ formatDate(vehicle.createdAt) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Vehicle } from '@/types'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  vehicle: Vehicle
}>()

const router = useRouter()

const goToDetail = () => {
  router.push(`/vehicle/${props.vehicle.id}`)
}

const formatPrice = (price: number) => {
  return price.toLocaleString('zh-CN')
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
