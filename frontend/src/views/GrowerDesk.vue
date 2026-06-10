<script setup lang="ts">
import { computed, ref } from 'vue'
import { Scissors, Sprout, AlertTriangle, Calendar, CheckCircle2, MapPin, Clock } from 'lucide-vue-next'
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { useOrdersStore } from '@/stores/orders'
import { useSheltersStore } from '@/stores/shelters'
import { useUiStore } from '@/stores/ui'
import StatusTag from '@/components/common/StatusTag.vue'
import OrderDetailDrawer from '@/components/sales/OrderDetailDrawer.vue'
import { shelterStatusText, formatDate, cn } from '@/utils'
import type { CustomerOrder } from '@/types'

const ordersStore = useOrdersStore()
const sheltersStore = useSheltersStore()
const uiStore = useUiStore()

const harvestQtyInput = ref<Record<string, number>>({})

const growerOrders = computed(() =>
  ordersStore.orders
    .filter((o) => o.status === 'HARVESTING' || (o.status === 'STUCK' && o.stuckRecord?.stuckType === 'FORECAST_DEVIATION'))
    .sort((a, b) => (a.harvestPlan?.planDate || '').localeCompare(b.harvestPlan?.planDate || '')),
)

const groupedByDate = computed(() => {
  const map: Record<string, CustomerOrder[]> = {}
  growerOrders.value.forEach((o) => {
    const d = o.harvestPlan?.planDate || o.deliveryDate
    if (!map[d]) map[d] = []
    map[d].push(o)
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
})

function getShelter(sid: string) {
  return sheltersStore.getShelterById(sid)
}

function openDetail(id: string) {
  uiStore.openOrderDrawer(id)
}

function handleHarvest(order: CustomerOrder) {
  if (!order.harvestPlan) return
  const shelter = getShelter(order.harvestPlan.shelterId)
  const planQty = order.harvestPlan.planQty
  const prompt = `订单 ${order.id} 计划采切 ${planQty} 扎，请输入实际采切数量:${shelter ? ` (${shelter.name}可采${shelter.availableQty}扎)` : ''}`

  ElMessageBox.prompt(prompt, '确认采切完成', {
    confirmButtonText: '完成采切→推送包装',
    cancelButtonText: '取消',
    inputType: 'number',
    inputValue: (harvestQtyInput.value[order.id] ?? planQty).toString(),
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入有效数字',
  })
    .then(({ value }) => {
      const qty = parseInt(value, 10) || planQty
      harvestQtyInput.value[order.id] = qty
      ordersStore.completeHarvest(order.id, qty)
      sheltersStore.harvestShelter(order.harvestPlan!.shelterId, qty)
      ElMessage.success(`已采切${qty}扎,自动推送至包装主管待包装队列`)
    })
    .catch(() => {})
}

function handleReportAbnormal(order: CustomerOrder) {
  ElMessageBox.prompt(`订单 ${order.id} 上报异常:`, '花期/棚区异常', {
    confirmButtonText: '标记卡住',
    cancelButtonText: '取消',
    inputValue: '花期预测不准,',
    inputPlaceholder: '请描述异常情况...',
  })
    .then(({ value }) => {
      if (value && value.trim()) {
        ordersStore.reportStuck(order.id, {
          stuckType: 'FORECAST_DEVIATION',
          reason: value.trim(),
          previousStatus: order.status,
        })
        ElMessage.warning('已上报异常,全岗可见')
      }
    })
    .catch(() => {})
}

function resolveStuck(order: CustomerOrder) {
  ElMessageBox.prompt(`恢复订单 ${order.id}:`, '处理措施', {
    confirmButtonText: '恢复继续流程',
    cancelButtonText: '取消',
    inputValue: '已延后2天,重新排期',
  })
    .then(({ value }) => {
      if (value && value.trim()) {
        ordersStore.resolveStuck(order.id, '种植-李师傅', value.trim())
        ElMessage.success('已恢复,流程继续')
      }
    })
    .catch(() => {})
}
</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-5">
    <!-- 左: 采切排期时间轴 -->
    <div class="xl:col-span-2 space-y-5">
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title !mb-0">
            <Calendar :size="18" class="text-base-500" />
            采切排期时间轴
            <span class="ml-2 text-xs font-normal text-neutral-500">(按计划日期分组)</span>
          </h2>
          <ElButton size="small" :icon="Scissors">棚区巡检记录</ElButton>
        </div>

        <div v-if="groupedByDate.length === 0" class="py-16 text-center text-neutral-400">
          当前暂无采切任务
        </div>

        <div class="relative">
          <!-- 时间线竖线 -->
          <div class="absolute left-[130px] top-4 bottom-4 w-0.5 bg-neutral-200" aria-hidden />

          <div v-for="[date, orders] in groupedByDate" :key="date" class="relative mb-6 last:mb-0">
            <!-- 日期节点 -->
            <div class="flex items-start gap-4">
              <div class="w-[120px] flex-shrink-0 text-right pt-1">
                <div class="text-sm font-bold data-num text-neutral-800">{{ date.slice(5) }}</div>
                <div class="text-[11px] text-neutral-500">{{ formatDate(date) }}</div>
              </div>
              <div class="absolute left-[125px] top-2 w-4 h-4 rounded-full bg-base-500 border-4 border-white z-10 shadow-sm" />
              <div class="ml-4 flex-1 space-y-3">
                <div v-for="order in orders" :key="order.id"
                  @click="openDetail(order.id)"
                  class="workspace-card p-4 cursor-pointer hover:border-base-300 transition-all"
                  :class="{ 'stuck-card border-alert-300': order.status === 'STUCK' }">
                  <!-- 头部 -->
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-mono font-bold text-sm data-num text-neutral-800">{{ order.id }}</span>
                        <StatusTag type="order" :value="order.status" size="sm" />
                        <ElTag v-if="order.stuckRecord" type="danger" size="small" effect="light" round>
                          {{ order.stuckRecord.reason.length > 12 ? order.stuckRecord.reason.slice(0, 12) + '...' : order.stuckRecord.reason }}
                        </ElTag>
                      </div>
                      <div class="text-xs text-neutral-600">
                        客户: <b class="text-neutral-800">{{ order.customerName }}</b> · 配送 {{ order.deliveryDate }}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-[11px] text-neutral-500 mb-0.5">计划/已采</div>
                      <div class="data-num font-bold text-base-700">
                        {{ order.harvestPlan?.planQty }} / {{ order.harvestPlan?.actualQty ?? 0 }}
                        <span class="text-xs text-neutral-500 font-normal">扎</span>
                      </div>
                    </div>
                  </div>

                  <!-- 花卉与棚区 -->
                  <div class="flex flex-wrap gap-2 mb-3">
                    <div v-for="it in order.items" :key="it.id"
                      class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-base-50 border border-base-100">
                      <span class="text-sm">🌸</span>
                      <div>
                        <div class="text-xs font-medium text-neutral-800">{{ it.flowerType }} · {{ it.color }}</div>
                        <div class="text-[10px] text-neutral-500 data-num">{{ it.quantity }}扎 × {{ it.stemsPerBunch }}枝</div>
                      </div>
                    </div>
                  </div>

                  <!-- 棚区信息 -->
                  <div v-if="getShelter(order.harvestPlan?.shelterId || '')" class="mb-3 flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
                    <MapPin :size="14" class="text-neutral-500 flex-shrink-0" />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-neutral-800">{{ getShelter(order.harvestPlan!.shelterId)!.name }}</span>
                        <StatusTag type="shelter" :value="getShelter(order.harvestPlan!.shelterId)!.status" size="sm" />
                      </div>
                      <div class="text-[11px] text-neutral-500 mt-0.5">
                        成熟度 {{ getShelter(order.harvestPlan!.shelterId)!.maturity }}% · 可采
                        <b class="text-base-600 data-num">{{ getShelter(order.harvestPlan!.shelterId)!.availableQty }}</b> 扎
                        <span v-if="getShelter(order.harvestPlan!.shelterId)!.note" class="ml-2 text-alert-600">
                          ⚠ {{ getShelter(order.harvestPlan!.shelterId)!.note }}
                        </span>
                      </div>
                    </div>
                    <div class="w-24">
                      <div class="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                        <div class="h-full rounded-full transition-all"
                          :class="{
                            'bg-success-500': getShelter(order.harvestPlan!.shelterId)!.maturity >= 90,
                            'bg-gold-500': getShelter(order.harvestPlan!.shelterId)!.maturity >= 70 && getShelter(order.harvestPlan!.shelterId)!.maturity < 90,
                            'bg-alert-500': getShelter(order.harvestPlan!.shelterId)!.maturity < 70,
                          }"
                          :style="{ width: getShelter(order.harvestPlan!.shelterId)!.maturity + '%' }" />
                      </div>
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="flex flex-wrap gap-2 justify-end pt-2 border-t border-neutral-100" @click.stop>
                    <ElButton size="small" @click="openDetail(order.id)">查看详情</ElButton>
                    <ElButton v-if="order.status === 'STUCK'" type="success" size="small" @click="resolveStuck(order)">
                      恢复并继续
                    </ElButton>
                    <ElButton v-if="order.status !== 'STUCK' && order.harvestPlan?.status !== 'DONE'" type="warning" size="small" @click="handleReportAbnormal(order)">
                      <AlertTriangle :size="13" class="mr-1" /> 上报异常
                    </ElButton>
                    <ElButton v-if="order.status === 'HARVESTING' && order.harvestPlan?.status !== 'DONE'" type="primary" size="small" @click="handleHarvest(order)">
                      <CheckCircle2 :size="13" class="mr-1" /> 完成采切→推送包装
                    </ElButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右: 棚区状态看板 -->
    <div class="space-y-5">
      <!-- 棚区概览 -->
      <div class="workspace-card p-4">
        <h2 class="section-title">
          <Sprout :size="18" class="text-base-500" />
          8 个棚区状态
        </h2>
        <div class="grid grid-cols-4 gap-2 mb-4 text-center">
          <div class="p-2 rounded-lg bg-base-50">
            <div class="text-lg font-bold data-num text-base-600">{{ sheltersStore.readyCount }}</div>
            <div class="text-[10px] text-neutral-500">可采切</div>
          </div>
          <div class="p-2 rounded-lg bg-neutral-100">
            <div class="text-lg font-bold data-num text-neutral-600">{{ sheltersStore.immatureCount }}</div>
            <div class="text-[10px] text-neutral-500">待成熟</div>
          </div>
          <div class="p-2 rounded-lg bg-success-50">
            <div class="text-lg font-bold data-num text-success-600">{{ sheltersStore.harvestedCount }}</div>
            <div class="text-[10px] text-neutral-500">已采切</div>
          </div>
          <div class="p-2 rounded-lg bg-alert-50">
            <div class="text-lg font-bold data-num text-alert-600">{{ sheltersStore.abnormalCount }}</div>
            <div class="text-[10px] text-neutral-500">异常</div>
          </div>
        </div>
      </div>

      <!-- 棚区卡片列表 -->
      <div class="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
        <div v-for="s in sheltersStore.shelters" :key="s.id"
          class="workspace-card p-3 transition-all"
          :class="{ 'stuck-card border-alert-300': s.status === 'ABNORMAL' }">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="font-mono font-semibold text-sm data-num text-neutral-800">{{ s.name }}</span>
              <StatusTag type="shelter" :value="s.status" size="sm" />
            </div>
            <span class="text-xs text-neutral-500 data-num">可采 <b class="text-base-700">{{ s.availableQty }}</b>扎</span>
          </div>
          <div class="text-sm text-neutral-700 mb-2">{{ s.flowerType }} · {{ s.color }}</div>
          <div class="flex items-center gap-2 mb-2">
            <div class="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
              <div class="h-full rounded-full transition-all"
                :class="{
                  'bg-success-500': s.maturity >= 90,
                  'bg-gold-500': s.maturity >= 70 && s.maturity < 90,
                  'bg-alert-500': s.maturity < 70 || s.status === 'ABNORMAL',
                }"
                :style="{ width: s.maturity + '%' }" />
            </div>
            <span class="text-xs data-num font-medium text-neutral-600 w-10 text-right">{{ s.maturity }}%</span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-neutral-500">
            <span><Clock :size="11" class="inline mr-1" />预测: {{ s.forecastDate.slice(5) }}</span>
            <span v-if="s.actualDate">实际: {{ s.actualDate.slice(5) }}</span>
          </div>
          <div v-if="s.note" class="mt-2 p-2 rounded bg-alert-50 text-xs text-alert-700 border border-alert-100">
            <AlertTriangle :size="12" class="inline mr-1" /> {{ s.note }}
          </div>
        </div>
      </div>
    </div>

    <!-- 订单详情抽屉 -->
    <OrderDetailDrawer v-model="uiStore.drawerVisible" :order-id="uiStore.selectedOrderId" />
  </div>
</template>
