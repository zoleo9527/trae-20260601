<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; gap: 12px">
          <el-button type="text" :icon="ArrowLeft" @click="$router.back()">返回</el-button>
          <span style="font-weight: 500; font-size: 16px">新建出库单</span>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" style="max-width: 900px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联预订">
              <el-input v-model="bookingNo" placeholder="输入预订号查询" style="width: 200px" />
              <el-button type="primary" @click="searchBooking">查询</el-button>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出库类型" prop="outboundType">
              <el-radio-group v-model="form.outboundType">
                <el-radio value="SALE">销售出库</el-radio>
                <el-radio value="GIFT">赠送出库</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-card v-if="selectedBooking" style="background: #f5f7fa; margin-bottom: 20px">
          <div style="display: flex; gap: 40px">
            <div><strong>预订号：</strong>{{ selectedBooking.bookingNo }}</div>
            <div><strong>包厢：</strong>{{ selectedBooking.roomNo }}</div>
            <div><strong>客户：</strong>{{ selectedBooking.customerName }}</div>
            <div><strong>赠送额度：</strong>¥{{ selectedBooking.giftAmount }}</div>
          </div>
        </el-card>

        <el-divider content-position="left">酒水明细</el-divider>

        <el-table :data="form.items" border style="width: 100%; margin-bottom: 20px">
          <el-table-column prop="drinkName" label="酒水名称" width="200">
            <template #default="{ row, $index }">
              <el-select v-model="row.drinkId" placeholder="选择酒水" filterable style="width: 100%" @change="handleDrinkChange($index)">
                <el-option v-for="d in drinkList" :key="d.id" :label="d.drinkName" :value="d.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="spec" label="规格" width="120" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="price" label="单价" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="2" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="金额" width="120">
            <template #default="{ row }">¥{{ ((row.price || 0) * (row.quantity || 0)).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button type="danger" link @click="removeItem($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-bottom: 20px">
          <el-button type="primary" :icon="Plus" @click="addItem">添加酒水</el-button>
          <span style="float: right; font-size: 16px; font-weight: 500">
            合计：<span style="color: #f56c6c; font-size: 20px">¥{{ totalAmount.toFixed(2) }}</span>
          </span>
        </div>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">提交</el-button>
          <el-button size="large" @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { getAvailableDrinks } from '@/api/drink'
import { getBookingByNo } from '@/api/booking'
import { createOutbound } from '@/api/outbound'

const router = useRouter()
const formRef = ref()
const drinkList = ref([])
const bookingNo = ref('')
const selectedBooking = ref(null)
const submitting = ref(false)

const form = reactive({
  bookingId: null,
  outboundType: 'SALE',
  remark: '',
  idempotentKey: '',
  items: []
})

const rules = {
  outboundType: [{ required: true, message: '请选择出库类型', trigger: 'change' }]
}

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
})

const loadDrinks = async () => {
  drinkList.value = await getAvailableDrinks()
}

const searchBooking = async () => {
  if (!bookingNo.value) {
    ElMessage.warning('请输入预订号')
    return
  }
  try {
    selectedBooking.value = await getBookingByNo(bookingNo.value)
    form.bookingId = selectedBooking.value.id
  } catch {
    ElMessage.error('未找到该预订')
  }
}

const addItem = () => {
  form.items.push({
    drinkId: null,
    drinkName: '',
    spec: '',
    unit: '',
    price: 0,
    quantity: 1
  })
}

const removeItem = (index) => {
  form.items.splice(index, 1)
}

const handleDrinkChange = (index) => {
  const item = form.items[index]
  const drink = drinkList.value.find(d => d.id === item.drinkId)
  if (drink) {
    item.drinkName = drink.drinkName
    item.spec = drink.spec
    item.unit = drink.unit
    item.price = drink.price
  }
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  if (form.items.length === 0) {
    ElMessage.warning('请添加至少一项酒水')
    return
  }

  submitting.value = true
  try {
    form.idempotentKey = Date.now().toString()
    await createOutbound(form)
    ElMessage.success('提交成功')
    router.push('/outbound')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDrinks()
  addItem()
})
</script>
