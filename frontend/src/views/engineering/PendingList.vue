<template>
  <div>
    <el-card shadow="never">
      <div class="filter-bar">
        <el-select v-model="workTypeFilter" placeholder="工种筛选" clearable style="width: 140px">
          <el-option v-for="w in WORK_TYPE_LIST" :key="w.value" :label="w.label" :value="w.value" />
        </el-select>
        <el-button type="primary" @click="fetchList">查询</el-button>
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
        <el-table-column label="紧急程度" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getUrgencyTag(row.urgency || row.repair?.urgency).type" size="small">
              {{ getUrgencyTag(row.urgency || row.repair?.urgency).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SLA倒计时" width="120" align="center">
          <template #default="{ row }">
            <template v-if="computeSlaRemaining(row.sla_deadline || row.repair?.sla_deadline)">
              <span :class="{ 'sla-overdue': computeSlaRemaining(row.sla_deadline || row.repair?.sla_deadline).overdue, 'sla-warning': computeSlaRemaining(row.sla_deadline || row.repair?.sla_deadline).warning }">
                {{ computeSlaRemaining(row.sla_deadline || row.repair?.sla_deadline).text }}
              </span>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/engineering/dispatches/${row.id}`)">查看</el-button>
            <el-button v-if="row.status === 'pending'" type="success" link size="small" @click="handleAccept(row)">接单</el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../api'
import { getUrgencyTag, computeSlaRemaining, WORK_TYPE_LIST, WORK_TYPE_MAP } from '../../utils/constants'

const dispatches = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const workTypeFilter = ref('')

const fetchList = async () => {
  loading.value = true
  try {
    const params = { status: 'pending', page: page.value, page_size: pageSize.value }
    if (workTypeFilter.value) params.work_type = workTypeFilter.value
    const res = await api.get('/dispatches/', { params })
    dispatches.value = res.items || res
    total.value = res.total || dispatches.value.length
  } catch {
    dispatches.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleAccept = async (row) => {
  try {
    await ElMessageBox.confirm('确认接单？', '接单确认', { type: 'info' })
    await api.post(`/dispatches/${row.id}/accept`)
    ElMessage.success('接单成功')
    fetchList()
  } catch {
  }
}

onMounted(fetchList)
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
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
