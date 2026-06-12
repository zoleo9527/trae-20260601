<template>
  <el-drawer
    v-model="visible"
    :title="isEdit ? '处理异常' : '快速上报异常'"
    direction="rtl"
    size="560px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="关联房源">
        <el-select
          v-model="formData.property_id"
          filterable
          clearable
          placeholder="请选择房源（可选）"
          style="width: 100%"
        >
          <el-option
            v-for="p in propertyOptions"
            :key="p.id"
            :value="p.id"
            :label="`${p.property_no} - ${p.building} ${p.floor} ${p.room_no}`"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关联带看">
        <el-select
          v-model="formData.viewing_id"
          filterable
          clearable
          placeholder="请选择带看记录（可选）"
          style="width: 100%"
        >
          <el-option
            v-for="v in viewingOptions"
            :key="v.id"
            :value="v.id"
            :label="`${v.customer_name} - ${formatDate(v.viewing_date)}`"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="异常类型" prop="exception_type">
        <el-select
          v-model="formData.exception_type"
          placeholder="请选择异常类型"
          style="width: 100%"
        >
          <el-option label="房源问题" value="房源问题" />
          <el-option label="客户问题" value="客户问题" />
          <el-option label="带看问题" value="带看问题" />
          <el-option label="物业问题" value="物业问题" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="严重程度" prop="severity">
        <el-radio-group v-model="formData.severity">
          <el-radio-button value="low">低</el-radio-button>
          <el-radio-button value="normal">中</el-radio-button>
          <el-radio-button value="high">高</el-radio-button>
          <el-radio-button value="critical">紧急</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="异常标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请简要描述异常标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="详细描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请详细描述异常情况，包括发生时间、地点、涉及人员等"
        />
      </el-form-item>
      <el-form-item label="处理备注" prop="remarks">
        <el-input
          v-model="formData.remarks"
          type="textarea"
          :rows="3"
          placeholder="处理建议或需要注意的事项"
        />
      </el-form-item>

      <template v-if="isEdit">
        <el-divider>处理结果</el-divider>
        <el-form-item label="当前状态">
          <status-tag type="exception" :status="exceptionData?.status" />
        </el-form-item>
        <el-form-item label="更新状态">
          <el-select v-model="formData.status" placeholder="选择新状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="解决方案">
          <el-input
            v-model="formData.solution"
            type="textarea"
            :rows="4"
            placeholder="请描述解决方案和处理结果"
          />
        </el-form-item>
        <el-form-item label="追加备注">
          <el-input
            v-model="formData.remarks"
            type="textarea"
            :rows="2"
            placeholder="追加处理备注"
          />
        </el-form-item>
      </template>
    </el-form>

    <el-divider v-if="isEdit" />
    <timeline-panel
      v-if="isEdit && exceptionData"
      :target-type="'exception'"
      :target-id="exceptionData.id"
      style="height: 300px; background: #f5f7fa; border-radius: 8px; margin-top: 16px"
    />

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '确认处理' : '提交上报' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import StatusTag from './StatusTag.vue'
import TimelinePanel from './TimelinePanel.vue'
import { propertyApi, viewingApi, exceptionApi } from '@/utils/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  propertyId: {
    type: Number,
    default: null
  },
  viewingId: {
    type: Number,
    default: null
  },
  exception: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref(null)
const submitting = ref(false)
const propertyOptions = ref([])
const viewingOptions = ref([])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.exception)
const exceptionData = computed(() => props.exception)

const formData = reactive({
  property_id: null,
  viewing_id: null,
  exception_type: '',
  severity: 'normal',
  title: '',
  description: '',
  remarks: '',
  status: 'pending',
  solution: ''
})

const rules = {
  exception_type: [{ required: true, message: '请选择异常类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入异常标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入详细描述', trigger: 'blur' }]
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function loadOptions() {
  try {
    const [propData, viewData] = await Promise.all([
      propertyApi.getList({ page_size: 100 }),
      viewingApi.getList({ page_size: 100 })
    ])
    propertyOptions.value = propData.items || []
    viewingOptions.value = viewData.items || []
  } catch (e) {
    console.error(e)
  }
}

function resetForm() {
  if (props.exception) {
    formData.property_id = props.exception.property_id || null
    formData.viewing_id = props.exception.viewing_id || null
    formData.exception_type = props.exception.exception_type
    formData.severity = props.exception.severity
    formData.title = props.exception.title
    formData.description = props.exception.description
    formData.remarks = ''
    formData.status = props.exception.status
    formData.solution = props.exception.solution || ''
  } else {
    formData.property_id = props.propertyId || null
    formData.viewing_id = props.viewingId || null
    formData.exception_type = ''
    formData.severity = 'normal'
    formData.title = ''
    formData.description = ''
    formData.remarks = ''
    formData.status = 'pending'
    formData.solution = ''
  }
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    const submitData = { ...formData }
    if (isEdit.value) {
      await exceptionApi.update(props.exception.id, submitData)
      ElMessage.success('异常处理已提交')
    } else {
      await exceptionApi.create(submitData)
      ElMessage.success('异常已上报')
    }
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

watch(() => [props.exception, props.propertyId, props.viewingId], () => {
  resetForm()
})

watch(() => props.modelValue, (val) => {
  if (val) {
    loadOptions()
  }
})
</script>
