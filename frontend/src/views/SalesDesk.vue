<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText, Search, Plus, Filter, Eye, CheckCircle, Edit3, AlertTriangle, TrendingUp } from 'lucide-vue-next'
import { ElTable, ElTableColumn, ElButton, ElInput, ElTag, ElMessage, ElMessageBox, ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElDatePicker } from 'element-plus'
import { useOrdersStore } from '@/stores/orders'
import { useUiStore } from '@/stores/ui'
import { useSheltersStore } from '@/stores/shelters'
import StatusTag from '@/components/common/StatusTag.vue'
import OrderDetailDrawer from '@/components/sales/OrderDetailDrawer.vue'
import { formatDateTime, cn, calcOrderAmount } from '@/utils'
import type { OrderStatus, OrderItem } from '@/types'

const ordersStore = useOrdersStore()
const uiStore = useUiStore()
const sheltersStore = useSheltersStore()

const searchText = ref('')
const activeTab = ref<string>('ALL')

const changeSpecDialogVisible = ref(false)
const changeSpecOrderId = ref<string | null>(null)
const changeSpecNote = ref('')
const changeSpecItems = ref<Array<{ flowerType: string; color: string; quantity: number; stemsPerBunch: number; shelterId: string; remark: string }>>([])

const statusTabs: { key: string; label: string; status?: OrderStatus[] }[] = [
  { key: 'ALL', label: '全部订单' },
  { key: 'TODO', label: '我的待办', status: ['PENDING_CONFIRM', 'STUCK'] },
  { key: 'PROCESSING', label: '进行中', status: ['CONFIRMED', 'HARVESTING', 'PACKING'] },
  { key: 'DONE', label: '已完成', status: ['COMPLETED'] },
  { key: 'STUCK', label: '卡住异常', status: ['STUCK'] },
]

const displayedOrders = computed(() => {
  let list = ordersStore.orders
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.phone.includes(q),
    )
  }
  const tab = statusTabs.find((t) => t.key === activeTab.value)
  if (tab?.status) {
    list = list.filter((o) => tab.status!.includes(o.status))
  }
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

const tabCount = (status?: OrderStatus[]) => {
  if (!status) return ordersStore.orders.length
  return ordersStore.orders.filter((o) => status.includes(o.status)).length
}

function rowClassName({ row }: any) {
  if (row.status === 'STUCK') return 'danger-row'
  if (row.status === 'PENDING_CONFIRM') return 'warning-row'
  return ''
}

function openDetail(orderId: string) {
  uiStore.openOrderDrawer(orderId)
}

function handleConfirm(row: any) {
  ordersStore.confirmOrder(row.id)
  ElMessage.success(`已确认订单 ${row.id},采切排期自动推送至种植员工作台`)
}

