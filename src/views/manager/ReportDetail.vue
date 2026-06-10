<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useReportStore } from '@/stores/reportStore'
import { useIsolationStore } from '@/stores/isolationStore'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const route = useRoute()
const reportStore = useReportStore()
const isolationStore = useIsolationStore()

const reportId = computed(() => route.params.id as string)
const report = computed(() => reportStore.getReportById(reportId.value))
const hasIsolation = computed(() => !!report.value?.isolationId)

const showRejectModal = ref(false)
const rejectReason = ref('')

function getSeverityLabel(severity: string) {
  const map: Record<string, string> = {
    low: '轻微',
    medium: '中等',
    high: '严重',
    critical: '紧急'
  }
  return map[severity] || severity
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function handleApprove() {
  if (!report.value) return
  reportStore.approveReport(report.value.id, '王场长')
  alert('已确认该上报，可以启动隔离处理')
}

function handleReject() {
  if (!report.value || !rejectReason.value.trim()) return
  reportStore.rejectReport(report.value.id, '王场长', rejectReason.value)
  showRejectModal.value = false
  alert('已驳回该上报')
}

function goToIsolation() {
  router.push({ name: 'isolation-form', params: { id: report.value?.id } })
}

function goBack() {
  router.push({ name: 'manager' })
}

onMounted(() => {
  isolationStore.loadIsolations()
})
</script>

<template>
  <div class="page-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">👨‍🌾 场长</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item" @click="goBack">
          <span>←</span> 返回工作台
        </div>
        <div class="nav-item" @click="router.push({ name: 'isolation-review' })">
          <span>🔒</span> 隔离回看
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div v-if="!report" class="empty-state">
        <p>未找到该上报记录</p>
        <button class="btn btn-primary" @click="goBack">返回工作台</button>
      </div>

      <div v-else class="detail-container">
        <div class="detail-header">
          <div>
            <h1 class="page-title">{{ report.reportCode }}</h1>
            <p class="page-subtitle">疫病上报详情</p>
          </div>
          <StatusBadge :status="report.status" />
        </div>

        <div class="detail-card">
          <h3 class="card-title">基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>上报人角色</label>
              <span>{{ report.reporterRole === 'feeder' ? '饲养员' : '分拣员' }}</span>
            </div>
            <div class="info-item">
              <label>上报人姓名</label>
              <span>{{ report.reporterName }}</span>
            </div>
            <div class="info-item">
              <label>鸡舍编号</label>
              <span>{{ report.barnNumber }}</span>
            </div>
            <div class="info-item">
              <label>鸡群数量</label>
              <span>{{ report.chickenCount }} 只</span>
            </div>
            <div class="info-item">
              <label>上报时间</label>
              <span>{{ formatDateTime(report.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>严重程度</label>
              <span class="severity-badge">{{ getSeverityLabel(report.severity) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <h3 class="card-title">症状与诊断</h3>
          <div class="info-grid">
            <div class="info-item full">
              <label>症状描述</label>
              <span>{{ report.symptomDescription }}</span>
            </div>
            <div class="info-item full">
              <label>疑似病症</label>
              <span>{{ report.suspectedDisease }}</span>
            </div>
          </div>
        </div>

        <div v-if="report.status === 'rejected'" class="detail-card reject">
          <h3 class="card-title">驳回信息</h3>
          <div class="info-grid">
            <div class="info-item full">
              <label>驳回原因</label>
              <span class="reject-reason">{{ report.rejectReason }}</span>
            </div>
            <div class="info-item">
              <label>处理人</label>
              <span>{{ report.processedBy }}</span>
            </div>
            <div class="info-item">
              <label>处理时间</label>
              <span>{{ formatDateTime(report.processedAt || '') }}</span>
            </div>
          </div>
        </div>

        <div v-if="report.status === 'confirmed'" class="detail-card action">
          <h3 class="card-title">隔离处理</h3>
          <p class="action-hint">该上报已确认，现在可以启动隔离处理流程</p>
          <button class="btn btn-primary btn-lg" @click="goToIsolation">
            🔒 启动隔离处理
          </button>
        </div>

        <div v-if="report.status === 'isolating' || report.status === 'resolved'" class="detail-card action">
          <h3 class="card-title">隔离状态</h3>
          <p class="action-hint">
            当前状态：<StatusBadge :status="report.status" />
          </p>
          <button class="btn btn-secondary" @click="router.push({ name: 'isolation-review' })">
            查看隔离详情
          </button>
        </div>

        <div v-if="report.status === 'pending'" class="action-buttons">
          <button class="btn btn-primary" @click="handleApprove">
            ✓ 确认上报
          </button>
          <button class="btn btn-danger" @click="showRejectModal = true">
            ✗ 驳回
          </button>
        </div>
      </div>

      <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal = false">
        <div class="modal">
          <h3>驳回上报</h3>
          <div class="input-group">
            <label>驳回原因</label>
            <textarea
              v-model="rejectReason"
              rows="4"
              placeholder="请输入驳回原因..."
            ></textarea>
          </div>
          <div class="modal-buttons">
            <button class="btn btn-secondary" @click="showRejectModal = false">取消</button>
            <button class="btn btn-danger" @click="handleReject">确认驳回</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.detail-container {
  max-width: 800px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.detail-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.detail-card.reject {
  border-left: 4px solid var(--color-danger);
}

.detail-card.action {
  border-left: 4px solid var(--color-primary);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--color-text);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full {
  grid-column: span 2;
}

.info-item label {
  font-size: 12px;
  color: var(--color-text-light);
  text-transform: uppercase;
}

.info-item span {
  font-size: 14px;
  color: var(--color-text);
}

.severity-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #FFEBEE;
  color: #C54B4B;
  border-radius: 4px;
  font-weight: 600;
}

.reject-reason {
  color: var(--color-danger);
}

.action-hint {
  color: var(--color-text-light);
  margin-bottom: 16px;
}

.btn-lg {
  padding: 14px 32px;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 480px;
}

.modal h3 {
  margin: 0 0 20px 0;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  resize: vertical;
}
</style>
