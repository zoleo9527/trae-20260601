<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrders, updateOrderStatus } from '@/api/orders'
import { exportOrders } from '@/api/export'
import type { Order } from '@/types'

const router = useRouter()
const route = useRoute()
const orders = ref<Order[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)

const filters = ref({
  status: '',
  customer: '',
  dateRange: null as [string, string] | null,
})

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已发货', value: 'shipped' },
  { label: '已到货', value: 'arrived' },
]

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'primary' },
  shipped: { label: '已发货', type: 'info' },
  arrived: { label: '已到货', type: 'success' },
}

async function fetchOrders() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.customer) params.customer = filters.value.customer
    if (filters.value.dateRange) {
      params.date_from = filters.value.dateRange[0]
      params.date_to = filters.value.dateRange[1]
    }
    const res = await getOrders(params)
    orders.value = res.data.items || []
    total.value = res.data.total || 0
  } catch {
  } finally {
    loading.value = false
  }
}

async function handleStatusChange(id: number, status: string) {
  const labels: Record<string, string> = {
    confirmed: '确认此订货单？',
    shipped: '标记为已发货？',
  }
  try {
    await ElMessageBox.confirm(labels[status] || '确认操作？', '提示', { type: 'warning' })
    await updateOrderStatus(id, status)
    ElMessage.success('状态更新成功')
    fetchOrders()
  } catch {}
}

function handleExport() {
  const params: Record<string, any> = {}
  if (filters.value.status) params.status = filters.value.status
  if (filters.value.customer) params.customer = filters.value.customer
  if (filters.value.dateRange) {
    params.date_from = filters.value.dateRange[0]
    params.date_to = filters.value.dateRange[1]
  }
  exportOrders(params).then(() => ElMessage.success('导出成功')).catch(() => {})
}

function handlePageChange(val: number) {
  page.value = val
  fetchOrders()
}

onMounted(() => {
  const qs = route.query.status as string
  if (qs) filters.value.status = qs
  fetchOrders()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-xl font-bold m-0">肥料订货管理</h1>
      <el-button type="primary" @click="router.push('/orders/new')">新建订货单</el-button>
    </div>

    <el-card class="mb-5">
      <div class="flex items-center gap-4 flex-wrap">
        <el-select v-model="filters.status" placeholder="状态筛选" clearable style="width: 140px" @change="fetchOrders">
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-input v-model="filters.customer" placeholder="客户名称搜索" clearable style="width: 200px" @clear="fetchOrders" @keyup.enter="fetchOrders" />
        <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px" />
        <el-button type="primary" @click="fetchOrders">搜索</el-button>
        <el-button @click="handleExport">导出CSV</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="单号" width="150" />
        <el-table-column prop="customer_name" label="客户" width="120" />
        <el-table-column prop="product_name" label="产品" width="140" />
        <el-table-column label="数量" width="100">
          <template #default="{ row }">{{ row.quantity }}{{ row.unit }}</template>
        </el-table-column>
        <el-table-column prop="total_amount" label="金额" width="110">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">{{ row.note ? (row.note.length > 20 ? row.note.slice(0, 20) + '...' : row.note) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="router.push(`/orders/${row.id}`)">查看详情</el-button>
            <el-button v-if="row.status === 'pending'" link type="success" size="small" @click="handleStatusChange(row.id, 'confirmed')">确认</el-button>
            <el-button v-if="row.status === 'confirmed'" link type="warning" size="small" @click="handleStatusChange(row.id, 'shipped')">发货</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>
