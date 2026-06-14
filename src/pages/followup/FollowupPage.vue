<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="goBack"
              class="text-gray-600 hover:text-gray-900"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">客户跟进</h1>
              <p class="text-sm text-gray-600 mt-1">{{ vehicle?.plate }} - {{ vehicle?.model }}</p>
            </div>
          </div>
          <StatusBadge v-if="vehicle" :status="vehicle.status" />
        </div>
      </div>
    </header>

    <main v-if="vehicle" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">添加跟进记录</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              跟进方式 <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <button
                v-for="method in methods"
                :key="method.value"
                @click="form.method = method.value"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  form.method === method.value
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                ]"
              >
                {{ method.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              客户信息 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.customerInfo"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入客户姓名和联系方式"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              跟进内容 <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.content"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请详细描述本次跟进情况..."
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              跟进结果 <span class="text-red-500">*</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="result in results"
                :key="result.value"
                @click="form.result = result.value"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  form.result === result.value
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                ]"
              >
                {{ result.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              下次跟进时间
            </label>
            <input
              v-model="form.nextFollowupTime"
              type="datetime-local"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              附件上传
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-sm text-gray-600">点击上传文件</p>
              <p class="text-xs text-gray-500 mt-1">支持 JPG、PNG、PDF、DOC 等格式</p>
              <p class="text-xs text-gray-400 mt-2">附件功能占位，后续可扩展上传</p>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            @click="goBack"
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
            保存跟进记录
          </button>
        </div>
      </div>

      <div v-if="vehicle.followups.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">历史跟进记录</h3>
        <FollowupRecord :records="vehicle.followups" />
      </div>

      <div v-if="vehicle.status === 'following'" class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">结束跟进</h3>
        <div class="flex gap-3">
          <button
            @click="handleComplete('sold')"
            class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            标记为成交
          </button>
          <button
            @click="handleComplete('unlisted')"
            class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            标记为失败
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVehicles } from '@/composables/useVehicles'
import { useVehicleStore } from '@/stores/vehicleStore'
import StatusBadge from '@/components/StatusBadge.vue'
import FollowupRecord from '@/components/FollowupRecord.vue'
import type { FollowupMethod, FollowupResult, FollowupRecord as FollowupRecordType } from '@/types'

const route = useRoute()
const router = useRouter()
const vehicleStore = useVehicleStore()
const { getVehicleById, changeStatus } = useVehicles()

const vehicle = computed(() => getVehicleById(route.params.id as string))

const methods = [
  { value: 'phone' as FollowupMethod, label: '电话' },
  { value: 'wechat' as FollowupMethod, label: '微信' },
  { value: 'visit' as FollowupMethod, label: '面谈' }
]

const results = [
  { value: 'pending' as FollowupResult, label: '待联系' },
  { value: 'interested' as FollowupResult, label: '有意向' },
  { value: 'negotiating' as FollowupResult, label: '谈判中' },
  { value: 'success' as FollowupResult, label: '成交' },
  { value: 'failed' as FollowupResult, label: '失败' }
]

const form = ref({
  method: 'phone' as FollowupMethod,
  customerInfo: '',
  content: '',
  result: 'pending' as FollowupResult,
  nextFollowupTime: ''
})

const canSubmit = computed(() => {
  return form.value.method && form.value.customerInfo.trim() && form.value.content.trim() && form.value.result
})

const goBack = () => {
  router.push(`/vehicle/${vehicle.value?.id}`)
}

const handleSubmit = () => {
  if (!vehicle.value || !canSubmit.value) return

  const newFollowup: FollowupRecordType = {
    id: `FU-${Date.now()}`,
    vehicleId: vehicle.value.id,
    operator: { id: 'U004', name: '赵强', role: 'sales' },
    time: new Date().toISOString(),
    method: form.value.method,
    customerInfo: form.value.customerInfo,
    content: form.value.content,
    result: form.value.result,
    nextFollowupTime: form.value.nextFollowupTime || null,
    attachments: []
  }

  const updatedFollowups = [...vehicle.value.followups, newFollowup]
  vehicleStore.updateVehicle(vehicle.value.id, { followups: updatedFollowups })

  form.value = {
    method: 'phone',
    customerInfo: '',
    content: '',
    result: 'pending',
    nextFollowupTime: ''
  }
}

const handleComplete = async (status: 'sold' | 'unlisted') => {
  if (!vehicle.value) return
  const remark = status === 'sold' ? '客户成交，感谢购买！' : '跟进失败，已下架'
  await changeStatus(vehicle.value.id, status, remark)
  goBack()
}
</script>
