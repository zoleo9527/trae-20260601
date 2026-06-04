<template>
  <el-dialog
    v-model="visible"
    title="退款协商处理"
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
          <div style="font-size: 12px; color: #909399;">已付金额</div>
          <div style="font-size: 14px; font-weight: 600; color: #f56c6c;">¥{{ order.paidAmount.toLocaleString() }}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #909399;">申请退款</div>
          <div style="font-size: 14px; font-weight: 600; color: #e6a23c;">¥{{ order.refundAmount.toLocaleString() }}</div>
        </div>
      </div>

      <el-alert type="warning" :closable="false" show-icon>
        <template #title>退款原因</template>
        {{ order.refundReason }}
      </el-alert>

      <div v-if="order.refundNegotiation" style="display: grid; gap: 10px;">
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1; padding: 10px 14px; background: #fef0f0; border-radius: 6px; border-left: 3px solid #f56c6c;">
            <div style="font-size: 12px; color: #f56c6c; font-weight: 600; margin-bottom: 2px;">客户诉求</div>
            <div style="font-size: 13px;">{{ order.refundNegotiation.customerRequest }}</div>
          </div>
          <div style="flex: 1; padding: 10px 14px; background: #ecf5ff; border-radius: 6px; border-left: 3px solid #409eff;">
            <div style="font-size: 12px; color: #409eff; font-weight: 600; margin-bottom: 2px;">院方方案</div>
            <div style="font-size: 13px;">{{ order.refundNegotiation.hospitalPlan }}</div>
          </div>
        </div>
      </div>

      <el-divider content-position="left">当前责任人信息</el-divider>
      <div style="padding: 10px 14px; background: #f0f9eb; border-radius: 6px; display: flex; align-items: center; gap: 12px;">
        <span class="responsible-badge">
          <el-icon :size="12"><User /></el-icon>
          {{ order.currentResponsible?.name }}（{{ getRoleLabel(order.currentResponsible?.role) }}）
        </span>
        <span style="font-size: 12px; color: #67c23a;">
          <el-icon style="margin-right: 2px;"><InfoFilled /></el-icon>
          处理完成后将自动移交责任人
        </span>
      </div>

      <el-divider content-position="left">请选择处理方式 <span style="color: #f56c6c;">*</span></el-divider>

      <el-radio-group v-model="actionType" style="display: flex; flex-direction: column; gap: 10px;">
        <el-radio value="APPROVE" border style="padding: 12px 16px; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-icon color="#67c23a" :size="20"><CircleCheck /></el-icon>
            <div>
              <div style="font-weight: 600;">同意退款</div>
              <div style="font-size: 12px; color: #909399; margin-top: 2px;">双方达成一致，退款完成后订单归档。责任人将移交客服跟进财务。</div>
            </div>
          </div>
        </el-radio>

        <el-radio value="REJECT" border style="padding: 12px 16px; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-icon color="#f56c6c" :size="20"><CircleClose /></el-icon>
            <div>
              <div style="font-weight: 600;">驳回退款，转回疗程核销</div>
              <div style="font-size: 12px; color: #909399; margin-top: 2px;">退款理由不成立，客户同意继续治疗。责任人将移交医助跟进核销。</div>
            </div>
          </div>
        </el-radio>

        <el-radio value="SUPPLEMENT" border style="padding: 12px 16px; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-icon color="#e6a23c" :size="20"><Upload /></el-icon>
            <div>
              <div style="font-weight: 600;">要求补录材料</div>
              <div style="font-size: 12px; color: #909399; margin-top: 2px;">申请材料不全，需客户补充后重审。责任人将移交咨询师跟进。</div>
            </div>
          </div>
        </el-radio>
      </el-radio-group>

      <el-form label-position="top" style="margin-top: 8px;">
        <el-form-item
          label="最终协议内容"
          v-if="actionType === 'APPROVE'"
          :rules="[{ required: true, message: '请填写最终协议内容', trigger: 'blur' }]"
        >
          <el-input
            v-model="form.agreement"
            type="textarea"
            :rows="2"
            placeholder="请明确双方达成的最终退款方案，如退款金额、是否扣违约金等..."
          />
        </el-form-item>

        <el-form-item
          label="驳回理由（必填）"
          v-if="actionType === 'REJECT'"
          :rules="[{ required: true, message: '请填写详细的驳回理由', trigger: 'blur' }]"
        >
          <el-input
            v-model="form.rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请详细说明驳回退款的理由，包括合同依据、医疗评估结论、客户沟通记录要点等。驳回后将转回疗程核销，医助可看到此说明。"
          />
          <div style="margin-top: 6px; padding: 8px 12px; background: #fdf6ec; border-radius: 4px; font-size: 12px; color: #e6a23c;">
            <el-icon style="margin-right: 4px;"><Warning /></el-icon>
            <strong>重要：</strong>驳回理由将永久记录并对客户服务端可见，请确保理由充分、依据明确，避免后续扯皮。
          </div>
        </el-form-item>

        <el-form-item
          label="补录要求（必填）"
          v-if="actionType === 'SUPPLEMENT'"
          :rules="[{ required: true, message: '请明确需要补充的材料', trigger: 'blur' }]"
        >
          <el-input
            v-model="form.supplementRequirement"
            type="textarea"
            :rows="3"
            placeholder="请明确列出需要客户补充的所有材料，如：① 书面退款申请 ② 医学证明 ③ 效果对比照片（标注拍摄角度）等。"
          />
        </el-form-item>

        <el-form-item label="补充说明（选填）">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            placeholder="其他需要记录的协商过程、沟通要点等..."
          />
        </el-form-item>
      </el-form>

      <div v-if="actionType" style="padding: 12px; background: #ecf5ff; border-radius: 6px; display: flex; align-items: center; gap: 10px;">
        <el-icon color="#409eff"><InfoFilled /></el-icon>
        <div style="font-size: 12px; color: #606266;">
          <template v-if="actionType === 'APPROVE'">
            <strong>处理后流程：</strong>状态变更为「退款同意」→ 责任人移交 <strong>李客服</strong> 跟进财务退款 → 退款完成后自动归档
          </template>
          <template v-else-if="actionType === 'REJECT'">
            <strong>处理后流程：</strong>状态变更为「疗程核销中」→ 责任人移交 <strong>赵助理</strong> → 医助可看到完整退款协商历史 → 继续执行疗程
          </template>
          <template v-else-if="actionType === 'SUPPLEMENT'">
            <strong>处理后流程：</strong>状态变更为「待补录材料」→ 责任人移交 <strong>王咨询师</strong> 联系客户补录 → 材料齐全后重新进入审核
          </template>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="!canSubmit" @click="handleSubmit">
        确认提交
        <el-icon style="margin-left: 4px;"><Right /></el-icon>
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { actions } from '../data/store.js'
import { ROLES } from '../data/constants.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const actionType = ref('')
const form = ref({
  agreement: '',
  rejectReason: '',
  supplementRequirement: '',
  note: ''
})

