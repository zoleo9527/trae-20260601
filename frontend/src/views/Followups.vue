<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const followups = ref([])
const loading = ref(true)
const error = ref('')
const filters = ref({ status: '', contractId: '' })

const statusLabels = { completed: '已完成', pending: '待执行' }
const statusColors = { completed: '#67c23a', pending: '#e6a23c' }

async function loadFollowups() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (filters.value.status) params.set('status', filters.value.status)
    if (filters.value.contractId) params.set('contractId', filters.value.contractId)
    const qs = params.toString()
    const res = await api.getFollowups(qs ? `?${qs}` : '')
    followups.value = res.data
  } catch (e) {
    error.value = e?.error?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadFollowups)

function resetFilters() {
  filters.value = { status: '', contractId: '' }
  loadFollowups()
}

const expandedId = ref(null)
function toggleDetail(id) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h3>随访记录</h3>
    </div>

    <div class="filter-bar">
      <select v-model="filters.status" @change="loadFollowups">
        <option value="">全部状态</option>
        <option value="completed">已完成</option>
        <option value="pending">待执行</option>
      </select>
      <input v-model="filters.contractId" placeholder="签约编号" @keyup.enter="loadFollowups" />
      <button class="btn btn-primary" @click="loadFollowups">查询</button>
      <button class="btn btn-default" @click="resetFilters">重置</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>编号</th>
              <th>签约编号</th>
              <th>居民姓名</th>
              <th>随访医生</th>
              <th>随访日期</th>
              <th>随访类型</th>
              <th>下次随访</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in followups" :key="f.id">
              <td>{{ f.id }}</td>
              <td>{{ f.contractId }}</td>
              <td>{{ f.residentName }}</td>
              <td>{{ f.doctorName }}</td>
              <td>{{ f.followupDate }}</td>
              <td>{{ f.followupType }}</td>
              <td>{{ f.nextFollowupDate }}</td>
              <td>
                <span class="status-tag" :style="{ background: statusColors[f.status] + '1a', color: statusColors[f.status] }">
                  {{ statusLabels[f.status] }}
                </span>
              </td>
              <td>
                <button class="btn-link" @click="toggleDetail(f.id)">
                  {{ expandedId === f.id ? '收起' : '详情' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-for="f in followups" :key="'d-'+f.id">
        <div v-if="expandedId === f.id" class="detail-panel">
          <h4>随访详情 - {{ f.id }}</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">居民姓名</span><span>{{ f.residentName }}</span></div>
            <div class="detail-item"><span class="label">签约编号</span><span>{{ f.contractId }}</span></div>
            <div class="detail-item"><span class="label">随访医生</span><span>{{ f.doctorName }}</span></div>
            <div class="detail-item"><span class="label">随访日期</span><span>{{ f.followupDate }}</span></div>
            <div class="detail-item"><span class="label">随访类型</span><span>{{ f.followupType }}</span></div>
            <div class="detail-item"><span class="label">下次随访</span><span>{{ f.nextFollowupDate }}</span></div>
          </div>
          <div class="detail-content-box">
            <span class="label">随访内容</span>
            <p>{{ f.content }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 1100px; }
.page-header { margin-bottom: 16px; }
.page-header h3 { margin: 0; font-size: 18px; color: #303133; }

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-bar select,
.filter-bar input {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.filter-bar input { width: 160px; }

.btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-primary { background: #409eff; color: #fff; }
.btn-primary:hover { background: #66b1ff; }
.btn-default { background: #fff; border: 1px solid #dcdfe6; color: #606266; }
.btn-default:hover { color: #409eff; border-color: #409eff; }

.loading, .error { text-align: center; padding: 40px; color: #909399; }
.error { color: #f56c6c; }

.table-wrap {
  background: #fff;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  background: #f5f7fa;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #606266;
  white-space: nowrap;
}

td {
  padding: 10px 12px;
  border-top: 1px solid #ebeef5;
  color: #303133;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.btn-link {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  font-size: 13px;
}

.btn-link:hover { text-decoration: underline; }

.detail-panel {
  margin-top: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.detail-panel h4 {
  margin: 0 0 16px;
  font-size: 15px;
  color: #303133;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .label {
  font-size: 12px;
  color: #909399;
}

.detail-item span:last-child {
  font-size: 14px;
  color: #303133;
}

.detail-content-box {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
}

.detail-content-box .label {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-bottom: 4px;
}

.detail-content-box p {
  margin: 0;
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}
</style>
