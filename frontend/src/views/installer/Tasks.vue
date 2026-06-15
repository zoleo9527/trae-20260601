<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElCard, ElButton, ElTable, ElTableColumn, ElTag, ElTabs, ElTabPane, ElMessage, ElEmpty, ElDatePicker, ElInput } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const orders = ref<any[]>([])
const loading = ref(true)
const activeTab = ref('assigned')
const searchKeyword = ref('')
const dateRange = ref<[Date, Date] | null>(null)

const statusMap: Record<string, { label: string; type: 'info' | 'warning' | 'primary' | 'success' | 'danger' }> = {
  'PENDING': { label: '待分配', type: 'info' },
  'ASSIGNED': { label: '已分配', type: 'warning' },
  'IN_PROGRESS': { label: '安装中', type: 'primary' },
  'COMPLETED': { label: '已完成', type: 'success' },
  'REWORK_REQUESTED': { label: '待返工', type: 'danger' },
  'REWORK_IN_PROGRESS': { label: '返工中', type: 'danger' },
  'REWORK_COMPLETED': { label: '返工完成', type: 'warning' }
}

const assignedOrders = computed(() => {
  return orders.value.filter(o => o.status === 'ASSIGNED')
})

const inProgressOrders = computed(() => {
  return orders.value.filter(o => o.status === 'IN_PROGRESS')
})

const completedOrders = computed(() => {
  return orders.value.filter(o => o.status === 'COMPLETED' || o.status === 'REWORK_COMPLETED')
})

const reworkOrders = computed(() => {
  return orders.value.filter(o => o.status === 'REWORK_REQUESTED' || o.status === 'REWORK_IN_PROGRESS')
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

const filterByDate = (orders: any[]) => {
  if (!dateRange.value) return orders
  const [start, end] = dateRange.value
  return orders.filter(o => {
    const orderDate = new Date(o.scheduled_time)
    return orderDate >= start && orderDate <= end
  })
}

const filterByKeyword = (orders: any[]) => {
  if (!searchKeyword.value) return orders
  const keyword = searchKeyword.value.toLowerCase()
  return orders.filter(o => 
    o.customer_name?.toLowerCase().includes(keyword) ||
    o.customer_phone?.includes(keyword) ||
    o.address?.toLowerCase().includes(keyword)
  )
}

const applyFilters = (orders: any[]) => {
  return filterByKeyword(filterByDate(orders))
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="tasks-page">
    <el-card class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索客户姓名、电话或地址"
          style="width: 300px"
          clearable
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable
        />
      </div>
    </el-card>

    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="待处理" name="assigned">
          <div class="tab-header">
            <span>已分配任务 ({{ applyFilters(assignedOrders).length }})</span>
          </div>
          <el-empty v-if="applyFilters(assignedOrders).length === 0" description="暂无待处理任务" />
          <el-table v-else :data="applyFilters(assignedOrders)" style="width: 100%">
            <el-table-column prop="id" label="订单ID" width="80" />
            <el-table-column prop="customer_name" label="客户姓名" width="100" />
            <el-table-column prop="customer_phone" label="客户电话" width="120" />
            <el-table-column prop="product_type" label="产品类型" width="100" />
            <el-table-column prop="product_model" label="产品型号" width="120" />
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
        </el-tab-pane>

        <el-tab-pane label="进行中" name="inProgress">
          <div class="tab-header">
            <span>进行中任务 ({{ applyFilters(inProgressOrders).length }})</span>
          </div>
          <el-empty v-if="applyFilters(inProgressOrders).length === 0" description="暂无进行中任务" />
          <el-table v-else :data="applyFilters(inProgressOrders)" style="width: 100%">
            <el-table-column prop="id" label="订单ID" width="80" />
            <el-table-column prop="customer_name" label="客户姓名" width="100" />
            <el-table-column prop="customer_phone" label="客户电话" width="120" />
            <el-table-column prop="product_type" label="产品类型" width="100" />
            <el-table-column prop="product_model" label="产品型号" width="120" />
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
        </el-tab-pane>

        <el-tab-pane label="返工" name="rework">
          <div class="tab-header rework-header">
            <span>返工任务 ({{ applyFilters(reworkOrders).length }})</span>
          </div>
          <el-empty v-if="applyFilters(reworkOrders).length === 0" description="暂无返工任务" />
          <el-table v-else :data="applyFilters(reworkOrders)" style="width: 100%">
            <el-table-column prop="id" label="订单ID" width="80" />
            <el-table-column prop="customer_name" label="客户姓名" width="100" />
            <el-table-column prop="customer_phone" label="客户电话" width="120" />
            <el-table-column prop="product_type" label="产品类型" width="100" />
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
        </el-tab-pane>

        <el-tab-pane label="已完成" name="completed">
          <div class="tab-header">
            <span>已完成任务 ({{ applyFilters(completedOrders).length }})</span>
          </div>
          <el-empty v-if="applyFilters(completedOrders).length === 0" description="暂无已完成任务" />
          <el-table v-else :data="applyFilters(completedOrders)" style="width: 100%">
            <el-table-column prop="id" label="订单ID" width="80" />
            <el-table-column prop="customer_name" label="客户姓名" width="100" />
            <el-table-column prop="customer_phone" label="客户电话" width="120" />
            <el-table-column prop="product_type" label="产品类型" width="100" />
            <el-table-column prop="product_model" label="产品型号" width="120" />
            <el-table-column prop="address" label="地址" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusMap[row.status]?.type">
                  {{ statusMap[row.status]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="handleViewDetail(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.tasks-page {
  padding: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 20px;
  align-items: center;
}

.tab-header {
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.rework-header {
  color: #f5222d;
}
</style>