<template>
  <el-dialog
    v-model="visible"
    title="补录材料"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="order" style="display: flex; flex-direction: column; gap: 16px;">
      <div class="order-summary" style="padding: 12px 16px; background: #f5f7fa; border-radius: 8px;">
        <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 8px;">
          <div>
            <div style="font-size: 12px; color: #909399;">客户</div>
            <div style="font-size: 14px; font-weight: 600;">{{ order.customerName }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #909399;">项目</div>
            <div style="font-size: 14px;">{{ order.projectName }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #909399;">当前状态</div>
            <div>
              <span class="status-tag status-supplement">待补录材料</span>
            </div>
          </div>
        </div>
      </div>

      <el-alert type="warning" :closable="false" show-icon>
        <template #title>补录要求</template>
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">{{ supplementRequirement }}</p>
      </el-alert>

      <el-divider content-position="left">材料补录内容</el-divider>

      <el-form label-position="top">
        <el-form-item
          label="客户提供的材料内容"
          :rules="[{ required: true, message: '请填写客户提供的材料内容', trigger: 'blur' }]"
        >
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请详细记录客户提供的所有材料，如：① 已签字的书面退款申请 ② 孕检证明（照片）③ 正面/侧面45°/侧面90°照片各1张..."
          />
        </el-form-item>

        <el-form-item label="材料是否齐全">
          <el-radio-group v-model="form.isComplete">
            <el-radio :value="true">齐全，可以进入审核</el-radio>
            <el-radio :value="false">仍不齐全，需继续补录</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="!form.isComplete"
          label="仍需补充的材料"
          :rules="[{ required: true, message: '请说明仍需补充的材料', trigger: 'blur' }]"
        >
          <el-input
            v-model="form.moreRequirement"
            type="textarea"
            :rows="2"
            placeholder="请说明仍缺少哪些材料..."
          />
        </el-form-item>
      </el-form>

      <div style="padding: 12px; background: #ecf5ff; border-radius: 6px; display: flex; align-items: center; gap: 10px;">
        <el-icon color="#409eff"><InfoFilled /></el-icon>
        <div style="font-size: 12px; color: #606266;">
          <template v-if="form.isComplete">
            <strong>提交后：</strong>材料齐全，状态变更为「退款协商中」，责任人移交 <strong>李客服</strong> 重新审核。
          </template>
          <template v-else>
            <strong>提交后：</strong>记录本次补录内容，状态保持「待补录材料」，责任人继续由 <strong>王咨询师</strong> 跟进。
          </template>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="warning" :disabled="!canSubmit" @click="handleSubmit">
        提交补录
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { actions } from '../data/store.js'
import { ORDER_STATUS } from '../data/constants.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  content: '',
  isComplete: true,
  moreRequirement: ''
})

watch(visible, (val) => {
  if (val) {
    form.value = {
      content: '',
      isComplete: true,
      moreRequirement: ''
    }
  }
})

const supplementRequirement = computed(() => {
  if (!props.order) return ''
  const supplementRecord = [...props.order.history].reverse().find(h => h.action.includes('补录'))
  return supplementRecord?.content || '请联系客服确认需要补录的材料'
})

const canSubmit = computed(() => {
  if (!form.value.content.trim()) return false
  if (!form.value.isComplete && !form.value.moreRequirement.trim()) return false
  return true
})

const handleSubmit = () => {
  if (!canSubmit.value || !props.order) return

  let content = `客户补录材料：${form.value.content}`
  if (!form.value.isComplete) {
    content += `。材料仍不齐全，仍需补充：${form.value.moreRequirement}`
  }

  if (form.value.isComplete) {
    actions.submitSupplement(props.order.id, content)
    ElMessage.success('材料已补录，已重新进入退款审核')
  } else {
    actions.addNote(props.order.id, content)
    ElMessage.info('已记录补录内容，请继续联系客户补充剩余材料')
  }

  emit('success')
  visible.value = false
}

const handleClose = () => {
  visible.value = false
}
</script>
