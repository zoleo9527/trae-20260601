<script setup>
import { computed } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { ROLES, ROLE_LABELS, APPOINTMENT_STATUS, SCHEDULE_STATUS, EXAM_STATUS } from '@/data/mock.js'
import RoleSwitcher from '@/components/RoleSwitcher.vue'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const navItems = computed(() => [
  { name: '总览仪表盘', path: '/dashboard', icon: '◉', badge: null },
  {
    name: '练车预约', path: '/appointments', icon: '◫',
    badge: store.appointments.filter(a =>
      a.status === APPOINTMENT_STATUS.PENDING_REVIEW ||
      a.status === APPOINTMENT_STATUS.INFO_INCOMPLETE
    ).length || null
  },
  {
    name: '教练排班', path: '/schedules', icon: '▤',
    badge: store.schedules.filter(s =>
      s.status === SCHEDULE_STATUS.UNASSIGNED ||
      s.status === SCHEDULE_STATUS.REJECTED
    ).length || null
  },
  {
    name: '考试跟进', path: '/exams', icon: '✎',
    badge: store.examFollowUps.filter(e =>
      e.status === EXAM_STATUS.PENDING_REVIEW ||
      e.status === EXAM_STATUS.READY_TO_BOOK
    ).length || null
  }
])

const go = (p) => router.push(p)
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">驾</div>
        <div class="logo-text">
          <div class="logo-title">驾校运营中心</div>
          <div class="logo-sub">练车预约 · 教练排班</div>
        </div>
      </div>

      <nav class="nav">
        <div
          v-for="item in navItems" :key="item.path"
          class="nav-item clickable"
          :class="{ active: route.path.startsWith(item.path) }"
          @click="go(item.path)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.name }}</span>
          <span v-if="item.badge" class="badge">{{ item.badge }}</span>
        </div>
      </nav>

      <div class="sidebar-foot">
        <div class="role-section">
          <div class="text-xs text-muted mb-2">当前身份视图</div>
          <RoleSwitcher />
        </div>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <div class="text-xs text-muted">{{ ROLE_LABELS[store.currentRole] }}工作台</div>
          <h1 class="page-title">{{ route.meta.title || '驾校运营' }}</h1>
        </div>
        <div class="top-actions flex gap-3">
          <div class="search-box">
            <span>🔍</span>
            <input placeholder="输入学员姓名 / 预约编号 / 教练名快速定位" class="input" style="border:none;box-shadow:none;background:transparent;" />
          </div>
          <button class="btn btn-default" title="刷新">↻ 刷新</button>
        </div>
      </header>

      <div class="content">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 248px 1fr;
  min-height: 100vh;
}
.sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  position: sticky; top: 0; height: 100vh;
}
.logo {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 8px 20px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  margin-bottom: 16px;
}
.logo-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 18px;
  box-shadow: 0 4px 12px rgba(37,99,235,.35);
}
.logo-title { font-size: 15px; font-weight: 600; color: #f8fafc; }
.logo-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px;
  color: #cbd5e1; font-size: 13.5px; font-weight: 500;
}
.nav-item:hover { background: rgba(255,255,255,.06); color: #fff; }
.nav-item.active {
  background: rgba(37, 99, 235, .25);
  color: #fff;
  box-shadow: inset 2px 0 0 #60a5fa;
}
.nav-icon { width: 18px; text-align: center; opacity: .8; font-size: 14px; }
.nav-label { flex: 1; }

.sidebar-foot { padding-top: 16px; border-top: 1px solid rgba(255,255,255,.08); }
.role-section {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  padding: 12px;
}

.main { display: flex; flex-direction: column; min-width: 0; }
.topbar {
  background: #fff;
  border-bottom: 1px solid var(--gray-200);
  padding: 14px 28px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 10;
}
.page-title { font-size: 18px; font-weight: 600; color: var(--gray-800); margin-top: 2px; }

.search-box {
  display: flex; align-items: center; gap: 8px;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: 8px; padding: 2px 10px;
  width: 360px;
}
.search-box span { opacity: .5; font-size: 12px; }
.search-box input { padding: 6px 0; font-size: 13px; }

.content { padding: 22px 28px 40px; flex: 1; }

.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
