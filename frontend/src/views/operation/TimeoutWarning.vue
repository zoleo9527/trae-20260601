<template>
  <div>
    <div class="stats-row">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-number">{{ stats.total }}</div>
        <div class="stat-label">总报修数</div>
      </el-card>
      <el-card shadow="hover" class="stat-card stat-overdue">
        <div class="stat-number">{{ stats.overdue }}</div>
        <div class="stat-label">已超时</div>
      </el-card>
      <el-card shadow="hover" class="stat-card stat-warning">
        <div class="stat-number">{{ stats.approaching }}</div>
        <div class="stat-label">即将超时（4小时内）</div>
      </el-card>
      <el-card shadow="hover" class="stat-card stat-normal">
        <div class="stat-number">{{ stats.normal }}</div>
        <div class="stat-label">正常处理中</div>
      </el-card>
    </div>

    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <span class="card-title">超时与预警列表</span>
      </template>
      <el-table :data="repairs" stripe border v-loading="loading">
        <el-table-column prop="repair_no" label="单号" width="150" />
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="location" label="位置" width="130" show-overflow-tooltip />
        <el-table-column label="紧急程度" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getUrgencyTag(row.urgency).type" size="small">{{ getUrgencyTag(row.urgency).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">{{ getStatusTag(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SLA倒计时" width="140" align="center">
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../api'
import { getStatusTag, getUrgencyTag, computeSlaRemaining, formatDateTime } from '../../utils/constants'

const repairs = ref([])
const loading = ref(false)

const stats = computed(() => {
  let overdue = 0
  let approaching = 0
  let normal = 0
  repairs.value.forEach(r => {
    const sla = computeSlaRemaining(r.sla_deadline)
    if (!sla) { normal++; return }
    if (sla.overdue) overdue++
    else if (sla.warning) approaching++
    else normal++
  })
  return { total: repairs.value.length, overdue, approaching, normal }
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await api.get('/repairs/', { params: { page_size: 200 } })
    repairs.value = (res.items || res).filter(r => {
      const closed = ['closed', 'verified'].includes(r.status)
      if (closed) return false
      const sla = computeSlaRemaining(r.sla_deadline)
      return !sla || sla.overdue || sla.warning
    })
  } catch {
    repairs.value = []
  } finally {
    loading.value = false
  }
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
.stat-overdue .stat-number {
  color: #f56c6c;
}
.stat-warning .stat-number {
  color: #e6a23c;
}
.stat-normal .stat-number {
  color: #67c23a;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
}
.sla-overdue {
  color: #f56c6c;
  font-weight: 700;
}
.sla-warning {
  color: #e6a23c;
  font-weight: 600;
}
</style>
