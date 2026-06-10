<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { User, Phone, MapPin, Calendar, Banknote, Scissors, Package, Truck, AlertCircle, CheckCircle2, Clock, Edit3 } from 'lucide-vue-next'
import { ElDrawer, ElButton, ElTag, ElTimeline, ElTimelineItem, ElDivider, ElInput, ElMessageBox, ElMessage } from 'element-plus'
import { useOrdersStore } from '@/stores/orders'
import { useUiStore } from '@/stores/ui'
import StatusTag from '@/components/common/StatusTag.vue'
import { formatDateTime, getDurationHours, stuckTypeText, cn } from '@/utils'
import type { CustomerOrder } from '@/types'

const props = defineProps<{ modelValue: boolean; orderId: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const ordersStore = useOrdersStore()
const uiStore = useUiStore()

const resolveInput = ref('')

const order = computed<CustomerOrder | null>(() => props.orderId ? ordersStore.getOrderById(props.orderId) : null)
const logs = computed(() => props.orderId ? ordersStore.getLogsByOrderId(props.orderId) : [])

watch(() => props.modelValue, (v) => {
  if (!v) emit('update:modelValue', false)
})

function close() {
  uiStore.closeDrawer()
  emit('update:modelValue', false)
}

function confirmOrder() {
  if (!order.value) return
  ordersStore.confirmOrder(order.value.id)
  ElMessage.success('订单已确认,已自动生成采切排期推送至种植员工作台')
}

function resolveStuck() {
  if (!order.value) return
  if (!resolveInput.value.trim()) {
    ElMessage.warning('请输入处理措施')
    return
  }
  ordersStore.resolveStuck(order.value.id, '销售-小林', resolveInput.value.trim())
  resolveInput.value = ''
  ElMessage.success('已恢复,流程继续推进')
}

function confirmShip() {
  if (!order.value) return
  const no = 'SF' + Date.now().toString().slice(-10)
  ordersStore.confirmShip(order.value.id, no)
  ElMessage.success(`发货确认,物流单号:${no}`)
}
</script>

<template>
  <ElDrawer
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    :title="order ? `订单详情 · ${order.id}` : '订单详情'"
    direction="rtl"
    size="520px"
    destroy-on-close>
    <div v-if="order" class="space-y-4">
      <!-- 头部状态 -->
      <div class="rounded-xl p-4 flex items-start justify-between"
        :class="order.status === 'STUCK' ? 'bg-alert-50 border border-alert-200 animate-pulse-stuck' : 'bg-base-50 border border-base-200'">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <StatusTag type="order" :value="order.status" size="md" />
            <span class="text-[11px] text-neutral-500 data-num">{{ getDurationHours(order.createdAt, order.updatedAt) }} 处理时长</span>
          </div>
          <div class="text-xl font-bold text-neutral-800 mb-1">{{ order.customerName }}</div>
          <div class="text-sm text-neutral-600 flex items-center gap-1"><Phone :size="13" />{{ order.phone }}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-neutral-500 mb-1">订单金额</div>
          <div class="text-2xl font-bold data-num text-base-700">¥{{ order.totalAmount.toLocaleString() }}</div>
        </div>
      </div>

      <!-- 卡住警示 -->
      <div v-if="order.status === 'STUCK' && order.stuckRecord" class="rounded-xl bg-alert-50 border border-alert-200 p-4">
        <div class="flex items-start gap-2 mb-2">
          <AlertCircle :size="18" class="text-alert-500 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <StatusTag type="stuck" :value="order.stuckRecord.stuckType" size="sm" />
              <span class="text-xs text-alert-600 data-num">已卡 {{ getDurationHours(order.stuckRecord.stuckAt) }}</span>
            </div>
            <div class="text-sm font-medium text-alert-700">{{ order.stuckRecord.reason }}</div>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-alert-200">
          <label class="text-xs text-alert-600 font-medium block mb-1">处理措施</label>
          <ElInput v-model="resolveInput" type="textarea" :rows="2" placeholder="请输入处理措施后点击恢复..." class="mb-2 text-sm" />
          <ElButton type="danger" size="small" @click="resolveStuck">恢复卡住状态,继续流程</ElButton>
        </div>
      </div>

      <!-- 配送信息 -->
      <div class="workspace-card p-4">
        <div class="section-title text-sm"><Calendar :size="16" class="text-base-500" /> 配送信息</div>
        <div class="grid grid-cols-1 gap-2 text-sm">
          <div class="flex items-start gap-2"><MapPin :size="14" class="text-neutral-500 mt-0.5 flex-shrink-0" /><span class="text-neutral-700">{{ order.address }}</span></div>
          <div class="flex items-center gap-2"><Calendar :size="14" class="text-neutral-500 flex-shrink-0" /><span class="text-neutral-500">配送日期:</span><span class="font-medium data-num text-neutral-700">{{ order.deliveryDate }}</span></div>
          <div class="flex items-start gap-2"><Banknote :size="14" class="text-neutral-500 mt-0.5 flex-shrink-0" /><span class="text-neutral-500">包装要求:</span><span class="text-neutral-700">{{ order.specNote }}</span></div>
        </div>
      </div>

      <!-- 花卉明细 -->
      <div class="workspace-card p-4">
        <div class="section-title text-sm"><Scissors :size="16" class="text-base-500" /> 花卉明细</div>
        <div class="space-y-2">
          <div v-for="item in order.items" :key="item.id"
            class="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center text-base-700 font-bold text-sm">
                {{ item.flowerType.charAt(0) }}
              </div>
              <div>
                <div class="text-sm font-medium text-neutral-800">{{ item.flowerType }} · {{ item.color }}</div>
                <div class="text-[11px] text-neutral-500">{{ item.shelterId }} · 每扎{{ item.stemsPerBunch }}枝</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold data-num text-base-700">{{ item.quantity }}</div>
              <div class="text-[11px] text-neutral-500">扎</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 采切排期 -->
      <div v-if="order.harvestPlan" class="workspace-card p-4">
        <div class="section-title text-sm"><Scissors :size="16" class="text-base-500" /> 采切排期</div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="p-2.5 rounded-lg bg-neutral-50"><div class="text-xs text-neutral-500 mb-0.5">计划日期</div><div class="font-medium data-num text-neutral-700">{{ order.harvestPlan.planDate }}</div></div>
          <div class="p-2.5 rounded-lg bg-neutral-50"><div class="text-xs text-neutral-500 mb-0.5">状态</div><div><StatusTag type="harvest" :value="order.harvestPlan.status" size="sm" /></div></div>
          <div class="p-2.5 rounded-lg bg-neutral-50"><div class="text-xs text-neutral-500 mb-0.5">计划/实际</div><div class="font-medium data-num text-neutral-700">{{ order.harvestPlan.planQty }} / {{ order.harvestPlan.actualQty ?? '-' }} 扎</div></div>
          <div class="p-2.5 rounded-lg bg-neutral-50"><div class="text-xs text-neutral-500 mb-0.5">负责人</div><div class="font-medium text-neutral-700">{{ order.harvestPlan.operator }}</div></div>
        </div>
      </div>

      <!-- 物流信息 -->
      <div v-if="order.logisticsNo" class="workspace-card p-4">
        <div class="section-title text-sm"><Truck :size="16" class="text-success-500" /> 物流信息</div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-success-50 border border-success-200 flex items-center justify-center text-success-600">
            <CheckCircle2 :size="20" />
          </div>
          <div>
            <div class="text-sm font-medium text-neutral-800">已发货</div>
            <div class="text-xs text-neutral-500 data-num">单号:{{ order.logisticsNo }}</div>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="workspace-card p-4">
        <div class="section-title text-sm"><Edit3 :size="16" class="text-gold-500" /> 快捷操作</div>
        <div class="flex flex-wrap gap-2">
          <ElButton v-if="order.status === 'PENDING_CONFIRM'" type="primary" size="small" @click="confirmOrder">确认订单→推送采切</ElButton>
          <ElButton v-if="order.status === 'PACKING'" type="success" size="small" @click="confirmShip">确认发货→自动完成</ElButton>
          <ElButton v-if="order.status !== 'COMPLETED' && order.status !== 'STUCK'" type="warning" size="small" @click="() => ElMessageBox.alert('功能演示: 规格修改入口', '改规格')">修改规格</ElButton>
          <ElButton v-if="order.status !== 'COMPLETED' && order.status !== 'STUCK'" type="danger" size="small" plain @click="() => ElMessageBox.alert('功能演示: 异常上报入口', '标记异常')">标记异常卡住</ElButton>
        </div>
      </div>

      <!-- 操作时间线 -->
      <div class="workspace-card p-4">
        <div class="section-title text-sm mb-4"><Clock :size="16" class="text-base-500" /> 操作时间线</div>
        <ElTimeline>
          <ElTimelineItem v-for="log in logs" :key="log.id"
            :type="log.isStuck ? 'danger' : 'primary'"
            :hollow="false"
            :timestamp="formatDateTime(log.timestamp)"
            placement="top"
            :color="log.isStuck ? '#D64545' : undefined">
            <div class="flex items-center gap-2 mb-1">
              <StatusTag type="role" :value="log.role" size="sm" />
              <span class="text-sm font-medium text-neutral-800">{{ log.operatorName }}</span>
            </div>
            <div class="text-[13px] text-neutral-700">{{ log.action }}</div>
            <div class="text-[12px] text-neutral-500 mt-0.5">{{ log.detail }}</div>
          </ElTimelineItem>
        </ElTimeline>
      </div>
    </div>

    <div v-else class="text-center py-20 text-neutral-400">
      请选择订单查看详情
    </div>
  </ElDrawer>
</template>
