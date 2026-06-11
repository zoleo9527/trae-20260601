<template>
  <div>
    <el-card shadow="never">
      <div class="filter-bar">
        <el-select v-model="filters.status" placeholder="状态筛选" clearable style="width: 140px">
          <el-option v-for="s in STATUS_LIST" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-select v-model="filters.urgency" placeholder="紧急程度" clearable style="width: 140px">
          <el-option v-for="u in URGENCY_LIST" :key="u.value" :label="u.label" :value="u.value" />
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
        <el-button type="primary" @click="fetchList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
      <el-table :data="repairs" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="repair_no" label="单号" width="150" />
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="location" label="位置" width="130" show-overflow-tooltip />
        <el-table-column label="紧急程度" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getUrgencyTag(row.urgency).type" size="small">
              {{ getUrgencyTag(row.urgency).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="场景标签" width="200" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.activity_occupation" type="warning" size="small" class="scene-tag">活动占道</el-tag>
            <el-tag v-if="row.tenant_timeout" type="danger" size="small" class="scene-tag">租户超时</el-tag>
            <el-tag v-if="row.complaint_ambiguous" size="small" class="scene-tag" color="#9B59B6" style="color:#fff;border:none">投诉归属不清</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small" :class="{ 'status-blink': row.status === 'in_progress' }">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SLA倒计时" width="120" align="center">
          <template #default="{ row }">
            <template v-if="computeSlaRemaining(row.sla_deadline)">
              <span :class="{ 'sla-overdue': computeSlaRemaining(row.sla_deadline).overdue, 'sla-warning': computeSlaRemaining(row.sla_deadline).warning }">
                {{ computeSlaRemaining(row.sla_deadline).text }}
              </span>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/operation/repairs/${row.id}`)">查看</el-button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { getStatusTag, getUrgencyTag, computeSlaRemaining, formatDateTime, STATUS_LIST, URGENCY_LIST } from '../../utils/constants'

const repairs = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filters = ref({ status: '', urgency: '', dateRange: null })

const fetchList = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.urgency) params.urgency = filters.value.urgency
    if (filters.value.dateRange?.length === 2) {
      params.start_date = filters.value.dateRange[0]
      params.end_date = filters.value.dateRange[1]
    }
    const res = await api.get('/repairs/', { params })
    repairs.value = res.items || res
    total.value = res.total || repairs.value.length
  } catch {
    repairs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = { status: '', urgency: '', dateRange: null }
  page.value = 1
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
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
.scene-tag {
  margin: 0 2px;
}
.sla-overdue {
  color: #f56c6c;
  font-weight: 700;
}
.sla-warning {
  color: #e6a23c;
  font-weight: 600;
}
.status-blink {
  animation: blink 1.2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
