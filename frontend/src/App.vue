<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">百货专柜管理系统</h1>
        <nav class="app-nav">
          <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">
            客诉退换管理
          </router-link>
          <router-link to="/brand-feedback" class="nav-link" :class="{ active: $route.path === '/brand-feedback' }">
            品牌反馈回看
          </router-link>
        </nav>
        <div class="user-info">
          <span class="role-badge" :class="roleStore.currentRole.key">{{ roleStore.currentRole.label }}</span>
          <span class="user-name">{{ roleStore.currentUser }}</span>
        </div>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoleStore } from '@/stores/role'

const roleStore = useRoleStore()
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #f5f7fa;
}

.app-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 48px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.app-nav {
  display: flex;
  gap: 8px;
  flex: 1;
}

.nav-link {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  color: white;
  background: rgba(255, 255, 255, 0.18);
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.manager {
  background: #f6ad55;
  color: #744210;
}

.role-badge.supervisor {
  background: #63b3ed;
  color: #1a365d;
}

.role-badge.superintendent {
  background: #68d391;
  color: #1c4532;
}

.user-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.app-main {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px 32px;
}
</style>
