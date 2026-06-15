<template>
  <div class="review-page">
    <header class="header">
      <el-button @click="goBack">返回</el-button>
      <h1>责任判定回看</h1>
      <span></span>
    </header>

    <div class="filter-bar">
      <el-select v-model="filterParty" placeholder="筛选责任方" @change="loadOrders">
        <el-option label="全部" value="" />
        <el-option label="安装师傅" value="technician" />
        <el-option label="客户" value="customer" />
        <el-option label="供应商" value="supplier" />
        <el-option label="公司" value="company" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="筛选判定状态" @change="loadOrders">
        <el-option label="全部" value="" />
        <el-option label="待确认" value="confirmed" />
        <el-option label="申诉中" value="appeal" />
        <el-option label="已终审" value="final" />
      </el-select>
      <el-input v-model="keyword" placeholder="搜索订单号/客户名" @input="handleSearch" />
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总判定</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.technician }}</div>
        <div class="stat-label">师傅责任</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.customer }}</div>
        <div class="stat-label">客户责任</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.supplier }}</div>
        <div class="stat-label">供应商责任</div>
      </div>
    </div>

    <div class="timeline">
      <div v-for="order in ordersWithJudgment" :key="order.id" class="timeline-item">
        <div class="timeline-header">
          <div class="order-info">
            <span class="order-id">{{ order.id }}</span>
            <span class="customer">{{ order.customer_name }}</span>
            <span class="product">{{ order.product_type }}</span>
          </div>
          <span :class="getResponsibilityStatusClass(order.responsibility_result.status)">
            {{ getResponsibilityStatus(order.responsibility_result.status) }}
          </span>
        </div>
        <div class="timeline-content">
          <div class="judgment-info">
            <div class="responsible-party">
              <span class="label">责任方：</span>
              <span :class="getPartyClass(order.responsibility_result.responsible_party)">
                {{ getResponsiblePartyText(order.responsibility_result.responsible_party) }}
              </span>
            </div>
            <div class="reason">
              <span class="label">判定理由：</span>
              <span>{{ order.responsibility_result.reason }}</span>
            </div>
            <div class="meta">
              <span>{{ formatDate(order.responsibility_result.created_at) }}</span>
              <span>判定人：{{ getUserName(order.responsibility_result.created_by) }}</span>
            </div>
          </div>
          <div class="actions">
            <el-button @click="viewOrder(order.id)" size="small">查看详情</el-button>
          </div>
        </div>
        <div class="timeline-line"></div>
      </div>
    </div>

    <div v-if="ordersWithJudgment.length === 0" class="empty">暂无责任判定记录</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrders, getUsers } from '../utils/api'

const orders = ref([])
const users = ref([])
const filterParty = ref('')
const filterStatus = ref('')
const keyword = ref('')

const ordersWithJudgment = computed(() => {
  let result = orders.value.filter(o => o.responsibility_result)
  
  if (filterParty.value) {
    result = result.filter(o => o.responsibility_result.responsible_party === filterParty.value)
  }
  
  if (filterStatus.value) {
    result = result.filter(o => o.responsibility_result.status === filterStatus.value)
  }
  
  return result.sort((a, b) => new Date(b.responsibility_result.created_at) - new Date(a.responsibility_result.created_at))
})

const stats = computed(() => ({
  total: ordersWithJudgment.value.length,
  technician: ordersWithJudgment.value.filter(o => o.responsibility_result.responsible_party === 'technician').length,
  customer: ordersWithJudgment.value.filter(o => o.responsibility_result.responsible_party === 'customer').length,
  supplier: ordersWithJudgment.value.filter(o => o.responsibility_result.responsible_party === 'supplier').length
}))

const loadOrders = async () => {
  try {
    orders.value = await getOrders()
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

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user?.name || userId || '-'
}

const getResponsiblePartyText = (party) => {
  const map = { technician: '安装师傅', customer: '客户', supplier: '供应商', company: '公司' }
  return map[party] || party
}

const getPartyClass = (party) => {
  const map = {
    technician: 'party-technician',
    customer: 'party-customer',
    supplier: 'party-supplier',
    company: 'party-company'
  }
  return map[party] || ''
}

const getResponsibilityStatus = (status) => {
  const map = { confirmed: '待确认', appeal: '申诉中', final: '已终审' }
  return map[status] || status
}

const getResponsibilityStatusClass = (status) => {
  const map = {
    confirmed: 'status-confirmed',
    appeal: 'status-appeal',
    final: 'status-final'
  }
  return map[status] || ''
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const viewOrder = (id) => {
  window.location.href = `/order/${id}`
}

const goBack = () => {
  window.history.back()
}

onMounted(() => {
  loadOrders()
  loadUsers()
})
</script>

<style scoped>
.review-page {
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

.filter-bar {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
}

.filter-bar .el-select,
.filter-bar .el-input {
  width: 200px;
}

.stats {
  display: flex;
  gap: 20px;
  padding: 0 24px 24px;
}

.stat-card {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #999;
  margin-top: 8px;
}

.timeline {
  padding: 0 24px 24px;
}

.timeline-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  position: relative;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-id {
  font-weight: 600;
  color: #333;
  margin-right: 16px;
}

.customer {
  color: #666;
  margin-right: 16px;
}

.product {
  color: #999;
}

.timeline-content {
  display: flex;
  justify-content: space-between;
}

.judgment-info {
  flex: 1;
}

.judgment-info .label {
  color: #999;
}

.responsible-party {
  margin-bottom: 8px;
}

.reason {
  margin-bottom: 8px;
}

.meta {
  font-size: 12px;
  color: #999;
}

.meta span {
  margin-right: 16px;
}

.actions {
  margin-left: 16px;
}

.timeline-line {
  position: absolute;
  left: 24px;
  bottom: -24px;
  width: 2px;
  height: 24px;
  background: #eee;
}

.timeline-item:last-child .timeline-line {
  display: none;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.party-technician { color: #f5222d; }
.party-customer { color: #1890ff; }
.party-supplier { color: #722ed1; }
.party-company { color: #faad14; }

.status-confirmed { color: #faad14; padding: 4px 8px; background: #fff7e6; border-radius: 4px; }
.status-appeal { color: #eb2f96; padding: 4px 8px; background: #fff0f6; border-radius: 4px; }
.status-final { color: #52c41a; padding: 4px 8px; background: #f6ffed; border-radius: 4px; }
</style>