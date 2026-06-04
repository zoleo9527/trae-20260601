<script setup lang="ts">
import type { TimelineEvent } from '@/types'
import { timelineTypeMap, staffRoleMap } from '@/utils/statusMap'
import { formatDateTime, getRelativeTime } from '@/utils/format'

defineProps<{
  events: TimelineEvent[]
}>()
</script>

<template>
  <div class="timeline">
    <div v-for="(event, index) in events" :key="event.id" class="timeline-item">
      <div class="timeline-line" v-if="index < events.length - 1"></div>
      <div class="timeline-dot" :style="{ backgroundColor: timelineTypeMap[event.type].color }">
        {{ timelineTypeMap[event.type].icon }}
      </div>
      <div class="timeline-content">
        <div class="timeline-header">
          <h4 class="timeline-title">{{ event.title }}</h4>
          <div
            class="tag"
            :style="{
              backgroundColor: staffRoleMap[event.operatorRole].color + '20',
              color: staffRoleMap[event.operatorRole].color
            }"
          >
            {{ staffRoleMap[event.operatorRole].label }}
          </div>
        </div>
        <p class="timeline-desc">{{ event.description }}</p>
        <div class="timeline-meta">
          <span class="meta-name">{{ event.operatorName }}</span>
          <span class="meta-dot">·</span>
          <span class="meta-time" :title="formatDateTime(event.timestamp)">
            {{ getRelativeTime(event.timestamp) }}
          </span>
          <span v-if="event.phaseNumber" class="phase-badge">
            第 {{ event.phaseNumber }} 阶段
          </span>
        </div>
      </div>
    </div>
    <div v-if="events.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <p>暂无时间线记录</p>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  position: relative;
  padding-left: 44px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-line {
  position: absolute;
  left: 15px;
  top: 36px;
  width: 2px;
  height: calc(100% - 12px);
  background: #e5e7eb;
}

.timeline-dot {
  position: absolute;
  left: -44px;
  top: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
}

.timeline-content {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin: 0;
}

.timeline-desc {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 8px;
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.meta-name {
  font-weight: 500;
  color: #6b7280;
}

.meta-dot {
  color: #d1d5db;
}

.phase-badge {
  background: #dbeafe;
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}
</style>
