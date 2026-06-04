<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { RehabPlan, Staff } from '@/types'
import { getPlans, getAllExceptions, getExceptionsByPlanId } from '@/store'
import { planStatusMap, staffRoleMap, phaseStatusMap, exceptionStatusMap } from '@/utils/statusMap'
import { formatDate, calculateProgress } from '@/utils/format'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'

const router = useRouter()
const searchKeyword = ref('')
const statusFilter = ref('all')
const showExceptionDrawer = ref(false)
const selectedPlan = ref<RehabPlan | null>(null)

const plans = computed(() => getPlans())

const filteredPlans = computed(() => {
  return plans.value.filter(plan => {
    const matchKeyword = searchKeyword.value === '' || 
      plan.elder.name.includes(searchKeyword.value) ||
      plan.title.includes(searchKeyword.value)
    const matchStatus = statusFilter.value === 'all' || plan.status === statusFilter.value
    return matchKeyword && matchStatus
  })
})

const stats = computed(() => {
  const total = plans.value.length
  const inProgress = plans.value.filter(p => p.status === 'in_progress').length
  const hasException = plans.value.filter(p => p.hasException).length
  const completed = plans.value.filter(p => p.status === 'completed').length
  return { total, inProgress, hasException, completed }
})

function viewDetail(plan: RehabPlan) {
  router.push(`/plans/${plan.id}`)
}

function handleEvaluate(plan: RehabPlan) {
  router.push(`/plans/${plan.id}/evaluate`)
}

function openExceptionDrawer(plan: RehabPlan) {
  selectedPlan.value = plan
  showExceptionDrawer.value = true
}

function getCurrentPhase(plan: RehabPlan) {
  return plan.phases.find(p => p.status === 'in_progress')
    || plan.phases.find(p => p.status === 'pending_review')
    || plan.phases.find(p => p.status === 'rejected')
}

function getPhaseStatusInfo(plan: RehabPlan) {
  const phase = getCurrentPhase(plan)
  if (!phase) return null
  return {
    phase,
    status: phaseStatusMap[phase.status]
  }
}

function getCurrentHandler(plan: RehabPlan): { name: string; role: string; color: string } | null {
  const phase = getCurrentPhase(plan)
  if (!phase) return null
  if (phase.status === 'pending_review' || phase.status === 'rejected') {
    if (plan.nursingDirector) {
      return { name: plan.nursingDirector.name, role: staffRoleMap.nursing_director.label, color: staffRoleMap.nursing_director.color }
    }
  }
  if (phase.status === 'in_progress') {
    if (plan.primaryNurse) {
      return { name: plan.primaryNurse.name, role: staffRoleMap.primary_nurse.label, color: staffRoleMap.primary_nurse.color }
    }
  }
  if (plan.primaryNurse) {
    return { name: plan.primaryNurse.name, role: staffRoleMap.primary_nurse.label, color: staffRoleMap.primary_nurse.color }
  }
  return null
}

function getBlockReason(plan: RehabPlan): string | null {
  if (plan.status === 'completed') return null
  const phase = getCurrentPhase(plan)
  if (!phase) return null
  if (phase.status === 'rejected') return phase.rejectReason || '评估被驳回'
  if (phase.status === 'pending_review') return '等待护理主管复核确认'
  if (phase.isDelayed) return '评估已超期'
  return null
}
</script>

