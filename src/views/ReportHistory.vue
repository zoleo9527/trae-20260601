<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reportStore'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const reportStore = useReportStore()

const currentRole = computed(() => reportStore.currentRole)
const myReports = computed(() => reportStore.myReports)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function goBack() {
  router.push({ name: currentRole.value as string })
}

function handleStatusClick(reportId: string) {
  const report = reportStore.getReportById(reportId)
  if (report && (report.status === 'isolating' || report.status === 'resolved')) {
    localStorage.setItem('current_role', 'manager')
    router.push({ name: 'isolation-review' })
  }
}
</script>

<template>
  <div class="page-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">{{ currentRole === 'feeder' ? '🐔' : '🥚' }} {{ currentRole === 'feeder' ? '饲养员' : '分拣员' }}</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item" @click="goBack">
          <span>←</span> 返回工作台
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div class="page-header">
        <h1 class="page-title">上报历史</h1>
        <p class="page-subtitle">查看所有已提交的上报记录</p>
      </div>

      <div class="stats-grid">
        <div class="stats-card">
          <div class="stats-label">全部</div>
          <div class="stats-value">{{ myReports.length }}</div>
        </div>
        <div class="stats-card">
          <div class="stats-label">待审核</div>
          <div class="stats-value">{{ myReports.filter(r => r.status === 'pending').length }}</div>
        </div>
        <div class="stats-card">
          <div class="stats-label">已确认</div>
          <div class="stats-value">{{ myReports.filter(r => r.status === 'confirmed').length }}</div>
        </div>
        <div class="stats-card">
          <div class="stats-label">隔离中</div>
          <div class="stats-value">{{ myReports.filter(r => r.status === 'isolating').length }}</div>
        </div>
      </div>

      <div class="section">
        <div v-if="myReports.length === 0" class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>暂无上报记录</p>
          <button class="btn btn-primary" @click="router.push({ name: 'report-new' })">
            立即上报
          </button>
        </div>

        <div v-else class="list-container">
          <div
            v-for="report in myReports"
            :key="report.id"
            class="list-item"
          >
            <div class="list-item-content">
              <div class="list-item-header">
                <span class="list-item-title">{{ report.reportCode }}</span>
                <StatusBadge 
                  :status="report.status" 
                  :clickable="report.status === 'isolating' || report.status === 'resolved'"
                  @click="handleStatusClick(report.id)"
                />
              </div>
              <div class="list-item-meta">
                {{ report.barnNumber }} · {{ report.suspectedDisease }}
              </div>
              <div class="list-item-meta">
                上报时间：{{ formatDate(report.createdAt) }}
              </div>
              <div class="list-item-desc">{{ report.symptomDescription }}</div>

              <div v-if="report.status === 'rejected' && report.rejectReason" class="reject-info">
                <strong>驳回原因：</strong>{{ report.rejectReason }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stats-card {
  background: white;
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stats-label {
  font-size: 12px;
  color: var(--color-text-light);
  margin-bottom: 4px;
}

.stats-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

.list-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.list-item-meta {
  font-size: 13px;
  color: var(--color-text-light);
  margin-top: 2px;
}

.list-item-desc {
  font-size: 13px;
  color: var(--color-text-light);
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 500px;
}

.reject-info {
  margin-top: 8px;
  padding: 8px 12px;
  background: #FFF3F3;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-danger);
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: white;
  border-radius: var(--radius-lg);
}
</style>
