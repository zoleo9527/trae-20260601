<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand">
          <span class="brand-icon">🖥️</span>
          <span class="brand-text">装机店管理</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <router-link v-for="m in menus" :key="m.path" :to="m.path" class="nav-item" :class="{active: route.path.startsWith(m.path)}" v-if="showMenu(m)">
          <span class="nav-icon">{{ m.icon }}</span>
          <span class="nav-label">{{ m.label }}</span>
          <span v-if="m.badge" class="badge" :class="m.badgeClass">{{ m.badge }}</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div class="role-switch">
          <label class="text-xs text-muted mb-8 block">当前角色切换（原型演示）</label>
          <select v-model="selectedRole" @change="switchRole" class="w-full">
            <option v-for="u in auth.users" :key="u.id" :value="u.username">{{ u.roleName }} - {{ u.name }}</option>
          </select>
        </div>
      </div>
    </aside>
    
    <div class="main-area">
      <header class="topbar">
        <div>
          <div class="breadcrumb">{{ pageTitle }}</div>
          <div class="greeting">{{ greetingText }}，{{ auth.userName }}（{{ auth.user?.roleName }}）</div>
        </div>
        <div class="topbar-actions">
          <button class="btn btn-outline btn-sm" @click="goAnomalies">
            <span>🔔</span>
            异常提醒
            <span v-if="appStore.anomalyCount > 0" class="badge" style="margin-left:4px">{{ appStore.anomalyCount }}</span>
          </button>
          <button class="btn btn-secondary btn-sm" @click="logout">退出</button>
        </div>
      </header>
      
      <main class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useAppStore } from '@/store/app'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const appStore = useAppStore()

const selectedRole = ref(auth.user?.username)

const menus = [
  { path: '/dashboard', label: '今日待办', icon: '📋', role: null, 
    badge: computed(() => appStore.todayTodoCount), 
    badgeClass: computed(() => appStore.dangerAnomalies.length > 0 ? '' : 'badge-blue') },
  { path: '/arrivals', label: '配件到货', icon: '📦', role: ['manager', 'warehouse'],
    badge: computed(() => {
      const n = appStore.pendingArrivals.length + appStore.partialArrivals.length
      return n > 0 ? n : null
    }) },
  { path: '/schedules', label: '装机排程', icon: '🛠️', role: ['manager', 'sales', 'tech'],
    badge: computed(() => {
      const n = appStore.todaySchedules.length
      return n > 0 ? n : null
    }),
    badgeClass: 'badge-blue' },
  { path: '/anomalies', label: '异常提醒', icon: '⚠️', role: null,
    badge: computed(() => {
      const n = appStore.dangerAnomalies.length
      return n > 0 ? n : null
    }) },
  { path: '/history', label: '历史记录', icon: '📜', role: null }
]

const pageTitle = computed(() => route.meta?.title || '工作台')

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

function showMenu(m) {
  if (!m.role) return true
  return auth.user && m.role.includes(auth.user.role)
}

function switchRole() {
  const u = auth.users.find(x => x.username === selectedRole.value)
  if (u) {
    const { password: _, ...safe } = u
    auth.user = safe
    localStorage.setItem('pcshop_user', JSON.stringify(safe))
    router.replace(router.currentRoute.value.path)
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}

function goAnomalies() {
  router.push('/anomalies')
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--gray-900);
  color: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
}

.brand-icon { font-size: 22px; }
.brand-text { color: white; }

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  color: #9ca3af;
  transition: all 0.15s;
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.05);
  color: white;
}

.nav-item.active {
  background: var(--primary);
  color: white;
}

.nav-icon { font-size: 16px; }
.nav-label { flex: 1; }

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.role-switch select {
  background: rgba(255,255,255,0.05);
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
  font-size: 13px;
}

.role-switch select option {
  background: #1f2937;
  color: white;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb {
  font-size: 13px;
  color: var(--gray-500);
  margin-bottom: 2px;
}

.greeting {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-900);
}

.topbar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.content-area {
  flex: 1;
  overflow: auto;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.block { display: block; }
.mb-8 { margin-bottom: 8px; }
.w-full { width: 100%; }
</style>
