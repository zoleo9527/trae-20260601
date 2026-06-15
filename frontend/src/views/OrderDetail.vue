<template>
  <div class="order-detail">
    <header class="header">
      <el-button @click="goBack">返回</el-button>
      <h1>订单详情</h1>
      <span></span>
    </header>

    <div v-if="order" class="content">
      <div class="basic-info">
        <h2>{{ order.id }}</h2>
        <div class="info-row">
          <span class="label">客户：</span>
          <span>{{ order.customer_name }} {{ order.customer_phone }}</span>
        </div>
        <div class="info-row">
          <span class="label">地址：</span>
          <span>{{ order.address }}</span>
        </div>
        <div class="info-row">
          <span class="label">产品：</span>
          <span>{{ order.product_type }}</span>
        </div>
        <div class="info-row">
          <span class="label">预约时间：</span>
          <span>{{ formatDate(order.scheduled_date) }}</span>
        </div>
        <div class="info-row">
          <span class="label">状态：</span>
          <span :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span>
        </div>
        <div class="info-row">
          <span class="label">安装师傅：</span>
          <span>{{ getTechnicianName(order.technician_id) }}</span>
        </div>
      </div>

      <div class="section">
        <h3>配件清单</h3>
        <table>
          <thead>
            <tr><th>配件名称</th><th>数量</th><th>使用状态</th><th>备注</th></tr>
          </thead>
          <tbody>
            <tr v-for="acc in order.accessories" :key="acc.id">
              <td>{{ acc.name }}</td>
              <td>{{ acc.quantity }}</td>
              <td>{{ acc.used ? '已使用' : '未使用' }}</td>
              <td>{{ acc.remark || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>安装照片</h3>
        <div v-if="order.photos && order.photos.length" class="photos-grid">
          <div v-for="photo in order.photos" :key="photo.id" class="photo-item">
            <img :src="photo.photo_url" alt="安装照片" />
            <p>{{ photo.description }}</p>
            <p class="small">{{ formatDate(photo.uploaded_at) }}</p>
          </div>
        </div>
        <div v-else class="empty">暂无照片</div>
      </div>

      <div class="section">
        <h3>售后记录</h3>
        <div v-if="order.after_sales_records && order.after_sales_records.length">
          <div v-for="record in order.after_sales_records" :key="record.id" class="record-item">
            <div class="record-header">
              <span class="type">{{ getAfterSalesType(record.type) }}</span>
              <span :class="getAfterSalesStatusClass(record.status)">{{ getAfterSalesStatus(record.status) }}</span>
            </div>
            <p>{{ record.description }}</p>
            <div v-if="record.photos && record.photos.length" class="photos">
              <img v-for="(photo, idx) in record.photos" :key="idx" :src="photo" class="small-photo" />
            </div>
            <p class="small">{{ formatDate(record.reported_at) }} - {{ getUserName(record.reported_by) }}</p>
          </div>
        </div>
        <div v-else class="empty">暂无售后记录</div>
      </div>

      <div v-if="order.responsibility_result" class="section">
        <h3>责任判定</h3>
        <div class="judgment-card">
          <div class="judgment-row">
            <span class="label">责任方：</span>
            <span>{{ getResponsiblePartyText(order.responsibility_result.responsible_party) }}</span>
          </div>
          <div class="judgment-row">
            <span class="label">判定理由：</span>
            <span>{{ order.responsibility_result.reason }}</span>
          </div>
          <div class="judgment-row">
            <span class="label">状态：</span>
            <span :class="getResponsibilityStatusClass(order.responsibility_result.status)">
              {{ getResponsibilityStatus(order.responsibility_result.status) }}
            </span>
          </div>
          <div class="judgment-row">
            <span class="label">判定时间：</span>
            <span>{{ formatDate(order.responsibility_result.created_at) }}</span>
          </div>
          <div class="judgment-row">
            <span class="label">判定人：</span>
            <span>{{ getUserName(order.responsibility_result.created_by) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrder, getUsers } from '../utils/api'

const order = ref(null)
const users = ref([])

const orderId = window.location.pathname.split('/').pop()

const loadOrder = async () => {
  try {
    order.value = await getOrder(orderId)
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

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user?.name || userId || '-'
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

const getAfterSalesType = (type) => {
  const map = { leakage: '漏水', damage: '损坏', other: '其他' }
  return map[type] || type
}

const getAfterSalesStatus = (status) => {
  const map = { pending: '待处理', processing: '处理中', resolved: '已解决', rejected: '已驳回' }
  return map[status] || status
}

const getAfterSalesStatusClass = (status) => {
  const map = {
    pending: 'status-pending',
    processing: 'status-processing',
    resolved: 'status-resolved',
    rejected: 'status-rejected'
  }
  return map[status] || ''
}

const getResponsiblePartyText = (party) => {
  const map = { technician: '安装师傅', customer: '客户', supplier: '供应商', company: '公司' }
  return map[party] || party
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

const goBack = () => {
  window.history.back()
}

onMounted(() => {
  loadOrder()
  loadUsers()
})
</script>

<style scoped>
.order-detail {
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

.content {
  padding: 24px;
}

.basic-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.basic-info h2 {
  margin: 0 0 16px 0;
  color: #333;
}

.info-row {
  margin-bottom: 12px;
}

.info-row .label {
  color: #999;
  display: inline-block;
  width: 100px;
}

.section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.section h3 {
  margin: 0 0 16px 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.section table {
  width: 100%;
}

.section th,
.section td {
  padding: 8px;
  border: 1px solid #eee;
  text-align: left;
}

.section th {
  background: #f8f9fa;
}

.photos-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.photo-item {
  width: 200px;
}

.photo-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.photo-item p {
  margin: 8px 0 4px 0;
  font-size: 14px;
}

.photo-item .small {
  font-size: 12px;
  color: #999;
}

.record-item {
  border: 1px solid #eee;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.record-item .type {
  font-weight: 600;
  color: #333;
}

.record-item p {
  margin: 8px 0;
}

.small-photo {
  width: 80px;
  height: 80px;
  object-fit: cover;
  margin-right: 8px;
  border-radius: 4px;
}

.judgment-card {
  border: 1px solid #eee;
  padding: 16px;
  border-radius: 8px;
}

.judgment-row {
  margin-bottom: 12px;
}

.judgment-row .label {
  color: #999;
  display: inline-block;
  width: 100px;
}

.empty {
  color: #999;
  text-align: center;
  padding: 20px;
}

.status-scheduled { color: #999; }
.status-accepted { color: #1890ff; }
.status-progress { color: #faad14; }
.status-completed { color: #52c41a; }
.status-leakage { color: #f5222d; }
.status-aftersales { color: #eb2f96; }
.status-judged { color: #722ed1; }
.status-resolved { color: #13c2c2; }

.status-pending { color: #faad14; }
.status-processing { color: #1890ff; }
.status-rejected { color: #f5222d; }

.status-confirmed { color: #faad14; }
.status-appeal { color: #eb2f96; }
.status-final { color: #52c41a; }
</style>