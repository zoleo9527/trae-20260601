<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span style="font-weight: 500; font-size: 16px">包厢预订列表</span>
          <el-button type="primary" :icon="Plus">新建预订</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="bookingNo" label="预订号" width="160" />
        <el-table-column prop="roomNo" label="包厢" width="100" />
        <el-table-column prop="customerName" label="客户姓名" width="100" />
        <el-table-column prop="customerPhone" label="联系电话" width="130" />
        <el-table-column prop="giftAmount" label="赠送额度" width="120">
          <template #default="{ row }">
            <span v-if="row.giftAmount > 0" style="color: #409eff">¥{{ row.giftAmount }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'CHECKED_IN' ? 'success' : ''" size="small">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bookingTime" label="预订时间" width="160">
          <template #default="{ row }">{{ formatTime(row.bookingTime) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="createVerification(row)" v-if="row.giftAmount > 0">
              发起核销
            </el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getBookingPage } from '@/api/booking'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10
})

const statusMap = {
  PENDING: '待到店',
  CHECKED_IN: '已到店',
  COMPLETED: '已完成'
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await getBookingPage(queryForm)
    tableData.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const createVerification = (row) => {
  router.push({
    path: '/verification/create',
    query: { bookingId: row.id }
  })
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

onMounted(() => {
  loadList()
})
</script>