function handleChangeSpec(row: any) {
  const order = ordersStore.getOrderById(row.id)
  if (!order) return
  changeSpecOrderId.value = order.id
  changeSpecNote.value = order.specNote || ''
  changeSpecItems.value = order.items.map((it) => ({
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

function submitChangeSpec() {
  if (!changeSpecOrderId.value) return
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
    changeSpecOrderId.value,
    { specNote: changeSpecNote.value.trim(), items },
    '销售-小林',
  )

  if (record) {
    changeSpecDialogVisible.value = false
    changeSpecOrderId.value = null
    const itemCount = changeSpecItems.value.reduce((s, i) => s + i.quantity, 0)
    ElMessage.success(`规格已更新,共${changeSpecItems.value.length}个品种,${itemCount}扎,已记录改规格历史`)
  } else {
    ElMessage.info('规格未变更,无需保存')
  }
}

function handleMarkStuck(row: any) {
  ElMessageBox.prompt(`标记订单 ${row.id} 为异常卡住,请输入原因:`, '标记卡住', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputValue: '',
    inputPlaceholder: '例如: 客户临时改规格,待确认...',
  })
    .then(({ value }) => {
      if (value && value.trim()) {
        ordersStore.reportStuck(row.id, {
          stuckType: 'CUSTOMER_CHANGE',
          reason: value.trim(),
          previousStatus: row.status,
        })
        ElMessage.warning('已标记为卡住,全岗可见')
      }
    })
    .catch(() => {})
}

const createDialogVisible = ref(false)
const newOrder = ref({
  customerName: '',
  phone: '',
  deliveryDate: '',
  address: '',
  specNote: '',
  flowerType: '玫瑰',
  color: '红色系',
  quantity: 20,
  stemsPerBunch: 20,
  shelterId: 'SH-A01',
})
const newOrderItems = ref<Array<{
  flowerType: string; color: string; quantity: number; stemsPerBunch: number; shelterId: string; remark: string;
}>>([
  { flowerType: '玫瑰', color: '红色系', quantity: 20, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' },
])

const flowerOptions = [
  { type: '玫瑰', colors: ['红色系', '粉色系', '白色系'] },
  { type: '洋牡丹', colors: ['橙色系', '粉色系'] },
  { type: '绣球', colors: ['蓝色系', '粉色系'] },
  { type: '满天星', colors: ['白色系'] },
]

const colorOptions = computed(() => {
  const found = flowerOptions.find(f => f.type === newOrderItems.value[0]?.flowerType)
  return found ? found.colors : ['红色系']
})

function addOrderItem() {
  newOrderItems.value.push({ flowerType: '玫瑰', color: '红色系', quantity: 10, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' })
}

function removeOrderItem(idx: number) {
  if (newOrderItems.value.length <= 1) return
  newOrderItems.value.splice(idx, 1)
}

function openCreateDialog() {
  newOrder.value = { customerName: '', phone: '', deliveryDate: '', address: '', specNote: '', flowerType: '玫瑰', color: '红色系', quantity: 20, stemsPerBunch: 20, shelterId: 'SH-A01' }
  newOrderItems.value = [{ flowerType: '玫瑰', color: '红色系', quantity: 20, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' }]
  createDialogVisible.value = true
}

function submitCreateOrder() {
  const d = newOrder.value
  if (!d.customerName.trim()) { ElMessage.warning('请填写客户名称'); return }
  if (!d.phone.trim()) { ElMessage.warning('请填写联系电话'); return }
  if (!d.deliveryDate) { ElMessage.warning('请选择配送日期'); return }
  if (!d.address.trim()) { ElMessage.warning('请填写配送地址'); return }

  const items = newOrderItems.value.map((it, idx) => ({
    flowerType: it.flowerType,
    color: it.color,
    quantity: it.quantity,
    stemsPerBunch: it.stemsPerBunch,
    shelterId: it.shelterId,
    remark: it.remark,
  }))

  const order = ordersStore.addOrder({
    customerName: d.customerName.trim(),
    phone: d.phone.trim(),
    deliveryDate: d.deliveryDate,
    address: d.address.trim(),
    specNote: d.specNote.trim() || '标准包装',
    items,
  })

  createDialogVisible.value = false
  ElMessage.success(`订单 ${order.id} 已创建,等待确认`)
  uiStore.openOrderDrawer(order.id)
}
</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto">
    <!-- 顶部统计卡 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">本月订单数</span>
          <div class="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center text-gold-500"><FileText :size="16" /></div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold data-num text-gold-600">{{ ordersStore.orders.length }}</span>
          <span class="text-xs text-success-600 flex items-center gap-0.5"><TrendingUp :size="11" /> +12%</span>
        </div>
      </div>
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">已完成关闭</span>
          <div class="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center text-success-500"><CheckCircle :size="16" /></div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold data-num text-success-600">{{ ordersStore.orders.filter(o => o.status === 'COMPLETED').length }}</span>
          <span class="text-xs text-neutral-500">单</span>
        </div>
      </div>
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">进行中</span>
          <div class="w-8 h-8 rounded-lg bg-base-50 flex items-center justify-center text-base-500"><Eye :size="16" /></div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold data-num text-base-700">{{ ordersStore.orders.filter(o => ['CONFIRMED', 'HARVESTING', 'PACKING'].includes(o.status)).length }}</span>
          <span class="text-xs text-neutral-500">单</span>
        </div>
      </div>
      <div class="workspace-card p-4 border-alert-200" :class="ordersStore.stuckCount > 0 ? 'stuck-card' : ''">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">卡住待处理</span>
          <div class="w-8 h-8 rounded-lg bg-alert-50 flex items-center justify-center text-alert-500"><AlertTriangle :size="16" /></div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold data-num text-alert-600">{{ ordersStore.stuckCount }}</span>
          <span class="text-xs text-alert-600">需处理</span>
        </div>
      </div>
    </div>

    <!-- 搜索+Tab -->
    <div class="workspace-card p-4 mb-5">
      <div class="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <div class="relative flex-1 max-w-md">
          <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <ElInput v-model="searchText" placeholder="搜索订单号/客户名/手机号..." clearable class="pl-7" />
        </div>
        <div class="flex gap-2 ml-auto">
          <ElButton :icon="Filter" size="small">高级筛选</ElButton>
          <ElButton type="primary" :icon="Plus" size="small" @click="openCreateDialog">新建订单</ElButton>
        </div>
      </div>
      <div class="flex flex-wrap gap-1 border-b border-neutral-200 pb-0">
        <button v-for="tab in statusTabs" :key="tab.key"
          @click="activeTab = tab.key"
          class="px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-all"
          :class="activeTab === tab.key
            ? 'border-base-500 text-base-700'
            : 'border-transparent text-neutral-500 hover:text-neutral-700'">
          {{ tab.label }}
          <span class="ml-1.5 data-num text-[11px] px-1.5 py-0.5 rounded-full"
            :class="activeTab === tab.key ? 'bg-base-50 text-base-600' : 'bg-neutral-100 text-neutral-500'">
            {{ tabCount(tab.status) }}
          </span>
        </button>
      </div>
    </div>

    <!-- 订单流水表 -->
    <div class="workspace-card overflow-hidden">
      <ElTable :data="displayedOrders"
        stripe
        :row-class-name="rowClassName"
        style="width: 100%"
        empty-text="暂无订单数据"
        @row-click="(row) => openDetail(row.id)">
        <ElTableColumn prop="id" label="订单号" width="150">
          <template #default="{ row }">
            <span class="font-mono font-semibold text-sm text-neutral-800 data-num cursor-pointer hover:text-base-600">{{ row.id }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="customerName" label="客户" width="150">
          <template #default="{ row }">
            <div>
              <div class="text-sm font-medium text-neutral-800">{{ row.customerName }}</div>
              <div class="text-[11px] text-neutral-500">{{ row.phone }}</div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="花卉品种" min-width="180">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <ElTag v-for="it in row.items" :key="it.id" size="small" effect="plain" type="success" round>
                {{ it.flowerType }}{{ it.color }} ×{{ it.quantity }}扎
              </ElTag>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="deliveryDate" label="配送日期" width="120">
          <template #default="{ row }">
            <span class="data-num text-sm text-neutral-700">{{ row.deliveryDate }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="totalAmount" label="金额" width="110" align="right">
          <template #default="{ row }">
            <span class="data-num font-semibold text-base-700">¥{{ row.totalAmount.toLocaleString() }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <StatusTag type="order" :value="row.status" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="150">
          <template #default="{ row }">
            <span class="data-num text-xs text-neutral-500">{{ formatDateTime(row.updatedAt) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="260" fixed="right" align="right" @click.stop>
          <template #default="{ row }">
            <div class="flex items-center gap-1 justify-end flex-wrap">
              <ElButton link size="small" type="primary" @click.stop="openDetail(row.id)">详情</ElButton>
              <ElButton v-if="row.status === 'PENDING_CONFIRM'" link size="small" type="success" @click.stop="handleConfirm(row)">确认</ElButton>
              <ElButton v-if="row.status !== 'COMPLETED' && row.status !== 'STUCK'" link size="small" type="warning" @click.stop="handleChangeSpec(row)">改规格</ElButton>
              <ElButton v-if="row.status !== 'COMPLETED' && row.status !== 'STUCK'" link size="small" type="danger" @click.stop="handleMarkStuck(row)">标异常</ElButton>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
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
              预估金额: ¥{{ calcOrderAmount(changeSpecItems).toLocaleString() }}
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
            <div>• 金额按品种单价自动重算: 玫瑰¥220/扎、洋牡丹¥280/扎、绣球¥350/扎、满天星¥180/扎</div>
            <div>• 保存后将生成完整的改规格历史记录,包含前后明细对比</div>
            <div>• 若订单处于卡住状态,修改后需确认订单后才会重建采切排期</div>
          </div>
      </div>
      <template #footer>
        <ElButton @click="changeSpecDialogVisible = false">取消</ElButton>
        <ElButton type="warning" @click="submitChangeSpec">确认修改</ElButton>
      </template>
    </ElDialog>

    <!-- 新建订单对话框 -->
    <ElDialog v-model="createDialogVisible" title="新建客户订单" width="680px" destroy-on-close :close-on-click-modal="false">
      <ElForm label-width="90px" label-position="right">
        <ElFormItem label="客户名称" required>
          <ElInput v-model="newOrder.customerName" placeholder="花店/公司/个人" />
        </ElFormItem>
        <ElFormItem label="联系电话" required>
          <ElInput v-model="newOrder.phone" placeholder="138****XXXX" />
        </ElFormItem>
        <ElFormItem label="配送日期" required>
          <ElDatePicker v-model="newOrder.deliveryDate" type="date" placeholder="选择配送日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="配送地址" required>
          <ElInput v-model="newOrder.address" placeholder="详细配送地址" />
        </ElFormItem>
        <ElFormItem label="包装要求">
          <ElInput v-model="newOrder.specNote" type="textarea" :rows="2" placeholder="牛皮纸包装+绿色丝带..." />
        </ElFormItem>

        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-neutral-700">
              花卉明细
              <span class="text-xs text-neutral-400 ml-2">
                预估金额: ¥{{ calcOrderAmount(newOrderItems).toLocaleString() }}
              </span>
            </span>
            <ElButton size="small" type="primary" plain @click="addOrderItem">+ 添加品种</ElButton>
          </div>
          <div class="space-y-3">
            <div v-for="(item, idx) in newOrderItems" :key="idx"
              class="p-3 rounded-lg bg-neutral-50 border border-neutral-200 relative">
              <ElButton v-if="newOrderItems.length > 1"
                size="small" type="danger" plain circle
                class="!absolute !top-2 !right-2"
                @click="removeOrderItem(idx)">×</ElButton>
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
      </ElForm>
      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitCreateOrder">创建订单</ElButton>
      </template>
    </ElDialog>

    <!-- 订单详情抽屉 -->
    <OrderDetailDrawer v-model="uiStore.drawerVisible" :order-id="uiStore.selectedOrderId" />
  </div>
</template>
