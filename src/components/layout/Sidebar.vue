<template>
  <aside class="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
    <div class="p-6">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
          <FileText class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="font-semibold text-gray-900">翻译管理系统</h1>
          <p class="text-xs text-gray-500">译员分配与术语维护</p>
        </div>
      </div>

      <nav class="space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            isActive(item.path)
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.text }}
        </router-link>
      </nav>

      <div class="mt-8 pt-8 border-t border-gray-200">
        <div class="px-3 mb-3">
          <label class="text-xs text-gray-500 mb-2 block">切换角色</label>
          <select
            :value="currentUser.id"
            @change="switchUser($event)"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <optgroup label="项目经理">
              <option
                v-for="user in projectManagers"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }}
              </option>
            </optgroup>
            <optgroup label="译员">
              <option
                v-for="user in translators"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }}
              </option>
            </optgroup>
            <optgroup label="审校">
              <option
                v-for="user in reviewers"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }}
              </option>
            </optgroup>
          </select>
        </div>
        
        <div class="flex items-center gap-3 px-3">
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              getAvatarClass(currentUser.role)
            ]"
          >
            {{ currentUser.avatar || currentUser.name.charAt(0) }}
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">{{ currentUser.name }}</div>
            <div class="text-xs text-gray-500">{{ getRoleText(currentUser.role) }}</div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FileText, LayoutDashboard, Users, BookOpen } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import type { UserRole, User } from '@/types'

const route = useRoute()
const userStore = useUserStore()

const currentUser = computed(() => userStore.currentUser)

const projectManagers = computed(() => userStore.getUsersByRole('project_manager'))
const translators = computed(() => userStore.getUsersByRole('translator'))
const reviewers = computed(() => userStore.getUsersByRole('reviewer'))

const switchUser = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const user = userStore.getUserById(target.value)
  if (user) {
    userStore.setCurrentUser(user)
  }
}

const menuItems = [
  { path: '/dashboard', text: '工作台', icon: LayoutDashboard },
  { path: '/assignments', text: '译员分配', icon: Users },
  { path: '/terminology', text: '术语维护', icon: BookOpen },
]

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const getAvatarClass = (role: UserRole) => {
  const classes: Record<UserRole, string> = {
    project_manager: 'bg-primary-500 text-white',
    translator: 'bg-warning-500 text-white',
    reviewer: 'bg-success-500 text-white',
  }
  return classes[role]
}

const getRoleText = (role: UserRole) => {
  const texts: Record<UserRole, string> = {
    project_manager: '项目经理',
    translator: '译员',
    reviewer: '审校',
  }
  return texts[role]
}
</script>