<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" @click.self="handleClose">
    <div class="bg-white rounded-xl shadow-xl overflow-hidden" style="width: 560px;">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="font-semibold text-gray-900">批量推进 · 已选 {{ ids.length }} 条</h3>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
      </div>
      <div class="p-6 space-y-4">
        <div v-if="actionMeta" class="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <p class="text-sm text-indigo-800 font-medium mb-1">即将执行：{{ actionLabel }}</p>
          <p class="text-xs text-indigo-600">以下记录将被统一处理：</p>
          <ul class="mt-2 space-y-1">
            <li v-for="r in affected" :key="r.id" class="text-xs text-gray-700 flex items-center justify-between">
              <span>{{ r.recordNo }} · {{ r.companyName }}</span>
              <span class="text-gray-500">{{ r.building }}{{ r.floor }}-{{ r.room }}</span>
            </li>
          </ul>
        </div>
        <div v-else class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-500 mb-1">⚠️ 选中的记录状态不支持批量推进</p>
          <p class="text-xs text-gray-400">请选择「方案待审批」「合同待审批」「方案已通过待起草合同」「合同已退回」「装修待审批」等状态</p>
        </div>

        <div v-if="actionMeta">
          <label class="block text-sm font-medium text-gray-700 mb-1">统一备注说明</label>
          <textarea
            v-model="remark"
            rows="3"
            placeholder="请输入处理备注，会写入每条记录的状态历史"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
import { ref, computed, watch } from 'vue'
import { useLeaseStore } from '~/stores/lease'
import { getBatchActionMeta } from '~/utils/constants'
import type { LeaseStatus } from '~/types/lease'

const props = defineProps<{ ids: string[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useLeaseStore()

const remark = ref('')

const firstStatus = computed<LeaseStatus | null>(() =>
  props.ids.length ? (store.getRecord(props.ids[0])?.currentStatus as LeaseStatus) : null
)

const actionMeta = computed(() =>
  firstStatus.value ? getBatchActionMeta(store.currentUser.role, firstStatus.value) : null
)

const actionLabel = computed(() => actionMeta.value?.label || '批量推进')

const affected = computed(() => props.ids.map(id => store.getRecord(id)).filter(Boolean))

const canExecute = computed(() => {
  if (!actionMeta.value) return false
  if (!remark.value.trim()) return false
  return true
})

watch(() => props.ids, () => {
  remark.value = ''
}, { immediate: true })

function handleClose() {
  emit('close')
}

function execute() {
  const s = firstStatus.value
  const meta = actionMeta.value
  const op = remark.value.trim()
  if (!s || !meta) return

  let successCount = 0
  props.ids.forEach(id => {
    const rec = store.getRecord(id)
    if (!rec || rec.currentStatus !== s) return

    const action = meta.action
    if (s === 'plan_pending' && action === 'approve') {
      store.approvePlan(id, op)
      successCount++
    } else if (s === 'contract_pending' && action === 'approve') {
      store.approveContract(id, op)
      successCount++
    } else if (s === 'plan_approved' && action === 'submit') {
      store.submitContract(id, op)
      successCount++
    } else if (s === 'contract_rejected' && action === 'resubmit') {
      store.resubmitContract(id, op)
      successCount++
    } else if (s === 'decoration_pending' && action === 'approve') {
      store.approveDecoration(id, op)
      successCount++
    }
  })

  if (successCount > 0) {
    alert('操作成功，' + actionLabel.value + ' ' + successCount + ' 条记录\n责任人与状态历史已同步写入')
  } else {
    alert('未处理任何记录，请确认选中记录的状态是否支持批量操作')
  }
  store.clearSelection()
  handleClose()
}
</script>
