<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import type { Order, OrderStatus } from '../types'
import { 
  ElButton, ElTable, ElTableColumn, ElCard, ElBadge, 
  ElModal, ElForm, ElFormItem, ElInput, ElCheckbox,
  ElMessage, ElTag, ElButtonGroup, ElUpload, ElImage
} from 'element-plus'

const router = useRouter()
const store = useAppStore()

const orders = ref<Order[]>([])
const users = ref<any[]>([])

const showAccessoryModal = ref(false)
const showPhotoModal = ref(false)
const showCompleteModal = ref(false)
const selectedOrder = ref<Order | null>(null)
const answerText = ref('')
const selectedQuestionId = ref('')

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

const myOrders = computed(() => {
  const userId = store.state.currentUser?.id
  return orders.value.filter(o => o.installer_id === userId)
})

const assignedOrders = computed(() => myOrders.value.filter(o => o.status === 'assigned'))
const acceptedOrders = computed(() => myOrders.value.filter(o => o.status === 'accepted'))
const inProgressOrders = computed(() => myOrders.value.filter(o => o.status === 'in_progress'))
const reworkOrders = computed(() => myOrders.value.filter(o => 
  o.status === 'rework_requested' || o.status === 'rework_in_progress'
))
const completedOrders = computed(() => myOrders.value.filter(o => 
  ['completed', 'rework_completed', 'liability_pending', 'liability_done', 'resolved'].includes(o.status)
))

const init = async () => {
  await store.loadOrders()
  orders.value = store.state.orders
  users.value = await store.getUsers()
}

const handleViewOrder = (order: Order) => {
  router.push(`/order/${order.id}`)
}

