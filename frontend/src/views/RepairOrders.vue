<template>
  <div class="repair-orders">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
      <el-tag :type="getRoleTagType(userRole)">{{ getRoleText(userRole) }}</el-tag>
    </div>
    
    <div class="toolbar">
      <template v-if="canCreate">
        <el-button @click="showCreateDialog = true" type="primary">新建工单</el-button>
      </template>
      <template v-else>
        <el-button disabled title="当前角色无法新建工单">新建工单</el-button>
      </template>
      
      <template v-if="canBatchUpdate">
        <el-button 
          @click="batchUpdate" 
          type="success" 
          :disabled="selectedOrders.length === 0"
          :title="selectedOrders.length === 0 ? '请先选择工单' : ''"
        >
          批量派工 ({{ selectedOrders.length }})
        </el-button>
      </template>
      
      <div class="filters">
        <el-select v-model="filterStatus" placeholder="状态筛选">
          <el-option label="全部" value="" />
          <el-option label="待处理" value="pending" />
          <el-option label="维修中" :disabled="userRole === 'technician'" value="processing" />
          <el-option label="已完成" :disabled="userRole === 'technician'" value="completed" />
          <el-option label="已取消" :disabled="userRole === 'technician'" value="cancelled" />
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索客户或工单号" style="width: 200px" />
      </div>
    </div>

    <div v-if="userRole === 'technician'" class="role-hint">
      <el-alert title="维修师提示" type="info" show-icon>
        您只能查看和处理分配给您的工单，如需领用备件请进入【备件领用】页面。
      </el-alert>
    </div>

    <el-table :data="filteredOrders" border @selection-change="handleSelectionChange">
      <el-table-column v-if="canBatchUpdate" type="selection" />
      <el-table-column prop="order_no" label="工单号" />
      <el-table-column prop="customer_name" label="客户" />
      <el-table-column prop="phone" label="联系电话" />
      <el-table-column prop="device_model" label="机型" />
      <el-table-column prop="problem_description" label="问题描述" :show-overflow-tooltip="true" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="assigned_to" label="维修师">
        <template #default="scope">
          <span v-if="scope.row.assigned_to">{{ scope.row.assigned_to }}</span>
          <span v-else class="unassigned">待分配</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" />
      <el-table-column prop="created_by" label="创建人" />
      <el-table-column label="待办">
        <template #default="scope">
          <template v-if="scope.row.status === 'pending'">
            <template v-if="userRole === 'manager'">
              <el-button @click="assignOrder(scope.row)" type="text" size="small">分配</el-button>
            </template>
            <template v-else-if="userRole === 'technician'">
              <el-button @click="startRepair(scope.row)" type="text" size="small">接单</el-button>
            </template>
            <template v-else>
              <span class="no-action">-</span>
            </template>
          </template>
          <template v-else-if="scope.row.status === 'processing' && scope.row.assigned_to === user.username">
            <el-button @click="finishRepair(scope.row)" type="text" size="small">完成</el-button>
          </template>
          <template v-else>
            <span class="no-action">-</span>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button @click="viewOrder(scope.row.id)" type="text">查看</el-button>
          <template v-if="canDelete">
            <el-button @click="deleteOrder(scope.row.id)" type="text" danger>删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="新建工单" v-model="showCreateDialog" width="600px">
      <el-form :model="orderForm">
        <el-form-item label="客户姓名">
          <el-input v-model="orderForm.customer_name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="orderForm.phone" />
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="orderForm.device_model" />
        </el-form-item>
        <el-form-item label="设备序列号">
          <el-input v-model="orderForm.device_serial" />
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input type="textarea" v-model="orderForm.problem_description" rows="3" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="orderForm.priority">
            <el-option label="普通" value="normal" />
            <el-option label="加急" value="urgent" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createOrder">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog title="批量派工" v-model="showBatchDialog" width="500px">
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="目标状态">
          <el-select v-model="batchForm.status">
            <el-option label="待处理" value="pending" />
            <el-option label="维修中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配维修师">
          <el-select v-model="batchForm.technician" placeholder="请选择维修师">
            <el-option label="维修师" value="technician" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchUpdate" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog title="分配工单" v-model="showAssignDialog" width="400px">
      <el-form :model="assignForm" label-width="80px">
        <el-form-item label="维修师">
          <el-select v-model="assignForm.technician" placeholder="请选择维修师">
            <el-option label="维修师" value="technician" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { repairs, records as recordsApi } from '../api'

const router = useRouter()

const orders = ref([])
const filterStatus = ref('')
const searchKeyword = ref('')
const selectedOrders = ref([])
const showCreateDialog = ref(false)
const showBatchDialog = ref(false)
const showAssignDialog = ref(false)
const submitting = ref(false)
const currentAssignOrder = ref(null)

const user = JSON.parse(localStorage.getItem('user') || '{}')
const userRole = computed(() => user.role || 'admin')

const canCreate = computed(() => ['admin', 'frontdesk', 'manager'].includes(userRole.value))
const canBatchUpdate = computed(() => ['admin', 'manager'].includes(userRole.value))
const canDelete = computed(() => ['admin', 'manager'].includes(userRole.value))

