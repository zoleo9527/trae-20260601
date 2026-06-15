<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import type { Order, OrderStatus, LiabilityResult } from '../types'
import { 
  ElButton, ElTable, ElTableColumn, ElCard, ElBadge, 
  ElModal, ElForm, ElFormItem, ElInput, ElSelect, 
  ElOption, ElMessage, ElTag, ElButtonGroup, ElTextarea,
  ElInputNumber, ElPopconfirm
} from 'element-plus'

const router = useRouter()
const store = useAppStore()

const orders = ref<Order[]>([])
const users = ref<any[]>([])

const showReportModal = ref(false)
const showJudgmentModal = ref(false)
const showRejectModal = ref(false)
const selectedOrder = ref<Order | null>(null)
const selectedRecordId = ref('')
const selectedResultId = ref('')

const reportForm = ref({
  description: '',
  photos: [] as string[]
})

const judgmentForm = ref({
  responsible_party: '' as LiabilityResult,
  reason: '',
  evidence: [] as string[],
  compensation_amount: 0
})

const rejectForm = ref({
  reason: '',
  additional_evidence_required: [] as string[]
})

const evidenceInput = ref('')
const additionalEvidenceInput = ref('')

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

const liabilityLabels: Record<LiabilityResult, string> = {
  technician: '安装师傅',
  customer: '用户',
  supplier: '供应商',
  company: '公司'
}

const completedOrders = computed(() => orders.value.filter(o => o.status === 'completed'))
const reworkOrders = computed(() => orders.value.filter(o => 
  o.status === 'rework_requested' || o.status === 'rework_in_progress'
))
const liabilityPendingOrders = computed(() => orders.value.filter(o => o.status === 'liability_pending'))
const liabilityDoneOrders = computed(() => orders.value.filter(o => 
  ['liability_done', 'resolved'].includes(o.status)
))
const hasAfterSalesOrders = computed(() => orders.value.filter(o => o.after_sales_records.length > 0))

const init = async () => {
  await store.loadOrders()
  orders.value = store.state.orders
  users.value = await store.getUsers()
}

const handleViewOrder = (order: Order) => {
  router.push(`/order/${order.id}`)
}

const openReportModal = (order: Order) => {
  selectedOrder.value = order
  reportForm.value = { description: '', photos: [] }
  showReportModal.value = true
}

