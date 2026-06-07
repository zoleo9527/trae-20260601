<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-form :inline="true" :model="queryForm" size="default">
            <el-form-item label="状态">
              <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="待处理" value="PENDING" />
                <el-option label="已通过" value="COMPLETED" />
                <el-option label="已退回" value="REJECTED" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model="queryForm.keyword" placeholder="单号/包厢/客户" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="日期">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadList">搜索</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <el-button type="primary" :icon="Plus" @click="$router.push('/verification/create')">新建核销单</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="verificationNo" label="核销单号" width="160" />
        <el-table-column prop="bookingNo" label="关联预订" width="160" />
        <el-table-column prop="roomNo" label="包厢" width="100" />
        <el-table-column prop="customerName" label="客户" width="100" />
        <el-table-column prop="usedAmount" label="本次核销" width="120">
          <template #default="{ row }">¥{{ row.usedAmount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="核销状态" width="100">
          <template #default="{ row }">
            <el-tag :class="`status-${row.status.toLowerCase()}`" size="small">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="outboundStatus" label="出库状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.outboundStatus" :type="getOutboundTagType(row.outboundStatus)" size="small">
              {{ outboundStatusMap[row.outboundStatus] || row.outboundStatus }}
            </el-tag>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="outboundNo" label="关联出库单" width="160">
          <template #default="{ row }">
            <span v-if="row.outboundNo" style="color: #409eff; cursor: pointer" @click="goToOutboundDetail(row.outboundId)">
              {{ row.outboundNo }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">查看</el-button>
            <template v-if="row.status === 'PENDING'">
              <el-button type="success" size="small" link @click="handleApprove(row)">通过</el-button>
              <el-button type="danger" size="small" link @click="handleReject(row)">退回</el-button>
            </template>
            <template v-else-if="row.status === 'COMPLETED' && row.outboundStatus === 'PENDING'">
              <el-button type="warning" size="small" link @click="goToOutboundDetail(row.outboundId)">
                <el-icon><Bell /></el-icon>
                待出库
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; text-align: right">
        <el-pagination
          v-model:current-page="queryForm.pageNum"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <el-dialog v-model="rejectVisible" title="退回原因" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="原因">
          <el-input v-model="rejectForm.reason" type="textarea" :rows="3" placeholder="请输入退回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认退回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Bell } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getVerificationPage, approveVerification, rejectVerification } from '@/api/verification'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const rejectVisible = ref(false)
const currentId = ref(null)
const dateRange = ref([])

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  status: '',
  keyword: '',
  startDate: '',
  endDate: ''
})

const rejectForm = reactive({
  reason: ''
})

const statusMap = {
  PENDING: '待处理',
  COMPLETED: '已通过',
  REJECTED: '已退回'
}

const outboundStatusMap = {
  NOT_CREATED: '未生成',
  PENDING: '待出库',
  COMPLETED: '已出库',
  REJECTED: '已退回'
}

const getOutboundTagType = (status) => {
  const map = {
    PENDING: 'warning',
    COMPLETED: 'success',
    REJECTED: 'danger',
    NOT_CREATED: 'info'
  }
  return map[status] || ''
}

const loadList = async () => {
  if (dateRange.value?.length === 2) {
    queryForm.startDate = dateRange.value[0]
    queryForm.endDate = dateRange.value[1]
  } else {
    queryForm.startDate = ''
    queryForm.endDate = ''
  }
  loading.value = true
  try {
    const data = await getVerificationPage(queryForm)
    tableData.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryForm.status = ''
  queryForm.keyword = ''
  queryForm.startDate = ''
  queryForm.endDate = ''
  queryForm.pageNum = 1
  dateRange.value = []
  loadList()
}

const viewDetail = (row) => {
  router.push(`/verification/${row.id}`)
}

const goToOutboundDetail = (outboundId) => {
  router.push(`/outbound/${outboundId}`)
}

const handleApprove = async (row) => {
  await ElMessageBox.confirm('确认通过该核销申请？通过后将自动生成赠送出库单。', '提示', { type: 'warning' })
  await approveVerification(row.id)
  ElMessage.success('操作成功，已自动生成赠送出库单')
  loadList()
}

const handleReject = (row) => {
  currentId.value = row.id
  rejectForm.reason = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  await rejectVerification(currentId.value, rejectForm.reason)
  ElMessage.success('操作成功')
  rejectVisible.value = false
  loadList()
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

onMounted(() => {
  loadList()
})
</script>
