<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  ChevronDown,
  LogOut,
  User,
  Briefcase,
  HardHat,
  Wrench,
  Flame,
  Users,
  ClipboardCheck,
  AlertCircle,
  Gauge
} from 'lucide-vue-next'
import { useRole } from '@/stores/role'
import type { Role } from '../../../api/types'
import { cn } from '@/lib/utils'

const router = useRouter()
const route = useRoute()
const { currentRole, roleName, clearRole, setRole } = useRole()

const showRoleMenu = ref(false)
const showGasMenu = ref(false)

const menuItems = [
  {
    name: 'dashboard',
    label: '控制台',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    name: 'tests',
    label: '测试管理',
    icon: FileText,
    path: '/tests'
  },
  {
    name: 'issues',
    label: '问题管理',
    icon: AlertTriangle,
    path: '/issues'
  },
  {
    name: 'gas',
    label: '燃气维保',
    icon: Flame,
    path: '/gas',
    children: [
      { name: 'gas-applications', label: '停复气申请', path: '/gas/applications' },
      { name: 'gas-visits', label: '客户回访', path: '/gas/visits' },
      { name: 'gas-safety-checks', label: '安检记录', path: '/gas/safety-checks' },
      { name: 'gas-hidden-dangers', label: '隐患通知', path: '/gas/hidden-dangers' },
      { name: 'gas-meter-changes', label: '换表记录', path: '/gas/meter-changes' },
    ]
  }
]

const roleOptions: { value: Role; label: string; icon: any }[] = [
  { value: 'pm', label: '项目经理', icon: Briefcase },
  { value: 'captain', label: '施工队长', icon: HardHat },
  { value: 'engineer', label: '售后工程师', icon: Wrench }
]

const isActive = (name: string) => {
  return route.name === name || route.name?.toString().startsWith(name)
}

const navigateTo = (path: string) => {
  router.push(path)
}

const switchRole = (role: Role) => {
  setRole(role)
  showRoleMenu.value = false
}

const handleLogout = () => {
  clearRole()
  router.push('/')
}

const getRoleIcon = (role: Role | null) => {
  if (!role) return User
  const icons: Record<Role, any> = {
    pm: Briefcase,
    captain: HardHat,
    engineer: Wrench
  }
  return icons[role] || User
}
</script>

<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
    <div class="p-4 border-b border-gray-200">
      <h1 class="text-xl font-bold text-gray-900">燃气维保系统</h1>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      <template v-for="item in menuItems" :key="item.name">
        <div v-if="item.children" class="relative">
          <button
            @click="showGasMenu = !showGasMenu"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item.name)
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.label }}
            <ChevronDown :class="['w-4 h-4 ml-auto transition-transform', showGasMenu && 'rotate-180']" />
          </button>
          <div
            v-if="showGasMenu"
            class="ml-4 mt-1 space-y-1"
          >
            <router-link
              v-for="child in item.children"
              :key="child.name"
              :to="child.path"
              :class="[
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                isActive(child.name)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              ]"
            >
              <component :is="child.name === 'gas-applications' ? Gauge : child.name === 'gas-visits' ? Users : child.name === 'gas-safety-checks' ? ClipboardCheck : child.name === 'gas-hidden-dangers' ? AlertCircle : Gauge" class="w-4 h-4" />
              {{ child.label }}
            </router-link>
          </div>
        </div>
        <router-link
          v-else
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(item.name)
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </router-link>
      </template>
    </nav>

    <div class="p-4 border-t border-gray-200">
      <div class="relative">
        <button
          @click="showRoleMenu = !showRoleMenu"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <component :is="getRoleIcon(currentRole)" class="w-4 h-4 text-blue-600" />
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-medium text-gray-900">{{ roleName }}</p>
            <p class="text-xs text-gray-500">点击切换角色</p>
          </div>
          <ChevronDown :class="['w-4 h-4 text-gray-400 transition-transform', showRoleMenu && 'rotate-180']" />
        </button>

        <div
          v-if="showRoleMenu"
          class="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
        >
          <div class="px-3 py-2 border-b border-gray-100">
            <p class="text-xs font-medium text-gray-500">切换角色</p>
          </div>
          <button
            v-for="option in roleOptions"
            :key="option.value"
            @click="switchRole(option.value)"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
              currentRole === option.value ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
            ]"
          >
            <component :is="option.icon" class="w-4 h-4" />
            {{ option.label }}
          </button>
          <div class="border-t border-gray-100 mt-1 pt-1">
            <button
              @click="handleLogout"
              class="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut class="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
