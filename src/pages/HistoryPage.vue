<template>
  <div class="history-page">
    <div class="page-header">
      <h2>历史记录</h2>
      <p>查看已完成的订单和责任判定记录</p>
    </div>
    
    <div class="tabs">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="已完成订单" name="completed">
          <div class="filter-bar">
            <el-input 
              v-model="orderFilter" 
              placeholder="搜索订单编号、客户姓名..." 
              class="filter-input"
            />
          </div>
          <el-table :data="filteredCompletedOrders" border>
            <el-table-column prop="id" label="订单编号" />
            <el-table-column prop="customer_name" label="客户姓名" />
            <el-table-column prop="product_type" label="产品类型" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updated_at" label="完成时间">
              <template #default="scope">
                {{ formatDate(scope.row.updated_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="viewOrder(scope.row.id)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <Empty v-if="filteredCompletedOrders.length === 0" />
        </el-tab-pane>
        
        <el-tab-pane label="责任判定记录" name="liability">
          <div class="filter-bar">
            <el-select v-model="liabilityFilter" placeholder="筛选责任方">
              <el-option label="全部" value="" />
              <el-option label="安装师傅" value="technician" />
              <el-option label="用户" value="customer" />
              <el-option label="供应商" value="supplier" />
              <el-option label="公司" value="company" />
            </el-select>
          </div>
          <el-table :data="filteredLiabilityResults" border>
            <el-table-column prop="order_id" label="订单编号" />
            <el-table-column prop="responsible_party" label="责任方">
              <template #default="scope">
                {{ getResponsiblePartyText(scope.row.responsible_party) }}
              </template>
            </el-table-column>
            <el-table-column prop="compensation_amount" label="赔偿金额">
              <template #default="scope">
                ¥{{ scope.row.compensation_amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="判定时间">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="viewOrder(scope.row.order_id)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <Empty v-if="filteredLiabilityResults.length === 0" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import Empty from '../components/Empty.vue'

const router = useRouter()
const { state, loadOrders, getUsers } = useAppStore()

const activeTab = ref('completed')
const orderFilter = ref('')
const liabilityFilter = ref('')

const completedOrders = computed(() => {
  return state.orders.filter(order => 
    order.status === 'completed' || 
    order.status === 'liability_done' ||
    order.status === 'rework_completed'
  )
})

const filteredCompletedOrders = computed(() => {
  if (!orderFilter.value) return completedOrders.value
  const filter = orderFilter.value.toLowerCase()
  return completedOrders.value.filter(order => 
    String(order.id).includes(filter) ||
    order.customer_name.toLowerCase().includes(filter) ||
    order.product_type.toLowerCase().includes(filter)
  )
})

const liabilityResults = computed(() => {
  const results: any[] = []
  state.orders.forEach(order => {
    if (order.responsibility_result) {
      results.push({
        ...order.responsibility_result,
        order_id: order.id
      })
    }
  })
  return results
})

const filteredLiabilityResults = computed(() => {
  if (!liabilityFilter.value) return liabilityResults.value
  return liabilityResults.value.filter(result => 
    result.responsible_party === liabilityFilter.value
  )
})

const viewOrder = (orderId: number | string) => {
  router.push(`/order/${orderId}`)
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    'completed': 'success',
    'liability_done': 'warning',
    'rework_completed': 'info'
  }
  return typeMap[status] || 'default'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'completed': '已完成',
    'liability_done': '责任已判定',
    'rework_completed': '返工完成'
  }
  return textMap[status] || status
}

const getResponsiblePartyText = (party: string) => {
  const textMap: Record<string, string> = {
    'technician': '安装师傅',
    'customer': '用户',
    'supplier': '供应商',
    'company': '公司'
  }
  return textMap[party] || party
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.history-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
}

.tabs {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.filter-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 16px;
}

.filter-input {
  width: 300px;
}
</style>
