<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-left">
        <h1>卫浴安装管理系统</h1>
        <span class="role">调度员</span>
      </div>
      <div class="header-right">
        <span>{{ user?.name }}</span>
        <el-button @click="logout" size="small">退出登录</el-button>
        <el-button @click="switchRole" size="small">切换角色</el-button>
      </div>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.scheduled }}</div>
        <div class="stat-label">待派单</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.accepted }}</div>
        <div class="stat-label">已接单</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.inProgress }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.leakage }}</div>
        <div class="stat-label">漏水返工</div>
      </div>
    </div>

    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="筛选状态">
        <el-option label="全部" value="" />
        <el-option label="待派单" value="scheduled" />
        <el-option label="已接单" value="accepted" />
        <el-option label="进行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
        <el-option label="漏水反馈" value="leakage" />
        <el-option label="售后处理" value="after_sales" />
        <el-option label="责任判定" value="responsibility_judged" />
        <el-option label="已解决" value="resolved" />
      </el-select>
      <el-input v-model="keyword" placeholder="搜索订单号/客户名/地址" @input="handleSearch" />
    </div>

    <div class="order-list">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>产品</th>
            <th>地址</th>
            <th>时间</th>
            <th>状态</th>
            <th>师傅</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>{{ order.customer_name }}</td>
            <td>{{ order.product_type }}</td>
            <td>{{ order.address }}</td>
            <td>{{ formatDate(order.scheduled_date) }}</td>
            <td><span :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span></td>
            <td>{{ getTechnicianName(order.technician_id) }}</td>
            <td><el-button @click="viewOrder(order.id)" size="small">详情</el-button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrders, getUsers } from '../utils/api'

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const orders = ref([])
const users = ref([])
const filterStatus = ref('')
const keyword = ref('')

const stats = computed(() => ({
  scheduled: orders.value.filter(o => o.status === 'scheduled').length,
  accepted: orders.value.filter(o => o.status === 'accepted').length,
  inProgress: orders.value.filter(o => o.status === 'in_progress').length,
  leakage: orders.value.filter(o => o.status === 'leakage' || o.status === 'after_sales').length
}))

const loadOrders = async () => {
  try {
    orders.value = await getOrders({ status: filterStatus.value || undefined })
  } catch (error) {
    ElMessage.error('加载订单失败')
  }
}

const loadUsers = async () => {
  try {
    users.value = await getUsers()
  } catch (error) {
    ElMessage.error('加载用户失败')
  }
}

const handleSearch = () => {
  if (keyword.value.trim()) {
    getOrders({ keyword: keyword.value }).then(data => {
      orders.value = data
    })
  } else {
    loadOrders()
  }
}

const getTechnicianName = (id) => {
  const technician = users.value.find(u => u.id === id)
  return technician?.name || '-'
}

const getStatusText = (status) => {
  const map = {
    scheduled: '待派单',
    accepted: '已接单',
    in_progress: '进行中',
    completed: '已完成',
    leakage: '漏水反馈',
    after_sales: '售后处理',
    responsibility_judged: '责任判定',
    resolved: '已解决'
  }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = {
    scheduled: 'status-scheduled',
    accepted: 'status-accepted',
    in_progress: 'status-progress',
    completed: 'status-completed',
    leakage: 'status-leakage',
    after_sales: 'status-aftersales',
    responsibility_judged: 'status-judged',
    resolved: 'status-resolved'
  }
  return map[status] || ''
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const viewOrder = (id) => {
  window.location.href = `/order/${id}`
}

const logout = () => {
  localStorage.removeItem('user')
  window.location.href = '/'
}

const switchRole = () => {
  localStorage.removeItem('user')
  window.location.href = '/'
}

onMounted(() => {
  loadOrders()
  loadUsers()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.role {
  margin-left: 12px;
  padding: 4px 12px;
  background: #667eea;
  color: white;
  border-radius: 20px;
  font-size: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats {
  display: flex;
  gap: 20px;
  padding: 24px;
}

.stat-card {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-card.warning {
  background: #fff7e6;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.stat-card.warning .stat-value {
  color: #faad14;
}

.stat-label {
  color: #999;
  margin-top: 8px;
}

.filter-bar {
  display: flex;
  gap: 16px;
  padding: 0 24px 16px;
}

.filter-bar .el-select,
.filter-bar .el-input {
  width: 200px;
}

.order-list {
  padding: 0 24px 24px;
}

.order-list table {
  width: 100%;
  background: white;
  border-radius: 8px;
  border-collapse: collapse;
}

.order-list th,
.order-list td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.order-list th {
  background: #f8f9fa;
  font-weight: 600;
}

.status-scheduled { color: #999; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; }
.status-accepted { color: #1890ff; background: #e6f7ff; padding: 4px 8px; border-radius: 4px; }
.status-progress { color: #faad14; background: #fff7e6; padding: 4px 8px; border-radius: 4px; }
.status-completed { color: #52c41a; background: #f6ffed; padding: 4px 8px; border-radius: 4px; }
.status-leakage { color: #f5222d; background: #fff1f0; padding: 4px 8px; border-radius: 4px; }
.status-aftersales { color: #eb2f96; background: #fff0f6; padding: 4px 8px; border-radius: 4px; }
.status-judged { color: #722ed1; background: #f9f0ff; padding: 4px 8px; border-radius: 4px; }
.status-resolved { color: #13c2c2; background: #e6fffb; padding: 4px 8px; border-radius: 4px; }
</style>