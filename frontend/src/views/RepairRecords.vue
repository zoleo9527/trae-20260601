<template>
  <div class="repair-container">
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
        <h1>返修记录管理</h1>
        <el-button type="primary" @click="openCreateDrawer">
          <el-icon><component :is="icons.Plus" /></el-icon>
          新建返修记录
        </el-button>
      </div>
      
      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="选择状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="待办" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="被退回" value="rejected" />
          <el-option label="已关闭" value="closed" />
          <el-option label="需要回查" value="review" />
        </el-select>
        
        <el-input v-model="searchKeyword" placeholder="搜索客户姓名或产品名称" class="search-input" @keyup.enter="searchRecords" />
        
        <el-button type="default" @click="searchRecords">
          <el-icon><component :is="icons.Search" /></el-icon>
          搜索
        </el-button>
      </div>
      
      <div class="stats-row">
        <div class="stat-item" :class="{ active: filterStatus === '' }" @click="filterStatus = ''; loadRecords()">
          <span class="stat-num">{{ allCount }}</span>
          <span class="stat-text">全部</span>
        </div>
        <div class="stat-item pending" :class="{ active: filterStatus === 'pending' }" @click="filterStatus = 'pending'; loadRecords()">
          <span class="stat-num">{{ pendingCount }}</span>
          <span class="stat-text">待办</span>
        </div>
        <div class="stat-item processing" :class="{ active: filterStatus === 'processing' }" @click="filterStatus = 'processing'; loadRecords()">
          <span class="stat-num">{{ processingCount }}</span>
          <span class="stat-text">处理中</span>
        </div>
        <div class="stat-item rejected" :class="{ active: filterStatus === 'rejected' }" @click="filterStatus = 'rejected'; loadRecords()">
          <span class="stat-num">{{ rejectedCount }}</span>
          <span class="stat-text">被退回</span>
        </div>
        <div class="stat-item closed" :class="{ active: filterStatus === 'closed' }" @click="filterStatus = 'closed'; loadRecords()">
          <span class="stat-num">{{ closedCount }}</span>
          <span class="stat-text">已关闭</span>
        </div>
        <div class="stat-item review" :class="{ active: filterStatus === 'review' }" @click="filterStatus = 'review'; loadRecords()">
          <span class="stat-num">{{ reviewCount }}</span>
          <span class="stat-text">需要回查</span>
        </div>
      </div>
      
      <div class="records-list">
        <div v-for="record in records" :key="record.id" class="record-card" @click="openDetailDrawer(record)">
          <div class="record-header">
            <span class="record-id">{{ record.id.substring(0, 8) }}</span>
            <el-tag :type="statusType(record.status)">{{ statusText(record.status) }}</el-tag>
          </div>
          
          <div class="record-body">
            <div class="customer-info">
              <span class="customer-name">{{ record.customer_name }}</span>
              <span class="customer-phone">{{ record.phone }}</span>
            </div>
            
            <div class="product-info">
              <span class="product-name">{{ record.product_name }}</span>
              <span class="product-serial">SN: {{ record.product_serial }}</span>
            </div>
            
            <p class="issue-desc">{{ record.issue_description }}</p>
            
            <div v-if="record.remark" class="remark-box">
              <span class="remark-label">备注：</span>
              <span class="remark-text">{{ record.remark }}</span>
            </div>
          </div>
          
          <div class="record-footer">
            <span class="create-time">{{ formatTime(record.created_at) }}</span>
            <div class="actions">
              <el-button size="small" @click.stop="handleProcess(record)">处理</el-button>
              <el-button size="small" type="danger" @click.stop="handleReject(record)" v-if="record.status !== 'rejected'">退回</el-button>
              <el-button size="small" type="success" @click.stop="handleClose(record)" v-if="record.status !== 'closed'">关闭</el-button>
              <el-button size="small" type="warning" @click.stop="handleReview(record)" v-if="record.status !== 'review'">回查</el-button>
            </div>
          </div>
        </div>
        
        <div v-if="records.length === 0" class="empty-state">
          <el-icon :size="48" class="empty-icon"><component :is="icons.Inbox" /></el-icon>
          <p>暂无返修记录</p>
        </div>
      </div>
    </div>
    
    <el-drawer title="新建返修记录" :visible="createDrawerVisible" direction="rtl" @close="createDrawerVisible = false">
      <el-form ref="createForm" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="客户姓名" prop="customer_name">
          <el-input v-model="createForm.customer_name" placeholder="请输入客户姓名" />
        </el-form-item>
        
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="createForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        
        <el-form-item label="产品名称" prop="product_name">
          <el-input v-model="createForm.product_name" placeholder="请输入产品名称" />
        </el-form-item>
        
        <el-form-item label="产品序列号" prop="product_serial">
          <el-input v-model="createForm.product_serial" placeholder="请输入产品序列号" />
        </el-form-item>
        
        <el-form-item label="问题描述" prop="issue_description">
          <el-textarea v-model="createForm.issue_description" placeholder="请详细描述问题" :rows="3" />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-textarea v-model="createForm.remark" placeholder="请输入备注信息" :rows="2" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitCreate">提交</el-button>
          <el-button @click="createDrawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
    
    <el-drawer title="返修记录详情" :visible="detailDrawerVisible" direction="rtl" :size="800">
      <div v-if="selectedRecord" class="detail-content">
        <div class="detail-header">
          <span class="detail-id">记录编号：{{ selectedRecord.id }}</span>
          <el-tag :type="statusType(selectedRecord.status)" class="detail-status">{{ statusText(selectedRecord.status) }}</el-tag>
        </div>
        
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>客户姓名</label>
              <span>{{ selectedRecord.customer_name }}</span>
            </div>
            <div class="info-item">
              <label>联系电话</label>
              <span>{{ selectedRecord.phone }}</span>
            </div>
            <div class="info-item">
              <label>产品名称</label>
              <span>{{ selectedRecord.product_name }}</span>
            </div>
            <div class="info-item">
              <label>产品序列号</label>
              <span>{{ selectedRecord.product_serial }}</span>
            </div>
            <div class="info-item">
              <label>创建时间</label>
              <span>{{ formatTime(selectedRecord.created_at) }}</span>
            </div>
            <div class="info-item">
              <label>更新时间</label>
              <span>{{ formatTime(selectedRecord.updated_at) }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>问题描述</h3>
          <p class="issue-content">{{ selectedRecord.issue_description }}</p>
        </div>
        
        <div class="detail-section">
          <h3>备注信息</h3>
          <p class="remark-content">{{ selectedRecord.remark || '暂无备注' }}</p>
        </div>
        
        <div class="detail-section">
          <h3>操作日志</h3>
          <el-table :data="operationLogs" border>
            <el-table-column prop="created_at" label="时间" :formatter="formatTime" />
            <el-table-column prop="operator" label="操作人" />
            <el-table-column prop="action" label="操作" />
            <el-table-column prop="detail" label="详情" />
          </el-table>
          
          <div v-if="operationLogs.length === 0" class="empty-logs">
            <p>暂无操作日志</p>
          </div>
        </div>
        
        <div class="detail-actions">
          <el-button type="primary" @click="openUpdateDrawer">修改</el-button>
          <el-button @click="detailDrawerVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
    
    <el-drawer title="修改返修记录" :visible="updateDrawerVisible" direction="rtl" @close="updateDrawerVisible = false">
      <el-form ref="updateForm" :model="updateForm" label-width="100px">
        <el-form-item label="客户姓名">
          <el-input v-model="updateForm.customer_name" />
        </el-form-item>
        
        <el-form-item label="联系电话">
          <el-input v-model="updateForm.phone" />
        </el-form-item>
        
        <el-form-item label="产品名称">
          <el-input v-model="updateForm.product_name" />
        </el-form-item>
        
        <el-form-item label="产品序列号">
          <el-input v-model="updateForm.product_serial" />
        </el-form-item>
        
        <el-form-item label="问题描述">
          <el-textarea v-model="updateForm.issue_description" :rows="3" />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="updateForm.status">
            <el-option label="待办" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="被退回" value="rejected" />
            <el-option label="已关闭" value="closed" />
            <el-option label="需要回查" value="review" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-textarea v-model="updateForm.remark" :rows="2" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitUpdate">保存</el-button>
          <el-button @click="updateDrawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
    
    <el-drawer title="异常处理" :visible="exceptionDrawerVisible" direction="rtl">
      <div class="exception-content">
        <el-form ref="exceptionForm" :model="exceptionForm" label-width="100px">
          <el-form-item label="异常类型">
            <el-select v-model="exceptionForm.type">
              <el-option label="客户信息错误" value="customer_error" />
              <el-option label="产品信息错误" value="product_error" />
              <el-option label="问题描述不清" value="description_error" />
              <el-option label="其他异常" value="other" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="异常原因" prop="reason">
            <el-textarea v-model="exceptionForm.reason" placeholder="请描述异常原因" :rows="3" />
          </el-form-item>
          
          <el-form-item label="处理建议" prop="suggestion">
            <el-textarea v-model="exceptionForm.suggestion" placeholder="请提供处理建议" :rows="3" />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="submitException">提交处理</el-button>
            <el-button @click="exceptionDrawerVisible = false">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Home, FileText, Shield, Logout, Plus, Search, Inbox } from '@element-plus/icons-vue'
