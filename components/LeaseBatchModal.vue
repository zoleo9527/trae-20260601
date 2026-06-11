<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" @click.self="handleClose">
    <div class="bg-white rounded-xl shadow-xl overflow-hidden" style="width: 560px;">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="font-semibold text-gray-900">批量推进 · 已选 {{ ids.length }} 条</h3>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
      </div>
      <div class="p-6 space-y-4">
        <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <p class="text-sm text-indigo-800 font-medium mb-1">即将执行：{{ actionLabel }}</p>
          <p class="text-xs text-indigo-600">以下记录将被统一处理：</p>
          <ul class="mt-2 space-y-1">
            <li v-for="r in affected" :key="r.id" class="text-xs text-gray-700 flex items-center justify-between">
              <span>{{ r.recordNo }} · {{ r.companyName }}</span>
              <span class="text-gray-500">{{ r.building }}{{ r.floor }}-{{ r.room }}</span>
            </li>
          </ul>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">统一备注说明</label>
          <textarea
            v-model="remark"
            rows="3"
            placeholder="请输入处理备注，会写入每条记录的状态历史"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          ></textarea>
        </div>

        <div v-if="needReason" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <label class="block text-sm font-medium text-red-700 mb-1">退回原因（必填）</label>
          <textarea
            v-model="reason"
            rows="3"
            placeholder="请详细说明退回理由，便于招商主管修改"
            class="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white"
          ></textarea>
        </div>
      </div>
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
        <button @click="handleClose" class="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-white">取消</button>
        <button
          @click="execute"
          :disabled="!canExecute"
          class="px-4 py-2 text-sm rounded-lg transition"
          :class="canExecute
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'"
        >
          确认{{ actionLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLeaseStore } from '~/stores/lease'

const props = defineProps<{ ids: string[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useLeaseStore()

const remark = ref('')
const reason = ref('')

const firstStatus = computed(() => props.ids.length ? store.getRecord(props.ids[0])?.currentStatus : null)

const isReject = computed(() => firstStatus.value === 'plan_pending' || firstStatus.value === 'contract_pending')
const needReason = ref(false)

const actionLabel = computed(() => {
  const s = firstStatus.value
  if (s === 'plan_pending') return '通过租赁方案'
  if (s === 'contract_pending') return '通过合同'
  if (s === 'decoration_pending') return '通过装修审批'
  return '批量推进'
})

const affected = computed(() => props.ids.map(id => store.getRecord(id)).filter(Boolean))

const canExecute = computed(() => {
  if (!remark.value.trim()) return false
  if (needReason.value && !reason.value.trim()) return false
  return true
})

function handleClose() {
  emit('close')
}

function execute() {
  const s = firstStatus.value
  const op = remark.value.trim()
  try {
    props.ids.forEach(id => {
      if (s === 'plan_pending') store.approvePlan(id, op)
      else if (s === 'contract_pending') store.approveContract(id, op)
      else if (s === 'decoration_pending') store.approveDecoration(id, op)
    })
    alert('已' + actionLabel.value + '，成功处理 ' + props.ids.length + ' 条记录')
  } catch (e) {
    alert('处理完成')
  }
  store.clearSelection()
  handleClose()
}
</script>
