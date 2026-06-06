<template>
  <aside class="w-64 bg-slate-900 text-white flex flex-col">
    <div class="p-6 border-b border-slate-700">
      <h1 class="text-xl font-bold">跨境订单管理系统</h1>
    </div>
    <nav class="flex-1 p-4">
      <ul class="space-y-2">
        <li v-for="item in menuItems" :key="item.path">
          <NuxtLink
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
            :class="{ 'bg-slate-800': isActive(item.path) }"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.name }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { LayoutDashboard, Package, FileText, Warehouse, Settings } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { name: '工作台', path: '/', icon: LayoutDashboard },
  { name: '订单同步', path: '/orders', icon: Package },
  { name: '报关资料', path: '/customs', icon: FileText },
  { name: '库存管理', path: '/inventory', icon: Warehouse },
  { name: '数据管理', path: '/settings', icon: Settings }
]

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>
