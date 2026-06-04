<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { RehabPlan, ExceptionRecord } from '@/types'
import { getExceptionsByPlanId } from '@/store'
import { exceptionTypeMap, exceptionStatusMap, staffRoleMap } from '@/utils/statusMap'
import { formatDateTime, formatDate } from '@/utils/format'

const props = defineProps<{
  visible: boolean
  plan: RehabPlan | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const exceptions = ref<ExceptionRecord[]>([])

function refreshExceptions() {
  if (props.plan) {
    exceptions.value = getExceptionsByPlanId(props.plan.id)
  }
}

watch(() => props.plan, (newPlan) => {
  if (newPlan) {
    exceptions.value = getExceptionsByPlanId(newPlan.id)
  }
}, { immediate: true })

watch(() => props.visible, (val) => {
  if (val) refreshExceptions()
})

function closeDrawer() {
  emit('update:visible', false)
}

const sortedExceptions = computed(() => {
  const items = [...exceptions.value]
  items.sort((a, b) => {
    if (a.status === 'resolved' && b.status !== 'resolved') return 1
    if (a.status !== 'resolved' && b.status === 'resolved') return -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  return items
})
</script>

<template>
  <div>
    <div
      class="drawer-overlay"
      :class="{ active: visible }"
      @click="closeDrawer"
    ></div>
    <div class="drawer" :class="{ active: visible }">
      <div class="drawer-header">
        <div class="drawer-title">异常处理</div>
        <button class="drawer-close" @click="closeDrawer">×</button>
      </div>
      <div class="drawer-body">
        <div v-if="plan" class="exception-drawer">
          <div class="plan-summary">
            <div class="elder-brief">
              <div class="avatar">{{ plan.elder.name.charAt(0) }}</div>
              <div>
                <div class="font-medium">{{ plan.elder.name }}</div>
                <div class="text-sm text-muted">{{ plan.title }}</div>
              </div>
            </div>
          </div>

          <div class="drawer-counts">
            <span class="count-pending" v-if="sortedExceptions.filter(e => e.status !== 'resolved').length > 0">
              {{ sortedExceptions.filter(e => e.status !== 'resolved').length }} 条待处理
            </span>
            <span class="count-resolved" v-if="sortedExceptions.filter(e => e.status === 'resolved').length > 0">
              {{ sortedExceptions.filter(e => e.status === 'resolved').length }} 条已解决
            </span>
          </div>

          <div class="exception-list">
            <div
              v-for="exception in sortedExceptions"
              :key="exception.id"
              class="exception-item"
              :class="{ resolved: exception.status === 'resolved' }"
            >
              <div class="exception-header">
                <div class="exception-type" :style="{ color: exceptionTypeMap[exception.type].color }">
                  {{ exceptionTypeMap[exception.type].label }}
                </div>
                <div
                  class="status-badge"
                  :style="{
                    backgroundColor: exceptionStatusMap[exception.status].bgColor,
                    color: exceptionStatusMap[exception.status].color
                  }"
                >
                  {{ exceptionStatusMap[exception.status].label }}
                </div>
              </div>
              <h4 class="exception-title">{{ exception.title }}</h4>
              <p class="exception-desc" v-if="exception.status !== 'resolved'">{{ exception.reason }}</p>
              <div class="exception-meta">
                <div class="meta-item">
                  <span class="meta-label">{{ exception.status === 'resolved' ? '解决时间' : '发生时间' }}</span>
                  <span class="meta-value">{{ formatDateTime(exception.status === 'resolved' ? (exception.resolvedAt || exception.createdAt) : exception.createdAt) }}</span>
                </div>
                <div class="meta-item" v-if="exception.handlerName">
                  <span class="meta-label">处理人</span>
                  <span class="meta-value">{{ exception.handlerName }}</span>
                </div>
              </div>
              <div class="exception-phase" v-if="exception.phaseId">
                <span class="phase-tag">关联阶段</span>
                <span>
                  第 {{ plan.phases.find(p => p.id === exception.phaseId)?.phaseNumber }} 阶段：
                  {{ plan.phases.find(p => p.id === exception.phaseId)?.title }}
                </span>
              </div>
              <div class="resolution" v-if="exception.status === 'resolved' && exception.resolution">
                <div class="resolution-label">处理结果</div>
                <div class="resolution-content">{{ exception.resolution }}</div>
              </div>
            </div>

            <div v-if="sortedExceptions.length === 0" class="empty-state">
              <div class="empty-icon">✅</div>
              <p>暂无异常记录</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exception-drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.plan-summary {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.elder-brief {
  display: flex;
  align-items: center;
  gap: 12px;
}

.font-medium {
  font-weight: 500;
}

.drawer-counts {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.count-pending {
  font-size: 13px;
  font-weight: 500;
  color: #ef4444;
  background: #fee2e2;
  padding: 4px 10px;
  border-radius: 6px;
}

.count-resolved {
  font-size: 13px;
  font-weight: 500;
  color: #10b981;
  background: #d1fae5;
  padding: 4px 10px;
  border-radius: 6px;
}

.exception-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exception-item {
  padding: 16px;
  border: 1px solid #fee2e2;
  border-radius: 8px;
  background: #fef2f2;
}

.exception-item.resolved {
  border-color: #d1fae5;
  background: #f0fdf4;
}

.exception-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.exception-type {
  font-size: 12px;
  font-weight: 600;
}

.exception-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1f2937;
}

.exception-desc {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 12px;
}

.exception-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  color: #9ca3af;
}

.meta-value {
  font-size: 13px;
  color: #374151;
}

.exception-phase {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #fca5a5;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.phase-tag {
  background: #dbeafe;
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.resolution {
  margin-bottom: 12px;
}

.resolution-label {
  font-size: 12px;
  color: #10b981;
  margin-bottom: 4px;
}

.resolution-content {
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}
</style>
