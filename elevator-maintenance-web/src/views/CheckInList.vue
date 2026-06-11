<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">签到记录</h2>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="工作结果">
          <el-select
            v-model="filterForm.workResult"
            placeholder="全部结果"
            clearable
            style="width: 160px"
            @change="handleFilter"
          >
            <el-option
              v-for="result in workResultList"
              :key="result.value"
              :label="result.label"
              :value="result.value"
            />
          </el-select>
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
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
            @change="handleFilter"
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
        <el-table-column prop="id" label="签到ID" width="100" />
        <el-table-column prop="projectName" label="项目名称" width="140" />
        <el-table-column prop="elevatorNo" label="电梯编号" width="140" />
        <el-table-column prop="projectName" label="电梯位置" min-width="180" />
        <el-table-column prop="technicianName" label="技师" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getCheckinStatusType(row.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN')">
              {{ getCheckinStatusLabel(row.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="工作结果" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.workResult" :type="getWorkResultType(row.workResult)">
              {{ getWorkResultLabel(row.workResult) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="checkInTime" label="签到时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.checkInTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="checkOutTime" label="签退时间" width="160">
          <template #default="{ row }">
            {{ row.checkOutTime ? formatDateTime(row.checkOutTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="View"
              @click="handleView(row)"
            >
              详情
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
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, View } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getCheckInRecords } from '@/api/checkin'
import { getUsersByRole } from '@/api/user'
import { useUserStore } from '@/store/user'
import {
  CHECKIN_STATUS,
  WORK_RESULT,
  USER_ROLE,
  getCheckinStatusLabel,
  getCheckinStatusType,
  getWorkResultLabel,
  getWorkResultType
} from '@/utils/constants'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const tableData = ref([])
const technicians = ref([])

const filterForm = reactive({
  workResult: '',
  technicianId: null,
  dateRange: []
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const workResultList = computed(() => Object.values(WORK_RESULT))

const formatDateTime = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      workResult: filterForm.workResult || undefined,
      technicianId: filterForm.technicianId || undefined
    }

    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = filterForm.dateRange[0]
      params.endDate = filterForm.dateRange[1]
    }

    if (userStore.role === USER_ROLE.TECHNICIAN.value) {
      params.technicianId = userStore.user?.id
    }

    const res = await getCheckInRecords(params)
    tableData.value = res.records || res.list || res || []
    pagination.total = res.total || 0
  } catch (e) {
    console.error('Load checkin records error:', e)
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
  filterForm.workResult = ''
  filterForm.technicianId = null
  filterForm.dateRange = []
  pagination.page = 1
  loadData()
}

const handleView = (row) => {
  router.push(`/checkins/${row.id}`)
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
