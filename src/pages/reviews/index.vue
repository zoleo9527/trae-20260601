<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Review } from '@/types'
import { useReviewsStore } from '@/stores/reviews'
import ReviewCard from '@/components/ReviewCard.vue'
import FilterBar from '@/components/FilterBar.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'

const store = useReviewsStore()

const statusFilter = ref('')
const categoryFilter = ref('')
const dateFilter = ref('')

const selectedReview = ref<Review | null>(null)
const showDrawer = ref(false)

const filteredReviews = computed(() => {
  let result = [...store.reviews.value]
  
  if (statusFilter.value) {
    result = result.filter(r => r.status === statusFilter.value)
  }
  
  if (categoryFilter.value) {
    result = result.filter(r => r.category === categoryFilter.value)
  }
  
  if (dateFilter.value) {
    const now = new Date()
    result = result.filter(r => {
      const reviewDate = new Date(r.createdAt.replace(/-/g, '/'))
      const diffTime = now.getTime() - reviewDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      switch (dateFilter.value) {
        case 'today':
          return diffDays === 0
        case 'week':
          return diffDays < 7
        case 'month':
          return diffDays < 30
        default:
          return true
      }
    })
  }
  
  result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  
  return result
})

const handleReviewClick = (review: Review) => {
  selectedReview.value = review
  showDrawer.value = true
}

const closeDrawer = () => {
  showDrawer.value = false
  selectedReview.value = null
}

const stats = computed(() => ({
  total: store.reviews.value.length,
  pending: store.pendingReviews.value.length,
  reviewed: store.reviewedReviews.value.length,
  resolved: store.resolvedReviews.value.length
}))
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">差评回访与补偿处理</h1>
            <p class="text-sm text-gray-500">家政服务公司客户评价管理系统</p>
          </div>
          <nav class="flex items-center gap-4">
            <a href="/reviews" class="px-4 py-2 bg-blue-500 text-white rounded">差评列表</a>
            <a href="/compensations" class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">补偿处理</a>
          </nav>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow-md p-4 text-center">
          <div class="text-2xl font-semibold text-gray-900">{{ stats.total }}</div>
          <div class="text-sm text-gray-500">总差评数</div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-4 text-center">
          <div class="text-2xl font-semibold text-yellow-600">{{ stats.pending }}</div>
          <div class="text-sm text-gray-500">待处理</div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-4 text-center">
          <div class="text-2xl font-semibold text-blue-600">{{ stats.reviewed }}</div>
          <div class="text-sm text-gray-500">已回访</div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-4 text-center">
          <div class="text-2xl font-semibold text-green-600">{{ stats.resolved }}</div>
          <div class="text-sm text-gray-500">已解决</div>
        </div>
      </div>
      
      <FilterBar 
        :status-filter="statusFilter"
        :category-filter="categoryFilter"
        :date-filter="dateFilter"
        @update:status-filter="statusFilter = $event"
        @update:category-filter="categoryFilter = $event"
        @update:date-filter="dateFilter = $event"
      />
      
      <div class="space-y-4">
        <ReviewCard 
          v-for="review in filteredReviews" 
          :key="review.id" 
          :review="review"
          @handle="handleReviewClick"
        />
      </div>
      
      <div v-if="filteredReviews.length === 0" class="text-center py-12 text-gray-500">
        暂无符合条件的差评记录
      </div>
    </main>
    
    <ExceptionDrawer 
      v-if="selectedReview"
      :review="selectedReview"
      :visible="showDrawer"
      @close="closeDrawer"
    />
  </div>
</template>
