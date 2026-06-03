<script setup lang="ts">
import { ref } from 'vue'
import { Info, Users, UtensilsCrossed, ChefHat, Bell, Upload, Shield, Clock, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const activeTab = ref('responsibility')

const tabs = [
  { key: 'responsibility', label: '角色责任', icon: Users },
  { key: 'workflow', label: '业务流程', icon: ArrowRight },
  { key: 'boundary', label: '实现边界', icon: AlertTriangle },
]

const roleCards = [
  {
    role: 'sales' as const,
    icon: Users,
    name: '宴会销售',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    responsibilities: [
      '创建活动订单，录入客户信息与活动明细',
      '活动结束后发起尾款核对',
      '核对销售相关的款项分项',
      '填写客户整体评价（销售视角）',
      '可查看所有历史反馈记录',
    ],
  },
  {
    role: 'hall' as const,
    icon: UtensilsCrossed,
    name: '厅面主管',
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    responsibilities: [
      '确认现场执行相关的款项分项',
      '核对场地布置、服务人员等费用',
      '填写客户服务评价（厅面视角）',
      '接收待办提醒并在时效内处理',
      '可查看自己负责的事项状态',
    ],
  },
  {
    role: 'kitchen' as const,
    icon: ChefHat,
    name: '后厨统筹',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    responsibilities: [
      '确认菜单出品相关的款项分项',
      '核对菜品、酒水、食材等费用',
      '填写客户出品评价（后厨视角）',
      '接收待办提醒并在时效内处理',
      '可查看自己负责的事项状态',
    ],
  },
]

const workflowSteps = [
  {
    step: 1,
    title: '创建活动',
    description: '宴会销售录入活动信息（客户、日期、场地、桌数、金额等）',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    step: 2,
    title: '发起尾款核对',
    description: '活动结束后，宴会销售发起尾款核对，系统自动生成分项核对单',
    icon: CheckCircle2,
    color: 'bg-amber-500',
  },
  {
    step: 3,
    title: '三方分项确认',
    description: '销售、厅面、后厨三方分别对每一项进行确认，可标记差异并说明原因',
    icon: Users,
    color: 'bg-purple-500',
  },
  {
    step: 4,
    title: '自动激活反馈',
    description: '当所有核对项均被三方确认后，系统自动创建客户反馈任务，无需人工发起',
    icon: Bell,
    color: 'bg-emerald-500',
  },
  {
    step: 5,
    title: '反馈收集（48小时时效）',
    description: '三方在尾款核对完成后48小时内，分别从各自视角填写客户反馈',
    icon: Clock,
    color: 'bg-red-500',
  },
  {
    step: 6,
    title: '归档完成',
    description: '所有反馈提交完成后，活动状态更新为已完成，可在历史记录中回看',
    icon: CheckCircle2,
    color: 'bg-slate-500',
  },
]

const boundaryItems = [
  {
    category: '账号体系',
    icon: Shield,
    status: '轻量实现',
    color: 'bg-amber-500',
    current: '当前仅通过选择角色+输入姓名的方式标识身份，支持快速切换角色以模拟不同视角。',
    limitation: '无真实账号认证、无密码体系、无细粒度权限控制，同一浏览器可切换至任意角色。',
  },
  {
    category: '第三方通知',
    icon: Bell,
    status: '轻量实现',
    color: 'bg-amber-500',
    current: '当前仅在页面内通过状态标签、倒计时和待办列表进行提醒。',
    limitation: '未接入短信、邮件、企业微信、钉钉等第三方通知渠道，需依赖用户主动登录查看。',
  },
  {
    category: '附件上传',
    icon: Upload,
    status: '未实现',
    color: 'bg-red-500',
    current: '当前差异说明和反馈内容仅支持纯文字描述。',
    limitation: '不支持上传照片、截图、文档等附件，如有需要可在文字描述中注明附件位置。',
  },
]
</script>

<template>
  <div>
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-slate-800 mb-1">系统说明</h2>
      <p class="text-slate-500">角色分工、业务流程与实现边界，所有内容可回看，避免口头补充</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
      <div class="p-4 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            :class="activeTab === tab.key
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="p-6">
        <div v-if="activeTab === 'responsibility'">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              v-for="card in roleCards"
              :key="card.role"
              class="rounded-2xl border-2 overflow-hidden"
              :class="[card.borderColor, card.bgColor]"
            >
              <div class="p-6">
                <div class="flex items-center gap-4 mb-4">
                  <div
                    class="w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center"
                    :class="card.color"
                  >
                    <component :is="card.icon" class="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-slate-800">{{ card.name }}</h3>
                    <p class="text-sm" :class="card.textColor">{{ userStore.roleLabels[card.role] }}</p>
                  </div>
                </div>
                <ul class="space-y-3">
                  <li
                    v-for="(item, index) in card.responsibilities"
                    :key="index"
                    class="flex items-start gap-2"
                  >
                    <CheckCircle2 class="w-4 h-4 mt-0.5 flex-shrink-0" :class="card.textColor" />
                    <span class="text-slate-700 text-sm">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h4 class="text-slate-800 font-semibold mb-4 flex items-center gap-2">
              <Info class="w-5 h-5 text-slate-500" />
              说明
            </h4>
            <p class="text-slate-600 text-sm leading-relaxed">
              系统采用"角色+姓名"的轻量身份标识。交班时点击左下角"切换身份"即可快速切换角色，
              无需重新登录。姓名会记录在每一项操作的时间线中，作为责任追溯依据。
            </p>
          </div>
        </div>

        <div v-else-if="activeTab === 'workflow'">
          <div class="relative">
            <div class="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 hidden md:block"></div>

            <div class="space-y-6">
              <div
                v-for="(step, index) in workflowSteps"
                :key="step.step"
                class="relative flex gap-6"
              >
                <div
                  class="relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="step.color"
                >
                  <component :is="step.icon" class="w-6 h-6 text-white" />
                </div>

                <div class="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold">
                      Step {{ step.step }}
                    </span>
                    <h4 class="text-lg font-semibold text-slate-800">{{ step.title }}</h4>
                  </div>
                  <p class="text-slate-600 text-sm">{{ step.description }}</p>

                  <div
                    v-if="step.step === 4"
                    class="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                  >
                    <p class="text-emerald-800 text-sm font-medium">
                      关键点：此步骤由系统自动触发，无需人工操作
                    </p>
                    <p class="text-emerald-700 text-xs mt-1">
                      判断条件：所有核对项均被三方确认（status = confirmed 或 difference_confirmed）
                    </p>
                  </div>

                  <div
                    v-if="step.step === 5"
                    class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <p class="text-amber-800 text-sm font-medium">
                      时效要求：尾款核对完成后 <strong>48小时</strong> 内必须完成
                    </p>
                    <p class="text-amber-700 text-xs mt-1">
                      不足12小时标黄警告，超时标红，所有时效在交班视图中可查看
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'boundary'">
          <div class="space-y-6">
            <div
              v-for="item in boundaryItems"
              :key="item.category"
              class="bg-slate-50 rounded-2xl p-6 border border-slate-200"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="item.color">
                  <component :is="item.icon" class="w-6 h-6 text-white" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-3">
                    <h4 class="text-lg font-semibold text-slate-800">{{ item.category }}</h4>
                    <span
                      class="px-3 py-1 rounded-full text-xs font-medium"
                      :class="item.status === '轻量实现' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'"
                    >
                      {{ item.status }}
                    </span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p class="text-slate-500 text-xs font-medium mb-1.5 uppercase tracking-wider">当前实现</p>
                      <p class="text-slate-700 text-sm leading-relaxed">{{ item.current }}</p>
                    </div>
                    <div>
                      <p class="text-slate-500 text-xs font-medium mb-1.5 uppercase tracking-wider">功能边界</p>
                      <p class="text-slate-700 text-sm leading-relaxed">{{ item.limitation }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h4 class="text-blue-800 font-semibold mb-3 flex items-center gap-2">
              <Info class="w-5 h-5" />
              关于轻量化说明
            </h4>
            <p class="text-blue-700 text-sm leading-relaxed">
              本系统聚焦于尾款核对与客户反馈的责任划分和时效管理核心流程。
              第三方通知、附件上传和账号体系等周边功能采用轻量实现以降低复杂度。
              如需接入真实通知渠道、文件存储或企业账号集成，请在后续迭代中扩展。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
