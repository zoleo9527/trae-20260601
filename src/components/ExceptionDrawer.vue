<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { RehabPlan, ExceptionRecord } from '@/types'
import { getExceptionsByPlanId } from '@/store'
import { exceptionTypeMap, exceptionStatusMap, staffRoleMap, phaseStatusMap } from '@/utils/statusMap'
import { formatDateTime, formatDate } from '@/utils/format'

const props = defineProps<{
  visible: boolean
  plan: RehabPlan | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const exceptions = ref<ExceptionRecord[]>([])
const activeTab = ref<'pending' | 'resolved'>('pending')

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

function resolveHandlerRole(handlerId?: string): { label: string; color: string } {
  if (handlerId && props.plan) {
    if (props.plan.nursingDirector && props.plan.nursingDirector.id === handlerId) {
      return staffRoleMap.nursing_director
    }
    if (props.plan.primaryNurse && props.plan.primaryNurse.id === handlerId) {
      return staffRoleMap.primary_nurse
    }
  }
  return staffRoleMap.primary_nurse
}

function getPhaseById(phaseId?: string) {
  if (!phaseId || !props.plan) return null
  return props.plan.phases.find(p => p.id === phaseId) || null
}

function getLatestTime(exception: ExceptionRecord): string {
  return exception.status === 'resolved'
    ? (exception.resolvedAt || exception.createdAt)
    : exception.createdAt
}

const pendingExceptions = computed(() => {
  return exceptions.value.filter(e => e.status !== 'resolved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const resolvedExceptions = computed(() => {
  return exceptions.value.filter(e => e.status === 'resolved')
    .sort((a, b) => new Date(b.resolvedAt || b.createdAt).getTime() - new Date(a.resolvedAt || a.createdAt).getTime())
})

const filteredExceptions = computed(() => {
  return activeTab.value === 'pending' ? pendingExceptions.value : resolvedExceptions.value
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

          <div class="tabs">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'pending' }"
              @click="activeTab = 'pending'"
            >
              待处理
              <span v-if="pendingExceptions.length > 0" class="tab-badge">
                {{ pendingExceptions.length }}
              </span>
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'resolved' }"
              @click="activeTab = 'resolved'"
            >
              已解决
              <span v-if="resolvedExceptions.length > 0" class="tab-badge resolved">
                {{ resolvedExceptions.length }}
              </span>
            </button>
          </div>

          <div class="exception-list">
            <div
              v-for="exception in filteredExceptions"
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
              <p class="exception-desc">{{ exception.reason }}</p>

              <div class="exception-meta">
                <div class="meta-item" v-if="exception.handlerName">
                  <span class="meta-label">处理人</span>
                  <div class="handler-line">
                    <span
                      class="handler-role"
                      :style="{ color: resolveHandlerRole(exception.handlerId).color }"
                    >
                      {{ resolveHandlerRole(exception.handlerId).label }}
                    </span>
                    <span class="handler-name">{{ exception.handlerName }}</span>
                  </div>
                </div>
                <div class="meta-item" v-if="getPhaseById(exception.phaseId)">
                  <span class="meta-label">阶段状态</span>
                  <span
                    class="phase-status-tag"
                    :style="{
                      backgroundColor: phaseStatusMap[getPhaseById(exception.phaseId)!.status].bgColor,
                      color: phaseStatusMap[getPhaseById(exception.phaseId)!.status].color
                    }"
                  >
                    {{ phaseStatusMap[getPhaseById(exception.phaseId)!.status].label }}
                  </span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">{{ exception.status === 'resolved' ? '解决时间' : '最近处理' }}</span>
                  <span class="meta-value">{{ formatDateTime(getLatestTime(exception)) }}</span>
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

            <div v-if="filteredExceptions.length === 0" class="empty-state">
              <div class="empty-icon">{{ activeTab === 'pending' ? '✅' : '📋' }}</div>
              <p>{{ activeTab === 'pending' ? '暂无待处理异常' : '暂无已解决记录' }}</p>
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

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f3f4f6;
}

.tab-btn.active {
  background: #fee2e2;
  color: #ef4444;
  font-weight: 500;
}

.tab-badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
}

.tab-badge.resolved {
  background: #10b981;
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
  gap: 20px;
  flex-wrap: wrap;
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

.handler-line {
  display: flex;
  align-items: center;
  gap: 4px;
}

.handler-role {
  font-size: 12px;
  font-weight: 600;
}

.handler-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.phase-status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
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
