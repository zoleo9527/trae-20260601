<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RehabPlan, Phase } from '@/types'
import { getPlanById } from '@/mock/data'
import { phaseStatusMap, staffRoleMap } from '@/utils/statusMap'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const plan = ref<RehabPlan | null>(null)
const selectedPhaseId = ref<string>('')
const evaluationResult = ref('')
const evaluationScore = ref(80)
const rejectReason = ref('')
const actionType = ref<'approve' | 'reject' | 'pending'>('approve')
const isSubmitting = ref(false)
const showSuccess = ref(false)

onMounted(() => {
  const planId = route.params.id as string
  plan.value = getPlanById(planId) || null
  
  const phaseQuery = route.query.phase as string
  if (phaseQuery && plan.value) {
    selectedPhaseId.value = phaseQuery
  } else if (plan.value) {
    const currentPhase = plan.value.phases.find(p => p.status === 'in_progress' || p.status === 'pending_review' || p.status === 'rejected')
    if (currentPhase) {
      selectedPhaseId.value = currentPhase.id
    }
  }
})

const selectedPhase = computed(() => {
  if (!plan.value) return null
  return plan.value.phases.find(p => p.id === selectedPhaseId.value) || null
})

const evaluablePhases = computed(() => {
  if (!plan.value) return []
  return plan.value.phases.filter(p => 
    p.status === 'in_progress' || p.status === 'pending_review' || p.status === 'rejected'
  )
})

function goBack() {
  router.push(`/plans/${plan.value?.id}`)
}

function handleSubmit() {
  isSubmitting.value = true
  
  setTimeout(() => {
    isSubmitting.value = false
    showSuccess.value = true
    
    setTimeout(() => {
      showSuccess.value = false
      router.push(`/plans/${plan.value?.id}`)
    }, 1500)
  }, 1000)
}

function isFormValid() {
  if (actionType.value === 'reject') {
    return rejectReason.value.trim().length > 0
  }
  return evaluationResult.value.trim().length > 0 && evaluationScore.value >= 0 && evaluationScore.value <= 100
}
</script>