import axios from '@/utils/axios'

const router = useRouter()
const activeMenu = ref('/repair-records')
const filterStatus = ref('')
const searchKeyword = ref('')
const records = ref([])
const operationLogs = ref([])

const createDrawerVisible = ref(false)
const detailDrawerVisible = ref(false)
const updateDrawerVisible = ref(false)
const exceptionDrawerVisible = ref(false)

const selectedRecord = ref(null)

const icons = {
  Home, FileText, Shield, Logout, Plus, Search, Inbox
}

const createForm = reactive({
  customer_name: '',
  phone: '',
  product_name: '',
  product_serial: '',
  issue_description: '',
  remark: ''
})

const createRules = {
  customer_name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  product_name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  product_serial: [{ required: true, message: '请输入产品序列号', trigger: 'blur' }],
  issue_description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }]
}

const updateForm = reactive({
  customer_name: '',
  phone: '',
  product_name: '',
  product_serial: '',
  issue_description: '',
  status: '',
  remark: ''
})

const exceptionForm = reactive({
  type: '',
  reason: '',
  suggestion: ''
})

const statusMap = {
  pending: { text: '待办', type: 'warning' },
  processing: { text: '处理中', type: 'primary' },
  rejected: { text: '被退回', type: 'danger' },
  closed: { text: '已关闭', type: 'success' },
  review: { text: '需要回查', type: 'info' }
}

