<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">🏥</span>
            <h1>养老护理院 · 康复计划与阶段评估</h1>
          </div>
          <nav class="nav">
            <router-link to="/plans" class="nav-link active">康复计划</router-link>
            <a href="#" class="nav-link">异常提醒</a>
            <a href="#" class="nav-link">统计报表</a>
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
  font-size: 24px;
}

.logo h1 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-link.active {
  background: #dbeafe;
  color: #3b82f6;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 24px 0;
}
</style>
