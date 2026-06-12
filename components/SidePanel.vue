<script setup lang="ts">
import type { RiskItem, ActivityItem, TaxDeadline } from '~/types'

defineProps<{
  risks: RiskItem[]
  activities: ActivityItem[]
  deadlines: TaxDeadline[]
}>()

const emit = defineEmits<{
  openRisk: [id: string]
  openActivity: [target: string]
}>()

const levelTone: Record<string, { bg: string; text: string; border: string; label: string }> = {
  high: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', label: '高风险' },
  medium: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', label: '中风险' },
  low: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: '低风险' }
}

const deadlineStatus: Record<string, { text: string; bg: string; icon: string }> = {
  done: { text: '已完成', bg: '#dcfce7', icon: '✓' },
  pending: { text: '待申报', bg: '#e0f2fe', icon: '○' },
  risk: { text: '有风险', bg: '#fee2e2', icon: '!' }
}

const roleTone: Record<string, string> = {
  accountant: '#2563eb',
  manager: '#0891b2',
  supervisor: '#d97706'
}
</script>

<template>
  <aside class="side-panel">
    <section class="panel-block">
      <div class="block-head">
        <h3 class="block-title">
          <span class="title-icon danger">⚠</span>
          风险项
          <span class="count-badge danger">{{ risks.length }}</span>
        </h3>
        <button class="more-btn">全部 →</button>
      </div>
      <div class="risk-list">
        <div
          v-for="r in risks"
          :key="r.id"
          class="risk-card"
          :style="{ borderLeftColor: levelTone[r.level].border }"
          @click="emit('openRisk', r.relatedTaskId || r.id)"
        >
          <div class="risk-top">
            <span
              class="level-tag"
              :style="{
                backgroundColor: levelTone[r.level].bg,
                color: levelTone[r.level].text
              }"
            >{{ levelTone[r.level].label }}</span>
            <span class="update-time">{{ r.updatedAt.slice(5) }}</span>
          </div>
          <div class="risk-title">{{ r.title }}</div>
          <div class="risk-customer">{{ r.customerName }}</div>
          <div class="risk-desc">{{ r.description }}</div>
        </div>
        <div v-if="risks.length === 0" class="empty-in-panel">
          <span class="big-icon">✅</span>
          <span>暂无风险，继续保持</span>
        </div>
      </div>
    </section>

    <section class="panel-block">
      <div class="block-head">
        <h3 class="block-title">
          <span class="title-icon info">🗓</span>
          申报日历
        </h3>
        <button class="more-btn">本月 →</button>
      </div>
      <div v-for="d in deadlines" :key="d.id" class="deadline-card">
        <div class="deadline-head">
          <div>
            <div class="deadline-period">{{ d.period }}</div>
            <div class="deadline-type">{{ d.taxType }}</div>
          </div>
          <div class="deadline-countdown">
            <span class="countdown-num">12</span>
            <span class="countdown-unit">天后截止</span>
          </div>
        </div>
        <div class="deadline-date">📅 截止 {{ d.deadline }}</div>
        <div class="customer-chips">
          <span
            v-for="c in d.customers"
            :key="c.id"
            class="chip"
            :style="{ backgroundColor: deadlineStatus[c.status].bg }"
            :title="deadlineStatus[c.status].text"
          >
            <span class="chip-icon">{{ deadlineStatus[c.status].icon }}</span>
            {{ c.name.slice(0, 6) }}
          </span>
        </div>
      </div>
    </section>

    <section class="panel-block">
      <div class="block-head">
        <h3 class="block-title">
          <span class="title-icon primary">↻</span>
          最近变更
        </h3>
        <button class="more-btn">全部 →</button>
      </div>
      <div class="activity-list">
        <div
          v-for="a in activities"
          :key="a.id"
          class="activity-item"
          @click="emit('openActivity', a.target)"
        >
          <div
            class="avatar"
            :style="{ backgroundColor: roleTone[a.role] }"
          >
            {{ a.user[0] }}
          </div>
          <div class="activity-body">
            <div class="activity-main">
              <span class="user-name">{{ a.user }}</span>
              <span class="action-text">{{ a.action }}</span>
            </div>
            <div class="activity-target">{{ a.customerName }} · {{ a.target }}</div>
            <div class="activity-time">{{ a.at.slice(5) }}</div>
          </div>
        </div>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.panel-block {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}
.block-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.title-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.title-icon.danger { background-color: var(--color-danger-light); color: var(--color-danger); }
.title-icon.info { background-color: var(--color-info-light); color: var(--color-info); }
.title-icon.primary { background-color: var(--color-primary-light); color: var(--color-primary); }
.count-badge {
  min-width: 20px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  text-align: center;
}
.count-badge.danger {
  background-color: var(--color-danger);
  color: #fff;
}
.more-btn {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 500;
  transition: all 0.15s ease;
}
.more-btn:hover { text-decoration: underline; }

.risk-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.risk-card {
  padding: 12px 14px;
  background-color: var(--color-bg-soft);
  border-radius: 8px;
  border-left: 3px solid;
  cursor: pointer;
  transition: all 0.15s ease;
}
.risk-card:hover {
  transform: translateX(-2px);
  box-shadow: var(--shadow-sm);
}
.risk-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.level-tag {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
}
.update-time {
  font-size: 11px;
  color: var(--color-text-muted);
}
.risk-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
  line-height: 1.4;
}
.risk-customer {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
}
.risk-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-in-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.empty-in-panel .big-icon { font-size: 30px; }

.deadline-card {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}
.deadline-card:last-child { border-bottom: none; }
.deadline-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}
.deadline-period {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
}
.deadline-type {
  font-size: 11px;
  color: var(--color-text-muted);
  max-width: 220px;
  line-height: 1.4;
}
.deadline-countdown {
  text-align: right;
  padding: 6px 10px;
  background-color: var(--color-warning-light);
  border-radius: 8px;
}
.countdown-num {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-warning);
  line-height: 1.1;
}
.countdown-unit {
  font-size: 10px;
  color: var(--color-warning);
}
.deadline-date {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
  padding-left: 2px;
}
.customer-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1;
}
.chip-icon {
  font-size: 10px;
  font-weight: 700;
}

.activity-list {
  padding: 6px 0;
}
.activity-item {
  display: flex;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.activity-item:hover {
  background-color: var(--color-bg-soft);
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.activity-body {
  flex: 1;
  min-width: 0;
}
.activity-main {
  margin-bottom: 3px;
}
.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-right: 6px;
}
.action-text {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.activity-target {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.activity-time {
  font-size: 11px;
  color: var(--color-text-muted);
}
</style>
