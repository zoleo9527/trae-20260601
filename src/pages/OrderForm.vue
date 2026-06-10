<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrder, createOrder, updateOrder } from '@/api/orders'
import { createAttachment, deleteAttachment } from '@/api/attachments'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const loading = ref(false)

const form = ref({
  customer_name: '',
  customer_phone: '',
  product_name: '',
  product_spec: '',
  quantity: 1,
  unit: 'kg',
  unit_price: 0,
  note: '',
})

const attachments = ref<{ file_name: string; note: string }[]>([])

const totalAmount = computed(() => {
  const q = Number(form.value.quantity) || 0
  const p = Number(form.value.unit_price) || 0
  return Math.round(q * p * 100) / 100
})

const unitOptions = ['kg', '袋', '吨']

function addAttachment() {
  attachments.value.push({ file_name: '', note: '' })
}

function removeAttachment(index: number) {
  attachments.value.splice(index, 1)
}

async function handleSubmit() {
  if (!form.value.customer_name) {
    ElMessage.warning('请输入客户名称')
    return
  }
  if (!form.value.product_name) {
    ElMessage.warning('请输入产品名称')
    return
  }
  loading.value = true
  try {
    const data = { ...form.value, total_amount: totalAmount.value }
    let orderId: number
    if (isEdit.value) {
      const res = await updateOrder(Number(route.params.id), data)
      orderId = Number(route.params.id)
      ElMessage.success('更新成功')
    } else {
      const res = await createOrder(data)
      orderId = res.data.id
      ElMessage.success('创建成功')
    }
    for (const att of attachments.value) {
      if (att.file_name) {
        await createAttachment({
          entity_type: 'order',
          entity_id: orderId,
          file_name: att.file_name,
          note: att.note,
        })
      }
    }
    router.push('/orders')
  } catch {
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) {
    try {
      const res = await getOrder(Number(route.params.id))
      const o = res.data
      form.value = {
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        product_name: o.product_name,
        product_spec: o.product_spec,
        quantity: o.quantity,
        unit: o.unit,
        unit_price: o.unit_price,
        note: o.note,
      }
      attachments.value = o.attachments?.map((a: any) => ({ file_name: a.file_name, note: a.note })) || []
    } catch {}
  }
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-xl font-bold mb-5">{{ isEdit ? '编辑订货单' : '新建订货单' }}</h1>

    <el-card>
      <el-form :model="form" label-width="100px" label-position="right">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" required>
              <el-input v-model="form.customer_name" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户电话">
              <el-input v-model="form.customer_phone" placeholder="请输入客户电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" required>
              <el-input v-model="form.product_name" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品规格">
              <el-input v-model="form.product_spec" placeholder="请输入产品规格" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="数量" required>
              <el-input-number v-model="form.quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位">
              <el-select v-model="form.unit" style="width: 100%">
                <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单价">
              <el-input-number v-model="form.unit_price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="合计金额">
          <span class="text-lg font-bold text-[#5D4037]">¥{{ totalAmount }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="4" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="mt-5">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">附件占位</span>
          <el-button size="small" @click="addAttachment">添加附件</el-button>
        </div>
      </template>
      <div v-for="(att, index) in attachments" :key="index" class="flex items-center gap-3 mb-3">
        <el-input v-model="att.file_name" placeholder="文件名称" style="width: 250px" />
        <el-input v-model="att.note" placeholder="备注说明" style="width: 250px" />
        <el-button type="danger" link @click="removeAttachment(index)">删除</el-button>
      </div>
      <div v-if="attachments.length === 0" class="text-gray-400 text-center py-4">暂无附件</div>
    </el-card>

    <div class="flex gap-3 mt-5">
      <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
      <el-button @click="router.back()">取消</el-button>
    </div>
  </div>
</template>
