<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Star, Clock, Users, UtensilsCrossed, ChefHat, CheckCircle, Loader2 } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useFeedbacks, useTimeline } from '@/composables/useApi'
import EventTimeline from '@/components/EventTimeline.vue'
import type { Feedback, FeedbackSection, TimelineEntry } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { getFeedback, updateSection } = useFeedbacks()
const { getTimeline } = useTimeline()

const feedback = ref<Feedback | null>(null)
const timelineEntries = ref<TimelineEntry[]>([])
const loading = ref(true)
const submitting = ref(false)
const activeRole = ref<string>('')
const countdown = ref<{ hours: number; minutes: number; seconds: number } | null>(null)
const countdownInterval = ref<number | null>(null)

const roleConfig: Record<string, { icon: any; label: string; title: string; placeholder: string }> = {
  sales: {
    icon: Users,
    label: '销售',
    title: '整体评价',
    placeholder: '请填写客户对整体安排的评价...',
  },
  hall: {
    icon: UtensilsCrossed,
    label: '厅面',
    title: '服务评价',
    placeholder: '请填写客户对现场服务的评价...',
  },
  kitchen: {
    icon: ChefHat,
    label: '后厨',
    title: '出品评价',
    placeholder: '请填写客户对菜品出品的评价...',
  },
}

const mySection = computed(() => {
  if (!feedback.value?.sections || !userStore.user) return null
  return feedback.value.sections.find((s) => s.role === userStore.user!.role)
})

const localContent = ref('')
const localRating = ref<number>(0)

const canEditCurrentRole = computed(() => {
  if (!userStore.user || !feedback.value) return false
  if (feedback.value.status === 'completed') return false
  return activeRole.value === userStore.user.role
})

const allSectionsFilled = computed(() => {
  if (!feedback.value?.sections) return false
  return feedback.value.sections.every((s) => s.filled_by !== '')
})

function getSection(role: string): FeedbackSection | undefined {
  return feedback.value?.sections?.find((s) => s.role === role)
}

function isSectionFilled(role: string) {
  const section = getSection(role)
  return section?.filled_by !== ''
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}

function setRating(rating: number) {
  if (!canEditCurrentRole.value) return
  localRating.value = rating
}

async function handleSave() {
  if (!feedback.value || !userStore.user || !mySection.value || submitting.value) return
  if (localRating.value === 0) {
    alert('请选择评分')
    return
  }
  if (!localContent.value.trim()) {
    alert('请填写评价内容')
    return
  }

  submitting.value = true
  try {
    const res = await updateSection(feedback.value.id, userStore.user.role, {
      content: localContent.value.trim(),
      rating: localRating.value,
      filledBy: userStore.user.name,
    })
    if (res.success) {
      await loadData()
    }
  } finally {
    submitting.value = false
  }
}

