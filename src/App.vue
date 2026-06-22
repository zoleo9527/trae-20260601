<script setup lang="ts">
import { onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import Layout from '@/components/Layout.vue'

const store = useDataStore()

onMounted(() => {
  store.loadData()
})
</script>

<template>
  <Layout v-if="store.isLoaded" />
  <div v-else class="loading-container">
    <div class="loading-spinner"></div>
    <div class="loading-text">加载中...</div>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e8e8e8;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #8c8c8c;
  font-size: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
