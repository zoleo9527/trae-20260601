<script setup lang="ts">
import { ref } from 'vue'
import { receptionApi, guideTaskApi, warehouseTransferApi } from '@/api'

const props = defineProps<{
  selectedIds: number[]
  bizType: 'reception' | 'guide_task' | 'warehouse_transfer'
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const action = ref('')
const remark = ref('')
const submitting = ref(false)

const receptionStatusOptions = [
  { value: 'cancelled', label: '批量取消' }
]

const guideTaskActions = [
  { value: 'batch-complete', label: '批量完成' }
]

const warehouseActions = [
  { value: 'batch-receive', label: '批量接收' }
]

const actionOptions = {
  reception: receptionStatusOptions,
  guide_task: guideTaskActions,
  warehouse_transfer: warehouseActions
}

async function handleSubmit() {
  if (!action.value) {
    alert('请选择操作类型')
    return
  }
  submitting.value = true
  try {
    if (props.bizType === 'reception') {
      await receptionApi.batchStatus({
        ids: props.selectedIds,
        status: action.value,
        remark: remark.value
      })
    } else if (props.bizType === 'guide_task') {
      await guideTaskApi.batchComplete({
        ids: props.selectedIds,
        remark: remark.value
      })
    } else if (props.bizType === 'warehouse_transfer') {
      await warehouseTransferApi.batchReceive({
        ids: props.selectedIds,
        remark: remark.value
      })
    }
    emit('success')
  } catch (e: any) {
    alert('操作失败：' + (e.error || e.message))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal" style="max-width: 440px;">
      <div class="modal-header">
        <span class="modal-title">批量操作</span>
        <button class="modal-close" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 16px; padding: 10px; background: #fff7e6; border-radius: 4px; font-size: 13px; color: #fa8c16;">
          已选择 {{ selectedIds.length }} 条记录，请谨慎操作
        </div>
        <div class="form-item">
          <label class="form-label">操作类型 *</label>
          <select v-model="action" class="form-select">
            <option value="">请选择</option>
            <option v-for="opt in actionOptions[bizType]" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="form-item">
          <label class="form-label">备注</label>
          <textarea v-model="remark" class="form-textarea" placeholder="批量操作说明（可选）"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
          {{ submitting ? '处理中...' : '确认执行' }}
        </button>
      </div>
    </div>
  </div>
</template>
