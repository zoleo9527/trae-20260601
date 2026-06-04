<template>
  <div class="app-container" style="height: 100%; display: flex; flex-direction: column;">
    <header class="app-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-icon :size="28"><Hospital /></el-icon>
        <div>
          <h1 style="font-size: 18px; margin: 0; font-weight: 600;">医美机构 · 退款协商与疗程核销系统</h1>
          <p style="font-size: 12px; margin: 2px 0 0; opacity: 0.85;">状态口径一致 · 责任人不脱节 · 历史可追溯</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 13px; opacity: 0.9;">当前角色：</span>
          <el-radio-group v-model="currentRole" size="small" @change="handleRoleChange">
            <el-radio-button value="CONSULTANT">
              <el-icon style="margin-right: 4px;"><UserFilled /></el-icon>咨询师
            </el-radio-button>
            <el-radio-button value="DOCTOR_ASSISTANT">
              <el-icon style="margin-right: 4px;"><Stethoscope /></el-icon>医助
            </el-radio-button>
            <el-radio-button value="CUSTOMER_SERVICE">
              <el-icon style="margin-right: 4px;"><Headset /></el-icon>客服
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="current-user" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 20px;">
          <span style="font-size: 20px;">{{ currentUser.avatar }}</span>
          <span style="font-size: 13px;">{{ currentUser.name }}</span>
        </div>
      </div>
    </header>

    <FlowGuide />

    <div class="main-content" style="flex: 1; display: flex; overflow: hidden;">
      <div class="left-panel" style="width: 520px; flex-shrink: 0; border-right: 1px solid #e4e7ed; display: flex; flex-direction: column; background: #fff;">
        <div class="filter-bar" style="padding: 12px 16px; border-bottom: 1px solid #e4e7ed; background: #fafafa; flex-shrink: 0;">
          <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
            <el-tag
              v-for="status in statusOptions"
              :key="status.value"
              :type="statusFilter === status.value ? '' : 'info'"
              :effect="statusFilter === status.value ? 'dark' : 'plain'"
              style="cursor: pointer; transition: all 0.2s;"
              @click="setStatusFilter(status.value)"
            >
              {{ status.label }}
              <span style="margin-left: 4px; opacity: 0.8;">({{ getStatusCount(status.value) }})</span>
            </el-tag>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <el-tag
              v-for="flow in flowOptions"
              :key="flow.value"
              :type="flowFilter === flow.value ? flow.type : 'info'"
              :effect="flowFilter === flow.value ? 'dark' : 'plain'"
              style="cursor: pointer;"
              @click="setFlowFilter(flow.value)"
            >
              {{ flow.label }}
            </el-tag>
            <div style="flex: 1;"></div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索客户/订单号"
              size="small"
              style="width: 200px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <div class="batch-bar" v-if="selectedIds.length > 0" style="padding: 10px 16px; background: #ecf5ff; border-bottom: 1px solid #d9ecff; display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
          <span style="color: #409eff; font-size: 13px;">
            <el-icon style="margin-right: 4px;"><CircleCheck /></el-icon>
            已选择 {{ selectedIds.length }} 项
          </span>
          <el-button size="small" type="primary" @click="handleBatchWriteoff" :disabled="!canBatchWriteoff">
            <el-icon><Select /></el-icon>批量核销
          </el-button>
          <el-button size="small" @click="handleBatchTransfer">
            <el-icon><SwitchButton /></el-icon>批量移交
          </el-button>
          <el-button size="small" text @click="clearSelection">取消选择</el-button>
        </div>

        <div class="order-list" style="flex: 1; overflow-y: auto; padding: 8px;">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="order-card card-hover"
            :class="{ 'card-selected': selectedOrderId === order.id }"
            style="border: 1px solid #e4e7ed; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; background: #fff; position: relative;"
            @click="selectOrder(order.id)"
          >
            <div class="card-header" style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-checkbox
                  :model-value="selectedIds.includes(order.id)"
                  @click.stop
                  @change="toggleSelect(order.id)"
                />
                <div>
                  <div style="font-weight: 600; font-size: 14px;">{{ order.customerName }} · {{ order.projectName }}</div>
                  <div style="font-size: 12px; color: #909399; margin-top: 2px;">{{ order.id }}</div>
                </div>
              </div>
              <span class="status-tag" :class="getStatusClass(order.currentStatus)">
                {{ getStatusLabel(order.currentStatus) }}
              </span>
            </div>

            <div class="card-info" style="display: flex; gap: 16px; font-size: 12px; color: #606266; margin-bottom: 8px;">
              <span>
                <el-icon style="margin-right: 2px;"><Money /></el-icon>
                ¥{{ order.paidAmount.toLocaleString() }}
              </span>
              <span>
                <el-icon style="margin-right: 2px;"><Calendar /></el-icon>
                {{ order.treatedCount }}/{{ order.treatmentCount }} 次
              </span>
              <span>
                <el-icon style="margin-right: 2px;"><Clock /></el-icon>
                {{ getLastUpdateTime(order) }}
              </span>
            </div>

            <div class="card-responsible" v-if="order.currentResponsible" style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px dashed #e4e7ed;">
              <span class="responsible-badge">
                <el-icon :size="12"><User /></el-icon>
                {{ order.currentResponsible.name }}
                <span style="opacity: 0.8;">({{ getRoleLabel(order.currentResponsible.role) }})</span>
              </span>
              <span v-if="order.flowLabel" style="font-size: 11px; color: #909399;">
                {{ order.flowLabel }}
              </span>
            </div>

            <div class="transfer-indicator" v-if="order.currentResponsible?.transferFrom" style="position: absolute; right: -1px; top: 50%; transform: translateY(-50%); background: #67c23a; color: #fff; padding: 4px 8px; border-radius: 4px 0 0 4px; font-size: 10px;">
              <el-icon :size="10"><RefreshRight /></el-icon>
              已移交
            </div>
          </div>

          <div v-if="filteredOrders.length === 0" style="text-align: center; padding: 40px; color: #909399;">
            <el-icon :size="48"><Document /></el-icon>
            <p style="margin-top: 8px;">暂无匹配的订单</p>
          </div>
        </div>
      </div>

      <div class="right-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        <SidebarDetail
          v-if="selectedOrder"
          :order="selectedOrder"
          @openRefund="refundDialogVisible = true"
          @openWriteoff="writeoffDialogVisible = true"
          @openSupplement="supplementDialogVisible = true"
        />
        <div v-else style="flex: 1; display: flex; align-items: center; justify-content: center; color: #909399; flex-direction: column; background: #f5f7fa;">
          <el-icon :size="64" style="opacity: 0.3;"><Select /></el-icon>
          <p style="margin-top: 16px; font-size: 14px;">请从左侧选择订单查看详情</p>
          <p style="margin-top: 4px; font-size: 12px; opacity: 0.7;">点击订单卡片可展开侧栏详情</p>
        </div>
      </div>
    </div>

    <RefundDialog v-model="refundDialogVisible" :order="selectedOrder" @success="handleRefundSuccess" />
    <TreatmentWriteoff v-model="writeoffDialogVisible" :order="selectedOrder" @success="handleWriteoffSuccess" />
    <SupplementDialog v-model="supplementDialogVisible" :order="selectedOrder" @success="handleSupplementSuccess" />
    <BatchTransferDialog v-model="batchTransferVisible" :selected-ids="selectedIds" @success="handleBatchTransferSuccess" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { store, actions } from './data/store.js'
