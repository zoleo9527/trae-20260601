<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

const emit = defineEmits<{
  navigate: [page: string]
}>()

const { currentUser, roleName, logout, getAvailableRoles, switchRole } = useAuth()
const showRoleMenu = ref(false)

const menuItems = [
  { key: 'dashboard', label: '待办中心', icon: '📋' },
  { key: 'appointments', label: '预约处理', icon: '📅' },
  { key: 'inventory', label: '物品清单', icon: '📦' },
  { key: 'exceptions', label: '异常处理', icon: '⚠️' }
]

const handleLogout = () => {
  logout()
  showRoleMenu.value = false
}

const handleSwitchRole = (role: string) => {
  switchRole(role as any)
  showRoleMenu.value = false
}
</script>

<template>
  <div style="min-height: 100vh; background-color: #f5f7fa;">
    <header class="layout-header">
      <div class="layout-title">搬家公司管理工具</div>
      <div class="layout-user">
        <div class="layout-user-role">
          当前角色：<strong>{{ roleName }}</strong>（{{ currentUser?.name }}）
        </div>
        <div class="layout-user-actions">
          <div class="btn btn-secondary" style="position: relative;" @click="showRoleMenu = !showRoleMenu">
            切换角色
            <div 
              v-if="showRoleMenu" 
              style="position: absolute; right: 0; top: 100%; margin-top: 8px; background: white; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 8px; min-width: 160px; z-index: 100;"
            >
              <div 
                v-for="role in getAvailableRoles()" 
                :key="role.id"
                @click="handleSwitchRole(role.role)"
                style="padding: 8px 12px; cursor: pointer; border-radius: 4px; transition: background-color 0.2s;"
                :class="{ 'bg-blue-50': currentUser?.role === role.role }"
              >
                <div style="font-weight: 500;">{{ role.name }}</div>
                <div style="font-size: 12px; color: #999;">{{ role.roleName }}</div>
              </div>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e8e8e8;" />
              <div 
                @click="handleLogout" 
                style="padding: 8px 12px; cursor: pointer; border-radius: 4px; transition: background-color 0.2s; color: #f5222d;"
              >
                退出登录
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <div class="flex" style="min-height: calc(100vh - 65px);">
      <aside class="sidebar">
        <div 
          v-for="item in menuItems" 
          :key="item.key"
          @click="emit('navigate', item.key)"
          class="sidebar-item"
          :class="{ active: $route.name === item.key }"
        >
          <span>{{ item.icon }}</span>
          {{ item.label }}
        </div>
      </aside>
      
      <main class="flex-1" style="padding: 20px;">
        <slot />
      </main>
    </div>
  </div>
</template>
