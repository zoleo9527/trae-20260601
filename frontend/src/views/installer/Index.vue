<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElCard, ElButton, ElTable, ElTableColumn, ElTag, ElBadge, ElMessage, ElEmpty, ElStatistic, ElRow, ElCol } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const orders = ref<any[]>([])
const loading = ref(true)

const statusMap: Record<string, { label: string; type: 'info' | 'warning' | 'primary' | 'success' | 'danger' }> = {
  'PENDING': { label: '待分配', type: 'info' },
  'ASSIGNED': { label: '已分配', type: 'warning' },
  'IN_PROGRESS': { label: '安装中', type: 'primary' },
  'COMPLETED': { label: '已完成', type: 'success' },
  'REWORK_REQUESTED': { label: '待返工', type: 'danger' },
  'REWORK_IN_PROGRESS': { label: '返工中', type: 'danger' },
  'REWORK_COMPLETED': { label: '返工完成', type: 'warning' }
}

const pendingTasks = computed(() => {
  return orders.value.filter(o => o.status === 'ASSIGNED')
})

const inProgressTasks = computed(() => {
  return orders.value.filter(o => o.status === 'IN_PROGRESS')
})

const reworkTasks = computed(() => {
  return orders.value.filter(o => o.status === 'REWORK_REQUESTED' || o.status === 'REWORK_IN_PROGRESS')
})

const completedTasks = computed(() => {
  return orders.value.filter(o => o.status === 'COMPLETED' || o.status === 'REWORK_COMPLETED')
})

const loadOrders = async () => {
  loading.value = true
  try {
    const response = await api.get<any[]>('/orders')
    orders.value = response.filter((o: any) => o.installer_id === userStore.user?.id)
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const handleStartTask = async (order: any) => {
  try {
    await api.put(`/orders/${order.id}/status`, { status: 'IN_PROGRESS' })
    ElMessage.success('已开始安装')
    loadOrders()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleViewDetail = (order: any) => {
  router.push(`/installer/task/${order.id}`)
}

const handleViewRework = (order: any) => {
  router.push(`/installer/rework/${order.id}`)
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="installer-page">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="待处理任务" :value="pendingTasks.length">
            <template #suffix>
              <span class="stat-suffix">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="进行中任务" :value="inProgressTasks.length">
            <template #suffix>
              <span class="stat-suffix">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="返工任务" :value="reworkTasks.length">
            <template #suffix>
              <span class="stat-suffix">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="已完成任务" :value="completedTasks.length">
            <template #suffix>
              <span class="stat-suffix">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="task-card">
      <template #header>
        <div class="card-header">
          <span>待办任务</span>
          <el-badge :value="pendingTasks.length + inProgressTasks.length" class="task-badge" />
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <p>加载中...</p>
      </div>

      <el-empty v-else-if="pendingTasks.length === 0 && inProgressTasks.length === 0" description="暂无待办任务" />

      <div v-else>
        <div v-if="pendingTasks.length > 0" class="task-section">
          <h4 class="section-title">待开始任务</h4>
          <el-table :data="pendingTasks" style="width: 100%">
            <el-table-column prop="id" label="订单ID" width="80" />
            <el-table-column prop="customer_name" label="客户姓名" width="100" />
            <el-table-column prop="customer_phone" label="客户电话" width="120" />
            <el-table-column prop="product_type" label="产品类型" width="100" />
            <el-table-column prop="address" label="地址" />
            <el-table-column prop="scheduled_time" label="预约时间" width="160">
              <template #default="{ row }">
                {{ new Date(row.scheduled_time).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleStartTask(row)">
                  开始安装
                </el-button>
                <el-button size="small" @click="handleViewDetail(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="inProgressTasks.length > 0" class="task-section">
          <h4 class="section-title">进行中任务</h4>
          <el-table :data="inProgressTasks" style="width: 100%">
            <el-table-column prop="id" label="订单ID" width="80" />
            <el-table-column prop="customer_name" label="客户姓名" width="100" />
            <el-table-column prop="customer_phone" label="客户电话" width="120" />
            <el-table-column prop="product_type" label="产品类型" width="100" />
            <el-table-column prop="address" label="地址" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusMap[row.status]?.type">
                  {{ statusMap[row.status]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleViewDetail(row)">
                  继续安装
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <el-card v-if="reworkTasks.length > 0" class="task-card rework-card">
      <template #header>
        <div class="card-header">
          <span class="rework-title">返工任务</span>
          <el-badge :value="reworkTasks.length" type="danger" />
        </div>
      </template>

      <el-table :data="reworkTasks" style="width: 100%">
        <el-table-column prop="id" label="订单ID" width="80" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="customer_phone" label="客户电话" width="120" />
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type">
              {{ statusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="handleViewRework(row)">
              处理返工
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.installer-page {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-suffix {
  font-size: 14px;
  color: #666;
}

.task-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-badge {
  margin-left: 10px;
}

.loading-container {
  text-align: center;
  padding: 40px;
  color: #999;
}

.task-section {
  margin-bottom: 20px;
}

.task-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #333;
  font-size: 14px;
}

.rework-card {
  border: 1px solid #f5222d;
}

.rework-title {
  color: #f5222d;
}
</style>