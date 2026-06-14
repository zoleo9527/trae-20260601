<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">二手车商管理系统</h1>
            <p class="text-sm text-gray-600 mt-1">上架定价与客户跟进</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-sm font-medium text-gray-900">{{ currentUser.name }}</span>
              <span class="text-xs text-gray-600">({{ getRoleLabel(currentUser.role) }})</span>
            </div>
            <button
              @click="showUserSwitch = true"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              切换用户
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside class="lg:col-span-1">
          <FilterPanel />
        </aside>

        <div class="lg:col-span-3">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">
                车辆列表
                <span class="text-sm font-normal text-gray-500 ml-2">
                  ({{ filteredVehicles.length }} 辆)
                </span>
              </h2>
            </div>
          </div>

          <div v-if="filteredVehicles.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <VehicleCard
              v-for="vehicle in filteredVehicles"
              :key="vehicle.id"
              :vehicle="getVehicleDisplay(vehicle)"
            />
          </div>

          <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-gray-600">没有找到符合条件的车辆</p>
            <button
              @click="clearFilters"
              class="mt-4 text-blue-600 hover:text-blue-800"
            >
              清除筛选条件
            </button>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showUserSwitch" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showUserSwitch = false">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">切换用户</h3>
        <div class="space-y-2">
          <button
            v-for="user in users"
            :key="user.id"
            @click="handleSwitchUser(user)"
            :class="[
              'w-full px-4 py-3 rounded-lg text-left transition-colors',
              currentUser.id === user.id
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            ]"
          >
            <div class="font-medium text-gray-900">{{ user.name }}</div>
            <div class="text-sm text-gray-600">{{ getRoleLabel(user.role) }}</div>
          </button>
        </div>
        <button
          @click="showUserSwitch = false"
          class="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useVehicles } from '@/composables/useVehicles'
import { useAuth } from '@/composables/useAuth'
import VehicleCard from '@/components/VehicleCard.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import type { User, UserRole } from '@/types'

const {
  filteredVehicles,
  getVehicleDisplay,
  clearFilters
} = useVehicles()

const {
  users,
  currentUser,
  switchUser,
  initAuth
} = useAuth()

const showUserSwitch = ref(false)

initAuth()

const getRoleLabel = (role: UserRole) => {
  const roleMap: Record<UserRole, string> = {
    collector: '收车经理',
    evaluator: '评估师',
    finance: '金融专员',
    sales: '销售顾问'
  }
  return roleMap[role]
}

const handleSwitchUser = (user: User) => {
  switchUser(user.role)
  showUserSwitch.value = false
}
</script>
