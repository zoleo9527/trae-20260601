<template>
  <div>
    <div class="stats-row">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-number">{{ stats.total }}</div>
        <div class="stat-label">完工数</div>
      </el-card>
      <el-card shadow="hover" class="stat-card stat-avg">
        <div class="stat-number">{{ stats.avgHours }}</div>
        <div class="stat-label">平均工时（小时）</div>
      </el-card>
    </div>

    <el-card shadow="never" style="margin-top: 20px">
      <template #header><span class="card-title">派单回看</span></template>
      <div class="filter-bar">
        <el-select v-model="filters.work_type" placeholder="工种筛选" clearable style="width: 140px">
          <el-option v-for="w in WORK_TYPE_LIST" :key="w.value" :label="w.label" :value="w.value" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-input v-model="filters.engineer" placeholder="施工人" clearable style="width: 140px" />
        <el-button type="primary" @click="fetchList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
      <el-table :data="dispatches" stripe border v-loading="loading">
        <el-table-column prop="dispatch_no" label="派单号" width="150" />
        <el-table-column label="报修单号" width="150">
          <template #default="{ row }">{{ row.repair_no || row.repair?.repair_no || '-' }}</template>
        </el-table-column>
        <el-table-column label="工作内容" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.work_content || row.repair?.title || '-' }}</template>
        </el-table-column>
        <el-table-column label="工种" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ WORK_TYPE_MAP[row.work_type] || row.work_type || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">{{ getStatusTag(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="engineer_name" label="施工人" width="100" />
        <el-table-column label="完工说明" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.completion_note || '-' }}</template>
        </el-table-column>
        <el-table-column label="完工时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.completed_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/engineering/dispatches/${row.id}`)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <template #header><span class="card-title">工种分布</span></template>
      <div class="distribution-row">
        <div v-for="(item, key) in workTypeDistribution" :key="key" class="distribution-item">
          <el-progress :percentage="item.percentage" :color="item.color" :stroke-width="20" :text-inside="true" style="width: 200px">
            <span>{{ item.label }} {{ item.count }}</span>
          </el-progress>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api'
import { getStatusTag, formatDateTime, WORK_TYPE_LIST, WORK_TYPE_MAP } from '../../utils/constants'

const dispatches = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filters = ref({ work_type: '', dateRange: null, engineer: '' })

const COLORS = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6']

const stats = computed(() => {
  const completed = dispatches.value.filter(d => ['completed', 'verified', 'closed'].includes(d.status))
  const totalHours = completed.reduce((sum, d) => sum + (d.actual_hours || 0), 0)
  const avgHours = completed.length ? (totalHours / completed.length).toFixed(1) : '0'
  return { total: dispatches.value.length, avgHours }
})

const workTypeDistribution = computed(() => {
  const counts = {}
  dispatches.value.forEach(d => {
    const wt = d.work_type || 'general'
    counts[wt] = (counts[wt] || 0) + 1
  })
  const totalC = dispatches.value.length || 1
  let idx = 0
  return Object.entries(counts).map(([key, count]) => ({
    key,
    label: WORK_TYPE_MAP[key] || key,
    count,
    percentage: Math.round((count / totalC) * 100),
    color: COLORS[idx++ % COLORS.length],
  }))
})

const fetchList = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.value.work_type) params.work_type = filters.value.work_type
    if (filters.value.engineer) params.engineer = filters.value.engineer
    if (filters.value.dateRange?.length === 2) {
      params.start_date = filters.value.dateRange[0]
      params.end_date = filters.value.dateRange[1]
    }
    const res = await api.get('/dispatches/history/', { params })
    dispatches.value = res.items || res
    total.value = res.total || dispatches.value.length
  } catch {
    dispatches.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = { work_type: '', dateRange: null, engineer: '' }
  page.value = 1
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.stats-row {
  display: flex;
  gap: 16px;
}
.stat-card {
  flex: 1;
  text-align: center;
  padding: 10px 0;
}
.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: #409EFF;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
.stat-avg .stat-number {
  color: #67C23A;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.distribution-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.distribution-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