import { ORDER_STATUS, ROLES, FLOW_TYPES } from './data/constants.js'
import SidebarDetail from './components/SidebarDetail.vue'
import RefundDialog from './components/RefundDialog.vue'
import TreatmentWriteoff from './components/TreatmentWriteoff.vue'
import SupplementDialog from './components/SupplementDialog.vue'
import BatchTransferDialog from './components/BatchTransferDialog.vue'
import FlowGuide from './components/FlowGuide.vue'
import dayjs from 'dayjs'

const searchKeyword = ref('')
const refundDialogVisible = ref(false)
const writeoffDialogVisible = ref(false)
const supplementDialogVisible = ref(false)
const batchTransferVisible = ref(false)

const currentRole = computed({
  get: () => store.currentRole,
  set: (val) => actions.setRole(val)
})

const currentUser = computed(() => ({
  CONSULTANT: { name: '王咨询师', avatar: '👩‍💼' },
  DOCTOR_ASSISTANT: { name: '赵助理', avatar: '👩‍⚕️' },
  CUSTOMER_SERVICE: { name: '李客服', avatar: '👩‍💻' }
}[store.currentRole]))

const selectedOrderId = computed({
  get: () => store.selectedOrderId,
  set: (val) => actions.selectOrder(val)
})

const selectedOrder = computed(() => store.selectedOrder)

