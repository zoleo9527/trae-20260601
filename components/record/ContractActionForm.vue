<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900">{{ title }}</h3>
      <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
    </div>

    <div v-if="mode === 'submit'" class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-gray-600 mb-1">合同编号</label>
        <input v-model="form.contractNo" type="text" placeholder="HT-2026-" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">签署日期</label>
        <input v-model="form.signedDate" type="date" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">合同起期</label>
        <input v-model="form.startDate" type="date" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">合同止期</label>
        <input v-model="form.endDate" type="date" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">乙方法定代表人</label>
        <input v-model="form.legalRepresentative" type="text" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">签署人（逗号分隔）</label>
        <input v-model="signersStr" type="text" placeholder="如：李建国, 王总" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
    </div>

    <div v-if="mode === 'approve'" class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
      <p class="text-xs text-emerald-700 leading-relaxed">
        💡 合同审批通过后，当前处理人将自动流转至物业工程（王刚），由其负责装修进场审批。
        租赁方案和合同审批的历史说明会完整保留在本记录中。
      </p>
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-700 mb-1">处理备注 *</label>
      <textarea
        v-model="remark"
        rows="3"
        :placeholder="remarkPlaceholder"
        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      ></textarea>
    </div>

    <div v-if="mode === 'reject'" class="bg-red-50 border border-red-200 rounded-lg p-3">
      <label class="block text-xs font-medium text-red-700 mb-1">退回原因 *（合同退回请详细列点）</label>
      <textarea
        v-model="reason"
        rows="4"
        placeholder="请逐条列明退回的条款项：&#10;1）...&#10;2）..."
        class="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white"
      ></textarea>
    </div>

    <div class="flex items-center justify-end gap-2 pt-2">
      <button @click="$emit('close')" class="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
      <button
        @click="submit"
        :disabled="!canSubmit"
        class="px-4 py-2 text-sm rounded-lg transition font-medium"
        :class="canSubmit ? submitBtnClass : 'bg-gray-200 text-gray-500 cursor-not-allowed'"
      >
        {{ submitLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useLeaseStore } from '~/stores/lease'
import type { LeaseRecord } from '~/types/lease'

const props = defineProps<{ mode: string, record: LeaseRecord }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useLeaseStore()
const toast = useToast()

const remark = ref('')
const reason = ref('')
const form = reactive({ ...props.record.contract })
const signersStr = ref(props.record.contract.signers.join(', '))

const title = computed(() => {
  const map: Record<string, string> = {
    submit: '📝 提交合同审批',
    approve: '✅ 审批通过合同',
    reject: '❌ 退回合同',
    resubmit: '↻ 重新提交合同'
  }
  return map[props.mode] || '处理'
})
const submitLabel = computed(() => {
  const map: Record<string, string> = { submit: '提交合同', approve: '通过合同', reject: '确认退回', resubmit: '重提合同' }
  return map[props.mode] || '确认'
})
const remarkPlaceholder = computed(() => {
  if (props.mode === 'approve') return '请填写通过意见，例如：合同条款与方案一致，签署完整。已移交物业工程启动装修审批流程'
  if (props.mode === 'reject') return '请简要说明整体意见'
  if (props.mode === 'resubmit') return '请说明针对上次退回的修改情况'
  return '请填写本次合同提交说明（例如：已核对方案条款一致性）'
})
const submitBtnClass = computed(() => {
  if (props.mode === 'reject') return 'bg-red-600 text-white hover:bg-red-700'
  return 'bg-emerald-600 text-white hover:bg-emerald-700'
})
const canSubmit = computed(() => {
  if (!remark.value.trim()) return false
  if (props.mode === 'reject' && !reason.value.trim()) return false
  return true
})

function submit() {
  const id = props.record.id
  const contractUpdates = {
    ...form,
    signers: signersStr.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  }
  try {
    if (props.mode === 'submit') {
      store.submitContract(id, remark.value.trim(), contractUpdates)
      toast.add({ title: '合同已提交', description: '已流转至招商经理审批', color: 'indigo' })
    } else if (props.mode === 'resubmit') {
      store.resubmitContract(id, remark.value.trim())
      toast.add({ title: '合同已重提', description: '已流转至招商经理审批', color: 'indigo' })
    } else if (props.mode === 'approve') {
      store.approveContract(id, remark.value.trim(), contractUpdates)
      toast.add({ title: '合同已通过', description: '已流转至物业工程办理装修进场', color: 'emerald' })
    } else if (props.mode === 'reject') {
      store.rejectContract(id, remark.value.trim(), reason.value.trim())
      toast.add({ title: '合同已退回', description: '已通知招商主管修订', color: 'amber' })
    }
  } catch (e) {}
  emit('close')
}
</script>
