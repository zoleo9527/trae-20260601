<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getArrivals, confirmArrival } from '@/api/arrivals'
import { exportArrivals } from '@/api/export'
import type { Arrival } from '@/types'

const router = useRouter()
const arrivals = ref<Arrival[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)

const filters = ref({
  status: '',
  orderId: '',
  dateRange: null as [string, string] | null,
})

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '异常', value: 'exception' },
]

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'success' },
  exception: { label: '异常', type: 'danger' },
}

const confirmVisible = ref(false)
const confirmRow = ref<Arrival | null>(null)
const confirmForm = ref({ actual_quantity: 0, exception_note: '' })
const confirmLoading = ref(false)

const showExceptionField = computed(() => {
  if (!confirmRow.value) return false
  return confirmForm.value.actual_quantity !== confirmRow.value.ordered_quantity
})

async function fetchArrivals() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.orderId) params.order_id = filters.value.orderId
    if (filters.value.dateRange) {
      params.date_from = filters.value.dateRange[0]
      params.date_to = filters.value.dateRange[1]
    }
    const res = await getArrivals(params)
    arrivals.value = res.data.items || []
    total.value = res.data.total || 0
  } catch {
  } finally {
    loading.value = false
  }
}

function openConfirmDialog(row: Arrival) {
  confirmRow.value = row
  confirmForm.value.actual_quantity = row.ordered_quantity
  confirmForm.value.exception_note = ''
  confirmVisible.value = true
}

async function handleConfirm() {
  if (!confirmRow.value) return
  confirmLoading.value = true
  try {
    await confirmArrival(confirmRow.value.id, {
      actual_quantity: confirmForm.value.actual_quantity,
      exception_note: showExceptionField.value ? confirmForm.value.exception_note : '',
    })
    ElMessage.success('确认到货成功')
    confirmVisible.value = false
    fetchArrivals()
  } catch {
  } finally {
    confirmLoading.value = false
  }
}

function handleExport() {
  const params: Record<string, any> = {}
  if (filters.value.status) params.status = filters.value.status
  if (filters.value.orderId) params.order_id = filters.value.orderId
  if (filters.value.dateRange) {
    params.date_from = filters.value.dateRange[0]
    params.date_to = filters.value.dateRange[1]
  }
  exportArrivals(params).then(() => ElMessage.success('导出成功')).catch(() => {})
}

function handlePageChange(val: number) {
  page.value = val
  fetchArrivals()
}

onMounted(fetchArrivals)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-xl font-bold m-0">到货通知管理</h1>
      <el-button type="primary" @click="router.push('/orders?status=shipped')">从订货单创建</el-button>
    </div>

    <el-card class="mb-5">
      <div class="flex items-center gap-4 flex-wrap">
        <el-select v-model="filters.status" placeholder="状态筛选" clearable style="width: 140px" @change="fetchArrivals">
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-input v-model="filters.orderId" placeholder="订货单号搜索" clearable style="width: 200px" @clear="fetchArrivals" @keyup.enter="fetchArrivals" />
        <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px" />
        <el-button type="primary" @click="fetchArrivals">搜索</el-button>
        <el-button @click="handleExport">导出CSV</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="arrivals" v-loading="loading" stripe>
        <el-table-column prop="arrival_no" label="通知单号" width="150" />
        <el-table-column label="关联订货单号" width="150">
          <template #default="{ row }">
            <router-link :to="`/orders/${row.order_id}`" class="text-[#5D4037] no-underline hover:underline">{{ row.order_no }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="product_name" label="产品" width="140" />
        <el-table-column label="订货数量" width="100">
          <template #default="{ row }">{{ row.ordered_quantity }}{{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="实到数量" width="100">
          <template #default="{ row }">{{ row.actual_quantity ?? '-' }}{{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="到货备注" min-width="150">
          <template #default="{ row }">{{ row.arrival_note ? (row.arrival_note.length > 20 ? row.arrival_note.slice(0, 20) + '...' : row.arrival_note) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="router.push(`/arrivals/${row.id}`)">查看详情</el-button>
            <el-button v-if="row.status === 'pending'" link type="success" size="small" @click="openConfirmDialog(row)">确认到货</el-button>
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

    <el-dialog v-model="confirmVisible" title="确认到货" width="480px" :close-on-click-modal="false">
      <el-form :model="confirmForm" label-width="100px">
        <el-form-item label="通知单号">
          <span>{{ confirmRow?.arrival_no }}</span>
        </el-form-item>
        <el-form-item label="订货数量">
          <span>{{ confirmRow?.ordered_quantity }}{{ confirmRow?.unit }}</span>
        </el-form-item>
        <el-form-item label="实到数量" required>
          <el-input-number v-model="confirmForm.actual_quantity" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item v-if="showExceptionField" label="异常说明" required>
          <el-input v-model="confirmForm.exception_note" type="textarea" :rows="3" placeholder="实到数量与订货数量不符，请说明原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" :loading="confirmLoading" @click="handleConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
