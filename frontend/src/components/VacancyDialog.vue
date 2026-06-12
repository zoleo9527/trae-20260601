<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="560px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-alert
        v-if="property"
        :title="`房源：${property.building} ${property.floor} ${property.room_no}（${property.property_no}）`"
        type="info"
        show-icon
        style="margin-bottom: 20px"
      />
      <el-form-item label="当前状态" v-if="property">
        <status-tag type="property" :status="property.status" />
      </el-form-item>
      <el-form-item label="空置状态" prop="status">
        <el-select v-model="formData.status" style="width: 100%">
          <el-option label="空置中" value="vacant" />
          <el-option label="已出租" value="occupied" />
          <el-option label="已预定" value="reserved" />
          <el-option label="维护中" value="maintenance" />
        </el-select>
      </el-form-item>
      <el-form-item label="空置原因" prop="vacancy_reason">
        <el-input
          v-model="formData.vacancy_reason"
          type="textarea"
          :rows="2"
          placeholder="请输入空置原因"
        />
      </el-form-item>
      <el-form-item label="空置日期" prop="vacancy_date">
        <el-date-picker
          v-model="formData.vacancy_date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="预计可租日期" prop="expected_available_date">
        <el-date-picker
          v-model="formData.expected_available_date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="处理备注" prop="remarks">
        <el-input
          v-model="formData.remarks"
          type="textarea"
          :rows="4"
          placeholder="请输入处理备注，这些信息将在带看安排中可见"
        />
        <div style="font-size: 12px; color: #909399; margin-top: 4px">
          <el-icon><InfoFilled /></el-icon>
          备注信息将同步到带看安排页面，供后续带看人员参考
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确认提交
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import StatusTag from './StatusTag.vue'
import { propertyApi } from '@/utils/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  property: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref(null)
const submitting = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  return props.property ? '空置处理' : '空置处理'
})

const formData = reactive({
  status: 'vacant',
  vacancy_reason: '',
  vacancy_date: '',
  expected_available_date: '',
  remarks: ''
})

const rules = {
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  remarks: [{ required: true, message: '请输入处理备注', trigger: 'blur' }]
}

function resetForm() {
  formData.status = props.property?.status || 'vacant'
  formData.vacancy_reason = props.property?.vacancy_reason || ''
  formData.vacancy_date = props.property?.vacancy_date || ''
  formData.expected_available_date = props.property?.expected_available_date || ''
  formData.remarks = props.property?.remarks || ''
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  if (!formRef.value || !props.property) return
  await formRef.value.validate()
  submitting.value = true
  try {
    const submitData = { ...formData }
    if (submitData.vacancy_date) {
      submitData.vacancy_date = new Date(submitData.vacancy_date)
    }
    if (submitData.expected_available_date) {
      submitData.expected_available_date = new Date(submitData.expected_available_date)
    }
    await propertyApi.updateVacancy(props.property.id, submitData)
    ElMessage.success('空置处理已提交')
    emit('success')
    visible.value = false
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

function handleClosed() {
  resetForm()
}

watch(() => props.property, () => {
  resetForm()
}, { immediate: true })
</script>