const pageTitle = computed(() => {
  const titles = {
    admin: '维修工单管理',
    frontdesk: '新建工单',
    technician: '待修工单',
    manager: '工单管理'
  }
  return titles[userRole.value] || '维修工单'
})

const orderForm = reactive({
  customer_name: '',
  phone: '',
  device_model: '',
  device_serial: '',
  problem_description: '',
  priority: 'normal',
  created_by: user.username
})

const batchForm = reactive({
  status: 'processing',
  technician: ''
})

const assignForm = reactive({
  technician: ''
})

const filteredOrders = computed(() => {
  let result = orders.value
  
  if (userRole.value === 'technician') {
    result = result.filter(o => o.assigned_to === user.username || o.status === 'pending')
  }
  
  if (filterStatus.value) {
    result = result.filter(o => o.status === filterStatus.value)
  }
  
  if (searchKeyword.value) {
    result = result.filter(o => 
      o.customer_name.includes(searchKeyword.value) ||
      o.order_no.includes(searchKeyword.value)
    )
  }
  
  return result
})

const getStatusTagType = (status) => {
  const types = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '维修中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getRoleTagType = (role) => {
  const types = {
    admin: 'info',
    frontdesk: 'primary',
    technician: 'success',
    manager: 'warning'
  }
  return types[role] || 'info'
}

const getRoleText = (role) => {
  const texts = {
    admin: '管理员',
    frontdesk: '前台',
    technician: '维修师',
    manager: '店长'
  }
  return texts[role] || role
}

const loadOrders = async () => {
  try {
    const res = await repairs.getOrders()
    orders.value = res.data
  } catch (error) {
    console.error('加载工单失败:', error)
  }
}

const createOrder = async () => {
  try {
    await repairs.createOrder(orderForm)
    showCreateDialog.value = false
    ElMessage.success('工单创建成功')
    loadOrders()
    orderForm.customer_name = ''
    orderForm.phone = ''
    orderForm.device_model = ''
    orderForm.device_serial = ''
    orderForm.problem_description = ''
    orderForm.priority = 'normal'
  } catch (error) {
    ElMessage.error('创建工单失败')
  }
}

const viewOrder = (id) => {
  router.push(`/order/${id}`)
}

const deleteOrder = async (id) => {
  try {
    await repairs.deleteOrder(id)
    ElMessage.success('工单已删除')
    loadOrders()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleSelectionChange = (val) => {
  selectedOrders.value = val
}

const batchUpdate = () => {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择工单')
    return
  }
  showBatchDialog.value = true
}

const confirmBatchUpdate = async () => {
  if (!batchForm.status) {
    ElMessage.warning('请选择目标状态')
    return
  }
  
  submitting.value = true
  try {
    const orderIds = selectedOrders.value.map(o => o.id)
    const res = await recordsApi.batchUpdateStatus({
      order_ids: orderIds,
      status: batchForm.status,
      technician: batchForm.technician || user.username
    })
    
    ElMessage.success(res.data.message || '批量更新成功')
    showBatchDialog.value = false
    selectedOrders.value = []
    batchForm.status = 'processing'
    batchForm.technician = ''
    loadOrders()
  } catch (error) {
    console.error('批量更新失败:', error)
    ElMessage.error('批量更新失败')
  } finally {
    submitting.value = false
  }
}

const assignOrder = (order) => {
  currentAssignOrder.value = order
  showAssignDialog.value = true
}

const confirmAssign = async () => {
  if (!assignForm.technician) {
    ElMessage.warning('请选择维修师')
    return
  }
  
  try {
    await repairs.updateOrder(currentAssignOrder.value.id, {
      status: 'processing',
      assigned_to: assignForm.technician
    })
    
    await repairs.createRecord(currentAssignOrder.value.id, {
      status: 'processing',
      description: `分配给 ${assignForm.technician}`,
      technician: user.username
    })
    
    ElMessage.success('工单已分配')
    showAssignDialog.value = false
    assignForm.technician = ''
    currentAssignOrder.value = null
    loadOrders()
  } catch (error) {
    ElMessage.error('分配失败')
  }
}

const startRepair = async (order) => {
  try {
    await repairs.updateOrder(order.id, {
      status: 'processing',
      assigned_to: user.username
    })
    
    await repairs.createRecord(order.id, {
      status: 'processing',
      description: '开始维修',
      technician: user.username
    })
    
    ElMessage.success('已接单，开始维修')
    loadOrders()
  } catch (error) {
    ElMessage.error('接单失败')
  }
}

const finishRepair = async (order) => {
  try {
    await repairs.updateOrder(order.id, {
      status: 'completed'
    })
    
    await repairs.createRecord(order.id, {
      status: 'completed',
      description: '维修完成',
      technician: user.username
    })
    
    ElMessage.success('维修完成')
    loadOrders()
  } catch (error) {
    ElMessage.error('完成失败')
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.repair-orders {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 10px;
}

.role-hint {
  margin-bottom: 20px;
}

.unassigned {
  color: #e6a23c;
}

.no-action {
  color: #999;
}
</style>
