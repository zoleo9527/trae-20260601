<template>
  <el-dialog
    v-model="dialogVisible"
    title="完成现场处理"
    width="560px"
    :close-on-click-modal="false"
  >
    <div v-if="complaint" style="margin-bottom:16px;padding:12px;background:#f5f7fa;border-radius:6px;">
      <div style="font-size:12px;color:#909399;">{{ complaint.code }}</div>
      <div style="font-weight:500;margin-top:2px;">{{ complaint.title }}</div>
    </div>

    <el-form :model="form" label-width="100px">
      <el-form-item label="处理结果说明" required>
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请描述现场处理的具体过程、已采取的措施、处理结果等，将作为状态流转记录"
        />
      </el-form-item>
      <el-form-item label="补充关键判断">
        <el-input
          v-model="form.addJudgement"
          type="textarea"
          :rows="2"
          placeholder="可选，如有需要在回访时特别注意的信息或根因分析可填写"
        />
      </el-form-item>
      <el-form-item label="后续安排">
        <el-radio-group v-model="form.needVisit">
          <el-radio :value="true">
            <el-icon style="color:#67c23a;"><Check /></el-icon>
            创建租户/顾客回访任务
          </el-radio>
          <el-radio :value="false">
            直接进入处理完成状态，无需回访
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        <el-icon><CircleCheck /></el-icon>提交完成
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

const form = reactive({
  remark: '',
  addJudgement: '',
  needVisit: true
})

watch(() => props.complaint, () => {
  form.remark = ''
  form.addJudgement = ''
  form.needVisit = true
}, { immediate: true })

function handleSubmit() {
  if (!form.remark.trim()) { ElMessage.warning('请填写处理结果说明'); return }
  emit('submit', { ...form })
}
</script>
