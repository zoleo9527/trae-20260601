<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <div style="display: flex; align-items: center; gap: 12px">
            <el-button type="text" :icon="ArrowLeft" @click="$router.back()">返回</el-button>
            <span style="font-weight: 500; font-size: 16px">核销单详情</span>
            <el-tag v-if="detail" :class="`status-${detail.status.toLowerCase()}`" size="large">
              {{ statusMap[detail.status] || detail.status }}
            </el-tag>
          </div>
          <div v-if="detail?.status === 'PENDING'">
            <el-button type="success" @click="handleApprove">通过</el-button>
            <el-button type="danger" @click="handleReject">退回</el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading" v-if="detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span style="font-weight: 500">基本信息</span>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="核销单号">{{ detail.verificationNo }}</el-descriptions-item>
                <el-descriptions-item label="关联预订">{{ detail.bookingNo }}</el-descriptions-item>
                <el-descriptions-item label="包厢号">{{ detail.roomNo }}</el-descriptions-item>
                <el-descriptions-item label="客户姓名">{{ detail.customerName }}</el-descriptions-item>
                <el-descriptions-item label="会员ID">{{ detail.memberId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="赠送总额">¥{{ detail.giftAmount }}</el-descriptions-item>
                <el-descriptions-item label="本次核销">
                  <span style="color: #409eff; font-weight: 500">¥{{ detail.usedAmount }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="剩余额度">
                  <span :style="{ color: detail.remainingAmount > 0 ? '#67c23a' : '#909399', fontWeight: 500 }">
                    ¥{{ detail.remainingAmount }}
                  </span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span style="font-weight: 500">处理信息</span>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="创建时间">{{ formatTime(detail.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="处理时间">{{ formatTime(detail.handleTime) }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
                <el-descriptions-item v-if="detail.status === 'REJECTED'" label="退回原因" :span="2">
                  <span style="color: #f56c6c">{{ detail.rejectReason }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>

        <el-card style="margin-top: 20px">
          <template #header>
            <span style="font-weight: 500">核销酒水明细</span>
          </template>
          <el-table :data="items" border>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="drinkName" label="酒水名称" />
            <el-table-column prop="spec" label="规格" width="120" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="price" label="单价" width="120">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top: 20px" v-if="bookingInfo">
          <template #header>
            <span style="font-weight: 500">关联预订信息</span>
            <el-tag type="info" size="small">无需跳转，直接查看</el-tag>
          </template>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="预订号">{{ bookingInfo.bookingNo }}</el-descriptions-item>
            <el-descriptions-item label="包厢">{{ bookingInfo.roomNo }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{ bookingInfo.customerName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ bookingInfo.customerPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="预订时间">{{ formatTime(bookingInfo.bookingTime) }}</el-descriptions-item>
            <el-descriptions-item label="到店时间">{{ formatTime(bookingInfo.startTime) }}</el-descriptions-item>
            <el-descriptions-item label="状态" :span="3">
              <el-tag size="small">{{ bookingStatusMap[bookingInfo.status] || bookingInfo.status }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getVerification, getVerificationItems, approveVerification, rejectVerification } from '@/api/verification'
import { getBooking } from '@/api/booking'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detail = ref(null)
const items = ref([])
const bookingInfo = ref(null)

const statusMap = {
  PENDING: '待处理',
  COMPLETED: '已通过',
  REJECTED: '已退回'
}

const bookingStatusMap = {
  PENDING: '待到店',
  CHECKED_IN: '已到店',
  COMPLETED: '已完成'
}

const loadData = async () => {
  loading.value = true
  try {
    const id = route.params.id
    detail.value = await getVerification(id)
    items.value = await getVerificationItems(id)
    if (detail.value.bookingId) {
      bookingInfo.value = await getBooking(detail.value.bookingId)
    }
  } finally {
    loading.value = false
  }
}

const handleApprove = async () => {
  await ElMessageBox.confirm('确认通过该核销申请？', '提示', { type: 'warning' })
  await approveVerification(route.params.id)
  ElMessage.success('操作成功')
  loadData()
}

const handleReject = async () => {
  const { value: reason } = await ElMessageBox.prompt('请输入退回原因', '退回', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入退回原因',
    inputType: 'textarea'
  })
  if (reason) {
    await rejectVerification(route.params.id, reason)
    ElMessage.success('操作成功')
    loadData()
  }
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

onMounted(() => {
  loadData()
})
</script>
