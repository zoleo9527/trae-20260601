<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  sub?: string
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  icon?: string
}>()

const toneMap: Record<string, { iconBg: string; iconColor: string; ring?: string }> = {
  default: { iconBg: '#f1f5f9', iconColor: '#64748b' },
  primary: { iconBg: '#dbeafe', iconColor: '#2563eb' },
  success: { iconBg: '#dcfce7', iconColor: '#16a34a' },
  warning: { iconBg: '#fef3c7', iconColor: '#d97706' },
  danger: { iconBg: '#fee2e2', iconColor: '#dc2626' },
  info: { iconBg: '#cffafe', iconColor: '#0891b2' }
}
</script>

<template>
  <div class="stat-card">
    <div class="icon-wrap" :style="toneMap[tone || 'default']">
      <slot name="icon">
        <span v-if="icon" class="icon-text">{{ icon }}</span>
      </slot>
    </div>
    <div class="content">
      <div class="title">{{ title }}</div>
      <div class="value">{{ value }}</div>
      <div v-if="sub" class="sub">{{ sub }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 18px;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-text {
  font-size: 18px;
  font-weight: 600;
}
.content {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}
.value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  letter-spacing: -0.5px;
}
.sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