const handleReportLeakage = async () => {
  if (!selectedOrder.value || !reportForm.value.description) {
    ElMessage.error('请填写报修描述')
    return
  }
  
  const success = await store.reportLeakage(
    selectedOrder.value.id, 
    reportForm.value.description,
    reportForm.value.photos.length > 0 ? reportForm.value.photos : undefined
  )
  
  if (success) {
    ElMessage.success('报修成功')
    showReportModal.value = false
    selectedOrder.value = null
    reportForm.value = { description: '', photos: [] }
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const openJudgmentModal = (order: Order) => {
  selectedOrder.value = order
  judgmentForm.value = {
    responsible_party: 'technician',
    reason: '',
    evidence: [],
    compensation_amount: 0
  }
  showJudgmentModal.value = true
}

const handleJudgeResponsibility = async () => {
  if (!selectedOrder.value || !judgmentForm.value.reason) {
    ElMessage.error('请填写判定理由')
    return
  }
  
  const success = await store.judgeResponsibility(
    selectedOrder.value.id,
    judgmentForm.value.responsible_party,
    judgmentForm.value.reason,
    judgmentForm.value.evidence,
    judgmentForm.value.compensation_amount
  )
  
  if (success) {
    ElMessage.success('责任判定完成')
    showJudgmentModal.value = false
    selectedOrder.value = null
    judgmentForm.value = { responsible_party: 'technician', reason: '', evidence: [], compensation_amount: 0 }
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const openRejectModal = (order: Order) => {
  selectedOrder.value = order
  selectedResultId.value = order.responsibility_result?.id || ''
  rejectForm.value = { reason: '', additional_evidence_required: [] }
  showRejectModal.value = true
}

const handleRejectResponsibility = async () => {
  if (!selectedResultId.value || !rejectForm.value.reason) {
    ElMessage.error('请填写驳回理由')
    return
  }
  
  const success = await store.rejectResponsibility(
    selectedResultId.value,
    rejectForm.value.reason,
    rejectForm.value.additional_evidence_required
  )
  
  if (success) {
    ElMessage.success('责任判定已驳回')
    showRejectModal.value = false
    selectedOrder.value = null
    selectedResultId.value = ''
    rejectForm.value = { reason: '', additional_evidence_required: [] }
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const handleFinalizeResponsibility = async (resultId: string) => {
  const success = await store.finalizeResponsibility(resultId)
  if (success) {
    ElMessage.success('已终审')
    await store.loadOrders()
    orders.value = store.state.orders
  }
}

const addEvidence = () => {
  if (evidenceInput.value.trim()) {
    judgmentForm.value.evidence.push(evidenceInput.value.trim())
    evidenceInput.value = ''
  }
}

const removeEvidence = (index: number) => {
  judgmentForm.value.evidence.splice(index, 1)
}

const addAdditionalEvidence = () => {
  if (additionalEvidenceInput.value.trim()) {
    rejectForm.value.additional_evidence_required.push(additionalEvidenceInput.value.trim())
    additionalEvidenceInput.value = ''
  }
}

const removeAdditionalEvidence = (index: number) => {
  rejectForm.value.additional_evidence_required.splice(index, 1)
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

const getLatestAfterSalesRecord = (order: Order) => {
  return order.after_sales_records[order.after_sales_records.length - 1]
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
          <p class="text-sm text-gray-500">售后客服工作台</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-sm font-medium text-gray-700">{{ store.state.currentUser?.name }}</div>
            <div class="text-xs text-gray-500">售后客服</div>
          </div>
          <ElButton @click="logout" type="text">退出登录</ElButton>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ completedOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">已完成订单</div>
        </ElCard>
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-red-600">{{ reworkOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">返工中</div>
        </ElCard>
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-yellow-600">{{ liabilityPendingOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">待责任判定</div>
        </ElCard>
        <ElCard class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ liabilityDoneOrders.length }}</div>
          <div class="text-sm text-gray-500 mt-1">已判定</div>
        </ElCard>
      </div>

      <div class="flex items-center gap-4 mb-6">
        <ElButton @click="init">刷新列表</ElButton>
        <router-link to="/history" class="el-button el-button--default">
          历史记录
        </router-link>
      </div>

      <div v-if="completedOrders.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          已完成订单 - 可发起报修
        </h2>
        <ElCard>
          <ElTable :data="completedOrders" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn prop="address" label="地址" />
            <ElTableColumn label="操作" width="160">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton size="small" type="danger" @click="openReportModal(scope.row)">发起报修</ElButton>
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
          返工中订单
        </h2>
        <ElCard>
          <ElTable :data="reworkOrders" border>
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
            <ElTableColumn label="报修原因" width="200">
              <template #default="scope">
                {{ getLatestAfterSalesRecord(scope.row)?.description || '-' }}
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

      <div v-if="liabilityPendingOrders.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
          待责任判定
        </h2>
        <ElCard>
          <ElTable :data="liabilityPendingOrders" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn label="报修原因" width="200">
              <template #default="scope">
                {{ getLatestAfterSalesRecord(scope.row)?.description || '-' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="驳回记录" width="100">
              <template #default="scope">
                <span v-if="scope.row.rejection_records.length > 0" class="text-orange-500">
                  {{ scope.row.rejection_records.length }}次驳回
                </span>
                <span v-else>-</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="160">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton size="small" type="primary" @click="openJudgmentModal(scope.row)">责任判定</ElButton>
                  <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
                </ElButtonGroup>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="liabilityDoneOrders.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          责任已判定
        </h2>
        <ElCard>
          <ElTable :data="liabilityDoneOrders" border>
            <ElTableColumn prop="id" label="订单号" width="120" />
            <ElTableColumn prop="customer_name" label="客户" width="100" />
            <ElTableColumn prop="product_type" label="产品" width="120" />
            <ElTableColumn label="责任方" width="100">
              <template #default="scope">
                <ElTag :type="scope.row.responsibility_result?.responsible_party === 'technician' ? 'danger' : 'info'">
                  {{ liabilityLabels[scope.row.responsibility_result?.responsible_party || 'company'] }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="赔付金额" width="120">
              <template #default="scope">
                ¥{{ scope.row.responsibility_result?.compensation_amount || 0 }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" width="100">
              <template #default="scope">
                <ElTag :type="scope.row.responsibility_result?.status === 'final' ? 'success' : 'warning'">
                  {{ scope.row.responsibility_result?.status === 'final' ? '已终审' : '待终审' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="200">
              <template #default="scope">
                <ElButtonGroup>
                  <ElButton v-if="scope.row.responsibility_result?.status === 'confirmed'" size="small" type="danger" @click="openRejectModal(scope.row)">驳回</ElButton>
                  <ElButton v-if="scope.row.responsibility_result?.status === 'confirmed'" size="small" type="success" @click="handleFinalizeResponsibility(scope.row.responsibility_result!.id)">终审</ElButton>
                  <ElButton size="small" @click="handleViewOrder(scope.row)">详情</ElButton>
                </ElButtonGroup>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>

      <div v-if="hasAfterSalesOrders.length > 0">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
          所有售后记录
        </h2>
        <ElCard>
          <ElTable :data="hasAfterSalesOrders" border>
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
            <ElTableColumn label="售后记录" width="250">
              <template #default="scope">
                <div v-for="record in scope.row.after_sales_records" :key="record.id" class="mb-1">
                  <div class="text-sm">{{ record.type === 'leakage' ? '漏水' : record.type === 'damage' ? '损坏' : '其他' }}: {{ record.description }}</div>
                  <div class="text-xs text-gray-400">状态: {{ record.status === 'pending' ? '待处理' : record.status === 'processing' ? '处理中' : record.status === 'resolved' ? '已解决' : '已驳回' }}</div>
                </div>
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

    <ElModal v-model="showReportModal" title="发起漏水报修" @close="showReportModal = false">
      <div v-if="selectedOrder" class="mb-4">
        <p class="text-sm text-gray-600">订单号：{{ selectedOrder.id }}</p>
        <p class="text-sm text-gray-600">客户：{{ selectedOrder.customer_name }}</p>
        <p class="text-sm text-gray-600">产品：{{ selectedOrder.product_type }}</p>
      </div>
      <ElForm :model="reportForm" label-width="100px">
        <ElFormItem label="报修描述" required>
          <ElTextarea v-model="reportForm.description" rows="3" placeholder="请描述漏水情况..." />
        </ElFormItem>
        <ElFormItem label="漏水照片">
          <ElInput 
            v-model="evidenceInput" 
            placeholder="输入照片URL"
            @keyup.enter="() => { if (evidenceInput) { reportForm.photos.push(evidenceInput); evidenceInput = ''; } }"
          />
          <div v-if="reportForm.photos.length > 0" class="mt-2">
            <div v-for="(photo, index) in reportForm.photos" :key="index" class="flex items-center gap-2 mb-1">
              <span class="text-sm text-gray-600">{{ photo }}</span>
              <ElButton size="small" @click="reportForm.photos.splice(index, 1)">删除</ElButton>
            </div>
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showReportModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleReportLeakage">提交报修</ElButton>
      </template>
    </ElModal>

    <ElModal v-model="showJudgmentModal" title="责任判定" @close="showJudgmentModal = false">
      <div v-if="selectedOrder" class="mb-4">
        <p class="text-sm text-gray-600">订单号：{{ selectedOrder.id }}</p>
        <p class="text-sm text-gray-600">客户：{{ selectedOrder.customer_name }}</p>
        <p class="text-sm text-gray-600">报修原因：{{ getLatestAfterSalesRecord(selectedOrder)?.description }}</p>
      </div>
      <ElForm :model="judgmentForm" label-width="100px">
        <ElFormItem label="责任方" required>
          <ElSelect v-model="judgmentForm.responsible_party">
            <ElOption label="安装师傅" value="technician" />
            <ElOption label="用户" value="customer" />
            <ElOption label="供应商" value="supplier" />
            <ElOption label="公司" value="company" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="判定理由" required>
          <ElTextarea v-model="judgmentForm.reason" rows="3" placeholder="请说明判定理由..." />
        </ElFormItem>
        <ElFormItem label="证据">
          <div class="flex gap-2 mb-2">
            <ElInput v-model="evidenceInput" placeholder="输入证据描述" style="flex: 1" />
            <ElButton @click="addEvidence">添加</ElButton>
          </div>
          <div v-if="judgmentForm.evidence.length > 0" class="space-y-1">
            <div v-for="(item, index) in judgmentForm.evidence" :key="index" class="flex items-center gap-2">
              <span class="text-sm text-gray-600">{{ item }}</span>
              <ElButton size="small" @click="removeEvidence(index)">删除</ElButton>
            </div>
          </div>
        </ElFormItem>
        <ElFormItem label="赔付金额">
          <ElInputNumber v-model="judgmentForm.compensation_amount" :min="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showJudgmentModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleJudgeResponsibility">确认判定</ElButton>
      </template>
    </ElModal>

    <ElModal v-model="showRejectModal" title="驳回责任判定" @close="showRejectModal = false">
      <div v-if="selectedOrder" class="mb-4">
        <p class="text-sm text-gray-600">订单号：{{ selectedOrder.id }}</p>
        <p class="text-sm text-gray-600">当前责任方：{{ liabilityLabels[selectedOrder.responsibility_result?.responsible_party || 'company'] }}</p>
        <p class="text-sm text-gray-600">当前理由：{{ selectedOrder.responsibility_result?.reason }}</p>
      </div>
      <ElForm :model="rejectForm" label-width="100px">
        <ElFormItem label="驳回理由" required>
          <ElTextarea v-model="rejectForm.reason" rows="3" placeholder="请说明驳回原因..." />
        </ElFormItem>
        <ElFormItem label="需要补充的证据">
          <div class="flex gap-2 mb-2">
            <ElInput v-model="additionalEvidenceInput" placeholder="输入需要补充的证据" style="flex: 1" />
            <ElButton @click="addAdditionalEvidence">添加</ElButton>
          </div>
          <div v-if="rejectForm.additional_evidence_required.length > 0" class="space-y-1">
            <div v-for="(item, index) in rejectForm.additional_evidence_required" :key="index" class="flex items-center gap-2">
              <span class="text-sm text-gray-600">{{ item }}</span>
              <ElButton size="small" @click="removeAdditionalEvidence(index)">删除</ElButton>
            </div>
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showRejectModal = false">取消</ElButton>
        <ElButton type="danger" @click="handleRejectResponsibility">确认驳回</ElButton>
      </template>
    </ElModal>
  </div>
</template>