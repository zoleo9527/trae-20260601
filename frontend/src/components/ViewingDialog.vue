<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑带看' : '新增带看安排'"
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
      <el-form-item label="选择房源" prop="property_id">
        <el-select
          v-model="formData.property_id"
          filterable
          placeholder="请选择房源"
          style="width: 100%"
          @change="handlePropertyChange"
        >
          <el-option
            v-for="p in propertyOptions"
            :key="p.id"
            :value="p.id"
            :label="`${p.property_no} - ${p.building} ${p.floor} ${p.room_no} (${p.area}㎡)`"
          >
            <div class="property-option">
              <span>{{ p.property_no }} - {{ p.building }} {{ p.floor }} {{ p.room_no }}</span>
              <status-tag type="property" :status="p.status" size="small" />
            </div>
            <div style="font-size: 12px; color: #909399; margin-top: 4px">
              面积：{{ p.area }}㎡ | 月租：{{ p.monthly_rent?.toLocaleString() || '-' }}元
            </div>
            <div v-if="p.remarks" style="font-size: 12px; color: #e6a23c; margin-top: 4px">
              <el-icon><InfoFilled /></el-icon>
              {{ p.remarks.split('\n')[0] }}
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <div v-if="selectedProperty && selectedProperty.remarks" class="property-remarks-box">
        <div class="remarks-title">
          <el-icon><InfoFilled /></el-icon>
          房源空置处理备注（带看前请阅读）
        </div>
        <div class="remarks-content">{{ selectedProperty.remarks }}</div>
        <div class="inherit-row" v-if="!isEdit">
          <el-checkbox v-model="formData.inherit_property_remarks">
            自动将房源备注带入带看记录
          </el-checkbox>
          <span class="inherit-hint">
            交班时接班人可直接在带看中看到房源处理要点
          </span>
        </div>
      </div>
      <el-form-item label="客户姓名" prop="customer_name">
        <el-input v-model="formData.customer_name" placeholder="请输入客户姓名" />
      </el-form-item>
      <el-form-item label="联系电话" prop="customer_phone">
        <el-input v-model="formData.customer_phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="带看时间" prop="viewing_date">
        <el-date-picker
          v-model="formData.viewing_date"
          type="datetime"
          placeholder="选择带看时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="预计时长">
        <el-input-number
          v-model="formData.viewing_duration"
          :min="15"
          :step="15"
          :max="300"
          style="width: 100%"
        />
        <span style="font-size: 12px; color: #909399">分钟</span>
      </el-form-item>
      <el-form-item label="带看备注" prop="remarks">
        <el-input
          v-model="formData.remarks"
          type="textarea"
          :rows="4"
          placeholder="客户需求、注意事项等，这些信息将被记录到操作日志中"
        />
      </el-form-item>

      <template v-if="isEdit">
        <el-divider>带看结果</el-divider>
        <el-form-item label="带看状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="待带看" value="scheduled" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="客户未到" value="no_show" />
          </el-select>
        </el-form-item>
        <el-form-item label="意向程度">
          <el-select v-model="formData.intention_level" style="width: 100%">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户反馈">
          <el-input
            v-model="formData.feedback"
            type="textarea"
            :rows="3"
            placeholder="客户对房源的反馈意见"
          />
        </el-form-item>
        <el-form-item label="跟进计划">
          <el-input
            v-model="formData.follow_up"
            type="textarea"
            :rows="3"
            placeholder="后续跟进计划和时间安排"
          />
        </el-form-item>
      </template>
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
import { propertyApi, viewingApi } from '@/utils/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  viewing: {
    type: Object,
    default: null
  },
  defaultPropertyId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref(null)
const submitting = ref(false)
const propertyOptions = ref([])
const selectedProperty = ref(null)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.viewing)

const formData = reactive({
  property_id: null,
  customer_name: '',
  customer_phone: '',
  viewing_date: '',
  viewing_duration: 60,
  remarks: '',
  inherit_property_remarks: true,
  status: 'scheduled',
  intention_level: '',
  feedback: '',
  follow_up: ''
})

const rules = {
  property_id: [{ required: true, message: '请选择房源', trigger: 'change' }],
  customer_name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  viewing_date: [{ required: true, message: '请选择带看时间', trigger: 'change' }],
  remarks: [{ required: true, message: '请输入带看备注', trigger: 'blur' }]
}

async function loadProperties() {
  try {
    const data = await propertyApi.getList({ page_size: 100 })
    propertyOptions.value = data.items || []
  } catch (e) {
    console.error(e)
  }
}

function handlePropertyChange(id) {
  selectedProperty.value = propertyOptions.value.find(p => p.id === id) || null
}

function resetForm() {
  if (props.viewing) {
    formData.property_id = props.viewing.property_id
    formData.customer_name = props.viewing.customer_name
    formData.customer_phone = props.viewing.customer_phone || ''
    formData.viewing_date = props.viewing.viewing_date
    formData.viewing_duration = props.viewing.viewing_duration || 60
    formData.remarks = props.viewing.remarks || ''
    formData.status = props.viewing.status
    formData.intention_level = props.viewing.intention_level || ''
    formData.feedback = props.viewing.feedback || ''
    formData.follow_up = props.viewing.follow_up || ''
    handlePropertyChange(props.viewing.property_id)
  } else {
    formData.property_id = props.defaultPropertyId || null
    formData.customer_name = ''
    formData.customer_phone = ''
    formData.viewing_date = ''
    formData.viewing_duration = 60
    formData.remarks = ''
    formData.status = 'scheduled'
    formData.intention_level = ''
    formData.feedback = ''
    formData.follow_up = ''
    if (props.defaultPropertyId) {
      handlePropertyChange(props.defaultPropertyId)
    } else {
      selectedProperty.value = null
    }
  }
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    const submitData = { ...formData }
    if (submitData.viewing_date) {
      submitData.viewing_date = new Date(submitData.viewing_date)
    }
    if (isEdit.value) {
      await viewingApi.update(props.viewing.id, submitData)
      ElMessage.success('带看记录已更新')
    } else {
      await viewingApi.create(submitData)
      ElMessage.success('带看安排已创建')
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

watch(() => [props.viewing, props.defaultPropertyId], () => {
  resetForm()
})

watch(() => props.modelValue, (val) => {
  if (val && propertyOptions.value.length === 0) {
    loadProperties()
  }
})

defineExpose({ resetForm })
</script>

<style scoped>
.property-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.property-remarks-box {
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 20px;
}

.remarks-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #e6a23c;
  margin-bottom: 8px;
  font-size: 13px;
}

.remarks-content {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
