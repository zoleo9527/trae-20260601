<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Star, Clock, MessageSquare, ChevronRight, Filter } from 'lucide-vue-next'
import { useFeedbacks } from '@/composables/useApi'
import type { Feedback } from '@/types'

const router = useRouter()
const { getFeedbacks } = useFeedbacks()

const feedbacks = ref<Feedback[]>([])
const loading = ref(true)
const searchQuery = ref('')
const activeTab = ref('all')
const minRating = ref<number | null>(null)

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待填写' },
  { key: 'completed', label: '已完成' },
]

const filteredFeedbacks = computed(() => {
  let result = feedbacks.value

  if (activeTab.value === 'pending') {
    result = result.filter((f) => f.status === 'pending')
  } else if (activeTab.value === 'completed') {
    result = result.filter((f) => f.status === 'completed')
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (f) =>
        f.event_name?.toLowerCase().includes(q) ||
        f.client_name?.toLowerCase().includes(q)
    )
  }

  if (minRating.value !== null) {
    result = result.filter((f) => {
      if (!f.sections) return false
      const avgRating = f.sections
        .filter((s) => s.rating !== null)
        .reduce((sum, s) => sum + (s.rating || 0), 0) / f.sections.filter((s) => s.rating !== null).length
      return avgRating >= minRating.value!
    })
  }

  return result
})

function getAverageRating(feedback: Feedback) {
  if (!feedback.sections) return null
  const ratedSections = feedback.sections.filter((s) => s.rating !== null)
  if (ratedSections.length === 0) return null
  return ratedSections.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSections.length
}

function getFilledCount(feedback: Feedback) {
  if (!feedback.sections) return { filled: 0, total: 0 }
  return {
    filled: feedback.sections.filter((s) => s.filled_by !== '').length,
    total: feedback.sections.length,
  }
}

function getStatusLabel(feedback: Feedback) {
  if (feedback.status === 'completed') {
    return { text: '已完成', class: 'bg-emerald-100 text-emerald-700' }
  }
  const { filled, total } = getFilledCount(feedback)
  if (filled === 0) return { text: '待填写', class: 'bg-slate-100 text-slate-600' }
  return { text: `填写中 ${filled}/${total}`, class: 'bg-amber-100 text-amber-700' }
}

function getDeadlineStatus(feedback: Feedback) {
  if (!feedback.sections) return null
  const deadlines = feedback.sections
    .filter((s) => !s.filled_at)
    .map((s) => new Date(s.deadline).getTime())
  if (deadlines.length === 0) return null

  const now = Date.now()
  const nearest = Math.min(...deadlines)
  const remainingHours = (nearest - now) / (1000 * 60 * 60)

  if (remainingHours < 0) return { text: `已超时 ${Math.abs(remainingHours).toFixed(1)} 小时`, class: 'text-red-600' }
  if (remainingHours < 12) return { text: `剩余 ${remainingHours.toFixed(1)} 小时`, class: 'text-amber-600' }
  return { text: `剩余 ${remainingHours.toFixed(1)} 小时`, class: 'text-emerald-600' }
}

function renderStars(rating: number | null) {
  if (rating === null) return null
  const fullStars = Math.floor(rating)
  return Array.from({ length: 5 }, (_, i) => i < fullStars)
}

async function loadData() {
  loading.value = true
  try {
    const res = await getFeedbacks()
    if (res.success) {
      feedbacks.value = res.data
    }
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-slate-800 mb-1">客户反馈</h2>
      <p class="text-slate-500">尾款核对完成后自动激活，按角色分工收集客户反馈</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
      <div class="p-6 border-b border-slate-100">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              :class="activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <Filter class="w-4 h-4 text-slate-400" />
              <select
                v-model="minRating"
                class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
              >
                <option :value="null">全部评分</option>
                <option :value="5">5星</option>
                <option :value="4">4星及以上</option>
                <option :value="3">3星及以上</option>
              </select>
            </div>
            <div class="relative">
              <Search class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索活动名称、客户名..."
                class="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-72 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div v-if="loading" class="text-center py-16 text-slate-500">
          加载中...
        </div>
        <div v-else-if="filteredFeedbacks.length === 0" class="text-center py-16">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare class="w-8 h-8 text-slate-400" />
          </div>
          <p class="text-slate-600 font-medium">暂无反馈记录</p>
          <p class="text-slate-400 text-sm mt-1">尾款核对完成后将自动激活反馈收集</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="feedback in filteredFeedbacks"
            :key="feedback.id"
            class="border border-slate-200 rounded-xl p-5 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
            @click="router.push(`/feedbacks/${feedback.id}`)"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="text-slate-800 font-semibold">{{ feedback.event_name }}</h4>
                <p class="text-slate-500 text-sm mt-0.5">
                  {{ feedback.client_name }} · {{ formatDate(feedback.event_date!) }}
                </p>
              </div>
              <span :class="['px-3 py-1 rounded-full text-xs font-medium', getStatusLabel(feedback).class]">
                {{ getStatusLabel(feedback).text }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <template v-if="getAverageRating(feedback) !== null">
                  <div class="flex items-center gap-0.5">
                    <Star
                      v-for="(filled, i) in renderStars(getAverageRating(feedback))"
                      :key="i"
                      class="w-4 h-4"
                      :class="filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200'"
                    />
                  </div>
                  <span class="text-slate-700 font-medium text-sm">
                    {{ getAverageRating(feedback)?.toFixed(1) }}
                  </span>
                </template>
                <span v-else class="text-slate-400 text-sm">暂无评分</span>
              </div>
              <div class="flex items-center gap-3">
                <div v-if="feedback.status === 'pending'" class="flex items-center gap-1 text-sm">
                  <Clock class="w-4 h-4" :class="getDeadlineStatus(feedback)?.class" />
                  <span :class="getDeadlineStatus(feedback)?.class">
                    {{ getDeadlineStatus(feedback)?.text }}
                  </span>
                </div>
                <ChevronRight class="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
