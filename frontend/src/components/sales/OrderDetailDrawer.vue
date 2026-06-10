<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { User, Phone, MapPin, Calendar, Banknote, Scissors, Package, Truck, AlertCircle, CheckCircle2, Clock, Edit3, History } from 'lucide-vue-next'
import { ElDrawer, ElButton, ElTag, ElTimeline, ElTimelineItem, ElDivider, ElInput, ElMessageBox, ElMessage, ElDialog, ElForm, ElFormItem, ElSelect, ElOption } from 'element-plus'
import { useOrdersStore } from '@/stores/orders'
import { useUiStore } from '@/stores/ui'
import { useSheltersStore } from '@/stores/shelters'
import StatusTag from '@/components/common/StatusTag.vue'
import { formatDateTime, getDurationHours, stuckTypeText, cn } from '@/utils'
import type { CustomerOrder, OrderItem } from '@/types'

const props = defineProps<{ modelValue: boolean; orderId: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const ordersStore = useOrdersStore()
const uiStore = useUiStore()
const sheltersStore = useSheltersStore()

const resolveInput = ref('')
const changeSpecInput = ref('')

const changeSpecDialogVisible = ref(false)
const changeSpecNote = ref('')
const changeSpecItems = ref<Array<{ flowerType: string; color: string; quantity: number; stemsPerBunch: number; shelterId: string; remark: string }>>([])

const order = computed<CustomerOrder | null>(() => props.orderId ? ordersStore.getOrderById(props.orderId) : null)
const logs = computed(() => props.orderId ? ordersStore.getLogsByOrderId(props.orderId) : [])

const flowerOptions = [
  { type: '玫瑰', colors: ['红色系', '粉色系', '白色系'] },
  { type: '洋牡丹', colors: ['橙色系', '粉色系'] },
  { type: '绣球', colors: ['蓝色系', '粉色系'] },
  { type: '满天星', colors: ['白色系'] },
]

watch(() => props.modelValue, (v) => {
  if (!v) emit('update:modelValue', false)
})

watch(order, (o) => {
  if (o) changeSpecInput.value = o.specNote || ''
}, { immediate: true })

function close() {
  uiStore.closeDrawer()
  emit('update:modelValue', false)
}

function confirmOrder() {
  if (!order.value) return
  ordersStore.confirmOrder(order.value.id)
  ElMessage.success('订单已确认,已基于最新明细重建采切排期推送至种植员工作台')
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

function openChangeSpecDialog() {
  if (!order.value) return
  changeSpecNote.value = order.value.specNote || ''
  changeSpecItems.value = order.value.items.map((it) => ({
    flowerType: it.flowerType,
    color: it.color,
    quantity: it.quantity,
    stemsPerBunch: it.stemsPerBunch,
    shelterId: it.shelterId,
    remark: it.remark,
  }))
  changeSpecDialogVisible.value = true
}

function addSpecItem() {
  changeSpecItems.value.push({
    flowerType: '玫瑰',
    color: '红色系',
    quantity: 10,
    stemsPerBunch: 20,
    shelterId: 'SH-A01',
    remark: '',
  })
}

function removeSpecItem(idx: number) {
  if (changeSpecItems.value.length <= 1) {
    ElMessage.warning('至少保留一个品种')
    return
  }
  changeSpecItems.value.splice(idx, 1)
}

function handleChangeSpec() {
  if (!order.value) return
  if (!changeSpecNote.value.trim()) { ElMessage.warning('包装规格描述不能为空'); return }
  if (changeSpecItems.value.length === 0) { ElMessage.warning('至少有一个花卉品种'); return }

  const items = changeSpecItems.value.map((it) => ({
    flowerType: it.flowerType,
    color: it.color,
    quantity: it.quantity,
    stemsPerBunch: it.stemsPerBunch,
    shelterId: it.shelterId,
    remark: it.remark,
  }))

  const record = ordersStore.changeSpec(
    order.value.id,
    { specNote: changeSpecNote.value.trim(), items },
    '销售-小林',
  )

  if (record) {
    changeSpecDialogVisible.value = false
    const itemCount = changeSpecItems.value.reduce((s, i) => s + i.quantity, 0)
    ElMessage.success(`规格已更新,共${changeSpecItems.value.length}个品种,${itemCount}扎,已记录改规格历史`)
  } else {
    ElMessage.info('规格未变更,无需保存')
  }
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
        <div class="flex flex-wrap gap-2 mb-4">
          <ElButton v-if="order.status === 'PENDING_CONFIRM'" type="primary" size="small" @click="confirmOrder">确认订单→推送采切</ElButton>
          <ElButton v-if="order.status === 'PACKING'" type="success" size="small" @click="confirmShip">确认发货→自动完成</ElButton>
          <ElButton v-if="order.status !== 'COMPLETED'" type="warning" size="small" @click="openChangeSpecDialog">改规格（明细级）</ElButton>
          <ElButton v-if="order.status !== 'COMPLETED' && order.status !== 'STUCK'" type="danger" size="small" plain @click="() => ElMessageBox.prompt('标记异常原因:', '标记卡住', { confirmButtonText: '确认', cancelButtonText: '取消' }).then(({ value }) => { if (value?.trim()) { ordersStore.reportStuck(order.id, { stuckType: 'CUSTOMER_CHANGE', reason: value.trim(), previousStatus: order.status }); ElMessage.warning('已标记为卡住') } }).catch(() => {})">标记异常卡住</ElButton>
        </div>
        <div v-if="order.specChangeHistory && order.specChangeHistory.length > 0" class="border-t border-neutral-200 pt-3">
          <div class="text-xs text-neutral-500">
            累计改规格 <span class="font-semibold text-gold-600 data-num">{{ order.specChangeHistory.length }}</span> 次,
            最近一次: <span class="data-num text-[11px]">{{ formatDateTime(order.specChangeHistory[order.specChangeHistory.length - 1].changedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 改规格对话框 -->
      <ElDialog v-model="changeSpecDialogVisible" title="客户改规格（明细级）" width="680px" destroy-on-close :close-on-click-modal="false">
        <div class="mb-4">
          <div class="text-xs font-semibold text-neutral-600 mb-2">包装规格要求</div>
          <ElInput v-model="changeSpecNote" type="textarea" :rows="2" placeholder="牛皮纸包装+绿色丝带+手写贺卡..." />
        </div>
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-neutral-700">
              花卉明细
              <span class="text-xs text-neutral-400 ml-2">
                预估金额: ¥{{ changeSpecItems.reduce((s, i) => s + i.quantity * 200, 0).toLocaleString() }}
              </span>
            </span>
            <ElButton size="small" type="primary" plain @click="addSpecItem">+ 添加品种</ElButton>
          </div>
          <div class="space-y-3">
            <div v-for="(item, idx) in changeSpecItems" :key="idx"
              class="p-3 rounded-lg bg-neutral-50 border border-neutral-200 relative">
              <ElButton v-if="changeSpecItems.length > 1"
                size="small" type="danger" plain circle
                class="!absolute !top-2 !right-2"
                @click="removeSpecItem(idx)">×</ElButton>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ElFormItem label="品种" label-width="50px" class="!mb-0">
                  <ElSelect v-model="item.flowerType" placeholder="品种" style="width:100%">
                    <ElOption v-for="f in flowerOptions" :key="f.type" :label="f.type" :value="f.type" />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="色系" label-width="50px" class="!mb-0">
                  <ElSelect v-model="item.color" placeholder="色系" style="width:100%">
                    <ElOption v-for="c in (flowerOptions.find(f => f.type === item.flowerType)?.colors || [])" :key="c" :label="c" :value="c" />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="棚区" label-width="50px" class="!mb-0">
                  <ElSelect v-model="item.shelterId" placeholder="棚区" style="width:100%">
                    <ElOption v-for="s in sheltersStore.shelters" :key="s.id" :label="`${s.name}(${s.flowerType})`" :value="s.id" />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="数量" label-width="50px" class="!mb-0">
                  <ElInput v-model.number="item.quantity" type="number" min="1" placeholder="扎" />
                </ElFormItem>
                <ElFormItem label="枝/扎" label-width="50px" class="!mb-0">
                  <ElInput v-model.number="item.stemsPerBunch" type="number" min="1" placeholder="每扎枝数" />
                </ElFormItem>
                <ElFormItem label="备注" label-width="50px" class="!mb-0">
                  <ElInput v-model="item.remark" placeholder="可选" />
                </ElFormItem>
              </div>
            </div>
          </div>
        </div>
        <div class="p-3 rounded-lg bg-gold-50 border border-gold-100 mb-4">
          <div class="text-xs text-gold-700">
            <div class="font-semibold mb-1">💡 修改说明</div>
            <div>• 品种、色系、数量、棚区任一变更都将更新订单明细和采切计划数量</div>
            <div>• 金额将自动重算: 单价 ¥200/扎 × 扎数</div>
            <div>• 保存后将生成完整的改规格历史记录,包含前后明细对比</div>
            <div>• 若订单处于卡住状态,修改后需确认订单后才会重建采切排期</div>
          </div>
        </div>
        <template #footer>
          <ElButton @click="changeSpecDialogVisible = false">取消</ElButton>
          <ElButton type="warning" @click="handleChangeSpec">确认修改</ElButton>
        </template>
      </ElDialog>

      <!-- 改规格历史 -->
      <div v-if="order.specChangeHistory && order.specChangeHistory.length > 0" class="workspace-card p-4">
        <div class="section-title text-sm"><History :size="16" class="text-gold-500" /> 改规格历史</div>
        <div class="space-y-3">
          <div v-for="sch in [...order.specChangeHistory].reverse()" :key="sch.id"
            class="p-3 rounded-lg bg-gold-50 border border-gold-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-gold-700">{{ sch.changedBy }}</span>
              <div class="flex items-center gap-2">
                <span v-if="sch.beforeAmount !== sch.afterAmount" class="text-[11px] px-1.5 py-0.5 rounded bg-gold-100 text-gold-700">
                  金额 ¥{{ sch.beforeAmount.toLocaleString() }} → ¥{{ sch.afterAmount.toLocaleString() }}
                </span>
                <span class="text-[11px] text-neutral-500 data-num">{{ formatDateTime(sch.changedAt) }}</span>
              </div>
            </div>

            <!-- 包装规格对比 -->
            <div v-if="sch.beforeSpecNote !== sch.afterSpecNote" class="text-xs space-y-1 mb-2">
              <div class="flex items-start gap-1.5">
                <span class="text-neutral-500 flex-shrink-0 w-14">包装:</span>
                <div class="flex-1 min-w-0">
                  <span class="text-neutral-600 line-through bg-alert-50 px-1 rounded text-[11px]">{{ sch.beforeSpecNote }}</span>
                  <span class="mx-1.5 text-neutral-400">→</span>
                  <span class="text-neutral-800 bg-success-50 px-1 rounded font-medium text-[11px]">{{ sch.afterSpecNote }}</span>
                </div>
              </div>
            </div>

            <!-- 花卉明细对比 -->
            <div class="mb-2">
              <div class="text-[11px] text-neutral-500 mb-1.5">花卉明细变更:</div>
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div class="p-2 rounded bg-alert-50 border border-alert-100">
                  <div class="text-[10px] text-alert-600 font-semibold mb-1">变更前</div>
                  <div v-for="(it, idx) in sch.beforeItems" :key="idx" class="flex items-center justify-between py-0.5 border-b border-alert-100 last:border-b-0">
                    <span class="text-neutral-700">{{ it.flowerType }} · {{ it.color }}</span>
                    <span class="data-num font-medium text-neutral-800">{{ it.quantity }}扎</span>
                  </div>
                </div>
                <div class="p-2 rounded bg-success-50 border border-success-100">
                  <div class="text-[10px] text-success-600 font-semibold mb-1">变更后</div>
                  <div v-for="(it, idx) in sch.afterItems" :key="idx" class="flex items-center justify-between py-0.5 border-b border-success-100 last:border-b-0">
                    <span class="text-neutral-700">{{ it.flowerType }} · {{ it.color }}</span>
                    <span class="data-num font-medium text-neutral-800">{{ it.quantity }}扎</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 采切计划对比 -->
            <div v-if="sch.beforeHarvestPlan && sch.afterHarvestPlan && (sch.beforeHarvestPlan.shelterId !== sch.afterHarvestPlan.shelterId || sch.beforeHarvestPlan.planQty !== sch.afterHarvestPlan.planQty)" class="text-xs">
              <div class="text-[11px] text-neutral-500 mb-1">采切计划同步更新:</div>
              <div class="flex flex-wrap gap-3 text-[11px]">
                <span class="px-2 py-0.5 rounded bg-gold-100 text-gold-700">
                  棚区: {{ sch.beforeHarvestPlan.shelterId }} → {{ sch.afterHarvestPlan.shelterId }}
                </span>
                <span class="px-2 py-0.5 rounded bg-gold-100 text-gold-700">
                  计划数量: {{ sch.beforeHarvestPlan.planQty }} → {{ sch.afterHarvestPlan.planQty }} 扎
                </span>
              </div>
            </div>
          </div>
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
