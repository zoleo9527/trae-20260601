<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrder, updateOrderStatus } from '@/api/orders'
import { getArrivals } from '@/api/arrivals'
import { getLogs } from '@/api/logs'
import type { Order, Arrival, OperationLog } from '@/types'

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const arrivals = ref<Arrival[]>([])
const logs = ref<OperationLog[]>([])
const loading = ref(false)

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'primary' },
  shipped: { label: '已发货', type: 'info' },
  arrived: { label: '已到货', type: 'success' },
}

const statusSteps = ['pending', 'confirmed', 'shipped', 'arrived']
const stepLabels = ['待确认', '已确认', '已发货', '已到货']

function getActiveStep(status: string) {
  return statusSteps.indexOf(status)
}

async function fetchDetail() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const [orderRes, arrivalsRes, logsRes] = await Promise.all([
      getOrder(id),
      getArrivals({ order_id: id }),
      getLogs({ entity_type: 'order', entity_id: id }),
    ])
    order.value = orderRes.data
    arrivals.value = arrivalsRes.data.items || []
    logs.value = logsRes.data.items || []
  } catch {
  } finally {
    loading.value = false
  }
}

async function handleStatusChange(status: string) {
  const labels: Record<string, string> = {
    confirmed: '确认此订货单？',
    shipped: '标记为已发货？',
  }
  try {
    await ElMessageBox.confirm(labels[status] || '确认操作？', '提示', { type: 'warning' })
    await updateOrderStatus(order.value!.id, status)
    ElMessage.success('状态更新成功')
    fetchDetail()
  } catch {}
}

const actionTagMap: Record<string, string> = {
  create: 'success',
  update: 'primary',
  status_change: 'warning',
  confirm: 'success',
  delete: 'danger',
  attach: 'info',
}

onMounted(fetchDetail)
</script>

<template>
  <div class="p-6" v-loading="loading">
    <div v-if="order">
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-xl font-bold m-0">订货单详情</h1>
        <div class="flex gap-2">
          <el-button v-if="order.status === 'pending'" type="success" @click="handleStatusChange('confirmed')">确认订货</el-button>
          <el-button v-if="order.status === 'confirmed'" type="warning" @click="handleStatusChange('shipped')">标记发货</el-button>
          <el-button v-if="order.status === 'shipped'" type="primary" @click="router.push(`/arrivals/new?orderId=${order.id}`)">创建到货通知</el-button>
          <el-button @click="router.push('/orders')">返回列表</el-button>
        </div>
      </div>

      <el-card class="mb-5">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="单号">{{ order.order_no }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ order.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="客户电话">{{ order.customer_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ order.product_name }}</el-descriptions-item>
          <el-descriptions-item label="产品规格">{{ order.product_spec || '-' }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ order.quantity }}{{ order.unit }}</el-descriptions-item>
          <el-descriptions-item label="单价">¥{{ order.unit_price }}</el-descriptions-item>
          <el-descriptions-item label="合计金额">
            <span class="font-bold text-[#5D4037]">¥{{ order.total_amount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusMap[order.status]?.type">{{ statusMap[order.status]?.label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ order.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ order.updated_at }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ order.note || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="mb-5">
        <template #header><span class="font-bold">状态流转</span></template>
        <el-steps :active="getActiveStep(order.status)" finish-status="success" align-center>
          <el-step v-for="(label, i) in stepLabels" :key="i" :title="label" />
        </el-steps>
      </el-card>

      <el-card v-if="order.attachments && order.attachments.length > 0" class="mb-5">
        <template #header><span class="font-bold">附件列表</span></template>
        <div v-for="att in order.attachments" :key="att.id" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div class="flex items-center gap-3">
            <span class="text-sm">{{ att.file_name }}</span>
            <span class="text-xs text-gray-400">{{ att.note }}</span>
          </div>
          <el-tag :type="att.status === 'uploaded' ? 'success' : 'info'" size="small">{{ att.status === 'uploaded' ? '已上传' : '占位' }}</el-tag>
        </div>
      </el-card>

      <el-card v-if="arrivals.length > 0" class="mb-5">
        <template #header><span class="font-bold">关联到货通知</span></template>
        <el-table :data="arrivals" stripe>
          <el-table-column prop="arrival_no" label="通知单号" width="150" />
          <el-table-column prop="product_name" label="产品" width="140" />
          <el-table-column label="订货数量" width="100">
            <template #default="{ row }">{{ row.ordered_quantity }}{{ row.unit }}</template>
          </el-table-column>
          <el-table-column label="实到数量" width="100">
            <template #default="{ row }">{{ row.actual_quantity ?? '-' }}{{ row.unit }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'confirmed' ? 'success' : row.status === 'exception' ? 'danger' : 'warning'" size="small">
                {{ row.status === 'confirmed' ? '已确认' : row.status === 'exception' ? '异常' : '待确认' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="router.push(`/arrivals/${row.id}`)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card v-if="logs.length > 0">
        <template #header><span class="font-bold">操作日志</span></template>
        <el-timeline>
          <el-timeline-item
            v-for="log in logs"
            :key="log.id"
            :timestamp="log.created_at"
            placement="top"
          >
            <div class="flex items-center gap-2">
              <el-tag :type="actionTagMap[log.action]" size="small">{{ log.action }}</el-tag>
              <span class="text-sm">{{ log.detail }}</span>
              <span class="text-xs text-gray-400 ml-auto">{{ log.operator }}</span>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>
