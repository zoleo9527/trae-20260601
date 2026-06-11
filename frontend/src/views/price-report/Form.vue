<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ editId ? '编辑报备' : '新增报备' }}</h2>
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div class="card-section">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="right"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联活动" prop="campaign_id">
              <el-select
                v-model="form.campaign_id"
                placeholder="请选择关联的折扣活动"
                style="width: 100%"
                :disabled="!!route.query.campaign_id || !!editId"
                filterable
              >
                <el-option
                  v-for="item in campaignList"
                  :key="item.id"
                  :label="`${item.campaign_no} - ${item.title}`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报备日期">
              <el-date-picker
                v-model="form.report_date"
                type="date"
                placeholder="选择报备日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="product_name">
              <el-input v-model="form.product_name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品编码">
              <el-input v-model="form.product_code" placeholder="请输入商品编码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="原价" prop="original_price">
              <el-input-number
                v-model="form.original_price"
                :min="0.01"
                :precision="2"
                :step="10"
                placeholder="请输入原价"
                style="width: 100%"
                @change="validatePrice"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="折扣价" prop="discount_price">
              <el-input-number
                v-model="form.discount_price"
                :min="0.01"
                :precision="2"
                :step="10"
                placeholder="请输入折扣价"
                style="width: 100%"
                @change="validatePrice"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="折扣率">
              <div style="line-height: 40px;">
                <span v-if="calculatedRate" style="font-size: 18px; font-weight: 600; color: #f56c6c;">
                  {{ (calculatedRate * 10).toFixed(1) }}折
                </span>
                <span v-else style="color: #c0c4cc;">自动计算</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-alert
          v-if="validationErrors.length > 0"
          type="warning"
          title="存在异常项"
          show-icon
          closable
        >
          <template #default>
            <ul>
              <li v-for="(err, index) in validationErrors" :key="index">{{ err }}</li>
            </ul>
          </template>
        </el-alert>

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="loading">
            保存草稿
          </el-button>
          <el-button type="success" @click="handleSubmit" :loading="loading">
            提交报备
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog v-model="confirmDialogVisible" title="确认提交" width="480px">
      <el-alert
        v-if="validationErrors.length > 0"
        type="warning"
        title="存在异常项"
        :description="validationErrors.join('；')"
        show-icon
      />
      <div style="margin-top: 16px;">
        {{ validationErrors.length > 0 ? '提交前请确认以上异常，是否仍要提交？' : '确定要提交报备吗？' }}
      </div>
      <el-form v-if="validationErrors.length > 0" style="margin-top: 16px;">
        <el-checkbox v-model="confirmException">我已确认上述异常，仍要提交</el-checkbox>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="validationErrors.length > 0 && !confirmException"
          @click="executeSubmit"
        >
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { priceReportApi, discountApi } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const editId = ref(route.query.id)
const confirmDialogVisible = ref(false)
const confirmException = ref(false)
const validationErrors = ref([])
const campaignList = ref([])
const calculatedRate = ref(null)

const form = reactive({
  campaign_id: route.query.campaign_id ? parseInt(route.query.campaign_id) : null,
  product_name: '',
  product_code: '',
  original_price: null,
  discount_price: null,
  report_date: ''
})

const rules = {
  campaign_id: [{ required: true, message: '请选择关联活动', trigger: 'change' }],
  product_name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  original_price: [{ required: true, message: '请输入原价', trigger: 'blur' }],
  discount_price: [{ required: true, message: '请输入折扣价', trigger: 'blur' }]
}

async function loadCampaigns() {
  try {
    const res = await discountApi.getList({ page: 1, per_page: 100 })
    campaignList.value = res.items.filter(item =>
      item.created_by === userStore.userInfo.id &&
      item.status !== 'archived'
    )
  } catch (e) {
    console.error('Load campaigns error:', e)
  }
}

async function loadDetail() {
  if (!editId.value) return
  try {
    const res = await priceReportApi.getDetail(editId.value)
    Object.assign(form, {
      campaign_id: res.campaign_id,
      product_name: res.product_name,
      product_code: res.product_code,
      original_price: res.original_price,
      discount_price: res.discount_price,
      report_date: res.report_date
    })
    validatePrice()
  } catch (e) {
    console.error('Load detail error:', e)
  }
}

async function validatePrice() {
  validationErrors.value = []
  calculatedRate.value = null

  if (form.original_price && form.discount_price) {
    try {
      const res = await priceReportApi.validate({
        original_price: form.original_price,
        discount_price: form.discount_price
      })
      validationErrors.value = res.exceptions || []
      calculatedRate.value = res.calculated_rate
    } catch (e) {
      console.error('Validate price error:', e)
    }
  }
}

async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    if (editId.value) {
      await priceReportApi.update(editId.value, form)
      ElMessage.success('保存成功')
    } else {
      const res = await priceReportApi.create(form)
      ElMessage.success('创建成功')
      router.push(`/price-report/${res.id}`)
      return
    }
    router.back()
  } catch (e) {
    console.error('Save error:', e)
  } finally {
    loading.value = false
  }
}

function handleSubmit() {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    confirmException.value = false
    confirmDialogVisible.value = true
  })
}

async function executeSubmit() {
  try {
    loading.value = true
    let res
    if (editId.value) {
      await priceReportApi.update(editId.value, form)
      res = await priceReportApi.submit(editId.value, { confirm_exception: confirmException.value })
    } else {
      const createRes = await priceReportApi.create(form)
      res = await priceReportApi.submit(createRes.id, { confirm_exception: confirmException.value })
    }
    ElMessage.success('提交成功')
    router.push(`/price-report/${res.id}`)
  } catch (e) {
    console.error('Submit error:', e)
  } finally {
    loading.value = false
    confirmDialogVisible.value = false
  }
}

onMounted(() => {
  loadCampaigns()
  if (editId.value) {
    loadDetail()
  }
})
</script>
