<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; gap: 12px">
          <el-button type="text" :icon="ArrowLeft" @click="$router.back()">返回</el-button>
          <span style="font-weight: 500; font-size: 16px">新建赠品核销单</span>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" style="max-width: 900px">
        <el-form-item label="选择预订" prop="bookingId">
          <el-select
            v-model="form.bookingId"
            placeholder="请选择预订"
            filterable
            style="width: 400px"
            @change="handleBookingChange"
            :disabled="bookingLocked"
          >
            <el-option
              v-for="b in bookingList"
              :key="b.id"
              :label="`${b.bookingNo} - ${b.roomNo} - ${b.customerName || '散客'}`"
              :value="b.id"
            />
          </el-select>
          <el-tag v-if="bookingLocked" type="warning" size="small" style="margin-left: 10px">
            <Lock style="width: 12px; height: 12px; margin-right: 4px" />
            已锁定关联预订
          </el-tag>
        </el-form-item>

        <el-card v-if="selectedBooking" style="background: #f5f7fa; margin-bottom: 20px">
          <div style="display: flex; gap: 40px; flex-wrap: wrap">
            <div><strong>预订号：</strong>{{ selectedBooking.bookingNo }}</div>
            <div><strong>包厢：</strong>{{ selectedBooking.roomNo }}</div>
            <div><strong>客户：</strong>{{ selectedBooking.customerName || '散客' }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
          <div style="display: flex; gap: 40px; flex-wrap: wrap">
            <div><strong>赠送总额度：</strong><span style="color: #409eff; font-weight: 500">¥{{ selectedBooking.giftAmount }}</span></div>
            <div><strong>历史已核销：</strong><span style="color: #e6a23c; font-weight: 500">¥{{ historicalUsedAmount.toFixed(2) }}</span></div>
            <div><strong>剩余可用：</strong><span style="color: #67c23a; font-weight: 500; font-size: 16px">¥{{ remainingAmount.toFixed(2) }}</span></div>
          </div>
        </el-card>

        <el-divider content-position="left">核销酒水明细</el-divider>

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
              <el-input-number v-model="row.quantity" :min="1" style="width: 100%" @change="checkAmount" />
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
            本次核销：<span :style="{ color: totalAmount > remainingAmount ? '#f56c6c' : '#409eff', fontSize: '20px' }">¥{{ totalAmount.toFixed(2) }}</span>
            <span v-if="totalAmount > remainingAmount" style="color: #f56c6c; font-size: 14px; margin-left: 10px">（超出可用额度）</span>
          </span>
        </div>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" :disabled="totalAmount > remainingAmount || !form.bookingId" @click="handleSubmit">提交</el-button>
          <el-button size="large" @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Lock } from '@element-plus/icons-vue'
import { getAvailableDrinks } from '@/api/drink'
import { getBookingPage, getBooking } from '@/api/booking'
import { createVerification, getBookingUsedAmount, getBookingRemainingAmount } from '@/api/verification'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const drinkList = ref([])
const bookingList = ref([])
const selectedBooking = ref(null)
const submitting = ref(false)
const bookingLocked = ref(false)
const historicalUsedAmount = ref(0)

const form = reactive({
  bookingId: null,
  usedAmount: 0,
  remark: '',
  idempotentKey: '',
  items: []
})

const rules = {
  bookingId: [{ required: true, message: '请选择预订', trigger: 'change' }]
}

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
})

const remainingAmount = computed(() => {
  if (!selectedBooking.value) return 0
  const totalGift = Number(selectedBooking.value.giftAmount) || 0
  return totalGift - historicalUsedAmount.value
})

const loadData = async () => {
  drinkList.value = await getAvailableDrinks()
  const bookingData = await getBookingPage({ pageNum: 1, pageSize: 100 })
  bookingList.value = bookingData.records.filter(b => Number(b.giftAmount) > 0)

  const queryBookingId = route.query.bookingId
  if (queryBookingId) {
    form.bookingId = Number(queryBookingId)
    bookingLocked.value = true
    await handleBookingChange(form.bookingId)
  }
}

const handleBookingChange = async (id) => {
  selectedBooking.value = bookingList.value.find(b => b.id === id)
  if (!selectedBooking.value) {
    selectedBooking.value = await getBooking(id)
  }
  if (selectedBooking.value) {
    historicalUsedAmount.value = await getBookingUsedAmount(id)
  }
  form.items = []
  addItem()
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

const checkAmount = () => {
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  if (form.items.length === 0) {
    ElMessage.warning('请添加至少一项酒水')
    return
  }
  if (totalAmount.value > remainingAmount.value) {
    ElMessage.error('核销金额不能超过剩余可用额度')
    return
  }

  submitting.value = true
  try {
    form.idempotentKey = Date.now().toString()
    form.usedAmount = totalAmount.value
    await createVerification(form)
    ElMessage.success('提交成功')
    router.push('/verification')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
