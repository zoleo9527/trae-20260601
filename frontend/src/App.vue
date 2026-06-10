<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, FileText, Scissors, Package, Clock, LogOut, ChevronRight } from 'lucide-vue-next'
import { useOrdersStore } from '@/stores/orders'
import { useUiStore } from '@/stores/ui'
import StuckBanner from '@/components/common/StuckBanner.vue'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()
const uiStore = useUiStore()

const isEntry = computed(() => route.path === '/')
const currentNav = computed(() => {
  const map: Record<string, { key: string; label: string; icon: any }> = {
    '/sales': { key: 'sales', label: '销售内勤工作台', icon: FileText },
    '/grower': { key: 'grower', label: '种植员工作台', icon: Scissors },
    '/packer': { key: 'packer', label: '包装主管工作台', icon: Package },
    '/history': { key: 'history', label: '历史记录与回看', icon: Clock },
  }
  return map[route.path] || null
})

const navItems = [
  { key: 'sales', path: '/sales', label: '销售内勤', icon: FileText },
  { key: 'grower', path: '/grower', label: '种植员', icon: Scissors },
  { key: 'packer', path: '/packer', label: '包装主管', icon: Package },
  { key: 'history', path: '/history', label: '历史记录', icon: Clock },
]

function goHome() {
  uiStore.clearRole()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-neutral-100">
    <StuckBanner v-if="ordersStore.stuckCount > 0 && uiStore.isStuckBannerShown" />

    <header class="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30"
      :class="{ 'sticky top-0': !isEntry }">
      <div class="flex items-center gap-4">
        <button @click="goHome"
          class="flex items-center gap-2 group">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-base-500 to-base-700 flex items-center justify-center text-white shadow-sm">
            <Home :size="18" />
          </div>
          <div class="text-left">
            <div class="text-[15px] font-bold text-neutral-800 leading-tight tracking-wide">花卉基地业务工作台</div>
            <div class="text-[11px] text-neutral-500 leading-tight">订单 · 采切 · 包装 全链路协同</div>
          </div>
        </button>

        <div v-if="!isEntry" class="hidden md:flex items-center gap-1 ml-6 pl-6 border-l border-neutral-200">
          <template v-for="nav in navItems" :key="nav.key">
            <router-link :to="nav.path"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all"
              :class="route.path === nav.path
                ? 'bg-base-500 text-white shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'">
              <component :is="nav.icon" :size="15" />
              <span>{{ nav.label }}</span>
            </router-link>
          </template>
        </div>
      </div>

      <div v-if="!isEntry" class="flex items-center gap-4">
        <div v-if="currentNav" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-50 border border-base-200">
          <component :is="currentNav.icon" :size="16" class="text-base-600" />
          <span class="text-sm font-medium text-base-700">{{ currentNav.label }}</span>
        </div>
        <button @click="goHome"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-neutral-600 hover:bg-neutral-200 transition-colors">
          <LogOut :size="14" />
          <span>切换角色</span>
          <ChevronRight :size="14" class="opacity-50" />
        </button>
      </div>
    </header>

    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
