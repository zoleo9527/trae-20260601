<script setup>
import { useAppStore } from '@/stores/app.js'
import { ROLES, ROLE_LABELS } from '@/data/mock.js'

const store = useAppStore()

const list = [
  { id: ROLES.ADVISOR, label: '招生顾问', desc: '处理预约、分配教练', color: '#2563eb' },
  { id: ROLES.COACH, label: '教练', desc: '确认排班、完成练车', color: '#10b981' },
  { id: ROLES.EXAMINER, label: '考试专员', desc: '考试对接与追踪', color: '#8b5cf6' }
]
</script>

<template>
  <div class="role-switch">
    <div
      v-for="r in list" :key="r.id"
      class="role-item clickable"
      :class="{ active: store.currentRole === r.id }"
      @click="store.switchRole(r.id)"
    >
      <span class="role-dot" :style="{ background: r.color }"></span>
      <div class="role-info">
        <div class="role-name">{{ r.label }}</div>
        <div class="role-desc">{{ r.desc }}</div>
      </div>
      <span v-if="store.currentRole === r.id" class="role-check">✓</span>
    </div>
  </div>
</template>

<style scoped>
.role-switch { display: flex; flex-direction: column; gap: 6px; }
.role-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid transparent;
}
.role-item:hover { background: rgba(255,255,255,.06); }
.role-item.active {
  background: rgba(255,255,255,.1);
  border-color: rgba(255,255,255,.14);
}
.role-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.role-info { flex: 1; min-width: 0; }
.role-name { font-size: 12.5px; font-weight: 600; color: #f1f5f9; }
.role-desc { font-size: 10.5px; color: #94a3b8; margin-top: 1px; }
.role-check { color: #86efac; font-weight: 700; font-size: 12px; }
</style>
