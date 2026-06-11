<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ editId ? '编辑活动' : '新建活动' }}</h2>
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
            <el-form-item label="活动名称" prop="title">
              <el-input v-model="form.title" placeholder="请输入活动名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand_name">
              <el-input v-model="form.brand_name" placeholder="请输入品牌名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="门店">
              <el-input v-model="form.store_name" :disabled="!!userStoreName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动类型">
              <el-select v-model="form.discount_type" placeholder="请选择活动类型" style="width: 100%">
                <el-option
                  v-for="item in DISCOUNT_TYPES"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="折扣率">
              <el-input-number
                v-model="form.discount_rate"
                :min="0.01"
                :max="1"
                :step="0.05"
                :precision="2"
                placeholder="0-1之间"
                style="width: 100%"
              />
              <div style="color: #909399; font-size: 12px; margin-top: 4px;">
                {{ form.discount_rate ? `约${(form.discount_rate * 10).toFixed(1)}折` : '例如：0.8表示8折' }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
                type="date"
                placeholder="选择开始日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结束日期" prop="end_date">
              <el-date-picker
                v-model="form.end_date"
                type="date"
                placeholder="选择结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="活动描述">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="请详细描述活动内容"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="台账记录">
              <div style="width: 100%">
                <el-table :data="form.records" border size="small">
                  <el-table-column prop="record_type" label="类型" width="120">
                    <template #default="{ row }">
                      <el-select v-model="row.record_type" size="small">
                        <el-option
                          v-for="(label, value) in RECORD_TYPES"
                          :key="value"
                          :label="label"
                          :value="value"
                        />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="title" label="标题">
                    <template #default="{ row }">
                      <el-input v-model="row.title" size="small" placeholder="请输入标题" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="content" label="内容">
                    <template #default="{ row }">
                      <el-input v-model="row.content" size="small" placeholder="请输入内容" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80">
                    <template #default="{ $index }">
                      <el-button type="danger" link size="small" @click="removeRecord($index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <el-button style="margin-top: 10px;" size="small" @click="addRecord">
                  <el-icon><Plus /></el-icon>
                  添加记录
                </el-button>
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
            提交审核
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
        {{ validationErrors.length > 0 ? '提交前请确认以上异常，是否仍要提交？' : '确定要提交审核吗？' }}
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { discountApi } from '@/api'
import { DISCOUNT_TYPES, RECORD_TYPES } from '@/utils/constants'
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

const userStoreName = computed(() => userStore.userInfo?.store_name)

const form = reactive({
  title: '',
  brand_name: '',
  store_name: userStoreName.value || '',
  discount_type: '',
  discount_rate: null,
  min_amount: null,
  start_date: '',
  end_date: '',
  description: '',
  records: []
})

const rules = {
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  brand_name: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

function addRecord() {
  form.records.push({
    record_type: 'old_ledger',
    title: '',
    content: '',
    file_url: '',
    remark: ''
  })
}

function removeRecord(index) {
  form.records.splice(index, 1)
}

watch(() => [form.discount_rate, form.start_date, form.end_date, form.description], () => {
  validateForm()
}, { deep: true })

function validateForm() {
  validationErrors.value = []
  if (form.discount_rate && form.discount_rate < 0.3) {
    validationErrors.value.push('折扣率低于3折，需要特别审批')
  }
  if (form.start_date && form.end_date) {
    const start = new Date(form.start_date)
    const end = new Date(form.end_date)
    const days = (end - start) / (1000 * 60 * 60 * 24)
    if (days > 60) {
      validationErrors.value.push('活动周期超过60天，需要复核')
    }
  }
  if (form.description && form.description.length < 10) {
    validationErrors.value.push('活动描述不完整')
  }
}

async function loadDetail() {
  if (!editId.value) return
  try {
    const res = await discountApi.getDetail(editId.value)
    Object.assign(form, {
      title: res.title,
      brand_name: res.brand_name,
      store_name: res.store_name,
      discount_type: res.discount_type,
      discount_rate: res.discount_rate,
      min_amount: res.min_amount,
      start_date: res.start_date,
      end_date: res.end_date,
      description: res.description,
      records: res.records || []
    })
    validateForm()
  } catch (e) {
    console.error('Load detail error:', e)
  }
}

async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    if (editId.value) {
      await discountApi.update(editId.value, form)
      ElMessage.success('保存成功')
    } else {
      const res = await discountApi.create(form)
      ElMessage.success('创建成功')
      router.push(`/discount/${res.id}`)
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
    validateForm()
    confirmException.value = false
    confirmDialogVisible.value = true
  })
}

async function executeSubmit() {
  try {
    loading.value = true
    let res
    if (editId.value) {
      await discountApi.update(editId.value, form)
      res = await discountApi.submit(editId.value, { confirm_exception: confirmException.value })
    } else {
      const createRes = await discountApi.create(form)
      res = await discountApi.submit(createRes.id, { confirm_exception: confirmException.value })
    }
    ElMessage.success('提交成功')
    router.push(`/discount/${res.id}`)
  } catch (e) {
    console.error('Submit error:', e)
  } finally {
    loading.value = false
    confirmDialogVisible.value = false
  }
}

onMounted(() => {
  if (editId.value) {
    loadDetail()
  }
})
</script>
