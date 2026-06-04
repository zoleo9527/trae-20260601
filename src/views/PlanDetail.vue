<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RehabPlan, Phase, TimelineEvent, ExceptionRecord } from '@/types'
import { getPlanById, getTimelinesByPlanId, getExceptionsByPlanId } from '@/mock/data'
import { planStatusMap, staffRoleMap, phaseStatusMap } from '@/utils/statusMap'
import { formatDate, formatDateTime } from '@/utils/format'
import Timeline from '@/components/Timeline.vue'
import PhaseCard from '@/components/PhaseCard.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'

const route = useRoute()
const router = useRouter()

const plan = ref<RehabPlan | null>(null)
const timelines = ref<TimelineEvent[]>([])
const exceptions = ref<ExceptionRecord[]>([])
const activeTab = ref('phases')
const showExceptionDrawer = ref(false)
const showPhaseDetail = ref(false)
const selectedPhase = ref<Phase | null>(null)

onMounted(() => {
  const planId = route.params.id as string
  plan.value = getPlanById(planId) || null
  if (plan.value) {
    timelines.value = getTimelinesByPlanId(planId)
    exceptions.value = getExceptionsByPlanId(planId)
  }
})

const currentPhase = computed(() => {
  if (!plan.value) return null
  return plan.value.phases.find(p => p.status === 'in_progress') || plan.value.phases.find(p => p.status === 'pending_review')
})

function viewPhaseDetail(phase: Phase) {
  selectedPhase.value = phase
  showPhaseDetail.value = true
}

function handleEvaluate(phase: Phase) {
  router.push(`/plans/${plan.value?.id}/evaluate?phase=${phase.id}`)
}

function goBack() {
  router.push('/plans')
}
</script>

