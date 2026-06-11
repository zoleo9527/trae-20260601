<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900">{{ title }}</h3>
      <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
    </div>

    <div v-if="mode === 'approve'" class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-gray-600 mb-1">审批通过日期</label>
        <input v-model="form.approvedDate" type="date" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">工程负责人</label>
        <select v-model="form.engineerInCharge" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">请选择</option>
          <option value="王刚">王刚</option>
          <option value="张敏">张敏</option>
        </select>
      </div>
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-700 mb-1">处理备注 *</label>
      <textarea
        v-model="remark"
        rows="3"
        placeholder="请填写工程审核意见，例如：结构复核通过、消防注意事项、水电接口位置等"
        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      ></textarea>
    </div>

    <div v-if="mode === 'approve'" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
      <p class="text-xs text-amber-800 leading-relaxed">
        ⚠️ 审批通过后客户即可进场。请确认：1）消防方案合规；2）结构改动验算；3）水电点位核对；4）施工时段规定已告知；5）风险项（如有）已解决。
      </p>
    </div>

    <div class="flex items-center justify-end gap-2 pt-2">
      <button @click="$emit('close')" class="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
      <button
        @click="submit"
        :disabled="!remark.trim()"
        class="px-4 py-2 text-sm rounded-lg transition font-medium"
        :class="remark.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'"
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
const form = reactive<Partial<LeaseRecord['decoration']>>({ ...props.record.decoration })

const title = computed(() => props.mode === 'approve' ? '✅ 审批装修进场' : '处理')
const submitLabel = computed(() => props.mode === 'approve' ? '发放装修许可' : '确认')

function submit() {
  if (!remark.value.trim()) return
  store.approveDecoration(props.record.id, remark.value.trim(), {
    ...form,
    approvedDate: form.approvedDate || new Date().toISOString().slice(0, 10)
  })
  toast.add({ title: '装修许可已发放', description: '客户可按约定时间进场施工', color: 'emerald' })
  emit('close')
}
</script>
