<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { roleLabels } from '@/utils/constants'
import type { User } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const menuItems = [
  { key: 'dashboard', icon: '📊', label: '工作台', path: '/dashboard' },
  { key: 'receptions', icon: '👥', label: '团体接待', path: '/receptions' },
  { key: 'warehouse', icon: '📦', label: '仓库交接', path: '/warehouse' },
  { key: 'audit-logs', icon: '📝', label: '操作日志', path: '/audit-logs' }
]

const roleOptions = [
  { value: 'service', label: '园区客服' },
  { value: 'guide', label: '采摘向导' },
  { value: 'warehouse', label: '仓库员' }
]

const currentRole = computed<User['role']>(() => userStore.currentUser?.role || 'service')

async function changeRole(role: User['role']) {
  try {
    await userStore.switchRole(role)
    router.push('/dashboard')
  } catch (e) {
    console.error('切换角色失败:', e)
  }
}

function isActive(path: string) {
  return route.path.startsWith(path)
}

function navigate(path: string) {
  router.push(path)
}

const userName = computed(() => userStore.currentUser?.name || '用户')
const roleDisplay = computed(() => roleLabels[currentRole.value] || currentRole.value)

onMounted(() => {
  if (!userStore.currentUser) {
    userStore.fetchCurrentUser()
  }
})
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">🍑</span>
        <span class="logo-text">观光果园</span>
      </div>
      <nav class="menu">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="menu-item"
          :class="{ active: isActive(item.path) }"
          @click="navigate(item.path)"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
        </div>
      </nav>
    </aside>

    <div class="main">
      <header class="header">
        <div class="header-left">
          <span class="breadcrumb">{{ route.meta.title || '首页' }}</span>
        </div>
        <div class="header-right">
          <div class="role-switch">
            <span class="role-label">当前身份：</span>
            <div class="role-options">
              <span
                v-for="opt in roleOptions"
                :key="opt.value"
                class="role-opt"
                :class="{ active: currentRole === opt.value }"
                @click="changeRole(opt.value as User['role'])"
              >
                {{ opt.label }}
              </span>
            </div>
          </div>
          <div class="user-info">
            <span class="user-avatar">{{ userName.charAt(0) }}</span>
            <span class="user-name">{{ userName }}</span>
          </div>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <component :is="Component" :key="route.fullPath" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
}

.menu {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
}

.menu-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.menu-item.active {
  color: #fff;
  background: #1890ff;
}

.menu-icon {
  font-size: 16px;
}

.menu-label {
  font-size: 14px;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  font-size: 16px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.role-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-label {
  font-size: 13px;
  color: #666;
}

.role-options {
  display: flex;
  gap: 4px;
}

.role-opt {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #666;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.role-opt:hover {
  color: #1890ff;
}

.role-opt.active {
  background: #e6f7ff;
  color: #1890ff;
  border-color: #91d5ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.content {
  flex: 1;
  overflow: auto;
  background: #f0f2f5;
}
</style>
