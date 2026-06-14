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
              <h1 class="text-2xl font-bold text-gray-900">定价处理</h1>
              <p class="text-sm text-gray-600 mt-1">{{ vehicle?.plate }} - {{ vehicle?.model }}</p>
            </div>
          </div>
          <StatusBadge v-if="vehicle" :status="vehicle.status" />
        </div>
      </div>
    </header>

    <main v-if="vehicle" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PricingForm
        v-if="vehicle.status === 'pending_pricing'"
        :vehicle="vehicle"
        mode="suggest"
        @submit="handleSubmit"
        @cancel="goBack"
      />

      <PricingForm
        v-else-if="vehicle.status === 'pricing_pending'"
        :vehicle="vehicle"
        mode="confirm"
        @submit="handleSubmit"
        @confirm="handleConfirm"
        @cancel="goBack"
      />

      <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-gray-600">该车辆当前状态不需要处理定价</p>
        <button
          @click="goBack"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          返回详情页
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVehicles } from '@/composables/useVehicles'
import { useAuth } from '@/composables/useAuth'
import { useHandover } from '@/composables/useHandover'
import StatusBadge from '@/components/StatusBadge.vue'
import PricingForm from '@/components/PricingForm.vue'

const route = useRoute()
const router = useRouter()

const { getVehicleById, changeStatus } = useVehicles()
const { currentUser, getUsersByRole } = useAuth()
const { createHandover } = useHandover()

const vehicle = computed(() => getVehicleById(route.params.id as string))

const goBack = () => {
  router.push(`/vehicle/${vehicle.value?.id}`)
}

const handleSubmit = async (data: { suggestedPrice?: number; finalPrice?: number; financePlan?: string; remark: string }) => {
  if (!vehicle.value || !data.suggestedPrice) return
  
  await changeStatus(
    vehicle.value.id,
    'pricing_pending',
    data.remark,
    undefined,
    { suggestedPrice: data.suggestedPrice, financePlan: data.financePlan },
    currentUser.value
  )
  
  const financeUsers = getUsersByRole('finance')
  if (financeUsers.length > 0) {
    await createHandover(
      vehicle.value.id,
      financeUsers[0],
      `收车经理${currentUser.value.name}提交定价，等待金融专员${financeUsers[0].name}确认`,
      'pricing_pending'
    )
  }
  
  goBack()
}

const handleConfirm = async (data: { finalPrice: number; financePlan: string; remark: string }) => {
  if (!vehicle.value) return
  
  await changeStatus(
    vehicle.value.id,
    'listed',
    data.remark,
    undefined,
    { finalPrice: data.finalPrice, financePlan: data.financePlan },
    currentUser.value
  )
  
  const salesUsers = getUsersByRole('sales')
  if (salesUsers.length > 0) {
    await createHandover(
      vehicle.value.id,
      salesUsers[0],
      `金融专员${currentUser.value.name}确认上架，等待销售顾问${salesUsers[0].name}跟进客户`,
      'listed'
    )
  }
  
  goBack()
}
</script>
