<template>
  <el-drawer
    v-model="visible"
    :title="isEdit ? '处理异常' : '快速上报异常'"
    direction="rtl"
    size="560px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="related-summary" v-if="relatedProperty || relatedViewing">
      <div class="summary-title">
        <el-icon><Link /></el-icon>
        <span>关联业务对象</span>
      </div>
      <div class="summary-cards">
        <div v-if="relatedProperty" class="summary-card summary-card-property">
          <div class="card-icon">
            <el-icon :size="20"><OfficeBuilding /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-label">房源</div>
            <div class="card-title">
              {{ relatedProperty.property_no }}
              <span class="card-subtitle">
                {{ relatedProperty.building }} {{ relatedProperty.floor }}{{ relatedProperty.room_no }}
              </span>
            </div>
            <div class="card-meta" v-if="relatedProperty.status">
              <status-tag type="property" :status="relatedProperty.status" size="small" />
            </div>
            <div class="card-remark" v-if="relatedProperty.remarks">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ relatedProperty.remarks }}</span>
            </div>
          </div>
        </div>
        <div v-if="relatedViewing" class="summary-card summary-card-viewing">
          <div class="card-icon">
            <el-icon :size="20"><User /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-label">带看</div>
            <div class="card-title">
              {{ relatedViewing.customer_name }}
              <span class="card-subtitle">
                {{ formatDate(relatedViewing.viewing_date) }}
              </span>
            </div>
            <div class="card-meta" v-if="relatedViewing.status">
              <status-tag type="viewing" :status="relatedViewing.status" size="small" />
            </div>
            <div class="card-remark" v-if="relatedViewing.remarks">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ relatedViewing.remarks }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

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
      <template v-if="isEdit">
        <el-form-item label="当前状态">
          <status-tag type="exception" :status="exceptionData?.status" />
        </el-form-item>
        <el-form-item label="状态变更">
          <el-select v-model="formData.status" placeholder="选择新状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item label="解决方案" v-if="isEdit">
        <el-input
          v-model="formData.solution"
          type="textarea"
          :rows="3"
          placeholder="请描述解决方案和处理结果"
        />
      </el-form-item>

      <el-form-item label="处理备注" prop="remarks">
        <el-input
          v-model="formData.remarks"
          type="textarea"
          :rows="3"
          :placeholder="isEdit ? '更新处理备注信息' : '处理建议或需要注意的事项'"
        />
      </el-form-item>
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
import { Link, OfficeBuilding, User, InfoFilled, ChatDotRound } from '@element-plus/icons-vue'
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

const relatedProperty = computed(() => {
  if (props.exception?.property_info) {
    return props.exception.property_info
  }
  const pid = formData.property_id
  if (pid) {
    return propertyOptions.value.find(p => p.id === pid) || null
  }
  return null
})

const relatedViewing = computed(() => {
  if (props.exception?.viewing_info) {
    return props.exception.viewing_info
  }
  const vid = formData.viewing_id
  if (vid) {
    return viewingOptions.value.find(v => v.id === vid) || null
  }
  return null
})

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
    formData.remarks = props.exception.remarks || ''
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

<style scoped>
.related-summary {
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
  border: 1px solid #d9ecff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #409eff;
  margin-bottom: 12px;
}

.summary-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-card {
  display: flex;
  gap: 12px;
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid;
}

.summary-card-property {
  border-left-color: #409eff;
}

.summary-card-viewing {
  border-left-color: #e6a23c;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #909399;
  flex-shrink: 0;
}

.summary-card-property .card-icon {
  color: #409eff;
  background: #ecf5ff;
}

.summary-card-viewing .card-icon {
  color: #e6a23c;
  background: #fdf6ec;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 2px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-subtitle {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.card-meta {
  margin-bottom: 4px;
}

.card-remark {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 6px 8px;
  margin-top: 6px;
  line-height: 1.5;
}

.card-remark .el-icon {
  color: #909399;
  margin-top: 2px;
  flex-shrink: 0;
}
</style>
