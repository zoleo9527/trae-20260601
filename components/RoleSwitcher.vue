<script setup lang="ts">
import type { Role } from '~/types'
import { RoleMeta } from '~/types'

defineProps<{
  current: Role
  options?: Role[]
}>()

const emit = defineEmits<{
  change: [role: Role]
}>()

const roles: Role[] = ['accountant', 'manager', 'supervisor']

const roleColorMap: Record<Role, { activeBg: string; activeBorder: string; activeText: string; badgeBg: string; badgeText: string }> = {
  accountant: { activeBg: '#eff6ff', activeBorder: '#2563eb', activeText: '#1d4ed8', badgeBg: '#2563eb', badgeText: '#fff' },
  manager: { activeBg: '#ecfeff', activeBorder: '#0891b2', activeText: '#0e7490', badgeBg: '#0891b2', badgeText: '#fff' },
  supervisor: { activeBg: '#fffbeb', activeBorder: '#d97706', activeText: '#b45309', badgeBg: '#d97706', badgeText: '#fff' }
}
</script>

<template>
  <div class="role-switcher">
    <span class="label">切换角色查看：</span>
    <div class="roles">
      <button
        v-for="r in roles"
        :key="r"
        class="role-btn"
        :class="{ active: current === r }"
        :style="current === r ? {
          backgroundColor: roleColorMap[r].activeBg,
          borderColor: roleColorMap[r].activeBorder,
          color: roleColorMap[r].activeText
        } : {}"
        @click="emit('change', r)"
      >
        <span
          class="badge"
          :style="{ backgroundColor: roleColorMap[r].badgeBg, color: roleColorMap[r].badgeText }"
        >
          {{ r === 'accountant' ? 'A' : r === 'manager' ? 'M' : 'S' }}
        </span>
        <span class="name">{{ RoleMeta[r].label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.role-switcher {
  display: flex;
  align-items: center;
  gap: 14px;
}
.label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.roles {
  display: flex;
  gap: 6px;
  padding: 4px;
  background-color: var(--color-bg-soft);
  border-radius: 10px;
}
.role-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
  transition: all 0.15s ease;
}
.role-btn:hover {
  color: var(--color-text);
  background-color: var(--color-bg-card);
}
.role-btn.active {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.badge {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}
</style>
