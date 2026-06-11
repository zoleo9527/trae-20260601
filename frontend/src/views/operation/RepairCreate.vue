<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <span class="card-title">报修登记</span>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" style="max-width: 640px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入报修标题" />
        </el-form-item>
        <el-form-item label="故障描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述故障情况" />
        </el-form-item>
        <el-form-item label="故障位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入故障位置，如：B1层 A区卫生间" />
        </el-form-item>
        <el-form-item label="紧急程度" prop="urgency">
          <el-radio-group v-model="form.urgency">
            <el-radio value="normal">普通</el-radio>
            <el-radio value="urgent">紧急</el-radio>
            <el-radio value="emergency">特急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="报修来源">
          <el-input value="营运专员" disabled />
        </el-form-item>
        <el-form-item label="活动占道关联">
          <el-checkbox v-model="form.activity_occupation" />
          <el-input
            v-if="form.activity_occupation"
            v-model="form.activity_name"
            placeholder="请输入活动名称"
            style="margin-left: 12px; width: 280px"
          />
        </el-form-item>
        <el-form-item label="租户超时标记">
          <el-checkbox v-model="form.tenant_timeout" />
        </el-form-item>
        <el-form-item label="投诉归属关联">
          <el-checkbox v-model="form.complaint_ambiguous" />
          <el-input
            v-if="form.complaint_ambiguous"
            v-model="form.complaint_ref"
            placeholder="请输入投诉关联编号"
            style="margin-left: 12px; width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">提交报修</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../../api'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)

const form = ref({
  title: '',
  description: '',
  location: '',
  urgency: 'normal',
  source: 'operation',
  activity_occupation: false,
  activity_name: '',
  tenant_timeout: false,
  complaint_ambiguous: false,
  complaint_ref: '',
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入故障描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入故障位置', trigger: 'blur' }],
  urgency: [{ required: true, message: '请选择紧急程度', trigger: 'change' }],
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = { ...form.value }
    if (!payload.activity_occupation) {
      delete payload.activity_name
    }
    if (!payload.complaint_ambiguous) {
      delete payload.complaint_ref
    }
    await api.post('/repairs/', payload)
    ElMessage.success('报修提交成功')
    router.push('/operation/repairs')
  } catch {
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  formRef.value.resetFields()
  form.value.activity_occupation = false
  form.value.tenant_timeout = false
  form.value.complaint_ambiguous = false
}
</script>

<style scoped>
.card-title {
  font-size: 16px;
  font-weight: 600;
}
</style>
