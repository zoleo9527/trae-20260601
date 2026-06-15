<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-left">
        <h1>卫浴安装管理系统</h1>
        <span class="role">售后客服</span>
      </div>
      <div class="header-right">
        <span>{{ user?.name }}</span>
        <el-button @click="logout" size="small">退出登录</el-button>
        <el-button @click="switchRole" size="small">切换角色</el-button>
        <el-button @click="goToReview" size="small">责任回看</el-button>
      </div>
    </header>

    <div class="stats">
      <div class="stat-card danger">
        <div class="stat-value">{{ stats.pending }}</div>
        <div class="stat-label">待处理</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.processing }}</div>
        <div class="stat-label">处理中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.judged }}</div>
        <div class="stat-label">待判定</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.resolved }}</div>
        <div class="stat-label">已解决</div>
      </div>
    </div>

    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="筛选状态" @change="loadOrders">
        <el-option label="全部" value="" />
        <el-option label="待处理" value="leakage" />
        <el-option label="处理中" value="after_sales" />
        <el-option label="待判定" value="leakage,after_sales" />
        <el-option label="已判定" value="responsibility_judged" />
        <el-option label="已解决" value="resolved" />
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
            <th>状态</th>
            <th>师傅</th>
            <th>售后记录</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>{{ order.customer_name }}</td>
            <td>{{ order.product_type }}</td>
            <td>{{ order.address }}</td>
            <td><span :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span></td>
            <td>{{ getTechnicianName(order.technician_id) }}</td>
            <td>{{ order.after_sales_records?.length || 0 }}条</td>
            <td>
              <template v-if="hasPendingAfterSales(order)">
                <el-button @click="handleAfterSales(order)" type="primary" size="small">处理</el-button>
                <el-button @click="rejectAfterSales(order)" type="danger" size="small">驳回</el-button>
              </template>
              <template v-else-if="order.status === 'leakage' || order.status === 'after_sales'">
                <el-button @click="showJudgmentModal(order)" type="warning" size="small">责任判定</el-button>
              </template>
              <template v-else-if="order.status === 'responsibility_judged'">
                <el-button @click="showOrderDetail(order)" size="small">详情</el-button>
              </template>
              <template v-else>
                <el-button @click="viewOrder(order.id)" size="small">详情</el-button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-dialog title="处理售后" :visible.sync="afterSalesVisible" width="600px">
      <div v-if="currentOrder">
        <h4>订单信息</h4>
        <p>订单号：{{ currentOrder.id }}</p>
        <p>客户：{{ currentOrder.customer_name }}</p>
        <p>产品：{{ currentOrder.product_type }}</p>
        
        <h4 style="margin-top: 16px;">售后记录</h4>
        <div v-for="record in currentOrder.after_sales_records" :key="record.id">
          <p><strong>类型：</strong>{{ getAfterSalesType(record.type) }}</p>
          <p><strong>描述：</strong>{{ record.description }}</p>
          <p><strong>状态：</strong>{{ getAfterSalesStatus(record.status) }}</p>
          <div v-if="record.photos && record.photos.length">
            <strong>照片：</strong>
            <div class="photos">
              <img v-for="(photo, idx) in record.photos" :key="idx" :src="photo" style="width: 100px; height: 100px; margin-right: 8px;" />
            </div>
          </div>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="afterSalesVisible = false">取消</el-button>
        <el-button @click="submitProcess" type="primary">开始处理</el-button>
      </div>
    </el-dialog>

    <el-dialog title="驳回售后" :visible.sync="rejectVisible">
      <el-form :model="rejectForm">
        <el-form-item label="驳回原因">
          <el-textarea v-model="rejectForm.reason" rows="3" placeholder="请填写驳回原因" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button @click="submitReject" type="danger">确认驳回</el-button>
      </div>
    </el-dialog>

    <el-dialog title="责任判定" :visible.sync="judgmentVisible" width="600px">
      <el-form :model="judgmentForm">
        <el-form-item label="责任方">
          <el-select v-model="judgmentForm.responsible_party">
            <el-option label="安装师傅" value="technician" />
            <el-option label="客户" value="customer" />
            <el-option label="供应商" value="supplier" />
            <el-option label="公司" value="company" />
          </el-select>
        </el-form-item>
        <el-form-item label="判定理由">
          <el-textarea v-model="judgmentForm.reason" rows="4" placeholder="请详细描述判定理由" />
        </el-form-item>
        <el-form-item label="证据材料">
          <el-input v-model="judgmentForm.evidence" placeholder="输入证据照片URL，多个用逗号分隔" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="judgmentVisible = false">取消</el-button>
        <el-button @click="submitJudgment" type="primary">确认判定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="订单详情" :visible.sync="detailVisible" width="800px">
      <div v-if="currentOrder">
        <h4>责任判定结果</h4>
        <p><strong>责任方：</strong>{{ getResponsiblePartyText(currentOrder.responsibility_result?.responsible_party) }}</p>
        <p><strong>判定理由：</strong>{{ currentOrder.responsibility_result?.reason }}</p>
        <p><strong>状态：</strong>{{ getResponsibilityStatus(currentOrder.responsibility_result?.status) }}</p>
        
        <h4 style="margin-top: 16px;">操作</h4>
        <div v-if="currentOrder.responsibility_result?.status === 'confirmed'">
          <el-button @click="appealResponsibility" type="warning" size="small">申诉</el-button>
          <el-button @click="finalizeResponsibility" type="primary" size="small">终审</el-button>
        </div>
        <div v-else>
          <p>该判定已{{ currentOrder.responsibility_result?.status === 'final' ? '终审' : '申诉中' }}</p>
        </div>
      </div>
    </el-dialog>

    <el-dialog title="申诉" :visible.sync="appealVisible">
      <el-form :model="appealForm">
        <el-form-item label="申诉理由">
          <el-textarea v-model="appealForm.reason" rows="3" placeholder="请填写申诉理由" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="appealVisible = false">取消</el-button>
        <el-button @click="submitAppeal" type="warning">确认申诉</el-button>
      </div>
    </el-dialog>

    <el-dialog title="终审" :visible.sync="finalizeVisible">
      <el-form :model="finalizeForm">
        <el-form-item label="终审说明">
          <el-textarea v-model="finalizeForm.reason" rows="3" placeholder="请填写终审说明（可选）" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="finalizeVisible = false">取消</el-button>
        <el-button @click="submitFinalize" type="primary">确认终审</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrders, getUsers, processAfterSales, rejectAfterSales as apiRejectAfterSales, judgeResponsibility, appealResponsibility as apiAppealResponsibility, finalizeResponsibility as apiFinalizeResponsibility } from '../utils/api'

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const orders = ref([])
const users = ref([])
const filterStatus = ref('')
const keyword = ref('')