<template>
  <div v-if="plan" class="plan-detail">
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        ← 返回列表
      </button>
      <div class="header-actions">
        <button
          v-if="plan.hasException"
          class="btn btn-danger btn-sm"
          @click="showExceptionDrawer = true"
        >
          ⚠️ 异常处理
        </button>
        <button class="btn btn-primary btn-sm" @click="handleEvaluate(currentPhase!)" v-if="currentPhase">
          处理当前阶段
        </button>
      </div>
    </div>

    <div class="detail-grid">
      <div class="main-content">
        <div class="card mb-4">
          <div class="card-body">
            <div class="plan-header">
              <div class="elder-info">
                <div class="avatar large">{{ plan.elder.name.charAt(0) }}</div>
                <div>
                  <h2 class="elder-name">{{ plan.elder.name }}</h2>
                  <div class="elder-meta">
                    <span>{{ plan.elder.roomNumber }} · {{ plan.elder.bedNumber }}</span>
                    <span>·</span>
                    <span>{{ plan.elder.age }}岁 · {{ plan.elder.gender === 'male' ? '男' : '女' }}</span>
                    <span>·</span>
                    <span>{{ plan.elder.primaryDisease }}</span>
                  </div>
                </div>
              </div>
              <div
                class="status-badge large"
                :style="{
                  backgroundColor: planStatusMap[plan.status].bgColor,
                  color: planStatusMap[plan.status].color
                }"
              >
                {{ planStatusMap[plan.status].label }}
              </div>
            </div>

            <div class="plan-title-section">
              <h3>{{ plan.title }}</h3>
              <p class="plan-desc">{{ plan.description }}</p>
            </div>

            <div class="plan-stats">
              <div class="stat-item">
                <div class="stat-label">开始时间</div>
                <div class="stat-value">{{ formatDate(plan.startDate) }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">预计完成</div>
                <div class="stat-value">{{ formatDate(plan.expectedEndDate) }}</div>
              </div>
              <div class="stat-item" v-if="plan.actualEndDate">
                <div class="stat-label">实际完成</div>
                <div class="stat-value">{{ formatDate(plan.actualEndDate) }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">阶段进度</div>
                <div class="stat-value">
                  {{ plan.phases.filter(p => p.status === 'approved' || p.status === 'supplemented').length }} / {{ plan.phases.length }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="tabs-header">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'phases' }"
              @click="activeTab = 'phases'"
            >
              阶段评估
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'timeline' }"
              @click="activeTab = 'timeline'"
            >
              操作时间线
            </button>
          </div>

          <div class="card-body" v-if="activeTab === 'phases'">
            <div class="phases-list">
              <PhaseCard
                v-for="phase in plan.phases"
                :key="phase.id"
                :phase="phase"
                :active="currentPhase?.id === phase.id"
                @view="viewPhaseDetail"
                @evaluate="handleEvaluate"
              />
            </div>
          </div>

          <div class="card-body" v-if="activeTab === 'timeline'">
            <Timeline :events="timelines" />
          </div>
        </div>
      </div>

      <div class="side-content">
        <div class="card">
          <div class="card-header">负责人员</div>
          <div class="card-body">
            <div class="staff-list">
              <div class="staff-item" v-if="plan.nursingDirector">
                <div class="avatar">{{ plan.nursingDirector.name.charAt(0) }}</div>
                <div class="staff-info">
                  <div class="staff-name">{{ plan.nursingDirector.name }}</div>
                  <div
                    class="staff-role"
                    :style="{ color: staffRoleMap.nursing_director.color }"
                  >
                    {{ staffRoleMap.nursing_director.label }}
                  </div>
                </div>
                <div class="staff-phone">{{ plan.nursingDirector.phone }}</div>
              </div>
              <div class="staff-item" v-if="plan.primaryNurse">
                <div class="avatar">{{ plan.primaryNurse.name.charAt(0) }}</div>
                <div class="staff-info">
                  <div class="staff-name">{{ plan.primaryNurse.name }}</div>
                  <div
                    class="staff-role"
                    :style="{ color: staffRoleMap.primary_nurse.color }"
                  >
                    {{ staffRoleMap.primary_nurse.label }}
                  </div>
                </div>
                <div class="staff-phone">{{ plan.primaryNurse.phone }}</div>
              </div>
              <div class="staff-item" v-if="plan.socialWorker">
                <div class="avatar">{{ plan.socialWorker.name.charAt(0) }}</div>
                <div class="staff-info">
                  <div class="staff-name">{{ plan.socialWorker.name }}</div>
                  <div
                    class="staff-role"
                    :style="{ color: staffRoleMap.social_worker.color }"
                  >
                    {{ staffRoleMap.social_worker.label }}
                  </div>
                </div>
                <div class="staff-phone">{{ plan.socialWorker.phone }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header">
            <span>异常提醒</span>
            <span class="badge danger" v-if="exceptions.filter(e => e.status !== 'resolved').length > 0">
              {{ exceptions.filter(e => e.status !== 'resolved').length }}
            </span>
          </div>
          <div class="card-body">
            <div v-if="exceptions.length > 0" class="exception-list">
              <div
                v-for="exception in exceptions"
                :key="exception.id"
                class="exception-item"
                :class="{ resolved: exception.status === 'resolved' }"
              >
                <div class="exception-title">{{ exception.title }}</div>
                <div class="exception-meta">
                  <span
                    class="status-badge"
                    :style="{
                      backgroundColor: exception.status === 'resolved' ? '#d1fae5' : '#fee2e2',
                      color: exception.status === 'resolved' ? '#10b981' : '#ef4444'
                    }"
                  >
                    {{ exception.status === 'resolved' ? '已解决' : '待处理' }}
                  </span>
                  <span class="exception-time">{{ formatDateTime(exception.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small">
              <div class="empty-icon">✅</div>
              <p>暂无异常</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ExceptionDrawer
      v-model:visible="showExceptionDrawer"
      :plan="plan"
    />

    <div v-if="showPhaseDetail && selectedPhase" class="modal-overlay" @click="showPhaseDetail = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>阶段评估回看</h3>
          <button class="close-btn" @click="showPhaseDetail = false">×</button>
        </div>
        <div class="modal-body">
          <div class="phase-detail">
            <div class="detail-row">
              <div class="detail-label">阶段</div>
              <div class="detail-value">第 {{ selectedPhase.phaseNumber }} 阶段：{{ selectedPhase.title }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">状态</div>
              <div class="detail-value">
                <span
                  class="status-badge"
                  :style="{
                    backgroundColor: phaseStatusMap[selectedPhase.status].bgColor,
                    color: phaseStatusMap[selectedPhase.status].color
                  }"
                >
                  {{ phaseStatusMap[selectedPhase.status].label }}
                </span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">时间范围</div>
              <div class="detail-value">
                {{ formatDate(selectedPhase.startDate) }} ~ {{ formatDate(selectedPhase.endDate) }}
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">目标</div>
              <div class="detail-value">{{ selectedPhase.target }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">内容</div>
              <div class="detail-value">{{ selectedPhase.content }}</div>
            </div>
            <div v-if="selectedPhase.evaluationResult" class="detail-row full">
              <div class="detail-label">评估结果</div>
              <div class="detail-value evaluation-box">
                <div v-if="selectedPhase.evaluationScore" class="score">
                  {{ selectedPhase.evaluationScore }} 分
                </div>
                <p>{{ selectedPhase.evaluationResult }}</p>
              </div>
            </div>
            <div v-if="selectedPhase.rejectReason" class="detail-row full">
              <div class="detail-label">驳回原因</div>
              <div class="detail-value reject-box">
                {{ selectedPhase.rejectReason }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-detail {
  min-height: calc(100vh - 112px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.header-actions {
  display: flex;
  gap: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.elder-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar.large {
  width: 56px;
  height: 56px;
  font-size: 20px;
}

.elder-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.elder-meta {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  gap: 8px;
}

.status-badge.large {
  padding: 6px 14px;
  font-size: 13px;
}

.plan-title-section {
  margin-bottom: 20px;
}

.plan-title-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.plan-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.plan-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.tabs-header {
  display: flex;
  gap: 8px;
  padding: 12px 24px 0;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #374151;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 500;
}

.phases-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.staff-phone {
  font-size: 12px;
  color: #9ca3af;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.badge.danger {
  background: #ef4444;
  color: white;
}

.exception-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exception-item {
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
}

.exception-item.resolved {
  background: #f0fdf4;
}

.exception-title {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 6px;
}

.exception-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exception-time {
  font-size: 11px;
  color: #9ca3af;
}

.empty-state.small {
  padding: 32px;
}

.empty-state.small .empty-icon {
  font-size: 32px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 560px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 24px;
  max-height: calc(80vh - 77px);
  overflow-y: auto;
}

.phase-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px;
}

.detail-row.full {
  grid-template-columns: 1fr;
}

.detail-label {
  font-size: 13px;
  color: #9ca3af;
  line-height: 24px;
}

.detail-value {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.evaluation-box {
  padding: 16px;
  background: #f0fdf4;
  border-radius: 8px;
}

.evaluation-box .score {
  font-size: 24px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 8px;
}

.evaluation-box p {
  margin: 0;
  color: #374151;
}

.reject-box {
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
  color: #dc2626 !important;
}
</style>
