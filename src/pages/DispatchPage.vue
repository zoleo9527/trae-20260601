<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import type { Order, OrderStatus } from '../types'
import { 
  ElButton, ElTable, ElTableColumn, ElCard, ElBadge, 
  ElModal, ElForm, ElFormItem, ElInput, ElSelect, 
  ElOption, ElDatePicker, ElMessage, ElTag, ElPopconfirm,
  ElNotification, ElButtonGroup
} from 'element-plus'

const router = useRouter()
const store = useAppStore()

const orders = ref<Order[]>([])
const technicians = ref<any[]>([])
const statuses = ref<any[]>([])
const productTypes = ref<string[]>([])

const showCreateModal = ref(false)
const showAssignModal = ref(false)
const showAskModal = ref(false)
const selectedOrder = ref<Order | null>(null)
const selectedTechnician = ref('')

const newOrder = ref({
  customer_name: '',
  customer_phone: '',
  address: '',
  product_type: '',
  product_model: '',
  scheduled_date: ''
})

const questionText = ref('')

const statusLabels: Record<OrderStatus, string> = {
  pending: '待分配',
  assigned: '已分配',
  accepted: '已接单',
  in_progress: '安装中',
  completed: '已完成',
  rework_requested: '待返工',
  rework_in_progress: '返工中',
  rework_completed: '返工完成',
  liability_pending: '待责任判定',
  liability_done: '责任已判定',
  resolved: '已解决'
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'warning',
  assigned: 'info',
  accepted: 'primary',
  in_progress: 'success',
  completed: 'success',
  rework_requested: 'danger',
  rework_in_progress: 'danger',
  rework_completed: 'primary',
  liability_pending: 'warning',
  liability_done: 'success',
  resolved: 'success'
}

const filteredOrders = computed(() => {
  return orders.value
})

const pendingOrders = computed(() => orders.value.filter(o => o.status === 'pending'))
const processingOrders = computed(() => orders.value.filter(o => 
  ['assigned', 'accepted', 'in_progress'].includes(o.status)
))
const completedOrders = computed(() => orders.value.filter(o => 
  ['completed', 'resolved'].includes(o.status)
))
const reworkOrders = computed(() => orders.value.filter(o => 
  ['rework_requested', 'rework_in_progress', 'rework_completed', 'liability_pending', 'liability_done'].includes(o.status)
))

const init = async () => {
  await store.loadOrders()
  orders.value = store.state.orders
  technicians.value = await store.getUsers('technician')
  statuses.value = await store.getOrderStatuses()
  productTypes.value = await store.getProductTypes()
  await store.loadAlerts()
}

const handleViewOrder = (order: Order) => {
  router.push(`/order/${order.id}`)
}

