<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">价格报备</h2>
      <div style="display: flex; gap: 10px;">
        <el-button
          v-if="isStoreManager"
          type="primary"
          @click="$router.push('/price-report/create')"
        >
          <el-icon><Plus /></el-icon>
          新增报备
        </el-button>
        <el-button
          v-if="selectedIds.length > 0 && canBatchVerify"
          type="success"
          @click="handleBatchVerify"
        >
          批量核实
        </el-button>
        <el-button
          v-if="selectedIds.length > 0 && canBatchReject"
          type="warning"
          @click="handleBatchReject"
        >
          批量退回
        </el-button>
      </div>
    </div>

    <div class="card-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="(item, key) in PRICE_REPORT_STATUS"
              :key="key"
              :label="item.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="商品名称/编码/报备编号"
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
        <el-table-column prop="report_no" label="报备编号" width="140" fixed />
        <el-table-column prop="campaign_title" label="关联活动" min-width="180" show-overflow-tooltip />
        <el-table-column prop="product_name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="product_code" label="商品编码" width="120" />
        <el-table-column label="价格信息" width="200">
          <template #default="{ row }">
            <div>
              <span style="text-decoration: line-through; color: #909399;">¥{{ row.original_price }}</span>
              <el-icon style="margin: 0 6px;"><ArrowRight /></el-icon>
              <span style="color: #f56c6c; font-weight: 600;">¥{{ row.discount_price }}</span>
            </div>
            <div v-if="row.discount_rate" style="color: #909399; font-size: 12px;">
              折扣率：{{ (row.discount_rate * 10).toFixed(1) }}折
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', PRICE_REPORT_STATUS[row.status]?.class]">
              {{ PRICE_REPORT_STATUS[row.status]?.label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column label="报备日期" width="120">
          <template #default="{ row }">
            {{ row.report_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/price-report/${row.id}`)">查看</el-button>
            <el-button
              v-if="canEdit(row)"
              type="primary"
              link
              @click="$router.push(`/price-report/create?id=${row.id}`)"
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
              v-if="canVerify(row)"
              type="success"
              link
              @click="handleVerify(row)"
            >
              核实
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
        <el-checkbox v-model="confirmException">我已确认上述异常，仍要提交</el-checkbox>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="submitExceptions.length > 0 && !confirmException"
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
import { useUserStore } from '@/stores/user'
import { priceReportApi, batchApi } from '@/api'
import { PRICE_REPORT_STATUS } from '@/utils/constants'
import { ElMessage, ElMessageBox } from 'element-plus'

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
const confirmDialogVisible = ref(false)
const confirmException = ref(false)
const submitExceptions = ref([])
const rejectForm = reactive({ reason: '' })
const currentRow = ref(null)
const batchOperation = ref('')

const canBatchVerify = computed(() => {
  return userStore.isSupervisor && list.value.some(
    item => selectedIds.value.includes(item.id) && item.status === 'reported'
  )
})

const canBatchReject = computed(() => {
  return userStore.isSupervisor && list.value.some(
    item => selectedIds.value.includes(item.id) && item.status === 'reported'
  )
})

function canEdit(row) {
  return isStoreManager.value &&
    row.created_by === userStore.userInfo.id &&
    ['pending', 'rejected'].includes(row.status)
}

function canSubmit(row) {
  return isStoreManager.value &&
    row.created_by === userStore.userInfo.id &&
    ['pending', 'rejected'].includes(row.status)
}

function canVerify(row) {
  return userStore.isSupervisor && row.status === 'reported'
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

    const res = await priceReportApi.getList(params)
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
    await priceReportApi.submit(row.id, { confirm_exception: false })
    ElMessage.success('提交成功')
    loadList()
  } catch (e) {
    if (e.response && e.response.data && e.response.data.require_confirm) {
      submitExceptions.value = e.response.data.exceptions
      confirmException.value = false
      confirmDialogVisible.value = true
    }
  }
}

async function executeSubmit() {
  try {
    await priceReportApi.submit(currentRow.value.id, { confirm_exception: true })
    ElMessage.success('提交成功')
    confirmDialogVisible.value = false
    loadList()
  } catch (e) {
    console.error('Execute submit error:', e)
  }
}

async function handleVerify(row) {
  try {
    await ElMessageBox.confirm('确定要核实此报备吗？', '提示', { type: 'warning' })
    await priceReportApi.verify(row.id, { comment: '核实通过' })
    ElMessage.success('已核实')
    loadList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Verify error:', e)
    }
  }
}

function handleBatchReject() {
  batchOperation.value = 'batch'
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

async function confirmReject() {
  if (!rejectForm.reason) {
    ElMessage.warning('请填写退回原因')
    return
  }
  try {
    if (batchOperation.value === 'batch') {
      const res = await batchApi.rejectReports({
        ids: selectedIds.value,
        reason: rejectForm.reason
      })
      ElMessage.success(`成功退回 ${res.success_count} 条，失败 ${res.failed_count} 条`)
    } else {
      await priceReportApi.reject(currentRow.value.id, { reason: rejectForm.reason })
      ElMessage.success('已退回')
    }
    rejectDialogVisible.value = false
    batchOperation.value = ''
    loadList()
  } catch (e) {
    console.error('Reject error:', e)
  }
}

async function handleBatchVerify() {
  try {
    await ElMessageBox.confirm('确定要批量核实选中的报备吗？', '提示', { type: 'warning' })
    const res = await batchApi.verifyReports({
      ids: selectedIds.value,
      comment: '批量核实通过'
    })
    ElMessage.success(`成功核实 ${res.success_count} 条，失败 ${res.failed_count} 条`)
    loadList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Batch verify error:', e)
    }
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