<template>
  <div v-if="plan" class="plan-evaluate">
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        ← 返回详情
      </button>
      <h2>阶段评估处理</h2>
      <div></div>
    </div>

    <div class="evaluate-grid">
      <div class="main-content">
        <div class="card mb-4">
          <div class="card-body">
            <div class="plan-info">
              <div class="elder-avatar">{{ plan.elder.name.charAt(0) }}</div>
              <div class="plan-detail">
                <h3>{{ plan.elder.name }}</h3>
                <p>{{ plan.title }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">选择评估阶段</div>
          <div class="card-body">
            <div v-if="evaluablePhases.length > 0" class="phase-selector">
              <div
                v-for="phase in evaluablePhases"
                :key="phase.id"
                class="phase-option"
                :class="{ active: selectedPhaseId === phase.id }"
                @click="selectedPhaseId = phase.id"
              >
                <div class="phase-number">{{ phase.phaseNumber }}</div>
                <div class="phase-info">
                  <div class="phase-title">{{ phase.title }}</div>
                  <div class="phase-date">
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
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon">📋</div>
              <p>当前没有需要评估的阶段</p>
            </div>
          </div>
        </div>

        <div v-if="selectedPhase" class="card">
          <div class="card-header">评估内容</div>
          <div class="card-body">
            <div class="phase-summary">
              <div class="summary-row">
                <div class="summary-label">阶段目标</div>
                <div class="summary-value">{{ selectedPhase.target }}</div>
              </div>
              <div class="summary-row">
                <div class="summary-label">训练内容</div>
                <div class="summary-value">{{ selectedPhase.content }}</div>
              </div>
            </div>

            <div class="action-tabs">
              <button
                class="action-tab"
                :class="{ active: actionType === 'approve' }"
                @click="actionType = 'approve'"
              >
                <span class="icon">✓</span>
                通过评估
              </button>
              <button
                class="action-tab"
                :class="{ active: actionType === 'pending' }"
                @click="actionType = 'pending'"
              >
                <span class="icon">⏳</span>
                待复核
              </button>
              <button
                class="action-tab"
                :class="{ active: actionType === 'reject' }"
                @click="actionType = 'reject'"
              >
                <span class="icon">✕</span>
                驳回
              </button>
            </div>

            <div v-if="actionType !== 'reject'" class="form-section">
              <div class="form-group">
                <label class="form-label">
                  评估评分
                  <span class="score-value">{{ evaluationScore }} 分</span>
                </label>
                <input
                  v-model="evaluationScore"
                  type="range"
                  min="0"
                  max="100"
                  class="score-slider"
                />
                <div class="score-labels">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">评估结果</label>
                <textarea
                  v-model="evaluationResult"
                  class="form-textarea"
                  placeholder="请详细描述该阶段的康复效果、存在的问题以及下一步建议..."
                  rows="5"
                ></textarea>
              </div>
            </div>

            <div v-else class="form-section">
              <div class="form-group">
                <label class="form-label">驳回原因</label>
                <textarea
                  v-model="rejectReason"
                  class="form-textarea reject"
                  placeholder="请详细说明驳回原因，以及需要补充哪些资料或改进哪些内容..."
                  rows="5"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-outline" @click="goBack">
                取消
              </button>
              <button
                class="btn"
                :class="{
                  'btn-primary': actionType === 'approve',
                  'btn-warning': actionType === 'pending',
                  'btn-danger': actionType === 'reject'
                }"
                :disabled="!isFormValid() || isSubmitting"
                @click="handleSubmit"
              >
                <span v-if="isSubmitting">提交中...</span>
                <span v-else-if="actionType === 'approve'">确认通过</span>
                <span v-else-if="actionType === 'pending'">提交复核</span>
                <span v-else>确认驳回</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="side-content">
        <div class="card">
          <div class="card-header">负责人员</div>
          <div class="card-body">
            <div class="staff-list">
              <div class="staff-item" v-if="plan.nursingDirector">
                <div class="avatar small">{{ plan.nursingDirector.name.charAt(0) }}</div>
                <div class="staff-info">
                  <div class="staff-name">{{ plan.nursingDirector.name }}</div>
                  <div
                    class="staff-role"
                    :style="{ color: staffRoleMap.nursing_director.color }"
                  >
                    {{ staffRoleMap.nursing_director.label }}
                  </div>
                </div>
              </div>
              <div class="staff-item" v-if="plan.primaryNurse">
                <div class="avatar small">{{ plan.primaryNurse.name.charAt(0) }}</div>
                <div class="staff-info">
                  <div class="staff-name">{{ plan.primaryNurse.name }}</div>
                  <div
                    class="staff-role"
                    :style="{ color: staffRoleMap.primary_nurse.color }"
                  >
                    {{ staffRoleMap.primary_nurse.label }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header">评估提示</div>
          <div class="card-body">
            <ul class="tips-list">
              <li>
                <span class="tip-icon">📝</span>
                <span>请确保评估内容客观、具体，包含可量化的数据</span>
              </li>
              <li>
                <span class="tip-icon">⚠️</span>
                <span>如发现异常情况，请及时记录并标记</span>
              </li>
              <li>
                <span class="tip-icon">💡</span>
                <span>评估结果将作为下一阶段计划制定的重要依据</span>
              </li>
              <li>
                <span class="tip-icon">📋</span>
                <span>所有评估记录将永久保存，可随时追溯查看</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSuccess" class="success-overlay">
      <div class="success-modal">
        <div class="success-icon">✓</div>
        <h3>评估提交成功</h3>
        <p>正在返回详情页...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-evaluate {
  min-height: calc(100vh - 112px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.back-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.evaluate-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}

.plan-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.elder-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #dbeafe;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.plan-detail h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.plan-detail p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.phase-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phase-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.phase-option:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.phase-option.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.phase-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
}

.phase-option.active .phase-number {
  background: #3b82f6;
  color: white;
}

.phase-info {
  flex: 1;
}

.phase-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.phase-date {
  font-size: 13px;
  color: #6b7280;
}

.phase-summary {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-label {
  width: 80px;
  font-size: 13px;
  color: #9ca3af;
  flex-shrink: 0;
}

.summary-value {
  flex: 1;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.action-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.action-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.action-tab:hover {
  border-color: #d1d5db;
}

.action-tab.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.action-tab .icon {
  font-size: 24px;
}

.form-section {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.score-value {
  font-size: 18px;
  font-weight: 600;
  color: #3b82f6;
}

.score-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.score-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.score-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.6;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: #3b82f6;
}

.form-textarea.reject {
  border-color: #fca5a5;
}

.form-textarea.reject:focus {
  border-color: #ef4444;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.staff-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.staff-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar.small {
  width: 36px;
  height: 36px;
  font-size: 14px;
}

.staff-info {
  flex: 1;
}

.staff-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.staff-role {
  font-size: 12px;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tips-list li {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-modal {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #d1fae5;
  color: #10b981;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.success-modal h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.success-modal p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}
</style>