const handleCreateOrder = async () => {
  if (!newOrder.value.customer_name || !newOrder.value.customer_phone || !newOrder.value.address || !newOrder.value.product_type) {
    ElMessage.error('请填写必填字段')
    return
  }
  
  const result = await store.createOrder({
    ...newOrder.value,
    scheduled_date: newOrder.value.scheduled_date ? new Date(newOrder.value.scheduled_date).toISOString() : new Date().toISOString()
  })
  
  if (result) {
    ElMessage.success('订单创建成功')
    showCreateModal.value = false
    newOrder.value = {
      customer_name: '',
      customer_phone: '',
      address: '',
      product_type: '',
      product_model: '',
      scheduled_date: ''
    }
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const handleAssign = async () => {
  if (!selectedOrder.value || !selectedTechnician.value) {
    ElMessage.error('请选择订单和师傅')
    return
  }
  
  const success = await store.assignOrder(selectedOrder.value.id, selectedTechnician.value)
  if (success) {
    ElMessage.success('分配成功')
    showAssignModal.value = false
    selectedOrder.value = null
    selectedTechnician.value = ''
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const openAssignModal = (order: Order) => {
  selectedOrder.value = order
  selectedTechnician.value = ''
  showAssignModal.value = true
}

const handleAskQuestion = async () => {
  if (!selectedOrder.value || !questionText.value) {
    ElMessage.error('请输入追问内容')
    return
  }
  
  const success = await store.askQuestion(selectedOrder.value.id, questionText.value)
  if (success) {
    ElMessage.success('追问已发送')
    showAskModal.value = false
    questionText.value = ''
    selectedOrder.value = null
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const openAskModal = (order: Order) => {
  selectedOrder.value = order
  questionText.value = ''
  showAskModal.value = true
}

const logout = () => {
  store.logout()
  router.push('/login')
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-800">🛁 卫浴安装管理系统</h1>
          <p class="text-sm text-gray-500">调度员工作台</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-sm font-medium text-gray-700">{{ store.state.currentUser?.name }}</div>
            <div class="text-xs text-gray-500">调度员</div>
          </div>
          <ElButton @click="logout" type="text">退出登录</ElButton>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ pendingOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">待分配</div>
        </ElCard>
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ processingOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">进行中</div>
        </ElCard>
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-red-600">{{ reworkOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">返工/判定</div>
        </ElCard>
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-gray-600">{{ completedOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">已完成</div>
        </ElCard>
      </div>

      <div class="flex items-center gap-4 mb-6">
        <ElButton type="primary" @click="showCreateModal = true">
          + 创建订单
        </ElButton>
        <ElButton @click="init">刷新列表</ElButton>
        <router-link to="/history" class="el-button el-button--default">
          历史记录
        </router-link>
      </div>

      <div v-if="pendingOrders.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
          待分配订单
        </h2>
        <ElCard>
          <ElTable :data="pendingOrders" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn prop="scheduled_date" label="预约时间" width="150">
              <template #default="scope">
                {{ new Date(scope.row.scheduled_date).toLocaleString('zh-CN') }}
              </template>
            </ElTableColumn>
            <ElTableColumn prop="address" label="地址" />
            <ElTableColumn label="操作" width="160">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton size="small" @click="openAssignModal(scope.row)">分配</ElButton>
                  <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
                </ElButtonGroup>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="processingOrders.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          进行中订单
        </h2>
        <ElCard>
          <ElTable :data="processingOrders" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn prop="scheduled_date" label="预约时间" width="150">
              <template #default="scope">
                {{ new Date(scope.row.scheduled_date).toLocaleString('zh-CN') }}
              </template>
            </ElTableColumn>
            <ElTableColumn prop="status" label="状态" width="100">
              <template #default="scope">
                <ElTag :type="statusColors[scope.row.status]">
                  {{ statusLabels[scope.row.status] }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="160">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton size="small" @click="openAskModal(scope.row)">追问</ElButton>
                  <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
                </ElButtonGroup>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="reworkOrders.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          返工与责任判定
        </h2>
        <ElCard>
          <ElTable :data="reworkOrders" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn prop="status" label="状态" width="120">
              <template #default="scope">
                <ElTag :type="statusColors[scope.row.status]">
                  {{ statusLabels[scope.row.status] }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="售后记录" width="150">
              <template #default="scope">
                <span v-if="scope.row.after_sales_records.length > 0" class="text-red-500">
                  {{ scope.row.after_sales_records.length }}条报修
                </span>
                <span v-else>-</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="160">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton size="small" @click="openAskModal(scope.row)">追问</ElButton>
                  <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
                </ElButtonGroup>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="completedOrders.length > 0">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
          已完成订单
        </h2>
        <ElCard>
          <ElTable :data="completedOrders" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn prop="status" label="状态" width="100">
              <template #default="scope">
                <ElTag :type="statusColors[scope.row.status]">
                  {{ statusLabels[scope.row.status] }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="120">
              <template #default="scope">
                <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>
    </main>

    <ElModal v-model="showCreateModal" title="创建订单" @close="showCreateModal = false">
      <ElForm :model="newOrder" label-width="100px">
        <ElFormItem label="客户姓名" required>
          <ElInput v-model="newOrder.customer_name" />
        </ElFormItem>
        <ElFormItem label="联系电话" required>
          <ElInput v-model="newOrder.customer_phone" type="tel" />
        </ElFormItem>
        <ElFormItem label="安装地址" required>
          <ElInput v-model="newOrder.address" />
        </ElFormItem>
        <ElFormItem label="产品类型" required>
          <ElSelect v-model="newOrder.product_type">
            <ElOption v-for="type in productTypes" :key="type" :label="type" :value="type" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="产品型号">
          <ElInput v-model="newOrder.product_model" />
        </ElFormItem>
        <ElFormItem label="预约时间">
          <ElDatePicker v-model="newOrder.scheduled_date" type="datetime" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreateOrder">创建</ElButton>
      </template>
    </ElModal>

    <ElModal v-model="showAssignModal" title="分配师傅" @close="showAssignModal = false">
      <div v-if="selectedOrder" class="mb-4">
        <p class="text-sm text-gray-600">订单号：{{ selectedOrder.id }}</p>
        <p class="text-sm text-gray-600">客户：{{ selectedOrder.customer_name }}</p>
        <p class="text-sm text-gray-600">产品：{{ selectedOrder.product_type }}</p>
      </div>
      <ElForm label-width="100px">
        <ElFormItem label="选择师傅" required>
          <ElSelect v-model="selectedTechnician">
            <ElOption v-for="tech in technicians" :key="tech.id" :label="tech.name" :value="tech.id" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showAssignModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleAssign">确认分配</ElButton>
      </template>
    </ElModal>

    <ElModal v-model="showAskModal" title="追问进度" @close="showAskModal = false">
      <div v-if="selectedOrder" class="mb-4">
        <p class="text-sm text-gray-600">订单号：{{ selectedOrder.id }}</p>
        <p class="text-sm text-gray-600">客户：{{ selectedOrder.customer_name }}</p>
      </div>
      <ElForm label-width="100px">
        <ElFormItem label="追问内容" required>
          <ElInput v-model="questionText" type="textarea" rows="3" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showAskModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleAskQuestion">发送追问</ElButton>
      </template>
    </ElModal>
  </div>
</template>