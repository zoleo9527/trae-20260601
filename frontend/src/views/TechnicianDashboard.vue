<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-left">
        <h1>卫浴安装管理系统</h1>
        <span class="role">安装师傅</span>
      </div>
      <div class="header-right">
        <span>{{ user?.name }}</span>
        <el-button @click="logout" size="small">退出登录</el-button>
        <el-button @click="switchRole" size="small">切换角色</el-button>
      </div>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.accepted }}</div>
        <div class="stat-label">待安装</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.inProgress }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-value">{{ stats.leakage }}</div>
        <div class="stat-label">待返工</div>
      </div>
    </div>

    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="筛选状态" @change="loadOrders">
        <el-option label="全部" value="" />
        <el-option label="待安装" value="accepted" />
        <el-option label="进行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
        <el-option label="待返工" value="responsibility_judged" />
      </el-select>
      <el-input v-model="keyword" placeholder="搜索订单号/客户名" @input="handleSearch" />
    </div>

    <div class="order-list">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>产品</th>
            <th>地址</th>
            <th>预约时间</th>
            <th>状态</th>
            <th>配件</th>
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
            <td>
              <el-button @click="showAccessories(order)" size="small">查看</el-button>
            </td>
            <td>
              <template v-if="order.status === 'accepted'">
                <el-button @click="startOrder(order.id)" type="primary" size="small">开始安装</el-button>
              </template>
              <template v-else-if="order.status === 'in_progress'">
                <el-button @click="showCompleteModal(order)" size="small">完成安装</el-button>
                <el-button @click="showLeakageModal(order)" type="danger" size="small">报漏水</el-button>
              </template>
              <template v-else-if="order.status === 'responsibility_judged'">
                <el-button @click="showReworkModal(order)" type="warning" size="small">返工</el-button>
              </template>
              <template v-else>
                <el-button @click="viewOrder(order.id)" size="small">详情</el-button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-dialog title="配件清单" :visible.sync="accessoriesVisible">
      <div v-if="currentOrder">
        <h4>{{ currentOrder.id }} - {{ currentOrder.product_type }}</h4>
        <table class="accessories-table">
          <thead>
            <tr><th>配件名称</th><th>数量</th><th>使用状态</th><th>备注</th></tr>
          </thead>
          <tbody>
            <tr v-for="acc in currentOrder.accessories" :key="acc.id">
              <td>{{ acc.name }}</td>
              <td>{{ acc.quantity }}</td>
              <td>{{ acc.used ? '已使用' : '未使用' }}</td>
              <td>{{ acc.remark || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-dialog>

    <el-dialog title="完成安装" :visible.sync="completeVisible">
      <el-form :model="completeForm">
        <el-form-item label="安装照片">
          <el-input v-model="completeForm.photos" placeholder="输入照片URL，多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="备注">
          <el-textarea v-model="completeForm.remark" rows="3" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button @click="submitComplete" type="primary">确认完成</el-button>
      </div>
    </el-dialog>

    <el-dialog title="上报漏水" :visible.sync="leakageVisible">
      <el-form :model="leakageForm">
        <el-form-item label="漏水描述">
          <el-textarea v-model="leakageForm.description" rows="3" placeholder="请详细描述漏水情况" />
        </el-form-item>
        <el-form-item label="漏水照片">
          <el-input v-model="leakageForm.photos" placeholder="输入照片URL，多个用逗号分隔" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="leakageVisible = false">取消</el-button>
        <el-button @click="submitLeakage" type="danger">确认上报</el-button>
      </div>
    </el-dialog>

    <el-dialog title="返工修复" :visible.sync="reworkVisible">
      <el-form :model="reworkForm">
        <el-form-item label="返工照片">
          <el-input v-model="reworkForm.photos" placeholder="输入返工后照片URL" />
        </el-form-item>
        <el-form-item label="修复说明">
          <el-textarea v-model="reworkForm.remark" rows="3" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="reworkVisible = false">取消</el-button>
        <el-button @click="submitRework" type="warning">确认返工</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrders, startOrder as apiStartOrder, completeOrder, reportLeakage, reworkOrder } from '../utils/api'

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const orders = ref([])
const filterStatus = ref('')
const keyword = ref('')

const accessoriesVisible = ref(false)
const completeVisible = ref(false)
const leakageVisible = ref(false)
const reworkVisible = ref(false)
const currentOrder = ref(null)

const completeForm = reactive({ photos: '', remark: '' })
const leakageForm = reactive({ description: '', photos: '' })
const reworkForm = reactive({ photos: '', remark: '' })

const stats = computed(() => ({
  accepted: orders.value.filter(o => o.status === 'accepted').length,
  inProgress: orders.value.filter(o => o.status === 'in_progress').length,
  completed: orders.value.filter(o => o.status === 'completed').length,
  leakage: orders.value.filter(o => o.status === 'responsibility_judged').length
}))

const loadOrders = async () => {
  try {
    orders.value = await getOrders({ 
      technician_id: user.value.id,
      status: filterStatus.value || undefined 
    })
  } catch (error) {
    ElMessage.error('加载订单失败')
  }
}

const handleSearch = () => {
  if (keyword.value.trim()) {
    getOrders({ technician_id: user.value.id, keyword: keyword.value }).then(data => {
      orders.value = data
    })
  } else {
    loadOrders()
  }
}

const showAccessories = (order) => {
  currentOrder.value = order
  accessoriesVisible.value = true
}

const showCompleteModal = (order) => {
  currentOrder.value = order
  completeForm.photos = ''
  completeForm.remark = ''
  completeVisible.value = true
}

const showLeakageModal = (order) => {
  currentOrder.value = order
  leakageForm.description = ''
  leakageForm.photos = ''
  leakageVisible.value = true
}

const showReworkModal = (order) => {
  currentOrder.value = order
  reworkForm.photos = ''
  reworkForm.remark = ''
  reworkVisible.value = true
}

const startOrder = async (orderId) => {
  try {
    await apiStartOrder(orderId)
    ElMessage.success('已开始安装')
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const submitComplete = async () => {
  try {
    const photos = completeForm.photos.split(',').filter(p => p.trim())
    await completeOrder(currentOrder.value.id, photos.length > 0 ? photos : undefined)
    ElMessage.success('安装完成')
    completeVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const submitLeakage = async () => {
  if (!leakageForm.description.trim()) {
    ElMessage.error('请填写漏水描述')
    return
  }
  
  try {
    const photos = leakageForm.photos.split(',').filter(p => p.trim())
    await reportLeakage(currentOrder.value.id, leakageForm.description, photos.length > 0 ? photos : undefined, user.value.id)
    ElMessage.success('漏水已上报')
    leakageVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const submitRework = async () => {
  try {
    const photos = reworkForm.photos.split(',').filter(p => p.trim())
    await reworkOrder(currentOrder.value.id, photos.length > 0 ? photos : undefined)
    ElMessage.success('返工已开始')
    reworkVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const getStatusText = (status) => {
  const map = {
    scheduled: '待派单',
    accepted: '待安装',
    in_progress: '进行中',
    completed: '已完成',
    leakage: '漏水反馈',
    after_sales: '售后处理',
    responsibility_judged: '待返工',
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
  background: #1890ff;
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

.stat-card.danger {
  background: #fff1f0;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.stat-card.warning .stat-value {
  color: #faad14;
}

.stat-card.danger .stat-value {
  color: #f5222d;
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

.accessories-table {
  width: 100%;
  margin-top: 16px;
}

.accessories-table th,
.accessories-table td {
  padding: 8px;
  border: 1px solid #eee;
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