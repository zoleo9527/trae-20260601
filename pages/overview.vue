<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800">项目总览</h2>
        <p class="text-sm text-neutral-500 mt-1">全项目电梯年检与整改闭环的综合视图</p>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <select class="input w-32">
          <option>全部项目</option>
          <option>高新区科技园</option>
          <option>CBD中心广场</option>
        </select>
        <select class="input w-28">
          <option>本月</option>
          <option>本季度</option>
          <option>本年度</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="k in kpis"
        :key="k.key"
        class="card p-5 relative overflow-hidden hover:shadow-card-hover transition-shadow"
      >
        <div
          class="absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-10"
          :class="k.dotClass"
        ></div>
        <div class="relative">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="k.iconBg">
              <AppIcon :name="k.icon" :class="['w-5 h-5', k.iconClass]" />
            </div>
            <span v-if="k.change" class="text-[11px] px-2 py-0.5 rounded-full font-medium" :class="k.changeClass">
              {{ k.change }}
            </span>
          </div>
          <div class="mt-4">
            <div class="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">{{ k.label }}</div>
            <div class="mt-1 flex items-baseline gap-1.5">
              <span class="text-3xl font-bold text-neutral-800">{{ k.value }}</span>
              <span v-if="k.unit" class="text-sm text-neutral-500">{{ k.unit }}</span>
            </div>
          </div>
          <div class="mt-3 h-1 rounded-full" :class="k.barBg">
            <div class="h-full rounded-full" :class="k.barColor" :style="{ width: k.barPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="card overflow-hidden">
          <div class="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-neutral-800">年检状态分布</h3>
            <div class="flex items-center gap-4 text-[11px]">
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-success-500"></span>合格/闭环</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-primary-500"></span>审核中</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-danger-500"></span>不合格</span>
            </div>
          </div>
          <div class="p-5">
            <div class="space-y-3.5">
              <div
                v-for="proj in projectStatus"
                :key="proj.name"
                class="p-4 rounded-xl bg-neutral-50 border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 transition-all cursor-pointer"
                @click="navigateTo('/inspection')"
              >
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <div class="text-sm font-semibold text-neutral-800">{{ proj.name }}</div>
                    <div class="text-[11px] text-neutral-500 mt-0.5">{{ proj.location }} · 共 {{ proj.total }} 台</div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs font-semibold text-neutral-800">{{ proj.done }}/{{ proj.total }} 已完成</div>
                    <div class="text-[11px] text-success-600">{{ proj.rate }}% 完成率</div>
                  </div>
                </div>
                <div class="flex h-3 rounded-full overflow-hidden bg-neutral-200">
                  <div class="bg-success-500 flex items-center justify-center" :style="{ width: proj.passPercent + '%' }">
                    <span v-if="proj.passPercent > 15" class="text-[9px] font-bold text-white px-1">{{ proj.passCount }}</span>
                  </div>
                  <div class="bg-primary-500 flex items-center justify-center" :style="{ width: proj.reviewPercent + '%' }">
                    <span v-if="proj.reviewPercent > 15" class="text-[9px] font-bold text-white px-1">{{ proj.reviewCount }}</span>
                  </div>
                  <div class="bg-danger-500 flex items-center justify-center" :style="{ width: proj.failPercent + '%' }">
                    <span v-if="proj.failPercent > 15" class="text-[9px] font-bold text-white px-1">{{ proj.failCount }}</span>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-between text-[11px]">
                  <div class="flex items-center gap-3">
                    <span class="flex items-center gap-1 text-success-600">
                      <AppIcon name="IconCheckCircle" class="w-3 h-3" />
                      合格 {{ proj.passCount }}
                    </span>
                    <span class="flex items-center gap-1 text-primary-600">
                      <AppIcon name="IconClock" class="w-3 h-3" />
                      审核中 {{ proj.reviewCount }}
                    </span>
                    <span class="flex items-center gap-1 text-danger-600">
                      <AppIcon name="IconXCircle" class="w-3 h-3" />
                      不合格 {{ proj.failCount }}
                    </span>
                  </div>
                  <span class="text-primary-600 hover:underline font-medium flex items-center gap-0.5">
                    查看详情 <AppIcon name="IconChevronRight" class="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-neutral-800">即将到期年检</h3>
              <span class="text-[11px] text-warning-600 font-medium flex items-center gap-1">
                <AppIcon name="IconAlertTriangle" class="w-3 h-3" />
                {{ upcomingInspections.length }} 台待安排
              </span>
            </div>
            <div class="space-y-2.5">
              <div
                v-for="u in upcomingInspections"
                :key="u.id"
                class="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
                :class="u.days <= 7 ? 'bg-danger-50 border-danger-200' : u.days <= 15 ? 'bg-warning-50 border-warning-200' : 'bg-neutral-50 border-neutral-200'"
                @click="navigateTo('/inspection/new')"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    :class="u.days <= 7 ? 'bg-danger-100' : u.days <= 15 ? 'bg-warning-100' : 'bg-neutral-100'"
                  >
                    <AppIcon
                      name="IconCalendar"
                      :class="['w-4 h-4', u.days <= 7 ? 'text-danger-600' : u.days <= 15 ? 'text-warning-600' : 'text-neutral-600']"
                    />
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-semibold text-neutral-800 truncate">{{ u.name }}</div>
                    <div class="text-[11px] text-neutral-500 truncate">{{ u.location }}</div>
                  </div>
                </div>
                <div class="text-right flex-shrink-0 ml-2">
                  <div
                    class="text-xs font-bold"
                    :class="u.days <= 7 ? 'text-danger-600' : u.days <= 15 ? 'text-warning-600' : 'text-neutral-700'"
                  >
                    {{ u.days }}天后
                  </div>
                  <div class="text-[10px] text-neutral-500">{{ u.date }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-neutral-800">整改任务进度看板</h3>
              <button
                type="button"
                class="text-[11px] text-primary-600 hover:underline font-medium"
                @click="navigateTo('/rectification')"
              >
                全部
              </button>
            </div>
            <div class="space-y-3">
              <div v-for="col in rectBoard" :key="col.key" class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" :class="col.dotClass"></div>
                    <span class="text-xs font-semibold text-neutral-700">{{ col.label }}</span>
                  </div>
                  <span class="text-[11px] font-bold" :class="col.textClass">{{ col.items.length }} 份</span>
                </div>
                <div class="space-y-1.5">
                  <div
                    v-for="r in col.items.slice(0, 3)"
                    :key="r.id"
                    class="text-[11px] p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer hover:shadow-sm transition-shadow"
                    :class="col.cardClass"
                    @click="goRect(r.id)"
                  >
                    <div class="min-w-0">
                      <div class="font-mono font-bold truncate">{{ r.id }}</div>
                      <div class="text-[10px] text-neutral-500 truncate mt-0.5">{{ r.elevator }}</div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <div v-if="r.daysLeft !== undefined" :class="r.daysLeft < 0 ? 'text-danger-600 font-bold' : 'text-neutral-500'">
                        {{ r.daysLeft < 0 ? `超期${-r.daysLeft}天` : `${r.daysLeft}天` }}
                      </div>
                      <div v-else class="text-success-600 font-medium">✓ 闭环</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-4">角色工作量统计</h3>
          <div class="space-y-4">
            <div v-for="u in userWorkload" :key="u.role" class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    :class="u.avatarBg"
                  >
                    {{ u.avatar }}
                  </div>
                  <div>
                    <div class="text-xs font-semibold text-neutral-800">{{ u.name }}</div>
                    <div class="text-[11px] text-neutral-500">{{ u.roleLabel }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-bold text-neutral-800">{{ u.count }}</div>
                  <div class="text-[10px] text-neutral-500">待办项</div>
                </div>
              </div>
              <div class="h-2 rounded-full bg-neutral-100 overflow-hidden flex">
                <div class="h-full bg-success-500" :style="{ width: u.donePercent + '%' }"></div>
                <div class="h-full bg-warning-500" :style="{ width: u.doingPercent + '%' }"></div>
                <div class="h-full bg-primary-500" :style="{ width: u.pendingPercent + '%' }"></div>
              </div>
              <div class="flex items-center justify-between text-[10px] text-neutral-500">
                <span>✓ 完成 {{ u.done }}</span>
                <span>● 进行中 {{ u.doing }}</span>
                <span>○ 待办 {{ u.pending }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-3">今日动态时间线</h3>
          <div class="relative">
            <div class="absolute left-3.5 top-1 bottom-1 w-px bg-neutral-200"></div>
            <div class="space-y-4">
              <div v-for="(t, i) in timeline" :key="i" class="relative pl-9">
                <div
                  class="absolute left-2 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                  :class="t.dotClass"
                ></div>
                <div class="text-[11px]">
                  <div class="flex items-center gap-1.5">
                    <span class="font-semibold text-neutral-800">{{ t.user }}</span>
                    <span class="text-neutral-400">{{ t.action }}</span>
                  </div>
                  <div class="text-neutral-600 mt-0.5">{{ t.detail }}</div>
                  <div class="text-neutral-400 mt-0.5">{{ t.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()

const kpis = [
  { key: 'elevator', label: '在管电梯', value: 48, unit: '台', icon: 'IconBox', iconClass: 'text-primary-600', iconBg: 'bg-primary-100', change: '+2台', changeClass: 'bg-success-100 text-success-700', dotClass: 'bg-primary-500', barBg: 'bg-primary-100', barColor: 'bg-primary-500', barPercent: 80 },
  { key: 'inspection', label: '本月年检', value: 12, unit: '台', icon: 'IconClipboardCheck', iconClass: 'text-success-600', iconBg: 'bg-success-100', change: '90%完成', changeClass: 'bg-primary-100 text-primary-700', dotClass: 'bg-success-500', barBg: 'bg-success-100', barColor: 'bg-success-500', barPercent: 90 },
  { key: 'rectification', label: '整改中', value: 3, unit: '份', icon: 'IconWrench', iconClass: 'text-warning-600', iconBg: 'bg-warning-100', change: '1待复查', changeClass: 'bg-warning-100 text-warning-700', dotClass: 'bg-warning-500', barBg: 'bg-warning-100', barColor: 'bg-gradient-to-r from-warning-400 to-warning-500', barPercent: 60 },
  { key: 'alert', label: '活跃告警', value: 2, unit: '条', icon: 'IconAlertTriangle', iconClass: 'text-danger-600', iconBg: 'bg-danger-100', change: '1超期', changeClass: 'bg-danger-100 text-danger-700', dotClass: 'bg-danger-500', barBg: 'bg-danger-100', barColor: 'bg-danger-500', barPercent: 25 }
]

const projectStatus = [
  { name: '高新区科技园A座', location: '1号楼+2号楼', total: 18, done: 16, rate: 89, passCount: 12, passPercent: 67, reviewCount: 2, reviewPercent: 11, failCount: 4, failPercent: 22 },
  { name: '高新区科技园B座', location: '3号楼+4号楼', total: 16, done: 14, rate: 88, passCount: 11, passPercent: 69, reviewCount: 2, reviewPercent: 12, failCount: 3, failPercent: 19 },
  { name: 'CBD中心广场', location: '北塔+南塔+裙楼', total: 14, done: 10, rate: 71, passCount: 9, passPercent: 64, reviewCount: 1, reviewPercent: 7, failCount: 4, failPercent: 29 }
]

const upcomingInspections = [
  { id: 'ELV-GX010', name: '3号楼-2号梯', location: '高新区B座', days: 3, date: '06-11' },
  { id: 'ELV-GX015', name: '4号楼-1号梯', location: '高新区B座', days: 5, date: '06-13' },
  { id: 'ELV-CBD03', name: 'CBD南塔-办公梯', location: 'CBD中心广场', days: 9, date: '06-17' },
  { id: 'ELV-GX018', name: '4号楼-3号梯', location: '高新区B座', days: 12, date: '06-20' },
  { id: 'ELV-CBD08', name: 'CBD裙楼-货梯2', location: 'CBD中心广场', days: 18, date: '06-26' }
]

const rectBoard = [
  { key: 'doing', label: '整改执行中', dotClass: 'bg-warning-500', textClass: 'text-warning-600', cardClass: 'bg-warning-50/70 border-warning-200', items: [
    { id: 'RECT-2026-0015', elevator: '1号楼A座-1号梯', daysLeft: 8 }
  ]},
  { key: 'recheck', label: '待复查', dotClass: 'bg-primary-500', textClass: 'text-primary-600', cardClass: 'bg-primary-50/70 border-primary-200', items: [
    { id: 'RECT-2026-0009', elevator: '2号楼B座-1号梯', daysLeft: 3 },
    { id: 'RECT-2026-0020', elevator: '3号楼-2号梯', daysLeft: -1 }
  ]},
  { key: 'closed', label: '本月已闭环', dotClass: 'bg-success-500', textClass: 'text-success-600', cardClass: 'bg-success-50/70 border-success-200', items: [
    { id: 'RECT-2026-0012', elevator: '1号楼A座-2号梯' },
    { id: 'RECT-2026-0010', elevator: 'CBD北塔-客梯A' },
    { id: 'RECT-2026-0007', elevator: '2号楼B座-2号梯' }
  ]}
]

const userWorkload = [
  { name: '张师傅', role: 'technician', roleLabel: '维保技师', avatar: '张', avatarBg: 'bg-warning-500', count: 5, done: 12, doing: 3, pending: 2, donePercent: 70, doingPercent: 18, pendingPercent: 12 },
  { name: '李客服', role: 'customer_service', roleLabel: '客服专员', avatar: '李', avatarBg: 'bg-primary-500', count: 3, done: 18, doing: 2, pending: 1, donePercent: 85, doingPercent: 10, pendingPercent: 5 },
  { name: '王主管', role: 'project_manager', roleLabel: '项目主管', avatar: '王', avatarBg: 'bg-success-600', count: 4, done: 8, doing: 3, pending: 1, donePercent: 65, doingPercent: 25, pendingPercent: 10 }
]

const timeline = [
  { user: '张师傅', action: '提交整改完成', detail: 'RECT-2026-0009 整改单自测通过', time: '14:32', dotClass: 'bg-warning-500' },
  { user: '李客服', action: '通知甲方', detail: '同步 INSP-2026-0015 不合格结论', time: '11:15', dotClass: 'bg-primary-500' },
  { user: '王主管', action: '审核通过', detail: 'INSP-2026-0012 年检记录审核', time: '10:08', dotClass: 'bg-success-500' },
  { user: '张师傅', action: '创建年检', detail: 'INSP-2026-0018 完成现场检测', time: '昨天 16:45', dotClass: 'bg-neutral-400' },
  { user: '系统', action: '自动提醒', detail: 'RECT-2026-0009 截止日期临近', time: '昨天 09:00', dotClass: 'bg-neutral-300' }
]

function goRect(id: string) {
  appStore.setSelectedRectification(id)
  navigateTo('/rectification')
}
</script>
