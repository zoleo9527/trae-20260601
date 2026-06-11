<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">报备详情</h2>
      <div style="display: flex; gap: 10px;">
        <el-button
          v-if="canEdit"
          type="primary"
          @click="$router.push(`/price-report/create?id=${detail.id}`)"
        >
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button
          v-if="canSubmit"
          type="success"
          @click="handleSubmit"
        >
          提交
        </el-button>
        <el-button
          v-if="canVerify"
          type="success"
          @click="handleVerify"
        >
          核实通过
        </el-button>
        <el-button
          v-if="canReject"
          type="warning"
          @click="showRejectDialog"
        >
          退回
        </el-button>
        <el-button
          v-if="canRaiseException"
          type="danger"
          @click="showExceptionDialog"
        >
          标记异常
        </el-button>
        <el-button
          v-if="canResolveException"
          type="primary"
          @click="showResolveExceptionDialog"
        >
          处理异常
        </el-button>
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="card-section">
          <div class="section-title">基本信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="报备编号">{{ detail.report_no }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <span :class="['status-tag', PRICE_REPORT_STATUS[detail.status]?.class]">
                {{ PRICE_REPORT_STATUS[detail.status]?.label }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="商品名称">{{ detail.product_name }}</el-descriptions-item>
            <el-descriptions-item label="商品编码">{{ detail.product_code || '-' }}</el-descriptions-item>
            <el-descriptions-item label="原价">
              <span style="text-decoration: line-through; color: #909399;">¥{{ detail.original_price }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="折扣价">
              <span style="color: #f56c6c; font-weight: 600; font-size: 18px;">¥{{ detail.discount_price }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="折扣率">
              <span v-if="detail.discount_rate" style="color: #f56c6c; font-weight: 600;">
                {{ (detail.discount_rate * 10).toFixed(1) }}折
              </span>
              <span v-else style="color: #c0c4cc">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="报备日期">{{ detail.report_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="关联活动">
              <el-button
                type="primary"
                link
                @click="$router.push(`/discount/${detail.campaign_id}`)"
              >
                {{ detail.campaign_title }}
              </el-button>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{ detail.creator_name }}</el-descriptions-item>
            <el-descriptions-item label="核实人">{{ detail.verifier_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(detail.created_at) }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="detail.exception_reason" style="margin-top: 20px;">
            <el-alert
              type="error"
              title="异常原因"
              :description="detail.exception_reason"
              show-icon
              closable
            />
          </div>

          <div v-if="detail.reject_reason" style="margin-top: 20px;">
            <el-alert
              type="warning"
              title="退回原因"
              :description="detail.reject_reason"
              show-icon
              closable
            />
          </div>

          <div v-if="detail.verify_comment" style="margin-top: 20px;">
            <el-alert
              type="info"
              title="核实意见"
              :description="detail.verify_comment"
              show-icon
              closable
            />
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">操作日志</div>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in logs"
              :key="index"
              :timestamp="formatTime(log.created_at)"
              :type="log.operation.includes('exception') || log.operation.includes('reject') ? 'danger' : 'primary'"
              placement="top"
            >
              <div class="log-item">
                <div class="log-operation">
                  <el-tag size="small">{{ getOperationLabel(log.operation) }}</el-tag>
                </div>
                <div class="log-detail">{{ log.detail || '-' }}</div>
                <div class="log-meta">
                  <span>{{ log.operator_name }}</span>
                  <span style="margin-left: 8px; color: #909399;">
                    ({{ ROLE_LABELS[log.operator_role] }})
                  </span>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="logs.length === 0" description="暂无操作记录" />
        </div>

        <div class="card-section">
          <div class="section-title">流转状态</div>
          <el-steps direction="vertical" :active="currentStep" finish-status="success">
            <el-step title="创建草稿" />
            <el-step title="提交报备" />
            <el-step title="营运督导核实" />
            <el-step title="完成" />
          </el-steps>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="rejectDialogVisible" title="退回原因" width="480px">
      <el-form :model="rejectForm">
        <el-form-item label="退回原因" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请填写退回原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认退回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exceptionDialogVisible" title="标记异常" width="480px">
      <el-form :model="exceptionForm">
        <el-form-item label="异常原因" required>
          <el-input
            v-model="exceptionForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请填写异常原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exceptionDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmException">确认标记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resolveExceptionDialogVisible" title="处理异常" width="480px">
      <el-form :model="resolveExceptionForm">
        <el-form-item label="目标状态" required>
          <el-select v-model="resolveExceptionForm.target_status" style="width: 100%">
            <el-option label="退回已报备" value="reported" />
            <el-option label="直接退回" value="rejected" />
            <el-option label="直接核实" value="verified" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            v-model="resolveExceptionForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请填写处理说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveExceptionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmResolveException">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="confirmDialogVisible" title="确认提交" width="480px">
      <el-alert
        v-if="submitExceptions.length > 0"
        type="warning"
        title="存在异常项"
        :description="submitExceptions.join('；')"
        show-icon
      />
      <div style="margin-top: 16px;">
        {{ submitExceptions.length > 0 ? '提交前请确认以上异常，是否仍要提交？' : '确定要提交报备吗？' }}
      </div>
      <el-form v-if="submitExceptions.length > 0" style="margin-top: 16px;">
        <el-checkbox v-model="confirmSubmitException">我已确认上述异常，仍要提交</el-checkbox>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="submitExceptions.length > 0 && !confirmSubmitException"
          @click="executeSubmit"
        >
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { priceReportApi, logApi } from '@/api'
import { PRICE_REPORT_STATUS, ROLE_LABELS } from '@/utils/constants'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const userStore = useUserStore()
const id = route.params.id

const detail = ref({})
const logs = ref([])
const isStoreManager = computed(() => userStore.isStoreManager)

const rejectDialogVisible = ref(false)
const exceptionDialogVisible = ref(false)
const resolveExceptionDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const confirmSubmitException = ref(false)
const submitExceptions = ref([])

const rejectForm = reactive({ reason: '' })
const exceptionForm = reactive({ reason: '' })
const resolveExceptionForm = reactive({ target_status: '', comment: '' })

const canEdit = computed(() => {
  return isStoreManager.value &&
    detail.value.created_by === userStore.userInfo.id &&
    ['pending', 'rejected'].includes(detail.value.status)
})

const canSubmit = computed(() => {
  return isStoreManager.value &&
    detail.value.created_by === userStore.userInfo.id &&
    ['pending', 'rejected'].includes(detail.value.status)
})

const canVerify = computed(() => {
  return userStore.isOperationSupervisor && detail.value.status === 'reported'
})

const canReject = computed(() => {
  return (userStore.isOperationSupervisor || userStore.isInvestmentManager) &&
    ['reported', 'verified'].includes(detail.value.status)
})

const canRaiseException = computed(() => {
  return (userStore.isOperationSupervisor || userStore.isInvestmentManager) &&
    !['exception', 'pending', 'rejected'].includes(detail.value.status)
})

const canResolveException = computed(() => {
  return (userStore.isOperationSupervisor || userStore.isInvestmentManager) && detail.value.status === 'exception'
})

const currentStep = computed(() => {
  const steps = {
    pending: 1,
    reported: 2,
    verified: 4,
    rejected: 1,
    exception: 0
  }
  return steps[detail.value.status] || 0
})

function getOperationLabel(op) {
  const labels = {
    create: '创建',
    submit: '提交',
    update: '更新',
    verify: '核实',
    reject: '退回',
    raise_exception: '标记异常',
    resolve_exception: '处理异常',
    batch_verify: '批量核实',
    batch_reject: '批量退回'
  }
  return labels[op] || op
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

async function loadDetail() {
  try {
    detail.value = await priceReportApi.getDetail(id)
  } catch (e) {
    console.error('Load detail error:', e)
  }
}

async function loadLogs() {
  try {
    logs.value = await logApi.getPriceReportLogs(id)
  } catch (e) {
    console.error('Load logs error:', e)
  }
}

async function handleSubmit() {
  try {
    await priceReportApi.submit(id, { confirm_exception: false })
    ElMessage.success('提交成功')
    loadDetail()
    loadLogs()
  } catch (e) {
    if (e.response && e.response.data && e.response.data.require_confirm) {
      submitExceptions.value = e.response.data.exceptions
      confirmSubmitException.value = false
      confirmDialogVisible.value = true
    }
  }
}

async function executeSubmit() {
  try {
    await priceReportApi.submit(id, { confirm_exception: true })
    ElMessage.success('提交成功')
    confirmDialogVisible.value = false
    loadDetail()
    loadLogs()
  } catch (e) {
    console.error('Execute submit error:', e)
  }
}

async function handleVerify() {
  try {
    await ElMessageBox.confirm('确定要核实此报备吗？', '提示', { type: 'warning' })
    await priceReportApi.verify(id, { comment: '核实通过' })
    ElMessage.success('已核实')
    loadDetail()
    loadLogs()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Verify error:', e)
    }
  }
}

function showRejectDialog() {
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

async function confirmReject() {
  if (!rejectForm.reason) {
    ElMessage.warning('请填写退回原因')
    return
  }
  try {
    await priceReportApi.reject(id, { reason: rejectForm.reason })
    ElMessage.success('已退回')
    rejectDialogVisible.value = false
    loadDetail()
    loadLogs()
  } catch (e) {
    console.error('Reject error:', e)
  }
}

function showExceptionDialog() {
  exceptionForm.reason = ''
  exceptionDialogVisible.value = true
}

async function confirmException() {
  if (!exceptionForm.reason) {
    ElMessage.warning('请填写异常原因')
    return
  }
  try {
    await priceReportApi.raiseException(id, { reason: exceptionForm.reason })
    ElMessage.success('已标记异常')
    exceptionDialogVisible.value = false
    loadDetail()
    loadLogs()
  } catch (e) {
    console.error('Raise exception error:', e)
  }
}

function showResolveExceptionDialog() {
  resolveExceptionForm.target_status = 'reported'
  resolveExceptionForm.comment = ''
  resolveExceptionDialogVisible.value = true
}

async function confirmResolveException() {
  if (!resolveExceptionForm.target_status) {
    ElMessage.warning('请选择目标状态')
    return
  }
  try {
    await priceReportApi.resolveException(id, resolveExceptionForm)
    ElMessage.success('异常已处理')
    resolveExceptionDialogVisible.value = false
    loadDetail()
    loadLogs()
  } catch (e) {
    console.error('Resolve exception error:', e)
  }
}

onMounted(() => {
  loadDetail()
  loadLogs()
})
</script>

<style scoped>
.log-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.log-operation {
  margin-bottom: 8px;
}

.log-detail {
  color: #606266;
  font-size: 13px;
  margin-bottom: 4px;
  word-break: break-all;
}

.log-meta {
  font-size: 12px;
  color: #909399;
}
</style>
