<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">折扣活动</h2>
      <div style="display: flex; gap: 10px;">
        <el-button
          v-if="isStoreManager"
          type="primary"
          @click="$router.push('/discount/create')"
        >
          <el-icon><Plus /></el-icon>
          新建活动
        </el-button>
        <el-button
          v-if="selectedIds.length > 0 && canBatchSubmit"
          @click="handleBatchSubmit"
        >
          批量提交
        </el-button>
        <el-button
          v-if="selectedIds.length > 0 && canBatchApprove"
          type="success"
          @click="handleBatchApprove"
        >
          批量审批
        </el-button>
        <el-button
          v-if="selectedIds.length > 0 && canBatchReject"
          type="warning"
          @click="handleBatchReject"
        >
          批量退回
        </el-button>
        <el-button
          v-if="selectedIds.length > 0 && canBatchException"
          type="danger"
          @click="handleBatchException"
        >
          批量标记异常
        </el-button>
      </div>
    </div>

    <div class="card-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="(item, key) in DISCOUNT_STATUS"
              :key="key"
              :label="item.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="活动名称/品牌/编号"
            style="width: 240px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-section">
      <el-table
        :data="list"
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="campaign_no" label="活动编号" width="140" fixed />
        <el-table-column prop="title" label="活动名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="brand_name" label="品牌" width="100" />
        <el-table-column prop="store_name" label="门店" width="140" />
        <el-table-column label="折扣信息" width="160">
          <template #default="{ row }">
            <div v-if="row.discount_type">
              <div>{{ getDiscountTypeLabel(row.discount_type) }}</div>
              <div v-if="row.discount_rate" style="color: #f56c6c; font-size: 12px;">
                {{ (row.discount_rate * 10).toFixed(1) }}折
              </div>
            </div>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" width="200">
          <template #default="{ row }">
            <div>{{ row.start_date }}</div>
            <div style="color: #909399; font-size: 12px;">至 {{ row.end_date }}</div>
          </template>
        </el-table-column>
        <el-table-column label="报备数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.price_report_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', DISCOUNT_STATUS[row.status]?.class]">
              {{ DISCOUNT_STATUS[row.status]?.label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/discount/${row.id}`)">
              查看
            </el-button>
            <el-button
              v-if="canEdit(row)"
              type="primary"
              link
              @click="$router.push(`/discount/create?id=${row.id}`)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canSubmit(row)"
              type="success"
              link
              @click="handleSubmit(row)"
            >
              提交
            </el-button>
            <el-button
              v-if="canStartReview(row)"
              type="primary"
              link
              @click="handleStartReview(row)"
            >
              开始审核
            </el-button>
            <el-button
              v-if="canRaiseException(row)"
              type="danger"
              link
              @click="handleRaiseException(row)"
            >
              标记异常
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="page"
          :page-size="perPage"
          :page-sizes="[10, 20, 50]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

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

    <el-dialog v-model="exceptionDialogVisible" title="异常原因" width="480px">
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
        <el-button type="danger" @click="confirmException">确认标记异常</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="confirmDialogVisible" title="确认操作" width="480px">
      <el-alert
        v-if="confirmData.exceptions && confirmData.exceptions.length > 0"
        type="warning"
        title="存在异常项"
        :description="confirmData.exceptions.join('；')"
        show-icon
      />
      <div style="margin-top: 16px;">
        {{ confirmData.message }}
      </div>
      <el-form v-if="confirmData.requireConfirm" style="margin-top: 16px;">
        <el-checkbox v-model="confirmData.confirmed">我已确认上述异常，仍要提交</el-checkbox>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="confirmData.requireConfirm && !confirmData.confirmed"
          @click="executeConfirm"
        >
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { discountApi, batchApi } from '@/api'
import { DISCOUNT_STATUS, DISCOUNT_TYPES } from '@/utils/constants'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const isStoreManager = computed(() => userStore.isStoreManager)

const list = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const perPage = ref(20)
const selectedIds = ref([])

const searchForm = reactive({
  status: '',
  keyword: ''
})

const rejectDialogVisible = ref(false)
const exceptionDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const rejectForm = reactive({ reason: '' })
const exceptionForm = reactive({ reason: '' })
const currentRow = ref(null)
const batchOperation = ref('')
const confirmData = reactive({
  message: '',
  exceptions: [],
  requireConfirm: false,
  confirmed: false,
  action: null
})

const canBatchSubmit = computed(() => {
  return isStoreManager.value && list.value.some(
    item => selectedIds.value.includes(item.id) &&
      (item.status === 'draft' || item.status === 'rejected')
  )
})

const canBatchApprove = computed(() => {
  return userStore.isManager && list.value.some(
    item => selectedIds.value.includes(item.id) &&
      (item.status === 'pending_review' || item.status === 'reviewing')
  )
})

const canBatchReject = computed(() => {
  return !isStoreManager.value && list.value.some(
    item => selectedIds.value.includes(item.id) &&
      (item.status === 'pending_review' || item.status === 'reviewing')
  )
})

const canBatchException = computed(() => {
  return !isStoreManager.value && list.value.some(
    item => selectedIds.value.includes(item.id) &&
      item.status !== 'exception' && item.status !== 'archived'
  )
})

function getDiscountTypeLabel(value) {
  const item = DISCOUNT_TYPES.find(t => t.value === value)
  return item ? item.label : value
}

function canEdit(row) {
  return isStoreManager.value &&
    row.created_by === userStore.userInfo.id &&
    (row.status === 'draft' || row.status === 'rejected')
}

function canSubmit(row) {
  return isStoreManager.value &&
    row.created_by === userStore.userInfo.id &&
    (row.status === 'draft' || row.status === 'rejected')
}

function canStartReview(row) {
  return userStore.isSupervisor && row.status === 'pending_review'
}

function canRaiseException(row) {
  return !isStoreManager.value && row.status !== 'exception' && row.status !== 'archived'
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.id)
}

function handlePageChange(val) {
  page.value = val
  loadList()
}

function handleSizeChange(val) {
  perPage.value = val
  page.value = 1
  loadList()
}

function resetSearch() {
  searchForm.status = ''
  searchForm.keyword = ''
  page.value = 1
  loadList()
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...searchForm
    }
    if (!params.status) delete params.status
    if (!params.keyword) delete params.keyword

    const res = await discountApi.getList(params)
    list.value = res.items
    total.value = res.total
  } catch (e) {
    console.error('Load list error:', e)
  } finally {
    loading.value = false
  }
}

async function handleSubmit(row) {
  currentRow.value = row
  try {
    await discountApi.submit(row.id, { confirm_exception: false })
    ElMessage.success('提交成功')
    loadList()
  } catch (e) {
    if (e.response && e.response.data && e.response.data.require_confirm) {
      confirmData.message = '提交前请确认以下异常：'
      confirmData.exceptions = e.response.data.exceptions
      confirmData.requireConfirm = true
      confirmData.confirmed = false
      confirmData.action = async () => {
        await discountApi.submit(row.id, { confirm_exception: true })
      }
      confirmDialogVisible.value = true
    }
  }
}

async function handleStartReview(row) {
  try {
    await ElMessageBox.confirm('确定要开始审核此活动吗？', '提示', { type: 'warning' })
    await discountApi.startReview(row.id)
    ElMessage.success('已开始审核')
    loadList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Start review error:', e)
    }
  }
}

function handleRaiseException(row) {
  currentRow.value = row
  exceptionForm.reason = ''
  exceptionDialogVisible.value = true
}

async function confirmException() {
  if (!exceptionForm.reason) {
    ElMessage.warning('请填写异常原因')
    return
  }
  try {
    if (batchOperation.value === 'batch') {
      await batchApi.raiseExceptionCampaigns({
        ids: selectedIds.value,
        reason: exceptionForm.reason
      })
      ElMessage.success('批量标记异常成功')
    } else {
      await discountApi.raiseException(currentRow.value.id, {
        reason: exceptionForm.reason
      })
      ElMessage.success('已标记异常')
    }
    exceptionDialogVisible.value = false
    batchOperation.value = ''
    loadList()
  } catch (e) {
    console.error('Raise exception error:', e)
  }
}

async function handleBatchSubmit() {
  try {
    const res = await batchApi.submitCampaigns({ ids: selectedIds.value })
    ElMessage.success(`成功提交 ${res.success_count} 条，失败 ${res.failed_count} 条`)
    loadList()
  } catch (e) {
    console.error('Batch submit error:', e)
  }
}

async function handleBatchApprove() {
  try {
    await ElMessageBox.confirm('确定要批量审批选中的活动吗？', '提示', { type: 'warning' })
    const res = await batchApi.approveCampaigns({ ids: selectedIds.value, comment: '批量审批通过' })
    ElMessage.success(`成功审批 ${res.success_count} 条，失败 ${res.failed_count} 条`)
    loadList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Batch approve error:', e)
    }
  }
}

function handleBatchReject() {
  batchOperation.value = 'batch'
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

function handleBatchException() {
  batchOperation.value = 'batch'
  exceptionForm.reason = ''
  exceptionDialogVisible.value = true
}

async function confirmReject() {
  if (!rejectForm.reason) {
    ElMessage.warning('请填写退回原因')
    return
  }
  try {
    if (batchOperation.value === 'batch') {
      const res = await batchApi.rejectCampaigns({
        ids: selectedIds.value,
        reason: rejectForm.reason
      })
      ElMessage.success(`成功退回 ${res.success_count} 条，失败 ${res.failed_count} 条`)
    } else {
      await discountApi.reject(currentRow.value.id, { reason: rejectForm.reason })
      ElMessage.success('已退回')
    }
    rejectDialogVisible.value = false
    batchOperation.value = ''
    loadList()
  } catch (e) {
    console.error('Reject error:', e)
  }
}

async function executeConfirm() {
  if (!confirmData.action) return
  try {
    await confirmData.action()
    ElMessage.success('操作成功')
    confirmDialogVisible.value = false
    loadList()
  } catch (e) {
    console.error('Execute confirm error:', e)
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
