<template>
  <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h2 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h2>
    </div>
    <div class="flex items-center gap-4">
      <div class="relative">
        <button
          @click="showDropdown = !showDropdown"
          class="flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">
            {{ appStore.currentUser.name.charAt(0) }}
          </div>
          <div class="text-left">
            <div class="text-sm font-medium text-gray-800">{{ appStore.currentUser.name }}</div>
            <div class="text-xs text-gray-500">{{ getRoleText(appStore.currentRole) }}</div>
          </div>
          <ChevronDown class="w-4 h-4 text-gray-500" />
        </button>
        <div
          v-if="showDropdown"
          class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
        >
          <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">切换角色</div>
          <button
            v-for="user in appStore.userList"
            :key="user.id"
            @click="switchRole(user.role)"
            class="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
            :class="{ 'bg-slate-50': user.role === appStore.currentRole }"
          >
            <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">
              {{ user.name.charAt(0) }}
            </div>
            <div>
              <div class="text-sm font-medium text-gray-800">{{ user.name }}</div>
              <div class="text-xs text-gray-500">{{ getRoleText(user.role) }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { useFormat } from '../composables/useFormat'
import { useRoute } from 'vue-router'

const appStore = useAppStore()
const { getRoleText } = useFormat()
const route = useRoute()

const showDropdown = ref(false)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': '工作台',
    '/orders': '订单同步',
    '/customs': '报关资料',
    '/inventory': '库存管理',
    '/data': '数据管理'
  }
  return titles[route.path] || '工作台'
})

const switchRole = (role: any) => {
  appStore.setRole(role)
  showDropdown.value = false
}
</script>
