<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../store'
import { ROLE_LABELS } from '../types'

const { state, pendingCount, riskCount, recentActivities } = useStore()

const pending = computed(() => pendingCount())
const risks = computed(() => riskCount())
const activities = computed(() => recentActivities())

const pendingByRole = computed(() => {
  const counts: Record<string, number> = {}
  for (const role of ['feeder', 'sorter', 'manager'] as const) {
    counts[role] = state.todos.filter(t => !t.done && t.role === role).length
  }
  return counts
})
</script>

<template>
  <div class="pressure-bar">
    <div class="metric-card pending-card">
      <div class="metric-value">{{ pending }}</div>
      <div class="metric-label">我的待处理</div>
      <div class="metric-sub">{{ ROLE_LABELS[state.currentRole] }}视角</div>
    </div>
    <div class="metric-card risk-card">
      <div class="metric-value">{{ risks }}</div>
      <div class="metric-label">风险项</div>
      <div class="metric-sub">全场待核实</div>
    </div>
    <div class="metric-card dist-card">
      <div class="dist-row">
        <span class="dist-label">饲养员</span>
        <span class="dist-num">{{ pendingByRole.feeder }}</span>
      </div>
      <div class="dist-row">
        <span class="dist-label">分拣员</span>
        <span class="dist-num">{{ pendingByRole.sorter }}</span>
      </div>
      <div class="dist-row">
        <span class="dist-label">场长</span>
        <span class="dist-num">{{ pendingByRole.manager }}</span>
      </div>
      <div class="metric-sub">各角色待办分布</div>
    </div>
    <div class="metric-card activity-card">
      <div class="activity-list">
        <div v-for="act in activities.slice(0, 4)" :key="act.id" class="activity-row">
          <span :class="['activity-tag', act.action.includes('风险') ? 'tag-risk' : act.action.includes('异常') ? 'tag-issue' : 'tag-normal']">
            {{ act.action }}
          </span>
          <span class="activity-detail">{{ act.detail }}</span>
        </div>
      </div>
      <div class="metric-sub">最近变更</div>
    </div>
  </div>
</template>

<style scoped>
.pressure-bar {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 2fr;
  gap: 12px;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.metric-card {
  background: #fafbfc;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
}

.pending-card {
  border-left: 4px solid #e74c3c;
}

.risk-card {
  border-left: 4px solid #f39c12;
}

.dist-card {
  border-left: 4px solid #3498db;
}

.activity-card {
  border-left: 4px solid #2ecc71;
}

.metric-value {
  font-size: 32px;
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1;
}

.pending-card .metric-value {
  color: #e74c3c;
}

.risk-card .metric-value {
  color: #f39c12;
}

.metric-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-top: 4px;
}

.metric-sub {
  font-size: 11px;
  color: #999;
  margin-top: auto;
  padding-top: 6px;
}

.dist-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.dist-label {
  font-size: 12px;
  color: #666;
}

.dist-num {
  font-size: 16px;
  font-weight: 700;
  color: #3498db;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.activity-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.tag-risk {
  background: #fde8e8;
  color: #e74c3c;
}

.tag-issue {
  background: #fef3e2;
  color: #e67e22;
}

.tag-normal {
  background: #e8f8f0;
  color: #27ae60;
}

.activity-detail {
  font-size: 11px;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
