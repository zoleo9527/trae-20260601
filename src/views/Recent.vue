<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import dayjs from 'dayjs'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const store = useDataStore()

function goItem(item: typeof store.recentItems[0]) {
  if (item.type === 'inbound') {
    router.push(`/inbound/${item.id}`)
  } else {
    router.push(`/review/${item.id}`)
  }
}

function getTimeLabel(time: string) {
  const now = dayjs()
  const t = dayjs(time)
  const diffMin = now.diff(t, 'minute')
  const diffHour = now.diff(t, 'hour')
  const diffDay = now.diff(t, 'day')

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  return t.format('YYYY-MM-DD')
}
</script>

<template>
  <div class="recent-page">
    <div class="page-header">
      <h2 class="page-title">🕐 最近打开</h2>
      <span class="page-subtitle">最近访问的 20 条记录</span>
    </div>

    <div class="recent-list card">
      <div v-if="store.recentItems.length === 0" class="empty-state">
        <div class="empty-icon">🕐</div>
        <div class="empty-text">暂无最近访问记录</div>
        <div class="empty-tip">查看或处理单据后会自动记录在这里</div>
      </div>

      <div
        v-for="(item, index) in store.recentItems"
        :key="item.id + item.type + index"
        class="recent-item"
        @click="goItem(item)"
      >
        <div class="item-icon">
          <span v-if="item.type === 'inbound'">📋</span>
          <span v-else>⚖️</span>
        </div>
        <div class="item-content">
          <div class="item-title">
            <span class="item-name">{{ item.title }}</span>
            <span class="item-type">
              {{ item.type === 'inbound' ? '进厂登记' : '过磅复核' }}
            </span>
          </div>
          <div class="item-subtitle">{{ item.subtitle }}</div>
        </div>
        <div class="item-right">
          <StatusBadge :status="item.status" size="sm" />
          <div class="item-time">{{ getTimeLabel(item.visitedAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recent-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
}

.recent-list {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.empty-tip {
  font-size: 12px;
  color: var(--text-tertiary);
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: background 0.2s;
}

.recent-item:hover {
  background: var(--bg-secondary);
}

.recent-item:last-child {
  border-bottom: none;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'SF Mono', Monaco, monospace;
}

.item-type {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 3px;
}

.item-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.item-time {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
