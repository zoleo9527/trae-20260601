<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFeedback } from '~/composables/useFeedback'

const { schedules, feedbacks, selectFeedback, openTransferModal, createFeedback, getRelatedFeedbackBySchedule, getFeedbackSummary } = useFeedback()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const searchQuery = ref('')
const showDetailSidebar = ref(false)
const selectedSchedule = ref<any>(null)

const now = new Date()
const dates = computed(() => {
  const result = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(now.getDate() + i)
    result.push({
      value: date.toISOString().split('T')[0],
      label: `${date.getMonth() + 1}月${date.getDate()}日`,
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
    })
  }
  return result
})

const filteredSchedules = computed(() => {
  let result = schedules.value.filter(s => s.date === selectedDate.value)
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      s.title.toLowerCase().includes(query) || 
      s.guideName.toLowerCase().includes(query) ||
      s.location.toLowerCase().includes(query)
    )
  }
  
  return result.sort((a, b) => a.startTime.localeCompare(b.startTime))
})

const conflictSchedules = computed(() => 
  schedules.value.filter(s => s.conflictInfo || s.status === 'conflict')
)

const getScheduleFeedback = (scheduleId: string) => {
  return getRelatedFeedbackBySchedule(scheduleId)
}

const openScheduleDetail = (item: any) => {
  selectedSchedule.value = item
  showDetailSidebar.value = true
}

const closeScheduleDetail = () => {
  showDetailSidebar.value = false
  selectedSchedule.value = null
}

const viewRelatedFeedback = (scheduleId: string) => {
  const fb = getScheduleFeedback(scheduleId)
  if (fb) {
    closeScheduleDetail()
    selectFeedback(fb)
  }
}

const createFeedbackForSchedule = (item: any) => {
  const newFeedback = createFeedback({
    title: `${item.title} - 讲解冲突反馈`,
    content: `讲解预约"${item.title}"（${item.date} ${item.startTime}-${item.endTime}，${item.location}）存在时间冲突：${item.conflictInfo || '请核实'}，请尽快调整。`,
    type: 'complaint',
    priority: 'high',
    relatedScheduleId: item.id
  })
  selectFeedback(newFeedback)
  openTransferModal(newFeedback.id)
}

const statusLabels: Record<string, string> = {
  available: '可预约',
  full: '已满',
  cancelled: '已取消',
  conflict: '时间冲突'
}

const statusColors: Record<string, string> = {
  available: 'badge-success',
  full: 'badge-warning',
  cancelled: 'badge-gray',
  conflict: 'badge-danger'
}

