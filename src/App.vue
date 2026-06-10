<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmStore } from '@/stores/farm'
import { mockUsers } from '@/data/mockData'
import { ElMenu, ElDropdown, ElBadge, ElPopover, ElTag } from 'element-plus'

const router = useRouter()
const store = useFarmStore()
const notificationsVisible = ref(false)

const menuItems = [
  { path: '/dashboard', label: '首页', icon: 'LayoutDashboard' },
  { path: '/sow-archive', label: '母猪档案', icon: 'Pig' },
  { path: '/boar-archive', label: '公猪档案', icon: 'Pig' },
  { path: '/breeding-plan', label: '配种计划', icon: 'Calendar' },
  { path: '/breeding-record', label: '配种记录', icon: 'FileText' },
  { path: '/farrowing', label: '产房管理', icon: 'Baby' },
  { path: '/vaccine', label: '疫苗台账', icon: 'Syringe' }
]

function handleRoleChange(user: typeof mockUsers[0]) {
  store.setCurrentUser(user)
}

const roleLabels: Record<string, string> = {
  breeder: '繁育员',
  veterinarian: '兽医',
  manager: '场长'
}

const roleColors: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
  breeder: 'warning',
  veterinarian: 'success',
  manager: 'primary'
}

const notificationTypeMap: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
  success: 'success',
  warning: 'warning',
  info: 'info',
  error: 'danger'
}
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <header class="bg-white shadow-sm px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <component is="Pig" class="text-white" :size="24" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-800">种猪场管理系统</h1>
          <p class="text-xs text-gray-500">种群档案与配种计划</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <ElDropdown>
          <button class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
            <component is="User" :size="18" />
            <span>{{ store.currentUser.name }}</span>
            <ElTag :type="roleColors[store.currentUser.role]" size="small">
              {{ roleLabels[store.currentUser.role] }}
            </ElTag>
          </button>
          <template #dropdown>
            <ElMenu>
              <ElMenu.Item
                v-for="user in mockUsers"
                :key="user.id"
                @click="handleRoleChange(user)"
                :class="{ 'is-active': store.currentUser.id === user.id }"
              >
                <span>{{ user.name }}</span>
                <ElTag :type="roleColors[user.role]" size="small" class="ml-2">
                  {{ roleLabels[user.role] }}
                </ElTag>
              </ElMenu.Item>
            </ElMenu>
          </template>
        </ElDropdown>

        <ElPopover
          v-model:visible="notificationsVisible"
          placement="bottom-end"
          width="400"
          trigger="click"
        >
          <template #reference>
            <ElBadge :value="store.unreadNotifications.length" :max="9" class="cursor-pointer">
              <component is="Bell" :size="20" class="text-gray-600 hover:text-primary transition" />
            </ElBadge>
          </template>
          <div class="p-2">
            <h3 class="font-semibold mb-2">通知</h3>
            <ElMenu v-if="store.notifications.length > 0" mode="vertical">
              <ElMenu.Item
                v-for="notification in store.notifications.slice(0, 10)"
                :key="notification.id"
                class="cursor-pointer"
                @click="store.markNotificationAsRead(notification.id)"
                :class="{ 'bg-gray-50': !notification.read }"
              >
                <ElTag :type="notificationTypeMap[notification.type]" size="small" class="mr-2">
                  {{ notification.type === 'success' ? '成功' : notification.type === 'warning' ? '警告' : notification.type === 'error' ? '错误' : '信息' }}
                </ElTag>
                <span>{{ notification.title }}</span>
                <p class="text-xs text-gray-500">{{ notification.message }}</p>
              </ElMenu.Item>
            </ElMenu>
            <p v-else class="text-center text-gray-400 py-4">暂无通知</p>
          </div>
        </ElPopover>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <aside class="w-64 bg-white border-r py-4">
        <ElMenu mode="vertical" class="h-full" :default-active="$route.path">
          <ElMenu.Item
            v-for="item in menuItems"
            :key="item.path"
            @click="router.push(item.path)"
          >
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </ElMenu.Item>
        </ElMenu>
      </aside>

      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
