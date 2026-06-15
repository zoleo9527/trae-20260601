<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElCard, ElButton, ElTable, ElTableColumn, ElTag, ElDialog, ElForm, ElFormItem, ElInput, ElDatePicker, ElSelect, ElOption, ElMessage, ElTabs, ElTabPane, ElPagination } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const orders = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

const statusMap: Record<string, { label: string; type: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
  'PENDING': { label: '待分配', type: 'info' },
  'ASSIGNED': { label: '已分配', type: 'warning' },
  'IN_PROGRESS': { label: '安装中', type: 'primary' },
  'COMPLETED': { label: '已完成', type: 'success' },
  'REWORK_REQUESTED': { label: '待返工', type: 'danger' },
  'REWORK_IN_PROGRESS': { label: '返工中', type: 'danger' },
  'REWORK_COMPLETED': { label: '返工完成', type: 'warning' },
  'LIABILITY_PENDING': { label: '待责任判定', type: 'danger' },
  'LIABILITY_DONE': { label: '责任已判定', type: 'success' }
}

const completedStatuses = ['COMPLETED', 'REWORK_REQUESTED', 'REWORK_IN_PROGRESS', 'REWORK_COMPLETED', 'LIABILITY_PENDING', 'LIABILITY_DONE']

const filteredOrders = computed(() => {
  return orders.value.filter(order => completedStatuses.includes(order.status))
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredOrders.value.slice(start, end)
})

const totalOrders = computed(() => filteredOrders.value.length)

const loadOrders = async () => {
  loading.value = true
  try {
    const response = await api.get<any[]>('/orders')
    orders.value = response
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const handleRework = (order: any) => {
  router.push(`/service/rework?orderId=${order.id}`)
}

const handleLiability = (order: any) => {
  router.push(`/service/liability?orderId=${order.id}`)
}

const handleViewDetail = (order: any) => {
  router.push(`/history/order/${order.id}`)
}

const getStatusLabel = (status: string) => {
  return statusMap[status]?.label || status
}

const getStatusType = (status: string) => {
  return statusMap[status]?.type || 'info'
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="service-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>已完成订单列表</span>
          <el-button type="primary" @click="router.push('/service/rework')">
            发起返工申请
          </el-button>
        </div>
      </template>

      <el-table :data="paginatedOrders" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="订单ID" width="80" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="customer_phone" label="客户电话" width="120" />
        <el-table-column prop="product_type" label="产品类型" width="100" />
        <el-table-column prop="product_model" label="产品型号" width="120" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="installer_name" label="安装师傅" width="100" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button 
              v-if="row.status === 'COMPLETED'" 
              type="warning" 
              size="small" 
              @click="handleRework(row)"
            >
              发起返工
            </el-button>
            <el-button 
              v-if="row.status === 'LIABILITY_PENDING'" 
              type="primary" 
              size="small" 
              @click="handleLiability(row)"
            >
              责任判定
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalOrders"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.service-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>