<script setup lang="ts">
import { useRouter } from 'vue-router'
import { FileText, Scissors, Package, ArrowRight, Users, Sparkles } from 'lucide-vue-next'
import { useOrdersStore } from '@/stores/orders'
import { useUiStore } from '@/stores/ui'
import type { RoleType } from '@/types'

const router = useRouter()
const ordersStore = useOrdersStore()
const uiStore = useUiStore()

const roleCards = [
  {
    key: 'SALES' as RoleType,
    name: '销售内勤',
    desc: '客户订单录入、确认、改规格处理',
    icon: FileText,
    gradient: 'from-gold-400 via-gold-500 to-gold-600',
    ring: 'hover:ring-gold-300',
    path: '/sales',
    todoCount: () => ordersStore.getSalesTodoCount(),
    online: 2,
    stats: [
      { label: '本月订单', value: '168', color: 'text-gold-600' },
      { label: '待确认', value: '0', color: 'text-gold-700' },
    ],
  },
  {
    key: 'GROWER' as RoleType,
    name: '种植员',
    desc: '棚区巡检、采切执行、花期异常上报',
    icon: Scissors,
    gradient: 'from-base-400 via-base-500 to-base-700',
    ring: 'hover:ring-base-300',
    path: '/grower',
    todoCount: () => ordersStore.getGrowerTodoCount(),
    online: 3,
    stats: [
      { label: '今日采切', value: '320', color: 'text-base-600', unit: '扎' },
      { label: '待采任务', value: ordersStore.orders.filter(o => o.status === 'HARVESTING').length.toString(), color: 'text-base-700', unit: '单' },
    ],
  },
  {
    key: 'PACKER' as RoleType,
    name: '包装主管',
    desc: '规格核对、包装作业、物流单生成',
    icon: Package,
    gradient: 'from-success-400 via-success-500 to-success-700',
    ring: 'hover:ring-success-300',
    path: '/packer',
    todoCount: () => ordersStore.getPackerTodoCount(),
    online: 1,
    stats: [
      { label: '今日包装', value: '186', color: 'text-success-600', unit: '扎' },
      { label: '待包装', value: ordersStore.orders.filter(o => o.status === 'PACKING').length.toString(), color: 'text-success-700', unit: '单' },
    ],
  },
]

function enterRole(card: typeof roleCards[0]) {
  uiStore.setRole(card.key)
  router.push(card.path)
}
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-gradient-to-br from-neutral-100 via-base-50/30 to-neutral-100">
    <!-- Hero 介绍区 -->
    <div class="max-w-7xl mx-auto mb-10">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs text-neutral-600 mb-4 shadow-sm">
            <Sparkles :size="13" class="text-gold-500" />
            <span>全链路业务协同工作台 · 减少翻群与口头沟通</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-neutral-800 mb-3 tracking-tight leading-tight">
            选择您的岗位入口
          </h1>
          <p class="text-[15px] text-neutral-600 max-w-2xl leading-relaxed">
            销售确认订单后，采切排期自动生成并推送给种植员；采切完成自动转入包装队列；
            异常卡住全岗可见，不再靠微信群口头提醒。
          </p>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold data-num text-base-700">{{ ordersStore.orders.length }}</div>
            <div class="text-xs text-neutral-500 mt-0.5">本月订单总数</div>
          </div>
          <div class="w-px h-12 bg-neutral-300" />
          <div class="text-center">
            <div class="text-3xl font-bold data-num text-success-700">{{ ordersStore.orders.filter(o => o.status === 'COMPLETED').length }}</div>
            <div class="text-xs text-neutral-500 mt-0.5">已顺利关闭</div>
          </div>
          <div class="w-px h-12 bg-neutral-300" />
          <div class="text-center">
            <div class="text-3xl font-bold data-num text-alert-600 animate-pulse-soft">{{ ordersStore.stuckCount }}</div>
            <div class="text-xs text-neutral-500 mt-0.5">当前卡住中</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色卡片 -->
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="card in roleCards" :key="card.key"
        @click="enterRole(card)"
        class="group workspace-card overflow-hidden cursor-pointer hover:-translate-y-1 ring-2 ring-transparent transition-all duration-300"
        :class="card.ring">
        <!-- 头部渐变色块 -->
        <div class="h-32 bg-gradient-to-br relative overflow-hidden" :class="card.gradient">
          <div class="absolute inset-0 opacity-20"
            style="background-image: radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%);" />
          <div class="relative h-full p-5 flex flex-col justify-between text-white">
            <div class="flex items-start justify-between">
              <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <component :is="card.icon" :size="24" />
              </div>
              <div class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-xs">
                <Users :size="11" />
                <span>{{ card.online }} 人在岗</span>
              </div>
            </div>
            <div>
              <div class="text-[22px] font-bold tracking-wide mb-0.5">{{ card.name }}</div>
              <div class="text-xs opacity-90">{{ card.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="p-5">
          <!-- 待办计数 -->
          <div class="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
            <div>
              <div class="text-xs text-neutral-500 mb-0.5">当前待办</div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-bold data-num" :class="card.todoCount() > 0 ? 'text-alert-600 animate-pulse-soft' : 'text-neutral-400'">{{ card.todoCount() }}</span>
                <span class="text-xs text-neutral-500">条</span>
              </div>
            </div>
            <div class="flex items-center gap-1 text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity"
              :class="card.todoCount() > 0 ? 'text-alert-600' : 'text-neutral-500'">
              {{ card.todoCount() > 0 ? '需优先处理' : '暂无积压' }}
            </div>
          </div>

          <!-- 数据指标 -->
          <div class="grid grid-cols-2 gap-3 mb-5">
            <div v-for="s in card.stats" :key="s.label"
              class="p-3 rounded-lg bg-neutral-50 border border-neutral-100 group-hover:border-neutral-200 transition-colors">
              <div class="text-xs text-neutral-500 mb-0.5">{{ s.label }}</div>
              <div class="flex items-baseline gap-0.5">
                <span class="text-xl font-bold data-num" :class="s.color">{{ s.value }}</span>
                <span v-if="(s as any).unit" class="text-[11px] text-neutral-500">{{ (s as any).unit }}</span>
              </div>
            </div>
          </div>

          <!-- 进入按钮 -->
          <button
            class="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
            :class="card.todoCount() > 0
              ? 'bg-alert-500 text-white hover:bg-alert-600 shadow-sm hover:shadow'
              : 'bg-base-500 text-white hover:bg-base-600 shadow-sm hover:shadow'">
            <span>{{ card.todoCount() > 0 ? '立即处理待办' : '进入工作台' }}</span>
            <ArrowRight :size="15" class="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- 底部说明 -->
    <div class="max-w-7xl mx-auto mt-10 p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-neutral-200">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-neutral-600">
        <div class="flex items-start gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-base-500 mt-1.5 flex-shrink-0" />
          <span><b class="text-neutral-700">自动衔接：</b>订单确认 → 采切排期 → 包装队列，无需发消息提醒</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-alert-500 mt-1.5 flex-shrink-0" />
          <span><b class="text-neutral-700">卡住可视化：</b>花期/包装/改规格异常，全岗红色高亮可见</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5 flex-shrink-0" />
          <span><b class="text-neutral-700">连续处理：</b>工作台密集卡片与快捷按钮，支持快速连续操作</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-success-500 mt-1.5 flex-shrink-0" />
          <span><b class="text-neutral-700">历史回看：</b>全流程日志时间线，卡住记录独立归档</span>
        </div>
      </div>
    </div>
  </div>
</template>
