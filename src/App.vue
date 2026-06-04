<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const isActive = (path: string) => {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">👁️</span>
            <h1>眼科手术中心 · 并发症上报与回访跟踪</h1>
          </div>
          <nav class="nav">
            <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }">
              📊 首屏概览
            </RouterLink>
            <RouterLink to="/reports" class="nav-link" :class="{ active: isActive('/reports') && route.path !== '/reports/create' }">
              📋 并发症上报
            </RouterLink>
            <RouterLink to="/reports/create" class="nav-link" :class="{ active: route.path === '/reports/create' }">
              ➕ 新建上报
            </RouterLink>
            <RouterLink to="/followups" class="nav-link" :class="{ active: isActive('/followups') }">
              📞 回访跟踪
            </RouterLink>
          </nav>
        </div>
      </div>
    </header>
    <main class="main-content">
      <div class="container">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-content {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.logo h1 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-link.active {
  background: #dbeafe;
  color: #2563eb;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 24px 0;
  background: #f9fafb;
}
</style>