const statusFilter = computed({
  get: () => store.statusFilter,
  set: (val) => actions.setStatusFilter(val)
})

const flowFilter = computed({
  get: () => store.flowFilter,
  set: (val) => actions.setFlowFilter(val)
})

const selectedIds = computed(() => store.selectedIds)

const statusOptions = [
  { value: 'ALL', label: '全部' },
  { value: ORDER_STATUS.PENDING_TREATMENT.value, label: ORDER_STATUS.PENDING_TREATMENT.label },
  { value: ORDER_STATUS.REFUND_NEGOTIATING.value, label: ORDER_STATUS.REFUND_NEGOTIATING.label },
  { value: ORDER_STATUS.REFUND_SUPPLEMENT.value, label: ORDER_STATUS.REFUND_SUPPLEMENT.label },
  { value: ORDER_STATUS.REFUND_APPROVED.value, label: ORDER_STATUS.REFUND_APPROVED.label },
  { value: ORDER_STATUS.TREATMENT_WRITEOFF.value, label: ORDER_STATUS.TREATMENT_WRITEOFF.label },
  { value: ORDER_STATUS.COMPLETED.value, label: ORDER_STATUS.COMPLETED.label }
]

const flowOptions = [
  { value: 'ALL', label: '全部流程', type: 'info' },
  { value: FLOW_TYPES.SMOOTH, label: '顺利流', type: 'success' },
  { value: FLOW_TYPES.PROBLEM, label: '问题流', type: 'warning' },
  { value: FLOW_TYPES.ARCHIVED, label: '已归档', type: 'info' }
]

const filteredOrders = computed(() => {
  if (!searchKeyword.value) return store.filteredOrders
  const kw = searchKeyword.value.toLowerCase()
  return store.filteredOrders.filter(o =>
    o.customerName.includes(kw) ||
    o.id.toLowerCase().includes(kw) ||
    o.projectName.includes(kw)
  )
})

const canBatchWriteoff = computed(() => {
  return store.selectedIds.every(id => {
    const order = store.orders.find(o => o.id === id)
    return order && order.currentStatus === ORDER_STATUS.TREATMENT_WRITEOFF.value
  }) && store.selectedIds.length > 0
})

const getStatusLabel = (status) => ORDER_STATUS[status]?.label || status
const getStatusClass = (status) => ORDER_STATUS[status]?.className || 'status-pending'
const getRoleLabel = (role) => ROLES[role]?.label || role

const getStatusCount = (status) => {
  if (status === 'ALL') return store.orders.length
  return store.orders.filter(o => o.currentStatus === status).length
}

const getLastUpdateTime = (order) => {
  const last = order.history[order.history.length - 1]
  return dayjs(last.timestampRaw).format('MM-DD HH:mm')
}

const setStatusFilter = (val) => { actions.setStatusFilter(val) }
const setFlowFilter = (val) => { actions.setFlowFilter(val) }
const selectOrder = (id) => { actions.selectOrder(id) }
const toggleSelect = (id) => { actions.toggleSelect(id) }
const clearSelection = () => { actions.clearSelection() }
const handleRoleChange = () => {
  ElMessage.success(`已切换到${currentUser.value.name}视角`)
}

const handleBatchWriteoff = async () => {
  await ElMessageBox.confirm(
    `确定批量核销选中的 ${selectedIds.value.length} 个订单吗？`,
    '批量核销确认',
    { type: 'warning' }
  )
  actions.batchWriteoff(selectedIds.value)
  ElMessage.success(`已批量核销 ${selectedIds.value.length} 个订单`)
  clearSelection()
}

const handleBatchTransfer = () => {
  batchTransferVisible.value = true
}

const handleRefundSuccess = () => {
  ElMessage.success('退款处理完成')
  refundDialogVisible.value = false
}

const handleWriteoffSuccess = () => {
  ElMessage.success('疗程核销完成')
  writeoffDialogVisible.value = false
}

const handleSupplementSuccess = () => {
  ElMessage.success('材料已补录')
  supplementDialogVisible.value = false
}

const handleBatchTransferSuccess = () => {
  ElMessage.success('批量移交完成')
  batchTransferVisible.value = false
  clearSelection()
}

onMounted(() => {
  if (store.orders.length > 0) {
    actions.selectOrder(store.orders[0].id)
  }
})
</script>
