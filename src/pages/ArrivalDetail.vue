<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getArrival, confirmArrival } from '@/api/arrivals'
import { getLogs } from '@/api/logs'
import type { Arrival, OperationLog } from '@/types'

const route = useRoute()
const router = useRouter()
const arrival = ref<Arrival | null>(null)
const logs = ref<OperationLog[]>([])
const loading = ref(false)

const confirmVisible = ref(false)
const confirmForm = ref({ actual_quantity: 0, exception_note: '' })
const confirmLoading = ref(false)

const showExceptionField = computed(() => {
  if (!arrival.value) return false
  return confirmForm.value.actual_quantity !== arrival.value.ordered_quantity
})

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'success' },
  exception: { label: '异常', type: 'danger' },
}

const actionTagMap: Record<string, string> = {
  create: 'success',
  update: 'primary',
  status_change: 'warning',
  confirm: 'success',
  delete: 'danger',
  attach: 'info',
}

async function fetchDetail() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const [arrivalRes, logsRes] = await Promise.all([
      getArrival(id),
      getLogs({ entity_type: 'arrival', entity_id: id }),
    ])
    arrival.value = arrivalRes.data
    logs.value = logsRes.data.items || []
  } catch {
  } finally {
    loading.value = false
  }
}

function openConfirmDialog() {
  if (!arrival.value) return
  confirmForm.value.actual_quantity = arrival.value.ordered_quantity
  confirmForm.value.exception_note = arrival.value.exception_note || ''
  confirmVisible.value = true
}

async function handleConfirm() {
  if (!arrival.value) return
  confirmLoading.value = true
  try {
    await confirmArrival(arrival.value.id, {
      actual_quantity: confirmForm.value.actual_quantity,
      exception_note: showExceptionField.value ? confirmForm.value.exception_note : '',
    })
    ElMessage.success('到货确认成功')
    confirmVisible.value = false
    fetchDetail()
  } catch {
  } finally {
    confirmLoading.value = false
  }
}

onMounted(fetchDetail)
</script>

<template>
  <div class="p-6" v-loading="loading">
    <div v-if="arrival">
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-xl font-bold m-0">到货通知详情</h1>
        <div class="flex gap-2">
          <el-button v-if="arrival.status === 'pending'" type="success" @click="openConfirmDialog">确认到货</el-button>
          <el-button @click="router.push('/arrivals')">返回列表</el-button>
        </div>
      </div>

      <el-card class="mb-5">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="通知单号">{{ arrival.arrival_no }}</el-descriptions-item>
          <el-descriptions-item label="关联订货单号">
            <router-link :to="`/orders/${arrival.order_id}`" class="text-[#5D4037] no-underline hover:underline">{{ arrival.order_no }}</router-link>
          </el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ arrival.product_name }}</el-descriptions-item>
          <el-descriptions-item label="产品规格">{{ arrival.product_spec || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订货数量">{{ arrival.ordered_quantity }}{{ arrival.unit }}</el-descriptions-item>
          <el-descriptions-item label="实到数量">
            <span :class="{ 'text-red-600 font-bold': arrival.actual_quantity !== null && arrival.actual_quantity !== arrival.ordered_quantity }">
              {{ arrival.actual_quantity ?? '-' }}{{ arrival.unit }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusMap[arrival.status]?.type">{{ statusMap[arrival.status]?.label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ arrival.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ arrival.updated_at }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="mb-5" style="background: #EFEBE9">
        <template #header><span class="font-bold">订货备注</span></template>
        <p class="text-sm m-0 whitespace-pre-wrap">{{ arrival.order_note || '无' }}</p>
      </el-card>

      <el-card class="mb-5">
        <template #header><span class="font-bold">到货备注</span></template>
        <p class="text-sm m-0 whitespace-pre-wrap">{{ arrival.arrival_note || '无' }}</p>
      </el-card>

      <el-card v-if="arrival.exception_note" class="mb-5" style="background: #FFEBEE">
        <template #header><span class="font-bold text-red-700">异常说明</span></template>
        <p class="text-sm m-0 whitespace-pre-wrap text-red-800">{{ arrival.exception_note }}</p>
      </el-card>

      <el-card v-if="arrival.attachments && arrival.attachments.length > 0" class="mb-5">
        <template #header><span class="font-bold">附件列表</span></template>
        <div v-for="att in arrival.attachments" :key="att.id" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div class="flex items-center gap-3">
            <span class="text-sm">{{ att.file_name }}</span>
            <span class="text-xs text-gray-400">{{ att.note }}</span>
          </div>
          <el-tag :type="att.status === 'uploaded' ? 'success' : 'info'" size="small">{{ att.status === 'uploaded' ? '已上传' : '占位' }}</el-tag>
        </div>
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

      <el-dialog v-model="confirmVisible" title="确认到货" width="480px" :close-on-click-modal="false">
        <el-form :model="confirmForm" label-width="100px">
          <el-form-item label="订货数量">
            <span>{{ arrival?.ordered_quantity }}{{ arrival?.unit }}</span>
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
  </div>
</template>
