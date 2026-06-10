<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Package, Truck, AlertTriangle, CheckCircle2, ScanLine, Eye, Edit, AlertCircle } from 'lucide-vue-next'
import { ElButton, ElMessage, ElMessageBox, ElCheckbox, ElCheckboxGroup, ElTag, ElTabs, ElTabPane } from 'element-plus'
import { useOrdersStore } from '@/stores/orders'
import { useUiStore } from '@/stores/ui'
import StatusTag from '@/components/common/StatusTag.vue'
import OrderDetailDrawer from '@/components/sales/OrderDetailDrawer.vue'
import { formatDateTime, cn } from '@/utils'
import type { CustomerOrder } from '@/types'

const ordersStore = useOrdersStore()
const uiStore = useUiStore()

const checkedMap = ref<Record<string, string[]>>({})
const damageInput = ref<Record<string, string>>({})
const activeTab = ref('pending')

const packerOrders = computed(() =>
  ordersStore.orders.filter((o) =>
    o.status === 'PACKING' || (o.status === 'STUCK' && o.stuckRecord?.stuckType === 'PACKAGE_DAMAGE') || o.status === 'COMPLETED',
  ),
)
const pendingList = computed(() => packerOrders.value.filter((o) => o.status === 'PACKING' || (o.status === 'STUCK' && o.stuckRecord?.stuckType === 'PACKAGE_DAMAGE')))
const shippingList = computed(() => packerOrders.value.filter((o) => o.status === 'COMPLETED' && o.logisticsNo).slice(0, 8))

watch(
  pendingList,
  (list) => {
    list.forEach((o) => {
      if (!checkedMap.value[o.id]) {
        checkedMap.value[o.id] = []
      }
    })
  },
  { immediate: true },
)

function openDetail(id: string) {
  uiStore.openOrderDrawer(id)
}

function getCheckedKeys(orderId: string): string[] {
  if (!checkedMap.value[orderId]) {
    checkedMap.value[orderId] = []
  }
  return checkedMap.value[orderId]
}

function isAllChecked(order: CustomerOrder) {
  const keys = order.items.map((i) => `${order.id}-${i.id}`)
  const checked = getCheckedKeys(order.id)
  return keys.length > 0 && keys.every((k) => checked.includes(k))
}

function handleCheckAll(order: CustomerOrder) {
  const keys = order.items.map((i) => `${order.id}-${i.id}`)
  getCheckedKeys(order.id)
  checkedMap.value[order.id] = isAllChecked(order) ? [] : [...keys]
}

function handleReportDamage(order: CustomerOrder) {
  ElMessageBox.prompt(`登记订单 ${order.id} 包装破损情况:`, '包装破损登记', {
    confirmButtonText: '标记卡住并通知补采',
    cancelButtonText: '取消',
    inputValue: damageInput.value[order.id] || '',
    inputPlaceholder: '例如: 3扎洋牡丹包装压损,需补采',
  })
    .then(({ value }) => {
      if (value && value.trim()) {
        damageInput.value[order.id] = value.trim()
        ordersStore.reportStuck(order.id, {
          stuckType: 'PACKAGE_DAMAGE',
          reason: value.trim(),
          previousStatus: order.status,
        })
        ElMessage.warning('破损已登记,全岗可见,等待补采')
      }
    })
    .catch(() => {})
}

function handleResolveDamage(order: CustomerOrder) {
  ElMessageBox.prompt(`处理破损完成,恢复流程:`, '恢复卡住', {
    confirmButtonText: '确认恢复',
    cancelButtonText: '取消',
    inputValue: '补采已送达,重新包装',
  })
    .then(({ value }) => {
      if (value && value.trim()) {
        ordersStore.resolveStuck(order.id, '包装-老赵', value.trim())
        ElMessage.success('已恢复,包装继续')
      }
    })
    .catch(() => {})
}

function handleAdjustSpec(order: CustomerOrder) {
  ElMessageBox.prompt(`调整包装规格 ${order.id}:`, '规格调整', {
    confirmButtonText: '确认并同步',
    cancelButtonText: '取消',
    inputValue: order.specNote,
    inputType: 'textarea',
  })
    .then(({ value }) => {
      if (value && value.trim()) {
        ordersStore.addLog(order.id, 'PACKER', '包装-老赵', '调整包装规格', `原:${order.specNote} → 新:${value.trim()}`)
        order.specNote = value.trim()
        ElMessage.success('规格已调整,同步回订单记录')
      }
    })
    .catch(() => {})
}

