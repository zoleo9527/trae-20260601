<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <div style="display: flex; align-items: center; gap: 12px">
            <el-button type="text" :icon="ArrowLeft" @click="$router.back()">返回</el-button>
            <span style="font-weight: 500; font-size: 16px">出库单详情</span>
            <el-tag v-if="detail" :class="`status-${detail.status.toLowerCase()}`" size="large">
              {{ statusMap[detail.status] || detail.status }}
            </el-tag>
          </div>
          <div v-if="detail?.status === 'PENDING'">
            <el-button type="success" @click="handleComplete">确认出库</el-button>
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
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="出库单号">{{ detail.outboundNo }}</el-descriptions-item>
                <el-descriptions-item label="类型">
                  <el-tag v-if="detail.outboundType === 'SALE'" type="success" size="small">销售出库</el-tag>
                  <el-tag v-else type="warning" size="small">赠送出库</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="关联预订">{{ detail.bookingNo || '-' }}</el-descriptions-item>
                <el-descriptions-item label="包厢">{{ detail.roomNo || '-' }}</el-descriptions-item>
                <el-descriptions-item label="总金额">
                  <span style="color: #409eff; font-weight: 500">¥{{ detail.totalAmount }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatTime(detail.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="处理时间">{{ formatTime(detail.handleTime) }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card v-if="detail.verificationId">
              <template #header>
                <div style="display: flex; align-items: center; justify-content: space-between">
                  <span style="font-weight: 500">关联核销单</span>
                  <el-tag type="primary" size="small">赠品核销生成</el-tag>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="核销单号">
                  <span style="color: #409eff; cursor: pointer" @click="goToVerification">
                    {{ detail.verificationNo }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item label="客户">{{ verificationInfo?.customerName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="本次核销">¥{{ verificationInfo?.usedAmount || 0 }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatTime(verificationInfo?.createTime) }}</el-descriptions-item>
              </el-descriptions>
              <div style="margin-top: 10px; text-align: right">
                <el-button size="small" type="primary" link @click="goToVerification">查看核销详情</el-button>
              </div>
            </el-card>
            <el-card v-else>
              <template #header>
                <span style="font-weight: 500">关联信息</span>
              </template>
              <el-empty description="无关联核销单" :image-size="60" />
            </el-card>
          </el-col>
        </el-row>

        <el-card style="margin-top: 20px">
          <template #header>
            <span style="font-weight: 500">出库酒水明细</span>
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
import { getOutbound, getOutboundItems, completeOutbound, rejectOutbound } from '@/api/outbound'
import { getVerification } from '@/api/verification'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detail = ref(null)
const items = ref([])
const verificationInfo = ref(null)

const statusMap = {
  PENDING: '待处理',
  COMPLETED: '已完成',
  REJECTED: '已退回'
}

const loadData = async () => {
  loading.value = true
  try {
    const id = route.params.id
    detail.value = await getOutbound(id)
    items.value = await getOutboundItems(id)
    if (detail.value.verificationId) {
      verificationInfo.value = await getVerification(detail.value.verificationId)
    }
  } finally {
    loading.value = false
  }
}

const handleComplete = async () => {
  await ElMessageBox.confirm('确认该出库单已出库完成？', '提示', { type: 'warning' })
  await completeOutbound(route.params.id)
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
    await rejectOutbound(route.params.id, reason)
    ElMessage.success('操作成功')
    loadData()
  }
}

const goToVerification = () => {
  router.push(`/verification/${detail.value.verificationId}`)
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

onMounted(() => {
  loadData()
})
</script>