const statusText = (status) => statusMap[status]?.text || status
const statusType = (status) => statusMap[status]?.type || 'default'

const allCount = computed(() => records.value.length)
const pendingCount = computed(() => records.value.filter(r => r.status === 'pending').length)
const processingCount = computed(() => records.value.filter(r => r.status === 'processing').length)
const rejectedCount = computed(() => records.value.filter(r => r.status === 'rejected').length)
const closedCount = computed(() => records.value.filter(r => r.status === 'closed').length)
const reviewCount = computed(() => records.value.filter(r => r.status === 'review').length)

const formatTime = (time) => {
  return time?.substring(0, 16) || '-'
}

const navigate = (path) => {
  activeMenu.value = path
  router.push(path)
}

const handleLogout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}

const loadRecords = async () => {
  try {
    const params = {}
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    const response = await axios.get('/repair_records', { params })
    records.value = response.data
  } catch (error) {
    ElMessage.error('加载返修记录失败')
  }
}

const searchRecords = async () => {
  try {
    const response = await axios.get('/repair_records')
    let result = response.data
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(r => 
        r.customer_name.toLowerCase().includes(keyword) ||
        r.product_name.toLowerCase().includes(keyword)
      )
    }
    if (filterStatus.value) {
      result = result.filter(r => r.status === filterStatus.value)
    }
    records.value = result
  } catch (error) {
    ElMessage.error('搜索失败')
  }
}

