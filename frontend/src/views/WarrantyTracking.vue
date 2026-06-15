<template>
  <div class="warranty-container">
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
        <h1>质保跟踪管理</h1>
        <el-button type="primary" @click="openCreateDrawer">
          <el-icon><component :is="icons.Plus" /></el-icon>
          新建质保记录
        </el-button>
      </div>
      
      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="选择状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="质保中" value="active" />
          <el-option label="已过期" value="expired" />
          <el-option label="已终止" value="terminated" />
        </el-select>
        
        <el-select v-model="filterType" placeholder="选择质保类型" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="整机质保" value="full" />
          <el-option label="配件质保" value="parts" />
          <el-option label="延保服务" value="extended" />
        </el-select>
        
        <el-input v-model="searchKeyword" placeholder="搜索客户姓名或产品序列号" class="search-input" @keyup.enter="searchWarranties" />
        
        <el-button type="default" @click="searchWarranties">
          <el-icon><component :is="icons.Search" /></el-icon>
          搜索
        </el-button>
      </div>
      
      <div class="stats-row">
        <div class="stat-item" :class="{ active: filterStatus === '' }" @click="filterStatus = ''; loadWarranties()">
          <span class="stat-num">{{ allCount }}</span>
          <span class="stat-text">全部</span>
        </div>
        <div class="stat-item active-warranty" :class="{ active: filterStatus === 'active' }" @click="filterStatus = 'active'; loadWarranties()">
          <span class="stat-num">{{ activeCount }}</span>
          <span class="stat-text">质保中</span>
        </div>
        <div class="stat-item expired" :class="{ active: filterStatus === 'expired' }" @click="filterStatus = 'expired'; loadWarranties()">
          <span class="stat-num">{{ expiredCount }}</span>
          <span class="stat-text">已过期</span>
        </div>
        <div class="stat-item terminated" :class="{ active: filterStatus === 'terminated' }" @click="filterStatus = 'terminated'; loadWarranties()">
          <span class="stat-num">{{ terminatedCount }}</span>
          <span class="stat-text">已终止</span>
        </div>
      </div>
      
      <div class="warning-section" v-if="expiringSoon.length > 0">
        <div class="warning-header">
          <el-icon :size="20" class="warning-icon"><component :is="icons.AlertTriangle" /></el-icon>
          <span>即将过期（30天内）</span>
        </div>
        <div class="warning-list">
          <div v-for="item in expiringSoon" :key="item.id" class="warning-item" @click="openDetailDrawer(item)">
            <div class="warning-info">
              <span class="warning-customer">{{ item.customer_name }}</span>
              <span class="warning-product">{{ item.product_name }}</span>
            </div>
            <div class="warning-date">
              <span>剩余 {{ item.days_left }} 天</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="warranty-table">
        <el-table :data="warranties" border>
          <el-table-column prop="customer_name" label="客户姓名" />
          <el-table-column prop="product_name" label="产品名称" />
          <el-table-column prop="product_serial" label="产品序列号" />
          <el-table-column prop="warranty_type" label="质保类型">
            <template #default="scope">{{ warrantyTypeText(scope.row.warranty_type) }}</template>
          </el-table-column>
          <el-table-column prop="warranty_period" label="质保期限" />
          <el-table-column prop="start_date" label="开始日期" />
          <el-table-column prop="end_date" label="结束日期" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="warrantyStatusType(scope.row.status)">{{ warrantyStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" @click="openDetailDrawer(scope.row)">查看详情</el-button>
              <el-button size="small" type="warning" @click="openExtendDrawer(scope.row)" v-if="scope.row.status === 'active'">延长质保</el-button>
              <el-button size="small" type="danger" @click="handleTerminate(scope.row)" v-if="scope.row.status === 'active'">终止</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <el-drawer title="新建质保记录" :visible="createDrawerVisible" direction="rtl" @close="createDrawerVisible = false">
      <el-form ref="createForm" :model="createForm" :rules="createRules" label-width="120px">
        <el-form-item label="关联返修记录" prop="repair_id">
          <el-select v-model="createForm.repair_id" placeholder="选择返修记录">
            <el-option v-for="record in repairRecords" :key="record.id" :label="`${record.customer_name} - ${record.product_name}`" :value="record.id" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="质保类型" prop="warranty_type">
          <el-select v-model="createForm.warranty_type">
            <el-option label="整机质保" value="full" />
            <el-option label="配件质保" value="parts" />
            <el-option label="延保服务" value="extended" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="质保期限" prop="warranty_period">
          <el-input v-model="createForm.warranty_period" placeholder="如：1年、3个月" />
        </el-form-item>
        
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker v-model="createForm.start_date" type="date" placeholder="选择日期" />
        </el-form-item>
        
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker v-model="createForm.end_date" type="date" placeholder="选择日期" />
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
    
    <el-drawer title="质保记录详情" :visible="detailDrawerVisible" direction="rtl" :size="800">
      <div v-if="selectedWarranty" class="detail-content">
        <div class="detail-header">
          <span class="detail-id">质保编号：{{ selectedWarranty.id }}</span>
          <el-tag :type="warrantyStatusType(selectedWarranty.status)" class="detail-status">{{ warrantyStatusText(selectedWarranty.status) }}</el-tag>
        </div>
        
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>客户姓名</label>
              <span>{{ selectedWarranty.customer_name }}</span>
            </div>
            <div class="info-item">
              <label>联系电话</label>
              <span>{{ selectedWarranty.phone }}</span>
            </div>
            <div class="info-item">
              <label>产品名称</label>
              <span>{{ selectedWarranty.product_name }}</span>
            </div>
            <div class="info-item">
              <label>产品序列号</label>
              <span>{{ selectedWarranty.product_serial }}</span>
            </div>
            <div class="info-item">
              <label>质保类型</label>
              <span>{{ warrantyTypeText(selectedWarranty.warranty_type) }}</span>
            </div>
            <div class="info-item">
              <label>质保期限</label>
              <span>{{ selectedWarranty.warranty_period }}</span>
            </div>
            <div class="info-item">
              <label>开始日期</label>
              <span>{{ selectedWarranty.start_date }}</span>
            </div>
            <div class="info-item">
              <label>结束日期</label>
              <span>{{ selectedWarranty.end_date }}</span>
            </div>
            <div class="info-item">
              <label>创建时间</label>
              <span>{{ formatTime(selectedWarranty.created_at) }}</span>
            </div>
            <div class="info-item">
              <label>更新时间</label>
              <span>{{ formatTime(selectedWarranty.updated_at) }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>关联返修记录</h3>
          <div v-if="selectedWarranty.repair_record" class="repair-link" @click="goToRepairRecord(selectedWarranty.repair_id)">
            <div class="repair-info">
              <span>问题描述：{{ selectedWarranty.repair_record.issue_description }}</span>
              <span class="repair-status">状态：{{ statusText(selectedWarranty.repair_record.status) }}</span>
            </div>
            <div v-if="selectedWarranty.repair_record.remark" class="repair-remark">
              <span class="remark-label">返修备注：</span>
              <span>{{ selectedWarranty.repair_record.remark }}</span>
            </div>
          </div>
          <div v-else>
            <p class="no-link">暂无关联返修记录</p>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>质保备注</h3>
          <p class="remark-content">{{ selectedWarranty.remark || '暂无质保备注' }}</p>
          <div v-if="selectedWarranty.repair_record?.remark" class="transfer-remark">
            <el-button type="text" @click="transferRemark" class="transfer-btn">
              <el-icon><component :is="icons.ArrowRight" /></el-icon>
              将返修备注转移到质保备注
            </el-button>
          </div>
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
    
    <el-drawer title="修改质保记录" :visible="updateDrawerVisible" direction="rtl" @close="updateDrawerVisible = false">
      <el-form ref="updateForm" :model="updateForm" label-width="120px">
        <el-form-item label="质保类型">
          <el-select v-model="updateForm.warranty_type">
            <el-option label="整机质保" value="full" />
            <el-option label="配件质保" value="parts" />
            <el-option label="延保服务" value="extended" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="质保期限">
          <el-input v-model="updateForm.warranty_period" />
        </el-form-item>
        
        <el-form-item label="开始日期">
          <el-date-picker v-model="updateForm.start_date" type="date" />
        </el-form-item>
        
        <el-form-item label="结束日期">
          <el-date-picker v-model="updateForm.end_date" type="date" />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="updateForm.status">
            <el-option label="质保中" value="active" />
            <el-option label="已过期" value="expired" />
            <el-option label="已终止" value="terminated" />
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
    
    <el-drawer title="延长质保" :visible="extendDrawerVisible" direction="rtl" @close="extendDrawerVisible = false">
      <el-form ref="extendForm" :model="extendForm" label-width="120px">
        <el-form-item label="延长时长" prop="extend_period">
          <el-input v-model="extendForm.extend_period" placeholder="如：1年、3个月" />
        </el-form-item>
        
        <el-form-item label="新结束日期" prop="new_end_date">
          <el-date-picker v-model="extendForm.new_end_date" type="date" placeholder="选择新的结束日期" />
        </el-form-item>
        
        <el-form-item label="延长原因" prop="reason">
          <el-textarea v-model="extendForm.reason" placeholder="请说明延长质保的原因" :rows="2" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitExtend">确认延长</el-button>
          <el-button @click="extendDrawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Home, FileText, Shield, Logout, Plus, Search, AlertTriangle, ArrowRight } from '@element-plus/icons-vue'
import axios from '@/utils/axios'

const router = useRouter()
const activeMenu = ref('/warranty-tracking')
const filterStatus = ref('')
const filterType = ref('')
const searchKeyword = ref('')
const warranties = ref([])
const repairRecords = ref([])
const operationLogs = ref([])

const createDrawerVisible = ref(false)
const detailDrawerVisible = ref(false)
const updateDrawerVisible = ref(false)
const extendDrawerVisible = ref(false)

const selectedWarranty = ref(null)
const extendTargetId = ref(null)

const icons = {
  Home, FileText, Shield, Logout, Plus, Search, AlertTriangle, ArrowRight
}

const createForm = reactive({
  repair_id: '',
  warranty_type: 'full',
  warranty_period: '',
  start_date: '',
  end_date: '',
  remark: ''
})

const createRules = {
  repair_id: [{ required: true, message: '请选择关联返修记录', trigger: 'blur' }],
  warranty_type: [{ required: true, message: '请选择质保类型', trigger: 'blur' }],
  warranty_period: [{ required: true, message: '请输入质保期限', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'blur' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'blur' }]
}

const updateForm = reactive({
  warranty_type: '',
  warranty_period: '',
  start_date: '',
  end_date: '',
  status: '',
  remark: ''
})

const extendForm = reactive({
  extend_period: '',
  new_end_date: '',
  reason: ''
})

const warrantyTypeMap = {
  full: '整机质保',
  parts: '配件质保',
  extended: '延保服务'
}

const warrantyStatusMap = {
  active: { text: '质保中', type: 'success' },
  expired: { text: '已过期', type: 'danger' },
  terminated: { text: '已终止', type: 'warning' }
}

const statusMap = {
  pending: { text: '待办', type: 'warning' },
  processing: { text: '处理中', type: 'primary' },
  rejected: { text: '被退回', type: 'danger' },
  closed: { text: '已关闭', type: 'success' },
  review: { text: '需要回查', type: 'info' }
}

const warrantyTypeText = (type) => warrantyTypeMap[type] || type
const warrantyStatusText = (status) => warrantyStatusMap[status]?.text || status
const warrantyStatusType = (status) => warrantyStatusMap[status]?.type || 'default'
const statusText = (status) => statusMap[status]?.text || status

const formatTime = (time) => {
  return time?.substring(0, 16) || '-'
}

const allCount = computed(() => warranties.value.length)
const activeCount = computed(() => warranties.value.filter(w => w.status === 'active').length)
const expiredCount = computed(() => warranties.value.filter(w => w.status === 'expired').length)
const terminatedCount = computed(() => warranties.value.filter(w => w.status === 'terminated').length)

const expiringSoon = computed(() => {
  return warranties.value
    .filter(w => w.status === 'active')
    .map(w => {
      const endDate = new Date(w.end_date)
      const today = new Date()
      const diffTime = endDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return { ...w, days_left: diffDays }
    })
    .filter(w => w.days_left > 0 && w.days_left <= 30)
    .sort((a, b) => a.days_left - b.days_left)
})

const navigate = (path) => {
  activeMenu.value = path
  router.push(path)
}

const handleLogout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}

const loadWarranties = async () => {
  try {
    const params = {}
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    const response = await axios.get('/warranty_records', { params })
    warranties.value = await Promise.all(response.data.map(async w => {
      const repairRecord = await getRepairRecord(w.repair_id)
      return {
        ...w,
        customer_name: repairRecord?.customer_name || '未知',
        phone: repairRecord?.phone || '',
        product_name: repairRecord?.product_name || '未知',
        product_serial: repairRecord?.product_serial || '',
        repair_record: repairRecord
      }
    }))
  } catch (error) {
    ElMessage.error('加载质保记录失败')
  }
}

const loadRepairRecords = async () => {
  try {
    const response = await axios.get('/repair_records')
    repairRecords.value = response.data
  } catch (error) {
    ElMessage.error('加载返修记录失败')
  }
}

const getRepairRecord = async (repairId) => {
  try {
    const response = await axios.get(`/repair_records/${repairId}`)
    return response.data
  } catch (error) {
    return null
  }
}

const searchWarranties = async () => {
  try {
    const response = await axios.get('/warranty_records')
    let result = await Promise.all(response.data.map(async w => {
      const repairRecord = await getRepairRecord(w.repair_id)
      return {
        ...w,
        customer_name: repairRecord?.customer_name || '未知',
        phone: repairRecord?.phone || '',
        product_name: repairRecord?.product_name || '未知',
        product_serial: repairRecord?.product_serial || '',
        repair_record: repairRecord
      }
    }))
    
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(w =>
        w.customer_name.toLowerCase().includes(keyword) ||
        w.product_serial.toLowerCase().includes(keyword)
      )
    }
    if (filterStatus.value) {
      result = result.filter(w => w.status === filterStatus.value)
    }
    if (filterType.value) {
      result = result.filter(w => w.warranty_type === filterType.value)
    }
    warranties.value = result
  } catch (error) {
    ElMessage.error('搜索失败')
  }
}

const openCreateDrawer = async () => {
  await loadRepairRecords()
  Object.assign(createForm, {
    repair_id: '',
    warranty_type: 'full',
    warranty_period: '',
    start_date: '',
    end_date: '',
    remark: ''
  })
  createDrawerVisible.value = true
}

const submitCreate = async () => {
  try {
    await axios.post('/warranty_records', createForm)
    ElMessage.success('创建成功')
    createDrawerVisible.value = false
    loadWarranties()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const openDetailDrawer = async (warranty) => {
  selectedWarranty.value = warranty
  detailDrawerVisible.value = true
  await loadWarrantyLogs(warranty.id)
}

const loadWarrantyLogs = async (warrantyId) => {
  try {
    const response = await axios.get('/operation_logs', { params: { warranty_id: warrantyId } })
    operationLogs.value = response.data
  } catch (error) {
    ElMessage.error('加载操作日志失败')
  }
}

const openUpdateDrawer = () => {
  if (selectedWarranty.value) {
    Object.assign(updateForm, {
      warranty_type: selectedWarranty.value.warranty_type,
      warranty_period: selectedWarranty.value.warranty_period,
      start_date: selectedWarranty.value.start_date,
      end_date: selectedWarranty.value.end_date,
      status: selectedWarranty.value.status,
      remark: selectedWarranty.value.remark || ''
    })
    updateDrawerVisible.value = true
  }
}

const submitUpdate = async () => {
  try {
    await axios.put(`/warranty_records/${selectedWarranty.value.id}`, updateForm)
    ElMessage.success('更新成功')
    updateDrawerVisible.value = false
    detailDrawerVisible.value = false
    loadWarranties()
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const openExtendDrawer = (warranty) => {
  extendTargetId.value = warranty.id
  extendForm.extend_period = ''
  extendForm.new_end_date = ''
  extendForm.reason = ''
  extendDrawerVisible.value = true
}

const submitExtend = async () => {
  try {
    const updateData = {
      end_date: extendForm.new_end_date,
      remark: extendForm.reason
    }
    
    if (extendForm.extend_period) {
      updateData.warranty_period = extendForm.extend_period
    }
    
    await axios.put(`/warranty_records/${extendTargetId.value}`, updateData)
    ElMessage.success('质保已延长')
    extendDrawerVisible.value = false
    loadWarranties()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleTerminate = async (warranty) => {
  try {
    await axios.put(`/warranty_records/${warranty.id}`, { status: 'terminated' })
    ElMessage.success('质保已终止')
    loadWarranties()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const goToRepairRecord = (repairId) => {
  detailDrawerVisible.value = false
  localStorage.setItem('selectedRepairId', repairId)
  router.push('/repair-records')
}

const transferRemark = async () => {
  if (!selectedWarranty.value || !selectedWarranty.value.repair_record?.remark) {
    return
  }
  
  try {
    const repairRemark = selectedWarranty.value.repair_record.remark
    const existingRemark = selectedWarranty.value.remark
    
    let newRemark = repairRemark
    if (existingRemark && existingRemark !== repairRemark) {
      newRemark = `${existingRemark}\n---\n${repairRemark}`
    }
    
    await axios.put(`/warranty_records/${selectedWarranty.value.id}`, { remark: newRemark })
    ElMessage.success('返修备注已转移到质保备注')
    selectedWarranty.value.remark = newRemark
  } catch (error) {
    ElMessage.error('转移失败')
  }
}

onMounted(() => {
  loadWarranties()
})
</script>

<style scoped>
.warranty-container {
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

.stat-item.active-warranty.active .stat-num { color: #10b981; }
.stat-item.expired.active .stat-num { color: #ef4444; }
.stat-item.terminated.active .stat-num { color: #f59e0b; }

.warning-section {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d97706;
  font-weight: bold;
  margin-bottom: 12px;
}

.warning-icon {
  color: #f59e0b;
}

.warning-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.warning-item {
  background: white;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 300px;
  cursor: pointer;
  transition: all 0.3s;
}

.warning-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.warning-info {
  display: flex;
  flex-direction: column;
}

.warning-customer {
  font-weight: bold;
  color: #333;
}

.warning-product {
  font-size: 13px;
  color: #666;
}

.warning-date {
  color: #d97706;
  font-weight: bold;
}

.warranty-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
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

.repair-link {
  background: #e8f4fd;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.repair-link:hover {
  background: #dbeafe;
}

.repair-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.repair-status {
  font-size: 12px;
  color: #3498db;
}

.no-link {
  color: #999;
  font-style: italic;
}

.remark-content {
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
</style>