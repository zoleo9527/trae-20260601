<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">批量审核</h2>
      <div>
        <el-button
          type="success"
          :icon="Check"
          :disabled="selectedPlans.length === 0"
          @click="openBatchReviewDialog('APPROVE')"
        >
          批量通过 ({{ selectedPlans.length }})
        </el-button>
        <el-button
          type="danger"
          :icon="Close"
          :disabled="selectedPlans.length === 0"
          @click="openBatchReviewDialog('REJECT')"
        >
          批量驳回 ({{ selectedPlans.length }})
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索计划编号、电梯编号"
            clearable
            style="width: 240px"
            @keyup.enter="handleFilter"
          />
        </el-form-item>
        <el-form-item label="技师">
          <el-select
            v-model="filterForm.technicianId"
            placeholder="全部技师"
            clearable
            style="width: 160px"
            @change="handleFilter"
          >
            <el-option
              v-for="tech in technicians"
              :key="tech.id"
              :label="tech.name"
              :value="tech.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleFilter">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="planNo" label="计划编号" width="140" />
        <el-table-column prop="elevatorNo" label="电梯编号" width="140" />
        <el-table-column prop="address" label="电梯位置" min-width="200" />
        <el-table-column label="计划类型" width="100">
          <template #default="{ row }">
            {{ row.content ? (row.content.length > 10 ? row.content.slice(0, 10) + '...' : row.content) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getPlanStatusType(row.status)">
              {{ getPlanStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="技师" width="120">
          <template #default="{ row }">
            {{ row.technicianName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="planTime" label="计划日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.planTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="View"
              @click="handleView(row)"
            >
              详情
            </el-button>
            <el-button
              type="success"
              link
              :icon="Check"
              @click="openReviewDialog(row, 'APPROVE')"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              link
              :icon="Close"
              @click="openReviewDialog(row, 'REJECT')"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-dialog
      v-model="reviewDialogVisible"
      :title="isBatch ? `批量${reviewResult === 'APPROVE' ? '通过' : '驳回'}` : `审核${reviewResult === 'APPROVE' ? '通过' : '驳回'}`"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="reviewForm" :rules="reviewRules" ref="reviewFormRef">
        <div v-if="isBatch" style="margin-bottom: 16px;">
          <el-alert
            :title="`即将对 ${selectedPlans.length} 条记录执行${reviewResult === 'APPROVE' ? '通过' : '驳回'}操作`"
            :type="reviewResult === 'APPROVE' ? 'success' : 'warning'"
            show-icon
          />
        </div>
        <el-form-item label="审核意见" prop="comment">
          <el-input
            v-model="reviewForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button
          :type="reviewResult === 'APPROVE' ? 'success' : 'danger'"
          :loading="submitLoading"
          @click="handleReview"
        >
          确认{{ reviewResult === 'APPROVE' ? '通过' : '驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, Search, Refresh, View } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getPlans, reviewPlan, batchReviewPlans } from '@/api/plan'
import { getUsersByRole } from '@/api/user'
import { useUserStore } from '@/store/user'
import {
  PLAN_STATUS,
  USER_ROLE,
  getPlanStatusLabel,
  getPlanStatusType
} from '@/utils/constants'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const submitLoading = ref(false)
const reviewDialogVisible = ref(false)
const reviewFormRef = ref()

const tableData = ref([])
const technicians = ref([])
const selectedPlans = ref([])
const currentPlan = ref(null)
const isBatch = ref(false)
const reviewResult = ref('APPROVE')

const filterForm = reactive({
  keyword: '',
  technicianId: null
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const reviewForm = reactive({
  comment: ''
})

const reviewRules = {
  comment: [
    { required: true, message: '请输入审核意见', trigger: 'blur' }
  ]
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const formatDateTime = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getPlans({
      page: pagination.page,
      size: pagination.size,
      status: PLAN_STATUS.FOR_REVIEW.value,
      keyword: filterForm.keyword || undefined,
      technicianId: filterForm.technicianId || undefined
    })
    tableData.value = res.records || res.list || res || []
    pagination.total = res.total || 0
  } catch (e) {
    console.error('Load review plans error:', e)
  } finally {
    loading.value = false
  }
}

const loadTechnicians = async () => {
  try {
    const res = await getUsersByRole(USER_ROLE.TECHNICIAN.value)
    technicians.value = res || []
  } catch (e) {
    console.error('Load technicians error:', e)
  }
}

const handleFilter = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  filterForm.keyword = ''
  filterForm.technicianId = null
  pagination.page = 1
  selectedPlans.value = []
  loadData()
}

const handleSelectionChange = (selection) => {
  selectedPlans.value = selection
}

const handleView = (row) => {
  router.push(`/plans/${row.id}`)
}

const openReviewDialog = (row, result) => {
  currentPlan.value = row
  isBatch.value = false
  reviewResult.value = result
  reviewForm.comment = ''
  reviewDialogVisible.value = true
}

const openBatchReviewDialog = (result) => {
  if (selectedPlans.value.length === 0) {
    ElMessage.warning('请先选择要审核的计划')
    return
  }
  currentPlan.value = null
  isBatch.value = true
  reviewResult.value = result
  reviewForm.comment = ''
  reviewDialogVisible.value = true
}

const handleReview = async () => {
  if (!reviewFormRef.value) return

  try {
    await reviewFormRef.value.validate()
    submitLoading.value = true

    if (isBatch.value) {
      const ids = selectedPlans.value.map(p => p.id)
      await batchReviewPlans({
        planIds: ids,
        supervisorId: userStore.user.id,
        reviewRemark: reviewForm.comment,
        status: reviewResult.value === 'APPROVE' ? 'COMPLETED' : 'REJECTED'
      })
      ElMessage.success(`批量${reviewResult.value === 'APPROVE' ? '通过' : '驳回'}成功`)
    } else if (currentPlan.value) {
      await reviewPlan({
        planId: currentPlan.value.id,
        supervisorId: userStore.user.id,
        reviewRemark: reviewForm.comment,
        status: reviewResult.value === 'APPROVE' ? 'COMPLETED' : 'REJECTED'
      })
      ElMessage.success(`审核${reviewResult.value === 'APPROVE' ? '通过' : '驳回'}成功`)
    }

    reviewDialogVisible.value = false
    selectedPlans.value = []
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error('Review error:', e)
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadData()
  loadTechnicians()
})
</script>

<style scoped>
.filter-form {
  margin: 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
