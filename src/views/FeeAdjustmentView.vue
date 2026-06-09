<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronUp, FileText, Camera, MessageSquare, DollarSign, Info, AlertTriangle, Clock, ArrowRight, Database, Warehouse, CreditCard, ScanLine, Bell } from 'lucide-vue-next'
import { useOrdersStore } from '@/stores/orders'
import { useRoleStore } from '@/stores/role'
import { FEE_STATUS_LABELS, STATUS_LABELS, ROLE_LABELS } from '@/types'
import EvidenceAggregation from '@/components/EvidenceAggregation.vue'

const ordersStore = useOrdersStore()
const roleStore = useRoleStore()

const expandedId = ref<string | null>(null)
const showIntegrations = ref(true)

const ordersWithFee = computed(() =>
  ordersStore.orders.filter((o) => o.feeAdjustment)
)

function toggle(orderId: string) {
  expandedId.value = expandedId.value === orderId ? null : orderId
}

const statusStyle: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const integrationPoints = [
  { name: 'ERP订单系统同步', desc: '自动拉取原订单信息', current: 'Mock数据模拟', file: 'src/mock/orders.ts', icon: Database },
  { name: '仓库WMS入库确认', desc: '实时同步仓库入库状态', current: '手动点击"确认入库"按钮', file: 'src/stores/orders.ts', icon: Warehouse },
  { name: '财务系统费用确认', desc: '费用调整后自动推送财务', current: '页面内展示调整结果，不推送', file: 'src/stores/orders.ts', icon: CreditCard },
  { name: '通讯截图OCR解析', desc: '自动提取聊天记录关键信息', current: 'Mock预填摘要文本', file: 'src/mock/feeAdjustments.ts', icon: ScanLine },
  { name: '消息通知推送', desc: '卡单预警推送到角色对应人', current: '页面内横幅预警展示', file: 'src/components/StuckAlert.vue', icon: Bell },
]

