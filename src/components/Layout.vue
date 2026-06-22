<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const store = useDataStore()
const userMenuOpen = ref(false)

const menuItems = [
  { key: 'dashboard', label: '工作台', icon: '🏠', path: '/' },
  { key: 'inbound', label: '进厂登记', icon: '📋', path: '/inbound', badge: 'submitted' },
  { key: 'review', label: '过磅复核', icon: '⚖️', path: '/review', badge: 'pending' },
  { key: 'recent', label: '最近打开', icon: '🕐', path: '/recent' },
  { key: 'logs', label: '操作日志', icon: '📝', path: '/logs' },
  { key: 'settings', label: '设置', icon: '⚙️', path: '/settings' }
]

const currentKey = computed(() => {
  const path = route.path
  if (path.startsWith('/inbound')) return 'inbound'
  if (path.startsWith('/review')) return 'review'
  if (path.startsWith('/recent')) return 'recent'
  if (path.startsWith('/logs')) return 'logs'
  if (path.startsWith('/settings')) return 'settings'
  return 'dashboard'
})

const badgeCounts = computed(() => ({
  submitted: store.inbounds.filter(i => i.status === 'submitted').length,
  pending: store.reviews.filter(r => r.status === 'pending').length
}))

function navigate(path: string) {
  router.push(path)
}

function switchUser(user: typeof store.users[0]) {
  store.setCurrentUser(user)
  userMenuOpen.value = false
}
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">♻️</span>
        <span class="logo-text">分拣中心</span>
      </div>
      <nav class="nav-menu">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: currentKey === item.key }"
          @click="navigate(item.path)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span
            v-if="item.badge && badgeCounts[item.badge as keyof typeof badgeCounts] > 0"
            class="nav-badge"
          >
            {{ badgeCounts[item.badge as keyof typeof badgeCounts] }}
          </span>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="today-info">
          <div class="today-label">今日日期</div>
          <div class="today-date">{{ dayjs().format('YYYY-MM-DD') }}</div>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">{{ route.meta.title || '工作台' }}</h1>
        </div>
        <div class="header-right">
          <div class="status-bar">
            <div class="status-item">
              <span class="status-dot status-pending"></span>
              <span class="status-label">待处理</span>
              <span class="status-count">{{ store.toDoCount }}</span>
            </div>
          </div>
          <div class="user-menu" @click="userMenuOpen = !userMenuOpen">
            <div class="user-avatar">{{ store.currentUser?.name?.charAt(0) || 'U' }}</div>
            <div class="user-info">
              <div class="user-name">{{ store.currentUser?.name || '未登录' }}</div>
              <div class="user-role">{{ store.currentUser?.roleLabel || '' }}</div>
            </div>
            <span class="user-arrow">▼</span>
            <div v-if="userMenuOpen" class="user-dropdown">
              <div class="dropdown-title">切换角色</div>
              <div
                v-for="user in store.users"
                :key="user.id"
                class="dropdown-item"
                :class="{ active: store.currentUser?.id === user.id }"
                @click.stop="switchUser(user)"
              >
                <span>{{ user.name }}</span>
                <span class="dropdown-role">{{ user.roleLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
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
  width: var(--sidebar-width);
  background: #001529;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-icon {
  font-size: 22px;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.nav-menu {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.nav-item.active {
  color: #fff;
  background: #1890ff;
}

.nav-icon {
  font-size: 18px;
  width: 20px;
  text-align: center;
}

.nav-label {
  flex: 1;
  font-size: 14px;
}

.nav-badge {
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.today-info {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  padding: 12px;
}

.today-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-bottom: 4px;
}

.today-date {
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  font-family: 'SF Mono', Monaco, monospace;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: var(--header-height);
  background: #fff;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.status-bar {
  display: flex;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-pending {
  background: var(--warning-color);
}

.status-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.status-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.user-menu:hover {
  background: var(--bg-secondary);
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
  font-weight: 500;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.user-role {
  font-size: 11px;
  color: var(--text-tertiary);
}

.user-arrow {
  font-size: 10px;
  color: var(--text-tertiary);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  z-index: 100;
  padding: 8px 0;
}

.dropdown-title {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 4px;
}

.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.dropdown-item.active {
  color: var(--primary-color);
  background: #e6f7ff;
}

.dropdown-role {
  font-size: 11px;
  color: var(--text-tertiary);
}

.content {
  flex: 1;
  overflow: auto;
  padding: 20px 24px;
  background: var(--bg-secondary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