const afterSalesVisible = ref(false)
const rejectVisible = ref(false)
const judgmentVisible = ref(false)
const detailVisible = ref(false)
const appealVisible = ref(false)
const finalizeVisible = ref(false)
const currentOrder = ref(null)

const rejectForm = reactive({ reason: '' })
const judgmentForm = reactive({ responsible_party: '', reason: '', evidence: '' })
const appealForm = reactive({ reason: '' })
const finalizeForm = reactive({ reason: '' })

const stats = computed(() => ({
  pending: orders.value.filter(o => o.after_sales_records?.some(r => r.status === 'pending')).length,
  processing: orders.value.filter(o => o.status === 'after_sales').length,
  judged: orders.value.filter(o => o.status === 'responsibility_judged').length,
  resolved: orders.value.filter(o => o.status === 'resolved').length
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

const hasPendingAfterSales = (order) => {
  return order.after_sales_records?.some(r => r.status === 'pending')
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

const getResponsiblePartyText = (party) => {
  const map = { technician: '安装师傅', customer: '客户', supplier: '供应商', company: '公司' }
  return map[party] || party
}

const getResponsibilityStatus = (status) => {
  const map = { confirmed: '待确认', appeal: '申诉中', final: '已终审' }
  return map[status] || status
}

const handleAfterSales = (order) => {
  currentOrder.value = order
  afterSalesVisible.value = true
}

const submitProcess = async () => {
  const pendingRecord = currentOrder.value.after_sales_records.find(r => r.status === 'pending')
  if (!pendingRecord) {
    ElMessage.error('没有待处理的售后记录')
    return
  }
  
  try {
    await processAfterSales(pendingRecord.id, user.value.id)
    ElMessage.success('已开始处理')
    afterSalesVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const rejectAfterSales = (order) => {
  currentOrder.value = order
  rejectForm.reason = ''
  rejectVisible.value = true
}

const submitReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.error('请填写驳回原因')
    return
  }
  
  const pendingRecord = currentOrder.value.after_sales_records.find(r => r.status === 'pending')
  if (!pendingRecord) {
    ElMessage.error('没有待处理的售后记录')
    return
  }
  
  try {
    await apiRejectAfterSales(pendingRecord.id, rejectForm.reason, user.value.id)
    ElMessage.success('已驳回')
    rejectVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const showJudgmentModal = (order) => {
  currentOrder.value = order
  judgmentForm.responsible_party = ''
  judgmentForm.reason = ''
  judgmentForm.evidence = ''
  judgmentVisible.value = true
}

const submitJudgment = async () => {
  if (!judgmentForm.responsible_party || !judgmentForm.reason.trim()) {
    ElMessage.error('请选择责任方并填写判定理由')
    return
  }
  
  try {
    const evidence = judgmentForm.evidence.split(',').filter(p => p.trim())
    await judgeResponsibility(currentOrder.value.id, {
      responsible_party: judgmentForm.responsible_party,
      reason: judgmentForm.reason,
      evidence: evidence.length > 0 ? evidence : undefined
    }, user.value.id)
    ElMessage.success('责任判定完成')
    judgmentVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const showOrderDetail = (order) => {
  currentOrder.value = order
  detailVisible.value = true
}

const appealResponsibility = () => {
  appealForm.reason = ''
  appealVisible.value = true
}

const submitAppeal = async () => {
  if (!appealForm.reason.trim()) {
    ElMessage.error('请填写申诉理由')
    return
  }
  
  try {
    await apiAppealResponsibility(currentOrder.value.responsibility_result.id, appealForm.reason)
    ElMessage.success('已提交申诉')
    appealVisible.value = false
    detailVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const finalizeResponsibility = () => {
  finalizeForm.reason = ''
  finalizeVisible.value = true
}

const submitFinalize = async () => {
  try {
    await apiFinalizeResponsibility(currentOrder.value.responsibility_result.id, finalizeForm.reason || undefined)
    ElMessage.success('已终审')
    finalizeVisible.value = false
    detailVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const viewOrder = (id) => {
  window.location.href = `/order/${id}`
}

const goToReview = () => {
  window.location.href = '/responsibility-review'
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
  background: #eb2f96;
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

.status-scheduled { color: #999; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; }
.status-accepted { color: #1890ff; background: #e6f7ff; padding: 4px 8px; border-radius: 4px; }
.status-progress { color: #faad14; background: #fff7e6; padding: 4px 8px; border-radius: 4px; }
.status-completed { color: #52c41a; background: #f6ffed; padding: 4px 8px; border-radius: 4px; }
.status-leakage { color: #f5222d; background: #fff1f0; padding: 4px 8px; border-radius: 4px; }
.status-aftersales { color: #eb2f96; background: #fff0f6; padding: 4px 8px; border-radius: 4px; }
.status-judged { color: #722ed1; background: #f9f0ff; padding: 4px 8px; border-radius: 4px; }
.status-resolved { color: #13c2c2; background: #e6fffb; padding: 4px 8px; border-radius: 4px; }
</style>