const handleAcceptOrder = async (order: Order) => {
  let success = false
  if (order.status === 'rework_requested') {
    const reworkRecord = order.after_sales_records[0]
    if (reworkRecord) {
      success = await store.acceptRework(reworkRecord.id)
    }
  } else {
    success = await store.acceptOrder(order.id)
  }
  
  if (success) {
    ElMessage.success(order.status === 'rework_requested' ? '已接受返工任务' : '接单成功')
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const handleStartOrder = async (order: Order) => {
  const success = await store.startOrder(order.id)
  if (success) {
    ElMessage.success('开始安装')
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const handleMarkAccessory = async (orderId: string | number, accessoryId: string | number, installed: boolean) => {
  const success = await store.markAccessoryInstalled(String(accessoryId))
  if (success) {
    await store.loadOrders()
    orders.value = store.state.orders
    selectedOrder.value = orders.value.find(o => o.id === orderId) || null
  }
}

const handleCompleteOrder = async () => {
  if (!selectedOrder.value) return
  
  const success = await store.completeOrder(selectedOrder.value.id)
  if (success) {
    ElMessage.success(selectedOrder.value.status === 'rework_in_progress' ? '返工完成' : '安装完成')
    showCompleteModal.value = false
    selectedOrder.value = null
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const handleAnswerQuestion = async () => {
  if (!selectedQuestionId.value || !answerText.value) {
    ElMessage.error('请填写回答内容')
    return
  }
  
  const success = await store.answerQuestion(selectedQuestionId.value, answerText.value)
  if (success) {
    ElMessage.success('回答已提交')
    answerText.value = ''
    selectedQuestionId.value = ''
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const openAccessoryModal = (order: Order) => {
  selectedOrder.value = order
  showAccessoryModal.value = true
}

const openCompleteModal = (order: Order) => {
  selectedOrder.value = order
  showCompleteModal.value = true
}

const logout = () => {
  store.logout()
  router.push('/login')
}

const getUserName = (userId: string | undefined) => {
  if (!userId) return '-'
  const user = users.value.find(u => u.id === userId)
  return user?.name || '-'
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
          <p class="text-sm text-gray-500">安装师傅工作台</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-sm font-medium text-gray-700">{{ store.state.currentUser?.name }}</div>
            <div class="text-xs text-gray-500">安装师傅</div>
          </div>
          <ElButton @click="logout" type="text">退出登录</ElButton>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-yellow-600">{{ assignedOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">待接单</div>
        </ElCard>
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ acceptedOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">已接单</div>
        </ElCard>
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ inProgressOrders.length + reworkOrders.filter(o => o.status === 'rework_in_progress').length }}</div>
          <div class="text-sm text-gray-500 mt-1">进行中</div>
        </ElCard>
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-red-600">{{ reworkOrders.filter(o => o.status === 'rework_requested').length }}</div>
          <div class="text-sm text-gray-500 mt-1">待返工</div>
        </ElCard>
      </div>

      <div class="flex items-center gap-4 mb-6">
        <ElButton @click="init">刷新列表</ElButton>
        <router-link to="/history" class="el-button el-button--default">
          历史记录
        </router-link>
      </div>

      <div v-if="assignedOrders.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
          待接单
        </h2>
        <ElCard>
          <ElTable :data="assignedOrders" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn prop="address" label="地址" />
            <ElTableColumn prop="scheduled_time" label="预约时间" width="150">
              <template #default="scope">
                {{ new Date(scope.row.scheduled_time).toLocaleString('zh-CN') }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="160">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton size="small" type="primary" @click="handleAcceptOrder(scope.row)">接单</ElButton>
                  <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
                </ElButtonGroup>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="reworkOrders.filter(o => o.status === 'rework_requested').length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          待返工
        </h2>
        <ElCard>
          <ElTable :data="reworkOrders.filter(o => o.status === 'rework_requested')" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn label="报修原因" width="200">
              <template #default="scope">
                {{ scope.row.after_sales_records[0]?.description || '-' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="160">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton size="small" type="danger" @click="handleAcceptOrder(scope.row)">接受返工</ElButton>
                  <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
                </ElButtonGroup>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="acceptedOrders.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          已接单待开始
        </h2>
        <ElCard>
          <ElTable :data="acceptedOrders" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn prop="address" label="地址" />
            <ElTableColumn prop="scheduled_time" label="预约时间" width="150">
              <template #default="scope">
                {{ new Date(scope.row.scheduled_time).toLocaleString('zh-CN') }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="160">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton size="small" type="primary" @click="handleStartOrder(scope.row)">开始安装</ElButton>
                  <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
                </ElButtonGroup>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="inProgressOrders.length + reworkOrders.filter(o => o.status === 'rework_in_progress').length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          安装/返工中
        </h2>
        <ElCard>
          <ElTable :data="[...inProgressOrders, ...reworkOrders.filter(o => o.status === 'rework_in_progress')]" border>
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
            <ElTableColumn label="配件" width="100">
              <template #default="scope">
                <span class="text-sm">
                  {{ scope.row.accessories.filter(a => a.installed).length }}/{{ scope.row.accessories.length }}
                </span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="200">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton size="small" @click="openAccessoryModal(scope.row)">配件管理</ElButton>
                  <ElButton size="small" @click="openCompleteModal(scope.row)">完成</ElButton>
                  <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
                </ElButtonGroup>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="myOrders.length > 0 && myOrders.some(o => o.questions.some(q => !q.answer))" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
          待回答追问
        </h2>
        <ElCard>
          <ElTable :data="myOrders.filter(o => o.questions.some(q => !q.answer))" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn label="追问内容" width="300">
              <template #default="scope">
                <div v-for="q in scope.row.questions.filter(q => !q.answer)" :key="q.id" class="mb-2">
                  <div class="text-sm text-gray-700">{{ q.question }}</div>
                  <div class="text-xs text-gray-400">{{ getUserName(q.asked_by) }} - {{ new Date(q.asked_at).toLocaleString() }}</div>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="160">
              <template #default="scope">
                <ElButton size="small" type="primary" @click="() => { selectedQuestionId = scope.row.questions.find(q => !q.answer)?.id || ''; answerText = ''; }">回答</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="completedOrders.length > 0">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
          已完成
        </h2>
        <ElCard>
          <ElTable :data="completedOrders" border>
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
            <ElTableColumn label="操作" width="120">
              <template #default="scope">
                <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>
    </main>

    <ElModal v-model="showAccessoryModal" title="配件管理" @close="showAccessoryModal = false">
      <div v-if="selectedOrder" class="mb-4">
        <p class="text-sm text-gray-600">订单号：{{ selectedOrder.id }}</p>
        <p class="text-sm text-gray-600">产品：{{ selectedOrder.product_type }}</p>
      </div>
      <ElTable v-if="selectedOrder" :data="selectedOrder.accessories" border>
        <ElTableColumn prop="name" label="配件名称" />
        <ElTableColumn prop="quantity" label="数量" width="80" />
        <ElTableColumn label="已安装" width="100">
          <template #default="scope">
            <ElCheckbox 
              :checked="scope.row.installed" 
              @change="(val: boolean) => handleMarkAccessory(selectedOrder!.id, scope.row.id, val)"
            />
          </template>
        </ElTableColumn>
      </ElTable>
      <template #footer>
        <ElButton @click="showAccessoryModal = false">关闭</ElButton>
      </template>
    </ElModal>

    <ElModal v-model="showCompleteModal" title="完成安装" @close="showCompleteModal = false">
      <div v-if="selectedOrder" class="mb-4">
        <p class="text-sm text-gray-600">订单号：{{ selectedOrder.id }}</p>
        <p class="text-sm text-gray-600">客户：{{ selectedOrder.customer_name }}</p>
        <p class="text-sm text-gray-600">产品：{{ selectedOrder.product_type }}</p>
        <div class="mt-2 p-2 bg-gray-50 rounded">
          <div class="text-sm">配件安装情况：</div>
          <div class="text-sm">已安装 {{ selectedOrder.accessories.filter(a => a.installed).length }} / {{ selectedOrder.accessories.length }}</div>
        </div>
      </div>
      <template #footer>
        <ElButton @click="showCompleteModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleCompleteOrder">确认完成</ElButton>
      </template>
    </ElModal>
  </div>
</template>