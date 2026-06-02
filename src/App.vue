<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterView, RouterLink } from 'vue-router'

const route = useRoute()

const menuItems = [
  { path: '/', icon: '📊', label: '仪表盘' },
  { path: '/residents', icon: '👥', label: '住户管理' },
  { path: '/houses', icon: '🏠', label: '房屋管理' },
  { path: '/cards', icon: '💳', label: '门禁卡管理' },
  { path: '/permissions', icon: '🔐', label: '权限组管理' },
  { path: '/applications', icon: '📋', label: '申请审核' },
  { path: '/logs', icon: '📝', label: '操作记录' },
  { path: '/events', icon: '📅', label: '门禁事件' }
]

const collapsed = ref(false)
const currentUser = ref('前台小李')
const userRole = ref<'reception' | 'admin'>('reception')

const pageTitle = computed(() => route.meta.title as string || '门禁卡管理系统')
</script>

<template>
  <div class="app-container">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="logo">
        <span class="logo-icon">🔑</span>
        <span v-if="!collapsed" class="logo-text">门禁卡管理</span>
      </div>
      <nav class="menu">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span v-if="!collapsed" class="menu-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <button class="collapse-btn" @click="collapsed = !collapsed">
          {{ collapsed ? '→' : '←' }}
        </button>
      </div>
    </aside>

    <div class="main">
      <header class="header">
        <h1 class="page-title">{{ pageTitle }}</h1>
        <div class="header-right">
          <div class="user-info">
            <span class="user-avatar">{{ currentUser.charAt(0) }}</span>
            <div class="user-detail">
              <div class="user-name">{{ currentUser }}</div>
              <div class="user-role">{{ userRole === 'admin' ? '管理员' : '前台' }}</div>
            </div>
            <button class="role-switch" @click="userRole = userRole === 'admin' ? 'reception' : 'admin'">
              切换为{{ userRole === 'admin' ? '前台' : '管理员' }}
            </button>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :user-role="userRole" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 64px;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.menu {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.menu-item:hover {
  background: var(--sidebar-hover);
  color: #fff;
}

.menu-item.active {
  background: var(--sidebar-active);
  color: #fff;
}

.menu-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.menu-label {
  flex: 1;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.collapse-btn {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  font-size: 16px;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--gray-800);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.user-detail {
  line-height: 1.3;
}

.user-name {
  font-weight: 500;
  color: var(--gray-800);
  font-size: 13px;
}

.user-role {
  font-size: 11px;
  color: var(--gray-500);
}

.role-switch {
  padding: 4px 10px;
  font-size: 12px;
  background: var(--gray-100);
  color: var(--gray-600);
  border-radius: 6px;
  margin-left: 8px;
}

.role-switch:hover {
  background: var(--gray-200);
}

.content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background: var(--gray-100);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
