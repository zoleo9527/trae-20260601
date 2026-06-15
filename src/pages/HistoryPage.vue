<template>
  <div class="history-page">
    <div class="page-header">
      <h2>历史记录</h2>
      <p>查看已完成的订单和责任判定记录</p>
    </div>
    
    <div class="tabs">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="已完成订单" name="completed">
          <el-table :data="completedOrders" border>
            <el-table-column prop="id" label="订单编号" />
            <el-table-column prop="customer_name" label="客户姓名" />
            <el-table-column prop="product_type" label="产品类型" />
            <el-table-column prop="status" label="状态" />
            <el-table-column prop="updated_at" label="完成时间" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="viewOrder(scope.row.id)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="责任判定记录" name="liability">
          <el-table :data="liabilityResults" border>
            <el-table-column prop="order_id" label="订单编号" />
            <el-table-column prop="result" label="责任方" />
            <el-table-column prop="compensation_amount" label="赔偿金额" />
            <el-table-column prop="handled_at" label="判定时间" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="viewOrder(scope.row.order_id)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const { state, loadOrders } = useAppStore()

const activeTab = ref('completed')
const completedOrders = ref([])
const liabilityResults = ref([])

const viewOrder = (orderId: string) => {
  router.push(`/order/${orderId}`)
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
</style>
