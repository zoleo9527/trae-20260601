<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { ROLE_LABELS } from './types'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const auth = useAuthStore()
const router = useRouter()
const showMobileNav = ref(false)

const navItems: Record<string, Array<{ label: string; name: string; icon: string }>> = {
  customer_service: [
    { label: '工作台', name: 'dashboard', icon: '🏠' },
    { label: '预约管理', name: 'reservations', icon: '📅' },
    { label: '投诉处理', name: 'complaints', icon: '💬' },
  ],
  picking_guide: [
    { label: '工作台', name: 'dashboard', icon: '🏠' },
    { label: '采摘记录', name: 'picking', icon: '🧺' },
  ],
  warehouse: [
    { label: '工作台', name: 'dashboard', icon: '🏠' },
    { label: '果品分级', name: 'grading', icon: '🏷️' },
    { label: '库存管理', name: 'inventory', icon: '📦' },
    { label: '库存回看', name: 'inventory-changelog', icon: '📋' },
  ],
}

function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
}

function toggleMobileNav() {
  showMobileNav.value = !showMobileNav.value
}
</script>

<template>
  <div v-if="auth.currentUser" class="app-layout">
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="app-logo">🍑 观光果园</router-link>
        <span class="header-subtitle">果品分级与库存管理</span>
      </div>
      <nav class="header-nav desktop-nav">
        <router-link
          v-for="item in navItems[auth.currentUser.role] || []"
          :key="item.name"
          :to="{ name: item.name }"
          class="nav-link"
          active-class="nav-link-active"
        >
          {{ item.icon }} {{ item.label }}
        </router-link>
      </nav>
      <div class="header-right">
        <span class="user-badge">
          <span class="user-role-badge" :class="'role-' + auth.currentUser.role">
            {{ ROLE_LABELS[auth.currentUser.role] }}
          </span>
          {{ auth.currentUser.display_name }}
        </span>
        <button class="btn btn-ghost btn-sm" @click="handleLogout">退出</button>
        <button class="mobile-menu-btn" @click="toggleMobileNav">☰</button>
      </div>
    </header>
    <nav v-if="showMobileNav" class="mobile-nav">
      <router-link
        v-for="item in navItems[auth.currentUser.role] || []"
        :key="item.name"
        :to="{ name: item.name }"
        class="mobile-nav-link"
        @click="showMobileNav = false"
      >
        {{ item.icon }} {{ item.label }}
      </router-link>
    </nav>
    <main class="app-main">
      <router-view />
    </main>
  </div>
  <router-view v-else />
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
}

.header-subtitle {
  font-size: 13px;
  color: var(--gray-500);
  border-left: 1px solid var(--gray-300);
  padding-left: 12px;
}

.header-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-600);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--gray-100);
  color: var(--gray-800);
  text-decoration: none;
}

.nav-link-active {
  background: var(--primary-light);
  color: var(--primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  font-size: 13px;
  color: var(--gray-700);
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-role-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.role-customer_service { background: #e3f2fd; color: #1565c0; }
.role-picking_guide { background: #fff3e0; color: #e65100; }
.role-warehouse { background: #e8f5e9; color: #2e7d32; }

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.mobile-nav {
  display: none;
  flex-direction: column;
  background: #fff;
  border-bottom: 1px solid var(--gray-200);
  padding: 8px 16px;
}

.mobile-nav-link {
  padding: 10px 0;
  font-size: 14px;
  color: var(--gray-700);
  text-decoration: none;
  border-bottom: 1px solid var(--gray-100);
}

@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .mobile-menu-btn { display: block; }
  .mobile-nav { display: flex; }
  .header-subtitle { display: none; }
}

.app-main {
  flex: 1;
}
</style>