const openCreateDrawer = () => {
  Object.assign(createForm, {
    customer_name: '',
    phone: '',
    product_name: '',
    product_serial: '',
    issue_description: '',
    remark: ''
  })
  createDrawerVisible.value = true
}

const submitCreate = async () => {
  try {
    await axios.post('/repair_records', createForm)
    ElMessage.success('创建成功')
    createDrawerVisible.value = false
    loadRecords()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const openDetailDrawer = async (record) => {
  selectedRecord.value = record
  detailDrawerVisible.value = true
  await loadOperationLogs(record.id)
}

const loadOperationLogs = async (repairId) => {
  try {
    const response = await axios.get('/operation_logs', { params: { repair_id: repairId } })
    operationLogs.value = response.data
  } catch (error) {
    ElMessage.error('加载操作日志失败')
  }
}

const openUpdateDrawer = () => {
  if (selectedRecord.value) {
    Object.assign(updateForm, {
      customer_name: selectedRecord.value.customer_name,
      phone: selectedRecord.value.phone,
      product_name: selectedRecord.value.product_name,
      product_serial: selectedRecord.value.product_serial,
      issue_description: selectedRecord.value.issue_description,
      status: selectedRecord.value.status,
      remark: selectedRecord.value.remark || ''
    })
    updateDrawerVisible.value = true
  }
}

const submitUpdate = async () => {
  try {
    await axios.put(`/repair_records/${selectedRecord.value.id}`, updateForm)
    ElMessage.success('更新成功')
    updateDrawerVisible.value = false
    detailDrawerVisible.value = false
    loadRecords()
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const handleProcess = async (record) => {
  try {
    await axios.put(`/repair_records/${record.id}`, { status: 'processing' })
    ElMessage.success('已开始处理')
    loadRecords()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleReject = async (record) => {
  exceptionForm.type = ''
  exceptionForm.reason = ''
  exceptionForm.suggestion = ''
  exceptionDrawerVisible.value = true
  selectedRecord.value = record
}

const submitException = async () => {
  try {
    await axios.put(`/repair_records/${selectedRecord.value.id}`, { 
      status: 'rejected',
      remark: exceptionForm.reason + (exceptionForm.suggestion ? ' | ' + exceptionForm.suggestion : '')
    })
    ElMessage.success('已退回并记录异常')
    exceptionDrawerVisible.value = false
    loadRecords()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleClose = async (record) => {
  try {
    await axios.put(`/repair_records/${record.id}`, { status: 'closed' })
    ElMessage.success('已关闭')
    loadRecords()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleReview = async (record) => {
  try {
    await axios.put(`/repair_records/${record.id}`, { status: 'review' })
    ElMessage.success('已标记需要回查')
    loadRecords()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.repair-container {
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

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.filter-select {
  width: 140px;
}

.search-input {
  width: 280px;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-item.active {
  border-color: #3498db;
  background: #e8f4fd;
}

.stat-num {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-text {
  display: block;
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.stat-item.pending.active .stat-num { color: #d69e2e; }
.stat-item.processing.active .stat-num { color: #3b82f6; }
.stat-item.rejected.active .stat-num { color: #ef4444; }
.stat-item.closed.active .stat-num { color: #10b981; }
.stat-item.review.active .stat-num { color: #6366f1; }

.records-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

.record-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-id {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.record-body {
  margin-bottom: 12px;
}

.customer-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.customer-name {
  font-weight: bold;
  color: #333;
}

.customer-phone {
  font-size: 13px;
  color: #666;
}

.product-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.product-name {
  font-size: 14px;
  color: #333;
}

.product-serial {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.issue-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.remark-box {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
}

.remark-label {
  color: #999;
}

.remark-text {
  color: #666;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.create-time {
  font-size: 12px;
  color: #999;
}

.actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px;
  color: #999;
}

.empty-icon {
  margin-bottom: 12px;
}

.detail-content {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.detail-id {
  font-family: monospace;
  color: #666;
}

.detail-status {
  font-size: 14px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.info-item span {
  font-size: 14px;
  color: #333;
}

.issue-content, .remark-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.empty-logs {
  text-align: center;
  padding: 40px;
  color: #999;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.exception-content {
  padding: 20px;
}
</style>