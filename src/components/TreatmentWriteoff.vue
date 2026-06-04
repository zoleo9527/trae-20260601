<template>
  <el-dialog
    v-model="visible"
    title="疗程核销"
    width="680px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="order" style="display: flex; flex-direction: column; gap: 16px;">
      <div class="order-summary" style="padding: 12px 16px; background: #f5f7fa; border-radius: 8px; display: flex; gap: 24px; flex-wrap: wrap;">
        <div>
          <div style="font-size: 12px; color: #909399;">客户</div>
          <div style="font-size: 14px; font-weight: 600;">{{ order.customerName }}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #909399;">项目</div>
          <div style="font-size: 14px;">{{ order.projectName }}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #909399;">疗程进度</div>
          <div style="font-size: 14px; font-weight: 600;">
            <span :style="{ color: order.treatedCount >= order.treatmentCount ? '#67c23a' : '#e6a23c' }">
              {{ order.treatedCount }}/{{ order.treatmentCount }} 次
            </span>
          </div>
        </div>
        <div>
          <div style="font-size: 12px; color: #909399;">本次核销</div>
          <div style="font-size: 14px; font-weight: 600; color: #409eff;">第 {{ order.treatedCount + 1 }} 次</div>
        </div>
      </div>

      <el-alert v-if="hasRefundHistory" type="warning" :closable="false" show-icon>
        <template #title>重要历史信息</template>
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">
          该订单曾经历退款协商，驳回理由：<strong>{{ rejectReason }}</strong>
        </p>
        <el-button
          size="small"
          text
          type="primary"
          style="margin-top: 6px; padding: 0;"
          @click="showHistory = !showHistory"
        >
          {{ showHistory ? '收起' : '展开' }}完整协商历史
          <el-icon style="margin-left: 2px;">
            <component :is="showHistory ? 'ArrowUp' : 'ArrowDown'" />
          </el-icon>
        </el-button>
      </el-alert>

      <div v-if="showHistory && hasRefundHistory" style="padding: 12px 16px; background: #fdf6ec; border-radius: 6px; border: 1px solid #f5dab1;">
        <div style="font-size: 13px; font-weight: 600; color: #e6a23c; margin-bottom: 8px;">
          <el-icon style="margin-right: 4px;"><Document /></el-icon>
          退款协商完整历史（责任人移交时同步）
        </div>
        <div v-for="(record, idx) in refundHistory" :key="record.id" style="margin-bottom: 10px; padding-left: 12px; border-left: 2px solid #e6a23c;">
          <div style="font-size: 12px; color: #909399; margin-bottom: 2px;">
            {{ record.timestamp }} · {{ record.operator }}
          </div>
          <div style="font-size: 12px; color: #606266;">{{ record.content }}</div>
        </div>
      </div>

      <el-divider content-position="left">疗程进度</el-divider>
      <el-steps :active="order.treatedCount" finish-status="success" style="margin-bottom: 8px;">
        <el-step
          v-for="(step, idx) in treatmentSteps"
          :key="idx"
          :title="step.title"
          :description="step.description"
        />
        <el-step
          v-if="order.treatedCount >= order.treatmentCount"
          title="已归档"
          description="完成"
          icon="FolderChecked"
        />
      </el-steps>

      <el-divider content-position="left">当前责任人</el-divider>
      <div style="padding: 10px 14px; background: #f0f9eb; border-radius: 6px; display: flex; align-items: center; gap: 12px;">
        <span class="responsible-badge">
          <el-icon :size="12"><User /></el-icon>
          {{ order.currentResponsible?.name }}（{{ getRoleLabel(order.currentResponsible?.role) }}）
        </span>
        <span v-if="order.currentResponsible?.transferFrom" style="font-size: 12px; color: #67c23a;">
          <el-icon style="margin-right: 2px;"><InfoFilled /></el-icon>
          移交自：{{ order.currentResponsible.transferFrom.name }} · {{ order.currentResponsible.transferFrom.reason }}
        </span>
      </div>

      <el-divider content-position="left">核销记录（可回看）</el-divider>
      <div v-if="writeoffRecords.length > 0" style="max-height: 180px; overflow-y: auto; padding-right: 8px;">
        <div
          v-for="(record, idx) in writeoffRecords"
          :key="idx"
          style="padding: 10px 14px; background: #f0f9eb; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #67c23a;"
        >
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 13px; font-weight: 600; color: #67c23a;">
              <el-icon style="margin-right: 4px;"><Select /></el-icon>
              {{ record.action }}
            </span>
            <span style="font-size: 11px; color: #909399;">{{ record.timestamp }}</span>
          </div>
          <div style="font-size: 12px; color: #606266;">{{ record.content }}</div>
          <div style="font-size: 11px; color: #909399; margin-top: 4px;">操作人：{{ record.operator }}</div>
        </div>
      </div>
      <div v-else style="padding: 20px; text-align: center; color: #c0c4cc; font-size: 13px;">
        <el-icon :size="28"><Clock /></el-icon>
        <p style="margin-top: 6px;">暂无核销记录，本次将是第一次核销</p>
      </div>

      <el-form label-position="top" style="margin-top: 8px;">
        <el-form-item
          label="本次核销说明"
          :rules="[{ required: true, message: '请填写核销说明', trigger: 'blur' }]"
        >
          <el-input
            v-model="form.writeoffNote"
            type="textarea"
            :rows="3"
            placeholder="请填写本次治疗情况，如：客户到店时间、治疗部位、术中反应、术后注意事项等..."
          />
        </el-form-item>
      </el-form>

      <div v-if="form.writeoffNote" style="padding: 12px; background: #f0f9eb; border-radius: 6px; display: flex; align-items: center; gap: 10px;">
        <el-icon color="#67c23a"><InfoFilled /></el-icon>
        <div style="font-size: 12px; color: #606266;">
          <strong>核销后：</strong>
          <template v-if="order.treatedCount + 1 >= order.treatmentCount">
            所有疗程完成，状态变更为「已归档」，责任人清空，所有资料永久保存。
          </template>
          <template v-else>
            疗程进度更新为 {{ order.treatedCount + 1 }}/{{ order.treatmentCount }}，状态保持「疗程核销中」，等待下次治疗。
          </template>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="success" :disabled="!form.writeoffNote.trim()" @click="handleSubmit">
        <el-icon style="margin-right: 4px;"><Select /></el-icon>
        确认核销
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { actions } from '../data/store.js'
import { ROLES, ACTION_TYPES } from '../data/constants.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const showHistory = ref(false)
const form = ref({
  writeoffNote: ''
})

