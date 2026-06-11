<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900">{{ title }}</h3>
      <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
    </div>

    <div v-if="mode === 'submit' || mode === 'resubmit'" class="grid grid-cols-3 gap-3">
      <div>
        <label class="block text-xs text-gray-600 mb-1">月租金单价 *</label>
        <div class="flex">
          <input v-model.number="form.monthlyRent" type="number" step="0.1" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <span class="px-3 py-2 text-sm bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-gray-500">元/㎡/月</span>
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">免租期（月）*</label>
        <input v-model.number="form.freeRentMonths" type="number" step="0.5" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">租期（年）*</label>
        <input v-model.number="form.leaseYears" type="number" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">押金（月）</label>
        <input v-model.number="form.depositMonths" type="number" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">递增幅度</label>
        <input v-model="form.increaseRate" type="text" placeholder="如：第三年起每年5%" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">付款方式</label>
        <select v-model="form.paymentMethod" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">请选择</option>
          <option>月付</option>
          <option>季度支付，提前15天</option>
          <option>半年支付</option>
          <option>年度支付</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">装修期（天）</label>
        <input v-model.number="form.decorationDays" type="number" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">提前解约违约金</label>
        <input v-model="form.earlyTerminationPenalty" type="text" placeholder="如：3个月租金" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div class="col-span-3">
        <label class="block text-xs text-gray-600 mb-1">免租期口径说明（必填，减少口径不一致）</label>
        <textarea
          v-model="form.freeRentRemark"
          rows="2"
          placeholder="例：免租期3个月 = 1.5个月装修免租 + 1.5个月经营免租，首月支付租金即生效"
          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        ></textarea>
      </div>
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
      <label class="block text-xs font-medium text-red-700 mb-1">退回原因 *</label>
      <textarea
        v-model="reason"
        rows="3"
        placeholder="请详细说明退回点，便于招商主管逐项修改。例：1）免租期需从3个月调整为2个月；2）... "
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
const form = reactive({ ...props.record.plan, rentUnit: props.record.plan.rentUnit || '元/㎡/月' })

const title = computed(() => {
  const map: Record<string, string> = {
    submit: '📝 提交租赁方案',
    approve: '✅ 审批通过租赁方案',
    reject: '❌ 退回租赁方案',
    resubmit: '↻ 重新提交租赁方案（可修订）'
  }
  return map[props.mode] || '处理'
})
const submitLabel = computed(() => {
  const map: Record<string, string> = { submit: '提交方案', approve: '通过方案', reject: '确认退回', resubmit: '重提方案' }
  return map[props.mode] || '确认'
})
const remarkPlaceholder = computed(() => {
  if (props.mode === 'approve') return '请填写通过意见，例如：方案符合园区指导价，同意。建议合同签核时关注装修进场环节'
  if (props.mode === 'reject') return '请简要说明整体意见，详细退回点请填写在下方"退回原因"中'
  if (props.mode === 'resubmit') return '请说明针对上次退回的修改情况'
  return '请填写本次方案提交说明'
})
const submitBtnClass = computed(() => {
  if (props.mode === 'reject') return 'bg-red-600 text-white hover:bg-red-700'
  return 'bg-emerald-600 text-white hover:bg-emerald-700'
})
const canSubmit = computed(() => {
  if (!remark.value.trim()) return false
  if (props.mode === 'reject' && !reason.value.trim()) return false
  if ((props.mode === 'submit' || props.mode === 'resubmit') && (!form.monthlyRent || form.freeRentMonths < 0 || !form.leaseYears || !form.freeRentRemark.trim()))
    return false
  return true
})

function submit() {
  const id = props.record.id
  try {
    if (props.mode === 'submit' || props.mode === 'resubmit') {
      store.resubmitPlan(id, remark.value.trim(), { ...form })
      toast.add({ title: props.mode === 'submit' ? '方案已提交' : '方案已重提', description: '已流转至招商经理审批', color: 'indigo' })
    } else if (props.mode === 'approve') {
      store.approvePlan(id, remark.value.trim())
      toast.add({ title: '方案已通过', description: '可起草合同后提交合同审批', color: 'emerald' })
    } else if (props.mode === 'reject') {
      store.rejectPlan(id, remark.value.trim(), reason.value.trim())
      toast.add({ title: '方案已退回', description: '已通知招商主管修订', color: 'amber' })
    }
  } catch (e) {}
  emit('close')
}
</script>
