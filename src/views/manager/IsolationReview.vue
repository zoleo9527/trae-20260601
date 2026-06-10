<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useIsolationStore } from '@/stores/isolationStore'
import { useReportStore } from '@/stores/reportStore'

const router = useRouter()
const isolationStore = useIsolationStore()
const reportStore = useReportStore()

const selectedIsolation = ref<string | null>(null)

const activeIsolations = computed(() => isolationStore.activeIsolations)
const releasedIsolations = computed(() => isolationStore.releasedIsolations)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function handleRelease(id: string) {
  if (confirm('确认解除该隔离？')) {
    isolationStore.releaseIsolation(id)
    reportStore.loadReports()
    alert('隔离已解除')
  }
}

function goBack() {
  router.push({ name: 'manager' })
}

onMounted(() => {
  isolationStore.loadIsolations()
  reportStore.loadReports()
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
        <div class="nav-item active">
          <span>🔒</span> 隔离回看
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div class="page-header">
        <h1 class="page-title">隔离处理回看</h1>
        <p class="page-subtitle">查看历史隔离记录及当前隔离状态</p>
      </div>

      <div class="section">
        <h2 class="section-title">当前隔离中 ({{ activeIsolations.length }})</h2>

        <div v-if="activeIsolations.length === 0" class="empty-state">
          <div class="empty-state-icon">✅</div>
          <p>暂无正在隔离的记录</p>
        </div>

        <div v-else class="list-container">
          <div
            v-for="iso in activeIsolations"
            :key="iso.id"
            class="isolation-card active"
            @click="selectedIsolation = selectedIsolation === iso.id ? null : iso.id"
          >
            <div class="isolation-header">
              <span class="isolation-code">{{ iso.isolationCode }}</span>
              <span class="badge badge-isolating">隔离中</span>
            </div>
            <div class="isolation-info">
              <span>鸡舍：{{ iso.barnNumber }}</span>
              <span>数量：{{ iso.isolatedChickenCount }} 只</span>
            </div>
            <div class="isolation-info">
              <span>开始日期：{{ formatDate(iso.isolationStartDate) }}</span>
              <span>处理人：{{ iso.handler }}</span>
            </div>

            <div v-if="selectedIsolation === iso.id" class="isolation-detail">
              <div class="detail-section">
                <label>隔离原因</label>
                <p>{{ iso.isolationReason }}</p>
              </div>
              <div class="detail-section">
                <label>处理措施</label>
                <p class="pre-text">{{ iso.handlingMeasures }}</p>
              </div>
              <button class="btn btn-primary" @click.stop="handleRelease(iso.id)">
                ✓ 解除隔离
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">已解除隔离 ({{ releasedIsolations.length }})</h2>

        <div v-if="releasedIsolations.length === 0" class="empty-state">
          <p class="text-muted">暂无历史隔离记录</p>
        </div>

        <div v-else class="list-container">
          <div
            v-for="iso in releasedIsolations"
            :key="iso.id"
            class="isolation-card released"
            @click="selectedIsolation = selectedIsolation === iso.id ? null : iso.id"
          >
            <div class="isolation-header">
              <span class="isolation-code">{{ iso.isolationCode }}</span>
              <span class="badge badge-resolved">已解除</span>
            </div>
            <div class="isolation-info">
              <span>鸡舍：{{ iso.barnNumber }}</span>
              <span>数量：{{ iso.isolatedChickenCount }} 只</span>
            </div>
            <div class="isolation-info">
              <span>开始：{{ formatDate(iso.isolationStartDate) }}</span>
              <span>解除：{{ formatDate(iso.isolationEndDate || '') }}</span>
            </div>

            <div v-if="selectedIsolation === iso.id" class="isolation-detail">
              <div class="detail-section">
                <label>隔离原因</label>
                <p>{{ iso.isolationReason }}</p>
              </div>
              <div class="detail-section">
                <label>处理措施</label>
                <p class="pre-text">{{ iso.handlingMeasures }}</p>
              </div>
              <div class="detail-section">
                <label>关联上报</label>
                <p>{{ iso.reportCode }}</p>
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

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text);
}

.isolation-card {
  background: white;
  border-radius: var(--radius-md);
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid var(--color-border);
}

.isolation-card:hover {
  box-shadow: var(--shadow-md);
}

.isolation-card.active {
  border-left-color: #FF9800;
}

.isolation-card.released {
  border-left-color: var(--color-success);
}

.isolation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.isolation-code {
  font-weight: 600;
  color: var(--color-text);
}

.isolation-info {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 4px;
}

.isolation-detail {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.detail-section {
  margin-bottom: 12px;
}

.detail-section label {
  display: block;
  font-size: 12px;
  color: var(--color-text-light);
  margin-bottom: 4px;
}

.detail-section p {
  margin: 0;
  font-size: 14px;
}

.pre-text {
  white-space: pre-wrap;
}

.text-muted {
  color: var(--color-text-light);
}

.empty-state {
  text-align: center;
  padding: 32px;
  background: white;
  border-radius: var(--radius-md);
}

.empty-state-icon {
  font-size: 36px;
  margin-bottom: 8px;
  opacity: 0.5;
}
</style>
