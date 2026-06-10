<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useReportStore } from '@/stores/reportStore'
import { useIsolationStore } from '@/stores/isolationStore'

const router = useRouter()
const route = useRoute()
const reportStore = useReportStore()
const isolationStore = useIsolationStore()

const reportId = computed(() => route.params.id as string)
const report = computed(() => reportStore.getReportById(reportId.value))

const form = ref({
  isolatedChickenCount: 0,
  isolationStartDate: new Date().toISOString().slice(0, 10),
  isolationReason: '',
  handlingMeasures: ''
})

function handleSubmit() {
  if (!report.value) return
  if (!form.value.isolationReason.trim() || !form.value.handlingMeasures.trim()) {
    alert('请填写完整信息')
    return
  }

  isolationStore.createIsolation({
    reportId: report.value.id,
    reportCode: report.value.reportCode,
    barnNumber: report.value.barnNumber,
    isolatedChickenCount: form.value.isolatedChickenCount || report.value.chickenCount,
    isolationStartDate: form.value.isolationStartDate,
    isolationReason: form.value.isolationReason,
    handlingMeasures: form.value.handlingMeasures,
    handler: '王场长'
  })

  reportStore.loadReports()
  alert('隔离处理已启动')
  router.push({ name: 'report-detail', params: { id: report.value.id } })
}

function goBack() {
  router.push({ name: 'report-detail', params: { id: reportId.value } })
}

onMounted(() => {
  if (report.value) {
    form.value.isolatedChickenCount = report.value.chickenCount
    form.value.isolationReason = `对 ${report.value.barnNumber} 鸡舍进行隔离处理`
    form.value.handlingMeasures = `1. 立即将病鸡转移至隔离区\n2. 对原鸡舍进行全面消毒\n3. 加强通风换气\n4. 每日观察记录`
  }
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
          <span>←</span> 返回详情
        </div>
        <div class="nav-item" @click="router.push({ name: 'manager' })">
          <span>📊</span> 工作台
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div v-if="!report" class="empty-state">
        <p>未找到该上报记录</p>
        <button class="btn btn-primary" @click="goBack">返回</button>
      </div>

      <div v-else class="form-container">
        <div class="form-header">
          <h1 class="page-title">隔离处理</h1>
          <p class="page-subtitle">为上报 {{ report.reportCode }} 启动隔离处理</p>
        </div>

        <div class="detail-card">
          <h3 class="card-title">关联上报信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>上报编号</label>
              <span>{{ report.reportCode }}</span>
            </div>
            <div class="info-item">
              <label>鸡舍编号</label>
              <span>{{ report.barnNumber }}</span>
            </div>
            <div class="info-item">
              <label>疑似病症</label>
              <span>{{ report.suspectedDisease }}</span>
            </div>
            <div class="info-item">
              <label>鸡群数量</label>
              <span>{{ report.chickenCount }} 只</span>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <h3 class="card-title">隔离处理信息</h3>

          <div class="input-group">
            <label>隔离鸡群数量</label>
            <input
              type="number"
              v-model="form.isolatedChickenCount"
              placeholder="输入隔离的鸡群数量"
            />
          </div>

          <div class="input-group">
            <label>隔离开始日期</label>
            <input
              type="date"
              v-model="form.isolationStartDate"
            />
          </div>

          <div class="input-group">
            <label>隔离原因</label>
            <textarea
              v-model="form.isolationReason"
              rows="3"
              placeholder="描述隔离原因..."
            ></textarea>
          </div>

          <div class="input-group">
            <label>处理措施</label>
            <textarea
              v-model="form.handlingMeasures"
              rows="5"
              placeholder="描述将采取的处理措施..."
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="goBack">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">
            ✓ 确认启动隔离
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 700px;
}

.form-header {
  margin-bottom: 24px;
}

.detail-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
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

.info-item label {
  font-size: 12px;
  color: var(--color-text-light);
  text-transform: uppercase;
}

.info-item span {
  font-size: 14px;
  color: var(--color-text);
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 6px;
}

.input-group input,
.input-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: inherit;
}

.input-group input:focus,
.input-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
