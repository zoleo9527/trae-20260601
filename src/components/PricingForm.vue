<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">定价处理</h3>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          收车价
        </label>
        <div class="text-2xl font-bold text-blue-600">
          ¥{{ formatPrice(vehicle.purchasePrice) }}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          建议售价 <span class="text-red-500">*</span>
        </label>
        <input
          v-model.number="suggestedPrice"
          type="number"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入建议售价"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          金融方案备注
        </label>
        <textarea
          v-model="financePlan"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入金融方案说明（如：首付比例、贷款利率、优惠政策等）"
        ></textarea>
      </div>

      <div v-if="showConfirm" class="bg-green-50 p-4 rounded-lg">
        <h4 class="text-sm font-semibold text-green-800 mb-2">最终定价确认</h4>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-green-700">最终售价：</span>
            <input
              v-model.number="finalPrice"
              type="number"
              class="flex-1 ml-2 px-3 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="确认最终售价"
            />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-green-700">金融方案：</span>
            <input
              v-model="confirmedFinancePlan"
              type="text"
              class="flex-1 ml-2 px-3 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="确认金融方案"
            />
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          操作备注 <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="remark"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          :placeholder="remarkPlaceholder"
        ></textarea>
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <button
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        取消
      </button>
      <button
        v-if="!showConfirm"
        @click="handleSubmit"
        :disabled="!canSubmit"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-lg',
          canSubmit
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
      >
        提交定价
      </button>
      <button
        v-else
        @click="handleConfirm"
        :disabled="!canConfirm"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-lg',
          canConfirm
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
      >
        确认上架
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Vehicle } from '@/types'

const props = defineProps<{
  vehicle: Vehicle
  mode: 'suggest' | 'confirm'
}>()

const emit = defineEmits<{
  submit: [data: { suggestedPrice?: number; finalPrice?: number; financePlan?: string; remark: string }]
  confirm: [data: { finalPrice: number; financePlan: string; remark: string }]
  cancel: []
}>()

const suggestedPrice = ref(props.vehicle.purchasePrice)
const finalPrice = ref<number>()
const financePlan = ref('')
const confirmedFinancePlan = ref('')
const remark = ref('')

const showConfirm = computed(() => props.mode === 'confirm')

const remarkPlaceholder = computed(() => {
  if (showConfirm.value) {
    return '请输入确认备注...'
  }
  return '请输入定价说明（如：市场行情、车辆优势、预期利润等）...'
})

const canSubmit = computed(() => {
  return suggestedPrice.value > 0 && remark.value.trim()
})

const canConfirm = computed(() => {
  return finalPrice.value && finalPrice.value > 0 && remark.value.trim()
})

const handleSubmit = () => {
  if (!canSubmit.value) return
  emit('submit', {
    suggestedPrice: suggestedPrice.value,
    financePlan: financePlan.value,
    remark: remark.value
  })
}

const handleConfirm = () => {
  if (!canConfirm.value) return
  emit('confirm', {
    finalPrice: finalPrice.value!,
    financePlan: confirmedFinancePlan.value || financePlan.value,
    remark: remark.value
  })
}

const formatPrice = (price: number) => {
  return price.toLocaleString('zh-CN')
}
</script>