watch(visible, (val) => {
  if (val) {
    form.value.writeoffNote = ''
    showHistory.value = false
  }
})

const getRoleLabel = (role) => ROLES[role]?.label || role

const treatmentSteps = computed(() => {
  if (!props.order) return []
  const steps = []
  for (let i = 0; i < props.order.treatmentCount; i++) {
    steps.push({
      title: `第 ${i + 1} 次`,
      description: i < props.order.treatedCount ? '已完成' : (i === props.order.treatedCount ? '本次' : '未开始')
    })
  }
  return steps
})

const writeoffRecords = computed(() => {
  if (!props.order) return []
  return props.order.history.filter(h =>
    h.action === ACTION_TYPES.WRITE_OFF_TREATMENT || h.action.includes('核销')
  ).reverse()
})

const refundHistory = computed(() => {
  if (!props.order) return []
  return props.order.history.filter(h =>
    h.action.includes('退款') || h.action.includes('补录') || h.action.includes('协商') || h.action.includes('驳回')
  )
})

const hasRefundHistory = computed(() => refundHistory.value.length > 0)

const rejectReason = computed(() => {
  const rejectRecord = [...refundHistory.value].reverse().find(h => h.action.includes('驳回'))
  return rejectRecord?.content || '未找到驳回记录'
})

const handleSubmit = () => {
  if (!form.value.writeoffNote.trim() || !props.order) return
  actions.writeoffTreatment(props.order.id, form.value.writeoffNote.trim())
  if (props.order.treatedCount >= props.order.treatmentCount) {
    ElMessage.success('疗程全部核销完成，已自动归档')
  } else {
    ElMessage.success('疗程核销成功')
  }
  emit('success')
  visible.value = false
}

const handleClose = () => {
  visible.value = false
}
</script>
