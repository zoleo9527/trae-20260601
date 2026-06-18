<script setup lang="ts">
import { useFeedback } from '~/composables/useFeedback'

const { selectedFeedback, showDetailSidebar, showTransferModal } = useFeedback()

const route = useRoute()

const pageTitles: Record<string, string> = {
  '/': '工作面',
  '/feedback': '观众反馈处理',
  '/inspection': '展项巡检',
  '/schedule': '讲解预约',
  '/materials': '实验材料'
}

const currentTitle = computed(() => pageTitles[route.path] || '科技馆展教管理系统')
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar />
    <div class="ml-60">
      <Header :title="currentTitle" />
      <main class="p-6">
        <slot />
      </main>
    </div>
    <FeedbackDetail v-if="showDetailSidebar" :feedback="selectedFeedback" />
    <TransferModal v-if="showTransferModal" />
  </div>
</template>
