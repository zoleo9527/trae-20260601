<template>
  <el-dialog
    v-model="visible"
    title="批量移交责任人"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <el-alert type="info" :closable="false" show-icon>
        <template #title>已选择 {{ selectedIds.length }} 个订单</template>
        <div style="font-size: 12px; margin-top: 4px; max-height: 120px; overflow-y: auto;">
          <div v-for="id in selectedIds" :key="id" style="padding: 2px 0;">
            <el-tag size="small" type="info">{{ id }}</el-tag>
            <span style="margin-left: 8px; font-size: 12px;">{{ getOrderInfo(id) }}</span>
          </div>
        </div>
      </el-alert>

      <el-form label-position="top">
        <el-form-item
          label="移交至"
          :rules="[{ required: true, message: '请选择目标角色', trigger: 'change' }]"
        >
          <el-radio-group v-model="form.targetRole" style="display: flex; flex-direction: column; gap: 8px;">
            <el-radio value="CONSULTANT" border style="padding: 10px 14px; border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <el-icon :size="18"><UserFilled /></el-icon>
                <div>
                  <div style="font-weight: 600;">咨询师 · {{ roleDisplayName('CONSULTANT') }}</div>
                  <div style="font-size: 12px; color: #909399; margin-top: 2px;">负责前端客户沟通、材料补录跟进</div>
                </div>
              </div>
            </el-radio>
            <el-radio value="DOCTOR_ASSISTANT" border style="padding: 10px 14px; border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <el-icon :size="18"><Stethoscope /></el-icon>
                <div>
                  <div style="font-weight: 600;">医生助理 · {{ roleDisplayName('DOCTOR_ASSISTANT') }}</div>
                  <div style="font-size: 12px; color: #909399; margin-top: 2px;">负责疗程执行、核销、术后回访</div>
                </div>
              </div>
            </el-radio>
            <el-radio value="CUSTOMER_SERVICE" border style="padding: 10px 14px; border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <el-icon :size="18"><Headset /></el-icon>
                <div>
                  <div style="font-weight: 600;">客服 · {{ roleDisplayName('CUSTOMER_SERVICE') }}</div>
                  <div style="font-size: 12px; color: #909399; margin-top: 2px;">负责客诉处理、退款审核、财务跟进</div>
                </div>
              </div>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          label="移交原因（必填）"
          :rules="[{ required: true, message: '请填写移交原因', trigger: 'blur' }]"
        >
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="2"
            placeholder="请说明本次批量移交的原因，该说明将记录在每个订单的操作历史中..."
          />
        </el-form-item>
      </el-form>

      <div style="padding: 12px; background: #f0f9eb; border-radius: 6px; display: flex; align-items: center; gap: 10px;">
        <el-icon color="#67c23a"><InfoFilled /></el-icon>
        <div style="font-size: 12px; color: #606266;">
          移交后，所选 {{ selectedIds.length }} 个订单的责任人将更新，操作历史中将永久记录本次移交原因。
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="!canSubmit" @click="handleSubmit">
        确认批量移交
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { store, actions } from '../data/store.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  selectedIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  targetRole: '',
  reason: ''
})

watch(visible, (val) => {
  if (val) {
    form.value = {
      targetRole: '',
      reason: ''
    }
  }
})

const getOrderInfo = (id) => {
  const order = store.orders.find(o => o.id === id)
  return order ? `${order.customerName} · ${order.projectName}` : ''
}

const roleDisplayName = (role) => {
  const orders = props.selectedIds
    .map(id => store.orders.find(o => o.id === id))
    .filter(Boolean)
  if (orders.length === 0) return ''
  const names = [...new Set(orders.map(o => {
    if (role === 'CONSULTANT') return o.consultant
    if (role === 'DOCTOR_ASSISTANT') return o.doctorAssistant
    if (role === 'CUSTOMER_SERVICE') return o.customerService || '客服'
    return ''
  }))]
  return names.join(' / ')
}

const canSubmit = computed(() => {
  return form.value.targetRole && form.value.reason.trim()
})

const handleSubmit = () => {
  if (!canSubmit.value) return
  actions.batchTransfer(props.selectedIds, form.value.targetRole, form.value.reason.trim())
  ElMessage.success(`已批量移交 ${props.selectedIds.length} 个订单`)
  emit('success')
  visible.value = false
}

const handleClose = () => {
  visible.value = false
}
</script>
