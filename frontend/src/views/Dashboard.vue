<template>
  <div class="dashboard">
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-icon orders">
          <el-icon><component :is="icons.FileText" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dailyStats.total_orders }}</div>
          <div class="stat-label">今日工单</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon completed">
          <el-icon><component :is="icons.CheckCircle" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dailyStats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon pending">
          <el-icon><component :is="icons.Clock" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dailyStats.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon parts">
          <el-icon><component :is="icons.Package" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dailyStats.parts_issued }}</div>
          <div class="stat-label">领用备件</div>
        </div>
      </el-card>
    </div>

    <div class="bottom-section">
      <el-card title="待处理工单" class="section-card">
        <el-table :data="pendingOrders" border>
          <el-table-column prop="order_no" label="工单号" />
          <el-table-column prop="customer_name" label="客户" />
          <el-table-column prop="device_model" label="机型" />
          <el-table-column prop="created_at" label="创建时间" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button @click="viewOrder(scope.row.id)" type="text">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card title="库存预警" class="section-card">
        <el-table :data="lowStockParts" border>
          <el-table-column prop="part_code" label="备件编号" />
          <el-table-column prop="part_name" label="备件名称" />
          <el-table-column prop="stock" label="当前库存" />
          <el-table-column prop="min_stock" label="最低库存" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, CheckCircle, Clock, Package } from '@element-plus/icons-vue'
import { records, repairs, spareParts } from '../api'

const router = useRouter()
const icons = { FileText, CheckCircle, Clock, Package }

const dailyStats = ref({
  total_orders: 0,
  completed: 0,
  pending: 0,
  processing: 0,
  parts_issued: 0,
  parts_value: 0
})

const pendingOrders = ref([])
const lowStockParts = ref([])

const loadDailyStats = async () => {
  const today = new Date().toISOString().split('T')[0]
  const res = await records.getDailySummary(today)
  dailyStats.value = res.data
}

const loadPendingOrders = async () => {
  const res = await repairs.getOrders({ status: 'pending' })
  pendingOrders.value = res.data.slice(0, 5)
}

const loadLowStockParts = async () => {
  const res = await spareParts.getParts({ low_stock: true })
  lowStockParts.value = res.data
}

const viewOrder = (id) => {
  router.push(`/order/${id}`)
}

onMounted(() => {
  loadDailyStats()
  loadPendingOrders()
  loadLowStockParts()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
  font-size: 24px;
}

.stat-icon.orders {
  background: #e8f4fd;
  color: #409eff;
}

.stat-icon.completed {
  background: #e8f8ed;
  color: #67c23a;
}

.stat-icon.pending {
  background: #fef7e0;
  color: #e6a23c;
}

.stat-icon.parts {
  background: #f5e8ff;
  color: #909399;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.section-card {
  height: 300px;
}
</style>