<template>
  <div class="plan-list">
    <div class="page-header">
      <h2>康复计划管理</h2>
      <p class="text-muted text-sm">管理和追踪老人康复计划的执行进度与阶段评估</p>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">全部计划</div>
      </div>
      <div class="stat-card stat-primary">
        <div class="stat-value">{{ stats.inProgress }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card stat-danger">
        <div class="stat-value">{{ stats.hasException }}</div>
        <div class="stat-label">有异常</div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-value">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索老人姓名或计划名称..."
          class="search-input"
        />
      </div>
      <div class="filter-select">
        <select v-model="statusFilter" class="select">
          <option value="all">全部状态</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="pending">待审核</option>
          <option value="suspended">已暂停</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="card-body" style="padding: 0">
        <table class="table">
          <thead>
            <tr>
              <th>老人信息</th>
              <th>康复计划</th>
              <th>责任归属与卡点</th>
              <th>当前阶段</th>
              <th>进度</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in filteredPlans" :key="plan.id">
              <td>
                <div class="elder-info">
                  <div class="avatar">{{ plan.elder.name.charAt(0) }}</div>
                  <div>
                    <div class="font-medium">{{ plan.elder.name }}</div>
                    <div class="text-sm text-muted">
                      {{ plan.elder.roomNumber }} · {{ plan.elder.bedNumber }} · {{ plan.elder.primaryDisease }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div class="plan-info">
                  <div class="font-medium">{{ plan.title }}</div>
                  <div class="text-sm text-muted">
                    {{ formatDate(plan.startDate) }} ~ {{ formatDate(plan.expectedEndDate) }}
                  </div>
                </div>
              </td>
              <td>
                <div class="attribution-cell">
                  <div class="handler-info" v-if="getCurrentHandler(plan)">
                    <span class="handler-role" :style="{ color: getCurrentHandler(plan)!.color }">
                      {{ getCurrentHandler(plan)!.role }}
                    </span>
                    <span class="handler-name">{{ getCurrentHandler(plan)!.name }}</span>
                  </div>
                  <div class="block-reason" v-if="getBlockReason(plan)">
                    <span class="block-icon">⏸</span>
                    <span class="block-text">{{ getBlockReason(plan) }}</span>
                  </div>
                  <div class="block-tags" v-if="getPhaseStatusInfo(plan) && (getPhaseStatusInfo(plan)!.phase.status === 'pending_review' || getPhaseStatusInfo(plan)!.phase.status === 'rejected')">
                    <span
                      class="status-tag"
                      :style="{
                        backgroundColor: getPhaseStatusInfo(plan)!.status.bgColor,
                        color: getPhaseStatusInfo(plan)!.status.color
                      }"
                    >
                      {{ getPhaseStatusInfo(plan)!.status.label }}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div v-if="getPhaseStatusInfo(plan)" class="phase-info">
                  <div class="phase-number">第 {{ getPhaseStatusInfo(plan)!.phase.phaseNumber }} 阶段</div>
                  <div class="phase-name">{{ getPhaseStatusInfo(plan)!.phase.title }}</div>
                </div>
                <div v-else class="text-muted text-sm">-</div>
              </td>
              <td style="width: 180px">
                <div class="progress-wrap">
                  <div class="progress-bar">
                    <div
                      class="progress-bar-fill"
                      :style="{ width: calculateProgress(plan.startDate, plan.expectedEndDate) + '%' }"
                    ></div>
                  </div>
                  <div class="progress-text">
                    {{ calculateProgress(plan.startDate, plan.expectedEndDate) }}%
                  </div>
                </div>
              </td>
              <td>
                <div class="status-wrap">
                  <div
                    class="status-badge"
                    :style="{
                      backgroundColor: planStatusMap[plan.status].bgColor,
                      color: planStatusMap[plan.status].color
                    }"
                  >
                    {{ planStatusMap[plan.status].label }}
                  </div>
                  <button
                    v-if="plan.hasException"
                    class="exception-btn"
                    @click.stop="openExceptionDrawer(plan)"
                  >
                    ⚠️
                  </button>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-outline btn-sm" @click="viewDetail(plan)">
                    查看详情
                  </button>
                  <button
                    class="btn btn-primary btn-sm"
                    @click="handleEvaluate(plan)"
                  >
                    处理评估
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ExceptionDrawer
      v-model:visible="showExceptionDrawer"
      :plan="selectedPlan"
    />
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #e5e7eb;
}

.stat-card.stat-primary {
  border-left-color: #3b82f6;
}

.stat-card.stat-danger {
  border-left-color: #ef4444;
}

.stat-card.stat-success {
  border-left-color: #10b981;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  outline: none;
  cursor: pointer;
}

.elder-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-info {
  max-width: 240px;
}

.font-medium {
  font-weight: 500;
}

.staff-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.staff-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.staff-role {
  font-size: 11px;
  font-weight: 500;
}

.staff-name {
  color: #374151;
}

.attribution-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.handler-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.handler-role {
  font-size: 11px;
  font-weight: 600;
}

.handler-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.block-reason {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  color: #b45309;
  line-height: 1.4;
}

.block-icon {
  flex-shrink: 0;
  font-size: 11px;
  margin-top: 1px;
}

.block-text {
  word-break: break-all;
}

.block-tags {
  display: flex;
  gap: 4px;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.phase-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phase-number {
  font-size: 12px;
  color: #6b7280;
}

.phase-name {
  font-size: 14px;
  font-weight: 500;
}

.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  text-align: right;
}

.status-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exception-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #fee2e2;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
