<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="handleClose">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">交接车辆</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              选择接收人 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="selectedUserId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                {{ user.name }} - {{ getRoleLabel(user.role) }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              交接备注 <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="remark"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入交接说明..."
            ></textarea>
          </div>

          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="text-sm text-blue-800">
              <strong>交接车辆：</strong>{{ vehicle?.plate }} - {{ vehicle?.model }}
            </p>
            <p class="text-sm text-blue-800 mt-1">
              <strong>当前状态：</strong>{{ statusLabel }}
            </p>
          </div>
        </div>
      </div>

      <div class="px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end gap-3">
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          取消
        </button>
        <button
          @click="handleSubmit"
          :disabled="!canSubmit"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-lg',
            canSubmit
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          确认交接
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Vehicle, User } from '@/types'
import { useHandover } from '@/composables/useHandover'
import { useStatusTransition } from '@/composables/useStatusTransition'

const props = defineProps<{
  show: boolean
  vehicle: Vehicle | null
}>()

const emit = defineEmits<{
  close: []
  submit: [user: User, remark: string]
}>()

const { getAvailableReceivers } = useHandover()
const { getStatusLabel } = useStatusTransition()

const selectedUserId = ref('')
const remark = ref('')

const availableUsers = computed(() => {
  if (!props.vehicle) return []
  return getAvailableReceivers(props.vehicle)
})

const statusLabel = computed(() => {
  if (!props.vehicle) return ''
  return getStatusLabel(props.vehicle.status)
})

const canSubmit = computed(() => {
  return selectedUserId.value && remark.value.trim()
})

const getRoleLabel = (role: string) => {
  const roleMap: Record<string, string> = {
    collector: '收车经理',
    evaluator: '评估师',
    finance: '金融专员',
    sales: '销售顾问'
  }
  return roleMap[role] || role
}

const handleSubmit = () => {
  if (!canSubmit.value) return
  const user = availableUsers.value.find(u => u.id === selectedUserId.value)
  if (user) {
    emit('submit', user, remark.value)
    handleClose()
  }
}

const handleClose = () => {
  selectedUserId.value = ''
  remark.value = ''
  emit('close')
}

watch(() => props.show, (newVal) => {
  if (!newVal) {
    selectedUserId.value = ''
    remark.value = ''
  }
})
</script>
