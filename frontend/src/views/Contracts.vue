<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const contracts = ref([])
const loading = ref(true)
const error = ref('')
const filters = ref({ status: '', residentName: '' })

const statusLabels = { active: '有效', expired: '已过期' }
const statusColors = { active: '#67c23a', expired: '#f56c6c' }

async function loadContracts() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (filters.value.status) params.set('status', filters.value.status)
    if (filters.value.residentName) params.set('residentName', filters.value.residentName)
    const qs = params.toString()
    const res = await api.getContracts(qs ? `?${qs}` : '')
    contracts.value = res.data
  } catch (e) {
    error.value = e?.error?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadContracts)

function resetFilters() {
  filters.value = { status: '', residentName: '' }
  loadContracts()
}

const expandedId = ref(null)
function toggleDetail(id) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h3>签约管理</h3>
    </div>

    <div class="filter-bar">
      <select v-model="filters.status" @change="loadContracts">
        <option value="">全部状态</option>
        <option value="active">有效</option>
        <option value="expired">已过期</option>
      </select>
      <input v-model="filters.residentName" placeholder="居民姓名" @keyup.enter="loadContracts" />
      <button class="btn btn-primary" @click="loadContracts">查询</button>
      <button class="btn btn-default" @click="resetFilters">重置</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>签约编号</th>
              <th>居民姓名</th>
              <th>身份证号</th>
              <th>签约医生</th>
              <th>签约日期</th>
              <th>签约类型</th>
              <th>服务包</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contracts" :key="c.id">
              <td>{{ c.id }}</td>
              <td>{{ c.residentName }}</td>
              <td class="mono">{{ c.residentIdCard }}</td>
              <td>{{ c.doctorName }}</td>
              <td>{{ c.contractDate }}</td>
              <td>{{ c.contractType }}</td>
              <td>{{ c.packageName }}</td>
              <td>
                <span class="status-tag" :style="{ background: statusColors[c.status] + '1a', color: statusColors[c.status] }">
                  {{ statusLabels[c.status] }}
                </span>
              </td>
              <td>
                <button class="btn-link" @click="toggleDetail(c.id)">
                  {{ expandedId === c.id ? '收起' : '详情' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="expandedId" class="detail-panel">
        <template v-for="c in contracts" :key="c.id">
          <div v-if="expandedId === c.id" class="detail-content">
            <h4>签约详情 - {{ c.id }}</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">居民姓名</span><span>{{ c.residentName }}</span></div>
              <div class="detail-item"><span class="label">身份证号</span><span class="mono">{{ c.residentIdCard }}</span></div>
              <div class="detail-item"><span class="label">签约医生</span><span>{{ c.doctorName }}</span></div>
              <div class="detail-item"><span class="label">签约日期</span><span>{{ c.contractDate }}</span></div>
              <div class="detail-item"><span class="label">签约类型</span><span>{{ c.contractType }}</span></div>
              <div class="detail-item"><span class="label">服务包</span><span>{{ c.packageName }}</span></div>
              <div class="detail-item"><span class="label">状态</span><span>{{ statusLabels[c.status] }}</span></div>
            </div>
          </div>
        </template>
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

.mono { font-family: monospace; font-size: 12px; }

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

.detail-content h4 {
  margin: 0 0 16px;
  font-size: 15px;
  color: #303133;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
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
</style>
