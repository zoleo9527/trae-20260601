<template>
  <div class="repair-orders">
    <div class="toolbar">
      <el-button @click="showCreateDialog = true" type="primary">新建工单</el-button>
      <el-button @click="batchUpdate" type="success" :disabled="selectedOrders.length === 0">
        批量更新状态 ({{ selectedOrders.length }})
      </el-button>
      <div class="filters">
        <el-select v-model="filterStatus" placeholder="状态筛选">
          <el-option label="全部" value="" />
          <el-option label="待处理" value="pending" />
          <el-option label="维修中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索客户或工单号" style="width: 200px" />
      </div>
    </div>

    <el-table :data="filteredOrders" border @selection-change="handleSelectionChange">
      <el-table-column type="selection" />
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
      <el-table-column prop="created_at" label="创建时间" />
      <el-table-column prop="created_by" label="创建人" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button @click="viewOrder(scope.row.id)" type="text">查看</el-button>
          <el-button @click="deleteOrder(scope.row.id)" type="text" danger>删除</el-button>
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

    <el-dialog title="批量更新状态" v-model="showBatchDialog" width="500px">
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
          <el-input v-model="batchForm.technician" placeholder="请输入维修师姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchUpdate" :loading="submitting">确定</el-button>
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
const submitting = ref(false)
const user = JSON.parse(localStorage.getItem('user') || '{}')

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

const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    const matchesStatus = !filterStatus.value || order.status === filterStatus.value
    const matchesSearch = !searchKeyword.value || 
      order.customer_name.includes(searchKeyword.value) ||
      order.order_no.includes(searchKeyword.value)
    return matchesStatus && matchesSearch
  })
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

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.repair-orders {
  padding: 20px;
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
</style>