const getRoleLabel = (role) => ROLES[role]?.label || role

watch(visible, (val) => {
  if (val) {
    actionType.value = ''
    form.value = {
      agreement: '',
      rejectReason: '',
      supplementRequirement: '',
      note: ''
    }
    if (props.order?.refundNegotiation?.finalAgreement) {
      form.value.agreement = props.order.refundNegotiation.finalAgreement
    }
  }
})

const canSubmit = computed(() => {
  if (!actionType.value) return false
  if (actionType.value === 'APPROVE' && !form.value.agreement.trim()) return false
  if (actionType.value === 'REJECT' && !form.value.rejectReason.trim()) return false
  if (actionType.value === 'SUPPLEMENT' && !form.value.supplementRequirement.trim()) return false
  return true
})

const handleSubmit = () => {
  if (!canSubmit.value || !props.order) return

  if (actionType.value === 'APPROVE') {
    actions.processRefund(
      props.order.id,
      'APPROVE',
      form.value.note || '退款协商通过',
      form.value.agreement
    )
    ElMessage.success('退款已同意，已移交客服跟进')
  } else if (actionType.value === 'REJECT') {
    const note = `驳回理由：${form.value.rejectReason}${form.value.note ? `。${form.value.note}` : ''}`
    actions.processRefund(
      props.order.id,
      'REJECT',
      note,
      null
    )
    ElMessage.success('退款已驳回，已转回疗程核销')
  } else if (actionType.value === 'SUPPLEMENT') {
    const requirement = `补录要求：${form.value.supplementRequirement}${form.value.note ? `。${form.value.note}` : ''}`
    actions.requestSupplement(props.order.id, requirement)
    ElMessage.success('已要求补录材料，已移交咨询师跟进')
  }

  emit('success')
  visible.value = false
}

const handleClose = () => {
  visible.value = false
}
</script>
