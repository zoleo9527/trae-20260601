<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-form :inline="true" :model="queryForm" size="default">
            <el-form-item label="状态">
              <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="待处理" value="PENDING" />
                <el-option label="已完成" value="COMPLETED" />
                <el-option label="已退回" value="REJECTED" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="queryForm.outboundType" placeholder="全部" clearable style="width: 120px">
                <el-option label="销售" value="SALE" />
                <el-option label="赠送" value="GIFT" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model="queryForm.keyword" placeholder="单号/包厢" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadList">搜索</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <el-button type="primary" :icon="Plus" @click="$router.push('/outbound/create')">新建出库单</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="outboundNo" label="出库单号" width="160" />
        <el-table-column prop="bookingNo" label="关联预订" width="160" />
        <el-table-column prop="roomNo" label="包厢" width="100" />
        <el-table-column prop="outboundType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.outboundType === 'SALE'" type="success" size="small">销售</el-tag>
            <el-tag v-else type="warning" size="small">赠送</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="金额" width="120">
          <template #default="{ row }">¥{{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :class="`status-${row.status.toLowerCase()}`" size="small">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">详情</el-button>
            <template v-if="row.status === 'PENDING'">
              <el-button type="success" size="small" link @click="handleComplete(row)">确认出库</el-button>
              <el-button type="danger" size="small" link @click="handleReject(row)">退回</el-button>
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

    <el-dialog v-model="detailVisible" title="出库单详情" width="600px">
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="出库单号">{{ currentDetail.outboundNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :class="`status-${currentDetail.status.toLowerCase()}`" size="small">
            {{ statusMap[currentDetail.status] || currentDetail.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联预订">{{ currentDetail.bookingNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="包厢">{{ currentDetail.roomNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag v-if="currentDetail.outboundType === 'SALE'" type="success" size="small">销售</el-tag>
          <el-tag v-else type="warning" size="small">赠送</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ currentDetail.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentDetail.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ formatTime(currentDetail.handleTime) }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailItems" size="small" style="margin-top: 16px">
        <el-table-column prop="drinkName" label="酒水名称" />
        <el-table-column prop="spec" label="规格" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getOutboundPage, getOutbound, getOutboundItems, completeOutbound, rejectOutbound } from '@/api/outbound'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const detailVisible = ref(false)
const rejectVisible = ref(false)
const currentDetail = ref(null)
const detailItems = ref([])
const currentId = ref(null)

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  status: '',
  outboundType: '',
  keyword: ''
})

const rejectForm = reactive({
  reason: ''
})

const statusMap = {
  PENDING: '待处理',
  COMPLETED: '已完成',
  REJECTED: '已退回'
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await getOutboundPage(queryForm)
    tableData.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryForm.status = ''
  queryForm.outboundType = ''
  queryForm.keyword = ''
  queryForm.pageNum = 1
  loadList()
}

const viewDetail = async (row) => {
  currentDetail.value = await getOutbound(row.id)
  detailItems.value = await getOutboundItems(row.id)
  detailVisible.value = true
}

const handleComplete = async (row) => {
  await ElMessageBox.confirm('确认该出库单已出库完成？', '提示', { type: 'warning' })
  await completeOutbound(row.id)
  ElMessage.success('操作成功')
  loadList()
}

const handleReject = (row) => {
  currentId.value = row.id
  rejectForm.reason = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  await rejectOutbound(currentId.value, rejectForm.reason)
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
