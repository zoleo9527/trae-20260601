<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">活动详情</h2>
      <div style="display: flex; gap: 10px;">
        <el-button
          v-if="canEdit"
          type="primary"
          @click="$router.push(`/discount/create?id=${detail.id}`)"
        >
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button
          v-if="canSubmit"
          type="success"
          @click="handleSubmit"
        >
          提交审核
        </el-button>
        <el-button
          v-if="canStartReview"
          type="primary"
          @click="handleStartReview"
        >
          开始审核
        </el-button>
        <el-button
          v-if="canReviewApprove"
          type="success"
          @click="handleReviewApprove"
        >
          审核通过
        </el-button>
        <el-button
          v-if="canApprove"
          type="success"
          @click="handleApprove"
        >
          审批通过
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
            <el-descriptions-item label="活动编号">{{ detail.campaign_no }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <span :class="['status-tag', DISCOUNT_STATUS[detail.status]?.class]">
                {{ DISCOUNT_STATUS[detail.status]?.label }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="活动名称">{{ detail.title }}</el-descriptions-item>
            <el-descriptions-item label="品牌">{{ detail.brand_name }}</el-descriptions-item>
            <el-descriptions-item label="门店">{{ detail.store_name }}</el-descriptions-item>
            <el-descriptions-item label="活动类型">{{ getDiscountTypeLabel(detail.discount_type) }}</el-descriptions-item>
            <el-descriptions-item label="折扣率">
              <span v-if="detail.discount_rate" style="color: #f56c6c; font-weight: 600;">
                {{ (detail.discount_rate * 10).toFixed(1) }}折
              </span>
              <span v-else style="color: #c0c4cc">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="活动时间">
              {{ detail.start_date }} 至 {{ detail.end_date }}
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{ detail.creator_name }}</el-descriptions-item>
            <el-descriptions-item label="审核人">{{ detail.reviewer_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="审批人">{{ detail.approver_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(detail.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="活动描述" :span="2">
              {{ detail.description || '-' }}
            </el-descriptions-item>
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

          <div v-if="detail.review_comment" style="margin-top: 20px;">
            <el-alert
              type="info"
              title="审核意见"
              :description="detail.review_comment"
              show-icon
              closable
            />
          </div>
        </div>

        <div class="card-section">
          <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
            <span>价格报备（{{ detail.price_report_count }} 条）</span>
            <el-button
              v-if="isStoreManager && ['draft', 'pending_review', 'reviewing'].includes(detail.status)"
              type="primary"
              size="small"
              @click="$router.push(`/price-report/create?campaign_id=${detail.id}`)"
            >
              <el-icon><Plus /></el-icon>
              新增报备
            </el-button>
          </div>
          <el-table :data="detail.price_reports" v-if="detail.price_reports?.length > 0">
            <el-table-column prop="report_no" label="报备编号" width="140" />
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="original_price" label="原价" width="100">
              <template #default="{ row }">¥{{ row.original_price }}</template>
            </el-table-column>
            <el-table-column prop="discount_price" label="折扣价" width="100">
              <template #default="{ row }">
                <span style="color: #f56c6c;">¥{{ row.discount_price }}</span>
              </template>
            </el-table-column>
            <el-table-column label="折扣率" width="100">
              <template #default="{ row }">
                <span v-if="row.discount_rate">{{ (row.discount_rate * 10).toFixed(1) }}折</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <span :class="['status-tag', PRICE_REPORT_STATUS[row.status]?.class]">
                  {{ PRICE_REPORT_STATUS[row.status]?.label }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="primary" link @click="$router.push(`/price-report/${row.id}`)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无价格报备" />
        </div>

        <div class="card-section">
          <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
            <span>台账/沟通记录</span>
            <el-button type="primary" size="small" @click="showAddRecordDialog">
              <el-icon><Plus /></el-icon>
              添加记录
            </el-button>
          </div>
          <el-timeline v-if="detail.records?.length > 0">
            <el-timeline-item
              v-for="(record, index) in detail.records"
              :key="index"
              :timestamp="formatTime(record.created_at)"
              placement="top"
            >
              <el-card>
                <template #header>
                  <div style="display: flex; justify-content: space-between;">
                    <span>
                      <el-tag size="small" :type="getRecordTagType(record.record_type)">
                        {{ RECORD_TYPES[record.record_type] }}
                      </el-tag>
                      <span style="margin-left: 8px; font-weight: 600;">{{ record.title }}</span>
                    </span>
                    <span style="color: #909399; font-size: 12px;">{{ record.creator_name }}</span>
                  </div>
                </template>
                <p>{{ record.content }}</p>
                <p v-if="record.remark" style="color: #909399; font-size: 12px; margin-top: 8px;">
                  备注：{{ record.remark }}
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无记录" />
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
            <el-step title="提交审核" />
            <el-step title="营运督导审核" />
            <el-step title="招商经理审批" />
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
            <el-option label="退回待审核" value="pending_review" />
            <el-option label="退回审核中" value="reviewing" />
            <el-option label="直接退回" value="rejected" />
            <el-option label="直接通过" value="approved" />
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

    <el-dialog v-model="addRecordDialogVisible" title="添加记录" width="480px">
      <el-form :model="recordForm">
        <el-form-item label="记录类型" required>
          <el-select v-model="recordForm.record_type" style="width: 100%">
            <el-option
              v-for="(label, value) in RECORD_TYPES"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="recordForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="recordForm.content"
            type="textarea"
            :rows="3"
            placeholder="请输入内容"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="recordForm.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addRecordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddRecord">确认添加</el-button>
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
        {{ submitExceptions.length > 0 ? '提交前请确认以上异常，是否仍要提交？' : '确定要提交审核吗？' }}
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
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { discountApi, logApi } from '@/api'
import { DISCOUNT_STATUS, PRICE_REPORT_STATUS, DISCOUNT_TYPES, RECORD_TYPES, ROLE_LABELS } from '@/utils/constants'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const id = route.params.id

const detail = ref({})
const logs = ref([])
const isStoreManager = computed(() => userStore.isStoreManager)

const rejectDialogVisible = ref(false)
const exceptionDialogVisible = ref(false)
const resolveExceptionDialogVisible = ref(false)
const addRecordDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const confirmSubmitException = ref(false)
const submitExceptions = ref([])

const rejectForm = reactive({ reason: '' })
const exceptionForm = reactive({ reason: '' })
const resolveExceptionForm = reactive({ target_status: '', comment: '' })
const recordForm = reactive({ record_type: 'old_ledger', title: '', content: '', remark: '' })

const canEdit = computed(() => {
  return isStoreManager.value &&
    detail.value.created_by === userStore.userInfo.id &&
    ['draft', 'rejected'].includes(detail.value.status)
})

const canSubmit = computed(() => {
  return isStoreManager.value &&
    detail.value.created_by === userStore.userInfo.id &&
    ['draft', 'rejected'].includes(detail.value.status)
})

const canStartReview = computed(() => {
  return userStore.isOperationSupervisor && detail.value.status === 'pending_review'
})

const canReviewApprove = computed(() => {
  return userStore.isOperationSupervisor && detail.value.status === 'reviewing'
})

const canApprove = computed(() => {
  return userStore.isInvestmentManager &&
    ['pending_review', 'reviewing'].includes(detail.value.status)
})

const canReject = computed(() => {
  if (detail.value.status === 'approved') {
    return userStore.isInvestmentManager
  }
  return (userStore.isOperationSupervisor || userStore.isInvestmentManager) &&
    ['pending_review', 'reviewing'].includes(detail.value.status)
})

const canRaiseException = computed(() => {
  return (userStore.isOperationSupervisor || userStore.isInvestmentManager) &&
    !['exception', 'archived', 'draft', 'rejected'].includes(detail.value.status)
})

const canResolveException = computed(() => {
  return (userStore.isOperationSupervisor || userStore.isInvestmentManager) && detail.value.status === 'exception'
})

const currentStep = computed(() => {
  const steps = {
    draft: 1,
    pending_review: 2,
    reviewing: 3,
    approved: 4,
    rejected: 2,
    exception: 0,
    archived: 5
  }
  return steps[detail.value.status] || 0
})

function getDiscountTypeLabel(value) {
  const item = DISCOUNT_TYPES.find(t => t.value === value)
  return item ? item.label : value || '-'
}

function getRecordTagType(type) {
  const types = {
    old_ledger: 'info',
    on_site: 'success',
    screenshot: 'warning',
    communication: 'primary'
  }
  return types[type] || 'info'
}

function getOperationLabel(op) {
  const labels = {
    create: '创建',
    submit: '提交',
    update: '更新',
    start_review: '开始审核',
    review_approve: '审核通过',
    review_reject: '审核退回',
    review_raise_exception: '标记异常',
    approve: '审批通过',
    reject: '退回',
    verify: '核实',
    raise_exception: '标记异常',
    resolve_exception: '解决异常',
    add_record: '添加记录',
    batch_submit: '批量提交',
    batch_approve: '批量审批',
    batch_reject: '批量退回',
    batch_raise_exception: '批量标记异常'
  }
  return labels[op] || op
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

async function loadDetail() {
  try {
    detail.value = await discountApi.getDetail(id)
  } catch (e) {
    console.error('Load detail error:', e)
  }
}

async function loadLogs() {
  try {
    logs.value = await logApi.getCampaignLogs(id)
  } catch (e) {
    console.error('Load logs error:', e)
  }
}

async function handleSubmit() {
  try {
    await discountApi.submit(id, { confirm_exception: false })
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
    await discountApi.submit(id, { confirm_exception: true })
    ElMessage.success('提交成功')
    confirmDialogVisible.value = false
    loadDetail()
    loadLogs()
  } catch (e) {
    console.error('Execute submit error:', e)
  }
}

async function handleStartReview() {
  try {
    await ElMessageBox.confirm('确定要开始审核此活动吗？', '提示', { type: 'warning' })
    await discountApi.startReview(id)
    ElMessage.success('已开始审核')
    loadDetail()
    loadLogs()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Start review error:', e)
    }
  }
}

async function handleReviewApprove() {
  try {
    await ElMessageBox.confirm('确定要审核通过此活动吗？', '提示', { type: 'warning' })
    await discountApi.approve(id, { comment: '审核通过' })
    ElMessage.success('审核通过')
    loadDetail()
    loadLogs()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Review approve error:', e)
    }
  }
}

async function handleApprove() {
  try {
    await ElMessageBox.confirm('确定要审批通过此活动吗？', '提示', { type: 'warning' })
    await discountApi.approve(id, { comment: '审批通过' })
    ElMessage.success('审批通过')
    loadDetail()
    loadLogs()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Approve error:', e)
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
    await discountApi.reject(id, { reason: rejectForm.reason })
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
    await discountApi.raiseException(id, { reason: exceptionForm.reason })
    ElMessage.success('已标记异常')
    exceptionDialogVisible.value = false
    loadDetail()
    loadLogs()
  } catch (e) {
    console.error('Raise exception error:', e)
  }
}

function showResolveExceptionDialog() {
  resolveExceptionForm.target_status = 'pending_review'
  resolveExceptionForm.comment = ''
  resolveExceptionDialogVisible.value = true
}

async function confirmResolveException() {
  if (!resolveExceptionForm.target_status) {
    ElMessage.warning('请选择目标状态')
    return
  }
  try {
    await discountApi.resolveException(id, resolveExceptionForm)
    ElMessage.success('异常已处理')
    resolveExceptionDialogVisible.value = false
    loadDetail()
    loadLogs()
  } catch (e) {
    console.error('Resolve exception error:', e)
  }
}

function showAddRecordDialog() {
  Object.assign(recordForm, { record_type: 'old_ledger', title: '', content: '', remark: '' })
  addRecordDialogVisible.value = true
}

async function confirmAddRecord() {
  if (!recordForm.title) {
    ElMessage.warning('请填写标题')
    return
  }
  try {
    await discountApi.addRecord(id, recordForm)
    ElMessage.success('添加成功')
    addRecordDialogVisible.value = false
    loadDetail()
    loadLogs()
  } catch (e) {
    console.error('Add record error:', e)
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