function updateCountdown() {
  if (!mySection.value || mySection.value.filled_at) {
    countdown.value = null
    return
  }
  const deadline = new Date(mySection.value.deadline).getTime()
  const now = Date.now()
  const diff = deadline - now

  if (diff <= 0) {
    countdown.value = { hours: 0, minutes: 0, seconds: 0 }
    return
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  countdown.value = { hours, minutes, seconds }
}

async function loadData() {
  loading.value = true
  try {
    const id = route.params.id as string
    const [fbRes, tlRes] = await Promise.all([
      getFeedback(id),
      getTimeline(id),
    ])
    if (fbRes.success) {
      feedback.value = fbRes.data
      if (userStore.user) {
        activeRole.value = userStore.user.role
      } else {
        activeRole.value = feedback.value.sections?.[0]?.role || 'sales'
      }
      const section = getSection(activeRole.value)
      if (section) {
        localContent.value = section.content || ''
        localRating.value = section.rating || 0
      }
    }
    if (tlRes.success) {
      timelineEntries.value = tlRes.data
    }
    updateCountdown()
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  loadData()
  countdownInterval.value = window.setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
})
</script>

<template>
  <div>
    <button
      @click="router.push('/feedbacks')"
      class="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
    >
      <ArrowLeft class="w-5 h-5" />
      返回反馈列表
    </button>

    <div v-if="loading" class="text-center py-16 text-slate-500">
      加载中...
    </div>

    <div v-else-if="!feedback" class="text-center py-16 text-slate-500">
      未找到反馈记录
    </div>

    <div v-else>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div class="p-6 border-b border-slate-100">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-2xl font-semibold text-slate-800 mb-1">
                {{ feedback.event_name }}
              </h2>
              <p class="text-slate-500">
                {{ feedback.client_name }} · {{ formatDate(feedback.event_date!) }} · {{ feedback.venue }}
              </p>
            </div>
            <span
              :class="[
                'px-4 py-2 rounded-full text-sm font-medium',
                allSectionsFilled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700',
              ]"
            >
              {{ allSectionsFilled ? '反馈已完成' : '反馈收集中' }}
            </span>
          </div>
        </div>

        <div class="border-b border-slate-100">
          <div class="flex">
            <button
              v-for="(config, role) in roleConfig"
              :key="role"
              @click="activeRole = role"
              class="flex-1 py-4 px-6 text-center border-b-2 transition-all"
              :class="activeRole === role
                ? 'border-amber-500 bg-amber-50'
                : 'border-transparent hover:bg-slate-50'"
            >
              <div class="flex items-center justify-center gap-2">
                <component :is="config.icon" class="w-5 h-5" />
                <span class="font-medium text-slate-700">{{ config.title }}</span>
                <CheckCircle
                  v-if="isSectionFilled(role as string)"
                  class="w-4 h-4 text-emerald-500"
                />
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ config.label }}负责</p>
            </button>
          </div>
        </div>

        <div class="p-6">
          <div
            v-if="mySection && activeRole === userStore.user?.role && !mySection.filled_at && countdown"
            class="mb-6 p-4 rounded-xl flex items-center justify-between"
            :class="countdown.hours < 12 && countdown.hours > 0 ? 'bg-amber-50 border border-amber-200' : countdown.hours === 0 && countdown.minutes === 0 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'"
          >
            <div class="flex items-center gap-3">
              <Clock class="w-5 h-5" :class="countdown.hours < 12 && countdown.hours > 0 ? 'text-amber-600' : countdown.hours === 0 && countdown.minutes === 0 ? 'text-red-600' : 'text-blue-600'" />
              <div>
                <p class="font-medium" :class="countdown.hours < 12 && countdown.hours > 0 ? 'text-amber-800' : countdown.hours === 0 && countdown.minutes === 0 ? 'text-red-800' : 'text-blue-800'">
                  填写时效倒计时
                </p>
                <p class="text-sm" :class="countdown.hours < 12 && countdown.hours > 0 ? 'text-amber-600' : countdown.hours === 0 && countdown.minutes === 0 ? 'text-red-600' : 'text-blue-600'">
                  尾款核对完成后需在48小时内完成反馈
                </p>
              </div>
            </div>
            <div
              class="text-3xl font-mono font-bold"
              :class="countdown.hours < 12 && countdown.hours > 0 ? 'text-amber-600' : countdown.hours === 0 && countdown.minutes === 0 ? 'text-red-600' : 'text-blue-600'"
            >
              {{ String(countdown.hours).padStart(2, '0') }}:{{ String(countdown.minutes).padStart(2, '0') }}:{{ String(countdown.seconds).padStart(2, '0') }}
            </div>
          </div>

          <div v-if="getSection(activeRole)">
            <div v-if="isSectionFilled(activeRole)" class="space-y-6">
              <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div
                  class="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center"
                >
                  <component :is="roleConfig[activeRole].icon" class="w-6 h-6 text-white" />
                </div>
                <div>
                  <p class="text-slate-800 font-medium">
                    由 {{ getSection(activeRole)?.filled_by }} 填写
                  </p>
                  <p class="text-slate-500 text-sm">
                    {{ formatDateTime(getSection(activeRole)?.filled_at || null) }}
                  </p>
                </div>
              </div>

              <div>
                <label class="block text-slate-700 font-medium mb-3">评分</label>
                <div class="flex items-center gap-2">
                  <Star
                    v-for="(filled, i) in renderStars(getSection(activeRole)?.rating || 0)"
                    :key="i"
                    class="w-8 h-8"
                    :class="filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200'"
                  />
                  <span class="text-2xl font-bold text-slate-700 ml-2">
                    {{ getSection(activeRole)?.rating }}.0
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-slate-700 font-medium mb-3">评价内容</label>
                <div class="p-4 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
                  {{ getSection(activeRole)?.content }}
                </div>
              </div>

              <div
                v-if="canEditCurrentRole"
                class="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm"
              >
                您已完成此部分反馈，如需修改请联系管理员。
              </div>
            </div>

            <div v-else class="space-y-6">
              <div v-if="!canEditCurrentRole" class="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p class="text-amber-800 font-medium">此部分需由{{ roleConfig[activeRole].label }}负责填写</p>
                <p class="text-amber-600 text-sm mt-1">请切换到相应角色后再填写</p>
              </div>

              <div v-else>
                <label class="block text-slate-700 font-medium mb-3">评分</label>
                <div class="flex items-center gap-2">
                  <button
                    v-for="(filled, i) in renderStars(5)"
                    :key="i"
                    @click="setRating(i + 1)"
                    class="hover:scale-110 transition-transform"
                  >
                    <Star
                      class="w-10 h-10"
                      :class="i < localRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 hover:text-amber-300'"
                    />
                  </button>
                  <span v-if="localRating > 0" class="text-2xl font-bold text-slate-700 ml-2">
                    {{ localRating }}.0
                  </span>
                </div>
              </div>

              <div v-if="canEditCurrentRole">
                <label class="block text-slate-700 font-medium mb-3">
                  {{ roleConfig[activeRole].title }}
                </label>
                <textarea
                  v-model="localContent"
                  :placeholder="roleConfig[activeRole].placeholder"
                  rows="6"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
                ></textarea>
              </div>

              <button
                v-if="canEditCurrentRole"
                @click="handleSave"
                :disabled="submitting || localRating === 0 || !localContent.trim()"
                class="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                <Loader2 v-if="submitting" class="w-5 h-5 animate-spin" />
                {{ submitting ? '提交中...' : '保存反馈' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div class="p-6 border-b border-slate-100">
          <h3 class="text-lg font-semibold text-slate-800">处理时间线</h3>
        </div>
        <div class="p-6">
          <EventTimeline :entries="timelineEntries" />
        </div>
      </div>
    </div>
  </div>
</template>
