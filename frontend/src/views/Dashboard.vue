<template>
  <div class="dashboard-container">
    <div class="sidebar">
      <div class="logo">
        <h2>返修与质保系统</h2>
      </div>
      <el-menu :default-active="activeMenu" class="sidebar-menu">
        <el-menu-item index="/" @click="navigate('/')">
          <el-icon><component :is="icons.Home" /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/repair-records" @click="navigate('/repair-records')">
          <el-icon><component :is="icons.FileText" /></el-icon>
          <span>返修记录</span>
        </el-menu-item>
        <el-menu-item index="/warranty-tracking" @click="navigate('/warranty-tracking')">
          <el-icon><component :is="icons.Shield" /></el-icon>
          <span>质保跟踪</span>
        </el-menu-item>
      </el-menu>
      <div class="logout-btn" @click="handleLogout">
        <el-icon><component :is="icons.Logout" /></el-icon>
        <span>退出登录</span>
      </div>
    </div>
    
    <div class="main-content">
      <div class="header">
        <h1>欢迎回来，{{ user.name }}</h1>
        <span class="role">{{ roleText }}</span>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card pending">
          <div class="stat-icon">
            <el-icon><component :is="icons.Clock" /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.pending }}</p>
            <p class="stat-label">待办</p>
          </div>
        </div>
        
        <div class="stat-card processing">
          <div class="stat-icon">
            <el-icon><component :is="icons.Loading" /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.processing }}</p>
            <p class="stat-label">处理中</p>
          </div>
        </div>
        
        <div class="stat-card rejected">
          <div class="stat-icon">
            <el-icon><component :is="icons.X" /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.rejected }}</p>
            <p class="stat-label">被退回</p>
          </div>
        </div>
        
        <div class="stat-card closed">
          <div class="stat-icon">
            <el-icon><component :is="icons.Check" /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.closed }}</p>
            <p class="stat-label">已关闭</p>
          </div>
        </div>
        
        <div class="stat-card review">
          <div class="stat-icon">
            <el-icon><component :is="icons.Search" /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.review }}</p>
            <p class="stat-label">需要回查</p>
          </div>
        </div>
        
        <div class="stat-card warranty">
          <div class="stat-icon">
            <el-icon><component :is="icons.Shield" /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.active_warranty }}</p>
            <p class="stat-label">质保中</p>
          </div>
        </div>
      </div>
      
      <div class="recent-section">
        <h3>最近返修记录</h3>
        <el-table :data="recentRecords" border>
          <el-table-column prop="customer_name" label="客户" />
          <el-table-column prop="product_name" label="产品" />
          <el-table-column prop="issue_description" label="问题描述" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="statusType(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" :formatter="formatTime" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Home, FileText, Shield, Logout, Clock, Loading, X, Check, Search } from '@element-plus/icons-vue'
import axios from '@/utils/axios'

const router = useRouter()
const activeMenu = ref('/')
const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))

const icons = {
  Home, FileText, Shield, Logout, Clock, Loading, X, Check, Search
}

const statistics = reactive({
  pending: 0,
  processing: 0,
  rejected: 0,
  closed: 0,
  review: 0,
  active_warranty: 0
})

const recentRecords = ref([])

const roleText = {
  admin: '管理员',
  sales: '销售',
  technician: '装机师',
  service: '客服'
}[user.role] || '员工'

const statusMap = {
  pending: { text: '待办', type: 'warning' },
  processing: { text: '处理中', type: 'primary' },
  rejected: { text: '被退回', type: 'danger' },
  closed: { text: '已关闭', type: 'success' },
  review: { text: '需要回查', type: 'info' }
}

const statusText = (status) => statusMap[status]?.text || status
const statusType = (status) => statusMap[status]?.type || 'default'

const formatTime = (row, column) => {
  return row.created_at?.substring(0, 16) || '-'
}

const navigate = (path) => {
  activeMenu.value = path
  router.push(path)
}

const handleLogout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}

const loadStatistics = async () => {
  try {
    const response = await axios.get('/statistics')
    Object.assign(statistics, response.data)
  } catch (error) {
    ElMessage.error('加载统计数据失败')
  }
}

const loadRecentRecords = async () => {
  try {
    const response = await axios.get('/repair_records')
    recentRecords.value = response.data.slice(0, 5)
  } catch (error) {
    ElMessage.error('加载返修记录失败')
  }
}

onMounted(() => {
  loadStatistics()
  loadRecentRecords()
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #2c3e50 0%, #1a252f 100%);
  color: white;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
}

.logo h2 {
  font-size: 16px;
  font-weight: 600;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.8);
  height: 48px;
  line-height: 48px;
  margin: 0 12px;
  border-radius: 8px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #3498db;
  color: white;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  margin: 0 12px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.main-content {
  flex: 1;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 24px;
  color: #333;
}

.role {
  background: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.stat-card.pending .stat-icon {
  background: #fff3cd;
  color: #d69e2e;
}

.stat-card.processing .stat-icon {
  background: #dbeafe;
  color: #3b82f6;
}

.stat-card.rejected .stat-icon {
  background: #fee2e2;
  color: #ef4444;
}

.stat-card.closed .stat-icon {
  background: #d1fae5;
  color: #10b981;
}

.stat-card.review .stat-icon {
  background: #e0e7ff;
  color: #6366f1;
}

.stat-card.warranty .stat-icon {
  background: #fef3c7;
  color: #f59e0b;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin: 4px 0 0;
}

.recent-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.recent-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
}
</style>