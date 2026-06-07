<template>
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-bold text-gray-900">⛽ 加油站运营管理系统</h1>
          <nav class="hidden md:flex space-x-1">
            <router-link
              to="/"
              class="px-3 py-2 rounded-md text-sm font-medium"
              :class="
                route.path === '/'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              工作台
            </router-link>
            <router-link
              to="/inspections"
              class="px-3 py-2 rounded-md text-sm font-medium"
              :class="
                route.path.startsWith('/inspections')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              设备巡检
            </router-link>
            <router-link
              to="/repairs"
              class="px-3 py-2 rounded-md text-sm font-medium"
              :class="
                route.path.startsWith('/repairs')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              "
            >
              异常报修
            </router-link>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <UserSwitcher />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import UserSwitcher from './UserSwitcher.vue'

const route = useRoute()
</script>
