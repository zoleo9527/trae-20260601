<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reportStore'
import { useIsolationStore } from '@/stores/isolationStore'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const reportStore = useReportStore()
const isolationStore = useIsolationStore()

const stats = computed(() => reportStore.stats)
const pendingReports = computed(() => reportStore.pendingReports)
const confirmedReports = computed(() => reportStore.confirmedReports)

function goToReportDetail(id: string) {
  router.push({ name: 'report-detail', params: { id } })
}

function goToIsolationReview() {
  router.push({ name: 'isolation-review' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function getSeverityLabel(severity: string) {
  const map: Record<string, string> = {
    low: '轻微',
    medium: '中等',
    high: '严重',
    critical: '紧急'
  }
  return map[severity] || severity
}

function getSeverityClass(severity: string) {
  const map: Record<string, string> = {
    low: 'severity-low',
    medium: 'severity-medium',
    high: 'severity-high',
    critical: 'severity-critical'
  }
  return map[severity] || ''
}
</script>

<template>
  <div class="page-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">👨‍🌾 场长</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item active">
          <span>📊</span> 工作台
        </div>
        <div class="nav-item" @click="goToIsolationReview">
          <span>🔒</span> 隔离回看
        </div>
        <div class="nav-item" @click="router.push({ name: 'role-select' })">
          <span>🚪</span> 退出登录
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div class="page-header">
        <h1 class="page-title">场长工作台</h1>
        <p class="page-subtitle">管理全场疫病上报与隔离处理</p>
      </div>

      <div class="stats-grid">
        <div class="stats-card">
          <div class="stats-label">待审核</div>
          <div class="stats-value pending">{{ stats.pending }}</div>
        </div>
        <div class="stats-card">
          <div class="stats-label">已确认待处理</div>
          <div class="stats-value confirmed">{{ stats.confirmed }}</div>
        </div>
        <div class="stats-card">
          <div class="stats-label">隔离中</div>
          <div class="stats-value isolating">{{ stats.isolating }}</div>
        </div>
        <div class="stats-card">
          <div class="stats-label">已解除</div>
          <div class="stats-value resolved">{{ stats.resolved }}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>待处理上报</h2>
          <span class="badge badge-pending" v-if="pendingReports.length > 0">
            {{ pendingReports.length }} 条待审核
          </span>
        </div>

        <div v-if="pendingReports.length === 0 && confirmedReports.length === 0" class="empty-state">
          <div class="empty-state-icon">✅</div>
          <p>暂无待处理的上报</p>
        </div>

        <div v-else class="list-container">
          <div
            v-for="report in [...pendingReports, ...confirmedReports]"
            :key="report.id"
            class="list-item"
            @click="goToReportDetail(report.id)"
          >
            <div class="list-item-content">
              <div class="list-item-header">
                <span class="list-item-title">{{ report.reportCode }}</span>
                <StatusBadge 
                  :status="report.status" 
                  :clickable="true"
                  @click.stop="goToReportDetail(report.id)"
                />
              </div>
              <div class="list-item-meta">
                <span :class="['severity-tag', getSeverityClass(report.severity)]">
                  {{ getSeverityLabel(report.severity) }}
                </span>
                {{ report.barnNumber }} · {{ report.suspectedDisease }}
              </div>
              <div class="list-item-meta">
                上报人：{{ report.reporterName }} · {{ formatDate(report.createdAt) }}
              </div>
            </div>
            <div class="list-item-arrow">›</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.sidebar-header {
  padding: 0 24px 20px;
  border-bottom: 1px solid var(--color-border);
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
}

.sidebar-nav {
  padding: 16px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--color-bg);
}

.nav-item.active {
  background: var(--color-bg);
  color: var(--color-primary);
  font-weight: 600;
  border-left: 3px solid var(--color-primary);
  margin-left: -3px;
}

.page-header {
  margin-bottom: 32px;
}

.section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.stats-value.pending { color: var(--color-warning); }
.stats-value.confirmed { color: var(--color-info); }
.stats-value.isolating { color: #FF9800; }
.stats-value.resolved { color: var(--color-success); }

.list-item {
  display: flex;
  align-items: center;
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
  margin-top: 4px;
}

.list-item-arrow {
  font-size: 24px;
  color: var(--color-border);
}

.severity-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
}

.severity-low { background: #E8F5E9; color: #4CAF50; }
.severity-medium { background: #FFF3E0; color: #FF9800; }
.severity-high { background: #FFEBEE; color: #F44336; }
.severity-critical { background: #D32F2F; color: white; }
</style>
