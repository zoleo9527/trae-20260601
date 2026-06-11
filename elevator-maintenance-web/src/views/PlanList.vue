<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">维保计划</h2>
      <el-button
        v-if="canCreate"
        type="primary"
        :icon="Plus"
        @click="handleCreate"
      >
        新建计划
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
            @change="handleFilter"
          >
            <el-option
              v-for="status in planStatusList"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索计划编号、电梯编号"
            clearable
            style="width: 240px"
            @keyup.enter="handleFilter"
          />
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
      >
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
        <el-table-column label="操作" width="280" fixed="right">
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
              v-if="canDispatch(row)"
              type="primary"
              link
              :icon="User"
              @click="handleDispatch(row)"
            >
              派单
            </el-button>
            <el-button
              v-if="canCheckIn(row)"
              type="success"
              link
              :icon="Location"
              @click="handleCheckIn(row)"
            >
              签到
            </el-button>
            <el-button
              v-if="canReview(row)"
              type="warning"
              link
              :icon="Check"
              @click="handleReview(row)"
            >
              审核
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
      v-model="dispatchDialogVisible"
      title="派单"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="dispatchForm" :rules="dispatchRules" ref="dispatchFormRef">
        <el-form-item label="技师" prop="technicianId">
          <el-select
            v-model="dispatchForm.technicianId"
            placeholder="请选择技师"
            style="width: 100%"
          >
            <el-option
              v-for="tech in technicians"
              :key="tech.id"
              :label="tech.name"
              :value="tech.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="dispatchForm.note"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dispatchLoading" @click="handleConfirmDispatch">
          确认派单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, View, User, Location, Check } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getPlans, dispatchPlan } from '@/api/plan'
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
const dispatchLoading = ref(false)
const dispatchDialogVisible = ref(false)
const dispatchFormRef = ref()

const tableData = ref([])
const technicians = ref([])
const currentPlan = ref(null)

const filterForm = reactive({
  status: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const dispatchForm = reactive({
  technicianId: null,
  note: ''
})

const dispatchRules = {
  technicianId: [
    { required: true, message: '请选择技师', trigger: 'change' }
  ]
}

const planStatusList = computed(() => {
  return Object.values(PLAN_STATUS)
})

const canCreate = computed(() => {
  return userStore.hasRole([USER_ROLE.CUSTOMER_SERVICE.value, USER_ROLE.SUPERVISOR.value])
})

const canDispatch = (row) => {
  return row.status === PLAN_STATUS.PENDING.value &&
    userStore.hasRole([USER_ROLE.CUSTOMER_SERVICE.value, USER_ROLE.SUPERVISOR.value])
}

const canCheckIn = (row) => {
  return row.status === PLAN_STATUS.DISPATCHED.value &&
    userStore.hasRole(USER_ROLE.TECHNICIAN.value) &&
    row.technicianId === userStore.user?.id
}

const canReview = (row) => {
  return row.status === PLAN_STATUS.FOR_REVIEW.value &&
    userStore.hasRole(USER_ROLE.SUPERVISOR.value)
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
      status: filterForm.status || undefined,
      keyword: filterForm.keyword || undefined
    })
    tableData.value = res.records || res.list || res || []
    pagination.total = res.total || 0
  } catch (e) {
    console.error('Load plans error:', e)
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
  filterForm.status = ''
  filterForm.keyword = ''
  pagination.page = 1
  loadData()
}

const handleCreate = () => {
  ElMessage.info('新建计划功能开发中')
}

const handleView = (row) => {
  router.push(`/plans/${row.id}`)
}

const handleDispatch = async (row) => {
  currentPlan.value = row
  dispatchForm.technicianId = null
  dispatchForm.note = ''
  await loadTechnicians()
  dispatchDialogVisible.value = true
}

const handleConfirmDispatch = async () => {
  if (!dispatchFormRef.value || !currentPlan.value) return

  try {
    await dispatchFormRef.value.validate()
    dispatchLoading.value = true

    await dispatchPlan(currentPlan.value.id, {
      technicianId: dispatchForm.technicianId,
      note: dispatchForm.note
    })

    ElMessage.success('派单成功')
    dispatchDialogVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error('Dispatch error:', e)
    }
  } finally {
    dispatchLoading.value = false
  }
}

const handleCheckIn = (row) => {
  router.push(`/plans/${row.id}`)
}

const handleReview = (row) => {
  router.push(`/plans/${row.id}`)
}

onMounted(() => {
  loadData()
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
