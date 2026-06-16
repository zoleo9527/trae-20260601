<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'
import { ref, computed } from 'vue'

const store = useInspectionStore()

const searchQuery = ref('')
const platformFilter = ref('all')

const platforms = computed(() => {
  const uniquePlatforms = new Set(store.badReviews.map(r => r.platform))
  return Array.from(uniquePlatforms)
})

const filteredReviews = computed(() => {
  return store.badReviews.filter(review => {
    const matchesSearch = !searchQuery.value || 
      review.storeName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesPlatform = platformFilter.value === 'all' || review.platform === platformFilter.value
    
    return matchesSearch && matchesPlatform
  })
})

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showResponseModal = ref<string | null>(null)
const responseContent = ref('')

const handleRespond = (id: string) => {
  if (!responseContent.value.trim()) return
  store.respondToReview(id, responseContent.value)
  const review = store.badReviews.find(r => r.id === id)
  if (review) {
    const relatedWarning = store.warnings.find(w => w.type === 'bad_review' && w.storeId === review.storeId)
    if (relatedWarning) {
      store.handleWarning(relatedWarning.id, `已回复差评: ${responseContent.value.slice(0, 20)}...`)
    }
  }
  showResponseModal.value = null
  responseContent.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              @click="navigateTo('/')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">外卖差评</h1>
              <p class="text-sm text-gray-500">外卖平台差评管理</p>
            </div>
          </div>
          <a href="/" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            返回首页
          </a>
        </div>
      </div>
    </header>

    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-1">
          <a href="/" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">首页</a>
          <a href="/inspections" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">巡店检查</a>
          <a href="/rectification" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">整改复盘</a>
          <a href="/workspace" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">工作台</a>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex-1">
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索门店名称、差评内容..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <select
              v-model="platformFilter"
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">全部平台</option>
              <option v-for="platform in platforms" :key="platform" :value="platform">{{ platform }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="review in filteredReviews"
          :key="review.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div class="p-6">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-3">
                <span class="font-medium text-gray-900">{{ review.storeName }}</span>
                <span class="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{{ review.platform }}</span>
              </div>
              <div class="flex items-center space-x-0.5">
                <span v-for="i in 5" :key="i" class="text-sm">
                  {{ i <= review.rating ? '⭐' : '☆' }}
                </span>
              </div>
            </div>
            
            <p class="text-gray-600 mb-4">{{ review.content }}</p>
            
            <div v-if="review.response" class="p-3 bg-success-50 rounded-lg mb-3">
              <div class="flex items-start space-x-2">
                <span class="text-success-600">💬</span>
                <div>
                  <p class="text-sm text-success-700">{{ review.response }}</p>
                  <p class="text-xs text-success-500 mt-1">{{ formatTime(review.respondedAt!) }}</p>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400">{{ formatTime(review.createdAt) }}</span>
              <button
                v-if="!review.response"
                @click="showResponseModal = review.id"
                class="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                回复
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredReviews.length === 0" class="text-center py-12">
        <span class="text-4xl">📝</span>
        <p class="mt-4 text-gray-500">没有找到差评记录</p>
      </div>
    </main>

    <Teleport to="body">
      <div
        v-if="showResponseModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showResponseModal = null"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">回复差评</h3>
          </div>
          <div class="px-6 py-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">回复内容</label>
              <textarea
                v-model="responseContent"
                rows="4"
                placeholder="请输入回复内容..."
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              @click="showResponseModal = null"
              class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="handleRespond(showResponseModal)"
              :disabled="!responseContent.trim()"
              class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送回复
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
