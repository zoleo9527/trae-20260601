<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reportStore'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const reportStore = useReportStore()

const myReports = computed(() => reportStore.myReports)

function goToNewReport() {
  router.push({ name: 'report-new' })
}

function goToHistory() {
  router.push({ name: 'report-history' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="page-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">🥚 分拣员</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item active">
          <span>📊</span> 我的工作台
        </div>
        <div class="nav-item" @click="goToNewReport">
          <span>➕</span> 新增上报
        </div>
        <div class="nav-item" @click="goToHistory">
          <span>📋</span> 上报历史
        </div>
        <div class="nav-item" @click="router.push({ name: 'role-select' })">
          <span>🚪</span> 退出登录
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div class="page-header">
        <h1 class="page-title">我的工作台</h1>
        <p class="page-subtitle">查看我的疫病上报记录</p>
      </div>

      <div class="stats-grid">
        <div class="stats-card">
          <div class="stats-label">全部上报</div>
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
      </div>

      <div class="section">
        <div class="section-header">
          <h2>我的上报记录</h2>
          <button class="btn btn-primary" @click="goToNewReport">+ 新增上报</button>
        </div>

        <div v-if="myReports.length === 0" class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p>暂无上报记录</p>
          <button class="btn btn-primary" @click="goToNewReport">立即上报</button>
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
                <StatusBadge :status="report.status" />
              </div>
              <div class="list-item-meta">
                {{ report.barnNumber }} · {{ report.suspectedDisease }} · {{ formatDate(report.createdAt) }}
              </div>
              <div class="list-item-desc">{{ report.symptomDescription }}</div>
            </div>
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

.list-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.list-item-desc {
  font-size: 13px;
  color: var(--color-text-light);
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
}
</style>
