<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const auth = computed(() => JSON.parse(localStorage.getItem('auth') || 'null'))

const navItems = computed(() => {
  const role = auth.value?.role
  const items = [
    { path: '/', label: '工作台', icon: '📊' },
    { path: '/appointments', label: '疫苗预约', icon: '💉' },
  ]
  if (role === '全科医生' || role === '公共卫生专员') {
    items.splice(1, 0,
      { path: '/contracts', label: '签约管理', icon: '📋' },
      { path: '/followups', label: '随访记录', icon: '📝' }
    )
  }
  if (role === '护士' || role === '公共卫生专员') {
    items.push({ path: '/observations', label: '留观记录', icon: '🏥' })
  }
  if (role === '公共卫生专员') {
    items.push({ path: '/export', label: '数据导出', icon: '📁' })
  }
  return items
})

function logout() {
  localStorage.removeItem('auth')
  router.push('/login')
}
</script>

<template>
  <div class="layout" v-if="auth">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>社区卫生站</h2>
        <p>疫苗预约与留观</p>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>
    <div class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <h3>{{ route.meta.title || '工作台' }}</h3>
        </div>
        <div class="topbar-right">
          <span class="role-badge">{{ auth.role }}</span>
          <span class="user-name">{{ auth.name }}</span>
          <button class="btn-logout" @click="logout">退出</button>
        </div>
      </header>
      <main class="content">
        <router-view />
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
  background: #1a2332;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar-header h2 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
}

.sidebar-header p {
  margin: 0;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
}

.sidebar-nav {
  padding: 12px 0;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.nav-item.active {
  background: rgba(64,158,255,0.2);
  color: #409eff;
  border-right: 3px solid #409eff;
}

.nav-icon {
  margin-right: 10px;
  font-size: 16px;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f5;
}

.topbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.topbar-left h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-badge {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.user-name {
  font-size: 14px;
  color: #606266;
}

.btn-logout {
  background: none;
  border: 1px solid #dcdfe6;
  color: #909399;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-logout:hover {
  color: #f56c6c;
  border-color: #f56c6c;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>
