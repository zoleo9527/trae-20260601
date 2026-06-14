<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <h1 class="text-2xl font-bold text-gray-900">{{ vehicle?.plate }}</h1>
              <p class="text-sm text-gray-600 mt-1">{{ vehicle?.model }}</p>
            </div>
          </div>
          <StatusBadge v-if="vehicle" :status="vehicle.status" />
        </div>
      </div>
    </header>

    <main v-if="vehicle" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">品牌</p>
                <p class="font-medium text-gray-900">{{ vehicle.brand }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">年份</p>
                <p class="font-medium text-gray-900">{{ vehicle.year }}款</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">行驶里程</p>
                <p class="font-medium text-gray-900">{{ vehicle.mileage.toLocaleString() }} 公里</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">收车价</p>
                <p class="font-medium text-blue-600">¥{{ vehicle.purchasePrice.toLocaleString() }}</p>
              </div>
              <div v-if="vehicle.listedPrice">
                <p class="text-sm text-gray-600">上架价</p>
                <p class="font-medium text-green-600">¥{{ vehicle.listedPrice.toLocaleString() }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">状态时间轴</h2>
            <StatusTimeline :timeline="vehicle.timeline" />
          </div>

          <div v-if="vehicle.followups.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">跟进记录</h2>
              <button
                v-if="vehicle.status === 'following'"
                @click="goToFollowup"
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                添加跟进
              </button>
            </div>
            <FollowupRecord :records="vehicle.followups" />
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">交接责任人</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p class="text-xs text-gray-600">收车经理</p>
                  <p class="font-medium text-gray-900">{{ vehicle.collector.name }}</p>
                </div>
                <span v-if="!vehicle.evaluator" class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  待交接
                </span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p class="text-xs text-gray-600">评估师</p>
                  <p v-if="vehicle.evaluator" class="font-medium text-gray-900">{{ vehicle.evaluator.name }}</p>
                  <p v-else class="text-sm text-gray-400">暂无</p>
                </div>
                <span v-if="vehicle.evaluator && !vehicle.financeStaff" class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  待交接
                </span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p class="text-xs text-gray-600">金融专员</p>
                  <p v-if="vehicle.financeStaff" class="font-medium text-gray-900">{{ vehicle.financeStaff.name }}</p>
                  <p v-else class="text-sm text-gray-400">暂无</p>
                </div>
                <span v-if="vehicle.financeStaff && !vehicle.salesRep" class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  待交接
                </span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p class="text-xs text-gray-600">销售顾问</p>
                  <p v-if="vehicle.salesRep" class="font-medium text-gray-900">{{ vehicle.salesRep.name }}</p>
                  <p v-else class="text-sm text-gray-400">暂无</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">可执行操作</h3>
            <div class="space-y-2">
              <button
                v-if="canChangeStatus"
                @click="showActionModal = true"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {{ nextActionLabel }}
              </button>
              <button
                v-if="shouldShowHandover"
                @click="showHandover = true"
                class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                发起交接
              </button>
              <button
                v-if="vehicle.status === 'pending_pricing'"
                @click="goToPricing"
                class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                处理定价
              </button>
              <button
                v-if="vehicle.status === 'following'"
                @click="goToFollowup"
                class="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                客户跟进
              </button>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-xs text-gray-600">入库时间</p>
            <p class="text-sm text-gray-900 mt-1">{{ formatDateTime(vehicle.createdAt) }}</p>
            <p class="text-xs text-gray-600 mt-3">更新时间</p>
            <p class="text-sm text-gray-900 mt-1">{{ formatDateTime(vehicle.updatedAt) }}</p>
          </div>
        </div>
      </div>
    </main>

    <HandoverModal
      :show="showHandover"
      :vehicle="vehicle"
      @close="showHandover = false"
      @submit="handleHandover"
    />

    <div v-if="showActionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showActionModal = false">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ nextActionLabel }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              操作备注
            </label>
            <textarea
              v-model="actionRemark"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入操作说明..."
            ></textarea>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            @click="showActionModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            @click="handleStatusChange"
            :disabled="!actionRemark.trim()"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg',
              actionRemark.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVehicles } from '@/composables/useVehicles'
import { useStatusTransition } from '@/composables/useStatusTransition'
import { useHandover } from '@/composables/useHandover'
import { useAuth } from '@/composables/useAuth'
import StatusBadge from '@/components/StatusBadge.vue'
import StatusTimeline from '@/components/StatusTimeline.vue'
import FollowupRecord from '@/components/FollowupRecord.vue'
import HandoverModal from '@/components/HandoverModal.vue'
import type { User, Vehicle } from '@/types'

const route = useRoute()
const router = useRouter()

const { getVehicleById, changeStatus } = useVehicles()
const { getAvailableTransitions, getAction } = useStatusTransition()
const { createHandover, shouldTriggerHandover, getAvailableReceivers } = useHandover()
const { currentUser } = useAuth()

const vehicle = computed((): Vehicle | null => {
  return getVehicleById(route.params.id as string) || null
})

const showHandover = ref(false)
const showActionModal = ref(false)
const actionRemark = ref('')

const nextActionLabel = computed(() => {
  if (!vehicle.value) return ''
  return getAction(vehicle.value.status)
})

const canChangeStatus = computed(() => {
  if (!vehicle.value) return false
  const transitions = getAvailableTransitions(vehicle.value.status, currentUser.value.role)
  return transitions.length > 0
})

const shouldShowHandover = computed(() => {
  if (!vehicle.value) return false
  const nextStatus = getAvailableTransitions(vehicle.value.status, currentUser.value.role)[0]?.status
  return nextStatus && shouldTriggerHandover(vehicle.value.status, nextStatus)
})

const goBack = () => {
  router.push('/')
}

const goToPricing = () => {
  router.push(`/vehicle/${vehicle.value?.id}/pricing`)
}

const goToFollowup = () => {
  router.push(`/followup/${vehicle.value?.id}`)
}

const handleHandover = async (user: User, remark: string) => {
  if (!vehicle.value) return
  await createHandover(vehicle.value.id, user, remark, vehicle.value.status)
  showHandover.value = false
}

const handleStatusChange = async () => {
  if (!vehicle.value || !actionRemark.value.trim()) return

  const nextStatus = getAvailableTransitions(vehicle.value.status, currentUser.value.role)[0]?.status
  if (!nextStatus) return

  const handoverTo = shouldTriggerHandover(vehicle.value.status, nextStatus)
    ? getAvailableReceivers(vehicle.value)[0]
    : undefined

  await changeStatus(vehicle.value.id, nextStatus, actionRemark.value, handoverTo, undefined, currentUser.value)
  showActionModal.value = false
  actionRemark.value = ''
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
