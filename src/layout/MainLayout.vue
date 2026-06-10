<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, ShoppingCart, Truck, ScrollText, Leaf } from 'lucide-vue-next'

const route = useRoute()

const menuItems = [
  { label: '工作台', icon: LayoutDashboard, path: '/' },
  { label: '肥料订货', icon: ShoppingCart, path: '/orders' },
  { label: '到货通知', icon: Truck, path: '/arrivals' },
  { label: '操作日志', icon: ScrollText, path: '/logs' },
]

const activePath = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  const match = menuItems.find((item) => item.path !== '/' && path.startsWith(item.path))
  return match ? match.path : path
})
</script>

<template>
  <div class="flex h-screen">
    <aside class="w-[220px] flex-shrink-0 bg-[#5D4037] text-white flex flex-col">
      <div class="px-5 py-6 flex items-center gap-2">
        <Leaf :size="24" class="text-green-300" />
        <span class="text-xl font-bold">农资门店</span>
      </div>
      <nav class="flex-1 px-3">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-md mb-1 transition-colors no-underline text-white"
          :class="activePath === item.path ? 'bg-[#8D6E63]' : 'hover:bg-[#4E342E]'"
        >
          <component :is="item.icon" :size="20" />
          <span class="text-sm font-medium">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="px-5 py-4 text-xs text-[#BCAAA4]">
        肥料订货与到货通知
      </div>
    </aside>
    <main class="flex-1 overflow-auto bg-[#f5f3ef]">
      <router-view />
    </main>
  </div>
</template>
