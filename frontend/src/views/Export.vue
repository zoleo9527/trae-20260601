<script setup>
import { ref } from 'vue'
import api from '../api'

const exportType = ref('appointments')
const filters = ref({ status: '', date: '', vaccineName: '', alertOnly: '' })
const creating = ref(false)
const createError = ref('')
const tasks = ref([])
const loadingTasks = ref(false)

async function createExport() {
  creating.value = true
  createError.value = ''
  try {
    const filterPayload = {}
    if (filters.value.status) filterPayload.status = filters.value.status
    if (filters.value.date) filterPayload.date = filters.value.date
    if (filters.value.vaccineName) filterPayload.vaccineName = filters.value.vaccineName
    if (filters.value.alertOnly) filterPayload.alertOnly = filters.value.alertOnly

    const res = await api.createExport(exportType.value, filterPayload)
    const task = { id: res.data.taskId, status: 'processing', type: exportType.value }
    tasks.value.unshift(task)
    pollTask(task)
  } catch (e) {
    createError.value = e?.error?.message || '创建失败'
  } finally {
    creating.value = false
  }
}

async function pollTask(task) {
  const interval = setInterval(async () => {
    try {
      const res = await api.getExport(task.id)
      task.status = res.data.status
      task.csvContent = res.data.csvContent
      task.completedAt = res.data.completedAt
      if (task.status === 'completed') {
        clearInterval(interval)
      }
    } catch {
      clearInterval(interval)
    }
  }, 1000)
}

function downloadCsv(task) {
  if (!task.csvContent) return
  const blob = new Blob(['\uFEFF' + task.csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${task.type}_${task.id}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}

const typeLabels = { appointments: '疫苗预约', observations: '留观记录' }
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h3>数据导出</h3>
    </div>

    <div class="export-form">
      <h4>新建导出任务</h4>
      <div class="form-row">
        <div class="form-item">
          <label>导出类型</label>
          <select v-model="exportType">
            <option value="appointments">疫苗预约</option>
            <option value="observations">留观记录</option>
          </select>
        </div>
        <div class="form-item">
          <label>状态筛选</label>
          <input v-model="filters.status" placeholder="如 completed, observing" />
        </div>
        <div v-if="exportType === 'appointments'" class="form-item">
          <label>日期筛选</label>
          <input v-model="filters.date" type="date" />
        </div>
        <div v-if="exportType === 'appointments'" class="form-item">
          <label>疫苗名称</label>
          <input v-model="filters.vaccineName" placeholder="模糊搜索" />
        </div>
        <div v-if="exportType === 'observations'" class="form-item">
          <label>仅告警</label>
          <select v-model="filters.alertOnly">
            <option value="">否</option>
            <option value="true">是</option>
          </select>
        </div>
      </div>
      <div v-if="createError" class="error">{{ createError }}</div>
      <button class="btn btn-primary" @click="createExport" :disabled="creating">
        {{ creating ? '创建中...' : '创建导出任务' }}
      </button>
    </div>

    <div class="task-section">
      <h4>导出任务列表</h4>
      <div v-if="!tasks.length" class="empty">暂无导出任务</div>
      <div v-else class="task-list">
        <div v-for="t in tasks" :key="t.id" class="task-card">
          <div class="task-head">
            <span class="task-id">{{ t.id }}</span>
            <span class="task-type">{{ typeLabels[t.type] }}</span>
            <span class="task-status" :class="t.status">
              {{ t.status === 'processing' ? '处理中...' : '已完成' }}
            </span>
          </div>
          <div class="task-actions">
            <button
              v-if="t.status === 'completed'"
              class="btn btn-success"
              @click="downloadCsv(t)"
            >
              下载 CSV
            </button>
            <span v-else class="processing-text">⏳ 正在生成...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 900px; }
.page-header { margin-bottom: 16px; }
.page-header h3 { margin: 0; font-size: 18px; color: #303133; }

.export-form {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.export-form h4 { margin: 0 0 16px; font-size: 15px; }

.form-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.form-item { display: flex; flex-direction: column; gap: 4px; }
.form-item label { font-size: 12px; color: #909399; }
.form-item input, .form-item select {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.error { color: #f56c6c; font-size: 13px; margin-bottom: 8px; }

.btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-primary { background: #409eff; color: #fff; }
.btn-primary:hover { background: #66b1ff; }
.btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }
.btn-success { background: #67c23a; color: #fff; }
.btn-success:hover { background: #85ce61; }

.task-section h4 { margin: 0 0 12px; font-size: 15px; }

.empty { color: #c0c4cc; font-size: 14px; text-align: center; padding: 20px; }

.task-list { display: flex; flex-direction: column; gap: 10px; }

.task-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.task-head { display: flex; align-items: center; gap: 10px; }

.task-id { font-weight: 600; color: #303133; font-size: 13px; }
.task-type { font-size: 13px; color: #606266; }

.task-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.task-status.processing { background: #ecf5ff; color: #409eff; }
.task-status.completed { background: #f0f9eb; color: #67c23a; }

.processing-text { color: #409eff; font-size: 13px; }
</style>
