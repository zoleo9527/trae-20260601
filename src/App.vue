<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ClipboardList,
  AlertTriangle,
  Send,
  BarChart3,
  SearchCheck,
  User,
  Shield,
  Menu,
  X
} from 'lucide-vue-next';
import { useInspectionStore } from '@/stores/inspection.js';

const store = useInspectionStore();
const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(true);
const currentUser = ref({ name: '张工', role: '巡检工程师' });

const menuItems = [
  { path: '/inspections', name: '抽检列表', icon: ClipboardList },
  { path: '/dispatches', name: '派发记录', icon: Send },
  { path: '/rectification', name: '整改状态', icon: BarChart3 },
  { path: '/review', name: '复查入口', icon: SearchCheck }
];

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/');
}

function navigateTo(path: string) {
  router.push(path);
}

onMounted(() => {
  store.fetchStats();
  store.fetchPendingReviews();
});
</script>

<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden">
    <aside
      :class="[
        'bg-gray-900 text-white transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-20'
      ]"
    >
      <div class="p-4 border-b border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield class="w-6 h-6" />
          </div>
          <div v-if="sidebarOpen" class="whitespace-nowrap">
            <h1 class="font-bold text-lg">消防维保</h1>
            <p class="text-xs text-gray-400">设施抽检管理系统</p>
          </div>
        </div>
        <button
          @click="sidebarOpen = !sidebarOpen"
          class="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <Menu v-if="!sidebarOpen" class="w-5 h-5" />
          <X v-else class="w-5 h-5" />
        </button>
      </div>

      <nav class="flex-1 py-4 overflow-y-auto">
        <ul class="space-y-1 px-2">
          <li v-for="item in menuItems" :key="item.path">
            <button
              @click="navigateTo(item.path)"
              :class="[
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                isActive(item.path)
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              ]"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="sidebarOpen" class="whitespace-nowrap">{{ item.name }}</span>
              <span
                v-if="item.path === '/review' && store.pendingReviewCount > 0 && sidebarOpen"
                class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
              >
                {{ store.pendingReviewCount }}
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <div class="p-4 border-t border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
            <User class="w-5 h-5" />
          </div>
          <div v-if="sidebarOpen" class="overflow-hidden">
            <p class="font-medium truncate">{{ currentUser.name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ currentUser.role }}</p>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 class="text-xl font-bold text-gray-800">
            {{ menuItems.find(m => isActive(m.path))?.name || '消防维保系统' }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ route.path === '/inspections' && '管理所有消防设施抽检记录' }}
            {{ route.path === '/dispatches' && '查看隐患派发记录和处理状态' }}
            {{ route.path === '/rectification' && '实时跟踪整改进度和统计' }}
            {{ route.path === '/review' && '对已完成整改的隐患进行复查' }}
            {{ route.path.startsWith('/inspections/') && '隐患详情和处理流程' }}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle class="w-5 h-5 text-yellow-600" />
            <span class="text-sm font-medium text-yellow-700">
              待复查: {{ store.pendingReviewCount }} 项
            </span>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