function handleShip(order: CustomerOrder) {
  ElMessageBox.confirm(
    `订单 ${order.id} · ${order.customerName}\n核对规格后确认发货,将自动生成物流单号并标记完成`,
    '确认发货',
    { confirmButtonText: '确认发货→完成订单', type: 'success' },
  )
    .then(() => {
      const no = 'SF' + Math.floor(1000000000000 + Math.random() * 9000000000000)
      ordersStore.confirmShip(order.id, no)
      ElMessage.success(`发货成功!物流单号: ${no}`)
    })
    .catch(() => {})
}
</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto">
    <!-- 顶部统计 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">待包装队列</span>
          <div class="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center text-gold-500"><Package :size="16" /></div>
        </div>
        <div class="text-3xl font-bold data-num text-gold-600">{{ pendingList.length }}<span class="text-sm font-normal text-neutral-500 ml-1">单</span></div>
      </div>
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">今日已包装</span>
          <div class="w-8 h-8 rounded-lg bg-base-50 flex items-center justify-center text-base-500"><CheckCircle2 :size="16" /></div>
        </div>
        <div class="text-3xl font-bold data-num text-base-700">186<span class="text-sm font-normal text-neutral-500 ml-1">扎</span></div>
      </div>
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">今日发货</span>
          <div class="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center text-success-500"><Truck :size="16" /></div>
        </div>
        <div class="text-3xl font-bold data-num text-success-600">{{ shippingList.length }}<span class="text-sm font-normal text-neutral-500 ml-1">单</span></div>
      </div>
      <div class="workspace-card p-4 border-alert-200" :class="ordersStore.orders.filter(o => o.status === 'STUCK' && o.stuckRecord?.stuckType === 'PACKAGE_DAMAGE').length > 0 ? 'stuck-card' : ''">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">包装破损卡住</span>
          <div class="w-8 h-8 rounded-lg bg-alert-50 flex items-center justify-center text-alert-500"><AlertTriangle :size="16" /></div>
        </div>
        <div class="text-3xl font-bold data-num text-alert-600">
          {{ ordersStore.orders.filter(o => o.status === 'STUCK' && o.stuckRecord?.stuckType === 'PACKAGE_DAMAGE').length }}
        </div>
      </div>
    </div>

    <ElTabs v-model="activeTab" type="border-card" class="workspace-card">
      <!-- 待包装看板 -->
      <ElTabPane label="待包装队列" name="pending">
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-2">
          <div v-if="pendingList.length === 0" class="col-span-full py-16 text-center text-neutral-400">
            待包装队列为空,休息一下 🌿
          </div>
          <div v-for="order in pendingList" :key="order.id"
            class="workspace-card p-4 transition-all hover:border-base-300"
            :class="{ 'stuck-card border-alert-300': order.status === 'STUCK' }">
            <!-- 头部 -->
            <div class="flex items-start justify-between mb-3 pb-3 border-b border-neutral-100">
              <div @click="openDetail(order.id)" class="cursor-pointer">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-mono font-bold text-sm data-num text-neutral-800">{{ order.id }}</span>
                  <StatusTag type="order" :value="order.status" size="sm" />
                </div>
                <div class="text-xs text-neutral-600">{{ order.customerName }} · 配送 {{ order.deliveryDate }}</div>
              </div>
              <div class="text-right">
                <div class="text-[11px] text-neutral-500">花卉总数</div>
                <div class="data-num font-bold text-base-700">{{ order.items.reduce((s, i) => s + i.quantity, 0) }} 扎</div>
              </div>
            </div>

            <!-- 卡住警示 -->
            <div v-if="order.status === 'STUCK' && order.stuckRecord"
              class="mb-3 p-3 rounded-lg bg-alert-50 border border-alert-200">
              <div class="flex items-start gap-2">
                <AlertCircle :size="16" class="text-alert-500 mt-0.5 flex-shrink-0" />
                <div class="flex-1 text-xs">
                  <div class="font-medium text-alert-700 mb-0.5">{{ order.stuckRecord.reason }}</div>
                  <div class="text-[11px] text-alert-600 data-num">卡于 {{ formatDateTime(order.stuckRecord.stuckAt) }}</div>
                </div>
              </div>
            </div>

            <!-- 规格核对清单 -->
            <div class="mb-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-neutral-600 flex items-center gap-1">
                  <ScanLine :size="12" /> 规格核对清单
                </span>
                <label class="text-xs cursor-pointer select-none">
                  <input type="checkbox" :checked="isAllChecked(order)" @change="handleCheckAll(order)" class="mr-1" />
                  <span :class="isAllChecked(order) ? 'text-success-600 font-medium' : 'text-neutral-500'">
                    {{ isAllChecked(order) ? '✓ 全部核对' : '全选' }}
                  </span>
                </label>
              </div>
              <div class="space-y-1.5">
                <ElCheckboxGroup v-model="checkedMap[order.id]">
                  <div v-for="item in order.items" :key="item.id"
                    class="flex items-center justify-between p-2 rounded-md transition-colors"
                    :class="getCheckedKeys(order.id).includes(`${order.id}-${item.id}`) ? 'bg-success-50' : 'bg-neutral-50 hover:bg-neutral-100'">
                    <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <ElCheckbox :value="`${order.id}-${item.id}`" size="small" />
                      <div class="min-w-0">
                        <div class="text-xs font-medium text-neutral-800 truncate">
                          {{ item.flowerType }} · {{ item.color }}
                        </div>
                        <div class="text-[10px] text-neutral-500">
                          每扎 {{ item.stemsPerBunch }}枝 · 来源 {{ item.shelterId }}
                        </div>
                      </div>
                    </label>
                    <div class="text-right flex-shrink-0 ml-2">
                      <span class="data-num font-semibold text-sm"
                        :class="getCheckedKeys(order.id).includes(`${order.id}-${item.id}`) ? 'text-success-600' : 'text-neutral-700'">
                        {{ item.quantity }}
                      </span>
                      <span class="text-[10px] text-neutral-500 ml-0.5">扎</span>
                    </div>
                  </div>
                </ElCheckboxGroup>
              </div>
            </div>

            <!-- 包装要求 -->
            <div class="mb-3 p-2.5 rounded-lg bg-gold-50 border border-gold-100">
              <div class="text-[11px] font-semibold text-gold-700 mb-1">📦 客户包装要求</div>
              <div class="text-xs text-neutral-700 leading-relaxed">{{ order.specNote }}</div>
            </div>

            <!-- 操作 -->
            <div class="flex flex-wrap gap-2 pt-2 border-t border-neutral-100" @click.stop>
              <ElButton size="small" @click="openDetail(order.id)"><Eye :size="12" class="mr-1" />详情</ElButton>
              <ElButton size="small" type="warning" plain @click="handleAdjustSpec(order)"><Edit :size="12" class="mr-1" />调规格</ElButton>
              <ElButton v-if="order.status !== 'STUCK'" size="small" type="danger" plain @click="handleReportDamage(order)">
                <AlertTriangle :size="12" class="mr-1" />报破损
              </ElButton>
              <ElButton v-if="order.status === 'STUCK'" size="small" type="success" @click="handleResolveDamage(order)">
                恢复继续
              </ElButton>
              <ElButton v-if="order.status !== 'STUCK' && isAllChecked(order)" type="success" size="small" class="ml-auto" @click="handleShip(order)">
                <Truck :size="12" class="mr-1" /> 发货→完成
              </ElButton>
              <ElButton v-else-if="order.status !== 'STUCK'" size="small" disabled>
                请先核对全部规格
              </ElButton>
            </div>
          </div>
        </div>
      </ElTabPane>

      <!-- 已发货 -->
      <ElTabPane label="今日已发货" name="shipped">
        <div class="p-2 space-y-2">
          <div v-if="shippingList.length === 0" class="py-16 text-center text-neutral-400">暂无发货记录</div>
          <div v-for="o in shippingList" :key="o.id"
            @click="openDetail(o.id)"
            class="workspace-card p-3 hover:border-success-300 cursor-pointer transition-all flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-success-50 border border-success-200 flex items-center justify-center text-success-600 flex-shrink-0">
              <CheckCircle2 :size="20" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-mono font-semibold text-sm data-num text-neutral-800">{{ o.id }}</span>
                <span class="text-xs text-neutral-600">{{ o.customerName }}</span>
                <ElTag type="success" size="small" effect="light" round>已完成</ElTag>
              </div>
              <div class="text-[11px] text-neutral-500">
                物流: <span class="font-mono data-num">{{ o.logisticsNo }}</span>
                <span class="mx-2">·</span>
                {{ formatDateTime(o.updatedAt) }}
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-[11px] text-neutral-500">总金额</div>
              <div class="data-num font-semibold text-base-700">¥{{ o.totalAmount.toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </ElTabPane>
    </ElTabs>

    <OrderDetailDrawer v-model="uiStore.drawerVisible" :order-id="uiStore.selectedOrderId" />
  </div>
</template>
