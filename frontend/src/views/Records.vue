<template>
  <div class="records">
    <div class="toolbar">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
      <el-select v-model="filterStatus" placeholder="状态筛选">
        <el-option label="全部" value="" />
        <el-option label="待处理" value="pending" />
        <el-option label="维修中" value="processing" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-input v-model="searchKeyword" placeholder="搜索客户或工单号" style="width: 200px" />
      <el-button @click="exportData" type="success">导出数据</el-button>
    </div>

    <el-table :data="records" border>
      <el-table-column prop="order_no" label="工单号" />
      <el-table-column prop="customer_name" label="客户" />
      <el-table-column prop="phone" label="联系电话" />
      <el-table-column prop="device_model" label="机型" />
      <el-table-column prop="problem_description" label="问题描述" :show-overflow-tooltip="true" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" />
      <el-table-column prop="created_by" label="创建人" />
      <el-table-column prop="assigned_to" label="维修师" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button @click="viewDetail(scope.row.id)" type="text">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="stats-summary">
      <el-card class="summary-card">
        <div class="summary-title">统计摘要</div>
        <div class="summary-row">
          <span class="summary-label">总工单数:</span>
          <span class="summary-value">{{ summary.total }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">已完成:</span>
          <span class="summary-value completed">{{ summary.completed }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">维修中:</span>
          <span class="summary-value processing">{{ summary.processing }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">待处理:</span>
          <span class="summary-value pending">{{ summary.pending }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">完成率:</span>
          <span class="summary-value">{{ summary.rate }}%</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { records as recordsApi } from '../api'

const router = useRouter()

const records = ref([])
const dateRange = ref([])
const filterStatus = ref('')
const searchKeyword = ref('')

const getStatusTagType = (status) => {
  const types = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '维修中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const summary = computed(() => {
  const total = records.value.length
  const completed = records.value.filter(r => r.status === 'completed').length
  const processing = records.value.filter(r => r.status === 'processing').length
  const pending = records.value.filter(r => r.status === 'pending').length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return { total, completed, processing, pending, rate }
})

const loadRecords = async () => {
  const params = {}
  if (dateRange.value[0]) {
    params.date_from = dateRange.value[0].toISOString().split('T')[0]
  }
  if (dateRange.value[1]) {
    params.date_to = dateRange.value[1].toISOString().split('T')[0]
  }
  if (filterStatus.value) {
    params.status = filterStatus.value
  }
  
  const res = await recordsApi.getAllRecords(params)
  records.value = res.data
  
  if (searchKeyword.value) {
    records.value = records.value.filter(r => 
      r.customer_name.includes(searchKeyword.value) ||
      r.order_no.includes(searchKeyword.value)
    )
  }
}

const viewDetail = (id) => {
  router.push(`/order/${id}`)
}

const exportData = async () => {
  const today = new Date().toISOString().split('T')[0]
  const res = await recordsApi.exportRecords(today)
  
  const dataStr = JSON.stringify(res.data, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `repair_records_${today}.json`
  a.click()
  URL.revokeObjectURL(url)
}

watch([dateRange, filterStatus, searchKeyword], () => {
  loadRecords()
})

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.records {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.stats-summary {
  margin-top: 20px;
}

.summary-card {
  max-width: 300px;
}

.summary-title {
  font-weight: bold;
  margin-bottom: 15px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.summary-label {
  color: #666;
}

.summary-value {
  font-weight: bold;
}

.summary-value.completed {
  color: #67c23a;
}

.summary-value.processing {
  color: #409eff;
}

.summary-value.pending {
  color: #e6a23c;
}
</style>