const mockDataLocations = [
  { path: 'src/mock/orders.ts', desc: '售后退换单数据（含退回原因、责任方、卡单标记、沟通记录）' },
  { path: 'src/mock/feeAdjustments.ts', desc: '费用调整数据（含调整金额、依据、关联单号）' },
  { path: 'src/mock/timeline.ts', desc: '单据生命周期时间线数据' },
  { path: 'src/mock/users.ts', desc: '角色与用户数据' },
]
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-[#1B4965]">费用调整回看</h1>
        <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span>当前角色：<span class="font-medium text-[#1B4965]">{{ roleStore.roleLabel }}</span></span>
          <span>·</span>
          <span>共 <span class="font-medium">{{ ordersWithFee.length }}</span> 条调整记录</span>
        </div>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E2E8F0] text-gray-600 hover:bg-gray-50 transition-colors"
        :class="{ 'bg-[#F7F9FC] border-[#1B4965]/20 text-[#1B4965]': showIntegrations }"
        @click="showIntegrations = !showIntegrations"
      >
        <Info :size="14" />
        {{ showIntegrations ? '收起说明' : '集成点 & 数据说明' }}
      </button>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="showIntegrations" class="mb-4 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div class="grid grid-cols-2 divide-x divide-[#E2E8F0]">
          <div>
            <div class="flex items-center gap-2 px-5 py-3 border-b border-[#E2E8F0] bg-[#F7F9FC]">
              <AlertTriangle :size="16" class="text-[#E8871E]" />
              <span class="text-sm font-semibold text-[#1B4965]">暂未实现的集成点</span>
            </div>
            <div class="divide-y divide-[#E2E8F0]">
              <div
                v-for="(item, i) in integrationPoints"
                :key="i"
                class="flex items-start gap-3 px-5 py-3"
              >
                <div class="shrink-0 w-7 h-7 rounded-lg bg-[#F7F9FC] flex items-center justify-center">
                  <component :is="item.icon" :size="14" class="text-[#1B4965]" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-[#1B4965]">{{ item.name }}</div>
                  <div class="text-xs text-gray-500 mt-0.5">{{ item.desc }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-[#E8871E] font-medium">{{ item.current }}</span>
                    <code class="bg-[#F7F9FC] px-1.5 py-0.5 rounded text-[10px] text-gray-400 font-mono">{{ item.file }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2 px-5 py-3 border-b border-[#E2E8F0] bg-[#F7F9FC]">
              <Database :size="16" class="text-[#1B4965]" />
              <span class="text-sm font-semibold text-[#1B4965]">模拟数据 & 角色入口</span>
            </div>
            <div class="px-5 py-3 space-y-3">
              <div>
                <div class="text-xs font-semibold text-gray-500 mb-1.5">Mock数据位置</div>
                <div class="space-y-1.5">
                  <div
                    v-for="loc in mockDataLocations"
                    :key="loc.path"
                    class="flex items-start gap-2"
                  >
                    <code class="shrink-0 bg-[#F7F9FC] px-1.5 py-0.5 rounded text-[10px] text-[#1B4965] font-mono">{{ loc.path }}</code>
                    <span class="text-xs text-gray-500">{{ loc.desc }}</span>
                  </div>
                </div>
              </div>
              <div class="border-t border-[#E2E8F0] pt-3">
                <div class="text-xs font-semibold text-gray-500 mb-1.5">角色入口</div>
                <div class="text-xs text-gray-600 space-y-1">
                  <div class="flex items-center gap-1.5">
                    <ArrowRight :size="10" class="text-[#1B4965]" />
                    <span>顶部导航栏角色切换器（下拉选择：销售内勤 / 仓库员 / 售后专员）</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <ArrowRight :size="10" class="text-[#1B4965]" />
                    <span>切换角色后自动过滤待办列表、刷新看板统计</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <ArrowRight :size="10" class="text-[#1B4965]" />
                    <span>Dashboard「我的待办」区域按角色显示具体操作项</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="flex-1 overflow-y-auto space-y-3 pr-1">
      <div
        v-for="order in ordersWithFee"
        :key="order.id"
        class="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden transition-shadow hover:shadow-sm"
        :class="{ 'border-l-4 border-l-red-500': order.isStuck }"
      >
        <button
          class="w-full flex items-center gap-4 px-5 py-4 text-left"
          @click="toggle(order.id)"
        >
          <DollarSign :size="18" class="text-[#E8871E] shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-[#1B4965]">{{ order.orderNo }}</span>
              <span
                v-if="order.isStuck"
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse"
              >
                <AlertTriangle :size="10" />
                卡单
              </span>
              <span class="text-gray-400 text-xs">|</span>
              <span class="text-sm text-gray-600">{{ order.customerName }}</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              调整金额：<span class="font-semibold text-[#E8871E]">¥{{ order.feeAdjustment!.adjustAmount.toFixed(2) }}</span>
              · 责任方：{{ order.responsibleParty }}
              · 退回原因：{{ order.returnReason }}
              · 原单状态：{{ STATUS_LABELS[order.status] }}
            </div>
          </div>
          <span
            class="px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="statusStyle[order.feeAdjustment!.status]"
          >
            {{ FEE_STATUS_LABELS[order.feeAdjustment!.status] }}
          </span>
          <component
            :is="expandedId === order.id ? ChevronUp : ChevronDown"
            :size="16"
            class="text-gray-400"
          />
        </button>

        <div
          v-if="expandedId === order.id"
          class="border-t border-[#E2E8F0] px-5 py-4 bg-[#F7F9FC]"
        >
          <div v-if="order.isStuck && order.stuckReason" class="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2 border border-red-200 mb-4">
            <Clock :size="14" class="text-red-500 shrink-0 mt-0.5" />
            <div>
              <span class="text-xs text-red-600 font-medium">{{ order.stuckReason }}</span>
              <span v-if="order.stuckStep" class="text-xs text-[#E8871E] ml-2">阻塞步骤：{{ order.stuckStep }}（{{ ROLE_LABELS[order.assignedRole] }}）</span>
            </div>
          </div>

          <div class="mb-4">
            <div class="text-sm font-medium text-[#1B4965] mb-2">调整原因</div>
            <p class="text-sm text-gray-700">{{ order.feeAdjustment!.adjustReason }}</p>
          </div>
          <div class="mb-4" v-if="order.remarks.length">
            <div class="text-sm font-medium text-[#1B4965] mb-2">补充备注（{{ order.remarks.length }}）</div>
            <div class="space-y-1.5">
              <div
                v-for="r in order.remarks"
                :key="r.id"
                class="flex items-start gap-2 bg-white rounded-lg px-3 py-2"
              >
                <span
                  class="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                  :class="{
                    'bg-blue-400': r.role === 'sales_clerk',
                    'bg-green-400': r.role === 'warehouse',
                    'bg-orange-400': r.role === 'after_sales',
                  }"
                />
                <div class="min-w-0">
                  <span class="text-xs font-medium text-[#1B4965]">{{ r.author }}</span>
                  <span class="text-xs text-gray-400 ml-1">{{ ROLE_LABELS[r.role] }}</span>
                  <span class="text-xs text-gray-300 ml-1">{{ r.createdAt }}</span>
                  <p class="text-xs text-gray-600 mt-0.5">{{ r.content }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="text-sm font-medium text-[#1B4965] mb-2">依据聚合（无需跳转其他页面）</div>
          <EvidenceAggregation :order="order" />
        </div>
      </div>

      <div
        v-if="ordersWithFee.length === 0"
        class="flex items-center justify-center py-16 text-gray-400 text-sm"
      >
        暂无费用调整记录
      </div>
    </div>
  </div>
</template>
