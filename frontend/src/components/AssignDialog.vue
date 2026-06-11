<template>
  <el-dialog v-model="dialogVisible" title="重新派单/指派处理人" width="500px" :close-on-click-modal="false">
    <div v-if="complaint" style="margin-bottom:16px;padding:12px;background:#f5f7fa;border-radius:6px;">
      <div style="font-size:12px;color:#909399;">{{ complaint.code }}</div>
      <div style="font-weight:500;margin-top:2px;">{{ complaint.title }}</div>
      <div style="margin-top:6px;font-size:12px;color:#606266;">
        当前处理人：{{ complaint.currentHandler }}（{{ complaint.currentHandlerRole }}）
      </div>
    </div>
    <el-form :model="form" label-width="100px">
      <el-form-item label="指派给" required>
        <el-select v-model="form.handler" style="width:100%;" filterable>
          <el-option v-for="s in mockStaff" :key="s.id" :label="`${s.name} · ${s.department} · ${s.role}`" :value="s.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理角色">
        <el-input v-model="form.handlerRole" disabled />
      </el-form-item>
      <el-form-item label="派单说明">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选，说明派单原因或特别要求" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认派单</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Complaint } from '@/types/complaint'
import { mockStaff } from '@/mock/complaintData'

const props = defineProps<{ visible: boolean; complaint: Complaint | null }>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'submit', payload: any): void
}>()

const dialogVisible = ref(props.visible)
watch(() => props.visible, v => { dialogVisible.value = v })
watch(dialogVisible, v => emit('update:visible', v))

const form = reactive({
  handler: '',
  handlerRole: '',
  remark: ''
})

watch(() => form.handler, name => {
  const s = mockStaff.find(x => x.name === name)
  form.handlerRole = s?.role || ''
})

watch(() => props.complaint, () => {
  form.handler = ''
  form.handlerRole = ''
  form.remark = ''
}, { immediate: true })

function handleSubmit() {
  if (!form.handler) { ElMessage.warning('请选择处理人'); return }
  emit('submit', { ...form })
}
</script>