const todaySchedules = computed(() => schedules.value.filter(s => s.date === selectedDate.value).length)
const totalVisitors = computed(() => schedules.value.filter(s => s.date === selectedDate.value).reduce((sum, s) => sum + s.currentVisitors, 0))
const availableCount = computed(() => schedules.value.filter(s => s.date === selectedDate.value && s.status === 'available').length)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">讲解预约</h1>
      <button class="btn btn-primary">
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          新增场次
        </span>
      </button>
    </div>

    <div v-if="conflictSchedules.length > 0" class="card p-5 border-l-4 border-l-orange-500">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-orange-700 mb-2">注意！以下场次存在时间冲突</h3>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="item in conflictSchedules"
              :key="item.id"
              @click="openScheduleDetail(item)"
              class="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-orange-900">{{ item.title }}</span>
                <span class="text-xs text-orange-600">{{ item.date }} {{ item.startTime }}</span>
              </div>
              <p v-if="item.conflictInfo" class="text-xs text-orange-600 mt-1 line-clamp-1">{{ item.conflictInfo }}</p>
              <div class="flex items-center gap-2 mt-2">
                <button
                  v-if="getScheduleFeedback(item.id)"
                  @click.stop="viewRelatedFeedback(item.id)"
                  class="text-xs text-primary-600 hover:text-primary-700 underline"
                >
                  查看关联反馈 →
                </button>
                <button
                  v-else
                  @click.stop="createFeedbackForSchedule(item)"
                  class="text-xs text-primary-600 hover:text-primary-700"
                >
                  + 创建反馈
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-6">
      <div class="card p-5">
        <p class="text-sm text-gray-500 mb-1">今日场次</p>
        <p class="text-2xl font-bold text-gray-900">{{ todaySchedules }}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-gray-500 mb-1">预约人数</p>
        <p class="text-2xl font-bold text-blue-600">{{ totalVisitors }}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-gray-500 mb-1">可预约场次</p>
        <p class="text-2xl font-bold text-green-600">{{ availableCount }}</p>
      </div>
      <div class="card p-5" :class="{ 'ring-2 ring-orange-400': conflictSchedules.length > 0 }">
        <p class="text-sm text-gray-500 mb-1">冲突场次</p>
        <p class="text-2xl font-bold text-orange-600">{{ conflictSchedules.length }}</p>
      </div>
    </div>

    <div class="card">
      <div class="p-4 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <div class="flex gap-2 overflow-x-auto">
            <button
              v-for="date in dates"
              :key="date.value"
              @click="selectedDate = date.value"
              class="px-4 py-2 rounded-lg text-center transition-colors min-w-20 shrink-0"
              :class="selectedDate === date.value ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'"
            >
              <p class="text-xs font-medium">{{ date.weekday }}</p>
              <p class="text-sm font-semibold">{{ date.label }}</p>
            </button>
          </div>
          
          <div class="flex items-center gap-3">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索讲解..."
                class="w-56 h-9 pl-10 pr-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4">
        <div v-if="filteredSchedules.length > 0" class="grid grid-cols-2 gap-4">
          <div
            v-for="schedule in filteredSchedules"
            :key="schedule.id"
            @click="openScheduleDetail(schedule)"
            class="p-5 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
            :class="{
              'border-orange-300 bg-orange-50': schedule.conflictInfo || schedule.status === 'conflict'
            }"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="text-base font-semibold text-gray-900">{{ schedule.title }}</h4>
                <p class="text-sm text-gray-500 mt-1">{{ schedule.guideName }} · {{ schedule.location }}</p>
              </div>
              <span class="badge" :class="statusColors[schedule.status]">{{ statusLabels[schedule.status] }}</span>
            </div>
            
            <div class="flex items-center gap-4 mb-3 text-sm text-gray-600">
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ schedule.startTime }} - {{ schedule.endTime }}
              </span>
            </div>
            
            <p v-if="schedule.conflictInfo" class="text-sm text-orange-600 mb-3 bg-orange-50 p-2 rounded">
              ⚠️ {{ schedule.conflictInfo }}
            </p>
            
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ schedule.description }}</p>
            
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>预约进度</span>
                  <span>{{ schedule.currentVisitors }}/{{ schedule.maxVisitors }}人</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="schedule.currentVisitors >= schedule.maxVisitors ? 'bg-yellow-500' : 'bg-primary-500'"
                    :style="{ width: (schedule.currentVisitors / schedule.maxVisitors * 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-gray-100">
              <template v-if="getScheduleFeedback(schedule.id)">
                <div class="bg-white border border-gray-200 rounded-md p-2 space-y-1">
                  <div class="flex items-center gap-2">
                    <span 
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-white"
                      :class="getFeedbackSummary(getScheduleFeedback(schedule.id))?.statusColor"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-white/80"></span>
                      {{ getFeedbackSummary(getScheduleFeedback(schedule.id))?.statusLabel }}
                    </span>
                    <span class="text-xs text-gray-600">
                      {{ getFeedbackSummary(getScheduleFeedback(schedule.id))?.currentRoleLabel }} · {{ getFeedbackSummary(getScheduleFeedback(schedule.id))?.currentAssignee }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500">
                    最近处理: {{ getFeedbackSummary(getScheduleFeedback(schedule.id))?.lastAt }}
                  </div>
                  <div v-if="getFeedbackSummary(getScheduleFeedback(schedule.id))?.lastRemark" 
                       class="text-xs text-gray-600 line-clamp-1">
                    备注: {{ getFeedbackSummary(getScheduleFeedback(schedule.id))?.lastRemark }}
                  </div>
                  <button
                    @click.stop="viewRelatedFeedback(schedule.id)"
                    class="text-xs text-primary-600 hover:text-primary-700 underline mt-1"
                  >
                    查看详情 →
                  </button>
                </div>
              </template>
              <template v-else>
                <button
                  @click.stop="createFeedbackForSchedule(schedule)"
                  class="text-xs text-primary-600 hover:text-primary-700"
                >
                  + 创建反馈
                </button>
              </template>
            </div>
          </div>
        </div>
        
        <div v-else class="p-12 text-center">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="text-gray-500 text-sm">当日暂无讲解安排</p>
        </div>
      </div>
    </div>

    <div
      class="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-xl z-40 transform transition-transform duration-300"
      :class="showDetailSidebar ? 'translate-x-0' : 'translate-x-full'"
    >
      <div v-if="selectedSchedule" class="flex flex-col h-full">
        <div class="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-900">场次详情</h3>
          <button @click="closeScheduleDetail" class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <h4 class="text-base font-medium text-gray-900">{{ selectedSchedule.title }}</h4>
              <span class="badge" :class="statusColors[selectedSchedule.status]">{{ statusLabels[selectedSchedule.status] }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ selectedSchedule.guideName }} · {{ selectedSchedule.location }}</p>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">日期</span>
              <span class="text-gray-900 font-medium">{{ selectedSchedule.date }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">时间</span>
              <span class="text-gray-900 font-medium">{{ selectedSchedule.startTime }} - {{ selectedSchedule.endTime }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">预约人数</span>
              <span class="text-gray-900 font-medium">{{ selectedSchedule.currentVisitors }}/{{ selectedSchedule.maxVisitors }}人</span>
            </div>
          </div>

          <div v-if="selectedSchedule.conflictInfo">
            <h5 class="text-sm font-medium text-orange-700 mb-2">冲突提示</h5>
            <div class="p-3 bg-orange-50 rounded-lg">
              <p class="text-sm text-orange-700">{{ selectedSchedule.conflictInfo }}</p>
            </div>
          </div>

          <div>
            <h5 class="text-sm font-medium text-gray-700 mb-2">场次描述</h5>
            <p class="text-sm text-gray-600">{{ selectedSchedule.description }}</p>
          </div>

          <div v-if="getScheduleFeedback(selectedSchedule.id)" class="space-y-3">
            <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
              </svg>
              关联反馈处理进展
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-gray-900 line-clamp-1">
                  {{ getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.title }}
                </div>
                <span 
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap shrink-0 ml-2"
                  :class="getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.statusColor"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-white/80"></span>
                  {{ getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.statusLabel }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="text-gray-500">处理角色</div>
                <div class="text-gray-900">{{ getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.currentRoleLabel }} · {{ getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.currentAssignee }}</div>
                <div class="text-gray-500">最近更新</div>
                <div class="text-gray-900">{{ getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.lastAt }}</div>
                <div v-if="getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.progress > 0" class="text-gray-500">处理进度</div>
                <div v-if="getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.progress > 0" class="text-gray-900">{{ getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.progress }}%</div>
              </div>
              <div v-if="getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.lastRemark" class="pt-2 border-t border-gray-100">
                <div class="text-xs text-gray-500 mb-1">最新备注</div>
                <div class="text-xs text-gray-700 bg-gray-50 rounded p-2">
                  {{ getFeedbackSummary(getScheduleFeedback(selectedSchedule.id))?.lastRemark }}
                </div>
              </div>
              <button
                @click="viewRelatedFeedback(selectedSchedule.id)"
                class="btn btn-outline w-full text-sm py-2"
              >
                打开反馈详情
              </button>
            </div>
          </div>
          <div v-else class="space-y-2">
            <div class="text-sm text-gray-500">暂无关联反馈</div>
            <button
              @click="createFeedbackForSchedule(selectedSchedule)"
              class="btn btn-primary w-full text-sm"
            >
              + 创建反馈并流转处理
            </button>
          </div>
        </div>

        <div class="p-4 border-t border-gray-100 space-y-2">
          <button
            v-if="getScheduleFeedback(selectedSchedule.id)"
            @click="viewRelatedFeedback(selectedSchedule.id)"
            class="btn btn-primary w-full"
          >
            查看关联反馈
          </button>
          <button
            v-else
            @click="createFeedbackForSchedule(selectedSchedule)"
            class="btn btn-primary w-full"
          >
            创建反馈并流转处理
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
