<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard, ClipboardList, MapPin, RefreshCcw, History,
  Cable, ChevronDown, Search, Bell, User, LogOut, UserCog
} from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiButton from '@/components/ui/UiButton.vue'

const route = useRoute()
const router = useRouter()
const store = useDataStore()

const searchText = ref('')

const navItems = [
  { path: '/', name: '仪表盘', icon: LayoutDashboard },
  { path: '/requisitions', name: '领料管理', icon: ClipboardList, badge: () => store.pendingRequisitions.length },
  { path: '/checkin', name: '现场打卡', icon: MapPin },
  { path: '/returns', name: '补领与退回', icon: RefreshCcw, badge: () => store.pendingReturns.length },
  { path: '/history', name: '历史记录', icon: History }
]

const breadcrumb = computed(() => (route.meta.title as string) || '仪表盘')
const projectOptions = computed(() => store.projects.filter(p => p.status === 'active'))

function navigate(path: string) {
  router.push(path)
}

function onProjectChange(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  if (id) store.setCurrentProject(id)
}

onMounted(async () => {
  await store.loadAll()
})
</script>

<template>
  <div class="min-h-screen flex bg-[#FAFAFA]">
    <aside class="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col text-white shadow-xl z-20"
           style="background: linear-gradient(180deg, #1E3A8A 0%, #1E40AF 100%);">
      <div class="px-5 py-5 border-b border-white/10 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Cable class="w-5 h-5 text-white" />
        </div>
        <div class="min-w-0">
          <h1 class="font-serif-sc font-bold text-[15px] leading-tight tracking-wide truncate">弱电施工</h1>
          <h2 class="font-serif-sc font-semibold text-[13px] text-blue-200 leading-tight tracking-wide truncate">线缆管理系统</h2>
        </div>
      </div>

      <nav class="flex-1 py-3 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        <button
          v-for="item in navItems"
          :key="item.path"
          type="button"
          @click="navigate(item.path)"
          class="w-full relative flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-all duration-200 group"
          :class="route.path === item.path
            ? 'bg-white/15 text-white font-medium'
            : 'text-blue-100 hover:bg-white/8 hover:text-white'"
        >
          <div
            v-if="route.path === item.path"
            class="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-white"
          />
          <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
          <span class="flex-1 text-left">{{ item.name }}</span>
          <UiBadge
            v-if="item.badge && item.badge() > 0"
            variant="red"
            size="sm"
            class="!bg-red-500 !text-white !border-red-400"
          >
            {{ item.badge() }}
          </UiBadge>
        </button>
      </nav>

      <div class="px-3 py-3 border-t border-white/10">
        <div class="bg-white/10 rounded-lg p-3">
          <div class="flex items-center gap-2.5 mb-2.5">
            <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <User class="w-4.5 h-4.5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold truncate">王建国</p>
              <p class="text-[11px] text-blue-200 truncate">项目负责人</p>
            </div>
          </div>
          <UiButton
            variant="ghost"
            size="sm"
            class="w-full !bg-white/10 !text-white hover:!bg-white/20 !justify-start !px-2"
          >
            <template #icon><UserCog class="w-3.5 h-3.5" /></template>
            切换角色
          </UiButton>
        </div>
      </div>
    </aside>

    <div class="ml-[240px] flex-1 flex flex-col min-w-0">
      <header class="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div class="px-6 py-3 flex items-center gap-4">
          <div class="flex items-center gap-1.5 text-sm text-gray-500 shrink-0">
            <LayoutDashboard class="w-4 h-4" />
            <ChevronDown class="w-3.5 h-3.5 -rotate-90" />
            <span class="text-gray-900 font-medium">{{ breadcrumb }}</span>
          </div>

          <div class="flex-1 max-w-xs">
            <select
              :value="store.currentProjectId"
              @change="onProjectChange"
              class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/15 appearance-none cursor-pointer"
            >
              <option value="" disabled>选择项目...</option>
              <option v-for="p in projectOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="flex-1 max-w-sm relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchText"
              type="text"
              placeholder="搜索单据、线缆、班组..."
              class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/15"
            />
          </div>

          <div class="flex items-center gap-1 ml-auto shrink-0">
            <button type="button" class="relative p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell class="w-5 h-5" />
              <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div class="w-px h-6 bg-gray-200 mx-1" />
            <div class="flex items-center gap-2 pl-1">
              <div class="w-8 h-8 rounded-full bg-[#1E40AF]/10 flex items-center justify-center text-[#1E40AF] font-semibold text-sm">王</div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1">
        <div class="pt-6 px-6 pb-12">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <div class="fade-slide">
                <component :is="Component" />
              </div>
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>
