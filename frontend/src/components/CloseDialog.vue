<template>
  <el-dialog v-model="dialogVisible" title="客诉结案" width="520px" :close-on-click-modal="false">
    <div v-if="complaint" style="margin-bottom:16px;padding:12px;background:#f0f9ff;border:1px solid #d9ecff;border-radius:6px;">
      <div style="font-size:12px;color:#409eff;">{{ complaint.code }}</div>
      <div style="font-weight:500;margin-top:2px;">{{ complaint.title }}</div>
      <div style="margin-top:6px;font-size:12px;color:#606266;line-height:1.7;">
        共经历 {{ complaint.statusHistory.length }} 次状态流转 · 关键判断 {{ complaint.keyJudgements.length }} 条
        · 回访记录 {{ complaint.tenantVisits.length }} 条
      </div>
    </div>
    <el-form :model="form" label-width="100px">
      <el-form-item label="结案备注" required>
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="4"
          placeholder="请填写结案总结，包含处理过程回顾、最终结果、回访情况、经验教训或流程优化建议等"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        <el-icon><Select /></el-icon>确认结案
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Complaint } from '@/types/complaint'

const props = defineProps<{ visible: boolean; complaint: Complaint | null }>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'submit', payload: any): void
}>()

const dialogVisible = ref(props.visible)
watch(() => props.visible, v => { dialogVisible.value = v })
watch(dialogVisible, v => emit('update:visible', v))

const form = reactive({ remark: '' })

watch(() => props.complaint, () => { form.remark = '' }, { immediate: true })

function handleSubmit() {
  if (!form.remark.trim()) { ElMessage.warning('请填写结案备注'); return }
  emit('submit', { ...form })
}
</script>
