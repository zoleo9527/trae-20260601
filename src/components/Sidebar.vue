<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
          <Users class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="font-bold text-gray-900">志愿服务站</h1>
          <p class="text-xs text-gray-500">重点对象回访系统</p>
        </div>
      </div>
    </div>
    
    <div class="p-4 border-b border-gray-200">
      <div class="bg-gray-50 rounded-lg p-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User class="w-5 h-5 text-primary-600" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate">{{ store.state.currentUser?.name }}</p>
            <p class="text-xs text-gray-500">{{ roleLabel }}</p>
          </div>
        </div>
        <button @click="showRoleSwitch = true" class="mt-3 w-full py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition flex items-center justify-center gap-1">
          <RefreshCw class="w-4 h-4" />
          切换角色
        </button>
      </div>
    </div>
    
    <nav class="flex-1 p-3 space-y-1">
      <button
        v-for="item in menuItems"
        :key="item.key"
        @click="$emit('navigate', item.key)"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition',
          activeMenu === item.key
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="ml-auto text-xs px-2 py-0.5 rounded-full"
          :class="item.badgeClass"
        >
          {{ item.badge }}
        </span>
      </button>
    </nav>
    
    <div class="p-3 border-t border-gray-200">
      <button @click="store.logout()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition">
        <LogOut class="w-5 h-5" />
        <span>退出登录</span>
      </button>
    </div>
    
    <div
      v-if="showRoleSwitch"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showRoleSwitch = false"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">切换角色</h3>
          <button @click="showRoleSwitch = false" class="p-1 hover:bg-gray-100 rounded-lg">
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div class="space-y-2">
          <button
            v-for="user in users"
            :key="user.id"
            @click="handleSwitchRole(user.id)"
            :disabled="store.state.loading"
            class="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition"
          >
            <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User class="w-5 h-5 text-gray-500" />
            </div>
            <div class="flex-1 text-left">
              <p class="font-medium text-gray-900">{{ user.name }}</p>
              <p class="text-xs text-gray-500">{{ getRoleLabel(user.role) }}</p>
            </div>
            <CheckCircle2 v-if="user.id === store.state.currentUser?.id" class="w-5 h-5 text-green-500" />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Users, User, RefreshCw, LogOut, X, CheckCircle2, ClipboardList, AlertTriangle, Users2, Building2 } from 'lucide-vue-next'
import { useStore } from '@/store'
import { getUsers } from '@/api'
import type { User as UserType, Role } from '@/types'

const props = defineProps<{
  activeMenu: string
}>()

defineEmits<{
  navigate: [key: string]
}>()

const store = useStore()
const showRoleSwitch = ref(false)
const users = ref<UserType[]>([])

const roleLabel = computed(() => {
  return getRoleLabel(store.state.currentUser?.role)
})

const menuItems = computed(() => {
  const items: { key: string; label: string; icon: typeof ClipboardList; badge?: number; badgeClass?: string }[] = []
  const role = store.state.currentUser?.role
  
  if (role === 'socialWorker') {
    items.push(
      { key: 'dashboard', label: '工作台', icon: ClipboardList },
      { key: 'visit', label: '重点对象回访', icon: Users2, badge: store.state.visitRecords.filter(v => v.status === 'pending').length, badgeClass: 'bg-blue-100 text-blue-700' },
      { key: 'issues', label: '问题上报', icon: AlertTriangle }
    )
  } else if (role === 'volunteerLeader') {
    items.push(
      { key: 'dashboard', label: '工作台', icon: ClipboardList },
      { key: 'issue-handle', label: '问题处理', icon: AlertTriangle, badge: store.pendingIssues.value.length, badgeClass: 'bg-yellow-100 text-yellow-700' },
      { key: 'visit', label: '回访记录', icon: Users2 }
    )
  } else if (role === 'communityLeader') {
    items.push(
      { key: 'dashboard', label: '工作台', icon: ClipboardList },
      { key: 'escalation', label: '异常处理', icon: AlertTriangle, badge: store.escalatedIssues.value.length + store.blockedVisits.value.length, badgeClass: 'bg-red-100 text-red-700' },
      { key: 'reports', label: '统计报表', icon: Building2 }
    )
  }
  
  return items
})

function getRoleLabel(role?: Role): string {
  const map: Record<Role, string> = {
    socialWorker: '站点社工',
    volunteerLeader: '志愿队长',
    communityLeader: '社区干部'
  }
  return role ? map[role] : ''
}

async function handleSwitchRole(userId: string) {
  await store.switchUser(userId)
  showRoleSwitch.value = false
}

onMounted(async () => {
  users.value = await getUsers()
})
</script>
