<template>
  <div class="history-detail-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">全链路追溯详情</h1>
        <p class="page-subtitle">
          {{ rental?.orderNo }} · {{ rental?.equipment.name }}
        </p>
      </div>
      <div class="header-actions">
        <el-button @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <el-button type="primary" @click="handleAction" v-if="showActionButton">
          <el-icon><Setting /></el-icon>
          {{ actionButtonText }}
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="info-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><InfoFilled /></el-icon>
              订单基本信息
            </div>
          </template>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="订单号">{{ rental.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="客户">
              {{ rental.customer.name }} ({{ rental.customer.phone }})
            </el-descriptions-item>
            <el-descriptions-item label="租期">
              {{ rental.rentalPeriod.days }}天
            </el-descriptions-item>
            <el-descriptions-item label="器材名称">{{ rental.equipment.name }}</el-descriptions-item>
            <el-descriptions-item label="序列号">{{ rental.equipment.serialNo }}</el-descriptions-item>
            <el-descriptions-item label="设备原值">¥{{ rental.equipment.originalValue.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="押金">¥{{ rental.deposit.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="日租金">¥{{ rental.dailyRate }}/天</el-descriptions-item>
            <el-descriptions-item label="租金总额">¥{{ rental.totalAmount }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card v-if="rental.outboundInspection" class="inspection-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Upload /></el-icon>
              出库验机记录
              <el-tag size="small" type="success" style="margin-left: 10px;">
                验机员：{{ rental.outboundInspection.inspector }}
              </el-tag>
              <el-tag size="small" style="margin-left: 5px;">
                {{ formatTime(rental.outboundInspection.inspectedAt) }}
              </el-tag>
            </div>
          </template>

          <div class="inspection-summary">
            <div class="summary-label">整体结论：</div>
            <el-tag :type="rental.outboundInspection.overallResult === 'abnormal' ? 'warning' : 'success'">
              {{ rental.outboundInspection.overallResult === 'abnormal' ? '有异常备注' : '全部正常' }}
            </el-tag>
          </div>

          <div class="inspection-items">
            <div
              v-for="item in inspectionItems"
              :key="item.key"
              class="inspection-item-row"
              :class="{ 'key-point': rental.outboundInspection.items[item.key]?.keyPoint }"
            >
              <div class="item-header">
                <span class="item-name">{{ item.label }}</span>
                <el-tag
                  v-if="rental.outboundInspection.items[item.key]?.keyPoint"
                  size="small"
                  type="warning"
                >
                  <el-icon><StarFilled /></el-icon>
                  关键判断
                </el-tag>
              </div>
              <div class="item-result">
                <el-tag :type="getResultType(rental.outboundInspection.items[item.key]?.result)">
                  {{ getResultLabel(rental.outboundInspection.items[item.key]?.result) }}
                </el-tag>
              </div>
              <div class="item-desc">
                {{ rental.outboundInspection.items[item.key]?.description || '-' }}
              </div>
              <div v-if="rental.outboundInspection.items[item.key]?.photos?.length > 0" class="item-photos">
                <div
                  v-for="(photo, idx) in rental.outboundInspection.items[item.key].photos"
                  :key="idx"
                  class="photo-thumb"
                >
                  <img :src="getPhotoUrl(photo)" alt="验机照片" />
                </div>
              </div>
            </div>
          </div>

          <div class="inspection-summary-text">
            <strong>验机总结：</strong>{{ rental.outboundInspection.summary }}
          </div>

          <div class="customer-confirm">
            <el-tag :type="rental.outboundInspection.customerConfirmed ? 'success' : 'danger'">
              {{ rental.outboundInspection.customerConfirmed ? '客户已确认' : '客户未确认' }}
            </el-tag>
          </div>
        </el-card>

        <el-card v-if="rental.returnInspection" class="inspection-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Download /></el-icon>
              归还复核记录
              <el-tag size="small" type="warning" style="margin-left: 10px;">
                复核员：{{ rental.returnInspection.inspector }}
              </el-tag>
              <el-tag size="small" style="margin-left: 5px;">
                {{ formatTime(rental.returnInspection.inspectedAt) }}
              </el-tag>
            </div>
          </template>

          <div class="inspection-summary">
            <div class="summary-label">整体结论：</div>
            <el-tag :type="rental.returnInspection.overallResult === 'abnormal' ? 'danger' : 'success'">
              {{ rental.returnInspection.overallResult === 'abnormal' ? '发现异常' : '全部正常' }}
            </el-tag>
          </div>

          <div v-if="rental.returnInspection.overallResult === 'abnormal'" class="anomaly-report">
            <div class="anomaly-title">
              <el-icon color="#ef4444"><Warning /></el-icon>
              异常情况报告
            </div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="异常类型">
                {{ rental.returnInspection.anomalyReport?.type === 'damage' ? '器材损坏' : rental.returnInspection.anomalyReport?.type === 'missing' ? '配件缺失' : '其他' }}
              </el-descriptions-item>
              <el-descriptions-item label="预估费用">
                ¥{{ rental.returnInspection.anomalyReport?.estimatedCost?.toLocaleString() || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="客户确认">
                <el-tag :type="rental.returnInspection.anomalyReport?.customerAcknowledged ? 'success' : 'warning'">
                  {{ rental.returnInspection.anomalyReport?.customerAcknowledged ? '已确认' : '未确认' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="待处理事项">
                {{ rental.returnInspection.anomalyReport?.pendingAction || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="情况说明" :span="2">
                {{ rental.returnInspection.anomalyReport?.description || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="comparison-section" v-if="differences && differences.length > 0">
            <div class="comparison-title">
              <el-icon><Comparison /></el-icon>
              与出库状态差异对比（{{ differences.length }}项）
            </div>
            <div
              v-for="diff in differences"
              :key="diff.item"
              class="diff-item"
            >
              <div class="diff-item-header">
                <span class="diff-item-name">{{ getLabelByKey(diff.item) }}</span>
                <el-tag size="small" type="danger">状态不一致</el-tag>
              </div>
              <div class="diff-compare">
                <div class="diff-side outbound">
                  <div class="diff-label">出库状态</div>
                  <el-tag :type="diff.outbound.result === 'abnormal' ? 'danger' : 'success'" size="small">
                    {{ diff.outbound.result === 'abnormal' ? '异常' : '正常' }}
                  </el-tag>
                  <p class="diff-desc">{{ diff.outbound.description }}</p>
                </div>
                <div class="diff-arrow">→</div>
                <div class="diff-side return">
                  <div class="diff-label">归还状态</div>
                  <el-tag :type="diff.return.result === 'abnormal' ? 'danger' : 'success'" size="small">
                    {{ diff.return.result === 'abnormal' ? '异常' : '正常' }}
                  </el-tag>
                  <p class="diff-desc">{{ diff.return.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="inspection-summary-text">
            <strong>复核总结：</strong>{{ rental.returnInspection.summary }}
          </div>
        </el-card>

        <el-card v-if="rental.repairRecord" class="repair-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Tools /></el-icon>
              维修记录
            </div>
          </template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="维修单号">{{ rental.repairRecord.repairOrderNo }}</el-descriptions-item>
            <el-descriptions-item label="维修状态">
              <el-tag :type="rental.repairRecord.status === 'repairing' ? 'warning' : 'success'">
                {{ rental.repairRecord.status === 'repairing' ? '维修中' : '已完成' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="维修厂商">{{ rental.repairRecord.repairShop }}</el-descriptions-item>
            <el-descriptions-item label="送修日期">{{ rental.repairRecord.sendDate }}</el-descriptions-item>
            <el-descriptions-item label="预估完成">{{ rental.repairRecord.estimatedCompletion }}</el-descriptions-item>
            <el-descriptions-item label="预估费用">¥{{ rental.repairRecord.estimatedCost.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="损坏描述" :span="2">{{ rental.repairRecord.damageDescription }}</el-descriptions-item>
            <el-descriptions-item label="维修内容" :span="2">{{ rental.repairRecord.repairDescription }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ rental.repairRecord.notes }}</el-descriptions-item>
          </el-descriptions>
          <div class="integration-point" style="margin-top: 12px;">
            <el-icon><InfoFilled /></el-icon>
            维修记录待集成维修管理系统。位置：<code>src/data/mockData.js - mockRepairRecords</code>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="status-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><TrendCharts /></el-icon>
              当前状态
            </div>
          </template>
          <div class="current-status">
            <el-tag :type="getStatusType(rental.status)" effect="dark" size="large">
              {{ getStatusLabel(rental.status) }}
            </el-tag>
          </div>
          <StatusTimeline :history="rental.statusHistory" />
        </el-card>

        <el-card class="deposit-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Money /></el-icon>
              押金信息
            </div>
          </template>
          <div v-if="depositInfo" class="deposit-info">
            <div class="deposit-row">
              <span class="deposit-label">押金金额</span>
              <span class="deposit-value">¥{{ depositInfo.amount.toLocaleString() }}</span>
            </div>
            <div class="deposit-row">
              <span class="deposit-label">支付方式</span>
              <el-tag size="small">
                {{ depositInfo.paymentMethod === 'wechat' ? '微信支付' : '支付宝' }}
              </el-tag>
            </div>
            <div class="deposit-row">
              <span class="deposit-label">支付时间</span>
              <span>{{ formatTime(depositInfo.paidAt) }}</span>
            </div>
            <div class="deposit-row">
              <span class="deposit-label">退还状态</span>
              <el-tag :type="depositInfo.refunded ? 'success' : 'warning'">
                {{ depositInfo.refunded ? '已退还' : '未退还' }}
              </el-tag>
            </div>
            <div v-if="depositInfo.refunded" class="deposit-row">
              <span class="deposit-label">退还时间</span>
              <span>{{ formatTime(depositInfo.refundedAt) }}</span>
            </div>
            <div v-if="depositInfo.holdReason" class="deposit-row">
              <span class="deposit-label">冻结原因</span>
              <span class="hold-reason">{{ depositInfo.holdReason }}</span>
            </div>
          </div>
          <div class="deposit-actions" v-if="canRefund">
            <el-button
              type="primary"
              size="small"
              :disabled="depositInfo?.refunded || !canHandleDeposit"
              @click="handleRefund"
            >
              退还押金
            </el-button>
          </div>
          <div class="integration-point" style="margin-top: 10px;">
            <el-icon><InfoFilled /></el-icon>
            押金截图和退款凭证待集成支付系统。
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="actionDialogVisible"
      :title="actionDialogTitle"
      width="500px"
    >
      <el-form v-if="currentAction === 'handle_anomaly'" :model="anomalyForm" label-width="100px">
        <el-form-item label="处理方式">
          <el-radio-group v-model="anomalyForm.action">
            <el-radio value="send_repair">送修处理</el-radio>
            <el-radio value="close">协商解决，结案</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="anomalyForm.action === 'send_repair'">
          <el-form-item label="维修厂商">
            <el-input v-model="anomalyForm.repairShop" placeholder="请输入维修厂商名称" />
          </el-form-item>
          <el-form-item label="预估完成">
            <el-date-picker
              v-model="anomalyForm.estimatedCompletion"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择预估完成日期"
            />
          </el-form-item>
          <el-form-item label="预估费用">
            <el-input-number
              v-model="anomalyForm.estimatedCost"
              :min="0"
              prefix="¥"
              placeholder="预估费用"
            />
          </el-form-item>
        </template>
        <el-form-item label="处理说明">
          <el-input
            v-model="anomalyForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入处理说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAction">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'
import { STATUS_FLOW, STATUS_LABELS, INSPECTION_ITEMS, mockDeposits, ABNORMAL_TYPES } from '@/data/mockData'
import StatusTimeline from '@/components/StatusTimeline.vue'

const route = useRoute()
const router = useRouter()
const equipmentStore = useEquipmentStore()
const authStore = useAuthStore()

const rentalId = computed(() => route.params.id)
const rental = computed(() => equipmentStore.getById(rentalId.value))

const inspectionItems = ref(INSPECTION_ITEMS)

const depositInfo = computed(() =>
  mockDeposits.find(d => d.rentalId === rentalId.value))

const differences = computed(() =>
  equipmentStore.compareInspections(rentalId.value))

const showActionButton = computed(() => {
  const status = rental.value?.status
  if (status === STATUS_FLOW.ABNORMAL) {
    return authStore.hasPermission('anomaly:handle')
  }
  if (status === STATUS_FLOW.IN_REPAIR) {
    return authStore.hasPermission('repair:manage')
  }
  if (status === STATUS_FLOW.RETURN_COMPLETED) {
    return authStore.hasPermission('deposit:refund') || authStore.hasPermission('anomaly:handle')
  }
  return false
})

const actionButtonText = computed(() => {
  if (rental.value?.status === STATUS_FLOW.ABNORMAL) return '处理异常'
  if (rental.value?.status === STATUS_FLOW.IN_REPAIR) return '完成维修'
  if (rental.value?.status === STATUS_FLOW.RETURN_COMPLETED) return '结案'
  return '处理'
})

const canRefund = computed(() =>
  rental.value?.status === STATUS_FLOW.RETURN_COMPLETED &&
  depositInfo.value && !depositInfo.value.refunded)

const canHandleDeposit = computed(() =>
  authStore.hasPermission('deposit:refund'))

const getStatusLabel = (status) => STATUS_LABELS[status]?.label || status
const getStatusType = (status) => STATUS_LABELS[status]?.type || 'info'

const getResultType = (result) => {
  if (result === 'abnormal') return 'danger'
  if (result === 'not_applicable') return 'info'
  return 'success'
}

const getResultLabel = (result) => {
  if (result === 'abnormal') return '异常'
  if (result === 'not_applicable') return '不适用'
  return '正常'
}

const getLabelByKey = (key) => {
  return INSPECTION_ITEMS.find(i => i.key === key)?.label || key
}

const getPhotoUrl = (photo) => {
  if (photo.startsWith('#mock') || photo.startsWith('#upload')) {
    return `https://picsum.photos/200/200?random=${photo}`
  }
  return photo || 'https://picsum.photos/200/200'
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

const actionDialogVisible = ref(false)
const currentAction = ref('')
const actionDialogTitle = ref('')

const anomalyForm = reactive({
  action: 'send_repair',
  repairShop: '',
  estimatedCompletion: '',
  estimatedCost: 0,
  notes: ''
})

const handleAction = () => {
  if (rental.value?.status === STATUS_FLOW.ABNORMAL) {
    currentAction.value = 'handle_anomaly'
    actionDialogTitle.value = '异常处理'
    actionDialogVisible.value = true
  } else if (rental.value?.status === STATUS_FLOW.IN_REPAIR) {
    ElMessageBox.prompt('请输入实际维修费用', '完成维修', {
      inputPattern: /^\d+$/,
      inputErrorMessage: '请输入数字'
    }).then(({ value }) => {
      equipmentStore.completeRepair(rentalId.value, parseInt(value))
      ElMessage.success('维修已完成')
    }).catch(() => {})
  } else if (rental.value?.status === STATUS_FLOW.RETURN_COMPLETED) {
    ElMessageBox.confirm('确认结案？押金将退还客户。', '结案确认', {
      type: 'warning'
    }).then(() => {
      equipmentStore.closeRental(rentalId.value, '经理确认结案')
      ElMessage.success('已结案')
    }).catch(() => {})
  }
}

const submitAction = () => {
  if (!anomalyForm.notes.trim()) {
    ElMessage.warning('请输入处理说明')
    return
  }

  if (anomalyForm.action === 'send_repair') {
    if (!anomalyForm.repairShop.trim()) {
      ElMessage.warning('请输入维修厂商')
      return
    }
    if (!anomalyForm.estimatedCompletion) {
      ElMessage.warning('请选择预估完成日期')
      return
    }
  }

  equipmentStore.handleAnomaly(rentalId.value, anomalyForm)
  ElMessage.success('异常已处理')
  actionDialogVisible.value = false
}

const handleRefund = () => {
  ElMessageBox.confirm(
    `确认退还押金 ¥${depositInfo.value.amount.toLocaleString()} 给客户？`,
    '退还押金确认',
    { type: 'warning' }
  ).then(() => {
    depositInfo.value.refunded = true
    depositInfo.value.refundedAt = Date.now()
    depositInfo.value.refundMethod = 'original'
    ElMessage.success('押金已退还（模拟）')
  }).catch(() => {})
}

onMounted(() => {
  if (!rental.value) {
    ElMessage.error('找不到该订单')
    router.back()
  }
})
</script>

<style scoped>
.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.current-status {
  text-align: center;
  margin-bottom: 16px;
}

.current-status .el-tag {
  font-size: 16px;
  padding: 8px 20px;
}

.inspection-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.summary-label {
  font-weight: 600;
  color: #374151;
}

.inspection-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inspection-item-row {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.inspection-item-row.key-point {
  background: #fef3c7;
  border-color: #fcd34d;
  border-left: 4px solid #f59e0b;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.item-name {
  font-weight: 600;
  color: #374151;
}

.item-result {
  margin-bottom: 6px;
}

.item-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.item-photos {
  display: flex;
  gap: 6px;
}

.photo-thumb {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.inspection-summary-text {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  font-size: 13px;
  color: #1e40af;
}

.customer-confirm {
  margin-top: 12px;
  text-align: right;
}

.anomaly-report {
  margin-bottom: 16px;
}

.anomaly-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #b91c1c;
  margin-bottom: 12px;
}

.comparison-section {
  margin-top: 16px;
}

.comparison-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.diff-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.diff-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.diff-item-name {
  font-weight: 600;
  color: #991b1b;
}

.diff-compare {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.diff-side {
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  background: #fff;
}

.diff-side.outbound {
  border: 1px solid #bbf7d0;
}

.diff-side.return {
  border: 1px solid #bfdbfe;
}

.diff-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 6px;
}

.diff-desc {
  font-size: 12px;
  color: #374151;
  margin: 6px 0 0 0;
}

.diff-arrow {
  display: flex;
  align-items: center;
  font-size: 20px;
  color: #ef4444;
  font-weight: bold;
}

.deposit-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.deposit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deposit-label {
  font-size: 13px;
  color: #6b7280;
}

.deposit-value {
  font-weight: 600;
  color: #059669;
}

.hold-reason {
  color: #b45309;
  font-size: 12px;
}

.deposit-actions {
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}
</style>
