<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrder } from '@/api/orders'
import { createArrival } from '@/api/arrivals'
import type { Order } from '@/types'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const order = ref<Order | null>(null)

const form = ref({
  arrival_note: '',
  actual_quantity: 0,
  exception_note: '',
})

const showException = computed(() => {
  if (!order.value) return false
  return Number(form.value.actual_quantity) !== order.value.quantity
})

onMounted(async () => {
  const orderId = route.query.orderId as string
  if (!orderId) {
    ElMessage.warning('缺少订货单ID')
    router.push('/arrivals')
    return
  }
  try {
    const res = await getOrder(Number(orderId))
    order.value = res.data
    form.value.actual_quantity = res.data.quantity
  } catch {
    router.push('/arrivals')
  }
})

async function handleSubmit() {
  loading.value = true
  try {
    const data: Record<string, any> = {
      order_id: order.value!.id,
      actual_quantity: form.value.actual_quantity,
      arrival_note: form.value.arrival_note,
    }
    if (showException.value) {
      data.exception_note = form.value.exception_note
    }
    await createArrival(data)
    ElMessage.success('到货通知创建成功')
    router.push('/arrivals')
  } catch {
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-xl font-bold mb-5">创建到货通知</h1>

    <el-card v-if="order" class="mb-5">
      <template #header><span class="font-bold">关联订货单信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订货单号">{{ order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ order.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ order.product_name }}</el-descriptions-item>
        <el-descriptions-item label="产品规格">{{ order.product_spec || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订货数量">{{ order.quantity }}{{ order.unit }}</el-descriptions-item>
        <el-descriptions-item label="订货备注">{{ order.note || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card v-if="order && order.attachments && order.attachments.length > 0" class="mb-5">
      <template #header><span class="font-bold">订货单附件</span></template>
      <div v-for="att in order.attachments" :key="att.id" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <div class="flex items-center gap-3">
          <span class="text-sm">{{ att.file_name }}</span>
          <span class="text-xs text-gray-400">{{ att.note }}</span>
        </div>
        <el-tag :type="att.status === 'uploaded' ? 'success' : 'info'" size="small">{{ att.status === 'uploaded' ? '已上传' : '占位' }}</el-tag>
      </div>
    </el-card>

    <el-card class="mb-5">
      <template #header><span class="font-bold">到货信息</span></template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="实到数量">
          <el-input-number v-model="form.actual_quantity" :min="0" style="width: 200px" />
        </el-form-item>
        <el-form-item label="到货备注">
          <el-input v-model="form.arrival_note" type="textarea" :rows="4" placeholder="请输入到货备注" />
        </el-form-item>
        <el-form-item v-if="showException" label="异常说明">
          <el-input v-model="form.exception_note" type="textarea" :rows="3" placeholder="实到数量与订货数量不符，请说明原因" />
        </el-form-item>
      </el-form>
    </el-card>

    <div class="flex gap-3">
      <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
      <el-button @click="router.back()">取消</el-button>
    </div>
  </div>
</template>
