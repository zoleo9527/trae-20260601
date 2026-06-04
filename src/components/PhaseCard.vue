<script setup lang="ts">
import type { Phase } from '@/types'
import { phaseStatusMap } from '@/utils/statusMap'
import { formatDate } from '@/utils/format'

const props = defineProps<{
  phase: Phase
  active?: boolean
}>()

const emit = defineEmits<{
  (e: 'view', phase: Phase): void
  (e: 'evaluate', phase: Phase): void
}>()
</script>

<template>
  <div
    class="phase-card"
    :class="{
      active: active,
      completed: phase.status === 'approved' || phase.status === 'supplemented',
      delayed: phase.isDelayed
    }"
  >
    <div class="phase-header">
      <div class="phase-number">
        <span class="number">{{ phase.phaseNumber }}</span>
      </div>
      <div class="phase-info">
        <h4 class="phase-title">{{ phase.title }}</h4>
        <div class="phase-dates">
          {{ formatDate(phase.startDate) }} ~ {{ formatDate(phase.endDate) }}
        </div>
      </div>
      <div
        class="status-badge"
        :style="{
          backgroundColor: phaseStatusMap[phase.status].bgColor,
          color: phaseStatusMap[phase.status].color
        }"
      >
        {{ phaseStatusMap[phase.status].label }}
      </div>
    </div>

    <div class="phase-body">
      <div class="phase-section">
        <div class="section-label">目标</div>
        <div class="section-content">{{ phase.target }}</div>
      </div>
      <div class="phase-section">
        <div class="section-label">内容</div>
        <div class="section-content">{{ phase.content }}</div>
      </div>

      <div v-if="phase.evaluationResult" class="evaluation-result">
        <div class="result-header">
          <span class="result-label">评估结果</span>
          <span v-if="phase.evaluationScore" class="result-score">
            {{ phase.evaluationScore }} 分
          </span>
        </div>
        <p class="result-content">{{ phase.evaluationResult }}</p>
        <div v-if="phase.rejectReason" class="reject-reason">
          <span class="reject-label">驳回原因：</span>
          {{ phase.rejectReason }}
        </div>
      </div>
    </div>

    <div class="phase-footer">
      <div class="phase-tags">
        <span v-if="phase.isDelayed" class="tag tag-danger">已拖延</span>
        <span v-if="phase.isSupplemented" class="tag tag-purple">已补录</span>
      </div>
      <div class="phase-actions">
        <button
          v-if="phase.status !== 'not_started'"
          class="btn btn-outline btn-sm"
          @click="emit('view', phase)"
        >
          回看
        </button>
        <button
          v-if="phase.status === 'in_progress' || phase.status === 'rejected' || phase.status === 'pending_review'"
          class="btn btn-primary btn-sm"
          @click="emit('evaluate', phase)"
        >
          {{ phase.status === 'rejected' ? '重新评估' : '处理评估' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phase-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.phase-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.phase-card.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.phase-card.completed {
  border-color: #10b981;
}

.phase-card.delayed {
  border-color: #ef4444;
}

.phase-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.phase-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phase-card.active .phase-number {
  background: #3b82f6;
}

.phase-card.completed .phase-number {
  background: #10b981;
}

.phase-card.delayed .phase-number {
  background: #ef4444;
}

.number {
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
}

.phase-card.active .number,
.phase-card.completed .number,
.phase-card.delayed .number {
  color: white;
}

.phase-info {
  flex: 1;
}

.phase-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.phase-dates {
  font-size: 12px;
  color: #6b7280;
}

.phase-body {
  padding: 16px;
}

.phase-section {
  margin-bottom: 12px;
}

.phase-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.section-content {
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.evaluation-result {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e5e7eb;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-label {
  font-size: 13px;
  font-weight: 500;
  color: #10b981;
}

.result-score {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
}

.result-content {
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.reject-reason {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
  font-size: 12px;
  color: #dc2626;
}

.reject-label {
  font-weight: 500;
}

.phase-footer {
  padding: 12px 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.phase-tags {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
}

.tag-danger {
  background: #fee2e2;
  color: #ef4444;
}

.tag-purple {
  background: #ede9fe;
  color: #8b5cf6;
}

.phase-actions {
  display: flex;
  gap: 8px;
}
</style>
